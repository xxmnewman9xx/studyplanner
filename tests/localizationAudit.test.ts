import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const script = "scripts/audit-localization-strings.mjs";

test("localization audit reports current English UI string debt", () => {
  const result = spawnSync(process.execPath, [script, "--json"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const audit = JSON.parse(result.stdout);

  assert.ok(audit.filesScanned > 20);
  assert.ok(audit.candidateCount > 100);
  assert.ok(audit.jsxTextCount > 0);
  assert.ok(audit.propCandidateCount > 0);
  assert.ok(
    audit.highRiskFiles.some((entry: { file: string }) => entry.file.includes("src/screens/")),
    "screen files should appear in the high-risk localization list"
  );
});
