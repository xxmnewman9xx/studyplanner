const { AndroidConfig, withStringsXml } = require("expo/config-plugins");

const DEFAULT_ANDROID_STRINGS = [
  ["CFBundleDisplayName", "Study Planner AI"],
  ["NSCameraUsageDescription", "Use the camera to read syllabus photos with OCR and turn assignments, exams, and deadlines into reviewed planner items."],
  ["NSPhotoLibraryUsageDescription", "Use selected syllabus photos for OCR so assignments, exams, and deadlines can be reviewed before they are added."],
  ["NSUserNotificationsUsageDescription", "Send calm reminders before deadlines, exams, and classes."],
];

module.exports = function withAndroidLocalizedStringDefaults(config) {
  return withStringsXml(config, (modConfig) => {
    modConfig.modResults = AndroidConfig.Strings.setStringItem(
      DEFAULT_ANDROID_STRINGS.map(([name, value]) =>
        AndroidConfig.Resources.buildResourceItem({ name, value })
      ),
      modConfig.modResults
    );
    return modConfig;
  });
};
