import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const script = "scripts/verify-production-config.mjs";

test("production verification still passes without submission-only env", () => {
  const result = spawnSync(process.execPath, [script], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      EXPO_PUBLIC_STORE_CAPTURE: "0",
      STUDYPLANNER_SUBMISSION_VERIFY: "0",
      EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS: "",
      EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS: "",
      EXPO_PUBLIC_SUPPORT_URL: ""
    },
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("submission verification fails without explicit IAP products and support URL", () => {
  const result = spawnSync(process.execPath, [script], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      EXPO_PUBLIC_STORE_CAPTURE: "0",
      STUDYPLANNER_SUBMISSION_VERIFY: "1",
      EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS: "",
      EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS: "",
      EXPO_PUBLIC_SUPPORT_URL: ""
    },
    encoding: "utf8"
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /monthly product ID must be configured/);
});

test("submission verification passes with explicit IAP products and support URL", () => {
  const result = spawnSync(process.execPath, [script], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      EXPO_PUBLIC_STORE_CAPTURE: "0",
      STUDYPLANNER_SUBMISSION_VERIFY: "1",
      EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS:
        "com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly",
      EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS:
        "com.mattnewman.studyplanner.plus.lifetime",
      EXPO_PUBLIC_SUPPORT_URL: "https://example.com/studyplanner-support"
    },
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
});
