const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

function readWidgetDefinitions(projectRoot) {
  const appJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "app.json"), "utf8"));
  const plugins = appJson.expo?.plugins ?? [];
  const widgetPlugin = plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === "expo-widgets");
  return widgetPlugin?.[1]?.widgets ?? [];
}

module.exports = function withWidgetKitKinds(config) {
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
        if (widget.configuration || widget.ios?.configuration) {
          throw new Error(
            `Widget ${widget.name} must remain static: configurable generation hard-codes the app-config name into Expo timeline storage.`
          );
        }

        const swiftPath = path.join(targetRoot, `${widget.name}.swift`);
        if (!fs.existsSync(swiftPath)) {
          throw new Error(`Expected generated WidgetKit source at ${swiftPath}.`);
        }

        const source = fs.readFileSync(swiftPath, "utf8");
        const generatedName = `let name: String = "${widget.name}"`;
        if (!source.includes(generatedName) || !source.includes("StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name))")) {
          throw new Error(`Expected static Expo WidgetKit source for ${widget.name}.`);
        }

        const nextSource = source.replace(generatedName, `let name: String = "${widget.kind}"`);
        if (source === nextSource) {
          throw new Error(`Could not update WidgetKit kind in ${swiftPath}.`);
        }
        if (!nextSource.includes(`let name: String = "${widget.kind}"`)) {
          throw new Error(`Generated WidgetKit kind did not match ${widget.kind} in ${swiftPath}.`);
        }
        fs.writeFileSync(swiftPath, nextSource);
      }

      return modConfig;
    },
  ]);
};
