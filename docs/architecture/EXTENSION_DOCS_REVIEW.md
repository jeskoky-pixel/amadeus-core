# Amadeus 扩展测试文档完成与复核

任务：`b85b961f-ec33-4004-b8d5-f475849a0332`
范围：`docs/architecture` 新增文档。未修改代码、未修改既有文档、未提交。

## 1. 交付物

本轮新增六份中文文档：

| 文件 | 内容 |
| --- | --- |
| `AMADEUS_MCP_MANAGER_TEST.md` | MCP 本地真实协议测试、Hosted 仅本地 Bearer 模拟、stdio 非 OS 沙箱、admin/类别断言 |
| `AMADEUS_BILIBILI_MOCK_TEST.md` | Bilibili 模拟 fixture、能力、dry-run、证据、未来登录界面建议 |
| `AMADEUS_XHS_MOCK_TEST.md` | 小红书模拟 fixture、图片描述、字面搜索、证据、未来登录界面建议 |
| `AMADEUS_CROSS_PLATFORM_ACTIVITY_TEST.md` | 同一活动/Session 的跨平台模拟链路、3 条经历、State 效果、Desktop 证据 |
| `AMADEUS_PLATFORM_REAL_TEST_PLAN.md` | 真实适配器未来测试计划、登录 GUI 建议、验收门槛 |
| `EXTENSION_DOCS_REVIEW.md` | 本完成与复核记录 |

## 2. 阅读来源

### 2.1 代码

- `src/mcp/manager.js`、`src/mcp/store.js`
- `src/platforms/registry.js`、`src/platforms/mock-platforms.js`
- `src/core/activity.js`、`src/core/experiences.js`、`src/core/model-exploration.js`
- `src/core/runtime.js`、`src/index.js`
- `src/client/mcp-panel.js`、`src/client/platform-panel.js`

### 2.2 测试

- `tests/mcp-protocol.test.js`、`tests/mcp-security.test.js`
- `tests/fixtures/mcp-server.mjs`
- `tests/mock-platforms.test.js`、`tests/platforms.test.js`
- `tests/platform-budget.test.js`、`tests/platform-dryrun.test.js`
- `tests/activity.test.js`、`tests/activity-life-integration.test.js`
- `tests/model-exploration.test.js`、`tests/experience-generation.test.js`

### 2.3 既有文档

- `docs/architecture/AMADEUS_MCP_MANAGER_DESIGN.md`
- `docs/architecture/AMADEUS_PLATFORM_ARCHITECTURE.md`
- `docs/architecture/AMADEUS_PLATFORM_ADAPTER_SPEC.md`
- `docs/architecture/AMADEUS_CORE_TEST_REPORT.md`
- `docs/architecture/AMADEUS_EXPERIENCE_EVENT_SPEC.md`
- `docs/architecture/INCREMENTAL_PLATFORM_MCP_PLAN.md`

### 2.4 允许的证据

- `C:/Users/Jesko/Documents/ChatGPT/Amadeus/private/core-worker/model-extension-evidence.json`
- `C:/Users/Jesko/Documents/ChatGPT/Amadeus/private/core-worker/desktop-ui-checks.json`
- `C:/Users/Jesko/Documents/ChatGPT/Amadeus/private/core-worker/desktop-activity-check.json`
- `C:/Users/Jesko/Documents/ChatGPT/Amadeus/private/core-worker/desktop-module-toggle-checks.json`
- `C:/Users/Jesko/Documents/ChatGPT/Amadeus/private/core-worker/desktop-restart-checks.json`

未读取凭据文件、私密模型日志、`model-result.private.json`、`*.private.log` 或生产 Profile。

## 3. 本轮实际执行

使用 DSH 随附 Node `v24.21.0` 逐文件运行不依赖子进程的测试：

| 文件 | 结果 |
| --- | --- |
| `tests/mcp-security.test.js` | 3/3 |
| `tests/platforms.test.js` | 7/7 |
| `tests/mock-platforms.test.js` | 11/11 |
| `tests/platform-budget.test.js` | 2/2 |
| `tests/platform-dryrun.test.js` | 1/1 |
| `tests/activity.test.js` | 5/5 |
| `tests/activity-life-integration.test.js` | 2/2 |
| `tests/experience-generation.test.js` | 1/1 |
| `tests/model-exploration.test.js` | 9/9 |
| 合计 | 41/41 通过 |

未执行 `tests/mcp-protocol.test.js`：该文件需要启动真实 stdio 子进程和本地 HTTP 服务；本轮 `node --test` 及单文件运行受沙箱限制，创建子进程返回 `EPERM`。因此：

- 文档将两个 stdio + 一个 HTTP 写成“测试覆盖设计”，不是“本轮已执行”；
- `model-extension-evidence.json` 只能证明一次 `stdio-one` echo 调用完成；
- 没有任何本轮证据证明 HTTP MCP 连接或真实 Hosted 服务运行。

## 4. 关键边界复核

### 4.1 MCP

- **本地真实协议**：测试设计启动两个 stdio 与一个本地 Streamable HTTP，使用官方 SDK 传输和 JSON-RPC；不是 mock SDK。
- **Hosted 仅本地 Bearer 模拟**：本地 HTTP 校验 `Authorization: Bearer`，token 为合成值；没有真实 Hosted、OAuth、刷新、代理。
- **stdio 非 OS 沙箱**：绝对路径、禁 shell、环境白名单、stderr 丢弃只是配置约束；子进程仍以宿主用户权限运行。文档明确没有 OS 级隔离。
- **admin 类别断言**：外部 fixture 的 `instructions` 与工具描述包含 “ignore administrator permissions”，测试断言 system prompt 未被调用、列表仍标 `untrusted`；`category` 只有 `read`/`write`/`system`，没有 `admin` 类别，`write` 需显式 `allowSideEffects`。UI 的“管理员确认只读”是文案，不是权限等级。

### 4.2 平台

- 两个平台均为 `simulated: true`，数据为确定性合成 fixture。
- 所有结果 `evidenceLevel: 'simulation'`、`externalAction: false`。
- 社会操作只有 dry-run，默认关闭，需显式授权；没有真实登录、Cookie、网络或外发。
- 未来登录 GUI 在 Bilibili、XHS、真实测试计划三处均明确标为“建议、当前不存在这些按钮”。

### 4.3 模型证据

- 同一活动 `activity_5b65ca6d-ee31-4dd8-824c-b8060e100501`、同一 Session `session-1cab7905-9f1b-4429-9f4b-592b0415be37`。
- 3 条经历均 `stored`，`stateEffect` 均为 `applied`。
- `toolErrors: 0`，最终 `phase: "Idle"`。
- 顺序为 Bilibili `comments` → XHS `search` → XHS `comments`。
- 同一次运行中的 MCP 事件为 `stdio-one` echo 两次 `completed`。

### 4.4 Desktop 证据

- `desktop-activity-check.json`：同一活动、同一 Session 的 Bilibili/XHS 两条 `read` 经历，均有 `memoryId`。
- `desktop-restart-checks.json`：`sessionPreserved`、`eventsPreserved`、`explorationDisabled` 均为 true。
- `desktop-module-toggle-checks.json`：四个模块逐个禁用/恢复，Session 与事件保留。
- `desktop-ui-checks.json`：平台页明确显示“尚未支持真实平台连接；未连接、未登录”，没有 MCP 标签页。

## 5. 文档间一致性

- 五份文档对“模拟 vs 真实”的表述一致：平台全部模拟，MCP 仅有本地协议与本地 Bearer 模拟。
- 对“State 效果 applied”的解释一致：State 模块接受了模拟事件，不是真实兴趣或平台动作。
- 对未来登录界面的表述一致：建议步骤，不是现有按钮。
- 对 stdio 的表述一致：配置约束，不是 OS 沙箱。
- 对 `admin` 的表述一致：外部文本不构成权限，类别只有三类。

## 6. 发现但与本次范围无关的问题

### 6.1 既有平台适配器规范与实际代码不一致

`docs/architecture/AMADEUS_PLATFORM_ADAPTER_SPEC.md` 的部分表述仍停留在较早版本：

- 第 1 节称适配器只能 `read`、`search`、`browse`，`write`、评论、点赞、发布等一律拒绝；
- 第 8 节称 `makeSimulatedAdapter` 只支持 `browse`/`search`/`read`；
- 实际 `src/platforms/registry.js` 的 `OPERATIONS` 包含 `comments`、`related`、`subtitles`、`images` 与社会操作，`src/platforms/mock-platforms.js` 也确实实现读取扩展与社会 dry-run；
- 实际 `AMADEUS_PLATFORM_ARCHITECTURE.md` 已描述这些扩展能力。

新文档按**当前代码与平台架构文档**描述，没有沿用该规范的过时限制；也未修改既有文档。建议 Codex 单独评审是否更新 `AMADEUS_PLATFORM_ADAPTER_SPEC.md`，避免后续读者把“只有三种能力”当作现行契约。

### 6.2 MCP 设计文档与允许证据的粒度不同

`AMADEUS_MCP_MANAGER_DESIGN.md` 称 Codex 已实际运行两个 stdio + 一个 HTTP。该结论本轮无法从允许的证据 JSON 复核：允许证据只有 `stdio-one`。新文档没有否定既有记录，但把它归类为“既有设计记录”，本轮可复核证据单独列出。

### 6.3 会话期间观察到既有文档被外部更新

在本轮写作期间，`AMADEUS_CORE_DESIGN.md` 与 `AMADEUS_CORE_TEST_REPORT.md` 于 `2026/11/2 03:30:48` 被本代理之外的操作改写：

- `AMADEUS_CORE_TEST_REPORT.md` 从较早的 41 行“持续更新”版本变为 58 行“Alpha 集成与增量验收报告”，其中出现 `Core 76/76`、`实际本地 stdio/Streamable HTTP 协议` 等表述；
- `AMADEUS_CORE_DESIGN.md` 变为 33 行英文设计摘要。

本代理**没有写入**这两个文件，也没有把更新后的 `76/76` 或 HTTP 结论当作本轮执行证据。若这些更新来自 Codex 或另一并发 worker，应由其自行确认；本文件保持“本轮只可复核 41/41 与允许 JSON”的口径。两者可能在 MCP 协议状态上与本文措辞不同，但本文的“未在本轮运行 `mcp-protocol.test.js`”仍是准确的本轮记录。

## 7. 合规检查

| 约束 | 结果 |
| --- | --- |
| 只写 `docs/architecture` | 是，新增 6 个文件 |
| 不修改代码 | 是 |
| 不修改既有文档 | 是（本代理未写入；见 6.3 的外部并发更新） |
| 不读取凭据/私密模型日志 | 是 |
| 不使用 Web 搜索 | 是 |
| 不调用外部代理/子代理 | 是 |
| 不提交 git | 是（环境无 git 命令；未做任何提交） |
| 不声称未运行的测试通过 | 是；`mcp-protocol` 明确未执行 |
| 模拟证据标注 simulation | 是 |
| 未来登录步骤不写成现有按钮 | 是 |
| stdio 非 OS 沙箱 | 已明确 |
| admin 类别断言 | 已明确解释 |

## 8. 成功标准对照

| 成功标准 | 证据 |
| --- | --- |
| 五份中文事实性文档区分 mock 与真实协议证据 | 五份文件均设“证据边界/覆盖 vs 执行”章节；MCP 区分本地协议、本地 Bearer 模拟与真实 Hosted |
| 只写 `docs/architecture` | 六份新增文件均在该目录 |
| 不修改代码/既有文档 | 本文件第 7 节 |
| 写入完成总结 | 本文件 |

## 9. 剩余风险

1. `mcp-protocol.test.js` 本轮未执行，两个 stdio + HTTP 的“实际协议通过”仍只能由测试代码设计和既有记录支持。
2. 模型证据是单次验收运行，不是完整回归；不能替代全量测试。
3. 既有 `AMADEUS_PLATFORM_ADAPTER_SPEC.md` 的能力描述已落后于代码，可能误导后续实现者。
4. Desktop 证据没有 MCP 专用断言；不能据此宣称 MCP GUI 已验收。
5. 真实平台仍完全未实现；本计划不能作为上线依据。

## 10. 建议下一步

1. Codex 复核六份文档的边界表述，重点检查 `AMADEUS_MCP_MANAGER_TEST.md` 对“本地真实协议”与“Hosted 模拟”的区分。
2. 在允许子进程的隔离环境中运行 `tests/mcp-protocol.test.js`，单独记录两个 stdio + HTTP 的当前结果。
3. 单独评审是否修订 `AMADEUS_PLATFORM_ADAPTER_SPEC.md` 的过时能力描述；本次未修改。
4. 真实平台工作先完成 P0/P1 与许可证/条款评审，再考虑任何真实账号登录。

## Codex 最终复核

已补证：Core 全套 76/76，包含真实 MCP 协议；Desktop MCP GUI 会话与 Schema 选择器实际可用，重启恢复检查通过。旧平台规范已更新权限持久化与模拟社交能力，保留真实平台未实现边界。本文件为 worker 工作记录，最终结论以 AMADEUS_CORE_TEST_REPORT.md 为准。
