import test from "node:test";
import assert from "node:assert/strict";
import { backfillMissingEmbeddings, createSemantic } from "../src/semantic.js";

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

test("semantic dispose is idempotent while a failed init has a retry scheduled", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => { throw new Error("offline"); };

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
    applyHumanEdits() {},
    logger: { warn() {}, info() {} }
  });

  const first = semantic.dispose();
  const second = semantic.dispose();
  assert.strictEqual(first, second, "repeated dispose calls share one drain promise");
  await first;
});

test("cancelled backfill never writes a vector after the embedder returns", async () => {
  let cancelled = false;
  let writes = 0;
  const summary = await backfillMissingEmbeddings({
    store: {
      needsEmbedding: () => [{ id: "memory-1", title: "title", content: "content" }],
      setEmbedding: () => { writes++; }
    },
    embedder: {
      modelHash: "test-model",
      dimension: 3,
      embedSingle: async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        cancelled = true;
        return [1, 0, 0];
      }
    },
    vectorIndex: {},
    logger: { info() {} },
    isCancelled: () => cancelled,
    maxTotal: 1,
    rateLimitMs: 0
  });

  assert.equal(writes, 0);
  assert.equal(summary.finishReason, "cancelled");
});

