import fs from 'node:fs';
const personaEmbedCss=fs.readFileSync(new URL('../client/persona-embed.css',import.meta.url));
import { sameOrigin, authorizeRequest } from '../modules/life/src/http.js';
const PREFIX = '/api/amadeus-core';
function send(res, code, data) {
  const body = JSON.stringify(data); res.writeHead(code, { 'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-length': Buffer.byteLength(body) }); res.end(body);
}
async function read(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw Error('CORE_JSON_REQUIRED');
  let length = 0; const chunks = [];
  for await (const chunk of req) { length += chunk.length; if (length > 128 * 1024) throw Error('CORE_BODY_LIMIT'); chunks.push(chunk); }
  const body = JSON.parse(Buffer.concat(chunks));
  if (!body || Array.isArray(body) || typeof body !== 'object') throw Error('CORE_BODY_INVALID'); return body;
}
export function createCoreHandler(ctx, runtime) {
  return async (req, res) => {
    if (!sameOrigin(req)) return send(res, 403, { ok: false, error: 'CORE_ORIGIN_DENIED' });
    const auth = authorizeRequest(ctx.connection, req);
    if (!auth.ok) return send(res, auth.status, { ok: false, error: 'CORE_OWNER_REQUIRED' });
    const pathname = new URL(req.url, 'http://localhost').pathname;
    try {
      if(req.method==='GET'&&pathname===PREFIX+'/persona-embed.css'){res.writeHead(200,{'content-type':'text/css; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});return res.end(personaEmbedCss);}
      if (req.method === 'GET' && pathname === PREFIX + '/status') return send(res, 200, { ok: true, data: runtime.overview() });
      const form = pathname.match(/^\/api\/amadeus-core\/forms\/(life|state|memory)$/);
      if (req.method === 'GET' && form) return send(res, 200, { ok: true, data: runtime.form(form[1]) });
      if (req.method !== 'POST') return send(res, 404, { ok: false, error: 'CORE_NOT_FOUND' });
      if (req.headers['x-amadeus-core'] !== '1') return send(res, 403, { ok: false, error: 'CORE_REQUEST_MARKER_REQUIRED' });
      const body = await read(req); let data;
      if (form) data = await runtime.saveForm(form[1], body.ops, body.revision);
      else if (pathname === PREFIX + '/configure') data = await runtime.configure(body);
      else if (pathname === PREFIX + '/apply') data = await runtime.applyChanges();
      else if (pathname === PREFIX + '/simulate') data = await runtime.simulate();
      else if (pathname === PREFIX + '/prepare-exploration') data = await runtime.prepareExploration();
      else if (pathname === PREFIX + '/activity') data = await runtime.controlActivity(body.action);
      else if (pathname === PREFIX + '/mcp/save') data = await runtime.serial(()=>runtime.mcp.save(body.server,body.revision));
      else if (pathname === PREFIX + '/mcp/remove') data = await runtime.serial(()=>runtime.mcp.remove(body.id,body.revision));
      else if (pathname === PREFIX + '/mcp/connect') data = await runtime.serial(()=>runtime.mcp.connect(body.id));
      else if (pathname === PREFIX + '/mcp/secret') data = await runtime.serial(()=>({reference:runtime.mcp.store.secret(body.value)}));
      else if (pathname === PREFIX + '/platform/configure') data = await runtime.savePlatform(body);
      else if (pathname === PREFIX + '/platform/account') data = await runtime.accountAction(body);
      else if (pathname === PREFIX + '/platform/action') data = await runtime.platformAction(body);
      else if (pathname === PREFIX + '/platform/read') data = await runtime.platformRead(body);
      else if (pathname === PREFIX + '/platform/dry-run') data = await runtime.dryRunPlatform(body);
      else if (pathname === PREFIX + '/import') data = await runtime.importData(body);
      else if (pathname === PREFIX + '/rollback') data = await runtime.rollbackData(body);
      else return send(res, 404, { ok: false, error: 'CORE_NOT_FOUND' });
      return send(res, 200, { ok: true, data });
    } catch (e) {
      const error = /^CORE_[A-Z0-9_]+(?:: [a-z,-]+)?$/.test(e.message) ? e.message : 'CORE_OPERATION_FAILED';
      return send(res, e.message.includes('CONFLICT') ? 409 : 400, { ok: false, error });
    }
  };
}
export function mountCoreHttp(ctx, runtime) {
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: PREFIX, handler: createCoreHandler(ctx, runtime) }));
}
