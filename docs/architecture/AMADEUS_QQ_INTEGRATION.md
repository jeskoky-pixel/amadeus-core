# 可选独立 QQ 集成（按当前实现与测试记录）

状态：0.1.0-alpha.1 开发候选。QQ 在 Core 之外独立发布和运行；Core 不包含 QQ 适配器、入站队列或发送链路。本文区分“源码已实现的信任边界”与“测试记录中的合成证据”，不表示真实 QQ/NapCat 已上线验证。

## 1. 定位与边界

- 一个 Core Bundle 只整合 Memory、Life、State、Persona；QQ 保持独立模块/插件，不并入 Core。
- Core 不提供发送、回复、评论、点赞、私信、建群、撤回或任何社交通道；这些动作及发送权限始终归 QQ。
- Core 的 `PlatformRegistry` 只有 `simulation-bilibili`、`simulation-xiaohongshu` 两个模拟平台；QQ 不是平台适配器，`overview().platforms` 也不会把 QQ 标成 live。
- QQ 暂停时保持暂停；Core 不提供绕过 QQ 暂停状态或直接调用平台发送器的接口。

## 2. 可信身份与 Scene 边界

Core 在 Memory 配置中强制开启 `sceneIsolationEnabled: true`、`sceneStrictQQ: true`、`unifiedSessionAclEnabled: true`，并关闭 `personaEnabled`。因此 QQ 身份校验按严格 Scene 模式执行。

`src/modules/memory/src/qq-model-boundary.js` 的规则：

- 只读取可信 Host Session 的稳定 `id` 和冻结的 `header.agentPreset`；标题、工具参数、调用方 JSON 一律不作为身份证据。
- 若存在可信 `qq` Host，会调用 `resolveTrustedSessionScene(sessionId)`；只有返回 `platform === 'qq'` 并通过 `mintTrustedScene` 的 Scene 才被视为已验证 QQ。Scene 还必须同时满足两个严格开关。
- 已知 `amadeus-qq*` preset 但在 Host 中无法绑定：fail closed（`qq-host-unbound`），不回退到普通长期记忆。
- Host 存在但无法解析未知/自定义 preset：fail closed（`qq-preset-unverified`）；只有 `standard`/`minimal`/`creator`/`creative`/`default` 等普通 DSH preset 可继续按普通会话处理。
- 即使 QQ Scene 已验证，随后仍必须通过 Workspace 绑定与统一 Session ACL；Scene 身份不是 Workspace 成员资格的替代品。
- 契约中的 provenance v1 由可信 QQ Host 提供并由该 Host 解析；Core 不自行读取 QQ 消息、账号或凭据。没有 QQ Host 时，普通持久 Session 使用自身身份；一旦存在 QQ 契约标记，未验证的历史 Session 不会被当作普通会话放行。

## 3. 经历读取路径

QQ 读取 Core 经历时，只允许走版本 1 的 Host API：

```js
amadeusCore.readExperience(eventId, sessionId)
```

- `readExperience` 先调用 `member()` 重新校验 Session 属于当前 Workspace，且不是 subagent/archived；再在 Memory 的 `unifiedRuntime.authorize.run()` 中按 `memoryId` 取行，并调用 `authorize.delivery()` 记录投递。
- Experience 日志本身不是授权边界；没有 Memory 授权、事件不在当前数据代或不是 `stored`，都返回 `CORE_EXPERIENCE_DENIED`。
- Owner 可见的 `overview()` 只含最近 100 条经历元数据；正文仍需对应 Session 的 Memory ACL。
- 写入侧同样先 `member()`，并在 Memory 授权上下文中保存；收据固定标注 `simulation`，当前没有真实 QQ 或其它平台证据路径。
- 模型工具 `amadeus_experience_read` 只接受 `eventId`，Session 取自可信执行上下文；QQ 侧不能通过模型参数指定 Workspace/Session。

## 4. 测试记录中的合成 OneBot 证据

`docs/architecture/AMADEUS_CORE_TEST_REPORT.md` 记录了一轮隔离联合验证，属于**合成平台证据**，不能表述为 live QQ 支持：

- 已安装 QQ 1.2.1；先确认 `connect=false` 时 `transport=disabled`、`handoffPaused=true`。
- 只接入隔离的合成本机 OneBot 服务，未连接真实 NapCat；创建两个合成群 Scene 和一个合成 Owner 私聊。
- 记录称真实 QQ Host 的 provenance=1、Core 为 ready；通过 Owner HTTP API 修改 Memory 授权，并调用真实 Core Host 读取经历。源 Session、群默认拒绝、Borrow 授权/撤权、Learn 授权/撤权、Owner opt-in/opt-out 共 11 项通过。
- 未向真实 QQ 对象发送任何内容；该轮验证的是原始经历读取权限，不是发送链路、长期保留或真实平台行为。
- 本轮未重跑该联合验证，也未读取原始日志；该记录不能替代可复现的 live 验收。

## 5. 当前差距

1. Core 仓库没有 QQ 适配器、QQ 工具或发送链路；QQ 集成只在 Host/Memory 契约层面存在。
2. 未验证真实 NapCat、真实 QQ 账号、真实群/私聊对象或发送权限；因此不得声称 live QQ 支持。
3. 未验证 Desktop 原生外壳下的 QQ 联合形态；现有证据来自隔离的 Web/本机合成环境。
4. Core 的独立 MCP Manager 已实现，不负责 QQ 发送。平台模拟社交 Dry-run 与 QQ 发送契约分离。
5. 真实 QQ 的入站去重、消息水位、发送回执和暂停恢复仍由 QQ 自身负责；Core 不复制这些机制。

