export function host(ctx, name) {
  try { return ctx.reflect?.get ? ctx.reflect.get(name) : ctx[name]; } catch { return undefined; }
}
export function member(ctx, workspaceId, sessionId) {
  const registry = host(ctx, 'workspaceRegistry');
  const session = host(ctx, 'sessions')?.get?.(sessionId);
  if (!workspaceId || !session?.header || checkWorkspaceAccess(session,workspaceId,ctx)?.allowed !== true) throw Error('CORE_SESSION_DENIED');
  if (session.header.origin === 'subagent' || session.header.archived) throw Error('CORE_SESSION_DENIED');
  return session;
}
import { checkWorkspaceAccess } from '../modules/memory/src/workspace-gate.js';

export function assertIdle(ctx,workspaceId) {
  if(!workspaceId) return;
  const workspace=host(ctx,'workspaceRegistry')?.get?.(workspaceId);
  if(!workspace || !Array.isArray(workspace.sessionIds)) throw Error('CORE_WORKSPACE_MISSING');
  for(const id of workspace.sessionIds) {
    const s=host(ctx,'sessions')?.get?.(id);
    // SessionStore.get() returns live sessions only. A persisted but unloaded
    // session has no running tools and need not be instantiated to remount.
    if(!s) continue;
    const events=s.snapshotEvents?.() ?? s.events;
    if(!Array.isArray(events)) throw Error('CORE_SESSION_STATE_UNAVAILABLE');
    const last=events.filter(e=>e.type==='turn/start'||e.type==='turn/end').at(-1);
    if(last?.type==='turn/start') throw Error('CORE_SESSION_BUSY');
  }
}
