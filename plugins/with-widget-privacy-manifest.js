const fs = require("fs");
const path = require("path");
const plist = require("@expo/plist").default;
const { IOSConfig, withXcodeProject } = require("expo/config-plugins");

const TARGET_NAME = "ExpoWidgetsTarget";
const PRIVACY_FILE = "PrivacyInfo.xcprivacy";

const privacyManifest = {
  NSPrivacyAccessedAPITypes: [
    {
      NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
      NSPrivacyAccessedAPITypeReasons: ["C617.1"],
    },
    {
      NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
      NSPrivacyAccessedAPITypeReasons: ["CA92.1", "1C8F.1"],
    },
    {
      NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime",
      NSPrivacyAccessedAPITypeReasons: ["35F9.1"],
    },
  ],
  NSPrivacyCollectedDataTypes: [],
  NSPrivacyTracking: false,
};

function nativeTargetUuid(project, targetName) {
  const targets = project.pbxNativeTargetSection();
  return Object.keys(targets).find((uuid) => !uuid.endsWith("_comment") && targets[uuid]?.name === targetName);
}

function targetGroup(project, targetName) {
  const groups = project.hash.project.objects.PBXGroup || {};
  return Object.values(groups).find((group) => group?.isa === "PBXGroup" && group.path === targetName);
}

function targetResourcesPhase(project, targetUuid) {
  const target = project.pbxNativeTargetSection()[targetUuid];
  const phases = project.hash.project.objects.PBXResourcesBuildPhase || {};
  const phaseRef = target?.buildPhases?.find((entry) => phases[entry.value]);
  return phaseRef ? phases[phaseRef.value] : null;
}

function ensureExistingFileIsAResource(project, targetUuid, fileRef) {
  const phase = targetResourcesPhase(project, targetUuid);
  if (!phase) throw new Error(`${TARGET_NAME} is missing a Resources build phase.`);
  const buildFiles = project.pbxBuildFileSection();
  if (phase.files.some((entry) => buildFiles[entry.value]?.fileRef === fileRef)) return;

  const buildFileUuid = project.generateUuid();
  const comment = `${PRIVACY_FILE} in Resources`;
  buildFiles[buildFileUuid] = {
    isa: "PBXBuildFile",
    fileRef,
    fileRef_comment: PRIVACY_FILE,
  };
  buildFiles[`${buildFileUuid}_comment`] = comment;
  phase.files.push({ value: buildFileUuid, comment });
}

function syncTargetVersions(project, targetUuid, marketingVersion, buildNumber, displayName) {
  const target = project.pbxNativeTargetSection()[targetUuid];
  const configList = project.pbxXCConfigurationList()[target?.buildConfigurationList];
  const configurations = project.pbxXCBuildConfigurationSection();
  if (!target || !configList) throw new Error(`Could not find build settings for target ${targetUuid}.`);

  for (const { value: configUuid } of configList.buildConfigurations || []) {
    const buildConfig = configurations[configUuid];
    if (!buildConfig) continue;
    buildConfig.buildSettings = {
      ...buildConfig.buildSettings,
      CURRENT_PROJECT_VERSION: Number.isInteger(Number(buildNumber)) ? Number(buildNumber) : buildNumber,
      MARKETING_VERSION: marketingVersion,
      ...(displayName ? { INFOPLIST_KEY_CFBundleDisplayName: JSON.stringify(displayName) } : {}),
    };
  }
}

module.exports = function withWidgetPrivacyManifest(config) {
  return withXcodeProject(config, (projectConfig) => {
    const project = projectConfig.modResults;
    const targetUuid = nativeTargetUuid(project, TARGET_NAME);
    if (!targetUuid) throw new Error(`Could not find generated ${TARGET_NAME} target.`);
    if (!targetResourcesPhase(project, targetUuid)) {
      project.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", targetUuid);
    }
    syncTargetVersions(project, project.getFirstTarget().uuid, projectConfig.version || "1.0.0", projectConfig.ios?.buildNumber || "1");
    syncTargetVersions(project, targetUuid, projectConfig.version || "1.0.0", projectConfig.ios?.buildNumber || "1", "StudyPlanner Widgets");

    const targetDirectory = path.join(projectConfig.modRequest.platformProjectRoot, TARGET_NAME);
    fs.mkdirSync(targetDirectory, { recursive: true });
    fs.writeFileSync(path.join(targetDirectory, PRIVACY_FILE), plist.build(privacyManifest));

    const group = targetGroup(project, TARGET_NAME);
    if (!group) throw new Error(`Could not find generated ${TARGET_NAME} PBX group.`);
    const existingFile = group.children?.find((child) => child.comment === PRIVACY_FILE);
    if (existingFile) {
      ensureExistingFileIsAResource(project, targetUuid, existingFile.value);
    } else {
      projectConfig.modResults = IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: PRIVACY_FILE,
        groupName: TARGET_NAME,
        project,
        isBuildFile: true,
        targetUuid,
      });
    }

    return projectConfig;
  });
};
