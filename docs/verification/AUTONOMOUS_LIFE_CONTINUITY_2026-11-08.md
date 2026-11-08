# Autonomous Life Continuity — implementation and verification

This report covers the Core-only continuity work on the independent feature branch. It contains no user chat text, cookies, account identifiers, raw platform receipts, or private Session IDs.

## Runtime baseline

The existing primary DSH environment was inspected read-only before editing. The configured Core workspace, persistent Activity Session, Life allowlist, platform grants, and module switches were left unchanged.

- Life has generated 48 idle wakes with `executed`, one `failed`, and one `uncertain` result in the existing ledger.
- The idle target is the configured Core Activity Session, and the existing projection contains the four Core exploration tools: capabilities, read, interact, and finish.
- The current saved grants enable autonomous read access for Bilibili and the Xiaohongshu browser adapter. Bilibili has browse/search/read/comments/related; Xiaohongshu has browse/search/read/comments. Both retain their configured budgets and cooldowns.
- Existing controlled Activity evidence includes real Xiaohongshu browse/read and stored Experience rows. Recent natural idle wakes mostly ended with a model decision to rest. This is recorded as a legal autonomous decision, not as a failed platform call.
- No paused model activity was found requiring forced recovery. The existing Life intent from the earlier controlled opportunity is cancelled; no new intent was fabricated during this task.

The new code was not installed into the primary DSH during development. The source, tests, and package checks are the delivered artifacts; the existing runtime evidence above remains evidence of the pre-change Host wiring and permissions. A later controlled install can verify the new prompt context against the same preserved workspace.

## Experience → State continuity

`Experiences` keeps `status: stored` as the meaning “Memory accepted this experience.” State linkage now has an independent bounded state machine:

- `pending` after Memory succeeds;
- `applied` or `duplicate` after the existing `core:${eventId}` idempotency key is accepted by State;
- `temporarily_unavailable` for bounded retryable storage/integration failures;
- `permission_denied` for a revoked or unauthorized Session;
- `source_invalid` for missing/tampered evidence or a changed data generation;
- `not_applicable` for social operations that are not State read events.

Recovery runs once at Core mount for at most 20 stored candidates and again when the same event is safely reprocessed. It reads the existing evidence through the current Memory ACL, never replays a platform request, never creates another Memory row, and uses the existing State idempotency key. Core shutdown skips reconciliation, so no late write is scheduled against a closed database.

The journal schema remains compatible. New fields are optional JSON properties on existing Experience entries; old entries continue to read and are not bulk reprocessed.

## Source-backed interests and Activity context

For read-like platform operations, a short State topic is derived only from verified returned title, description, or bounded comment text. If no such text exists, no topic is written. A single read receives a small bounded event weight and is described as recent observation, never as a stable personality preference.

The Activity Session system-prompt section now contains only static rules. A legal Activity Session can call the read-only `amadeus_activity_context` tool for bounded structured data. The tool marks external platform text and Life descriptions as untrusted data and grants no platform or social permission. It may return:

- up to five current State interests from that Session;
- up to three recent stored Experience topics from that Session, each with a short event reference;
- up to two active Life intents in that Session scope;
- one running/paused activity checkpoint when it is already present;
- State access mode and scope kind;
- platform configuration, account availability, remaining budget, cooldown and current status (`disabled`, `account_unavailable`, `budget_exhausted`, `cooldown`, or `ready`).

The tool does not create a second model call, scheduler, database, or global summary. Non-Activity Sessions receive no context data. Experience topics are included only when the current Memory ACL and raw evidence check both succeed. A cached `stateTopic` is never used after evidence becomes missing, invalid, or unavailable. When the State scope is `shared`, a private non-Activity event cannot write its topic into the Workspace interest. An isolated scope keeps its own topic.

## Automated evidence

The new `tests/experience-continuity.test.js` covers:

The suite covers Memory exactly once with State retry and idempotent no-replay, missing evidence and data-generation refusal, real State `name`/`baseline`/`activity` data, Activity context ACL and Session isolation, shared and isolated State scope, malicious external title and Life intent handling, source invalidation and cache refusal, Memory-success pending recovery without a second Memory write, State-success receipt persistence failure with idempotent recovery, shutdown waiting for in-flight Experience work, and platform account, budget, cooldown and readiness states.

Verification completed on Windows:

- Core tests: 238 passed, 0 failed.
- Module tests: Memory 2745 passed, Life 218, State 143, Persona 50; all groups passed.
- `npm run build`: passed.
- `npm run pack:check`: passed (`@fg-lab/amadeus-core@0.2.0-alpha.6`, 428 files).

## Natural-life boundary

The existing real ledger proves wake generation, delivery, tool projection, and prior controlled platform reads. It does not prove that a future natural wake will choose a platform, create an intent, or produce a new Experience. The model retains the right to rest. This branch adds the missing source-backed clues and recovery path; it does not manufacture a new wake or claim a natural exploration that did not occur.

No QQ plugin, Mneme internals, platform account, external social action, or user data was changed by this branch.
