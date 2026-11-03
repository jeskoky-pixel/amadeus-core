# Windows XHS executor candidate

Upstream: xpzouying/xiaohongshu-mcp v2.7.0, commit d6352e5435b45ebb48fe240dc03a2bec0476bd56, Apache-2.0. The main Core license is unchanged. See NOTICE.md and the packaged upstream license.

The reviewed overlays replace browser ownership/storage, not the platform algorithms. Installed Microsoft Edge must pass Authenticode publisher verification. Browser startup is suspended, assigned to a kill-on-close Windows Job Object, then resumed. There is no leakless extraction, bundled-browser fallback, no-sandbox flag, stealth injection or fingerprint spoofing. Real XHS runs in an off-the-record browser context. Service death closes the Job handle and terminates its browser children.

Every saved session (including seed) is DPAPI CurrentUser encrypted before disk. Atomic replacement keeps an encrypted predecessor. Corrupt/unknown files are rejected rather than reinitialized. Core creates dedicated same-user/SYSTEM directories. Account/Workspace bindings are separate non-secret metadata; old Edge vaults are retained and not imported.

Build with PowerShell 7, Node and Go 1.27.3: `./services/xhs-executor/build.ps1`. It uses a new isolated checkout, verifies the pinned commit, applies these overlays and emits lib/xhs executable, manifest/hash and license. Never execute or change labels on the old blocked binary. The compiler is a developer/CI dependency, not an end-user prerequisite. The npm archive includes the Windows executable. Linux CI validates Core but does not advertise native XHS support.

Live preflight (explicit isolated Windows environment): set AMADEUS_LIVE_PREFLIGHT=1 and run `go test ./cookies ./browser -run 'TestDPAPISessionRoundTripAndCorruption|TestSignedBrowserNativeJob' -v` in the prepared checkout. No QR scan or real account is part of those tests. Gate B still requires the account owner.
