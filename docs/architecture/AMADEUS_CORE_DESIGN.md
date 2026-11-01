# Amadeus Core — source-reviewed integration design

Status: implemented development candidate; see current test report; candidate 0.1.0-alpha.1. No production migration or release.

## Verified baseline
Memory 1.3.0 exports an arrow apply/disposer, requires tools/systemPrompt/llm/agentDefaultModel/commands/webServer and provides amadeus.memory. It owns Workspace-bound SQLite, scoped Dream/Sleep and all ACL gates. Its internal identity remains dsh-mneme. Life 1.2.1 provides life, acquires a runtime lease and owns the only wake scheduler. State 1.2.0 provides amadeusState, observes session events and registers runtime context, with no scheduler. Persona 1.2.0 owns exactly amadeus:core-persona and amadeus:scene-persona sections, with trusted Workspace/QQ resolution.

Evidence: each module src/index.js, Memory src/unified-runtime.js and workspace-binding.js, Life src/workspace*.js, State src/service.js, Persona src/service.js. Source snapshots/hashes are recorded during import.

## Packaging and module boundaries
One public npm package and one Bundle patch entry amadeus-core. No runtime dependencies on the four old npm packages and no installation of their Bundle patches. Retain selected module runtime sources/resources/tests with upstream provenance, not repository metadata or data. Core creates child Cordis scopes for lifecycle and inject dependencies, retaining compatibility service/tool/prompt names. Original algorithms stay inside their modules. One client loader entry composes existing views inside unified navigation and a revisioned Core configuration bridge.

## Lifecycle and ownership
Before mounting modules, inspect trusted Host configEditor entries and reject enabled standalone module conflicts; default Core data lives in its own data root, never legacy defaults. Legacy/core shared-path adoption is forbidden. Migrations copy consistent snapshots to a new Core root after old writers are stopped. Even a later legacy activation cannot write Core copies. Module error/disposal must leave unrelated data intact. No platform starts without explicit enablement. Core owns module handles and reverses disposal order; Life alone owns wake scheduling.

## Workspace and identity
One Core Workspace is validated by official workspaceRegistry IDs, propagated into preserved module binding APIs before activation. A saved change is distinct from a running binding; partial bindings fail closed. QQ remains optional, its provenance version and trusted Session mapping remain authoritative. Ordinary Session identity uses real Host headers and existing Memory ACL. No title matching and no arbitrary identity accepted from model arguments.

## Shared persistence, not merged databases
Retain Memory schema 2, Life 10, State 2, Persona JSON 1. Core configuration/experience journals have their own explicit schema. Preserve source stores and backup manifests; never delete or rewrite the source data. SQLite snapshots use SQLite backup/VACUUM INTO semantics to capture WAL state. New-root activation is committed only after content/schema validation. Interrupted staging remains recoverable; rollback points to untouched legacy snapshots, not downgraded new databases.

## Activity and platforms
Extend Life providers and activity state/receipts, not a second timer. One trusted persistent Activity Session per bound Workspace is created through Host sessionController. Idle costs no model call. Deliberating can decline work; Exploring has request/step/time limits and durable checkpoints. Register internal Bilibili/Xiaohongshu descriptors as unsupported until capabilities are verified. A clearly labelled deterministic simulation adapter exercises two-platform continuity without claiming live platform use. Default all writes denied, recheck permissions immediately before execution, unknown receipts are not retried automatically.

## Experience and QQ
Experience origin comes from trusted adapter registration and Host Session mapping. Separate observed evidence from interpretation and action receipts. Use idempotent IDs, bounded logs and existing Memory service under unified Session ACL. Expose a versioned Host API which authenticates caller Session at read time; no cross-module arbitrary DB writes. QQ remains solely responsible for transport and send permissions, and paused QQ stays paused. Owner followup retrieval uses the same ACL; do not treat shared identity as an implicit grant.

## GUI and settings
Core overview, Persona, Memory, State, Life, Platforms, Experiences, Settings. Preserve mature module subpages and important controls; expose one revisioned Owner-authenticated configuration authority. No model configuration-write tools. Native settings and sidebar point into the unified view. Platform capabilities labelled simulated/unsupported/verified truthfully. State/Life field metadata reused; no schema step restriction regression.

## Risk and gates
Must test actual Desktop 0.2.1-rc.3 bundled runtime, optional QQ, dual installation conflict, disabled modules, lifecycle disposal, original tests, migration rollback and interrupted activity recovery. UI composition and configEditor contract are implementation risks, not assumed passed. No real QQ/social outbound in this task. DSH headless delegation is unavailable; no production configuration changes made to enable it.

