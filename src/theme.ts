export const lightColors = {
  canvas: "#F5F7FB",
  canvasTint: "#EAF1F8",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF3F8",
  surfaceTint: "#F8FBF4",
  ink: "#151A23",
  muted: "#596273",
  faint: "#8B94A7",
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
  accent: "#22577A",
  accentSoft: "#DDECF4",
  elevated: "#FFFFFF",
  heroSurface: "#111827",
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
  accent: "#7DD3FC",
  accentSoft: "#102A3B",
  elevated: "#151D2A",
  heroSurface: "#EAF6FF",
  heroText: "#07111D",
  heroMuted: "#3C5067",
  shadow: "#000000"
};

export const colors = lightColors;

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

export function getTheme(mode: ThemeMode) {
  const themeColors = mode === "dark" ? darkColors : lightColors;

  return {
    mode,
    isDark: mode === "dark",
    colors: themeColors,
    spacing,
    radii,
    typography: createTypography(themeColors)
  };
}

export type AppTheme = ReturnType<typeof getTheme>;
