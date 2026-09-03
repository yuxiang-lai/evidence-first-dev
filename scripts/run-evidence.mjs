#!/usr/bin/env node
/**
 * Run one project command and persist machine-captured evidence in a change.
 *
 * Usage:
 *   node run-evidence.mjs <projectRoot> <changeId> <task-or-ac>
 *     [--no-preview] [--timeout-ms <n>] [--allow-dangerous] --
 *     <executable> [args...]
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { syncWorkflow } from "./index.mjs";

const rawArgs = process.argv.slice(2);
const separator = rawArgs.indexOf("--");
const metadataArgs = separator >= 0 ? rawArgs.slice(0, separator) : rawArgs;
const commandArgs = separator >= 0 ? rawArgs.slice(separator + 1) : [];
const [projectArg, changeId, subject, ...options] = metadataArgs;
const noPreview = options.includes("--no-preview");
const allowDangerous = options.includes("--allow-dangerous");
const timeoutIndex = options.indexOf("--timeout-ms");
const timeoutMs = timeoutIndex >= 0 ? Number(options[timeoutIndex + 1]) : 120000;
const executable = commandArgs[0] || "";
const executableArgs = commandArgs.slice(1);
const command = [executable, ...executableArgs].join(" ");
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const EVIDENCE_SCHEMA = "evidence-first-dev/command-evidence-v2";
const EVIDENCE_PRODUCER = "run-evidence.mjs";
const FAILURE_CLASSES = new Set(["success", "non-zero-exit", "timeout", "output-limit", "spawn-failure", "signal"]);
const WINDOWS_COMMAND_WRAPPERS = new Set(["npm", "npx"]);
const DANGEROUS_COMMANDS = [
  /\bgit\s+(?:reset|clean|restore|checkout)\b/i,
  /\b(?:rm|del|erase|rmdir|remove-item)\b/i,
  /\b(?:format|shutdown|restart-computer)\b/i,
  /\b(?:dropdb|drop\s+database)\b/i,
];

function fail(message) {
  console.error(`evidence FAIL: ${message}`);
  process.exit(1);
}

function cell(value) {
  return redact(String(value || "")).replace(/\r?\n/g, " ").replaceAll("|", "\\|").trim();
}

function hash(value) {
  return crypto.createHash("sha256").update(value || "", "utf8").digest("hex");
}

function preview(value) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  return normalized.length > 500 ? `${normalized.slice(0, 497)}...` : normalized;
}

function redact(value) {
  return String(value || "")
    .replace(/(authorization\s*[:=]\s*bearer\s+)[^\s,;]+/gi, "$1[REDACTED]")
    .replace(/((?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|passwd|secret)\s*[:=]\s*)[^\s,;]+/gi, "$1[REDACTED]")
    .replace(/\b(?:sk|ghp|github_pat|xox[baprs])_[A-Za-z0-9_-]+\b/g, "[REDACTED]");
}

function invocationForPlatform(value, args) {
  if (process.platform === "win32") {
    const base = path.basename(value).toLowerCase().replace(/\.(?:cmd|exe|bat)$/i, "");
    if (WINDOWS_COMMAND_WRAPPERS.has(base)) {
      const cliPath = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", `${base}-cli.js`);
      if (fs.existsSync(cliPath)) return { executable: process.execPath, args: [cliPath, ...args] };
    }
  }
  return { executable: value, args };
}

function isDangerousCommand() {
  const name = path.basename(executable).toLowerCase().replace(/\.(?:cmd|exe|bat)$/i, "");
  if (name === "git") return executableArgs.some((argument) => /^(reset|clean|restore|checkout)$/i.test(argument));
  if (["rm", "del", "erase", "rmdir", "remove-item", "format", "shutdown", "restart-computer", "dropdb"].includes(name)) return true;
  if (["powershell", "pwsh", "cmd"].includes(name)) return DANGEROUS_COMMANDS.some((pattern) => pattern.test(executableArgs.join(" ")));
  return false;
}

if (!projectArg || !changeId || !subject || !executable || !commandArgs.length) {
  fail("usage: node run-evidence.mjs <projectRoot> <changeId> <task-or-ac> [--no-preview] [--timeout-ms <n>] [--allow-dangerous] -- <executable> [args...]");
}
if (timeoutIndex >= 0 && (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 24 * 60 * 60 * 1000)) fail("--timeout-ms must be an integer from 1 to 86400000");
if (isDangerousCommand() && !allowDangerous) fail("refusing a potentially destructive verification command; pass --allow-dangerous only with explicit intent");

const projectRoot = path.resolve(projectArg);
const changesRoot = path.resolve(projectRoot, "docs", "changes");
const changeRoot = path.resolve(changesRoot, changeId);
const progressPath = path.join(changeRoot, "PROGRESS.md");
if (!fs.existsSync(projectRoot) || !fs.statSync(projectRoot).isDirectory()) fail(`project root does not exist: ${projectRoot}`);
if (!changeRoot.startsWith(`${changesRoot}${path.sep}`)) fail("change ID must stay inside docs/changes");
if (!fs.existsSync(progressPath)) fail(`missing change PROGRESS.md: ${progressPath}`);

const startedAt = new Date();
const invocation = invocationForPlatform(executable, executableArgs);
const result = spawnSync(invocation.executable, invocation.args, {
  cwd: projectRoot,
  shell: false,
  encoding: "utf8",
  timeout: timeoutMs,
  maxBuffer: MAX_OUTPUT_BYTES,
});
const finishedAt = new Date();
const stdout = result.stdout || "";
const stderr = result.stderr || "";
const exitCode = typeof result.status === "number" ? result.status : 1;
const signal = result.signal || null;
const error = result.error?.message || null;
const timedOut = result.error?.code === "ETIMEDOUT";
const outputLimitExceeded = result.error?.code === "ENOBUFS"
  || Buffer.byteLength(stdout, "utf8") >= MAX_OUTPUT_BYTES
  || Buffer.byteLength(stderr, "utf8") >= MAX_OUTPUT_BYTES;
const failureClass = timedOut
  ? "timeout"
  : outputLimitExceeded
    ? "output-limit"
    : result.error
      ? "spawn-failure"
      : result.signal
        ? "signal"
        : result.status === 0
          ? "success"
          : "non-zero-exit";
if (!FAILURE_CLASSES.has(failureClass)) fail(`unknown failure class: ${failureClass}`);
const evidenceDir = path.join(changeRoot, "evidence");
fs.mkdirSync(evidenceDir, { recursive: true });
const stamp = startedAt.toISOString().replace(/[-:.TZ]/g, "").slice(0, 17);
const fileName = `${stamp}-${process.pid}-${crypto.randomBytes(4).toString("hex")}.json`;
const evidencePath = path.join(evidenceDir, fileName);
const evidence = {
  schema: EVIDENCE_SCHEMA,
  producer: EVIDENCE_PRODUCER,
  subject,
  command: redact(command),
  executable: redact(invocation.executable),
  args: invocation.args.map((argument) => redact(argument)),
  cwd: projectRoot,
  startedAt: startedAt.toISOString(),
  finishedAt: finishedAt.toISOString(),
  exitCode,
  failureClass,
  signal,
  error: redact(error),
  timedOut,
  outputLimitBytes: MAX_OUTPUT_BYTES,
  outputLimitExceeded,
  stdoutSha256: noPreview ? null : hash(stdout),
  stderrSha256: noPreview ? null : hash(stderr),
  stdoutPreview: noPreview ? "suppressed by --no-preview" : preview(redact(stdout)),
  stderrPreview: noPreview ? "suppressed by --no-preview" : preview(redact(stderr)),
};
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");

let progress = fs.readFileSync(progressPath, "utf8");
const relativeEvidence = path.relative(changeRoot, evidencePath).replaceAll("\\", "/");
const resultSummary = `exit ${exitCode}, ${failureClass}${signal ? `, signal ${signal}` : ""}${error ? `, ${error}` : ""}`;
const outputSummary = preview(redact(stderr || stdout));
const meaning = `${resultSummary}${outputSummary ? `; ${outputSummary}` : ""}; [machine evidence](${relativeEvidence})`;
const row = `| ${cell(startedAt.toISOString().slice(0, 10))} | ${cell(subject)} | ${cell(`run-evidence: ${command}`)} | ${cell(resultSummary)} | ${cell(meaning)} |`;
const emptyRow = /^\|\s*\|\s*\|\s*\|\s*\|\s*\|\s*$/m;
if (emptyRow.test(progress)) {
  progress = progress.replace(emptyRow, row);
} else {
  const separator = /^(\|\s*---\s*\|\s*---\s*\|\s*---\s*\|\s*---\s*\|\s*---\s*\|\s*)$/m;
  if (!separator.test(progress)) fail("PROGRESS.md evidence table is missing its separator row");
  progress = progress.replace(separator, `$1\n${row}`);
}
fs.writeFileSync(progressPath, progress, "utf8");
syncWorkflow(projectRoot);

console.log(`evidence ${exitCode === 0 ? "PASS" : "FAIL"}: ${redact(command)}`);
console.log(`exit: ${exitCode} | failure-class: ${failureClass}${signal ? ` | signal: ${signal}` : ""}`);
console.log(`record: ${evidencePath}`);
if (timedOut) console.error(`timeout: ${timeoutMs}ms`);
if (outputLimitExceeded) console.error(`output limit: ${MAX_OUTPUT_BYTES} bytes`);
if (!noPreview && stdout) console.log(`stdout: ${preview(redact(stdout))}`);
if (!noPreview && stderr) console.error(`stderr: ${preview(redact(stderr))}`);
process.exitCode = exitCode;
