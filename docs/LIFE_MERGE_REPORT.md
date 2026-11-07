# Life 合并报告

日期：2026-11-07

## 比较基线

| 项目 | 实际基线 |
|---|---|
| Core 基线 | `99efb34f607af0d2ef2162efc1931c57e191dd4f`，`codex/xhs-local-backend-alpha6` |
| 当前交付分支 | `codex/core-final-integration-20261107` |
| 本机独立 Life 分支 | `codex/life-core`，当前本机 `297628b58bd707c785f0b55ed33ad6e402cebe20` |

## 结论

Core 已经有自己的 Life 模块和集成适配。逐文件检查确认 Core 保留了当前运行所需的历史恢复、失败唤醒的保守恢复、活动中断过滤、`externalMessageSessionIds` 和受保护的 WakeHost 提示机制。独立 Life 的实现不能直接覆盖这些 Core 适配，否则会回退到较早的兼容行为。

因此本次采用“保留 Core 权威实现、吸收产品意图、补充只读视图”的最小合并策略。没有复制独立仓库的数据库、调度器或第二套 Life 服务。独立 Life 继续作为参考实现和独立测试来源，主 Core 只加载 `src/modules/life` 这一套模块。

## 本次新增

`src/core/life-summary.js` 从既有 Life admin 读取、State workspace overview 和 Experience owner list 生成 owner-facing 派生 DTO。它不写入任何存储，不触发模型回合，也不发送平台消息。Core 设置页消费该 DTO，因此用户可以在同一入口看到当前生活状态，而不需要阅读内部 JSON。

## 风险边界

- Life 自主唤醒仍由原有活动机制控制，不因新增概况卡而增加唤醒次数。
- `externalMessageSessionIds` 仍是提示层的显式绑定，不会自动向外部平台发送消息。
- 没有用模拟活动冒充真实平台经历；没有修改主数据或账号凭据。

