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
const opencodeProject = path.join(root, "opencode project");
const bridgeProject = path.join(root, "bridge project");
for (const project of [cursorProject, genericProject, claudeProject, codexProject, opencodeProject, bridgeProject]) {
  fs.mkdirSync(project, { recursive: true });
}

function runInstall(tool, project, mode, sourceRoot = skillRoot) {
  if (process.platform === "win32") {
    const args = [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(sourceRoot, "scripts", "install.ps1"),
      "-Tool",
      tool,
      "-ProjectRoot",
      project,
    ];
    if (mode) args.push("-Mode", mode);
    execFileSync("powershell.exe", args, { stdio: "ignore" });
    return;
  }
  const args = [path.join(sourceRoot, "scripts", "install.sh"), tool, project];
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
    assert.ok(fs.existsSync(path.join(skillRoot, "skills", "evidence-first-dev", entry)), `published payload entry must exist: ${entry}`);
    assert.ok(!path.isAbsolute(entry) && !/(^|[\\/])\.\.($|[\\/])/.test(entry), `payload entry must stay inside the skill payload: ${entry}`);
  }
  for (const sourceOnly of ["AGENTS.md", "README.md", "README.en.md", "fixtures", "adapters", "scripts/install.ps1", "scripts/install.sh"]) {
    assert.ok(!payloadEntries.includes(sourceOnly), `${sourceOnly} must stay out of the runtime payload`);
  }

  runInstall("cursor", cursorProject);
  runInstall("generic", genericProject);
  runInstall("claude", claudeProject);
  runInstall("codex", codexProject);
  runInstall("opencode", opencodeProject);

  assert.ok(fs.existsSync(path.join(cursorProject, ".cursor", "skills", "evidence-first-dev", "SKILL.md")));
  assert.ok(fs.existsSync(path.join(genericProject, "AGENTS.md")));
  assert.ok(fs.existsSync(path.join(claudeProject, ".claude", "skills", "evidence-first-dev", "SKILL.md")));
  assert.ok(fs.existsSync(path.join(codexProject, "SKILL.md")));
  assert.ok(fs.existsSync(path.join(opencodeProject, ".opencode", "skills", "evidence-first-dev", "SKILL.md")));
  for (const unwanted of ["README.md", "README.en.md", "AGENTS.md", "fixtures", "adapters", "scripts/install.ps1", "scripts/install.sh"]) {
    assert.ok(!fs.existsSync(path.join(claudeProject, ".claude", "skills", "evidence-first-dev", unwanted)), `${unwanted} must not be installed in Claude payload`);
  }
  for (const unwanted of ["README.md", "README.en.md", "AGENTS.md", "fixtures", "adapters", "scripts/install.ps1", "scripts/install.sh"]) {
    assert.ok(!fs.existsSync(path.join(codexProject, unwanted)), `${unwanted} must not be installed in Codex payload`);
  }
  for (const [project, relative] of [
    [cursorProject, [".cursor", "skills", "evidence-first-dev"]],
    [genericProject, [".ai", "evidence-first-dev"]],
    [opencodeProject, [".opencode", "skills", "evidence-first-dev"]],
  ]) {
    const payload = path.join(project, ...relative);
    assert.ok(fs.existsSync(path.join(payload, "SKILL.md")));
    for (const unwanted of ["README.md", "README.en.md", "AGENTS.md", "fixtures", "adapters", "scripts/install.ps1", "scripts/install.sh"]) {
      assert.ok(!fs.existsSync(path.join(payload, unwanted)), `${unwanted} must not be installed`);
    }
  }
  runInstall("cursor", bridgeProject, "bridge");
  assert.ok(fs.existsSync(path.join(bridgeProject, ".cursor", "rules", "evidence-first-dev.mdc")));
  assert.ok(!fs.existsSync(path.join(bridgeProject, ".ai")));

  const hostileSkillRoot = path.join(root, "hostile-skill");
  const hostileScripts = path.join(hostileSkillRoot, "scripts");
  const hostileTarget = path.join(root, "hostile target");
  fs.mkdirSync(hostileScripts, { recursive: true });
  fs.mkdirSync(hostileTarget, { recursive: true });
  fs.copyFileSync(path.join(scriptsDir, "install.ps1"), path.join(hostileScripts, "install.ps1"));
  fs.copyFileSync(path.join(scriptsDir, "install.sh"), path.join(hostileScripts, "install.sh"));
  fs.writeFileSync(path.join(hostileScripts, "payload.txt"), "../escape.txt\n", "utf8");
  assert.throws(() => runInstall("codex", hostileTarget, undefined, hostileSkillRoot));
  assert.ok(!fs.existsSync(path.join(root, "escape.txt")), "installer must reject payload path traversal");

  assert.throws(() => runInstall("generic", genericProject));
  assert.throws(() => runInstall("generic", skillRoot));
  console.log(`install tests PASS (${process.platform})`);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
