// Deterministic, offline-only mock platform adapters. Every record below is
// synthetic. These adapters never open a socket, read credentials, start a
// timer, touch a database or perform an external social action.

const PLATFORM = Object.freeze({
  bilibili: 'simulation-bilibili',
  xiaohongshu: 'simulation-xiaohongshu',
});

const READ_OPERATIONS = new Set(['browse', 'search', 'read', 'comments', 'related', 'subtitles', 'images']);

// Social operations are dry runs. The shape of the required input differs per
// operation; no operation is ever forwarded outside this module.
const SOCIAL_INPUT = Object.freeze({
  like: ['id'],
  favorite: ['id'],
  comment: ['id', 'text'],
  reply: ['target', 'text'],
  follow: ['target'],
  message: ['target', 'text'],
  publish: ['text'],
});
const SOCIAL_CAPABILITIES = Object.freeze(Object.keys(SOCIAL_INPUT));

const INPUT_LIMITS = Object.freeze({ id: 128, target: 128, text: 2000, publishText: 5000, query: 512, limit: 50 });

function fail(code) {
  throw Error(code);
}

function qualifiedUser(platform, local) {
  // The same local string is deliberately reused on both platforms. Prefixing
  // it keeps the two identities distinct across platforms.
  return `${platform}:user:${local}`;
}

function validId(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= INPUT_LIMITS.id;
}

function validText(value, max = INPUT_LIMITS.text) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

function validLimit(value) {
  return value === undefined || (Number.isSafeInteger(value) && value >= 1 && value <= INPUT_LIMITS.limit);
}

function envelope(platform, value) {
  return { platform, evidenceLevel: 'simulation', externalAction: false, ...value };
}

function summary(item) {
  return {
    id: item.id,
    type: item.type,
    platform: item.platform,
    title: item.title,
    author: item.author,
    tags: [...item.tags],
  };
}

function checkAbort(signal) {
  if (signal?.aborted) signal.throwIfAborted();
}

function requireReadInput(operation, input) {
  if (operation === 'search') {
    if (typeof input.query !== 'string' || !input.query.trim() || input.query.length > INPUT_LIMITS.query) {
      fail('CORE_PLATFORM_INPUT');
    }
    return;
  }
  if (operation === 'browse') return;
  if (!validId(input.id)) fail('CORE_PLATFORM_INPUT');
}

function requireSocialInput(operation, input) {
  const required = SOCIAL_INPUT[operation];
  if (required.includes('id') && !validId(input.id)) fail('CORE_PLATFORM_INPUT');
  if (required.includes('target') && !validId(input.target)) fail('CORE_PLATFORM_INPUT');
  if (required.includes('text')) {
    const max = operation === 'publish' ? INPUT_LIMITS.publishText : INPUT_LIMITS.text;
    if (!validText(input.text, max)) fail('CORE_PLATFORM_INPUT');
  }
}

function socialResult(platform, operation, input) {
  const target = input.id ?? input.target ?? null;
  return envelope(platform, {
    operation,
    dryRun: true,
    target,
    receipt: {
      receiptId: `${platform}:dry-run:${operation}:${target ?? 'new-content'}`,
      status: 'dry-run',
      platform,
      externalAction: false,
    },
    message: 'Synthetic dry run only. No external platform request was made.',
  });
}

function buildBilibili() {
  const platform = PLATFORM.bilibili;
  const user = (local) => qualifiedUser(platform, local);
  const videos = [
    {
      id: 'robot-demo',
      type: 'video',
      platform,
      title: 'Synthetic robot demonstration',
      author: user('robot-lab'),
      tags: ['robot', 'synthetic', 'demo'],
      description: 'Synthetic fixture about a robot sorting colored blocks. No real video was accessed.',
      durationSeconds: 32,
      subtitles: [
        { startSeconds: 0, endSeconds: 4, text: '[synthetic subtitle] The robot scans a colored block.', synthetic: true },
        { startSeconds: 4, endSeconds: 8, text: '[synthetic subtitle] The robot places it in the matching bin.', synthetic: true },
      ],
      keyframes: [
        { atSeconds: 1, description: '[synthetic keyframe placeholder] Robot arm above a green block.', synthetic: true, analysis: 'placeholder-not-vision' },
        { atSeconds: 6, description: '[synthetic keyframe placeholder] Green block resting in a bin.', synthetic: true, analysis: 'placeholder-not-vision' },
      ],
      comments: [
        { id: 'bili-comment-1', author: user('same-local'), text: 'Synthetic comment about the block sorter.', synthetic: true },
        { id: 'bili-comment-2', author: user('robot-fan'), text: 'Synthetic comment noting the slow arm movement.', synthetic: true },
      ],
      relatedIds: ['robot-faq'],
    },
    {
      id: 'robot-faq',
      type: 'video',
      platform,
      title: 'Synthetic robot FAQ',
      author: user('robot-lab'),
      tags: ['robot', 'faq', 'synthetic'],
      description: 'Synthetic fixture answering common questions about the demo robot.',
      durationSeconds: 18,
      subtitles: [
        { startSeconds: 0, endSeconds: 5, text: '[synthetic subtitle] This FAQ is entirely generated fixture text.', synthetic: true },
      ],
      keyframes: [
        { atSeconds: 2, description: '[synthetic keyframe placeholder] A labeled question card.', synthetic: true, analysis: 'placeholder-not-vision' },
      ],
      comments: [
        { id: 'bili-comment-3', author: user('same-local'), text: 'Synthetic FAQ comment from a shared local name.', synthetic: true },
      ],
      relatedIds: ['robot-demo'],
    },
  ];

  return { platform, videos };
}

function buildXiaohongshu() {
  const platform = PLATFORM.xiaohongshu;
  const user = (local) => qualifiedUser(platform, local);
  const notes = [
    {
      id: 'robot-demo',
      type: 'note',
      platform,
      title: 'Synthetic robot demo note',
      author: user('robot-lab'),
      tags: ['robot', 'synthetic', 'note'],
      description: 'Synthetic note about a robot sorting colored blocks. No real note was accessed.',
      images: [
        { id: 'xhs-image-1', description: '[synthetic image description] A robot arm hovers over three colored bins.', synthetic: true, analysis: 'description-only-no-vision' },
        { id: 'xhs-image-2', description: '[synthetic image description] A green block sits in the matching bin.', synthetic: true, analysis: 'description-only-no-vision' },
      ],
      comments: [
        { id: 'xhs-comment-1', author: user('same-local'), text: 'Synthetic note comment from a shared local name.', synthetic: true },
        { id: 'xhs-comment-2', author: user('robot-fan'), text: 'Synthetic note comment about the image framing.', synthetic: true },
      ],
      relatedIds: ['robot-garden'],
    },
    {
      id: 'robot-garden',
      type: 'note',
      platform,
      title: 'Synthetic robot garden note',
      author: user('garden-lab'),
      tags: ['robot', 'garden', 'synthetic'],
      description: 'Synthetic note about a toy robot watering a planter.',
      images: [
        { id: 'xhs-image-3', description: '[synthetic image description] A toy robot beside a small planter.', synthetic: true, analysis: 'description-only-no-vision' },
      ],
      comments: [
        { id: 'xhs-comment-3', author: user('same-local'), text: 'Synthetic garden comment from a shared local name.', synthetic: true },
      ],
      relatedIds: ['robot-demo'],
    },
  ];

  return { platform, notes };
}

function makeReadOperations({ platform, items }) {
  const byId = new Map(items.map((item) => [item.id, item]));

  function requireKnown(id) {
    return byId.get(id) ?? null;
  }

  return {
    browse(input) {
      return envelope(platform, { operation: 'browse', items: items.map(summary), count: items.length });
    },
    search(input) {
      const query = input.query.trim().toLowerCase();
      const matches = items.filter((item) =>
        [item.id, item.title, item.description, ...item.tags].some((field) => field.toLowerCase().includes(query)));
      return envelope(platform, { operation: 'search', query: input.query, items: matches.map(summary), count: matches.length });
    },
    read(input) {
      const item = requireKnown(input.id);
      if (!item) return null;
      return envelope(platform, { operation: 'read', item: structuredClone(item) });
    },
    comments(input) {
      const item = requireKnown(input.id);
      if (!item) return null;
      const limit = input.limit ?? 10;
      // Items in this module all carry comments, but keep the shape tolerant of
      // future synthetic fixtures without comments.
      const comments = (item.comments ?? []).slice(0, limit).map((comment) => structuredClone(comment));
      return envelope(platform, { operation: 'comments', contentId: item.id, comments, count: comments.length });
    },
    related(input) {
      const item = requireKnown(input.id);
      if (!item) return null;
      const limit = input.limit ?? 10;
      const related = (item.relatedIds ?? [])
        .slice(0, limit)
        .map((id) => byId.get(id))
        .filter(Boolean)
        .map(summary);
      return envelope(platform, { operation: 'related', contentId: item.id, items: related, count: related.length });
    },
  };
}

function makeAdapter({ platform, items, extraOperations, extraCapabilities }) {
  const reads = makeReadOperations({ platform, items });
  const capabilities = Object.freeze([
    'browse', 'search', 'read', 'comments', 'related', ...extraCapabilities, ...SOCIAL_CAPABILITIES,
  ]);

  const execute = async (operation, rawInput = {}, { signal } = {}) => {
    checkAbort(signal);
    if (typeof operation !== 'string') fail('CORE_PLATFORM_UNSUPPORTED');
    const input = rawInput !== null && typeof rawInput === 'object' && !Array.isArray(rawInput) ? rawInput : null;

    if (Object.hasOwn(SOCIAL_INPUT, operation)) {
      if (!input) fail('CORE_PLATFORM_INPUT');
      requireSocialInput(operation, input);
      checkAbort(signal);
      return socialResult(platform, operation, input);
    }

    const handler = Object.hasOwn(extraOperations, operation) ? extraOperations[operation] : reads[operation];
    if (typeof handler !== 'function' || !READ_OPERATIONS.has(operation)) fail('CORE_PLATFORM_UNSUPPORTED');
    if (!input) fail('CORE_PLATFORM_INPUT');

    requireReadInput(operation, input);
    if (operation === 'comments' || operation === 'related') {
      if (!validLimit(input.limit)) fail('CORE_PLATFORM_INPUT');
    }
    checkAbort(signal);
    return handler(input);
  };

  return Object.freeze({
    id: platform,
    contractVersion: 1,
    simulated: true,
    capabilities,
    execute,
  });
}

export function makeBilibiliMock() {
  const { platform, videos } = buildBilibili();
  const byId = new Map(videos.map((video) => [video.id, video]));
  const extraOperations = {
    subtitles(input) {
      const video = byId.get(input.id);
      if (!video) return null;
      return envelope(platform, {
        operation: 'subtitles',
        contentId: video.id,
        tracks: structuredClone(video.subtitles),
        keyframes: structuredClone(video.keyframes),
      });
    },
  };
  return makeAdapter({ platform, items: videos, extraOperations, extraCapabilities: ['subtitles'] });
}

export function makeXiaohongshuMock() {
  const { platform, notes } = buildXiaohongshu();
  const byId = new Map(notes.map((note) => [note.id, note]));
  const extraOperations = {
    images(input) {
      const note = byId.get(input.id);
      if (!note) return null;
      return envelope(platform, {
        operation: 'images',
        contentId: note.id,
        images: structuredClone(note.images),
        visionAnalysis: 'not-performed-synthetic-descriptions-only',
      });
    },
  };
  return makeAdapter({ platform, items: notes, extraOperations, extraCapabilities: ['images'] });
}
