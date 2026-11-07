# 运行态交付记录

日期：2026-11-07

## 代码来源

- Core 基线：`99efb34f607af0d2ef2162efc1931c57e191dd4f`
- 交付分支：`codex/core-final-integration-20261107`
- 版本字段：`0.2.0-alpha.6`
- 构建命令：`npm run build`
- 构建结果：通过；客户端由 Core loader 生成

## 安装与数据

本轮在备份主 DSH Core/QQ 安装与配置后安装了构建包并重启主 DSH。没有修改用户数据、平台账号、QQ 绑定或凭据。现有未提交的仓库外工作不在本次提交范围内。

## 回滚

审查前可继续使用基线 `99efb34f607af0d2ef2162efc1931c57e191dd4f`；审查后如需回滚，恢复到该基线或卸载本 PR 生成的包即可。由于没有数据迁移，回滚不会要求清空 Memory/Experience。

## PR 约束

本次交付只创建新的 GitHub PR，不合并、不发布正式版本。PR 合并前应由维护者确认安装窗口和真实 QQ/DSH 验收窗口。

## 2026-11-07 主环境运行态补充

本轮先备份了主 DSH Core/QQ 安装和配置，再安装当前 Core 构建并重启 DSH。源码与已加载 Core 的 `src/core/runtime.js` SHA-256 均为 `F9AA057805BE7C50354B35BC5C9469B0B0975FF36460EE9AC566A2F4D0B947AF`；QQ 已加载的 `src/preset-guard.mjs` 与当前 QQ 工作树 SHA-256 需以 QQ PR #12 的安装记录为准。官方 DSH 进程持续响应并监听 `127.0.0.1:3081`，该版本没有公开 `/health` 路由，不能宣称 HTTP 健康端点返回 200。

真实 QQ 私聊测试记录：`2127733212 → 493973048`、`170082940 → 1749023676`，持久状态均为 `delivered`。测试证明正常 QQ 入站、模型回合和回复外发工作；同时证明当前既有 QQ Session 尚未获得可调用的 Life 查询工具。未伪造主动外发或自然 Life 活动通过。

PR #4 仍保持 open、未合并；PR #12 仍保持 open、draft。旧数据、平台账号、QQ 绑定和回滚备份保留。

