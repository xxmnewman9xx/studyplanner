import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const script = "scripts/verify-localized-aso.mjs";

test("localized ASO audit keeps locale drafts structurally complete and caveated", () => {
  const result = spawnSync(process.execPath, [script, "--json"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const audit = JSON.parse(result.stdout);

  assert.equal(audit.passed, true);
  assert.equal(audit.localeCount, 20);
  assert.equal(audit.metadataRowCount, 20);
  assert.equal(audit.captionRowCount, 20);
  assert.ok(
    audit.checks.every((check: { status: string }) => check.status === "PASS"),
    "all localized ASO structural checks should pass"
  );
  assert.ok(
    audit.checks.some((check: { label: string; detail: string }) =>
      check.label === "Localized subtitle length <= 30" && check.detail.includes("within limit")
    ),
    "localized subtitles should be kept within App Store field limits"
  );
  assert.ok(
    audit.checks.some((check: { label: string }) =>
      check.label === "Metadata rows keep native-review and text-fit caveats"
    ),
    "native-speaker/text-fit caveats should stay explicit"
  );
});
