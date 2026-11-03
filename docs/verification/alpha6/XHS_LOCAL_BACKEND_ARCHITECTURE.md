# XHS local backend architecture — incomplete Alpha 0.6

Core continues owning ACL, Workspace, Life, Memory, State, Persona, budgets and Action Journal. The selected executor is xpzouying/xiaohongshu-mcp REST v2.7.0, not an MCP Manager entry. No second scheduler or AI layer is introduced.

Implemented but deliberately unregistered: XhsLocalClient (authenticated loopback HTTP boundary), XhsServiceSupervisor (injected lifecycle), XhsLoginController (Host-owned evidence state). No GUI/runtime imports these modules yet. Closing a future console must never own service lifetime.

Required next boundaries: production process-tree adapters with exit monitoring and deadlines, Host instance registry keyed by Profile/Workspace, encrypted upstream storage, AccountManager integration, trusted read receipts, then the existing unified UI. The current Supervisor only deduplicates starts on one object; it does not yet enforce cross-object/process uniqueness. A ready service is not a verified account.

Gate A must pass before asking for QR login. Gate B must pass before runtime integration. Gate C and all six real continuity checks must pass before any main DSH replacement. Existing platform IDs, old account records and journals are untouched. The eventual UI must show one XHS card with explicit backend compatibility mapping; that migration is not implemented in this increment.
