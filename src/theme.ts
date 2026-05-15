export const lightColors = {
  canvas: "#F7F8FC",
  canvasTint: "#EEF3FF",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F4FA",
  surfaceTint: "#EAF2FF",
  ink: "#101828",
  muted: "#596274",
  faint: "#8A93A6",
  line: "#DDE3EE",
  lineStrong: "#BFC8D8",
  softGold: "#FFF4D8",
  gold: "#B7791F",
  mint: "#E8F7EF",
  sage: "#2F9E6D",
  coral: "#D85B68",
  blue: "#0A84FF",
  red: "#D92D3E",
  green: "#34C759",
  lavender: "#ECE8FF",
  accent: "#0A84FF",
  accentSoft: "#E6F0FF",
  brandPink: "#E0448E",
  brandViolet: "#7C3AED",
  brandIndigo: "#315ECA",
  brandOrange: "#F59E0B",
  elevated: "#FFFFFF",
  heroSurface: "#111827",
  heroText: "#FFFFFF",
  heroMuted: "#D1D5DB",
  shadow: "#0F172A"
};

export const darkColors = {
  canvas: "#070B14",
  canvasTint: "#111827",
  surface: "#111827",
  surfaceAlt: "#172033",
  surfaceTint: "#182442",
  ink: "#F7FAFF",
  muted: "#C2CBD9",
  faint: "#8591A6",
  line: "#263247",
  lineStrong: "#3B4860",
  softGold: "#342711",
  gold: "#F4C95D",
  mint: "#102D26",
  sage: "#61D394",
  coral: "#FF7A8B",
  blue: "#85B5FF",
  red: "#FF7A86",
  green: "#61D394",
  lavender: "#2B2544",
  accent: "#A78BFA",
  accentSoft: "#2A2146",
  brandPink: "#FF70B8",
  brandViolet: "#A78BFA",
  brandIndigo: "#818CF8",
  brandOrange: "#FDBA2D",
  elevated: "#151D2A",
  heroSurface: "#15113A",
  heroText: "#FFFFFF",
  heroMuted: "#CFC9FF",
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
  "#0A84FF",
  "#34C759",
  "#6E5AEF",
  "#C77912",
  "#30B0C7",
  "#C2467A"
];

export const themePalettes = {
  sunset: ["#FF6A3D", "#E0448E", "#FFD166", "#4A1D16"],
  ocean: ["#12B5EA", "#315ECA", "#7DD3FC", "#081826"],
  forest: ["#00A878", "#35D0A2", "#B7F7D8", "#073B31"],
  lavender: ["#7C3AED", "#A855F7", "#D8B4FE", "#261052"],
  midnight: ["#090E1F", "#243B80", "#7C9CFF", "#030712"],
  candy: ["#F43F5E", "#E0448E", "#FDBA74", "#4C1022"],
  minimal: ["#101828", "#667085", "#E4E7EC", "#FFFFFF"]
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
