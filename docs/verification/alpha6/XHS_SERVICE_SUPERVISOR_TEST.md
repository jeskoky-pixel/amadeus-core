# Supervisor evidence — 2026-11-03

13 injected lifecycle tests passed: checksum gate, loopback binding, private token, explicit Workspace cookie path, concurrent starts, version mismatch, health timeout, exact-handle cleanup, bounded retry/backoff, stop during startup, cancellation and failed cleanup ownership. Codex review corrected an unref timer that cancelled pending tests and cleanup failures that could permit duplicate processes. A failed stop now retains the handle and blocks further spawn until cleanup succeeds.

This is a scaffold. Production spawn/stop and browser checks, exit observation, secure directory setup and bounded hash/spawn/stop adapter behavior are not implemented. Health timeout aborts the injected check. No claim of complete Supervisor acceptance.

Real isolated upstream: hidden process started; /health 200; loopback 127.0.0.1:33061; unauthenticated /api/v1/login/status 401. Authenticated status returns HTTP 500. Startup cannot write cookies.json (`Access is denied`); browser helper reports missing temporary leakless.exe path. A normal restart reproduced both failures. Cause remains unconfirmed; no Defender exclusion, permission weakening or alternate security bypass attempted.

Exact test service PID was stopped. Subsequent enumeration found no child with its parent PID and no listener on the test port. Because the browser never started successfully, this does not prove complete browser-tree cleanup under normal operation.

> Follow-up 2026-11-03: [Windows blocker diagnosis](XHS_WINDOWS_BLOCKER_DIAGNOSIS.md) supersedes earlier unresolved-cause statements. Low-integrity executable/Medium-directory mismatch explains seed creation denial; historical Defender quarantine is confirmed; original Chromium fails SideBySide despite complete matching archive. Gate A remains FAILED. New HTTP/probe and identity/read states do not imply live acceptance.
