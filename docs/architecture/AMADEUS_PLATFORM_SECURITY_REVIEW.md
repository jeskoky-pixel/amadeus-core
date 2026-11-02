# Alpha 0.2 security review
- Remote content cannot register adapters, change mode, grant permissions, assert identity or mint live-read receipts. Result text is marked untrusted and never executed/rendered as HTML.
- Owner-only HTTP checks are retained. No secrets reach overview, model observations, Memory, logs or ordinary config exports. QR public data is short-lived and excluded from evidence screenshots.
- Exact HTTPS origin allowlists, no redirects, no model-controlled URLs, finite body/timeout limits. Bilibili fields are explicit projections; XHS content routes stay unsupported.
- Separate platform/account/workspace identities and permissions. Specific Session membership checked before/after fetch. Revoke generation discards late results, disabled tools never dispatch; failures consume budget.
- Real social actions are blocked regardless of configured permissions. Mock dry-run remains offline. No bypasses for captcha, risk-control or login.
- No OS credential API was validated for plugins; memory-only storage is an explicit limitation. No production profiles/accounts/databases accessed.
- Remaining external risks: website API stability/terms, developer approval, actual account behavior, browser/system compromise. This is a bounded development review, not an external security audit.
