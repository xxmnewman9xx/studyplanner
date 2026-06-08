const fs = require("fs");
const path = require("path");
const xcode = require("xcode");
const { withDangerousMod } = require("expo/config-plugins");

const WATCH_APP_TARGET = "StudyPlannerWatchApp";
const WATCH_WIDGET_TARGET = "StudyPlannerWatchWidgets";
const WATCH_APP_BUNDLE_ID = "com.mattnewman.studyplanner.watchkitapp";
const WATCH_WIDGET_BUNDLE_ID = "com.mattnewman.studyplanner.watchkitapp.widgets";
const APP_GROUP_ID = "group.com.mattnewman.studyplanner";
const WATCH_REGIONS = ["en", "Base", "de", "es", "fr", "pt-BR", "hi", "ja", "ko", "zh-Hans", "ar"];

const WATCH_APP_SOURCES = [
  "StudyPlannerWatchApp.swift",
  "StudyPlannerWatchSnapshot.swift",
  "WatchSnapshotProvider.swift",
  "WatchDashboardView.swift",
  "WatchPulseRing.swift",
  "WatchInfoCard.swift"
];

function withStudyPlannerWatch(config) {
  return withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const iosRoot = modConfig.modRequest.platformProjectRoot;
      const projectName = modConfig.modRequest.projectName;
      const templatesRoot = path.join(projectRoot, "plugins", "studyplanner-watch", "ios");

      copyWatchTemplates(templatesRoot, iosRoot);
      patchAppDelegate(path.join(iosRoot, projectName, "AppDelegate.swift"));
      patchXcodeProject({
        config: modConfig,
        iosRoot,
        projectName
      });

      return modConfig;
    }
  ]);
}

function copyWatchTemplates(templatesRoot, iosRoot) {
  copyDirectory(path.join(templatesRoot, WATCH_APP_TARGET), path.join(iosRoot, WATCH_APP_TARGET));
  copyDirectory(path.join(templatesRoot, WATCH_WIDGET_TARGET), path.join(iosRoot, WATCH_WIDGET_TARGET));
  copyFile(
    path.join(templatesRoot, "StudyPlannerSyllabusAI", "StudyPlannerWatchSyncBridge.swift"),
    path.join(iosRoot, "StudyPlannerSyllabusAI", "StudyPlannerWatchSyncBridge.swift")
  );
}

function copyDirectory(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(source, destination, { recursive: true });
}

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function patchAppDelegate(appDelegatePath) {
  if (!fs.existsSync(appDelegatePath)) {
    throw new Error(`Expected AppDelegate.swift at ${appDelegatePath}.`);
  }

  let source = fs.readFileSync(appDelegatePath, "utf8");

  if (!source.includes("private let watchSyncBridge = StudyPlannerWatchSyncBridge()")) {
    source = source.replace(
      /(var reactNativeFactory: RCTReactNativeFactory\?\n)/,
      "$1  private let watchSyncBridge = StudyPlannerWatchSyncBridge()\n"
    );
  }

  if (!source.includes("watchSyncBridge.activate()")) {
    source = source.replace(
      /\n\s*return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)/,
      "\n\n    watchSyncBridge.activate()\n\n    return super.application(application, didFinishLaunchingWithOptions: launchOptions)"
    );
  }

  fs.writeFileSync(appDelegatePath, source);
}

function patchXcodeProject({ config, iosRoot, projectName }) {
  const projectPath = path.join(iosRoot, `${projectName}.xcodeproj`, "project.pbxproj");
  const project = xcode.project(projectPath);
  project.parseSync();

  const mainTargetUuid = project.findTargetKey(projectName) || project.getFirstTarget().uuid;
  const watchAppTargetUuid = ensureTarget(project, WATCH_APP_TARGET, "watch2_app", WATCH_APP_BUNDLE_ID);
  const watchWidgetTargetUuid = ensureTarget(project, WATCH_WIDGET_TARGET, "watch2_extension", WATCH_WIDGET_BUNDLE_ID);

  ensureKnownRegions(project);
  ensureGroup(project, WATCH_APP_TARGET, WATCH_APP_TARGET);
  ensureGroup(project, WATCH_WIDGET_TARGET, WATCH_WIDGET_TARGET);

  ensureBuildPhase(project, watchAppTargetUuid, "PBXSourcesBuildPhase", "Sources");
  ensureBuildPhase(project, watchAppTargetUuid, "PBXResourcesBuildPhase", "Resources");
  ensureBuildPhase(project, watchAppTargetUuid, "PBXFrameworksBuildPhase", "Frameworks");
  ensureBuildPhase(project, watchWidgetTargetUuid, "PBXSourcesBuildPhase", "Sources");
  ensureBuildPhase(project, watchWidgetTargetUuid, "PBXResourcesBuildPhase", "Resources");
  ensureBuildPhase(project, watchWidgetTargetUuid, "PBXFrameworksBuildPhase", "Frameworks");

  ensureMainBridge(project, projectName, mainTargetUuid);
  ensureWatchAppFiles(project, watchAppTargetUuid);
  ensureWatchWidgetFiles(project, watchWidgetTargetUuid);
  ensureWatchBuildSettings(project, watchAppTargetUuid, WATCH_APP_TARGET, watchAppSettings(config));
  ensureWatchBuildSettings(project, watchWidgetTargetUuid, WATCH_WIDGET_TARGET, watchWidgetSettings(config));

  fs.writeFileSync(projectPath, project.writeSync());
}

function ensureTarget(project, targetName, targetType, bundleId) {
  const existing = project.findTargetKey(targetName);
  if (existing) return existing;
  return project.addTarget(targetName, targetType, targetName, bundleId).uuid;
}

function ensureKnownRegions(project) {
  const rootProject = project.pbxProjectSection()[project.getFirstProject().uuid];
  const knownRegions = new Set((rootProject.knownRegions || []).map(unquote));
  for (const region of WATCH_REGIONS) knownRegions.add(region);
  rootProject.knownRegions = Array.from(knownRegions).map((region) =>
    region.includes("-") ? `"${region}"` : region
  );
}

function ensureGroup(project, groupName, groupPath) {
  const existing = project.pbxGroupByName(groupName);
  if (existing) return existing;

  const group = project.addPbxGroup([], groupName, groupPath, '"<group>"');
  const mainGroupUuid = project.getFirstProject().firstProject.mainGroup;
  const mainGroup = project.hash.project.objects.PBXGroup[mainGroupUuid];
  if (!mainGroup.children.some((child) => child.value === group.uuid)) {
    mainGroup.children.push({ value: group.uuid, comment: groupName });
  }
  return group.pbxGroup;
}

function ensureMainBridge(project, projectName, targetUuid) {
  const groupUuid = project.pbxGroupByName(projectName)
    ? findGroupUuid(project, projectName)
    : project.getFirstProject().firstProject.mainGroup;
  const bridge = ensureFileReference(project, groupUuid, `${projectName}/StudyPlannerWatchSyncBridge.swift`);
  ensureBuildFile(project, {
    fileRef: bridge.fileRef,
    displayName: "StudyPlannerWatchSyncBridge.swift",
    targetUuid,
    phaseIsa: "PBXSourcesBuildPhase",
    phaseComment: "Sources"
  });
}

function ensureWatchAppFiles(project, targetUuid) {
  const groupUuid = findGroupUuid(project, WATCH_APP_TARGET);
  for (const file of ["Info.plist", "StudyPlannerWatchApp.entitlements"]) {
    ensureFileReference(project, groupUuid, file);
  }
  for (const file of WATCH_APP_SOURCES) {
    const reference = ensureFileReference(project, groupUuid, file);
    ensureBuildFile(project, {
      fileRef: reference.fileRef,
      displayName: file,
      targetUuid,
      phaseIsa: "PBXSourcesBuildPhase",
      phaseComment: "Sources"
    });
  }
  const assets = ensureFileReference(project, groupUuid, "Assets.xcassets", {
    lastKnownFileType: "folder.assetcatalog"
  });
  ensureBuildFile(project, {
    fileRef: assets.fileRef,
    displayName: "Assets.xcassets",
    targetUuid,
    phaseIsa: "PBXResourcesBuildPhase",
    phaseComment: "Resources"
  });
  ensureLocalizedResources(project, groupUuid, targetUuid);
}

function ensureWatchWidgetFiles(project, targetUuid) {
  const widgetGroupUuid = findGroupUuid(project, WATCH_WIDGET_TARGET);
  const appGroupUuid = findGroupUuid(project, WATCH_APP_TARGET);

  for (const file of ["Info.plist", "StudyPlannerWatchWidgets.entitlements"]) {
    ensureFileReference(project, widgetGroupUuid, file);
  }
  for (const file of ["StudyPlannerWatchWidgets.swift"]) {
    const reference = ensureFileReference(project, widgetGroupUuid, file);
    ensureBuildFile(project, {
      fileRef: reference.fileRef,
      displayName: file,
      targetUuid,
      phaseIsa: "PBXSourcesBuildPhase",
      phaseComment: "Sources"
    });
  }

  const sharedSnapshot = ensureFileReference(project, appGroupUuid, "StudyPlannerWatchSnapshot.swift");
  ensureBuildFile(project, {
    fileRef: sharedSnapshot.fileRef,
    displayName: "StudyPlannerWatchSnapshot.swift",
    targetUuid,
    phaseIsa: "PBXSourcesBuildPhase",
    phaseComment: "Sources"
  });
  ensureLocalizedResources(project, appGroupUuid, targetUuid);
}

function ensureLocalizedResources(project, groupUuid, targetUuid) {
  for (const region of WATCH_REGIONS.filter((item) => item !== "Base")) {
    const file = `${region}.lproj/Localizable.strings`;
    const reference = ensureFileReference(project, groupUuid, file, {
      lastKnownFileType: "text.plist.strings"
    });
    ensureBuildFile(project, {
      fileRef: reference.fileRef,
      displayName: "Localizable.strings",
      targetUuid,
      phaseIsa: "PBXResourcesBuildPhase",
      phaseComment: "Resources"
    });
  }
}

function ensureFileReference(project, groupUuid, filePath, options = {}) {
  const group = project.hash.project.objects.PBXGroup[groupUuid];
  const existingChild = group.children.find((child) => {
    const ref = project.pbxFileReferenceSection()[child.value];
    return ref && unquote(ref.path) === filePath;
  });
  if (existingChild) {
    return { fileRef: existingChild.value };
  }

  const added = project.addFile(filePath, groupUuid, options);
  if (!added) {
    const existing = findFileReference(project, filePath);
    if (existing) return { fileRef: existing };
    throw new Error(`Could not add ${filePath} to ${group.name || group.path}.`);
  }
  return { fileRef: added.fileRef };
}

function ensureBuildFile(project, { fileRef, displayName, targetUuid, phaseIsa, phaseComment }) {
  const phase = getTargetBuildPhase(project, targetUuid, phaseIsa);
  if (!phase) {
    throw new Error(`Target ${targetUuid} is missing ${phaseIsa}.`);
  }
  if (phase.files.some((entry) => project.pbxBuildFileSection()[entry.value]?.fileRef === fileRef)) {
    return;
  }

  const buildFileUuid = project.generateUuid();
  const comment = `${displayName} in ${phaseComment}`;
  project.pbxBuildFileSection()[buildFileUuid] = {
    isa: "PBXBuildFile",
    fileRef,
    fileRef_comment: displayName
  };
  project.pbxBuildFileSection()[`${buildFileUuid}_comment`] = comment;
  phase.files.push({ value: buildFileUuid, comment });
}

function ensureBuildPhase(project, targetUuid, phaseIsa, comment) {
  if (getTargetBuildPhase(project, targetUuid, phaseIsa)) return;
  project.addBuildPhase([], phaseIsa, comment, targetUuid);
}

function getTargetBuildPhase(project, targetUuid, phaseIsa) {
  const target = project.pbxNativeTargetSection()[targetUuid];
  const section = project.hash.project.objects[phaseIsa] || {};
  for (const phaseRef of target.buildPhases || []) {
    const phase = section[phaseRef.value];
    if (phase?.isa === phaseIsa) return phase;
  }
  return null;
}

function ensureWatchBuildSettings(project, targetUuid, targetName, settings) {
  const target = project.pbxNativeTargetSection()[targetUuid];
  if (!target) throw new Error(`Missing target ${targetName}.`);
  const configs = project.pbxXCBuildConfigurationSection();
  const configList = project.pbxXCConfigurationList()[target.buildConfigurationList];

  for (const { value: configUuid } of configList.buildConfigurations) {
    const buildConfig = configs[configUuid];
    buildConfig.buildSettings = {
      ...buildConfig.buildSettings,
      ...settings.common
    };
    if (buildConfig.name === "Debug") {
      buildConfig.buildSettings = {
        ...buildConfig.buildSettings,
        ...settings.debug
      };
    }
  }
}

function watchAppSettings(config) {
  return {
    common: {
      ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon",
      CLANG_ENABLE_MODULES: "YES",
      CODE_SIGN_ENTITLEMENTS: `${WATCH_APP_TARGET}/${WATCH_APP_TARGET}.entitlements`,
      CURRENT_PROJECT_VERSION: config.ios?.buildNumber || "1",
      GENERATE_INFOPLIST_FILE: "NO",
      INFOPLIST_FILE: `${WATCH_APP_TARGET}/Info.plist`,
      LD_RUNPATH_SEARCH_PATHS: ['"$(inherited)"', '"@executable_path/Frameworks"'],
      MARKETING_VERSION: config.version || "1.0.0",
      PRODUCT_BUNDLE_IDENTIFIER: WATCH_APP_BUNDLE_ID,
      PRODUCT_MODULE_NAME: WATCH_APP_TARGET,
      PRODUCT_NAME: WATCH_APP_TARGET,
      SDKROOT: "watchos",
      SKIP_INSTALL: "YES",
      SUPPORTED_PLATFORMS: '"watchos watchsimulator"',
      SWIFT_VERSION: "5.0",
      TARGETED_DEVICE_FAMILY: "4",
      WATCHOS_DEPLOYMENT_TARGET: "10.0"
    },
    debug: {
      SWIFT_OPTIMIZATION_LEVEL: '"-Onone"'
    }
  };
}

function watchWidgetSettings(config) {
  return {
    common: {
      APPLICATION_EXTENSION_API_ONLY: "YES",
      CLANG_ENABLE_MODULES: "YES",
      CODE_SIGN_ENTITLEMENTS: `${WATCH_WIDGET_TARGET}/${WATCH_WIDGET_TARGET}.entitlements`,
      CURRENT_PROJECT_VERSION: config.ios?.buildNumber || "1",
      GENERATE_INFOPLIST_FILE: "NO",
      INFOPLIST_FILE: `${WATCH_WIDGET_TARGET}/Info.plist`,
      LD_RUNPATH_SEARCH_PATHS: ['"$(inherited)"', '"@executable_path/Frameworks"', '"@executable_path/../../Frameworks"'],
      MARKETING_VERSION: config.version || "1.0.0",
      PRODUCT_BUNDLE_IDENTIFIER: WATCH_WIDGET_BUNDLE_ID,
      PRODUCT_MODULE_NAME: WATCH_WIDGET_TARGET,
      PRODUCT_NAME: '"$(TARGET_NAME)"',
      SDKROOT: "watchos",
      SKIP_INSTALL: "YES",
      SUPPORTED_PLATFORMS: '"watchos watchsimulator"',
      SWIFT_VERSION: "5.0",
      TARGETED_DEVICE_FAMILY: "4",
      WATCHOS_DEPLOYMENT_TARGET: "10.0"
    },
    debug: {
      SWIFT_OPTIMIZATION_LEVEL: '"-Onone"'
    }
  };
}

function findGroupUuid(project, groupName) {
  const groups = project.hash.project.objects.PBXGroup;
  for (const [key, value] of Object.entries(groups)) {
    if (key.endsWith("_comment") || !value) continue;
    if (groups[`${key}_comment`] === groupName) return key;
  }
  throw new Error(`Missing PBX group ${groupName}.`);
}

function findFileReference(project, filePath) {
  const refs = project.pbxFileReferenceSection();
  for (const [key, value] of Object.entries(refs)) {
    if (key.endsWith("_comment") || !value) continue;
    if (unquote(value.path) === filePath) return key;
  }
  return null;
}

function unquote(value) {
  return String(value || "").replace(/^"(.*)"$/, "$1");
}

module.exports = withStudyPlannerWatch;
