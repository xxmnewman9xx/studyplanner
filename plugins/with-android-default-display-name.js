const { AndroidConfig, withStringsXml } = require("expo/config-plugins");

const { Resources, Strings } = AndroidConfig;

module.exports = function withAndroidDefaultDisplayName(config) {
  return withStringsXml(config, (modConfig) => {
    const displayName = modConfig.name || "StudyPlanner Ai";

    modConfig.modResults = Strings.setStringItem(
      [
        Resources.buildResourceItem({
          name: "CFBundleDisplayName",
          value: displayName,
        }),
      ],
      modConfig.modResults
    );

    return modConfig;
  });
};
