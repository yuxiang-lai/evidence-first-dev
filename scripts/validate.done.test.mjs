#!/usr/bin/env node
/** Focused checks for done-state evidence and per-AC review requirements. */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const initPath = path.join(scriptDir, "init.mjs");
const evidencePath = path.join(scriptDir, "run-evidence.mjs");
const validatePath = path.join(scriptDir, "validate.mjs");
const indexPath = path.join(scriptDir, "index.mjs");
const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "evidence-done-"));
const changeId = "2026-09-03-done-evidence";

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
}

function setBullet(text, label, value) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`^([ \\t]*(?:[-*][ \\t]*)?(?:\\*\\*)?${escaped}(?:\\*\\*)?:[ \\t]*).*$`, "mi"), `$1${value}`);
}

try {
  let result = run(initPath, [projectRoot, changeId, "Fast", "low", "feature"]);
  assert.equal(result.status, 0, result.stderr);
  const changeRoot = path.join(projectRoot, "docs", "changes", changeId);

  let prd = fs.readFileSync(path.join(changeRoot, "PRD.md"), "utf8");
  const commandText = `${process.execPath} --version`;
  prd = setBullet(prd, "Confirmation", "confirmed");
  prd = setBullet(prd, "Confirmation source", "done-state test");
  prd = setBullet(prd, "Status", "done");
  prd = setBullet(prd, "Decision depth", "minimal");
  prd = setBullet(prd, "Contract required", "no");
  prd = prd.replace("### Observed facts\n-", "### Observed facts\n- The local behavior is deterministic and testable.")
    .replace("### Goal\n-", "### Goal\n- Verify done requires individual successful evidence.")
    .replace("| AC-01 | | | | pending |", `| AC-01 | Given the command is available, when it runs, then it exits successfully | ${commandText} | exit code 0 | pass |`);
  for (const [label, value] of [
    ["Beneficiary", "maintainers"],
    ["Problem cost", "false done claims"],
    ["Why now", "the done gate is being hardened"],
    ["Success signal", "validator rejects unproven done"],
    ["Expected effort/opportunity cost", "one focused ledger check"],
    ["Acceptable regression", "none in evidence capture"],
    ["Kill/stop condition", "stop if evidence cannot be reproduced"],
    ["In", "the done validator"],
    ["Out", "project behavior changes"],
    ["Build decision", "keep the existing evidence boundary"],
    ["Existing mechanism checked", "run-evidence runner"],
    ["Smallest correct diff", "validator and review record"],
    ["New files/dependencies/abstractions and why", "no new runtime dependency"],
    ["Intentionally not built", "a separate evidence service"],
    ["Actor and trigger", "maintainer closes a change"],
    ["Observable outcome", "done has traceable proof"],
    ["Invariant", "every pass AC has successful evidence"],
    ["Ownership boundary", "change ledger validator"],
    ["Trust boundaries", "local command output"],
    ["Failure cost", "false completion"],
    ["Reversibility", "restore the ledger"],
    ["Simplicity ceiling and upgrade trigger", "local JSON evidence; upgrade if evidence is shared across systems"],
    ["Chosen option", "smallest correct diff"],
    ["Why", "no material design choice exists"],
    ["Rejected options", "no alternatives"],
    ["Revisit when", "evidence spans multiple systems"],
    ["Why no comparison", "the validator change is local and reversible"],
  ]) prd = setBullet(prd, label, value);
  fs.writeFileSync(path.join(changeRoot, "PRD.md"), prd, "utf8");

  fs.writeFileSync(path.join(changeRoot, "CONTEXT.md"), fs.readFileSync(path.join(changeRoot, "CONTEXT.md"), "utf8").replace("- Repository root:", "- Repository root: done-test-root"), "utf8");
  fs.writeFileSync(path.join(changeRoot, "PLAN.md"), fs.readFileSync(path.join(changeRoot, "PLAN.md"), "utf8")
    .replace("- Change:", "- Change: verify done evidence")
    .replace("| T01 | | - | | | | low | queued |", `| T01 | Verify evidence | - | successful evidence record | ${commandText} | command fails | low | done |`), "utf8");
  fs.writeFileSync(path.join(changeRoot, "PROGRESS.md"), fs.readFileSync(path.join(changeRoot, "PROGRESS.md"), "utf8")
    .replace("- **Phase**: S0", "- **Phase**: S8")
    .replace("- **Status**: active", "- **Status**: done")
    .replace("- **Current AC**: none", "- **Current AC**: AC-01")
    .replace("- [>] T01: Inspect repository and workflow rules -> facts written to CONTEXT.md", "- [x] T01: Verify evidence -> successful evidence record")
    .replace("- **Doing**: Inspect repository state and record verified facts.", "- **Doing**: Closed after evidence verification.")
    .replace("- **Next**: Complete alignment, scope, and executable acceptance criteria.", "- **Next**: none")
    .replace("- **Last proven state**: Ledger initialized; no implementation evidence yet.", "- **Last proven state**: Acceptance evidence captured.")
    .replace("- Current phase/task: S0 / T01", "- Current phase/task: S8 / T01")
    .replace("- Last proven state: Ledger initialized.", "- Last proven state: Acceptance evidence captured.")
    .replace("- Next action: Inspect the repository and update the ledger.", "- Next action: none"), "utf8");

  result = run(evidencePath, [projectRoot, changeId, "AC-01", "--", process.execPath, "--version"]);
  assert.equal(result.status, 0, result.stderr);
  const evidenceDir = path.join(changeRoot, "evidence");
  const evidenceFile = fs.readdirSync(evidenceDir).find((name) => name.endsWith(".json"));
  const evidenceRelative = `evidence/${evidenceFile}`;
  const evidencePathOnDisk = path.join(evidenceDir, evidenceFile);
  let review = fs.readFileSync(path.join(changeRoot, "REVIEW.md"), "utf8")
    .replace("- **Status**: draft", "- **Status**: final")
    .replace("- AC-01: PASS - Command: `<exact command>` | Result: exit 0 | Evidence: [machine evidence](evidence/<generated-file>.json)", `- AC-01: PASS - Command: ${commandText} | Result: exit 0 | Evidence: [machine evidence](${evidenceRelative})`)
    .replace("- Standards: PASS|FAIL|SKIP - <actual commands -> result>", "- Standards: PASS - node --version -> exit 0")
    .replace("- Acceptance: PASS|FAIL|SKIP - <all AC lines above have individual evidence>", "- Acceptance: PASS - AC-01 has individual machine evidence");
  fs.writeFileSync(path.join(changeRoot, "REVIEW.md"), review, "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(validatePath, [projectRoot, changeId]);
  assert.equal(result.status, 0, result.stderr);

  const mismatchedReview = review.replace(commandText, "node --version");
  fs.writeFileSync(path.join(changeRoot, "REVIEW.md"), mismatchedReview, "utf8");
  result = run(validatePath, [projectRoot, changeId]);
  assert.equal(result.status, 1, "REVIEW Command must match PRD Verify");
  assert.match(result.stderr, /Command must match PRD Verify/);
  fs.writeFileSync(path.join(changeRoot, "REVIEW.md"), review, "utf8");

  const doneProgressPath = path.join(changeRoot, "PROGRESS.md");
  const doneProgress = fs.readFileSync(doneProgressPath, "utf8");
  fs.writeFileSync(doneProgressPath, doneProgress.replace("- **Phase**: S8", "- **Phase**: S7"), "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(validatePath, [projectRoot, changeId]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /done requires Phase S8/);
  fs.writeFileSync(doneProgressPath, doneProgress, "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);

  const importantReview = review.replace("- none\n- Format:", "- IC-01: T01 | Command: node --version | evidence required\n- Format:");
  assert.match(importantReview, /IC-01: T01 \| Command: node --version/);
  fs.writeFileSync(path.join(changeRoot, "REVIEW.md"), importantReview, "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(validatePath, [projectRoot, changeId]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /IC-01 requires successful evidence for T01/);
  fs.writeFileSync(path.join(changeRoot, "REVIEW.md"), review, "utf8");

  const producerRecord = JSON.parse(fs.readFileSync(evidencePathOnDisk, "utf8"));
  producerRecord.producer = "manual-edit";
  fs.writeFileSync(evidencePathOnDisk, `${JSON.stringify(producerRecord, null, 2)}\n`, "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(validatePath, [projectRoot, changeId]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /successful evidence/);
  producerRecord.producer = "run-evidence.mjs";
  fs.writeFileSync(evidencePathOnDisk, `${JSON.stringify(producerRecord, null, 2)}\n`, "utf8");

  const relocatedAcceptance = review
    .replace(/^- AC-01:.*$/m, "- Acceptance detail was moved out of its required section")
    .replace("- Can a new agent understand the goal, choice, next step, and evidence from", "- AC-01: PASS - node --version -> exit 0; [machine evidence](" + evidenceRelative + ")\n- Can a new agent understand the goal, choice, next step, and evidence from");
  fs.writeFileSync(path.join(changeRoot, "REVIEW.md"), relocatedAcceptance, "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(validatePath, [projectRoot, changeId]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /individual PASS in standard Command\/Result\/Evidence format with a valid evidence link/);

  fs.writeFileSync(path.join(changeRoot, "REVIEW.md"), review.replace(/^- AC-01:.*$/m, "- AC-01: PASS - summary only"), "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(validatePath, [projectRoot, changeId]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /individual PASS in standard Command\/Result\/Evidence format with a valid evidence link/);

  fs.writeFileSync(path.join(changeRoot, "REVIEW.md"), review, "utf8");
  fs.writeFileSync(path.join(changeRoot, "REVIEW.md"), review.replace("- Standards: PASS - node --version -> exit 0", "- Standards: FAIL - node --version -> exit 1"), "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(validatePath, [projectRoot, changeId]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /done requires Standards PASS/);

  fs.writeFileSync(path.join(changeRoot, "REVIEW.md"), review, "utf8");
  const evidenceRecord = JSON.parse(fs.readFileSync(evidencePathOnDisk, "utf8"));
  evidenceRecord.exitCode = 1;
  fs.writeFileSync(evidencePathOnDisk, `${JSON.stringify(evidenceRecord, null, 2)}\n`, "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(validatePath, [projectRoot, changeId]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /successful evidence/);

  console.log("validate.done.test PASS");
} finally {
  fs.rmSync(projectRoot, { recursive: true, force: true });
}
