export const lightColors = {
  canvas: "#F6F2EA",
  canvasTint: "#EEE6D8",
  surface: "#FFFDF8",
  surfaceAlt: "#EEE8DD",
  surfaceTint: "#E9F3EE",
  ink: "#161A1D",
  muted: "#606866",
  faint: "#8F9793",
  line: "#DDD6CA",
  lineStrong: "#C7BDAE",
  softGold: "#FFF4D8",
  gold: "#B7791F",
  mint: "#E8F7EF",
  sage: "#2F9E6D",
  coral: "#D85B68",
  blue: "#0A84FF",
  red: "#D92D3E",
  green: "#34C759",
  lavender: "#ECE8FF",
  accent: "#006C67",
  accentSoft: "#DCECE8",
  brandPink: "#B45A4A",
  brandViolet: "#4C5F85",
  brandIndigo: "#2F5F7A",
  brandOrange: "#B97822",
  elevated: "#FFFFFF",
  heroSurface: "#17201F",
  heroText: "#FFFDF8",
  heroMuted: "#C9D4CD",
  shadow: "#0F172A"
};

export const darkColors = {
  canvas: "#080A10",
  canvasTint: "#101522",
  surface: "#111723",
  surfaceAlt: "#182132",
  surfaceTint: "#112B2D",
  ink: "#F7F4EA",
  muted: "#C3CBD2",
  faint: "#858FA0",
  line: "#273244",
  lineStrong: "#46546A",
  softGold: "#342711",
  gold: "#F4C95D",
  mint: "#102D26",
  sage: "#61D394",
  coral: "#FF7A8B",
  blue: "#85B5FF",
  red: "#FF7A86",
  green: "#61D394",
  lavender: "#2B2544",
  accent: "#35F2D0",
  accentSoft: "#113D3C",
  brandPink: "#FF7A90",
  brandViolet: "#A78BFA",
  brandIndigo: "#69C7FF",
  brandOrange: "#F6B84B",
  elevated: "#151D2A",
  heroSurface: "#0D111C",
  heroText: "#FFF8EA",
  heroMuted: "#B9C8D2",
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
  lg: 18,
  xl: 26,
  xxl: 34,
  round: 999
};

export const classColors = [
  "#35F2D0",
  "#7EE787",
  "#A78BFA",
  "#F6B84B",
  "#69C7FF",
  "#FF7A90"
];

export const themePalettes = {
  sunset: ["#140D18", "#FF7A90", "#F6B84B", "#FFF1D6"],
  ocean: ["#07131F", "#35F2D0", "#69C7FF", "#E2F8FF"],
  forest: ["#07150F", "#7EE787", "#35F2D0", "#E9FFE8"],
  lavender: ["#11101F", "#A78BFA", "#69C7FF", "#F1ECFF"],
  midnight: ["#080A10", "#35F2D0", "#A78BFA", "#FFF8EA"],
  candy: ["#180B16", "#FF7A90", "#A78BFA", "#FFE7F0"],
  minimal: ["#0D111C", "#858FA0", "#273244", "#FFF8EA"]
};

export type ColorTokens = typeof lightColors;
export type ThemeMode = "light" | "dark";

export function createTypography(themeColors: ColorTokens) {
  return {
    hero: {
      fontSize: 36,
      lineHeight: 42,
      fontWeight: "800" as const,
      color: themeColors.ink
    },
    title: {
      fontSize: 30,
      lineHeight: 36,
      fontWeight: "800" as const,
      color: themeColors.ink
    },
    h2: {
      fontSize: 21,
      lineHeight: 27,
      fontWeight: "800" as const,
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
