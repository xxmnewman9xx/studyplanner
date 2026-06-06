import { readFileSync } from "node:fs";

const read = (file) => readFileSync(file, "utf8");
const appSource = read("App.tsx");
const widgetSource = read("src/widgetEngine.ts");
const iapSource = read("src/iap.ts");

const checks = [
  {
    name: "fresh deep links cannot complete onboarding",
    pass:
      appSource.includes("if (!onboardingComplete(data))") &&
      appSource.includes('setStack([{ route: "welcome" }]') &&
      !/routeUrl[\s\S]{0,900}onboardingComplete:\s*true/.test(appSource),
  },
  {
    name: "route matching tokenizes URLs instead of substring-matching studyplanner",
    pass:
      appSource.includes("function routeTokensFromUrl") &&
      appSource.includes("const routeTokens = routeTokensFromUrl(rawUrl)") &&
      appSource.includes("function routeFromUrl") &&
      !appSource.includes('target.includes("plan")') &&
      !appSource.includes('url.includes("calendar") || url.includes("plan")'),
  },
  {
    name: "centralized app access lock separates onboarding from premium",
    pass:
      appSource.includes("function appAccessLocked") &&
      appSource.includes("onboardingComplete(data) && !entitlementUnlocks(data, entitlementStatus)") &&
      appSource.includes('return "lockedDashboard"') &&
      appSource.includes("lockUnvalidatedPremium"),
  },
  {
    name: "no entitlement means no active app routes",
    pass:
      appSource.includes("if (!entitlementUnlocks(data, entitlementStatus))") &&
      appSource.includes('setStack([{ route: "lockedDashboard" }]') &&
      appSource.includes('const showTabs = entitlementUnlocks(data, entitlementStatus)'),
  },
  {
    name: "locked widget sync sends empty planner data",
    pass:
      appSource.includes("function lockedWidgetData") &&
      appSource.includes("classes: []") &&
      appSource.includes("tasks: []") &&
      appSource.includes("exams: []") &&
      appSource.includes("notes: []") &&
      appSource.includes("const widgetSyncData = appAccessLocked") &&
      widgetSource.includes("const locked = !data.prefs.premium") &&
      widgetSource.includes("progress: 0"),
  },
  {
    name: "local premium cache cannot unlock without store validation",
    pass:
      appSource.includes("lockUnvalidatedPremium(stored)") &&
      appSource.includes('setEntitlementStatus("active")') &&
      iapSource.includes("getActiveSubscriptions([...STUDYPLANNER_SUBSCRIPTION_IDS])"),
  },
];

const failed = checks.filter((check) => !check.pass);

if (failed.length) {
  console.error("Hard paywall app-gate checks failed:");
  failed.forEach((check) => console.error(`- ${check.name}`));
  process.exit(1);
}

console.log("Hard paywall app-gate checks passed.");
