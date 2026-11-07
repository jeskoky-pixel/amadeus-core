import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildLifeSummary } from '../src/core/life-summary.js';
import { CoreRuntime } from '../src/core/runtime.js';

function runtimeFixture(overrides = {}) {
  return {
    bridges: {
      life: { api: { getHealth: () => ({ state: 'ok' }) }, core: { v1: {
        adminListIntents: ({ limit, offset }) => {
          const items = [
            { id: 'old', revision: 1, status: 'active', reviewAt: '2026-11-08T10:00:00.000Z', description: 'old question' },
            { id: 'next', revision: 2, status: 'active', reviewAt: '2026-11-07T10:00:00.000Z', description: 'continue astronomy' },
          ]
          return { total: items.length, items: items.slice(offset, offset + limit) }
        },
        adminListActivities: () => ({ total: 4, items: [
          { id: 'running', status: 'running', description: 'read source', ownerScope: 'session:s1' },
          { id: 'pending', status: 'pending', description: 'queued source', ownerScope: 'session:s1' },
          { id: 'paused', status: 'paused', description: 'paused source', ownerScope: 'session:s1' },
          { id: 'unknown', status: 'unknown', description: 'uncertain source', ownerScope: 'session:s1' },
        ] }),
      } } },
      state: { service: { workspaceOverview: () => ({ main: { state: { mood: 2, energy: 4, curiosity: 7 }, interests: [{ name: 'astronomy', score: 0.8 }] } }) } },
    },
    experiences: { ownerList: () => [
      { eventId: 'pending-event', status: 'pending', observationSummary: 'not finished' },
      { eventId: 'stored-event', platform: 'bilibili', operation: 'read', occurredAt: '2026-11-07T09:00:00.000Z', status: 'stored', evidenceLevel: 'platform-read', observationSummary: 'a bounded fact' },
    ] },
    ...overrides,
  }
}

test('summary paginates Life reads, distinguishes activity states, and filters unfinished experiences', () => {
  const summary = buildLifeSummary(runtimeFixture())
  assert.equal(summary.life.nextIntent.id, 'next')
  assert.equal(summary.life.nextReviewSource, 'life.intent.reviewAt')
  assert.deepEqual(summary.life.activityCounts, { running: 1, pending: 1, paused: 1, uncertain: 1 })
  assert.equal(summary.life.currentActivity.id, 'running')
  assert.equal(summary.life.canRestNow, false)
  assert.equal(summary.life.canConsiderContactNow, false)
  assert.equal(summary.recentExperience.eventId, 'stored-event')
  assert.equal(summary.pendingExperienceCount, 1)
  assert.deepEqual(summary.errors, [])
})

test('summary reads every bounded page instead of treating the first page as the whole ledger', () => {
  const seen = []
  const runtime = runtimeFixture({
    bridges: {
      ...runtimeFixture().bridges,
      life: { api: { getHealth: () => ({ state: 'ok' }) }, core: { v1: {
        adminListIntents: ({ limit, offset }) => {
          seen.push({ limit, offset })
          const items = offset === 0 ? [{ id: 'first', status: 'active', reviewAt: '2026-11-09T00:00:00.000Z' }] : [{ id: 'second', status: 'active', reviewAt: '2026-11-07T00:00:00.000Z' }]
          return { total: 2, items }
        },
        adminListActivities: () => ({ total: 0, items: [] }),
      } } },
    },
  })
  const summary = buildLifeSummary(runtime)
  assert.equal(summary.life.nextIntent.id, 'second')
  assert.deepEqual(seen, [{ limit: 200, offset: 0 }, { limit: 200, offset: 1 }])
  assert.equal(summary.sources.intents.complete, true)
})

test('summary reports read failures instead of presenting empty data as truth', () => {
  const summary = buildLifeSummary(runtimeFixture({
    bridges: {
      life: { api: { getHealth: () => { throw new Error('database unavailable') } }, core: { v1: {
        adminListIntents: () => { throw Object.assign(new Error('denied'), { code: 'LIFE_OWNER_READ_DENIED' }) },
        adminListActivities: () => ({ total: 0, items: [] }),
      } } },
      state: { service: { workspaceOverview: () => { throw new Error('state unavailable') } } },
    },
  }))
  assert.equal(summary.life.activeIntentCount, null)
  assert.equal(summary.life.state, 'unavailable')
  assert.ok(summary.errors.includes('LIFE_OWNER_READ_DENIED'))
  assert.ok(summary.errors.includes('life_health_read_failed'))
  assert.ok(summary.errors.includes('state_overview_read_failed'))
})

test('owner-only life summary is absent from the model-facing Core health service', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'core-life-summary-owner-'))
  const runtime = new CoreRuntime({}, root)
  t.after(async () => { await runtime.dispose(); fs.rmSync(root, { recursive: true, force: true }) })
  assert.equal(Object.hasOwn(runtime.api().getHealth(), 'lifeSummary'), false)
  assert.equal(Object.hasOwn(runtime.overview(), 'lifeSummary'), true)
})

test('Core exposes bounded Life delivery health without leaking target ids', () => {
  const runtime = Object.create(CoreRuntime.prototype)
  runtime.bridges = { life: { api: { getHealth: () => ({ delivery: {
    state: 'active', enabled: true, bound: true, allowedSessions: 1,
    intervalMs: 60000, maxPerDrive: 1, timerActive: true,
    unresolvedWakes: false, idle: { enabled: false }, budget: { enabled: true },
  } }) } } }
  const result = runtime.lifeDelivery()
  assert.deepEqual(result, {
    state: 'active', reason: null, enabled: true, bound: true,
    allowedSessions: 1, intervalMs: 60000, maxPerDrive: 1,
    timerActive: true, reconciliation: null, unresolvedWakes: false,
    idle: false, budget: true, missing: [],
  })
  assert.equal('sessionIds' in result, false)
})

test('explicit autonomous Life preparation only changes existing Life config', async () => {
  const runtime = Object.create(CoreRuntime.prototype)
  runtime.status = 'ready'
  const session = { id: 'session-1', header: { origin: 'user' }, snapshotEvents: () => [] }
  const workspace = { id: 'workspace-1', sessionIds: ['session-1'] }
  runtime.ctx = {
    workspaceRegistry: { list: () => [workspace], get: id => id === workspace.id ? workspace : undefined },
    sessions: { get: id => id === session.id ? session : undefined },
  }
  runtime.store = {
    state: { revision: 3, workspaceId: 'workspace-1', modules: { life: { enabled: true, config: {
      allowedSessionIds: [], externalMessageSessionIds: [], wakeDeliveryEnabled: false,
    } } } },
    update(revision, fn) { assert.equal(revision, 3); fn(this.state); this.state.revision += 1 },
  }
  runtime.bridges = { life: { api: { getHealth: () => ({ delivery: { state: 'disabled' } }) } } }
  runtime.activity = { session: async () => ({ id: 'session-1' }) }
  runtime.serial = fn => fn()
  runtime.effectiveConfig = () => ({ allowedSessionIds: [], externalMessageSessionIds: [], wakeDeliveryEnabled: false })
  runtime.lifeDelivery = CoreRuntime.prototype.lifeDelivery.bind(runtime)
  runtime.prepareAutonomousLife = CoreRuntime.prototype.prepareAutonomousLife.bind(runtime)
  const result = await runtime.prepareAutonomousLife()
  assert.equal(result.sessionId, 'session-1')
  assert.equal(result.requiresApply, true)
  assert.equal(result.externalMessageOptIn, false)
  assert.deepEqual(runtime.store.state.modules.life.config.allowedSessionIds, ['session-1'])
  assert.deepEqual(runtime.store.state.modules.life.config.externalMessageSessionIds, [])
  assert.equal(runtime.store.state.modules.life.config.wakeDeliveryEnabled, true)
})

