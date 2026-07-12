import assert from "node:assert/strict";
import fs from "node:fs";
import {
  contentLocaleForStorefront,
  formatPlannerTime,
  formatPlannerTimeRange,
  isRTLStorefront,
  normalizeStorefrontLocale,
  storefrontLocales,
  type StorefrontLocale,
} from "../src/storefrontLocale";

const expectedLocales = [
  "ar-SA", "de-DE", "en-AU", "en-CA", "en-GB", "en-US", "es-ES", "es-MX",
  "fr-CA", "fr-FR", "hi", "ja", "ko", "pt-BR", "pt-PT", "zh-Hans", "zh-Hant",
] as const;

assert.deepEqual(storefrontLocales, expectedLocales, "runtime storefront locale order must match the 17 ASC locales");
assert.equal(new Set(storefrontLocales).size, 17, "storefront locales must be unique");

for (const locale of expectedLocales) {
  assert.equal(normalizeStorefrontLocale(locale), locale, `${locale} must round-trip exactly`);
  assert.equal(normalizeStorefrontLocale(locale.replace(/-/g, "_")), locale, `${locale} underscore alias must normalize exactly`);
}

const aliases: Record<string, StorefrontLocale> = {
  ar: "ar-SA",
  de: "de-DE",
  "en-NZ": "en-US",
  "es-AR": "es-ES",
  "fr-BE": "fr-FR",
  pt: "pt-BR",
  "pt-PT-x-store": "pt-PT",
  zh: "zh-Hans",
  "zh-CN": "zh-Hans",
  "zh-SG": "zh-Hans",
  "zh-TW": "zh-Hant",
  "zh-HK": "zh-Hant",
  "zh-Hant-TW": "zh-Hant",
};

for (const [input, expected] of Object.entries(aliases)) {
  assert.equal(normalizeStorefrontLocale(input), expected, `${input} must resolve to ${expected}`);
}
assert.equal(normalizeStorefrontLocale("it-IT"), undefined, "unsupported languages must not silently masquerade as English");
assert.notEqual(normalizeStorefrontLocale("pt-PT"), normalizeStorefrontLocale("pt-BR"), "European and Brazilian Portuguese must stay distinct");
assert.notEqual(normalizeStorefrontLocale("zh-Hant"), normalizeStorefrontLocale("zh-Hans"), "Traditional and Simplified Chinese must stay distinct");

assert.equal(contentLocaleForStorefront("pt-PT"), "pt-BR", "pt-PT uses its materialized exact overlay over the Portuguese base catalog");
assert.equal(contentLocaleForStorefront("zh-Hant"), "zh-Hans", "zh-Hant uses its materialized exact overlay over the Chinese base catalog");
assert.equal(contentLocaleForStorefront("en-GB"), "en-US");
assert.equal(contentLocaleForStorefront("fr-CA"), "fr");
assert.equal(isRTLStorefront("ar-SA"), true);
assert.equal(isRTLStorefront("en-US"), false);

assert.match(formatPlannerTime("10:00 AM", "en-US"), /10:00\s*AM/i);
assert.equal(formatPlannerTime("10:00 AM", "en-GB"), "10:00");
assert.equal(formatPlannerTime("1:30 PM", "de-DE"), "13:30");
assert.notEqual(formatPlannerTime("10:00 AM", "ar-SA"), "10:00 AM");
assert.notEqual(formatPlannerTime("10:00 AM", "ja"), "10:00 AM");
assert.equal(formatPlannerTime("not-a-time", "fr-FR"), "not-a-time");
assert.equal(formatPlannerTimeRange("4:30 PM - 5:15 PM", "en-GB"), "16:30 – 17:15");

const runtimeCopy = JSON.parse(fs.readFileSync("localized-app-strings/storefront-runtime-copy.json", "utf8"));
const launchCopy = JSON.parse(fs.readFileSync("localized-app-strings/core-launch-strings.json", "utf8"));
const appConfig = JSON.parse(fs.readFileSync("app.json", "utf8")).expo;
const localizationPlugin = appConfig.plugins.find(
  (entry: unknown) => Array.isArray(entry) && entry[0] === "expo-localization"
);
assert.equal(appConfig.extra?.supportsRTL, true, "Expo native builds must opt into RTL layout");
assert.deepEqual(
  localizationPlugin?.[1]?.supportedLocales?.ios,
  expectedLocales,
  "expo-localization must declare the same 17 exact iOS locales"
);
assert.deepEqual(
  Object.keys(appConfig.locales).sort(),
  [...expectedLocales].sort(),
  "localized native metadata must cover the same 17 exact iOS locales"
);
assert.deepEqual(Object.keys(runtimeCopy.locales).sort(), ["pt-PT", "zh-Hant"], "only the two distinct-script/dialect overlays should be materialized");
for (const locale of ["pt-PT", "zh-Hant"] as const) {
  const exact = runtimeCopy.locales[locale];
  assert.ok(Object.keys(exact.app).length >= 650, `${locale} app copy must be an exact full snapshot`);
  assert.ok(Object.keys(exact.preview).length >= 40, `${locale} preview fixture must be exact`);
  assert.ok(Object.keys(exact.fixture).length >= 26, `${locale} capture fixture labels must be exact`);
  assert.equal(typeof exact.launch.direction, "string", `${locale} launch copy must be materialized`);
}
assert.equal(runtimeCopy.locales["pt-PT"].app["common.save"], "Guardar");
assert.notEqual(runtimeCopy.locales["zh-Hant"].launch.brand_subtitle, launchCopy["zh-Hans"].brand_subtitle);

const appSource = fs.readFileSync("App.tsx", "utf8");
const i18nSource = fs.readFileSync("src/i18n.tsx", "utf8");
assert.ok(!/OpenCC|storeVariantText|storeLocaleVariant|europeanPortuguese/.test(appSource), "runtime copy must not use language transforms");
assert.ok(!/lower\.startsWith\("pt"\)|lower\.startsWith\("zh"\)/.test(appSource + i18nSource), "pt-PT and zh-Hant must not collapse through prefix fallbacks");
assert.ok(!/toLocale(?:Date|Time)String\(appLocale\(\)/.test(appSource), "dates and times must use the exact storefront locale");
assert.match(appSource, /resolvedLocale:\s*storefrontLocale\(\)/, "capture readback must report the exact storefront locale");
assert.match(appSource, /localizedDueAtLabel\(snapshot\.nearestDeadline\.dueAt\)/, "Today capture must not render the English intelligence due label");
assert.match(appSource, /formatPlannerTime\(task\.time, storefrontLocale\(\)\)/, "task fixture times must be localized at render time");
assert.match(appSource, /readablePlannerTimeRange\(firstBlock\.time\)/, "focus fixture ranges must be localized at render time");

console.log("17-storefront runtime locale gate passed");
