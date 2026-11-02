# Amadeus Core 0.1.0-alpha.1

开发候选，尚未发布。一个 DSH Bundle 内保留 Memory 1.3.0、Life 1.2.1、State 1.2.0、Persona 1.2.0 的实现与数据结构；QQ 继续独立。

## 当前可运行内容

- 单 Workspace、四模块生命周期和统一控制台；保留记忆图谱、人格编辑、状态及生活管理。
- 可信 Session 经历读取、统一 Memory ACL；模拟平台只读探索复用稳定活动 Session。
- 有限活动步数、异步超时与取消、持久每日平台请求预算。
- 独立平台管理与 MCP 管理：两个模拟平台、多个 stdio / Streamable HTTP 服务、逐工具和 Session 授权。
- 停机快照、SQLite WAL 一致性备份、独立数据代及配置回滚。

## 开发与隔离安装

使用官方 DSH 0.2.1-rc.3 运行时验证。执行 `npm run build`、`npm test`、`npm run test:modules`、`npm run pack:check`。`npm pack --ignore-scripts` 生成含预构建客户端的本地候选包，再通过独立 DSH Profile 的插件管理器安装。不要在已有四插件启用的日常 Profile 直接安装本候选。

首次打开 Amadeus Core → 设置 → 选择 DSH Workspace → 保存并应用。模块的数据位于独立 Core 数据根，升级代码不会清空它。迁移前阅读 [DATA_MIGRATION.md](DATA_MIGRATION.md)；禁用旧模块不是删除旧数据。

## 当前边界

Bilibili、小红书只有模拟模块，不访问真实账号或内容，不支持社交外发。已验证隔离 Desktop 四模块装载、重启和独立停用，以及真实模型驱动的跨平台模拟探索。MCP 使用官方 SDK，已完成本地真实协议测试。QQ 仅通过合成 OneBot 进行可信身份契约验证；真实 NapCat、平台登录和社交外发不在本轮验收范围。当前不发布 npm、Release 或市场条目。

[设计](docs/architecture/AMADEUS_CORE_DESIGN.md) · [模块契约](docs/architecture/AMADEUS_CORE_MODULE_CONTRACTS.md) · [升级政策](UPGRADE_POLICY.md) · [发行检查](RELEASE_CHECKLIST.md)

原模块的版权与许可证见 [NOTICE.md](NOTICE.md) 和各模块保留的 LICENSE。整合不取消原始署名。

