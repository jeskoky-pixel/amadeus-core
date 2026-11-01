import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import {
  MigrationError,
  snapshotModules,
  verifySnapshot,
} from '../src/core/migration.js';

const MODULES = ['memory', 'life', 'state', 'persona'];

test('snapshot preserves the active Memory Workspace directory and binding', async t => {
  const root=tempRoot(t),sources=makeSources(root),workspaceId='synthetic-workspace';
  const digest=createHash('sha256').update(workspaceId).digest('hex');
  const directory=path.join(sources.memory,'workspaces',digest);
  fs.mkdirSync(directory,{recursive:true});
  fs.renameSync(path.join(sources.memory,'memory.db'),path.join(directory,'memory.db'));
  fs.writeFileSync(path.join(sources.memory,'workspace-binding.json'),JSON.stringify({version:1,workspaceId}));
  fs.writeFileSync(path.join(directory,'.mneme-workspace.json'),JSON.stringify({version:1,workspaceId}));
  const targetRoot=path.join(root,'snapshot');
  const result=await snapshotModules({sources,targetRoot,assertStopped:()=>true});
  assert.equal(result.status,'committed');
  assert.equal((await verifySnapshot(targetRoot)).ok,true);
  withDatabase(path.join(targetRoot,'memory','workspaces',digest,'memory.db'),db=>{
    assert.equal(db.prepare('SELECT content FROM memories WHERE id=?').get('memory-1').content,'Original memory row');
  });
});

function tempRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'amadeus-migration-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }));
  return root;
}

function withDatabase(file, work) {
  const database = new DatabaseSync(file);
  try {
    work(database);
  } finally {
    database.close();
  }
}

function makeSources(root) {
  const base = path.join(root, 'sources');
  const sources = {};
  for (const moduleName of MODULES) {
    const directory = path.join(base, moduleName);
    fs.mkdirSync(directory, { recursive: true });
    sources[moduleName] = directory;
  }

  // Memory records its schema in PRAGMA user_version (supported: 1 or 2).
  withDatabase(path.join(sources.memory, 'memory.db'), (db) => {
    db.exec('PRAGMA journal_mode = WAL');
    db.exec(`
      CREATE TABLE memories (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '[]',
        importance INTEGER NOT NULL DEFAULT 3,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    db.prepare('INSERT INTO memories VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      'memory-1',
      'fact',
      'Migration fixture',
      'Original memory row',
      '[]',
      3,
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    );
    db.exec('PRAGMA user_version = 1');
  });

  // Life records its schema in meta.schema_version; this build writes 10.
  withDatabase(path.join(sources.life, 'life.sqlite'), (db) => {
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    db.prepare('INSERT INTO meta VALUES (?, ?)').run('schema_version', '10');
    db.exec('CREATE TABLE intents (id TEXT PRIMARY KEY, description TEXT NOT NULL)');
    db.prepare('INSERT INTO intents VALUES (?, ?)').run('intent-1', 'Water the plants');
  });

  // State records its schema in meta.schema_version; this build writes 2.
  withDatabase(path.join(sources.state, 'state.sqlite'), (db) => {
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    db.prepare('INSERT INTO meta VALUES (?, ?)').run('schema_version', '2');
    db.exec('CREATE TABLE scopes (id TEXT PRIMARY KEY, persona_id TEXT NOT NULL)');
    db.prepare('INSERT INTO scopes VALUES (?, ?)').run('scope-1', 'persona-1');
  });

  const now = '2026-01-01T00:00:00.000Z';
  const persona = {
    schemaVersion: 1,
    revision: 0,
    createdAt: now,
    updatedAt: now,
    core: { body: 'Preserve me exactly — 你好', revision: 0, createdAt: now, updatedAt: now },
    styles: { warm: { id: 'warm', body: 'kind', revision: 1, createdAt: now, updatedAt: now } },
    defaultStyleId: 'warm',
    workspaceId: 'workspace-1',
    bindingWorkspaceId: 'workspace-1',
    injectionEnabled: true,
    bindings: {},
    history: [],
  };
  fs.writeFileSync(
    path.join(sources.persona, 'persona.json'),
    `${JSON.stringify(persona, null, 2)}\n`,
  );

  fs.mkdirSync(path.join(sources.state, 'notes'), { recursive: true });
  fs.writeFileSync(path.join(sources.state, 'notes', 'config.json'), '{"keep":true}\n');
  return sources;
}

function freshTarget(root) {
  const parent = path.join(root, 'snapshots');
  fs.mkdirSync(parent, { recursive: true });
  return path.join(parent, 'core-snapshot');
}

function stagingEntries(root) {
  const parent = path.join(root, 'snapshots');
  return fs.readdirSync(parent).filter((name) => name.includes('.staging-'));
}

function readManifest(target) {
  return JSON.parse(fs.readFileSync(path.join(target, 'manifest.json'), 'utf8'));
}

test('snapshotModules preserves JSON files and verifies the committed snapshot', async (t) => {
  const root = tempRoot(t);
  const sources = makeSources(root);
  const target = freshTarget(root);
  const originalPersona = fs.readFileSync(path.join(sources.persona, 'persona.json'));

  const result = await snapshotModules({
    sources,
    targetRoot: target,
    assertStopped: () => true,
  });

  assert.equal(result.status, 'committed');
  assert.equal(result.targetRoot, target);
  assert.ok(fs.statSync(target).isDirectory());

  const copiedPersona = path.join(target, 'persona', 'persona.json');
  assert.equal(fs.readFileSync(copiedPersona, 'utf8'), originalPersona.toString('utf8'));
  assert.deepEqual(JSON.parse(fs.readFileSync(copiedPersona, 'utf8')), JSON.parse(originalPersona));
  assert.equal(
    fs.readFileSync(path.join(target, 'state', 'notes', 'config.json'), 'utf8'),
    '{"keep":true}\n',
  );

  const manifest = readManifest(target);
  assert.equal(manifest.schema, 1);
  assert.deepEqual(Object.keys(manifest.modules).sort(), [...MODULES].sort());
  for (const moduleName of MODULES) {
    assert.ok(
      manifest.modules[moduleName].files.some((file) => file.path ===
        ({ memory: 'memory.db', life: 'life.sqlite', state: 'state.sqlite', persona: 'persona.json' })[moduleName]),
      `${moduleName} manifest lists its primary store`,
    );
  }

  const verification = await verifySnapshot(target);
  assert.equal(verification.ok, true);
  assert.equal(verification.targetRoot, target);
  assert.equal(verification.manifest.schema, 1);
  assert.match(verification.verifiedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('snapshotModules captures committed rows that are still in the WAL', async (t) => {
  const root = tempRoot(t);
  const sources = makeSources(root);
  const target = freshTarget(root);
  const memoryFile = path.join(sources.memory, 'memory.db');

  const writer = new DatabaseSync(memoryFile);
  try {
    writer.exec('PRAGMA journal_mode = WAL');
    writer.prepare('INSERT INTO memories VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      'memory-wal',
      'fact',
      'WAL row',
      'Only committed to the write-ahead log',
      '[]',
      5,
      '2026-01-02T00:00:00.000Z',
      '2026-01-02T00:00:00.000Z',
    );
    const walFile = `${memoryFile}-wal`;
    assert.ok(fs.existsSync(walFile), 'source has a WAL file');
    assert.ok(fs.statSync(walFile).size > 0, 'source WAL contains committed frames');

    const result = await snapshotModules({
      sources,
      targetRoot: target,
      assertStopped: () => true,
    });
    assert.equal(result.status, 'committed');

    const snapshotDb = new DatabaseSync(path.join(target, 'memory', 'memory.db'), { readOnly: true });
    try {
      const row = snapshotDb
        .prepare('SELECT content FROM memories WHERE id = ?')
        .get('memory-wal');
      assert.equal(row?.content, 'Only committed to the write-ahead log');
      assert.equal(snapshotDb.prepare('PRAGMA user_version').get().user_version, 1);
    } finally {
      snapshotDb.close();
    }
    assert.ok(!fs.existsSync(path.join(target, 'memory', 'memory.db-wal')));
  } finally {
    writer.close();
  }
});

test('snapshotModules is idempotent when sources are unchanged', async (t) => {
  const root = tempRoot(t);
  const sources = makeSources(root);
  const target = freshTarget(root);

  const first = await snapshotModules({ sources, targetRoot: target, assertStopped: () => true });
  assert.equal(first.status, 'committed');
  const manifestBefore = fs.readFileSync(path.join(target, 'manifest.json'), 'utf8');

  const second = await snapshotModules({ sources, targetRoot: target, assertStopped: () => true });
  assert.equal(second.status, 'unchanged');
  assert.equal(second.staging, null);
  assert.equal(second.targetRoot, target);
  assert.equal(fs.readFileSync(path.join(target, 'manifest.json'), 'utf8'), manifestBefore);
  assert.deepEqual(stagingEntries(root), []);
});

test('snapshotModules rejects an existing snapshot when its sources changed', async (t) => {
  const root = tempRoot(t);
  const sources = makeSources(root);
  const target = freshTarget(root);

  await snapshotModules({ sources, targetRoot: target, assertStopped: () => true });
  const snapshotPersona = fs.readFileSync(path.join(target, 'persona', 'persona.json'));

  const personaPath = path.join(sources.persona, 'persona.json');
  const changed = JSON.parse(fs.readFileSync(personaPath, 'utf8'));
  changed.core.body = 'Changed after the snapshot';
  fs.writeFileSync(personaPath, `${JSON.stringify(changed, null, 2)}\n`);

  await assert.rejects(
    snapshotModules({ sources, targetRoot: target, assertStopped: () => true }),
    (error) => error instanceof MigrationError && error.code === 'TARGET_EXISTS_SOURCES_CHANGED',
  );
  assert.deepEqual(
    fs.readFileSync(path.join(target, 'persona', 'persona.json')),
    snapshotPersona,
  );
  assert.equal((await verifySnapshot(target)).ok, true);
});

test('snapshotModules aborts when assertStopped returns false', async (t) => {
  const root = tempRoot(t);
  const sources = makeSources(root);
  const target = freshTarget(root);

  await assert.rejects(
    snapshotModules({ sources, targetRoot: target, assertStopped: () => false }),
    (error) => error instanceof MigrationError && error.code === 'ASSERT_STOPPED_FALSE',
  );
  assert.equal(fs.existsSync(target), false);
  assert.deepEqual(stagingEntries(root), []);
});

test('snapshotModules rejects a target that overlaps a source directory', async (t) => {
  const root = tempRoot(t);
  const sources = makeSources(root);
  const target = path.join(sources.memory, 'snapshot-inside-source');

  await assert.rejects(
    snapshotModules({ sources, targetRoot: target, assertStopped: () => true }),
    (error) => error instanceof MigrationError && error.code === 'TARGET_OVERLAP',
  );
  assert.equal(fs.existsSync(target), false);
});

test('verifySnapshot rejects a tampered snapshot and reports the failure code', async (t) => {
  const root = tempRoot(t);
  const sources = makeSources(root);
  const target = freshTarget(root);

  const result = await snapshotModules({ sources, targetRoot: target, assertStopped: () => true });
  assert.equal(result.status, 'committed');

  const victim = path.join(target, 'state', 'notes', 'config.json');
  const size = fs.statSync(victim).size;
  fs.writeFileSync(victim, 'X'.repeat(size));

  const verification = await verifySnapshot(target);
  assert.equal(verification.ok, false);
  assert.equal(verification.errors.length, 1);
  assert.equal(verification.errors[0].code, 'HASH_MISMATCH');
  assert.equal(typeof verification.errors[0].message, 'string');
});
