import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

const app = read("App.tsx");
const appConfig = JSON.parse(read("app.json")).expo;
const purchaseConfig = read("src/services/purchaseConfig.ts");
const parser = read("src/services/syllabusParser.ts");
const importScreen = read("src/screens/ImportScreen.tsx");
const subscriptions = read("src/services/subscriptions.tsx");
const upgrade = read("src/screens/UpgradeScreen.tsx");
const storeCapture = read("src/config/storeCapture.ts");
const srcSource = walk(path.join(root, "src"))
  .filter((file) => /\.(ts|tsx)$/.test(file))
  .map((file) => [path.relative(root, file), fs.readFileSync(file, "utf8")]);

assert(app.includes("<SubscriptionProvider>"), "App must wrap screens in SubscriptionProvider.");
assert(app.includes("useSubscription"), "App must read centralized subscription state.");
assert(app.includes('activeTab === "import"'), "Import tab must be guarded.");
assert(app.includes('activeTab === "grades"'), "Grades tab must be guarded.");
assert(app.includes("handleScheduleReminders"), "Reminder entrypoint must check Plus.");
assert(app.includes("handleCalendarSync"), "Calendar sync entrypoint must check Plus.");

assert(
  appConfig.plugins.includes("expo-iap"),
  "app.json must include the expo-iap config plugin."
);
assert(
  appConfig.ios?.bundleIdentifier === "com.mattnewman.studyplanner",
  "iOS bundle identifier must target the existing Study Planner app."
);
assert(
  appConfig.extra?.eas?.projectId === "69335c75-753e-424e-8a76-c8bd2455a112",
  "EAS project ID must match the Build 8 App Dev project."
);

for (const name of [
  "EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS",
  "EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS",
  "EXPO_PUBLIC_TERMS_URL",
  "EXPO_PUBLIC_PRIVACY_URL"
]) {
  assert(purchaseConfig.includes(name), `purchaseConfig must read ${name}.`);
}

assert(
  parser.includes("EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT"),
  "Syllabus parser must read the production parse endpoint when configured."
);

assert(
  purchaseConfig.includes("process.env.EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS"),
  "IAP product IDs must use direct EXPO_PUBLIC env reads so Expo can inline them into native bundles."
);

for (const api of [
  "fetchProducts",
  "getActiveSubscriptions",
  "getAvailablePurchases",
  "requestPurchase",
  "restorePurchases",
  "finishTransaction"
]) {
  assert(subscriptions.includes(api), `subscriptions service must use ${api}.`);
}

assert(upgrade.includes("Restore Purchases"), "Paywall must expose Restore Purchases.");
assert(upgrade.includes("Terms of Use"), "Paywall must expose Terms of Use.");
assert(upgrade.includes("Terms of Use (EULA)"), "Paywall must expose EULA wording.");
assert(upgrade.includes("Privacy Policy"), "Paywall must expose Privacy Policy.");
assert(!importScreen.includes("Syllabus scan is unavailable"), "Scan UI must not render unavailable copy.");
assert(!importScreen.includes("disabled={!parserReady"), "Scan buttons must not be disabled by missing endpoint config.");
assert(
  storeCapture.includes('readEnv("EXPO_PUBLIC_STORE_CAPTURE") === "1"'),
  "Store capture mode must require the exact EXPO_PUBLIC_STORE_CAPTURE=1 flag."
);
assert(
  app.includes("!storeCaptureEnabled &&") && app.includes("if (!hydrated || storeCaptureEnabled) return;"),
  "Store capture mode must bypass normal gates without persisting demo planner data."
);

for (const [file, source] of srcSource) {
  assert(!source.includes("parseSyllabusStub"), `Remove stub parser reference from ${file}.`);
  assert(!source.includes("seedAssignments"), `Remove seeded planner data from ${file}.`);
  assert(!source.includes("seedCourses"), `Remove seeded courses from ${file}.`);
  assert(!source.includes("isPremium: true"), `Remove hardcoded premium access from ${file}.`);
}

console.log("IAP and premium gate configuration passed.");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}
