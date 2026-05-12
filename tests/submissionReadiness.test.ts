import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const script = "scripts/verify-submission-readiness.mjs";

test("submission readiness gate blocks the current incomplete external proof state", () => {
  const result = spawnSync(process.execPath, [script], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      EXPO_PUBLIC_STORE_CAPTURE: "0",
      EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS: "",
      EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS: "",
      EXPO_PUBLIC_SUPPORT_URL: "",
      STUDYPLANNER_SUBMIT_LOCALIZATIONS: "0"
    },
    encoding: "utf8"
  });

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /NO-SUBMIT/);
  assert.match(output, /EXPO_PUBLIC_SUPPORT_URL/);
  assert.match(output, /StoreKit monthly\/yearly\/Lifetime\/restore proof/);
  assert.match(output, /Products-loaded paywall screenshot/);
  assert.match(output, /App Store Connect screenshot upload acceptance/);
  assert.match(output, /PASS\s+English ASO metadata is length-safe and claim-safe/);
  assert.match(output, /PASS\s+Localized ASO draft is structurally complete/);
  assert.match(output, /PASS\s+iOS archive preflight has no source blockers/);
  assert.match(output, /PASS\s+StoreKit\/IAP source handoff has no local blockers/);
  assert.match(output, /PASS\s+VoiceOver source audit is clean/);
  assert.match(output, /BLOCKER\s+VoiceOver traversal is recorded/);
});

test("submission readiness gate verifies local screenshot exports before external blockers", () => {
  const result = spawnSync(process.execPath, [script], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      EXPO_PUBLIC_STORE_CAPTURE: "0",
      EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS:
        "com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly",
      EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS:
        "com.mattnewman.studyplanner.plus.lifetime",
      EXPO_PUBLIC_SUPPORT_URL: "https://example.com/studyplanner-support",
      STUDYPLANNER_SUBMIT_LOCALIZATIONS: "0"
    },
    encoding: "utf8"
  });

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /PASS\s+Monthly and yearly IAP IDs are configured/);
  assert.match(output, /PASS\s+Support URL is configured/);
  assert.match(output, /PASS\s+iPhone 6\.9-inch export has 10 accepted-size PNGs/);
  assert.match(output, /PASS\s+iPad 13-inch export has 10 accepted-size PNGs/);
  assert.match(output, /PASS\s+English ASO metadata is length-safe and claim-safe/);
  assert.match(output, /PASS\s+Localized ASO draft is structurally complete/);
  assert.match(output, /PASS\s+iOS archive preflight has no source blockers/);
  assert.match(output, /PASS\s+StoreKit\/IAP source handoff has no local blockers/);
  assert.match(output, /PASS\s+VoiceOver source audit is clean/);
  assert.match(output, /PASS\s+Products-loaded paywall screenshot exists/);
  assert.match(output, /BLOCKER\s+StoreKit monthly\/yearly\/Lifetime\/restore proof is recorded/);
});

test("submission readiness gate rejects placeholder external proof files", () => {
  const proofDir = fs.mkdtempSync(path.join(os.tmpdir(), "studyplanner-proof-"));
  try {
    fs.writeFileSync(
      path.join(proofDir, "storekit-sandbox-proof.md"),
      [
        "# TEMPLATE - StoreKit proof",
        "TODO replace before submit.",
        "This sample only mentions monthly, yearly, lifetime, restore, and sandbox so the verifier can prove placeholder text is still rejected."
      ].join("\n")
    );

    const result = spawnSync(process.execPath, [script], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        EXPO_PUBLIC_STORE_CAPTURE: "0",
        EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS:
          "com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly",
        EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS:
          "com.mattnewman.studyplanner.plus.lifetime",
        EXPO_PUBLIC_SUPPORT_URL: "https://example.com/studyplanner-support",
        STUDYPLANNER_SUBMIT_LOCALIZATIONS: "0",
        STUDYPLANNER_SUBMISSION_PROOF_DIR: proofDir
      },
      encoding: "utf8"
    });

    const output = `${result.stdout}\n${result.stderr}`;
    assert.notEqual(result.status, 0);
    assert.match(output, /StoreKit monthly\/yearly\/Lifetime\/restore proof/);
    assert.match(output, /contains placeholder language/);
    assert.match(output, /Placeholder term: template/);
  } finally {
    fs.rmSync(proofDir, { recursive: true, force: true });
  }
});
