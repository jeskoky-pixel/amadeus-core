import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';

// Core-owned lifecycle scaffold for a separately distributed Xiaohongshu
// service. Every process operation is injected: this module never launches an
// upstream service, opens a socket, kills a process or writes user data by
// itself. It is not registered as a live platform and must not be reported as
// verified platform support.
export const XHS_SERVICE_VERSION = 'v2.7.0-amadeus.1';
export const XHS_SERVICE_HOST = '127.0.0.1';

const TOKEN_BYTES = 32;
const MAX_RESTART_RETRIES = 2;
const SHA256_HEX = /^[a-f0-9]{64}$/i;
const PROBE_STAGES = ['authentication', 'storage', 'browser', 'qr'];
const newReadiness = () => Object.fromEntries(['http', ...PROBE_STAGES].map(key => [key, {status:'not_checked', checkedAt:null, code:null}]));
const SAFE_CODE = /^CORE_PLATFORM_[A-Z0-9_]+$/;

function fail(code) {
  throw Error(`CORE_PLATFORM_${code}`);
}

function safeError(code) {
  return Error(`CORE_PLATFORM_${code}`);
}

function errorCode(error) {
  const message = error instanceof Error ? error.message : '';
  return SAFE_CODE.test(message) ? message.slice('CORE_PLATFORM_'.length) : null;
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireFunction(value, code = 'XHS_SERVICE_CONFIG') {
  if (typeof value !== 'function') fail(code);
  return value;
}

function positiveInteger(value, fallback, max) {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < 1 || value > max) fail('XHS_SERVICE_CONFIG');
  return value;
}

function validWorkspaceId(value) {
  return typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= 256 &&
    !/[\u0000-\u001f\u007f]/.test(value);
}

function validAbsolutePath(value) {
  return typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 32767 &&
    !/[\u0000]/.test(value) &&
    path.isAbsolute(value);
}

export class XhsServiceSupervisor {
  #readiness = newReadiness();
  #probes;
  #diagnosing = null;
  #diagnosticAbort = null;
  #workspaceId;
  #root;
  #executable;
  #expectedSha256;
  #hashFile;
  #allocatePort;
  #spawnProcess;
  #health;
  #stopTree;
  #sleep;
  #healthTimeoutMs;
  #restartBaseDelayMs;
  #workspaceHash;
  #cookiesPath;

  #state = 'stopped';
  #managed = null;
  #token = null;
  #port = null;
  #pid = null;
  #lastFailure = null;
  #epoch = 0;
  #startPromise = null;
  #stopPromise = null;
  #restartPromise = null;
  #startAbort = null;

  constructor(options = {}) {
    if (!isRecord(options)) fail('XHS_SERVICE_CONFIG');
    const {
      workspaceId,
      probes = {},
      root,
      executable,
      expectedSha256,
      hashFile,
      allocatePort,
      spawnProcess,
      health,
      stopTree,
      sleep,
      healthTimeoutMs = 5000,
      restartBaseDelayMs = 250,
    } = options;

    if (!validWorkspaceId(workspaceId)) fail('XHS_SERVICE_CONFIG');
    if (!validAbsolutePath(root)) fail('XHS_SERVICE_CONFIG');
    if (!validAbsolutePath(executable)) fail('XHS_SERVICE_CONFIG');
    if (typeof expectedSha256 !== 'string' || !SHA256_HEX.test(expectedSha256)) fail('XHS_SERVICE_CONFIG');

    if (!isRecord(probes) || Object.keys(probes).some(key => !PROBE_STAGES.includes(key) || typeof probes[key] !== 'function')) fail('XHS_SERVICE_CONFIG');
    this.#probes = Object.freeze({...probes});
    this.#workspaceId = workspaceId;
    this.#root = path.resolve(root);
    this.#executable = path.resolve(executable);
    this.#expectedSha256 = expectedSha256.toLowerCase();
    this.#hashFile = requireFunction(hashFile);
    this.#allocatePort = requireFunction(allocatePort);
    this.#spawnProcess = requireFunction(spawnProcess);
    this.#health = requireFunction(health);
    // The production stop implementation is deliberately required. There is no
    // unsafe default tree killer in Core.
    this.#stopTree = requireFunction(stopTree);
    this.#sleep = requireFunction(sleep);
    this.#healthTimeoutMs = positiveInteger(healthTimeoutMs, 5000, 60000);
    this.#restartBaseDelayMs = positiveInteger(restartBaseDelayMs, 250, 60000);

    // The workspace directory is a SHA-256 digest of the workspace identity,
    // never the raw workspace id. COOKIES_PATH is always explicit so the child
    // cannot fall back to its current directory or the OS temp directory.
    this.#workspaceHash = createHash('sha256').update(workspaceId).digest('hex');
    this.#cookiesPath = path.join(this.#root, 'workspaces', this.#workspaceHash, 'cookies.json');
    const relative = path.relative(this.#root, this.#cookiesPath);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) fail('XHS_SERVICE_CONFIG');
  }

  status() {
    return this.#snapshot();
  }

  start() {
    if (this.#state === 'http_ready') return Promise.resolve(this.#snapshot());
    if (this.#state === 'starting' && this.#startPromise) return this.#startPromise;
    if (this.#stopPromise) return Promise.reject(safeError('XHS_SERVICE_STOPPING'));
    if (this.#managed && this.#state !== 'http_ready') return Promise.reject(safeError('XHS_SERVICE_STOP'));
    if (this.#state === 'unavailable') return Promise.reject(safeError('XHS_SERVICE_UNAVAILABLE'));
    if (this.#state !== 'stopped') return Promise.reject(safeError('XHS_SERVICE_UNAVAILABLE'));
    return this.#beginStart();
  }

  stop() {
    if (this.#stopPromise) return this.#stopPromise;
    const active = this.#startPromise;
    this.#epoch += 1;
    this.#diagnosticAbort?.abort();
    this.#readiness = newReadiness();
    this.#state = 'stopped';
    this.#lastFailure = null;
    this.#startAbort?.abort();

    const task = (async () => {
      // Wait for the exact in-flight start to observe the epoch change and
      // release any process it managed before completing the stop.
      if (active) await active.catch(() => {});
      const record = this.#managed;
      this.#managed = null;
      this.#clearEndpoint();
      if (record) {
        try { await this.#stopRecord(record, false); }
        catch (error) { this.#managed = record; this.#state = 'unavailable'; this.#lastFailure = 'XHS_SERVICE_STOP'; throw error; }
      }
      return this.#snapshot();
    })();
    const tracked = task.finally(() => {
      if (this.#stopPromise === tracked) this.#stopPromise = null;
    });
    this.#stopPromise = tracked;
    return tracked;
  }

  restart() {
    if (this.#restartPromise) return this.#restartPromise;
    const task = this.#doRestart();
    const tracked = task.finally(() => {
      if (this.#restartPromise === tracked) this.#restartPromise = null;
    });
    this.#restartPromise = tracked;
    return tracked;
  }

  // Host-only diagnostic adapters, never populated from UI/model input. A health
  // response establishes HTTP availability only. Missing probes stay unknown.
  diagnose() {
    if (this.#diagnosing) return this.#diagnosing;
    if (this.#state !== 'http_ready') return Promise.reject(safeError('XHS_SERVICE_UNAVAILABLE'));
    const epoch = this.#epoch;
    const controller = new AbortController();
    this.#diagnosticAbort = controller;
    const task = this.#runDiagnostics(epoch, controller);
    this.#diagnosing = task;
    task.then(() => clear(), () => clear());
    const clear = () => {
      if (this.#diagnosing === task) this.#diagnosing = null;
      if (this.#diagnosticAbort === controller) this.#diagnosticAbort = null;
    };
    return task;
  }

  async #runDiagnostics(epoch, controller) {
    for (const key of PROBE_STAGES) {
      this.#assertEpoch(epoch);
      this.#readiness[key] = {status:'not_checked', checkedAt:null, code:null};
    }
    for (const key of PROBE_STAGES) {
      this.#assertEpoch(epoch);
      if (key === 'qr' && !['http','authentication','storage','browser'].every(stage => this.#readiness[stage].status === 'passed')) {
        this.#readiness.qr = {status:'blocked', checkedAt:null, code:'PREREQUISITE_NOT_PASSED'};
        continue;
      }
      if (!this.#probes[key]) continue;
      const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(this.#healthTimeoutMs)]);
      let abort;
      const cancelled = new Promise((_, reject) => {
        abort = () => reject(safeError('XHS_DIAGNOSTIC_TIMEOUT'));
        signal.addEventListener('abort', abort, {once:true});
        if (signal.aborted) abort();
      });
      // A referenced timer also keeps synthetic/no-I/O adapters alive until bounded completion.
      const keepAlive = setTimeout(() => {}, this.#healthTimeoutMs + 1);
      try {
        const result = await Promise.race([cancelled, Promise.resolve().then(() => this.#probes[key]({
          origin:`http://${XHS_SERVICE_HOST}:${this.#port}`, token:this.#token,
          cookiesPath:this.#cookiesPath, signal,
        }))]);
        this.#assertEpoch(epoch);
        this.#readiness[key] = {status:result?.passed === true ? 'passed':'failed', checkedAt:Date.now(),
          code:result?.passed === true ? null:'PROBE_FAILED'};
      } catch (error) {
        this.#assertEpoch(epoch);
        this.#readiness[key] = {status:'failed', checkedAt:Date.now(), code:signal.aborted ? 'PROBE_TIMEOUT':'PROBE_FAILED'};
      } finally {
        clearTimeout(keepAlive);
        signal.removeEventListener('abort', abort);
      }
    }
    return this.#snapshot();
  }

  #beginStart() {
    const epoch = this.#epoch;
    this.#state = 'starting';
    this.#readiness = newReadiness();
    this.#lastFailure = null;
    const task = this.#doStart(epoch);
    this.#startPromise = task;
    task.then(
      () => this.#clearStart(task),
      () => this.#clearStart(task),
    );
    return task;
  }

  async #doStart(epoch) {
    let record = null;
    try {
      let actualHash;
      try {
        actualHash = await this.#hashFile(this.#executable);
      } catch {
        fail('XHS_SERVICE_CHECKSUM');
      }
      this.#assertEpoch(epoch);
      this.#verifyHash(actualHash);

      let port;
      try {
        port = await this.#allocatePort({
          host: XHS_SERVICE_HOST,
          workspaceHash: this.#workspaceHash,
        });
      } catch {
        fail('XHS_SERVICE_PORT');
      }
      this.#assertEpoch(epoch);
      if (!Number.isInteger(port) || port < 1 || port > 65535) fail('XHS_SERVICE_PORT');

      // A fresh 32-byte token is generated for every spawn. It is only put in
      // the child environment and private state; status and errors never see it.
      const token = randomBytes(TOKEN_BYTES).toString('hex');
      const origin = `http://${XHS_SERVICE_HOST}:${port}`;
      let handle;
      try {
        handle = await this.#spawnProcess({
          executable: this.#executable,
          args: ['-port', `${XHS_SERVICE_HOST}:${port}`],
          cwd: this.#root,
          env: Object.freeze({
            AUTH_TOKEN: token,
            COOKIES_PATH: this.#cookiesPath,
          }),
          host: XHS_SERVICE_HOST,
          port,
        });
      } catch {
        fail('XHS_SERVICE_SPAWN');
      }
      if (!isRecord(handle)) fail('XHS_SERVICE_SPAWN');

      // Register the exact handle before observing a possible stop. If stop is
      // called while spawn was pending, the epoch check below fails and the
      // catch path still owns a record that can stop this exact child tree.
      record = { handle, epoch, stopped: false };
      this.#managed = record;
      this.#assertEpoch(epoch);
      this.#token = token;
      this.#port = port;
      this.#pid = Number.isSafeInteger(handle.pid) && handle.pid > 0 ? handle.pid : null;

      let healthResult;
      try {
        healthResult = await this.#awaitHealth(epoch, {
          origin,
          token,
          version: XHS_SERVICE_VERSION,
        });
      } catch (error) {
        const code = errorCode(error);
        if (code === 'XHS_SERVICE_TIMEOUT' || code === 'XHS_SERVICE_STOPPED') throw error;
        fail('XHS_SERVICE_HEALTH');
      }
      this.#assertEpoch(epoch);
      this.#verifyHealth(healthResult);
      this.#assertEpoch(epoch);

      this.#readiness.http = {status:'passed', checkedAt:Date.now(), code:null};
      this.#state = 'http_ready';
      this.#lastFailure = null;
      return this.#snapshot();
    } catch (error) {
      const code = errorCode(error) ?? 'XHS_SERVICE_UNAVAILABLE';
      if (record) {
        if (this.#managed === record) this.#managed = null;
        if (!await this.#stopRecord(record, true)) {
          this.#managed = record; this.#state = 'unavailable'; this.#lastFailure = 'XHS_SERVICE_STOP';
          this.#clearEndpoint(); throw safeError('XHS_SERVICE_STOP');
        }
      }
      this.#clearEndpoint();
      if (epoch !== this.#epoch) {
        this.#state = 'stopped';
        throw safeError('XHS_SERVICE_STOPPED');
      }
      this.#state = 'unavailable';
      this.#lastFailure = code;
      throw safeError(code);
    }
  }

  async #doRestart() {
    await this.stop();
    const epoch = this.#epoch;
    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RESTART_RETRIES; attempt += 1) {
      if (this.#epoch !== epoch) throw safeError('XHS_SERVICE_STOPPED');
      if (attempt > 0) {
        await this.#sleep(this.#restartBaseDelayMs * (2 ** (attempt - 1)));
        if (this.#epoch !== epoch) throw safeError('XHS_SERVICE_STOPPED');
      }
      // start() intentionally refuses an unavailable instance. Restart is the
      // explicit, bounded recovery path, so it resets the internal state first.
      this.#state = 'stopped';
      this.#lastFailure = null;
      try {
        return await this.#beginStart();
      } catch (error) {
        lastError = error;
        if (this.#epoch !== epoch) throw safeError('XHS_SERVICE_STOPPED');
        if (!this.#retryable(error)) throw error;
      }
    }
    throw lastError ?? safeError('XHS_SERVICE_UNAVAILABLE');
  }

  #retryable(error) {
    const code = errorCode(error);
    if (!code) return false;
    return new Set([
      'XHS_SERVICE_SPAWN',
      'XHS_SERVICE_PORT',
      'XHS_SERVICE_HEALTH',
      'XHS_SERVICE_TIMEOUT',
      'XHS_SERVICE_VERSION',
      'XHS_SERVICE_UNAVAILABLE',
    ]).has(code);
  }

  #awaitHealth(epoch, input) {
    const controller = new AbortController();
    this.#startAbort = controller;
    let timer = null;
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => reject(safeError('XHS_SERVICE_TIMEOUT')), this.#healthTimeoutMs);
      // The deadline must keep the pending lifecycle operation alive.
    });
    const aborted = new Promise((_, reject) => {
      const onAbort = () => reject(safeError('XHS_SERVICE_STOPPED'));
      if (controller.signal.aborted) onAbort();
      else controller.signal.addEventListener('abort', onAbort, { once: true });
    });
    const health = Promise.resolve().then(() => this.#health({
      ...input,
      signal: controller.signal,
      timeoutMs: this.#healthTimeoutMs,
    }));

    return Promise.race([health, deadline, aborted]).finally(() => {
      if (timer) clearTimeout(timer);
      controller.abort();
      if (this.#startAbort === controller) this.#startAbort = null;
      // Keep a late rejection from health from becoming unhandled after the
      // deadline or a stop won the race.
      health.catch(() => {});
      if (this.#epoch !== epoch) throw safeError('XHS_SERVICE_STOPPED');
    });
  }

  #verifyHash(actualHash) {
    if (typeof actualHash !== 'string' || !SHA256_HEX.test(actualHash)) fail('XHS_SERVICE_CHECKSUM');
    if (actualHash.toLowerCase() !== this.#expectedSha256) fail('XHS_SERVICE_CHECKSUM');
  }

  #verifyHealth(result) {
    let version = null;
    if (typeof result === 'string') {
      version = result;
    } else if (isRecord(result)) {
      if (result.ok === false || result.healthy === false) fail('XHS_SERVICE_HEALTH');
      version = result.version ?? result.serviceVersion ?? null;
    } else {
      fail('XHS_SERVICE_HEALTH');
    }
    if (typeof version !== 'string' || version.length === 0) fail('XHS_SERVICE_HEALTH');
    if (version !== XHS_SERVICE_VERSION) fail('XHS_SERVICE_VERSION');
  }

  #assertEpoch(epoch) {
    if (epoch !== this.#epoch) fail('XHS_SERVICE_STOPPED');
  }

  #clearStart(task) {
    if (this.#startPromise === task) this.#startPromise = null;
  }

  #clearEndpoint() {
    this.#token = null;
    this.#port = null;
    this.#pid = null;
  }

  async #stopRecord(record, swallow) {
    if (!record || record.stopped) return true;
    try {
      await this.#stopTree(record.handle);
      record.stopped = true;
      return true;
    } catch {
      if (this.#state !== 'stopped') this.#lastFailure = 'XHS_SERVICE_STOP';
      if (!swallow) throw safeError('XHS_SERVICE_STOP');
      return false;
    }
  }

  #snapshot() {
    return Object.freeze({
      state: this.#state,
      loginPrerequisitesReady: this.#state === 'http_ready' && Object.values(this.#readiness).every(item => item.status === 'passed'),
      readiness: Object.freeze(Object.fromEntries(Object.entries(this.#readiness).map(([key,value]) => [key,Object.freeze({...value})]))),
      version: XHS_SERVICE_VERSION,
      port: this.#state === 'http_ready' ? this.#port : null,
      pid: this.#state === 'http_ready' ? this.#pid : null,
      lastFailure: this.#lastFailure,
    });
  }
}
