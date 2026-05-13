export const lightColors = {
  canvas: "#F7F6FB",
  canvasTint: "#F1ECFF",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F3FA",
  surfaceTint: "#FFF4F8",
  ink: "#101326",
  muted: "#606478",
  faint: "#989CAF",
  line: "#E4E2ED",
  lineStrong: "#CEC9DE",
  softGold: "#FFF0C7",
  gold: "#F59E0B",
  mint: "#E5FAF2",
  sage: "#10B981",
  coral: "#FF5D6C",
  blue: "#2F80ED",
  red: "#FF4D5D",
  green: "#10B981",
  lavender: "#EEE8FF",
  accent: "#6C5CE7",
  accentSoft: "#EAE6FF",
  brandPink: "#FF4FA3",
  brandViolet: "#8B5CF6",
  brandIndigo: "#4F46E5",
  brandOrange: "#FF9F1C",
  elevated: "#FFFFFF",
  heroSurface: "#5B4DFF",
  heroText: "#F8FAFC",
  heroMuted: "#EDEBFF",
  shadow: "#342061"
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
  heroSurface: "#111024",
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
  "#2F80ED",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#14B8A6",
  "#EC4899"
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
