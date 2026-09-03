import assert from "node:assert/strict";
import test from "node:test";
import { createStore, handleRequest } from "../src/request-store.mjs";

test("baseline exposes the duplicate retry behavior", () => {
  const store = createStore();
  handleRequest(store, { idempotencyKey: "request-1", value: "alpha" });
  handleRequest(store, { idempotencyKey: "request-1", value: "alpha" });
  assert.equal(store.writes.length, 2);
});
