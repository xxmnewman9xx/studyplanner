import { readFileSync } from "node:fs";

const appConfig = JSON.parse(readFileSync("app.json", "utf8")).expo;
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const appSource = readFileSync("App.tsx", "utf8");
const widgetEngineSource = readFileSync("src/widgetEngine.ts", "utf8");
const widgetSource = readFileSync("src/widgets/StudyPlannerWidgets.tsx", "utf8");
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function luminance(color) {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) return null;
  const values = [0, 2, 4].map((offset) => Number.parseInt(match[1].slice(offset, offset + 2), 16) / 255).map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

function contrastRatio(first, second) {
  const values = [luminance(first), luminance(second)];
  if (values.some((value) => value == null)) return 1;
  const lighter = Math.max(...values);
  const darker = Math.min(...values);
  return (lighter + 0.05) / (darker + 0.05);
}

function readableForeground(fill) {
  return contrastRatio(fill, "#050507") >= contrastRatio(fill, "#FFFFFF") ? "#050507" : "#FFFFFF";
}

function safeColorOn(color, surface) {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  const surfaceLuminance = luminance(surface);
  if (!match || surfaceLuminance == null) return readableForeground(surface);
  const channels = [0, 2, 4].map((offset) => Number.parseInt(match[1].slice(offset, offset + 2), 16));
  const target = surfaceLuminance < 0.179 ? 255 : 0;
  let candidate = color;
  let attempts = 0;
  while (contrastRatio(candidate, surface) < 4.5 && attempts < 32) {
    channels.forEach((value, index) => { channels[index] = Math.round(value + (target - value) * 0.12); });
    candidate = `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
    attempts += 1;
  }
  return candidate;
}

expect(appConfig.userInterfaceStyle === "automatic", "app config must allow automatic native appearance");
expect(appConfig.ios?.buildNumber === "87", "the widget-led conversion system must ship in Build 87");
expect(JSON.stringify(appConfig.plugins).includes("expo-system-ui"), "expo-system-ui config plugin must be enabled");
expect(JSON.stringify(appConfig.plugins).includes("expo-splash-screen"), "expo-splash-screen config plugin must be enabled");
expect(JSON.stringify(appConfig.plugins).includes("splash-icon-dark.png"), "splash config must include a dark launch image");
expect(packageJson.dependencies["expo-system-ui"] === "~56.0.5", "expo-system-ui must match Expo SDK 56");
expect(packageJson.dependencies["expo-splash-screen"] === "~56.0.12", "expo-splash-screen must match Expo SDK 56");
expect(packageJson.dependencies["react-native-safe-area-context"] === "~5.7.0", "safe-area-context must match Expo SDK 56");

expect(appSource.includes('type AppearanceMode = "system" | "light" | "dark"') || readFileSync("src/types.ts", "utf8").includes('export type AppearanceMode = "system" | "light" | "dark"'), "appearance preference must support System, Light, and Dark");
expect(appSource.includes("Appearance.setColorScheme"), "manual app appearance must update native sheets and controls");
expect(appSource.includes('direction: theme.rtl ? "rtl" : "ltr"'), "root layout must explicitly support RTL capture mode");
expect(appSource.includes("function BackChevron") && appSource.includes("scaleX: -1"), "back chevrons must mirror in RTL");
expect(appSource.includes("foregroundForColor(klass.color)"), "course glyph foreground must be chosen from its actual fill");
expect(appSource.includes("theme.accentText"), "accent-filled controls must use a computed foreground");
expect(appSource.includes('backgroundColor: theme.dark ? "#2A1F10" : "#FFF4E5"'), "save-error alert must have a dark surface");
expect(appSource.includes("paddingTop: Math.max(58, insets.top)") && appSource.includes("dynamicTypePadding + insets.bottom"), "shared screens must consume actual top and bottom safe-area insets");
expect(appSource.includes("bottom: insets.bottom + 8") && appSource.includes("tabBarHeightForFontScale(fontScale) + insets.bottom + 20"), "tab and pending-import chrome must clear the home indicator");
expect(appSource.includes("paddingTop: embedded ? 0 : Math.max(54, insets.top)"), "fixed detail headers must clear the status area");
expect(appSource.includes("const pillBackground =") && appSource.includes("compositeHexColor(c, theme.surface, 0.11)") && appSource.includes("contrastSafeForegroundOn(c, pillBackground)"), "pill text must be evaluated against its actual opaque composited background");
expect(!appSource.includes('backgroundColor: draft.classId === klass.id ? klass.color : theme.surface2'), "selected class controls must not use raw low-contrast course fills");
expect(appSource.includes("const completedColor = contrastSafeForegroundOn(COLORS.green, theme.surface)"), "completed task controls must use a graphical-safe selected fill");
expect(appSource.includes("maxFontSizeMultiplier={1.5}") && appSource.includes("allowFontScaling={false}"), "fixed visualization and avatar typography must be bounded explicitly");

const textInputCount = (appSource.match(/<TextInput\b/g) || []).length;
const keyboardAppearanceCount = (appSource.match(/keyboardAppearance=/g) || []).length;
expect(textInputCount > 0 && textInputCount === keyboardAppearanceCount, "every text input must declare a matching keyboard appearance");
expect(appSource.includes("function WidgetPreviewText") && appSource.includes("allowFontScaling={false}") && appSource.includes("const accessibilityLayout = fontScale >= 1.6"), "fixed preview typography must be bounded while the live app reflows for large Dynamic Type");

const glassTags = [...appSource.matchAll(/<LiquidGlassSurface\b[\s\S]*?>/g)].map((match) => match[0]);
expect(glassTags.length > 0 && glassTags.every((tag) => tag.includes("colorScheme=")), "every Liquid Glass surface must declare its color scheme");

expect(widgetSource.includes("widgetRenderingMode") && widgetSource.includes("isSystemTint"), "native widgets must branch on accented and vibrant rendering modes");
expect(widgetSource.includes('type: "hierarchical", style: "primary"') && widgetSource.includes('style: "secondary"'), "native widget text must use hierarchical system styles");
expect(widgetSource.includes('font({ textStyle: "caption2"') && widgetSource.includes('font({ textStyle: "headline"'), "supporting widget copy must use semantic Dynamic Type fonts");
expect(!widgetSource.includes("minimumScaleFactor("), "native widgets must not apply global shrink factors to critical copy");
expect(widgetEngineSource.includes('const classMetric = `${Math.round(classProgress * 100)}%`'), "class progress must serialize a truthful dominant completion percentage");
expect(widgetSource.includes('view("AccessoryWidgetBackgroundView"'), "accessory widgets must use the adaptive system background");
expect(widgetSource.includes('props.kind === "week"') && widgetSource.includes("workloadCells") && widgetSource.includes("dayIndex < 7"), "week widget must render one seven-day workload strip");
expect(widgetEngineSource.includes("localizedWeekdayLabels") && widgetEngineSource.includes('t("widget.weekday.mon"'), "weekday labels must be localized before widget serialization");
expect(widgetEngineSource.includes("calendarDays.slice(0, 7).map((day) => day.count)"), "rolling week loads must serialize real assignment counts");
expect(widgetSource.includes("safeColorOn(accent, bg, 3)") && widgetSource.includes("safeColorOn(firstItem.courseColor || accentFill, bg, 3)"), "meaningful widget graphics must use actual-background 3:1 contrast adjustment");
expect(!widgetSource.includes('isLuminanceReduced ? (isDark ? "#B6BBC5"'), "reduced-luminance widgets must not substitute a brighter raw fill");

const semanticColors = ["#007AFF", "#AF52DE", "#34C759", "#FF9500", "#FF3B30", "#FF2D55", "#5AC8FA", "#FFD60A"];
const surfaces = ["#FFFFFF", "#EFEFF4", "#1A1A1E", "#2C2C2E", "#3A3A3C"];
for (const color of semanticColors) {
  expect(contrastRatio(color, readableForeground(color)) >= 4.5, `${color} must support a readable fill foreground`);
  for (const surface of surfaces) {
    expect(contrastRatio(safeColorOn(color, surface), surface) >= 4.5, `${color} must be adjustable to 4.5:1 on ${surface}`);
  }
}

if (failures.length) {
  console.error("Dark-mode readiness checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Dark-mode readiness checks passed (${textInputCount} text inputs, ${glassTags.length} glass surfaces).`);
