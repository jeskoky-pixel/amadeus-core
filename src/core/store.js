import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const MODULES = ['memory', 'life', 'state', 'persona'];
export function atomicJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${randomUUID()}.tmp`;
  const fd = fs.openSync(tmp, 'wx', 0o600);
  try { fs.writeFileSync(fd, JSON.stringify(value, null, 2)); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
  fs.renameSync(tmp, file);
}
export class CoreStore {
  constructor(root) {
    this.root = path.resolve(root); this.file = path.join(this.root, 'core.json');
    this.state = fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file, 'utf8')) : {
      schema: 1, revision: 0, workspaceId: null, modules: Object.fromEntries(MODULES.map(n => [n, { enabled: true, config: {} }])),
      platforms: {}, activitySessionId: null,
    };
    if (this.state.schema !== 1) throw Error('CORE_SCHEMA_UNSUPPORTED');
    if (!Number.isSafeInteger(this.state.revision) || !this.state.modules) throw Error('CORE_CONFIG_INVALID');
  }
  snapshot() { return structuredClone(this.state); }
  update(revision, change) {
    if (revision !== this.state.revision) throw Error('CORE_REVISION_CONFLICT');
    const next = this.snapshot(); change(next); next.revision++;
    if (fs.existsSync(this.file)) atomicJson(path.join(this.root, 'backups', `core-r${this.state.revision}.json`), this.state);
    atomicJson(this.file, next); this.state = next; return this.snapshot();
  }
}
