# Bilibili QR login repair — 2026-11-03

The live QR generate endpoint returned HTTP 200 / code 0 with an official URL at `https://account.bilibili.com/h5/account-h5/auth/scan-web`. Core accepted only the previous passport URL and rejected the valid response with `CORE_PLATFORM_INVALID_RESPONSE` before presenting a QR.

The adapter now accepts the exact new official origin/path and the exact legacy scan origin/path. HTTP, credentials in URLs, lookalike domains and unrelated paths remain rejected. No redirect or arbitrary destination support was added.

The real generate/poll endpoints now succeed and return pending scan. Synthetic AccountManager integration verifies rendering a QR for both official formats without exposing the private polling key. The real account identity and authenticated reads still require the account holder to scan and confirm; they are not inferred from QR generation.

Bilibili remains session-only credential storage in this patch. Closing the settings page does not remove the Host-managed pending login or authenticated account; restarting DSH requires reconnecting. This fix does not claim persistent Bilibili login or add social-write capabilities.

Installed candidate validation: the real DSH Owner GUI displayed the QR after Start authorization; navigating to the platform list and back preserved the pending QR. Core 196/196 passed, build and pack checks passed. Account-holder scan is still pending. No Bilibili account credentials or QR challenges were committed.
