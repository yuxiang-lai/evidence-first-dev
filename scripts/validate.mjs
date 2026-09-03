#!/usr/bin/env node
/**
 * Validate ledger structure only. It never claims that project commands ran.
 * Usage: node validate.mjs <projectRoot> <changeId>
 */
import fs from "node:fs";
import path from "node:path";
import { checkWorkflow } from "./index.mjs";

const root = path.resolve(process.argv[2] || ".");
const changeId = process.argv[3];
const errors = [];
const EVIDENCE_SCHEMA = "evidence-first-dev/command-evidence-v2";
const EVIDENCE_PRODUCER = "run-evidence.mjs";
const MANUAL_EVIDENCE_SCHEMA = "evidence-first-dev/manual-evidence-v1";
const MANUAL_EVIDENCE_PRODUCER = "manual-observed";
const FAILURE_CLASSES = new Set(["success", "non-zero-exit", "timeout", "output-limit", "spawn-failure", "signal"]);
const EVIDENCE_MODES = new Set(["machine", "portable"]);
const LEDGER_SCHEMA = "evidence-first-dev/change-ledger-v1";

function read(name) {
  const target = path.join(root, "docs", "changes", changeId || "", name);
  if (!fs.existsSync(target)) {
    errors.push(`missing ${name}`);
    return "";
  }
  return fs.readFileSync(target, "utf8");
}

function field(text, name) {
  return text.match(new RegExp(`^[-*] \\*\\*${name}\\*\\*:[ \\t]*(.*)$`, "mi"))?.[1]?.trim() || "";
}

function meaningful(value) {
  return value && !/^(tbd|todo|n\/a|none|-)$/i.test(value) && value.length > 2;
}

function decisionValue(value) {
  return Boolean(value?.trim()) && !/^(tbd|todo|n\/a|none|-)$/i.test(value.trim());
}

function present(value) {
  return Boolean(value?.trim()) && !/^---+$/.test(value.trim());
}

function withoutFencedCode(text) {
  return text.replace(/```[\s\S]*?```/g, "");
}

function lineValue(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.match(new RegExp(`^[ \\t]*(?:[-*][ \\t]*)?(?:\\*\\*)?${escaped}(?:\\*\\*)?:[ \\t]*(.*)$`, "mi"))?.[1]?.trim() || "";
}

function evidenceRecords(changeRoot) {
  const evidenceDir = path.join(changeRoot, "evidence");
  if (!fs.existsSync(evidenceDir)) return [];
  return fs.readdirSync(evidenceDir)
    .filter((name) => name.endsWith(".json") || name.endsWith(".md"))
    .map((name) => {
      try {
        const content = fs.readFileSync(path.join(evidenceDir, name), "utf8");
        if (name.endsWith(".json")) return { kind: "machine", path: name, record: JSON.parse(content) };
        const result = lineValue(content, "Result").match(/^exit[ \t]+(-?\d+)/i);
        return {
          kind: "manual",
          path: name,
          record: {
            schema: lineValue(content, "Schema"),
            producer: lineValue(content, "Producer"),
            subject: lineValue(content, "Subject"),
            command: lineValue(content, "Command").replace(/^`|`$/g, ""),
            observedAt: lineValue(content, "Observed at"),
            exitCode: result ? Number(result[1]) : null,
            failureClass: lineValue(content, "Failure class").toLowerCase(),
            observation: lineValue(content, "Observation"),
            recorder: lineValue(content, "Recorded by"),
            machineCapture: lineValue(content, "Machine capture"),
            limitations: lineValue(content, "Limitations"),
          },
        };
      } catch {
        return { kind: name.endsWith(".json") ? "machine" : "manual", path: name, record: null };
      }
    })
    .filter((entry) => entry.record);
}

function isMachineEvidence(record, subject, successful = false) {
  return record?.schema === EVIDENCE_SCHEMA
    && record?.producer === EVIDENCE_PRODUCER
    && record?.subject === subject
    && Array.isArray(record?.args)
    && typeof record?.executable === "string"
    && typeof record?.startedAt === "string"
    && typeof record?.finishedAt === "string"
    && Number.isInteger(record?.exitCode)
    && FAILURE_CLASSES.has(record?.failureClass)
    && ((record.failureClass === "success" && record.exitCode === 0)
      || (record.failureClass !== "success" && record.exitCode !== 0))
    && (!successful || record.exitCode === 0);
}

function isManualEvidence(record, subject, successful = false) {
  const observedAt = Date.parse(record?.observedAt || "");
  return record?.schema === MANUAL_EVIDENCE_SCHEMA
    && record?.producer === MANUAL_EVIDENCE_PRODUCER
    && record?.subject === subject
    && meaningful(record?.command)
    && Number.isInteger(record?.exitCode)
    && FAILURE_CLASSES.has(record?.failureClass)
    && Number.isFinite(observedAt)
    && meaningful(record?.observation)
    && meaningful(record?.recorder)
    && /manual evidence|unavailable|not machine/i.test(record?.machineCapture || "")
    && meaningful(record?.limitations)
    && ((record.failureClass === "success" && record.exitCode === 0)
      || (record.failureClass !== "success" && record.exitCode !== 0))
    && (!successful || record.exitCode === 0);
}

function evidenceAllowed(entry, subject, successful, evidenceMode) {
  if (entry.kind === "machine") return isMachineEvidence(entry.record, subject, successful);
  return evidenceMode === "portable" && isManualEvidence(entry.record, subject, successful);
}

function linkedEvidenceAllowed(link, subject, successful, evidenceMode) {
  if (!link.entry || !evidenceAllowed(link.entry, subject, successful, evidenceMode)) return false;
  return link.entry.kind === "machine"
    ? link.label === "machine evidence"
    : link.label === "manual evidence";
}

function evidenceEntry(changeRoot, reference) {
  const evidencePath = path.resolve(changeRoot, reference);
  const changePrefix = `${changeRoot}${path.sep}`;
  if (!evidencePath.startsWith(changePrefix) || !fs.existsSync(evidencePath)) return null;
  const evidenceDir = path.join(changeRoot, "evidence");
  const relativeEvidence = path.relative(evidenceDir, evidencePath).replaceAll("\\", "/");
  return evidenceRecords(changeRoot).find((entry) => entry.path === relativeEvidence) || null;
}

function linkedEvidence(changeRoot, line) {
  return [...line.matchAll(/\[((?:machine|manual) evidence)\]\((evidence\/[^)]+)\)/g)]
    .map((match) => ({ label: match[1], reference: match[2], entry: evidenceEntry(changeRoot, match[2]) }));
}

function hasEvidenceFor(changeRoot, subject, successful = false, evidenceMode = "machine") {
  return evidenceRecords(changeRoot).some((entry) => evidenceAllowed(entry, subject, successful, evidenceMode));
}

function hasLinkedEvidenceByMode(changeRoot, progress, subject, successful = false, evidenceMode = "machine") {
  return withoutFencedCode(progress).split(/\r?\n/).some((line) => {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells[1] !== subject) return false;
    return linkedEvidence(changeRoot, line).some((link) => linkedEvidenceAllowed(link, subject, successful, evidenceMode));
  });
}

function importantChecks(review) {
  const visibleReview = withoutFencedCode(review);
  const start = visibleReview.search(/^## Important checks[ \t]*$/im);
  if (start < 0) return [];
  const rest = visibleReview.slice(start);
  const nextHeading = rest.search(/\r?\n## /);
  const section = nextHeading < 0 ? rest : rest.slice(0, nextHeading);
  return [...section.matchAll(/^[ \t]*-[ \t]*(IC-\d+)[ \t]*:[ \t]*(.+)$/gim)]
    .map((match) => ({ id: match[1], text: match[2].trim(), subjects: [...match[2].matchAll(/\b(?:AC-\d+|T\d+)\b/g)].map((item) => item[0]) }))
    .filter((check) => !/^none\s*$/i.test(check.text));
}

function acceptanceSection(review) {
  const visibleReview = withoutFencedCode(review);
  const start = visibleReview.search(/^## Acceptance(?: axis)?[ \t]*$/im);
  if (start < 0) return "";
  const rest = visibleReview.slice(start);
  const nextHeading = rest.search(/\r?\n## /);
  return nextHeading < 0 ? rest : rest.slice(0, nextHeading);
}

function reviewAcceptanceLine(review, subject) {
  const escaped = subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return acceptanceSection(review).match(new RegExp(`^[ \\t]*-[ \\t]*${escaped}[ \\t]*:[ \\t]*(.+)$`, "mi"))?.[1]?.trim() || "";
}

function hasStandardAcceptanceFormatByMode(reviewLine, evidenceMode = "machine") {
  const label = evidenceMode === "portable" ? "(?:machine|manual)" : "machine";
  return new RegExp(`^pass[ \\t]*-[ \\t]*command:[ \\t]*.+?[ \\t]*\\|[ \\t]*result:[ \\t]*exit[ \\t]+0[ \\t]*\\|[ \\t]*evidence:[ \\t]*\\[${label} evidence\\]\\(evidence/[^)\\r\\n]+\\)[ \\t]*$`, "i").test(reviewLine);
}

function hasReviewEvidenceByMode(changeRoot, reviewLine, subject, evidenceMode = "machine") {
  return linkedEvidence(changeRoot, reviewLine).some((link) => linkedEvidenceAllowed(link, subject, true, evidenceMode));
}

function phaseNumber(phase) {
  return Number(phase?.match(/^S([0-8])$/)?.[1] || 0);
}

function validChangeId(value) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*$/);
  if (!match) return false;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.getUTCFullYear() === Number(year)
    && date.getUTCMonth() === Number(month) - 1
    && date.getUTCDate() === Number(day);
}

if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) errors.push(`invalid project root: ${root}`);
if (!validChangeId(changeId)) errors.push("change ID must be a real YYYY-MM-DD-kebab date");

if (!errors.length) {
  const recovery = checkWorkflow(root);
  for (const error of recovery.errors) errors.push(`recovery entry: ${error}`);
}

if (!errors.length) {
  const changeRoot = path.join(root, "docs", "changes", changeId);
  if (!fs.existsSync(changeRoot)) {
    errors.push(`missing change directory: ${changeRoot}`);
  } else {
    if (fs.existsSync(path.join(changeRoot, "CHANGE.md"))) errors.push("legacy CHANGE.md cannot coexist; run init.mjs with --migrate");
    const progress = read("PROGRESS.md");
    const prd = read("PRD.md");
    const context = read("CONTEXT.md");
    const decisions = read("DECISIONS.md");
    const plan = read("PLAN.md");
    const review = read("REVIEW.md");
    const migrationPath = path.join(changeRoot, "MIGRATION.md");
    const mode = field(progress, "Mode") || field(prd, "Mode");
    const risk = field(progress, "Risk") || field(prd, "Risk");
    const status = field(progress, "Status") || field(prd, "Status");
    const phase = field(progress, "Phase");
    const phaseIndex = phaseNumber(phase);
    const type = field(prd, "Type");
    const decisionDepth = field(prd, "Decision depth").toLowerCase();
    const contractRequired = field(prd, "Contract required").toLowerCase();
    const evidenceMode = (field(progress, "Evidence mode") || field(prd, "Evidence mode") || "machine").toLowerCase();
    const prdLedgerSchema = field(prd, "Ledger schema");
    const progressLedgerSchema = field(progress, "Ledger schema");

    if (!["Fast", "Full"].includes(mode)) errors.push("Mode must be Fast or Full");
    if (!["low", "high"].includes(risk)) errors.push("Risk must be low or high");
    if (!["feature", "bug", "refactor", "test", "other"].includes(type)) errors.push("Type is invalid");
    if (risk === "high" && mode !== "Full") errors.push("high risk requires Full mode");
    if (!["active", "blocked", "done"].includes(status)) errors.push("Status must be active, blocked, or done");
    if (phase && !/^S[0-8]$/.test(phase)) errors.push("Phase must be S0 through S8");
    if (decisionDepth && !["pending", "minimal", "compare"].includes(decisionDepth)) errors.push("Decision depth must be pending, minimal, or compare");
    if (contractRequired && !["pending", "no", "yes"].includes(contractRequired)) errors.push("Contract required must be pending, no, or yes");
    if (!EVIDENCE_MODES.has(evidenceMode)) errors.push("Evidence mode must be machine or portable");
    if (field(prd, "ID") !== changeId || field(progress, "Change") !== changeId) errors.push("change ID is inconsistent");
    if (field(prd, "Mode") !== mode || field(prd, "Risk") !== risk || field(prd, "Status") !== status) errors.push("PRD and PROGRESS metadata are inconsistent");
    const prdEvidenceMode = field(prd, "Evidence mode");
    const progressEvidenceMode = field(progress, "Evidence mode");
    if ((prdEvidenceMode && !progressEvidenceMode) || (!prdEvidenceMode && progressEvidenceMode)) errors.push("PRD and PROGRESS must both declare Evidence mode");
    if (prdEvidenceMode && progressEvidenceMode && prdEvidenceMode.toLowerCase() !== progressEvidenceMode.toLowerCase()) errors.push("PRD and PROGRESS Evidence mode are inconsistent");
    if (fs.existsSync(migrationPath) && phaseIndex >= 1) {
      const migration = fs.readFileSync(migrationPath, "utf8");
      if (field(migration, "Status").toLowerCase() !== "complete") errors.push("legacy migration must be complete before S1");
    }
    if (!meaningful(field(prd, "Confirmation"))) errors.push("PRD Confirmation is missing");
    if (prdLedgerSchema !== LEDGER_SCHEMA || progressLedgerSchema !== LEDGER_SCHEMA) errors.push("PRD and PROGRESS require Ledger schema evidence-first-dev/change-ledger-v1");
    if (prdLedgerSchema !== progressLedgerSchema) errors.push("PRD and PROGRESS Ledger schema are inconsistent");
    if (!meaningful(context.match(/^## Project identity[\s\S]*?\n- Repository root:[ \t]*(.*)$/mi)?.[1]?.trim())) errors.push("CONTEXT repository root is missing");
    if (!meaningful(plan.match(/^## Outcome[\s\S]*?\n- Change:[ \t]*(.*)$/mi)?.[1]?.trim())) errors.push("PLAN outcome is missing");
    if (!meaningful(prd.match(/^### Goal[\s\S]*?\n-[ \t]*(.*)$/mi)?.[1]?.trim())) errors.push("PRD Goal is missing");
    if (!meaningful(prd.match(/^### Observed facts[\s\S]*?\n-[ \t]*(.*)$/mi)?.[1]?.trim())) errors.push("PRD observed facts are missing");
    if (/\{\{[A-Z_]+\}\}/.test([progress, prd, context, decisions, plan, review].join("\n"))) errors.push("unrendered template token remains");

    if (phaseIndex >= 1) {
      if (field(prd, "Confirmation").toLowerCase() !== "confirmed") errors.push("S1+ requires explicit confirmed user/product alignment");
      if (!meaningful(lineValue(prd, "Confirmation source"))) errors.push("S1+ requires Confirmation source");
      for (const label of ["In", "Out", "Beneficiary", "Problem cost", "Why now", "Success signal", "Expected effort/opportunity cost", "Acceptable regression", "Kill/stop condition"]) {
        if (!meaningful(lineValue(prd, label))) errors.push(`PRD ${label} is missing`);
      }
    }

    if (phaseIndex >= 2) {
      if (!["minimal", "compare"].includes(decisionDepth)) errors.push("S2+ requires a minimum-change decision depth");
      for (const label of ["Build decision", "Existing mechanism checked", "Smallest correct diff", "New files/dependencies/abstractions and why", "Intentionally not built"]) {
        if (!meaningful(lineValue(prd, label))) errors.push(`PRD ${label} is missing`);
      }
      for (const label of ["Actor and trigger", "Observable outcome", "Invariant", "Ownership boundary", "Trust boundaries", "Failure cost", "Reversibility", "Simplicity ceiling and upgrade trigger"]) {
        if (!meaningful(lineValue(prd, label))) errors.push(`PRD ${label} is missing`);
      }
    }

    const optionRows = [...prd.matchAll(/^\|[ \t]*([AB])[ \t]*\|([^|\r\n]*)\|([^|\r\n]*)\|([^|\r\n]*)\|([^|\r\n]*)\|([^|\r\n]*)\|([^|\r\n]*)\|[ \t]*$/gim)];
    if (phaseIndex >= 3) {
      if (!["minimal", "compare"].includes(decisionDepth)) errors.push("S3 requires Decision depth: minimal or compare");
      if (decisionDepth === "compare") {
        if (optionRows.length < 2 || !optionRows.some((match) => match[1].toUpperCase() === "A") || !optionRows.some((match) => match[1].toUpperCase() === "B")) {
          errors.push("Decision depth compare requires option rows A and B");
        }
        for (const match of optionRows) {
          if (match.slice(2).some((value) => !meaningful(value))) errors.push(`option ${match[1]} has an empty comparison field`);
        }
      }
      for (const label of ["Chosen option", "Why", "Rejected options", "Revisit when"]) {
        const value = lineValue(prd, label);
        if (!(label === "Chosen option" || label === "Rejected options" ? decisionValue(value) : meaningful(value))) errors.push(`PRD ${label} is missing`);
      }
      if (decisionDepth === "minimal" && !meaningful(lineValue(prd, "Why no comparison"))) errors.push("minimal decision requires Why no comparison");
      if (decisionDepth === "compare") {
        if (!/^##\s+D-\d+/mi.test(decisions)) errors.push("S3 compare requires a numbered decision in DECISIONS.md");
        if (!decisionValue(lineValue(decisions, "Chosen")) || !meaningful(lineValue(decisions, "Reason tied to constraints/evidence"))) errors.push("DECISIONS.md needs chosen option and evidence-based reason");
      }
    }

    if (phaseIndex >= 4) {
      if (!["no", "yes"].includes(contractRequired)) errors.push("S4 requires Contract required: no or yes");
      if (contractRequired === "yes") {
        for (const label of ["Inputs/outputs", "Errors and validation", "Timeout/retry/idempotency", "Compatibility", "Dependency failure", "Data change or `N/A - reason`", "Migration", "Rollback", "Release/config concerns"]) {
          if (!meaningful(lineValue(prd, label))) errors.push(`PRD ${label} is missing`);
        }
      }
    }

    const acceptanceRows = [...prd.matchAll(/^\|[ \t]*(AC-\d+)[ \t]*\|([^|\r\n]*)\|([^|\r\n]*)\|([^|\r\n]*)\|[ \t]*(pending|pass|fail|blocked)[ \t]*\|[ \t]*$/gim)];
    const ids = acceptanceRows.map((match) => match[1]);
    if (!acceptanceRows.length) errors.push("PRD needs at least one AC row with a valid status");
    if (new Set(ids).size !== ids.length) errors.push("acceptance IDs must be unique");
    for (const match of acceptanceRows) {
      if (!meaningful(match[2]) || !meaningful(match[3]) || !meaningful(match[4])) {
        errors.push(`${match[1]} needs behavior, verification, and expected result`);
      }
    }
    const evidenceReferences = [...withoutFencedCode(progress).matchAll(/\]\((evidence\/[^)]+)\)/g)].map((match) => match[1]);
    for (const reference of evidenceReferences) {
      const evidencePath = path.resolve(changeRoot, reference);
      if (!evidencePath.startsWith(`${changeRoot}${path.sep}`) || !fs.existsSync(evidencePath)) errors.push(`PROGRESS references missing evidence: ${reference}`);
    }

    const activeTasks = [...progress.matchAll(/^- \[>\]\s*T\d+/gim)].length;
    if (activeTasks > 1) errors.push("PROGRESS may have only one active task");
    const planRows = [...plan.matchAll(/^\|[ \t]*(T\d+)[ \t]*\|([^|\r\n]*)\|([^|\r\n]*)\|([^|\r\n]*)\|([^|\r\n]*)\|([^|\r\n]*)\|[ \t]*(low|high)[ \t]*\|[ \t]*(queued|active|done|blocked)[ \t]*\|[ \t]*$/gim)];
    if (phaseIndex >= 5) {
      if (!planRows.length) errors.push("S5 requires at least one task row in PLAN.md");
      const planIds = new Set(planRows.map((match) => match[1]));
      if (planIds.size !== planRows.length) errors.push("PLAN task IDs must be unique");
      for (const match of planRows) {
        if (!meaningful(match[2]) || !meaningful(match[4]) || !meaningful(match[5]) || !meaningful(match[6]) || !/^(low|high)$/i.test(match[7])) errors.push(`${match[1]} needs task, output, verification, stop condition, and risk`);
        const dependencies = [...match[3].matchAll(/\bT\d+\b/g)].map((dependency) => dependency[0]);
        for (const dependency of dependencies) if (!planIds.has(dependency)) errors.push(`${match[1]} depends on missing task ${dependency}`);
      }
      const dependenciesByTask = new Map(planRows.map((match) => [match[1], [...match[3].matchAll(/\bT\d+\b/g)].map((dependency) => dependency[0])]));
      const visiting = new Set();
      const visited = new Set();
      let cycleDetected = false;
      function visit(taskId) {
        if (visiting.has(taskId)) {
          cycleDetected = true;
          return;
        }
        if (visited.has(taskId)) return;
        visiting.add(taskId);
        for (const dependency of dependenciesByTask.get(taskId) || []) if (planIds.has(dependency)) visit(dependency);
        visiting.delete(taskId);
        visited.add(taskId);
      }
      for (const taskId of planIds) visit(taskId);
      if (cycleDetected) errors.push("PLAN task dependencies contain a cycle");
      if (field(progress, "Current AC").toLowerCase() === "none") errors.push("S5+ requires a current AC");
      const activeTask = progress.match(/^- \[>\]\s*(T\d+)/im)?.[1];
      if (status === "active" && activeTasks !== 1) errors.push("S5/S6 active work requires exactly one active task");
      if (activeTask && !planRows.some((match) => match[1] === activeTask)) errors.push(`${activeTask} is active in PROGRESS but absent from PLAN.md`);
      const planActive = planRows.filter((match) => match[8].toLowerCase() === "active");
      if (status === "active" && planActive.length !== 1) errors.push("PLAN.md must have exactly one active task during S5-S7");
      if (activeTask && planActive.length === 1 && planActive[0][1] !== activeTask) errors.push("PLAN.md and PROGRESS.md active task mismatch");
    }
    if (status === "done" && activeTasks !== 0) errors.push("done requires no active task");
    if (status === "done" && field(progress, "Blockers").toLowerCase() !== "none") errors.push("done requires Blockers: none");
    if (status === "done" && phaseIndex !== 8) errors.push("done requires Phase S8");
    if (status === "blocked" && !decisionValue(field(progress, "Blockers"))) errors.push("blocked requires a concrete Blockers entry");
    if (mode === "Full") {
      read("RESEARCH.md");
      read("PR.md");
      if (!fs.existsSync(path.join(root, "docs", "DEBTS.md"))) errors.push("Full requires docs/DEBTS.md");
    }
    if (status === "done") {
      if (acceptanceRows.some((match) => match[5].toLowerCase() !== "pass")) errors.push("done requires every AC to be pass; pending, fail, or blocked is not complete");
      for (const id of ids) {
        if (!hasLinkedEvidenceByMode(changeRoot, progress, id, true, evidenceMode) && !hasEvidenceFor(changeRoot, id, true, evidenceMode)) errors.push(`${id} needs a successful ${evidenceMode === "portable" ? "machine or manual" : "machine"} evidence reference in PROGRESS.md or evidence/`);
        const reviewLine = reviewAcceptanceLine(review, id);
        if (!hasStandardAcceptanceFormatByMode(reviewLine, evidenceMode) || !hasReviewEvidenceByMode(changeRoot, reviewLine, id, evidenceMode)) errors.push(`REVIEW.md needs an individual PASS in standard Command/Result/Evidence format with a valid evidence link for ${id}`);
      }
      for (const check of importantChecks(review)) {
        if (!check.subjects.length) errors.push(`${check.id} must name an AC or task subject`);
        for (const subject of check.subjects) if (!hasEvidenceFor(changeRoot, subject, true, evidenceMode)) errors.push(`${check.id} requires successful ${evidenceMode === "portable" ? "machine or manual evidence" : "run-evidence"} for ${subject}`);
      }
      if (planRows.some((match) => match[8].toLowerCase() !== "done")) errors.push("done requires every PLAN task to be done");
      if (!/^[-*] \*\*Status\*\*:\s*final\s*$/im.test(review)) errors.push("done requires REVIEW Status final");
      if (!/^- Standards:[ \t]*PASS[ \t]*-/im.test(review)) errors.push("done requires Standards PASS in REVIEW");
      if (!/^- Acceptance:[ \t]*PASS[ \t]*-/im.test(review)) errors.push("done requires Acceptance PASS in REVIEW");
      if (mode === "Full") {
        if (!fs.existsSync(path.join(changeRoot, "PR.md"))) errors.push("Full done requires PR.md");
        if (!fs.existsSync(path.join(root, "docs", "DEBTS.md"))) errors.push("Full done requires docs/DEBTS.md");
        else {
          const debtText = fs.readFileSync(path.join(root, "docs", "DEBTS.md"), "utf8");
          const debtSection = prd.match(/## Debt and known limits([\s\S]*?)(?=\n## |$)/i)?.[1] || "";
          const declaredDebtIds = [...debtSection.matchAll(/\b(TD-\d+)\b/g)].map((match) => match[1]);
          const debtRows = [...debtText.matchAll(/^\|[ \t]*(TD-\d+)[ \t]*\|([^|\r\n]*)\|[ \t]*([^|\r\n]*)\|[ \t]*(P[0-3])[ \t]*\|([^|\r\n]*)\|[ \t]*$/gim)];
          const currentDebtRows = debtRows.filter((match) => match[3].trim() === changeId);
          if (declaredDebtIds.length && currentDebtRows.some((match) => !declaredDebtIds.includes(match[1]))) errors.push("PRD debt list and docs/DEBTS.md are inconsistent");
          if (!declaredDebtIds.length && currentDebtRows.length) errors.push("PRD says no debt but docs/DEBTS.md lists debt from this change");
          for (const id of declaredDebtIds) if (!currentDebtRows.some((match) => match[1] === id)) errors.push(`${id} is missing from docs/DEBTS.md for this change`);
        }
      }
    }

    if (phaseIndex >= 7 && status !== "done") {
      for (const check of importantChecks(review)) {
        if (!check.subjects.length) errors.push(`${check.id} must name an AC or task subject`);
        for (const subject of check.subjects) if (!hasEvidenceFor(changeRoot, subject, false, evidenceMode)) errors.push(`${check.id} requires ${evidenceMode === "portable" ? "machine or manual evidence" : "run-evidence"} for ${subject}`);
      }
    }

    const uiRequired = /^- \*\*UI Required\*\*:\s*yes\s*$/im.test(prd);
    if (uiRequired) {
      const prototypePath = path.join(changeRoot, "PROTOTYPE.md");
      if (phaseIndex >= 4 && !fs.existsSync(prototypePath)) errors.push("S4+ UI work needs PROTOTYPE.md");
      else {
        if (fs.existsSync(prototypePath)) {
          const prototype = fs.readFileSync(prototypePath, "utf8");
          if (phaseIndex >= 6 && !/^[-*] \*\*Status\*\*:\s*approved\s*$/im.test(prototype)) errors.push("S6+ UI work requires approved prototype");
          const prototypeReference = lineValue(prototype, "Path");
          if (phaseIndex >= 4 && !meaningful(prototypeReference)) errors.push("PROTOTYPE Path is missing");
          if (phaseIndex >= 4 && meaningful(prototypeReference)) {
            const reference = prototypeReference.replace(/^`|`$/g, "").trim();
            const resolvedPrototype = path.isAbsolute(reference) ? path.resolve(reference) : path.resolve(changeRoot, reference);
            const changePrefix = `${changeRoot}${path.sep}`;
            if (!resolvedPrototype.startsWith(changePrefix)) errors.push("PROTOTYPE Path must stay inside the change directory");
            else if (!fs.existsSync(resolvedPrototype)) errors.push(`PROTOTYPE Path does not exist: ${reference}`);
          }
          if (phaseIndex >= 4) {
            for (const label of ["Route/page", "Components", "Tokens/styles", "Screenshot/running page"]) {
              if (!meaningful(lineValue(prototype, label))) errors.push(`PROTOTYPE ${label} reference is missing`);
            }
          }
          if (phaseIndex >= 6 && !meaningful(lineValue(prototype, "Prototype approval source"))) errors.push("approved prototype needs Prototype approval source");
        }
      }
    }
  }
}

if (errors.length) {
  console.error("validate FAIL (structure only; project behavior still needs real checks):");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("validate PASS (ledger structure is coherent; run actual Standards and Acceptance commands)");
