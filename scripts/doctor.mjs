#!/usr/bin/env node
/**
 * Check whether a project has a recognizable Evidence-First Dev rule entry.
 * This is optional automation; the workflow itself remains Markdown-only.
 */
import fs from "node:fs";
import path from "node:path";

const projectArg = process.argv[2];
if (!projectArg || process.argv.includes("--help")) {
  console.log("usage: node doctor.mjs <project-root>");
  process.exit(projectArg ? 0 : 1);
}

const projectRoot = path.resolve(projectArg);
if (!fs.existsSync(projectRoot) || !fs.statSync(projectRoot).isDirectory()) {
  console.error(`doctor FAIL: project root does not exist: ${projectRoot}`);
  process.exit(1);
}

const candidates = [
  ["Cursor rule", ".cursor/rules/evidence-first-dev.mdc"],
  ["Cursor legacy skill", ".cursor/evidence-first-dev/SKILL.md"],
  ["Portable project rule", "AGENTS.md"],
  ["Claude Code skill", ".claude/skills/evidence-first-dev/SKILL.md"],
  ["Local skill checkout", ".ai/evidence-first-dev/SKILL.md"],
  ["Windsurf rule", ".windsurf/rules/evidence-first-dev.md"],
  ["Cline rule", ".clinerules/evidence-first-dev.md"],
  ["Roo Code rule", ".roo/rules/evidence-first-dev.md"],
  ["GitHub Copilot instructions", ".github/copilot-instructions.md"],
  ["Gemini CLI instructions", "GEMINI.md"],
  ["Aider conventions", "CONVENTIONS.md"],
];

function isEvidenceEntry(relative) {
  const filePath = path.join(projectRoot, relative);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
  const content = fs.readFileSync(filePath, "utf8");
  return relative.endsWith("SKILL.md")
    ? /(^|\n)name:\s*evidence-first-dev\b/i.test(content)
    : /evidence-first(?:[- ]dev| development)/i.test(content);
}

const found = candidates.filter(([, relative]) => isEvidenceEntry(relative));

if (found.length === 0) {
  console.error("doctor FAIL: no Evidence-First Dev rule entry found");
  console.error("expected one of:");
  for (const [, relative] of candidates) console.error(`- ${relative}`);
  process.exit(1);
}

console.log(`doctor PASS: ${found.map(([label]) => label).join(", ")}`);
const workflowPath = path.join(projectRoot, "docs", "WORKFLOW.md");
if (fs.existsSync(workflowPath)) {
  console.log("memory PASS: docs/WORKFLOW.md exists");
} else {
  console.log("memory INFO: docs/WORKFLOW.md not found (create it for resumable work)");
}
