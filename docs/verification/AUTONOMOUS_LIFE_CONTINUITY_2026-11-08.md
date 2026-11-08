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

The Activity Session system-prompt section now appends a short derived context on each legal wake. It may contain:

- up to five current State interests from that Session;
- up to three recent stored Experience topics from that Session, each with a short event reference;
- up to two active Life intents in that Session scope;
- one running/paused activity checkpoint when it is already present;
- enabled autonomous platform read capabilities and remaining budget.

The context is generated synchronously in the existing prompt section. It does not create a second model call, scheduler, database, or global summary. Non-Activity Sessions receive an empty context. External text remains untrusted data, and the model is explicitly free to continue, create a legitimate Life intent, organize, or rest.

## Automated evidence

The new `tests/experience-continuity.test.js` covers:

1. Memory exactly once plus State retry and idempotent no-replay;
2. missing evidence refusal;
3. data-generation change refusal;
4. Activity context ACL/session isolation;
5. source-backed topic extraction and unknown-topic behavior.

Verification completed on Windows:

- Core tests: 230 passed, 0 failed.
- Module tests: Memory 2745 passed, Life 218, State 143, Persona 50; all groups passed.
- `npm run build`: passed.
- `npm run pack:check`: passed (`@fg-lab/amadeus-core@0.2.0-alpha.6`, 427 files).

## Natural-life boundary

The existing real ledger proves wake generation, delivery, tool projection, and prior controlled platform reads. It does not prove that a future natural wake will choose a platform, create an intent, or produce a new Experience. The model retains the right to rest. This branch adds the missing source-backed clues and recovery path; it does not manufacture a new wake or claim a natural exploration that did not occur.

No QQ plugin, Mneme internals, platform account, external social action, or user data was changed by this branch.
