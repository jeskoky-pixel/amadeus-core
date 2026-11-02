import test from 'node:test';
import assert from 'node:assert/strict';
import { makeBilibiliMock, makeXiaohongshuMock } from '../src/platforms/mock-platforms.js';

const bili = makeBilibiliMock();
const xhs = makeXiaohongshuMock();
const adapters = [
  { name: 'bilibili', adapter: bili },
  { name: 'xiaohongshu', adapter: xhs },
];
const SOCIALS = {
  like: (id) => ({ id }),
  favorite: (id) => ({ id }),
  comment: (id) => ({ id, text: 'Synthetic dry-run comment.' }),
  reply: (target) => ({ target, text: 'Synthetic dry-run reply.' }),
  follow: (target) => ({ target }),
  message: (target) => ({ target, text: 'Synthetic dry-run message.' }),
  publish: () => ({ text: 'Synthetic dry-run publish text.' }),
};

test('both mocks expose the registry adapter shape without granting themselves permission', () => {
  assert.equal(bili.id, 'simulation-bilibili');
  assert.equal(xhs.id, 'simulation-xiaohongshu');
  assert.notEqual(bili, xhs);
  for (const { adapter } of adapters) {
    assert.match(adapter.id, /^[a-z][a-z0-9-]{0,63}$/);
    assert.equal(adapter.contractVersion, 1);
    assert.equal(adapter.simulated, true);
    assert.equal(typeof adapter.execute, 'function');
    assert.ok(Object.isFrozen(adapter));
    assert.ok(Object.isFrozen(adapter.capabilities));
    // Authorization belongs to PlatformRegistry; adapters must not invent it.
    assert.equal('enabled' in adapter, false);
    assert.equal('permissions' in adapter, false);
  }
  for (const capability of ['browse', 'search', 'read', 'comments', 'related', 'like', 'favorite', 'comment', 'reply', 'follow', 'message', 'publish']) {
    assert.ok(bili.capabilities.includes(capability), `bilibili missing ${capability}`);
    assert.ok(xhs.capabilities.includes(capability), `xiaohongshu missing ${capability}`);
  }
  assert.ok(bili.capabilities.includes('subtitles'));
  assert.ok(!xhs.capabilities.includes('subtitles'));
  assert.ok(xhs.capabilities.includes('images'));
  assert.ok(!bili.capabilities.includes('images'));
});

test('robot-demo is a stable content ID on both platforms with qualified synthetic identity', async () => {
  for (const { adapter } of adapters) {
    const read = await adapter.execute('read', { id: 'robot-demo' });
    assert.equal(read.platform, adapter.id);
    assert.equal(read.operation, 'read');
    assert.equal(read.evidenceLevel, 'simulation');
    assert.equal(read.externalAction, false);
    assert.equal(read.item.id, 'robot-demo');
    assert.equal(read.item.platform, adapter.id);
    assert.ok(read.item.author.startsWith(`${adapter.id}:user:`));
    assert.equal(read.item.author, `${adapter.id}:user:robot-lab`);
  }
  const biliRead = await bili.execute('read', { id: 'robot-demo' });
  const xhsRead = await xhs.execute('read', { id: 'robot-demo' });
  assert.equal(biliRead.item.type, 'video');
  assert.equal(xhsRead.item.type, 'note');
});

test('bilibili search, comments and related are deterministic synthetic observations', async () => {
  const first = await bili.execute('search', { query: 'robot' });
  const second = await bili.execute('search', { query: 'robot' });
  assert.deepEqual(first, second);
  assert.equal(first.operation, 'search');
  assert.equal(first.evidenceLevel, 'simulation');
  assert.equal(first.externalAction, false);
  assert.ok(first.items.length >= 2);
  assert.ok(first.items.every((item) => item.platform === 'simulation-bilibili'));

  const byTitle = await bili.execute('search', { query: 'faq' });
  assert.deepEqual(byTitle.items.map((item) => item.id), ['robot-faq']);

  const comments = await bili.execute('comments', { id: 'robot-demo', limit: 1 });
  assert.equal(comments.operation, 'comments');
  assert.equal(comments.contentId, 'robot-demo');
  assert.equal(comments.comments.length, 1);
  assert.equal(comments.count, 1);
  assert.ok(comments.comments[0].author.startsWith('simulation-bilibili:user:'));
  assert.equal(comments.comments[0].synthetic, true);

  const related = await bili.execute('related', { id: 'robot-demo' });
  assert.equal(related.operation, 'related');
  assert.deepEqual(related.items.map((item) => item.id), ['robot-faq']);
});

test('bilibili subtitles and keyframes are explicit placeholders, not transcription or vision', async () => {
  const result = await bili.execute('subtitles', { id: 'robot-demo' });
  assert.equal(result.operation, 'subtitles');
  assert.equal(result.evidenceLevel, 'simulation');
  assert.equal(result.externalAction, false);
  assert.ok(result.tracks.length > 0);
  assert.ok(result.tracks.every((track) => track.synthetic === true && track.text.startsWith('[synthetic subtitle]')));
  assert.ok(result.keyframes.length > 0);
  assert.ok(result.keyframes.every((frame) =>
    frame.synthetic === true && frame.analysis === 'placeholder-not-vision' &&
    frame.description.startsWith('[synthetic keyframe placeholder]')));
});

test('xiaohongshu images are synthetic descriptions and do not claim vision analysis', async () => {
  const result = await xhs.execute('images', { id: 'robot-demo' });
  assert.equal(result.operation, 'images');
  assert.equal(result.evidenceLevel, 'simulation');
  assert.equal(result.externalAction, false);
  assert.equal(result.visionAnalysis, 'not-performed-synthetic-descriptions-only');
  assert.ok(result.images.length > 0);
  assert.ok(result.images.every((image) =>
    image.synthetic === true && image.analysis === 'description-only-no-vision' &&
    image.description.startsWith('[synthetic image description]')));
});

test('browse returns synthetic platform-qualified summaries and read misses return null', async () => {
  for (const { adapter } of adapters) {
    const result = await adapter.execute('browse', {});
    assert.equal(result.operation, 'browse');
    assert.equal(result.evidenceLevel, 'simulation');
    assert.equal(result.externalAction, false);
    assert.equal(result.count, result.items.length);
    assert.ok(result.items.length >= 2);
    assert.ok(result.items.every((item) => item.platform === adapter.id && item.author.startsWith(`${adapter.id}:user:`)));
    assert.equal(await adapter.execute('read', { id: 'missing-content' }), null);
    assert.equal(await adapter.execute('comments', { id: 'missing-content' }), null);
    assert.equal(await adapter.execute('related', { id: 'missing-content' }), null);
  }
  assert.equal(await bili.execute('subtitles', { id: 'missing-content' }), null);
  assert.equal(await xhs.execute('images', { id: 'missing-content' }), null);
});

test('the same local user string stays a different identity per platform', async () => {
  const biliComments = await bili.execute('comments', { id: 'robot-demo' });
  const xhsComments = await xhs.execute('comments', { id: 'robot-demo' });
  const biliSame = biliComments.comments.find((comment) => comment.id === 'bili-comment-1');
  const xhsSame = xhsComments.comments.find((comment) => comment.id === 'xhs-comment-1');
  assert.equal(biliSame.author, 'simulation-bilibili:user:same-local');
  assert.equal(xhsSame.author, 'simulation-xiaohongshu:user:same-local');
  assert.notEqual(biliSame.author, xhsSame.author);
  assert.notEqual(biliSame.author.split(':')[0], xhsSame.author.split(':')[0]);
});

test('all social operations are explicit, deterministic dry runs with no external receipt', async () => {
  for (const { adapter } of adapters) {
    for (const [operation, inputFor] of Object.entries(SOCIALS)) {
      assert.ok(adapter.capabilities.includes(operation), `${adapter.id} missing ${operation}`);
      const input = inputFor('robot-demo');
      const first = await adapter.execute(operation, input);
      const second = await adapter.execute(operation, input);
      assert.deepEqual(first, second, `${adapter.id}/${operation} must be deterministic`);
      assert.equal(first.platform, adapter.id);
      assert.equal(first.operation, operation);
      assert.equal(first.evidenceLevel, 'simulation');
      assert.equal(first.externalAction, false);
      assert.equal(first.dryRun, true);
      assert.equal(first.receipt.status, 'dry-run');
      assert.equal(first.receipt.externalAction, false);
      assert.equal(first.receipt.platform, adapter.id);
      assert.ok(first.receipt.receiptId.startsWith(`${adapter.id}:dry-run:${operation}:`));
      assert.match(first.message, /No external platform request was made/);
      // A real receipt would carry a remote identifier/token; a dry run must not.
      assert.equal('remoteId' in first.receipt, false);
      assert.equal('accessToken' in first.receipt, false);
      assert.deepEqual(Object.keys(first.receipt).sort(), ['externalAction', 'platform', 'receiptId', 'status']);
    }
  }
});

test('malformed read and social input is rejected without dispatching an action', async () => {
  for (const { adapter } of adapters) {
    await assert.rejects(adapter.execute('read', {}), /CORE_PLATFORM_INPUT/);
    await assert.rejects(adapter.execute('read', null), /CORE_PLATFORM_INPUT/);
    await assert.rejects(adapter.execute('read', 'robot-demo'), /CORE_PLATFORM_INPUT/);
    await assert.rejects(adapter.execute('read', { id: '' }), /CORE_PLATFORM_INPUT/);
    await assert.rejects(adapter.execute('read', { id: 'x'.repeat(129) }), /CORE_PLATFORM_INPUT/);
    await assert.rejects(adapter.execute('search', { query: '' }), /CORE_PLATFORM_INPUT/);
    await assert.rejects(adapter.execute('search', { query: 'x'.repeat(513) }), /CORE_PLATFORM_INPUT/);
    await assert.rejects(adapter.execute('comments', { id: 'robot-demo', limit: 0 }), /CORE_PLATFORM_INPUT/);
    await assert.rejects(adapter.execute('comments', { id: 'robot-demo', limit: 51 }), /CORE_PLATFORM_INPUT/);

    await assert.rejects(adapter.execute('like', {}), /CORE_PLATFORM_INPUT/);
    await assert.rejects(adapter.execute('favorite', { id: 7 }), /CORE_PLATFORM_INPUT/);
    await assert.rejects(adapter.execute('comment', { id: 'robot-demo' }), /CORE_PLATFORM_INPUT/);
    await assert.rejects(adapter.execute('comment', { id: 'robot-demo', text: '   ' }), /CORE_PLATFORM_INPUT/);
    await assert.rejects(adapter.execute('reply', { text: 'reply without target' }), /CORE_PLATFORM_INPUT/);
    await assert.rejects(adapter.execute('follow', {}), /CORE_PLATFORM_INPUT/);
    await assert.rejects(adapter.execute('message', { target: 'simulation-bilibili:user:robot-fan' }), /CORE_PLATFORM_INPUT/);
    await assert.rejects(adapter.execute('publish', {}), /CORE_PLATFORM_INPUT/);
    await assert.rejects(adapter.execute('publish', { text: 'x'.repeat(5001) }), /CORE_PLATFORM_INPUT/);
    await assert.rejects(adapter.execute('message', { target: 'x'.repeat(129), text: 'hello' }), /CORE_PLATFORM_INPUT/);
  }
});

test('unsupported operations are rejected instead of silently succeeding', async () => {
  for (const { adapter } of adapters) {
    await assert.rejects(adapter.execute('delete', { id: 'robot-demo' }), /CORE_PLATFORM_UNSUPPORTED/);
    await assert.rejects(adapter.execute('write', { id: 'robot-demo', text: 'x' }), /CORE_PLATFORM_UNSUPPORTED/);
    await assert.rejects(adapter.execute('login', {}), /CORE_PLATFORM_UNSUPPORTED/);
    await assert.rejects(adapter.execute(undefined, {}), /CORE_PLATFORM_UNSUPPORTED/);
  }
  await assert.rejects(xhs.execute('subtitles', { id: 'robot-demo' }), /CORE_PLATFORM_UNSUPPORTED/);
  await assert.rejects(bili.execute('images', { id: 'robot-demo' }), /CORE_PLATFORM_UNSUPPORTED/);
});

test('aborted executions do not return observations or dry-run receipts', async () => {
  const controller = new AbortController();
  controller.abort(Error('CORE_ACTIVITY_STOPPED'));
  for (const { adapter } of adapters) {
    await assert.rejects(adapter.execute('read', { id: 'robot-demo' }, { signal: controller.signal }), /CORE_ACTIVITY_STOPPED/);
    await assert.rejects(adapter.execute('like', { id: 'robot-demo' }, { signal: controller.signal }), /CORE_ACTIVITY_STOPPED/);
  }
});
