#!/usr/bin/env node
/** Verify that a portable ledger can close with fixed-format manual evidence. */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const initPath = path.join(scriptDir, "init.mjs");
const indexPath = path.join(scriptDir, "index.mjs");
const validatePath = path.join(scriptDir, "validate.mjs");
const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "evidence-portable-"));
const changeId = "2026-09-03-portable-ledger";

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
  const workflowPath = path.join(projectRoot, "docs", "WORKFLOW.md");
  fs.writeFileSync(workflowPath, fs.readFileSync(workflowPath, "utf8").replace("- **Index mode**: machine", "- **Index mode**: portable"), "utf8");

  let prd = fs.readFileSync(path.join(changeRoot, "PRD.md"), "utf8");
  prd = setBullet(prd, "Confirmation", "confirmed");
  prd = setBullet(prd, "Confirmation source", "portable mode test");
  prd = setBullet(prd, "Status", "done");
  prd = setBullet(prd, "Decision depth", "minimal");
  prd = setBullet(prd, "Contract required", "no");
  prd = setBullet(prd, "Evidence mode", "portable");
  prd = prd
    .replace("### Observed facts\n-", "### Observed facts\n- The portable evidence path is deterministic and testable.")
    .replace("### Goal\n-", "### Goal\n- Close a ledger with manual evidence when Node.js automation is unavailable.")
    .replace("| AC-01 | | | | pending |", "| AC-01 | Given a project command is observed, when it exits successfully, then the result is recorded in the ledger | manual observation | exit code 0 and concrete output | pass |");
  for (const [label, value] of [
    ["Beneficiary", "developers without Node.js"],
    ["Problem cost", "the workflow becomes unavailable in language-specific environments"],
    ["Why now", "portable operation is a release requirement"],
    ["Success signal", "manual evidence passes the same closeout gate"],
    ["Expected effort/opportunity cost", "one Markdown record per check"],
    ["Acceptable regression", "machine evidence remains strict"],
    ["Kill/stop condition", "stop if manual evidence cannot be made auditable"],
    ["In", "the portable ledger and evidence protocol"],
    ["Out", "a second runtime implementation"],
    ["Build decision", "extend the Markdown protocol"],
    ["Existing mechanism checked", "the existing change ledger and evidence links"],
    ["Smallest correct diff", "one manual evidence file and linked rows"],
    ["New files/dependencies/abstractions and why", "no runtime dependency"],
    ["Intentionally not built", "a Python or shell duplicate of the runner"],
    ["Actor and trigger", "a developer closes work without Node.js"],
    ["Observable outcome", "the completed change has traceable manual proof"],
    ["Invariant", "every passed AC has evidence for the selected mode"],
    ["Ownership boundary", "the change ledger"],
    ["Trust boundaries", "the person or agent recording terminal observation"],
    ["Failure cost", "a false completion claim"],
    ["Reversibility", "replace the manual record with machine evidence later"],
    ["Simplicity ceiling and upgrade trigger", "manual records; upgrade when shared provenance is required"],
    ["Chosen option", "portable Markdown evidence"],
    ["Why", "it works without adding a second runtime"],
    ["Rejected options", "a Python runner and a shell runner"],
    ["Revisit when", "manual evidence becomes too costly or untrusted"],
    ["Why no comparison", "the user requirement is runtime independence and the protocol extension is local"],
  ]) prd = setBullet(prd, label, value);
  fs.writeFileSync(path.join(changeRoot, "PRD.md"), prd, "utf8");

  fs.writeFileSync(path.join(changeRoot, "CONTEXT.md"), fs.readFileSync(path.join(changeRoot, "CONTEXT.md"), "utf8").replace("- Repository root:", "- Repository root: portable-test-root"), "utf8");
  fs.writeFileSync(path.join(changeRoot, "PLAN.md"), fs.readFileSync(path.join(changeRoot, "PLAN.md"), "utf8")
    .replace("- Change:", "- Change: verify portable evidence")
    .replace("| T01 | | - | | | | low | queued |", "| T01 | Record manual evidence | - | evidence file and ledger row | validate the record | stop if the observed result is unavailable | low | done |"), "utf8");

  const evidenceDir = path.join(changeRoot, "evidence");
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.writeFileSync(path.join(evidenceDir, "AC-01-portable.md"), `# Evidence E-001\n\n- **Schema**: evidence-first-dev/manual-evidence-v1\n- **Producer**: manual-observed\n- **Subject**: AC-01\n- **Command**: \`printf portable-check\`\n- **Observed at**: 2026-09-03T15:20:00+08:00\n- **Result**: exit 0\n- **Failure class**: success\n- **Observation**: portable-check was observed in the current project terminal\n- **Recorded by**: portable mode test\n- **Machine capture**: unavailable; this is manual evidence\n- **Limitations**: output was not hash-captured\n`, "utf8");

  let progress = fs.readFileSync(path.join(changeRoot, "PROGRESS.md"), "utf8");
  progress = setBullet(progress, "Evidence mode", "portable");
  progress = progress
    .replace("- **Phase**: S0", "- **Phase**: S8")
    .replace("- **Status**: active", "- **Status**: done")
    .replace("- **Current AC**: none", "- **Current AC**: AC-01")
    .replace("- [>] T01: Inspect repository and workflow rules -> facts written to CONTEXT.md", "- [x] T01: Record manual evidence -> evidence file and ledger row")
    .replace("- **Doing**: Inspect repository state and record verified facts.", "- **Doing**: Closed after manual evidence verification.")
    .replace("- **Next**: Complete alignment, scope, and executable acceptance criteria.", "- **Next**: none")
    .replace("- **Last proven state**: Ledger initialized; no implementation evidence yet.", "- **Last proven state**: Manual acceptance evidence recorded.")
    .replace("- Current phase/task: S0 / T01", "- Current phase/task: S8 / T01")
    .replace("- Last proven state: Ledger initialized.", "- Last proven state: Manual acceptance evidence recorded.")
    .replace("- Next action: Inspect the repository and update the ledger.", "- Next action: none")
    .replace("| | | | | |", "| 2026-09-03 | AC-01 | `printf portable-check` | exit 0, success | portable-check observed; [manual evidence](evidence/AC-01-portable.md) | ");
  fs.writeFileSync(path.join(changeRoot, "PROGRESS.md"), progress, "utf8");

  let review = fs.readFileSync(path.join(changeRoot, "REVIEW.md"), "utf8")
    .replace("- **Status**: draft", "- **Status**: final")
    .replace("- AC-01: PASS - Command: `<exact command>` | Result: exit 0 | Evidence: [machine evidence](evidence/<generated-file>.json)", "- AC-01: PASS - Command: printf portable-check | Result: exit 0 | Evidence: [manual evidence](evidence/AC-01-portable.md)")
    .replace("- Standards: PASS|FAIL|SKIP - <actual commands -> result>", "- Standards: PASS - portable evidence structure -> observed")
    .replace("- Acceptance: PASS|FAIL|SKIP - <all AC lines above have individual evidence>", "- Acceptance: PASS - AC-01 has individual manual evidence")
    .replace("- none\n- Format:", "- IC-01: AC-01 | portable-check; evidence required\n- Format:");
  fs.writeFileSync(path.join(changeRoot, "REVIEW.md"), review, "utf8");

  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(fs.readFileSync(workflowPath, "utf8"), /\*\*Index mode\*\*: portable/);
  result = run(validatePath, [projectRoot, changeId]);
  assert.equal(result.status, 0, result.stderr);

  const prdPath = path.join(changeRoot, "PRD.md");
  const progressPath = path.join(changeRoot, "PROGRESS.md");
  fs.writeFileSync(prdPath, fs.readFileSync(prdPath, "utf8").replace("- **Evidence mode**: portable", "- **Evidence mode**: machine"), "utf8");
  fs.writeFileSync(progressPath, fs.readFileSync(progressPath, "utf8").replace("- **Evidence mode**: portable", "- **Evidence mode**: machine"), "utf8");
  result = run(validatePath, [projectRoot, changeId]);
  assert.equal(result.status, 1, "machine mode must reject manual-only evidence");
  assert.match(result.stderr, /successful machine evidence/);

  console.log("portable-mode.test PASS");
} finally {
  fs.rmSync(projectRoot, { recursive: true, force: true });
}
