import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeXiaohongshuAdapter,
  normalizeXhsNote,
  XIAOHONGSHU_METADATA,
} from '../src/platforms/xiaohongshu.js';

const ORIGIN = 'https://openaccount.xiaohongshu.com';
const NOW = 1_700_000_000_000;
const APP = Object.freeze({ appId: 'app-123', appSecret: 'sk_test_secret_value' });
const PRIVATE = Object.freeze({
  appId: APP.appId,
  appSecret: APP.appSecret,
  deviceCode: 'dc_test_secret_value',
});
const TOKEN = Object.freeze({
  access_token: 'at_test_secret_value',
  refresh_token: 'rt_test_secret_value',
  open_id: 'open-123',
  expire_time: Math.floor(NOW / 1000) + 7200,
  refresh_expire_time: Math.floor(NOW / 1000) + 86400,
  scope: ['basic_info'],
});
const USER = Object.freeze({
  open_id: 'open-123',
  nickname: 'Test User',
  avatar: 'https://img.example/avatar.jpg',
});
const DEVICE_CODE = Object.freeze({
  device_code: 'dc_test_secret_value',
  user_code: 'WDJB-MJHT',
  verification_uri: `${ORIGIN}/device`,
  verification_uri_complete: `${ORIGIN}/device?user_code=WDJB-MJHT`,
  expires_in: 600,
  interval: 1,
});

function ok(data) {
  return { code: 0, success: true, msg: 'ok', data };
}

function apiError(code, message = 'raw upstream message') {
  return { code, success: false, msg: message, data: null };
}

function makeProtocol(responses) {
  const calls = [];
  const queue = Array.isArray(responses) ? [...responses] : null;
  return {
    calls,
    async request(url, options = {}) {
      const call = {
        url,
        method: options.method,
        headers: { ...options.headers },
        rawBody: options.body,
        signal: options.signal,
      };
      if (typeof options.body === 'string') call.body = JSON.parse(options.body);
      calls.push(call);
      const next = queue ? queue.shift() : responses(call, calls.length - 1);
      if (next === undefined) throw new Error('unexpected transport call');
      if (next instanceof Error) throw next;
      return structuredClone(next);
    },
  };
}

function build(responses, options = {}) {
  const transport = makeProtocol(responses);
  const adapter = makeXiaohongshuAdapter({ transport, now: () => NOW, ...options });
  return { adapter, transport };
}

function assertNoSecrets(error) {
  for (const secret of [
    APP.appSecret,
    PRIVATE.deviceCode,
    TOKEN.access_token,
    TOKEN.refresh_token,
    'raw upstream message',
  ]) {
    assert.ok(!error.message.includes(secret), `error leaked ${secret}`);
  }
  assert.match(error.message, /^CORE_PLATFORM_[A-Z0-9_]+$/);
}

test('metadata is a real contract-v2 device-code adapter with no content capabilities', async () => {
  const { adapter, transport } = build(() => {
    throw new Error('execute must not call transport');
  });
  assert.deepEqual(XIAOHONGSHU_METADATA, {
    id: 'xiaohongshu',
    contractVersion: 2,
    mode: 'real',
    capabilities: [],
    authMethods: ['device-code'],
    version: '0.2.0',name:'小红书 / Xiaohongshu',category:'image-text',
  });
  assert.equal(adapter.id, 'xiaohongshu');
  assert.equal(adapter.contractVersion, 2);
  assert.equal(adapter.mode, 'real');
  assert.deepEqual(adapter.capabilities, []);
  assert.deepEqual(adapter.authMethods, ['device-code']);
  assert.equal(adapter.version, '0.2.0');
  assert.equal('authorize' in adapter, false);
  assert.equal('authApp' in adapter, false);
  await assert.rejects(adapter.execute('read', { id: 'note-1' }), {
    message: 'CORE_PLATFORM_UNSUPPORTED',
  });
  assert.equal(transport.calls.length, 0);
});

test('factory rejects missing transport and unsafe or malformed origins', () => {
  assert.throws(() => makeXiaohongshuAdapter({}), { message: 'CORE_PLATFORM_TRANSPORT' });
  const transport = { request: async () => ok({}) };
  for (const origin of [
    'http://openaccount.xiaohongshu.com',
    'https://user:pass@openaccount.xiaohongshu.com',
    'https://openaccount.xiaohongshu.com/other',
    'not-a-url',
  ]) {
    assert.throws(() => makeXiaohongshuAdapter({ transport, origin }), {
      message: 'CORE_PLATFORM_ORIGIN',
    });
  }
});

test('beginLogin posts the documented device-code payload and returns only the public challenge', async () => {
  const controller = new AbortController();
  const { adapter, transport } = build([ok(DEVICE_CODE)]);
  const result = await adapter.beginLogin(APP, { signal: controller.signal });

  assert.equal(transport.calls.length, 1);
  const call = transport.calls[0];
  assert.equal(call.url, `${ORIGIN}/api/sns/v1/oauth2/device/code`);
  assert.equal(call.method, 'POST');
  assert.equal(call.headers.accept, 'application/json');
  assert.equal(call.headers['content-type'], 'application/json');
  assert.equal(typeof call.rawBody, 'string');
  assert.deepEqual(call.body, {
    app_id: APP.appId,
    app_secret: APP.appSecret,
    scopes: ['basic_info'],
  });
  assert.equal(call.signal, controller.signal);
  assert.deepEqual(result, {
    private: {
      appId: APP.appId,
      appSecret: APP.appSecret,
      deviceCode: DEVICE_CODE.device_code,
    },
    public: {
      verificationUrl: `${ORIGIN}/device?user_code=WDJB-MJHT`,
      userCode: DEVICE_CODE.user_code,
      expiresAt: NOW + DEVICE_CODE.expires_in * 1000,
      intervalMs: DEVICE_CODE.interval * 1000,
    },
  });
});

test('beginLogin accepts an explicit safe origin and requires the exact /device URL', async () => {
  const customOrigin = 'https://sandbox.example';
  const { adapter } = build([ok({
    ...DEVICE_CODE,
    verification_uri: `${customOrigin}/device`,
    verification_uri_complete: `${customOrigin}/device?user_code=WDJB-MJHT`,
  })], { origin: customOrigin });
  const result = await adapter.beginLogin(APP);
  assert.equal(result.public.verificationUrl, `${customOrigin}/device?user_code=WDJB-MJHT`);

  for (const verification_uri of [
    `https://evil.example/device`,
    `${ORIGIN}/device/extra`,
    `${ORIGIN}/device?next=https://evil.example`,
    `http://openaccount.xiaohongshu.com/device`,
    `${ORIGIN}/device/`,
  ]) {
    const fixture = build([ok({ ...DEVICE_CODE, verification_uri })]);
    await assert.rejects(fixture.adapter.beginLogin(APP), {
      message: 'CORE_PLATFORM_INVALID_VERIFICATION_URL',
    });
  }
});

test('beginLogin rejects malformed device responses without leaking response data', async () => {
  const malformed = [
    { ...DEVICE_CODE, device_code: undefined },
    { ...DEVICE_CODE, user_code: '' },
    { ...DEVICE_CODE, expires_in: 0 },
    { ...DEVICE_CODE, interval: -1 },
    { ...DEVICE_CODE, expires_in: '600' },
  ];
  for (const data of malformed) {
    const { adapter } = build([ok(data)]);
    await assert.rejects(adapter.beginLogin(APP), (error) => {
      assert.equal(error.message, 'CORE_PLATFORM_INVALID_RESPONSE');
      assertNoSecrets(error);
      return true;
    });
  }
});

test('upstream and transport failures are sanitized to stable CORE_PLATFORM codes', async () => {
  const denied = build([apiError(37010, `denied ${APP.appSecret} ${TOKEN.access_token}`)]);
  await assert.rejects(denied.adapter.beginLogin(APP), (error) => {
    assert.equal(error.message, 'CORE_PLATFORM_37010');
    assertNoSecrets(error);
    return true;
  });

  const network = build(() => new Error(`socket failed for ${APP.appSecret} ${TOKEN.access_token}`));
  await assert.rejects(network.adapter.beginLogin(APP), (error) => {
    assert.equal(error.message, 'CORE_PLATFORM_NETWORK_ERROR');
    assertNoSecrets(error);
    return true;
  });

  const invalidJsonShape = build([null]);
  await assert.rejects(invalidJsonShape.adapter.beginLogin(APP), {
    message: 'CORE_PLATFORM_INVALID_RESPONSE',
  });
});

test('pollLogin reports pending and scanned without reading user data', async () => {
  for (const [code, scanned] of [[37002, false], [37009, true]]) {
    const { adapter, transport } = build([apiError(code)]);
    const result = await adapter.pollLogin(PRIVATE);
    assert.deepEqual(result, { pending: true, scanned });
    assert.equal(transport.calls.length, 1);
    const call = transport.calls[0];
    assert.equal(call.url, `${ORIGIN}/api/sns/v1/oauth2/device/token`);
    assert.equal(call.method, 'POST');
    assert.deepEqual(call.body, {
      app_id: APP.appId,
      app_secret: APP.appSecret,
      device_code: PRIVATE.deviceCode,
    });
    assert.ok(transport.calls.every((entry) => !entry.url.includes('min_user_info')));
  }
});

test('pollLogin success validates tokens, verifies the matching open_id and returns the account', async () => {
  const { adapter, transport } = build([ok(TOKEN), ok(USER)]);
  const result = await adapter.pollLogin(PRIVATE);

  assert.equal(transport.calls.length, 2);
  assert.equal(transport.calls[0].url, `${ORIGIN}/api/sns/v1/oauth2/device/token`);
  assert.equal(transport.calls[1].url, `${ORIGIN}/api/sns/v1/oauth2/batch_get_min_user_info`);
  assert.equal(transport.calls[1].method, 'POST');
  assert.equal(transport.calls[1].headers.authorization, `Bearer ${TOKEN.access_token}`);
  assert.equal(transport.calls[1].rawBody, undefined);
  assert.ok(transport.calls.every((entry) =>
    !/\/(authorize|auth_info|auth_app|explore|note)/.test(entry.url)));

  assert.deepEqual(result, {
    identity: { accountId: TOKEN.open_id, displayName: USER.nickname },
    credentials: {
      appId: APP.appId,
      appSecret: APP.appSecret,
      accessToken: TOKEN.access_token,
      refreshToken: TOKEN.refresh_token,
    },
    expiresAt: TOKEN.expire_time * 1000,
    scopes: ['basic_info'],
  });
});

test('pollLogin rejects identity mismatch and never returns partial account data', async () => {
  const { adapter } = build([ok(TOKEN), ok({ ...USER, open_id: 'open-other' })]);
  await assert.rejects(adapter.pollLogin(PRIVATE), { message: 'CORE_PLATFORM_OPEN_ID_MISMATCH' });
});

test('pollLogin rejects invalid or expired tokens before reading user data', async () => {
  const invalidTokens = [
    { ...TOKEN, refresh_token: undefined },
    { ...TOKEN, open_id: '' },
    { ...TOKEN, expire_time: 0 },
    { ...TOKEN, expire_time: Math.floor(NOW / 1000) - 1 },
    { ...TOKEN, scope: [] },
  ];
  for (const data of invalidTokens) {
    const { adapter, transport } = build([ok(data), ok(USER)]);
    await assert.rejects(adapter.pollLogin(PRIVATE), (error) => {
      assert.ok([
        'CORE_PLATFORM_INVALID_RESPONSE',
        'CORE_PLATFORM_TOKEN_EXPIRED',
      ].includes(error.message));
      assertNoSecrets(error);
      return true;
    });
    assert.equal(transport.calls.length, 1, 'must not read user info after invalid tokens');
  }
});

test('pollLogin surfaces denied and expired device grants as sanitized errors', async () => {
  for (const code of [37001, 37004, 37010]) {
    const { adapter, transport } = build([apiError(code, `raw ${TOKEN.access_token}`)]);
    await assert.rejects(adapter.pollLogin(PRIVATE), (error) => {
      assert.equal(error.message, `CORE_PLATFORM_${code}`);
      assertNoSecrets(error);
      return true;
    });
    assert.equal(transport.calls.length, 1);
  }
});

test('validateAccount calls token_status and then min_user_info with the current token', async () => {
  const status = {
    ...TOKEN,
    access_token: 'at_renewed',
    refresh_token: 'rt_renewed',
  };
  const { adapter, transport } = build([ok(status), ok(USER)]);
  const credentials = {
    appId: APP.appId,
    appSecret: APP.appSecret,
    accessToken: TOKEN.access_token,
    refreshToken: TOKEN.refresh_token,
  };
  const result = await adapter.validateAccount(credentials);

  assert.equal(transport.calls.length, 2);
  assert.equal(transport.calls[0].url, `${ORIGIN}/api/sns/v1/oauth2/token_status`);
  assert.deepEqual(transport.calls[0].body, { access_token: credentials.accessToken });
  assert.equal(transport.calls[0].body.app_secret, undefined);
  assert.equal(transport.calls[1].url, `${ORIGIN}/api/sns/v1/oauth2/batch_get_min_user_info`);
  assert.equal(transport.calls[1].headers.authorization, 'Bearer at_renewed');
  assert.deepEqual(result, {
    identity: { accountId: TOKEN.open_id, displayName: USER.nickname },
    credentials: {
      appId: APP.appId,
      appSecret: APP.appSecret,
      accessToken: 'at_renewed',
      refreshToken: 'rt_renewed',
    },
    expiresAt: TOKEN.expire_time * 1000,
    scopes: ['basic_info'],
  });
});

test('validateAccount stops on rejected or malformed token_status without reading user data', async () => {
  const credentials = { ...APP, accessToken: TOKEN.access_token, refreshToken: TOKEN.refresh_token };

  const expired = build([apiError(23001, `expired ${TOKEN.access_token}`), ok(USER)]);
  await assert.rejects(expired.adapter.validateAccount(credentials), (error) => {
    assert.equal(error.message, 'CORE_PLATFORM_23001');
    assertNoSecrets(error);
    return true;
  });
  assert.equal(expired.transport.calls.length, 1);

  const malformed = build([ok({ ...TOKEN, open_id: undefined }), ok(USER)]);
  await assert.rejects(malformed.adapter.validateAccount(credentials), {
    message: 'CORE_PLATFORM_INVALID_RESPONSE',
  });
  assert.equal(malformed.transport.calls.length, 1);
});

test('refreshAccount rotates tokens and verifies identity without sending the app secret', async () => {
  const refreshed = {
    ...TOKEN,
    access_token: 'at_rotated',
    refresh_token: 'rt_rotated',
    expire_time: Math.floor(NOW / 1000) + 7200,
  };
  const { adapter, transport } = build([ok(refreshed), ok(USER)]);
  const credentials = {
    appId: APP.appId,
    appSecret: APP.appSecret,
    accessToken: TOKEN.access_token,
    refreshToken: TOKEN.refresh_token,
  };
  const result = await adapter.refreshAccount(credentials);

  assert.equal(transport.calls.length, 2);
  assert.equal(transport.calls[0].url, `${ORIGIN}/api/sns/v1/oauth2/refresh_token`);
  assert.deepEqual(transport.calls[0].body, {
    app_id: APP.appId,
    refresh_token: credentials.refreshToken,
  });
  assert.equal(transport.calls[1].headers.authorization, 'Bearer at_rotated');
  assert.deepEqual(result.credentials, {
    appId: APP.appId,
    appSecret: APP.appSecret,
    accessToken: 'at_rotated',
    refreshToken: 'rt_rotated',
  });
});

test('refreshAccount rejects expired refresh grants and open_id mismatches', async () => {
  const credentials = { ...APP, refreshToken: TOKEN.refresh_token };
  const expired = build([apiError(37004, `expired ${TOKEN.refresh_token}`)]);
  await assert.rejects(expired.adapter.refreshAccount(credentials), (error) => {
    assert.equal(error.message, 'CORE_PLATFORM_37004');
    assertNoSecrets(error);
    return true;
  });
  assert.equal(expired.transport.calls.length, 1);

  const mismatch = build([ok(TOKEN), ok({ ...USER, open_id: 'open-other' })]);
  await assert.rejects(mismatch.adapter.refreshAccount(credentials), {
    message: 'CORE_PLATFORM_OPEN_ID_MISMATCH',
  });
});

test('revokeAccount requires the app secret and posts the documented revoke payload', async () => {
  const credentials = {
    appId: APP.appId,
    appSecret: APP.appSecret,
    accessToken: TOKEN.access_token,
  };
  const { adapter, transport } = build([ok({ open_id: TOKEN.open_id, already_revoked: false })]);
  assert.deepEqual(await adapter.revokeAccount(credentials), { revoked: true });
  assert.equal(transport.calls.length, 1);
  assert.equal(transport.calls[0].url, `${ORIGIN}/api/sns/v1/oauth2/revoke`);
  assert.deepEqual(transport.calls[0].body, {
    app_id: APP.appId,
    app_secret: APP.appSecret,
    access_token: TOKEN.access_token,
  });

  const withoutSecret = build(() => {
    throw new Error('transport must not be called without the secret');
  });
  await assert.rejects(withoutSecret.adapter.revokeAccount({
    appId: APP.appId,
    accessToken: TOKEN.access_token,
  }), { message: 'CORE_PLATFORM_INVALID_CREDENTIALS' });
  assert.equal(withoutSecret.transport.calls.length, 0);
});

test('revokeAccount sanitizes upstream refusals', async () => {
  const { adapter, transport } = build([apiError(37011, `mismatch ${TOKEN.access_token}`)]);
  await assert.rejects(adapter.revokeAccount({
    ...APP,
    accessToken: TOKEN.access_token,
  }), (error) => {
    assert.equal(error.message, 'CORE_PLATFORM_37011');
    assertNoSecrets(error);
    return true;
  });
  assert.equal(transport.calls.length, 1);
});

test('normalizeXhsNote builds a whitelisted note with metadata-only image evidence', () => {
  const raw = {
    id: 'note-abc_1',
    title: 'A synthetic note',
    desc: 'Body text for the note.',
    author: {
      id: 'user-1',
      nickname: 'Author Name',
      avatar: 'https://img.example/avatar.jpg?size=large',
      secret: 'AUTHOR_RAW_SECRET',
    },
    images: [
      {
        url: 'https://img.example/one.jpg',
        width: 1200,
        height: 800,
        description: 'VISION_RAW_SECRET',
        analysis: 'pretend-vision',
      },
      'https://img.example/two.jpg',
    ],
    comments: [
      {
        id: 'comment-1',
        content: 'A useful comment.',
        user: { id: 'user-2', nickname: 'Commenter' },
        secret: 'COMMENT_RAW_SECRET',
      },
    ],
    tags: ['RAW_TAG_SECRET'],
    rawOnly: 'RAW_TOP_LEVEL_SECRET',
    source: { canonicalUrl: 'https://evil.example/note/other' },
  };

  const note = normalizeXhsNote(raw);
  assert.deepEqual(Object.keys(note).sort(), [
    'author', 'comments', 'evidence', 'id', 'images', 'platform', 'source', 'text', 'title', 'type',
  ]);
  assert.equal(note.platform, 'xiaohongshu');
  assert.equal(note.type, 'note');
  assert.equal(note.id, raw.id);
  assert.equal(note.title, raw.title);
  assert.equal(note.text, raw.desc);
  assert.deepEqual(note.author, {
    accountId: 'user-1',
    displayName: 'Author Name',
    avatarUrl: 'https://img.example/avatar.jpg?size=large',
  });
  assert.deepEqual(note.images, [
    { url: 'https://img.example/one.jpg', width: 1200, height: 800 },
    { url: 'https://img.example/two.jpg', width: null, height: null },
  ]);
  assert.deepEqual(note.comments, [{
    id: 'comment-1',
    text: 'A useful comment.',
    author: { accountId: 'user-2', displayName: 'Commenter' },
  }]);
  assert.equal(note.source.canonicalUrl, 'https://www.xiaohongshu.com/explore/note-abc_1');
  assert.deepEqual(note.evidence, { images: 'metadata-only', vision: 'not-performed' });
  const serialized = JSON.stringify(note);
  for (const secret of [
    'AUTHOR_RAW_SECRET', 'VISION_RAW_SECRET', 'COMMENT_RAW_SECRET',
    'RAW_TAG_SECRET', 'RAW_TOP_LEVEL_SECRET', 'evil.example', 'pretend-vision',
  ]) {
    assert.ok(!serialized.includes(secret), `normalized note copied ${secret}`);
  }
  assert.ok(note.images.every((image) =>
    Object.keys(image).sort().join(',') === 'height,url,width'));
});

test('normalizeXhsNote rejects malformed or unsafe raw notes without copying data', () => {
  const valid = {
    id: 'note-1',
    title: 'Title',
    text: 'Text',
    author: { id: 'user-1', nickname: 'Name' },
    images: [{ url: 'https://img.example/one.jpg' }],
  };
  for (const raw of [
    null,
    [],
    { ...valid, id: undefined },
    { ...valid, id: 'note/with/slash' },
    { ...valid, author: undefined },
    { ...valid, author: { id: '', nickname: 'Name' } },
    { ...valid, images: undefined },
    { ...valid, images: [{ url: 'javascript:alert(1)' }] },
    { ...valid, images: [{ url: 'https://img.example/one.jpg', width: -1 }] },
    { ...valid, comments: [{ text: 42 }] },
  ]) {
    assert.throws(() => normalizeXhsNote(raw), { message: 'CORE_PLATFORM_INVALID_NOTE' });
  }
});

test('device slow-down retains pending state',async()=>{const {adapter}=build([apiError(37003)]);assert.deepEqual(await adapter.pollLogin(PRIVATE),{pending:true,slowDown:true});});
