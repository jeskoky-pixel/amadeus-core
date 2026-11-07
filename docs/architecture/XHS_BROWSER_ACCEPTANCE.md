# XHS dedicated browser candidate — implementation and acceptance

Date: 2026-11-03. Package remains private `@fg-lab/amadeus-core@0.2.0-alpha.1`, Draft PR #2. No merge or release. This addendum supersedes the prior blanket “all social writes unsupported” statement only for `xiaohongshu-browser`.

## Implemented

- Separate visible, ephemeral Microsoft Edge context using playwright-core 1.58.2. Explicit user login consent; no normal-profile reuse, storageState export, cookie extraction, CAPTCHA bypass or private signature construction. No browser download during package installation.
- Official XHS device OAuth remains a separate identity-only adapter. The browser adapter captures the website's own exact current-user response and revalidates account identity before work. No profile-title/author-name identity inference. Missing/changed response contracts fail closed.
- Bounded note and comment text reads. Like sets `true`, never blind-toggle/retry. Unknown initial like state refuses the action. Reply locates the exact comment ID; there is no nickname fallback.
- Social confirmation requires the website's matching POST response (note ID, text and parent ID), successful status/code, and matching updated state. Comment proof additionally requires a new server-acknowledged comment ID, current actor, exact text/note/parent and absence from the baseline. Existing matching text alone is insufficient.
- Owner-only configuration and action route. Default platform disabled, no operation permissions, no target note IDs, no Session grants. Specific note and Session allowlists, per-operation daily quota/cooldown, shared request budget, immediate disable/revocation and pre-click authorization checks.
- Durable schema-1 operation journal reserves before dispatch. Semantic fingerprints span Activity IDs and restarts. Unknown or crashed attempts cannot auto-replay. Comment bodies and xsec_token are not in the journal. A completed external action cannot be undone by local revocation.
- GUI: separate login card, reads, scoped social permissions, exact reply target, per-request write-only xsec_token, quotas, journal, stop control, Chinese/English labels, light/dark and narrow layouts. Unknown-result error explicitly tells users not to resend.
- Model social tool restricted to trusted Core Activity Session, global/platform autonomy settings and exact grants. Reuses the existing Life activity/deadline/step budget. No new timer, scheduler, QQ changes or module rewrites. Proven action receipts are separately labeled `live-action`; no adapter/model can manufacture registry evidence.

## Verification actually performed

| Check | Result |
| --- | --- |
| Core full Node suite | 149/149 pass, zero skips |
| Browser adapter unit fixtures | 27 cases included in Core suite; synthetic fake browser, not live XHS |
| Real Edge engine with entirely intercepted website fixture | Pass: actual browser JavaScript, self-response identity, selectors, note/comments extraction, comment, exact reply, desired like and stale-text rejection; zero unrecognized external requests |
| DSH isolated package install | Official Host CLI 0.2.1-rc.3, isolated Web Profile, prebuilt tgz installed through `dsh plugin --profile web add`; no production Profile touched |
| Actual DSH Web GUI | Login consent required; note/grant save and reload pass; disabled platform cannot execute; no page errors; light/dark and 640px layout checked |
| Separate DSH process restart | Note/operation grants retained; platform remained disabled; no login or action initiated |
| Persistent operation safety | Permission/target denial, successful receipt, duplicate suppression across restart/new Activity, unknown lock, quota, cancellation/revocation, malformed acknowledgements and missing-journal refusal pass |
| Four retained modules, local Windows | Memory 2714 pass + 1 existing symlink-privilege skip (2715 total); Life 213/213; State 143/143; Persona 49/49 |
| Client build / npm pack contents | Pass; playwright runtime dependency included; no automatic browser installation scripts |
| Production DSH / QQ / NapCat | Not accessed or modified |

The snapshots below are **actual isolated DSH Web UI**, not native Desktop screenshots and not a logged-in XHS account. The synthetic note ID/Session are test data.

- [Account](../evidence/xhs-browser-account-web.png)
- [Permissions](../evidence/xhs-browser-permissions-web.png)
- [Dark](../evidence/xhs-browser-dark-web.png)
- [Narrow](../evidence/xhs-browser-narrow-web.png)

## Pending real-account acceptance / limits

No real XHS login, note retrieval, comment, reply or like was performed. No fixture result is claimed as live platform acceptance. The site's DOM, current-user request or private response shapes can change; unsupported/missing evidence fails closed. Some note links require their own xsec_token. Reply target must be loaded and verifiable; there is no unbounded comment crawling. Search, recommendations, publishing, following, private messaging and favorites are not implemented in this browser adapter. Edge must already be installed locally. Native Desktop GUI was not rerun in this increment; actual GUI evidence is from the official isolated Web Host.

The next authorized account acceptance should verify self identity, one note read, one specifically approved comment/reply/like and external outcome, then revocation, browser close and reconnect. This is a development candidate, not grounds for automatic production installation or main merge.

## Data and recovery

Core schema 1 and module schemas Memory 2 / Life 10 / State 2 / Persona 1 remain unchanged. `platform-actions.json` schema 1 is additive, outside the package. Preserve it, account metadata, budget, Core config and module stores together. Browser credentials are process/context-local; restart requires login. Retain the previous candidate tgz and complete stopped-data snapshot for rollback. Never clear the action journal to force a retry. Existing module migration tests continue to pass.

## Source/CI

Research-only reference: xpzouying/xiaohongshu-mcp, observed revision d6352e5435b45ebb48fe240dc03a2bec0476bd56 (Apache-2.0). No reference source or Go runtime is imported; adaptations are recorded in INTEGRATION_CHANGES.md. CI adds a real Chromium fixture job step on Linux and Windows, with browser network interception. GitHub run and final source SHA are recorded in the PR update, rather than embedded self-referential commit hashes here.
