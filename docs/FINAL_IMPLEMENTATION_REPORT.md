# Amadeus Core 最终整合实施报告

日期：2026-11-07

本次工作把当前 Core 的 Life、State、Experience 和已有 Mneme/Memory 能力整理为一个可交付的 Core 分支，并优先改善日常可用性。Core 已经包含一套权威 Life 运行时，本次没有把独立 Life 目录整体覆盖进来，也没有另建调度器。

## 已实施

- 在 `CoreRuntime.overview()` 中增加只读的 `lifeSummary` 派生视图。
- 新增设置页 Life 概况卡，显示下一次复查、当前活动、最近经历和兴趣。
- 概况只读取现有 Life、State、Experience 权威接口，不创建记忆、意图、活动或新的数据库。
- 保留 Core 原有的 Life 唤醒、历史恢复、外部消息 Session 绑定和权限边界。
- 保留 Core 现有 Mneme/Memory 数据结构、ACL、图谱和 Experience 证据链。
- 增加一个隔离单元测试，覆盖跨模块读取和无写入行为。

## 未实施

本次没有修改 QQ 仓库、NapCat、平台账号、用户数据或主环境安装；没有合并或正式发布 PR；没有把模拟 Host 调用当作真实 QQ 入站或自然 Life 闭环。真实 QQ 入站和一次自然唤醒后的平台探索仍需在具备独立发送端及真实授权的环境中验收。

## 交付结论

Core 代码、构建和测试达到可审查交付状态。新的分支应通过独立 GitHub PR 审查后再决定是否安装。当前最有价值的后续验证是让一个独立 QQ 账号向授权私聊或群聊发送一条自然消息，并记录 OneBot event、Session turn 和 reply message id。
