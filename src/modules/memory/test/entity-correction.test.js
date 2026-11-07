import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/store.js";
import { createService } from "../src/service.js";

// Owner panel corrections go through compareAndUpdate (CAS). A successful CAS
// that changes the semantic text must feed the normal entity extraction path,
// exactly like a normal save; a miss, a non-semantic patch, a disabled switch,
// a failed write or a rolled-back transaction must not.
function make(enabled = true) {
  const store = createStore(":memory:");
  const service = createService({ store, mirror: null, config: { entityExtractionEnabled: enabled } });
  return { store, service };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function seed(service) {
  return service.saveWithDedupe({
    type: "project", title: "颜色事实", content: "当前颜色是红色", source: "manual"
  }).memory;
}

test("successful CAS with changed content runs existing extraction on the updated row", async () => {
  const { store, service } = make(true);
  const before = seed(service);
  const seen = [];
  service.setEntityExtractor((memory) => {
    seen.push(memory);
    return Promise.resolve({ ok: true, entities: [{ name: "蓝色" }], attrs: [], relations: [] });
  });

  const updated = service.compareAndUpdate(before.id, before.updated_at, { content: "当前颜色是蓝色" });
  assert.ok(updated);
  assert.equal(updated.content, "当前颜色是蓝色");
  await settle();

  assert.equal(seen.length, 1, "a semantic CAS must invoke the normal extractor exactly once");
  assert.equal(seen[0].id, before.id);
  assert.equal(seen[0].content, "当前颜色是蓝色", "the extractor receives the new body, not the pre-CAS row");
  assert.equal(seen[0].source, before.source, "provenance is preserved on the row passed to the hook");
  const status = service.getEntityExtractionStatus();
  assert.equal(status.last?.ok, true);
  assert.equal(status.pending, 0);
  store.close();
});

test("CAS miss, missing row and non-semantic patches never extract", async () => {
  const { store, service } = make(true);
  const before = seed(service);
  let calls = 0;
  service.setEntityExtractor(() => { calls++; return Promise.resolve({ ok: true }); });

  assert.equal(service.compareAndUpdate(before.id, "stale-updated-at", { content: "不会写入" }), undefined);
  assert.throws(() => service.compareAndUpdate("missing", before.updated_at, { content: "x" }), /not found/);

  const importanceOnly = service.compareAndUpdate(before.id, before.updated_at, { importance: 5 });
  assert.ok(importanceOnly);
  const afterImportance = service.getById(before.id);
  const tagsOnly = service.compareAndUpdate(before.id, afterImportance.updated_at, { tags: ["synthetic"] });
  assert.ok(tagsOnly);
  await settle();

  assert.equal(calls, 0, "misses, thrown writes, importance-only and tag-only CAS must not extract");
  assert.equal(service.getById(before.id).content, before.content);
  store.close();
});

test("disabled extraction never extracts after a successful CAS", async () => {
  const { store, service } = make(false);
  const before = seed(service);
  let calls = 0;
  service.setEntityExtractor(() => { calls++; return Promise.resolve({ ok: true }); });

  const updated = service.compareAndUpdate(before.id, before.updated_at, { content: "当前颜色是绿色" });
  assert.ok(updated);
  await settle();
  assert.equal(calls, 0);
  assert.equal(service.getEntityExtractionStatus().last, null);
  store.close();
});

test("rolled-back CAS never extracts the rolled-back body", async () => {
  const { store, service } = make(true);
  const before = seed(service);
  let calls = 0;
  service.setEntityExtractor(() => { calls++; return Promise.resolve({ ok: true }); });

  assert.throws(() => service.transaction(() => {
    service.compareAndUpdate(before.id, before.updated_at, { content: "事务内新颜色" });
    throw new Error("rollback");
  }), /rollback/);
  await settle();

  assert.equal(calls, 0, "a rolled-back CAS must not extract");
  assert.equal(service.getById(before.id).content, before.content);
  assert.equal(service.getEntityExtractionStatus().last, null);
  store.close();
});

// The ordinary model memory_update path is updateMemory(), not CAS. A real
// content/title correction must feed the same extraction queue; metadata-only
// edits, missing rows, a disabled switch and rolled-back writes must not.
test("service.update with changed content runs existing extraction on the updated row", async () => {
  const { store, service } = make(true);
  const before = seed(service);
  const seen = [];
  service.setEntityExtractor((memory) => {
    seen.push(memory);
    return Promise.resolve({ ok: true, entities: [{ name: "蓝色" }], attrs: [], relations: [] });
  });

  const updated = service.update(before.id, { content: "当前颜色是蓝色" });
  assert.ok(updated);
  await settle();

  assert.equal(seen.length, 1, "a semantic update must invoke the normal extractor exactly once");
  assert.equal(seen[0].id, before.id);
  assert.equal(seen[0].content, "当前颜色是蓝色", "the extractor receives the updated body");
  assert.equal(seen[0].source, before.source, "provenance is preserved on the row passed to the hook");
  assert.equal(service.getEntityExtractionStatus().last?.ok, true);
  store.close();
});

test("service.update title-only correction also uses the extraction queue", async () => {
  const { store, service } = make(true);
  const before = seed(service);
  const seen = [];
  service.setEntityExtractor((memory) => {
    seen.push(memory);
    return Promise.resolve({ ok: true, entities: [], attrs: [], relations: [] });
  });

  const updated = service.update(before.id, { title: "颜色事实（修正）" });
  assert.ok(updated);
  await settle();
  assert.equal(seen.length, 1);
  assert.equal(seen[0].title, "颜色事实（修正）");
  store.close();
});

test("service.update metadata-only and unchanged-body patches never extract", async () => {
  const { store, service } = make(true);
  const before = seed(service);
  let calls = 0;
  service.setEntityExtractor(() => { calls++; return Promise.resolve({ ok: true }); });

  assert.ok(service.update(before.id, { importance: 5 }));
  const afterImportance = service.getById(before.id);
  assert.ok(service.update(before.id, { tags: ["synthetic"] }));
  assert.ok(service.update(before.id, { content: afterImportance.content }));
  await settle();

  assert.equal(calls, 0, "importance, tag-only and unchanged-body updates must not extract");
  store.close();
});

test("service.update missing row, disabled switch and rollback never extract", async () => {
  const { store, service } = make(true);
  const before = seed(service);
  let calls = 0;
  service.setEntityExtractor(() => { calls++; return Promise.resolve({ ok: true }); });

  assert.throws(() => service.update("missing", { content: "x" }), /not found/);
  await settle();
  assert.equal(calls, 0, "a missing row cannot reach extraction");

  assert.throws(() => service.transaction(() => {
    service.update(before.id, { content: "事务内颜色" });
    throw new Error("rollback");
  }), /rollback/);
  await settle();
  assert.equal(calls, 0, "a rolled-back update must not extract");
  assert.equal(service.getById(before.id).content, before.content);
  store.close();

  const off = make(false);
  const offSeed = seed(off.service);
  let offCalls = 0;
  off.service.setEntityExtractor(() => { offCalls++; return Promise.resolve({ ok: true }); });
  const updated = off.service.update(offSeed.id, { content: "禁用时的新颜色" });
  assert.ok(updated);
  await settle();
  assert.equal(offCalls, 0, "a disabled switch must not extract");
  assert.equal(off.service.getEntityExtractionStatus().last, null);
  off.store.close();
});

