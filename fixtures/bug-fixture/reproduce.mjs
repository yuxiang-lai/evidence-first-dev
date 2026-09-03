import assert from "node:assert/strict";
import { createStore, handleRequest } from "./src/request-store.mjs";

const store = createStore();
handleRequest(store, { idempotencyKey: "request-1", value: "alpha" });
handleRequest(store, { idempotencyKey: "request-1", value: "alpha" });
assert.equal(store.writes.length, 1, "a retry must commit exactly one write");
