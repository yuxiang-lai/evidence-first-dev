import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.dirname(scriptsDir);
const payloadFile = path.join(scriptsDir, "payload.txt");
const packageRoot = path.join(repositoryRoot, "skills", "evidence-first-dev");
const checkOnly = process.argv.slice(2).includes("--check");

function normalizeEntry(entry) {
  const normalized = entry.replaceAll("\\", "/").replace(/\/$/, "");
  assert.ok(normalized, "payload entries must not be empty");
  assert.ok(!path.isAbsolute(normalized), `payload entry must be relative: ${entry}`);
  assert.ok(!/(^|\/)\.\.($|\/)/.test(normalized), `payload entry escapes the repository: ${entry}`);
  return normalized;
}

function listFiles(root, relative = "") {
  if (!fs.existsSync(root)) return [];
  const files = [];
  for (const item of fs.readdirSync(root, { withFileTypes: true })) {
    const itemRelative = path.posix.join(relative, item.name);
    const itemPath = path.join(root, item.name);
    if (item.isDirectory()) files.push(...listFiles(itemPath, itemRelative));
    else if (item.isFile()) files.push(itemRelative);
  }
  return files.sort();
}

function sourceFilesFor(entry) {
  const sourceRelative = entry === "SKILL.md" ? "SKILL.source.md" : entry;
  const source = path.join(repositoryRoot, ...sourceRelative.split("/"));
  assert.ok(fs.existsSync(source), `payload source does not exist: ${entry}`);
  if (fs.statSync(source).isFile()) return [[entry, source]];
  return listFiles(source).map((relative) => [path.posix.join(entry, relative), path.join(source, ...relative.split("/"))]);
}

const entries = fs.readFileSync(payloadFile, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"))
  .map(normalizeEntry);
assert.equal(new Set(entries).size, entries.length, "payload entries must be unique");

const expectedPairs = entries.flatMap(sourceFilesFor);
assert.equal(new Set(expectedPairs.map(([relative]) => relative)).size, expectedPairs.length, "payload entries must not overlap");
const expectedFiles = new Map(expectedPairs);
assert.ok(expectedFiles.has("SKILL.md"), "runtime payload must contain SKILL.md");

if (checkOnly) {
  const actualFiles = listFiles(packageRoot);
  assert.deepEqual(actualFiles, [...expectedFiles.keys()].sort(), "published skill files differ from scripts/payload.txt");
  for (const [relative, source] of expectedFiles) {
    const published = path.join(packageRoot, ...relative.split("/"));
    assert.ok(fs.readFileSync(source).equals(fs.readFileSync(published)), `published skill is stale: ${relative}`);
  }
  console.log(`skill package check PASS (${actualFiles.length} files)`);
} else {
  const relativeOutput = path.relative(repositoryRoot, packageRoot).replaceAll("\\", "/");
  assert.equal(relativeOutput, "skills/evidence-first-dev", "refusing to replace an unexpected package path");
  fs.rmSync(packageRoot, { recursive: true, force: true });
  for (const [relative, source] of expectedFiles) {
    const destination = path.join(packageRoot, ...relative.split("/"));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
  console.log(`skill package build PASS (${expectedFiles.size} files)`);
}
