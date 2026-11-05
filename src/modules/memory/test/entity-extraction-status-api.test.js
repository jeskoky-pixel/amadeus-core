import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createStore } from "../src/store.js";
import { createService } from "../src/service.js";
import { createApi } from "../src/api.js";
import { createSettings } from "../src/settings.js";

// /entities is the existing protected directory surface. It may report safe
// extraction metadata to the owner UI, but entity rows keep their legacy shape
// and no memory content/credential can ride along.
class FakeRes extends EventEmitter {
  constructor() { super(); this.statusCode = 200; this.body = ""; }
  writeHead(code, headers) { this.statusCode = code; this.headers = headers; return this; }
  end(text) { this.body = text ?? ""; this.emit("end"); return this; }
}

function req(path, method = "GET") {
  const r = new EventEmitter();
  r.url = path;
  r.method = method;
  r.headers = {};
  return r;
}

function setup(config = {}) {
  const store = createStore(":memory:");
  const service = createService({ store, mirror: null, config });
  const settings = createSettings(store.db);
  const commands = { add: () => {}, remove: () => {}, list: () => [] };
  const routes = [];
  const ctx = { webServer: { register(route) { routes.push(route); return () => {}; } } };
  createApi(ctx, service, settings, commands, null, undefined, "", config);
  const route = routes.find((r) => r.path === "/api/dsh-mneme/entities");
  return { store, service, settings, route };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test("entities response reports the live switch and the installed hook separately", async () => {
  const { store, service, settings, route } = setup({ entityExtractionEnabled: false });
  settings.setFeatureFlags({ entityExtractionEnabled: true });
  const res = new FakeRes();
  await route.handler(req("/api/dsh-mneme/entities"), res);
  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.deepEqual(data.entities, []);
  assert.equal(data.status.enabled, true, "the panel's saved switch is visible before reload");
  assert.equal(data.status.runtimeEnabled, false, "the boot-time runtime still has extraction off");
  assert.equal(data.status.installed, false, "boot-time hook is not installed yet");
  assert.equal(data.status.pending, 0);
  assert.equal(data.status.last, null);
  store.close();
});

test("entities response exposes the last real extraction outcome, including parse failure", async () => {
  const { store, service, route } = setup({ entityExtractionEnabled: true });
  service.setEntityExtractor(async () => ({ ok: true, entities: [{ name: "SQLite" }], attrs: [], relations: [] }));
  service.setEntityExtractor(async () => ({ ok: false, error: "Failed to parse JSON from LLM response" }));
  service.saveWithDedupe({ type: "project", title: "parse-fail", content: "content sk-live-secret" });
  await settle();

  const res = new FakeRes();
  await route.handler(req("/api/dsh-mneme/entities?limit=10"), res);
  const data = JSON.parse(res.body);
  assert.equal(data.status.enabled, true);
  assert.equal(data.status.installed, true);
  assert.equal(data.status.last.ok, false);
  assert.equal(data.status.last.code, "parse_failed");
  assert.doesNotMatch(res.body, /sk-live-secret|Failed to parse JSON/, "only a safe code is exposed");
  store.close();
});

test("saved switch and boot-time runtime are reported separately in both directions", async () => {
  const onAtBoot = setup({ entityExtractionEnabled: true });
  onAtBoot.settings.setFeatureFlags({ entityExtractionEnabled: false });
  onAtBoot.service.setEntityExtractor(async () => ({ ok: true, entities: [], attrs: [], relations: [] }));
  let res = new FakeRes();
  await onAtBoot.route.handler(req("/api/dsh-mneme/entities"), res);
  let data = JSON.parse(res.body);
  assert.equal(data.status.enabled, false, "saved off");
  assert.equal(data.status.runtimeEnabled, true, "runtime still on until reload");
  assert.equal(data.status.installed, true, "the active hook is still installed");
  onAtBoot.store.close();

  const offAtBoot = setup({ entityExtractionEnabled: false });
  offAtBoot.settings.setFeatureFlags({ entityExtractionEnabled: true });
  res = new FakeRes();
  await offAtBoot.route.handler(req("/api/dsh-mneme/entities"), res);
  data = JSON.parse(res.body);
  assert.equal(data.status.enabled, true, "saved on");
  assert.equal(data.status.runtimeEnabled, false, "runtime still off until reload");
  assert.equal(data.status.installed, false);
  offAtBoot.store.close();
});

test("entity rows keep their legacy public shape while status is additive", async () => {
  const { store, service, route } = setup({ entityExtractionEnabled: false });
  service.createEntity({ name: "SQLite", type: "technology" });
  const res = new FakeRes();
  await route.handler(req("/api/dsh-mneme/entities?limit=10"), res);
  const data = JSON.parse(res.body);
  assert.equal(data.entities.length, 1);
  assert.deepEqual(Object.keys(data.entities[0]).sort(), [
    "canonical_memory_id", "first_seen", "id", "last_seen", "mention_count", "name", "type"
  ]);
  assert.deepEqual(Object.keys(data.status).sort(), ["enabled", "installed", "last", "pending", "runtimeEnabled"]);
  store.close();
});
