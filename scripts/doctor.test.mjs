import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "doctor.mjs");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "evidence-first-doctor-"));
const pass = path.join(root, "pass");
const opencode = path.join(root, "opencode");
const legacy = path.join(root, "legacy");
const generic = path.join(root, "generic");
const fail = path.join(root, "fail");
const unrelated = path.join(root, "unrelated");
fs.mkdirSync(path.join(pass, ".cursor", "skills", "evidence-first-dev"), { recursive: true });
fs.mkdirSync(path.join(opencode, ".opencode", "skills", "evidence-first-dev"), { recursive: true });
fs.mkdirSync(path.join(legacy, ".cursor", "evidence-first-dev"), { recursive: true });
fs.mkdirSync(path.join(generic, ".github"), { recursive: true });
fs.mkdirSync(fail, { recursive: true });
fs.mkdirSync(unrelated, { recursive: true });
fs.writeFileSync(path.join(pass, ".cursor", "skills", "evidence-first-dev", "SKILL.md"), "---\nname: evidence-first-dev\n---\n");
fs.writeFileSync(path.join(opencode, ".opencode", "skills", "evidence-first-dev", "SKILL.md"), "---\nname: evidence-first-dev\n---\n");
fs.writeFileSync(path.join(legacy, ".cursor", "evidence-first-dev", "SKILL.md"), "name: evidence-first-dev\n");
fs.writeFileSync(path.join(generic, ".github", "copilot-instructions.md"), "Use Evidence-First Dev workflow\n");
fs.writeFileSync(path.join(unrelated, "AGENTS.md"), "Unrelated project rules\n");

const output = execFileSync(process.execPath, [script, pass], { encoding: "utf8" });
assert.match(output, /doctor PASS/);
assert.match(output, /Cursor skill/);
assert.match(execFileSync(process.execPath, [script, opencode], { encoding: "utf8" }), /OpenCode skill/);
assert.match(execFileSync(process.execPath, [script, legacy], { encoding: "utf8" }), /Cursor legacy skill/);
assert.match(execFileSync(process.execPath, [script, generic], { encoding: "utf8" }), /GitHub Copilot instructions/);
const expectedFailure = (target) => assert.throws(() => execFileSync(
  process.execPath,
  [script, target],
  { encoding: "utf8", stdio: ["ignore", "ignore", "ignore"] }
));
expectedFailure(fail);
expectedFailure(unrelated);
fs.rmSync(root, { recursive: true, force: true });
console.log("doctor tests PASS");
