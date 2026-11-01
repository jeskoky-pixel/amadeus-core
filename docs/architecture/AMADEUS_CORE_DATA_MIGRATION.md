# Amadeus Core 数据迁移与导入（按当前实现）

状态：0.1.0-alpha.1 开发候选。本文描述 `src/core/migration.js`、`src/core/import-data.js`、`src/core/import-config.js` 的当前行为，不代表已完成生产迁移或原生 Desktop 验收。
实现依据：`src/core/{migration,import-data,import-config,ownership,store}.js`、`DATA_MIGRATION.md`、`tests/{migration,import-config}.test.js`。

## 1. 数据布局与原则

- 四个模块数据不合并数据库：Memory（SQLite，schema 1/2）、Life（SQLite，schema 10）、State（SQLite，schema 2）、Persona（JSON，schemaVersion 1）各自保留目录和存储。
- Core 数据在用户数据根，不在 npm 包内。核心文件包括：
  - `core.json`（schema 1，revision、Workspace、模块配置、dataGeneration）
  - `activity.json`、`experiences.json`、`platform-budget.json`
  - `backups/core-r<revision>.json`（配置历史）
  - `generations/<uuid>/backup`、`generations/<uuid>/live`、`generations/<uuid>/configuration.json`
  - `.core-writer.json`（单写者进程租约）
- 导入只复制源数据，不重命名、不删除、不改写源目录；旧安装和旧数据保持原样。
- 任何写入都不得覆盖已有用户数据；目标快照已存在时拒绝覆盖。

## 2. 停机快照（`snapshotModules`）

`snapshotModules({ sources, targetRoot, assertStopped })` 的工作顺序：

1. 校验 `sources` 必须且只能包含 memory/life/state/persona 四个绝对路径目录；目录必须存在、可读，彼此不能嵌套。
2. 校验目标必须绝对路径，父目录已存在；目标与任一源不能互相包含，目标不能已存在。
3. 路径的每一级组件拒绝符号链接/junction：用 `lstat` 加 `realpath` 对比，Windows 上按大小写不敏感比较。普通文件之外的类型拒绝。
4. 调用可信的 `assertStopped()`；非 `true` 抛 `ASSERT_STOPPED_FALSE`，抛错则转为 `ASSERT_STOPPED_FAILED`。
5. 在目标父目录下创建唯一 staging 目录（`.name.staging-<uuid>`），逐个模块复制：
   - SQLite 文件先以只读连接打开，用 `node:sqlite` 的 `backup()` 捕获已提交的 WAL 帧；随后规范化日志模式、移除 `-wal`/`-shm`，执行 `integrity_check`、`user_version` 和 schema 校验。
   - 非 SQLite 文件按字节复制，保留相对路径；单个文件上限 128 MiB，总条目上限 10,000。
6. 校验每个模块的主存储存在且 schema 受支持；Memory 主库还要求 `workspace-binding.json` 与 `workspaces/<sha256(workspaceId)>/.mneme-workspace.json` 一致。
7. 写入 `manifest.json`（schema 1）：记录每个模块文件的相对路径、字节数、SHA-256、是否 SQLite、`user_version` 等；再次校验 snapshot，并再次调用 `assertStopped()`。
8. 用原子 rename 把 staging 提交为目标；绝不覆盖已有目标。失败时保留 staging 和 `.snapshot-error.json` 供诊断，不删除已复制的数据。

已有目标目录时：先 `verifySnapshot()`；只有目标通过验证且源与 manifest 重新探测后完全一致，才返回 `status: 'unchanged'`。源已变化返回 `TARGET_EXISTS_SOURCES_CHANGED`；目标不是有效快照返回 `TARGET_EXISTS_INVALID`。重复迁移同一份未变源是幂等的。

`verifySnapshot()` 只读检查：绝对路径、无链接、manifest schema/形状、每模块主存储、文件大小与哈希、SQLite `user_version`/schema、Persona JSON，以及快照中不能有 manifest 之外的文件。

## 3. 导入与数据代际切换

`importData(runtime, input)` 由 Owner HTTP `/api/amadeus-core/import` 触发，行为如下：

1. 必须显式传入 `offlineConfirmed === true`，并要求调用方已停止所有旧写入者（包括其他 DSH 进程）。
2. `revision` 必须等于当前 CoreStore revision；必须有 Workspace；Activity 不能 busy，阶段不能是 `Exploring`/`Deliberating`/`Paused`；`assertIdle()` 要求已加载 Session 没有未结束 turn。
3. 在停止任何模块之前，先用 `importConfigurations()` 解析并验证四个模块的可信配置；配置失败不会进入数据切换。
4. 校验旧写入者：当前没有启用的旧独立模块（`legacyConflicts` 为空），且源 Life/State 数据库的 `runtime_leases` 未显示存活 PID。
5. 保存旧 store 快照，停止所有模块。
6. 生成新的 UUID 数据代：
   - `generations/<uuid>/backup`：从源目录做第一次停机快照。
   - `checkBindings(backup, old.workspaceId)`：Memory `workspace-binding.json`、Persona `persona.json`、Life `life_workspace`、State `meta.workspace.binding.id` 必须全部等于旧 Workspace。
   - `generations/<uuid>/live`：从 backup（不是源）再做一次快照，作为实际运行数据。
   - 写 `configuration.json`（schema 1），同时保留 previous/imported 配置。
7. 用一次 `CoreStore.update()` 原子切换 `dataGeneration`、`modules`、`previousDataGeneration`、`previousModules`；随后 `mount()` 新代数据。
8. 成功返回 `{ status: 'imported', generation, previousGeneration, sourceUnchanged: true }`，源目录仍未改动。

失败处理：再次停止模块；若代际指针已改变则原子恢复旧指针与旧模块配置；尝试重新 mount 旧代。若重新 mount 仍失败，Runtime 进入 `blocked` 并标记 `CORE_IMPORT_RECOVERY_REQUIRED`。失败的代文件保留用于诊断，不会自动删除用户数据。

## 4. 可信迁移配置（`importConfigurations`）

- 若四个源正好是当前代的 `generations/<generation>/live/<module>`，直接复用当前 Core 模块配置（内部复制），不要求旧 Host 条目。
- 否则只从可信 `configEditor.entries()` 读取配置，不接受模型或任意请求 JSON 提供的配置：
  - 每个模块必须恰好匹配一个条目，按配置项 `id` 或保留包名识别；条目必须 `disabled === true`，防止启用中的旧模块与 Core 同时写。
  - `config` 必须是对象；Memory 取 `memoryDir`，Persona 取 `dataDirectory`，Life/State 取 `databasePath` 的父目录。
  - 该路径必须是绝对路径，并与调用方给出的源目录在真实路径上相等（Windows 大小写不敏感）。
  - 配置对象整体深拷贝保留未知字段，不因导入丢弃未来模块字段；缺失、歧义、启用中、路径不匹配都在停止模块前失败。
- 未配置路径时，仅依据已保留模块的确切默认规则解析（Memory 使用 homedir/.dsh/memory，其余遵守 DSH_HOME）；仍须与管理员所选源逐一匹配，不扫描或猜测目录。

## 5. 回滚

`rollbackData(runtime, input)`：

1. 校验 revision、存在 `previousDataGeneration`、Activity 不 busy、`assertIdle()`。
2. 停止模块，原子交换 `dataGeneration` 与 `previousDataGeneration`，同时交换 `modules`/`previousModules`。
3. 成功 mount 后返回 `{ status: 'restored', generation }`；失败则恢复交换前的指针并尝试 mount，仍失败则 `blocked`。

回滚只切换指针，不删除任一数据代；旧快照和备份仍可用于再次恢复。`configuration.json` 与 Store 中的 previous 字段共同支持配置随数据代一起回滚。

## 6. 显式路径与内容限制

- 四个源路径必须绝对、已存在、是目录、彼此不嵌套；不能用 symlink/junction 或其它特殊文件绕过。
- 目标必须绝对，父目录必须已经存在；目标不能与源互相包含，不能已存在（已验证且未变化的旧快照除外）。
- Windows 路径比较按小写真实路径进行；大小写不同不能规避重叠检查。
- 单文件上限 128 MiB，整棵源树上限 10,000 条目；超限直接失败。
- SQLite 主存储必须匹配模块预期 schema；Memory 需要匹配 Workspace binding 与 marker；Persona 必须是 schemaVersion 1 的 JSON 对象。
- 目标快照的标准存储路径固定；manifest 中不允许绝对路径、反斜杠、`.`/`..` 段或重复路径。
- 这是“显式路径迁移”能力：不提供自动发现、移动、合并、去重或云端迁移；也不证明所有旧版本配置组合都已被覆盖。

## 7. 证据与未验证边界

- 已有测试覆盖：WAL 已提交行复制、Persona/JSON 原样保留、重复源幂等、源变化拒绝覆盖、未停机中止、目标重叠拒绝、篡改哈希检测、Memory Workspace 目录保留，以及配置未知字段/缺失/歧义/路径不匹配。
- `DATA_MIGRATION.md` 已说明 Memory 没有跨进程写者租约，因此“所有 Memory 写入者已停止”是操作前提，不能仅由 Life/State PID 检查证明。
- 尚未验证：完整生产旧数据矩阵、所有历史版本默认路径、原生 Desktop 外壳中的迁移 UI、真实 QQ/NapCat 同 Profile 的完整迁移。
- 未在本任务运行新测试、未操作生产 Profile、未提交代码；上述为源码审计结论。


## 后续执行证据（2026-11-02）

隔离 Desktop Bundle/UI 已实际验证，Web 导入和回滚以及 108 项内容检查已通过。原生 Desktop 内的迁移操作及生产旧版本全矩阵仍未覆盖。见 AMADEUS_CORE_TEST_REPORT.md；不把历史源码审计的未执行状态当作最终测试结果。
