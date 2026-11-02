import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createStore } from '../src/modules/memory/src/store.js';
import { createUnifiedSessionAcl } from '../src/modules/memory/src/unified-session-acl.js';

test('Core nested data path retains a readable pre-ACL backup on Windows', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'core-backup-'));
  const dir = path.join(root, 'nested'.padEnd(Math.max(6, 168 - root.length), 'x'));
  fs.mkdirSync(dir, {recursive:true});
  const store = createStore(path.join(dir, 'memory.db'));
  try {
    const original = store.save({type:'preference',title:'preserved',content:'synthetic data',importance:4});
    createUnifiedSessionAcl({db:store.db,workspaceId:'test',resolveTrustedSession:()=>null,
      authorizeWorkspace:()=>({allowed:false}),confirmOrdinarySession:()=>false});
    assert.equal(store.db.prepare("SELECT value FROM unified_acl_meta WHERE key='schema_version'").get().value,'2');
    const names = fs.readdirSync(dir).filter(x=>x.startsWith('memory.pre-unified-learning-v2-'));
    assert.equal(names.length,1);
    const backup = new DatabaseSync(path.join(dir,names[0]),{readOnly:true});
    try { assert.equal(backup.prepare('SELECT content FROM memories WHERE id=?').get(original.id).content,'synthetic data'); }
    finally {backup.close();}
  } finally {store.close();fs.rmSync(root,{recursive:true,force:true});}
});
