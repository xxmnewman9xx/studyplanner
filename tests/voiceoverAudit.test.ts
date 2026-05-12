import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const script = "scripts/audit-voiceover-readiness.mjs";

test("VoiceOver readiness audit reports source-level traversal risks", () => {
  const result = spawnSync(process.execPath, [script, "--json"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const audit = JSON.parse(result.stdout);

  assert.ok(audit.filesScanned > 10);
  assert.ok(audit.interactiveCount > 50);
  assert.ok(audit.explicitLabelCount > 20);
  assert.ok(audit.summarySurfaceCount > 0);
  assert.ok(Array.isArray(audit.topRiskFiles));
  if (audit.topRiskFiles.length > 0) {
    assert.ok(
      audit.topRiskFiles.some((entry: { file: string }) => entry.file.includes("src/screens/")),
      "screen files should appear in the VoiceOver risk list while source risks remain"
    );
  }
});
