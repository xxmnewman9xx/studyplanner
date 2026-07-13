import { readFileSync } from "node:fs";

const core = JSON.parse(readFileSync("localized-app-strings/core-launch-strings.json", "utf8"));
const storefront = JSON.parse(readFileSync("localized-app-strings/storefront-runtime-copy.json", "utf8"));
const storefrontLocales = ["ar-SA", "de-DE", "en-AU", "en-CA", "en-GB", "en-US", "es-ES", "es-MX", "fr-CA", "fr-FR", "hi", "ja", "ko", "pt-BR", "pt-PT", "zh-Hans", "zh-Hant"];
const contentLocale = {
  "ar-SA": "ar", "de-DE": "de", "en-AU": "en-US", "en-CA": "en-US", "en-GB": "en-US", "en-US": "en-US",
  "es-ES": "es", "es-MX": "es", "fr-CA": "fr", "fr-FR": "fr", hi: "hi", ja: "ja", ko: "ko",
  "pt-BR": "pt-BR", "pt-PT": "pt-BR", "zh-Hans": "zh-Hans", "zh-Hant": "zh-Hans"
};
const exact = new Set(["pt-PT", "zh-Hant"]);
const criticalNativeKeys = [
  "locked_headline", "unlock_studyplanner", "empty_headline", "add_syllabus", "days_metric", "due_today_headline",
  "open_today", "review", "heavy_day_insight", "peak_count", "seven_day_workload", "no_next_assignment", "open_class"
];
const weekdayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const failures = [];

for (const locale of storefrontLocales) {
  const source = exact.has(locale) ? storefront.locales?.[locale]?.launch : core[contentLocale[locale]];
  for (const key of criticalNativeKeys) {
    if (!source?.widget?.native?.[key]?.trim()) failures.push(`${locale}: widget.native.${key}`);
  }
  for (const key of weekdayKeys) {
    if (!source?.widget?.weekday?.[key]?.trim()) failures.push(`${locale}: widget.weekday.${key}`);
  }
  if (!source?.widget?.native?.days_metric?.includes("{count}")) failures.push(`${locale}: days_metric must preserve {count}`);
  if (!source?.widget?.native?.heavy_day_insight?.includes("{day}")) failures.push(`${locale}: heavy_day_insight must preserve {day}`);
}

if (failures.length) {
  console.error("Build 86 widget localization checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Build 86 widget localization checks passed (17 storefronts, localized Week/Class labels, placeholder parity)." );
