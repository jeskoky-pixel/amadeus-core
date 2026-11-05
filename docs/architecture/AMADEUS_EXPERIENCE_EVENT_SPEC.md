> 2026-11-06 当前实现补充：下文的“只支持模拟”和 Memory 内嵌完整 JSON 是早期契约。当前真实 Registry receipt 与模拟记录分别标注。新经历的 Memory 正文是有界可读事实，保留来源平台、操作、时间、事件引用及未观察内容的边界；不含账号标识、完整返回体或令牌。完整已验证真实 receipt 由 Host 原子写入 Core 数据根 `experience-evidence/<eventId>.json`，索引记录 SHA-256。`read` 先通过原 Memory ACL 与 delivery，再校验身份字段和内容哈希，返回加法字段 `rawEvidence` / `rawEvidenceStatus`；缺失为 missing、损坏为 invalid，不伪造证据。Owner 列表不携带 raw。
>
> Memory 质量规则保持不变：大型技术 JSON 不再作为记忆正文，独立事实可以检索，重复事实仍可能按既有规则归档。旧 Memory、旧索引和已归档记录不回填、不取消归档；旧事件缺少独立 raw 时仍可读取其获授权的旧 Memory，raw 状态明确为 missing。现有事件键、数据代、10000 条上限和 64 KiB 原始 receipt 上限保持不变。模拟 fixture 不写成真实 raw。

# Amadeus 体验事件规格

## 1. 定位
- 体验收据由 src/core/experiences.js 的 host-only 门面产生，不是模型工具，也不是可写 HTTP 端点。
- experiences.json 保存收据与索引；Memory 始终是读取授权边界。
- 当前所有平台适配器均为模拟，事件必须标注 simulation，禁止表述为真实动作。

## 2. 标识与代际
- 键：workspaceId、sessionId、activityId、platform、step；dataGeneration≠original 时追加 dataGeneration。
- eventId = 'experience_' + sha256(JSON.stringify(key))；同代重复记录幂等复用。
- 代际隔离：不同 dataGeneration 产生不同 id；read 与 ownerList 只返回当前代际。
- 容量上限 10000 条，超出抛 CORE_EXPERIENCE_CAPACITY。

## 3. 记录结构
- 持久字段：eventId、workspaceId、sessionId、activityId、platform、operation、step、dataGeneration、occurredAt、status、memoryId。
- status 先为 pending，后转 stored；只有 stored 可被读取。
- 记忆体载荷另含：evidenceLevel:'simulation'、visibility:'session'、facts=observation、interpretation:null、actionReceipt:{kind:'simulation',externalAction:false}。
- observation 必须可序列化且不超过 65536 字节，否则抛 CORE_EXPERIENCE_LIMIT。

## 4. 写入流程
- 入口 record({platform,activityId,sessionId,operation,observation,step})。
- 先经 member(ctx, workspaceId, sessionId) 校验会话属于工作区，并要求 Memory unifiedRuntime 可用。
- 校验 platform/activityId 为字符串、step 为安全整数。
- 先落 pending 收据到 experiences.json，再在授权上下文内写入 Memory。
- Memory 以 eventId 去重保存 type:'history'，标签 amadeus-experience、simulation，evidence 为 simulated-platform。
- 保存成功回填 memoryId 并置 stored；失败抛 CORE_EXPERIENCE_MEMORY_REJECTED，pending 收据保留。

## 5. 模拟证据语义
- 平台 execute 返回 evidenceLevel:'simulation'、externalAction:false、accountId:null。
- 收据标题固定为“Simulation: <platform> <operation>”，解释字段为空，避免把 fixture 当作真实观察。
- 该语义适用于 simulate() 的内置只读诊断；当前没有真实平台证据路径。

## 6. Memory 授权
- 保存：memory.unifiedRuntime.authorize.run(session, () => service.saveWithDedupe(...))。
- 读取：同样经 authorize.run 取 memoryId 对应行；不存在或跨代际则抛 CORE_EXPERIENCE_DENIED。
- 返回前调用 authorize.delivery(session, [row], 'tool')，由交付策略再次约束。
- 无授权、无 unifiedRuntime 或会话不属于工作区时直接拒绝，不能由模型参数绕过。

## 7. 读取接口
- read(eventId, sessionId)：返回 {event, memory}；要求当前代际且 status=stored。
- ownerList()：仅 Owner 使用，准入由 Core HTTP 处理器完成；返回当前代际最近 100 条（倒序）。
- activity.summary() 暴露 sessionId 与最近事件 id，供诊断关联，不构成额外授权。

## 8. 与活动的关系
- 每步平台执行成功后由 activity.explore 调用 record，并把 eventId、steps 持久化到 activity.json 的 last。
- 收据不独立调度、不主动发送，也不产生平台副作用。

## 增量事件约定

模型探索也使用同一经历记录路径。模拟社交操作来自 Owner Dry-run 路由，所有平台回执仍标明 simulation/externalAction:false。可信 State 服务按幂等 eventId 记录 exploration_completed，trust=simulation、scale=0.1；失败标注 unavailable/denied，不伪造 applied。

MCP 另存最多 200 条调用元数据（eventId、serverId、toolName、Session、时间、结果状态），不保存参数/返回正文，不创建第二套长期记忆，也不把工具结果自动升级为可信 Persona 指令。
