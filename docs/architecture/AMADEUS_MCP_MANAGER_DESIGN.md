# Amadeus MCP 管理器设计

## 1. 目标与依赖

Core 的 MCP 客户端基于官方 SDK **2.3.0**（`@modelcontextprotocol/client` 及其 stdio 子路径），
使用其 `Client`、`StdioClientTransport` 与 `StreamableHTTPClientTransport` 完成协议握手、
工具发现与调用，**没有复制或自研协议实现**。

选用 2.3.0 而不是旧版，是因为需要修复安全公告 **GHSA-6prh-2h8m-c8cw**；
当前 `npm audit` 的生产依赖结果为 **0 个漏洞**。这是依赖选择的依据，
不表示已经验证所有第三方服务端。

已检查原生 DSH `mcp-client 0.2.1-rc.3`：它把连接封装在内部，并直接把远端工具、资源
和系统指令注册为全局能力，且依赖存在漏洞的 SDK 2.2.0。它没有公开、可控的连接注册表，
这些默认行为不符合 Core 的独立授权与提示词边界；强行代理内部服务会依赖未公开的连接细节。
因此 Core 不使用该封装，也不采用“直接注册全局工具”的模式。

## 2. 传输与配置校验

支持两种传输：

- **stdio**：`command` 必须是绝对路径；拒绝 `.cmd`、`.bat`、`.ps1`、`cmd.exe`、
  `powershell.exe`、`pwsh.exe`、`sh`、`bash`；参数最多 64 项；`cwd` 若提供必须为绝对路径。
- **Streamable HTTP**：URL 仅允许 http/https，禁止内嵌用户名、密码、query 与 fragment；
  明文 http 仅允许 `localhost`、`127.0.0.1`、`[::1]`。

配置还限制：超时 100–60000 ms，每日预算 1–10000，最多 20 个服务、
每个服务最多 128 个工具授权项；会话授权与工具授权必须显式给出。
未知字段一律拒绝（`CORE_MCP_UNKNOWN_FIELD`），避免把令牌等秘密悄悄留在公共配置里。
`mcp.json` 只保存配置与引用；保存通过 revision 乐观锁与备份文件完成，冲突报
`CORE_REVISION_CONFLICT`。

**stdio 没有 OS 沙箱承诺。** 上述绝对路径、禁止 shell 与清洗环境变量只是配置约束，
子进程仍以宿主用户的系统权限运行。需要更强隔离时应由外部操作系统/容器承担。

## 3. 凭据与脱敏

配置中不存明文秘密：

- HTTP 使用 `credentialRef`（形如 `secret_<uuid>`），连接时解析为 `Authorization: Bearer ...`；
- stdio 使用 `envRefs`（环境变量名 → secret 引用），连接时解析后注入清洗过的环境；
- 秘密保存在用户数据目录下的私有文件 `mcp-secrets.private.json`，与公共配置分离，
  从不通过列表或概览返回。

环境只保留 `PATH`、`Path`、`SystemRoot`、`WINDIR`、`TEMP`、`TMP`、`HOME`、
`USERPROFILE` 等白名单变量，再叠加显式引用。stdio stderr 被持续排空但不保留文本，
防止外部输出携带秘密；发现的工具描述、输入 schema 与调用结果在展示前经过
`redact`/`sanitize`，已知秘密会被替换为 `[redacted]`。
秘密值限制 8192 字符且禁止换行。

## 4. 工作区与会话信任

`McpManager.identity(sessionId)` 在每次列表与调用前强制校验：

- Core 运行时必须处于 `ready`；会话必须属于当前 Core workspace（通过 host 的
  member/ctx 查询），不接受模型自报的工作区或身份。
- QQ 会话要求 provenance 版本为 1，并通过宿主可信解析得到场景；
  场景平台必须是 `qq`、`verified === true`、类型为 `group` 或 `private`。
- 普通会话可复用 Memory 的持久化、Host 校验过的 provenance，
  但必须匹配 `dsh:session:<id>`、不携带 scene，并绑定会话创建时间。
- 首次见到 QQ 后，后续普通会话必须已登记且 `createdAt` 一致；
  `agentPreset` 必须在允许集合内。

只有通过上述检查，才会得到 `ordinary`、`qq-group` 或 `qq-private` 逻辑类型，
用于后续 grant 匹配。服务器工具**不会**被直接注册成全局工具、资源或系统指令；
没有服务端 instructions 注入路径，客户端只以空 capabilities 连接，
所有列出与调用都必须经过 Core 的两个受控入口：受门禁的列表与受门禁的调用。

## 5. 显式权限与调用门禁

权限模型是“每条服务器、每个工具、每个会话/场景”逐项授权：

- 工具条目包含 `enabled`、`category`（`read`/`write`/`system`）与
  `allowSideEffects`；非 `read` 类别必须同时显式允许副作用。
- 服务器必须启用，且当前 sessionId 或逻辑类型命中 `sessionIds`/`sessionTypes`。
- 列表只返回已连接服务器中通过门禁的工具，并标记 `untrusted: true`；
  未授权工具直接跳过。
- 调用还要求：连接状态为 `connected`、工具已发现、无并发 inflight
  （否则 `CORE_MCP_BUSY`）、距上次调用至少 100 ms（否则 `CORE_MCP_RATE_LIMIT`）。
- 参数必须是普通对象、序列化不超过 64 KiB，并通过该工具 inputSchema 的 AJV 校验。

所有外部工具描述、schema 与输出都按不可信数据处理，不构成指令。

## 6. 超时、预算与结果

每次发现与调用都用 `bounded()` 包裹：独立 AbortController + 定时器，
并链接外部取消信号；超时报 `CORE_MCP_TIMEOUT`。**超时或失败不会自动重试**，
调用只发生一次，避免副作用被重复执行。

每日预算在真正调用前由 `store.charge()` 扣除并持久化；失败、超时、
工具错误都不退款。日期前进时清零，服务端或工具结果不得改变额度。

结果先序列化为 JSON，超过 64 KiB 报 `CORE_MCP_RESULT_LIMIT`；
再解析并脱敏，返回 `{source:'mcp', serverId, toolName, untrusted:true, result}`。
调用返回后重新执行权限检查，并校验连接 generation/状态，防止调用期间被撤销或重连。
发现阶段对游标去重、最多 16 页，避免恶意分页循环。

## 7. 事件与可观测性

`mcp-events.json` 只记录**元数据**：`source`、`serverId`、`toolName`、`sessionId`、
`outcome`、`durationMs`、`occurredAt`。不记录参数、结果、stderr 或秘密。
事件保留最近 200 条，每次调用通过原子写入落盘；概览只暴露最近 50 条。
连接错误仅以固定错误码呈现，不保留外部文本。

## 8. 测试证据与当前缺口

Codex 已实际运行 **两个 stdio 服务 + 一个 Streamable HTTP 服务**的连接、工具发现与调用测试；
测试对象是本地/受控测试服务。本文件**不宣称**已测试真实 Hosted/provider 账号，
也不宣称做过生产环境变更。模拟平台结果始终标记为 simulation。

当前缺口：

- HTTP 仅支持 Bearer 引用，没有 OAuth 授权流程；也不提供自定义代理配置。
- 没有自动重连/自动重试；重连由配置保存或显式连接触发。
- 只处理工具，不提供 MCP resources、prompts 或服务端 instructions 的受控接入。
- stdio 依赖宿主机隔离，本实现不提供 OS 级沙箱。
- 秘密以私有 JSON 文件保存，依赖用户数据目录的文件权限，未额外加密。
- 子系统没有分布式配额服务；Core 数据根的独占写者租约防止多个正常 Host 同时写入。

## 合并前授权说明修订

qq-group / qq-private 是当前 Core Workspace 内可信同类型 Session 的批量授权，包含之后新增的已验证成员。qq-private 不限 Owner。具体 Session 与类型授权为 OR，移除具体 ID 不抵消类型授权。初始没有任何授予，工具初始关闭。GUI 已增加中英文提醒，权限实现未改变。

服务目录只是基础参考入口，当前一个官方 filesystem 示例，未预装/未部署，不是完整 Hosted MCP Market。真实平台仍仅 Mock，与 MCP 目录分离。
