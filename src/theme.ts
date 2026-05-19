export const lightColors = {
  canvas: "#F6F8FC",
  canvasTint: "#EAF0F8",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF3FA",
  surfaceTint: "#E5F6F0",
  ink: "#111827",
  muted: "#586174",
  faint: "#8A94A6",
  line: "#D8E0EA",
  lineStrong: "#B9C5D3",
  softGold: "#FFF0C8",
  gold: "#B8730D",
  mint: "#DDF8EF",
  sage: "#0F8A6A",
  coral: "#D94D68",
  blue: "#2F6BFF",
  red: "#D92D4B",
  green: "#16A66E",
  lavender: "#E9E7FF",
  accent: "#315BFF",
  accentSoft: "#E5EBFF",
  brandPink: "#D84B7B",
  brandViolet: "#5D5FEF",
  brandIndigo: "#315BFF",
  brandOrange: "#C98316",
  elevated: "#FFFFFF",
  heroSurface: "#15233A",
  heroText: "#FFFFFF",
  heroMuted: "#CBD6E6",
  shadow: "#15233A"
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
  "#315BFF",
  "#0F8A6A",
  "#5D5FEF",
  "#C98316",
  "#2F80ED",
  "#D84B7B"
];

export const themePalettes = {
  sunset: ["#160B12", "#D94D68", "#C98316", "#FFF1D6"],
  ocean: ["#061827", "#2F80ED", "#35F2D0", "#E2F8FF"],
  forest: ["#07150F", "#4ADE80", "#35F2D0", "#E9FFE8"],
  lavender: ["#11101F", "#6D5DF5", "#66D9FF", "#F1ECFF"],
  midnight: ["#070A12", "#35F2D0", "#9B7CFF", "#FFF8EA"],
  candy: ["#180B16", "#D84B7B", "#6D5DF5", "#FFE7F0"],
  minimal: ["#0A0F1A", "#8B95A7", "#263245", "#FFF8EA"]
};

export type ColorTokens = typeof lightColors;
export type ThemeMode = "light" | "dark";
export type ThemeAccent = "campus" | "classic" | "slate" | "mint";

export const appThemePalettes: Record<ThemeAccent, { label: string; swatches: string[] }> = {
  campus: { label: "Campus", swatches: ["#15233A", "#315BFF", "#35CDA8", "#F6F8FC"] },
  classic: { label: "Classic", swatches: ["#21143E", "#6D44FF", "#D84B7B", "#F8F3FF"] },
  slate: { label: "Slate", swatches: ["#111827", "#64748B", "#D8E0EA", "#FFFFFF"] },
  mint: { label: "Mint", swatches: ["#0F2F2A", "#0F8A6A", "#35CDA8", "#F1FBF7"] }
};

const lightAccentOverrides: Record<ThemeAccent, Partial<ColorTokens>> = {
  campus: {},
  classic: {
    canvas: "#F8F3FF",
    canvasTint: "#EFE5FF",
    surfaceAlt: "#F0E8FF",
    surfaceTint: "#E4FBF4",
    line: "#DED2EF",
    lineStrong: "#BFADE0",
    accent: "#6D44FF",
    accentSoft: "#E9E2FF",
    brandPink: "#D84B7B",
    brandViolet: "#6D44FF",
    heroSurface: "#21143E",
    heroMuted: "#DACFF3",
    shadow: "#21143E"
  },
  slate: {
    canvas: "#F7F8FA",
    canvasTint: "#EDF1F5",
    surfaceAlt: "#F0F3F6",
    surfaceTint: "#EEF2F6",
    accent: "#475569",
    accentSoft: "#E8EDF3",
    brandPink: "#64748B",
    brandViolet: "#334155",
    brandIndigo: "#475569",
    heroSurface: "#111827",
    heroMuted: "#D6DEE8"
  },
  mint: {
    canvas: "#F1FBF7",
    canvasTint: "#DFF6EE",
    surfaceAlt: "#E5F6F0",
    surfaceTint: "#DDF8EF",
    accent: "#0F8A6A",
    accentSoft: "#DDF8EF",
    brandPink: "#2F80ED",
    brandViolet: "#0F766E",
    brandIndigo: "#0F8A6A",
    heroSurface: "#0F2F2A",
    heroMuted: "#CFE8E0"
  }
};

const darkAccentOverrides: Record<ThemeAccent, Partial<ColorTokens>> = {
  campus: {
    accent: "#7FA2FF",
    accentSoft: "#14214A",
    brandPink: "#E17191",
    brandViolet: "#8E90FF",
    brandIndigo: "#7FA2FF",
    heroMuted: "#B8C8D4"
  },
  classic: {},
  slate: {
    accent: "#B7C1D1",
    accentSoft: "#273244",
    brandPink: "#94A3B8",
    brandViolet: "#CBD5E1",
    brandIndigo: "#94A3B8",
    heroSurface: "#0A0F1A"
  },
  mint: {
    accent: "#35F2D0",
    accentSoft: "#103E3A",
    brandPink: "#66D9FF",
    brandViolet: "#48E5A4",
    brandIndigo: "#35F2D0",
    heroSurface: "#07150F"
  }
};

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

export function getTheme(mode: ThemeMode, accent: ThemeAccent = "campus") {
  const baseColors = mode === "dark" ? darkColors : lightColors;
  const overrides = mode === "dark" ? darkAccentOverrides[accent] : lightAccentOverrides[accent];
  const themeColors = { ...baseColors, ...overrides };

  return {
    mode,
    accent,
    isDark: mode === "dark",
    colors: themeColors,
    spacing,
    radii,
    typography: createTypography(themeColors)
  };
}

export type AppTheme = ReturnType<typeof getTheme>;
