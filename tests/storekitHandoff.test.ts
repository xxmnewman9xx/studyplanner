import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const script = "scripts/audit-storekit-handoff.mjs";

test("StoreKit handoff audit verifies source paths without replacing sandbox proof", () => {
  const result = spawnSync(process.execPath, [script, "--json"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const audit = JSON.parse(result.stdout);

  assert.equal(audit.passed, true);
  assert.equal(audit.blockerCount, 0);
  assert.ok(audit.warningCount >= 1);
  assert.ok(
    audit.checks.some((check: { label: string; status: string }) =>
      check.label === "Lifetime product is loaded and purchased as in-app" &&
      check.status === "PASS"
    ),
    "Lifetime must stay on the in-app purchase path"
  );
  assert.ok(
    audit.checks.some((check: { label: string; status: string }) =>
      check.label === "Purchases are finished as non-consumable/non-consumable-equivalent" &&
      check.status === "PASS"
    ),
    "finished transactions should not be marked consumable"
  );
  assert.ok(
    audit.checks.some((check: { label: string; status: string; detail?: string }) =>
      check.label === "StoreKit sandbox proof remains external" &&
      check.status === "WARN" &&
      Boolean(check.detail?.includes("sandbox monthly/yearly/Lifetime"))
    ),
    "sandbox proof must remain a warning outside source audit"
  );
});
