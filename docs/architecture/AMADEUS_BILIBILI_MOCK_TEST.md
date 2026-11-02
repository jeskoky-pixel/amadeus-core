# Amadeus Bilibili 模拟适配器测试说明

状态：仅模拟。当前没有真实 Bilibili 登录、网络请求、账号资料、评论、点赞或发布能力。
本文描述 `simulation-bilibili` 的 fixture、测试覆盖、已执行证据和未来登录界面建议；未来界面建议**不是现有按钮**。

## 1. 证据边界

- 平台 ID：`simulation-bilibili`。
- 数据来源：`src/platforms/mock-platforms.js` 中的 `buildBilibili()`，全部为确定性合成记录。
- 适配器不读取 Cookie、不打开 socket、不启动定时器、不访问数据库、不执行外部社交动作。
- 所有成功读取结果都带 `evidenceLevel: 'simulation'`、`externalAction: false`；Registry 还会重建可信信封，适配器不能伪造这些字段。
- 本文不把模拟结果写成真实 Bilibili 观察，也不把未执行的测试写成已通过。

## 2. Fixture 清单

`buildBilibili()` 只有两条合成视频，ID 固定：

| ID | 类型 | 标题 | 主要字段 |
| --- | --- | --- | --- |
| `robot-demo` | `video` | Synthetic robot demonstration | 作者、标签、描述、时长、字幕、关键帧占位、评论、相关视频 |
| `robot-faq` | `video` | Synthetic robot FAQ | 作者、标签、描述、时长、字幕、关键帧占位、评论、相关视频 |

- 作者使用 `simulation-bilibili:user:<local>` 前缀。两个平台故意复用相同本地用户名 `same-local`，但平台前缀不同，因此不会混淆身份。
- 字幕文本以 `[synthetic subtitle]` 开头，`synthetic: true`；关键帧是 `[synthetic keyframe placeholder]`，`analysis: 'placeholder-not-vision'`，没有做视觉识别。
- 评论、标签、相关视频均为本地合成数据；`relatedIds` 在 `robot-demo` 与 `robot-faq` 之间互指。
- 结果类型包括：`browse` 摘要列表、`search` 匹配列表、`read` 完整条目、`comments` 评论列表、`related` 相关条目、`subtitles` 字幕与关键帧。

## 3. 适配器能力与输入约束

`makeBilibiliMock()` 的能力集合为：

- 读取：`browse`、`search`、`read`、`comments`、`related`、`subtitles`
- 社会操作（仅 dry-run）：`like`、`favorite`、`comment`、`reply`、`follow`、`message`、`publish`

输入约束：

| 输入 | 约束 |
| --- | --- |
| `id` | 非空字符串，长度 ≤ 128 |
| `target` | 非空字符串，长度 ≤ 128 |
| `query` | 非空字符串，长度 ≤ 512 |
| `text` | 非空字符串，长度 ≤ 2000 |
| 发布文本 | 非空字符串，长度 ≤ 5000 |
| `comments`/`related` 的 `limit` | 1–50 的安全整数；缺省 10 |

- `search` 是**字面子串匹配**：对 `id`、`title`、`description`、`tags` 做小写化后的 `includes`，不是语义搜索，也不保证中文查询命中英文 fixture。
- `read` 未命中返回 `null`；`comments`/`related`/`subtitles` 未命中同样返回 `null`。
- `browse` 返回 fixture 前 10 条摘要；本 fixture 只有 2 条。
- 未知操作抛 `CORE_PLATFORM_UNSUPPORTED`；形状错误抛 `CORE_PLATFORM_INPUT`。
- 取消信号在读取和社会 dry-run 前检查，已取消时不返回观察或回执。

## 4. 社会操作只有 dry-run

七个社会操作都只校验输入形状，然后返回：

- `dryRun: true`
- `status: 'dry-run'`
- `receipt.receiptId` 形如 `simulation-bilibili:dry-run:<operation>:<target>`
- `receipt.externalAction: false`
- 固定说明 `Synthetic dry run only. No external platform request was made.`

回执没有 `remoteId`、`accessToken` 或其他远端标识。它可能被后续活动记录为模拟观察，但**不代表真实点赞、评论、关注、私信或发布**。当前 Registry 仍要求调用方显式授予对应社会能力，默认不授予；即使授予，也只得到 dry-run。

## 5. 测试覆盖

### 5.1 `tests/mock-platforms.test.js`（11 项，本轮 11/11 通过）

- 两个 mock 的适配器形状、ID、`contractVersion: 1`、`simulated: true`、冻结状态。
- mock 不自行声明 `enabled` 或 `permissions`，授权只属于 Registry。
- 能力集合包含 Bilibili 专属 `subtitles`，不包含 XHS 的 `images`。
- `robot-demo` 在两个平台都存在，但类型分别为 video/note，作者带平台前缀。
- Bilibili 的 `search`、`comments`、`related` 结果确定且可重复。
- 字幕与关键帧明确为占位，不是转录或视觉识别。
- `browse` 返回平台限定的摘要；`read` 未命中返回 `null`。
- 同一本地用户名在两个平台解析为不同作者。
- 所有社会操作可重复、字段固定、没有远端回执。
- 非法读取/社会输入被拒绝，不派发动作。
- 未知操作被拒绝；取消后不返回结果。

### 5.2 注册与权限路由

- `tests/platforms.test.js`（7/7 通过）验证默认禁用、写操作拒绝、并发预算、撤权、信封伪造防护、双平台共享可信 Session、重复注册拒绝。
- `tests/platform-dryrun.test.js`（1/1 通过）验证社会 dry-run 必须走 Registry 权限路由，两个平台的授权互不继承，禁用后拒绝。
- `tests/platform-budget.test.js`（2/2 通过）验证每日预算持久化、失败不退款、重启/重新注册后仍受限、时钟回拨不重置、取消的排队调用不派发。

### 5.3 活动与经历

- `tests/model-exploration.test.js`（9/9 通过）使用 `makeSimulatedAdapter`，不是 Bilibili 专用 mock，但验证了同一模拟平台在活动中的读写、Session 限制、步数预算、过期暂停、撤权后不写经历。
- `tests/activity.test.js`（5/5 通过）验证决策/适配器不返回、迟到结果、最大步数、稳定 Session 复用。
- `tests/experience-generation.test.js`（1/1 通过）验证跨数据代际不能读取旧收据。

## 6. 已执行证据

### 6.1 自动化

| 文件 | 结果 |
| --- | --- |
| `tests/mock-platforms.test.js` | 11/11 通过 |
| `tests/platforms.test.js` | 7/7 通过 |
| `tests/platform-dryrun.test.js` | 1/1 通过 |
| `tests/platform-budget.test.js` | 2/2 通过 |

这些是模拟契约和 Registry 路由的单元证据，不是 live 平台证据。

### 6.2 模型驱动证据

`model-extension-evidence.json` 可见：

- 第一次 `amadeus_explore_read`：`simulation-bilibili`、`comments`、`id: robot-demo`，目标为读取机器人演示评论。
- 对应经历 `experience_767ddf74...a807` 为 `status: "stored"`、`stateEffect: "applied"`。
- 整个运行 `toolErrors: 0`，活动最终 `phase: "Idle"`。

这说明模型通过受控工具读取了 Bilibili 模拟评论，并写入经历与 State 效果；它不表示访问了真实 Bilibili。

### 6.3 Desktop 证据

- `desktop-activity-check.json` 中一条 Bilibili 事件：`platform: "simulation-bilibili"`、`operation: "read"`、`step: 0`、`status: "stored"`，并带 `memoryId`。同一活动还有一条小红书事件。
- `desktop-ui-checks.json` 的平台页显示 Bilibili：“尚未支持真实平台连接；未连接、未登录。”
- `desktop-restart-checks.json` 显示 `sessionPreserved: true`、`eventsPreserved: true`、`explorationDisabled: true`，但没有 Bilibili 专用登录或网络断言。
- `desktop-module-toggle-checks.json` 验证四个模块的禁停/恢复不丢 Session 与事件，不验证真实平台。

## 7. 未覆盖与未验证

1. 真实 Bilibili 登录、Cookie、扫码、OAuth、账号资料与风控。
2. 真实视频播放、字幕抽取、关键帧视觉分析；当前只有合成文本和占位描述。
3. 真实评论、点赞、收藏、关注、私信、发布；当前只有 dry-run。
4. 真实网络、限流、重试、代理、证书与平台条款合规。
5. 真实平台内容审核、版权、隐私和账号封禁处理。
6. 中文语义检索：当前 `search` 只做字面子串匹配，不保证中文查询命中英文 fixture。
7. Desktop 原生外壳下的 Bilibili 登录流程与真实账号切换尚未实现，也未验收。

## 8. 未来登录界面：建议步骤（当前不存在这些按钮）

以下只是未来真实适配器通过评审后的**建议交互**，当前 `platform-panel.js` 没有登录按钮、二维码、账号绑定或凭据输入框。不得把它们描述为现有功能。

1. **适配器状态页**：显示“真实适配器未安装/未启用”，并明确当前只有 `simulation-bilibili`。
2. **选择认证方式**：在独立的“真实账号”区域提供官方 OAuth 或扫码入口；不得在模型工具或普通 HTTP API 中暴露登录能力。
3. **打开官方域**：只跳转经审核的官方域名，显示域名、用途和隐私说明；禁止自定义登录 URL。
4. **用户完成授权**：二维码/OAuth 由用户在外部官方页面完成，Core 不读取用户密码，不代理登录。
5. **Host 保存凭据**：令牌只进入 Host 的私有凭据存储，界面只显示掩码和引用 ID；不写日志、不进 MCP 配置、不进模型上下文。
6. **展示账号与权限**：显示账号昵称、平台 ID、授权范围、过期时间、最后验证时间；默认只读。
7. **逐项授权**：读取、评论、发布等能力分别确认；社会动作默认关闭，且每次外部动作前仍需明确授权。
8. **撤权与删除**：提供撤销令牌、清除账号、停止适配器的入口，并验证撤销后正在进行的调用被拒绝。
9. **证据标识**：真实读取结果必须显示独立于 `simulation` 的证据等级；未知回执必须显示为未知，不能自动重试或伪造成完成。
10. **网络与隔离说明**：显示出口域名、代理/证书策略和故障处理；不得把“连接成功”写成“已获授权”。

## 9. 验收建议

真实 Bilibili 适配器至少需要：

- 单独的许可证、平台条款和安全评审；
- 凭据由可信 Host 注入，模型和 HTTP 不能注册适配器；
- 只读默认、逐操作授权、预算、超时、撤权与网络域名限制；
- 结构化证据分级，明确区分 simulation、dry-run、live-read、live-write；
- 未知回执人工处理，禁止自动重试造成重复副作用；
- 使用隔离合成账号或测试账号，不触碰生产账号与真实社交对象。

在此之前，Bilibili 的准确状态是：**仅模拟 fixture，真实登录与社交能力尚未实现**。

## 10. 相关文件

- `src/platforms/mock-platforms.js`
- `src/platforms/registry.js`
- `src/core/activity.js`、`src/core/experiences.js`、`src/core/model-exploration.js`
- `tests/mock-platforms.test.js`、`tests/platforms.test.js`、`tests/platform-dryrun.test.js`
- `docs/architecture/AMADEUS_PLATFORM_ARCHITECTURE.md`
- `docs/architecture/AMADEUS_PLATFORM_ADAPTER_SPEC.md`
