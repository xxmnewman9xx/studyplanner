import { readFileSync } from "node:fs";

const app = JSON.parse(readFileSync("app.json", "utf8")).expo;
const iap = readFileSync("src/iap.ts", "utf8");
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

expect(app.ios?.bundleIdentifier === "com.mattnewman.studyplanner", "app bundle id must remain com.mattnewman.studyplanner");
expect(app.ios?.appleTeamId === "5JN35MJ3QD", "Apple Team must remain 5JN35MJ3QD");
expect(JSON.stringify(app).includes("group.com.mattnewman.studyplanner"), "App Group must remain configured");
expect(iap.includes('STUDYPLANNER_BUNDLE_ID = "com.mattnewman.studyplanner"'), "IAP bundle constant must remain intact");
expect(iap.includes('STUDYPLANNER_ASC_APP_ID = "6766181202"'), "ASC app id must remain intact");
expect(iap.includes('STUDYPLANNER_ANDROID_PACKAGE_ID = "com.mattnewman.studyplanner"'), "Android package constant must remain intact");
expect(iap.includes("com.mattnewman.studyplanner.plus.monthly"), "monthly IAP product ID must remain intact");
expect(iap.includes("com.mattnewman.studyplanner.plus.yearly"), "yearly IAP product ID must remain intact");
expect(iap.includes("STUDYPLANNER_ANDROID_SUBSCRIPTION_IDS"), "Android subscription product IDs must be configured");
expect(iap.includes("getActiveSubscriptions([...ACTIVE_SUBSCRIPTION_IDS])"), "entitlement must be checked against active platform subscriptions");

if (failures.length) {
  console.error("IAP config checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("IAP config checks passed.");
