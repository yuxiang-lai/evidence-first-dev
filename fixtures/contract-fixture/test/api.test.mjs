import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { getWidget } from "../src/api.mjs";

const fixtureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("widget response matches the published success shape", () => {
  assert.deepEqual(getWidget("w-1"), {
    status: 200,
    body: { id: "w-1", name: "Example widget" },
  });
});

test("contract documents the client-visible status codes", () => {
  const contract = fs.readFileSync(path.join(fixtureRoot, "api", "openapi.yaml"), "utf8");
  assert.match(contract, /version: 1\.0\.0/);
  assert.match(contract, /"200":/);
  assert.match(contract, /"400":/);
});
