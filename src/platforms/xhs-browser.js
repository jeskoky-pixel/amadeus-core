import { randomUUID } from 'node:crypto';

// Dedicated Xiaohongshu browser adapter. It drives an ephemeral, user-visible
// Edge window through playwright-core. No cookie/storage export is exposed and
// no value captured from the browser is persisted by this module.

const ORIGIN = 'https://www.xiaohongshu.com';
const LOGIN_URL = `${ORIGIN}/explore`;
const SELF_ORIGINS=new Set([ORIGIN,'https://edith.xiaohongshu.com']);
const SELF_PATH = '/api/sns/web/v1/user/self';
const NOTE_PATH = /^\/explore\/([0-9a-f]{24})$/;
const HEX24 = /^[0-9a-f]{24}$/;
const CAPABILITIES = Object.freeze(['read', 'comments', 'like', 'comment', 'reply']);
const LOGIN_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_XSEC = 512;
const MAX_COMMENTS = 50;
const MAX_TEXT = 20000;
const MAX_COMMENT_TEXT = 2000;

const METADATA = Object.freeze({
  id: 'xiaohongshu-browser',
  contractVersion: 2,
  mode: 'real',
  requiresAccount: true,
  capabilities: CAPABILITIES,
  authMethods: Object.freeze(['dedicated-browser']),
  socialWrites: true,
  version: '0.1.0',
  name: '小红书浏览器 / Xiaohongshu Browser',
  category: 'image-text',
});

function fail(code) {
  const token = String(code ?? 'invalid_response')
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .slice(0, 64);
  throw new Error(`CORE_PLATFORM_${token || 'INVALID_RESPONSE'}`);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSafeError(error) {
  return /^CORE_PLATFORM_[A-Z0-9_]+$/.test(error instanceof Error ? error.message : '');
}

function requireOptions(options) {
  if (options === undefined || options === null) return {};
  if (!isRecord(options)) fail('INPUT');
  return options;
}

function throwIfAborted(signal) {
  if (signal?.aborted) fail('ABORTED');
}

function subjectId(value, code = 'INPUT') {
  if (typeof value !== 'string' || !HEX24.test(value)) fail(code);
  return value.toLowerCase();
}

function commentText(value) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 500) fail('INPUT');
  return value;
}

function optionalXsec(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || value.length < 1 || value.length > MAX_XSEC) fail('INPUT');
  return value;
}

function pageUrl(page) {
  try {
    return typeof page?.url === 'function' ? String(page.url()) : '';
  } catch {
    return '';
  }
}

function isChallengeUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  return /(?:^|\/)(?:captcha|verify|verification|risk)(?:\/|$)/i.test(url.pathname);
}

function isLoginUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  return url.hostname !== 'www.xiaohongshu.com' || /^\/(?:login|passport|signin)/i.test(url.pathname);
}

function identityFromSelf(body) {
  if (!isRecord(body) || body.success === false) return null;
  const data = isRecord(body.data) ? body.data : null;
  if (!data) return null;
  const rawId = data.user_id ?? data.userId;
  if (typeof rawId !== 'string' || rawId.length === 0 || rawId.length > 256 || /[\u0000-\u001f]/.test(rawId)) {
    return null;
  }
  let displayName = '';
  if (typeof data.nickname === 'string') displayName = data.nickname;
  displayName = displayName.slice(0, 200) || rawId;
  return { accountId: rawId, displayName };
}

async function responseIdentity(response) {
  try {
    if (typeof response?.status === 'function' && response.status() !== 200) return null;
  } catch {
    return null;
  }
  let parsed;
  try {
    parsed = await response.json();
  } catch {
    return null;
  }
  return identityFromSelf(parsed);
}

function browserConnected(browser) {
  try {
    return typeof browser?.isConnected !== 'function' || browser.isConnected() === true;
  } catch {
    return false;
  }
}

function sessionResult(session, credentials = null) {
  return {
    identity: { accountId: session.accountId, displayName: session.displayName },
    credentials: credentials ?? { sessionHandle: session.handle, accountId: session.accountId },
    expiresAt: session.expiresAt,
    scopes: ['dedicated-browser'],
  };
}

function parseSelfResult(result) {
  if (!isRecord(result)) return null;
  const status = Number.isInteger(result.status) ? result.status : 200;
  if (status === 401 || status === 419) return null;
  if (status === 429) fail('RATE_LIMITED');
  if ([403, 461, 471].includes(status)) fail('CHALLENGE');
  if (status >= 400) return null;
  const body = result.body ?? result;
  if (isRecord(body) && body.success === false) {
    const code = body.code;
    if (code === -100 || code === 100) return null;
    if ([-352, 461, 471].includes(code)) fail('CHALLENGE');
  }
  return identityFromSelf(body);
}

function normalizedString(value, max) {
  if (typeof value !== 'string') return '';
  return value.slice(0, max);
}

function collectComments(list, noteId, parentId, out, depth = 0) {
  if (!Array.isArray(list) || depth > 2) return;
  for (const item of list) {
    if (out.length >= MAX_COMMENTS) return;
    if (!isRecord(item)) continue;
    const id = typeof item.id === 'string' && item.id.length > 0 && item.id.length <= 128
      ? item.id
      : null;
    const userId = typeof item.userId === 'string' && item.userId.length > 0 && item.userId.length <= 256
      ? item.userId
      : null;
    if (!id || !userId || typeof item.content !== 'string') continue;
    if (typeof item.noteId === 'string' && item.noteId.toLowerCase() !== noteId.toLowerCase()) continue;
    const target = typeof item.targetCommentId === 'string' && item.targetCommentId.length <= 128
      ? item.targetCommentId
      : (parentId ?? null);
    out.push({
      id,
      noteId,
      author: {
        accountId: userId,
        displayName: normalizedString(item.userName, 200) || userId,
      },
      text: item.content.slice(0, MAX_COMMENT_TEXT),
      targetCommentId: target,
    });
    if (Array.isArray(item.subComments)) {
      collectComments(item.subComments, noteId, id, out, depth + 1);
    }
  }
}

function normalizeNoteState(raw, noteId) {
  if (!isRecord(raw)) fail('NOTE_UNAVAILABLE');
  const rawId = raw.id ?? raw.noteId;
  if (typeof rawId !== 'string' || rawId.toLowerCase() !== noteId.toLowerCase()) fail('TARGET_MISMATCH');
  const comments = [];
  collectComments(raw.comments, rawId, null, comments);
  const isVideo = raw.type === 'video' || raw.mediaType === 'video';
  return {
    id: noteId,
    title: normalizedString(raw.title, 512),
    text: normalizedString(raw.text ?? raw.desc, MAX_TEXT),
    liked: typeof raw.liked==='boolean'?raw.liked:null,
    type: isVideo ? 'video' : 'image-text',
    author: {
      accountId: typeof raw.author?.accountId === 'string' ? raw.author.accountId : '',
      displayName: typeof raw.author?.displayName === 'string' ? raw.author.displayName : '',
    },
    comments,
  };
}

function noteView(state) {
  const isVideo = state.type === 'video';
  return {
    id: state.id,
    title: state.title,
    text: state.text,
    author: state.author,
    mediaType: state.type,
    observed: isVideo ? ['caption-text', 'metadata'] : ['note-text'],
    videoObserved: isVideo ? false : null,
    visionAnalysis: 'not-performed',
  };
}

function sourceUrl(noteId) {
  return `${ORIGIN}/explore/${noteId}`;
}

export function makeXhsBrowserAdapter({ launch, now = () => Date.now() } = {}) {
  if (launch === undefined) {
    launch = async function defaultLaunch() {
      const { chromium } = await import('playwright-core');
      return chromium.launch({ channel: 'msedge', headless: false });
    };
  }
  if (typeof launch !== 'function') fail('LAUNCH');
  if (typeof now !== 'function') fail('CLOCK');

  const sessions = new Map();
  let pending = null;
  let browser = null;
  let activePage = null;
  let disposed = false;
  let lifecycle=0;

  function closePageQuietly(page) {
    if (page && typeof page.close === 'function') {
      Promise.resolve(page.close()).catch(() => {});
    }
  }

  function invalidateAll() {
    for (const session of sessions.values()) session.invalidated = true;
    sessions.clear();
  }

  async function closeBrowser() {
    const current = browser;
    browser = null;
    const state = pending;
    pending = null;
    if (state?.page && state.page !== activePage) closePageQuietly(state.page);
    invalidateAll();
    if (current && typeof current.close === 'function') {
      try {
        await current.close();
      } catch {
        // Local close failures are not exposed; the handle is already invalid.
      }
    }
  }

  async function closeEverything() {
    lifecycle++;
    closePageQuietly(activePage);
    activePage = null;
    await closeBrowser();
  }

  async function assertNoChallenge(page, { allowLogin = false } = {}) {
    const raw = pageUrl(page);
    if (isChallengeUrl(raw)) fail('CHALLENGE');
    if (!allowLogin && isLoginUrl(raw)) fail('LOGIN_REQUIRED');
    if (typeof page?.locator === 'function') {
      for (const selector of ['#captcha', '.captcha-container', '.red-captcha', '.captcha-modal']) {
        let count = 0;
        try {
          count = await page.locator(selector).count();
        } catch {
          count = 0;
        }
        if (Number.isInteger(count) && count > 0) fail('CHALLENGE');
      }
      if (!allowLogin) {
        let loginCount = 0;
        try {
          loginCount = await page.locator('.login-modal').count();
        } catch {
          loginCount = 0;
        }
        if (Number.isInteger(loginCount) && loginCount > 0) fail('LOGIN_REQUIRED');
      }
    }
  }

  async function assertCanonicalTarget(page, noteId) {
    await assertNoChallenge(page);
    const raw = pageUrl(page);
    let url;
    try {
      url = new URL(raw);
    } catch {
      fail('TARGET_MISMATCH');
    }
    if (url.origin !== ORIGIN) fail('TARGET_MISMATCH');
    const match = NOTE_PATH.exec(url.pathname);
    if (!match || match[1].toLowerCase() !== noteId) fail('TARGET_MISMATCH');
  }

  async function readSelf(page) {
    // Let the website make its own authenticated/signed request. Do not forge
    // private API signatures or infer identity from the note author's profile.
    const response=page.waitForResponse(r=>{
      try{const u=new URL(r.url());return SELF_ORIGINS.has(u.origin)&&u.pathname===SELF_PATH;}catch{return false;}
    },{timeout:10000}).catch(()=>null);
    try{await page.reload({waitUntil:'domcontentloaded',timeout:15000});}catch{return null;}
    const r=await response;if(!r)return null;
    try{return parseSelfResult({status:r.status(),body:await r.json()});}catch(e){if(isSafeError(e))throw e;return null;}
  }

  async function readNoteState(page, noteId) {
    let raw;
    try {
      raw = await page.evaluate((arg) => {
        const state = window.__INITIAL_STATE__;
        const map = state?.note?.noteDetailMap ?? state?.noteDetailMap ?? {};
        const entry = map[arg.noteId] ?? map[arg.noteId.toLowerCase()] ?? null;
        const note = entry?.note ?? entry?.noteInfo ?? entry;
        if (!note || typeof note !== 'object') return null;
        const comments = entry?.comments?.list ?? note.comments?.list ?? note.commentList ?? [];
        return {
          id: note.noteId ?? note.id ?? arg.noteId,
          title: note.title ?? '',
          text: note.desc ?? note.content ?? '',
          type: note.type ?? '',
          author: {
            accountId: note.user?.userId ?? note.user?.user_id ?? '',
            displayName: note.user?.nickname ?? '',
          },
          liked: note.interactInfo?.liked,
          comments: (Array.isArray(comments) ? comments : []).slice(0, 100).map((comment) => ({
            id: comment?.id,
            noteId: comment?.noteId,
            content: comment?.content,
            userId: comment?.userInfo?.userId ?? comment?.user?.userId,
            userName: comment?.userInfo?.nickname ?? comment?.user?.nickname,
            targetCommentId: comment?.targetCommentId ?? null,
            subComments: (Array.isArray(comment?.subComments) ? comment.subComments : []).slice(0, 50).map((sub) => ({
              id: sub?.id,
              noteId: sub?.noteId,
              content: sub?.content,
              userId: sub?.userInfo?.userId ?? sub?.user?.userId,
              userName: sub?.userInfo?.nickname ?? sub?.user?.nickname,
              targetCommentId: sub?.targetCommentId ?? comment?.id ?? null,
              subComments: [],
            })),
          })),
        };
      }, { kind: 'note', noteId });
    } catch (error) {
      if (isSafeError(error)) throw error;
      fail('INVALID_RESPONSE');
    }
    return normalizeNoteState(raw, noteId);
  }

  async function requireLiveIdentity(page, session) {
    const identity = await readSelf(session.page);
    if (!identity) fail('LOGIN_REQUIRED');
    if (identity.accountId !== session.accountId) fail('IDENTITY_MISMATCH');
    return identity;
  }

  async function authorizeAndClick(assertAuthorized, signal, locator) {
    if (typeof assertAuthorized !== 'function') fail('PERMISSION_REQUIRED');
    throwIfAborted(signal);
    try {
      await assertAuthorized();
    } catch (error) {
      if (isSafeError(error)) throw error;
      fail('PERMISSION_REQUIRED');
    }
    throwIfAborted(signal);
    await locator.click();
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForProof(check, signal, attempts = 20) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      throwIfAborted(signal);
      const proof = await check();
      if (proof) return proof;
      if (attempt < attempts - 1) await sleep(100);
    }
    throwIfAborted(signal);
    return null;
  }

  async function execRead(noteId, state, operation) {
    const comments = state.comments.slice(0, MAX_COMMENTS);
    if (operation === 'comments') {
      return {
        operation,
        contentId: noteId,
        sourceUrl: sourceUrl(noteId),
        comments,
        observed: ['comments-text'],
      };
    }
    return {
      operation,
      contentId: noteId,
      sourceUrl: sourceUrl(noteId),
      note: noteView(state),
      comments,
      observed: state.type === 'video' ? ['caption-text', 'metadata'] : ['note-text'],
    };
  }

  function actionAcknowledgement(page,operation,noteId,text,parentId) {
    return page.waitForResponse(response=>{
      try{
        const url=new URL(response.url()),request=response.request(),body=request.postDataJSON();
        return SELF_ORIGINS.has(url.origin)&&url.pathname===(operation==='like'?'/api/sns/web/v1/note/like':'/api/sns/web/v1/comment/post')&&request.method()==='POST'&&body?.note_id===noteId&&
          (operation==='like'||(body.content===text&&(body.target_comment_id??null)===(parentId??null)));
      }catch{return false;}
    },{timeout:10000}).then(async response=>{
      if(response.status()!==200)return null;
      const body=await response.json();if(body.success!==true||body.code!==0)return null;
      if(operation==='like')return {confirmed:true};
      const id=body.data?.comment?.id??body.data?.id;
      return typeof id==='string'&&HEX24.test(id)?{id}:null;
    }).catch(()=>null);
  }

  async function execLike(page, noteId, state, session, { signal, assertAuthorized }) {
    const noOp = () => ({
      status: 'confirmed',
      operation: 'like',
      contentId: noteId,
      changed: false,
      sourceUrl: sourceUrl(noteId),
    });
    await requireLiveIdentity(page, session);
    if (state.liked === null) fail('INVALID_RESPONSE');
    if (state.liked === true) return noOp();

    await requireLiveIdentity(page, session);
    const like = page.locator('.engage-bar .like-wrapper, .interact-container .like-wrapper').first();
    await assertCanonicalTarget(page,noteId);
    const ack=actionAcknowledgement(page,'like',noteId);
    await authorizeAndClick(assertAuthorized, signal, like);
    if(!await ack)fail('ACTION_UNKNOWN');

    // Exactly one click was sent. Confirmation only accepts the note detail
    // state flipping to liked; an unclear result is never reported as success.
    const confirmed = await waitForProof(async () => {
      const after = await readNoteState(page, noteId);
      return after.liked === true ? after : null;
    }, signal, 15);
    if (!confirmed) fail('ACTION_UNKNOWN');
    return {
      status: 'confirmed',
      operation: 'like',
      contentId: noteId,
      changed: true,
      sourceUrl: sourceUrl(noteId),
    };
  }

  async function openCommentEditor(page, noteId, commentId) {
    if (commentId) {
      const scope = page.locator(`#comment-${commentId}`);
      const scoped = await scope.count();
      if (scoped !== 1) fail('TARGET_NOT_FOUND');
      const reply = scope.locator('button.reply, .reply, .reply-btn').first();
      const replyCount = await reply.count();
      if (replyCount !== 1) fail('TARGET_NOT_FOUND');
      await reply.click();
    } else {
      const trigger = page.locator('div.input-box div.content-edit span').first();
      if (await trigger.count() !== 1) fail('TARGET_NOT_FOUND');
      await trigger.click();
    }
    const input = page.locator('div.input-box div.content-edit p.content-input').first();
    if (await input.count() !== 1) fail('TARGET_NOT_FOUND');
    return input;
  }

  async function execComment(page, operation, noteId, baseline, session, text, commentId, options) {
    const { signal, assertAuthorized } = options;

    const input = await openCommentEditor(page, noteId, commentId);
    await input.fill(text);
    const submit = page.locator('div.bottom button.submit').first();
    if (await submit.count() !== 1) fail('TARGET_NOT_FOUND');

    // Verify the live account and authorization immediately before the click
    // that actually sends the content.
    await requireLiveIdentity(page, session);
    await assertCanonicalTarget(page,noteId);
    const ack=actionAcknowledgement(page,operation,noteId,text,commentId);
    await authorizeAndClick(assertAuthorized, signal, submit);
    const acknowledged=await ack;if(!acknowledged)fail('ACTION_UNKNOWN');

    const confirmed = await waitForProof(async () => {
      const after = await readNoteState(page, noteId);
      return after.comments.find((comment) => {
        if (comment.id!==acknowledged.id||baseline.has(comment.id)) return false;
        if (comment.author.accountId !== session.accountId) return false;
        if (comment.text !== text) return false;
        if (comment.noteId.toLowerCase() !== noteId) return false;
        if (commentId) return comment.targetCommentId === commentId;
        return comment.targetCommentId === null || comment.targetCommentId === undefined;
      }) ?? null;
    }, signal);
    if (!confirmed) fail('ACTION_UNKNOWN');

    return {
      status: 'confirmed',
      operation,
      contentId: noteId,
      commentId: confirmed.id,
      changed: true,
      sourceUrl: sourceUrl(noteId),
    };
  }

  async function beginLoginImpl(input, options) {
    if (!isRecord(input) || input.acceptBrowser !== true) fail('PERMISSION_REQUIRED');
    const { signal } = requireOptions(options);
    throwIfAborted(signal);

    await closeEverything();
    const epoch=lifecycle;
    if (disposed) fail('DISPOSED');

    let createdBrowser = null;
    let context = null;
    let page = null;
    try {
      createdBrowser = await launch();
      if(epoch!==lifecycle||disposed)fail('REVOKED');
      if (!createdBrowser || typeof createdBrowser.newContext !== 'function') fail('LAUNCH');
      browser = createdBrowser;
      // A fresh context per login is ephemeral: no storageState, no persistent
      // profile, and no reuse of the default browser profile.
      context = await createdBrowser.newContext();
      if(epoch!==lifecycle||disposed)fail('REVOKED');
      if (!context || typeof context.newPage !== 'function') fail('LAUNCH');
      page = await context.newPage();
      if(epoch!==lifecycle||disposed)fail('REVOKED');
      const state = {
        generation: randomUUID(),
        browser: createdBrowser,
        context,
        page,
        identity: null,
        identityConflict: false,
        handle: null,
        expiresAt: now() + LOGIN_TTL_MS,
      };
      const onResponse = (response) => {
        let raw;
        try {
          raw = typeof response?.url === 'function' ? String(response.url()) : '';
        } catch {
          return;
        }
        let url;
        try {
          url = new URL(raw);
        } catch {
          return;
        }
        if (!SELF_ORIGINS.has(url.origin) || url.pathname !== SELF_PATH) return;
        responseIdentity(response).then((identity) => {
          if (!identity) return;
          if (state.identity && state.identity.accountId !== identity.accountId) {
            state.identityConflict = true;
            return;
          }
          state.identity = identity;
        }).catch(() => {});
      };
      if (typeof page.on === 'function') page.on('response', onResponse);
      pending = state;
      throwIfAborted(signal);
      await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout:15000 });
      if(epoch!==lifecycle||disposed)fail('REVOKED');
      throwIfAborted(signal);
      await assertNoChallenge(page, { allowLogin: true });
      return {
        private: { generation: state.generation },
        public: {
          verificationUrl: LOGIN_URL,
          expiresAt: state.expiresAt,
          method: 'dedicated-browser',
        },
      };
    } catch (error) {
      if (page) closePageQuietly(page);
      if (context && typeof context.close === 'function') {
        try { await context.close(); } catch { /* sanitized below */ }
      }
      if (createdBrowser && typeof createdBrowser.close === 'function') {
        try { await createdBrowser.close(); } catch { /* sanitized below */ }
      }
      if (browser === createdBrowser) browser = null;
      if (pending?.browser === createdBrowser) pending = null;
      if (isSafeError(error)) throw error;
      fail(signal?.aborted ? 'ABORTED' : 'LAUNCH');
    }
  }

  async function pollLoginImpl(privateState, options) {
    if (!isRecord(privateState) || typeof privateState.generation !== 'string' ||
      privateState.generation.length < 1 || privateState.generation.length > 128) {
      fail('INVALID_PRIVATE_STATE');
    }
    const { signal } = requireOptions(options);
    throwIfAborted(signal);
    if (!pending || pending.generation !== privateState.generation) fail('LOGIN_MISSING');
    if (pending.identityConflict) fail('IDENTITY_MISMATCH');
    if (!browserConnected(browser) || !browserConnected(pending.browser) ||
      (typeof pending.page?.isClosed === 'function' && pending.page.isClosed())) {
      await closeEverything();
      fail('LOGIN_MISSING');
    }
    if (now() >= pending.expiresAt) {
      await closeEverything();
      fail('CREDENTIALS_EXPIRED');
    }

    if (pending.handle) {
      const existing = sessions.get(pending.handle);
      if (existing && existing.invalidated !== true) return sessionResult(existing);
      fail('LOGIN_MISSING');
    }

    await assertNoChallenge(pending.page, { allowLogin: true });
    let identity = pending.identity;
    if (!identity) identity = await readSelf(pending.page);
    if (!identity) return { pending: true, scanned: false };
    if (pending.identity && pending.identity.accountId !== identity.accountId) fail('IDENTITY_MISMATCH');

    const handle = randomUUID();
    const session = {
      handle,
      accountId: identity.accountId,
      displayName: identity.displayName,
      browser,
      context: pending.context,
      page: pending.page,
      generation: pending.generation,
      createdAt: now(),
      expiresAt: now() + SESSION_TTL_MS,
      invalidated: false,
    };
    pending.identity = identity;
    pending.handle = handle;
    sessions.set(handle, session);
    return sessionResult(session);
  }

  function requireSession(credentials) {
    if (!isRecord(credentials) || typeof credentials.sessionHandle !== 'string' ||
      credentials.sessionHandle.length < 1 || credentials.sessionHandle.length > 128 ||
      typeof credentials.accountId !== 'string' || credentials.accountId.length < 1 ||
      credentials.accountId.length > 256) {
      fail('INVALID_CREDENTIALS');
    }
    const session = sessions.get(credentials.sessionHandle);
    if (!session || session.invalidated === true) fail('LOGIN_REQUIRED');
    if (session.accountId !== credentials.accountId) {
      session.invalidated = true;
      sessions.delete(credentials.sessionHandle);
      fail('IDENTITY_MISMATCH');
    }
    if (!browserConnected(session.browser) || !browserConnected(browser)) {
      session.invalidated = true;
      sessions.delete(credentials.sessionHandle);
      fail('LOGIN_REQUIRED');
    }
    if(now()>=session.expiresAt)fail('CREDENTIALS_EXPIRED');
    return session;
  }

  async function executeImpl(operation, input, options) {
    if (!isRecord(input)) fail('INPUT');
    if (!CAPABILITIES.includes(operation)) fail('UNSUPPORTED');
    const noteId = subjectId(input.id);
    const xsecToken = optionalXsec(input.xsecToken);
    const { signal, credentials, assertAuthorized } = requireOptions(options);

    let text = null;
    let commentId = null;
    if (operation === 'comment' || operation === 'reply') text = commentText(input.text);
    if (operation === 'reply') commentId = subjectId(input.commentId);
    if (operation === 'like' && input.liked !== true) fail('INPUT');

    const session = requireSession(credentials);
    throwIfAborted(signal);
    await requireLiveIdentity(session.page,session);
    throwIfAborted(signal);
    if (typeof session.context?.newPage !== 'function') fail('LOGIN_REQUIRED');

    let page = null;
    const abort=()=>closePageQuietly(page);
    signal?.addEventListener('abort',abort,{once:true});
    try {
      page = await session.context.newPage();
      throwIfAborted(signal);
      page.setDefaultTimeout?.(10000);
      page.setDefaultNavigationTimeout?.(15000);
      activePage = page;
      const target = new URL(`${ORIGIN}/explore/${noteId}`);
      if (xsecToken) target.searchParams.set('xsec_token', xsecToken);
      // xsecToken exists only in this local navigation URL. It is not stored on
      // the session and never appears in outputs.
      await page.goto(target.href, { waitUntil: 'domcontentloaded' });
      throwIfAborted(signal);
      await assertCanonicalTarget(page, noteId);
      let state;
      for(let attempt=0;attempt<30;attempt++){
        throwIfAborted(signal);
        try{state=await readNoteState(page,noteId);break;}catch(e){if(e.message!=='CORE_PLATFORM_NOTE_UNAVAILABLE')throw e;}
        await sleep(100);
      }
      if(!state)fail('NOTE_UNAVAILABLE');

      if (operation === 'read' || operation === 'comments') {
        throwIfAborted(signal);
        return await execRead(noteId, state, operation);
      }
      if (operation === 'like') {
        return await execLike(page, noteId, state, session, { signal, assertAuthorized });
      }
      if (operation === 'comment' || operation === 'reply') {
        const baseline = new Set(state.comments.map((comment) => comment.id));
        return await execComment(page, operation, noteId, baseline, session, text, commentId, {
          signal,
          assertAuthorized,
        });
      }
      fail('UNSUPPORTED');
    } finally {
      signal?.removeEventListener('abort',abort);
      activePage = null;
      if (page && typeof page.close === 'function' && !page.isClosed?.()) {
        try { await page.close(); } catch { /* local cleanup only */ }
      }
    }
  }

  async function validateImpl(credentials, options) {
    const { signal } = requireOptions(options);
    throwIfAborted(signal);
    const session = requireSession(credentials);
    const identity = await readSelf(session.page);
    if (!identity) {
      session.invalidated = true;
      sessions.delete(session.handle);
      fail('LOGIN_REQUIRED');
    }
    if (identity.accountId !== credentials.accountId || identity.accountId !== session.accountId) {
      session.invalidated = true;
      sessions.delete(session.handle);
      fail('IDENTITY_MISMATCH');
    }
    session.displayName = identity.displayName;
    return sessionResult(session, { sessionHandle: session.handle, accountId: session.accountId });
  }

  async function logoutImpl(credentials, options) {
    if (credentials !== undefined && credentials !== null) {
      if (!isRecord(credentials)) fail('INVALID_CREDENTIALS');
      const handle = credentials.sessionHandle;
      if (typeof handle !== 'string' || handle.length < 1 || handle.length > 128) fail('INVALID_CREDENTIALS');
    }
    requireOptions(options);
    await closeEverything();
    return { loggedOut: true };
  }

  async function disposeImpl() {
    disposed = true;
    await closeEverything();
    return { disposed: true };
  }

  async function guard(fallback, fn) {
    try {
      return await fn();
    } catch (error) {
      if (isSafeError(error)) throw error;
      fail(fallback);
    }
  }

  return Object.freeze({
    ...METADATA,
    capabilities: METADATA.capabilities,
    authMethods: METADATA.authMethods,
    beginLogin: (input, options) => guard('LAUNCH', () => beginLoginImpl(input, options)),
    pollLogin: (privateState, options) => guard('LOGIN_MISSING', () => pollLoginImpl(privateState, options)),
    validateAccount: (credentials, options) => guard('INVALID_CREDENTIALS', () => validateImpl(credentials, options)),
    execute: (operation, input, options) => guard('ACTION_UNKNOWN', () => executeImpl(operation, input, options)),
    logout: (credentials, options) => guard('INVALID_CREDENTIALS', () => logoutImpl(credentials, options)),
    dispose: () => guard('ACTION_UNKNOWN', () => disposeImpl()),
  });
}
