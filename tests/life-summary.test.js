import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLifeSummary } from '../src/core/life-summary.js';

test('derived life summary combines Life, State and Experience without writes', () => {
  const runtime = {
    bridges: {
      life: { api: { getHealth: () => ({ state: 'ok' }) }, core: { v1: {
        adminListIntents: () => ({ total: 1, items: [{ id: 'i1', revision: 2, status: 'active', reviewAt: '2026-11-07T10:00:00.000Z', description: 'continue astronomy' }] }),
        adminListActivities: () => ({ total: 1, items: [{ id: 'a1', status: 'paused', description: 'read source', ownerScope: 'session:s1' }] }),
      } } },
      state: { service: { workspaceOverview: () => ({ main: { state: { mood: 2, energy: 4, curiosity: 7 }, interests: [{ name: 'astronomy', score: 0.8 }] } }) } },
    },
    experiences: { ownerList: () => [{ eventId: 'e1', platform: 'bilibili', operation: 'read', occurredAt: '2026-11-07T09:00:00.000Z', status: 'stored', evidenceLevel: 'platform-read', observationSummary: 'a bounded fact' }] },
  };
  const summary = buildLifeSummary(runtime);
  assert.equal(summary.life.nextIntent.description, 'continue astronomy');
  assert.equal(summary.life.focus.id, 'a1');
  assert.equal(summary.state.interests[0].name, 'astronomy');
  assert.equal(summary.recentExperience.eventId, 'e1');
  assert.equal(summary.canRest, false);
  assert.equal(summary.canConsiderContact, false);
});
