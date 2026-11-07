import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/client/panel.js', import.meta.url), 'utf8');
const start = source.indexOf('function renderModuleTab');
const end = source.indexOf('\nfunction CorePanel', start);
const renderModuleTab = vm.runInNewContext(`${source.slice(start, end)}\nrenderModuleTab`);
const h = (type, props, ...children) => ({ type, props, children });
const t = zh => zh;
const status = { modules: { memory: { mounted: true }, state: { mounted: true }, life: { mounted: true } } };

test('Core preserves native Memory and State views while adding the Life summary', () => {
  const views = {
    memory: () => ({ type: 'MnemeMemoryView' }),
    state: () => ({ type: 'AmadeusStateView' }),
    life: () => ({ type: 'AmadeusLifeView' }),
  };
  assert.equal(renderModuleTab({ tab: 'memory', status, views, lifeSummary: null, t, h }).type, 'MnemeMemoryView');
  assert.equal(renderModuleTab({ tab: 'state', status, views, lifeSummary: null, t, h }).type, 'AmadeusStateView');
  const life = renderModuleTab({
    tab: 'life',
    status,
    views,
    t,
    h,
    lifeSummary: {
      life: { nextReviewAt: '2026-11-07T10:00:00.000Z', currentActivity: null },
      state: { interests: [{ name: 'astronomy' }] },
      recentExperience: { summary: 'stored fact' },
      errors: [],
    },
  });
  assert.equal(life.type, 'div');
  assert.equal(life.children[0].type, 'AmadeusLifeView');
  assert.match(JSON.stringify(life), /stored fact/);
});

test('Core module routes fail closed when a module is not mounted', () => {
  const result = renderModuleTab({
    tab: 'memory',
    status: { modules: { memory: { mounted: false } } },
    views: { memory: () => ({ type: 'should-not-render' }) },
    lifeSummary: null,
    t,
    h,
  });
  assert.equal(result.type, 'div');
  assert.match(JSON.stringify(result), /请先选择工作区/);
});

