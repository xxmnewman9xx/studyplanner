import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const script = "scripts/audit-ios-archive-preflight.mjs";

test("iOS archive preflight verifies native source wiring without replacing signed archive proof", () => {
  const result = spawnSync(process.execPath, [script, "--json"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const audit = JSON.parse(result.stdout);

  assert.equal(audit.passed, true);
  assert.equal(audit.blockerCount, 0);
  assert.ok(audit.checks.length >= 12);
  assert.ok(
    audit.checks.some((check: { label: string; status: string }) =>
      check.label === "App App Group entitlement" && check.status === "PASS"
    ),
    "app target should carry the shared App Group entitlement"
  );
  assert.ok(
    audit.checks.some((check: { label: string; status: string }) =>
      check.label === "Widget App Group entitlement" && check.status === "PASS"
    ),
    "widget target should carry the shared App Group entitlement"
  );
  assert.ok(
    audit.checks.some((check: { label: string; status: string; detail?: string }) =>
      check.label === "APNs source entitlement is production" &&
      check.status === "WARN" &&
      Boolean(check.detail?.includes("signed production entitlement"))
    ),
    "source APNs value should stay documented as a signed-archive proof gap"
  );
});
