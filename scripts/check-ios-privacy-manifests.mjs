import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import plistModule from "@expo/plist";
import xcode from "xcode";

const plist = plistModule.default ?? plistModule;

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const APP_MANIFEST = join(ROOT, "ios/StudyPlannerSyllabusAI/PrivacyInfo.xcprivacy");
const WIDGET_MANIFEST = join(ROOT, "ios/ExpoWidgetsTarget/PrivacyInfo.xcprivacy");
const PROJECT_FILE = join(ROOT, "ios/StudyPlannerSyllabusAI.xcodeproj/project.pbxproj");
const WIDGET_TARGET = "ExpoWidgetsTarget";

function apiReasons(manifest, category) {
  const row = manifest.NSPrivacyAccessedAPITypes?.find((entry) => entry.NSPrivacyAccessedAPIType === category);
  return new Set(row?.NSPrivacyAccessedAPITypeReasons ?? []);
}

function assertReasons(manifest, category, reasons, label) {
  const actual = apiReasons(manifest, category);
  for (const reason of reasons) assert(actual.has(reason), `${label} must declare ${category} reason ${reason}`);
}

function parseXmlPlist(path) {
  return plist.parse(readFileSync(path, "utf8"));
}

function verifySourceConfiguration() {
  const appJson = JSON.parse(readFileSync(join(ROOT, "app.json"), "utf8"));
  const appPrivacy = appJson.expo?.ios?.privacyManifests ?? {};
  assertReasons(appPrivacy, "NSPrivacyAccessedAPICategoryUserDefaults", ["CA92.1", "1C8F.1"], "app.json");

  const pluginNames = (appJson.expo?.plugins ?? []).map((entry) => Array.isArray(entry) ? entry[0] : entry);
  const widgetsIndex = pluginNames.indexOf("expo-widgets");
  const privacyPluginIndex = pluginNames.indexOf("./plugins/with-widget-privacy-manifest");
  assert(widgetsIndex >= 0, "expo-widgets plugin must remain configured");
  assert(privacyPluginIndex >= 0 && privacyPluginIndex < widgetsIndex, "widget privacy plugin must be registered before expo-widgets so Expo's LIFO Xcode mod stack creates the target first");

  const pluginSource = readFileSync(join(ROOT, "plugins/with-widget-privacy-manifest.js"), "utf8");
  assert(pluginSource.includes('const TARGET_NAME = "ExpoWidgetsTarget"'), "privacy plugin must target the generated widget extension by name");
  assert(pluginSource.includes('filepath: PRIVACY_FILE'), "privacy plugin must add the manifest to the Xcode project");
  assert(pluginSource.includes("targetUuid"), "privacy plugin must attach the resource to the widget target specifically");
  assert(pluginSource.includes('project.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", targetUuid)'), "privacy plugin must create a widget Resources phase before attaching the manifest");
  assert(pluginSource.includes("syncTargetVersions(project, project.getFirstTarget().uuid") && pluginSource.includes("syncTargetVersions(project, targetUuid"), "privacy plugin must keep the app and widget build settings on the same release version");
  assert(pluginSource.includes('NSPrivacyAccessedAPITypeReasons: ["CA92.1", "1C8F.1"]'), "privacy plugin must aggregate standard and App Group UserDefaults reasons");
}

function verifyGeneratedProject() {
  if (!existsSync(PROJECT_FILE)) return;
  assert(existsSync(APP_MANIFEST), "generated main app privacy manifest must exist");
  assert(existsSync(WIDGET_MANIFEST), "generated widget-extension privacy manifest must exist");

  const main = parseXmlPlist(APP_MANIFEST);
  const widget = parseXmlPlist(WIDGET_MANIFEST);
  assertReasons(main, "NSPrivacyAccessedAPICategoryUserDefaults", ["CA92.1", "1C8F.1"], "generated main manifest");
  assertReasons(widget, "NSPrivacyAccessedAPICategoryFileTimestamp", ["C617.1"], "generated widget manifest");
  assertReasons(widget, "NSPrivacyAccessedAPICategoryUserDefaults", ["CA92.1", "1C8F.1"], "generated widget manifest");
  assertReasons(widget, "NSPrivacyAccessedAPICategorySystemBootTime", ["35F9.1"], "generated widget manifest");
  assert.equal(widget.NSPrivacyTracking, false, "generated widget manifest must declare tracking false");
  assert.deepEqual(widget.NSPrivacyCollectedDataTypes ?? [], [], "generated widget manifest must declare no collected data");

  const project = xcode.project(PROJECT_FILE);
  project.parseSync();
  const targetEntry = Object.entries(project.pbxNativeTargetSection()).find(([uuid, target]) => !uuid.endsWith("_comment") && target?.name === WIDGET_TARGET);
  assert(targetEntry, "generated Xcode project must contain ExpoWidgetsTarget");
  const [targetUuid, target] = targetEntry;
  const groups = project.hash.project.objects.PBXGroup ?? {};
  const widgetGroup = Object.values(groups).find((group) => group?.isa === "PBXGroup" && group.path === WIDGET_TARGET);
  const privacyChild = widgetGroup?.children?.find((child) => child.comment === "PrivacyInfo.xcprivacy");
  assert(privacyChild, "widget target group must contain PrivacyInfo.xcprivacy");

  const resourcePhases = project.hash.project.objects.PBXResourcesBuildPhase ?? {};
  const resourcePhase = target.buildPhases?.map((entry) => resourcePhases[entry.value]).find(Boolean);
  assert(resourcePhase, "widget target must contain a Resources build phase");
  const buildFiles = project.pbxBuildFileSection();
  assert(resourcePhase.files.some((entry) => buildFiles[entry.value]?.fileRef === privacyChild.value), "widget PrivacyInfo.xcprivacy must be in ExpoWidgetsTarget Resources");
  assert.equal(project.pbxNativeTargetSection()[targetUuid]?.name, WIDGET_TARGET);
}

function allFiles(root, predicate) {
  const result = [];
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    if (statSync(path).isDirectory()) result.push(...allFiles(path, predicate));
    else if (predicate(path)) result.push(path);
  }
  return result;
}

function plistJson(path) {
  return JSON.parse(execFileSync("plutil", ["-convert", "json", "-o", "-", path], { encoding: "utf8" }));
}

function verifyIpa(rawPath) {
  const ipaPath = resolve(rawPath);
  assert(existsSync(ipaPath), `IPA does not exist: ${ipaPath}`);
  const unpacked = mkdtempSync(join(tmpdir(), "studyplanner-privacy-"));
  try {
    execFileSync("unzip", ["-q", ipaPath, "-d", unpacked]);
    const payload = join(unpacked, "Payload");
    const appName = readdirSync(payload).find((name) => name.endsWith(".app"));
    assert(appName, "IPA must contain a Payload/*.app bundle");
    const app = join(payload, appName);
    const widget = join(app, "PlugIns", `${WIDGET_TARGET}.appex`);
    const mainManifest = join(app, "PrivacyInfo.xcprivacy");
    const widgetManifest = join(widget, "PrivacyInfo.xcprivacy");
    assert(existsSync(widget), "IPA must contain ExpoWidgetsTarget.appex");
    assert(existsSync(mainManifest), "IPA must contain a root app PrivacyInfo.xcprivacy");
    assert(existsSync(widgetManifest), "IPA must contain a root widget-extension PrivacyInfo.xcprivacy");

    const main = plistJson(mainManifest);
    const widgetPrivacy = plistJson(widgetManifest);
    assertReasons(main, "NSPrivacyAccessedAPICategoryUserDefaults", ["CA92.1", "1C8F.1"], "IPA main manifest");
    assertReasons(widgetPrivacy, "NSPrivacyAccessedAPICategoryFileTimestamp", ["C617.1"], "IPA widget manifest");
    assertReasons(widgetPrivacy, "NSPrivacyAccessedAPICategoryUserDefaults", ["CA92.1", "1C8F.1"], "IPA widget manifest");
    assertReasons(widgetPrivacy, "NSPrivacyAccessedAPICategorySystemBootTime", ["35F9.1"], "IPA widget manifest");

    const manifests = allFiles(app, (path) => basename(path) === "PrivacyInfo.xcprivacy");
    assert(manifests.length >= 2, "IPA must preserve app and extension privacy manifests");
    for (const manifest of manifests) execFileSync("plutil", ["-lint", manifest], { stdio: "pipe" });

    const info = plistJson(join(app, "Info.plist"));
    assert.match(String(info.DTSDKName ?? ""), /^iphoneos(?:2[6-9]|[3-9]\d)/, "IPA must be built with the iOS 26 SDK or later");
    execFileSync("codesign", ["--verify", "--deep", "--strict", "--verbose=2", app], { stdio: "pipe" });
    for (const bundle of [app, widget]) {
      const result = spawnSync("codesign", ["-d", "--entitlements", ":-", bundle], { encoding: "utf8" });
      assert.equal(result.status, 0, `codesign must read ${basename(bundle)} entitlements`);
      assert(`${result.stdout}\n${result.stderr}`.includes("group.com.mattnewman.studyplanner"), `${basename(bundle)} must carry the StudyPlanner App Group entitlement`);
    }

    console.log(`IPA privacy gate passed for ${basename(ipaPath)} (${info.DTSDKName}; ${manifests.length} manifests linted)`);
  } finally {
    rmSync(unpacked, { recursive: true, force: true });
  }
}

verifySourceConfiguration();
verifyGeneratedProject();
const ipaIndex = process.argv.indexOf("--ipa");
if (ipaIndex >= 0) {
  assert(process.argv[ipaIndex + 1], "--ipa requires a path");
  verifyIpa(process.argv[ipaIndex + 1]);
}
console.log("iOS privacy manifest source/prebuild gate passed");
