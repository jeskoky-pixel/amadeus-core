# Platform-level autonomous interaction — 2026-11-03

User explicitly requested removal of per-note approval. The UI no longer has note or Session allowlist selectors. Owner operation grants apply to the platform; execution uses the trusted Host-created Core Activity Session automatically. Native targets come from real browsing/search/detail and are scoped by Workspace/account/Session, with a bounded one-hour ephemeral cache. Existing Life owns scheduling; this change adds no timer or automatic model invocation.

191 Core regressions pass, including newly observed targets without manual grants, cross-Session rejection, logout clearing observations, revocation and durable deduplication. Build and pack checks pass. Real social sending is not claimed as tested; no arbitrary comments were posted during development. Existing login data, module databases and action journal are preserved.
