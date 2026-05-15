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
  canvas: "#0C0F0E",
  canvasTint: "#141A18",
  surface: "#151A18",
  surfaceAlt: "#1D2421",
  surfaceTint: "#1A2B27",
  ink: "#F7F2E8",
  muted: "#C0C8C1",
  faint: "#858F89",
  line: "#2B3430",
  lineStrong: "#465149",
  softGold: "#342711",
  gold: "#F4C95D",
  mint: "#102D26",
  sage: "#61D394",
  coral: "#FF7A8B",
  blue: "#85B5FF",
  red: "#FF7A86",
  green: "#61D394",
  lavender: "#2B2544",
  accent: "#4DD7C8",
  accentSoft: "#173431",
  brandPink: "#E08B73",
  brandViolet: "#92A8D1",
  brandIndigo: "#78B7D8",
  brandOrange: "#DFA64A",
  elevated: "#151D2A",
  heroSurface: "#101614",
  heroText: "#FFF8EA",
  heroMuted: "#B9C7BE",
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
  "#006C67",
  "#2F7D5F",
  "#4C5F85",
  "#B97822",
  "#2F5F7A",
  "#B45A4A"
];

export const themePalettes = {
  sunset: ["#2A1815", "#E08B73", "#DFA64A", "#FFF1D6"],
  ocean: ["#102022", "#4DD7C8", "#78B7D8", "#E2F6F1"],
  forest: ["#101C18", "#4BA879", "#A9D8B8", "#E8F1E6"],
  lavender: ["#171A24", "#92A8D1", "#C7B7D8", "#F1ECF7"],
  midnight: ["#0C0F0E", "#2F5F7A", "#4DD7C8", "#FFF8EA"],
  candy: ["#241513", "#B45A4A", "#DFA64A", "#FFF1D6"],
  minimal: ["#161A1D", "#606866", "#DDD6CA", "#FFFDF8"]
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
