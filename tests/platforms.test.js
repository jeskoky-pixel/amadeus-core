import test from 'node:test';
import assert from 'node:assert/strict';
import { PlatformRegistry } from '../src/platforms/registry.js';

const TRUSTED = { activityId: 'activity-1', workspaceId: 'workspace-1', sessionId: 'session-1' };

function adapter(id, execute, capabilities = ['read', 'search', 'browse']) {
  return { id, contractVersion: 1, simulated: true, capabilities, execute: execute ?? (async () => ({ ok: true })) };
}

function registerEnabled(registry, id, execute, options = {}) {
  registry.register(adapter(id, execute, options.capabilities));
  return registry.configure(id, {
    enabled: true,
    permissions: options.permissions ?? ['read'],
    maxRequests: options.maxRequests ?? 20,
  });
}

function deferred() {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
}

test('registration defaults to disabled with no permissions', async () => {
  const registry = new PlatformRegistry();
  registry.register(adapter('defaults'));
  assert.deepEqual(registry.list(), [{
    id: 'defaults',name:'defaults',version:'1',mode:'simulation',authMethods:[],account:null,autonomous:true,minIntervalMs:0,
    simulated: true,
    enabled: false,
    capabilities: ['read', 'search', 'browse'],
    permissions: [],
    used: 0,
    maxRequests: 20,
  }]);
  await assert.rejects(registry.execute('defaults', 'read', {}, TRUSTED), /CORE_PLATFORM_DENIED/);
});

test('write is denied even for an enabled adapter', async () => {
  const registry = new PlatformRegistry();
  let calls = 0;
  registerEnabled(registry, 'readonly', async () => { calls++; return { ok: true }; }, { capabilities: ['read'] });
  await assert.rejects(registry.execute('readonly', 'write', {}, TRUSTED), /CORE_PLATFORM_DENIED/);
  assert.equal(calls, 0);
  await registry.execute('readonly', 'read', {}, TRUSTED);
  assert.equal(calls, 1);
});

test('maxRequests bounds concurrent executions and keeps the spent budget', async () => {
  const registry = new PlatformRegistry();
  let calls = 0;
  registerEnabled(registry, 'budget', async () => {
    calls++;
    await new Promise((resolve) => setTimeout(resolve, 15));
    return { ok: true };
  }, { capabilities: ['read'], maxRequests: 2 });

  const results = await Promise.allSettled([1, 2, 3].map((n) =>
    registry.execute('budget', 'read', { n }, TRUSTED)));
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 2);
  const rejected = results.filter((result) => result.status === 'rejected');
  assert.equal(rejected.length, 1);
  assert.match(rejected[0].reason.message, /CORE_PLATFORM_BUDGET/);
  assert.equal(calls, 2);
  assert.equal(registry.list()[0].used, 2);
});

test('revocation during an in-flight execution rejects with REVOKED', async () => {
  const registry = new PlatformRegistry();
  const started = deferred();
  const gate = deferred();
  const revoke = registry.register(adapter('revoked', async () => {
    started.resolve();
    await gate.promise;
    return { ok: true };
  }));
  registry.configure('revoked', { enabled: true, permissions: ['read'] });

  const pending = registry.execute('revoked', 'read', {}, TRUSTED);
  await started.promise;
  revoke();
  gate.resolve();

  await assert.rejects(pending, /CORE_PLATFORM_REVOKED/);
  assert.equal(registry.list().length, 0);
});

test('adapter payload cannot override the trusted envelope identity', async () => {
  const registry = new PlatformRegistry();
  const forged = {
    eventId: 'forged-event',
    platform: 'forged-platform',
    accountId: 'forged-account',
    activityId: 'forged-activity',
    sessionId: 'forged-session',
    workspaceId: 'forged-workspace',
    evidenceLevel: 'live',
    externalAction: true,
    observedEvidence: { activityId: 'nested-forgery' },
  };
  registerEnabled(registry, 'trusted', async () => forged);

  const result = await registry.execute('trusted', 'read', {}, TRUSTED);
  assert.notEqual(result.eventId, forged.eventId);
  assert.equal(result.platform, 'trusted');
  assert.equal(result.accountId, null);
  assert.equal(result.activityId, TRUSTED.activityId);
  assert.equal(result.sessionId, TRUSTED.sessionId);
  assert.equal(result.workspaceId, TRUSTED.workspaceId);
  assert.equal(result.evidenceLevel, 'simulation');
  assert.equal(result.externalAction, false);
  assert.deepEqual(result.observedEvidence, forged);
});

test('two adapters preserve the same trusted sessionId', async () => {
  const registry = new PlatformRegistry();
  registerEnabled(registry, 'alpha', async () => ({ source: 'alpha' }));
  registerEnabled(registry, 'beta', async () => ({ source: 'beta' }));

  const [alpha, beta] = await Promise.all([
    registry.execute('alpha', 'read', {}, TRUSTED),
    registry.execute('beta', 'read', {}, TRUSTED),
  ]);
  assert.equal(alpha.sessionId, TRUSTED.sessionId);
  assert.equal(beta.sessionId, TRUSTED.sessionId);
  assert.equal(alpha.sessionId, beta.sessionId);
  assert.equal(alpha.platform, 'alpha');
  assert.equal(beta.platform, 'beta');
  assert.notEqual(alpha.eventId, beta.eventId);
});

test('duplicate registration is rejected without replacing the original', () => {
  const registry = new PlatformRegistry();
  registry.register(adapter('duplicate'));
  assert.throws(() => registry.register(adapter('duplicate')), /CORE_PLATFORM_DUPLICATE/);
  assert.equal(registry.list().length, 1);
  assert.equal(registry.list()[0].enabled, false);
});
