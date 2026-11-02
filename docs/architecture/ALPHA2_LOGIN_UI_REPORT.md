# Core alpha.2 login and UI verification

2026-11-03. Candidate only; PR #2, no merge/release/social posting.

- Windows CurrentUser DPAPI protects per-Workspace dedicated XHS browser storageState and optional account/password. Identity is revalidated on restore; logout invalidates saved session. Account details are never returned by the API. QR/SMS remains official XHS login; password prefill only where the official visible form supports it. No promise of permanent login. Bilibili remains QR with session-only credentials.
- UI retains all four module implementations, unifies cards, alignment, spacing, focus and light/dark colors. Persona uses a same-origin stylesheet under existing CSP. Memory graph and original pages remain present.
- Core: 152/152 pass (serial execution). Initial parallel run had a transient local HTTP fetch/form failure; targeted test and full serial suite passed without weakening assertions.
- Retained module suite: Life 213, State 143, Persona 49 passed. Memory 2713 passed, one local HTTP transport failure and one existing Windows symbolic-link skip; failed search test passed on targeted rerun. CI remains authoritative for complete Linux coverage.
- Real Edge engine, synthetic intercepted XHS endpoints: cookie close/resume, adapter restart, identity, logout and social selectors passed. This is NOT real-account social acceptance.
- Official isolated DSH CLI 0.2.1-rc.3: all eight main pages in light/dark, theme roundtrip, narrow viewport, field alignment, encrypted save/forget via actual GUI passed. Screenshots in docs/evidence/alpha2-*.png. Main Desktop target is 0.2.1-rc.5; native screenshot access unavailable, no native UI claim.
- Build and package content check pass. Module schemas unchanged: Memory ACL2, Life10, State2, Persona1; Core JSON1. Existing migration/rollback tests retained. New vault envelope schema1 requires same Windows user keys.

## Usage
Open Platforms → Xiaohongshu Browser → settings → connect. Complete official QR/SMS once. Close browser freely after confirmation; subsequent reads can restore a background browser. After restart Core verifies saved account before using it. If expired, reconnect. Optional saved account/password is encrypted; a missing official password login is not emulated. The previous alpha.1 in-memory session requires one new login.

## Deployment
Overwrite installation is user-authorized. Preserve all Core data, current Workspace sessions and QQ configuration. Take a stopped data/Profile backup and keep the previous package. No NapCat changes, no real social operations. No npm, tags, Release, Market or merge.

Main Desktop 0.2.1-rc.5 overwrite installation completed on 2026-11-03. Stopped complete Core/Profile backup retained privately at `private/core-alpha2-install-20261103`; installed alpha.2, normal launch. QQ config equality verified and only Core + QQ Amadeus bundles retained. No session deletion or module reinitialization performed.
