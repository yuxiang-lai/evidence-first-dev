import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.dirname(scriptsDir);
const root = fs.mkdtempSync(path.join(os.tmpdir(), "evidence-first-install-test-"));
const cursorProject = path.join(root, "cursor project");
const genericProject = path.join(root, "generic project");
const claudeProject = path.join(root, "claude project");
for (const project of [cursorProject, genericProject, claudeProject]) {
  fs.mkdirSync(project, { recursive: true });
}

function runInstall(tool, project) {
  if (process.platform === "win32") {
    execFileSync("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(scriptsDir, "install.ps1"),
      "-Tool",
      tool,
      "-ProjectRoot",
      project,
    ], { stdio: "ignore" });
    return;
  }
  execFileSync("sh", [path.join(scriptsDir, "install.sh"), tool, project], {
    stdio: "ignore",
  });
}

try {
  runInstall("cursor", cursorProject);
  runInstall("generic", genericProject);
  runInstall("claude", claudeProject);

  assert.ok(fs.existsSync(path.join(cursorProject, ".cursor", "rules", "evidence-first-dev.mdc")));
  assert.ok(fs.existsSync(path.join(genericProject, "AGENTS.md")));
  assert.ok(fs.existsSync(path.join(claudeProject, ".claude", "skills", "evidence-first-dev", "SKILL.md")));

  assert.throws(() => runInstall("generic", genericProject));
  console.log(`install tests PASS (${process.platform})`);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
