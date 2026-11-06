# 测试与验收记录

日期：2026-11-07

## 本轮可复现结果

在 Core 仓库、分支 `codex/core-final-integration-20261107` 执行：

| 命令 | 结果 |
|---|---|
| `node --test tests/life-summary.test.js tests/panel-routing.test.js tests/experiences-ui.test.js` | 9/9 通过 |
| `npm run build` | 通过，生成单一 Core loader 客户端构建 |
| `npm test` | 219/219 通过，0 失败 |

本轮新增测试覆盖 Memory/State/Life 路由树、Life 分页、活动状态区分、失败可见性、完成经历筛选和 owner-only health。测试使用隔离 fake runtime 或真实 CoreRuntime 临时目录；它不是生产平台测试，也不产生 QQ 消息。

## 已有证据的解释

Core 在本轮开始前已有 218/218 全套测试通过；本轮增加一个测试后为 219/219。独立 Life 的历史分支已有其自身测试记录，但不等同于 Core 当前安装或真实运行证据。构建成功只证明源代码和客户端打包可用，不证明 DSH、NapCat 或外部网站账号在线。

## 未执行项目

截至代码修复阶段，本轮尚未安装候选或启动主 DSH/NapCat，也没有向 QQ 私聊 `1622647109` 或群聊 `902393625` 发消息，没有访问 B 站/小红书外部页面，也没有用人工 Host 投递伪造 QQ 入站。因此以下项目仍需现场验收：普通真实 DSH 对话、QQ 入站→模型→回复、真实平台读取、跨授权 Session 回忆、图谱 GUI 回读、重启保持、自然 Life 闭环。

## 验收原则

模拟、fixture 和历史报告只能作为对应范围的证据；只有真实 Host、真实授权平台和原始事件/回执才能升级为真实通过。任何需要扫码、付款、验证码或新账号权限的步骤应停在该项并记录阻塞。
