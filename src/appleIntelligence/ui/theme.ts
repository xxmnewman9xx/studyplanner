// UI contract shared by every 2.2 component.
//
// AITheme is structurally identical to App.tsx `ReturnType<typeof palette>`, so
// the lead can pass the app's `theme` object straight through without mapping.

export type AITheme = {
  dark: boolean;
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  hairline: string;
  label: string;
  label2: string;
  label3: string;
  accent: string;
  accent2: string;
};

/** Same call shape as App.tsx `textFor`: key, English fallback, `{var}` values. */
export type AIText = (key: string, fallback: string, vars?: Record<string, string | number>) => string;

/** Props every component takes. `locale` drives Intl dates/numbers and RTL layout. */
export type AIBaseProps = {
  theme: AITheme;
  t: AIText;
  locale: string;
};

/** palette("light") from App.tsx, for the gallery and web screenshot QA. */
export const AI_THEME_LIGHT: AITheme = {
  dark: false,
  bg: "#EFEFF4",
  surface: "#FFFFFF",
  surface2: "#F6F6FA",
  surface3: "#ECECF2",
  hairline: "rgba(60,60,67,0.12)",
  label: "#0A0A0D",
  label2: "#515158",
  label3: "#6E6E76",
  accent: "#0A0A0D",
  accent2: "#FBFBFE",
};

/** palette("dark") from App.tsx, for the gallery and web screenshot QA. */
export const AI_THEME_DARK: AITheme = {
  dark: true,
  bg: "#050507",
  surface: "#1A1A1E",
  surface2: "#232329",
  surface3: "#2C2C33",
  hairline: "rgba(255,255,255,0.10)",
  label: "#FFFFFF",
  label2: "rgba(235,235,245,0.72)",
  label3: "rgba(235,235,245,0.52)",
  accent: "#5E5CE6",
  accent2: "#0A0A0C",
};
