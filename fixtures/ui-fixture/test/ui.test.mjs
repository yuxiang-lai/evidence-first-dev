import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const fixtureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("settings page exposes the existing visual language and accessible status", () => {
  const tokens = fs.readFileSync(path.join(fixtureRoot, "src", "tokens.css"), "utf8");
  const page = fs.readFileSync(path.join(fixtureRoot, "src", "settings.html"), "utf8");
  assert.match(tokens, /--color-accent/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /@media \(max-width: 480px\)/);
});
