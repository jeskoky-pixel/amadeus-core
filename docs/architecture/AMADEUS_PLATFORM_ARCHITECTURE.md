# Amadeus 独立平台架构

## 1. 定位与边界

平台系统是 Core 内部的独立能力域，与 QQ 通道、MCP 权限相互独立，权限不继承。
当前版本只提供**模拟（simulation）适配器**：Bilibili 与小红书（XHS）各自是独立条目，
数据全部为确定性、离线合成的 fixture。平台注册是可信代码行为，从不经由 HTTP 或模型操作触发；
本 alpha 只接受 `simulated: true` 的适配器，接入真实平台需要单独的鉴权与证据评审。

平台侧不读取 Cookie、不打开 socket、不启动定时器、不访问数据库，也不执行任何真实社会动作。
`src/platforms/mock-platforms.js` 在模块注释中明确这一约束；真实账号与真实能力尚未实现，
界面也标注“未登录真实账号 / 接入：Mock / 真实能力：尚未实现”。

## 2. 两个独立模拟平台

`PLATFORM` 固定两个 ID：

- `simulation-bilibili`：合成视频 fixture，含标题、作者、标签、字幕、关键帧占位、评论、相关视频。
- `simulation-xiaohongshu`：合成笔记 fixture，含标题、作者、标签、图片描述、评论、相关笔记。

两个平台使用各自的 `platform` 字段，结果统一由 `envelope()` 标记
`evidenceLevel: 'simulation'` 与 `externalAction: false`。
用户名故意在两端复用相同本地字符串，但通过 `平台:user:本地名` 前缀限定，
因此跨平台身份不会混淆。字幕与关键帧只提供合成文本/占位描述，
图片操作返回 `visionAnalysis: 'not-performed-synthetic-descriptions-only'`，
不对真实图片做视觉分析。

## 3. 能力与授权模型

读取能力：`browse`、`search`、`read`、`comments`、`related`，
以及 Bilibili 的 `subtitles`、XHS 的 `images`。社会能力：
`like`、`favorite`、`comment`、`reply`、`follow`、`message`、`publish`。

社会能力全部是 **dry-run**：只校验输入形状，返回带 `dryRun: true`、
`status: 'dry-run'` 与合成 `receiptId` 的回执，绝不向模块外转发。
输入有长度与类型上限（ID/target 128，评论 2000，发布文本 5000，query 512，
limit 1–50）；`comments`/`related` 的 limit 也会校验。
适配器还检查 abort signal，保证取消时不再继续。

`PlatformRegistry.register()` 校验适配器 ID、`contractVersion === 1`、
`simulated === true`、`execute` 函数及合法能力集合，拒绝重复 ID。
注册项默认 `enabled: false`、无权限、`maxRequests: 20`。
`configure()` 只接受适配器实际声明的权限，`maxRequests` 必须在 1–1000，
且每次配置都会递增 generation；重新配置**不会**重置已消耗额度。

## 4. 调用路由与共享 Core 身份

`execute(id, operation, input, identity, {signal})` 是唯一执行入口，按顺序：

1. 适配器不存在返回 `CORE_PLATFORM_UNAVAILABLE`。
2. 校验 Core 身份：`activityId`、`workspaceId`、`sessionId` 必须为非空字符串；
   这些身份由 Core 提供，并非平台账号或模型自报身份。
3. 校验平台已启用、操作合法且已获显式 permission，否则 `CORE_PLATFORM_DENIED`。
4. 刷新每日预算，已用次数达到上限则 `CORE_PLATFORM_BUDGET`。
5. **先扣费再派发**：预算写入磁盘、计数加一后才调用适配器；
   崩溃或结果不确定都不退款。
6. 适配器返回后再次校验启用状态、generation 与权限，被撤销则 `CORE_PLATFORM_REVOKED`。
7. 结果序列化不得超过 64 KiB；成功时生成事件信封，包含 `eventId`、平台、
   `accountId: null`、activity/workspace/session、`evidenceLevel: 'simulation'`、
   `observedEvidence`、`occurredAt` 与 `externalAction: false`。

每个平台条目有串行 `tail`，保证同一平台的调用不并发穿透预算检查。
`accountId` 为 `null`，因为模拟平台没有真实登录账号；共享的是 Core 的
活动/工作区/会话身份，而不是平台凭据。

## 5. 持久化每日预算

预算文件由 `budgetFile` 指定，默认结构为：

```json
{ "schema": 1, "day": 0, "used": { "platform-id": 0 } }
```

启动时严格校验 schema、day 为安全整数、used 的每一项为非负安全整数，
否则报 `CORE_PLATFORM_BUDGET_SCHEMA`。每次扣费通过 `atomicJson()` 原子写入。
日期按 UTC 天序号计算；只有 `day` 前进时才清零并写入新的一天。
时钟回拨不会被当作新预算：回拨后 day 不大于旧值，已花费的额度继续有效。
注册时还会把当天已用额度恢复进内存条目，避免重启绕过上限。

## 6. 客户端面板

`platform-panel.js` 从 `status.simulations` 读取两个模拟平台，提供：

- 平台切换与启用开关；
- 每日上限编辑（1–1000）；
- 读取能力与“社会操作（仅 Dry-run，默认关闭）”分组授权；
- 受控模拟调用，可填搜索词/文本/合成目标；
- 错误提示与调用后刷新。

面板明确说明：不登录真实账号、不读取 Cookie、不联网、不真实外发；
平台权限与 MCP 权限互不继承；被拒绝的调用不会执行平台动作。

## 7. 当前实现缺口

- 没有真实 Bilibili/小红书适配器，没有 OAuth、Cookie 或真实账号登录；
  不要将本文件描述为“已支持真实平台”。
- `makeSimulatedAdapter()` 是通用简易模拟器，仅支持 `browse`/`search`/`read`，
  与内置的 Bilibili/XHS mock 能力不同。
- 除了每日调用次数外，没有更细的限速、配额或费用模型。
- 媒体只有合成描述/占位，不做下载、解码或视觉识别。
- `comments`/`related` 等读取结果依赖 fixture 形状；未来新增 fixture
  若缺少字段会按空集合处理，但不代表真实平台行为。
- 预算与权限状态依赖本地文件；registry 自身只做单进程串行化，完整 Core 运行时另有数据根独占写者租约。
