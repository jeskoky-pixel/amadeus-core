import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/store.js";
import { createSettings } from "../src/settings.js";
import { createUnifiedRuntime } from "../src/unified-runtime.js";
import { unifiedSnapshot, workspaceDisplayTitle } from "../src/unified-admin.js";

// Display-only regression: the owner card may show a human-readable Workspace
// title from the trusted Registry, but the immutable Workspace ID remains the
// value used for every authorization and save path.
test("workspaceDisplayTitle reads only the trusted Registry and degrades safely", () => {
  const registry = {
    get(id) { return id === "w" ? { id: "w", title: "  QA \u0000 Workspace  " } : undefined; }
  };
  assert.equal(workspaceDisplayTitle({ reflect: { get: (name) => name === "workspaceRegistry" ? registry : undefined } }, "w"),
    "QA   Workspace");
  assert.equal(workspaceDisplayTitle({ workspaceRegistry: registry }, "w"), "QA   Workspace",
    "direct Registry access is the legacy-host fallback");
  assert.equal(workspaceDisplayTitle({ reflect: { get: () => undefined } }, "w"), null);
  assert.equal(workspaceDisplayTitle({ reflect: { get: () => ({ get() { throw new Error("registry boom"); } }) } }, "w"), null);
  assert.equal(workspaceDisplayTitle({ reflect: { get: () => registry } }, "missing"), null);
  assert.equal(workspaceDisplayTitle({ reflect: { get: () => ({ get: () => ({ title: "   " }) }) } }, "w"), null);
});

test("unified snapshot keeps the workspace ID for authorization and adds a display title", () => {
  const store = createStore(":memory:");
  const workspace = { id: "w", title: "QA Workspace", sessionIds: ["s1"] };
  const registry = { get: (id) => id === "w" ? workspace : undefined, list: () => [workspace] };
  const sessions = new Map([["s1", { id: "s1", header: { createdAt: Date.now() } }]]);
  const ctx = {
    reflect: { get: (name) => name === "workspaceRegistry" ? registry : name === "sessions" ? { get: (id) => sessions.get(id) } : undefined },
    workspaceRegistry: registry,
    sessions: { get: (id) => sessions.get(id) }
  };
  const runtime = createUnifiedRuntime({
    ctx, db: store.db, workspaceId: "w",
    authorizeWorkspace: () => ({ allowed: true, workspaceId: "w" }),
    enabled: () => true
  });
  try {
    const settings = createSettings(store.db);
    const snapshot = unifiedSnapshot({
      ctx, store, settings, config: {}, activeWorkspaceId: "w", unifiedRuntime: runtime
    });
    assert.equal(snapshot.workspace_id, "w", "the ID stays the authorization key");
    assert.equal(snapshot.workspace_title, "QA Workspace");
    assert.equal(snapshot.sessions[0].id, "s1");
  } finally {
    runtime.dispose();
    store.close();
  }
});
