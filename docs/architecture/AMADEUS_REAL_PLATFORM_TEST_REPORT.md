> 2026-11-03 addendum: [dedicated XHS browser candidate, safety contract and current evidence](XHS_BROWSER_ACCEPTANCE.md). Statements below that all social writes are unsupported describe the prior device-auth/read-only baseline. Bilibili and official XHS OAuth remain read-only/identity-only.

# Amadeus Core Alpha 0.2 — verification report

Development candidate `@fg-lab/amadeus-core@0.2.0-alpha.1`, based on main f99dcb0e95ecd3fbc1ff7ddf34e08696d80d860c. No release, market submission, production install, user Session deletion, or main merge authorized/performed.

## Evidence categories
| Category | Result |
| --- | --- |
| Core automated regression | 115/115 local pass; final remote CI linked in PR |
| Retained Memory | 2714 pass + 1 Windows symlink privilege skip / 2715; not counted as pass |
| Life / State / Persona | 213 / 143 / 49 pass |
| Existing MCP | Core regression includes real local stdio/HTTP protocol/security tests; implementation unchanged |
| Real adapter protocols | Actual local HTTP server + network transport: Bilibili QR/status/metadata/comments, XHS device grant/userinfo, malformed/timeout/cancel/429/redirect/size errors |
| Account security | Owner+request marker, revision conflict, pending challenge, no credential persistence/echo, cancellation, platform/workspace identities, restart expiry |
| Platform safety | real registration admission, no mock grant inheritance, budgets/cooldowns, post-request revocation, same Workspace/Session, untampered receipt, untrusted content retained as data |
| Public live read | Bilibili BV1xx411c7mD metadata read without account; repeated through actual isolated Desktop GUI, Memory stored, State effect applied |
| Real login | NOT tested with a real user or developer application; user authorization remains pending |
| XHS content | Unsupported because current official scope is basic_info only; no private note APIs |
| Social writes | Unsupported and rejected before network dispatch; no live social action executed |
| Browser UI | Official isolated Desktop 0.2.1-rc.3 / Electron 44.7.0: platform cards, six sections, read/permission flow, Memory/Life/State/Persona/MCP no alert |
| Fresh Web profile | Official DSH Web, same installed bundle: GUI Workspace configuration, light/dark and 640px layout, disabled login without app config; actual screenshots in docs/evidence |
| Packaging | One Bundle, prebuilt client, package content check; private:true; final archive hash in PR delivery record |

Desktop GUI test enabled only Bilibili read, performed one metadata request, checked live-read experience and disabled real platform permissions afterward. No user login was started. Headless native Desktop screenshot capture timed out; committed screenshots are explicitly Web Console screenshots, not native Desktop images. Protocol fixtures and HTTP Owner lifecycle tests cover synthetic login independently of the Desktop's real endpoints; do not interpret this as a completed real-account login in Desktop.

## Upgrade and data
No retained module files/algorithms/schema changed. Memory2/Life10/State2/Persona1 and Core metadata1 retained. Previous Alpha config/Activity Session/unknown fields survive additive upgrade regression. Existing snapshot/WAL/import/rollback tests remain in Core suite. Credentials are session-only by design; reconnect after restart is explicit, not data loss. Installed-candidate restart verified all four modules ready, stable Activity Session, unchanged experience IDs, MCP config preserved, real platforms and global exploration disabled (docs/evidence/alpha02-desktop-restart-checks.json); no production database migration performed.

## Known boundaries
Website Bilibili login/reads are not Open Platform OAuth and may be limited or changed by the platform. Only metadata endpoint has public live verification; search/comments/related and actual account QR need user follow-up. No subtitles, keyframes, danmaku, live platform events or content publishing implementation. XHS official Web device grant requires approved app and Secret; account basic_info does not unlock content. No validated secure persistent credential store, so no plaintext fallback. Full third-party adapter marketplace and arbitrary code installation are out of scope.

## Next user test
See AMADEUS_PLATFORM_LOGIN_GUIDE.md. Review Draft PR, then use an isolated profile and personal account authorization. First validate identity, then one read, source evidence, revocation and reconnect. Do not enable production or social writing based on fixture results.

Dependency audit: npm production audit reported 0 vulnerabilities at this run; not a comprehensive security audit.
