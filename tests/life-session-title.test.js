import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSessionTitle } from '../src/core/runtime.js';
import { sessionChoices } from '../src/modules/life/src/client/logic.js';

test('session title prefers a live DSH title', () => {
  const ctx = {
    sessions: { get: id => id === 's-live' ? { header: { title: '群聊 902393625' } } : undefined },
    qq: { resolveTrustedSessionScene: () => { throw new Error('fallback must not be needed'); } },
  };
  assert.equal(resolveSessionTitle(ctx, 's-live'), '群聊 902393625');
});

test('session title falls back to the verified QQ scene for an unloaded Session', () => {
  const ctx = {
    sessions: { get: () => undefined },
    qq: { resolveTrustedSessionScene: id => ({ platform: 'qq', kind: 'private', id: '1547578054:1622647109', verified: true }) },
  };
  assert.equal(resolveSessionTitle(ctx, 's-unloaded'), '私聊 1622647109');
});

test('session title does not use an unverified or malformed QQ scene', () => {
  const ctx = {
    sessions: { get: () => undefined },
    qq: { resolveTrustedSessionScene: () => ({ kind: 'group', id: 'bot:prompt-injection', verified: false }) },
  };
  assert.equal(resolveSessionTitle(ctx, 's-untrusted'), '');
});

test('session choices show unique names and only use IDs for unnamed or unavailable rows', () => {
  const options = sessionChoices([
    { sessionId: 's-group', title: '群聊 902393625', member: true, mode: 'inherit' },
    { sessionId: 's-private', title: '私聊 1622647109', member: true, mode: 'inherit' },
    { sessionId: 's-duplicate', title: '群聊 902393625', member: true, mode: 'inherit' },
  ], ['s-old'], 'zh');
  assert.equal(options[0].label, '群聊 902393625 · 1');
  assert.equal(options[1].label, '私聊 1622647109');
  assert.equal(options[2].label, '群聊 902393625 · 2');
  assert.equal(options[3].label, '已保存但当前不可用 · s-old');
});
