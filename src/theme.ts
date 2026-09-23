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
  accentText: "#FFFFFF",
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
  canvasTint: "#0A101D",
  surface: "#0D1422",
  surfaceAlt: "#151D2A",
  surfaceTint: "#0A2B31",
  ink: "#F7F8FC",
  muted: "#C7D0DE",
  faint: "#8995A7",
  line: "#263142",
  lineStrong: "#3C4B62",
  softGold: "#35270B",
  gold: "#FFD166",
  mint: "#0B3025",
  sage: "#48E5A4",
  coral: "#FF5C7A",
  blue: "#7FB4FF",
  red: "#FF7182",
  green: "#4ADE80",
  lavender: "#11253D",
  accent: "#56A8FF",
  accentText: "#07111F",
  accentSoft: "#112B4A",
  brandPink: "#FF4D8D",
  brandViolet: "#38D8FF",
  brandIndigo: "#56A8FF",
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
  "#14B8A6",
  "#D49A21",
  "#2F80ED",
  "#38BDF8"
];

export const themePalettes = {
  sunset: ["#170B08", "#F97316", "#FFD166", "#FFF7ED"],
  ocean: ["#061827", "#2F80ED", "#35F2D0", "#E2F8FF"],
  forest: ["#07150F", "#4ADE80", "#35F2D0", "#E9FFE8"],
  lavender: ["#091A2E", "#56A8FF", "#38D8FF", "#EAF6FF"],
  midnight: ["#05070B", "#56A8FF", "#35F2D0", "#F8FAFC"],
  candy: ["#170B08", "#FB7185", "#38D8FF", "#FFF1F2"],
  minimal: ["#0A0F1A", "#8B95A7", "#263245", "#FFF8EA"],
  graphite: ["#05070B", "#A3E635", "#38BDF8", "#F8FAFC"],
  aurora: ["#06131B", "#35F2D0", "#56A8FF", "#E5FBFF"],
  paper: ["#F8FAFC", "#2F80ED", "#14B8A6", "#0F172A"],
  contrast: ["#05070B", "#FACC15", "#FFFFFF", "#000000"]
};

export type ColorTokens = typeof lightColors;
export type ThemeMode = "light" | "dark";
export type ThemeAccent = "campus" | "classic" | "slate" | "mint" | "aura" | "rose" | "graphite" | "solar";

export const appThemePalettes: Record<ThemeAccent, { label: string; swatches: string[] }> = {
  campus: { label: "Campus", swatches: ["#15233A", "#315BFF", "#35CDA8", "#F6F8FC"] },
  classic: { label: "Classic", swatches: ["#0B1B2B", "#2F80ED", "#35F2D0", "#F8FAFC"] },
  slate: { label: "Slate", swatches: ["#111827", "#64748B", "#D8E0EA", "#FFFFFF"] },
  mint: { label: "Mint", swatches: ["#0F2F2A", "#0F8A6A", "#35CDA8", "#F1FBF7"] },
  aura: { label: "Aurora", swatches: ["#061827", "#35F2D0", "#56A8FF", "#E5FBFF"] },
  rose: { label: "Sunrise", swatches: ["#170B08", "#F97316", "#38D8FF", "#FFF7ED"] },
  graphite: { label: "Graphite", swatches: ["#06070A", "#A3E635", "#38BDF8", "#F8FAFC"] },
  solar: { label: "Solar", swatches: ["#281405", "#F97316", "#FACC15", "#FFF7ED"] }
};

const lightAccentOverrides: Record<ThemeAccent, Partial<ColorTokens>> = {
  campus: {},
  classic: {
    canvas: "#F8FAFC",
    canvasTint: "#E8F3FF",
    surfaceAlt: "#EFF6FF",
    surfaceTint: "#E4FBF4",
    line: "#D8E5F2",
    lineStrong: "#AFC7E0",
    accent: "#2F80ED",
    accentSoft: "#DDEEFF",
    brandPink: "#38BDF8",
    brandViolet: "#0F766E",
    heroSurface: "#0B1B2B",
    heroMuted: "#D4E9FF",
    shadow: "#0B1B2B"
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
  },
  aura: {
    canvas: "#F4FBFF",
    canvasTint: "#DDF5FF",
    surfaceAlt: "#E8F8FF",
    surfaceTint: "#DDF8EF",
    line: "#BFE7F4",
    lineStrong: "#80D7E8",
    accent: "#0F8A9D",
    accentSoft: "#DDF5FF",
    brandPink: "#2F80ED",
    brandViolet: "#14B8A6",
    brandIndigo: "#0EA5E9",
    heroSurface: "#061827",
    heroMuted: "#CFF7FF",
    shadow: "#061827"
  },
  rose: {
    canvas: "#FFF7ED",
    canvasTint: "#FFEDD5",
    surfaceAlt: "#FFEBD5",
    surfaceTint: "#FFF2DA",
    line: "#FED7AA",
    accent: "#EA580C",
    accentSoft: "#FFEDD5",
    brandPink: "#38BDF8",
    brandViolet: "#F97316",
    brandIndigo: "#F59E0B",
    heroSurface: "#170B08",
    heroMuted: "#FFE8C2",
    shadow: "#170B08"
  },
  graphite: {
    canvas: "#F6F8FA",
    canvasTint: "#E8EEF4",
    surfaceAlt: "#EDF2F7",
    surfaceTint: "#E5F7FF",
    line: "#CBD5E1",
    accent: "#0F172A",
    accentSoft: "#E2E8F0",
    brandPink: "#38BDF8",
    brandViolet: "#334155",
    brandIndigo: "#0F172A",
    heroSurface: "#06070A",
    heroMuted: "#DCE8F4",
    shadow: "#06070A"
  },
  solar: {
    canvas: "#FFF7ED",
    canvasTint: "#FFEDD5",
    surfaceAlt: "#FFEBD5",
    surfaceTint: "#FEF3C7",
    line: "#FED7AA",
    accent: "#EA580C",
    accentSoft: "#FFEDD5",
    brandPink: "#F97316",
    brandViolet: "#B45309",
    brandIndigo: "#C2410C",
    heroSurface: "#281405",
    heroMuted: "#FFE8C2",
    shadow: "#281405"
  }
};

const darkAccentOverrides: Record<ThemeAccent, Partial<ColorTokens>> = {
  campus: {
    accent: "#56A8FF",
    accentSoft: "#112B4A",
    brandPink: "#38D8FF",
    brandViolet: "#35F2D0",
    brandIndigo: "#56A8FF",
    heroMuted: "#B8C8D4"
  },
  classic: {
    accent: "#56A8FF",
    accentSoft: "#112B4A",
    brandPink: "#38D8FF",
    brandViolet: "#35F2D0",
    brandIndigo: "#56A8FF",
    heroSurface: "#061827",
    heroMuted: "#B8C8D4"
  },
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
  },
  aura: {
    canvas: "#050A11",
    canvasTint: "#061827",
    surface: "#0B1724",
    surfaceAlt: "#102234",
    surfaceTint: "#0A2F34",
    line: "#1E4657",
    lineStrong: "#2D7182",
    accent: "#35F2D0",
    accentSoft: "#103E3A",
    brandPink: "#56A8FF",
    brandViolet: "#38D8FF",
    brandIndigo: "#56A8FF",
    heroSurface: "#02070B",
    heroText: "#F8FAFC",
    heroMuted: "#CFF7FF"
  },
  rose: {
    canvas: "#140A02",
    canvasTint: "#241205",
    surface: "#211407",
    surfaceAlt: "#34200A",
    surfaceTint: "#2A2510",
    line: "#6A3A0A",
    accent: "#F97316",
    accentSoft: "#422908",
    brandPink: "#38BDF8",
    brandViolet: "#FACC15",
    brandIndigo: "#F59E0B",
    heroSurface: "#090501",
    heroText: "#FFF7ED",
    heroMuted: "#FED7AA"
  },
  graphite: {
    canvas: "#05070B",
    canvasTint: "#0C1118",
    surface: "#111827",
    surfaceAlt: "#1E293B",
    surfaceTint: "#0E2A35",
    line: "#334155",
    accent: "#A3E635",
    accentSoft: "#1F2F19",
    brandPink: "#38BDF8",
    brandViolet: "#CBD5E1",
    brandIndigo: "#7DD3FC",
    heroSurface: "#02040A",
    heroText: "#F8FAFC",
    heroMuted: "#CBD5E1"
  },
  solar: {
    canvas: "#140A02",
    canvasTint: "#241205",
    surface: "#211407",
    surfaceAlt: "#34200A",
    surfaceTint: "#3A2509",
    line: "#6A3A0A",
    accent: "#FACC15",
    accentSoft: "#422908",
    brandPink: "#FB7185",
    brandViolet: "#F97316",
    brandIndigo: "#F59E0B",
    heroSurface: "#090501",
    heroText: "#FFF7ED",
    heroMuted: "#FED7AA"
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

export function createGlassTokens(themeColors: ColorTokens, mode: ThemeMode) {
  const isDark = false;

  return {
    blurAmount: {
      thin: 12,
      standard: 20,
      hero: 28
    },
    opacity: {
      surface: isDark ? 0.76 : 0.8,
      hero: isDark ? 0.9 : 0.86,
      control: isDark ? 0.68 : 0.74,
      reducedTransparency: isDark ? 0.96 : 0.98,
      texture: isDark ? 0.05 : 0.035
    },
    tint: {
      surface: isDark ? "rgba(18,25,42,0.76)" : "rgba(255,255,255,0.80)",
      hero: isDark ? "rgba(8,12,22,0.92)" : "rgba(255,255,255,0.84)",
      control: isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.70)",
      reducedTransparency: isDark ? themeColors.surface : themeColors.surface
    },
    border: {
      alpha: isDark ? 0.22 : 0.82,
      highContrastAlpha: isDark ? 0.42 : 1
    },
    rimHighlight: isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.72)",
    innerGlow: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.46)",
    ambientSpill: isDark ? "rgba(86,168,255,0.18)" : "rgba(49,91,255,0.12)",
    depth: {
      surfaceShadowOpacity: isDark ? 0.34 : 0.12,
      heroShadowOpacity: isDark ? 0.42 : 0.16,
      controlShadowOpacity: isDark ? 0.22 : 0.08,
      shadowRadius: 24,
      shadowY: 16
    },
    gradientStops: {
      top: isDark ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.58)",
      mid: isDark ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.22)",
      bottom: isDark ? "rgba(0,0,0,0.12)" : "rgba(17,24,39,0.035)"
    }
  };
}

export function getTheme(mode: ThemeMode, accent: ThemeAccent = "campus") {
  const baseColors = lightColors;
  const overrides = lightAccentOverrides[accent];
  const themeColors = { ...baseColors, ...overrides };

  return {
    mode,
    accent,
    isDark: false,
    colors: themeColors,
    spacing,
    radii,
    typography: createTypography(themeColors),
    glass: createGlassTokens(themeColors, mode)
  };
}

export type AppTheme = ReturnType<typeof getTheme>;
