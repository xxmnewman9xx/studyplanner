import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);

const app = read("App.tsx");
const appConfig = JSON.parse(read("app.json")).expo;
const iapManifest = read("src/config/iap.ts");
const purchaseConfig = read("src/services/purchaseConfig.ts");
const xcodeProject = read("ios/StudyPlannerSyllabusAI.xcodeproj/project.pbxproj");
const appEntitlements = read("ios/StudyPlannerSyllabusAI/StudyPlannerSyllabusAI.entitlements");
const widgetEntitlements = read("ios/ExpoWidgetsTarget/ExpoWidgetsTarget.entitlements");
const widgetInfoPlist = read("ios/ExpoWidgetsTarget/Info.plist");
const parser = read("src/services/syllabusParser.ts");
const importScreen = read("src/screens/ImportScreen.tsx");
const subscriptions = read("src/services/subscriptions.tsx");
const paywall = read("src/screens/UpgradeScreen.tsx");
const storeKitConfigPath = "qa/storekit/StudyPlannerLocal.storekit";
const storeKitConfig = readIfExists(storeKitConfigPath);
const srcSource = walk(path.join(root, "src"))
  .filter((file) => /\.(ts|tsx)$/.test(file))
  .map((file) => [path.relative(root, file), fs.readFileSync(file, "utf8")]);
const manifestProductIds = productIdsFromManifest(iapManifest);
const manifestBundleIds = bundleIdsFromManifest(iapManifest);
const expectedProductIds = [
  "com.mattnewman.studyplanner.plus.monthly",
  "com.mattnewman.studyplanner.plus.yearly"
];
const readiness = matchString(iapManifest, /readiness:\s*"([^"]+)"/);

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
  hasPlugin(appConfig.plugins, "./plugins/with-widgetkit-kinds"),
  "app.json must patch generated WidgetKit sources to use stable studyplanner.* kinds."
);
assert(
  appConfig.ios?.bundleIdentifier === "com.mattnewman.studyplanner",
  "iOS bundle identifier must target the existing StudyPlanner app."
);
assert(
  manifestBundleIds.includes(appConfig.ios?.bundleIdentifier),
  "IAP manifest must include the app bundle identifier and keep it separate from StoreKit product IDs."
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
  manifestBundleIds.includes(widgetPlugin?.bundleIdentifier),
  "IAP manifest must include the widget extension bundle identifier."
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
assertWidget("studyplanner.today", "StudyPlanner Today", ["systemSmall", "systemMedium"]);
assertWidget("studyplanner.upcoming", "StudyPlanner Upcoming", ["systemSmall", "systemMedium"]);
assertWidget("studyplanner.week", "StudyPlanner Week", ["systemMedium"]);
assertWidget("studyplanner.classProgress", "StudyPlanner Class Progress", ["systemSmall", "systemMedium"]);

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

assert(iapManifest.includes("studyPlannerIapManifest"), "IAP manifest must export studyPlannerIapManifest.");
assert(iapManifest.includes("appStoreConnectAppId"), "IAP manifest must include App Store Connect app metadata.");
assert(iapManifest.includes("subscriptionGroup"), "IAP manifest must document subscription group status.");
assert(iapManifest.includes("sandboxTesting"), "IAP manifest must document sandbox/local StoreKit testing notes.");
assert(
  readiness === "ready" ||
    readiness === "ready-with-placeholders" ||
    readiness === "blocked-missing-App-Store-Connect-IDs",
  "IAP manifest must report readiness as ready, ready-with-placeholders, or blocked-missing-App-Store-Connect-IDs."
);
assert(readiness === "ready", `IAP readiness is ${readiness}; expected ready for this release candidate.`);
assert(
  arraysEqual([...manifestProductIds].sort(), [...expectedProductIds].sort()),
  "IAP manifest product IDs must match the current App Store Connect product mapping."
);
assert(
  unique([...manifestProductIds]).length === manifestProductIds.length,
  "IAP manifest must not contain duplicate product IDs."
);
assert(
  !manifestProductIds.some((id) => /placeholder|todo|example/i.test(id)),
  "IAP manifest must not use placeholder product IDs in a ready build."
);
for (const productId of manifestProductIds) {
  assert(
    !manifestBundleIds.includes(productId),
    `${productId} is a StoreKit product ID and must not be listed as a bundle identifier.`
  );
}
assert(
  purchaseConfig.includes("studyPlannerIapManifest") &&
    purchaseConfig.includes("studyPlannerSubscriptionProductIds") &&
    purchaseConfig.includes("studyPlannerLifetimeProductIds"),
  "purchaseConfig must use the shared IAP manifest for product IDs and bundle metadata."
);
assert(
  purchaseConfig.includes("usesManifestProductFallback") &&
    purchaseConfig.includes("productIdSource"),
  "purchaseConfig must make sandbox/manifest product ID source distinguishable from build env products."
);

assert(
  parser.includes("EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT"),
  "Syllabus parser must read the production parse endpoint when configured."
);

assert(
  purchaseConfig.includes("process.env.EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS"),
  "IAP product IDs must use direct EXPO_PUBLIC env reads so Expo can inline them into native bundles."
);
assert(
  !/EXPO_PUBLIC_IAP_SUBSCRIPTION_ID(?!S)/.test(purchaseConfig) &&
    !/EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_ID(?!S)/.test(purchaseConfig),
  "IAP config must not accept singular product ID env aliases; use the plural manifest-backed variables only."
);
assert(
  xcodeProject.includes("PRODUCT_BUNDLE_IDENTIFIER = com.mattnewman.studyplanner;") &&
    xcodeProject.includes("PRODUCT_BUNDLE_IDENTIFIER = com.mattnewman.studyplanner.widgets;"),
  "Tracked iOS project bundle identifiers must match the IAP manifest."
);
assert(
  (xcodeProject.match(/\/\* ExpoWidgetsTarget \*\/ = \{\n\t\t\tisa = PBXNativeTarget;/g) || []).length === 1,
  "Tracked iOS project must contain exactly one ExpoWidgetsTarget native target."
);
assert(
  (xcodeProject.match(/\/\* ExpoWidgetsTarget\.appex in Embed Foundation Extensions \*\//g) || []).length === 2,
  "Tracked iOS project must define and embed exactly one ExpoWidgetsTarget appex."
);
assert(
  appEntitlements.includes("group.com.mattnewman.studyplanner") &&
    widgetEntitlements.includes("group.com.mattnewman.studyplanner"),
  "Tracked app and widget entitlements must use the StudyPlanner app group."
);
assert(
  widgetInfoPlist.includes("group.com.mattnewman.studyplanner"),
  "Tracked widget Info.plist must use the StudyPlanner widget app group identifier."
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
assert(
  paywall.includes("purchaseConfig.productIdSource") || paywall.includes("usesManifestProductFallback"),
  "Paywall must disclose whether product IDs came from build env or the release manifest."
);
for (const productId of manifestProductIds) {
  assert(!paywall.includes(productId), `Paywall must not hardcode StoreKit product ID ${productId}.`);
}
assert(!importScreen.includes("Syllabus scan is unavailable"), "Scan UI must not render unavailable copy.");
assert(!importScreen.includes("disabled={!parserReady"), "Scan buttons must not be disabled by missing endpoint config.");

for (const [file, source] of srcSource) {
  if (file !== "src/config/iap.ts") {
    for (const productId of manifestProductIds) {
      assert(!source.includes(productId), `${file} must not hardcode StoreKit product ID ${productId}; use src/config/iap.ts.`);
    }
  }
  assert(!source.includes("parseSyllabusStub"), `Remove stub parser reference from ${file}.`);
  assert(!source.includes("StoreCapture"), `Remove store capture source from ${file}.`);
  assert(!source.includes("StorePreview"), `Remove store preview source from ${file}.`);
  assert(!source.includes("seedAssignments"), `Remove seeded planner data from ${file}.`);
  assert(!source.includes("seedCourses"), `Remove seeded courses from ${file}.`);
  assert(!source.includes("isPremium: true"), `Remove hardcoded paid access from ${file}.`);
}

if (storeKitConfig) {
  const storeKitProductIds = [...storeKitConfig.matchAll(/"productID"\s*:\s*"([^"]+)"/g)].map((match) => match[1]);
  assert(
    arraysEqual([...storeKitProductIds].sort(), [...manifestProductIds].sort()),
    `${storeKitConfigPath} product IDs must match src/config/iap.ts.`
  );
} else {
  console.warn(`warning: ${storeKitConfigPath} is missing; local StoreKit simulator testing will need App Store sandbox products.`);
}

console.log(`IAP readiness: ${readiness}`);
console.log("IAP and hard-paywall configuration passed.");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readIfExists(relativePath) {
  const fullPath = path.join(root, relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : "";
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

function assertWidget(kind, displayName, supportedFamilies) {
  const widget = widgetPlugin?.widgets?.find((item) => item.kind === kind);
  assert(widget, `${kind} widget metadata must be registered.`);
  if (!widget) return;
  assert(widget.displayName === displayName, `${kind} display name must be ${displayName}.`);
  assert(
    JSON.stringify(widget.supportedFamilies) === JSON.stringify(supportedFamilies),
    `${kind} supported families must match ${supportedFamilies.join(", ")}.`
  );
}

function matchString(source, pattern) {
  return source.match(pattern)?.[1] || "";
}

function productIdsFromManifest(source) {
  return [...source.matchAll(/productId:\s*"([^"]+)"/g)].map((match) => match[1]);
}

function bundleIdsFromManifest(source) {
  return [...source.matchAll(/bundleIdentifier:\s*"([^"]+)"/g)].map((match) => match[1]);
}

function unique(values) {
  return Array.from(new Set(values));
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
