# Reviewed integration decision — 2026-11-03

Primary reviewed checkout: xpzouying/xiaohongshu-mcp d6352e5435b45ebb48fe240dc03a2bec0476bd56 (Apache-2.0). Secondary: ShunL12324/xhs-mcp cb963621390dfa22d19103ed88ab55a3d57a74ba (MIT). These are source snapshots, not proof of real account behavior.

Decision: prefer an optional Core-native HTTP execution backend for the Go service. Core retains Workspace/Scene identity, Life scheduling, State interests, Persona, Memory, grants, budget and uncertain-send journal. Do not expose upstream unrestricted MCP tools or probability-based explore as a bypass. Do not migrate current cookies silently or give a new backend prior write grants. Windows private messages remain unverified; no claim of support.

Before default integration: pin executable and browser versions/checksums; loopback binding with private token; isolated explicit cookie path per Workspace; validate profile identity; map operation receipts and unknown-send behavior; GUI install/start/stop/health; restart/rollback tests. Latest source downloads a project-specific browser from cdn.one-world.ai, not system Edge. The Windows v2.7.0 executable downloaded successfully; SHA256 0b03fa24b00f15fffa34fff3c10ef9d938a5f0c3e7fb51ee46c8fc6437dd622b. Its -help invocation succeeds. This does not establish service/browser/account functionality. Automatic approval policy rejected launching the isolated service without stating a specific reason; no alternative launch attempted. Therefore service health/login/read/write acceptance remains NOT RUN.

Alpha.5 independently fixes Core's Host lifecycle. Host polls pending accounts, UI reads status only. Closing a settings component no longer owns login completion. Core 158/158 and two real browser synthetic fixtures pass, build/pack pass. No external social action tested. This revision does not claim that an actual XHS login is accepted, nor does it bundle third-party source/binaries. No module schema migration.

---

# 小红书 MCP 两个本地仓库的集成对比

> 范围：仅静态阅读本地检出 `xiaohongshu-mcp/` 与 `xhs-mcp/`，未联网、未运行上游程序、未登录/发布/点赞，也未执行任何测试。下文“具备/可用”均指源码中存在对应实现，**不代表真实环境验证成功**。

## 速览

| 维度 | `xiaohongshu-mcp` | `xhs-mcp` |
|---|---|---|
| 技术栈 | Go 1.27.3、Gin、go-rod、官方 MCP Go SDK | TypeScript、Bun/Node、patchright（Playwright 分支）、SQLite |
| 许可证 | Apache License 2.0 | MIT |
| 账号模型 | 单账号，单个 `cookies.json` | 多账号，账号状态存 SQLite |
| 登录控制 | 服务端后台 goroutine 等扫码，客户端只轮询登录态 | 显式 `sessionId` 状态机，客户端轮询会话 |
| HTTP 面 | REST `/api/v1/*` + `/mcp` | 仅 MCP `POST /mcp`（另有 `/health`、`/`） |
| 浏览器来源 | 强制下载项目内置 Chromium | 依赖本机 Chrome 渠道 + patchright |
| 特色能力 | 图文/视频发布、检索、互动、通知 | 多账号池、自动浏览 Explore、媒体下载、草稿/AI |

## 1. 许可证

- `xiaohongshu-mcp/LICENSE` 为 Apache License 2.0；README 明确“可自由使用、修改、分发，包括商业用途，需保留版权声明和许可证文件”（`xiaohongshu-mcp/README.md:1101`）。
- `xhs-mcp/LICENSE` 为 MIT（版权行为 ShunL12324），`xhs-mcp/package.json` 的 `"license": "MIT"` 一致。
- 集成含义：两者都可作为独立进程/依赖使用；Apache-2.0 需保留 NOTICE/变更声明类义务，MIT 需保留版权与许可声明。此处只做许可证事实对比，不构成法律意见。

## 2. 服务端持有的登录生命周期

### `xiaohongshu-mcp`

- `GET /api/v1/login/qrcode` 由服务端创建浏览器、抓取小红书页面二维码 `src`，然后返回图片地址和超时时间；若未登录，服务端把页面交给后台 goroutine 等扫码，默认 4 分钟（`xiaohongshu-mcp/service.go:138`、`xiaohongshu-mcp/xiaohongshu/login.go:90`）。
- 扫码成功后服务端直接抓取浏览器 cookies 并写入 `cookies.json`，浏览器关闭；失败或超时只记日志（`xiaohongshu-mcp/service.go:175`）。
- `loginSessions` 用互斥锁 + 递增序号保证**同一时刻只有一个待扫码会话**：再次获取二维码会取消上一个会话，避免浏览器堆积（`xiaohongshu-mcp/login_session.go:10`）。
- 客户端没有“登录会话 ID”，只能调用 `GET /api/v1/login/status` 探测当前是否已登录；该接口每次新开浏览器访问首页判断（`xiaohongshu-mcp/routes.go:50`、`xiaohongshu-mcp/service.go:106`）。
- 因此：登录生命周期由服务端拥有，但状态粒度粗，适合单账号、单实例；进程重启后未完成的扫码等待丢失。

### `xhs-mcp`

- `LoginSessionManager` 是进程内单例，维护 `Map<sessionId, LoginSession>`；每个会话独占 browser/context/page，并定期清理超过 5 分钟的会话（`xhs-mcp/src/core/login-session.ts:124`、`:714`）。
- 状态机显式：`waiting_scan → scanned → verification_required → success / failed / expired`；二维码 2 分钟、短信验证码 1 分钟、会话最长 5 分钟（`xhs-mcp/src/core/login-session.ts:33`、`:72`、`:282`）。
- 客户端先调 `xhs_add_account` 拿 `sessionId + qrCodeUrl`，再反复调 `xhs_check_login_session`；需要短信时调 `xhs_submit_verification`（`xhs-mcp/src/tools/account.ts:302`、`:352`、`:486`）。
- 登录成功时保存 Playwright `storageState`，创建/更新账号并写入资料与操作日志，然后关闭该登录浏览器（`xhs-mcp/src/tools/account.ts:362`、`xhs-mcp/src/core/login-session.ts:665`）。
- 二维码图片不是小红书页面原图，而是把 `xhsdiscover://qrcode/login?...` 交给第三方 `api.qrserver.com` 生成（`xhs-mcp/src/core/login-session.ts:20`、`:247`）。这引入一个额外的外部服务依赖。
- 因此：同样是服务端拥有登录，但支持多会话、明确阶段和短信验证；代价是更多内存/浏览器实例和外部二维码服务。

## 3. HTTP 接口面

### `xiaohongshu-mcp`

- 非鉴权：`GET /health`（`xiaohongshu-mcp/routes.go:24`）。
- 鉴权组：`/mcp`、`/mcp/*path` 与 `/api/v1/*`；只有配置了 `AUTH_TOKEN`/`-token` 才启用 Bearer 校验，留空则全部放行（`xiaohongshu-mcp/middleware.go:13`、`xiaohongshu-mcp/main.go:22`）。
- REST 端点覆盖：登录状态/二维码/删 cookies、发布图文/视频、feeds 列表/搜索/详情、用户主页/我的主页、评论/回复、点赞/收藏、通知未读/列表/回复/点赞（`xiaohongshu-mcp/routes.go:48`）。
- MCP 使用 Streamable HTTP，`Stateless: true`、`JSONResponse: true`，并加跨站请求保护（`xiaohongshu-mcp/routes.go:27`）。
- 默认端口 `:18060`（`xiaohongshu-mcp/main.go:23`）；CORS 为 `*`。

### `xhs-mcp`

- 仅 `POST /mcp`；`GET /mcp`、`DELETE /mcp` 返回 405；另有 `GET /health` 和 `GET /` 信息页（`xhs-mcp/src/http-server.ts:59`、`:154`、`:184`）。
- 每个请求新建 stateless transport/server；CORS 为 `*`，没有鉴权层（`xhs-mcp/src/http-server.ts:35`、`:47`）。
- 没有 REST 业务 API，所有业务能力必须通过 MCP 工具调用；默认端口同样是 `18060`（`xhs-mcp/src/http-server.ts:23`、`xhs-mcp/src/core/config.ts:56`）。
- HTTP 启动实现直接调用 `Bun.serve`（`xhs-mcp/src/http-server.ts:216`），而 `package.json` 的 `engines` 写的是 Node >=18；若用 Node 走 HTTP 模式，该入口并不成立。stdio 模式不受此限。
- 集成含义：两者默认端口相同，不能在同一端口并行；Go 版更适合“REST 客户端 + MCP 客户端”混合接入，TS 版只能走 MCP。

## 4. Cookies 与会话持久化

### `xiaohongshu-mcp`

- 单文件 `cookies.json`：路径优先级为 `COOKIES_PATH` → 当前工作目录 `cookies.json` → 旧路径 `os.TempDir()/cookies.json`（`xiaohongshu-mcp/cookies/cookies.go:127`）。
- v2 格式为 `{version, seed, saved_at, cookies}`，cookies 用 `RawMessage` 原样透传；兼容 v1 裸数组（`xiaohongshu-mcp/cookies/cookies.go:12`、`:50`）。
- 浏览器创建时读取该文件并注入 go-rod（`xiaohongshu-mcp/browser/browser.go:89`）；扫码成功后整包覆盖保存（`xiaohongshu-mcp/service.go:629`）。
- 删除登录态即删除该文件；没有数据库、没有账号隔离（`xiaohongshu-mcp/service.go:98`、`xiaohongshu-mcp/cookies/cookies.go:118`）。
- Windows 注意：默认路径取决于进程当前目录，作为服务/计划任务运行时工作目录可能不是预期目录；建议显式设 `COOKIES_PATH`。

### `xhs-mcp`

- 每个账号的 Playwright `storageState`（cookies + localStorage）序列化后存 SQLite `accounts.state` JSON 列，数据库默认 `~/.xhs-mcp/data.db`（`xhs-mcp/src/db/schema.ts:13`、`xhs-mcp/src/core/config.ts:63`）。
- 账号池创建客户端时把 `state` 作为 `storageState` 注入浏览器上下文；`onStateChange` 回调把新状态回写数据库（`xhs-mcp/src/core/account-pool.ts:71`、`xhs-mcp/src/xhs/clients/context.ts:56`）。
- 登录成功时 `accounts.updateState` 落库；重新登录按 `userId` 复用旧账号并替换状态（`xhs-mcp/src/core/account-pool.ts:173`）。
- `xhs_delete_cookies` 把数据库 `state` 置空并关闭客户端，但保留账号行、资料和历史记录（`xhs-mcp/src/tools/interaction.ts:452`）。
- 因此：TS 版是真正的多账号会话持久化；Go 版是单账号文件级持久化，接入多账号需要外部多实例/多工作目录。

## 5. Windows 与浏览器依赖

### `xiaohongshu-mcp`

- 代码明确“只用内置浏览器”，启动即调用 `EnsureBrowser()`，失败直接退出，不会回退系统 Chrome（`xiaohongshu-mcp/main.go:32`、`xiaohongshu-mcp/browser/browser.go:56`）。
- 内置浏览器仅支持 darwin/arm64、linux/amd64、windows/amd64；Windows 下载 `windows-x64.zip` 并解出 `chrome.exe`（`xiaohongshu-mcp/browser/browser_download.go:40`）。
- 首次运行从 `https://cdn.one-world.ai/browsers` 下载约 140–190MB，校验 `SHA256SUMS` 后解压到用户缓存目录（`xiaohongshu-mcp/browser/browser_download.go:24`、`:69`、`:92`）。
- 启动依赖网络（仅首次下载）和写缓存权限；离线需手工放置文件。除 Windows x64 外的架构会直接报“不支持”（`xiaohongshu-mcp/browser/browser_download.go:52`、`:73`）。
- 注意 README 中“直接在常用浏览器 (Chrome/Edge) 运行”描述的是其推荐的另一个 `x-mcp` 浏览器插件方案（方案 B），不是本仓库的运行方式（`xiaohongshu-mcp/README.md:21`、`:25`）；本仓库代码只允许内置 Chromium。Windows 指南还要求把 leakless 临时目录加入杀毒排除项（`xiaohongshu-mcp/docs/windows_guide.md:62`、`:100`）。

### `xhs-mcp`

- 使用 patchright 启动，`channel: 'chrome'`，并设置 `BROWSER_ARGS`、桌面 viewport；即运行机需有可用的 Chrome 渠道（`xhs-mcp/src/xhs/clients/context.ts:56`、`xhs-mcp/src/core/login-session.ts:157`）。
- `postinstall` 执行 `patchright install chromium`（`xhs-mcp/package.json`），但显式 `channel: 'chrome'` 仍不是纯内置 Chromium 路径；两者是否一致需实机确认。
- 依赖 `better-sqlite3`、`canvas`、`sharp` 等原生模块，Windows 上需要匹配的运行时可用的预编译包或构建工具链（`xhs-mcp/package.json` 依赖列表）。
- HTTP 模式实际要求 Bun（`Bun.serve`），Node 仅能跑 stdio 路径（`xhs-mcp/src/http-server.ts:216`）。

## 6. Explore 与下载能力

### Explore

- `xhs-mcp` 提供 `xhs_explore` / `xhs_stop_explore`：按 `duration`（10–600 秒）、`interests`、`openRate/likeRate/commentRate` 自动浏览、开笔记、点赞和评论（`xhs-mcp/src/tools/explore.ts:19`、`:100`）。
- 该能力依赖账号池、数据库会话日志，以及 Gemini；未配置 `GEMINI_API_KEY` 时 AI 选择/评论会直接报错（`xhs-mcp/src/core/explore-ai.ts:102`、`xhs-mcp/src/tools/explore.ts:140`）。
- `xiaohongshu-mcp` 没有自动浏览 Explore 的对等工具；仅有 feeds 列表/搜索/详情等接口（`xiaohongshu-mcp/routes.go:55`）。这是一个明确的能力缺口，而不是配置差异。

### 下载

- `xiaohongshu-mcp` 的 `pkg/downloader` 只服务于发布：把图片 URL 抓取到本地后校验图片类型、30 秒超时、带 Windows Chrome UA/Referer（`xiaohongshu-mcp/pkg/downloader/images.go:41`、`:53`）。它没有“下载笔记媒体”的独立工具。
- `xhs-mcp` 的 `xhs_download_images` / `xhs_download_video` 先通过浏览器取笔记详情，再用 Node http/https 直连下载，跟随 301/302、60 秒超时、写入按 noteId 分目录的下载路径并记录数据库（`xhs-mcp/src/tools/download.ts:76`、`:137`、`:233`）。
- 两者下载都不带登录 Cookie 注入（媒体 URL 通常直连即可，但真实可用性未验证）。

## 7. 集成层面的关键事实

1. **进程边界**：两者都能作为独立 HTTP/MCP 进程被调用，不必嵌入同一运行时；Go 版同时提供 REST 和 MCP，TS 版只有 MCP。
2. **状态归属**：Go 的登录态是单文件、单账号、进程外可替换；TS 的登录态是 SQLite 内多账号记录，删除工具只清状态不清账号。
3. **默认端口冲突**：两者默认均为 `18060`，同机部署需改端口。
4. **鉴权不对称**：Go 可选 Bearer Token，TS 的 HTTP 入口无鉴权；若暴露到非本机网络，风险边界不同。
5. **Windows 成本不对称**：Go 需要首次下载内置 Chromium（仅 x64）并处理杀软误报；TS 需要本机 Chrome、Bun（HTTP 模式）和原生模块工具链。
6. **能力不对称**：TS 多出 Explore、媒体下载、多账号池；Go 多出 REST 全套业务端点、通知接口和一个更简单的单账号部署形态。

## 8. 验证状态与限制

- 本文所有结论来自源码与仓库内文档，**没有**启动任一服务、没有执行 `go test`/`bun test`、没有调用小红书接口、没有验证二维码登录、发布、下载或 Explore 的实际成功率。
- 仓库中存在单元测试文件（如 `xiaohongshu-mcp/login_session_test.go`、`xiaohongshu-mcp/cookies_test.go`、`xiaohongshu-mcp/routes_test.go`），但本次未运行，不能据此声称“测试通过”。
- 两个仓库均未提供可核验的、针对当前 Windows 环境的实时成功记录；因此不应把任何 README 功能描述等同于线上可用。

## 引用文件

- `xiaohongshu-mcp/routes.go`、`login_session.go`、`service.go`、`main.go`、`middleware.go`、`handlers_api.go`
- `xiaohongshu-mcp/browser/browser.go`、`browser/browser_download.go`、`cookies/cookies.go`
- `xiaohongshu-mcp/pkg/downloader/images.go`、`processor.go`
- `xiaohongshu-mcp/xiaohongshu/login.go`、`docs/windows_guide.md`、`README.md`、`LICENSE`
- `xhs-mcp/src/core/login-session.ts`、`core/account-pool.ts`、`core/explore-ai.ts`、`core/config.ts`
- `xhs-mcp/src/tools/account.ts`、`tools/explore.ts`、`tools/download.ts`、`tools/interaction.ts`
- `xhs-mcp/src/xhs/clients/context.ts`、`services/auth.ts`、`services/explore.ts`
- `xhs-mcp/src/http-server.ts`、`src/db/schema.ts`、`package.json`、`README.md`、`LICENSE`
