export const lightColors = {
  canvas: "#F4EFE6",
  surface: "#FFFDF8",
  surfaceAlt: "#EFE7DA",
  ink: "#1A1A1A",
  muted: "#5C584F",
  faint: "#8A8472",
  line: "#D8CCB9",
  softGold: "#F0DEC0",
  gold: "#B8912C",
  mint: "#E1EBDD",
  sage: "#637B58",
  coral: "#B5482E",
  blue: "#1E3A8A",
  red: "#B0382C",
  green: "#2F7D55",
  lavender: "#DED7EC",
  accent: "#B5482E",
  elevated: "#FFFFFF",
  heroSurface: "#1A1A1A",
  heroText: "#FFFDF8",
  heroMuted: "#D6CDBE"
};

export const darkColors = {
  canvas: "#0B0D10",
  surface: "#14171C",
  surfaceAlt: "#1C2128",
  ink: "#F2F4F8",
  muted: "#C7CCD6",
  faint: "#7A8190",
  line: "#2A3039",
  softGold: "#27321B",
  gold: "#C9F75D",
  mint: "#173125",
  sage: "#5BE5A0",
  coral: "#FF6E5A",
  blue: "#78A0FF",
  red: "#FF6E5A",
  green: "#5BE5A0",
  lavender: "#2A2540",
  accent: "#5BE5A0",
  elevated: "#191D24",
  heroSurface: "#15181E",
  heroText: "#F5F7F8",
  heroMuted: "#AEB6C2"
};

export const colors = lightColors;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 32
};

export const radii = {
  sm: 6,
  md: 8,
  lg: 14,
  xl: 22
};

export type ColorTokens = typeof lightColors;
export type ThemeMode = "light" | "dark";

export function createTypography(themeColors: ColorTokens) {
  return {
    title: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "800" as const,
      color: themeColors.ink
    },
    h2: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "800" as const,
      color: themeColors.ink
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      color: themeColors.muted
    },
    small: {
      fontSize: 12,
      lineHeight: 17,
      color: themeColors.muted
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
