# Amadeus 平台适配器规范

状态：`contractVersion: 1`，仅接受模拟适配器。本文是当前实现契约与未来真实适配器的准入要求，不表示 Bilibili/Xiaohongshu 已上线或已做真实请求。
实现依据：`src/platforms/registry.js`、`src/core/activity.js`、`src/core/experiences.js`、`src/core/runtime.js`、`tests/platforms.test.js`。

## 1. 范围与硬性边界

- 注册器允许 read/search/browse/comments/related/subtitles/images 读取，以及 like/favorite/comment/reply/follow/message/publish 模拟社交操作。社交权限默认空，最后执行层仅 Dry-run；真实登录与外发不可用。
- 注册是可信进程内代码的行为，不是 HTTP 路由或模型工具；当前不提供远程注册、动态插件或模型可写的权限配置。
- 当前注册要求 `simulated === true`。仓库只有 `simulation-bilibili`、`simulation-xiaohongshu`，fixture 是合成的 `robot-demo`，没有真实网络请求或账号。
- 注册器用 `simulated` 布尔值做准入，并未在运行时实施网络沙箱。真实适配器必须经过单独的鉴权、网络与证据审查，严禁把真实适配器标成 `simulated: true`。

## 2. 适配器接口

```js
{
  id: 'lowercase-id',          // ^[a-z][a-z0-9-]{0,63}$
  contractVersion: 1,          // 必须精确等于 1
  simulated: true,             // 当前唯一可注册类型
  capabilities: ['read'],      // 必须为 PLATFORM_READS / PLATFORM_SOCIAL 的子集
  async execute(operation, input) { ... }
}
```

- `execute()` 必须返回可 JSON 序列化的值；不得返回函数、循环结构或超限内容。
- 输入在调用前 `structuredClone`，适配器不能借此修改 Core 状态；输出会被再次 JSON 化以计算大小。
- 适配器只应读取自己的 fixture 或只读数据源，不得接收 Workspace/Session/权限参数，也不得自行调用 Memory、Experience 或平台发送接口。
- 模拟适配器遇到未知操作抛 `CORE_PLATFORM_UNSUPPORTED`；`read` 未命中返回 `null`，`search` 最多返回 10 条，`browse` 最多 10 条。

## 3. 注册、启用与权限

- `PlatformRegistry.register(adapter)` 校验 ID 格式、`contractVersion`、`simulated`、`execute` 函数和 capability 白名单；重复 ID 抛 `CORE_PLATFORM_DUPLICATE`，原条目不被替换。
- 注册默认 `enabled: false`、`permissions: []`、`maxRequests: 20`、`used: 0`，不会自动启用。
- `configure(id, { enabled, permissions, maxRequests })` 的约束：
  - `enabled` 必须是布尔值；`permissions` 必须去重且是 `capabilities` 的子集；
  - `maxRequests` 必须是 1 到 1000 的安全整数，缺省 20；
  - 每次配置 `generation` 递增；重新配置不清零 `used`。
- 注册返回值是撤销函数：立即置 `enabled = false`、递增 `generation` 并删除条目；已在进行中的执行会在返回时被拒。

## 4. 请求预算与串行执行

- 每次执行前要求 `enabled === true`、操作属于只读集合、操作在 `permissions` 中、且 `used < maxRequests`，否则依次抛 `CORE_PLATFORM_DENIED` 或 `CORE_PLATFORM_BUDGET`。
- 通过检查后先 `used++`，再调用适配器。预算在适配器抛错、结果为空或执行被撤销时同样消耗，不会回滚。
- 同一适配器的执行通过 `tail` 链串行化，因此并发调用不会突破 `maxRequests`；并发结果按调用顺序完成。
- `maxRequests` 是同一条目在当前 Registry 实例生命周期内的总预算，不是每轮/每日配额；重新启用或重新配置都不会重置。
- 预算和启用状态目前没有写入 `CoreStore`，进程重启后重置。这是当前 alpha 的已知限制，不应被当作持久配额系统。

## 5. 执行输入与可信信封

`execute(id, operation, input, identity)` 的 `identity` 必须由 Core 的可信调用方提供，包含非空字符串：

```js
{ activityId, workspaceId, sessionId }
```

Registry 只校验这三个字段的存在与类型，不自行查询 Session ACL；`CoreActivity` 在每一步之前通过 `member()`，再传入当前 Workspace 的 Activity/Session。模型和 HTTP 不能直接调用 Registry。

适配器返回后，Registry 重新检查 `enabled`、`generation` 和当前权限；任一项变化即抛 `CORE_PLATFORM_REVOKED`，不返回适配器结果。

成功结果由 Core 重建可信信封，适配器返回的同名字段不能覆盖：

```js
{
  eventId: '<random UUID>',       // 每次执行新生成
  platform: '<registered id>',
  accountId: null,                // 当前模拟适配器没有账号
  activityId, sessionId, workspaceId, // 来自可信 identity
  evidenceLevel: 'simulation',   // 恒为模拟
  observedEvidence: <adapter 输出>,
  occurredAt: '<ISO 时间>',
  externalAction: false          // 永远不声称发生真实动作
}
```

- 结果 JSON 序列化后上限 64 KiB，超限抛 `CORE_PLATFORM_RESULT_LIMIT`。
- `observedEvidence` 恰为适配器输出（经 JSON 克隆），属于不可信观察，不是解释或行动回执；不得把其中的伪造身份、`evidenceLevel` 或 `externalAction` 提升为可信字段。
- 模拟结果永远不表示真实浏览、搜索或账号行为；真实适配器未来必须使用独立证据等级并保留同样的可信信封重建规则。

## 6. 与 Activity、Experience 的衔接

- `CoreActivity.explore(decide, { maxSteps, maxDurationMs })` 默认 6 步/30 秒，硬上限 20 步/60 秒；每一步先 `member()`，再 `platforms.execute()`，再 `experiences.record()`，最后 Life checkpoint。
- `decide()` 返回 `{ platform, operation, input }` 或 `null`；执行前不能由模型传入 Session/Workspace。取消或超时抛 `CORE_ACTIVITY_STOPPED`，活动转为 Paused，不自动重试未知回执。
- Experience 记录以 `[workspaceId, sessionId, activityId, platform, step]` 生成幂等 ID；observation 上限 64 KiB；写入 Memory 前固定 `evidenceLevel: 'simulation'`、`actionReceipt.externalAction: false`。
- Experience 读取走 v1 Host API 或 `amadeus_experience_read` 工具，读取时重新验证 Session 与 Memory ACL；平台适配器不能自行读取或改写 Experience。
- Core 不提供任何发送/回写平台的方法；`externalAction` 恒为 false，Activity 也没有真实平台登录或出站队列。

## 7. 错误码与处理

| 错误 | 含义 |
| --- | --- |
| `CORE_PLATFORM_INVALID` | 适配器形状、ID、契约版本、模拟标志或 capability 不合法 |
| `CORE_PLATFORM_DUPLICATE` | 同一 ID 重复注册 |
| `CORE_PLATFORM_CONFIG` | enabled/permissions/maxRequests 配置不合法 |
| `CORE_PLATFORM_UNAVAILABLE` | ID 未注册或已被撤销 |
| `CORE_PLATFORM_IDENTITY` | 缺少 activityId/workspaceId/sessionId |
| `CORE_PLATFORM_DENIED` | 未启用、操作非只读或未被授予 |
| `CORE_PLATFORM_BUDGET` | 已用请求数达到上限 |
| `CORE_PLATFORM_REVOKED` | 执行期间条目被删除/禁用/改权限 |
| `CORE_PLATFORM_RESULT_LIMIT` | 结果序列化超过 64 KiB |
| `CORE_PLATFORM_FIXTURES` | 模拟 fixture 不是数组 |
| `CORE_PLATFORM_UNSUPPORTED` | 适配器不支持该只读操作 |

调用方不得把上述拒绝静默降级为“成功”或空观察；`CORE_PLATFORM_REVOKED`/预算耗尽必须中止当前探索并保留已写 checkpoint。

## 8. 模拟适配器与当前平台状态

- `makeSimulatedAdapter(id, records)` 冻结 fixture，提供 `browse/search/read`，三者的结果都来自本地合成记录。
- `CoreRuntime` 构造时注册两个模拟 ID；`overview().simulations` 列出它们的启用、权限、`used`/`maxRequests`。
- `overview().platforms` 对 `bilibili`、`xiaohongshu` 固定返回 `status: 'unsupported', enabled: false`；这不是实时适配器探测，而是当前诚实状态。
- `simulate()` 仅在运行时 ready 后启用两个模拟适配器（`read`、20 次），按两个平台各一步执行，结束后禁用；不启动真实登录、不发真实请求。
- 当前没有真实 Bilibili/Xiaohongshu 适配器、OAuth/扫码、账号资料或真实评论/点赞/发布/私信能力；`PLATFORM_RESEARCH.md` 只是外部方案调研，不能当作已接入证据。

## 9. 真实适配器准入（未来工作）

真实适配器上线前至少需要：独立的安全与许可证审查；可信 Host 注入的凭据/账号映射；明确的能力清单与只读默认；每操作授权、预算、超时和撤销；网络与重定向限制；结构化证据分级；未知回执的人工处理；以及不经过模型/HTTP 的注册路径。当前代码不满足这些条件，不得以“模拟通过”替代真实平台验证。

## 10. 当前差距

1. 没有真实平台接入、账号或网络请求；只有确定性的合成 fixture。
2. 权限和启用状态保存在 Core 配置，重启恢复；每日请求量保存在 platform-budget.json，失败不退款，时钟回拨不重置。Core 单写者租约负责跨进程互斥。
3. `simulated: true` 只是注册检查，不是网络隔离；不得把真实适配器伪装为模拟。
4. 活动时限与取消信号覆盖异步决策和平台等待，迟到结果不入库；没有自动重试或真实平台未知回执恢复。
5. 没有真实账号身份、速率限制、内容合规或平台条款验证。
6. 隔离 Desktop Bundle/UI 与重启已验证；迁移演练在隔离 Web 中执行；真实 QQ 形态未验证。
7. `tests/platforms.test.js` 覆盖默认禁用、写操作拒绝、预算、撤销、信封伪造、双平台稳定 Session 和重复注册；这是模拟契约的单元证据，不是 live 支持证据。

## 11. 变更规则

修改本契约（尤其 `contractVersion`、权限、预算、信封或证据等级）必须同步更新 `AMADEUS_CORE_MODULE_CONTRACTS.md`、`INTEGRATION_CHANGES.md` 和相关测试；真实平台接入前必须按 `UPGRADE_POLICY.md`、`RELEASE_CHECKLIST.md` 审核。模拟证据始终标注为模拟，未测试适配器不得报告为 live 支持。


## 后续验证

隔离 Desktop Bundle/UI 已通过，新增模拟社交路由及独立 MCP Manager 见新平台架构和最终测试报告。真实 QQ/NapCat 与真实平台均未验证。

