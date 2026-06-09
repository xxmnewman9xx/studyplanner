import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const appConfig = JSON.parse(read("app.json")).expo;
const easConfig = JSON.parse(read("eas.json"));
const packageJson = JSON.parse(read("package.json"));
const iapSource = read("src/iap.ts");
const remindersSource = read("src/reminders.ts");
const appSource = read("App.tsx");
const gradleSource = read("android/app/build.gradle");
const manifestSource = read("android/app/src/main/AndroidManifest.xml");

const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

expect(appConfig.ios?.bundleIdentifier === "com.mattnewman.studyplanner", "iOS bundle id must remain stable.");
expect(appConfig.ios?.buildNumber === "56", "iOS build number must remain 56.");
expect(appConfig.android?.package === "com.mattnewman.studyplanner", "Android package must match Play package.");
expect(appConfig.android?.versionCode === 56, "Android versionCode must match the latest iOS build baseline.");
expect(gradleSource.includes("versionCode 56"), "Generated Android Gradle versionCode must be 56.");
expect(appConfig.android?.adaptiveIcon?.foregroundImage, "Android adaptive icon foreground must be configured.");
expect(appConfig.android?.adaptiveIcon?.backgroundImage, "Android adaptive icon background must be configured.");

for (const permission of [
  "android.permission.CAMERA",
  "android.permission.READ_MEDIA_IMAGES",
  "android.permission.POST_NOTIFICATIONS",
  "com.android.vending.BILLING"
]) {
  expect(appConfig.android?.permissions?.includes(permission), `app.json must declare ${permission}.`);
  expect(manifestSource.includes(permission), `AndroidManifest must include ${permission}.`);
}

for (const blocked of ["android.permission.RECORD_AUDIO", "android.permission.SYSTEM_ALERT_WINDOW"]) {
  expect(appConfig.android?.blockedPermissions?.includes(blocked), `${blocked} must stay blocked.`);
  expect(manifestSource.includes(`${blocked}" tools:node="remove"`), `${blocked} must be removed in AndroidManifest.`);
}

expect(easConfig.build?.production?.android?.buildType === "app-bundle", "Production Android builds must produce AAB.");
expect(easConfig.submit?.production?.android?.track === "internal", "Android submit must default to internal track.");
expect(packageJson.scripts?.["android:screenshots"], "android:screenshots script must exist.");
expect(packageJson.scripts?.["check:android-release"], "check:android-release script must exist.");
expect(iapSource.includes('STORE_NAME = Platform.OS === "android" ? "Google Play" : "App Store"'), "IAP copy must be platform-aware.");
expect(iapSource.includes("STUDYPLANNER_ANDROID_SUBSCRIPTION_IDS"), "Android subscription product IDs must be configured.");
expect(remindersSource.includes("STUDYPLANNER_ANDROID_REMINDER_CHANNEL_ID"), "Android reminder channel must exist.");
expect(remindersSource.includes("Android Settings"), "Notification denial copy must be Android-aware.");
expect(appSource.includes("Google Play account"), "Restore copy must be Android-aware.");

if (failures.length) {
  console.error("Android release checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Android release checks passed.");
