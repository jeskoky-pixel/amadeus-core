# Amadeus Core 0.2.0-alpha.4

开发候选，尚未发布。一个 DSH Bundle 内保留 Memory 1.3.0、Life 1.2.1、State 1.2.0、Persona 1.2.0 的实现与数据结构；QQ 继续独立。

## 当前可运行内容

- 单 Workspace、四模块生命周期和统一控制台；保留记忆图谱、人格编辑、状态及生活管理。
- 可信 Session 经历读取、统一 Memory ACL；模拟与获授权真实平台读取复用稳定活动 Session。
- 有限活动步数、异步超时与取消、持久每日平台请求预算。
- 独立平台管理与 MCP 管理：两个模拟平台、Bilibili 网页只读适配器与小红书官方设备授权客户端、多个 stdio / Streamable HTTP 服务、逐工具和 Session 授权。
- 停机快照、SQLite WAL 一致性备份、独立数据代及配置回滚。

## 开发与隔离安装

使用官方 DSH 0.2.1-rc.3 运行时验证。执行 `npm run build`、`npm test`、`npm run test:modules`、`npm run pack:check`。`npm pack --ignore-scripts` 生成含预构建客户端的本地候选包，再通过独立 DSH Profile 的插件管理器安装。不要在已有四插件启用的日常 Profile 直接安装本候选。

首次打开 Amadeus Core → 设置 → 选择 DSH Workspace → 保存并应用。模块的数据位于独立 Core 数据根，升级代码不会清空它。迁移前阅读 [DATA_MIGRATION.md](DATA_MIGRATION.md)；禁用旧模块不是删除旧数据。

## 当前边界

Bilibili 已实现网页端扫码客户端和元数据/热门/搜索/评论/相关内容请求；公开视频详情已做一次无账号只读验证。网页接口不是开放平台 OAuth，仍需用户本人登录联调，不保证所有账号/接口持续可用。小红书使用官方 Web 设备授权，需要审核通过的应用；当前官方仅开放 basic_info，笔记搜索/评论/发布不支持。两平台真实写操作均关闭。

小红书专用浏览器使用 Windows 当前用户加密存储登录状态，关闭窗口或重启后尝试恢复，平台失效时重新扫码／短信登录。可选保存账密，只在官方页面提供密码框时预填，不自动提交验证码。Bilibili 和开放平台适配器目前仍为会话内凭据，重启需重新授权；不会读取日常浏览器 Cookie。Mock 使用独立身份，不继承真实账号、权限或预算。MCP 保持独立。QQ 仍只保留此前合成 OneBot 契约证据，未连接生产 NapCat。

[登录指南](docs/architecture/AMADEUS_PLATFORM_LOGIN_GUIDE.md) · [Alpha 0.2 验收](docs/architecture/AMADEUS_REAL_PLATFORM_TEST_REPORT.md)。本轮只交付 Draft PR，不合并、不发布、不替换日常 DSH。

[设计](docs/architecture/AMADEUS_CORE_DESIGN.md) · [模块契约](docs/architecture/AMADEUS_CORE_MODULE_CONTRACTS.md) · [升级政策](UPGRADE_POLICY.md) · [发行检查](RELEASE_CHECKLIST.md)

原模块的版权与许可证见 [NOTICE.md](NOTICE.md) 和各模块保留的 LICENSE。整合不取消原始署名。



### XHS dedicated browser candidate / 小红书独立浏览器候选
Separate ephemeral Edge login, note/comment reading and scoped like/comment/reply execution are available for review. All grants default off. Owner must authorize note IDs and the Activity Session; unknown results never auto-replay. Official XHS device OAuth remains basic_info only. **Real XHS account acceptance is pending**; browser fixture results are not live-site evidence. See [setup](docs/architecture/AMADEUS_PLATFORM_LOGIN_GUIDE.md) and [verification](docs/architecture/XHS_BROWSER_ACCEPTANCE.md). No production installation or release is implied.
