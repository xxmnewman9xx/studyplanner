// Shared design tokens for the 2.2 components. Values are lifted from the
// existing App.tsx visual language (Card, Button, hero cards, Pill) so the new
// surfaces sit next to the old ones without a seam.
import { COLORS, CLASS_COLORS } from "../../seed";
import type { ForecastColor } from "../types";
import type { AITheme } from "./theme";

export { COLORS };

export const RADII = {
  hero: 28,
  card: 24,
  panel: 22,
  tile: 16,
  inner: 14,
  cell: 9,
  pill: 999,
} as const;

export const SPACE = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/** Apple HIG minimum touch target. */
export const TOUCH = 44;
/** App.tsx Button minHeight. */
export const BUTTON_HEIGHT = 51;

export const TYPE = {
  kicker: 11,
  micro: 11,
  caption: 12,
  footnote: 13,
  body: 15,
  callout: 16,
  headline: 18,
  title3: 22,
  title2: 26,
  title1: 31,
  display: 36,
} as const;

/** Dark hero surfaces used across the app (LockedDashboard, Paywall, SemesterKickoff). */
export const HERO = {
  ink: "#0A0A0A",
  plum: "#0A0A0A",
  plumDark: "#0A0A0A",
  lavender: "#FFFFFF",
  lavenderSoft: "rgba(255,255,255,0.72)",
  onHero: "#FFFFFF",
  onHero2: "rgba(255,255,255,0.78)",
  onHero3: "rgba(255,255,255,0.62)",
  chip: "rgba(255,255,255,0.12)",
  chipStrong: "rgba(255,255,255,0.18)",
  outline: "rgba(255,255,255,0.22)",
  track: "rgba(255,255,255,0.14)",
} as const;

export function heroBackground(theme: AITheme) {
  return theme.dark ? HERO.plumDark : HERO.plum;
}

export function cardShadow(_theme: AITheme) {
  // Minimalist system: hairline borders, no drop shadows.
  return "none";
}

/** `${hex}${alpha}` tint helper matching App.tsx usage (e.g. `${COLORS.green}1F`). */
export function tint(hex: string, alphaHex: string) {
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alphaHex}` : hex;
}

/**
 * Semantic COLORS are tuned for dark surfaces. On light surfaces small text in
 * those hues falls under 4.5:1, so text/icons use these deeper equivalents
 * (same role as App.tsx `contrastSafeLightForeground`).
 */
const CONTRAST_SAFE_LIGHT: Record<string, string> = {
  [COLORS.green]: "#1A7F37",
  [COLORS.orange]: "#A65200",
  [COLORS.red]: "#D70015",
  [COLORS.blue]: "#0060DF",
  [COLORS.purple]: "#5B3FD9",
};

export function semanticText(color: string, theme: AITheme) {
  return theme.dark ? color : CONTRAST_SAFE_LIGHT[color] || color;
}

// ---------------------------------------------------------------------------
// Crunch Forecast scale: calm -> steady -> busy -> crunch.
// ---------------------------------------------------------------------------

export type ForecastSurface = "card" | "hero";

export type ForecastCellStyle = {
  background: string;
  foreground: string;
  /** Outer glow ring for crunch weeks. */
  ring?: string;
  glow?: string;
};

const FORECAST_SCALE = {
  // Grayscale intensity; red is the only hue, reserved for crunch weeks.
  light: {
    steady: { background: "rgba(0,0,0,0.14)", foreground: "#0A0A0A" },
    busy: { background: "rgba(0,0,0,0.42)", foreground: "#FFFFFF" },
    crunch: { background: COLORS.red, foreground: "#FFFFFF", ring: "rgba(255,69,58,0.38)", glow: "0 0 10px rgba(255,69,58,0.45)" },
  },
  dark: {
    steady: { background: "rgba(255,255,255,0.22)", foreground: "#FFFFFF" },
    busy: { background: "rgba(255,255,255,0.50)", foreground: "#000000" },
    crunch: { background: COLORS.red, foreground: "#FFFFFF", ring: "rgba(255,69,58,0.50)", glow: "0 0 12px rgba(255,69,58,0.65)" },
  },
  hero: {
    calm: { background: "rgba(255,255,255,0.09)", foreground: "rgba(255,255,255,0.62)" },
    steady: { background: "rgba(255,255,255,0.26)", foreground: "#FFFFFF" },
    busy: { background: "rgba(255,255,255,0.55)", foreground: "#000000" },
    crunch: { background: COLORS.red, foreground: "#FFFFFF", ring: "rgba(255,69,58,0.55)", glow: "0 0 14px rgba(255,69,58,0.75)" },
  },
} as const;

export function forecastCellStyle(level: ForecastColor, theme: AITheme, surface: ForecastSurface = "card"): ForecastCellStyle {
  if (surface === "hero") return FORECAST_SCALE.hero[level];
  if (level === "calm") return { background: theme.surface3, foreground: theme.label2 };
  return (theme.dark ? FORECAST_SCALE.dark : FORECAST_SCALE.light)[level];
}

/** Text/icon accent for a forecast level on regular surfaces (legend labels, pills). */
export function forecastAccent(level: ForecastColor, theme: AITheme) {
  if (level === "crunch") return semanticText(COLORS.red, theme);
  if (level === "busy" || level === "steady") return theme.label2;
  return theme.label3;
}

/** Color for the "AI" family (badge, origin chips) on regular surfaces. */
export function aiAccent(theme: AITheme) {
  return theme.dark ? HERO.lavender : semanticText(COLORS.purple, theme);
}

export const CLASS_SWATCHES: string[] = CLASS_COLORS.map((pair) => pair[0]);

/** Share card canvas (logical points). Captured at 3x => 1080x1920 PNG. */
export const SHARE_CARD = {
  width: 360,
  height: 640,
  pixelRatio: 3,
  padding: 24,
  /** Printed link on the card (no QR). Override via ForecastShareCard `linkText`. */
  defaultLinkText: "apps.apple.com/app/id6766181202",
} as const;

/** Quiet zone required around a QR symbol, in modules. */
export const QR_QUIET_ZONE = 4;

/** Weak topics stay hidden until this many practice answers exist (MASTER_PLAN F7). */
export const WEAK_TOPICS_MIN_ANSWERS = 20;

/** Quick-add date chips cover today + this many following days. */
export const QUICK_ADD_DAY_RANGE = 14;

export const MOTION = {
  entrance: 360,
  stagger: 620,
  flipHalf: 170,
  bar: 420,
  ring: 760,
  entranceOffset: 8,
} as const;
