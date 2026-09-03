#!/usr/bin/env node
/** Minimal executable checks for the ledger initializer and validator. */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const initPath = path.join(scriptDir, "init.mjs");
const indexPath = path.join(scriptDir, "index.mjs");
const evidencePath = path.join(scriptDir, "run-evidence.mjs");
const validatePath = path.join(scriptDir, "validate.mjs");
const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "evidence-first-dev-"));
const minimalProjectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "evidence-first-dev-minimal-"));

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
}

try {
  const id = "2026-09-03-test-ledger";
  let result = run(initPath, [projectRoot, id, "Fast", "low", "feature"]);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.existsSync(path.join(projectRoot, "docs", "WORKFLOW.md")));
  assert.ok(fs.existsSync(path.join(projectRoot, "docs", "CONTEXT.md")));
  assert.match(fs.readFileSync(path.join(projectRoot, "docs", "WORKFLOW.md"), "utf8"), new RegExp(`changes/${id}/PROGRESS\\.md`));
  assert.match(fs.readFileSync(path.join(projectRoot, "docs", "WORKFLOW.md"), "utf8"), /Acceptance: AC-01=pending/);
  assert.match(fs.readFileSync(path.join(projectRoot, "docs", "WORKFLOW.md"), "utf8"), /Goal: not recorded/);
  assert.doesNotMatch(fs.readFileSync(path.join(projectRoot, "docs", "WORKFLOW.md"), "utf8"), /docs\/docs\/changes/);

  result = run(indexPath, ["resume", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`RESUME READY: ${id}`));

  const missingResumeId = "2026-09-03-missing-resume";
  result = run(initPath, [projectRoot, missingResumeId, "Fast", "low", "feature", "--resume"]);
  assert.equal(result.status, 1, "--resume must not create a missing change");
  assert.match(result.stderr, /requires an existing change directory/);
  assert.ok(!fs.existsSync(path.join(projectRoot, "docs", "changes", missingResumeId)));

  const initialProgress = fs.readFileSync(path.join(projectRoot, "docs", "changes", id, "PROGRESS.md"), "utf8");
  fs.writeFileSync(path.join(projectRoot, "docs", "changes", id, "PROGRESS.md"), initialProgress.replace("- **Status**: active", "- **Status**: corrupted"), "utf8");
  result = run(indexPath, ["resume", projectRoot]);
  assert.equal(result.status, 1, "resume must reject an invalid ledger status");
  assert.match(result.stderr, /RESUME NEEDS-REPAIR/);
  fs.writeFileSync(path.join(projectRoot, "docs", "changes", id, "PROGRESS.md"), initialProgress, "utf8");

  const initialPrd = fs.readFileSync(path.join(projectRoot, "docs", "changes", id, "PRD.md"), "utf8");
  fs.writeFileSync(path.join(projectRoot, "docs", "changes", id, "PRD.md"), initialPrd.replace("evidence-first-dev/change-ledger-v1", "evidence-first-dev/change-ledger-v999"), "utf8");
  result = run(indexPath, ["resume", projectRoot]);
  assert.equal(result.status, 1, "resume must reject an incompatible ledger schema");
  assert.match(result.stderr, /Ledger schema is missing or unsupported/);
  fs.writeFileSync(path.join(projectRoot, "docs", "changes", id, "PRD.md"), initialPrd, "utf8");

  const orphanPath = path.join(projectRoot, "docs", "changes", "2026-09-03-orphan");
  fs.mkdirSync(orphanPath, { recursive: true });
  result = run(indexPath, ["resume", projectRoot]);
  assert.equal(result.status, 1, "resume must reject an orphan ledger directory");
  assert.match(result.stderr, /no PROGRESS\.md/);
  fs.rmSync(orphanPath, { recursive: true, force: true });
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);

  result = run(validatePath, [projectRoot, id]);
  assert.equal(result.status, 1, "empty acceptance must fail validation");

  const changeRoot = path.join(projectRoot, "docs", "changes", id);
  const prdPath = path.join(changeRoot, "PRD.md");
  const progressPath = path.join(changeRoot, "PROGRESS.md");
  const contextPath = path.join(changeRoot, "CONTEXT.md");
  const planPath = path.join(changeRoot, "PLAN.md");

  for (const target of [prdPath, progressPath]) {
    fs.writeFileSync(target, fs.readFileSync(target, "utf8").replace(/^- \*\*Ledger schema\*\*:.*\r?\n/m, ""), "utf8");
  }
  result = run(initPath, [projectRoot, id, "Fast", "low", "feature", "--resume"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(fs.readFileSync(prdPath, "utf8"), /- \*\*Ledger schema\*\*: evidence-first-dev\/change-ledger-v1/);
  assert.match(fs.readFileSync(progressPath, "utf8"), /- \*\*Ledger schema\*\*: evidence-first-dev\/change-ledger-v1/);

  fs.writeFileSync(progressPath, fs.readFileSync(progressPath, "utf8").replace("evidence-first-dev/change-ledger-v1", "evidence-first-dev/change-ledger-v999"), "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(validatePath, [projectRoot, id]);
  assert.equal(result.status, 1, "validator must reject an incompatible ledger schema");
  assert.match(result.stderr, /require Ledger schema evidence-first-dev\/change-ledger-v1/);
  fs.writeFileSync(progressPath, fs.readFileSync(progressPath, "utf8").replace("evidence-first-dev/change-ledger-v999", "evidence-first-dev/change-ledger-v1"), "utf8");

  const projectContextPath = path.join(projectRoot, "docs", "CONTEXT.md");
  fs.writeFileSync(projectContextPath, fs.readFileSync(projectContextPath, "utf8").replace("evidence-first-dev/project-context-v1", "evidence-first-dev/project-context-v999"), "utf8");
  result = run(indexPath, ["check", projectRoot]);
  assert.equal(result.status, 1, "index must reject an incompatible project memory schema");
  assert.match(result.stderr, /requires Schema evidence-first-dev\/project-context-v1/);
  fs.writeFileSync(projectContextPath, fs.readFileSync(projectContextPath, "utf8").replace("evidence-first-dev/project-context-v999", "evidence-first-dev/project-context-v1"), "utf8");

  const workflowPath = path.join(projectRoot, "docs", "WORKFLOW.md");
  fs.writeFileSync(workflowPath, fs.readFileSync(workflowPath, "utf8").replace("evidence-first-dev/workflow-v1", "evidence-first-dev/workflow-v999"), "utf8");
  result = run(indexPath, ["check", projectRoot]);
  assert.equal(result.status, 1, "index must reject an incompatible workflow contract");
  assert.match(result.stderr, /requires Workflow contract evidence-first-dev\/workflow-v1/);
  fs.writeFileSync(workflowPath, fs.readFileSync(workflowPath, "utf8").replace("evidence-first-dev/workflow-v999", "evidence-first-dev/workflow-v1"), "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);

  let prd = fs.readFileSync(prdPath, "utf8");
  prd = prd.replace("- **Confirmation**:", "- **Confirmation**: test request")
    .replace("### Observed facts\n-", "### Observed facts\n- Existing test fixture is available.")
    .replace("### Goal\n-", "### Goal\n- Verify ledger transitions.")
    .replace("| AC-01 | | | | pending |", "| AC-01 | Given input, when action runs, then output is correct | node test.mjs | test passes | pending |")
    .replace("- **Decision depth**: pending", "- **Decision depth**: compare")
    .replace("- Build decision:", "- Build decision: implement the existing boundary behavior")
    .replace("- Existing mechanism checked:", "- Existing mechanism checked: repository helper")
    .replace("- Smallest correct diff:", "- Smallest correct diff: one focused test and boundary change")
    .replace("- New files/dependencies/abstractions and why:", "- New files/dependencies/abstractions and why: no new files or dependencies are necessary")
    .replace("- Intentionally not built:", "- Intentionally not built: unrelated refactor")
    .replace("- **Contract required**: pending", "- **Contract required**: no");
  fs.writeFileSync(prdPath, prd, "utf8");
  fs.writeFileSync(contextPath, fs.readFileSync(contextPath, "utf8").replace("- Repository root:", "- Repository root: test-root"), "utf8");
  fs.writeFileSync(planPath, fs.readFileSync(planPath, "utf8").replace("- Change:", "- Change: Verify ledger transitions."), "utf8");

  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);

  result = run(validatePath, [projectRoot, id]);
  assert.equal(result.status, 0, result.stderr);

  prd = fs.readFileSync(prdPath, "utf8")
    .replace(/^- \*\*Confirmation\*\*:.*$/m, "- **Confirmation**: pending")
    .replace(/^- \*\*Confirmation source\*\*:.*$/m, "- **Confirmation source**:");
  for (const label of ["In", "Out", "Beneficiary", "Problem cost", "Why now", "Success signal", "Expected effort/opportunity cost", "Acceptable regression", "Kill/stop condition"]) {
    prd = prd.replace(new RegExp(`^- ${label}:$`, "m"), `- ${label}: test value`);
  }
  fs.writeFileSync(prdPath, prd, "utf8");
  let progress = fs.readFileSync(path.join(changeRoot, "PROGRESS.md"), "utf8").replace("- **Phase**: S0", "- **Phase**: S1");
  fs.writeFileSync(path.join(changeRoot, "PROGRESS.md"), progress, "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(validatePath, [projectRoot, id]);
  assert.equal(result.status, 1, "S1 must reject unconfirmed alignment");
  assert.match(result.stderr, /confirmed/);

  prd = fs.readFileSync(prdPath, "utf8")
    .replace("- **Confirmation**: pending", "- **Confirmation**: confirmed")
    .replace("- **Confirmation source**:", "- **Confirmation source**: test request");
  fs.writeFileSync(prdPath, prd, "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(validatePath, [projectRoot, id]);
  assert.equal(result.status, 0, result.stderr);

  result = run(evidencePath, [projectRoot, id, "AC-01", "--", "node", "--version"]);
  assert.equal(result.status, 0, result.stderr);
  const evidenceFiles = fs.readdirSync(path.join(changeRoot, "evidence"));
  assert.equal(evidenceFiles.length, 1);
  assert.match(fs.readFileSync(path.join(changeRoot, "PROGRESS.md"), "utf8"), /\[machine evidence\]\(evidence\/[^)]+\.json\)/);
  result = run(validatePath, [projectRoot, id]);
  assert.equal(result.status, 0, result.stderr);

  for (const label of ["Actor and trigger", "Observable outcome", "Invariant", "Ownership boundary", "Trust boundaries", "Failure cost", "Reversibility", "Simplicity ceiling and upgrade trigger"]) {
    prd = prd.replace(new RegExp(`^- ${label}:$`, "m"), `- ${label}: test boundary`);
  }
  prd = prd
    .replace("| A | | | | | | |", "| A | Existing helper | request boundary | low effort | covers invariant | reversible | focused test |")
    .replace("| B | | | | | | |", "| B | New service | new module | higher effort | broader behavior | harder rollback | integration test |")
    .replace("Chosen option:", "Chosen option: A")
    .replace("Why:", "Why: existing helper matches repository evidence")
    .replace("Rejected options:", "Rejected options: B")
    .replace("Revisit when:", "Revisit when: the boundary changes")
    .replace("- Inputs/outputs:", "- Inputs/outputs: request to response")
    .replace("- Errors and validation:", "- Errors and validation: reject malformed input")
    .replace("- Timeout/retry/idempotency:", "- Timeout/retry/idempotency: no retry; operation is idempotent")
    .replace("- Compatibility:", "- Compatibility: existing callers preserved")
    .replace("- Dependency failure:", "- Dependency failure: return a visible error")
    .replace("- Data change or `N/A - reason`:", "- Data change or `N/A - reason`: N/A - test has no data change")
    .replace("- Migration:", "- Migration: N/A - no data change")
    .replace("- Rollback:", "- Rollback: revert the local change")
    .replace("- Release/config concerns:", "- Release/config concerns: no release change");
  fs.writeFileSync(prdPath, prd, "utf8");
  let decisions = fs.readFileSync(path.join(changeRoot, "DECISIONS.md"), "utf8")
    .replace("## D-001 <short title>", "## D-001 Use existing helper")
    .replace("- Date:", "- Date: 2026-09-03")
    .replace("- Question:", "- Question: which boundary should own the behavior?")
    .replace("- Options considered:", "- Options considered: A and B")
    .replace("- Chosen:", "- Chosen: A")
    .replace("- Reason tied to constraints/evidence:", "- Reason tied to constraints/evidence: existing helper matches the observed boundary")
    .replace("- Rejected:", "- Rejected: B")
    .replace("- Consequence:", "- Consequence: focused implementation")
    .replace("- Revisit when:", "- Revisit when: repository boundary changes")
    .replace("- Confirmation source:", "- Confirmation source: test request");
  fs.writeFileSync(path.join(changeRoot, "DECISIONS.md"), decisions, "utf8");
  fs.writeFileSync(planPath, fs.readFileSync(planPath, "utf8")
    .replace("| T01 | | - | | | | low | queued |", "| T01 | Prepare evidence | - | evidence row | node --version | command is unavailable | low | done |\n| T02 | Verify dependency | T01 | verification result | node --version | output is unstable | low | active |"), "utf8");
  progress = fs.readFileSync(path.join(changeRoot, "PROGRESS.md"), "utf8")
    .replace("- **Phase**: S1", "- **Phase**: S5")
    .replace("- **Current AC**: none", "- **Current AC**: AC-01")
    .replace("- [>] T01: Inspect repository and workflow rules -> facts written to CONTEXT.md", "- [>] T02: Verify dependency -> verification result")
    .replace("- **Doing**: Inspect repository state and record verified facts.", "- **Doing**: Verify the dependency boundary.")
    .replace("- **Next**: Complete alignment, scope, and executable acceptance criteria.", "- **Next**: Run the focused verification command.");
  fs.writeFileSync(path.join(changeRoot, "PROGRESS.md"), progress, "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(validatePath, [projectRoot, id]);
  assert.equal(result.status, 0, result.stderr);

  fs.writeFileSync(planPath, fs.readFileSync(planPath, "utf8").replace("| T01 | Prepare evidence | - | evidence row | node --version | command is unavailable | low | done |", "| T01 | Prepare evidence | T02 | evidence row | node --version | command is unavailable | low | done |"), "utf8");
  assert.match(fs.readFileSync(planPath, "utf8"), /T01 \| Prepare evidence \| T02/);
  assert.match(fs.readFileSync(planPath, "utf8"), /T02 \| Verify dependency \| T01/);
  fs.writeFileSync(path.join(changeRoot, "PROGRESS.md"), fs.readFileSync(path.join(changeRoot, "PROGRESS.md"), "utf8").replace("- **Next**: Run the focused verification command.", "- **Next**: Inspect the dependency cycle."), "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(validatePath, [projectRoot, id]);
  assert.equal(result.status, 1, "validator must reject dependency cycles");
  assert.match(result.stderr, /cycle/);
  fs.writeFileSync(planPath, fs.readFileSync(planPath, "utf8").replace("| T01 | Prepare evidence | T02 | evidence row | node --version | command is unavailable | low | done |", "| T01 | Prepare evidence | - | evidence row | node --version | command is unavailable | low | done |"), "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);

  const prototypePath = path.join(changeRoot, "prototype.html");
  const prototypeLedgerPath = path.join(changeRoot, "PROTOTYPE.md");
  fs.writeFileSync(prototypePath, "<!doctype html><title>prototype</title>", "utf8");
  let prototype = fs.readFileSync(path.join(scriptDir, "..", "templates", "PROTOTYPE.md"), "utf8")
    .replace("- **Path**:", "- **Path**: prototype.html")
    .replace("- Route/page:", "- Route/page: /test")
    .replace("- Components:", "- Components: TestPanel")
    .replace("- Tokens/styles:", "- Tokens/styles: test tokens")
    .replace("- Screenshot/running page:", "- Screenshot/running page: test runtime");
  fs.writeFileSync(prototypeLedgerPath, prototype, "utf8");
  fs.writeFileSync(prdPath, fs.readFileSync(prdPath, "utf8").replace("- **UI Required**: no", "- **UI Required**: yes"), "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(validatePath, [projectRoot, id]);
  assert.equal(result.status, 0, result.stderr);
  fs.writeFileSync(prototypeLedgerPath, fs.readFileSync(prototypeLedgerPath, "utf8").replace("- **Path**: prototype.html", "- **Path**: ../outside.html"), "utf8");
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(validatePath, [projectRoot, id]);
  assert.equal(result.status, 1, "validator must reject a prototype outside the change directory");
  assert.match(result.stderr, /inside the change directory/);
  fs.writeFileSync(prdPath, fs.readFileSync(prdPath, "utf8").replace("- **UI Required**: yes", "- **UI Required**: no"), "utf8");
  fs.rmSync(prototypeLedgerPath, { recursive: false, force: true });
  fs.rmSync(prototypePath, { recursive: false, force: true });
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);

  result = run(initPath, [projectRoot, id, "Full", "high", "feature", "--upgrade"]);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.existsSync(path.join(changeRoot, "RESEARCH.md")));
  result = run(validatePath, [projectRoot, id]);
  assert.equal(result.status, 0, result.stderr);

  fs.writeFileSync(path.join(changeRoot, "PROGRESS.md"), fs.readFileSync(path.join(changeRoot, "PROGRESS.md"), "utf8").replace("Inspect the dependency cycle", "Inspect the changed dependency cycle"), "utf8");
  result = run(indexPath, ["check", projectRoot]);
  assert.equal(result.status, 1, "index check must detect a stale status block");
  assert.match(result.stderr, /stale/);
  result = run(indexPath, ["sync", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(indexPath, ["check", projectRoot]);
  assert.equal(result.status, 0, result.stderr);

  result = run(initPath, [projectRoot, id, "Fast", "low", "feature"]);
  assert.equal(result.status, 1, "initializer must refuse overwrite");

  const fullId = "2026-09-03-full-ledger";
  result = run(initPath, [projectRoot, fullId, "Full", "high", "feature"]);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.existsSync(path.join(projectRoot, "docs", "DEBTS.md")));
  assert.ok(fs.existsSync(path.join(projectRoot, "docs", "changes", fullId, "PR.md")));

  result = run(indexPath, ["resume", projectRoot]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /RESUME NEEDS-CHOICE/);

  const legacyId = "2026-09-03-legacy-ledger";
  const legacyRoot = path.join(projectRoot, "docs", "changes", legacyId);
  fs.mkdirSync(legacyRoot, { recursive: true });
  fs.writeFileSync(path.join(legacyRoot, "CHANGE.md"), `- **ID**: ${legacyId}\n- **Goal**: legacy request\n`, "utf8");
  result = run(initPath, [projectRoot, legacyId, "Fast", "low", "feature"]);
  assert.equal(result.status, 1, "legacy CHANGE.md must require explicit migration");
  result = run(initPath, [projectRoot, legacyId, "Fast", "low", "feature", "--migrate"]);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.existsSync(path.join(legacyRoot, "CHANGE.legacy.md")));
  assert.ok(fs.existsSync(path.join(legacyRoot, "MIGRATION.md")));

  const minimalId = "2026-09-03-minimal-ledger";
  result = run(initPath, [minimalProjectRoot, minimalId, "Fast", "low", "feature"]);
  assert.equal(result.status, 0, result.stderr);
  const minimalChangeRoot = path.join(minimalProjectRoot, "docs", "changes", minimalId);
  const minimalPrdPath = path.join(minimalChangeRoot, "PRD.md");
  let minimalPrd = fs.readFileSync(minimalPrdPath, "utf8")
    .replace("- **Confirmation**: pending", "- **Confirmation**: confirmed")
    .replace("- **Confirmation source**:", "- **Confirmation source**: minimal-path test")
    .replace("- **Decision depth**: pending", "- **Decision depth**: minimal")
    .replace("- **Contract required**: pending", "- **Contract required**: no")
    .replace("### Observed facts\n-", "### Observed facts\n- The change is a local mechanical behavior update.")
    .replace("### Goal\n-", "### Goal\n- Verify that a minimal ledger does not require fake design artifacts.")
    .replace("| AC-01 | | | | pending |", "| AC-01 | Given input, when the local change runs, then output remains correct | node --version | command succeeds | pending |")
    .replace("- Beneficiary:", "- Beneficiary: maintainers")
    .replace("- Problem cost:", "- Problem cost: unnecessary process")
    .replace("- Why now:", "- Why now: the minimal path needs coverage")
    .replace("- Success signal:", "- Success signal: validator accepts the minimal path")
    .replace("- Expected effort/opportunity cost:", "- Expected effort/opportunity cost: one local edit")
    .replace("- Acceptable regression:", "- Acceptable regression: no regression expected")
    .replace("- Kill/stop condition:", "- Kill/stop condition: stop if the local assumption fails")
    .replace("- In:", "- In: the local behavior change")
    .replace("- Out:", "- Out: unrelated behavior")
    .replace("- Build decision:", "- Build decision: make the smallest local change")
    .replace("- Existing mechanism checked:", "- Existing mechanism checked: existing local pattern")
    .replace("- Smallest correct diff:", "- Smallest correct diff: one local edit")
    .replace("- New files/dependencies/abstractions and why:", "- New files/dependencies/abstractions and why: no new surface is necessary")
    .replace("- Intentionally not built:", "- Intentionally not built: new dependency or abstraction")
    .replace("- Actor and trigger:", "- Actor and trigger: local caller invokes the existing path")
    .replace("- Observable outcome:", "- Observable outcome: existing output remains correct")
    .replace("- Invariant:", "- Invariant: the existing output contract remains true")
    .replace("- Ownership boundary:", "- Ownership boundary: local function")
    .replace("- Trust boundaries:", "- Trust boundaries: no external input; local test only")
    .replace("- Failure cost:", "- Failure cost: low and locally reversible")
    .replace("- Reversibility:", "- Reversibility: revert one local edit")
    .replace("- Simplicity ceiling and upgrade trigger:", "- Simplicity ceiling and upgrade trigger: one local path; upgrade if a second real caller appears")
    .replace("Chosen option:", "Chosen option: smallest correct diff")
    .replace("Why:", "Why: no material design choice exists")
    .replace("Rejected options:", "Rejected options: no alternatives")
    .replace("Revisit when:", "Revisit when: the ownership boundary changes")
    .replace("Why no comparison:", "Why no comparison: the change is mechanical, local, and reversible");
  fs.writeFileSync(minimalPrdPath, minimalPrd, "utf8");
  fs.writeFileSync(path.join(minimalChangeRoot, "CONTEXT.md"), fs.readFileSync(path.join(minimalChangeRoot, "CONTEXT.md"), "utf8").replace("- Repository root:", "- Repository root: minimal-test-root"), "utf8");
  fs.writeFileSync(path.join(minimalChangeRoot, "PLAN.md"), fs.readFileSync(path.join(minimalChangeRoot, "PLAN.md"), "utf8").replace("- Change:", "- Change: verify minimal workflow"), "utf8");
  fs.writeFileSync(path.join(minimalChangeRoot, "PROGRESS.md"), fs.readFileSync(path.join(minimalChangeRoot, "PROGRESS.md"), "utf8").replace("- **Phase**: S0", "- **Phase**: S3"), "utf8");
  result = run(indexPath, ["sync", minimalProjectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(validatePath, [minimalProjectRoot, minimalId]);
  assert.equal(result.status, 0, `minimal decision must not require option rows, a decision record, or a contract matrix: ${result.stderr}`);
  assert.doesNotMatch(minimalPrd, /\| A \| [^|]+\|/);
  fs.writeFileSync(minimalPrdPath, minimalPrd.replace("- **Decision depth**: minimal", "- **Decision depth**: compare"), "utf8");
  result = run(indexPath, ["sync", minimalProjectRoot]);
  assert.equal(result.status, 0, result.stderr);
  result = run(validatePath, [minimalProjectRoot, minimalId]);
  assert.equal(result.status, 1, "compare decision must require real option rows");
  assert.match(result.stderr, /option [AB] has an empty comparison field/);

  console.log("validate.test PASS");
} finally {
  fs.rmSync(projectRoot, { recursive: true, force: true });
  fs.rmSync(minimalProjectRoot, { recursive: true, force: true });
}
