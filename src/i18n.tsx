import React, { createContext, useContext, useMemo } from "react";
import { I18nManager } from "react-native";

declare const require: (path: string) => unknown;
declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

type Direction = "ltr" | "rtl";
type LaunchStrings = {
  direction: Direction;
  brand_name: string;
  [key: string]: unknown;
};

const launchCatalog = require("../localized-app-strings/core-launch-strings.json") as Record<string, LaunchStrings>;

export const supportedLocales = [
  "ar",
  "de",
  "en-US",
  "es",
  "fr",
  "hi",
  "ja",
  "ko",
  "pt-BR",
  "zh-Hans"
] as const;

export type SupportedLocale = typeof supportedLocales[number];

type I18nContextValue = {
  locale: SupportedLocale;
  direction: Direction;
  isRTL: boolean;
  t: (key: string, fallback?: string) => string;
};

const fallbackLocale: SupportedLocale = "en-US";
const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = resolveLocale();
  const direction = launchCatalog[locale]?.direction || "ltr";

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      direction,
      isRTL: direction === "rtl",
      t: (key, fallback) => translate(locale, key, fallback)
    }),
    [direction, locale]
  );

  I18nManager.allowRTL(true);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context) return context;

  const locale = resolveLocale();
  const direction = launchCatalog[locale]?.direction || "ltr";
  return {
    locale,
    direction,
    isRTL: direction === "rtl",
    t: (key: string, fallback?: string) => translate(locale, key, fallback)
  };
}

export function translate(locale: SupportedLocale, key: string, fallback?: string) {
  const localized = valueAtPath(launchCatalog[locale], key);
  if (typeof localized === "string" && localized.trim()) return localized;

  const fallbackValue = valueAtPath(launchCatalog[fallbackLocale], key);
  if (typeof fallbackValue === "string" && fallbackValue.trim()) return fallbackValue;

  return fallback || key;
}

function resolveLocale(): SupportedLocale {
  const override = readLocaleOverride();
  const requested = normalizeLocale(override) || normalizeLocale(getRuntimeLocale());
  return requested || fallbackLocale;
}

function getRuntimeLocale() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return fallbackLocale;
  }
}

function normalizeLocale(value: string | undefined): SupportedLocale | undefined {
  if (!value) return undefined;
  const normalized = value.replace("_", "-");
  if (isSupportedLocale(normalized)) return normalized;

  const lower = normalized.toLowerCase();
  if (lower === "pt" || lower.startsWith("pt-")) return "pt-BR";
  if (lower === "zh" || lower.startsWith("zh-cn") || lower.startsWith("zh-hans")) return "zh-Hans";

  const language = lower.split("-")[0];
  return supportedLocales.find((locale) => locale.toLowerCase().split("-")[0] === language);
}

function isSupportedLocale(value: string): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}

function valueAtPath(source: LaunchStrings | undefined, key: string): unknown {
  if (!source) return undefined;
  return key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, source);
}

function readLocaleOverride() {
  return typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_STUDYPLANNER_LOCALE?.trim() : undefined;
}
