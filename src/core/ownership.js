import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const LEGACY_IDS = new Set(['dsh-mneme', 'amadeus-life', 'amadeus-state', 'amadeus-persona']);
export function isLegacyEntry(entry){
  return LEGACY_IDS.has(entry.options?.id)||/^@(?:fg-lab\/amadeus-|amadeus\/)(memory|life|state|persona)$/.test(entry.options?.name??'');
}
// Official Desktop 0.2.1-rc.3 Loader calls this waterfall before registry.plugin
// on activation, and before an existing fiber update. Throwing prevents the
// second writer from starting; it never rewrites the user's plugin config.
export function installLegacyGuard(ctx,isActive){
  return ctx.on('loader/patch-context',(entry,next)=>{
    if(isActive()&&isLegacyEntry(entry)&&entry.disabled!==true&&entry.options?.disabled!==true)
      throw Error('CORE_STANDALONE_CONFLICT');
    return next();
  },{global:true,prepend:true});
}
export function legacyConflicts(editor) {
  if (!editor || typeof editor.entries !== 'function') throw Error('CORE_HOST_CONFIG_EDITOR_REQUIRED');
  return editor.entries().filter(e => e.disabled!==true&&e.options?.disabled !== true&&isLegacyEntry(e)).map(e => e.options.id ?? e.options.name);
}
export function acquireLease(root) {
  fs.mkdirSync(root, { recursive: true });
  const file = path.join(root, '.core-writer.json');
  const token = randomUUID();
  // A live/reused PID fails closed. Only a proven dead writer may be recovered.
  if (fs.existsSync(file)) {
    const prior = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Number.isSafeInteger(prior.pid) || prior.pid <= 0) throw Error('CORE_LEASE_INVALID');
    let dead = false;
    try { process.kill(prior.pid, 0); } catch (e) { if (e.code === 'ESRCH') dead = true; else throw Error('CORE_WRITER_UNVERIFIED'); }
    if (!dead) throw Error('CORE_WRITER_ACTIVE');
    fs.renameSync(file, path.join(root, `.recovered-writer-${randomUUID()}.json`));
  }
  const fd = fs.openSync(file, 'wx', 0o600);
  fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, token })); fs.closeSync(fd);
  return () => { try { if (JSON.parse(fs.readFileSync(file)).token === token) fs.unlinkSync(file); } catch {} };
}
