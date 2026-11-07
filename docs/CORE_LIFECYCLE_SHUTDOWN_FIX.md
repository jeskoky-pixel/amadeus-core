# Core Memory 生命周期关闭竞态修复

日期：2026-11-07

## 首个异常与根因

主 DSH 旧启动日志中的第一个业务异常是 `ERR_INVALID_STATE: database is not open`。调用链为 `semantic.js` 的 embedder retry 定时器 → `applyHumanEdits()` → `service.mergeHumanEdits()` → `store.getById()`。关闭流程先关闭了 SQLite，已经进入执行态的异步 embedder 初始化或回填仍在关闭后继续执行，因此只清理定时器并不能覆盖已经开始的 Promise。

## 修复内容

- semantic 管线增加 `disposed` 闸门，所有异步初始化、重试、回填和 reranker 结果在卸载后停止触碰运行时。
- 记录正在执行的 Promise，`dispose()` 清理计时器后等待这些 Promise settle，并且具备幂等性。
- auto-reindex/backfill 接收取消检查，等待中的 embedder 返回后不会写入已关闭的 store。
- Memory 宿主在关闭阶段先阻止 human-edits 合并，按顺序等待所有异步 disposer、Dream、Sleep 和 ACL 清理，最后关闭 SQLite。
- `src` 与 `lib` 同步，防止宿主和 daemon 使用不同生命周期实现。

## 验证

- `npm test`：226/226 通过。
- Memory 模块完整测试：2744 tests，2743 pass，0 fail，1 skipped。
- Life 218/218、State 143/143、Persona 50/50 通过。
- `npm run build` 与 `npm run pack:check` 通过，包含 425 个文件。
- 新增 `semantic-lifecycle.test.js`，验证异步 embedder 初始化在 store 关闭前被排空，且不会晚到执行人改合并。
- 主 DSH profile 已备份并安装新包。新包 SHA-256 为 `DB2A8F5E034C4F024F168FAF0F5989766D9B631A00A89D4CF17088B4385FDFCC`，安装目录 semantic 源码与工作区 SHA-256 均为 `F745CC4A71D4CF82857936CF54C2A4DE20705021313701ECED51E7C133DBBB36`。
- 官方 DSH 后台重启后进程持续响应，监听 `127.0.0.1:3081`。观察窗口内没有新增 crash 日志，旧的 `database is not open` 日志没有再次出现。

## 仍需单独验收

本修复只处理 Core 内部关闭竞态。QQ Life 工具授权、真实 TIM 图片请求、主动 QQ 外发和自然 Life → Experience → Memory 闭环仍按各自权限和真实环境条件验收，不能由本次启动稳定性证据代替。

