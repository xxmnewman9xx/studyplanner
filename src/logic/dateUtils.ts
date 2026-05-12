const dateKeyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dayMs = 24 * 60 * 60 * 1000;
const mondayStartRegions = new Set([
  "AD",
  "AL",
  "AM",
  "AR",
  "AT",
  "AU",
  "BE",
  "BG",
  "BR",
  "CH",
  "CL",
  "CN",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GB",
  "GR",
  "HR",
  "HU",
  "IE",
  "IS",
  "IT",
  "JP",
  "KR",
  "LI",
  "LT",
  "LU",
  "LV",
  "MC",
  "NL",
  "NO",
  "NZ",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
  "TR",
  "UA"
]);
const saturdayStartRegions = new Set([
  "AE",
  "AF",
  "BH",
  "DJ",
  "DZ",
  "EG",
  "IQ",
  "IR",
  "JO",
  "KW",
  "LY",
  "OM",
  "QA",
  "SD",
  "SY",
  "YE"
]);

export function isValidDateKey(value?: string | null): value is string {
  if (!value) return false;
  const match = dateKeyPattern.exec(value.trim());
  if (!match) return false;

  const [, yearValue, monthValue, dayValue] = match;
  return Boolean(formatDateKey(Number(yearValue), Number(monthValue), Number(dayValue)));
}

export function isValidTime(value?: string | null): value is string {
  if (!value) return false;
  return timePattern.test(value.trim());
}

export function formatDateKey(year: number, month: number, day: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return undefined;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function makeDueAt(dateKey: string, time = "23:59") {
  const normalizedDate = dateKey.trim();
  const normalizedTime = time.trim();
  if (!isValidDateKey(normalizedDate) || !isValidTime(normalizedTime)) return undefined;
  return `${normalizedDate}T${normalizedTime}:00`;
}

export function normalizeDueAt(value?: string | null, fallbackTime = "23:59") {
  if (!value) return undefined;
  const trimmed = value.trim();
  const dateKey = dateKeyFromValue(trimmed);
  if (!dateKey) return undefined;

  const timeMatch = /T(\d{2}:\d{2})/.exec(trimmed);
  const time = timeMatch && isValidTime(timeMatch[1]) ? timeMatch[1] : fallbackTime;
  return makeDueAt(dateKey, time);
}

export function dateKeyFromValue(value?: string | null) {
  if (!value) return undefined;
  const trimmed = value.trim();
  const keyMatch = dateKeyPattern.exec(trimmed.slice(0, 10));
  if (keyMatch && isValidDateKey(keyMatch[0])) return keyMatch[0];
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return undefined;

  const date = new Date(trimmed);
  if (!isValidDate(date)) return undefined;
  return toDateKey(date);
}

export function parseValidDate(value?: string | null) {
  if (!value) return undefined;
  const dateKey = dateKeyFromValue(value);
  if (!dateKey) return undefined;

  if (dateKey === value.trim()) {
    return parseDateOnlyAsLocal(dateKey);
  }

  const parsed = new Date(value);
  return isValidDate(parsed) ? parsed : parseDateOnlyAsLocal(dateKey);
}

export function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDaysLocal(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function daysBetweenDateKeys(dateKey: string, now = new Date()) {
  const dueUtc = utcMiddayFromDateKey(dateKey);
  const nowKey = toDateKey(now);
  const startUtc = utcMiddayFromDateKey(nowKey);
  return Math.round((dueUtc - startUtc) / dayMs);
}

export function formatShortDateSafe(
  value: string,
  fallback = "Date needs check",
  locale = getPreferredLocale()
) {
  const parsed = parseValidDate(value);
  if (!parsed) return fallback;

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(parsed);
}

export function formatDateOnlySafe(
  value: string,
  fallback = "Date needs check",
  locale = getPreferredLocale()
) {
  const dateKey = dateKeyFromValue(value);
  if (!dateKey) return fallback;

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parseDateOnlyAsLocal(dateKey));
}

export function getPreferredLocale() {
  return Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
}

export function getWeekStartsOn(locale = getPreferredLocale()) {
  const localeWeekInfo = weekInfoForLocale(locale);
  if (typeof localeWeekInfo === "number") return localeWeekInfo;

  const region = regionFromLocale(locale);
  if (region && mondayStartRegions.has(region)) return 1;
  if (region && saturdayStartRegions.has(region)) return 6;
  return 0;
}

export function weekOffsetFromStart(date: Date, weekStartsOn = getWeekStartsOn()) {
  const normalizedStart = ((weekStartsOn % 7) + 7) % 7;
  return (date.getDay() - normalizedStart + 7) % 7;
}

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function parseDateOnlyAsLocal(value: string) {
  const match = dateKeyPattern.exec(value);
  if (!match) return new Date(value);

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function weekInfoForLocale(locale: string) {
  try {
    const LocaleCtor = (Intl as unknown as {
      Locale?: new (value: string) => {
        weekInfo?: { firstDay?: number };
        getWeekInfo?: () => { firstDay?: number };
      };
    }).Locale;
    const localeInstance = LocaleCtor ? new LocaleCtor(locale) : undefined;
    const weekInfo = localeInstance?.weekInfo || localeInstance?.getWeekInfo?.();
    const firstDay = weekInfo?.firstDay;
    if (firstDay === 7) return 0;
    if (typeof firstDay === "number" && firstDay >= 1 && firstDay <= 6) return firstDay;
  } catch {
    return undefined;
  }

  return undefined;
}

function regionFromLocale(locale: string) {
  const regionMatch = /[-_]([A-Za-z]{2}|\d{3})(?:[-_]|$)/.exec(locale);
  return regionMatch?.[1]?.toUpperCase();
}

function utcMiddayFromDateKey(value: string) {
  const match = dateKeyPattern.exec(value);
  if (!match) return Number.NaN;

  const [, year, month, day] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day), 12);
}

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}
