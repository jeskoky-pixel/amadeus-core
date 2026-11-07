import test from "node:test";
import assert from "node:assert/strict";
import { createSemantic } from "../src/semantic.js";

test("semantic disposal drains async embedder init before the store can close", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  globalThis.fetch = async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return { ok: true, json: async () => ({ embedding: [1, 0, 0] }) };
  };

  let humanEdits = 0;
  const semantic = createSemantic({
    store: {},
    service: { setEmbedder() {}, setReranker() {} },
    settings: {},
    cfg: {
      embedProvider: "ollama",
      ollamaModel: "test-model",
      ollamaBaseUrl: "http://127.0.0.1:11434",
      autoReindexOnBoot: false,
      rerankEnabled: false
    },
    vectorIndex: {},
    applyHumanEdits: () => { humanEdits++; },
    logger: { warn() {}, info() {} }
  });

  await semantic.dispose();
  assert.equal(humanEdits, 0, "an async boot callback must not touch the closed runtime");
});

