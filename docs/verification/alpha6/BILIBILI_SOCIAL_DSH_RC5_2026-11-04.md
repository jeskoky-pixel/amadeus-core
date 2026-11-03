# Bilibili social adapter and DSH upgrade — 2026-11-04

## Delivered candidate

DSH Official was upgraded from 0.2.1-rc.3 to 0.2.1-rc.5 using its configured official nightly feed (https://download.deepseek.com/dsh-desk/feeds/win-x64/nightly.yml). Installer SHA-512 matched the feed and Authenticode validated the DeepSeek publisher. This is the latest release in that configured channel, not a claim of a stable-channel release.

Core retains package version 0.2.0-alpha.6 as a Draft candidate. Bilibili adapter 0.3.0 adds like, comment and reply execution. Existing Core Activity tools now discover trusted social adapters dynamically; capability discovery exposes actual grants and login availability. Future modules have a documented validator/preflight/execute/lifecycle contract. The four retained modules were not rewritten.

Bilibili reads establish bounded, expiring account/Workspace/Session-scoped targets. Reply ancestry comes from actual returned comments. Writes require verified login, CSRF, supported operation, Owner grant and trusted Activity Session. Durable unknown/dedupe and quotas remain. Website errors/CAPTCHA/risk challenges are not bypassed. Like sets true; it does not toggle. No claim is made for messages, uploads, following, favorites or every possible Bilibili action.

Windows Bilibili login is now DPAPI-persisted after the next successful scan, restored only after online matching identity verification. Synthetic production-DPAPI round-trip and logout/workspace-race regressions passed. Prior in-memory credentials cannot be recovered after restart. Real Bilibili persistence and social-write acceptance remain pending a new login; no public write was sent during this run.

## Validation

- Core: 207 passed.
- Four modules: Memory 2714 passed / 1 Windows skip; Life 213; State 143; Persona 49.
- Real headless browser protocol/DOM fixtures: 2 passed; all platform traffic intercepted, not live account evidence.
- Build/package inventory checks passed; no new production dependency or schema reset.
- Installed rc.5 Host Owner API returned HTTP 200, Core ready, all four modules mounted.
- Original Workspace and Activity Session retained. XHS encrypted account restored and a real Owner read completed, recording a live-read Memory experience and State applied receipt.
- Bilibili grants enabled for all eight implemented operations and autonomous activity per explicit user instruction; daily budget preserved. Existing memory-only Bilibili login was expired after restart. Host read correctly returned LOGIN_REQUIRED. That failed test activity was explicitly finished/cancelled before the XHS read, with no external write.

A stopped backup of the rc.3 installation, full Core data and Profile manifests was taken before upgrading. Old package artifacts remain available. Rollback requires the matching saved installation/package/configuration and data, not deleting journals. No NapCat changes, user-data clearing, npm/Release publication or merge.

## Remaining acceptance boundaries

New-account QR verification is required once to populate the Bilibili DPAPI vault. Bilibili live like/comment/reply and subsequent account recovery were not executed without that login. Earlier anonymous public reads passed browse/details/related; comments/search encountered website risk control. Protocol fixtures do not establish those live operations succeed. Current main is not replaced: changes remain on Draft PR #3.
