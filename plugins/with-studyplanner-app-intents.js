// Adds StudyPlanner's App Intents (Siri, Shortcuts, Spotlight) to the MAIN app target.
//
// App Intents metadata (Metadata.appintents) is extracted per target at build
// time, and App Shortcuts must live in the app bundle, so the Swift sources and
// the AppShortcuts/Localizable string catalogs are added to the application
// target's Sources and Resources build phases. Every step is idempotent: running
// prebuild twice (or without --clean) leaves exactly one reference per file.
//
// Nothing added here runs model inference; see plugins/studyplanner-app-intents/ios.
const fs = require("fs");
const path = require("path");
const { withAppDelegate, withDangerousMod, withInfoPlist, withXcodeProject } = require("expo/config-plugins");

const TEMPLATE_DIR = path.join("plugins", "studyplanner-app-intents", "ios");
const INTENTS_GROUP = "StudyPlannerAppIntents";

const SWIFT_SOURCES = [
  "StudyPlannerIntentStore.swift",
  "StudyPlannerIntentInbox.swift",
  "StudyPlannerIntentAnswers.swift",
  "StudyPlannerIntents.swift",
  "AddAssignmentIntent.swift",
  "StudyPlannerEntities.swift",
  "StudyPlannerShortcuts.swift",
  "StudyPlannerSpotlightRouter.swift",
];

// Localizable.xcstrings compiles for any deployment target and is copied as is.
const RESOURCE_FILES = ["Localizable.xcstrings"];

// Siri reads phrase translations from the AppShortcuts table of the app bundle.
// Xcode only accepts AppShortcuts.xcstrings for iOS 17+, and the app still
// supports iOS 16.4, so the catalog stays the source of truth and prebuild
// writes <lang>.lproj/AppShortcuts.strings into a variant group.
const SHORTCUTS_CATALOG = "AppShortcuts.xcstrings";
const SHORTCUTS_STRINGS = "AppShortcuts.strings";

const REGIONS = ["en", "ar", "de", "es", "fr", "hi", "ja", "ko", "pt-BR", "zh-Hans"];

const APP_DELEGATE_MARKER = "// @studyplanner-app-intents: route tapped Spotlight results";

const ALTERNATIVE_APP_NAMES = ["StudyPlanner", "Study Planner"];

function unquote(value) {
  return String(value ?? "").replace(/^"(.*)"$/, "$1");
}

function quote(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function objects(project, isa) {
  project.hash.project.objects[isa] = project.hash.project.objects[isa] || {};
  return project.hash.project.objects[isa];
}

function entries(section) {
  return Object.entries(section).filter(([key, value]) => !key.endsWith("_comment") && value && typeof value === "object");
}

function findMainAppTarget(project, projectName) {
  const targets = entries(objects(project, "PBXNativeTarget")).filter(
    ([, target]) => unquote(target.productType) === "com.apple.product-type.application"
  );
  const named = targets.find(([, target]) => unquote(target.name) === projectName);
  const match = named || targets[0];
  if (!match) throw new Error("[with-studyplanner-app-intents] Could not find the application target.");
  return { uuid: match[0], target: match[1] };
}

function findTargetPhase(project, target, isa) {
  const section = objects(project, isa);
  for (const phaseRef of target.buildPhases || []) {
    const phase = section[phaseRef.value];
    if (phase && phase.isa === isa) return phase;
  }
  return null;
}

function findChildGroup(project, parentGroup, name) {
  const groups = objects(project, "PBXGroup");
  for (const child of parentGroup.children || []) {
    const group = groups[child.value];
    if (group && (unquote(group.name) === name || unquote(group.path) === name)) {
      return { uuid: child.value, group };
    }
  }
  return null;
}

function ensureIntentsGroup(project, projectName) {
  const groups = objects(project, "PBXGroup");
  const mainGroupUuid = project.hash.project.objects.PBXProject[project.hash.project.rootObject].mainGroup;
  const mainGroup = groups[mainGroupUuid];
  const appGroup = findChildGroup(project, mainGroup, projectName)?.group || mainGroup;
  const existing = findChildGroup(project, appGroup, INTENTS_GROUP);
  if (existing) return existing.group;

  const uuid = project.generateUuid();
  groups[uuid] = { isa: "PBXGroup", children: [], name: INTENTS_GROUP, sourceTree: '"<group>"' };
  groups[`${uuid}_comment`] = INTENTS_GROUP;
  appGroup.children = appGroup.children || [];
  appGroup.children.push({ value: uuid, comment: INTENTS_GROUP });
  return groups[uuid];
}

function ensureFileReference(project, group, relativePath, fileType) {
  const refs = objects(project, "PBXFileReference");
  const name = path.posix.basename(relativePath);
  let fileRef = entries(refs).find(([, ref]) => unquote(ref.path) === relativePath)?.[0];
  if (!fileRef) {
    fileRef = project.generateUuid();
    refs[fileRef] = {
      isa: "PBXFileReference",
      fileEncoding: 4,
      lastKnownFileType: fileType,
      name: quote(name),
      path: quote(relativePath),
      sourceTree: '"<group>"',
    };
    refs[`${fileRef}_comment`] = name;
  }
  group.children = group.children || [];
  if (!group.children.some((child) => child.value === fileRef)) {
    group.children.push({ value: fileRef, comment: name });
  }
  return fileRef;
}

function ensureBuildFile(project, phase, fileRef, name, phaseName) {
  const buildFiles = objects(project, "PBXBuildFile");
  phase.files = phase.files || [];
  const alreadyLinked = phase.files.some((entry) => buildFiles[entry.value]?.fileRef === fileRef);
  if (alreadyLinked) return false;
  const uuid = project.generateUuid();
  const comment = `${name} in ${phaseName}`;
  buildFiles[uuid] = { isa: "PBXBuildFile", fileRef, fileRef_comment: name };
  buildFiles[`${uuid}_comment`] = comment;
  phase.files.push({ value: uuid, comment });
  return true;
}

function ensureKnownRegions(project) {
  const rootProject = project.hash.project.objects.PBXProject[project.hash.project.rootObject];
  const known = (rootProject.knownRegions || []).map(unquote);
  for (const region of REGIONS) {
    if (!known.includes(region)) known.push(region);
  }
  rootProject.knownRegions = known.map((region) => (/^[A-Za-z0-9_]+$/.test(region) ? region : quote(region)));
}

/** Languages in the AppShortcuts catalog (exported for tests). */
function shortcutLanguages(catalog) {
  const languages = new Set([catalog.sourceLanguage || "en"]);
  for (const entry of Object.values(catalog.strings || {})) {
    for (const language of Object.keys(entry.localizations || {})) languages.add(language);
  }
  return [...languages].sort();
}

function escapeStrings(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

/** Pure catalog -> .strings rendering for one language (exported for tests). */
function renderShortcutStrings(catalog, language) {
  const lines = [];
  for (const [key, entry] of Object.entries(catalog.strings || {}).sort(([a], [b]) => a.localeCompare(b))) {
    const value = entry.localizations?.[language]?.stringUnit?.value ?? (language === (catalog.sourceLanguage || "en") ? key : null);
    if (value != null) lines.push(`"${escapeStrings(key)}" = "${escapeStrings(value)}";`);
  }
  return `${lines.join("\n")}\n`;
}

function readShortcutsCatalog(projectRoot = process.cwd()) {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, TEMPLATE_DIR, SHORTCUTS_CATALOG), "utf8"));
}

function ensureShortcutsVariantGroup(project, group, resources, groupPath) {
  const variants = objects(project, "PBXVariantGroup");
  const refs = objects(project, "PBXFileReference");
  let variantUuid = entries(variants).find(([, variant]) => unquote(variant.name) === SHORTCUTS_STRINGS)?.[0];
  if (!variantUuid) {
    variantUuid = project.generateUuid();
    variants[variantUuid] = { isa: "PBXVariantGroup", children: [], name: quote(SHORTCUTS_STRINGS), sourceTree: '"<group>"' };
    variants[`${variantUuid}_comment`] = SHORTCUTS_STRINGS;
  }
  const variant = variants[variantUuid];
  for (const language of shortcutLanguages(readShortcutsCatalog())) {
    const relativePath = `${groupPath}/${language}.lproj/${SHORTCUTS_STRINGS}`;
    if (entries(refs).some(([uuid, ref]) => unquote(ref.path) === relativePath && variant.children.some((child) => child.value === uuid))) continue;
    const fileRef = project.generateUuid();
    refs[fileRef] = { isa: "PBXFileReference", lastKnownFileType: "text.plist.strings", name: quote(language), path: quote(relativePath), sourceTree: '"<group>"' };
    refs[`${fileRef}_comment`] = language;
    variant.children.push({ value: fileRef, comment: language });
  }
  group.children = group.children || [];
  if (!group.children.some((child) => child.value === variantUuid)) group.children.push({ value: variantUuid, comment: SHORTCUTS_STRINGS });
  return ensureBuildFile(project, resources, variantUuid, SHORTCUTS_STRINGS, "Resources");
}

/**
 * Pure pbxproj mutation (exported for tests). Adds the Swift sources to the
 * main app target's Sources phase and the string catalogs to its Resources
 * phase, under ios/<projectName>/StudyPlannerAppIntents/. Idempotent.
 */
function applyAppIntentsToXcodeProject(project, { projectName }) {
  const { target } = findMainAppTarget(project, projectName);
  const sources = findTargetPhase(project, target, "PBXSourcesBuildPhase");
  const resources = findTargetPhase(project, target, "PBXResourcesBuildPhase");
  if (!sources || !resources) {
    throw new Error("[with-studyplanner-app-intents] The application target is missing a Sources or Resources build phase.");
  }
  const group = ensureIntentsGroup(project, projectName);
  const added = [];
  for (const file of SWIFT_SOURCES) {
    const fileRef = ensureFileReference(project, group, `${projectName}/${INTENTS_GROUP}/${file}`, "sourcecode.swift");
    if (ensureBuildFile(project, sources, fileRef, file, "Sources")) added.push(file);
  }
  for (const file of RESOURCE_FILES) {
    const fileRef = ensureFileReference(project, group, `${projectName}/${INTENTS_GROUP}/${file}`, "text.json.xcstrings");
    if (ensureBuildFile(project, resources, fileRef, file, "Resources")) added.push(file);
  }
  if (ensureShortcutsVariantGroup(project, group, resources, `${projectName}/${INTENTS_GROUP}`)) added.push(SHORTCUTS_STRINGS);
  ensureKnownRegions(project);
  return added;
}

/**
 * Pure AppDelegate.swift patch (exported for tests). Routes a tapped Core
 * Spotlight result (`CSSearchableItemActionType`, identifier `class:<id>`)
 * to `studyplanner://class/<id>` before React Native's universal-link handler,
 * which ignores that activity type. Idempotent.
 */
function patchAppDelegateSource(source) {
  if (source.includes(APP_DELEGATE_MARKER)) return source;
  const continueSignature =
    /(continue userActivity: NSUserActivity,\s*restorationHandler: @escaping \(\[UIUserActivityRestoring\]\?\) -> Void\s*\) -> Bool \{\n)/;
  if (!continueSignature.test(source)) {
    throw new Error(
      "[with-studyplanner-app-intents] AppDelegate.swift has no application(_:continue:restorationHandler:) override to patch. " +
        "The Expo template changed; update patchAppDelegateSource."
    );
  }
  return source.replace(
    continueSignature,
    `$1    ${APP_DELEGATE_MARKER}\n` +
      "    if let spotlightURL = StudyPlannerSpotlightRouter.handle(userActivity) {\n" +
      "      return RCTLinkingManager.application(application, open: spotlightURL, options: [:])\n" +
      "    }\n\n"
  );
}

/** Pure Info.plist patch (exported for tests): Siri app-name synonyms for App Shortcut phrases. */
function applyAlternativeAppNames(infoPlist) {
  const existing = Array.isArray(infoPlist.INAlternativeAppNames) ? infoPlist.INAlternativeAppNames : [];
  const names = new Set(existing.map((entry) => entry && entry.INAlternativeAppName).filter(Boolean));
  const next = existing.slice();
  for (const name of ALTERNATIVE_APP_NAMES) {
    if (!names.has(name)) next.push({ INAlternativeAppName: name });
  }
  infoPlist.INAlternativeAppNames = next;
  return infoPlist;
}

function copyTemplates(projectRoot, iosRoot, projectName) {
  const source = path.join(projectRoot, TEMPLATE_DIR);
  const destination = path.join(iosRoot, projectName, INTENTS_GROUP);
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(destination, { recursive: true });
  for (const file of [...SWIFT_SOURCES, ...RESOURCE_FILES]) {
    const from = path.join(source, file);
    if (!fs.existsSync(from)) throw new Error(`[with-studyplanner-app-intents] Missing template ${from}.`);
    fs.copyFileSync(from, path.join(destination, file));
  }
  const catalog = readShortcutsCatalog(projectRoot);
  for (const language of shortcutLanguages(catalog)) {
    const lproj = path.join(destination, `${language}.lproj`);
    fs.mkdirSync(lproj, { recursive: true });
    fs.writeFileSync(path.join(lproj, SHORTCUTS_STRINGS), renderShortcutStrings(catalog, language));
  }
}

function withStudyPlannerAppIntents(config) {
  config = withInfoPlist(config, (modConfig) => {
    applyAlternativeAppNames(modConfig.modResults);
    return modConfig;
  });

  config = withAppDelegate(config, (modConfig) => {
    if (modConfig.modResults.language !== "swift") {
      throw new Error("[with-studyplanner-app-intents] Expected a Swift AppDelegate.");
    }
    modConfig.modResults.contents = patchAppDelegateSource(modConfig.modResults.contents);
    return modConfig;
  });

  config = withXcodeProject(config, (modConfig) => {
    applyAppIntentsToXcodeProject(modConfig.modResults, { projectName: modConfig.modRequest.projectName });
    return modConfig;
  });

  config = withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      copyTemplates(modConfig.modRequest.projectRoot, modConfig.modRequest.platformProjectRoot, modConfig.modRequest.projectName);
      return modConfig;
    },
  ]);

  return config;
}

module.exports = withStudyPlannerAppIntents;
module.exports.applyAppIntentsToXcodeProject = applyAppIntentsToXcodeProject;
module.exports.patchAppDelegateSource = patchAppDelegateSource;
module.exports.applyAlternativeAppNames = applyAlternativeAppNames;
module.exports.SWIFT_SOURCES = SWIFT_SOURCES;
module.exports.RESOURCE_FILES = RESOURCE_FILES;
module.exports.SHORTCUTS_STRINGS = SHORTCUTS_STRINGS;
module.exports.shortcutLanguages = shortcutLanguages;
module.exports.renderShortcutStrings = renderShortcutStrings;
module.exports.REGIONS = REGIONS;
module.exports.INTENTS_GROUP = INTENTS_GROUP;
module.exports.APP_DELEGATE_MARKER = APP_DELEGATE_MARKER;
