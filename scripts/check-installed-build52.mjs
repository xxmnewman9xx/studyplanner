import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const device = process.env.SIM_DEVICE || "booted";
const bundleId = process.env.STUDYPLANNER_BUNDLE_ID || "com.mattnewman.studyplanner";
const widgetBundleId = process.env.STUDYPLANNER_WIDGET_BUNDLE_ID || "com.mattnewman.studyplanner.widgets";
const expectedVersion = "1.0.3";
const expectedBuild = "52";
const expectedGroup = "group.com.mattnewman.studyplanner";
const expectedKinds = [
  "studyplanner.today",
  "studyplanner.upcoming",
  "studyplanner.week",
  "studyplanner.classProgress",
];

function run(command, args) {
  return execFileSync(command, args, { encoding: "utf8" }).trim();
}

function plist(plistPath, key) {
  return run("/usr/libexec/PlistBuddy", ["-c", `Print ${key}`, plistPath]);
}

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const appPath = run("xcrun", ["simctl", "get_app_container", device, bundleId, "app"]);
const appInfo = join(appPath, "Info.plist");
const appexPath = join(appPath, "PlugIns", "ExpoWidgetsTarget.appex");
const appexInfo = join(appexPath, "Info.plist");

expect(existsSync(appInfo), `Installed app Info.plist not found at ${appInfo}`);
expect(existsSync(appexInfo), `Installed widget Info.plist not found at ${appexInfo}`);
expect(plist(appInfo, "CFBundleIdentifier") === bundleId, "Installed app bundle id mismatch");
expect(plist(appInfo, "CFBundleShortVersionString") === expectedVersion, "Installed app version mismatch");
expect(plist(appInfo, "CFBundleVersion") === expectedBuild, "Installed app build mismatch");
expect(plist(appexInfo, "CFBundleIdentifier") === widgetBundleId, "Installed widget bundle id mismatch");
expect(plist(appexInfo, "CFBundleVersion") === expectedBuild, "Installed widget build mismatch");
expect(plist(appexInfo, "NSExtension:NSExtensionPointIdentifier") === "com.apple.widgetkit-extension", "Widget extension point mismatch");

const installedApps = run("xcrun", ["simctl", "listapps", device]);
const widgetBinary = run("strings", [join(appexPath, "ExpoWidgetsTarget")]);
expect(installedApps.includes(expectedGroup), "Installed app metadata is missing shared app group");
expect(widgetBinary.includes(expectedGroup), "Installed widget binary is missing shared app group");

const appConfig = JSON.parse(readFileSync("app.json", "utf8"));
const appConfigText = JSON.stringify(appConfig);
expectedKinds.forEach((kind) => expect(appConfigText.includes(kind), `Widget kind missing from app config: ${kind}`));

console.log("Installed Build 52 app/widget parity checks passed.");
