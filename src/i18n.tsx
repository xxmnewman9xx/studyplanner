import React, { createContext, useContext, useMemo, useState } from "react";
import { I18nManager } from "react-native";
import {
  contentLocaleForStorefront,
  isRTLStorefront,
  normalizeStorefrontLocale,
  storefrontLocales,
  type ContentLocale,
  type StorefrontLocale,
} from "./storefrontLocale";

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

const launchCatalog = require("../localized-app-strings/core-launch-strings.json") as Record<ContentLocale, LaunchStrings>;
const storefrontRuntimeCopy = require("../localized-app-strings/storefront-runtime-copy.json") as {
  locales: Partial<Record<StorefrontLocale, { launch?: LaunchStrings }>>;
};

export const supportedLocales = storefrontLocales;
export type SupportedLocale = StorefrontLocale;

type I18nContextValue = {
  locale: SupportedLocale;
  direction: Direction;
  isRTL: boolean;
  t: (key: string, fallback?: string) => string;
  setLocaleOverride: (locale: SupportedLocale | undefined) => void;
};

const fallbackLocale: SupportedLocale = "en-US";
const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [localeOverride, setLocaleOverride] = useState<SupportedLocale | undefined>(() =>
    normalizeLocale(readLocaleOverride())
  );
  const locale = resolveLocale(localeOverride);
  const direction = launchStringsFor(locale).direction || (isRTLStorefront(locale) ? "rtl" : "ltr");

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      direction,
      isRTL: direction === "rtl",
      t: (key, fallback) => translate(locale, key, fallback),
      setLocaleOverride
    }),
    [direction, locale, setLocaleOverride]
  );

  I18nManager.allowRTL(true);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context) return context;

  const locale = resolveLocale();
  const direction = launchStringsFor(locale).direction || (isRTLStorefront(locale) ? "rtl" : "ltr");
  return {
    locale,
    direction,
    isRTL: direction === "rtl",
    t: (key: string, fallback?: string) => translate(locale, key, fallback),
    setLocaleOverride: () => undefined
  };
}

export function translate(locale: SupportedLocale, key: string, fallback?: string) {
  const localized = valueAtPath(launchStringsFor(locale), key);
  if (typeof localized === "string" && localized.trim()) return localized;

  const fallbackValue = valueAtPath(launchStringsFor(fallbackLocale), key);
  if (typeof fallbackValue === "string" && fallbackValue.trim()) return fallbackValue;

  return fallback || key;
}

function resolveLocale(localeOverride?: SupportedLocale): SupportedLocale {
  const requested = localeOverride || normalizeLocale(readLocaleOverride()) || normalizeLocale(getRuntimeLocale());
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
  return normalizeStorefrontLocale(value);
}

function launchStringsFor(locale: SupportedLocale): LaunchStrings {
  const exact = storefrontRuntimeCopy.locales[locale]?.launch;
  if (exact) return exact;
  return launchCatalog[contentLocaleForStorefront(locale)];
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
