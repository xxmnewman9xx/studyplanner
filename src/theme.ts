export const lightColors = {
  canvas: "#F5F5F7",
  canvasTint: "#EFEFF4",
  surface: "#FFFFFF",
  surfaceAlt: "#F2F2F7",
  surfaceTint: "#EEF4FF",
  ink: "#111827",
  muted: "#5F6673",
  faint: "#8E8E93",
  line: "#D9DCE3",
  lineStrong: "#C5CAD3",
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
  accentSoft: "#E8F2FF",
  brandPink: "#C2467A",
  brandViolet: "#6E5AEF",
  brandIndigo: "#315ECA",
  brandOrange: "#C77912",
  elevated: "#FFFFFF",
  heroSurface: "#111827",
  heroText: "#FFFFFF",
  heroMuted: "#D1D5DB",
  shadow: "#0F172A"
};

export const darkColors = {
  canvas: "#080812",
  canvasTint: "#17142A",
  surface: "#12121F",
  surfaceAlt: "#1C1A2E",
  surfaceTint: "#221626",
  ink: "#F5F7FB",
  muted: "#C1CAD8",
  faint: "#7F8A9C",
  line: "#2B2940",
  lineStrong: "#45415F",
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
  sunset: ["#FF5D6C", "#FF4FA3", "#FDBA2D", "#7C2D12"],
  ocean: ["#0EA5E9", "#2563EB", "#67E8F9", "#0F172A"],
  forest: ["#059669", "#10B981", "#A7F3D0", "#064E3B"],
  lavender: ["#8B5CF6", "#C084FC", "#F0ABFC", "#4C1D95"],
  midnight: ["#0F1028", "#312E81", "#818CF8", "#020617"],
  candy: ["#FB7185", "#F472B6", "#FDBA74", "#7C2D12"],
  minimal: ["#111827", "#9CA3AF", "#E5E7EB", "#FFFFFF"]
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
