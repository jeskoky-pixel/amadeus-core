# Bilibili WBI search verification — 2026-11-05

- Prior implementation used unsigned `/x/web-interface/search/type`; live search failed with HTTP 412.
- Updated to `/x/web-interface/wbi/search/type`, nav-derived WBI signature, browser User-Agent and search Referer. Adapter 0.3.1; Bundle remains Alpha 0.6.
- Validate key shape, cache for ten minutes, validate page, remove title highlighting, reject risk vouchers rather than claim empty success. HTTP 412 maps to rate-limited. No automatic challenge retries or device rotation.
- Real read-only test restored the existing Windows DPAPI Bilibili login without scanning. Query `人工智能` returned 10 video results; public popular browse also returned 10. This proves the updated adapter against the live upstream, not yet the installed Host path.
- Core regression: 212/212 passed, zero skipped. Build and pack checks passed. Includes exact WBI signature, headers, key expiry, challenge cooldown, logout race, HTTP 412 classification and existing social isolation coverage. Retained four modules unchanged.
- No new social writes, NapCat changes, data migrations, Release or npm publication.
- References: https://github.com/Alterssss/dsh-bili-whale/blob/main/tools/commands/search.mjs ; https://github.com/QiuYeDx/dsh-bili-eyes/blob/main/src/bili-api.js
