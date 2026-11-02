# Xiaohongshu adapter
Sources checked 2026-11-02: [API reference](https://openaccount.xiaohongshu.com/docs/api-reference), [OAuth flow](https://openaccount.xiaohongshu.com/docs/oauth2-flow), [scopes](https://openaccount.xiaohongshu.com/docs/scope), [error codes](https://openaccount.xiaohongshu.com/docs/error-code).

Official Web integration uses device/code and device/token with an approved app_id/app_secret. Current scope is basic_info only. read_notes/write_notes and richer profile permissions are planned, not implicitly granted. No redirect_uri is required for this device flow.

Original client implements creation, polling (pending/scanned/slow-down), token status, min_user_info, refresh and revoke. Token open_id must match returned user identity. Authorize/auth_app endpoints belonging to the user's platform session are not impersonated. Revoke can require the platform's separate active-unbind approval.

No private signed note/search endpoints, browser-cookie extraction or reverse-engineered anti-bot signatures. execute currently returns unsupported for content and writes. normalizeXhsNote supplies a strict replaceable note/image/comment evidence mapping for a future permitted provider; it is not a claim of live note retrieval. Images are metadata, never vision analysis.

Tests run the actual network transport against a local fake service and separate schema/identity/error fixtures. Real developer-app authorization awaits user action. Login success will mean identity only, not browsing capability.
