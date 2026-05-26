import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);

const app = read("App.tsx");
const appConfig = JSON.parse(read("app.json")).expo;
const purchaseConfig = read("src/services/purchaseConfig.ts");
const parser = read("src/services/syllabusParser.ts");
const importScreen = read("src/screens/ImportScreen.tsx");
const subscriptions = read("src/services/subscriptions.tsx");
const paywall = read("src/screens/UpgradeScreen.tsx");
const srcSource = walk(path.join(root, "src"))
  .filter((file) => /\.(ts|tsx)$/.test(file))
  .map((file) => [path.relative(root, file), fs.readFileSync(file, "utf8")]);

assert(app.includes("<SubscriptionProvider>"), "App must wrap screens in SubscriptionProvider.");
assert(app.includes("useSubscription"), "App must read centralized subscription state.");
assert(app.includes('activeTab === "import"'), "Import tab must be guarded.");
assert(app.includes('activeTab === "grades"'), "Grades tab must be guarded.");
assert(app.includes("handleScheduleReminders"), "Reminder entrypoint must stay behind app access.");
assert(app.includes("handleCalendarSync"), "Calendar sync entrypoint must stay behind app access.");

assert(
  hasPlugin(appConfig.plugins, "expo-iap"),
  "app.json must include the expo-iap config plugin."
);
assert(
  hasPlugin(appConfig.plugins, "expo-widgets"),
  "app.json must include the expo-widgets config plugin for native WidgetKit support."
);
assert(
  appConfig.ios?.bundleIdentifier === "com.mattnewman.studyplanner",
  "iOS bundle identifier must target the existing StudyPlanner app."
);
assert(
  appConfig.ios?.entitlements?.["com.apple.security.application-groups"]?.includes("group.com.mattnewman.studyplanner"),
  "iOS app entitlements must include the StudyPlanner app group for widgets."
);
assert(
  appConfig.extra?.eas?.projectId === "69335c75-753e-424e-8a76-c8bd2455a112",
  "EAS project ID must match the Build 8 App Dev project."
);
const widgetPlugin = getPluginConfig(appConfig.plugins, "expo-widgets");
assert(
  widgetPlugin?.bundleIdentifier === "com.mattnewman.studyplanner.widgets",
  "expo-widgets bundle identifier must match the documented widget extension."
);
assert(
  widgetPlugin?.groupIdentifier === "group.com.mattnewman.studyplanner",
  "expo-widgets group identifier must match the StudyPlanner app group."
);
assert(
  widgetPlugin?.widgets?.some((widget) => widget.name === "StudyPlannerTodayWidget") &&
    widgetPlugin?.widgets?.some((widget) => widget.name === "StudyPlannerUpcomingWidget") &&
    widgetPlugin?.widgets?.some((widget) => widget.name === "StudyPlannerWeekWidget") &&
    widgetPlugin?.widgets?.some((widget) => widget.name === "StudyPlannerClassProgressWidget"),
  "expo-widgets must register Today, Upcoming, Week, and Class Progress widgets."
);

for (const name of [
  "EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS",
  "EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS",
  "EXPO_PUBLIC_TERMS_URL",
  "EXPO_PUBLIC_PRIVACY_URL",
  "EXPO_PUBLIC_SUPPORT_URL",
  "EXPO_PUBLIC_IAP_VALIDATION_ENDPOINT"
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
assert(
  subscriptions.includes("validateEntitlementWithServer"),
  "subscriptions service must support optional server-side purchase validation."
);

assert(paywall.includes("Restore Purchases"), "Paywall must expose Restore Purchases.");
assert(paywall.includes("Terms of Use"), "Paywall must expose Terms of Use.");
assert(paywall.includes("Terms of Use (EULA)"), "Paywall must expose EULA wording.");
assert(paywall.includes("Privacy Policy"), "Paywall must expose Privacy Policy.");
assert(!importScreen.includes("Syllabus scan is unavailable"), "Scan UI must not render unavailable copy.");
assert(!importScreen.includes("disabled={!parserReady"), "Scan buttons must not be disabled by missing endpoint config.");

for (const [file, source] of srcSource) {
  assert(!source.includes("parseSyllabusStub"), `Remove stub parser reference from ${file}.`);
  assert(!source.includes("StoreCapture"), `Remove store capture source from ${file}.`);
  assert(!source.includes("StorePreview"), `Remove store preview source from ${file}.`);
  assert(!source.includes("seedAssignments"), `Remove seeded planner data from ${file}.`);
  assert(!source.includes("seedCourses"), `Remove seeded courses from ${file}.`);
  assert(!source.includes("isPremium: true"), `Remove hardcoded paid access from ${file}.`);
}

console.log("IAP and hard-paywall configuration passed.");

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

function hasPlugin(plugins, name) {
  return plugins.some((plugin) => Array.isArray(plugin) ? plugin[0] === name : plugin === name);
}

function getPluginConfig(plugins, name) {
  const plugin = plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === name);
  return plugin?.[1];
}
