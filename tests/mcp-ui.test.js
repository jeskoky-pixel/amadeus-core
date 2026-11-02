import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/client/mcp-panel.js', import.meta.url), 'utf8');

function h(type, props, ...children) {
  return { type, props: props ?? {}, children: children.flat(Infinity) };
}

function walk(node, visit) {
  if (node == null || typeof node === 'boolean') return;
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
    return;
  }
  if (typeof node === 'string' || typeof node === 'number') return;
  visit(node);
  for (const child of node.children) walk(child, visit);
}

function textOf(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return textOf(node.children);
}

function find(tree, predicate) {
  const matches = [];
  walk(tree, (node) => {
    if (predicate(node)) matches.push(node);
  });
  return matches;
}

function buttonByText(tree, label) {
  return find(tree, (node) => node.type === 'button' && textOf(node).includes(label))[0];
}

function mount(locale) {
  const states = [];
  let cursor = 0;
  const useState = (initial) => {
    const index = cursor++;
    if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
    return [states[index], (next) => {
      states[index] = typeof next === 'function' ? next(states[index]) : next;
    }];
  };
  const factory = new Function('h', 'useState', 'api', 'window', 'structuredClone', `${source}\nreturn McpPanel;`);
  const Component = factory(h, useState, async () => ({}), { confirm: () => true }, globalThis.structuredClone);
  const t = (zh, en) => (locale === 'zh' ? zh : en);
  const props = { state: { revision: 0, servers: [] }, sessions: [], refresh: async () => {}, t };
  return () => {
    cursor = 0;
    return Component(props);
  };
}

test('source keeps default grants closed and carries bilingual grant and catalog clarifications', () => {
  assert.match(source, /const blank=\(\)=>\(\{[^}]*enabled:false[^}]*sessionIds:\[\][^}]*sessionTypes:\[\][^}]*tools:\{\}/);
  for (const phrase of [
    'mcp-grant-warning',
    'qq-group / qq-private',
    'ALL trusted Sessions',
    'including future verified members',
    'qq-private is NOT Owner-only',
    'OR with type',
    'removing a specific Session alone cannot revoke a type grant',
    'No grants are applied by default and all tools stay disabled',
    '所有可信会话',
    '未来通过验证',
    '并非仅限 Owner',
    '“或”关系',
    '仅移除具体会话不能撤销类型授权',
    '默认不授予任何权限',
    '所有工具保持关闭',
    'mcp-catalog-note',
    'Basic reference catalog',
    'not the full hosted MCP market',
    'one official filesystem reference service',
    'not preinstalled or deployed',
    '基础参考目录',
    '不是完整的托管 MCP 市场',
    '一个官方文件系统参考服务',
    '尚未预装或部署',
  ]) {
    assert.ok(source.includes(phrase), `source must contain ${phrase}`);
  }
});

test('rendered grant warning describes bulk type grants and the new draft has no grants or tools enabled', () => {
  const expectations = {
    en: [
      'qq-group / qq-private',
      'ALL trusted Sessions',
      'including future verified members',
      'qq-private is NOT Owner-only',
      'OR with type',
      'removing a specific Session alone cannot revoke a type grant',
      'No grants are applied by default',
      'all tools stay disabled',
    ],
    zh: [
      'qq-group / qq-private',
      '所有可信会话',
      '未来通过验证',
      '并非仅限 Owner',
      '“或”关系',
      '仅移除具体会话不能撤销类型授权',
      '默认不授予任何权限',
      '所有工具保持关闭',
    ],
  };
  for (const locale of ['en', 'zh']) {
    const render = mount(locale);
    let tree = render();
    const add = buttonByText(tree, locale === 'en' ? 'Add custom MCP' : '添加自定义 MCP');
    assert.ok(add, `${locale}: add button rendered`);
    add.props.onClick();
    tree = render();

    const warning = find(tree, (node) => node.props?.className === 'mcp-grant-warning')[0];
    assert.ok(warning, `${locale}: authorization warning is visible`);
    assert.equal(warning.props.role, 'note');
    const rendered = textOf(warning);
    for (const phrase of expectations[locale]) {
      assert.ok(rendered.includes(phrase), `${locale}: warning must contain ${phrase}`);
    }

    const checkboxes = find(tree, (node) => node.type === 'input' && node.props?.type === 'checkbox');
    assert.equal(checkboxes.length, 4, `${locale}: connection and three type controls render`);
    assert.ok(checkboxes.every((node) => node.props.checked === false), `${locale}: every grant defaults to unchecked`);
    assert.ok(!textOf(tree).includes(locale === 'en' ? 'Authorize this tool' : '授权此工具'), `${locale}: no tool is enabled before discovery`);
  }
});

test('catalog is labeled as a basic reference catalog with one undeployed filesystem reference', () => {
  const expectations = {
    en: ['Basic reference catalog', 'not the full hosted MCP market', 'one official filesystem reference service', 'not preinstalled or deployed'],
    zh: ['基础参考目录', '不是完整的托管 MCP 市场', '一个官方文件系统参考服务', '尚未预装或部署'],
  };
  for (const locale of ['en', 'zh']) {
    const render = mount(locale);
    let tree = render();
    const catalog = buttonByText(tree, locale === 'en' ? 'Catalog' : '服务目录');
    assert.ok(catalog, `${locale}: catalog tab rendered`);
    catalog.props.onClick();
    tree = render();

    const note = find(tree, (node) => node.props?.className === 'mcp-catalog-note')[0];
    assert.ok(note, `${locale}: catalog note is visible`);
    const rendered = textOf(note);
    for (const phrase of expectations[locale]) {
      assert.ok(rendered.includes(phrase), `${locale}: catalog note must contain ${phrase}`);
    }

    const configure = find(tree, (node) => node.type === 'button' &&
      textOf(node).includes(locale === 'en' ? 'Configure local service (not deployed)' : '配置本地服务（未部署）'));
    assert.equal(configure.length, 1, `${locale}: exactly one undeployed filesystem reference is listed`);
    const links = find(tree, (node) => node.type === 'a');
    assert.equal(links.length, 1, `${locale}: exactly one reference source link is listed`);
  }
});
