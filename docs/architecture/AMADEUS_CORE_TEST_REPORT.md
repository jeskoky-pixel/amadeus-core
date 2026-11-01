# Amadeus Core Alpha 集成与增量验收报告

日期：2026-11-02；候选 `@fg-lab/amadeus-core@0.1.0-alpha.1`。不代表正式发布或真实平台上线。

## 完成范围

一个 Core Bundle 内保留 Memory 1.3.0（schema 2）、Life 1.2.1（schema 10）、State 1.2.0（schema 2）及 Persona 1.2.0（JSON 1）。QQ 保持独立。平台系统与 MCP Manager 分区独立；两种扩展均不能自动获得另一方权限。

平台执行层仅为 Bilibili/Xiaohongshu Mock。浏览、字幕/图片占位、评论、相关内容及社交 Dry-run 走真实权限路由。没有真实登录、爬取或社交外发。

MCP 采用官方 SDK 2.3.0，实际本地 stdio/Streamable HTTP 协议；管理员明确授权工具及 Session。DSH 0.2.1-rc.3 原生 MCP 未暴露适合本管理器的公开连接接口，其工具直接注册行为不符合本轮默认拒绝要求，故采用 SDK 而未重写协议。

## 已执行自动化

| 范围 | 结果 | 限制 |
| --- | --- | --- |
| Core 最终代码 | 76/76 通过 | 含实际 stdio 进程退出、重连、并行服务隔离 |
| Memory 保留回归 | 2714 通过 / 2715 项 | Windows 符号链接权限导致 1 跳过 |
| Life | 213/213 | 合成数据 |
| State | 143/143 | 合成数据 |
| Persona | 49/49 | 合成数据 |
| 构建、发行包清单 | 通过 | 私有 Alpha，不发布 |
| npm production dependency audit | 0 vulnerabilities | 本次扫描结果，不构成完整安全审计 |

Memory 曾因安装时省略 peer dependencies 产生导入失败；恢复正常依赖后全套重跑得到上表结果。历史上游 CI 解析测试使用标注来源的归档夹具，不代表本项目发布工作流已验证。Core CI 只有 contents:read，无发布步骤。

## 实际隔离运行时

官方 DSH Desktop 0.2.1-rc.3 / Electron 44.7.0，独立 DSH_HOME 与 Electron user-data-dir。通过官方插件安装入口装入 SHA 路径下的预构建 tgz。未修改生产 Profile、NapCat、QQ 暂停状态或已发布包。

- 单 Bundle 四模块 ready；原 Memory 卡片/时间线/图谱入口与 Persona iframe 保留。
- 原生 Desktop 重启后四模块、稳定 Activity Session、经历保持，自主探索保持关闭。
- 四模块逐个禁用/启用，其他三模块仍挂载，Session/经历保留。
- 增量候选原生 Desktop 平台/MCP/Memory/Persona 页面可访问，无页面告警；MCP 实际连接本地 stdio，发现 3 个工具，授权编辑器显示 2 个真实 Session 和 3 个参数 Schema。
- Web Console 实际浅色/深色截图在 evidence 中；原生隐藏窗口截图超时，不以 Web 截图冒充原生窗口截图。

## 实际模型活动

OpenCode Go `deepseek-v4.1-flash` 在同一持久 Session、同一 Activity 内调用 MCP echo，读取 Bilibili 模拟评论，根据线索搜索小红书，再读取模拟评论并主动结束。0 工具错误；3 条经历写入 Memory，3 次 State 效果记录为 applied，最终 Idle。中文查询返回空结果如实保留，未伪造搜索命中。

初轮暴露整体 30 秒预算过短及 Life 不允许 paused→completed 的问题。已修复为默认 120 秒（GUI 10–300 秒、下一活动生效）、6 次请求上限；暂停活动安全结束走取消，运行活动走完成。实际 LifeCore SQLite 状态机回归和后续模型活动均通过。重启不重放模型请求或外部动作。

## QQ、安全与迁移

已发布 QQ 1.2.1 仅连接隔离合成 OneBot；可信 provenance、两个合成群及 Owner 私聊、来源 Session、Borrow/Learn 授权及撤权、Owner opt-in/out 共 11 项检查通过。不代表真实 NapCat 联调；派生知识长期保留由保留 Memory 自动化覆盖。

停机导入与回滚经真实浏览器调用后均 ready，108 项表/人格内容核对一致。配置与数据代一起回滚，源保持不变；运行租约按进程状态另行核对。明确选定来源与可信旧配置的准确默认路径匹配；不自动扫描导入。旧模块动态启用 4/4 在 apply 前安全拒绝。

## 已知边界

- Bilibili/小红书登录、真实读写和社交均未实现/未测试，本轮按用户要求只做模拟。
- Hosted MCP 认证配置已用本地 Bearer 服务验证，未连接第三方账号。
- stdio 不提供操作系统沙箱；管理员须信任安装程序，只读分类是管理员声明，不能限制恶意服务自身的系统权限。
- 凭据文件不加密；创建 mode 0600，Windows 依赖用户数据目录 ACL。列表、模型结果及事件记录不返回凭据，stderr 丢弃。
- Windows 1 项符号链接测试跳过；Linux CI 结果须以实际远程运行记录为准。
- 未覆盖全部历史生产数据库组合；不得把合成迁移演练解释为生产数据迁移已执行。

本轮仅提交开发候选和 Draft PR，不合并、不创建正式 Tag/Release、不发布 npm 或市场条目。

## 远程 CI 修复记录

首轮 Linux Core 76/76、Memory 2715/2715、State 143/143、Persona 49/49。Life 的打包隐私检查发现保留 Memory 测试向源码相对目录写入合成 JSONL，已将测试改为唯一临时目录并清理，未修改生产算法或放宽打包检查。Windows 迁移夹具需使用规范路径而非 TEMP 8.3 别名，已修复；最终远程状态以 PR checks 为准。

验收清理：隔离 Web/Desktop 的探索和 MCP 服务均已关闭，隔离模型驱动已移除，测试宿主已停止；生产 DSH/NapCat 未改动。
