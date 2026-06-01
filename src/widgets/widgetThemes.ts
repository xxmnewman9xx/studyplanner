import type { UserSettings, WidgetBackground, WidgetPalette, WidgetPreset } from "../models";
import type { ThemeAccent } from "../theme";

export type WidgetThemeChoice = "light" | "dark" | "ocean" | "graphite" | "forest" | "high_contrast";

export type WidgetThemeDefinition = {
  id: WidgetThemeChoice;
  background: WidgetBackground;
  palette: WidgetPalette;
  appTheme: ThemeAccent;
  labelKey: string;
  fallbackLabel: string;
};

export const widgetThemeOrder: WidgetThemeChoice[] = [
  "light",
  "dark",
  "ocean",
  "graphite",
  "forest",
  "high_contrast"
];

export const widgetThemeDefinitions: Record<WidgetThemeChoice, WidgetThemeDefinition> = {
  light: {
    id: "light",
    background: "light",
    palette: "paper",
    appTheme: "slate",
    labelKey: "theme.light",
    fallbackLabel: "Light"
  },
  dark: {
    id: "dark",
    background: "dark",
    palette: "midnight",
    appTheme: "campus",
    labelKey: "theme.dark",
    fallbackLabel: "Dark"
  },
  ocean: {
    id: "ocean",
    background: "glass",
    palette: "ocean",
    appTheme: "classic",
    labelKey: "theme.ocean",
    fallbackLabel: "Ocean"
  },
  graphite: {
    id: "graphite",
    background: "dark",
    palette: "graphite",
    appTheme: "graphite",
    labelKey: "theme.graphite",
    fallbackLabel: "Graphite"
  },
  forest: {
    id: "forest",
    background: "glass",
    palette: "forest",
    appTheme: "mint",
    labelKey: "theme.forest",
    fallbackLabel: "Forest"
  },
  high_contrast: {
    id: "high_contrast",
    background: "dark",
    palette: "contrast",
    appTheme: "graphite",
    labelKey: "theme.high_contrast",
    fallbackLabel: "High contrast"
  }
};

export const widgetPaletteAccents: Record<WidgetPalette | "custom", string> = {
  sunset: "#E06C2E",
  ocean: "#2F80ED",
  forest: "#35F2D0",
  lavender: "#56A8FF",
  midnight: "#56A8FF",
  candy: "#38BDF8",
  minimal: "#94A3B8",
  graphite: "#A3E635",
  aurora: "#35F2D0",
  paper: "#2F80ED",
  contrast: "#FACC15",
  custom: "#2F80ED"
};

export const widgetBackgroundColors: Record<WidgetBackground, string> = {
  light: "#F8FAFC",
  glass: "#101723",
  solid: "#0D1422",
  gradient: "#061827",
  dark: "#05070B"
};

export function resolveWidgetTheme(choice: WidgetThemeChoice): Pick<WidgetPreset, "background" | "palette"> {
  const theme = widgetThemeDefinitions[choice];
  return {
    background: theme.background,
    palette: theme.palette
  };
}

export function widgetThemeChoiceFromPreset(
  preset?: Pick<WidgetPreset, "background" | "palette">
): WidgetThemeChoice {
  if (!preset) return "ocean";
  const match = widgetThemeOrder.find((choice) => {
    const theme = widgetThemeDefinitions[choice];
    return theme.background === preset.background && theme.palette === preset.palette;
  });
  if (match) return match;
  if (preset.palette === "contrast") return "high_contrast";
  if (preset.background === "light") return "light";
  if (preset.palette === "graphite") return "graphite";
  if (preset.palette === "forest") return "forest";
  if (preset.background === "dark") return "dark";
  return "ocean";
}

export function widgetThemeChoiceFromSettings(settings?: Pick<UserSettings, "defaultWidgetStyle" | "selectedTheme">) {
  if (!settings) return "ocean";
  return widgetThemeChoiceFromPreset({
    background: settings.defaultWidgetStyle,
    palette: settings.selectedTheme === "custom" ? "ocean" : settings.selectedTheme
  });
}

export function widgetStyleColors(input: {
  background: WidgetBackground;
  palette: WidgetPalette | "custom";
  customPalette?: string[];
}) {
  const customAccent = input.palette === "custom" ? input.customPalette?.[0] : undefined;
  return {
    accentColor: customAccent || widgetPaletteAccents[input.palette],
    backgroundColor: widgetBackgroundColors[input.background]
  };
}
