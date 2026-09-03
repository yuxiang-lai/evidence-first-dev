#!/usr/bin/env node
/** Focused checks for argument passing and evidence capture boundaries. */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const runnerPath = path.join(scriptDir, "run-evidence.mjs");
const initPath = path.join(scriptDir, "init.mjs");
const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "evidence-runner-"));
const changeId = "2026-09-03-evidence-runner";

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
}

function evidenceFor(subject) {
  const evidenceDir = path.join(projectRoot, "docs", "changes", changeId, "evidence");
  const file = fs.readdirSync(evidenceDir).find((name) => {
    const record = JSON.parse(fs.readFileSync(path.join(evidenceDir, name), "utf8"));
    return record.subject === subject;
  });
  return JSON.parse(fs.readFileSync(path.join(evidenceDir, file), "utf8"));
}

try {
  let result = run(initPath, [projectRoot, changeId, "Fast", "low", "feature"]);
  assert.equal(result.status, 0, result.stderr);

  result = run(runnerPath, [projectRoot, changeId, "AC-01", "--", process.execPath, "-e", "process.stdout.write('token=ghp_test-value')"]);
  assert.equal(result.status, 0, result.stderr);
  let evidenceFiles = fs.readdirSync(path.join(projectRoot, "docs", "changes", changeId, "evidence"));
  assert.equal(evidenceFiles.length, 1);
  let evidence = JSON.parse(fs.readFileSync(path.join(projectRoot, "docs", "changes", changeId, "evidence", evidenceFiles[0]), "utf8"));
  assert.equal(evidence.schema, "evidence-first-dev/command-evidence-v3");
  assert.equal(evidence.producer, "run-evidence.mjs");
  assert.equal(evidence.failureClass, "success");
  assert.equal(evidence.executable, process.execPath);
  assert.deepEqual(evidence.args.slice(0, 2), ["-e", "process.stdout.write('token=[REDACTED]')"]);
  assert.match(evidence.stdoutPreview, /token=\[REDACTED\]/);
  assert.equal(evidence.redaction, "applied-before-preview-and-hash");

  result = run(runnerPath, [projectRoot, changeId, "T-secret-json", "--", process.execPath, "-e", "process.stdout.write(JSON.stringify({api_key: 'json-secret', password: 'json-secret'}))"]);
  assert.equal(result.status, 0, result.stderr);
  evidence = evidenceFor("T-secret-json");
  assert.doesNotMatch(evidence.stdoutPreview, /json-secret/);
  assert.equal(evidence.stdoutSha256, crypto.createHash("sha256").update('{"api_key":[REDACTED],"password":[REDACTED]}', "utf8").digest("hex"));

  result = run(runnerPath, [projectRoot, changeId, "T-secret-cli", "--", process.execPath, "-e", "process.stdout.write('ok')", "--", "--password", "cli-secret"]);
  assert.equal(result.status, 0, result.stderr);
  evidence = evidenceFor("T-secret-cli");
  assert.deepEqual(evidence.args.slice(-2), ["--password", "[REDACTED]"]);
  assert.doesNotMatch(evidence.command, /cli-secret/);

  result = run(runnerPath, [projectRoot, changeId, "T01", "--no-preview", "--", process.execPath, "-e", "process.stdout.write('secret=do-not-store')"]);
  assert.equal(result.status, 0, result.stderr);
  evidence = evidenceFor("T01");
  assert.equal(evidence.stdoutPreview, "suppressed by --no-preview");
  assert.equal(evidence.stdoutSha256, null);

  result = run(runnerPath, [projectRoot, changeId, "T02", "--timeout-ms", "10", "--", process.execPath, "-e", "setTimeout(() => {}, 1000)"]);
  assert.equal(result.status, 1);
  evidence = evidenceFor("T02");
  assert.equal(evidence.timedOut, true);
  assert.equal(evidence.failureClass, "timeout");

  result = run(runnerPath, [projectRoot, changeId, "T02-large-output", "--", process.execPath, "-e", "process.stdout.write('x'.repeat(2 * 1024 * 1024 + 1))"]);
  assert.equal(result.status, 1);
  evidence = evidenceFor("T02-large-output");
  assert.equal(evidence.outputLimitExceeded, true);
  assert.equal(evidence.failureClass, "output-limit");

  result = run(runnerPath, [projectRoot, changeId, "T05-spawn", "--", "definitely-not-an-executable"]);
  assert.equal(result.status, 1);
  evidence = evidenceFor("T05-spawn");
  assert.equal(evidence.failureClass, "spawn-failure");

  result = run(runnerPath, [projectRoot, changeId, "T06-non-zero", "--", process.execPath, "-e", "process.exit(7)"]);
  assert.equal(result.status, 7);
  evidence = evidenceFor("T06-non-zero");
  assert.equal(evidence.failureClass, "non-zero-exit");

  result = run(runnerPath, [projectRoot, changeId, "T03", "--", "git", "reset", "--hard"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /potentially destructive/);

  result = run(runnerPath, [projectRoot, changeId, "T04", "--", process.execPath, "-e", "if (!process.argv.includes('&&')) process.exit(1)", "&&"]);
  assert.equal(result.status, 0, result.stderr);

  console.log("run-evidence.test PASS");
} finally {
  fs.rmSync(projectRoot, { recursive: true, force: true });
}
