import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const initPath = path.join(scriptsDir, "init.mjs");
const indexPath = path.join(scriptsDir, "index.mjs");
const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "evidence-retention-"));
const changeId = "2026-09-03-retention-check";

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
}

try {
  let result = run(initPath, [projectRoot, changeId, "Fast", "low", "feature"]);
  assert.equal(result.status, 0, result.stderr);
  result = run(indexPath, ["check", projectRoot]);
  assert.equal(result.status, 0, result.stderr);

  const contextPath = path.join(projectRoot, "docs", "CONTEXT.md");
  const extraRows = Array.from({ length: 4 }, (_, index) =>
    `| 2026-09-${String(index + 4).padStart(2, "0")} | update-${index + 1} | kept for testing | test |`,
  ).join("\n");
  fs.appendFileSync(contextPath, `\n${extraRows}\n`, "utf8");
  result = run(indexPath, ["check", projectRoot]);
  assert.equal(result.status, 0, result.stderr);

  fs.appendFileSync(contextPath, "| 2026-09-08 | update-5 | exceeds bounded history | test |\n", "utf8");
  result = run(indexPath, ["check", projectRoot]);
  assert.equal(result.status, 1, "index check must reject oversized project history");
  assert.match(result.stderr, /Update history has 6 rows/);
  console.log("retention.test PASS");
} finally {
  fs.rmSync(projectRoot, { recursive: true, force: true });
}
