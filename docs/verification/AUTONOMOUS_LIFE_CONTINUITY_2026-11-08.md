# Autonomous Life Continuity — implementation and verification

This report covers the Core-only continuity work on the independent feature branch. It contains no user chat text, cookies, account identifiers, raw platform receipts, or private Session IDs.

## Runtime baseline

The existing primary DSH environment was inspected read-only before editing. The configured Core workspace, persistent Activity Session, Life allowlist, platform grants, and module switches were left unchanged.

- Life has generated 48 idle wakes with `executed`, one `failed`, and one `uncertain` result in the existing ledger.
- The idle target is the configured Core Activity Session, and the existing projection contains the four Core exploration tools: capabilities, read, interact, and finish.
- The current saved grants enable autonomous read access for Bilibili and the Xiaohongshu browser adapter. Bilibili has browse/search/read/comments/related; Xiaohongshu has browse/search/read/comments. Both retain their configured budgets and cooldowns.
- Existing controlled Activity evidence includes real Xiaohongshu browse/read and stored Experience rows. Recent natural idle wakes mostly ended with a model decision to rest. This is recorded as a legal autonomous decision, not as a failed platform call.
- No paused model activity was found requiring forced recovery. The existing Life intent from the earlier controlled opportunity is cancelled; no new intent was fabricated during this task.

The candidate package was first installed into an isolated npm profile and loaded directly from its installed package path. A synthetic Activity Session call against the installed runtime returned the real State field contract (`name`, `baseline`, `activity`, `source`), a source-backed Experience topic, and explicit platform status fields. The isolated installed `src/core/runtime.js` SHA-256 was `12B012678FFB9ADB78C0E5FDAD2C778BECE51998A407378993B58939E65D1317`.

Before touching the primary DSH, the full desktop profile and Core package were backed up under a timestamped local backup. The primary Profile was then restored after an initial package-manager compatibility check and the candidate Core directory was replaced in place, preserving all other dependencies and the QQ package. The primary installed Core runtime SHA-256 is the same `12B012678FFB9ADB78C0E5FDAD2C778BECE51998A407378993B58939E65D1317`. Official DSH Host was restarted from the existing desktop executable. Port 3081 is listening, the Host process points at the desktop Profile, and the Core's `amadeus-xhs-executor.exe` child is running from the installed package.

## Experience → State continuity

`Experiences` keeps `status: stored` as the meaning “Memory accepted this experience.” State linkage now has an independent bounded state machine:

- `pending` after Memory succeeds;
- `applied` or `duplicate` after the existing `core:${eventId}` idempotency key is accepted by State;
- `temporarily_unavailable` for bounded retryable storage/integration failures;
- `permission_denied` for a revoked or unauthorized Session;
- `source_invalid` for missing/tampered evidence or a changed data generation;
- `not_applicable` for social operations that are not State read events.

Recovery runs once at Core mount for at most 20 stored candidates and again when the same event is safely reprocessed. It scans the current Mneme history for a unique readable `evidence[].ref` match instead of treating `eventId` as a Mneme Memory ID. If the match is ambiguous or the lookup is unavailable, recovery remains retryable and does not write. It reads the existing evidence through the current Memory ACL, never replays a platform request, never creates another Memory row, and uses the existing State idempotency key. Workspace, Session membership, data generation, evidence hash, Memory readability, and State scope are rechecked before recovery writes. Core shutdown skips reconciliation, so no late write is scheduled against a closed database.

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

The new `tests/experience-continuity.test.js` covers 15 focused continuity cases:

The suite covers Memory exactly once with State retry and idempotent no-replay, missing evidence and data-generation refusal, real State `name`/`baseline`/`activity` data, Activity context ACL and Session isolation, shared and isolated State scope, malicious external title and Life intent handling, source invalidation and cache refusal, Memory-success pending recovery without a second Memory write, State-success receipt persistence failure with idempotent recovery, shutdown waiting for in-flight Experience work, and platform account, budget, cooldown and readiness states.

Verification completed on Windows:

- Core tests: 241 passed, 0 failed.
- Module tests: Memory 2745 passed, Life 218, State 143, Persona 50; all groups passed.
- `npm run build`: passed.
- `npm run pack:check`: passed (`@fg-lab/amadeus-core@0.2.0-alpha.6`, 428 files).

The focused real-service cases additionally prove that a crash after Mneme commits a generated Memory ID but before the Core journal stores it is recovered by the trusted evidence reference without a second `saveWithDedupe()` call. They snapshot the Memory row, content history, entity records, embeddings, and extractor call counts before and after recovery. The State cases use the real State service and assert shared versus isolated `interestChanges`, rather than relying on mock return values. Workspace migration and Session revocation both fail closed during pending recovery.

Installation evidence:

- Isolated package install: completed, with the structured Activity Context check above.
- Primary DSH backup: completed before replacement and retained locally.
- Primary DSH startup: completed. Host port 3081, Profile-backed Host process, and the Core XHS executor were observed after restart.
- A live authenticated model turn was not generated by this shell-only verification. No natural platform exploration or new Experience was claimed from process startup alone.

## Natural-life boundary

The existing real ledger proves wake generation, delivery, tool projection, and prior controlled platform reads. It does not prove that a future natural wake will choose a platform, create an intent, or produce a new Experience. The model retains the right to rest. This branch adds the missing source-backed clues and recovery path; it does not manufacture a new wake or claim a natural exploration that did not occur.

No QQ plugin, Mneme internals, platform account, external social action, or user data was changed by this branch. The initial npm and pnpm package-manager attempts exposed an incompatible flat Profile dependency layout and were rolled back from the backup before the final direct Core replacement.

