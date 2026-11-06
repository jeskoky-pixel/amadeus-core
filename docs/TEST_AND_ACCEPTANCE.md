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

