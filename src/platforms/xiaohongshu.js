const DEFAULT_ORIGIN = 'https://openaccount.xiaohongshu.com';
const BASIC_SCOPE = 'basic_info';
const AUTHORIZATION_PENDING = 37002;
const AUTHORIZATION_SCANNED = 37009;

const PATHS = Object.freeze({
  deviceCode: '/api/sns/v1/oauth2/device/code',
  deviceToken: '/api/sns/v1/oauth2/device/token',
  tokenStatus: '/api/sns/v1/oauth2/token_status',
  refreshToken: '/api/sns/v1/oauth2/refresh_token',
  minUserInfo: '/api/sns/v1/oauth2/batch_get_min_user_info',
  revoke: '/api/sns/v1/oauth2/revoke',
});

export const XIAOHONGSHU_METADATA = Object.freeze({
  id: 'xiaohongshu',
  contractVersion: 2,
  mode: 'real',
  capabilities: Object.freeze([]),
  authMethods: Object.freeze(['device-code']),
  version: '0.2.0', name: '小红书 / Xiaohongshu', category: 'image-text',
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

function responseCode(response) {
  if (!isRecord(response) || !Number.isInteger(response.code)) fail('invalid_response');
  return response.code;
}

function successData(response, { requireData = true } = {}) {
  if(responseCode(response)!==0)apiError(response);
  if(response.success!==true)fail('invalid_response');
  if (requireData && !isRecord(response.data)) fail('invalid_response');
  return response.data;
}

function apiError(response) {
  fail(responseCode(response));
}

function nonEmptyString(value, code = 'invalid_input') {
  if (typeof value !== 'string' || value.length === 0 || value.length>2048 || /\s/.test(value)) fail(code);
  return value;
}

function nonEmptyText(value, code = 'invalid_response') {
  if (typeof value !== 'string' || value.trim().length === 0) fail(code);
  return value;
}

function textField(value, maxLength, code = 'invalid_note') {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.length > maxLength) fail(code);
  return value;
}

function positiveInteger(value, code = 'invalid_response') {
  if (!Number.isSafeInteger(value) || value <= 0) fail(code);
  return value;
}

function optionalPositiveInteger(value) {
  if (value === undefined || value === null) return null;
  if (!Number.isSafeInteger(value) || value <= 0) fail('invalid_note');
  return value;
}

function httpUrl(value, code = 'invalid_note') {
  if (typeof value !== 'string') fail(code);
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(code);
  }
  if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) fail(code);
  return url.href;
}

function normalizeOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    fail('origin');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
    (url.pathname !== '/' && url.pathname !== '')) fail('origin');
  return url.origin;
}

function requireSignalOptions(options) {
  if (options === undefined) return {};
  if (!isRecord(options)) fail('invalid_input');
  return options;
}

function loginRequest(value) {
  if (!isRecord(value)) fail('invalid_input');
  return {
    appId: nonEmptyString(value.appId),
    appSecret: nonEmptyString(value.appSecret),
  };
}

function accountCredentials(value, { accessToken = false, refreshToken = false, secret = false } = {}) {
  if (!isRecord(value)) fail('invalid_credentials');
  const result = {
    appId: nonEmptyString(value.appId, 'invalid_credentials'),
  };
  if (value.appSecret !== undefined && value.appSecret !== null) {
    result.appSecret = nonEmptyString(value.appSecret, 'invalid_credentials');
  }
  if (secret && result.appSecret === undefined) fail('invalid_credentials');
  if (accessToken) result.accessToken = nonEmptyString(value.accessToken, 'invalid_credentials');
  if (refreshToken) result.refreshToken = nonEmptyString(value.refreshToken, 'invalid_credentials');
  return result;
}

function tokenState(data, clock) {
  const accessToken = nonEmptyString(data.access_token, 'invalid_response');
  const refreshToken = nonEmptyString(data.refresh_token, 'invalid_response');
  const openId = nonEmptyString(data.open_id, 'invalid_response');
  const expireTime = positiveInteger(data.expire_time);
  const scopes = Array.isArray(data.scope)
    ? data.scope.filter((scope) => typeof scope === 'string')
    : null;
  if (!scopes || !scopes.includes(BASIC_SCOPE)) fail('invalid_response');
  if (expireTime * 1000 <= clock()) fail('token_expired');
  return {
    accessToken,
    refreshToken,
    openId,
    expiresAt: expireTime * 1000,
  };
}

function accountResult({ appId, appSecret, token, identity }) {
  return {
    identity: {
      accountId: identity.accountId,
      displayName: identity.displayName,
    },
    credentials: {
      appId,
      appSecret: appSecret ?? null,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
    },
    expiresAt: token.expiresAt,
    scopes: [BASIC_SCOPE],
  };
}

function normalizeImage(image) {
  if (typeof image === 'string') {
    return { url: httpUrl(image), width: null, height: null };
  }
  if (!isRecord(image)) fail('invalid_note');
  const source = image.url ?? image.url_default ?? image.urlDefault ?? image.src;
  return {
    url: httpUrl(source),
    width: optionalPositiveInteger(image.width),
    height: optionalPositiveInteger(image.height),
  };
}

function normalizeComment(comment) {
  if (!isRecord(comment)) fail('invalid_note');
  const text = comment.text ?? comment.content;
  if (typeof text !== 'string' || text.length > 4000) fail('invalid_note');
  const authorRaw = comment.author ?? comment.user;
  let author = null;
  if (isRecord(authorRaw)) {
    const accountId = authorRaw.id ?? authorRaw.user_id ?? authorRaw.userId;
    const displayName = authorRaw.nickname ?? authorRaw.name ?? authorRaw.displayName;
    if (accountId !== undefined || displayName !== undefined) {
      author = {
        accountId: typeof accountId === 'string' ? accountId : null,
        displayName: typeof displayName === 'string' ? displayName : null,
      };
    }
  }
  const id = comment.id ?? comment.comment_id ?? comment.commentId;
  return {
    id: typeof id === 'string' ? id : null,
    text,
    author,
  };
}

export function normalizeXhsNote(raw) {
  if (!isRecord(raw)) fail('invalid_note');
  const rawId = raw.id ?? raw.note_id ?? raw.noteId;
  if (typeof rawId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(rawId)) fail('invalid_note');
  const authorRaw = raw.author ?? raw.user;
  if (!isRecord(authorRaw)) fail('invalid_note');
  const accountId = authorRaw.id ?? authorRaw.user_id ?? authorRaw.userId;
  const displayName = authorRaw.nickname ?? authorRaw.name ?? authorRaw.displayName;
  if (typeof accountId !== 'string' || accountId.length === 0 ||
    typeof displayName !== 'string' || displayName.length === 0) fail('invalid_note');
  const avatarRaw = authorRaw.avatar ?? authorRaw.avatar_url ?? authorRaw.avatarUrl;
  const imagesRaw = raw.images ?? raw.image_list ?? raw.imageList;
  if (!Array.isArray(imagesRaw) || imagesRaw.length > 50) fail('invalid_note');
  const commentsRaw = raw.comments ?? raw.comment_list ?? raw.commentList;
  if (commentsRaw !== undefined && (!Array.isArray(commentsRaw) || commentsRaw.length > 100)) fail('invalid_note');

  const id = rawId;
  return {
    platform: 'xiaohongshu',
    type: 'note',
    id,
    title: textField(raw.title, 512),
    text: textField(raw.text ?? raw.desc ?? raw.description ?? raw.content, 20000),
    author: {
      accountId,
      displayName,
      avatarUrl: avatarRaw === undefined || avatarRaw === null ? null : httpUrl(avatarRaw),
    },
    images: imagesRaw.map(normalizeImage),
    comments: (commentsRaw ?? []).map(normalizeComment),
    source: {
      canonicalUrl: `https://www.xiaohongshu.com/explore/${encodeURIComponent(id)}`,
    },
    evidence: {
      images: 'metadata-only',
      vision: 'not-performed',
    },
  };
}

export function makeXiaohongshuAdapter({
  transport,
  origin = DEFAULT_ORIGIN,
  now = () => Date.now(),
} = {}) {
  if (!transport || typeof transport.request !== 'function') fail('transport');
  if (typeof now !== 'function') fail('clock');
  const baseOrigin = normalizeOrigin(origin);
  const verificationUrl = `${baseOrigin}/device`;

  async function request(path, { method = 'POST', headers = {}, body, signal } = {}) {
    let response;
    try {
      response = await transport.request(`${baseOrigin}${path}`, {
        method,
        headers: { accept: 'application/json', ...headers },
        body,
        signal,
      });
    } catch (error) {
      if (signal?.aborted) fail('aborted');
      const message = error instanceof Error ? error.message : '';
      if (/^CORE_PLATFORM_[A-Z0-9_]+$/.test(message)) throw new Error(message);
      fail('network_error');
    }
    if (!isRecord(response)) fail('invalid_response');
    return response;
  }

  async function postJson(path, payload, signal) {
    return request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
  }

  async function minUserInfo(accessToken, signal) {
    const response = await request(PATHS.minUserInfo, {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}` },
      signal,
    });
    const data = successData(response);
    const openId = nonEmptyString(data.open_id, 'invalid_response');
    const nickname = nonEmptyText(data.nickname, 'invalid_response');
    return { accountId: openId, displayName: nickname };
  }

  async function beginLogin(input, options) {
    const { appId, appSecret } = loginRequest(input);
    const { signal } = requireSignalOptions(options);
    const response = await postJson(PATHS.deviceCode, {
      app_id: appId,
      app_secret: appSecret,
      scopes: [BASIC_SCOPE],
    }, signal);
    const data = successData(response);
    const deviceCode = nonEmptyString(data.device_code, 'invalid_response');
    const userCode = nonEmptyString(data.user_code, 'invalid_response');
    const returnedUrl = nonEmptyString(data.verification_uri, 'invalid_response');
    const expiresIn = positiveInteger(data.expires_in);
    const interval = positiveInteger(data.interval);
    if (returnedUrl !== verificationUrl) fail('invalid_verification_url');
    return {
      private: { appId, appSecret, deviceCode },
      public: {
        verificationUrl:verificationUrl+'?user_code='+encodeURIComponent(userCode),
        userCode,
        expiresAt: now() + expiresIn * 1000,
        intervalMs: interval * 1000,
      },
    };
  }

  async function pollLogin(privateState, options) {
    if (!isRecord(privateState)) fail('invalid_private_state');
    const appId = nonEmptyString(privateState.appId, 'invalid_private_state');
    const appSecret = nonEmptyString(privateState.appSecret, 'invalid_private_state');
    const deviceCode = nonEmptyString(privateState.deviceCode, 'invalid_private_state');
    const { signal } = requireSignalOptions(options);
    const response = await postJson(PATHS.deviceToken, {
      app_id: appId,
      app_secret: appSecret,
      device_code: deviceCode,
    }, signal);
    const code = responseCode(response);
    if (code === AUTHORIZATION_PENDING) return { pending: true, scanned: false };
    if (code === AUTHORIZATION_SCANNED) return { pending: true, scanned: true };
    if(code===37003)return {pending:true,slowDown:true};
    if (code !== 0) apiError(response);
    const data = successData(response);
    const token = tokenState(data, now);
    const identity = await minUserInfo(token.accessToken, signal);
    if (identity.accountId !== token.openId) fail('open_id_mismatch');
    return accountResult({ appId, appSecret, token, identity });
  }

  async function validateAccount(credentials, options) {
    const { appId, appSecret, accessToken } = accountCredentials(credentials, { accessToken: true });
    const { signal } = requireSignalOptions(options);
    const response = await postJson(PATHS.tokenStatus, { access_token: accessToken }, signal);
    if (responseCode(response) !== 0) apiError(response);
    const data = successData(response);
    const token = tokenState(data, now);
    const identity = await minUserInfo(token.accessToken, signal);
    if (identity.accountId !== token.openId) fail('open_id_mismatch');
    return accountResult({ appId, appSecret, token, identity });
  }

  async function refreshAccount(credentials, options) {
    const { appId, appSecret, refreshToken } = accountCredentials(credentials, { refreshToken: true });
    const { signal } = requireSignalOptions(options);
    const response = await postJson(PATHS.refreshToken, {
      app_id: appId,
      refresh_token: refreshToken,
    }, signal);
    if (responseCode(response) !== 0) apiError(response);
    const data = successData(response);
    const token = tokenState(data, now);
    const identity = await minUserInfo(token.accessToken, signal);
    if (identity.accountId !== token.openId) fail('open_id_mismatch');
    return accountResult({ appId, appSecret, token, identity });
  }

  async function revokeAccount(credentials, options) {
    const { appId, appSecret, accessToken } = accountCredentials(credentials, {
      accessToken: true,
      secret: true,
    });
    const { signal } = requireSignalOptions(options);
    const response = await postJson(PATHS.revoke, {
      app_id: appId,
      app_secret: appSecret,
      access_token: accessToken,
    }, signal);
    successData(response, { requireData: false });
    return { revoked: true };
  }

  async function execute() {
    fail('unsupported');
  }

  return Object.freeze({
    ...XIAOHONGSHU_METADATA,
    capabilities: XIAOHONGSHU_METADATA.capabilities,
    authMethods: XIAOHONGSHU_METADATA.authMethods,
    beginLogin,
    pollLogin,
    validateAccount,
    refreshAccount,
    revokeAccount,
    execute,
  });
}
