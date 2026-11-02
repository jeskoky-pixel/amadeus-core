# Real platform architecture — Alpha 0.2
Core remains one modular Bundle; QQ stays independent. No changes to the four retained module algorithms or MCP implementation.

PlatformRegistry accepts legacy simulation contract 1 and trusted code-admitted real contract 2. Real adapters are identity-bound objects admitted at construction, not JSON mode flags. No HTTP/model registration route exists. Each adapter has independent enabled/permissions/daily budget/autonomy/cooldown settings. Real defaults are disabled with no permissions and autonomy off.

The Host checks Workspace/Session membership before and after requests. Runtime continues using one Activity Session, Life provider and hard activity limits. No new polling or scheduler. Owner read tests use the same permission router and experience path. Emergency disable and account revocation do not wait behind the model queue.

Private in-process receipts bind platform, operation, account, Workspace, Session and activity to the exact returned observation. Experiences accepts real evidence only with an untampered receipt; model-written live-read is ineffective. External text remains untrusted, and metadata never becomes visual evidence. Memory is the sole long-term store behind existing ACL.

Evidence vocabulary reserves simulation, dry-run, live-read, live-write, unknown-result. This candidate emits simulation (including offline social dry-run details) and live-read only. It does not emit successful live-write or unknown-result receipts because live writes are unsupported and rejected before dispatch.
