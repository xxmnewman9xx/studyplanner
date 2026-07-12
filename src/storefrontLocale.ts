export const storefrontLocales = [
  "ar-SA",
  "de-DE",
  "en-AU",
  "en-CA",
  "en-GB",
  "en-US",
  "es-ES",
  "es-MX",
  "fr-CA",
  "fr-FR",
  "hi",
  "ja",
  "ko",
  "pt-BR",
  "pt-PT",
  "zh-Hans",
  "zh-Hant",
] as const;

export type StorefrontLocale = typeof storefrontLocales[number];

export const contentLocales = [
  "ar",
  "de",
  "en-US",
  "es",
  "fr",
  "hi",
  "ja",
  "ko",
  "pt-BR",
  "zh-Hans",
] as const;

export type ContentLocale = typeof contentLocales[number];

const storefrontByLowercase = new Map(
  storefrontLocales.map((locale) => [locale.toLowerCase(), locale] as const)
);

const contentLocaleByStorefront: Record<StorefrontLocale, ContentLocale> = {
  "ar-SA": "ar",
  "de-DE": "de",
  "en-AU": "en-US",
  "en-CA": "en-US",
  "en-GB": "en-US",
  "en-US": "en-US",
  "es-ES": "es",
  "es-MX": "es",
  "fr-CA": "fr",
  "fr-FR": "fr",
  hi: "hi",
  ja: "ja",
  ko: "ko",
  "pt-BR": "pt-BR",
  "pt-PT": "pt-BR",
  "zh-Hans": "zh-Hans",
  "zh-Hant": "zh-Hans",
};

export function normalizeStorefrontLocale(value?: string): StorefrontLocale | undefined {
  const normalized = value?.trim().replace(/_/g, "-");
  if (!normalized) return undefined;

  const lower = normalized.toLowerCase();
  const exact = storefrontByLowercase.get(lower);
  if (exact) return exact;

  const parts = lower.split("-").filter(Boolean);
  const language = parts[0];
  const region = parts.slice(1).find((part) => /^[a-z]{2}$/.test(part));
  const script = parts.slice(1).find((part) => /^[a-z]{4}$/.test(part));

  switch (language) {
    case "ar": return "ar-SA";
    case "de": return "de-DE";
    case "en":
      if (region === "au") return "en-AU";
      if (region === "ca") return "en-CA";
      if (region === "gb") return "en-GB";
      return "en-US";
    case "es": return region === "mx" ? "es-MX" : "es-ES";
    case "fr": return region === "ca" ? "fr-CA" : "fr-FR";
    case "hi": return "hi";
    case "ja": return "ja";
    case "ko": return "ko";
    case "pt": return region === "pt" ? "pt-PT" : "pt-BR";
    case "zh":
      if (script === "hant" || region === "tw" || region === "hk" || region === "mo") return "zh-Hant";
      return "zh-Hans";
    default: return undefined;
  }
}

export function contentLocaleForStorefront(locale: StorefrontLocale): ContentLocale {
  return contentLocaleByStorefront[locale];
}

export function isRTLStorefront(locale: StorefrontLocale) {
  return locale === "ar-SA";
}

type ParsedClock = { hour: number; minute: number };

function parsePlannerClock(value: string): ParsedClock | undefined {
  const twelveHour = /^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i.exec(value.trim());
  if (twelveHour) {
    const rawHour = Number(twelveHour[1]);
    if (rawHour < 1 || rawHour > 12) return undefined;
    const period = twelveHour[3].toUpperCase();
    return {
      hour: (rawHour % 12) + (period === "PM" ? 12 : 0),
      minute: Number(twelveHour[2]),
    };
  }

  const twentyFourHour = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!twentyFourHour) return undefined;
  return { hour: Number(twentyFourHour[1]), minute: Number(twentyFourHour[2]) };
}

export function formatPlannerTime(value: string, locale: StorefrontLocale) {
  const parsed = parsePlannerClock(value);
  if (!parsed) return value;
  const date = new Date(Date.UTC(2026, 0, 1, parsed.hour, parsed.minute));
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function formatPlannerTimeRange(value: string, locale: StorefrontLocale) {
  const parts = value.split(/\s+(?:-|–|—)\s+/);
  if (parts.length !== 2) return formatPlannerTime(value, locale);
  return `${formatPlannerTime(parts[0], locale)} – ${formatPlannerTime(parts[1], locale)}`;
}
