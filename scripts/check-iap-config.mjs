import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);

const app = read("App.tsx");
const appConfig = JSON.parse(read("app.json")).expo;
const purchaseConfig = read("src/services/purchaseConfig.ts");
const subscriptions = read("src/services/subscriptions.tsx");
const upgrade = read("src/screens/UpgradeScreen.tsx");
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
assert(upgrade.includes("Terms of Service"), "Paywall must expose Terms of Service.");
assert(upgrade.includes("Privacy Policy"), "Paywall must expose Privacy Policy.");

for (const [file, source] of srcSource) {
  assert(!source.includes("parseSyllabusStub"), `Remove stub parser reference from ${file}.`);
  assert(!source.includes("StoreCapture"), `Remove store capture source from ${file}.`);
  assert(!source.includes("StorePreview"), `Remove store preview source from ${file}.`);
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
