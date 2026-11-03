# Alpha 0.6 workstream checkpoint — NOT complete delivery

Base PR #2 remains Draft at `58100fa668ec145d55d73e2d8be038f6780b9b0c`, base main `f99dcb0e95ecd3fbc1ff7ddf34e08696d80d860c`. Branch `codex/xhs-local-backend-alpha6`; existing HTTP boundary preserved in `180a6369d153a3caf9686eb2a077371f64707832`. Subsequent commit containing this report adds unregistered lifecycle/state code and tests. Package stays 0.2.0-alpha.5 because this is not a runnable Alpha 0.6 replacement.

Completed: source/backup preservation, pinned upstream review, real isolated HTTP startup/auth checks, injected Supervisor/state controller and 21 focused tests, Core suite 179/179, build and package asset checks. Backup branch: `backup/pre-xhs-service-rebuild-20261103`; source bundle and private online snapshots retained outside repository.

Blocked Gate A: cookies seed write denied and missing leakless.exe prevent browser-dependent status. Underlying cause is unresolved; this was an actual runtime failure, not a rejected tool launch. Browser cache publisher integrity, production Supervisor, Go DPAPI storage, GUI and Core runtime integration are still unfinished. No QR requested; no real account ID/read/recovery verified.

See XHS_REAL_LOGIN_ACCEPTANCE.md for all six mandatory checks. Do not mark this PR ready or replace the main DSH. No npm, Tag, Release, Market, production install, QQ/NapCat change, session deletion or data cleanup occurred.

Next sequence: resolve isolated executable storage/browser startup without weakening security; verify browser distribution; complete protected storage and production Supervisor; pass Gate A including QR generation/cleanup; then one user login for Gate B; only after that implement/validate Gate C and UI against real persisted identity. A draft checkpoint is not completed product delivery.

## Retained module regression (Windows, 2026-11-03)

- Life: 213/213 passed.
- State: 143/143 passed.
- Persona: 49/49 passed.
- Memory: 2715 tests; 2713 passed, 1 failed, 1 skipped. The failure is the existing strictPort busy-port test: `listen EACCES 127.0.0.1:1166`. No module implementation or assertion was changed to hide it. This run is not fully green. The existing skipped test remains skipped; no Linux result from this increment is asserted.

No main DSH installation or data modifications were performed. The service test was stopped after evidence collection.

Targeted follow-up: the same Memory `strictPort: busy port` test passed 1/1 in isolation without code changes. This supports a transient/concurrent environment failure but does not establish its cause or erase the failed full-suite result. The skip is the existing Windows symlink creation test. No repeated full-suite run was used to mask either result.

> Follow-up 2026-11-03: [Windows blocker diagnosis](XHS_WINDOWS_BLOCKER_DIAGNOSIS.md) supersedes earlier unresolved-cause statements. Low-integrity executable/Medium-directory mismatch explains seed creation denial; historical Defender quarantine is confirmed; original Chromium fails SideBySide despite complete matching archive. Gate A remains FAILED. New HTTP/probe and identity/read states do not imply live acceptance.
