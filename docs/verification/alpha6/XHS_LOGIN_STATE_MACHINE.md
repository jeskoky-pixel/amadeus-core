# Login evidence state machine

Implemented isolated controller distinguishes login_requested, waiting_scan, website_authenticated, session_persisted, identity_verified, ready_for_read, restore_verifying, restored, login_expired, session_invalid, storage_failed, identity_mismatch and service_unavailable. It coalesces concurrent QR requests, defaults to a 15-second status cooldown and ignores late cancelled results. Temporary service errors retain prior verified identity. Account mismatch never binds.

`ready_for_read`/`restored` additionally require a trusted Host read receipt for the same Workspace/account and XHS note URL. This internal method must not be exposed to models or ordinary client writes. Current tests inject evidence; they prove state rules only. Storage inspect/bind are contracts, not implemented durable persistence.

Pending: server-owned background loop, verified scanned stage (upstream may not expose it), precise transport/platform rate-limit mapping, encrypted storage binding, Host authorization and GUI. A UI timer must not drive login. No live login, saved account or restored claim is made.

> Follow-up 2026-11-03: [Windows blocker diagnosis](XHS_WINDOWS_BLOCKER_DIAGNOSIS.md) supersedes earlier unresolved-cause statements. Low-integrity executable/Medium-directory mismatch explains seed creation denial; historical Defender quarantine is confirmed; original Chromium fails SideBySide despite complete matching archive. Gate A remains FAILED. New HTTP/probe and identity/read states do not imply live acceptance.
