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
  assert.match(output, /BLOCKER\s+Final readiness report marks 9\.2 reached/);
  assert.match(output, /BLOCKER\s+StoreKit sandbox purchase\/restore proof exists/);
  assert.match(output, /BLOCKER\s+Full VoiceOver traversal proof exists/);
});

test("goal 9.2 completion gate exposes structured JSON for audit tooling", () => {
  const result = spawnSync(process.execPath, [script, "--json"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  assert.notEqual(result.status, 0);
  const audit = JSON.parse(result.stdout);

  assert.equal(audit.passed, false);
  assert.ok(audit.blockerCount >= 4);
  assert.ok(audit.useCaseRows >= 500);
  assert.ok(audit.functionalityRows >= 400);
  assert.ok(
    audit.checks.some((check: { label: string; status: string }) =>
      check.label === "Submission gate blocks only after local source audits pass" &&
      check.status === "PASS"
    )
  );
});
