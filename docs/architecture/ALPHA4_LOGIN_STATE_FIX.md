# Alpha.4 login state correction

2026-11-03. Local AccountManager polling interval previously threw the same RATE_LIMITED code used for remote throttling. Automatic and manual checks could collide. Checks during cooldown/in-flight work now return current pending state without another adapter call. Remote provider errors remain errors. Terminal missing/expired/mismatched login clears only that challenge, never a newer login. Client polling has an in-flight guard, pauses during manual actions, refreshes on failure, clears stale errors on success, stops on terminal failures and disables duplicate Begin while pending.

Core 157/157, real Edge synthetic fixtures 2/2, build and pack checks passed. New regressions cover duplicate calls, cooldown and stale failure racing a newer login. No page refresh is added. The main account metadata still contained no confirmed account/saved session before installation; this report does not claim real XHS account acceptance. No social actions performed.

0.2.0-alpha.4, no schema change. Preserve stopped Core/Profile snapshot and QQ during authorized replacement. No merge/release/npm publication.
