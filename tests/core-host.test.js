import test from 'node:test';
import assert from 'node:assert/strict';
import { member, assertIdle } from '../src/core/host.js';

function workspace(id, sessionIds) { return { id, title: id, sessionIds }; }

function makeCtx(workspaces, sessions = new Map()) {
  return {
    workspaceRegistry: {
      list: () => workspaces,
      get: (id) => workspaces.find((w) => w.id === id),
    },
    sessions: { get: (id) => sessions.get(id) },
  };
}

function session(id, header) { return { id, header }; }

test('member accepts the exact workspace of a trusted session', () => {
  const s = session('s1', { origin: 'user' });
  const ctx = makeCtx([workspace('w1', ['s1'])], new Map([['s1', s]]));
  assert.equal(member(ctx, 'w1', 's1'), s);
});

test('member rejects a session belonging to another workspace', () => {
  const ctx = makeCtx([workspace('w1', ['s1'])], new Map([['s1', session('s1', {})]]));
  assert.throws(() => member(ctx, 'w2', 's1'), /CORE_SESSION_DENIED/);
});

test('member rejects duplicate workspace membership', () => {
  const ctx = makeCtx(
    [workspace('w1', ['s1']), workspace('w2', ['s1'])],
    new Map([['s1', session('s1', {})]]),
  );
  assert.throws(() => member(ctx, 'w1', 's1'), /CORE_SESSION_DENIED/);
});

test('member rejects subagent sessions', () => {
  const ctx = makeCtx(
    [workspace('w1', ['s1'])],
    new Map([['s1', session('s1', { origin: 'subagent' })]]),
  );
  assert.throws(() => member(ctx, 'w1', 's1'), /CORE_SESSION_DENIED/);
});

test('member rejects a session without a real header', () => {
  const ctx = makeCtx([workspace('w1', ['s1'])], new Map([['s1', session('s1')]]));
  assert.throws(() => member(ctx, 'w1', 's1'), /CORE_SESSION_DENIED/);
});

test('member allows an ordinary fork header with parentSession', () => {
  const s = session('s1', { parentSession: 's0' });
  const ctx = makeCtx([workspace('w1', ['s1'])], new Map([['s1', s]]));
  assert.equal(member(ctx, 'w1', 's1'), s);
});

test('assertIdle allows a persisted but unloaded session', () => {
  const ctx = makeCtx([workspace('w1', ['unloaded'])]);
  assert.doesNotThrow(() => assertIdle(ctx, 'w1'));
});

test('assertIdle rejects an unmatched turn/start', () => {
  const s = { id: 's1', snapshotEvents: () => [{ type: 'turn/start' }] };
  const ctx = makeCtx([workspace('w1', ['s1'])], new Map([['s1', s]]));
  assert.throws(() => assertIdle(ctx, 'w1'), /CORE_SESSION_BUSY/);
});

test('assertIdle allows an ended turn', () => {
  const s = {
    id: 's1',
    snapshotEvents: () => [{ type: 'turn/start' }, { type: 'turn/end' }],
  };
  const ctx = makeCtx([workspace('w1', ['s1'])], new Map([['s1', s]]));
  assert.doesNotThrow(() => assertIdle(ctx, 'w1'));
});
