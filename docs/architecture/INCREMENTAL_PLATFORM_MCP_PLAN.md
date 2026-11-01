# Core 第一阶段后续增量任务（2026-11-02）

用户输入依据：附件 `26f45fb7-404c-444a-b89b-262558cc4526/已粘贴的文本.txt`。

先完成当前 Core 整合收尾，再增量实现，不重写四个核心模块：

1. Platform System 与 MCP Manager 独立分区、独立权限和生命周期。
2. Bilibili / 小红书仅模拟。补推荐、字幕/图片/评论、跨平台继续探索与社会动作 dry-run；未实现真实登录和社交明确标注。
3. 复用当前官方 Desktop 0.2.1-rc.3 的 MCP 能力，禁止服务器 instructions 进入高优先级系统提示词；工具描述及输出保持不可信。
4. 多 MCP Server：两个 stdio 与一个 Streamable HTTP 本地真实协议并行验收；同名工具隔离、Session/Workspace 授权、超时、撤权、持久化、凭据引用、服务故障隔离。
5. GUI 提供独立 MCP 列表、目录、自定义服务、权限和诊断。目录不伪造部署状态，不自动安装第三方服务。
6. 补齐七份增量交付文档，明确区分真实协议与模拟平台证据。

本轮不进行真实第三方登录、社会外发或正式发布；不改变生产 QQ / NapCat 暂停状态。

已核实原生 MCP：`@deepseek-ai/dsh-mcp-client@0.2.1-rc.3` 使用 `@modelcontextprotocol/client@2.2.0`，支持 stdio 与 Streamable HTTP、多实例命名空间、工具发现与连接生命周期；默认注册系统 instructions 与 MCP resources，Core 复用时须在专用 scope 中隔离这两条入口，并包裹全部工具授权。不直接在原 Host 上裸加载外部 MCP。
