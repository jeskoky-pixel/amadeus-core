# Real Desktop / model acceptance — 2026-11-03

This supersedes the earlier desktop-automation blocker: the native helper still fails with kernel asset `os error 3`, but the existing local Electron CDP test path successfully accesses the real, authenticated DSH Owner page. No Owner token was extracted and no authentication check was removed.

## Verified in the existing Core Activity Session

- Named multi-selects and single-select render in the real Desktop. The Activity Session displays a friendly name. A change to the wake interval was cancelled, then saved as 75 seconds, and restored to its original 60 seconds via actual UI controls. Restart retained the saved configuration and same Session.
- Owner platform/read executed real XHS browsing, completed a Life activity, and stored a live-read experience.
- A real DeepSeek V4.1 Flash model turn performed browse -> read -> finish. The first run exposed a genuine Life bug: runtime-context metadata was treated as a user interruption, incorrectly pausing the activity. WakeHost now only preempts for absent/user source kinds, matching the trusted Host human-input convention. Runtime-context/time-context/skill-catalog do not preempt. A real-Life regression also confirms genuine user input still pauses activities.
- After installing the fix, the same model Session performed two real reads and finished successfully with two recorded experiences.
- In a separately authorized bounded model turn, one like, one relevant comment and one exact-parent reply each received an upstream acknowledgment; all three became confirmed durable journal entries and live-action Memory experiences. No retries or extra posts were made. This confirms the execution/acknowledgment chain, not independent visibility to every other account.
- Read experiences have Memory IDs and State `applied` receipts. Activity returns to Idle with completed ledger status. Life delivery is active, timer bound, restart reconciliation done, no unresolved wakes. One actual idle wake had completed a model turn, choosing to stay silent; absence of a post is valid behavior.
- Owner enabled external-message guidance for the Activity Session using the real named checkbox selector; this does not make idle wakes send messages automatically.

## Regression and boundaries

Core: 195 passed after the lifecycle fix. Life: 213 passed. Unchanged module run: Memory 2714 passed / 1 Windows skip; State 143 passed; Persona 49 passed. Build/package checks passed. Real account data, module stores, credentials and original activity binding were preserved.

No merge, release, npm publish or NapCat changes. Screenshots and full real-account evidence remain local; no credentials, public-comment text, account identifiers or browsing content are added to Git. Temporary local debugging is removed after testing. No claim is made for unsupported favorite/follow/message/publish capabilities.

## Final restart and read-back

After restarting the installed Desktop candidate, the authenticated Owner read returned `ok=true` without another scan. Core remained `ready`; Life retained the original Activity Session, named-selector configuration and external-message guidance selection. The like/comment/reply journal still contained exactly the three confirmed actions; restart did not resend them. The new browse experience was stored as `live-read`.

Independent detail read-back confirmed `liked=true`. The returned comment page contained only the first ten entries and indicated more pages; the new comment and reply were not found in that page. Their upstream acknowledgments are verified, but independent public visibility remains unverified. No additional social writes were performed to compensate for this limitation. Scheduled autonomous outbound posting is also not claimed as verified: the observed idle model wake chose silence.
