import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const script = "scripts/verify-goal-9-2-completion.mjs";

test("goal 9.2 completion gate verifies artifacts but keeps the goal open for proof gaps", () => {
  const result = spawnSync(process.execPath, [script, "--no-write"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /GOAL-OPEN/);
  assert.match(output, /PASS\s+All required 9\.2 docs exist/);
  assert.match(output, /PASS\s+500-use-case swarm exists/);
  assert.match(output, /PASS\s+Required 9\.2 screenshot set exists/);
  assert.match(output, /PASS\s+StoreKit source handoff audit has no local blockers/);
  assert.match(output, /PASS\s+StoreKit testing runbook and attempt log exist/);
  assert.match(output, /PASS\s+VoiceOver traversal runbook and attempt log exist/);
  assert.match(output, /BLOCKER\s+Final readiness report marks 9\.2 reached/);
  assert.match(output, /BLOCKER\s+StoreKit sandbox purchase\/restore proof exists/);
  assert.match(output, /PASS\s+Full VoiceOver traversal proof exists/);
  assert.match(output, /PASS\s+Localized UI\/native review proof exists or is explicitly deferred/);
});

test("goal 9.2 completion gate exposes structured JSON for audit tooling", () => {
  const result = spawnSync(process.execPath, [script, "--json"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  assert.notEqual(result.status, 0);
  const audit = JSON.parse(result.stdout);

  assert.equal(audit.passed, false);
  assert.equal(audit.blockerCount, 3);
  assert.ok(audit.useCaseRows >= 500);
  assert.ok(audit.functionalityRows >= 400);
  assert.ok(Array.isArray(audit.blockers));
  assert.ok(
    audit.checks.some((check: { label: string; status: string }) =>
      check.label === "Products-loaded paywall proof exists" &&
      check.status === "PASS"
    )
  );
  assert.ok(!audit.blockers.some((blocker: { label: string }) => blocker.label === "Products-loaded paywall proof exists"));
  assert.ok(
    audit.blockers.some((blocker: { label: string; proofType: string; requiredFiles: string[] }) =>
      blocker.label === "StoreKit sandbox purchase/restore proof exists" &&
      blocker.proofType === "external-storekit-sandbox" &&
      blocker.requiredFiles.includes("artifacts/post-goal-aso-submission/external-proof/storekit-sandbox-proof.md")
    )
  );
  assert.ok(!audit.blockers.some((blocker: { label: string }) => blocker.label === "Full VoiceOver traversal proof exists"));
  assert.ok(
    audit.checks.some((check: { label: string; status: string }) =>
      check.label === "Full VoiceOver traversal proof exists" &&
      check.status === "PASS"
    )
  );
  assert.ok(
    audit.checks.some((check: { label: string; status: string }) =>
      check.label === "Submission gate blocks only after local source audits pass" &&
      check.status === "PASS"
    )
  );
  assert.ok(
    audit.checks.some((check: { label: string; status: string }) =>
      check.label === "StoreKit testing runbook and attempt log exist" &&
      check.status === "PASS"
    )
  );
  assert.ok(
    audit.checks.some((check: { label: string; status: string }) =>
      check.label === "Localized UI/native review proof exists or is explicitly deferred" &&
      check.status === "PASS"
    )
  );
});
