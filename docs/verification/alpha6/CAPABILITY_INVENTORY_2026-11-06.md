# Alpha 6 能力目录（源码事实）

日期：2026-11-06

本文是**源码能力目录**，不是运行验收覆盖表。它只说明当前 alpha6 实现已经注册、暴露或明确保留的入口，以及代码中写明的条件与边界；不证明任何平台、账号、网络或真实用户数据路径已经通过验收。最终真实运行结果由 Codex 的私有验收覆盖表关联。

本文不记录账号、凭据、私有 ID、运行状态或测试通过数量。测试列只列现有相关测试文件；“需人工核对”表示该能力找不到可直接对应的现有测试，不能据此推断已验证。

## 1. Core 编排、平台入口与经历

| 能力 | 具体工具或入口 | 现有测试文件 | 条件或实现边界 |
|---|---|---|---|
| Core 单工作区与模块挂载 | Core 面板“设置”页；`/api/amadeus-core/configure`、`/apply`；Memory/Life/State/Persona 子插件 | `core-host.test.js`、`core-http.test.js`、`ownership-guard.test.js`、`migration.test.js` | 只绑定一个 DSH Workspace；写入租约与 legacy entry 冲突会阻止启动；不自动合并另一套历史 |
| Core 平台能力探测 | `amadeus_platform_capabilities` | `platforms.test.js`、`real-platforms.test.js`、`platform-owner.test.js` | 只返回已安装适配器与当前 Activity Session 的授权；不含凭据 |
| 受控平台只读 | `amadeus_explore_read` | `model-exploration.test.js`、`activity.test.js`、`platform-dryrun.test.js`、`real-platforms.test.js` | 仅 Activity Session；支持实际适配器声明的 read/search/browse/comments/related/subtitles/images；模拟证据明确标注；不声称完整观看 |
| 平台互动 | `amadeus_platform_interact` | `platform-social.test.js`、`bilibili-social.test.js`、`xhs-browser.test.js` | 仅 Activity Session；需要平台级操作授权；目标须来自已观察内容；不回放未知操作 |
| 结束探索 | `amadeus_explore_finish` | `model-exploration.test.js`、`activity.test.js` | 只结束当前 Core 探索；不创建额外调度 |
| 单条经历读取 | `amadeus_experience_read` | `experience-generation.test.js`、`live-experiences.test.js`、`experience-recall.test.js` | eventId 格式校验；先通过 Memory ACL + delivery，之后才读取原始证据；缺失/损坏不伪造 |
| MCP 工具发现/调用 | `amadeus_mcp_list`、`amadeus_mcp_call` | `mcp-protocol.test.js`、`mcp-security.test.js`、`mcp-ui.test.js` | 只列出当前 Session 被授权的外部 MCP 工具；外部结果视为不可信数据；未知副作用不自动重试 |
| 平台注册、预算与模拟 | Core 平台页；`/platform/configure`、`/platform/read`、`/platform/action`、`/platform/dry-run`、`/simulate` | `platforms.test.js`、`platform-budget.test.js`、`platform-owner.test.js`、`mock-platforms.test.js` | 平台与 MCP 独立；失败不回退为 Mock；模拟只执行合成 Dry-run；预算与冷却在授权前检查 |
| 数据导入/回退与代际 | Core 设置页；`/import`、`/rollback`；`dataGeneration` | `import-config.test.js`、`migration.test.js`、`experience-generation.test.js` | 需要旧插件条目可核实路径；不覆盖现有用户数据；回退后旧 generation 的 event 不能解析到替代库 |
| Core 面板 | 总览、人格、记忆、状态、生活、平台、MCP、经历、设置九个页签 | `memory-form.test.js`、`memory-settings-render.test.js`、`life-session-picker.test.js`、`experiences-ui.test.js`、`mcp-ui.test.js` | UI 只调用受保护 Host API；平台页不替代平台自身登录/授权 |
| 经历时间线（Core UI） | Core“经历”页签 | `experiences-ui.test.js`、`core-http.test.js` | 展示来源、状态与 eventId；标题/文本不代表完整视频理解 |

## 2. Memory（高级能力）

### 2.1 长期记忆与检索

| 能力 | 具体工具或入口 | 现有测试文件 | 条件或实现边界 |
|---|---|---|---|
| 长期记忆保存/检索/列表/读取 | `memory_save`、`memory_search`、`memory_list`、`memory_get` | `tools.test.js`、`service.test.js`、`service-search.test.js`、`recall-layer.test.js`、`search-fusion.test.js`、`inject.test.js` | 写入按 `(type,title,scope)` 去重；检索含关键词、向量、BM25、可选实体轴；ACL 在最终边界过滤 |
| 修正/遗忘/归档/删除 | `memory_update`、`memory_forget`、`memory_archive`、`memory_delete` | `tools.test.js`、`api.test.js`、`updated-at-semantics.test.js`、`content-hash.test.js` | `memory_archive` 可被 `disableMemoryArchive` 隐藏；删除是物理移除；遗忘保留行但不注入/检索 |
| 作用域闸门 | `set_scope_state`；Memory 面板 scope 卡 | `scope-state.test.js`、`scope-inject-soft.test.js`、`scope-strict.test.js`、`scope-retrieval.test.js` | 两维 agent/workspace 暂停；需要 scopeState 开关；不是删除或遗忘 |
| 可注入上下文（Hot Memory / 热记忆） | 自动注入路径；无独立模型工具 | `hot-memory.test.js`、`inject.test.js`、`inject-rotation.test.js`、`inject-heat.test.js`、`inject-recall.test.js` | 只读会话最近轮次；不新增写入工具；注入受 scope/ACL/预算约束 |
| 语义/混合检索与 rerank | `memory_search` 的 `mode`/`semantic`/`rerank`；`embedding`/`reranker` 配置 | `search-fusion.test.js`、`semantic.test.js`、`embedding-ready.test.js`、`reranker.test.js`、`reranker-single-logit.test.js` | 向量/rerank 失败降级关键词；本地嵌入运行时可选，未就绪不阻塞普通写入 |
| 本地推理运行时 | `memory_runtime`（status/provision/verify） | `runtime-loader.test.js`、`runtime-provision.test.js`、`runtime-verify.test.js`、`local-embedder.test.js` | 只在用户显式调用时检查/取回/验证本地运行时；启发式下载有体积成本；不改变普通记忆写入，不是平台能力 |

### 2.2 高级存储形态

| 能力 | 具体工具或入口 | 现有测试文件 | 条件或实现边界 |
|---|---|---|---|
| 热记忆（Hot Memory） | Memory 设置与注入；无模型工具 | `hot-memory.test.js`、`inject.test.js` | Session 级、有界；随会话历史变化；不是跨会话长期记忆 |
| RecentContext | 无活动入口 | 需人工核对 | 源码仍存在，但 Workspace runtime 将 `recentContextEnabled` 作为 retired flag 强制关闭；不是当前可用能力 |
| RecentActivity | `memory_recent_activity` | `recent-activity.test.js`、`recent-runtime.test.js`、`admin-recent.test.js`、`scene-recent-core.test.js` | 仅在选中 Workspace 且 `recentActivityEnabled` 为真时注册；跨 Session 只返回安全摘要；不是长期记忆，也不是授权票据 |
| Core 保护记忆 | `memory_core_save`；Core/记忆面板核心记忆入口 | `memory-management-api.test.js`、`scene-recent-core.test.js` | 仅 `coreMemoryEnabled` 且可信 admin private Scene；模型不能指定 protected/role；普通保存路径拒绝伪造 |
| 文档记忆 | `memory_register_document`；Memory 文档页/API | `document.test.js`、`document-dir.test.js` | 只存 summary + doc_path + evidence 指针；全文留在磁盘；证据全伪造会拒绝；不自动改文档文件 |
| 主动整理 | `memory_organize`；Memory 维护卡 | `organize.test.js`、`organize-tool.test.js` | 默认隐藏；`organizeEnabled` 打开才注册；ACL/严格 Scene 下额外隐藏；不自动删除内容 |
| 实体与身份 | 实体/图谱页；`entity:`/`attr:` 检索；`memory_identity_lookup`（受限） | `entities.test.js`、`identity.test.js`、`entity-recall.test.js`、`graph-api.test.js`、`graph-anchoring.test.js` | 实体抽取默认关闭；`memory_identity_lookup`/`memory_preference_get` 在统一 ACL/严格 Scene 下隐藏；同名实体不静默合并 |
| 实体抽取状态 | 实体页空态；`/api/dsh-mneme/entities` 的 `status`；`/api/amadeus-memory/admin/status` | `entity-extraction-status.test.js`、`entity-extraction-status-api.test.js`、`entities.test.js` | 默认关闭；开启后需重载才安装 hook；状态区分关闭/待重载/处理中/失败/无数据；不自动回填历史 |
| 偏好权重 | `memory_preference_get`（受限）；偏好/权重 API 与面板 | `preferences.test.js`、`graph-weight-evolution.test.js`、`inject-heat.test.js` | 默认关闭；权重只在 opt-in 后有界排序；不改变 ACL 或删除 |
| 权重演化与热衰减 | 设置中的 heat/weight/decay 参数；图谱/状态面板 | `graph-weight-evolution.test.js`、`heat.test.js`、`inject-heat.test.js`、`sleep-heat.test.js` | 有界乘数；不主导语义排序；热度不授予读取权 |

### 2.3 Dream、Sleep、ACL、备份与流水线

| 能力 | 具体工具或入口 | 现有测试文件 | 条件或实现边界 |
|---|---|---|---|
| autoDream 巩固 | 后台 Dream/Sleep 调度；`/dream-status`、状态面板 | `dream.test.js`、`dream-merge-guardrail.test.js`、`dream-archive-guardrail.test.js`、`dream-failure-backoff.test.js`、`dream-peak-hours.test.js`、`dream-candidate-hybrid.test.js` | 需 autoDream 开关；有候选/预算/失败退避；不自动回填历史实体；审计落 `dream_runs` |
| Sleep 相位 | 后台 Sleep；Memory 状态/设置 | `sleep.test.js`、`sleep-action-set.test.js`、`sleep-heat.test.js`、`sleep-scheduler-rearm.test.js` | 需 sleepMode；空闲触发；有动作集、冲突/模式/归档预算；不新增调度器 |
| 矛盾冻结 | 设置开关；冲突待审查面板 | `conflict-freeze.test.js`、`audit.test.js` | 默认关；冻结不自动合并；可人工处理 |
| 统一 Session ACL（Learn / Borrow） | Memory 面板“统一 ACL”卡；`/api/amadeus-memory/admin/unified` | `unified-session-acl.test.js`、`unified-learning.test.js`、`unified-runtime.test.js`、`unified-background.test.js`、`scene-recent-core.test.js` | 默认关闭；Core 强制开启统一 ACL；授权按 source key；Learn 保留合法学习成果，Borrow 撤权后停止新读取；不能凭标题/显示名授权 |
| 跨会话经历/记忆读取 | Memory 工具 + `amadeus_experience_read`；统一 ACL 授权 UI | `unified-runtime.test.js`、`unified-session-acl.test.js`、`experience-recall.test.js` | 目标 Session 必须先有 Learn/Borrow 或 Owner `owner_read`；`permissionScope` 字符串本身不是授权 |
| 备份/恢复/迁移 | Memory 设置备份卡；`/backup`、`/restore`；Workspace 绑定文件 | `backup.test.js`、`skip-invalid-restore.test.js`、`baseline-persist.test.js`、`workspace-binding.test.js`、`reindex-backfill.test.js` | 恢复需重启；备份为 SQLite 一致性快照；不覆盖运行中的用户数据；不自动把旧库当当前库打开 |
| 历史导入/路径隔离 | Core 导入；Memory Workspace 绑定 | `import-config.test.js`、`migration.test.js`、`admin-workspace.test.js`、`workspace-runtime.test.js` | 旧数据不自动合并；未绑定 Workspace 不写自主记忆；旧控制根库被忽略 |
| 可选 Action Pipeline（M.O.） | `/mo-run start/stop/status/confirm`；Memory 面板 M.O. 视图；动作候选 | `pipeline.test.js`、`pipeline-command.test.js`、`pipeline-runner.test.js`、`pipeline-exec.test.js`、`pipeline-confirm.test.js`、`pipeline-nudge*.test.js` | `actionPipelineEnabled` 默认关；不自动发布；动作候选需确认；不是平台执行器 |
| 蒸馏/压缩 | 后台 autoSummarize、distill；Memory 状态面板 | `summarize.test.js`、`summarize-occurred-at.test.js`、`distill-tx-embed-gap.test.js` | 需 autoSummarize；写入在同一事务后补嵌入/抽取；审计可查；不注入原始长文 |

### 2.4 Memory 界面与接口

| 能力 | 具体工具或入口 | 现有测试文件 | 条件或实现边界 |
|---|---|---|---|
| Memory 面板 | 原生设置页 + 完整记忆浏览器（记忆/实体/状态/设置/Amadeus 等页签）；Core 面板“记忆”页签 | `client.test.js`、`client-recent.test.js`、`client-workspace.test.js`、`memory-settings-render.test.js`、`memory-form.test.js` | 普通层与诊断层分离；实体目录有加载/空/无权限/错误状态；不新建空节点 |
| Owner 设置 API | `/api/amadeus-memory/admin/*`；旧 `/api/dsh-mneme/*` 受 policy/token/Scene 约束 | `api.test.js`、`api-routes-gaps.test.js`、`route-policy.test.js`、`memory-admin-api.test.js`、`memory-enhancer-api.test.js` | Owner 同源/principal 校验；严格 Scene 下未授权 HTTP 读返回 403；敏感数据不进普通响应 |
| 实体图谱 | 实体页/图谱 API；关系/属性读取 | `graph-api.test.js`、`graph-passive-confirm.test.js`、`entities.test.js`、`identity.test.js` | 只读展示真实实体/关系；ACL/Scene 过滤；不手塞节点；编辑别名/合并需管理员入口 |

## 3. State（全部）

| 能力 | 具体工具或入口 | 现有测试文件 | 条件或实现边界 |
|---|---|---|---|
| 读取当前状态 | `state_get` | `tools.test.js`、`engine.test.js`、`gui-state.test.js` | 返回本 Session 的 mood/energy/curiosity、基线、解释、倾向、少量兴趣；只提供倾向，不覆盖 Persona/Life |
| 事件评价 | `state_appraise` | `tools.test.js`、`engine.test.js`、`evolution.test.js`、`interests.test.js` | 低信任主观评价；引用 Life activity 需 completed/failed；引用 Memory 需 `memoryId` 且通过 native `memory_get`；模型不能声明可信来源/证据/Scene/Persona/admin |
| 兴趣读取 | `state_interests` | `interests.test.js`、`tools.test.js` | 只返回本 Session 授权兴趣；长期基线与近期活动分开；近期活动衰减/饱和；不含其他 Scene 或 Memory 正文 |
| 健康与范围 | `state_health` | `tools.test.js`、`security.test.js`、`workspace.test.js` | 只返回静态可用性和本 Session scope；不返回全局计数、跨 Scene 时间、私有错误、路径、凭据 |
| 状态引擎 | 情绪/能量/好奇心随事件演化、衰减、兴趣迁移 | `engine.test.js`、`evolution.test.js` | 状态是倾向，不是命令；不能覆盖权限或调度 |
| State 面板 | Core 面板“状态”页；mood/energy/curiosity、兴趣、事件、设置 | `gui-state.test.js`、`gui-product.test.js`、`client.test.js` | 只调用受保护 Host API；不能借此读取其他 Session |
| State 管理 API | `/api/amadeus-state/status`、`/overview`、`/interests`、`/events`、`/diagnostics`、`/backup`、`/restore`、`/reset`、`/preview`、`/session-rules`、`/workspace` | `http.test.js`、`migration-v2.test.js`、`workspace.test.js`、`security.test.js` | Owner 认证；备份/恢复需明确确认；scope/workspace 由 Host 可信来源决定 |
| 配置/迁移/发布 | State 设置 schema、v2 migration、package/release 检查 | `config.test.js`、`schema-serialization.test.js`、`migration-v2.test.js`、`settings-schema-compat.test.js`、`release-package.test.js` | 迁移 additive、幂等、保留旧 scope；不跨 scope 合并旧状态 |

## 4. Persona（样式、覆盖、组装诊断）

Persona **不注册模型工具**，通过 System Prompt 两段和 Owner 管理面暴露。

| 能力 | 具体工具或入口 | 现有测试文件 | 条件或实现边界 |
|---|---|---|---|
| 核心人格段 | System Prompt section `amadeus:core-persona`（order 10） | `assembly.test.js`、`resolver.test.js` | 只在 Persona 模块挂载且解析允许时注入；不替换官方 system/tools/policy 段 |
| 场景样式段 | System Prompt section `amadeus:scene-persona`（order 10190） | `assembly.test.js`、`resolver.test.js`、`persona-scene-contract.test.mjs` | 样式靠近部署 suffix；变更时刷新 request series，避免旧 system 节点竞争 |
| 样式卡/核心卡 | Persona 控制台；`/cards`、`/cards/core`、`/cards/styles`、`/cards/styles/:id/copy`、`/cards/styles/:id/delete` | `console.test.js`、`http.test.js`、`store.test.js` | 样式只影响表达，不授予权限；删除/复制受 revision CAS |
| 默认样式与绑定 | `/default-style`、`/bindings`、`/bindings/delete` | `http.test.js`、`resolver.test.js`、`store.test.js` | 支持按 Session/Scene/默认样式覆盖；绑定解析优先于默认；不改变工具或权限 |
| 注入开关 | `/settings`；面板开关 | `http.test.js`、`assembly.test.js` | 关闭后不注册 Persona 段落；核心/场景分别受解析控制 |
| 历史回滚/备份恢复 | `/history`、`/history/rollback`、`/backups`、`/backup`、`/restore` | `http.test.js`、`store.test.js` | 需要 revision/确认；恢复失败不部分覆盖；历史只保留有界记录 |
| 组装诊断 | `/diagnostics`、`/diagnostics/final?sessionId=`；控制台诊断视图 | `assembly.test.js`、`http.test.js`、`console.test.js` | 只读最终可见性/来源；不能读取其他 Workspace；差异可解释 |
| 多工作区 | `/workspaces`、`/workspace` | `http.test.js`、`store.test.js` | 单次绑定一个 Workspace；切换不合并另一套 Persona |
| 存储/发布 | PersonaStore、备份、package 检查 | `store.test.js`；发布包检查需人工核对 | 存储故障 fail-closed；不自动创建未授权 HTTP 面 |

## 5. Life（意图、活动、预算、暂停/取消/恢复）

| 能力 | 具体工具或入口 | 现有测试文件 | 条件或实现边界 |
|---|---|---|---|
| 未来意图 | `life_intent_create`、`life_intent_get`、`life_intent_list`、`life_intent_update`、`life_intent_cancel` | `life-core.test.js`、`life-v1.test.js`、`wake-ledger.test.js`、`wake-consumption.test.js` | reviewAt 驱动 reconsideration；revision CAS；取消使待处理事件失效；不是预写消息 |
| 活动登记/读取/状态迁移 | `life_activity_record`、`life_activity_get`、`life_activity_transition` | `life-v1.test.js`、`activity.test.js`、`activity-life-integration.test.js` | 状态机允许 running/paused/stopping/completed/failed/cancelled/unknown；模型证据对“外部完成”不可信 |
| 本地虚拟活动 | `life_activity_start`、`life_activity_status`、`life_activity_pause`、`life_activity_resume`、`life_activity_cancel`、`life_activity_finish` | `productization.test.js`、`v1-budget.test.js`、`final-hardening.test.js`、`quality-gaps.test.js` | 仅 `activityTools.enabled` 注册；Provider 固定 local-virtual；模型不能选 provider/identity；完成证据只来自 Provider |
| 活动预算/资源/截止 | 活动 start 的 priority/resource/deadline；Life 预算配置 | `v1-budget.test.js`、`final-hardening.test.js`、`life-v1.test.js` | 预算、资源租约、deadline 有界；超预算拒绝；不新增外部调度 |
| 唤醒调度 | Wake Host `sessionController.resolveAgent`、`sessions.flush`、`session/event` | `wake-host.test.js`、`wake-ledger.test.js`、`wake-consumption.test.js` | 需要 Host 服务；投递需匹配 message/wake ID；flush 成功不等于执行；重复 drive 不重投 |
| 共享生活视图 | `life_shared_read` | `productization.test.js`、`workspace.test.js`、`shared-form-lifecycle.test.js` | 仅 `sharedRead.enabled`；绑定与显式授权选择 Scene；不返回私有描述、授权/principal 引用 |
| 健康 | `life_health` | `life-core.test.js`、`productization.test.js` | 只返回本 Session scope 的存储/tick/intent/activity/outbox 计数 |
| 工作区/成员/归档 | Life 面板；Workspace 绑定与成员策略 | `workspace.test.js`、`life-session-picker.test.js`、`productization.test.js` | 只唤醒有界成员；旧 allowlist 不因绑定扩大；归档/取消保守处理 |
| Life 面板/API | Core“生活”页签；Life 原生设置页；`/api/amadeus-life` | `package-privacy.test.js`、`shared-form-lifecycle.test.js`、`settings-schema-compat.test.js`；GUI DOM 需人工核对 | Owner 同源认证；不暴露凭据；设置变更遵循 Host 配置边界 |
| 备份/迁移 | Life backup/migration | `backup.test.js`、`migration-backup.test.js`、`bootstrap.test.js` | 迁移幂等；不覆盖现有用户数据；备份恢复边界在 Life 模块 |

## 6. MCP

| 能力 | 具体工具或入口 | 现有测试文件 | 条件或实现边界 |
|---|---|---|---|
| 服务器配置 | Core“MCP”页；保存/移除/连接；stdio 或 Streamable HTTP | `mcp-protocol.test.js`、`mcp-ui.test.js`、`mcp-security.test.js` | 服务器由 Owner 配置；stdio 只获得受控环境变量；不把任意网页脚本当服务器 |
| 工具发现 | 连接后 `listTools`，有界分页 | `mcp-protocol.test.js`、`mcp-security.test.js` | 工具名/description/schema 受限；最多 128 个工具、schema ≤64 KiB；重复/超限拒绝 |
| 授权调用 | `amadeus_mcp_list`、`amadeus_mcp_call` | `mcp-protocol.test.js`、`mcp-security.test.js` | 必须同时满足 Session/类型、server enabled、tool grant；side-effect 类还需 `allowSideEffects`；输入按声明 schema 校验 |
| 凭据/环境 | 保存凭据引用、envRefs；连接时解析 | `mcp-security.test.js` | 凭据不返回给模型；外部 stderr 丢弃；超时/取消不自动重试 |
| 事件/使用量 | MCP 页事件日志、服务器用量/状态 | `mcp-ui.test.js`、`mcp-security.test.js` | 事件有界；外部工具结果标记 untrusted；不暴露密钥 |

## 7. Bilibili（独立平台适配器）

| 能力 | 具体工具或入口 | 现有测试文件 | 条件或实现边界 |
|---|---|---|---|
| 浏览/搜索/详情/评论/相关 | `amadeus_explore_read` + 平台页只读测试；Bili adapter | `bilibili-search.test.js`、`real-platforms.test.js`、`platforms.test.js` | 需要启用平台与对应 permission；搜索可能触发平台风控，错误不回退 Mock；不声称完整观看 |
| 点赞/评论/回复 | `amadeus_platform_interact`；平台页互动 | `bilibili-social.test.js`、`platform-social.test.js` | 目标必须来自本 Session 已浏览/搜索到的内容；点赞只设 true；评论不自动重试；保留去重/额度/冷却 |
| 登录/账号 | 平台页网页扫码；`/platform/account` | `platforms.test.js`、`real-platforms.test.js` | web-qr 登录，非 Open Platform OAuth；可用性随平台变化；凭据可 DPAPI 或会话内保存 |
| 能力声明 | 适配器 capabilities：browse/search/read/comments/related/like/comment/reply | `platforms.test.js`、`real-platforms.test.js` | 未声明 subtitles/images，不能把未实现能力当成支持；真实搜索/互动不等于已验收 |

## 8. Xiaohongshu（两个不同适配器）

| 能力 | 具体工具或入口 | 现有测试文件 | 条件或实现边界 |
|---|---|---|---|
| 浏览器适配器：详情/评论/点赞/评论/回复 | `amadeus_explore_read`、`amadeus_platform_interact`；XHS 浏览器平台页 | `xhs-browser.test.js`、`xhs-native-adapter.test.js`、`real-platforms.test.js`、`platform-social.test.js` | capabilities 仅 read/comments/like/comment/reply；需要专用浏览器账号；目标须已观察；不声明 browse/search/related |
| 浏览器登录/恢复 | 平台页专用浏览器 QR；`/platform/account`；DPAPI vault | `xhs-login-controller.test.js`、`browser-vault.test.js`、`xhs-service-supervisor.test.js` | 本地执行服务生成 QR；关闭设置页不取消；会话/登录 TTL；重启恢复以实际登录状态为准 |
| 开放平台适配器 | `xiaohongshu` 平台账号；device-code 登录/验证/刷新/撤销 | `xiaohongshu.test.js`、`real-platforms.test.js` | capabilities 为空（仅账号身份）；官方目前 basic_info，不开放笔记搜索、评论或发布；无内容执行 |
| 账号安全/边界 | 平台页账号卡；退出/清除/撤销 | `xhs-browser.test.js`、`browser-vault.test.js`、`xhs-login-controller.test.js` | 远程撤销不支持时仅本地断开；账号标识/原始状态在诊断；不展示凭据 |

## 9. 独立 QQ（当前已注册工具与条件）

QQ 是独立插件，不随 Core Bundle 发布。以下只列源码注册事实，不包含任何本机路径或凭据。

### 9.1 始终注册的文本/控制工具

| 工具 | 能力 | 现有测试文件 | 条件或实现边界 |
|---|---|---|---|
| `qq_send_message` | 向本 Session 绑定 Scene 发送一条结构化消息 | `onebot.test.mjs`、`continuous-core.test.mjs`、`host-boundary.test.mjs` | 需 fresh actionId；未知投递不自动重试；只允许绑定 Scene |
| `qq_get_unread_messages` | 读取本 Scene 未读结构化消息 | `onebot.test.mjs`、`continuous-core.test.mjs` | 有 afterSeq/limit 上限；只读本 Scene |
| `qq_mark_read` | 仅把已呈现给本 Session 的消息标记已读 | `onebot.test.mjs`、`continuous-core.test.mjs` | throughSeq；不越权标记 |
| `qq_wait_for_messages` | 等待本 Scene 新消息，不要求模型轮询 | `onebot.test.mjs`、`continuous-core.test.mjs` | timeout ≤300s；继续同一 DSH activity |
| `qq_connection_status` | 读取本 Session QQ 连接健康 | `onebot.test.mjs`、`host-boundary.test.mjs` | 不返回账号秘密 |
| `qq_capability_search` | 搜索按需 QQ capability 目录 | `capabilities.test.mjs` | 目录存在不等于运行可用；query/category/limit 有界 |
| `qq_capability_describe` | 查看单个 capability 的 schema/权限/风险/可用性 | `capabilities.test.mjs`、`permissions.test.mjs` | 只读描述；不执行 |
| `qq_capability_execute` | 执行已注册的安全 capability | `capabilities.test.mjs`、`permissions.test.mjs`、`host-boundary.test.mjs` | 仅 EXECUTABLE 目录；任意 OneBot action 拒绝；执行前/读取中重查权限 |
| `qq_transcribe_message_record_native` | 用 QQ/NapCat 原生 PTT 转写本 Scene 已存在语音 | `native-asr.test.mjs`、`audio-read.test.mjs` | 只接受 messageId；需要 NapCat 支持原生转写；读权限 `qq.read`；不下载模型 |

### 9.2 条件注册的工具

| 工具 | 能力 | 现有测试文件 | 条件或实现边界 |
|---|---|---|---|
| `qq_send_media` | 从受控 sendRoot 的相对路径发送 image/gif/video/audio | `outbound-media.test.mjs`、`media-read.test.mjs` | 仅 `sendRoot` 为绝对路径时注册；路径必须相对且在根内；有类型/大小限制；actionId 去重 |
| `qq_upload_file` | 从受控 sendRoot 的相对路径上传文件 | `outbound-media.test.mjs`、`file-read.test.mjs` | 同上，仅 sendRoot 配置时注册；不接收 URL/绝对路径/附件引用 |
| `qq_qzone` | QZone 列表/发布/互动/删除 | `qzone-provider.test.mjs`、`outbound-media.test.mjs` | 仅 `qzoneEnabled` 且 provider 可创建时注册；原生 NapCat 负责发布，可选 loopback provider 提供读取/互动；需要 `qq.qzone.use` 或 `qq.qzone.publish/read`；目标须已观察 |
| `qq_read_message_image` | 读取本 Scene 消息中的一张图片为附件 | `media-read.test.mjs`、`host-boundary.test.mjs` | 需要 `attachments` 服务 + `saveImage` + `mediaRoot`；只接受 messageId/index |
| `qq_read_message_file` | 读取本 Scene 消息中的文件为附件 | `file-read.test.mjs`、`media-read.test.mjs` | 需要 attachments.saveFile + mediaRoot；有大小/路径边界 |
| `qq_read_message_video` | 读取本 Scene 消息中的视频为附件 | `media-read.test.mjs`、`file-read.test.mjs` | 需要 attachments.saveFile + mediaRoot；不声称视觉理解 |
| `qq_transcribe_message_record` | 用本地 ASR provider 转写本 Scene 语音 | `audio-read.test.mjs`、`native-asr.test.mjs` | 仅配置 `asrProviderId` 且 Host `speechToText` 注入成功时注册；需要 mediaRoot/ffmpeg 路径；只接受 messageId/index |
| `qq_owner_workspace` | Owner 受限工作区读取/写入 UTF-8 文件 | `owner-workspace.test.mjs`、`permissions.test.mjs` | 仅 Owner 策略 root 非空时注册；需 admin private Scene + `qq.owner.workspace`；写入还需配置 allowWrite 且逐次 Host approval；无 shell/绝对路径；有 maxBytes 上界 |

### 9.3 QQ capability 分类与权限

| 分类/维度 | 取值或入口 | 现有测试文件 | 条件或边界 |
|---|---|---|---|
| capability 类别 | `profile`、`group`、`message`、`social`、`voice`、`image`、`video`、`file`、`qzone` | `capabilities.test.mjs`、`permissions.test.mjs` | 类别由 action 名映射；目录有 supported/installed 两类，目录存在不代表 transport 可用 |
| 风险级别 | `low`、`medium`、`high`、`prohibited` | `capabilities.test.mjs`、`permissions.test.mjs` | prohibited 不可执行；高风险动作需显式授权/场景边界 |
| 场景权限 | `bound-scene`、`owner-private-explicit` | `permissions.test.mjs`、`host-boundary.test.mjs` | 好友/群目录等需 Owner 私有显式能力；普通 Scene 不能读取全局目录 |
| 所需能力 | `qq.read`、`qq.friends.read`、`qq.groups.read` 等 | `permissions.test.mjs`、`capabilities.test.mjs` | 执行前检查 requiredCapability；读取中撤权会在结果成形前再次拒绝 |
| QZone 操作 | `own_posts`、`friend_feeds`、`comments`、`publish_text`、`publish_media`、`like`、`unlike`、`comment`、`reply`、`forward`、`delete` | `qzone-provider.test.mjs` | 写操作走 durable delivery ledger；目标须来自本 Scene 观察；未知结果不重发 |
| 账号资料 | `qq_account_profile` 的 `read`、`set_signature`、`set_nickname`、`set_online_status`、`set_avatar` | `account-profile.test.mjs` | 仅 admin private Scene；读 `qq.read`，写 `qq.profile.write` + actionId；头像返回平台确认，不做视觉回读 |
| QQ 原生/本地 ASR | 原生 PTT 转写；本地 speechToText | `native-asr.test.mjs`、`audio-read.test.mjs` | 原生需 NapCat 支持；本地需 `asrProviderId` + speechToText + mediaRoot/ffmpeg；都不是跨 Scene 读取 |
| 会话/来源隔离 | `qq` Host service、`resolveTrustedSessionScene`、`authorizeSessionCapability`；Session provenance | `session-provenance.test.mjs`、`session-reservation.test.mjs`、`host-boundary.test.mjs`、`preset-guard*.test.mjs` | 模型不能指定 Scene/身份；QQ Session 不能用非 QQ 工具；Owner 工具能力独立 |
| QQ 管理面 | Web 控制台/管理 HTTP | `web-console.test.mjs`、`admin-http.test.mjs`、`admin-http-integration.test.mjs`、`client-*.test.mjs` | Owner 认证；不暴露账号秘密；配置变更不改源码/许可 |

## 10. 明确未实现或当前不激活

| 项 | 事实 | 依据 |
|---|---|---|
| Memory RecentContext | 源码保留，但 `recentContextEnabled` 属于 retired flag，Workspace runtime 强制关；不是当前能力 | `settings.js` retired flags；`admin-recent`/Core 面板说明 |
| Memory Trusted Intake | 同上，retired；历史表和模块保留但不激活 | `settings.js` retired flags |
| XHS 开放平台内容读取 | capabilities 为空，只做 device-code 登录/验证/刷新/撤销；官方 basic_info 限制 | `xiaohongshu.js` metadata；平台页说明 |
| XHS 浏览器搜索/浏览/相关 | 适配器 capabilities 只有 read/comments/like/comment/reply | `xhs-browser.js` CAPABILITIES |
| Bili 字幕/图片/完整视觉 | 适配器未声明 subtitles/images；只返回平台文字/元数据 | `bilibili.js` capabilities；Core 文案 |
| Persona 模型工具 | 没有 `persona_*` 工具；只通过 System Prompt 两段、Owner 控制台/HTTP 暴露 | `persona/src/index.js` |
| Life 外部平台 Provider | Life 活动工具固定 local-virtual；不提供模型选择外部 Provider | `life/src/index.js` activityTools |
| QQ QZone 无 provider | `qzoneEnabled` 或 provider 创建失败时不注册 `qq_qzone`，不是静默成功 | `qq/src/index.js` qzone block |
| QQ 本地 ASR 未配置 | 无 `asrProviderId`/speechToText 时不注册本地转写；原生转写仍取决于 NapCat | `qq/src/index.js` ASR block |
| QQ OwnerWorkspace 未配置 | 无 Owner workspace root 时不注册 `qq_owner_workspace` | `owner-workspace.js` registration condition |
| MCP 无服务器/无授权 | 工具存在但 list/call 只返回当前授权项；无连接/无 grant 即拒绝或空 | `mcp/manager.js` identity/allowed |
| Core 平台“真实成功” | 未启用、未授权、风控/限流/错误均保留为失败；不把模拟或错误显示为成功 | `platform-panel.js` / `registry.js` |

## 11. 测试关联说明

- Memory 的测试文件很多，表中按能力列代表性文件；没有直接对应文件的条目写“需人工核对”，不把间接测试当作覆盖证明。
- Core 的 `experiences` 测试只证明合成 Registry/SQLite/ACL 路径；真实平台账号、浏览器和网络行为不在本文声明。
- QQ 测试文件均为 QQ 仓库现有测试名；本文不复制其私有路径，也不声称本轮运行过它们。
- 真实运行验收、账号状态、平台可用性、安装结果和最终部署结果由 Codex 私有覆盖表关联；本文不做运行状态判断。
