# Amadeus 最终三项修正与运行证据（2026-11-07）

## 本轮结果

- Core Life 工具重复注册已修复。DSH Profile reconciliation 可能重复应用 Core Bundle 时，Life 保留首次注册的全局工具，后续重复注册安全跳过，避免 Core 在 Life 挂载阶段进入 blocked。
- 原生 Life 设置页新增“绑定其他 Session”。Owner 可以输入已确认的 DSH Session ID，通过现有 `/api/amadeus-life/bootstrap` 创建稳定 Persona、私有 Scene 和 Session binding。绑定列表、范围、状态、让位和撤销仍使用原有页面与 owner-auth API。
- QQ 私聊 Session `session-46fb75bf-ee8d-4fcc-82eb-d3f6a6f25e3f` 已加入 Core Life allowlist，并通过 Life bootstrap 创建绑定。QQ 的 Life 读取权限仍由 QQ 的私聊精确白名单控制。

## 真实 DSH / QQ 验收

当前 Profile 使用官方 DSH Desktop 0.2.2-rc.1，Host 监听 `127.0.0.1:3081`。重启后的 Life 错误文件没有新增重复注册记录。

用户在 TIM 私聊中发送了要求直接调用 `life_shared_read` 和 `life_health` 的指令。最新 Session projection `session-46fb75bf-ee8d-4fcc-82eb-d3f6a6f25e3f` 记录了：

1. 模型调用 `life_shared_read`。
2. 模型调用 `life_health`。
3. 两个工具事件均正常结束，没有 `err` 标记。
4. 模型随后调用 `qq_send_message` 返回 QQ。

这证明 QQ → DSH 模型 → Core Life → QQ 的真实读取链路已通过。该证据只覆盖 Life 读取和回复，不代表自主平台探索、自然唤醒或 Experience → Memory 的完整闭环已经完成。

## 代码与测试

- Core `npm test`：226/226 通过。
- Core `npm run build`：通过。
- 当前候选 tarball：`@fg-lab/amadeus-core@0.2.0-alpha.6`。
- 候选 tarball SHA-256：`2340F4518105CAD520DCFF5C8B0BD561E4702E910828AAD9A8771A3FD4F1908A`。
- 该版本仍保持 `private: true`，本轮只准备候选包，不执行 npm publish。

## 权限与数据边界

QQ Life 读取使用现有精确私聊白名单，未扩大到群聊或其他私聊。Session binding 使用已有 Life 表和幂等 bootstrap 逻辑，未新建数据库、未清空历史、未覆盖 Persona、Memory、State 或平台账号。设置页的手动绑定入口只对通过 DSH owner authentication 的请求开放。

## 尚未完成

主动 QQ 外发、自然唤醒后的真实平台探索、Experience → Memory → 后续回忆闭环，以及 Core/QQ PR 合并后的 CI 复核仍需在合并前继续核对。npm 发布需要单独的 registry 权限和版本决策，本轮不执行发布。

