# Amadeus 跨平台模拟活动测试说明

状态：仅模拟跨平台活动。当前没有真实 Bilibili/小红书登录、真实网络读取、真实社交动作或真实平台回执。
本文把“自动化测试覆盖”“本轮执行结果”“模型驱动证据”“Desktop 证据”分开描述，避免把同一次合成运行写成 live 验证。

## 1. 活动链路

跨平台活动的代码链路为：

1. 模型调用 `amadeus_explore_read`，参数包含 `goal`、`platform`、`operation`、可选 `id`/`query`。
2. `src/core/model-exploration.js` 的 `observe()` 校验：
   - Core 状态为 `ready`，`explorationEnabled === true`；
   - 当前 Session 必须等于 Core 的 `activitySessionId`；
   - Session 属于当前 Workspace，且不是子代理；
   - 平台只能是 `simulation-bilibili` 或 `simulation-xiaohongshu`；
   - 操作只能来自 `PLATFORM_READS`（`browse`、`search`、`read`、`comments`、`related`、`subtitles`、`images`）；
   - goal 非空且 ≤ 1024，query ≤ 512，id ≤ 128；
   - 活动不能 `busy`，暂停状态不能直接继续。
3. 第一次读取时通过 Life `startActivity` 创建持久活动；后续读取复用同一 `activityId` 与同一 Session。
4. 平台调用走 `PlatformRegistry.execute()`，传入可信 `{activityId, sessionId, workspaceId}` 身份；模型不能自报这些字段。
5. 成功后由 `Experiences.record()` 写入 Memory，并尝试写入 State 事件。
6. 每一步调用 Life `checkpointActivity()`；第六步后自动结束活动，或由 `amadeus_explore_finish` 提前结束。

`CoreActivity.explore()` 仍保留另一条 Host 侧探索路径：默认 6 步/30 秒，硬上限 20 步/60 秒；每一步先 `member()`，再平台执行，再写经历，再 checkpoint。模型工具路径使用 `model-exploration.js`，默认总预算 120000 ms，可配置 10000–300000 ms，每次请求最多 30 秒，最多 6 次读取。

## 2. 可信身份与跨平台共享

- 两个模拟平台共享的是 **Core 的 Workspace/Session/Activity 身份**，不是平台账号。
- 成功信封由 Registry 重建：`eventId` 新生成、`platform` 为注册 ID、`accountId: null`、`evidenceLevel: 'simulation'`、`externalAction: false`。
- 适配器输出中的同名伪造字段不能覆盖可信信封；`tests/platforms.test.js` 有专门的“forged envelope”断言。
- 两个平台可以接受同一 `sessionId`，但平台身份仍以 `platform:user:<local>` 限定；`same-local` 在两个平台不是同一账号。
- 平台权限与 MCP 权限互不继承；MCP 授权不会给平台任何读取或社会能力。

## 3. 经历与 State 效果

`Experiences.record()` 的行为：

- 事件 ID = `experience_` + SHA-256(`[workspaceId, sessionId, activityId, platform, step]`)；非 original 数据代际还会加入 `dataGeneration`。
- 同代重复记录幂等复用已 `stored` 的条目。
- 写入 Memory 前固定 `evidenceLevel: 'simulation'`、`visibility: 'session'`、`actionReceipt.externalAction: false`。
- Memory 保存成功后回填 `memoryId`，状态转 `stored`。
- 对 `read`、`browse`、`search`、`comments`、`related`、`subtitles`、`images` 这些读取操作，再尝试写 State 的 `exploration_completed` 事件：
  - `source: 'host'`、`trust: 'simulation'`；
  - `summary` 明确“no real platform accessed”；
  - `interestDelta: 0.5`、`scale: 0.1`；
  - 幂等键 `core:<eventId>`；
  - 结果记录为 `stateEffect: 'applied'`、`'duplicate'` 或 `'unavailable-or-denied'`。
- “State 效果 applied”只表示 State 模块接受了这条模拟事件，不表示真实平台产生了行为或真实兴趣变化。

## 4. 自动化覆盖

### 4.1 本轮实际执行

| 文件 | 结果 | 主要范围 |
| --- | --- | --- |
| `tests/activity.test.js` | 5/5 通过 | 决策不返回、适配器不返回、迟到结果、最大步数、稳定 Session |
| `tests/activity-life-integration.test.js` | 2/2 通过 | 真实 Life SQLite 账本的暂停/取消/完成与重启恢复 |
| `tests/model-exploration.test.js` | 9/9 通过 | 连续平台、Session/模式/写操作拒绝、过期暂停、六步上限、撤权、完成未确认 |
| `tests/experience-generation.test.js` | 1/1 通过 | 数据代际隔离，旧收据不能读替换数据库 |
| `tests/platforms.test.js` | 7/7 通过 | 默认禁用、写拒绝、预算、撤权、信封重建、双平台 Session、重复注册 |
| `tests/platform-budget.test.js` | 2/2 通过 | 预算持久化、失败不退款、时钟回拨、取消排队 |

合计 26 项与本主题直接相关，均在本轮逐文件执行通过。

### 4.2 关键断言

- 决策函数永不返回时，在 `maxDurationMs` 后以 `CORE_ACTIVITY_DEADLINE` 失败，活动进入 `Paused`，不创建 Life 活动、不写经历。
- 适配器永不返回时，超时后只启动过一次活动，活动被 `pause` 而不是 `complete`，不写经历。
- 适配器超时后才返回的迟到值被丢弃，不能补写经历。
- 最大步数同时约束决策次数、平台调用次数、checkpoint 次数与经历数。
- 同一持久 Session 在两次探索中复用；不会重复创建 Session 成员。
- 连续读取 Bilibili 与小红书时，两次观察共享同一 `activityId` 与 `sessionId`，只创建一次 Life 活动。
- 非活动 Session、禁用探索、社会写操作在 Life 启动前拒绝。
- 适配器等待期间撤权，迟到的结果被拒绝且不写经历。
- Life 返回 `unknown` 时不报告成功。
- 过期暂停的活动在禁用探索后仍可安全结束，但不重放已完成的观察。

### 4.3 覆盖的局限

- `tests/activity.test.js` 的 Life 与平台是测试替身，验证 CoreActivity 的控制流，不是真实平台。
- `tests/activity-life-integration.test.js` 使用真实 Life SQLite 账本，但平台仍是 `makeSimulatedAdapter`。
- `tests/model-exploration.test.js` 使用通用模拟适配器，不覆盖 Bilibili/XHS 专属 fixture 的每个字段。
- 没有真实登录、真实网络、真实社交动作或真实平台回执的测试。

## 5. 模型驱动证据

`model-extension-evidence.json` 记录了一次模型驱动的跨平台运行：

| 字段 | 值 |
| --- | --- |
| `requestId` | `core-extension-54e496f9-5738-4efb-a309-7a6b6c97156b` |
| `activity.mode` | `model` |
| `activityId` | `activity_5b65ca6d-ee31-4dd8-824c-b8060e100501` |
| `sessionId` | `session-1cab7905-9f1b-4429-9f4b-592b0415be37` |
| 目标 | 读取 Bilibili 模拟评论，寻找机器人演示线索 |
| `attempts` / `steps` | 3 / 3 |
| `toolErrors` | 0 |
| `phase` | `Idle` |

工具调用顺序：

1. `amadeus_mcp_list`
2. `amadeus_mcp_call`（`stdio-one` 的 `echo`）
3. `amadeus_explore_read`：Bilibili `comments`，`id: robot-demo`
4. `amadeus_explore_read`：XHS `search`，`query: 机械臂 动作慢 演示`
5. `amadeus_explore_read`：XHS `comments`，`id: robot-demo`
6. `amadeus_explore_finish`

三条经历均满足：

- `status: "stored"`；
- `stateEffect: "applied"`；
- `activityId` 与 `sessionId` 与上表一致；
- 平台分别为 `simulation-bilibili`、`simulation-xiaohongshu`；
- 操作分别为 `comments`、`search`、`comments`。

此外，两条 MCP 事件均为 `outcome: "completed"`。这证明同一次模型会话里 MCP 与模拟平台读取可以并存，且 `toolErrors` 为 0；但不证明 MCP HTTP 服务或真实平台已运行。

## 6. Desktop 证据

`desktop-activity-check.json`：

- `status: "ready"`。
- 活动 `phase: "Idle"`、`busy: false`。
- `activityId: activity_1812488b-b763-4bb1-837c-6d975204f8d0`。
- `sessionId: session-4a6ee18e-4f57-4441-9475-7662ce132ffb`。
- 同一活动两条经历：
  - Bilibili `read`，`step: 0`，`status: "stored"`，`memoryId: d713100e-...`；
  - XHS `read`，`step: 1`，`status: "stored"`，`memoryId: b530fa00-...`。
- 两条事件共享同一 `workspaceId`、`sessionId`、`activityId`。

`desktop-restart-checks.json`：

- `ready: true`、`modules: true`；
- `sessionPreserved: true`、`eventsPreserved: true`；
- `explorationDisabled: true`。

这说明重启后 Session 与事件仍在，探索保持禁用；它不证明重启后能继续未完成的真实平台活动，也不证明真实平台可用。

`desktop-module-toggle-checks.json`：

- Persona、State、Life、Memory 四个模块逐个禁用再恢复；
- 每项均校验 `others: true`、`sessionPreserved: true`、`eventsPreserved: true`。

这验证模块切换不丢 Session/事件，不验证真实平台连接。

## 7. 覆盖与已执行证据对照

| 主张 | 覆盖/证据 | 能否作为真实平台证据 |
| --- | --- | --- |
| 同一活动、同一 Session 连续读取两个模拟平台 | 模型证据 + `model-exploration.test.js` | 否，模拟 |
| 3 条经历写入且 State 效果 applied | 模型证据 `events` | 否，模拟 |
| 0 工具错误、最终 Idle | 模型证据 | 否，模拟 |
| 活动超时/迟到结果不落库 | `activity.test.js` 5/5 | 否，单元 |
| 撤权后不写经历 | `model-exploration.test.js` | 否，单元 |
| Life SQLite 中安全暂停/取消/完成 | `activity-life-integration.test.js` 2/2 | 否，测试替身平台 |
| Desktop 重启保留 Session/事件 | `desktop-restart-checks.json` | 否，模拟活动 |
| 真实 Bilibili/XHS 跨平台读取 | 无 | 未实现、未测试 |

## 8. 未覆盖与风险

1. 没有真实平台登录、账号、Cookie、OAuth 或风控。
2. 没有真实网络、限流、重试、断线恢复、平台条款与内容审核。
3. `search` 是字面匹配；中文查询可能 0 条，不能据此推断真实平台内容。
4. State 的 `applied` 只是模块记录成功，不是真实兴趣变化。
5. 没有真实社交动作；社会操作只有默认关闭的 dry-run。
6. 没有跨重启继续真实探索；`desktop-restart-checks.json` 只证明状态保留和探索禁用。
7. 模型证据是一次验收运行，不是完整回归；不能替代 `npm test` 全量结果。
8. 真实适配器需要单独的安全、许可证、凭据和证据评审，不能把本文件的模拟结果当作准入依据。

## 9. 相关文件

- `src/core/activity.js`
- `src/core/model-exploration.js`
- `src/core/experiences.js`
- `src/core/runtime.js`
- `src/platforms/registry.js`
- `tests/activity.test.js`、`tests/activity-life-integration.test.js`
- `tests/model-exploration.test.js`、`tests/experience-generation.test.js`
- `docs/architecture/AMADEUS_EXPERIENCE_EVENT_SPEC.md`
- `docs/architecture/AMADEUS_PLATFORM_ARCHITECTURE.md`
