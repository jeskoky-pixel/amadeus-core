# Alpha 6 live read and permission check — 2026-11-03

The user authorized enabling all listed Xiaohongshu permissions and testing the existing dedicated account. Core configuration revision 39 enables browse, search, read, comments, like, comment and reply. Previous configuration is retained by CoreStore revision backups. Autonomous scheduling and target/session restrictions were not broadened.

## Actual results

- Used the installed alpha.6 native adapter and the existing Windows DPAPI-protected account. No QR/login reset or cookie plaintext export.
- Stopped Desktop before standalone execution to avoid concurrent access to credentials. Restarted Desktop after tests.
- Two separate native-service lifetimes restored the same account identity and returned 34 and 30 recommendation items without scanning again.
- A third lifetime returned 33 recommendation items. Search, note detail and comment-detail requests succeeded (18,904 / 8,475 / 8,475 bytes respectively). These are actual platform responses, not fixtures. Comment-detail success does not assert exhaustive pagination.
- Like, comment and reply remain rejected by the native adapter with CORE_PLATFORM_UNSUPPORTED even when their configuration permissions are granted. No real social action was sent. This is a remaining implementation/acceptance limitation, not an authorization success.
- Focused native-adapter and local-client automated regressions: 7 passed, 0 failed, 0 skipped.

## Limits

These checks exercise the installed execution backend and account restoration, not the complete Desktop Owner API, Core Activity Session, Memory/State ingestion or GUI path. Desktop restart followed by an actual Host-originated read is still unverified. Service-restoration evidence must not be reported as complete Desktop acceptance. No changes to NapCat, no release or merge.

Private evidence is retained locally; credentials, account identifiers, response contents and xsec tokens are excluded from this report.
