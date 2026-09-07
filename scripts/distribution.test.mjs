import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(scriptsDir);
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));

const codexPlugin = readJson(".codex-plugin/plugin.json");
const codexMarketplace = readJson(".agents/plugins/marketplace.json");
const claudePlugin = readJson(".claude-plugin/plugin.json");
const claudeMarketplace = readJson(".claude-plugin/marketplace.json");

assert.equal(codexPlugin.name, "evidence-first-dev");
assert.match(codexPlugin.version, /^\d+\.\d+\.\d+$/);
assert.equal(codexPlugin.skills, "./skills/");
assert.equal(codexMarketplace.name, "evidence-first-dev");
assert.equal(codexMarketplace.plugins.length, 1);
assert.equal(codexMarketplace.plugins[0].name, codexPlugin.name);
assert.equal(codexMarketplace.plugins[0].source.url, "https://github.com/yuxiang-lai/evidence-first-dev.git");
assert.equal(codexMarketplace.plugins[0].policy.installation, "AVAILABLE");
assert.equal(codexMarketplace.plugins[0].policy.authentication, "ON_INSTALL");

assert.equal(claudePlugin.name, codexPlugin.name);
assert.equal(claudePlugin.version, codexPlugin.version);
assert.equal(claudeMarketplace.name, codexPlugin.name);
assert.equal(claudeMarketplace.plugins.length, 1);
assert.equal(claudeMarketplace.plugins[0].name, codexPlugin.name);
assert.equal(claudeMarketplace.plugins[0].source, "./skills/evidence-first-dev");

execFileSync(process.execPath, [path.join(scriptsDir, "build-skill-package.mjs"), "--check"], { stdio: "pipe" });
const packageRoot = path.join(root, "skills", "evidence-first-dev");
assert.ok(fs.existsSync(path.join(root, "SKILL.source.md")));
assert.ok(!fs.existsSync(path.join(root, "SKILL.md")), "repository root must not be detected as an installable skill");
assert.ok(fs.existsSync(path.join(packageRoot, "SKILL.md")));
assert.ok(fs.existsSync(path.join(packageRoot, "LICENSE")));
assert.deepEqual(readJson("skills/evidence-first-dev/.claude-plugin/plugin.json"), claudePlugin);
assert.ok(fs.existsSync(path.join(packageRoot, "agents", "openai.yaml")));
for (const sourceOnly of ["README.md", "README.en.md", "INSTALL.md", "ADAPTERS.md", "AGENTS.md", "fixtures", "adapters", "scripts/install.ps1", "scripts/install.sh", "scripts/distribution.test.mjs"]) {
  assert.ok(!fs.existsSync(path.join(packageRoot, sourceOnly)), `${sourceOnly} must stay out of the published skill`);
}

console.log("distribution tests PASS");
