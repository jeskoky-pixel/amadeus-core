# Upgrade policy

Core is an unreleased `0.2.0-alpha.1` candidate. It is not a replacement recommendation for production yet.

Code and user data are separate. The default data root is `DSH_HOME/amadeus-core`, not the npm installation directory. Disabling/uninstalling the Bundle must not remove this directory. Module data formats remain Memory SQLite/ACL 2, Life SQLite 10, State SQLite 2 and Persona JSON 1; Core metadata is JSON schema 1.

Every future migration must validate the prior schema, take a consistent recoverable snapshot, preserve existing identities and references, and test interruption and rollback. Restoring old code alone does not imply database compatibility. An unsupported schema must fail closed.

Before a release, test previous stable version → synthetic populated data → update → restart → content and permission checks. Retain the prior artifact, checksum, configuration and compatible data snapshot. A minor release must not silently remove existing functionality.


Alpha 0.1 → 0.2 is additive: Core schema 1 and all four module schemas remain unchanged. New platform-accounts.json schema 1 stores only account metadata; credentials/pending grants are memory-only. Existing Mock grants never enable real adapters. Optional platform cooldown/autonomy fields default safely. Older Core ignores new account metadata; preserve the full Core data directory and previous package before downgrade. Account login must be repeated after restart.


Dedicated XHS browser addendum: module schemas are unchanged. Additive `platform-actions.json` schema 1 stores hashed semantic action IDs, platform/account/Workspace/Session/note identities, timestamps and pending/confirmed/unknown outcomes; it stores no comment bodies, URL security tokens or browser credentials. Preserve it with `platform-budget.json` and `core.json` during backup and restore. Pending reservations after restart are treated as unknown and cannot replay. Never delete this journal to retry a send. Account contexts are ephemeral and require login again. Old versions do not execute this new adapter; keep the journal if downgrading. Disabling/uninstalling Core must preserve these files. Optional per-platform social configuration starts with empty note/Session grants.
