# Windows Gate A diagnosis — 2026-11-03

Scope: Draft PR #3, starting at `9d061245779442e7689b44f89dda51b53a6dd6ee` (both Linux and Windows CI passed). No production installation, real login, social write, security exclusion or isolation-label change. Times below are Asia/Shanghai. Private raw logs and non-sensitive probes are outside Git under the Alpha 0.6 diagnostic directory.

## 1. Why did Cookie/seed writing fail?

The selected upstream executable has an **inherited Low Mandatory Level (NW/no-write-up) label**, confirmed by `icacls`. Read-only `OpenProcessToken/GetTokenInformation` inspection showed the diagnostic shell at Medium (`S-1-16-8192`), the upstream child at Low (`S-1-16-4096`), both the same Windows user, neither an AppContainer. The destination directory has no Low label (implicit Medium). Windows mandatory integrity therefore denies the low-integrity process creating a file there even though the user DACL grants FullControl. The origin/installer of that inherited label was not established and is not blamed on Defender.

Observed original explicit COOKIES_PATH: `%LOCALAPPDATA%/AmadeusCoreAlpha6/gate-a/cookies.json`. Parent exists, ordinary directory, no Cookie file exists, so there is no existing file lock/read-only attribute to explain this creation failure. A separate fresh path `%USERPROFILE%/Documents/ChatGPT/Amadeus/private/alpha6-windows-diagnosis/synthetic-seed-only.json` reproduced the same failure at 20:27:58. Only startup/seed creation was invoked; no browser-dependent endpoint or real credentials.

Source `cookies/cookies.go`: parent `MkdirAll` then `os.WriteFile`; error begins `open ... Access is denied`, not `create cookies dir failed`. Thus it fails opening/creating the destination before writing bytes or atomic replacement. Upstream itself does not implement atomic replacement here.

In a newly created child of the original gate-a directory, the Medium shell successfully created a synthetic file, wrote bytes, opened exclusively, atomically replaced it with File.Replace (keeping a synthetic backup), and read the replacement. No existing Cookie was touched. This verifies parent storage capabilities for the Host identity, not write access for the Low service. `Get-MpPreference.EnableControlledFolderAccess=0`; this does not assert all application-control policies are absent. No elevation, ACL widening, label modification or relocation of the executable was used as a workaround.

## 2. Was leakless blocked by security software?

**Yes, historical evidence on this exact computer is confirmed. Current-run causality is narrower.** Defender Operational events 1116 and 1117 on 2026-10-24 at 02:35:13/02:35:41 identify `%TEMP%/leakless-amd64-adb80298fa6a3af7ced8b1c9b5f18007/leakless.exe`, `Trojan:Win32/Kepavll!rfn`, ThreatID 2147939874, successful quarantine. Get-MpThreatDetection corroborates it. The associated process was the earlier v2.5.5 executable under Kurisu-DSH, not the present v2.7.0.

The helper and its temporary directory are now absent. No new matching Defender event was found in the recent three-day query; a wider 3000-event read found the historical pair. CodeIntegrity: 1373 available events (2026-09-01 through 2026-11-02), no matching helper/browser path in rendered messages. AppLocker query had no events. These searches are bounded evidence, not proof that all policy/audit channels are complete. The current v2.7.0 missing-path error is also consistent with inability of the Low process to create a directory in Medium Temp. It must NOT be reported as a newly confirmed Defender quarantine.

Source chain: xiaohongshu-mcp v2.7.0 → headless_browser v0.4.0 → go-rod v0.116.2 launcher → leakless v0.9.0. Rod enables Leakless by default. leakless decodes its embedded compressed helper into the versioned Temp path. Its `utils.OutputFile` ignores the parent Mkdir error, then returns WriteFile's missing-path error, obscuring the original directory failure. No helper was re-extracted/restored/executed after discovering the security history.

## 3. Can bundled Chromium independently start?

**No.** The publisher CDN archive SHA-256 is `5ae94143fa323167b7085242504e05dc8eeb6d96ca5feb80c887ade36f242b40`, matching its SHA256SUMS. All 76 archive files match the installed cache byte-for-byte; none are missing or changed. This verifies correspondence to that publisher distribution, not independent publisher trust or malware certification. chrome.exe is unsigned. Its local SHA-256 is `1867319e56bcabbc4681d8575c002106ce7b61b5290dc5eb34a37676805f6915`.

A direct, sandbox-enabled, headless about:blank attempt (no leakless, no platform login) fails before browser execution with SideBySide configuration error. Application event 33 at 20:28:34 states that dependent assembly `148.0.7778.215`, type win32, version `148.0.7778.215`, cannot be found. The executable's embedded manifest requests this assembly. The distribution does contain the 228-byte version manifest and chrome_elf.dll; their presence is insufficient for Windows activation. No DLL/manifest files were changed to force startup.

## 4. Upstream defects/compatibility issues

Issue #879 (v2.5.5, same browser build) describes matching symptoms. Our independent browser event and complete-archive comparison confirm a distribution/runtime compatibility problem here; the precise upstream packaging/assembly-resolution correction still needs upstream review. Issue #27 discusses leakless failures; its suggestion to add antivirus exclusions is expressly rejected. Historical similarity alone was not used as diagnosis.

Additional source findings: cached browser presence bypasses repeat integrity checks; cookie saving is plaintext/non-atomic; leakless swallows Mkdir errors; `CheckLoginStatus` intentionally leaves is_logged_in=true when CurrentUser fails (only warns), so user_id can legitimately be absent. headless_browser also forces `--no-sandbox`; this is not carried into our alternative blank-browser probe.

## 5–6. Is unmodified v2.7.0 suitable; what replacement is credible?

**Not directly suitable for this Windows production installation.** Keep the REST/client/state/Supervisor work; do not keep retrying its flagged helper or install it in main DSH.

Reviewed alternative boundary: a separately audited execution backend using a vendor-signed installed browser, Host-owned isolated profile, normal browser sandbox, and Windows Job Objects for process-tree lifetime. Keep Core ACL/journal/Memory/Life unchanged. The installed Edge signature validates as Microsoft Corporation; an independent isolated headless about:blank run exited 0 and returned an empty HTML document. It used no user browser profile, account, helper, or security exclusion. This proves basic browser feasibility only, not XHS compatibility or persistent login.

A possible upstream fork would need an explicit browser selector and a replacement launcher/process owner. Rod's documented `Leakless(false)` selects native exec rather than the embedded helper, but flipping this flag alone is NOT an approved fix: it loses the helper's kill-on-parent-exit contract. Implement reviewed Job Object assignment before resuming child execution, handle Host/service crashes, forbid arbitrary CDP endpoints, remove forced no-sandbox, and test process cleanup before platform access. Do not disguise/rename the helper, suppress detection, or silently fallback to an unverified browser. This is a replacement of component functionality, not execution of the blocked binary.

For persistent storage, a reviewed authenticated Host storage broker or a reviewed upstream DPAPI backend is required. Preserve OS trust boundaries: do not grant the Low service broad access to the Core data directory. Protect bytes before every disk write, use atomic replacement/backup, and bind Profile/Workspace/account. No such production storage is claimed implemented by this diagnosis.

## 7. Gate A

FAILED: HTTP startup and previously tested authentication are available; original browser is not launchable; original service cannot create its seed at the required destination; QR not generated. Stop affected execution. CI success is not Gate A success.

## 8. Before Gate B

Need an accepted browser/process implementation; independent authenticated HTTP/browser/storage/QR probes; browser integrity/signature policy; protected atomic storage with same-user ACL and corruption/rollback tests; stable account-ID behavior; process crash/restart/cleanup tests. Do not use any real account while plaintext persistence remains.

## 9. Can later acceptance use one scan?

That remains the goal, not a verified capability. Only after the above prerequisites pass: scan once, confirm ID + encrypted saved session, close console/login window and read; restart service and read; restart isolated DSH and read with the same ID and Workspace. Stop at first failure without clearing credentials or asking for speculative rescans.

## Core corrections in this PR update

Supervisor state after health is now `http_ready`, never generic `ready`. HTTP, authentication, browser, storage and QR have independent immutable diagnostic statuses/timestamps and sanitized codes. Missing Host probes remain not_checked; failed prerequisites block QR. `loginPrerequisitesReady` is a runtime probe summary, not a signed-off acceptance report or account-login claim. Stop invalidates evidence; bounded probes and epoch checks reject late results. Host-only injected probes are not configured by models/UI and are not production adapters yet.

LoginController separately reports identity and read readiness. An upstream logged-in response without user_id remains website_authenticated/identity pending, with needsRescan=false. Repeated begin calls do not generate QR in that condition, while account-dependent operations still fail closed. No nickname inference or permission relaxation.

References: [Issue 879](https://github.com/xpzouying/xiaohongshu-mcp/issues/879), [Issue 27](https://github.com/xpzouying/xiaohongshu-mcp/issues/27), [Rod launcher](https://github.com/go-rod/rod/blob/v0.116.2/lib/launcher/launcher.go), [leakless source](https://github.com/ysmood/leakless/blob/v0.9.0/leakless.go), [mandatory integrity](https://learn.microsoft.com/en-us/windows/win32/secauthz/mandatory-integrity-control), [Windows Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects).

## Hash/source verification and validation

The selected upstream service EXE SHA-256 `0b03fa24b00f15fffa34fff3c10ef9d938a5f0c3e7fb51ee46c8fc6437dd622b` matches the v2.7.0 GitHub Release asset digest retrieved in this diagnosis. This verifies asset identity, not browser runtime/security compatibility.

Local Core suite: 184/184 passed (26 focused XHS tests included). Build and pack asset validation passed, 399 files. No four-module code changed, so no redundant full module run was added. Main DSH remained untouched. New PR CI status must be checked on the final commit; the prior green CI applies only to the initial commit. Test processes were stopped; no matching diagnostic browser/service process or listener on 33062 remained.
