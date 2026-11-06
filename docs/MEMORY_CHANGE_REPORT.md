# Memory / Mneme 变更报告

日期：2026-11-07

本次没有修改 Mneme 的内部 schema、索引算法、实体图谱算法、ACL 规则或数据迁移。Core 继续通过既有 Memory、State、Experience 和图谱接口读取信息；Life 概况只读取 State 和 Experience 的 owner-facing 数据，不复制出第二套记忆。

本次新增的 `lifeSummary` 是瞬时派生 DTO，不落盘、不进入 Memory、不改变 RecentContext/RecentActivity 的退役决策，也不改变来源内容的权限。平台原始内容仍由现有 Experience 证据链和 ACL 控制。

因此不存在用户数据迁移要求。升级或回滚时，旧 Core 数据格式保持兼容；删除本次新增代码只会使设置页回到原有 Life 视图，不会删除记忆或经历。
