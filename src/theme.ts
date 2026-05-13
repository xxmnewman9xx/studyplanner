export const lightColors = {
  canvas: "#F5F7FB",
  canvasTint: "#EAF1F8",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF3F8",
  surfaceTint: "#F8FBF4",
  ink: "#151A23",
  muted: "#596273",
  faint: "#667085",
  line: "#DDE4EE",
  lineStrong: "#C5D0DE",
  softGold: "#FFF2CB",
  gold: "#D49A21",
  mint: "#E4F8EF",
  sage: "#2F8F64",
  coral: "#E45C45",
  blue: "#245CFF",
  red: "#CF3D31",
  green: "#1F9A6B",
  lavender: "#EEE8FF",
  accent: "#6C5CE7",
  accentSoft: "#EDEBFF",
  brandPurple: "#6C5CE7",
  brandBlue: "#3B82F6",
  brandCoral: "#F25F6B",
  accentSecondary: "#3B82F6",
  accentTertiary: "#F25F6B",
  purpleSoft: "#F0EEFF",
  blueSoft: "#EAF1FF",
  redSoft: "#FFECEF",
  graphTrack: "#E9EEF6",
  calendarToday: "#6C5CE7",
  calendarHeavy: "#F25F6B",
  glass: "rgba(255,255,255,0.82)",
  glassStrong: "rgba(255,255,255,0.96)",
  warningSurface: "#FFF4DF",
  widgetDark: "#221A3A",
  widgetAccent: "#B7A7FF",
  lockWidget: "#4B2B74",
  elevated: "#FFFFFF",
  heroSurface: "#17152D",
  heroText: "#F8FAFC",
  heroMuted: "#BCC7D8",
  shadow: "#102033"
};

export const darkColors = {
  canvas: "#080B12",
  canvasTint: "#101827",
  surface: "#111722",
  surfaceAlt: "#182131",
  surfaceTint: "#15261E",
  ink: "#F5F7FB",
  muted: "#C1CAD8",
  faint: "#7F8A9C",
  line: "#263244",
  lineStrong: "#3B485B",
  softGold: "#332A12",
  gold: "#F4C95D",
  mint: "#123425",
  sage: "#61D394",
  coral: "#FF7A63",
  blue: "#8DB3FF",
  red: "#FF786B",
  green: "#61D394",
  lavender: "#2B2544",
  accent: "#A99BFF",
  accentSoft: "#252047",
  brandPurple: "#A99BFF",
  brandBlue: "#8DB3FF",
  brandCoral: "#FF7A86",
  accentSecondary: "#8DB3FF",
  accentTertiary: "#FF7A86",
  purpleSoft: "#252047",
  blueSoft: "#162033",
  redSoft: "#3A201D",
  graphTrack: "#1B2638",
  calendarToday: "#A99BFF",
  calendarHeavy: "#FF7A86",
  glass: "rgba(17,23,34,0.78)",
  glassStrong: "rgba(21,29,42,0.96)",
  warningSurface: "#32271B",
  widgetDark: "#18112B",
  widgetAccent: "#C8BEFF",
  lockWidget: "#33204D",
  elevated: "#151D2A",
  heroSurface: "#EAF6FF",
  heroText: "#07111D",
  heroMuted: "#3C5067",
  shadow: "#000000"
};

export const colors = lightColors;

export const classColorPalette = [
  "#2563EB",
  "#047857",
  "#C2410C",
  "#BE123C",
  "#7C3AED",
  "#0E7490",
  "#8A5A12",
  "#475569",
  "#BE123C",
  "#0F766E"
];

export function courseColorAt(index: number) {
  return classColorPalette[Math.abs(index) % classColorPalette.length] || colors.accent;
}

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 44
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  round: 999
};

export type ColorTokens = typeof lightColors;
export type ThemeMode = "light" | "dark";

export type ThemePaletteId =
  | "oceanBlue"
  | "violetGlow"
  | "emeraldFocus"
  | "sunsetStudy"
  | "graphitePro"
  | "roseQuartz"
  | "cyberTeal"
  | "goldSemester"
  | "cleanStudy";

export type ThemePalette = {
  id: ThemePaletteId;
  name: string;
  shortName: string;
  accent: string;
  secondary: string;
  tertiary: string;
  soft: string;
  softBlue: string;
  softRed: string;
  canvas: string;
  canvasTint: string;
  surfaceTint: string;
  heroSurface: string;
  widgetDark: string;
  widgetAccent: string;
  lockWidget: string;
  darkAccent: string;
  darkSecondary: string;
  darkTertiary: string;
  darkSoft: string;
  darkCanvas: string;
  darkCanvasTint: string;
  darkSurfaceTint: string;
  darkHeroSurface: string;
};

export const themePalettes: ThemePalette[] = [
  {
    id: "oceanBlue",
    name: "Ocean Blue",
    shortName: "Ocean",
    accent: "#2563EB",
    secondary: "#0E7490",
    tertiary: "#C2410C",
    soft: "#EAF3FF",
    softBlue: "#E4F8FF",
    softRed: "#FFF0E8",
    canvas: "#F4F8FC",
    canvasTint: "#DDEEFF",
    surfaceTint: "#F1FAFF",
    heroSurface: "#102B5F",
    widgetDark: "#111B35",
    widgetAccent: "#9ED7FF",
    lockWidget: "#12346A",
    darkAccent: "#8AB8FF",
    darkSecondary: "#67E8F9",
    darkTertiary: "#FDBA74",
    darkSoft: "#17233D",
    darkCanvas: "#07111F",
    darkCanvasTint: "#0D1C33",
    darkSurfaceTint: "#0C2230",
    darkHeroSurface: "#DFF3FF"
  },
  {
    id: "violetGlow",
    name: "Violet Glow",
    shortName: "Violet",
    accent: "#6C5CE7",
    secondary: "#2563EB",
    tertiary: "#BE123C",
    soft: "#F0EEFF",
    softBlue: "#EAF1FF",
    softRed: "#FFECEF",
    canvas: "#F5F7FB",
    canvasTint: "#EAF1F8",
    surfaceTint: "#F8FBF4",
    heroSurface: "#17152D",
    widgetDark: "#221A3A",
    widgetAccent: "#B7A7FF",
    lockWidget: "#4B2B74",
    darkAccent: "#A99BFF",
    darkSecondary: "#8DB3FF",
    darkTertiary: "#FF7A86",
    darkSoft: "#252047",
    darkCanvas: "#080B12",
    darkCanvasTint: "#101827",
    darkSurfaceTint: "#15261E",
    darkHeroSurface: "#EAF6FF"
  },
  {
    id: "emeraldFocus",
    name: "Emerald Focus",
    shortName: "Emerald",
    accent: "#047857",
    secondary: "#0F766E",
    tertiary: "#7C3AED",
    soft: "#E5F8EF",
    softBlue: "#E3FAF8",
    softRed: "#F2ECFF",
    canvas: "#F4FAF6",
    canvasTint: "#E0F5EA",
    surfaceTint: "#F2FFF8",
    heroSurface: "#0D392D",
    widgetDark: "#102D2A",
    widgetAccent: "#8FE6C1",
    lockWidget: "#15523D",
    darkAccent: "#6EE7B7",
    darkSecondary: "#5EEAD4",
    darkTertiary: "#C4B5FD",
    darkSoft: "#153126",
    darkCanvas: "#07140F",
    darkCanvasTint: "#0E2118",
    darkSurfaceTint: "#10251D",
    darkHeroSurface: "#E3FFF3"
  },
  {
    id: "sunsetStudy",
    name: "Sunset Study",
    shortName: "Sunset",
    accent: "#C2410C",
    secondary: "#B91C1C",
    tertiary: "#6D28D9",
    soft: "#FFF1E7",
    softBlue: "#FFEAEA",
    softRed: "#F2EDFF",
    canvas: "#FFF8F3",
    canvasTint: "#FFE9D6",
    surfaceTint: "#FFF6EA",
    heroSurface: "#3D1F2C",
    widgetDark: "#271729",
    widgetAccent: "#FFB072",
    lockWidget: "#5F2E36",
    darkAccent: "#FDBA74",
    darkSecondary: "#FCA5A5",
    darkTertiary: "#C4B5FD",
    darkSoft: "#332018",
    darkCanvas: "#130D0B",
    darkCanvasTint: "#261611",
    darkSurfaceTint: "#2B1912",
    darkHeroSurface: "#FFF0E3"
  },
  {
    id: "graphitePro",
    name: "Graphite Pro",
    shortName: "Graphite",
    accent: "#334155",
    secondary: "#64748B",
    tertiary: "#0F766E",
    soft: "#EEF2F7",
    softBlue: "#E8F2F5",
    softRed: "#EAFBF8",
    canvas: "#F5F6F8",
    canvasTint: "#E9EEF3",
    surfaceTint: "#F8FAFC",
    heroSurface: "#111827",
    widgetDark: "#10131B",
    widgetAccent: "#B9C5D6",
    lockWidget: "#1F2937",
    darkAccent: "#CBD5E1",
    darkSecondary: "#94A3B8",
    darkTertiary: "#5EEAD4",
    darkSoft: "#202938",
    darkCanvas: "#070A0F",
    darkCanvasTint: "#111827",
    darkSurfaceTint: "#141C27",
    darkHeroSurface: "#F1F5F9"
  },
  {
    id: "roseQuartz",
    name: "Rose Quartz",
    shortName: "Rose",
    accent: "#BE123C",
    secondary: "#7E22CE",
    tertiary: "#0369A1",
    soft: "#FFEAF1",
    softBlue: "#F4EAFF",
    softRed: "#E7F6FF",
    canvas: "#FFF6FA",
    canvasTint: "#FFE6F0",
    surfaceTint: "#FFF8FC",
    heroSurface: "#37182A",
    widgetDark: "#2C1327",
    widgetAccent: "#FFB5CC",
    lockWidget: "#642447",
    darkAccent: "#FDA4AF",
    darkSecondary: "#D8B4FE",
    darkTertiary: "#7DD3FC",
    darkSoft: "#351927",
    darkCanvas: "#130A10",
    darkCanvasTint: "#25101B",
    darkSurfaceTint: "#2A1421",
    darkHeroSurface: "#FFEAF3"
  },
  {
    id: "cyberTeal",
    name: "Cyber Teal",
    shortName: "Cyber",
    accent: "#0E7490",
    secondary: "#15803D",
    tertiary: "#4F46E5",
    soft: "#E5FAFF",
    softBlue: "#E9FBEF",
    softRed: "#EEF0FF",
    canvas: "#F2FBFC",
    canvasTint: "#DDF7F9",
    surfaceTint: "#F0FEF9",
    heroSurface: "#082F49",
    widgetDark: "#071E2A",
    widgetAccent: "#7DE7F4",
    lockWidget: "#0E4555",
    darkAccent: "#67E8F9",
    darkSecondary: "#86EFAC",
    darkTertiary: "#A5B4FC",
    darkSoft: "#102A34",
    darkCanvas: "#041012",
    darkCanvasTint: "#0A1C22",
    darkSurfaceTint: "#0D241E",
    darkHeroSurface: "#D9FBFF"
  },
  {
    id: "goldSemester",
    name: "Gold Semester",
    shortName: "Gold",
    accent: "#8A5A12",
    secondary: "#2563EB",
    tertiary: "#15803D",
    soft: "#FFF4D9",
    softBlue: "#EAF1FF",
    softRed: "#E9F8EF",
    canvas: "#FFF9ED",
    canvasTint: "#FBE7B5",
    surfaceTint: "#FFFDF4",
    heroSurface: "#2C230E",
    widgetDark: "#211A0D",
    widgetAccent: "#FFD978",
    lockWidget: "#4C3710",
    darkAccent: "#FACC15",
    darkSecondary: "#93C5FD",
    darkTertiary: "#86EFAC",
    darkSoft: "#302710",
    darkCanvas: "#120E07",
    darkCanvasTint: "#201A0C",
    darkSurfaceTint: "#241F10",
    darkHeroSurface: "#FFF5D7"
  },
  {
    id: "cleanStudy",
    name: "Clean",
    shortName: "Clean",
    accent: "#2563EB",
    secondary: "#0F766E",
    tertiary: "#BE123C",
    soft: "#EEF5FF",
    softBlue: "#E6FAF8",
    softRed: "#FFF0F4",
    canvas: "#F7F9FC",
    canvasTint: "#EEF3FA",
    surfaceTint: "#FFFFFF",
    heroSurface: "#102B5F",
    widgetDark: "#F8FBFF",
    widgetAccent: "#2563EB",
    lockWidget: "#EAF1FF",
    darkAccent: "#93C5FD",
    darkSecondary: "#5EEAD4",
    darkTertiary: "#FDA4AF",
    darkSoft: "#162033",
    darkCanvas: "#07111F",
    darkCanvasTint: "#101827",
    darkSurfaceTint: "#111827",
    darkHeroSurface: "#FFFFFF"
  }
];

export const defaultThemePaletteId: ThemePaletteId = "oceanBlue";

export type WidgetStylePresetId =
  | "darkGlass"
  | "cleanWhite"
  | "ocean"
  | "violet"
  | "emerald"
  | "sunset"
  | "graphite";

export type WidgetStylePreset = {
  id: WidgetStylePresetId;
  name: string;
  background: string;
  text: string;
  muted: string;
  accent: string;
  secondary: string;
};

export const widgetStylePresets: WidgetStylePreset[] = [
  {
    id: "darkGlass",
    name: "Dark Glass",
    background: "#17152D",
    text: "#F8FAFC",
    muted: "#BCC7D8",
    accent: "#B7A7FF",
    secondary: "#3B82F6"
  },
  {
    id: "cleanWhite",
    name: "Clean White",
    background: "#F8FBFF",
    text: "#111827",
    muted: "#667085",
    accent: "#6C5CE7",
    secondary: "#3B82F6"
  },
  {
    id: "ocean",
    name: "Ocean",
    background: "#102B5F",
    text: "#F8FAFC",
    muted: "#BCD7F2",
    accent: "#9ED7FF",
    secondary: "#06B6D4"
  },
  {
    id: "violet",
    name: "Violet",
    background: "#221A3A",
    text: "#F8FAFC",
    muted: "#C6C0DA",
    accent: "#B7A7FF",
    secondary: "#3B82F6"
  },
  {
    id: "emerald",
    name: "Emerald",
    background: "#102D2A",
    text: "#F8FAFC",
    muted: "#BDE7DA",
    accent: "#8FE6C1",
    secondary: "#14B8A6"
  },
  {
    id: "sunset",
    name: "Sunset",
    background: "#271729",
    text: "#FFF7ED",
    muted: "#E9C9C3",
    accent: "#FFB072",
    secondary: "#EF4444"
  },
  {
    id: "graphite",
    name: "Graphite",
    background: "#10131B",
    text: "#F8FAFC",
    muted: "#B9C5D6",
    accent: "#CBD5E1",
    secondary: "#14B8A6"
  }
];

export function resolveThemePalette(id?: string): ThemePalette {
  return themePalettes.find((palette) => palette.id === id) || themePalettes[0]!;
}

export function isThemePaletteId(id: string): id is ThemePaletteId {
  return themePalettes.some((palette) => palette.id === id);
}

export function resolveWidgetStylePreset(id?: string): WidgetStylePreset {
  return widgetStylePresets.find((preset) => preset.id === id) || widgetStylePresets[0]!;
}

export function createWidgetStyleSnapshot(paletteId?: string, styleId?: string) {
  const palette = resolveThemePalette(paletteId);
  const style = styleId ? resolveWidgetStylePreset(styleId) : null;
  const background = style?.background || palette.widgetDark;

  return {
    paletteId: palette.id,
    paletteName: palette.name,
    styleId: style?.id || "palette",
    styleName: style?.name || palette.name,
    background,
    text: style?.text || "#F8FAFC",
    muted: style?.muted || "#BCC7D8",
    accent: palette.widgetAccent || style?.accent || "#B7A7FF",
    secondary: palette.secondary || style?.secondary || "#3B82F6"
  };
}

export function createTypography(themeColors: ColorTokens) {
  return {
    hero: {
      fontSize: 36,
      lineHeight: 42,
      fontWeight: "900" as const,
      color: themeColors.ink
    },
    title: {
      fontSize: 30,
      lineHeight: 36,
      fontWeight: "900" as const,
      color: themeColors.ink
    },
    h2: {
      fontSize: 21,
      lineHeight: 27,
      fontWeight: "900" as const,
      color: themeColors.ink
    },
    body: {
      fontSize: 15,
      lineHeight: 23,
      color: themeColors.muted
    },
    small: {
      fontSize: 12,
      lineHeight: 17,
      color: themeColors.muted
    },
    caption: {
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900" as const,
      color: themeColors.faint
    }
  };
}

export const typography = createTypography(colors);

export function getTheme(mode: ThemeMode, paletteId: ThemePaletteId = defaultThemePaletteId) {
  const palette = resolveThemePalette(paletteId);
  const baseColors = mode === "dark" ? darkColors : lightColors;
  const themeColors = {
    ...baseColors,
    canvas: mode === "dark" ? palette.darkCanvas : palette.canvas,
    canvasTint: mode === "dark" ? palette.darkCanvasTint : palette.canvasTint,
    surfaceTint: mode === "dark" ? palette.darkSurfaceTint : palette.surfaceTint,
    accent: mode === "dark" ? palette.darkAccent : palette.accent,
    accentSoft: mode === "dark" ? palette.darkSoft : palette.soft,
    brandPurple: mode === "dark" ? palette.darkAccent : palette.accent,
    brandBlue: mode === "dark" ? palette.darkSecondary : palette.secondary,
    brandCoral: mode === "dark" ? palette.darkTertiary : palette.tertiary,
    accentSecondary: mode === "dark" ? palette.darkSecondary : palette.secondary,
    accentTertiary: mode === "dark" ? palette.darkTertiary : palette.tertiary,
    purpleSoft: mode === "dark" ? palette.darkSoft : palette.soft,
    blueSoft: mode === "dark" ? baseColors.blueSoft : palette.softBlue,
    redSoft: mode === "dark" ? baseColors.redSoft : palette.softRed,
    calendarToday: mode === "dark" ? palette.darkAccent : palette.accent,
    calendarHeavy: mode === "dark" ? palette.darkTertiary : palette.tertiary,
    widgetDark: palette.widgetDark,
    widgetAccent: palette.widgetAccent,
    lockWidget: palette.lockWidget,
    heroSurface: mode === "dark" ? palette.darkHeroSurface : palette.heroSurface
  };

  return {
    mode,
    isDark: mode === "dark",
    colors: themeColors,
    palette,
    palettes: themePalettes,
    widgetStyles: widgetStylePresets,
    spacing,
    radii,
    typography: createTypography(themeColors)
  };
}

export type AppTheme = ReturnType<typeof getTheme>;
