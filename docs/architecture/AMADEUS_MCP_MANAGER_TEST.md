# MCP Manager 验收记录

当前口径：2026-11-02 合并前质量修复。以本页及 Core 总报告为准；旧 worker 的 EPERM 仅为委派沙箱限制，不是最终协议测试结果。

## 已实际验证

Core 测试直接调用官方 MCP SDK 2.3.0，与两个 stdio 子进程及一个本地 Streamable HTTP Server 建立真实 JSON-RPC 连接。不是将 SDK 替换成 Mock。

- 三服务同时发现同名 echo/slow/fail，按 serverId + toolName 隔离。
- 各服务真实调用、参数 Schema 校验、禁用/重新连接/移除。
- 实际终止一个 stdio 进程，另一服务仍可调用；显式重连恢复。
- 配置、配额和调用元数据重启恢复；Desktop 真实安装/重启证据见 `../evidence/desktop-mcp-restart-checks.json`。
- 未授权 Session、跨 Workspace、未经证实的 Scene、子代理被拒绝。
- 默认无 Session 授权，工具默认关闭；写/系统类别需要明确副作用许可。
- 超时、工具错误、等待中撤权；迟到结果不交付、不自动重试。
- 服务端 instructions 不注入 System Prompt；外部描述和结果标注不可信。
- 凭据脱敏及 HTTP 重定向防外泄；本地 Bearer 服务完成认证引用验证。

对应 `tests/mcp-protocol.test.js`、`mcp-security.test.js`、`mcp-ui.test.js`、`core-http.test.js`。这些用例已包含在本轮 Core 完整回归内；完整结果见 Core 报告与 PR checks。

## 类型授权的准确含义

授权仅限当前 Core Workspace，仍须每次从可信 Host 验证 Session 身份。

| 授权方式 | 实际覆盖 |
| --- | --- |
| qq-group | 当前工作区内所有可信 QQ 群 Session，包括未来新增且通过验证的成员 |
| qq-private | 当前工作区内所有可信 QQ 私聊 Session；不是仅 Owner 私聊 |
| 具体 Session ID | 仅该可信 Session；不继承到其他群/私聊 |

类型授权和具体 Session 授权是“或”关系。移除一个具体 ID 不会抵消仍存在的类型授权。要限于 Owner 私聊，应选其具体可信 Session，且不要同时打开 qq-private 类型授权。GUI 中英文明确提示，新增范围/撤权/未验证 Scene 回归通过。

普通 DSH 授权不会自动授予 QQ 权限；连接成功不等于授权成功。工具参数和外部描述都不能自行声明 Owner 身份。

## 目录与 Hosted 边界

目录目前是基础参考入口，只有一个官方 filesystem 示例及其来源链接。它没有预装、部署外部服务，也不是完整 Hosted MCP Market。

支持自定义 stdio 和 Streamable HTTP 配置、Bearer 引用；本轮没有连接真实第三方 Hosted 账号，没有实现完整 OAuth/Token 刷新市场。不得将本地 Bearer 测试称为真实 ModelScope 部署验收。

stdio 不提供 OS 沙箱，管理员需要信任本地程序；工具只读分类是管理员声明。凭据文件不加密，Windows 依赖数据目录 ACL；不进入列表、模型输出或调用元数据，stderr 丢弃。

## 证据区分

MCP 是本地真实协议；Bilibili/XHS 是 Mock/Dry-run。二者权限、目录、账号和数据源相互独立。真实模型跨平台活动证据见 `../evidence/model-extension-evidence.json`，不能将模拟内容称为真实平台访问。
