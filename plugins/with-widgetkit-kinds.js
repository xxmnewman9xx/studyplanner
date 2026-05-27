const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

function readWidgetDefinitions(projectRoot) {
  const appJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "app.json"), "utf8"));
  const plugins = appJson.expo?.plugins ?? [];
  const widgetPlugin = plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === "expo-widgets");
  return widgetPlugin?.[1]?.widgets ?? [];
}

function withWidgetKitKinds(config) {
  return withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const iosRoot = modConfig.modRequest.platformProjectRoot;
      const targetRoot = path.join(iosRoot, "ExpoWidgetsTarget");
      const widgets = readWidgetDefinitions(projectRoot);

      for (const widget of widgets) {
        if (!widget.name || !widget.kind) {
          throw new Error(`Widget ${widget.name ?? "(missing name)"} must define a native WidgetKit kind.`);
        }

        const swiftPath = path.join(targetRoot, `${widget.name}.swift`);
        if (!fs.existsSync(swiftPath)) {
          throw new Error(`Expected generated WidgetKit source at ${swiftPath}.`);
        }

        const source = fs.readFileSync(swiftPath, "utf8");
        if (source.includes(`let name: String = "${widget.kind}"`)) {
          continue;
        }

        const nextSource = source.replace(
          /let name: String = "[^"]+"/,
          `let name: String = "${widget.kind}"`
        );

        if (source === nextSource) {
          throw new Error(`Could not update WidgetKit kind in ${swiftPath}.`);
        }

        fs.writeFileSync(swiftPath, nextSource);
      }

      return modConfig;
    },
  ]);
}

module.exports = withWidgetKitKinds;
