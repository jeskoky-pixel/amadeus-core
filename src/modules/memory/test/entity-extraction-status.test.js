import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/store.js";
import { createService } from "../src/service.js";

// User-visible entity extraction state. The service owns the only truthful
// source: the switch that selected the boot-time hook, whether that hook was
// actually installed, how many passes are queued/in flight, and the last
// *extraction* outcome (not the LLM stream's success audit row).
function make(enabled = true, logger = undefined) {
  const store = createStore(":memory:");
  const service = createService({ store, mirror: null, config: { entityExtractionEnabled: enabled }, logger });
  return { store, service };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test("disabled extraction reports off and never calls the hook", () => {
  const { store, service } = make(false);
  let calls = 0;
  service.setEntityExtractor(() => { calls++; return Promise.resolve({ ok: true }); });
  service.saveWithDedupe({ type: "project", title: "off", content: "nothing should run" });
  const status = service.getEntityExtractionStatus();
  assert.equal(status.enabled, false);
  assert.equal(status.installed, true);
  assert.equal(status.pending, 0);
  assert.equal(status.last, null);
  assert.equal(calls, 0, "a disabled switch must not invoke the hook");
  store.close();
});

test("enabled without an installed hook is a restart-pending signal", () => {
  const { store, service } = make(true);
  const status = service.getEntityExtractionStatus();
  assert.equal(status.enabled, true);
  assert.equal(status.installed, false, "the switch alone does not install the hook");
  assert.equal(status.pending, 0);
  assert.equal(status.last, null);
  store.close();
});

test("in-flight extraction counts as pending, and success records entity counts", async () => {
  const { store, service } = make(true);
  let resolve;
  service.setEntityExtractor(() => new Promise((done) => { resolve = done; }));
  const saved = service.saveWithDedupe({ type: "project", title: "inflight", content: "Alpha works with Beta" });
  assert.ok(saved.memory.id);
  let status = service.getEntityExtractionStatus();
  assert.equal(status.pending, 1, "the active pass is visible while it runs");
  assert.equal(status.last, null);

  resolve({ ok: true, entities: [{ name: "Alpha" }], attrs: [{ id: "a" }], relations: [{ id: "r" }] });
  await settle();
  status = service.getEntityExtractionStatus();
  assert.equal(status.pending, 0);
  assert.equal(status.last.ok, true);
  assert.equal(status.last.code, "ok");
  assert.equal(status.last.entities, 1);
  assert.equal(status.last.attrs, 1);
  assert.equal(status.last.relations, 1);
  assert.ok(!Number.isNaN(Date.parse(status.last.at)), "last outcome carries an ISO timestamp");
  store.close();
});

test("parse failure is a failed extraction, not an LLM success", async () => {
  const { store, service } = make(true);
  service.setEntityExtractor(async () => ({ ok: false, error: "Failed to parse JSON from LLM response" }));
  service.saveWithDedupe({ type: "project", title: "bad-json", content: "secret body sk-live-should-not-leak" });
  await settle();
  const status = service.getEntityExtractionStatus();
  assert.equal(status.last.ok, false);
  assert.equal(status.last.code, "parse_failed");
  assert.ok(!("error" in status.last), "raw extractor errors are not exposed");
  assert.doesNotMatch(JSON.stringify(status), /sk-live|secret body/, "status must not leak memory content or credentials");
  store.close();
});

test("rejected and thrown hooks record a safe failure code without raw messages", async () => {
  const { store, service } = make(true);
  service.setEntityExtractor(() => Promise.reject(new Error("provider 429 Bearer sk-live-secret")));
  service.saveWithDedupe({ type: "project", title: "reject", content: "x" });
  await settle();
  let status = service.getEntityExtractionStatus();
  assert.equal(status.last.ok, false);
  assert.equal(status.last.code, "llm_failed");
  assert.doesNotMatch(JSON.stringify(status), /sk-live-secret|Bearer/, "credentials never reach the UI status");

  service.setEntityExtractor(() => { throw new Error("sync boom sk-live-secret"); });
  service.saveWithDedupe({ type: "project", title: "throw", content: "y" });
  status = service.getEntityExtractionStatus();
  assert.equal(status.last.ok, false);
  assert.equal(status.pending, 0);
  assert.doesNotMatch(JSON.stringify(status), /sk-live-secret/, "synchronous failures are sanitized too");
  store.close();
});

test("a throwing logger cannot strand pending or turn the failure into an unhandled rejection", async () => {
  const logger = { warn() { throw new Error("logger boom"); } };
  const { store, service } = make(true, logger);

  service.setEntityExtractor(() => Promise.reject(new Error("provider 429 Bearer sk-live-secret")));
  service.saveWithDedupe({ type: "project", title: "logger-reject", content: "x" });
  await settle();
  let status = service.getEntityExtractionStatus();
  assert.equal(status.pending, 0, "settlement must run even when logger.warn throws");
  assert.equal(status.last.ok, false);
  assert.equal(status.last.code, "llm_failed");
  assert.doesNotMatch(JSON.stringify(status), /sk-live-secret|logger boom|Bearer/);

  service.setEntityExtractor(() => { throw new Error("sync boom sk-live-secret"); });
  service.saveWithDedupe({ type: "project", title: "logger-throw", content: "y" });
  status = service.getEntityExtractionStatus();
  assert.equal(status.pending, 0, "synchronous failures settle through a throwing logger too");
  assert.equal(status.last.ok, false);
  assert.equal(status.last.code, "failed");
  store.close();
});

test("transaction queue is reported while committed work drains to the hook", async () => {
  const { store, service } = make(true);
  let calls = 0;
  service.setEntityExtractor(() => { calls++; return Promise.resolve({ ok: true, entities: [], attrs: [], relations: [] }); });
  let inside;
  service.transaction(() => {
    service.saveWithDedupe({ type: "project", title: "queued", content: "tx" });
    inside = service.getEntityExtractionStatus();
  });
  assert.equal(inside.pending, 1, "queued work is visible before commit");
  await settle();
  const after = service.getEntityExtractionStatus();
  assert.equal(after.pending, 0);
  assert.equal(after.last.ok, true);
  assert.equal(calls, 1, "the committed entry ran exactly once");
  store.close();
});
