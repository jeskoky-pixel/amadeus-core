# Platform module contract v1

Core exposes a single persistent Activity Session and three model entry points: `amadeus_platform_capabilities` (actual installed capabilities/current grants), `amadeus_explore_read`, and `amadeus_platform_interact`. `amadeus_explore_finish` ends the Life-owned activity. No separate platform scheduler, identity, memory or state is created.

Trusted in-process adapter admission remains contractVersion 2. Modules provide a stable id, mode, version, capabilities and execute(operation,input,context). Optional login methods are beginLogin/pollLogin/validateAccount/restoreLogin/logout/clearSession/dispose; secrets never appear in discovery or receipts. Registration is code-owned, not model/user-URL installation.

A social module declares socialWrites:true. Existing formats use socialTargetKind (`xhs-note`, `bilibili-video`). Future modules may implement normalizeSocialInput(operation,input), validating their native target format and returning canonical id/text/commentId/liked only. Core revalidates bounded opaque IDs and discards extra fields before durable semantic dedupe. This v1 contract supports like/comment/reply; further operation semantics require a reviewed additive contract revision, not arbitrary URL or shell access.

execute receives credentials, immutable trusted Workspace/Session/activity identity, AbortSignal and assertAuthorized(). Call assertAuthorized immediately before every external write and after awaiting responses. Confirmed writes must return matching operation/contentId/status=confirmed; timeout, missing acknowledgment or revocation creates durable unknown, never replay. Platform/account/Workspace/Session scoped observations must prove the chosen target; replies must use observed parent ancestry. Adapter errors may not expose cookies, CSRF tokens or response bodies.

All social modules automatically receive the existing Core Activity Session grant during runtime configuration. Platform capability/operation permission and autonomous switches still apply; adding a module never grants its permissions to other users. Disable/revoke aborts in-flight work; normal package updates do not remove journals, budgets or data. Code-based extension is intentional: this is not an unrestricted HTTP proxy or remotely installed code market.

Bilibili implements public video browse/search/details/comments/related, like, comment and exact-parent reply. It does not implement private messages, uploads, follow, favorites, paid content access or CAPTCHA solving. A website API rejection is surfaced, not bypassed. Independent platform acceptance is distinct from unit/HTTP fixture success.

An optional preflightAction(operation,input,context) performs local-only validation before journal reservation. It must never send or mutate the platform. It prevents a known missing observation/CSRF prerequisite from being mislabeled as an uncertain send. Execute must still revalidate immediately before writing.
