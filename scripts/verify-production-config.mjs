import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const expectedMonthlyId = "com.mattnewman.studyplanner.plus.monthly";
const expectedYearlyId = "com.mattnewman.studyplanner.plus.yearly";
const expectedLifetimeId = "com.mattnewman.studyplanner.plus.lifetime";
const submissionVerify = process.env.STUDYPLANNER_SUBMISSION_VERIFY === "1";

assert(
  process.env.EXPO_PUBLIC_STORE_CAPTURE !== "1",
  "Production verification failed: EXPO_PUBLIC_STORE_CAPTURE=1 would enable screenshot/demo mode."
);

const purchaseConfig = read("src/services/purchaseConfig.ts");
for (const productId of [expectedMonthlyId, expectedYearlyId, expectedLifetimeId]) {
  assert(
    purchaseConfig.includes(productId),
    `purchaseConfig must document expected product ID ${productId}.`
  );
}

if (process.env.EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS) {
  const ids = readList(process.env.EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS);
  assert(ids.includes(expectedMonthlyId), `Expected monthly product ID missing: ${expectedMonthlyId}.`);
  assert(ids.includes(expectedYearlyId), `Expected yearly product ID missing: ${expectedYearlyId}.`);
}

if (process.env.EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS) {
  const ids = readList(process.env.EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS);
  assert(ids.includes(expectedLifetimeId), `Expected lifetime product ID missing: ${expectedLifetimeId}.`);
}

if (submissionVerify) {
  const subscriptionIds = readList(process.env.EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS || "");
  const lifetimeIds = readList(process.env.EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS || "");
  assert(
    subscriptionIds.includes(expectedMonthlyId),
    `Submission verification failed: monthly product ID must be configured: ${expectedMonthlyId}.`
  );
  assert(
    subscriptionIds.includes(expectedYearlyId),
    `Submission verification failed: yearly product ID must be configured: ${expectedYearlyId}.`
  );
  assert(
    lifetimeIds.includes(expectedLifetimeId),
    `Submission verification failed: lifetime product ID must be configured: ${expectedLifetimeId}.`
  );
  assert(
    isHttpsUrl(process.env.EXPO_PUBLIC_SUPPORT_URL),
    "Submission verification failed: EXPO_PUBLIC_SUPPORT_URL must be a valid https URL."
  );
}

console.log("Production config verification passed.");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function isHttpsUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}
