import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  XhsServiceSupervisor,
  XHS_SERVICE_VERSION,
} from '../src/platforms/xhs-service-supervisor.js';

const ROOT = path.resolve('C:/synthetic/amadeus-state');
const EXECUTABLE = path.resolve('C:/synthetic/bin/xiaohongshu-mcp.exe');
const CHECKSUM = 'a'.repeat(64);
const WORKSPACE = 'workspace-synthetic-1';

function workspaceCookiesPath(workspaceId, root = ROOT) {
  const digest = createHash('sha256').update(workspaceId).digest('hex');
  return path.join(root, 'workspaces', digest, 'cookies.json');
}

function fixture({
  probes,
  workspaceId = WORKSPACE,
  root = ROOT,
  hashFile,
  allocatePort,
  spawnProcess,
  health,
  stopTree,
  sleep,
  healthTimeoutMs = 100,
  restartBaseDelayMs = 10,
} = {}) {
  const calls = {
    hashes: 0,
    ports: 0,
    spawns: [],
    stops: [],
    sleeps: [],
    health: 0,
  };
  const handles = [];
  let healthImpl = health ?? (async () => ({ ok: true, version: XHS_SERVICE_VERSION }));

  const supervisor = new XhsServiceSupervisor({
    workspaceId,
    probes,
    root,
    executable: EXECUTABLE,
    expectedSha256: CHECKSUM,
    hashFile: async (file) => {
      calls.hashes += 1;
      assert.equal(file, EXECUTABLE);
      return hashFile ? hashFile(file, calls) : CHECKSUM;
    },
    allocatePort: async (input) => {
      calls.ports += 1;
      assert.equal(input.host, '127.0.0.1');
      return allocatePort ? allocatePort(input, calls) : 18060;
    },
    spawnProcess: async (input) => {
      calls.spawns.push(input);
      if (spawnProcess) return spawnProcess(input, calls);
      const handle = { pid: 4000 + calls.spawns.length, marker: `managed-${calls.spawns.length}` };
      handles.push(handle);
      return handle;
    },
    health: async (input) => {
      calls.health += 1;
      return healthImpl(input, calls);
    },
    stopTree: async (handle) => {
      calls.stops.push(handle);
      if (stopTree) return stopTree(handle, calls);
      return true;
    },
    sleep: async (ms) => {
      calls.sleeps.push(ms);
      if (sleep) return sleep(ms, calls);
      return undefined;
    },
    healthTimeoutMs,
    restartBaseDelayMs,
  });

  return {
    supervisor,
    calls,
    handles,
    setHealth(next) {
      healthImpl = next;
    },
  };
}

test('synthetic lifecycle validates checksum, binds loopback and uses explicit cookies path', async () => {
  const { supervisor, calls, handles } = fixture();

  const starting = supervisor.start();
  assert.equal(supervisor.status().state, 'starting');
  assert.equal(supervisor.status().port, null);

  const ready = await starting;
  assert.equal(ready.state, 'http_ready');
  assert.equal(ready.version, XHS_SERVICE_VERSION);
  assert.equal(ready.port, 18060);
  assert.equal(ready.pid, 4001);
  assert.equal(calls.hashes, 1);
  assert.equal(calls.ports, 1);
  assert.equal(calls.spawns.length, 1);
  assert.equal(calls.health, 1);

  const spawn = calls.spawns[0];
  assert.equal(spawn.executable, EXECUTABLE);
  assert.deepEqual(spawn.args, ['-port', '127.0.0.1:18060']);
  assert.equal(spawn.host, '127.0.0.1');
  assert.equal(spawn.port, 18060);
  assert.equal(spawn.cwd, ROOT);
  assert.equal(spawn.env.COOKIES_PATH, workspaceCookiesPath(WORKSPACE));
  assert.match(spawn.env.AUTH_TOKEN, /^[a-f0-9]{64}$/);
  assert.equal(Buffer.from(spawn.env.AUTH_TOKEN, 'hex').byteLength, 32);

  // The token is internal: neither public status nor the resolved value leaks it.
  const publicText = JSON.stringify([ready, supervisor.status()]);
  assert.equal(publicText.includes(spawn.env.AUTH_TOKEN), false);
  assert.equal(publicText.includes('AUTH_TOKEN'), false);
  assert.equal(publicText.includes('cookies.json'), false);

  const stopped = await supervisor.stop();
  assert.equal(stopped.state, 'stopped');
  assert.equal(stopped.port, null);
  assert.deepEqual(calls.stops, [handles[0]]);
});

test('concurrent start on one instance shares one spawn and one health check', async () => {
  let releaseHash;
  const gate = new Promise((resolve) => { releaseHash = resolve; });
  const { supervisor, calls } = fixture({
    hashFile: async () => {
      await gate;
      return CHECKSUM;
    },
  });

  const first = supervisor.start();
  const second = supervisor.start();
  assert.equal(first, second);
  assert.equal(supervisor.status().state, 'starting');

  releaseHash();
  const [a, b] = await Promise.all([first, second]);
  assert.deepEqual(a, b);
  assert.equal(a.state, 'http_ready');
  assert.equal(calls.spawns.length, 1);
  assert.equal(calls.health, 1);

  await supervisor.stop();
});

test('wrong checksum prevents spawn and leaves the instance unavailable', async () => {
  const { supervisor, calls } = fixture({ hashFile: async () => 'b'.repeat(64) });

  await assert.rejects(supervisor.start(), /CORE_PLATFORM_XHS_SERVICE_CHECKSUM/);
  assert.equal(calls.spawns.length, 0);
  assert.equal(calls.health, 0);
  assert.equal(supervisor.status().state, 'unavailable');
  assert.equal(supervisor.status().lastFailure, 'XHS_SERVICE_CHECKSUM');
  assert.equal(supervisor.status().port, null);
  assert.equal(Buffer.isBuffer(supervisor.status().token), false);

  // A failed start must not secretly retry; restart is the explicit recovery path.
  await assert.rejects(supervisor.start(), /CORE_PLATFORM_XHS_SERVICE_UNAVAILABLE/);
  assert.equal(calls.spawns.length, 0);
});

test('deadline-bounded health failure and version mismatch stop the exact managed process', async () => {
  const wrongVersion = fixture({
    health: async () => ({ ok: true, version: 'v2.6.0' }),
  });
  await assert.rejects(wrongVersion.supervisor.start(), /CORE_PLATFORM_XHS_SERVICE_VERSION/);
  assert.equal(wrongVersion.calls.stops.length, 1);
  assert.deepEqual(wrongVersion.calls.stops[0], wrongVersion.handles[0]);
  assert.equal(wrongVersion.supervisor.status().state, 'unavailable');

  const rejectedHealth = fixture({
    health: async () => { throw Error('synthetic health body with secret-token'); },
  });
  await assert.rejects(rejectedHealth.supervisor.start(), /CORE_PLATFORM_XHS_SERVICE_HEALTH/);
  assert.equal(rejectedHealth.calls.stops.length, 1);
  assert.equal(JSON.stringify(rejectedHealth.supervisor.status()).includes('secret-token'), false);

  const timedOut = fixture({
    healthTimeoutMs: 20,
    health: async () => new Promise(() => {}),
  });
  await assert.rejects(timedOut.supervisor.start(), /CORE_PLATFORM_XHS_SERVICE_TIMEOUT/);
  assert.equal(timedOut.calls.stops.length, 1);
  assert.deepEqual(timedOut.calls.stops[0], timedOut.handles[0]);
  assert.equal(timedOut.supervisor.status().state, 'unavailable');
});

test('stop rejects new lifecycle calls while cleaning up and can start again afterwards', async () => {
  let releaseStop;
  const stopGate = new Promise((resolve) => { releaseStop = resolve; });
  const { supervisor, calls, handles } = fixture({
    stopTree: async () => { await stopGate; },
  });

  await supervisor.start();
  const stopping = supervisor.stop();
  await assert.rejects(supervisor.start(), /CORE_PLATFORM_XHS_SERVICE_STOPPING/);
  assert.equal(supervisor.status().state, 'stopped');

  releaseStop();
  await stopping;
  assert.deepEqual(calls.stops, [handles[0]]);

  const ready = await supervisor.start();
  assert.equal(ready.state, 'http_ready');
  assert.equal(calls.spawns.length, 2);
  await supervisor.stop();
});

test('explicit restart after stop performs one new lifecycle without replay', async () => {
  const { supervisor, calls } = fixture();

  await supervisor.start();
  await supervisor.stop();
  const ready = await supervisor.restart();
  assert.equal(ready.state, 'http_ready');
  assert.equal(calls.spawns.length, 2);
  assert.equal(calls.health, 2);
  assert.equal(calls.stops.length, 1);
  assert.deepEqual(calls.sleeps, []);

  await supervisor.stop();
});

test('restart retries at most twice with exponential backoff and no hidden retries', async () => {
  let healthAttempts = 0;
  const { supervisor, calls } = fixture({
    restartBaseDelayMs: 10,
    health: async () => {
      healthAttempts += 1;
      if (healthAttempts <= 2) return { ok: false };
      return { ok: true, version: XHS_SERVICE_VERSION };
    },
  });

  const ready = await supervisor.restart();
  assert.equal(ready.state, 'http_ready');
  assert.equal(calls.spawns.length, 3);
  assert.equal(calls.stops.length, 2);
  assert.deepEqual(calls.sleeps, [10, 20]);
  await supervisor.stop();

  const alwaysFailing = fixture({
    restartBaseDelayMs: 10,
    health: async () => ({ ok: false }),
  });
  await assert.rejects(alwaysFailing.supervisor.restart(), /CORE_PLATFORM_XHS_SERVICE_HEALTH/);
  assert.equal(alwaysFailing.calls.spawns.length, 3);
  assert.deepEqual(alwaysFailing.calls.sleeps, [10, 20]);
  assert.equal(alwaysFailing.supervisor.status().state, 'unavailable');

  // A non-retryable checksum failure stops the bounded restart immediately.
  const badChecksum = fixture({
    hashFile: async () => 'c'.repeat(64),
  });
  await assert.rejects(badChecksum.supervisor.restart(), /CORE_PLATFORM_XHS_SERVICE_CHECKSUM/);
  assert.equal(badChecksum.calls.spawns.length, 0);
  assert.deepEqual(badChecksum.calls.sleeps, []);
});

test('stopping during restart backoff prevents any further spawn', async () => {
  let releaseSleep;
  const sleepGate = new Promise((resolve) => { releaseSleep = resolve; });
  const { supervisor, calls } = fixture({
    health: async () => ({ ok: false }),
    sleep: async () => { await sleepGate; },
  });

  const restarting = supervisor.restart();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.spawns.length, 1);

  const stopping = supervisor.stop();
  releaseSleep();
  await stopping;
  await assert.rejects(restarting, /CORE_PLATFORM_XHS_SERVICE_STOPPED/);
  assert.equal(calls.spawns.length, 1);
  assert.equal(supervisor.status().state, 'stopped');
});

test('stop during a pending spawn still stops the exact returned process tree', async () => {
  let releaseSpawn;
  const spawnGate = new Promise((resolve) => { releaseSpawn = resolve; });
  let handle = null;
  const { supervisor, calls } = fixture({
    spawnProcess: async () => {
      await spawnGate;
      handle = { pid: 5555, marker: 'late-spawn' };
      return handle;
    },
  });

  const starting = supervisor.start();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.spawns.length, 1);

  const stopping = supervisor.stop();
  releaseSpawn();
  await assert.rejects(starting, /CORE_PLATFORM_XHS_SERVICE_STOPPED/);
  await stopping;
  assert.deepEqual(calls.stops, [handle]);
  assert.equal(supervisor.status().state, 'stopped');
});

test('workspace directory hash is stable, root-scoped and hides the raw workspace id', async () => {
  const raw = '../../escape/workspace';
  const first = workspaceCookiesPath(raw);
  const second = workspaceCookiesPath(raw);
  assert.equal(first, second);
  assert.notEqual(first, workspaceCookiesPath(WORKSPACE));
  assert.equal(first.startsWith(path.join(ROOT, 'workspaces') + path.sep), true);
  assert.equal(first.includes('..'), false);
  assert.equal(first.includes('escape'), false);

  const { supervisor, calls } = fixture({ workspaceId: raw });
  await supervisor.start();
  assert.equal(calls.spawns[0].env.COOKIES_PATH, first);
  await supervisor.stop();
});

test('all process and filesystem adapters are required injections', () => {
  const base = {
    workspaceId: WORKSPACE,
    root: ROOT,
    executable: EXECUTABLE,
    expectedSha256: CHECKSUM,
    hashFile: async () => CHECKSUM,
    allocatePort: async () => 18060,
    spawnProcess: async () => ({ pid: 1 }),
    health: async () => ({ ok: true, version: XHS_SERVICE_VERSION }),
    stopTree: async () => true,
    sleep: async () => undefined,
  };

  for (const name of ['spawnProcess', 'stopTree', 'hashFile', 'allocatePort', 'health', 'sleep']) {
    const options = { ...base };
    delete options[name];
    assert.throws(() => new XhsServiceSupervisor(options), /CORE_PLATFORM_XHS_SERVICE_CONFIG/);
  }

  assert.throws(
    () => new XhsServiceSupervisor({ ...base, expectedSha256: 'not-a-checksum' }),
    /CORE_PLATFORM_XHS_SERVICE_CONFIG/,
  );
});

test('failed cleanup retains ownership and blocks restart until exact child is stopped', async () => {
  let rejectStop = true;
  const {supervisor, calls, handles} = fixture({stopTree:async()=>{if(rejectStop)throw Error('denied');}});
  await supervisor.start();
  await assert.rejects(supervisor.stop(), /XHS_SERVICE_STOP/);
  assert.equal(supervisor.status().state, 'unavailable');
  await assert.rejects(supervisor.restart(), /XHS_SERVICE_STOP/);
  assert.equal(calls.spawns.length, 1);
  rejectStop=false;
  await supervisor.stop();
  assert.ok(calls.stops.every(handle=>handle===handles[0]));
  await supervisor.start();
  assert.equal(calls.spawns.length, 2);
  await supervisor.stop();
});

test('failed health cleanup prevents duplicate process on bounded restart', async()=>{
  let rejectStop=true;
  const {supervisor,calls}=fixture({health:async()=>({ok:false}),stopTree:async()=>{if(rejectStop)throw Error('denied');}});
  await assert.rejects(supervisor.restart(),/XHS_SERVICE_STOP/);
  assert.equal(calls.spawns.length,1);
  rejectStop=false;
  await supervisor.stop();
});

test('HTTP health alone never marks Gate A or login ready',async()=>{
 const {supervisor}=fixture();const state=await supervisor.start();
 assert.equal(state.state,'http_ready');assert.equal(state.loginPrerequisitesReady,false);
 assert.equal(state.readiness.http.status,'passed');
 assert.equal(state.readiness.browser.status,'not_checked');
 assert.equal((await supervisor.diagnose()).readiness.qr.status,'blocked');
 await supervisor.stop();assert.equal(supervisor.status().readiness.http.status,'not_checked');
});

test('independent probes report failures without exposing errors or generating QR',async()=>{
 let qr=0;
 const {supervisor}=fixture({probes:{authentication:async()=>({passed:true}),storage:async()=>({passed:false}),browser:async()=>{throw Error('private-token');},qr:async()=>{qr++;return {passed:true};}}});
 await supervisor.start();const result=await supervisor.diagnose();
 assert.equal(result.readiness.authentication.status,'passed');
 assert.equal(result.readiness.storage.status,'failed');assert.equal(result.readiness.browser.status,'failed');
 assert.equal(result.loginPrerequisitesReady,false);assert.equal(qr,0);assert.ok(!JSON.stringify(result).includes('private-token'));
 await supervisor.stop();
});

test('all five prelogin checks are required; stop clears their evidence',async()=>{
 const probes=Object.fromEntries(['authentication','storage','browser','qr'].map(key=>[key,async()=>({passed:true})]));
 const {supervisor}=fixture({probes});await supervisor.start();
 assert.equal((await supervisor.diagnose()).loginPrerequisitesReady,true);
 await supervisor.stop();assert.equal(supervisor.status().loginPrerequisitesReady,false);
});

test('hanging and late diagnostic results cannot establish readiness',async()=>{
 const {supervisor}=fixture({healthTimeoutMs:20,probes:{browser:async()=>new Promise(()=>{})}});
 await supervisor.start();assert.equal((await supervisor.diagnose()).readiness.browser.code,'PROBE_TIMEOUT');await supervisor.stop();
 let done;const late=fixture({probes:{authentication:()=>new Promise(resolve=>done=resolve)}});
 await late.supervisor.start();const diagnosing=late.supervisor.diagnose();await new Promise(resolve=>setImmediate(resolve));
 await late.supervisor.stop();done({passed:true});await assert.rejects(diagnosing,/SERVICE_STOPPED/);
 assert.equal(late.supervisor.status().readiness.authentication.status,'not_checked');
});
