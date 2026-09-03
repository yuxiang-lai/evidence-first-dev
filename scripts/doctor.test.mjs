import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "doctor.mjs");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "evidence-first-doctor-"));
const pass = path.join(root, "pass");
const fail = path.join(root, "fail");
const unrelated = path.join(root, "unrelated");
fs.mkdirSync(path.join(pass, ".cursor", "rules"), { recursive: true });
fs.mkdirSync(fail, { recursive: true });
fs.mkdirSync(unrelated, { recursive: true });
fs.writeFileSync(path.join(pass, ".cursor", "rules", "evidence-first-dev.mdc"), "Evidence-First Dev rule\n");
fs.writeFileSync(path.join(unrelated, "AGENTS.md"), "Unrelated project rules\n");

const output = execFileSync(process.execPath, [script, pass], { encoding: "utf8" });
assert.match(output, /doctor PASS/);
const expectedFailure = (target) => assert.throws(() => execFileSync(
  process.execPath,
  [script, target],
  { encoding: "utf8", stdio: ["ignore", "ignore", "ignore"] }
));
expectedFailure(fail);
expectedFailure(unrelated);
fs.rmSync(root, { recursive: true, force: true });
console.log("doctor tests PASS");
