import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { DatabaseSync, backup } from 'node:sqlite';

/**
 * Core migration snapshots.
 *
 * A snapshot is a *copy* of the four independent module data directories. The
 * source stores are opened read-only and are never rewritten, deleted or
 * checked out. SQLite databases are captured through `node:sqlite`'s backup
 * API from a read-only connection so committed WAL frames are included.
 */

export const MODULES = Object.freeze(['memory', 'life', 'state', 'persona']);

export const LIMITS = Object.freeze({
  maxEntries: 10_000,
  maxFileBytes: 128 * 1024 * 1024,
});

const PRIMARY_STORE = Object.freeze({
  memory: 'memory.db',
  life: 'life.sqlite',
  state: 'state.sqlite',
  persona: 'persona.json',
});

const EXPECTED_SCHEMA = Object.freeze({
  memory: [1, 2],
  life: [10],
  state: [2],
});

const MANIFEST_FILE = 'manifest.json';
const ERROR_NOTE_FILE = '.snapshot-error.json';
const SQLITE_HEADER = Buffer.from('SQLite format 3\u0000', 'latin1');

function primaryPath(moduleName, directory) {
  if (moduleName !== 'memory') return PRIMARY_STORE[moduleName];
  const bindingFile = path.join(directory, 'workspace-binding.json');
  if (!fs.existsSync(bindingFile)) return PRIMARY_STORE.memory;
  let binding;
  try { binding = JSON.parse(fs.readFileSync(bindingFile, 'utf8')); } catch { fail('MANIFEST_INVALID', 'Invalid Memory workspace binding.'); }
  if (binding.version !== 1 || typeof binding.workspaceId !== 'string' || !binding.workspaceId) fail('MANIFEST_INVALID', 'Invalid Memory workspace binding.');
  const digest = createHash('sha256').update(binding.workspaceId).digest('hex');
  const marker = JSON.parse(fs.readFileSync(path.join(directory, 'workspaces', digest, '.mneme-workspace.json'), 'utf8'));
  if (marker.workspaceId !== binding.workspaceId || marker.version !== 1) fail('MANIFEST_INVALID', 'Memory workspace marker mismatch.');
  return `workspaces/${digest}/memory.db`;
}

const SAFE_MESSAGES = Object.freeze({
  INVALID_ARGUMENTS: 'Invalid migration arguments.',
  ASSERT_STOPPED_REQUIRED: 'A trusted assertStopped callback is required.',
  ASSERT_STOPPED_FALSE: 'Writers are not stopped; the snapshot was aborted.',
  ASSERT_STOPPED_FAILED: 'The writer-stop assertion failed; the snapshot was aborted.',
  SOURCE_MAP_INVALID: 'Sources must map memory, life, state and persona to directories.',
  SOURCE_NOT_ABSOLUTE: 'Every source directory must be an absolute path.',
  SOURCE_MISSING: 'A source directory does not exist.',
  SOURCE_NOT_DIRECTORY: 'A source path is not a directory.',
  SOURCE_UNREADABLE: 'A source directory could not be read.',
  TARGET_NOT_ABSOLUTE: 'The target root must be an absolute path.',
  TARGET_PARENT_MISSING: 'The target parent directory must already exist.',
  TARGET_MISSING: 'The snapshot target does not exist.',
  TARGET_OVERLAP: 'Sources and target must not contain one another.',
  TARGET_EXISTS: 'The target already exists; existing snapshots are never overwritten.',
  TARGET_EXISTS_SOURCES_CHANGED: 'The target already contains a snapshot and the sources have changed.',
  TARGET_EXISTS_INVALID: 'The existing target is not a valid snapshot; refusing to overwrite it.',
  NESTED_SOURCES: 'Source directories must not be nested inside one another.',
  SYMLINK_REJECTED: 'Symbolic links and junctions are not allowed in migration paths.',
  UNSUPPORTED_ENTRY: 'Only regular files and directories may be copied.',
  ENTRY_LIMIT_EXCEEDED: 'The source tree contains too many entries.',
  FILE_TOO_LARGE: 'A source file exceeds the snapshot size limit.',
  SIZE_MISMATCH: 'A copied file does not match its source size.',
  SQLITE_OPEN_FAILED: 'A SQLite database could not be opened read-only.',
  SQLITE_BACKUP_FAILED: 'A SQLite database could not be backed up.',
  SQLITE_NORMALIZE_FAILED: 'A backed-up SQLite database could not be normalized.',
  SQLITE_INTEGRITY_FAILED: 'A SQLite database failed integrity_check.',
  SQLITE_SCHEMA_UNSUPPORTED: 'A module store has an unsupported schema.',
  SQLITE_USER_VERSION_MISMATCH: 'A SQLite database user_version does not match the manifest.',
  SQLITE_SIDECAR_CLEANUP_FAILED: 'SQLite sidecar files could not be removed from the snapshot.',
  EXPECTED_STORE_MISSING: 'A module is missing its expected primary store.',
  PERSONA_JSON_INVALID: 'The Persona store is not a valid JSON object.',
  MANIFEST_MISSING: 'The snapshot manifest is missing or unreadable.',
  MANIFEST_INVALID: 'The snapshot manifest is invalid.',
  MANIFEST_SCHEMA_UNSUPPORTED: 'The snapshot manifest schema is unsupported.',
  HASH_MISMATCH: 'A snapshot file hash does not match the manifest.',
  FILE_MISSING: 'A file recorded in the manifest is missing.',
  UNEXPECTED_FILE: 'The snapshot contains a file not recorded in the manifest.',
  STAGING_FAILED: 'A unique staging directory could not be created.',
  COMMIT_FAILED: 'The staging directory could not be committed atomically.',
  SNAPSHOT_FAILED: 'The snapshot failed; staging was retained for recovery.',
});

export class MigrationError extends Error {
  constructor(code, message, options = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'MigrationError';
    this.code = code;
  }
}

function fail(code, message, options) {
  throw new MigrationError(code, message, options);
}

function comparable(value) {
  const resolved = path.resolve(value);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function samePath(a, b) {
  return comparable(a) === comparable(b);
}

function containsPath(parent, child) {
  const relative = path.relative(comparable(parent), comparable(child));
  return relative === ''
    || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function isAbsoluteString(value) {
  return typeof value === 'string' && value.length > 0 && path.isAbsolute(value);
}

/**
 * Reject links/junctions in every existing component of `target`. A missing
 * tail is allowed only when the caller explicitly permits it (for a target
 * that has not been created yet). Node's lstat does not identify Windows
 * junctions as symlinks, so the real path of every component is compared
 * against the real path of its parent.
 */
function assertNoLinks(target, { allowMissingTail = false } = {}) {
  const resolved = path.resolve(target);
  const parsed = path.parse(resolved);
  const parts = resolved.slice(parsed.root.length).split(path.sep).filter(Boolean);
  let current = parsed.root;
  let currentReal;
  try {
    currentReal = fs.realpathSync.native(current);
  } catch {
    currentReal = current;
  }
  for (const part of parts) {
    const candidate = path.join(current, part);
    let stat;
    try {
      stat = fs.lstatSync(candidate);
    } catch (error) {
      if (error?.code === 'ENOENT' && allowMissingTail) return;
      fail('SOURCE_UNREADABLE', `Cannot inspect a migration path component (${part}).`, { cause: error });
    }
    if (stat.isSymbolicLink()) {
      fail('SYMLINK_REJECTED', 'Symbolic links and junctions are not allowed in migration paths.');
    }
    let real;
    try {
      real = fs.realpathSync.native(candidate);
    } catch (error) {
      if (error?.code === 'ENOENT' && allowMissingTail) return;
      fail('SOURCE_UNREADABLE', `Cannot resolve a migration path component (${part}).`, { cause: error });
    }
    const expected = path.join(currentReal, part);
    if (!samePath(real, expected)) {
      fail('SYMLINK_REJECTED', 'Symbolic links and junctions are not allowed in migration paths.');
    }
    current = candidate;
    currentReal = real;
  }
}

function validateSources(sources) {
  if (!sources || typeof sources !== 'object' || Array.isArray(sources)) {
    fail('SOURCE_MAP_INVALID', 'Sources must be an object mapping all four modules.');
  }
  const expected = [...MODULES].sort();
  const actual = Object.keys(sources).sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    fail('SOURCE_MAP_INVALID', 'Sources must contain exactly memory, life, state and persona.');
  }

  const resolved = {};
  for (const moduleName of MODULES) {
    const value = sources[moduleName];
    if (!isAbsoluteString(value)) {
      fail('SOURCE_NOT_ABSOLUTE', `The ${moduleName} source directory must be absolute.`);
    }
    const absolute = path.resolve(value);
    assertNoLinks(absolute, { allowMissingTail: true });
    let stat;
    try {
      stat = fs.lstatSync(absolute);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        fail('SOURCE_MISSING', `The ${moduleName} source directory does not exist.`);
      }
      fail('SOURCE_UNREADABLE', `The ${moduleName} source directory cannot be inspected.`, { cause: error });
    }
    if (!stat.isDirectory()) {
      fail('SOURCE_NOT_DIRECTORY', `The ${moduleName} source path is not a directory.`);
    }
    resolved[moduleName] = absolute;
  }

  for (let left = 0; left < MODULES.length; left += 1) {
    for (let right = left + 1; right < MODULES.length; right += 1) {
      const a = resolved[MODULES[left]];
      const b = resolved[MODULES[right]];
      if (containsPath(a, b) || containsPath(b, a)) {
        fail('NESTED_SOURCES', 'Source directories must not be nested inside one another.');
      }
    }
  }
  return resolved;
}

function validateTargetRoot(targetRoot, sourceDirs) {
  if (!isAbsoluteString(targetRoot)) {
    fail('TARGET_NOT_ABSOLUTE', 'The target root must be an absolute path.');
  }
  const absolute = path.resolve(targetRoot);
  const parent = path.dirname(absolute);

  let parentStat;
  try {
    parentStat = fs.lstatSync(parent);
  } catch (error) {
    fail('TARGET_PARENT_MISSING', 'The target parent directory must already exist.', { cause: error });
  }
  if (!parentStat.isDirectory()) {
    fail('TARGET_PARENT_MISSING', 'The target parent path is not a directory.');
  }
  assertNoLinks(parent);

  let exists = false;
  let targetStat;
  try {
    targetStat = fs.lstatSync(absolute);
    exists = true;
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      fail('TARGET_PARENT_MISSING', 'The target path cannot be inspected.', { cause: error });
    }
  }
  if (exists) {
    assertNoLinks(absolute);
    if (targetStat.isSymbolicLink()) {
      fail('SYMLINK_REJECTED', 'Symbolic links and junctions are not allowed in migration paths.');
    }
    if (!targetStat.isDirectory()) {
      fail('TARGET_EXISTS', 'The target already exists and is not a snapshot directory.');
    }
  }

  for (const source of sourceDirs) {
    if (containsPath(source, absolute) || containsPath(absolute, source)) {
      fail('TARGET_OVERLAP', 'Sources and target must not contain one another.');
    }
  }
  return { targetRoot: absolute, exists };
}

async function requireStopped(assertStopped) {
  let result;
  try {
    result = await assertStopped();
  } catch (error) {
    if (error instanceof MigrationError) throw error;
    fail('ASSERT_STOPPED_FAILED', 'The writer-stop assertion threw.', { cause: error });
  }
  if (result !== true) {
    fail('ASSERT_STOPPED_FALSE', 'Writers are not stopped; the snapshot was aborted.');
  }
}

function countEntry(counter) {
  counter.count += 1;
  if (counter.count > LIMITS.maxEntries) {
    fail('ENTRY_LIMIT_EXCEEDED', 'The source tree contains too many entries.');
  }
}

function collectEntries(root, counter) {
  const entries = [];
  const stack = [{ abs: root, rel: '' }];
  while (stack.length > 0) {
    const directory = stack.pop();
    let names;
    try {
      names = fs.readdirSync(directory.abs).sort();
    } catch (error) {
      fail('SOURCE_UNREADABLE', 'A source directory could not be read.', { cause: error });
    }
    let directoryReal;
    try {
      directoryReal = fs.realpathSync.native(directory.abs);
    } catch (error) {
      fail('SOURCE_UNREADABLE', 'A source directory could not be resolved.', { cause: error });
    }
    for (const name of names) {
      countEntry(counter);
      const absolute = path.join(directory.abs, name);
      const relative = directory.rel ? `${directory.rel}/${name}` : name;
      let stat;
      try {
        stat = fs.lstatSync(absolute);
      } catch (error) {
        fail('SOURCE_UNREADABLE', 'A source entry could not be inspected.', { cause: error });
      }
      if (stat.isSymbolicLink()) {
        fail('SYMLINK_REJECTED', 'Symbolic links and junctions are not allowed in migration paths.');
      }
      if (stat.isDirectory()) {
        let real;
        try {
          real = fs.realpathSync.native(absolute);
        } catch (error) {
          fail('SOURCE_UNREADABLE', 'A source directory could not be resolved.', { cause: error });
        }
        if (!samePath(real, path.join(directoryReal, name))) {
          fail('SYMLINK_REJECTED', 'Symbolic links and junctions are not allowed in migration paths.');
        }
        entries.push({ type: 'dir', rel: relative, abs: absolute });
        stack.push({ abs: absolute, rel: relative });
      } else if (stat.isFile()) {
        entries.push({ type: 'file', rel: relative, abs: absolute, size: stat.size });
      } else {
        fail('UNSUPPORTED_ENTRY', 'Only regular files and directories may be copied.');
      }
    }
  }
  entries.sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
  return entries;
}

function hasSqliteHeader(file) {
  let descriptor;
  try {
    descriptor = fs.openSync(file, 'r');
  } catch (error) {
    fail('SOURCE_UNREADABLE', 'A source file could not be opened.', { cause: error });
  }
  try {
    const header = Buffer.alloc(SQLITE_HEADER.length);
    const read = fs.readSync(descriptor, header, 0, header.length, 0);
    return read === header.length && header.equals(SQLITE_HEADER);
  } finally {
    fs.closeSync(descriptor);
  }
}

function classifyEntries(entries) {
  const directories = entries.filter((entry) => entry.type === 'dir');
  const files = entries.filter((entry) => entry.type === 'file');
  const byRelative = new Map(files.map((file) => [file.rel, file]));
  for (const file of files) {
    file.sqlite = hasSqliteHeader(file.abs);
  }
  for (const file of files) {
    if (!file.rel.endsWith('-wal') && !file.rel.endsWith('-shm')) continue;
    const base = byRelative.get(file.rel.slice(0, -4));
    if (base?.sqlite) {
      file.skipSidecar = true;
    }
  }
  return { directories, files };
}

function hashFile(file) {
  const hash = createHash('sha256');
  const descriptor = fs.openSync(file, 'r');
  try {
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    let offset = 0;
    for (;;) {
      const read = fs.readSync(descriptor, buffer, 0, buffer.length, offset);
      if (read === 0) break;
      hash.update(buffer.subarray(0, read));
      offset += read;
    }
  } finally {
    fs.closeSync(descriptor);
  }
  return hash.digest('hex');
}

function openSqliteReadOnly(file) {
  try {
    return new DatabaseSync(path.toNamespacedPath(file), { readOnly: true });
  } catch (error) {
    fail('SQLITE_OPEN_FAILED', 'A SQLite database could not be opened read-only.', { cause: error });
  }
}

function inspectOpenDatabase(database) {
  const integrityRows = database.prepare('PRAGMA integrity_check').all();
  const verdicts = integrityRows.map((row) => Object.values(row)[0]);
  if (verdicts.length !== 1 || verdicts[0] !== 'ok') {
    fail('SQLITE_INTEGRITY_FAILED', 'A SQLite database failed integrity_check.');
  }
  const versionRow = database.prepare('PRAGMA user_version').get();
  const userVersion = Number(versionRow?.user_version ?? 0);
  if (!Number.isSafeInteger(userVersion) || userVersion < 0) {
    fail('SQLITE_SCHEMA_UNSUPPORTED', 'A SQLite database has an invalid user_version.');
  }
  let metaSchemaVersion = null;
  try {
    const meta = database.prepare(
      "SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = 'meta'",
    ).get();
    if (meta) {
      const row = database.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get();
      if (row !== undefined) metaSchemaVersion = String(row.value);
    }
  } catch {
    metaSchemaVersion = null;
  }
  let unifiedSchemaVersion = null;
  if(database.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='unified_acl_meta'").get()) {
    unifiedSchemaVersion = database.prepare("SELECT value FROM unified_acl_meta WHERE key='schema_version'").get()?.value ?? null;
    if(unifiedSchemaVersion !== null && !['1','2'].includes(String(unifiedSchemaVersion))) fail('SQLITE_SCHEMA_UNSUPPORTED','Unsupported Memory ACL schema.');
  }
  return { userVersion, metaSchemaVersion, unifiedSchemaVersion };
}

function removeSidecars(file) {
  for (const suffix of ['-wal', '-shm']) {
    try {
      fs.unlinkSync(file + suffix);
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        fail('SQLITE_SIDECAR_CLEANUP_FAILED', 'SQLite sidecar files could not be removed.');
      }
    }
    if (fs.existsSync(file + suffix)) {
      fail('SQLITE_SIDECAR_CLEANUP_FAILED', 'SQLite sidecar files could not be removed.');
    }
  }
}

function normalizeSqliteCopy(file) {
  let database;
  try {
    database = new DatabaseSync(path.toNamespacedPath(file));
  } catch (error) {
    fail('SQLITE_NORMALIZE_FAILED', 'A backed-up SQLite database could not be opened.', { cause: error });
  }
  try {
    database.exec('PRAGMA busy_timeout = 5000');
    try {
      database.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    } catch {
      // Not every database is in WAL mode; the following journal-mode change
      // still gives us a single self-contained file.
    }
    try {
      database.exec('PRAGMA journal_mode = DELETE');
    } catch (error) {
      fail('SQLITE_NORMALIZE_FAILED', 'A backed-up SQLite database could not be normalized.', { cause: error });
    }
    return inspectOpenDatabase(database);
  } catch (error) {
    if (error instanceof MigrationError) throw error;
    fail('SQLITE_INTEGRITY_FAILED', 'A backed-up SQLite database failed validation.', { cause: error });
  } finally {
    try {
      database.close();
    } catch {
      // Best effort; the descriptor is closed by the process.
    }
  }
}

async function captureSqliteFile(source, destination) {
  const database = openSqliteReadOnly(source);
  try {
    await backup(database, path.toNamespacedPath(destination));
  } catch (error) {
    if (error instanceof MigrationError) throw error;
    fail('SQLITE_BACKUP_FAILED', 'A SQLite database could not be backed up.', { cause: error });
  } finally {
    try {
      database.close();
    } catch {
      // Best effort.
    }
  }
  const inspected = normalizeSqliteCopy(destination);
  removeSidecars(destination);
  const stat = fs.lstatSync(destination);
  if (stat.size > LIMITS.maxFileBytes) {
    fail('FILE_TOO_LARGE', 'A backed-up SQLite database exceeds the snapshot size limit.');
  }
  return {
    bytes: stat.size,
    sha256: hashFile(destination),
    sqlite: true,
    userVersion: inspected.userVersion,
    metaSchemaVersion: inspected.metaSchemaVersion,
  };
}

function copyBytes(source, destination) {
  const stat = fs.lstatSync(source);
  if (!stat.isFile()) {
    fail('UNSUPPORTED_ENTRY', 'Only regular files may be copied.');
  }
  if (stat.size > LIMITS.maxFileBytes) {
    fail('FILE_TOO_LARGE', 'A source file exceeds the snapshot size limit.');
  }
  try {
    fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
    fs.chmodSync(destination, 0o600);
  } catch (error) {
    fail('SNAPSHOT_FAILED', 'A source file could not be copied.', { cause: error });
  }
  const copied = fs.lstatSync(destination);
  if (!copied.isFile() || copied.size !== stat.size) {
    fail('SIZE_MISMATCH', 'A copied file does not match its source size.');
  }
  return { bytes: copied.size, sha256: hashFile(destination), sqlite: false };
}

function validatePersonaJson(file) {
  let value;
  try {
    value = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail('PERSONA_JSON_INVALID', 'The Persona store is not valid JSON.', { cause: error });
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail('PERSONA_JSON_INVALID', 'The Persona store must be a JSON object.');
  }
  if(value.schemaVersion !== 1) fail('PERSONA_JSON_INVALID','Unsupported Persona schema.');
}

function validateExpectedSchema(moduleName, relativePath, info, absolutePath) {
  const primary = PRIMARY_STORE[moduleName];
  if (!primary || (relativePath !== primary && !(moduleName==='memory' && /^workspaces\/[a-f0-9]{64}\/memory\.db$/.test(relativePath)))) return;
  if (moduleName === 'persona') {
    validatePersonaJson(absolutePath);
    return;
  }
  if (!info.sqlite) {
    fail('SQLITE_SCHEMA_UNSUPPORTED', `The ${moduleName} store must be a SQLite database.`);
  }
  const expected = EXPECTED_SCHEMA[moduleName] ?? [];
  const userVersionOk = expected.includes(info.userVersion);
  if (moduleName === 'memory') {
    if (!userVersionOk) {
      fail('SQLITE_SCHEMA_UNSUPPORTED', 'The Memory SQLite schema is unsupported.');
    }
    return;
  }
  if (info.metaSchemaVersion !== null && info.metaSchemaVersion !== undefined) {
    const metaOk = expected.some((version) => String(version) === String(info.metaSchemaVersion));
    if (!metaOk) {
      fail('SQLITE_SCHEMA_UNSUPPORTED', `The ${moduleName} SQLite schema metadata is unsupported.`);
    }
    if (info.userVersion !== 0 && !userVersionOk) {
      fail('SQLITE_SCHEMA_UNSUPPORTED', `The ${moduleName} SQLite user_version conflicts with its schema metadata.`);
    }
    return;
  }
  if (!userVersionOk) {
    fail('SQLITE_SCHEMA_UNSUPPORTED', `The ${moduleName} SQLite user_version is unsupported.`);
  }
}

async function captureModule(moduleName, sourceDir, destinationDir, counter) {
  const entries = collectEntries(sourceDir, counter);
  const { directories, files } = classifyEntries(entries);
  fs.mkdirSync(destinationDir, { recursive: true, mode: 0o700 });
  for (const directory of directories) {
    fs.mkdirSync(path.join(destinationDir, ...directory.rel.split('/')), { recursive: true, mode: 0o700 });
  }

  const manifestFiles = [];
  for (const file of files) {
    if (file.skipSidecar) continue;
    if (file.size > LIMITS.maxFileBytes) {
      fail('FILE_TOO_LARGE', 'A source file exceeds the snapshot size limit.');
    }
    const destination = path.join(destinationDir, ...file.rel.split('/'));
    fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
    const captured = file.sqlite
      ? await captureSqliteFile(file.abs, destination)
      : copyBytes(file.abs, destination);
    manifestFiles.push({ path: file.rel, ...captured });
  }
  manifestFiles.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { files: manifestFiles };
}

function assertCapturedPrimary(moduleName, destinationDir, manifestModule) {
  const primary = primaryPath(moduleName, destinationDir);
  const entry = manifestModule.files.find((file) => file.path === primary);
  if (!entry) {
    fail('EXPECTED_STORE_MISSING', `The ${moduleName} module is missing ${primary}.`);
  }
  validateExpectedSchema(
    moduleName,
    primary,
    { sqlite: entry.sqlite, userVersion: entry.userVersion, metaSchemaVersion: entry.metaSchemaVersion },
    path.join(destinationDir, primary),
  );
}

function isSafeRelativePath(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 4096) return false;
  if (value.includes('\u0000') || value.includes('\\')) return false;
  if (path.isAbsolute(value) || /^[A-Za-z]:/.test(value)) return false;
  return value.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..');
}

function validateManifestShape(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    fail('MANIFEST_INVALID', 'The snapshot manifest is not an object.');
  }
  if (manifest.schema !== 1) {
    fail('MANIFEST_SCHEMA_UNSUPPORTED', 'Only snapshot manifest schema 1 is supported.');
  }
  if (!manifest.modules || typeof manifest.modules !== 'object' || Array.isArray(manifest.modules)) {
    fail('MANIFEST_INVALID', 'The snapshot manifest has no module map.');
  }
  const expected = [...MODULES].sort();
  const actual = Object.keys(manifest.modules).sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    fail('MANIFEST_INVALID', 'The snapshot manifest must contain exactly four modules.');
  }
  for (const moduleName of MODULES) {
    const module = manifest.modules[moduleName];
    if (!module || typeof module !== 'object' || !Array.isArray(module.files)) {
      fail('MANIFEST_INVALID', `The ${moduleName} manifest entry is invalid.`);
    }
    const seen = new Set();
    for (const file of module.files) {
      if (!file || typeof file !== 'object') {
        fail('MANIFEST_INVALID', 'A manifest file entry is invalid.');
      }
      if (!isSafeRelativePath(file.path)) {
        fail('MANIFEST_INVALID', 'A manifest file path is unsafe.');
      }
      if (seen.has(file.path)) {
        fail('MANIFEST_INVALID', 'A manifest file path is duplicated.');
      }
      seen.add(file.path);
      if (!Number.isSafeInteger(file.bytes) || file.bytes < 0) {
        fail('MANIFEST_INVALID', 'A manifest file size is invalid.');
      }
      if (typeof file.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(file.sha256)) {
        fail('MANIFEST_INVALID', 'A manifest file hash is invalid.');
      }
      if (typeof file.sqlite !== 'boolean') {
        fail('MANIFEST_INVALID', 'A manifest SQLite marker is invalid.');
      }
      if (file.sqlite && (!Number.isSafeInteger(file.userVersion) || file.userVersion < 0)) {
        fail('MANIFEST_INVALID', 'A manifest SQLite user_version is invalid.');
      }
    }
  }
}

function snapshotFilePath(root, moduleName, relativePath) {
  const base = path.join(root, moduleName);
  const absolute = path.join(base, ...relativePath.split('/'));
  if (!containsPath(base, absolute)) {
    fail('MANIFEST_INVALID', 'A manifest file path escapes its module directory.');
  }
  return absolute;
}

async function verifySnapshotInternal(targetRoot) {
  if (!isAbsoluteString(targetRoot)) {
    fail('INVALID_ARGUMENTS', 'The snapshot target root must be an absolute path.');
  }
  const root = path.resolve(targetRoot);
  assertNoLinks(root);
  let rootStat;
  try {
    rootStat = fs.lstatSync(root);
  } catch (error) {
    if (error?.code === 'ENOENT') fail('TARGET_MISSING', 'The snapshot target does not exist.');
    fail('TARGET_MISSING', 'The snapshot target cannot be inspected.', { cause: error });
  }
  if (!rootStat.isDirectory()) {
    fail('TARGET_MISSING', 'The snapshot target is not a directory.');
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(root, MANIFEST_FILE), 'utf8'));
  } catch (error) {
    fail('MANIFEST_MISSING', 'The snapshot manifest is missing or unreadable.', { cause: error });
  }
  validateManifestShape(manifest);

  const expectedFiles = new Set();
  for (const moduleName of MODULES) {
    const module = manifest.modules[moduleName];
    if (!module.files.some((file) => file.path === primaryPath(moduleName,path.join(root,moduleName)))) {
      fail('EXPECTED_STORE_MISSING', `The snapshot is missing the ${moduleName} primary store.`);
    }
    for (const file of module.files) {
      const absolute = snapshotFilePath(root, moduleName, file.path);
      const key = `${moduleName}/${file.path}`;
      if (expectedFiles.has(key)) {
        fail('MANIFEST_INVALID', 'A manifest path is duplicated across modules.');
      }
      expectedFiles.add(key);

      let stat;
      try {
        stat = fs.lstatSync(absolute);
      } catch (error) {
        fail('FILE_MISSING', `A manifest file is missing (${key}).`, { cause: error });
      }
      if (stat.isSymbolicLink()) {
        fail('SYMLINK_REJECTED', 'Symbolic links and junctions are not allowed in snapshots.');
      }
      if (!stat.isFile()) {
        fail('FILE_MISSING', `A manifest file is not a regular file (${key}).`);
      }
      if (stat.size !== file.bytes) {
        fail('SIZE_MISMATCH', `A snapshot file size does not match the manifest (${key}).`);
      }
      if (hashFile(absolute) !== file.sha256) {
        fail('HASH_MISMATCH', `A snapshot file hash does not match the manifest (${key}).`);
      }
      if (file.sqlite) {
        const database = openSqliteReadOnly(absolute);
        let inspected;
        try {
          inspected = inspectOpenDatabase(database);
        } finally {
          database.close();
        }
        if (inspected.userVersion !== file.userVersion) {
          fail('SQLITE_USER_VERSION_MISMATCH', `A SQLite user_version does not match the manifest (${key}).`);
        }
        if (file.metaSchemaVersion !== undefined
          && file.metaSchemaVersion !== null
          && String(inspected.metaSchemaVersion) !== String(file.metaSchemaVersion)) {
          fail('SQLITE_USER_VERSION_MISMATCH', `A SQLite schema metadata value does not match the manifest (${key}).`);
        }
        validateExpectedSchema(moduleName, file.path, { ...inspected, sqlite: true }, absolute);
      } else if (moduleName === 'persona' && file.path === PRIMARY_STORE.persona) {
        validatePersonaJson(absolute);
      }
    }
  }

  const entries = collectEntries(root, { count: 0 });
  for (const entry of entries) {
    if (entry.type !== 'file' || entry.rel === MANIFEST_FILE) continue;
    if (!expectedFiles.has(entry.rel)) {
      fail('UNEXPECTED_FILE', 'The snapshot contains a file not recorded in the manifest.');
    }
  }

  return {
    ok: true,
    targetRoot: root,
    manifest,
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Verify a committed (or staging) snapshot without modifying it.
 *
 * @param {string} targetRoot absolute snapshot directory
 * @returns {Promise<{ok: boolean, targetRoot?: string, manifest?: object, verifiedAt?: string, errors?: Array<{code: string, message: string}>}>}
 */
export async function verifySnapshot(targetRoot) {
  try {
    return await verifySnapshotInternal(targetRoot);
  } catch (error) {
    if (error instanceof MigrationError) {
      return {
        ok: false,
        targetRoot: typeof targetRoot === 'string' ? path.resolve(targetRoot) : null,
        errors: [{ code: error.code, message: SAFE_MESSAGES[error.code] ?? 'Snapshot verification failed.' }],
      };
    }
    return {
      ok: false,
      targetRoot: typeof targetRoot === 'string' ? path.resolve(targetRoot) : null,
      errors: [{ code: 'SNAPSHOT_FAILED', message: 'Snapshot verification failed.' }],
    };
  }
}

async function sourcesMatchManifest(manifest, sources) {
  const probeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'amadeus-core-probe-'));
  const counter = { count: 0 };
  try {
    for (const moduleName of MODULES) {
      const expected = manifest.modules[moduleName].files;
      const entries = collectEntries(sources[moduleName], counter);
      const { files } = classifyEntries(entries);
      const current = new Map(
        files.filter((file) => !file.skipSidecar).map((file) => [file.rel, file]),
      );
      if (current.size !== expected.length) return false;
      for (let index = 0; index < expected.length; index += 1) {
        const recorded = expected[index];
        const file = current.get(recorded.path);
        if (!file || file.sqlite !== recorded.sqlite) return false;
        if (file.sqlite) {
          const destination = path.join(probeRoot, `${moduleName}-${index}.probe`);
          const captured = await captureSqliteFile(file.abs, destination);
          if (captured.bytes !== recorded.bytes
            || captured.sha256 !== recorded.sha256
            || captured.userVersion !== recorded.userVersion) {
            return false;
          }
        } else {
          if (file.size !== recorded.bytes) return false;
          if (hashFile(file.abs) !== recorded.sha256) return false;
        }
      }
    }
    return true;
  } catch {
    // Any read/validation failure while re-checking live sources means they are
    // not provably unchanged. The caller turns this into an explicit conflict.
    return false;
  } finally {
    try {
      fs.rmSync(probeRoot, { recursive: true, force: true });
    } catch {
      // Temporary probe data is best-effort cleanup.
    }
  }
}

function createStagingDirectory(targetRoot) {
  const parent = path.dirname(targetRoot);
  const base = path.basename(targetRoot);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = path.join(parent, `.${base}.staging-${randomUUID()}`);
    try {
      fs.mkdirSync(candidate, { mode: 0o700 });
      return candidate;
    } catch (error) {
      if (error?.code === 'EEXIST') continue;
      fail('STAGING_FAILED', 'A unique staging directory could not be created.', { cause: error });
    }
  }
  fail('STAGING_FAILED', 'A unique staging directory could not be created.');
}

function writeJsonFile(file, value) {
  const descriptor = fs.openSync(file, 'wx', 0o600);
  try {
    fs.writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`);
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
}

function writeErrorNote(staging, error) {
  const code = error instanceof MigrationError && SAFE_MESSAGES[error.code]
    ? error.code
    : 'SNAPSHOT_FAILED';
  const note = {
    schema: 1,
    code,
    message: SAFE_MESSAGES[code] ?? SAFE_MESSAGES.SNAPSHOT_FAILED,
    at: new Date().toISOString(),
    retained: true,
  };
  try {
    fs.writeFileSync(path.join(staging, ERROR_NOTE_FILE), `${JSON.stringify(note, null, 2)}\n`, {
      mode: 0o600,
      flag: 'w',
    });
  } catch {
    // The retained staging directory is still allowed to contain just the
    // partial copy if even the note cannot be written.
  }
}

function attachStaging(error, staging) {
  if (!staging) return;
  try {
    error.staging = staging;
  } catch {
    // Non-extensible errors still have their code/message.
  }
}

async function handleExistingTarget(targetRoot, sourceDirs, assertStopped) {
  const verification = await verifySnapshot(targetRoot);
  if (!verification.ok) {
    const reason = verification.errors?.[0]?.code ?? 'MANIFEST_INVALID';
    fail('TARGET_EXISTS_INVALID', `The existing target is not a valid snapshot (${reason}).`);
  }
  const unchanged = await sourcesMatchManifest(verification.manifest, sourceDirs);
  await requireStopped(assertStopped);
  if (!unchanged) {
    fail('TARGET_EXISTS_SOURCES_CHANGED', 'The target already contains a snapshot and the sources have changed; refusing to overwrite it.');
  }
  return {
    status: 'unchanged',
    targetRoot,
    manifest: verification.manifest,
    staging: null,
    verification,
  };
}

/**
 * Snapshot the four independent module data directories into a new Core root.
 *
 * @param {object} options
 * @param {Record<'memory'|'life'|'state'|'persona', string>} options.sources
 * @param {string} options.targetRoot absolute, non-existing (or previous verified) target
 * @param {() => boolean|Promise<boolean>} options.assertStopped trusted writer-stop assertion
 * @returns {Promise<{status: 'committed'|'unchanged', targetRoot: string, manifest: object, staging: string|null, verification: object}>}
 */
export async function snapshotModules(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    fail('INVALID_ARGUMENTS', 'snapshotModules requires an options object.');
  }
  const { sources, targetRoot, assertStopped } = options;
  if (typeof assertStopped !== 'function') {
    fail('ASSERT_STOPPED_REQUIRED', 'A trusted assertStopped callback is required.');
  }

  const sourceDirs = validateSources(sources);
  const target = validateTargetRoot(targetRoot, Object.values(sourceDirs));

  await requireStopped(assertStopped);
  if (target.exists) {
    return handleExistingTarget(target.targetRoot, sourceDirs, assertStopped);
  }

  let staging = null;
  try {
    staging = createStagingDirectory(target.targetRoot);
    const counter = { count: 0 };
    const modules = {};
    for (const moduleName of MODULES) {
      const destination = path.join(staging, moduleName);
      modules[moduleName] = await captureModule(moduleName, sourceDirs[moduleName], destination, counter);
      assertCapturedPrimary(moduleName, destination, modules[moduleName]);
    }

    const manifest = {
      schema: 1,
      kind: 'amadeus-core-snapshot',
      createdAt: new Date().toISOString(),
      modules,
    };
    writeJsonFile(path.join(staging, MANIFEST_FILE), manifest);

    const verification = await verifySnapshotInternal(staging);
    await requireStopped(assertStopped);

    if (fs.existsSync(target.targetRoot)) {
      fail('TARGET_EXISTS', 'The target already exists; existing snapshots are never overwritten.');
    }
    try {
      fs.renameSync(staging, target.targetRoot);
    } catch (error) {
      if (['EEXIST', 'ENOTEMPTY', 'EPERM'].includes(error?.code)) {
        fail('TARGET_EXISTS', 'The target already exists; existing snapshots are never overwritten.', { cause: error });
      }
      fail('COMMIT_FAILED', 'The staging directory could not be committed atomically.', { cause: error });
    }

    const committedStaging = staging;
    staging = null;
    return {
      status: 'committed',
      targetRoot: target.targetRoot,
      manifest,
      staging: committedStaging,
      verification,
    };
  } catch (error) {
    writeErrorNote(staging, error);
    attachStaging(error, staging);
    throw error;
  }
}
