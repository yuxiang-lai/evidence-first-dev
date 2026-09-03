#!/usr/bin/env node
/**
 * Maintain and read the project-level recovery entry for evidence-first ledgers.
 *
 * Usage:
 *   node index.mjs sync <projectRoot>
 *   node index.mjs resume <projectRoot> [changeId]
 *   node index.mjs check <projectRoot>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const GENERATED_BEGIN = "<!-- BEGIN GENERATED STATUS -->";
export const GENERATED_END = "<!-- END GENERATED STATUS -->";
export const PROJECT_CONTEXT_SCHEMA = "evidence-first-dev/project-context-v1";
export const WORKFLOW_CONTRACT = "evidence-first-dev/workflow-v1";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.dirname(scriptDir);
const workflowTemplatePath = path.join(skillRoot, "templates", "WORKFLOW.md");
const projectContextTemplatePath = path.join(skillRoot, "templates", "PROJECT-CONTEXT.md");

function fail(message, code = 1) {
  console.error(`index FAIL: ${message}`);
  process.exitCode = code;
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

export function field(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.match(new RegExp(`^[-*] \\*\\*${escaped}\\*\\*:[ \\t]*(.*)$`, "mi"))?.[1]?.trim() || "";
}

function lineValue(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.match(new RegExp(`^-[ \\t]*(?:\\*\\*)?${escaped}(?:\\*\\*)?:[ \\t]*(.*)$`, "mi"))?.[1]?.trim() || "";
}

function firstBulletAfterHeading(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const start = text.search(new RegExp(`^### ${escaped}[ \\t]*$`, "im"));
  if (start < 0) return "";
  const rest = text.slice(start);
  const nextHeading = rest.search(/\r?\n#{2,3} /);
  const section = nextHeading < 0 ? rest : rest.slice(0, nextHeading);
  return section.match(/^[*-][ \\t]+(.+?)[ \\t]*$/m)?.[1]?.trim() || "";
}

function compact(value, fallback = "not recorded") {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized || /^(tbd|todo|-|<[^>]+>)$/i.test(normalized)) return fallback;
  return normalized.length > 220 ? `${normalized.slice(0, 217)}...` : normalized;
}

function md(value) {
  return compact(value).replaceAll("|", "\\|");
}

function relative(root, filePath) {
  return path.relative(root, filePath).replaceAll("\\", "/");
}

function latestEvidence(progress) {
  const rows = progress.split(/\r?\n/).filter((line) => /^\|/.test(line));
  const dataRows = rows
    .filter((line) => !/^\|\s*(Date|---)/i.test(line))
    .filter((line) => line.split("|")[1]?.trim());
  if (!dataRows.length) return "not recorded";
  const cells = dataRows.at(-1).split("|").slice(1, -1).map((cell) => cell.trim());
  if (cells.length < 4 || !cells[0]) return "not recorded";
  return compact(`${cells[2] || "evidence"} -> ${cells[3] || "result not recorded"}`);
}

function currentTask(progress) {
  const match = progress.match(/^- \[>]\s*(T\d+)\s*:\s*(.*?)(?:\s*->\s*(.*))?$/im);
  if (!match) return "none";
  return compact(`${match[1]}: ${match[2]}${match[3] ? ` -> ${match[3]}` : ""}`);
}

function acceptanceSummary(prd) {
  const rows = [...prd.matchAll(/^\|[ \t]*(AC-\d+)[ \t]*\|[^|\r\n]*\|[^|\r\n]*\|[^|\r\n]*\|[ \t]*(pending|pass|fail|blocked)[ \t]*\|[ \t]*$/gim)];
  if (!rows.length) return "not recorded";
  return rows.map((match) => `${match[1]}=${match[2].toLowerCase()}`).join(", ");
}

function changeRecord(root, changeId) {
  const changeRoot = path.join(root, "docs", "changes", changeId);
  const progressPath = path.join(changeRoot, "PROGRESS.md");
  const prdPath = path.join(changeRoot, "PRD.md");
  const progress = readText(progressPath);
  const prd = readText(prdPath);
  const status = field(progress, "Status") || field(prd, "Status") || "invalid";
  const record = {
    id: changeId,
    path: changeRoot,
    progressPath,
    prdPath,
    progress,
    prd,
    mode: field(progress, "Mode") || field(prd, "Mode") || "unknown",
    risk: field(progress, "Risk") || field(prd, "Risk") || "unknown",
    type: field(prd, "Type") || "unknown",
    phase: field(progress, "Phase") || "unknown",
    status: status.toLowerCase(),
    currentAc: field(progress, "Current AC") || "none",
    acceptance: acceptanceSummary(prd),
    doing: lineValue(progress, "Doing"),
    next: lineValue(progress, "Next"),
    blockers: lineValue(progress, "Blockers"),
    lastProven: lineValue(progress, "Last proven state"),
    task: currentTask(progress),
    evidence: latestEvidence(progress),
    goal: firstBulletAfterHeading(prd, "Goal"),
    relativeProgress: relative(root, progressPath),
    relativePrd: relative(root, prdPath),
    modified: Math.max(
      fs.existsSync(progressPath) ? fs.statSync(progressPath).mtimeMs : 0,
      fs.existsSync(prdPath) ? fs.statSync(prdPath).mtimeMs : 0,
    ),
  };
  return record;
}

export function scanProject(root) {
  const changesRoot = path.join(root, "docs", "changes");
  if (!fs.existsSync(changesRoot)) return { changes: [], orphanDirectories: [] };
  const entries = fs.readdirSync(changesRoot, { withFileTypes: true });
  const changes = [];
  const orphanDirectories = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const changeRoot = path.join(changesRoot, entry.name);
    if (fs.existsSync(path.join(changeRoot, "PROGRESS.md"))) {
      changes.push(changeRecord(root, entry.name));
    } else {
      orphanDirectories.push(relative(root, changeRoot));
    }
  }
  changes.sort((a, b) => b.modified - a.modified || a.id.localeCompare(b.id));
  orphanDirectories.sort();
  return { changes, orphanDirectories };
}

function renderRecord(record, root) {
  const workflowRoot = path.join(root, "docs");
  const detail = [
    `[PRD.md](${relative(workflowRoot, record.prdPath)})`,
    `[CONTEXT.md](${relative(workflowRoot, path.join(record.path, "CONTEXT.md"))})`,
    `[DECISIONS.md](${relative(workflowRoot, path.join(record.path, "DECISIONS.md"))})`,
    `[PLAN.md](${relative(workflowRoot, path.join(record.path, "PLAN.md"))})`,
    `[REVIEW.md](${relative(workflowRoot, path.join(record.path, "REVIEW.md"))})`,
  ].join(" | ");
  return [
    `#### \`${record.id}\``,
    `- Mode / phase / risk / type / status: \`${md(record.mode)}\` / \`${md(record.phase)}\` / \`${md(record.risk)}\` / \`${md(record.type)}\` / **${md(record.status)}**`,
    `- Goal: ${md(record.goal)}`,
    `- Current AC: \`${md(record.currentAc)}\``,
    `- Acceptance: ${md(record.acceptance)}`,
    `- Current task: ${md(record.task)}`,
    `- Doing: ${md(record.doing)}`,
    `- Next: ${md(record.next)}`,
    `- Last proven state: ${md(record.lastProven)}`,
    `- Latest evidence: ${md(record.evidence)}`,
    `- Blockers: ${md(record.blockers)}`,
    `- Ledger: [PROGRESS.md](${relative(workflowRoot, record.progressPath)}) | ${detail}`,
  ].join("\n");
}

export function renderGeneratedStatus(root, project = scanProject(root)) {
  const active = project.changes.filter((record) => record.status === "active");
  const blocked = project.changes.filter((record) => record.status === "blocked");
  const done = project.changes.filter((record) => record.status === "done").slice(0, 10);
  const invalid = project.changes.filter((record) => !["active", "blocked", "done"].includes(record.status));
  const lines = [
    GENERATED_BEGIN,
    "## Current Change Status",
    "",
    `Unfinished changes: **${active.length + blocked.length}** | Active: **${active.length}** | Blocked: **${blocked.length}**`,
    "",
    "The detailed ledger is authoritative. This section is generated from each change's `PROGRESS.md` and `PRD.md`.",
    "",
  ];
  const addSection = (title, records, emptyText) => {
    lines.push(`### ${title}`, "");
    if (records.length) {
      for (const record of records) lines.push(renderRecord(record, root), "");
    } else {
      lines.push(emptyText, "");
    }
  };
  addSection("Active", active, "No active changes.");
  addSection("Blocked", blocked, "No blocked changes.");
  addSection("Recently done", done, "No completed changes recorded.");
  if (invalid.length || project.orphanDirectories.length) {
    lines.push("### Needs repair", "");
    for (const record of invalid) lines.push(`- \`${record.id}\`: invalid status \`${md(record.status)}\`; repair its ledger before resuming.`);
    for (const directory of project.orphanDirectories) lines.push(`- \`${directory}\`: no PROGRESS.md; inspect or remove the incomplete ledger directory.`);
    lines.push("");
  }
  lines.push(GENERATED_END);
  return lines.join("\n");
}

function replaceGeneratedBlock(content, generated) {
  const pattern = new RegExp(`${GENERATED_BEGIN}[\\s\\S]*?${GENERATED_END}`);
  if (pattern.test(content)) return content.replace(pattern, generated);
  return `${content.replace(/\s*$/, "")}\n\n${generated}\n`;
}

function renderTemplate(templatePath, replacements) {
  let content = fs.readFileSync(templatePath, "utf8");
  for (const [token, value] of Object.entries(replacements)) content = content.replaceAll(token, value);
  return content;
}

export function ensureProjectMemory(root) {
  const docsRoot = path.join(root, "docs");
  fs.mkdirSync(docsRoot, { recursive: true });
  const created = [];
  const contextPath = path.join(docsRoot, "CONTEXT.md");
  if (!fs.existsSync(contextPath)) {
    fs.writeFileSync(contextPath, renderTemplate(projectContextTemplatePath, {
      "{{PROJECT_ROOT}}": root,
      "{{DATE}}": new Date().toISOString().slice(0, 10),
    }), "utf8");
    created.push("docs/CONTEXT.md");
  } else {
    const current = readText(contextPath);
    if (!field(current, "Schema")) {
      const next = current.replace(/^# PROJECT CONTEXT\r?\n/, `$&\n- **Schema**: ${PROJECT_CONTEXT_SCHEMA}\n`);
      if (next !== current) fs.writeFileSync(contextPath, next, "utf8");
    }
  }
  const workflowPath = path.join(docsRoot, "WORKFLOW.md");
  if (!fs.existsSync(workflowPath)) {
    fs.copyFileSync(workflowTemplatePath, workflowPath);
    created.push("docs/WORKFLOW.md");
  } else {
    const current = readText(workflowPath);
    if (!field(current, "Workflow contract")) {
      const next = current.replace(/^# WORKFLOW\r?\n/, `$&\n- **Workflow contract**: ${WORKFLOW_CONTRACT}\n`);
      if (next !== current) fs.writeFileSync(workflowPath, next, "utf8");
    }
  }
  return { created, contextPath, workflowPath };
}

export function syncWorkflow(root) {
  const memory = ensureProjectMemory(root);
  const project = scanProject(root);
  const generated = renderGeneratedStatus(root, project);
  const current = readText(memory.workflowPath);
  const next = replaceGeneratedBlock(current, generated);
  if (next !== current) fs.writeFileSync(memory.workflowPath, next, "utf8");
  return { ...memory, project, generated, changed: next !== current };
}

function extractGeneratedBlock(content) {
  return content.match(new RegExp(`${GENERATED_BEGIN}[\\s\\S]*?${GENERATED_END}`))?.[0] || "";
}

export function checkWorkflow(root) {
  const errors = [];
  const docsRoot = path.join(root, "docs");
  const contextPath = path.join(docsRoot, "CONTEXT.md");
  const workflowPath = path.join(docsRoot, "WORKFLOW.md");
  if (!fs.existsSync(contextPath)) errors.push("missing docs/CONTEXT.md project memory");
  else {
    const context = readText(contextPath);
    if (!field(context, "Repository root")) errors.push("docs/CONTEXT.md Repository root is missing");
    if (field(context, "Schema") !== PROJECT_CONTEXT_SCHEMA) errors.push(`docs/CONTEXT.md requires Schema ${PROJECT_CONTEXT_SCHEMA}`);
  }
  if (!fs.existsSync(workflowPath)) errors.push("missing docs/WORKFLOW.md recovery entry");
  else if (field(readText(workflowPath), "Workflow contract") !== WORKFLOW_CONTRACT) errors.push(`docs/WORKFLOW.md requires Workflow contract ${WORKFLOW_CONTRACT}`);
  const project = scanProject(root);
  if (project.orphanDirectories.length) errors.push(`ledger directories without PROGRESS.md: ${project.orphanDirectories.join(", ")}`);
  if (fs.existsSync(workflowPath)) {
    const actual = extractGeneratedBlock(readText(workflowPath));
    const expected = renderGeneratedStatus(root, project);
    if (!actual) errors.push("docs/WORKFLOW.md has no generated status block");
    else if (actual !== expected) errors.push("docs/WORKFLOW.md status is stale; run index.mjs sync");
  }
  return { errors, project };
}

function printResume(root, requestedId) {
  const result = syncWorkflow(root);
  const { changes } = result.project;
  const unfinished = changes.filter((record) => record.status === "active" || record.status === "blocked");
  let selected;
  if (requestedId) {
    selected = changes.find((record) => record.id === requestedId);
    if (!selected) {
      fail(`change not found: ${requestedId}`);
      return;
    }
    if (!["active", "blocked"].includes(selected.status)) {
      fail(`change is not unfinished: ${requestedId}`);
      return;
    }
  } else if (unfinished.length === 1) {
    selected = unfinished[0];
  }

  if (!selected && unfinished.length > 1) {
    console.log("RESUME NEEDS-CHOICE: multiple unfinished changes");
    for (const record of unfinished) console.log(`- ${record.id} | ${record.status} | ${record.phase} | ${record.task} | next: ${compact(record.next)}`);
    console.log(`Choose one: node ${relative(process.cwd(), path.join(skillRoot, "scripts", "index.mjs"))} resume ${root} <change-id>`);
    return;
  }
  if (!selected) {
    console.log("RESUME CLEAN: no active or blocked changes");
    console.log(`Read ${path.relative(root, result.workflowPath).replaceAll("\\", "/")} for the project memory entry.`);
    return;
  }
  console.log(`RESUME ${selected.status === "blocked" ? "BLOCKED" : "READY"}: ${selected.id}`);
  console.log(`Phase: ${selected.phase} | Mode: ${selected.mode} | Risk: ${selected.risk}`);
  console.log(`Current AC: ${compact(selected.currentAc)} | Current task: ${compact(selected.task)}`);
  console.log(`Doing: ${compact(selected.doing)}`);
  console.log(`Next: ${compact(selected.next)}`);
  console.log(`Last proven state: ${compact(selected.lastProven)}`);
  console.log(`Latest evidence: ${compact(selected.evidence)}`);
  console.log(`Blockers: ${compact(selected.blockers)}`);
  console.log(`Read first: ${selected.relativeProgress}, then ${relative(root, selected.prdPath)}, ${relative(root, path.join(selected.path, "CONTEXT.md"))}, ${relative(root, path.join(selected.path, "DECISIONS.md"))}, ${relative(root, path.join(selected.path, "PLAN.md"))}`);
  console.log("Continue from the first incomplete task after rechecking the last evidence and repository status.");
}

function main() {
  const [command, rootArg, requestedId] = process.argv.slice(2);
  if (!command || !rootArg || !["sync", "resume", "check"].includes(command)) {
    fail("usage: node index.mjs <sync|resume|check> <projectRoot> [changeId]");
    return;
  }
  const root = path.resolve(rootArg);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    fail(`project root does not exist: ${root}`);
    return;
  }
  if (command === "sync") {
    const result = syncWorkflow(root);
    console.log(`index PASS: synced ${result.project.changes.length} change ledger(s)`);
    console.log(`entry: ${path.join(root, "docs", "WORKFLOW.md")}`);
    if (result.project.orphanDirectories.length) console.log(`repair: ${result.project.orphanDirectories.join(", ")}`);
    return;
  }
  if (command === "resume") {
    printResume(root, requestedId);
    return;
  }
  const result = checkWorkflow(root);
  if (result.errors.length) {
    console.error("index FAIL: recovery entry is not current");
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`index PASS: recovery entry is current for ${result.project.changes.length} change ledger(s)`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) main();
