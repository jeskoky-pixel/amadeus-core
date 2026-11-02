# Amadeus Core 模块契约

状态：0.1.0-alpha.1 开发候选。本文只描述当前源码已实现的契约，不代表已完成发布、生产迁移或真实平台接入。
依据：`src/core/{runtime,host,experiences,activity,store,http}.js`、`src/platforms/registry.js`、`src/modules/*/src`、`tests/*.test.js`。

## 1. 单一 Bundle 与保留模块

- Core 只提供一个 Bundle 入口 `amadeus-core`（`cordis.patch.yml` 插入 `@fg-lab/amadeus-core`）。QQ 保持独立，不并入 Core。
- 当前 `package.json` 仍为 `private: true`，没有自动发布流程；发行前必须按 `RELEASE_CHECKLIST.md` 审核。
- 不依赖四个旧 npm 包，也不安装它们的 Bundle patch。模块源码、资源、测试和许可证随仓库保留，内部身份不重命名。
- 导入时的代码适配（如 `__coreBridge`、路径和清单裁剪）记录在 `docs/architecture/INTEGRATION_CHANGES.md`；算法、数据和 ACL 不因合并而改写。

| 模块 | 保留的公开身份 | 所有权与边界 |
| --- | --- | --- |
| Memory | 服务 `amadeus.memory`；内部名 `dsh-mneme`；原有工具/提示词名 | Workspace 绑定 SQLite、Dream/Sleep 作用域、Scene 与统一 Session ACL；Core 不复制其算法 |
| Life | 服务 `life` | 唯一 wake scheduler、活动 provider/账本、启动租约；Core 只扩展 provider 和 checkpoint |
| State | 服务 `amadeusState` | Session 观察、runtime context、自身 SQLite；不拥有调度器 |
| Persona | 模块名 `amadeus-persona`；提示词段 `amadeus:core-persona`、`amadeus:scene-persona` | 只写这两个提示词段，按可信 Workspace/QQ 解析；不改官方工具与策略段 |

Core 自身新增 `amadeusCore` 服务和模型工具 `amadeus_experience_read`；不新增可写模块数据的模型工具，模块既有的 Owner HTTP 界面仍由各模块自行挂载和授权。

## 2. 生命周期与所有权

- `CoreRuntime.start()` 先检查可信 `configEditor.entries()`：若旧独立模块仍启用，以 `CORE_STANDALONE_CONFLICT` 失败关闭；然后获取 `.core-writer.json` 进程租约，只有确认旧 PID 已死亡才允许恢复。
- 挂载顺序为 persona、memory、life、state。每个模块在 Core 子 Cordis scope 中挂载，并以 `handle.dispose()` 逆序释放；任一模块缺少 `__coreBridge` 即 `CORE_MODULE_UNAVAILABLE`，整体 blocked。
- 每个模块只能看到被绑定的单一 Workspace：子 scope 的 `workspaceRegistry` 仅暴露该 ID 的 `get/list`，不能枚举其他 Workspace。
- 数据根必须是绝对路径（默认 `$DSH_HOME/amadeus-core`），用户数据不进入 npm 包。若存在 `dataGeneration`，模块数据位于 `generations/<uuid>/live`；UUID 格式不合法即拒绝启动。
- `CoreStore` schema 1 采用 revision 乐观并发；每次更新先把旧状态原子写入 `backups/core-r<revision>.json`，再以 `0600` 临时文件 + fsync + rename 提交。
- 保存配置与运行配置分离：`overview().pendingRestart`/`runningRevision` 表示差异；`applyChanges()` 需要写者租约、Workspace 所有已加载 Session 均无未结束 turn，且 Activity 不 busy。
- 配置表单允许 life/state 字段白名单及 Memory GUI 的 13 个结构参数，每次最多 200 个单键 set/unset。Memory 使用原 Schema 校验和 volatile JSON 解包；路径、Core 强制策略不能写入。修订冲突返回 409，原子持久化并保留备份。Memory 保存后明确待应用，在无活跃工具/活动的安全边界通过“应用配置”重载。

## 3. 版本 1 可信 Host API

`ctx.provide('amadeusCore', runtime.api())` 暴露冻结对象：

```js
{ contractVersion: 1, getHealth, assertSession, readExperience }
```

- `getHealth()` 返回 `overview()`：状态、问题、模块启用/挂载、Workspace、revision/pendingRestart、模拟平台、Activity 与 Experience 元数据、数据代际。
- `assertSession(id)` 返回通过 Workspace 成员校验的可信 Host Session，否则抛 `CORE_SESSION_DENIED`；Scene ACL 由 Memory 的读取/写入路径继续校验。
- `readExperience(eventId, sessionId)` 在读取时重新校验 Session，再经 Memory 的统一授权与投递记录返回 Experience 与 Memory 行。
- 模型工具 `amadeus_experience_read` 只接受 `eventId`，Session 来自 `exec.agent.session.id`；模型参数不能提供 Workspace、Session 或权限。
- HTTP 是 Owner 面：同源校验 + `authorizeRequest`，POST 还要求 `x-amadeus-core: 1`；状态/表单/配置/apply/simulate/import/rollback 均不是模型工具。请求体上限 128 KiB。

## 4. Workspace 与 Scene ACL

- 授权只使用可信 Host 的稳定 Session ID 与 `workspaceRegistry` 的稳定 Workspace ID/`sessionIds`；标题、目录、预设、调用方 JSON 一律不作为授权证据。
- `member()` 每次调用都重新读取注册表：Session 必须存在、有真实 `header`、恰好属于一个 Workspace、Workspace 匹配，且不是 `origin: 'subagent'` 或 `archived`；普通 fork（header 存在，非 `subagent`/`archived`）可通过。缺字段、重复 ID、歧义、读取异常全部拒绝。
- Memory 被强制设置 `sceneIsolationEnabled: true`、`sceneStrictQQ: true`、`unifiedSessionAclEnabled: true`、`personaEnabled: false`；读取继续经过统一 ACL；Dream/Sleep 通过 unifiedRuntime.runSources 按来源执行。
- 对可信 QQ Session，Memory 通过 Host `qq` 的 provenance v1 与 trusted scene 解析身份；无法验证时 fail closed。没有 `qq` 服务时使用持久化的普通 Session stamp；存在 QQ 契约标记后，未验证的历史 Session 不会再被当普通会话放行。
- Experience 写入和读取都先 `member()`，再在 `unifiedRuntime.authorize.run()` 中执行；读取还调用 `authorize.delivery()` 记录投递方向。Workspace 身份来自 `CoreStore`，不来自模型参数。

## 5. 稳定 Session 与 Activity

- Activity 使用每个 Workspace 一个持久 `activitySessionId`，由可信 `sessionController.create({ workspaceId, agentPreset: 'standard' })` 创建；创建中标志防止并发重复创建。
- 恢复时先确认 Session 仍在 Workspace 的 `sessionIds` 中，再经 `member()`；未加载的 Session 可由 `sessionController.resolveAgent()` 恢复，失败即 `CORE_ACTIVITY_SESSION_RESTORE_FAILED`。
- 同一 `workspaceId/sessionId` 贯穿多平台步骤和 Experience 记录；跨平台不更换 Session。Activity 没有独立计时器、唤醒队列、平台登录或发送器。
- `explore()` 默认最多 6 步/30 秒，硬上限 20 步/60 秒；每步前检查取消与超时，每步后写 checkpoint。异常时暂停并保留账本，不自动重试未知回执。

## 6. Experience 与可选 QQ 只读边界

- `experiences.json` schema 1，容量 10,000 条。事件 ID 为 `experience_` + `sha256(workspaceId, sessionId, activityId, platform, step)`，重复步骤幂等返回已存条目。
- `record()` 限制 observation 序列化后不超过 64 KiB，先写 `pending`，再以 `evidenceLevel: 'simulation'`、`visibility: 'session'`、`interpretation: null`、`actionReceipt: { kind: 'simulation', externalAction: false }` 写入 Memory；Memory 拒绝即失败，不伪造 `stored`。
- `read()` 只读 `stored` 事件；Session 校验失败抛 `CORE_SESSION_DENIED`，事件不存在或没有 Memory 桥抛 `CORE_EXPERIENCE_DENIED`；Memory ACL 失败沿用其自身的拒绝错误，不会被吞掉。Experience 日志本身不是读取授权边界。
- Owner 可在 `overview()` 中看到最近 100 条元数据；内容仍需对应 Session 的 Memory ACL。任何模块都不能绕过 Memory 直接读取 Experience 正文。
- QQ 是可选传输方：若接入，只允许通过 v1 Host API `readExperience(eventId, sessionId)` 读取，且 Session 必须通过同一 `member()`/Scene ACL。Core 不提供发送、评论、点赞、私信或任何外发接口；QQ 的发送权限与传输仍由 QQ 负责，QQ 暂停时保持暂停。
- 当前仓库没有 QQ 适配器实现，也没有任何真实 QQ/social 出站代码；上述是集成契约，不是已上线能力。

## 7. 当前差距（必须如实标注）

1. Bilibili/Xiaohongshu 仅有进程内确定性模拟适配器；`overview().platforms` 对真实平台固定为 `unsupported`，不得宣称已接入或已抓取真实内容。
2. 平台启用状态和权限由 Core 配置持久化并在重启后恢复；每日请求用量保存在 platform-budget.json，重启不清零；`PlatformRegistry` 以 `simulated: true` 为注册布尔检查，本身不做网络隔离。
3. 没有真实平台鉴权、账号映射、配额服务、失败重试/未知回执恢复；也没有真实平台的证据分级。
4. Core 侧 QQ 适配器与发送链路未实现；Memory 内有 QQ provenance/Scene 单元测试，但本任务未验证真实 QQ Host 形态或发送权限链路。
5. Memory 表单保存、重启读取与恢复默认已经在隔离 Desktop 0.2.1-rc.3 实际验证。旧数据迁移保持原流程，详见最新测试报告。
6. 现有 `tests/core-host.test.js`、`tests/platforms.test.js`、`tests/migration.test.js` 覆盖部分 Host/平台/迁移契约；当前自动化及 GUI 证据以最新测试报告为准。

## 8. 变更规则

修改模块公开身份、数据 schema、ACL、迁移或平台契约前，先遵守 `UPGRADE_POLICY.md`、`DATA_MIGRATION.md`、`RELEASE_CHECKLIST.md`，并在 `INTEGRATION_CHANGES.md` 说明导入代码适配。测试修复必须保留被断言行为；安全契约变化应增加更强的当前断言，而不是跳过。模拟证据必须继续标注为模拟。


## 后续执行证据（2026-11-02）

上述源码审计阶段的“未验证”描述是历史检查范围。隔离 Desktop 的 Bundle、UI、四模块独立停用与重启已验证；Web 迁移导入/回滚及 108 项内容比对通过。最终状态以 AMADEUS_CORE_TEST_REPORT.md 为准。生产数据和真实 NapCat 仍未操作。


