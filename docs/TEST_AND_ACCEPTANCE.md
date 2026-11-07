# 测试与验收记录

日期：2026-11-07

## 本轮可复现结果

在 Core 仓库、分支 `codex/core-final-integration-20261107` 执行：

| 命令 | 结果 |
|---|---|
| `node --test tests/life-summary.test.js tests/panel-routing.test.js tests/experiences-ui.test.js` | 9/9 通过 |
| `npm run build` | 通过，生成单一 Core loader 客户端构建 |
| `npm test` | 226/226 通过，0 失败 |
| `npm run test:modules` | memory 2743/2743、life 218/218、state 143/143、persona 50/50 通过 |
| `npm run pack:check` | 通过，425 files，unpackedSize 35779488 |

本轮新增测试覆盖 Memory/State/Life 路由树、Life 分页、活动状态区分、失败可见性、完成经历筛选、owner-only health、Life delivery 健康摘要和显式自主唤醒配置。测试使用隔离 fake runtime 或真实 CoreRuntime 临时目录；它不是生产平台测试，也不产生 QQ 消息。

## 已有证据的解释

Core 当前源码测试为 226/226；独立模块组也已串行复核通过。独立 Life 的历史分支已有其自身测试记录，但不等同于 Core 当前安装或真实运行证据。构建成功只证明源代码和客户端打包可用，不证明 DSH、NapCat 或外部网站账号在线。

## 未执行项目

本轮代码阶段未使用人工 Host 投递伪造 QQ 入站，也没有把模拟 Life wake 当成自然事件。主环境已有安装/历史 QQ 收发证据，但本轮未取得新的独立发送端入站证据；因此以下项目仍需现场验收：普通真实 DSH 对话、QQ 入站→模型→回复、真实平台读取、跨授权 Session 回忆、图谱 GUI 回读、重启保持、自然 Life 闭环。

## 验收原则

模拟、fixture 和历史报告只能作为对应范围的证据；只有真实 Host、真实授权平台和原始事件/回执才能升级为真实通过。任何需要扫码、付款、验证码或新账号权限的步骤应停在该项并记录阻塞。

## 2026-11-07 继续实施与真实运行补充

- 本轮已在主 DSH 做一致性备份，并安装当前 Core 构建包；安装目录 `C:\Users\Jesko\.dsh\profiles\desktop\node_modules\@fg-lab\amadeus-core` 与源码 `src/core/runtime.js` SHA-256 均为 `F9AA057805BE7C50354B35BC5C9469B0B0975FF36460EE9AC566A2F4D0B947AF`。
- DSH 已重启，官方 Host 监听 `127.0.0.1:3081`，根路径按设计要求认证，`/health` 在当前版本不存在。`127.0.0.1:18787` 是上游代理，不作为 DSH 健康证据。没有合并 PR、发布 npm 或清理旧数据。
- 本轮真实 QQ 私聊入站→模型→QQ 回复已验证：入站 `messageId=2127733212`、Session `session-06fc4b99-6246-4ab2-bf22-51db3a225498`、回复 `platformMessageId=493973048`；Life 查询复测入站 `messageId=170082940`，回复 `platformMessageId=1749023676`，两次状态均为 `delivered`。
- QQ 模型能回忆已保存的 B 站/小红书文本层经历，但在显式 Life 读取复测中仍报告当前 Session 没有 `life_shared_read`/`life_health` 查询工具。代码已加入 `amadeus.life.read` 窄能力和执行时拒绝策略；主环境现有 Session 的权限状态仍为 `safe-chat`、仅 `qq.media.read` 显式允许，Life 能力尚未形成可持久化的真实授权绑定。
- 因此真实 QQ 入站/出站通过；QQ→Life 概况读取、主动 QQ 外发和自然 Life→Experience→Memory 闭环仍未通过，不能宣称完整验收。

## 2026-11-07 图片链路补充

- 新 TIM 图片事件 `messageId=2009581422` 已写入 QQ 持久状态，图片句柄为 `565D42CED7DA9903A72A4E50388AF672.jpg`。
- 旧安装包运行时曾返回 `QQ_MEDIA_PATH_OUTSIDE_ROOT`。复核发现主 DSH 安装目录仍是旧 QQ 包，工作树已有的 provider-cache 回退没有被加载。
- 重新安装 QQ 包后，当前源码使用真实 OneBot transport 回读该句柄，NapCat 返回 provider cache JPEG，可信根、canonical 文件、大小和签名检查通过，Host attachment 保存成功。
- 该图片事件发生在 QQ 新包安装和 DSH 重启之前，因此尚未证明重启后实际 Provider 请求包含 image block。需要新的 TIM 图片事件完成最后一层模型验收。

