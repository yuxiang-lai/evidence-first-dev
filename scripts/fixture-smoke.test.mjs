#!/usr/bin/env node
/** Exercise the workflow against small project-shaped repositories. */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.dirname(scriptDir);
const fixturesRoot = path.join(skillRoot, "fixtures");
const initPath = path.join(scriptDir, "init.mjs");
const indexPath = path.join(scriptDir, "index.mjs");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "evidence-first-fixtures-"));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const shell = process.env.ComSpec || "cmd.exe";

function run(command, args, cwd) {
  if (process.platform === "win32" && command === "npm.cmd") {
    return spawnSync(shell, ["/d", "/c", command, ...args], { cwd, encoding: "utf8" });
  }
  return spawnSync(command, args, { cwd, encoding: "utf8" });
}

function copyFixture(name) {
  const destination = path.join(tempRoot, name);
  fs.cpSync(path.join(fixturesRoot, name), destination, { recursive: true });
  return destination;
}

try {
  for (const name of ["bug-fixture", "ui-fixture", "contract-fixture"]) {
    const fixture = copyFixture(name);
    const result = run(npm, ["test"], fixture);
    assert.equal(result.status, 0, `${name} test failed:\n${result.stderr}`);
  }

  const bugFixture = copyFixture("bug-fixture");
  const reproduction = run(npm, ["run", "reproduce"], bugFixture);
  assert.equal(reproduction.status, 1, "bug fixture reproduction must fail before the fix");

  const resumeFixture = copyFixture("resume-fixture");
  const changeId = "2026-09-03-fixture-resume";
  let result = run(process.execPath, [initPath, resumeFixture, changeId, "Fast", "low", "bug"], resumeFixture);
  assert.equal(result.status, 0, result.stderr);
  result = run(process.execPath, [indexPath, "resume", resumeFixture], resumeFixture);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`RESUME READY: ${changeId}`));
  assert.match(result.stdout, /Current task: T01/);

  const workflow = fs.readFileSync(path.join(resumeFixture, "docs", "WORKFLOW.md"), "utf8");
  assert.match(workflow, new RegExp(`changes/${changeId}/PROGRESS\\.md`));
  assert.match(workflow, /Unfinished changes: \*\*1\*\*/);

  console.log("fixture-smoke.test PASS");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
