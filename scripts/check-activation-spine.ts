import { readFileSync } from "node:fs";
import { resolveInitialRoute } from "../src/activation";
import { buildSemesterSnapshot, hasRealSemesterData } from "../src/intelligence";
import { defaultData } from "../src/seed";
import type { AppData, ImportBatch } from "../src/types";

const failures: string[] = [];

function expect(condition: unknown, message: string) {
  if (!condition) failures.push(message);
}

const pendingDraft: ImportBatch = {
  id: "draft_1",
  sourceName: "Syllabus.pdf",
  sourceText: "Course syllabus with deadlines",
  createdAt: new Date().toISOString(),
  status: "review",
  candidates: [
    {
      id: "candidate_1",
      kind: "class",
      title: "BIO 101",
      meta: "Imported class",
      confidence: 0.95,
      approved: true,
      payload: {
        id: "bio",
        code: "BIO 101",
        name: "Biology",
        professor: "Professor TBD",
        room: "Room TBD",
        days: "Mon Wed",
        time: "9:00 AM",
        next: "Next class",
        health: 0.8,
        grade: "Not set",
        color: "#0A84FF",
        color2: "#30D158",
        icon: "book-open",
      },
    },
  ],
};

const fresh = defaultData;
expect(resolveInitialRoute({ hasCompletedOnboarding: false }) === "onboarding", "fresh install must start at onboarding");
expect(resolveInitialRoute({ hasCompletedOnboarding: false, pendingImportDraft: pendingDraft }) === "onboarding", "onboarding must outrank pending imports");
expect(resolveInitialRoute({ hasCompletedOnboarding: true, pendingImportDraft: pendingDraft }) === "reviewPendingImport", "completed onboarding with pending import must restore review");
expect(resolveInitialRoute({ hasCompletedOnboarding: true }) === "dashboard", "completed onboarding without pending import must reach dashboard");

const emptySnapshot = buildSemesterSnapshot(fresh);
expect(!hasRealSemesterData(fresh), "defaultData must not contain real semester data");
expect(emptySnapshot.semesterHealth.overallScore === 0, "empty semester health score must be 0");
expect(
  Object.values(emptySnapshot.semesterHealth.dimensions).every((dimension) => dimension.score === 0),
  "empty semester dimensions must all be 0"
);
expect(emptySnapshot.semesterHealth.nextBestAction === "Scan syllabus", "empty semester next action must be Scan syllabus");

const realSemester: AppData = {
  ...defaultData,
  prefs: { ...defaultData.prefs, onboardingComplete: true },
  classes: [
    {
      id: "bio",
      code: "BIO 101",
      name: "Biology",
      professor: "Professor TBD",
      room: "Room TBD",
      days: "Mon Wed",
      time: "9:00 AM",
      next: "Next class",
      health: 0.86,
      grade: "B+",
      color: "#0A84FF",
      color2: "#30D158",
      icon: "book-open",
    },
  ],
};
const realSnapshot = buildSemesterSnapshot(realSemester);
expect(hasRealSemesterData(realSemester), "real semester guard must recognize classes");
expect(realSnapshot.semesterHealth.overallScore > 0, "real semester must not be forced to 0");

const appSource = readFileSync("App.tsx", "utf8");
const intelligenceSource = readFileSync("src/intelligence.ts", "utf8");
expect(appSource.includes("resolveInitialRouteForData"), "App bootstrap must use the explicit initial route helper");
expect(appSource.includes('if (!onboardingComplete(data)) return active === "semesterKickoff" ? "preview_allowed" : "onboarding";'), "access state must prioritize onboarding while allowing the approved event landing page to explain itself before setup");
expect(!/function premiumData[\s\S]{0,260}onboardingComplete:\s*true/.test(appSource), "premiumData must not imply onboarding completion");
expect(!appSource.includes("maybeShowUnlockSuccess"), "verified entitlement changes must not interrupt navigation with a redundant unlock alert");
expect(!appSource.includes("lastUnlockSuccessAlertAt"), "the removed unlock alert throttle must not remain as dead startup state");
expect(appSource.includes('if (Platform.OS === "web" || !loaded || !data || entitlementStatus === "loading") return;'), "notification routing must wait for the entitlement decision before opening a destination or paywall");
expect(appSource.includes('if (loaded && data && entitlementStatus !== "loading")'), "startup persistence and widget sync must wait for the entitlement decision");
expect(appSource.includes("Build your semester first."), "empty dashboard must use the required copy");
expect(appSource.includes("Paste text") && appSource.includes("Upload PDF"), "empty dashboard must expose paste and PDF CTAs");
expect(intelligenceSource.includes("hasRealSemesterData"), "health guard must live in intelligence layer");
expect(!/knownForecastCount \? avgForecast - unknownForecasts \* 2 : Math\.max\(78, avgForecast\)[\s\S]{0,240}overallScore/.test(intelligenceSource), "empty guard must precede legacy health fallbacks");

const fakeValues = [81, 78, 62, 82, 100];
const emptyScores = [
  emptySnapshot.semesterHealth.overallScore,
  ...Object.values(emptySnapshot.semesterHealth.dimensions).map((dimension) => dimension.score),
];
expect(fakeValues.every((value) => !emptyScores.includes(value)), "empty semester must not produce leaked prototype values");

if (failures.length) {
  console.error("Activation spine checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Activation spine checks passed.");
