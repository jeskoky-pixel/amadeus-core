# Alpha.3 login polling fix

2026-11-03. A user-reported repeated refresh was caused by pollLogin calling readSelf, whose active verification reloads the page. Pending login now only reads identity captured from the exact official user/self response listener. QR and SMS entry are not navigated or reloaded by polling. Explicit post-login account verification retains its existing identity check.

Validation: Core 155/155; dedicated adapter 27/27; two real Edge engine synthetic fixtures pass (all network intercepted). New fixture polls five times, asserts one document load and unchanged input, then emits an actual browser self response and confirms account recognition. Existing cookie close/resume and adapter restart coverage passes. Build and package content check pass. No real account login or social action performed by tests.

Version: @fg-lab/amadeus-core 0.2.0-alpha.3. Module IDs, schemas, config and UI unchanged. Owner-authorized overwrite installation preserves Core data and QQ; stopped Profile/data backup retained. No npm, release, tag or merge.
