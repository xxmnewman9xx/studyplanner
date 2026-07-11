import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  semesterKickoffPhase,
  semesterKickoffProgress,
} from "../src/semesterKickoff";
import type { AppData } from "../src/types";

assert.equal(semesterKickoffPhase(new Date(2026, 7, 23, 12)), "upcoming");
assert.equal(semesterKickoffPhase(new Date(2026, 7, 24, 12)), "live");
assert.equal(semesterKickoffPhase(new Date(2026, 7, 31, 12)), "live");
assert.equal(semesterKickoffPhase(new Date(2026, 8, 1, 12)), "ended");

const empty: Pick<AppData, "imports" | "tasks" | "exams" | "studyBlocks"> = {
  imports: [],
  tasks: [],
  exams: [],
  studyBlocks: [],
};
assert.deepEqual(semesterKickoffProgress(empty), {
  importComplete: false,
  deadlinesReviewed: false,
  focusComplete: false,
  completedCount: 0,
  totalCount: 3,
  isComplete: false,
});

const applied = {
  ...empty,
  imports: [{ id: "event-import", sourceName: "Syllabus", sourceText: "Class", createdAt: "2026-08-24T12:00:00Z", status: "applied" as const, candidates: [] }],
};
assert.equal(semesterKickoffProgress(applied).importComplete, true);
assert.equal(semesterKickoffProgress(applied).deadlinesReviewed, false);

const reviewed = {
  ...applied,
  tasks: [{ dueDate: "2026-09-03" }] as AppData["tasks"],
};
assert.equal(semesterKickoffProgress(reviewed).deadlinesReviewed, true);
assert.equal(semesterKickoffProgress(reviewed).focusComplete, false);
assert.equal(semesterKickoffProgress({ ...applied, tasks: [{ dueDate: "2026-02-30" }] as AppData["tasks"] }).deadlinesReviewed, false);

const completed = {
  ...reviewed,
  studyBlocks: [{ completed: true }] as AppData["studyBlocks"],
};
assert.equal(semesterKickoffProgress(completed).focusComplete, true);
assert.equal(semesterKickoffProgress(completed).isComplete, true);

const appSource = readFileSync("App.tsx", "utf8");
assert(appSource.includes('| "semesterKickoff"'));
assert(appSource.includes('if (routeTokens.has("import")) return "semesterKickoff";'));
assert(appSource.includes('displayRoute === "semesterKickoff" ? <SemesterKickoff'));
assert(appSource.includes('"semesterKickoff"') && appSource.includes("PRE_PURCHASE_ROUTES"));
assert(appSource.includes("semesterKickoffProgress(data)") && appSource.includes("semesterKickoffPhase()"));
assert(appSource.includes('active === "semesterKickoff" ? "preview_allowed" : "onboarding"'));
assert(appSource.includes('nav.push("onboarding", { returnTo: "semesterKickoff" })'));
assert(appSource.includes('params.returnTo === "semesterKickoff"') && appSource.includes("nav.back()"));
const eventCopy = appSource.slice(appSource.indexOf("const SEMESTER_KICKOFF_COPY"), appSource.indexOf("const APP_COPY"));
for (const locale of ["ar", "de", "en-US", "es", "fr", "hi", "ja", "ko", "pt-BR", "zh-Hans"]) {
  assert(eventCopy.includes(locale === "en-US" || locale === "pt-BR" || locale === "zh-Hans" ? `"${locale}": {` : `${locale}: {`), `${locale} event copy missing`);
}

console.log("Semester Kickoff event route, dates, truthful progress, and completion checks passed.");
