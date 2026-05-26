import { readFileSync } from "node:fs";

const catalog = JSON.parse(readFileSync("localized-app-strings/core-launch-strings.json", "utf8"));
const sourceFiles = {
  app: readFileSync("App.tsx", "utf8"),
  i18n: readFileSync("src/i18n.tsx", "utf8"),
  onboarding: readFileSync("src/screens/OnboardingScreen.tsx", "utf8"),
  importScreen: readFileSync("src/screens/ImportScreen.tsx", "utf8"),
  paywall: readFileSync("src/screens/UpgradeScreen.tsx", "utf8"),
  widgets: readFileSync("src/screens/MoreScreen.tsx", "utf8")
};

const requiredLocales = ["ar", "de", "en-US", "es", "fr", "hi", "ja", "ko", "pt-BR", "zh-Hans"];
const requiredKeys = [
  "brand_name",
  "brand_subtitle",
  "app.loading",
  "common.next",
  "tabs.today",
  "tabs.scan",
  "tabs.calendar",
  "tabs.classes",
  "tabs.notes",
  "tabs.focus",
  "tabs.grades",
  "tabs.widgets",
  "tabs.plus",
  "onboarding.scan_title",
  "onboarding.scan_copy",
  "onboarding.review_title",
  "onboarding.review_copy",
  "onboarding.calendar_title",
  "onboarding.calendar_copy",
  "onboarding.today_title",
  "onboarding.today_copy",
  "onboarding.classes_title",
  "onboarding.classes_copy",
  "onboarding.focus_title",
  "onboarding.focus_copy",
  "onboarding.widgets_title",
  "onboarding.widgets_copy",
  "onboarding.final_cta",
  "import.title",
  "import.subtitle",
  "import.subtitle_images",
  "import.photo_disabled_title",
  "import.photo_disabled_message",
  "import.review_work",
  "import.ready_to_add",
  "import.no_silent_import",
  "paywall.title",
  "paywall.subtitle",
  "paywall.hard_subtitle",
  "paywall.feature_scans",
  "paywall.feature_scans_detail",
  "paywall.feature_widgets",
  "paywall.feature_widgets_detail",
  "paywall.feature_focus",
  "paywall.feature_focus_detail",
  "paywall.feature_calendar",
  "paywall.feature_calendar_detail",
  "paywall.restore",
  "paywall.terms",
  "paywall.privacy",
  "errors.text_required",
  "errors.pdf_text_required",
  "errors.ocr_not_configured",
  "errors.parse_failed",
  "errors.try_again",
  "permissions.camera",
  "permissions.photo_library",
  "permissions.calendar",
  "permissions.notifications",
  "widgets.sync_after_load"
];
const sourceForKeyScan = Object.values(sourceFiles).join("\n");
const staticRuntimeKeys = Array.from(sourceForKeyScan.matchAll(/\bt\(\s*["']([a-z0-9_.-]+)["']/gi))
  .map((match) => match[1])
  .filter((key) => key.includes("."));
for (const key of staticRuntimeKeys) {
  if (!requiredKeys.includes(key)) requiredKeys.push(key);
}

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

assert(JSON.stringify(Object.keys(catalog).sort()) === JSON.stringify(requiredLocales.slice().sort()), "Catalog locale set must match the 10 launch locales.");

for (const locale of requiredLocales) {
  const strings = catalog[locale];
  assert(strings && typeof strings === "object", `${locale} catalog missing.`);
  assert(strings.direction === "ltr" || strings.direction === "rtl", `${locale} direction missing.`);
  if (locale === "ar") assert(strings.direction === "rtl", "Arabic must be marked RTL.");

  for (const key of requiredKeys) {
    const value = valueAtPath(strings, key);
    assert(typeof value === "string" && value.trim().length > 0, `${locale}.${key} missing or empty.`);
  }
}

assert(sourceFiles.app.includes("<I18nProvider>"), "App must wrap runtime UI in I18nProvider.");
assert(sourceFiles.app.includes("t(tab.labelKey)"), "Navigation labels must use runtime localization keys.");
assert(sourceFiles.onboarding.includes("useI18n") && sourceFiles.onboarding.includes("slide.titleKey"), "Onboarding must consume runtime localization keys.");
assert(sourceFiles.importScreen.includes("useI18n") && sourceFiles.importScreen.includes("import.photo_disabled_message"), "Import screen must consume runtime localization keys.");
assert(sourceFiles.paywall.includes("useI18n") && sourceFiles.paywall.includes("paywall.hard_subtitle"), "Paywall must consume runtime localization keys.");
assert(sourceFiles.widgets.includes("Native style fields"), "Widget Studio must preserve native/widget truth copy.");
assert(sourceFiles.i18n.includes("EXPO_PUBLIC_STUDYPLANNER_LOCALE"), "Localization override must exist for screenshot QA.");

if (failures.length) {
  console.error("Localization completeness failures:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("runtime localization completeness gate passed");

function valueAtPath(source, key) {
  return key.split(".").reduce((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return current[part];
  }, source);
}
