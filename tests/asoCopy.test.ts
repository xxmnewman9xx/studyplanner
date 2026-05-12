import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const script = "scripts/verify-aso-copy.mjs";

test("ASO copy audit keeps English metadata length-safe and claim-safe", () => {
  const result = spawnSync(process.execPath, [script, "--json"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const audit = JSON.parse(result.stdout);

  assert.equal(audit.passed, true);
  assert.ok(audit.checks.length >= 7);
  assert.ok(
    audit.checks.every((check: { status: string }) => check.status === "PASS"),
    "all ASO metadata checks should pass"
  );
  assert.ok(
    audit.checks.some((check: { label: string; detail: string }) =>
      check.label === "Keywords" && check.detail.includes("/100 bytes")
    ),
    "keyword byte limit should be checked"
  );
});
