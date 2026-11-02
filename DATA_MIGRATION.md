# Data migration

The four databases are not merged. `snapshotModules()` copies four stopped source directories into a new target, rejects links and overlapping paths, uses SQLite's backup API for committed WAL frames, verifies integrity and hashes, and retains failed staging directories. Retrying an unchanged source is idempotent; a changed source never overwrites an existing snapshot.

The Core import control creates an immutable backup and a separate live generation, checks Workspace bindings, then atomically changes the generation pointer. It retains the preceding generation. Failed activation restores the prior pointer. The Owner can switch back without deleting either generation.

The administrator must stop all old writers, including other DSH processes. Current Host configuration and Life/State writer PIDs are checked. Memory has no cross-process writer lease, so the confirmation about other processes remains an explicit prerequisite; the UI must not claim it independently proves all Memory writers are stopped.

This candidate's import UI requires the four source stores to be bound to the same existing Workspace. It does not silently assign an unbound legacy database or merge unrelated histories. Old plugin packages and source data remain intact. Core configuration history is in `backups/core-r*.json`; this is distinct from the complete module snapshot.


Configuration migration: external legacy directories require exactly one disabled Host config entry per module and matching data paths. Unknown fields are retained. Missing/ambiguous configuration fails before stopping modules; the candidate never imports data under silently reset defaults. An internal Core generation copy retains the current Core configuration. Generation switching and rollback switch module configuration atomically with the data pointer. The generation's configuration.json preserves both configurations. Known released default paths are resolved using the retained module semantics: Memory uses ~/.dsh/memory; Life, State and Persona honor DSH_HOME. Resolution never scans for databases and still must exactly match the selected source. Unknown or relative paths fail closed.

## Alpha 0.2 additive platform state
No module database migration is performed. Core JSON remains schema 1. `platform-accounts.json` schema 1 is a separate metadata file; no tokens, cookies or app secrets are persisted. Existing Mock configuration remains unchanged; real IDs start disabled with no permissions. Budget JSON schema 1 gains optional lastCalls timestamps so cooldown survives restart. Preserve these files with the full Core snapshot for rollback. Downgrading code does not authorize deleting the new metadata or any module data.


Dedicated XHS browser addendum: module schemas are unchanged. Additive `platform-actions.json` schema 1 stores hashed semantic action IDs, platform/account/Workspace/Session/note identities, timestamps and pending/confirmed/unknown outcomes; it stores no comment bodies, URL security tokens or browser credentials. Preserve it with `platform-budget.json` and `core.json` during backup and restore. Pending reservations after restart are treated as unknown and cannot replay. Never delete this journal to retry a send. Account contexts are ephemeral and require login again. Old versions do not execute this new adapter; keep the journal if downgrading. Disabling/uninstalling Core must preserve these files. Optional per-platform social configuration starts with empty note/Session grants.
