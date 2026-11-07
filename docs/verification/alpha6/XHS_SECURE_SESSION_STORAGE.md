# Secure session storage — not implemented for local service

Upstream v2.7.0 stores readable JSON via os.WriteFile(0644). Session format v2 contains version, seed, saved_at and cookies; old bare arrays are accepted. An explicit COOKIES_PATH avoids implicit temp/current-directory fallback but does not encrypt data.

The existing Edge BrowserVault uses Windows CurrentUser DPAPI. It is not automatically compatible with the Go executor and has not been presented as a solution for its storage. Encrypt-on-exit is insufficient. No real account cookies were collected during this increment.

Required before production: small reviewed upstream storage adaptation with DPAPI before every durable write; atomic replace, encrypted backup, integrity checks, same-user ACL, pending-to-account binding, explicit Profile/Workspace/platform/account isolation, cancellation-safe persistence, revocation and synthetic corruption/recovery tests. On unsupported OS fail closed. Keep seed and cookie structure intact inside encrypted envelope; do not copy old Edge credentials without verification.

Memory/Life/State/Persona schemas and existing account/journal files are unchanged. Preserve old metadata and snapshots; do not silently delete credentials on temporary failure. The preserved alpha.5 snapshot is online with consistent individual SQLite backups, not a globally coordinated stopped snapshot. A stopped production backup is still required before any approved replacement.

> Follow-up 2026-11-03: [Windows blocker diagnosis](XHS_WINDOWS_BLOCKER_DIAGNOSIS.md) supersedes earlier unresolved-cause statements. Low-integrity executable/Medium-directory mismatch explains seed creation denial; historical Defender quarantine is confirmed; original Chromium fails SideBySide despite complete matching archive. Gate A remains FAILED. New HTTP/probe and identity/read states do not imply live acceptance.
