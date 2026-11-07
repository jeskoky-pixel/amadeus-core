# Named Session selectors — 2026-11-03

Life configuration now uses checkbox lists for wake/external-message Session grants and a dropdown for the idle target. Options are scoped to trusted Workspace membership; titles are display-only and stored values remain Session IDs. Duplicate names carry short ID suffixes. Saved unavailable IDs remain visible and are not silently dropped. The Core Activity Session has a friendly display name. Intent/activity selectors also show names.

Validation: 194 Core tests passed, 213 Life tests passed, build and pack checks passed. Selector tests exercise the actual component's change handlers plus duplicate names, missing selections and membership filtering. Initial Life invocation from the wrong working directory failed; rerun from its required module directory passed all 213 tests.

Native Desktop automation could not initialize (kernel asset os error 3). This is not a completed real Desktop click test. Existing account and activity-session data are retained; no test comments are sent to public notes. No schema migration or permissions expansion is part of this UI change.

Full four-module regression: Memory 2714 passed / 1 skipped / 0 failed; Life 213 passed; State 143 passed; Persona 49 passed. Primary Desktop overwrite installation completed; installed resource hashes, existing Activity Session and Life configuration were preserved and verified. The Windows skipped case is not counted as a pass. Desktop real UI and real model/social end-to-end tests remain unverified due to the unavailable desktop automation path.
