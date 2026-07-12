import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const app = JSON.parse(readFileSync(join(root, "app.json"), "utf8")).expo;
const widgetRuntime = readFileSync(join(root, "src/widgets/StudyPlannerWidgets.tsx"), "utf8");
const expoStorage = readFileSync(join(root, "node_modules/expo-widgets/ios/WidgetObject.swift"), "utf8");
const expoProvider = readFileSync(join(root, "node_modules/expo-widgets/ios/Widgets/TimelineProvider.swift"), "utf8");
const pluginEntry = app.plugins.find((entry) => Array.isArray(entry) && entry[0] === "expo-widgets");
const widgets = pluginEntry?.[1]?.widgets ?? [];
const registrations = new Map();
const registrationPattern = /export const (\w+) = createWidget(?:<[^>]+>)?\(\s*"([^"]+)"/g;

for (const match of widgetRuntime.matchAll(registrationPattern)) {
  registrations.set(match[1], match[2]);
}

if (widgets.length !== 4) {
  throw new Error(`Expected four generated WidgetKit definitions, found ${widgets.length}.`);
}
if (!expoStorage.includes('"__expo_widgets_\\(name)_timeline"')) {
  throw new Error("Expo widget writes must derive the timeline key from the createWidget name.");
}
if (!expoProvider.includes("parseTimeline(identifier: groupIdentifier, name: name")) {
  throw new Error("Expo static provider must read the timeline using its generated widget name.");
}

for (const widget of widgets) {
  if (widget.configuration || widget.ios?.configuration) {
    throw new Error(`${widget.name} must use StaticConfiguration; single-choice configuration is not a customization.`);
  }

  const createWidgetName = registrations.get(widget.name);
  if (!createWidgetName) {
    throw new Error(`Missing createWidget registration for ${widget.name}.`);
  }
  if (createWidgetName !== widget.kind) {
    throw new Error(`${widget.name} createWidget name ${createWidgetName} does not match canonical kind ${widget.kind}.`);
  }

  const swiftPath = join(root, "ios", "ExpoWidgetsTarget", `${widget.name}.swift`);
  if (!existsSync(swiftPath)) {
    throw new Error(`Missing generated native widget source ${swiftPath}; run Expo prebuild before this gate.`);
  }
  const swift = readFileSync(swiftPath, "utf8");
  const nativeName = swift.match(/let name: String = "([^"]+)"/)?.[1];
  if (nativeName !== createWidgetName) {
    throw new Error(`${widget.name} native key ${nativeName ?? "(missing)"} does not match createWidget key ${createWidgetName}.`);
  }
  if (!swift.includes("StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name))")) {
    throw new Error(`${widget.name} must route its static WidgetKit kind and timeline reads through the same name.`);
  }
  if (swift.includes("AppIntentConfiguration") || swift.includes(`__expo_widgets_${widget.name}_timeline`)) {
    throw new Error(`${widget.name} contains a configurable/class-name timeline path.`);
  }
}

console.log("Generated WidgetKit keys match createWidget names.");
