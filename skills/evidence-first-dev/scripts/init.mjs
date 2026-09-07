#!/usr/bin/env node
/**
 * Initialize a non-trivial evidence-first change ledger without overwriting
 * existing project state.
 *
 * Usage:
 *   node init.mjs <projectRoot> <YYYY-MM-DD-slug> <Fast|Full> <low|high>
 *     <feature|bug|refactor|test|other> [--resume|--upgrade|--migrate]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { syncWorkflow } from "./index.mjs";

const args = process.argv.slice(2);
const [projectArg, changeId, mode, risk, type] = args;
const allowResume = args.includes("--resume");
const upgrade = args.includes("--upgrade");
const migrate = args.includes("--migrate");
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.dirname(scriptDir);
const LEDGER_SCHEMA = "evidence-first-dev/change-ledger-v1";

function fail(message) {
  console.error(`init FAIL: ${message}`);
  process.exit(1);
}

function ensureLedgerSchema(filePath, anchor) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  if (/^- \*\*Ledger schema\*\*:[ \t]*\S+$/mi.test(content)) return;
  const next = content.replace(new RegExp(`^(- \\*\\*${anchor}\\*\\*:[^\\r\\n]*\\r?\\n)`, "mi"), `$1- **Ledger schema**: ${LEDGER_SCHEMA}\n`);
  if (next === content) fail(`cannot add Ledger schema to ${filePath}`);
  fs.writeFileSync(filePath, next, "utf8");
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

if (!projectArg || !changeId || !mode || !risk || !type) {
  fail("usage: node init.mjs <projectRoot> <YYYY-MM-DD-slug> <Fast|Full> <low|high> <type> [--resume|--upgrade|--migrate]");
}
if (!validChangeId(changeId)) fail("change ID must be a real YYYY-MM-DD-kebab date");
if (!/^(Fast|Full)$/.test(mode)) fail("mode must be Fast or Full");
if (!/^(low|high)$/.test(risk)) fail("risk must be low or high");
if (!/^(feature|bug|refactor|test|other)$/.test(type)) fail("type is invalid");
if (risk === "high" && mode !== "Full") fail("high risk requires Full mode");
if (upgrade && mode !== "Full") fail("--upgrade requires Full mode");
if ([allowResume, upgrade, migrate].filter(Boolean).length > 1) fail("choose one of --resume, --upgrade, or --migrate");

const projectRoot = path.resolve(projectArg);
if (!fs.existsSync(projectRoot) || !fs.statSync(projectRoot).isDirectory()) {
  fail(`project root does not exist: ${projectRoot}`);
}

const changeRoot = path.join(projectRoot, "docs", "changes", changeId);
const templateRoot = path.join(skillRoot, "templates");
const coreFiles = ["PRD.md", "CONTEXT.md", "DECISIONS.md", "PLAN.md", "PROGRESS.md", "REVIEW.md"];
const fullFiles = [...coreFiles, "RESEARCH.md", "PR.md"];
const files = [...(mode === "Full" ? fullFiles : coreFiles)];
if (migrate) files.push("MIGRATION.md");

const legacyChangePath = path.join(changeRoot, "CHANGE.md");
if (allowResume) {
  if (!fs.existsSync(changeRoot) || !fs.statSync(changeRoot).isDirectory()) {
    fail(`--resume requires an existing change directory: ${changeRoot}`);
  }
  for (const name of ["PRD.md", "PROGRESS.md"]) {
    if (!fs.existsSync(path.join(changeRoot, name))) fail(`--resume requires an existing ${name}`);
  }
}
if (migrate) {
  if (!fs.existsSync(changeRoot) || !fs.existsSync(legacyChangePath)) {
    fail("--migrate requires an existing dev-workflow CHANGE.md");
  }
  if (fs.existsSync(path.join(changeRoot, "CHANGE.legacy.md"))) {
    fail("migration already exists at CHANGE.legacy.md");
  }
  for (const name of ["PRD.md", "PROGRESS.md"]) {
    if (fs.existsSync(path.join(changeRoot, name))) fail(`--migrate refuses mixed state with ${name}`);
  }
  const legacy = fs.readFileSync(legacyChangePath, "utf8");
  const legacyId = legacy.match(/^[-*] \*\*ID\*\*:[ \t]*(.*)$/mi)?.[1]?.trim();
  if (legacyId && legacyId !== changeId) fail("legacy CHANGE.md ID does not match the requested change ID");
  fs.renameSync(legacyChangePath, path.join(changeRoot, "CHANGE.legacy.md"));
} else if (fs.existsSync(changeRoot) && !allowResume && !upgrade) {
  if (fs.existsSync(legacyChangePath)) fail(`legacy CHANGE.md found; use --migrate before initializing ${changeId}`);
  fail(`refusing to overwrite existing change directory: ${changeRoot}`);
} else if (fs.existsSync(legacyChangePath)) {
  fail("legacy CHANGE.md cannot coexist with the canonical evidence-first ledger; use --migrate");
}
if (upgrade) {
  const progressPath = path.join(changeRoot, "PROGRESS.md");
  if (!fs.existsSync(progressPath)) fail("--upgrade requires an existing Fast PROGRESS.md");
  const progress = fs.readFileSync(progressPath, "utf8");
  if (!/\*\*Mode\*\*:[ \t]*Fast\b/.test(progress)) fail("--upgrade requires PROGRESS.md Mode Fast");
}

if (allowResume || upgrade) {
  ensureLedgerSchema(path.join(changeRoot, "PRD.md"), "ID");
  ensureLedgerSchema(path.join(changeRoot, "PROGRESS.md"), "Change");
}

fs.mkdirSync(changeRoot, { recursive: true });
const created = [];

function render(name) {
  return fs.readFileSync(path.join(templateRoot, name), "utf8")
    .replaceAll("{{CHANGE_ID}}", changeId)
    .replaceAll("{{MODE}}", mode)
    .replaceAll("{{RISK}}", risk)
    .replaceAll("{{TYPE}}", type)
    .replaceAll("{{DATE}}", new Date().toISOString().slice(0, 10));
}

for (const name of files) {
  const target = path.join(changeRoot, name);
  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, render(name), "utf8");
    created.push(name);
  }
}

if (upgrade) {
  for (const name of ["PRD.md", "PROGRESS.md"]) {
    const target = path.join(changeRoot, name);
    let content = fs.readFileSync(target, "utf8");
    content = content.replace(/(\*\*Mode\*\*:[ \t]*)Fast\b/g, "$1Full");
    content = content.replace(/(\*\*Risk\*\*:[ \t]*)low\b/g, `$1${risk}`);
    fs.writeFileSync(target, content, "utf8");
  }
}

if (mode === "Full") {
  const debtPath = path.join(projectRoot, "docs", "DEBTS.md");
  if (!fs.existsSync(debtPath)) {
    fs.mkdirSync(path.dirname(debtPath), { recursive: true });
    fs.copyFileSync(path.join(templateRoot, "DEBTS.md"), debtPath);
    created.push("docs/DEBTS.md");
  }
}

const projectMemory = syncWorkflow(projectRoot);
created.push(...projectMemory.created);

const action = upgrade ? "upgraded Fast ledger to Full" : migrate ? "migrated legacy ledger" : allowResume ? "resumed ledger" : "initialized ledger";
console.log(`init PASS: ${action} for ${changeId}`);
console.log(`root: ${changeRoot}`);
console.log(`created: ${created.length ? created.join(", ") : "none"}`);
console.log(migrate
  ? "next: map CHANGE.legacy.md into PRD/CONTEXT/DECISIONS/PLAN, then validate before implementation"
  : "next: run index.mjs resume to recover the active task, inspect repository state, fill PRD acceptance, and validate before implementation");
