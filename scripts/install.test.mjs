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
const codexProject = path.join(root, "codex skill");
const bridgeProject = path.join(root, "bridge project");
for (const project of [cursorProject, genericProject, claudeProject, codexProject, bridgeProject]) {
  fs.mkdirSync(project, { recursive: true });
}

function runInstall(tool, project, mode) {
  if (process.platform === "win32") {
    const args = [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(scriptsDir, "install.ps1"),
      "-Tool",
      tool,
      "-ProjectRoot",
      project,
    ];
    if (mode) args.push("-Mode", mode);
    execFileSync("powershell.exe", args, { stdio: "ignore" });
    return;
  }
  const args = [path.join(scriptsDir, "install.sh"), tool, project];
  if (mode) args.push(mode);
  execFileSync("sh", args, {
    stdio: "ignore",
  });
}

try {
  const payloadEntries = fs.readFileSync(path.join(skillRoot, "scripts", "payload.txt"), "utf8")
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter((entry) => entry && !entry.startsWith("#"));
  assert.ok(payloadEntries.includes("SKILL.md"));
  for (const entry of payloadEntries) {
    assert.ok(fs.existsSync(path.join(skillRoot, entry)), `payload entry must exist: ${entry}`);
  }
  for (const sourceOnly of ["AGENTS.md", "README.md", "README.en.md", "fixtures", "adapters", "scripts/install.ps1", "scripts/install.sh"]) {
    assert.ok(!payloadEntries.includes(sourceOnly), `${sourceOnly} must stay out of the runtime payload`);
  }

  runInstall("cursor", cursorProject);
  runInstall("generic", genericProject);
  runInstall("claude", claudeProject);
  runInstall("codex", codexProject);

  assert.ok(fs.existsSync(path.join(cursorProject, ".cursor", "rules", "evidence-first-dev.mdc")));
  assert.ok(fs.existsSync(path.join(genericProject, "AGENTS.md")));
  assert.ok(fs.existsSync(path.join(claudeProject, ".claude", "skills", "evidence-first-dev", "SKILL.md")));
  assert.ok(fs.existsSync(path.join(codexProject, "SKILL.md")));
  for (const unwanted of ["README.md", "README.en.md", "AGENTS.md", "fixtures", "adapters", "install.ps1", "install.sh"]) {
    assert.ok(!fs.existsSync(path.join(claudeProject, ".claude", "skills", "evidence-first-dev", unwanted)), `${unwanted} must not be installed in Claude payload`);
  }
  for (const unwanted of ["README.md", "README.en.md", "AGENTS.md", "fixtures", "adapters", "install.ps1", "install.sh"]) {
    assert.ok(!fs.existsSync(path.join(codexProject, unwanted)), `${unwanted} must not be installed in Codex payload`);
  }
  for (const project of [cursorProject, genericProject]) {
    const payload = path.join(project, ".ai", "evidence-first-dev");
    assert.ok(fs.existsSync(path.join(payload, "SKILL.md")));
    for (const unwanted of ["README.md", "README.en.md", "AGENTS.md", "fixtures", "adapters", "install.ps1", "install.sh"]) {
      assert.ok(!fs.existsSync(path.join(payload, unwanted)), `${unwanted} must not be installed`);
    }
  }
  runInstall("cursor", bridgeProject, "bridge");
  assert.ok(fs.existsSync(path.join(bridgeProject, ".cursor", "rules", "evidence-first-dev.mdc")));
  assert.ok(!fs.existsSync(path.join(bridgeProject, ".ai")));

  assert.throws(() => runInstall("generic", genericProject));
  assert.throws(() => runInstall("generic", skillRoot));
  console.log(`install tests PASS (${process.platform})`);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
