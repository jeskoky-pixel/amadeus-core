# Amadeus Core development rules

- One public Core Bundle; QQ stays independent. Do not add automatic publishing.
- Preserve module identities, licenses, data, ACL, algorithms and tests. Explain each imported-code adaptation in `docs/architecture/INTEGRATION_CHANGES.md`.
- User data must remain outside the package. Never initialize over existing user data.
- Follow `UPGRADE_POLICY.md`, `DATA_MIGRATION.md`, and `RELEASE_CHECKLIST.md` before changing schemas, migration behavior or public contracts.
- Only synthetic isolated profiles may be used by tests. Do not connect production NapCat or send social actions.
- Simulated platform evidence must always be labeled simulation. Do not report untested adapters as live support.
- Test repairs must preserve the behavior being asserted. Changed security contracts require stronger current assertions, not silent skips.
- Routine implementation and test work can be delegated to the isolated DSH worker; Codex reviews boundaries, evidence and results.

