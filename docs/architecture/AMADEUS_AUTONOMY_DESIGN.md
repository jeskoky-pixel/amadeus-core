# Amadeus 自主性设计（按当前源码）

状态：0.1.0-alpha.1 开发候选。本文只描述当前源码已实现的行为；未实现能力单独列在末节，不能当作现有功能。
主要依据：`src/core/activity.js`、`src/core/model-exploration.js`、`src/core/experiences.js`、`src/platforms/registry.js`、`src/core/runtime.js`，以及 `tests/{model-exploration,activity,platform-budget,experience-generation}.test.js`。

## 1. 证据与总体边界

- 当前只有进程内模拟平台和合成 fixture。活动、配额、经历记录有单元/运行时测试，但没有真实 Bilibili、小红书、QQ 或其它平台请求。
- Life 仍是唯一的活动 provider/唤醒账本；Core 不新建长期唤醒计时器、独立任务队列或第二个模型调用。
- 已有两层探索入口：模型通过工具逐步选择的有界探索，以及 Owner 触发的确定性诊断。二者共享 Life provider、平台注册表与经历存储；模型入口使用 `observe()`，确定性诊断使用 `CoreActivity.explore(decide, opts)`。
- 当前没有自主目标生成、长期规划、后台定时唤醒、跨重启自动续跑，也没有 MCP/新平台接入实现。

## 2. 两个入口与共同底座

| 入口 | 触发者 | 决策来源 | 用途 |
| --- | --- | --- | --- |
| `amadeus_explore_read` / `amadeus_explore_finish` | 持久 Agent 内的模型工具调用 | 模型按当前兴趣逐步选择 platform/operation/goal | 模型驱动探索 |
| `runtime.simulate()` | Owner HTTP `/simulate` | 固定顺序遍历两个模拟平台 | 确定性只读诊断 |
| `CoreActivity.explore(decide, opts)` | 诊断入口的内部调用 | 外部注入的 `decide` 回调 | 有界执行、记录、检查点 |

`decide` 不是模型规划器本身：它只是返回下一步 `{platform, operation, input}` 或 `null` 的回调。代码只保证步数、时长、取消、串行和审计，不保证决策质量。

## 3. 模型驱动探索（已实现）

- 工具注册在 `registerExplorationTools()`；`observe()` 的 Session 来自 `exec.agent.session.id`，模型参数不能提供 Session/Workspace/权限。
- 前置条件：Runtime `ready`、`explorationEnabled === true`、Session 等于持久 `activitySessionId` 且通过 `member()`、Life 与 Memory 桥可用。
- 输入被严格限制：平台只能是 `simulation-bilibili`/`simulation-xiaohongshu`，操作只能是 `read`/`search`/`browse`，`goal` 1..1024 字符，`query` ≤512、`id` ≤128 字符。
- 第一次 `observe()` 创建一条 Life activity（`providerId` 为 Core provider，deadline 默认 120 秒后，可在 GUI 配置 10–300 秒），`activity.json` 记录 `mode: 'model'`、goal、deadline、attempts、steps 和事件 ID。
- 之后每次工具调用只执行一步：Life 账本继续、平台执行、`Experiences.record()`、Life checkpoint，并持久化 attempts/steps。模型可在任意一步调用 `amadeus_explore_finish` 提前结束。
- 每条活动最多 6 次尝试，整体时间预算默认 120 秒（设置变更于下一条活动生效）；第 6 次后自动结束并回到 `Idle`。重复调用同一活动不会重置预算。
- `observe()` 在 `Paused` 阶段直接抛 `CORE_ACTIVITY_RESUME_REQUIRED`，不会自动恢复。恢复只能经 Life provider 的 `CoreActivity.resume()` 路径；若 deadline 已过或 attempts ≥ 6，恢复抛 `CORE_ACTIVITY_BUDGET`。
- 平台执行前后都重新校验 Session 和取消信号；执行期间被禁用/改权限会抛 `CORE_PLATFORM_REVOKED`，不写经历。异常会暂停 Life 活动并转到 `Paused`，不自动重试未知结果。
- Core 不额外调用模型、不创建定时唤醒；State/Memory/Persona 的正常注入不变。Life 是唯一调度者。

## 4. 确定性模拟诊断（已实现）

- `runtime.simulate()` 只允许在 `ready` 时调用，并与模块生命周期变更共用 `serial` 串行队列。
- 临时把 `simulation-bilibili`、`simulation-xiaohongshu` 设为 `enabled: true`、权限仅 `read`、`maxRequests: 20`，然后调用 `explore()`：顺序每个平台一步 `read` 固定 fixture `robot-demo`，之后 `finally` 恢复配置。
- 该路径不使用模型、不分析 goal、不产生真实网络请求；所有结果固定为 `evidenceLevel: 'simulation'`、`externalAction: false`。
- 诊断仍会消耗持久平台预算并写入经历记录，因此不能当作“免费探测”；启用状态和权限不会因此永久打开。

## 5. 有界活动与持久 Session

- 通用 `explore()` 默认 `maxSteps=6`、`maxDurationMs=30000`；硬限制为 1..20 步、100..60000 毫秒。`busy` 互斥保证同一时刻只有一条探索。
- 阶段为 `Idle`、`Deliberating`、`Exploring`、`Paused`；写入 `activity.json`（schema 1）。异常时 Life 活动暂停；重启加载时 `running` 降级为 `paused`，`Exploring`/`Deliberating` 降级为 `Paused`，不自动续跑。
- 每个 Workspace 持久复用一个 `activitySessionId`（standard preset）。恢复时先校验 `workspaceRegistry` 的 `sessionIds`，再经 `sessions.get` 或 `sessionController.resolveAgent`，失败抛 `CORE_SESSION_DENIED`/`CORE_ACTIVITY_SESSION_RESTORE_FAILED`。
- `activitySessionCreating` 防止并发重复建会话；已创建 Session 不会在活动结束后清空。
- `CoreActivity` 继承 Life 的 `LocalVirtualProvider`，自身只有终止请求的 deadline timer，没有长期唤醒计时器、唤醒队列、平台登录或发送器；start/checkpoint/finish/pause 委托 Life 账本，之后写 `activity.json`。

## 6. 持久每日请求配额（已实现）

- `PlatformRegistry` 的配额日按 `floor(now()/86400000)` 计算，即 UTC 纪元日；状态存于 `platform-budget.json`（schema 1）。
- 只有日期变大时才重置当日 `used` 并原子写盘；时钟回拨不会为已消费的日期重新发放额度。
- 每次 `execute()` 先检查身份、启用状态、只读操作、权限和 `used >= maxRequests`；通过后**先原子记 `used+1` 再派发**。失败、取消、迟到结果都不退还额度。
- `configure()` 变更 enabled/permissions/maxRequests 会递增 generation，但不清零已用额度；同一适配器以 `tail` 串行执行，避免并发超额。
- 注册或重启时从配额文件恢复各适配器已用值；平台启用/权限本身不持久化，运行时按 `explorationEnabled` 重新配置模拟平台。
- `maxRequests` 是当前适配器条目的总请求上限（1..1000，默认 20），与按 UTC 日累计的 `used` 配合，不表示真实平台账号配额。

## 7. 经历与数据代际（已实现）

- 事件 ID 为 `experience_` + SHA-256；键为 `[workspaceId, sessionId, activityId, platform, step]`，`dataGeneration !== 'original'` 时追加 dataGeneration。
- 同一代重复步骤幂等返回已存条目；不同代产生不同 ID。读取和 Owner 列表只返回当前代际，旧代事件不会因 Memory 行 ID 相同而串读。
- 容量上限 10,000 条；observation 序列化上限 64 KiB。先写 `pending` 收据，再在 Memory 统一授权上下文中写入；成功才置 `stored`。
- 记忆载荷固定 `evidenceLevel: 'simulation'`、`visibility: 'session'`、`interpretation: null`、`actionReceipt: { kind: 'simulation', externalAction: false }`。Memory 拒绝即失败，不伪造收据。

## 8. 未实现或未验证

1. 没有模型自主设定长期目标、任务分解、重规划或自我触发；每次工具调用仍由模型在正常对话/活动中发起。
2. 没有后台唤醒、时间驱动循环、跨重启继续探索；暂停后需外部恢复或重新开始。
3. 没有真实平台适配器、登录、账号映射、真实网络请求或真实平台证据分级。
4. 平台配额是本地进程内适配器预算，不是平台侧配额服务，也没有真实平台限流/重试/未知回执恢复。
5. 独立 MCP Manager 已接入多个本地真实协议服务；它不作为平台系统的必需依赖。
6. 已验证隔离 Desktop 原生外壳；真实 QQ/NapCat 和 live 平台未测试。

## 9. 安全约束

- 平台注册是可信进程内代码，只接受 `simulated: true`、`contractVersion: 1` 和只读能力；注册不是 HTTP 或模型操作。
- 模型工具不能传入 Session/Workspace/权限；每一步仍经可信 `member()` 与平台权限检查。
- 没有真实平台凭据、发布、评论、点赞、私信或任何社会动作路径；模拟证据必须保持 simulation 标注。

