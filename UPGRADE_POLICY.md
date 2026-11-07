# Upgrade policy

Core is an unreleased `0.2.0-alpha.5` candidate. It is not a replacement recommendation for production yet.

Code and user data are separate. The default data root is `DSH_HOME/amadeus-core`, not the npm installation directory. Disabling/uninstalling the Bundle must not remove this directory. Module data formats remain Memory SQLite/ACL 2, Life SQLite 10, State SQLite 2 and Persona JSON 1; Core metadata is JSON schema 1.

Every future migration must validate the prior schema, take a consistent recoverable snapshot, preserve existing identities and references, and test interruption and rollback. Restoring old code alone does not imply database compatibility. An unsupported schema must fail closed.

Before a release, test previous stable version → synthetic populated data → update → restart → content and permission checks. Retain the prior artifact, checksum, configuration and compatible data snapshot. A minor release must not silently remove existing functionality.


Alpha 0.1 → 0.2 is additive: Core schema 1 and all four module schemas remain unchanged. New platform-accounts.json schema 1 stores only account metadata; credentials/pending grants are memory-only. Existing Mock grants never enable real adapters. Optional platform cooldown/autonomy fields default safely. Older Core ignores new account metadata; preserve the full Core data directory and previous package before downgrade. Account login must be repeated after restart.


Dedicated XHS browser addendum: module schemas are unchanged. Additive `platform-actions.json` schema 1 stores hashed semantic action IDs, platform/account/Workspace/Session/note identities, timestamps and pending/confirmed/unknown outcomes; it stores no comment bodies, URL security tokens or browser credentials. Preserve it with `platform-budget.json` and `core.json` during backup and restore. Pending reservations after restart are treated as unknown and cannot replay. Never delete this journal to retry a send. Account contexts are ephemeral and require login again. Old versions do not execute this new adapter; keep the journal if downgrading. Disabling/uninstalling Core must preserve these files. Optional per-platform social configuration starts with empty note/Session grants.


## Alpha 0.2.0-alpha.2 login persistence
This addendum supersedes the session-only statements above **only for the dedicated Xiaohongshu browser**. `browser-vault/<workspace-sha256>-session.json` and `-login.json` use envelope schema 1 and Windows CurrentUser DPAPI. They live in the Core user data root, outside the package. No module schema changes. Back up the complete stopped Core directory and Profile before replacement; restore the matching package and snapshot for rollback. Encrypted data requires the same Windows user/DPAPI keys; copying it to another computer is not a portable login backup. Old alpha.1 in-memory cookies cannot be recovered: log in once after upgrade. Platform expiry requires a new login. Bilibili/open-platform grants remain session-only. Logout removes the browser session; separately deleting saved login details removes the optional account/password. Disable/uninstall retains data. Linux has no production secure-storage implementation in this candidate and must report unsupported rather than write plaintext.

Alpha.2 → alpha.3 fixes login polling only; no schema or data migration. Preserve the full data directory and Profile backup when replacing the package.


## Alpha 0.6 Windows executor candidate

The Core package changes to 0.2.0-alpha.6; module schemas and existing platform IDs remain unchanged. The xiaohongshu-browser ID is retained for permissions/history. Native executor data is additive under Core data/xhs-executor/<Workspace digest>; no old browser-vault credentials are copied or deleted. New cookies/seed are CurrentUser DPAPI envelopes; account-binding.json stores only Workspace/account metadata. A native session is not portable across Windows identities. Preserve both new and old directories for rollback.

This candidate supports QR and read-only platform execution. Social operations are deliberately unavailable pending real acceptance; old permission records are retained but cannot bypass the native adapter's read-only gate. Closing settings does not own service lifetime. Host pipe EOF terminates the service; Windows Job Objects terminate browser children. Disable/uninstall preserves data. The explicit clear-account action deletes only this Workspace's native credential envelope, encrypted predecessor and binding; it does not delete Memory or other modules.

Before replacement: stop DSH, copy Core data, installed package, Profile manifests/lock/configuration and previous archive; check copied SQLite integrity. Roll back by reinstalling the preserved alpha.5 package and restoring matching Profile metadata if necessary. Alpha.5 ignores the additive native directory; its old BrowserVault remains intact. Do not claim old Edge restoration is reliable, or downgrade a future migrated database without a corresponding snapshot.

2026-11-04: Bilibili social/persistence adds no database migration. Follow DATA_MIGRATION.md Bilibili addendum; preserve journal, budget, encrypted vault and earlier package. Website API compatibility is not guaranteed by Desktop version compatibility. DSH upgrade must preserve Profile/Workspace and verify actual Core startup before reporting success.
