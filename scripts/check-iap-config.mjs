import { readFileSync } from "node:fs";

const app = JSON.parse(readFileSync("app.json", "utf8")).expo;
const iap = readFileSync("src/iap.ts", "utf8");
const iapManifest = readFileSync("src/config/iap.ts", "utf8");
const storeKit = readFileSync("qa/storekit/StudyPlannerLocal.storekit", "utf8");
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

expect(app.ios?.bundleIdentifier === "com.mattnewman.studyplanner", "app bundle id must remain com.mattnewman.studyplanner");
expect(app.ios?.appleTeamId === "5JN35MJ3QD", "Apple Team must remain 5JN35MJ3QD");
expect(JSON.stringify(app).includes("group.com.mattnewman.studyplanner"), "App Group must remain configured");
expect(iap.includes('STUDYPLANNER_BUNDLE_ID = "com.mattnewman.studyplanner"'), "IAP bundle constant must remain intact");
expect(iap.includes('STUDYPLANNER_ASC_APP_ID = "6766181202"'), "ASC app id must remain intact");
expect(iap.includes("com.mattnewman.studyplanner.plus.weekly"), "weekly IAP product ID must remain intact");
expect(iap.includes("com.mattnewman.studyplanner.plus.monthly"), "monthly IAP product ID must remain intact");
expect(iap.includes("com.mattnewman.studyplanner.plus.yearly"), "yearly IAP product ID must remain intact");
expect(iap.includes("getActiveSubscriptions([...STUDYPLANNER_SUBSCRIPTION_IDS])"), "entitlement must be checked against active App Store subscriptions");
expect(iap.includes('$5.99'), "weekly fallback price must remain $5.99");
expect(iap.includes('$14.99'), "monthly fallback price must remain $14.99");
expect(iap.includes('$59.99'), "yearly fallback price must remain $59.99");
expect(iapManifest.includes('appStoreConnectPriceUsd: "5.99"'), "weekly ASC target price must remain 5.99");
expect(iapManifest.includes('appStoreConnectPriceUsd: "14.99"'), "monthly ASC target price must remain 14.99");
expect(iapManifest.includes('appStoreConnectPriceUsd: "59.99"'), "yearly ASC target price must remain 59.99");
expect(storeKit.includes('"displayPrice": "5.99"'), "local StoreKit weekly price must remain 5.99");
expect(storeKit.includes('"displayPrice": "14.99"'), "local StoreKit monthly price must remain 14.99");
expect(storeKit.includes('"displayPrice": "59.99"'), "local StoreKit yearly price must remain 59.99");

if (failures.length) {
  console.error("IAP config checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("IAP config checks passed.");
