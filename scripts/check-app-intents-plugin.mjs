// Static checks for the App Intents config plugin, its Swift sources, the string
// catalogs, app.json wiring, and the universal-link static site.
//
//   node scripts/check-app-intents-plugin.mjs
//   node scripts/check-app-intents-plugin.mjs --ios-dir <path/to/generated/ios>
//
// The second form also inspects a real `npx expo prebuild -p ios` output
// (never committed) and confirms the Swift sources are in the MAIN app target's
// Sources phase and the catalogs in its Resources phase.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const xcode = require("xcode");
const pbxprojParser = require("xcode/lib/parser/pbxproj");
const plugin = require("../plugins/with-studyplanner-app-intents.js");

const SWIFT_DIR = "plugins/studyplanner-app-intents/ios";
const LOCALES = ["ar", "de", "en", "es", "fr", "hi", "ja", "ko", "pt-BR", "zh-Hans"];
const failures = [];
let passed = 0;

function expect(condition, message) {
  if (condition) passed += 1;
  else failures.push(message);
}

function read(file) {
  return readFileSync(file, "utf8");
}

function stripSwiftComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"])\/\/.*$/gm, "$1");
}

function unquote(value) {
  return String(value ?? "").replace(/^"(.*)"$/, "$1");
}

// ---------------------------------------------------------------------------
// 1. Plugin: pbxproj mutation on a fixture project (app target + widget extension).
// ---------------------------------------------------------------------------
const FIXTURE_PBXPROJ = `// !$*UTF8*$!
{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 54;
	objects = {

/* Begin PBXBuildFile section */
		AA0000000000000000000001 /* AppDelegate.swift in Sources */ = {isa = PBXBuildFile; fileRef = AA0000000000000000000002 /* AppDelegate.swift */; };
		BB0000000000000000000001 /* index.swift in Sources */ = {isa = PBXBuildFile; fileRef = BB0000000000000000000002 /* index.swift */; };
/* End PBXBuildFile section */

/* Begin PBXFileReference section */
		AA0000000000000000000002 /* AppDelegate.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; name = AppDelegate.swift; path = FakeApp/AppDelegate.swift; sourceTree = "<group>"; };
		AA0000000000000000000003 /* FakeApp.app */ = {isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = FakeApp.app; sourceTree = BUILT_PRODUCTS_DIR; };
		BB0000000000000000000002 /* index.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = index.swift; sourceTree = "<group>"; };
		BB0000000000000000000003 /* ExpoWidgetsTarget.appex */ = {isa = PBXFileReference; explicitFileType = "wrapper.app-extension"; includeInIndex = 0; path = ExpoWidgetsTarget.appex; sourceTree = BUILT_PRODUCTS_DIR; };
/* End PBXFileReference section */

/* Begin PBXGroup section */
		CC0000000000000000000001 = {
			isa = PBXGroup;
			children = (
				AA0000000000000000000010 /* FakeApp */,
				BB0000000000000000000010 /* ExpoWidgetsTarget */,
				CC0000000000000000000002 /* Products */,
			);
			sourceTree = "<group>";
		};
		AA0000000000000000000010 /* FakeApp */ = {
			isa = PBXGroup;
			children = (
				AA0000000000000000000002 /* AppDelegate.swift */,
			);
			name = FakeApp;
			sourceTree = "<group>";
		};
		BB0000000000000000000010 /* ExpoWidgetsTarget */ = {
			isa = PBXGroup;
			children = (
				BB0000000000000000000002 /* index.swift */,
			);
			path = ExpoWidgetsTarget;
			sourceTree = "<group>";
		};
		CC0000000000000000000002 /* Products */ = {
			isa = PBXGroup;
			children = (
				AA0000000000000000000003 /* FakeApp.app */,
				BB0000000000000000000003 /* ExpoWidgetsTarget.appex */,
			);
			name = Products;
			sourceTree = "<group>";
		};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
		AA0000000000000000000020 /* FakeApp */ = {
			isa = PBXNativeTarget;
			buildPhases = (
				AA0000000000000000000021 /* Sources */,
				AA0000000000000000000022 /* Resources */,
			);
			buildRules = (
			);
			dependencies = (
			);
			name = FakeApp;
			productName = FakeApp;
			productReference = AA0000000000000000000003 /* FakeApp.app */;
			productType = "com.apple.product-type.application";
		};
		BB0000000000000000000020 /* ExpoWidgetsTarget */ = {
			isa = PBXNativeTarget;
			buildPhases = (
				BB0000000000000000000021 /* Sources */,
				BB0000000000000000000022 /* Resources */,
			);
			buildRules = (
			);
			dependencies = (
			);
			name = ExpoWidgetsTarget;
			productName = ExpoWidgetsTarget;
			productReference = BB0000000000000000000003 /* ExpoWidgetsTarget.appex */;
			productType = "com.apple.product-type.app-extension";
		};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
		DD0000000000000000000001 /* Project object */ = {
			isa = PBXProject;
			compatibilityVersion = "Xcode 12.0";
			developmentRegion = en;
			hasScannedForEncodings = 0;
			knownRegions = (
				en,
				Base,
			);
			mainGroup = CC0000000000000000000001;
			productRefGroup = CC0000000000000000000002 /* Products */;
			projectDirPath = "";
			projectRoot = "";
			targets = (
				BB0000000000000000000020 /* ExpoWidgetsTarget */,
				AA0000000000000000000020 /* FakeApp */,
			);
		};
/* End PBXProject section */

/* Begin PBXResourcesBuildPhase section */
		AA0000000000000000000022 /* Resources */ = {
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
		BB0000000000000000000022 /* Resources */ = {
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXResourcesBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
		AA0000000000000000000021 /* Sources */ = {
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				AA0000000000000000000001 /* AppDelegate.swift in Sources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
		BB0000000000000000000021 /* Sources */ = {
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				BB0000000000000000000001 /* index.swift in Sources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXSourcesBuildPhase section */
	};
	rootObject = DD0000000000000000000001 /* Project object */;
}
`;

function parseProject(text) {
  const project = xcode.project("fixture.pbxproj");
  project.hash = pbxprojParser.parse(text);
  return project;
}

function phaseFileNames(project, targetName, isa) {
  const objects = project.hash.project.objects;
  const [, target] = Object.entries(objects.PBXNativeTarget).find(([key, value]) => !key.endsWith("_comment") && unquote(value.name) === targetName);
  const phaseRef = target.buildPhases.find((ref) => objects[isa]?.[ref.value]);
  const phase = objects[isa][phaseRef.value];
  return phase.files.map((entry) => {
    const buildFile = objects.PBXBuildFile[entry.value];
    return unquote(objects.PBXFileReference[buildFile.fileRef]?.path ?? objects.PBXVariantGroup?.[buildFile.fileRef]?.name);
  });
}

{
  const project = parseProject(FIXTURE_PBXPROJ);
  const firstAdded = plugin.applyAppIntentsToXcodeProject(project, { projectName: "FakeApp" });
  const expectedFiles = [...plugin.SWIFT_SOURCES, ...plugin.RESOURCE_FILES];
  const expectedLinks = expectedFiles.length + 1; // + AppShortcuts.strings variant group
  expect(firstAdded.length === expectedLinks, `first run links every file (${firstAdded.length}/${expectedLinks})`);

  const firstOutput = project.writeSync();
  const secondAdded = plugin.applyAppIntentsToXcodeProject(project, { projectName: "FakeApp" });
  expect(secondAdded.length === 0, "second run on the same project adds nothing");
  expect(project.writeSync() === firstOutput, "second run leaves the pbxproj byte-identical");

  const reparsed = parseProject(firstOutput);
  const thirdAdded = plugin.applyAppIntentsToXcodeProject(reparsed, { projectName: "FakeApp" });
  expect(thirdAdded.length === 0 && reparsed.writeSync() === firstOutput, "re-running on a written + re-parsed pbxproj (prebuild without --clean) is a no-op");

  const appSources = phaseFileNames(project, "FakeApp", "PBXSourcesBuildPhase");
  const appResources = phaseFileNames(project, "FakeApp", "PBXResourcesBuildPhase");
  const widgetSources = phaseFileNames(project, "ExpoWidgetsTarget", "PBXSourcesBuildPhase");
  const widgetResources = phaseFileNames(project, "ExpoWidgetsTarget", "PBXResourcesBuildPhase");
  for (const file of plugin.SWIFT_SOURCES) {
    const expected = `FakeApp/${plugin.INTENTS_GROUP}/${file}`;
    expect(appSources.filter((entry) => entry === expected).length === 1, `${file} is in the app target Sources phase exactly once`);
    expect(!widgetSources.includes(expected), `${file} is not in the widget extension`);
  }
  for (const file of plugin.RESOURCE_FILES) {
    const expected = `FakeApp/${plugin.INTENTS_GROUP}/${file}`;
    expect(appResources.filter((entry) => entry === expected).length === 1, `${file} is in the app target Resources phase exactly once`);
    expect(!widgetResources.includes(expected), `${file} is not in the widget extension`);
  }
  expect(appSources.includes("FakeApp/AppDelegate.swift") && widgetSources.includes("index.swift"), "existing build files are untouched");

  const refs = Object.entries(project.hash.project.objects.PBXFileReference).filter(([key]) => !key.endsWith("_comment"));
  for (const file of expectedFiles) {
    const matches = refs.filter(([, ref]) => unquote(ref.path) === `FakeApp/${plugin.INTENTS_GROUP}/${file}`);
    expect(matches.length === 1, `${file} has exactly one file reference`);
  }
  const xcstringsTypes = refs.filter(([, ref]) => unquote(ref.path).endsWith(".xcstrings")).map(([, ref]) => ref.lastKnownFileType);
  expect(xcstringsTypes.length === plugin.RESOURCE_FILES.length && xcstringsTypes.every((type) => type === "text.json.xcstrings"), "string catalogs use the text.json.xcstrings file type");
  expect(!refs.some(([, ref]) => unquote(ref.path).endsWith("AppShortcuts.xcstrings")), "AppShortcuts.xcstrings is not a build resource (Xcode requires iOS 17 for it; the app supports 16.4)");
  const variants = Object.entries(project.hash.project.objects.PBXVariantGroup || {}).filter(([key, group]) => !key.endsWith("_comment") && unquote(group.name) === plugin.SHORTCUTS_STRINGS);
  expect(variants.length === 1, "one AppShortcuts.strings variant group");
  expect(appResources.filter((entry) => entry === plugin.SHORTCUTS_STRINGS).length === 1 && !widgetResources.includes(plugin.SHORTCUTS_STRINGS), "AppShortcuts.strings is in the app Resources phase once, not the widget");
  const shortcutsCatalog22 = JSON.parse(read(path.join(SWIFT_DIR, "AppShortcuts.xcstrings")));
  const variantPaths = variants[0][1].children.map((child) => unquote(project.hash.project.objects.PBXFileReference[child.value].path));
  expect(plugin.shortcutLanguages(shortcutsCatalog22).every((language) => variantPaths.includes(`FakeApp/${plugin.INTENTS_GROUP}/${language}.lproj/AppShortcuts.strings`)), "every catalog language has an AppShortcuts.strings variant");
  const deStrings = plugin.renderShortcutStrings(shortcutsCatalog22, "de");
  expect(deStrings.includes('"${applicationName} add assignment" = "${applicationName} Aufgabe hinzufügen";'), "AppShortcuts.strings keeps ${applicationName} keys and translations");

  const groups = Object.entries(project.hash.project.objects.PBXGroup).filter(([key]) => !key.endsWith("_comment"));
  expect(groups.filter(([, group]) => unquote(group.name) === plugin.INTENTS_GROUP).length === 1, "one StudyPlannerAppIntents group");

  const root = project.hash.project.objects.PBXProject[project.hash.project.rootObject];
  const known = root.knownRegions.map(unquote);
  expect(LOCALES.every((locale) => known.includes(locale)) && known.includes("Base"), "knownRegions include all 10 locales and keep Base");
}

// ---------------------------------------------------------------------------
// 2. Plugin: AppDelegate and Info.plist patches.
// ---------------------------------------------------------------------------
const EXPO_56_APP_DELEGATE = `internal import Expo
import React
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate {
  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}
`;
{
  const once = plugin.patchAppDelegateSource(EXPO_56_APP_DELEGATE);
  const twice = plugin.patchAppDelegateSource(once);
  expect(once !== EXPO_56_APP_DELEGATE, "AppDelegate patch applies to the Expo SDK 56 template");
  expect(twice === once, "AppDelegate patch is idempotent");
  expect(once.split(plugin.APP_DELEGATE_MARKER).length === 2, "AppDelegate marker appears once");
  const spotlightIndex = once.indexOf("StudyPlannerSpotlightRouter.handle(userActivity)");
  const linkingIndex = once.indexOf("RCTLinkingManager.application(application, continue:");
  expect(spotlightIndex > 0 && spotlightIndex < linkingIndex, "Spotlight routing runs before React Native's universal-link handler");
  let threw = false;
  try {
    plugin.patchAppDelegateSource("class AppDelegate {}");
  } catch {
    threw = true;
  }
  expect(threw, "AppDelegate patch fails loudly when the template changes");

  const plist = plugin.applyAlternativeAppNames(plugin.applyAlternativeAppNames({}));
  expect(plist.INAlternativeAppNames.length === 2, "INAlternativeAppNames is idempotent");
}

// ---------------------------------------------------------------------------
// 3. Swift sources.
// ---------------------------------------------------------------------------
const swiftFiles = readdirSync(SWIFT_DIR).filter((file) => file.endsWith(".swift")).sort();
expect(JSON.stringify(swiftFiles) === JSON.stringify([...plugin.SWIFT_SOURCES].sort()), "plugin SWIFT_SOURCES matches the Swift files on disk");
for (const file of plugin.RESOURCE_FILES) expect(existsSync(path.join(SWIFT_DIR, file)), `${file} exists`);
const swift = Object.fromEntries(swiftFiles.map((file) => [file, read(path.join(SWIFT_DIR, file))]));
const allSwift = Object.values(swift).join("\n");

// No inference anywhere.
for (const [file, source] of Object.entries(swift)) {
  const code = stripSwiftComments(source);
  expect(!/import\s+FoundationModels|LanguageModelSession|SystemLanguageModel|@Generable|import\s+CoreML|import\s+NaturalLanguage/.test(code), `${file} does not import FoundationModels or run any model`);
}

// Add Assignment never parses what the student said.
for (const file of ["AddAssignmentIntent.swift", "StudyPlannerIntentInbox.swift"]) {
  const code = stripSwiftComments(swift[file]);
  const forbidden = [
    /NSDataDetector/, /NSRegularExpression/, /\bRegex\b/, /#\//, /DateFormatter/, /NLTagger/, /NLTokenizer/,
    /\.split\(/, /components\(separatedBy/, /firstMatch/, /wholeMatch/, /\.range\(of:/, /\bScanner\(/,
    /\bInt\(/, /\bDouble\(/, /Decimal\(/, /dateFromPhrase|parseCaptureDate|createNaturalLanguageTask/,
  ];
  for (const pattern of forbidden) expect(!pattern.test(code), `${file} never parses capture text (${pattern})`);
}
{
  const intent = stripSwiftComments(swift["AddAssignmentIntent.swift"]);
  expect(/StudyPlannerIntentInbox\.append\(text: text\)/.test(intent), "AddAssignmentIntent queues the raw text verbatim");
  expect(intent.includes("StudyPlannerIntentCopy.saved"), "AddAssignmentIntent confirms with the saved dialog");
  const inbox = stripSwiftComments(swift["StudyPlannerIntentInbox.swift"]);
  expect(/maxEntries = 20/.test(inbox) && /suffix\(maxEntries\)/.test(inbox), "inbox keeps the newest 20 entries");
  expect(/\.atomic/.test(inbox), "inbox writes atomically");
  expect(/"id": id/.test(inbox) && /"text": text/.test(inbox) && /"createdAt":/.test(inbox) && /UUID\(\)\.uuidString/.test(inbox), "inbox entries are { id: UUID, text, createdAt }");
  expect(read(path.join(SWIFT_DIR, "StudyPlannerIntentAnswers.swift")).includes('"Saved. Open StudyPlanner to confirm."'), "saved dialog copy matches the spec");
}

// Availability: every intent / entity / provider type is iOS 16+, IndexedEntity only on iOS 18+.
{
  const typeDecl = /((?:@available\([^)]*\)\s*)*)struct\s+(\w+)\s*:\s*([^{]+)\{/g;
  for (const [file, source] of Object.entries(swift)) {
    for (const match of source.matchAll(typeDecl)) {
      const [, attrs, name, conformances] = match;
      if (/AppIntent|OpenIntent|AppEntity|EntityQuery|EntityStringQuery|AppShortcutsProvider/.test(conformances)) {
        expect(/@available\(iOS 16\.0, \*\)/.test(attrs), `${file}: ${name} is @available(iOS 16.0, *)`);
      }
    }
    for (const match of source.matchAll(/((?:@available\([^)]*\)\s*)*)extension\s+(\w+)\s*:\s*IndexedEntity/g)) {
      expect(/@available\(iOS 18\.0, \*\)/.test(match[1]), `${file}: ${match[2]} IndexedEntity conformance is iOS 18+ only`);
    }
    expect(!/struct\s+\w+\s*:[^{]*IndexedEntity/.test(source), `${file}: IndexedEntity is never on the base iOS 16 declaration`);
  }
  const intents = stripSwiftComments(swift["StudyPlannerIntents.swift"]);
  expect(/extension OpenScannerIntent \{\s*static var openAppWhenRun: Bool \{ true \}/.test(intents), "OpenScannerIntent opens the app (openAppWhenRun)");
  expect(/StudyPlannerDeepLink\.scan/.test(intents) && /StudyPlannerPendingRoute\.write/.test(allSwift), "OpenScannerIntent routes studyplanner://scan through pending-route.json");
  const answers = stripSwiftComments(swift["StudyPlannerIntentAnswers.swift"]);
  expect(/snapshot\.dateKey == StudyPlannerCalendar\.todayKey/.test(answers) && /StudyPlannerIntentCopy\.refresh/.test(answers), "Study Now falls back to the refresh line when the snapshot is not from today");
  expect(/dueLimit = 3/.test(answers), "What's Due answers with at most 3 items");
}

// App Shortcuts phrases.
const phraseLiterals = [];
{
  const shortcuts = stripSwiftComments(swift["StudyPlannerShortcuts.swift"]);
  const blocks = [...shortcuts.matchAll(/AppShortcut\(\s*intent:\s*(\w+)\(\),\s*phrases:\s*\[([\s\S]*?)\],\s*shortTitle:\s*"([^"]+)",\s*systemImageName:\s*"([^"]+)"\s*\)/g)];
  const total = (shortcuts.match(/AppShortcut\(/g) || []).length;
  expect(blocks.length === total && total > 0 && total <= 10, `every AppShortcut has phrases, shortTitle, and systemImageName (${blocks.length}/${total}, max 10)`);
  for (const [, intent, body] of blocks) {
    const literals = [...body.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
    expect(literals.length > 0, `${intent} has phrases`);
    for (const literal of literals) {
      const count = literal.split("\\(.applicationName)").length - 1;
      expect(count === 1, `phrase "${literal}" contains \\(.applicationName) exactly once`);
      phraseLiterals.push(literal.replace("\\(.applicationName)", "${applicationName}"));
    }
  }
  for (const intent of ["StudyNowIntent", "WhatsDueIntent", "AddAssignmentIntent", "OpenScannerIntent"]) {
    expect(blocks.some((block) => block[1] === intent), `${intent} has an App Shortcut`);
  }
}

// ---------------------------------------------------------------------------
// 4. String catalogs.
// ---------------------------------------------------------------------------
function loadCatalog(file) {
  try {
    return JSON.parse(read(path.join(SWIFT_DIR, file)));
  } catch (error) {
    failures.push(`${file} is valid JSON (${error.message})`);
    return { strings: {} };
  }
}

function specifiers(text) {
  return (text.match(/%(?:\d+\$)?(?:@|lld|ld|d)/g) || []).map((s) => s.replace(/\d+\$/, "")).sort().join(",");
}

function checkCatalog(file, { phraseCatalog }) {
  const catalog = loadCatalog(file);
  expect(catalog.sourceLanguage === "en", `${file} source language is en`);
  for (const [key, entry] of Object.entries(catalog.strings)) {
    const localizations = entry.localizations || {};
    for (const locale of LOCALES) {
      const loc = localizations[locale];
      // [state, value, mustKeepAllSpecifiers]. Plural "one"/"two"/"zero" forms may spell the number out.
      const values = [];
      if (loc?.stringUnit) values.push([loc.stringUnit.state, loc.stringUnit.value, true]);
      if (loc?.variations?.plural) {
        expect(Boolean(loc.variations.plural.other), `${file}: "${key}" ${locale} plural has an "other" form`);
        for (const [category, variant] of Object.entries(loc.variations.plural)) {
          values.push([variant.stringUnit?.state, variant.stringUnit?.value, category === "other"]);
        }
      }
      expect(values.length > 0, `${file}: "${key}" has a ${locale} localization`);
      const english = localizations.en?.stringUnit?.value ?? localizations.en?.variations?.plural?.other?.stringUnit?.value ?? key;
      for (const [state, value, strict] of values) {
        expect(state === "translated" && typeof value === "string" && value.trim().length > 0, `${file}: "${key}" ${locale} is translated`);
        if (phraseCatalog) {
          expect((value || "").split("${applicationName}").length - 1 === 1, `${file}: "${key}" ${locale} keeps \${applicationName} exactly once`);
        } else {
          const actual = specifiers(value || "");
          const ok = strict ? actual === specifiers(english) : actual.split(",").filter(Boolean).every((spec) => specifiers(english).split(",").includes(spec));
          expect(ok, `${file}: "${key}" ${locale} keeps the same format specifiers as English`);
        }
      }
    }
  }
  return catalog;
}

{
  const shortcutsCatalog = checkCatalog("AppShortcuts.xcstrings", { phraseCatalog: true });
  const catalogKeys = Object.keys(shortcutsCatalog.strings);
  for (const phrase of phraseLiterals) expect(catalogKeys.includes(phrase), `AppShortcuts.xcstrings has a key for "${phrase}"`);
  for (const key of catalogKeys) expect(phraseLiterals.includes(key), `AppShortcuts.xcstrings key "${key}" is used by an App Shortcut`);

  const localizable = checkCatalog("Localizable.xcstrings", { phraseCatalog: false });
  const keys = new Set(Object.keys(localizable.strings));
  const code = stripSwiftComments(allSwift);
  const required = new Set();
  const patterns = [
    /LocalizedStringResource = "([^"]+)"/g,
    /IntentDescription\("([^"]+)"\)/g,
    /TypeDisplayRepresentation\(name: "([^"]+)"\)/g,
    /@Parameter\(title: "([^"]+)"/g,
    /requestValueDialog: "([^"]+)"/g,
    /needsValueError\("([^"]+)"\)/g,
    /shortTitle: "([^"]+)"/g,
    /String\(localized: "([^"]+)"/g,
  ];
  for (const pattern of patterns) for (const match of code.matchAll(pattern)) required.add(match[1]);
  for (const key of required) expect(keys.has(key), `Localizable.xcstrings covers "${key}"`);
  expect(required.size >= 20, `Localizable coverage scan found the Swift strings (${required.size})`);
}

// ---------------------------------------------------------------------------
// 5. app.json wiring.
// ---------------------------------------------------------------------------
const app = JSON.parse(read("app.json")).expo;
{
  expect(app.plugins.includes("./plugins/with-studyplanner-app-intents"), "app.json registers the App Intents plugin");
  expect(app.version === "2.2.0" && Number(app.ios.buildNumber) >= 91, "app.json is 2.2.0, build 91 or later");
  expect(app.ios.associatedDomains?.includes("applinks:studyplanner-ai.xxmnewman9xx.workers.dev"), "associatedDomains includes the workers.dev applinks domain");
  expect(app.ios.entitlements?.["com.apple.security.application-groups"]?.includes("group.com.mattnewman.studyplanner"), "App Group entitlement is preserved");
  expect(read(path.join(SWIFT_DIR, "StudyPlannerIntentStore.swift")).includes('"group.com.mattnewman.studyplanner"'), "intents use the app's App Group");
  const widgets = app.plugins.find((entry) => Array.isArray(entry) && entry[0] === "expo-widgets");
  expect(widgets?.[1]?.groupIdentifier === "group.com.mattnewman.studyplanner", "expo-widgets App Group is preserved");
}

// ---------------------------------------------------------------------------
// 6. Universal-link static site.
// ---------------------------------------------------------------------------
{
  const root = "deploy/universal-links";
  let aasa = null;
  try {
    aasa = JSON.parse(read(path.join(root, ".well-known/apple-app-site-association")));
  } catch (error) {
    failures.push(`AASA is valid JSON (${error.message})`);
  }
  const detail = aasa?.applinks?.details?.[0];
  expect(detail?.appIDs?.[0] === `${app.ios.appleTeamId}.${app.ios.bundleIdentifier}`, "AASA appID is <appleTeamId>.<bundleIdentifier>");
  const paths = (detail?.components || []).map((component) => component["/"]);
  expect(["/p", "/p/*", "/d", "/d/*"].every((p) => paths.includes(p)), "AASA covers /p, /p/*, /d, /d/*");
  expect(/\/\.well-known\/apple-app-site-association\s*\n\s*Content-Type: application\/json/.test(read(path.join(root, "_headers"))), "_headers serves the AASA as application/json");

  for (const [page, kind] of [["p/index.html", "pack"], ["d/index.html", "duel"]]) {
    const html = read(path.join(root, page));
    expect(html.includes(`data-kind="${kind}"`), `${page} is the ${kind} page`);
    expect(/Content-Security-Policy" content="default-src 'none'/.test(html), `${page} blocks network requests with CSP`);
    expect(!/\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|<script[^>]+src=|<link[^>]+href=|<img[^>]+src="http/.test(html), `${page} loads nothing and sends nothing`);
    expect(html.includes("location.hash") && html.includes(`?ct=${kind}`) && html.includes("apps.apple.com/app/id6766181202"), `${page} reads the fragment and links the App Store with ct=${kind}`);
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    for (const script of scripts) {
      try {
        new Function(script);
      } catch (error) {
        failures.push(`${page} script parses (${error.message})`);
      }
    }
    const i18nBlock = html.slice(html.indexOf("var I18N"), html.indexOf("function pickLocale"));
    for (const locale of LOCALES) expect(new RegExp(`(^|\\s|")${locale.replace("-", "\\-")}"?:\\s*\\{`).test(i18nBlock), `${page} is localized for ${locale}`);
    expect(html.includes('locale === "ar" ? "rtl"'), `${page} switches to RTL for Arabic`);
  }
}

// ---------------------------------------------------------------------------
// 7. Optional: a real prebuild output.
// ---------------------------------------------------------------------------
const iosDirFlag = process.argv.indexOf("--ios-dir");
if (iosDirFlag > 0) {
  const iosDir = process.argv[iosDirFlag + 1];
  const projectDir = readdirSync(iosDir).find((entry) => entry.endsWith(".xcodeproj"));
  const projectName = projectDir.replace(/\.xcodeproj$/, "");
  const project = xcode.project(path.join(iosDir, projectDir, "project.pbxproj"));
  project.parseSync();
  const sources = phaseFileNames(project, projectName, "PBXSourcesBuildPhase");
  const resources = phaseFileNames(project, projectName, "PBXResourcesBuildPhase");
  for (const file of plugin.SWIFT_SOURCES) {
    const expected = `${projectName}/${plugin.INTENTS_GROUP}/${file}`;
    expect(sources.filter((entry) => entry === expected).length === 1, `prebuild: ${file} is in ${projectName} Sources once`);
    expect(existsSync(path.join(iosDir, expected)), `prebuild: ${expected} was copied`);
  }
  for (const file of plugin.RESOURCE_FILES) {
    expect(resources.filter((entry) => entry === `${projectName}/${plugin.INTENTS_GROUP}/${file}`).length === 1, `prebuild: ${file} is in ${projectName} Resources once`);
  }
  const appDelegate = read(path.join(iosDir, projectName, "AppDelegate.swift"));
  expect(appDelegate.split(plugin.APP_DELEGATE_MARKER).length === 2, "prebuild: AppDelegate routes Spotlight results once");
  const entitlements = read(path.join(iosDir, projectName, `${projectName}.entitlements`));
  expect(entitlements.includes("applinks:studyplanner-ai.xxmnewman9xx.workers.dev") && entitlements.includes("group.com.mattnewman.studyplanner"), "prebuild: entitlements carry applinks and the App Group");
}

if (failures.length) {
  console.error(`App Intents plugin checks failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`App Intents plugin checks passed (${passed} assertions${iosDirFlag > 0 ? ", including prebuild output" : ""}).`);
