export const lightColors = {
  canvas: "#F2F0E8",
  canvasTint: "#E6E1D2",
  surface: "#FFFDF4",
  surfaceAlt: "#EDE7D7",
  surfaceTint: "#E7F5EF",
  ink: "#121417",
  muted: "#5B625E",
  faint: "#8E928A",
  line: "#D9D0BE",
  lineStrong: "#BFAF96",
  softGold: "#FFF2C6",
  gold: "#C68613",
  mint: "#DFF8EC",
  sage: "#128A62",
  coral: "#E35169",
  blue: "#2563EB",
  red: "#D92D3E",
  green: "#20A667",
  lavender: "#E8E2FF",
  accent: "#00A884",
  accentSoft: "#D8F5EB",
  brandPink: "#FF4D6D",
  brandViolet: "#7157FF",
  brandIndigo: "#1B6BFF",
  brandOrange: "#F29F05",
  elevated: "#FFFFFF",
  heroSurface: "#10151E",
  heroText: "#FFFDF4",
  heroMuted: "#C8D6CE",
  shadow: "#0A0F1A"
};

export const darkColors = {
  canvas: "#070A12",
  canvasTint: "#0D1321",
  surface: "#111827",
  surfaceAlt: "#1A2433",
  surfaceTint: "#0D302D",
  ink: "#FAF7EF",
  muted: "#C2C8D1",
  faint: "#7E8998",
  line: "#263245",
  lineStrong: "#42516A",
  softGold: "#35270B",
  gold: "#FFD166",
  mint: "#0B3025",
  sage: "#48E5A4",
  coral: "#FF5C7A",
  blue: "#7FB4FF",
  red: "#FF7182",
  green: "#4ADE80",
  lavender: "#2B2544",
  accent: "#35F2D0",
  accentSoft: "#103E3A",
  brandPink: "#FF4D8D",
  brandViolet: "#9B7CFF",
  brandIndigo: "#66D9FF",
  brandOrange: "#FFBE45",
  elevated: "#151D2A",
  heroSurface: "#0A0F1A",
  heroText: "#FFF8EA",
  heroMuted: "#B8C8D4",
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
  sunset: ["#160B12", "#FF4D6D", "#FFBE45", "#FFF1D6"],
  ocean: ["#061827", "#35F2D0", "#66D9FF", "#E2F8FF"],
  forest: ["#07150F", "#4ADE80", "#35F2D0", "#E9FFE8"],
  lavender: ["#11101F", "#9B7CFF", "#66D9FF", "#F1ECFF"],
  midnight: ["#070A12", "#35F2D0", "#9B7CFF", "#FFF8EA"],
  candy: ["#180B16", "#FF4D8D", "#9B7CFF", "#FFE7F0"],
  minimal: ["#0A0F1A", "#8B95A7", "#263245", "#FFF8EA"]
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
