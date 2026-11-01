import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CoreActivity } from '../src/core/activity.js';

function deferred() {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
}

function session(id) {
  return { id, header: { origin: 'user' } };
}

function makeLife() {
  const calls = { start: [], checkpoint: [], pause: [], finish: [], bindWorkspace: [] };
  let counter = 0;
  const api = {
    async startActivity(input) {
      calls.start.push(input);
      return { id: `activity-${++counter}`, status: 'running' };
    },
    async checkpointActivity(...args) {
      calls.checkpoint.push(args);
      return { status: 'running' };
    },
    async pauseActivity(...args) {
      calls.pause.push(args);
      return { status: 'paused' };
    },
    async finishActivity(...args) {
      calls.finish.push(args);
      return { status: 'completed' };
    },
    bindWorkspace(input) {
      calls.bindWorkspace.push(input);
      return { workspaceId: input.workspaceId };
    },
  };
  return { api, calls };
}

function makeRuntime(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'amadeus-core-activity-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }));

  const workspace = { id: 'w1', title: 'Synthetic workspace', sessionIds: [] };
  const sessions = new Map();
  // A pre-existing synthetic Session so tests that stub activity.session can
  // still exercise the real membership gate in explore().
  workspace.sessionIds.push('sess-1');
  sessions.set('sess-1', session('sess-1'));

  const state = {
    schema: 1,
    revision: 0,
    workspaceId: 'w1',
    modules: {},
    platforms: {},
    activitySessionId: null,
    activitySessionCreating: false,
  };
  const store = {
    state,
    update(revision, change) {
      if (revision !== state.revision) throw Error('CORE_REVISION_CONFLICT');
      change(state);
      state.revision++;
      return structuredClone(state);
    },
  };

  let created = 0;
  const ctx = {
    workspaceRegistry: {
      list: () => [workspace],
      get: (id) => (id === workspace.id ? workspace : undefined),
    },
    sessions: { get: (id) => sessions.get(id) },
    sessionController: {
      async create() {
        const sessionId = `session-${++created}`;
        workspace.sessionIds.push(sessionId);
        sessions.set(sessionId, session(sessionId));
        return { sessionId };
      },
      async resolveAgent(id) {
        return sessions.has(id) ? { agent: { id } } : undefined;
      },
    },
  };

  const life = makeLife();
  const experiences = {
    records: [],
    async record(payload) {
      this.records.push(payload);
      return { eventId: `event-${this.records.length - 1}` };
    },
  };
  const runtime = {
    root,
    store,
    runningRevision: 0,
    ctx,
    bridges: { life, memory: { unifiedRuntime: {} } },
    platforms: {
      async execute() { return { ok: true }; },
    },
    experiences,
  };
  return { runtime, life, experiences, workspace, sessions };
}

function withSession(activity, id = 'sess-1') {
  activity.session = async () => ({ id });
  return activity;
}

test('never-settling decide expires at maxDurationMs and leaves activity not busy in Paused', async (t) => {
  const { runtime, life, experiences } = makeRuntime(t);
  const activity = withSession(new CoreActivity(runtime));
  let decideSignal;

  const startedAt = Date.now();
  const pending = activity.explore(({ signal }) => {
    decideSignal = signal;
    return new Promise(() => {});
  }, { maxDurationMs: 100, maxSteps: 2 });

  await assert.rejects(pending, /CORE_ACTIVITY_DEADLINE/);
  const elapsed = Date.now() - startedAt;

  assert.ok(elapsed >= 90, `expected the 100ms deadline to elapse, got ${elapsed}ms`);
  assert.ok(elapsed < 5000, `deadline handling took too long: ${elapsed}ms`);
  assert.equal(decideSignal.aborted, true);
  assert.equal(activity.busy, false);
  assert.equal(activity.summary().busy, false);
  assert.equal(activity.summary().phase, 'Paused');
  assert.equal(activity.saved.phase, 'Paused');
  // No Life activity and no experience may be created before the first decision.
  assert.equal(life.calls.start.length, 0);
  assert.equal(experiences.records.length, 0);
});

test('never-settling adapter expires and records no experience', async (t) => {
  const { runtime, life, experiences } = makeRuntime(t);
  const activity = withSession(new CoreActivity(runtime));
  let executeCalls = 0;
  let executeSignal;
  runtime.platforms.execute = async (platform, operation, input, envelope, options) => {
    executeCalls += 1;
    executeSignal = options?.signal;
    return new Promise(() => {});
  };

  await assert.rejects(activity.explore(
    ({ step }) => ({ platform: 'simulated', operation: 'read', input: { step } }),
    { maxDurationMs: 100, maxSteps: 4 },
  ), /CORE_ACTIVITY_DEADLINE/);

  assert.equal(executeCalls, 1);
  assert.equal(executeSignal.aborted, true);
  assert.equal(experiences.records.length, 0);
  assert.equal(activity.saved.last.events.length, 0);
  assert.equal(activity.saved.last.steps, 0);
  assert.equal(life.calls.start.length, 1);
  // The started activity is conservatively paused, never completed.
  assert.equal(life.calls.pause.length, 1);
  assert.equal(life.calls.finish.length, 0);
  assert.equal(activity.busy, false);
  assert.equal(activity.summary().phase, 'Paused');
});

test('an adapter result arriving after the timeout cannot record an experience', async (t) => {
  const { runtime, life, experiences } = makeRuntime(t);
  const activity = withSession(new CoreActivity(runtime));
  const gate = deferred();
  let executeCalls = 0;
  runtime.platforms.execute = async () => {
    executeCalls += 1;
    return gate.promise;
  };

  await assert.rejects(activity.explore(
    ({ step }) => ({ platform: 'simulated', operation: 'read', input: { step } }),
    { maxDurationMs: 100, maxSteps: 2 },
  ), /CORE_ACTIVITY_DEADLINE/);

  assert.equal(executeCalls, 1);
  assert.equal(experiences.records.length, 0);
  assert.equal(life.calls.pause.length, 1);

  // The provider ignores the abort and settles afterwards; the late value is
  // still discarded because the bounded waiter already rejected.
  gate.resolve({ source: 'late' });
  await new Promise((resolve) => setTimeout(resolve, 25));

  assert.equal(experiences.records.length, 0);
  assert.equal(activity.saved.last.events.length, 0);
  assert.equal(activity.saved.last.steps, 0);
  assert.equal(life.calls.finish.length, 0);
  assert.equal(activity.busy, false);
  assert.equal(activity.summary().phase, 'Paused');
});

test('maxSteps bounds decisions, platform calls, checkpoints and recorded experiences', async (t) => {
  const { runtime, life, experiences } = makeRuntime(t);
  const activity = withSession(new CoreActivity(runtime));
  const decideSteps = [];
  const executeSteps = [];
  const observedEnvelopes = [];
  runtime.platforms.execute = async (platform, operation, input, envelope) => {
    executeSteps.push(input.step);
    observedEnvelopes.push(envelope);
    return { source: 'simulated', step: input.step };
  };

  const result = await activity.explore(({ step, observations, signal }) => {
    decideSteps.push(step);
    assert.equal(signal.aborted, false);
    assert.ok(Array.isArray(observations));
    // Always offer another step: only maxSteps may stop the loop.
    return { platform: 'simulated', operation: 'read', input: { step } };
  }, { maxSteps: 2, maxDurationMs: 5000 });

  assert.deepEqual(decideSteps, [0, 1]);
  assert.deepEqual(executeSteps, [0, 1]);
  assert.deepEqual(experiences.records.map((entry) => entry.step), [0, 1]);
  assert.equal(life.calls.checkpoint.length, 2);
  assert.equal(life.calls.finish.length, 1);
  assert.equal(life.calls.finish[0][0], activity.saved.last.activityId);
  assert.equal(life.calls.finish[0][1], 'session:sess-1');
  assert.equal(life.calls.finish[0][2], 'completed');
  assert.deepEqual(observedEnvelopes.map((envelope) => ({
    activityId: envelope.activityId,
    sessionId: envelope.sessionId,
    workspaceId: envelope.workspaceId,
  })), [
    { activityId: activity.saved.last.activityId, sessionId: 'sess-1', workspaceId: 'w1' },
    { activityId: activity.saved.last.activityId, sessionId: 'sess-1', workspaceId: 'w1' },
  ]);
  assert.equal(result.status, 'completed');
  assert.equal(result.steps, 2);
  assert.deepEqual(result.events, ['event-0', 'event-1']);
  assert.equal(activity.busy, false);
  assert.equal(activity.summary().phase, 'Idle');
});

test('the same persistent Session is reused across explorations', async (t) => {
  const { runtime, life, workspace, sessions } = makeRuntime(t);
  const activity = new CoreActivity(runtime);
  const decide = ({ step }) => (step === 0
    ? { platform: 'simulated', operation: 'read', input: { step } }
    : null);

  const first = await activity.explore(decide, { maxSteps: 1, maxDurationMs: 5000 });
  const second = await activity.explore(decide, { maxSteps: 1, maxDurationMs: 5000 });

  assert.equal(first.status, 'completed');
  assert.equal(second.status, 'completed');
  assert.equal(runtime.store.state.activitySessionId, 'session-1');
  assert.equal(runtime.store.state.activitySessionCreating, false);
  assert.equal(workspace.sessionIds.filter((id) => id === 'session-1').length, 1);
  assert.equal(sessions.size, 2); // seeded synthetic member + the one created Session
  assert.equal(life.calls.start.length, 2);
  assert.deepEqual(life.calls.start.map((input) => input.ownerScope), [
    'session:session-1',
    'session:session-1',
  ]);
  assert.equal(life.calls.bindWorkspace.length, 1);
  assert.equal(activity.summary().sessionId, 'session-1');
  assert.equal(life.calls.finish.length, 2);
  assert.equal(activity.summary().phase, 'Idle');
});
