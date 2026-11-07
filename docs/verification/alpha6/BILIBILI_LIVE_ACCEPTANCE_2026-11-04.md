# Bilibili real-account acceptance — 2026-11-04

Supersedes the pending real-account acceptance boundary in BILIBILI_SOCIAL_DSH_RC5_2026-11-04.md. Runtime under test: Core source 0ae84a1, DSH Official 0.2.1-rc.5. The account holder completed the new login. No computer-use automation was used.

## Verified

- A DPAPI credential envelope was created after login. Restarting the real Desktop restored the same verified account without scanning again. Owner account verification returned success.
- Beginning a login intentionally clears prior platform grants. The user's explicit instruction to enable all implemented Bilibili capabilities was reapplied through the authenticated Owner API; no account-switch permission inheritance was silently introduced.
- Real Host popular browse, video detail and comments completed in the original Activity Session. Each produced a live-read Memory receipt and State applied result.
- One real like, one original content-related comment and one exact-parent reply completed through the Host platform-action route. Each received upstream acknowledgment, a confirmed durable journal entry and a live-action Memory receipt. No retry, reworded resend or duplicate action was made.
- Independent read-back returned liked=1. The hot-comment page did not initially contain the comment/reply. A bounded time-ordered comment read then found the account's exact new comment, and a bounded exact-root reply read found the account's exact reply. This proves visibility in the authenticated account's returned API data, not visibility from every other account.
- Authenticated adapter related-video read returned ten items.

## Remaining limits

Authenticated search still failed at the website boundary (the prior independent probe identified HTTP 412). No anti-bot challenge or platform risk control was bypassed. Do not mark search passed.

This run exercises actual Host execution and persistent Activity Session binding, not a new autonomous-model decision or scheduled outbound wake. Platform returned text/metadata, not full video viewing. It does not claim follow/favorite/message/upload capabilities.

Account IDs, credentials, video/comment IDs, exact posted text and full evidence stay in local private evidence files. The runtime code did not change during this acceptance; no need to repeat the entire 208-test suite for a report-only update. No merge, Release/npm publication or NapCat changes.
