# Amadeus 原始 17 项功能覆盖表

状态只描述当前证据，不把“保留接口”写成新的优化完成。**已满足**表示既有机制和证据已经足够；**本轮实现**表示本 PR 新增；**部分完成**表示代码存在但缺少某类验收；**需补充实现**表示仍有明确代码缺口；**外部阻塞**表示需要真实账号、Host、独立发送端或用户操作。

| 编号 | 原始语义 | 当前状态 | 事实与证据 |
|---:|---|---|---|
| 1 | 持续生活概况 | 本轮实现 | `lifeSummary` 分页读取 Life、State、Experience；设置页显示来源、错误和当前状态 |
| 2 | 具体兴趣和问题演化 | 部分完成 | State 兴趣可回读，Life 意图可回读；真实经历推动兴趣的自然闭环尚缺现场证据 |
| 3 | 机会筛选与自适应节律 | 部分完成 | Life 意图、预算、Activity 机制已存在；Core 现在可显式把 Activity Session 纳入既有 Host 唤醒 allowlist，但机会质量和节律长期效果未完成自然运行验收 |
| 4 | 跨天兴趣项目和未完事项 | 部分完成 | active intent/reviewAt 和持久账本存在；跨天真实项目连续性未完成现场验收 |
| 5 | 主动交流理由、时机与硬权限 | 部分完成 | WakeHost、意图来源、外发提示 opt-in 和 QQ Scene Guard 的硬边界存在；Core 新增显式唤醒绑定入口但默认不授予外发提示，主动外发真实 QQ 边界仍需实测 |
| 6 | 注意力、打断与活动接续 | 已满足/部分 | Core 已有用户打断、暂停、恢复和 unknown 语义；本轮未重跑真实长活动打断 |
| 7 | 经历、知识、偏好、意图表达分工 | 已满足 | Experience、Memory、State、Life 仍由各自既有接口负责；本轮未复制记忆账本 |
| 8 | 来源、推断和更正边界 | 已满足/部分 | Experience evidence/ACL 和 raw evidence 保护保留；真实平台内容更正仍需现场样本 |
| 9 | 图谱辅助检索与探索 | 已满足/部分 | Mneme 图谱和来源定位保留；本轮未进行 GUI 实际操作回归 |
| 10 | 人格自动成长 | 不实施 | 按原任务明确排除，不自动改写 Main SOUL 或人格设定 |
| 11 | 日常首页与分层管理 | 本轮实现/部分 | Core 首页、Life/Memory/State/Experience 分层入口保留；实际 DSH GUI 交互需安装后复验 |
| 12 | 行为模式与暂停控制 | 已满足/部分 | 活动预算、暂停/恢复/安全结束入口已有；长时间行为模式未完成自然运行验收 |
| 13 | 独立插件能力发现与窄授权 | 已满足 | MCP Manager、Session/Workspace/平台权限边界已有测试；本轮未扩大工具注册 |
| 14 | 故障恢复与生活继续 | 已满足/部分 | Life 恢复、unknown、数据代和回滚机制已有；本轮未进行主环境重启恢复 |
| 15 | 资源与上下文分层 | 已满足/部分 | Activity 预算、Memory ACL、Session scope 和 owner-only summary 已有；长周期容量压力未重跑 |
| 16 | 长期容量、归档与升级连续性 | 部分完成 | 数据代、回滚、Experience cap 和 Mneme 既有连续性保留；长期归档升级仍需独立周期验收 |
| 17 | 完整行为验收 | 外部阻塞 | 需要安装候选、真实 DSH、QQ 独立发送端、平台授权和自然活动观察；本轮不能用模拟替代 |

## 本轮明确新增

- 修复 Memory/State/Life 页签路由，恢复 Memory 原生 Mneme 页面和 State 原生集成页面。
- `lifeSummary` 使用 200 条有界分页，最多读取 5000 条并报告 partial/bounded；不再把第一页当完整账本。
- 区分 running、pending、paused、stopping/unknown；改用 `canRestNow` 和 `canConsiderContactNow`。
- 最近经历只显示 `stored`/`completed`，pending 经历单独计数。
- 读取失败进入 `errors` 和来源状态；Owner 概况不进入 `amadeusCore.getHealth()` 模型侧服务。
- `lifeDelivery` 只读摘要进入 Core 状态页，保留状态、绑定、计时器、预算和未对账标记，不暴露目标 Session ID。
- `/prepare-autonomous-life` 以 Owner 操作为前提，将当前持久 Activity Session 加入已有 Life allowlist 并标记待应用；`externalMessageSessionIds` 保持默认空列表，不绕过 QQ Scene 授权。

