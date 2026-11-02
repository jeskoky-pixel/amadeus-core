import test from 'node:test';
import assert from 'node:assert/strict';
import { makeXhsBrowserAdapter } from '../src/platforms/xhs-browser.js';

const ORIGIN = 'https://www.xiaohongshu.com';
const LOGIN_URL = `${ORIGIN}/explore`;
const SELF_URL = `${ORIGIN}/api/sns/web/v1/user/self`;
const NOW = 1_700_000_000_000;
const NOTE_ID = '0123456789abcdef01234567';
const OTHER_NOTE_ID = '89abcdef0123456789abcdef';
const COMMENT_ID = 'abcdef0123456789abcdef01';
const NEW_COMMENT_ID = 'fedcba9876543210fedcba98';
const ACCOUNT_ID = 'user-current';
const OTHER_ACCOUNT_ID = 'user-other';

function currentUser(overrides = {}) {
  return { user_id: ACCOUNT_ID, nickname: 'Current Account', ...overrides };
}

function makeComment(id, content, { userId = ACCOUNT_ID, targetCommentId = null } = {}) {
  return {
    id,
    noteId: NOTE_ID,
    content,
    userId,
    userName: userId === ACCOUNT_ID ? 'Current Account' : 'Foreign Account',
    targetCommentId,
    subComments: [],
  };
}

function makeNote(overrides = {}) {
  return {
    id: NOTE_ID,
    title: 'Synthetic note title',
    text: 'Synthetic note body',
    type: 'image-text',
    author: { accountId: 'author-1', displayName: 'Note Author' },
    liked: false,
    comments: [],
    ...overrides,
  };
}

class FakeLocator {
  constructor(page, selector, parent = null) {
    this.page = page;
    this.selector = selector;
    this.parent = parent;
  }
  first() { return this; }
  locator(selector) { return new FakeLocator(this.page, selector, this); }
  async count() { return this.page.resolveCount(this.parent, this.selector); }
  async click() { return this.page.performClick(this.parent, this.selector); }
  async fill(value) {
    this.page.events.push('fill');
    this.page.fills.push({ selector: this.selector, value });
    this.page.draft = value;
  }
}

class FakePage {
  constructor(browser, index) {
    this.browser = browser;
    this.index = index;
    this.options = browser.options;
    this.listeners = new Map();
    this.events = [];
    this.gotoCalls = [];
    this.clicks = [];
    this.fills = [];
    this.closed = false;
    this.closeCount = 0;
    this.urlValue = 'about:blank';
    this.note = structuredClone(this.options.note ?? makeNote());
    this.selfUser = this.options.selfUser === undefined ? currentUser() : this.options.selfUser;
    this.selfStatus = this.options.selfStatus ?? 200;
    this.selfBody = undefined;
    this.challenge = this.options.challenge === true;
    this.loginModal = this.options.loginModal === true;
    this.replyControls = this.options.replyControls !== false;
    this.draft = '';
    this.replyTarget = null;
    this.likeClicks = 0;
    this.submitClicks = 0;
    this.replyClicks = 0;
  }
  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(handler);
  }
  waitForResponse(){return new Promise(resolve=>{this.responseResolve=resolve;});}
  async reload(){const r=await this.evaluate(null,{kind:'self'});this.responseResolve?.({url:()=>SELF_URL,status:()=>r.status,json:async()=>r.body});}
  url() { return this.urlValue; }
  isClosed() { return this.closed; }
  async close() { this.closed = true; this.closeCount += 1; }
  async goto(url) {
    this.gotoCalls.push(url);
    if (typeof this.options.gotoHook === 'function') await this.options.gotoHook(url, this);
    else this.urlValue = url;
  }
  async evaluate(fn, arg) {
    if (typeof this.options.evaluateHook === 'function') {
      const hooked = await this.options.evaluateHook(fn, arg, this);
      if (hooked !== undefined) return hooked;
    }
    if (arg?.kind === 'self') {
      this.events.push('self');
      return {
        status: this.selfStatus,
        body: this.selfBody === undefined ? { data: this.selfUser } : this.selfBody,
      };
    }
    if (arg?.kind === 'note') {
      this.events.push('note-read');
      return this.note === null ? null : structuredClone(this.note);
    }
    throw new Error('raw fake evaluate failure');
  }
  locator(selector) { return new FakeLocator(this, selector); }
  async emitResponse(url, body) {
    const handlers = this.listeners.get('response') ?? [];
    const response = {
      url: () => url,
      json: async () => structuredClone(body),
    };
    for (const handler of handlers) await handler(response);
  }
  emitSelf(user = currentUser()) {
    return this.emitResponse(SELF_URL, { data: user });
  }
  findComment(id) {
    const queue = [...(this.note?.comments ?? [])];
    while (queue.length) {
      const item = queue.shift();
      if (item.id === id) return item;
      if (Array.isArray(item.subComments)) queue.push(...item.subComments);
    }
    return null;
  }
  async resolveCount(parent, selector) {
    if (selector === '#captcha' || selector === '.captcha-container' ||
      selector === '.red-captcha' || selector === '.captcha-modal') {
      return this.challenge ? 1 : 0;
    }
    if (selector === '.login-modal') return this.loginModal ? 1 : 0;
    if (parent) {
      const parentId = parent.selector.startsWith('#comment-') ? parent.selector.slice(9) : null;
      if (parentId && this.findComment(parentId)) {
        if (selector === 'button.reply, .reply, .reply-btn') return this.replyControls ? 1 : 0;
      }
      return 0;
    }
    if (selector.startsWith('#comment-')) {
      return this.findComment(selector.slice(9)) ? 1 : 0;
    }
    if (selector === 'div.input-box div.content-edit span') return 1;
    if (selector === 'div.input-box div.content-edit p.content-input') return 1;
    if (selector === 'div.bottom button.submit') return 1;
    if (selector.includes('like-wrapper')) return 1;
    return 0;
  }
  async performClick(parent, selector) {
    const parentId = parent?.selector.startsWith('#comment-') ? parent.selector.slice(9) : null;
    if (parentId && selector === 'button.reply, .reply, .reply-btn') {
      this.replyClicks += 1;
      this.replyTarget = parentId;
      this.clicks.push(selector);
      this.events.push('click:reply');
      return;
    }
    if (selector === 'div.input-box div.content-edit span') {
      this.events.push('click:editor');
      return;
    }
    if (selector.includes('like-wrapper')) {
      this.events.push('click:like');
      this.responseResolve?.({status:()=>200,json:async()=>({success:true,code:0})});
      this.likeClicks += 1;
      this.clicks.push(selector);
      if (typeof this.options.onLike === 'function') await this.options.onLike(this);
      else this.note.liked = true;
      return;
    }
    if (selector === 'div.bottom button.submit') {
      this.events.push('click:submit');
      this.responseResolve?.({status:()=>200,json:async()=>({success:true,code:0,data:{id:NEW_COMMENT_ID}})});
      this.submitClicks += 1;
      this.clicks.push(selector);
      if (typeof this.options.onSubmit === 'function') await this.options.onSubmit(this);
      return;
    }
    this.events.push(`click:${selector}`);
    this.clicks.push(selector);
  }
}

class FakeContext {
  constructor(browser) {
    this.browser = browser;
    this.pages = [];
  }
  async newPage() {
    const page = new FakePage(this.browser, this.browser.pages.length);
    this.pages.push(page);
    this.browser.pages.push(page);
    return page;
  }
  async close() { this.closed = true; }
}

function makeFakeBrowser(options = {}) {
  const browser = {
    options,
    connected: true,
    contexts: [],
    newContextCalls: [],
    pages: [],
    closeCount: 0,
    async newContext(...args) {
      this.newContextCalls.push(args);
      const context = new FakeContext(this);
      this.contexts.push(context);
      return context;
    },
    isConnected() { return this.connected; },
    async close() {
      this.connected = false;
      this.closeCount += 1;
    },
  };
  return browser;
}

async function login(adapter, browser) {
  const challenge = await adapter.beginLogin({ acceptBrowser: true });
  const loginPage = browser.pages[0];
  await loginPage.emitSelf();
  const account = await adapter.pollLogin(challenge.private);
  return { challenge, account, loginPage };
}

async function setup(options = {}) {
  const browser = makeFakeBrowser(options);
  const adapter = makeXhsBrowserAdapter({ launch: async () => browser, now: () => NOW });
  const { challenge, account, loginPage } = await login(adapter, browser);
  return { browser, adapter, challenge, account, loginPage, credentials: account.credentials };
}

function safeError(error) {
  assert.match(error.message, /^CORE_PLATFORM_[A-Z0-9_]+$/);
}

test('metadata identifies a real dedicated-browser social adapter', () => {
  const adapter = makeXhsBrowserAdapter();
  assert.equal(adapter.id, 'xiaohongshu-browser');
  assert.equal(adapter.contractVersion, 2);
  assert.equal(adapter.mode, 'real');
  assert.equal(adapter.requiresAccount, true);
  assert.equal(adapter.socialWrites, true);
  assert.deepEqual(adapter.capabilities, ['read', 'comments', 'like', 'comment', 'reply']);
  assert.deepEqual(adapter.authMethods, ['dedicated-browser']);
  assert.equal(typeof adapter.beginLogin, 'function');
  assert.equal(typeof adapter.pollLogin, 'function');
  assert.equal(typeof adapter.validateAccount, 'function');
  assert.equal(typeof adapter.execute, 'function');
  assert.equal(typeof adapter.logout, 'function');
  assert.equal(typeof adapter.dispose, 'function');
});

test('factory rejects invalid launch and clock overrides', () => {
  assert.throws(() => makeXhsBrowserAdapter({ launch: 42 }), { message: 'CORE_PLATFORM_LAUNCH' });
  assert.throws(() => makeXhsBrowserAdapter({ now: 42 }), { message: 'CORE_PLATFORM_CLOCK' });
});

test('beginLogin requires explicit browser acceptance and opens the explore page in an ephemeral context', async () => {
  for (const input of [undefined, null, {}, { acceptBrowser: false }, { acceptBrowser: 'true' }]) {
    const browser = makeFakeBrowser();
    const adapter = makeXhsBrowserAdapter({ launch: async () => browser, now: () => NOW });
    await assert.rejects(adapter.beginLogin(input), { message: 'CORE_PLATFORM_PERMISSION_REQUIRED' });
    assert.equal(browser.newContextCalls.length, 0);
  }

  const browser = makeFakeBrowser();
  const adapter = makeXhsBrowserAdapter({ launch: async () => browser, now: () => NOW });
  const result = await adapter.beginLogin({ acceptBrowser: true });

  assert.equal(browser.newContextCalls.length, 1);
  assert.deepEqual(browser.newContextCalls[0], []);
  assert.equal(browser.pages.length, 1);
  assert.deepEqual(browser.pages[0].gotoCalls, [LOGIN_URL]);
  assert.equal(result.public.verificationUrl, LOGIN_URL);
  assert.equal(result.public.method, 'dedicated-browser');
  assert.equal(result.public.expiresAt, NOW + 600000);
  assert.deepEqual(Object.keys(result.public).sort(), ['expiresAt', 'method', 'verificationUrl']);
  assert.equal(typeof result.private.generation, 'string');
  assert.ok(result.private.generation.length >= 16);
  assert.ok(!JSON.stringify(result.public).includes(result.private.generation));
  assert.equal('qrDataUrl' in result.public, false);
  assert.equal('userCode' in result.public, false);
});

test('beginLogin closes a prior browser before opening the new one', async () => {
  const first = makeFakeBrowser();
  const second = makeFakeBrowser();
  const queue = [first, second];
  const adapter = makeXhsBrowserAdapter({ launch: async () => queue.shift(), now: () => NOW });
  await adapter.beginLogin({ acceptBrowser: true });
  await adapter.beginLogin({ acceptBrowser: true });
  assert.equal(first.closeCount, 1);
  assert.equal(first.connected, false);
  assert.equal(second.closeCount, 0);
  assert.equal(second.pages.length, 1);
});

test('pollLogin stays pending with no fake QR and rejects a stale generation', async () => {
  const browser = makeFakeBrowser({ selfStatus: 401 });
  const adapter = makeXhsBrowserAdapter({ launch: async () => browser, now: () => NOW });
  const loginResult = await adapter.beginLogin({ acceptBrowser: true });
  const pending = await adapter.pollLogin(loginResult.private);
  assert.deepEqual(pending, { pending: true, scanned: false });
  assert.equal('credentials' in pending, false);
  assert.equal('qrDataUrl' in pending, false);

  await assert.rejects(adapter.pollLogin({ generation: 'wrong-generation' }), {
    message: 'CORE_PLATFORM_LOGIN_MISSING',
  });
  await assert.rejects(adapter.pollLogin({}), { message: 'CORE_PLATFORM_INVALID_PRIVATE_STATE' });
});

test('pollLogin uses the exact /user/self response instead of a viewed profile', async () => {
  // A 401 from the self fallback means no account proof is available yet.
  const browser = makeFakeBrowser({ selfStatus: 401 });
  const adapter = makeXhsBrowserAdapter({ launch: async () => browser, now: () => NOW });
  const loginResult = await adapter.beginLogin({ acceptBrowser: true });
  const page = browser.pages[0];
  // A note authored by somebody else is irrelevant to the current account proof.
  page.note = makeNote({
    author: { accountId: OTHER_ACCOUNT_ID, displayName: 'Viewed Profile' },
  });

  await page.emitResponse(`${ORIGIN}/api/sns/web/v1/profile/other`, {
    data: { user_id: OTHER_ACCOUNT_ID, nickname: 'Viewed Profile' },
  });
  const first = await adapter.pollLogin(loginResult.private);
  assert.deepEqual(first, { pending: true, scanned: false });

  await page.emitSelf({ user_id: ACCOUNT_ID, nickname: 'Current Account' });
  const account = await adapter.pollLogin(loginResult.private);
  assert.deepEqual(account.identity, { accountId: ACCOUNT_ID, displayName: 'Current Account' });
  assert.deepEqual(Object.keys(account.credentials).sort(), ['accountId', 'sessionHandle']);
  assert.equal(account.credentials.accountId, ACCOUNT_ID);
  assert.equal(typeof account.credentials.sessionHandle, 'string');
  assert.equal(account.expiresAt, NOW + 12 * 60 * 60 * 1000);
  assert.deepEqual(account.scopes, ['dedicated-browser']);
  const serialized = JSON.stringify(account);
  for (const forbidden of ['cookie', 'token', 'storageState', 'password', 'sessionid']) {
    assert.ok(!serialized.toLowerCase().includes(forbidden), `login result leaked ${forbidden}`);
  }
});

test('pollLogin detects conflicting self identities and never picks one', async () => {
  const browser = makeFakeBrowser({ selfStatus: 401 });
  const adapter = makeXhsBrowserAdapter({ launch: async () => browser, now: () => NOW });
  const loginResult = await adapter.beginLogin({ acceptBrowser: true });
  const page = browser.pages[0];
  await page.emitSelf({ user_id: ACCOUNT_ID, nickname: 'First' });
  await page.emitSelf({ user_id: OTHER_ACCOUNT_ID, nickname: 'Second' });
  await assert.rejects(adapter.pollLogin(loginResult.private), {
    message: 'CORE_PLATFORM_IDENTITY_MISMATCH',
  });
});

test('validateAccount requires the live session handle and the same live identity', async () => {
  const { browser, adapter, account, loginPage, credentials } = await setup();

  const valid = await adapter.validateAccount(credentials);
  assert.equal(valid.identity.accountId, ACCOUNT_ID);
  assert.deepEqual(valid.credentials, credentials);

  await assert.rejects(adapter.validateAccount({
    sessionHandle: 'missing-handle', accountId: ACCOUNT_ID,
  }), { message: 'CORE_PLATFORM_LOGIN_REQUIRED' });

  await assert.rejects(adapter.validateAccount({
    sessionHandle: credentials.sessionHandle, accountId: OTHER_ACCOUNT_ID,
  }), { message: 'CORE_PLATFORM_IDENTITY_MISMATCH' });
  // A mismatched account invalidates the handle immediately.
  await assert.rejects(adapter.validateAccount(credentials), {
    message: 'CORE_PLATFORM_LOGIN_REQUIRED',
  });

  const second = await setup();
  second.loginPage.selfUser = { user_id: OTHER_ACCOUNT_ID, nickname: 'Someone Else' };
  await assert.rejects(second.adapter.validateAccount(second.credentials), {
    message: 'CORE_PLATFORM_IDENTITY_MISMATCH',
  });
  assert.equal(browser.pages.length, 1);
});

test('read navigates only the canonical URL, bounds content, and never returns xsecToken', async () => {
  const comments = [];
  for (let index = 0; index < 60; index += 1) {
    comments.push(makeComment(`comment-${String(index).padStart(3, '0')}`, 'x'.repeat(3000)));
  }
  const longNote = makeNote({
    title: 't'.repeat(600),
    text: 'n'.repeat(25000),
    comments,
  });
  const { browser, adapter, credentials } = await setup({ note: longNote });

  const result = await adapter.execute('read', {
    id: NOTE_ID,
    xsecToken: 'xsec-token-value',
  }, { credentials });

  const page = browser.pages.at(-1);
  assert.deepEqual(page.gotoCalls, [`${ORIGIN}/explore/${NOTE_ID}?xsec_token=xsec-token-value`]);
  assert.equal(result.operation, 'read');
  assert.equal(result.contentId, NOTE_ID);
  assert.equal(result.sourceUrl, `${ORIGIN}/explore/${NOTE_ID}`);
  assert.equal(result.note.id, NOTE_ID);
  assert.equal(result.note.title.length, 512);
  assert.equal(result.note.text.length, 20000);
  assert.equal(result.note.mediaType, 'image-text');
  assert.deepEqual(result.note.observed, ['note-text']);
  assert.equal(result.note.videoObserved, null);
  assert.equal(result.comments.length, 50);
  assert.equal(result.comments[0].id, 'comment-000');
  assert.equal(result.comments[0].noteId, NOTE_ID);
  assert.equal(result.comments[0].author.accountId, ACCOUNT_ID);
  assert.equal(result.comments[0].text.length, 2000);
  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes('xsec-token-value'));
  assert.ok(!serialized.includes('cookie'));
});

test('comments returns exact bounded comment identities and text', async () => {
  const note = makeNote({
    comments: [
      makeComment('comment-a', 'alpha'),
      makeComment('comment-b', 'beta', { userId: OTHER_ACCOUNT_ID }),
    ],
  });
  const { browser, adapter, credentials } = await setup({ note });
  const result = await adapter.execute('comments', { id: NOTE_ID }, { credentials });

  assert.equal(result.operation, 'comments');
  assert.equal(result.contentId, NOTE_ID);
  assert.deepEqual(result.observed, ['comments-text']);
  assert.deepEqual(result.comments, [
    {
      id: 'comment-a', noteId: NOTE_ID,
      author: { accountId: ACCOUNT_ID, displayName: 'Current Account' },
      text: 'alpha', targetCommentId: null,
    },
    {
      id: 'comment-b', noteId: NOTE_ID,
      author: { accountId: OTHER_ACCOUNT_ID, displayName: 'Foreign Account' },
      text: 'beta', targetCommentId: null,
    },
  ]);
  assert.equal(browser.pages.at(-1).gotoCalls[0], `${ORIGIN}/explore/${NOTE_ID}`);
});

test('video notes are not represented as fully observed', async () => {
  const { adapter, credentials } = await setup({
    note: makeNote({ type: 'video', text: 'Video caption only' }),
  });
  const result = await adapter.execute('read', { id: NOTE_ID }, { credentials });
  assert.equal(result.note.mediaType, 'video');
  assert.deepEqual(result.note.observed, ['caption-text', 'metadata']);
  assert.equal(result.note.videoObserved, false);
  assert.equal(result.note.visionAnalysis, 'not-performed');
});

test('execute rejects malformed target, reply, text, like, and xsec input before opening a page', async () => {
  const { browser, adapter, credentials } = await setup();
  const pageCount = browser.pages.length;
  const cases = [
    ['read', { id: 'not-a-note-id' }],
    ['read', { id: NOTE_ID.toUpperCase() }],
    ['read', { id: NOTE_ID, xsecToken: 'x'.repeat(513) }],
    ['read', { id: NOTE_ID, xsecToken: 42 }],
    ['comment', { id: NOTE_ID, text: '' }],
    ['comment', { id: NOTE_ID, text: 'x'.repeat(501) }],
    ['comment', { id: NOTE_ID }],
    ['reply', { id: NOTE_ID, text: 'reply text' }],
    ['reply', { id: NOTE_ID, commentId: '../bad', text: 'reply text' }],
    ['like', { id: NOTE_ID, liked: false }],
    ['like', { id: NOTE_ID }],
  ];
  for (const [operation, input] of cases) {
    await assert.rejects(adapter.execute(operation, input, { credentials }), (error) => {
      safeError(error);
      return true;
    });
  }
  await assert.rejects(adapter.execute('search', { id: NOTE_ID }, { credentials }), {
    message: 'CORE_PLATFORM_UNSUPPORTED',
  });
  assert.equal(browser.pages.length, pageCount, 'invalid inputs must not open browser pages');
});

test('abort before execute opens no page, and abort during navigation closes the active page once', async () => {
  const { browser, adapter, credentials } = await setup();
  const basePages = browser.pages.length;

  const preAborted = new AbortController();
  preAborted.abort();
  await assert.rejects(adapter.execute('read', { id: NOTE_ID }, {
    credentials, signal: preAborted.signal,
  }), { message: 'CORE_PLATFORM_ABORTED' });
  assert.equal(browser.pages.length, basePages);

  const controller = new AbortController();
  const { adapter: abortAdapter, credentials: abortCredentials, browser: abortBrowser } = await setup({
    gotoHook: async (url, page) => {
      page.urlValue = url;
      if (url.startsWith(`${ORIGIN}/explore/${NOTE_ID}`)) controller.abort();
    },
  });
  const before = abortBrowser.pages.length;
  await assert.rejects(abortAdapter.execute('read', { id: NOTE_ID }, {
    credentials: abortCredentials,
    signal: controller.signal,
  }), { message: 'CORE_PLATFORM_ABORTED' });
  const page = abortBrowser.pages.at(-1);
  assert.equal(abortBrowser.pages.length, before + 1);
  assert.equal(page.gotoCalls.length, 1);
  assert.equal(page.closeCount, 1);
  assert.equal(page.closed, true);
});

test('like returns a confirmed no-op when the initial note state is already liked', async () => {
  let authorized = 0;
  const { browser, adapter, credentials } = await setup({ note: makeNote({ liked: true }) });
  const result = await adapter.execute('like', { id: NOTE_ID, liked: true }, {
    credentials,
    assertAuthorized: () => { authorized += 1; },
  });
  assert.deepEqual(result, {
    status: 'confirmed',
    operation: 'like',
    contentId: NOTE_ID,
    changed: false,
    sourceUrl: `${ORIGIN}/explore/${NOTE_ID}`,
  });
  assert.equal(browser.pages.at(-1).likeClicks, 0);
  assert.equal(authorized, 0);
});

test('like clicks exactly once and requires the note detail state to confirm true', async () => {
  const events = [];
  const { browser, adapter, credentials } = await setup({
    note: makeNote({ liked: false }),
    onLike: (page) => { page.note.liked = true; },
  });
  const result = await adapter.execute('like', { id: NOTE_ID, liked: true }, {
    credentials,
    assertAuthorized: () => { events.push('authorized'); },
  });
  const page = browser.pages.at(-1);
  assert.equal(result.status, 'confirmed');
  assert.equal(result.changed, true);
  assert.equal(page.likeClicks, 1);
  assert.deepEqual(events, ['authorized']);
  const clickIndex = page.events.indexOf('click:like');
  assert.ok(page.events.lastIndexOf('self') < clickIndex);
});

test('like with unverified confirmation throws ACTION_UNKNOWN after one click and never retries', async () => {
  const { browser, adapter, credentials } = await setup({
    note: makeNote({ liked: false }),
    onLike: () => {},
  });
  await assert.rejects(adapter.execute('like', { id: NOTE_ID, liked: true }, {
    credentials,
    assertAuthorized: () => {},
  }), { message: 'CORE_PLATFORM_ACTION_UNKNOWN' });
  const page = browser.pages.at(-1);
  assert.equal(page.likeClicks, 1);
});

test('comment confirms only a new id matching actor, exact text, note, and top-level target', async () => {
  const order = [];
  const baseComments = [
    makeComment('old-same-text', 'hello world'),
    makeComment('foreign-same-text', 'hello world', { userId: OTHER_ACCOUNT_ID }),
  ];
  const { browser, adapter, credentials } = await setup({
    note: makeNote({ comments: baseComments }),
    onSubmit: (page) => {
      order.push('submitted');
      page.note.comments.push(makeComment('foreign-new', 'hello world', { userId: OTHER_ACCOUNT_ID }));
      page.note.comments.push(makeComment(NEW_COMMENT_ID, page.draft));
    },
  });
  const result = await adapter.execute('comment', {
    id: NOTE_ID,
    text: 'hello world',
  }, {
    credentials,
    assertAuthorized: () => { order.push('authorized'); },
  });

  const page = browser.pages.at(-1);
  assert.deepEqual(result, {
    status: 'confirmed',
    operation: 'comment',
    contentId: NOTE_ID,
    commentId: NEW_COMMENT_ID,
    changed: true,
    sourceUrl: `${ORIGIN}/explore/${NOTE_ID}`,
  });
  assert.equal(page.submitClicks, 1);
  assert.deepEqual(page.fills, [{ selector: 'div.input-box div.content-edit p.content-input', value: 'hello world' }]);
  assert.deepEqual(order, ['authorized', 'submitted']);
  const selfIndex = browser.pages[0].events.lastIndexOf('self');
  const submitIndex = page.events.indexOf('click:submit');
  assert.ok(selfIndex >= 0);
  assert.ok(submitIndex>=0);
});

test('reply is scoped to #comment-<commentId>, verifies the parent, and confirms the new id', async () => {
  const parent = makeComment(COMMENT_ID, 'parent comment', { userId: OTHER_ACCOUNT_ID });
  const { browser, adapter, credentials } = await setup({
    note: makeNote({ comments: [parent] }),
    onSubmit: (page) => {
      page.note.comments.push(makeComment(NEW_COMMENT_ID, page.draft, {
        targetCommentId: page.replyTarget,
      }));
    },
  });
  const result = await adapter.execute('reply', {
    id: NOTE_ID,
    commentId: COMMENT_ID,
    text: 'reply body',
  }, { credentials, assertAuthorized: () => {} });

  const page = browser.pages.at(-1);
  assert.equal(result.status, 'confirmed');
  assert.equal(result.operation, 'reply');
  assert.equal(result.commentId, NEW_COMMENT_ID);
  assert.equal(page.replyClicks, 1);
  assert.equal(page.replyTarget, COMMENT_ID);
  assert.equal(page.submitClicks, 1);
  assert.ok(page.clicks.includes('button.reply, .reply, .reply-btn'));
});

test('reply to a missing comment fails closed before filling or submitting', async () => {
  const { browser, adapter, credentials } = await setup({ note: makeNote({ comments: [] }) });
  await assert.rejects(adapter.execute('reply', {
    id: NOTE_ID,
    commentId: COMMENT_ID,
    text: 'reply body',
  }, { credentials, assertAuthorized: () => {} }), { message: 'CORE_PLATFORM_TARGET_NOT_FOUND' });
  const page = browser.pages.at(-1);
  assert.equal(page.fills.length, 0);
  assert.equal(page.submitClicks, 0);
});

test('unproven or wrongly parented comments throw ACTION_UNKNOWN and are not counted', async () => {
  for (const onSubmit of [
    (page) => { page.note.comments.push(makeComment(NEW_COMMENT_ID, 'different text')); },
    (page) => { page.note.comments.push(makeComment(NEW_COMMENT_ID, page.draft, { userId: OTHER_ACCOUNT_ID })); },
  ]) {
    const { adapter, credentials } = await setup({ note: makeNote(), onSubmit });
    await assert.rejects(adapter.execute('comment', {
      id: NOTE_ID,
      text: 'hello',
    }, { credentials, assertAuthorized: () => {} }), { message: 'CORE_PLATFORM_ACTION_UNKNOWN' });
  }

  const parent = makeComment(COMMENT_ID, 'parent', { userId: OTHER_ACCOUNT_ID });
  const { adapter, credentials } = await setup({
    note: makeNote({ comments: [parent] }),
    onSubmit: (page) => {
      page.note.comments.push(makeComment(NEW_COMMENT_ID, page.draft, {
        targetCommentId: 'ffffffffffffffffffffffff',
      }));
    },
  });
  await assert.rejects(adapter.execute('reply', {
    id: NOTE_ID,
    commentId: COMMENT_ID,
    text: 'reply body',
  }, { credentials, assertAuthorized: () => {} }), { message: 'CORE_PLATFORM_ACTION_UNKNOWN' });
});

test('missing assertAuthorized fails closed before any sending click', async () => {
  const { browser, adapter, credentials } = await setup({
    note: makeNote({ comments: [] }),
    onSubmit: (page) => { page.note.comments.push(makeComment(NEW_COMMENT_ID, page.draft)); },
  });
  await assert.rejects(adapter.execute('comment', {
    id: NOTE_ID, text: 'hello',
  }, { credentials }), { message: 'CORE_PLATFORM_PERMISSION_REQUIRED' });
  const page = browser.pages.at(-1);
  assert.equal(page.submitClicks, 0);
});

test('captcha and login challenges fail closed', async () => {
  const { adapter, credentials } = await setup({
    gotoHook: async (url, page) => {
      page.urlValue = url.startsWith(`${ORIGIN}/explore/${NOTE_ID}`)
        ? `${ORIGIN}/captcha`
        : url;
    },
  });
  await assert.rejects(adapter.execute('read', { id: NOTE_ID }, { credentials }), {
    message: 'CORE_PLATFORM_CHALLENGE',
  });

  const challengeBrowser = makeFakeBrowser({ challenge: true });
  const challengeAdapter = makeXhsBrowserAdapter({
    launch: async () => challengeBrowser,
    now: () => NOW,
  });
  await assert.rejects(challengeAdapter.beginLogin({ acceptBrowser: true }), {
    message: 'CORE_PLATFORM_CHALLENGE',
  });
  assert.equal(challengeBrowser.closeCount, 1);
});

test('a redirected non-target note fails closed with TARGET_MISMATCH', async () => {
  const { adapter, credentials, browser } = await setup({
    gotoHook: async (url, page) => {
      page.urlValue = `${ORIGIN}/explore/${OTHER_NOTE_ID}`;
    },
  });
  await assert.rejects(adapter.execute('read', { id: NOTE_ID }, { credentials }), {
    message: 'CORE_PLATFORM_TARGET_MISMATCH',
  });
  assert.equal(browser.pages.at(-1).closed, true);
});

test('raw browser failures are sanitized and never leak logs or secrets', async () => {
  const { adapter, credentials } = await setup({
    evaluateHook: async (fn, arg) => {
      if (arg?.kind === 'note') throw new Error('raw browser log SECRET_VALUE');
      return undefined;
    },
  });
  await assert.rejects(adapter.execute('read', { id: NOTE_ID }, { credentials }), (error) => {
    assert.match(error.message, /^CORE_PLATFORM_(ACTION_UNKNOWN|INVALID_RESPONSE)$/);
    assert.ok(!error.message.includes('SECRET_VALUE'));
    return true;
  });
});

test('logout and dispose close the browser and invalidate handles immediately', async () => {
  const first = await setup();
  assert.deepEqual(await first.adapter.logout(first.credentials), { loggedOut: true });
  assert.equal(first.browser.closeCount, 1);
  assert.equal(first.browser.connected, false);
  await assert.rejects(first.adapter.validateAccount(first.credentials), {
    message: 'CORE_PLATFORM_LOGIN_REQUIRED',
  });
  await assert.rejects(first.adapter.execute('read', { id: NOTE_ID }, {
    credentials: first.credentials,
  }), { message: 'CORE_PLATFORM_LOGIN_REQUIRED' });

  const second = await setup();
  assert.deepEqual(await second.adapter.dispose(), { disposed: true });
  assert.equal(second.browser.closeCount, 1);
  await assert.rejects(second.adapter.pollLogin(second.challenge.private), {
    message: 'CORE_PLATFORM_LOGIN_MISSING',
  });
  await assert.rejects(second.adapter.validateAccount(second.credentials), {
    message: 'CORE_PLATFORM_LOGIN_REQUIRED',
  });
});

test('unknown like state is refused before clicking',async()=>{
 const {browser,adapter,credentials}=await setup({note:makeNote({liked:undefined})});
 await assert.rejects(adapter.execute('like',{id:NOTE_ID,liked:true},{credentials,assertAuthorized:()=>{}}),/INVALID_RESPONSE/);
 assert.equal(browser.pages.at(-1).likeClicks,0);
});

test('logout during pending browser launch cannot resurrect a browser session',async()=>{
 let release;const browser=makeFakeBrowser();const adapter=makeXhsBrowserAdapter({launch:()=>new Promise(r=>release=r),now:()=>NOW});
 const attempt=adapter.beginLogin({acceptBrowser:true});await new Promise(r=>setImmediate(r));await adapter.logout();release(browser);await assert.rejects(attempt,/REVOKED/);assert.equal(browser.connected,false);
});
