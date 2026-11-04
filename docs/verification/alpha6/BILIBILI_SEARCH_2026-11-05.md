# Bilibili WBI search verification — 2026-11-05

- Prior implementation used unsigned `/x/web-interface/search/type`; live search failed with HTTP 412.
- Updated to `/x/web-interface/wbi/search/type`, nav-derived WBI signature, browser User-Agent and search Referer. Adapter 0.3.1; Bundle remains Alpha 0.6.
- Validate key shape, cache for ten minutes, validate page, remove title highlighting, reject risk vouchers rather than claim empty success. HTTP 412 maps to rate-limited. No automatic challenge retries or device rotation.
- Real read-only test restored the existing Windows DPAPI Bilibili login without scanning. Query `人工智能` returned 10 video results; public popular browse also returned 10. This proves the updated adapter against the live upstream, not yet the installed Host path.
- Core regression: 212/212 passed, zero skipped. Build and pack checks passed. Includes exact WBI signature, headers, key expiry, challenge cooldown, logout race, HTTP 412 classification and existing social isolation coverage. Retained four modules unchanged.
- No new social writes, NapCat changes, data migrations, Release or npm publication.
- References: https://github.com/Alterssss/dsh-bili-whale/blob/main/tools/commands/search.mjs ; https://github.com/QiuYeDx/dsh-bili-eyes/blob/main/src/bili-api.js

## Installed Host acceptance

- Final runtime code: 8eb8e88779fc0d9d622211121f92e6de6b60bb5d (includes the separately discovered Life concurrency correction).
- Installed archive SHA-256: `6e601dd16557f820f3edd08278c18f9a1a1d7afaf4e8b78d67687c4bad3762e0`.
- Existing DSH plugin reload service completed successfully, without terminating Desktop. Live Core status ready; four modules mounted; Bilibili adapter 0.3.1 loaded and account authenticated.
- Actual Owner `/platform/read` search returned HTTP 200, `ok:true`, activity `completed`, one step and a persisted Experience receipt using the existing Activity Session. No new scan required.
- Independently importing the installed package and searching page 2 returned 10 valid BV video IDs with title highlighting removed.
- Four retained-module regression groups: Memory 2714 pass / 1 Windows symlink skip, Life 213 pass, State 143 pass, Persona 49 pass. Life concurrent old-store opening tests 26/26 passed after correction. The initial Linux CI caught a genuine concurrent migration race; it was fixed rather than marked passed or skipped. Latest remote CI is tracked on PR #3.
- Preserved previous package and Profile manifests/lock under private pre-search-install backup. No user data or account credentials deleted, no forced process termination, no NapCat changes, no new social writes.
