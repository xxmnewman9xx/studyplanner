import { createHash } from "node:crypto";

export const APPEARANCE_MATRIX_SPEC = Object.freeze({
  id: "studyplanner-build81-dark-mode-v9",
  schemaVersion: 9,
  fixtureQaState: "build57",
  conditionalDeepCapturePolicy: Object.freeze({
    reason: "source-has-no-meaningful-scroll-range",
    maximumSourceMaxScrollY: 2,
    evidence: "matching-top-app-acknowledgement-v5",
  }),
  fullCoverage: Object.freeze({
    appearances: Object.freeze(["light", "dark"]),
    contentSizes: Object.freeze(["large", "accessibility-extra-large", "accessibility-extra-extra-extra-large"]),
    locales: Object.freeze(["en-US", "de", "fr", "hi", "ar"]),
  }),
  deepCoverageRequirements: Object.freeze([
    { surface: "welcome", match: { route: "welcome" }, minimumDepths: 1 },
    { surface: "onboarding-priorities", match: { onboardingIndex: 1 }, minimumDepths: 1 },
    { surface: "onboarding-build", match: { onboardingIndex: 2 }, minimumDepths: 1 },
    { surface: "import-options", match: { route: "importOptions" }, minimumDepths: 1 },
    { surface: "locked-dashboard", match: { route: "lockedDashboard" }, minimumDepths: 1 },
    { surface: "paywall", match: { route: "paywall" }, minimumDepths: 2 },
    { surface: "today", match: { route: "today", emptyContent: false }, minimumDepths: 2 },
    { surface: "classes", match: { route: "classes" }, minimumDepths: 1 },
    { surface: "scan", match: { route: "scan" }, minimumDepths: 2 },
    { surface: "plan", match: { route: "plan" }, minimumDepths: 2 },
    { surface: "profile", match: { route: "profile" }, minimumDepths: 2 },
    { surface: "tasks", match: { route: "tasks" }, minimumDepths: 1 },
    { surface: "notes", match: { route: "notes" }, minimumDepths: 1 },
    { surface: "class-detail", match: { screen: "classDetail" }, minimumDepths: 1 },
    { surface: "class-edit", match: { screen: "classEdit" }, minimumDepths: 3 },
    { surface: "task-detail", match: { screen: "taskDetail" }, minimumDepths: 1 },
    { surface: "task-edit", match: { screen: "taskEdit" }, minimumDepths: 1 },
    { surface: "assessment-detail", match: { screen: "assessmentDetail" }, minimumDepths: 1 },
    { surface: "assessment-edit", match: { screen: "assessmentEdit" }, minimumDepths: 1 },
    { surface: "note-detail", match: { screen: "noteDetail" }, minimumDepths: 2 },
    { surface: "review", match: { route: "review" }, minimumDepths: 4 },
    { surface: "success", match: { route: "success" }, minimumDepths: 1 },
    { surface: "widgets", match: { route: "widgets" }, minimumDepths: 2 },
    { surface: "reminders", match: { route: "reminders" }, minimumDepths: 1 },
    { surface: "study-session", match: { route: "studySession" }, minimumDepths: 1 },
    { surface: "today-empty", match: { route: "today", emptyContent: true }, minimumDepths: 1 },
    { surface: "terms", match: { route: "terms" }, minimumDepths: 1 },
  ].map((requirement) => Object.freeze({
    ...requirement,
    match: Object.freeze({ ...requirement.match }),
  }))),
  targets: Object.freeze([
    { key: "welcome", config: { route: "welcome", emptyPlanner: true } },
    { key: "welcome-deep", config: { route: "welcome", emptyPlanner: true }, scrollPlan: { sourceTarget: "welcome", anchor: "end" } },
    { key: "onboarding-name", config: { onboardingIndex: 0, emptyPlanner: true } },
    { key: "onboarding-priorities", config: { onboardingIndex: 1, emptyPlanner: true } },
    { key: "onboarding-priorities-deep", config: { onboardingIndex: 1, emptyPlanner: true }, scrollPlan: { sourceTarget: "onboarding-priorities", anchor: "end" } },
    { key: "onboarding-build", config: { onboardingIndex: 2, emptyPlanner: true } },
    { key: "onboarding-build-deep", config: { onboardingIndex: 2, emptyPlanner: true }, scrollPlan: { sourceTarget: "onboarding-build", anchor: "end" } },
    { key: "import-options", config: { route: "importOptions", emptyPlanner: true } },
    { key: "import-options-deep", config: { route: "importOptions", emptyPlanner: true }, scrollPlan: { sourceTarget: "import-options", anchor: "end" } },
    { key: "semester-kickoff", config: { route: "semesterKickoff" } },
    { key: "locked-dashboard", config: { route: "lockedDashboard", emptyPlanner: true } },
    { key: "locked-dashboard-deep", config: { route: "lockedDashboard", emptyPlanner: true }, scrollPlan: { sourceTarget: "locked-dashboard", anchor: "end" } },
    { key: "paywall", config: { route: "paywall", emptyPlanner: true } },
    { key: "paywall-deep-1", config: { route: "paywall", emptyPlanner: true }, scrollPlan: { sourceTarget: "paywall", anchor: "fraction", fraction: 0.5 } },
    { key: "paywall-deep-2", config: { route: "paywall", emptyPlanner: true }, scrollPlan: { sourceTarget: "paywall", anchor: "end" } },
    { key: "terms", config: { route: "terms", emptyPlanner: true } },
    { key: "terms-deep", config: { route: "terms", emptyPlanner: true }, scrollPlan: { sourceTarget: "terms", anchor: "end" } },
    { key: "privacy", config: { route: "privacy", emptyPlanner: true } },
    { key: "today", config: { route: "today", emptyContent: false } },
    { key: "today-deep-1", config: { route: "today", emptyContent: false }, scrollPlan: { sourceTarget: "today", anchor: "fraction", fraction: 0.5 } },
    { key: "today-deep-2", config: { route: "today", emptyContent: false }, scrollPlan: { sourceTarget: "today", anchor: "end" } },
    { key: "today-empty", config: { route: "today", emptyContent: true } },
    { key: "today-empty-deep", config: { route: "today", emptyContent: true }, scrollPlan: { sourceTarget: "today-empty", anchor: "end" } },
    { key: "classes", config: { route: "classes" } },
    { key: "classes-deep", config: { route: "classes" }, scrollPlan: { sourceTarget: "classes", anchor: "end" } },
    { key: "scan", config: { route: "scan" } },
    { key: "scan-deep-mid", config: { route: "scan" }, scrollPlan: { sourceTarget: "scan", anchor: "fraction", fraction: 0.5 } },
    { key: "scan-deep", config: { route: "scan" }, scrollPlan: { sourceTarget: "scan", anchor: "end" } },
    { key: "plan", config: { route: "plan" } },
    { key: "plan-deep-1", config: { route: "plan" }, scrollPlan: { sourceTarget: "plan", anchor: "fraction", fraction: 0.5 } },
    { key: "plan-deep-2", config: { route: "plan" }, scrollPlan: { sourceTarget: "plan", anchor: "end" } },
    { key: "profile", config: { route: "profile" } },
    { key: "profile-deep-1", config: { route: "profile" }, scrollPlan: { sourceTarget: "profile", anchor: "fraction", fraction: 0.5 } },
    { key: "profile-deep-2", config: { route: "profile" }, scrollPlan: { sourceTarget: "profile", anchor: "end" } },
    { key: "tasks", config: { route: "tasks" } },
    { key: "tasks-deep", config: { route: "tasks" }, scrollPlan: { sourceTarget: "tasks", anchor: "end" } },
    { key: "notes", config: { route: "notes" } },
    { key: "notes-deep", config: { route: "notes" }, scrollPlan: { sourceTarget: "notes", anchor: "end" } },
    { key: "class-detail", config: { screen: "classDetail" } },
    { key: "class-detail-deep", config: { screen: "classDetail" }, scrollPlan: { sourceTarget: "class-detail", anchor: "end" } },
    { key: "class-edit", config: { screen: "classEdit" } },
    { key: "class-edit-deep-third", config: { screen: "classEdit" }, scrollPlan: { sourceTarget: "class-edit", anchor: "fraction", fraction: 1 / 3 } },
    { key: "class-edit-deep-two-thirds", config: { screen: "classEdit" }, scrollPlan: { sourceTarget: "class-edit", anchor: "fraction", fraction: 2 / 3 } },
    { key: "class-edit-deep", config: { screen: "classEdit" }, scrollPlan: { sourceTarget: "class-edit", anchor: "end" } },
    { key: "task-detail", config: { screen: "taskDetail" } },
    { key: "task-detail-deep", config: { screen: "taskDetail" }, scrollPlan: { sourceTarget: "task-detail", anchor: "end" } },
    { key: "task-edit", config: { screen: "taskEdit" } },
    { key: "task-edit-deep", config: { screen: "taskEdit" }, scrollPlan: { sourceTarget: "task-edit", anchor: "end" } },
    { key: "assessment-detail", config: { screen: "assessmentDetail" } },
    { key: "assessment-detail-deep", config: { screen: "assessmentDetail" }, scrollPlan: { sourceTarget: "assessment-detail", anchor: "end" } },
    { key: "assessment-edit", config: { screen: "assessmentEdit" } },
    { key: "assessment-edit-deep", config: { screen: "assessmentEdit" }, scrollPlan: { sourceTarget: "assessment-edit", anchor: "end" } },
    { key: "note-detail", config: { screen: "noteDetail" } },
    { key: "note-detail-deep-mid", config: { screen: "noteDetail" }, scrollPlan: { sourceTarget: "note-detail", anchor: "fraction", fraction: 0.5 } },
    { key: "note-detail-deep", config: { screen: "noteDetail" }, scrollPlan: { sourceTarget: "note-detail", anchor: "end" } },
    { key: "scanner-aiming", config: { screen: "scannerAiming" }, appearancePolicy: "always-dark" },
    { key: "scanner-ready", config: { screen: "scannerReady" }, appearancePolicy: "always-dark" },
    { key: "paste-syllabus", config: { route: "paste" } },
    { key: "review", config: { route: "review" } },
    { key: "review-deep-quarter", config: { route: "review" }, scrollPlan: { sourceTarget: "review", anchor: "fraction", fraction: 0.25 } },
    { key: "review-deep-half", config: { route: "review" }, scrollPlan: { sourceTarget: "review", anchor: "fraction", fraction: 0.5 } },
    { key: "review-deep-three-quarter", config: { route: "review" }, scrollPlan: { sourceTarget: "review", anchor: "fraction", fraction: 0.75 } },
    { key: "review-deep", config: { route: "review" }, scrollPlan: { sourceTarget: "review", anchor: "end" } },
    { key: "success", config: { route: "success" } },
    { key: "success-deep", config: { route: "success" }, scrollPlan: { sourceTarget: "success", anchor: "end" } },
    { key: "widgets", config: { route: "widgets" } },
    { key: "widgets-deep-1", config: { route: "widgets" }, scrollPlan: { sourceTarget: "widgets", anchor: "fraction", fraction: 0.5 } },
    { key: "widgets-deep-2", config: { route: "widgets" }, scrollPlan: { sourceTarget: "widgets", anchor: "end" } },
    { key: "reminders", config: { route: "reminders" } },
    { key: "reminders-deep", config: { route: "reminders" }, scrollPlan: { sourceTarget: "reminders", anchor: "end" } },
    { key: "study-session", config: { route: "studySession" } },
    { key: "study-session-deep", config: { route: "studySession" }, scrollPlan: { sourceTarget: "study-session", anchor: "end" } },
    { key: "home-preview", config: { route: "homePreview" } },
    { key: "lock-preview", config: { route: "lockPreview" } },
    { key: "recurrence-alert", config: { screen: "taskDetail", prompt: "recurrenceScope" } },
    { key: "archive-alert", config: { screen: "classDetail", prompt: "archiveClass" } },
  ].map((target) => Object.freeze({
    ...target,
    config: Object.freeze({ ...target.config }),
    scrollPlan: target.scrollPlan ? Object.freeze({ ...target.scrollPlan }) : null,
    appearancePolicy: target.appearancePolicy || "themed",
  }))),
});

export const APPEARANCE_MATRIX_SPEC_SHA256 = createHash("sha256")
  .update(JSON.stringify(APPEARANCE_MATRIX_SPEC))
  .digest("hex");

export const APPEARANCE_MATRIX_TARGETS_BY_KEY = new Map(
  APPEARANCE_MATRIX_SPEC.targets.map((target) => [target.key, target]),
);

export function canonicalRouteConfig(target, { locale, appearance }) {
  return {
    ...target.config,
    qaState: APPEARANCE_MATRIX_SPEC.fixtureQaState,
    locale,
    appearanceMode: appearance,
  };
}

export function expectedMountedRouteForTarget(target) {
  const config = target.config;
  if (config.screen === "scannerAiming" || config.screen === "scannerReady") return "cameraScanner";
  if (config.route === "review") return "review";
  if (config.screen === "classEdit" || config.screen === "classDetail" || config.prompt === "archiveClass") return "classDetail";
  if (config.screen === "taskEdit" || config.screen === "taskDetail" || config.prompt === "recurrenceScope") return "taskDetail";
  if (config.screen === "assessmentEdit" || config.screen === "assessmentDetail") return "assessmentDetail";
  if (config.screen === "noteDetail") return "noteDetail";
  if (config.onboardingIndex != null) return "onboarding";
  if (config.route) return config.route;
  if (config.tab === "import") return "scan";
  if (config.tab === "courses") return "classes";
  if (config.tab === "plan" || config.tab === "focus") return "plan";
  if (config.tab === "more") return "widgets";
  if (config.tab === "subscribe") return "paywall";
  return "today";
}

export function captureScrollYForTarget(target, sourceAcknowledgement) {
  if (!target.scrollPlan) return 0;
  const maxScrollY = Number(sourceAcknowledgement?.maxScrollY);
  if (!Number.isFinite(maxScrollY) || maxScrollY < 0) {
    throw new Error(`${target.key}: source target ${target.scrollPlan.sourceTarget} has invalid scroll geometry`);
  }
  if (conditionalDeepCaptureSkipReason(target, sourceAcknowledgement)) {
    throw new Error(`${target.key}: source target ${target.scrollPlan.sourceTarget} has no meaningful scroll range`);
  }
  if (target.scrollPlan.anchor === "end") return Math.floor(maxScrollY);
  if (target.scrollPlan.anchor === "fraction") {
    const fraction = Number(target.scrollPlan.fraction);
    const requestedScrollY = Math.round(maxScrollY * fraction);
    if (!Number.isFinite(fraction) || fraction <= 0 || fraction >= 1 || requestedScrollY <= 1 || requestedScrollY >= maxScrollY - 1) {
      throw new Error(`${target.key}: fraction plan does not produce a distinct in-range scroll position`);
    }
    return requestedScrollY;
  }
  throw new Error(`${target.key}: unsupported scroll anchor ${target.scrollPlan.anchor}`);
}

export function conditionalDeepCaptureSkipReason(target, sourceAcknowledgement) {
  if (!target?.scrollPlan) return null;
  const maxScrollY = Number(sourceAcknowledgement?.maxScrollY);
  if (!Number.isFinite(maxScrollY) || maxScrollY < 0) {
    throw new Error(`${target.key}: source target ${target.scrollPlan.sourceTarget} has invalid scroll geometry`);
  }
  return maxScrollY <= APPEARANCE_MATRIX_SPEC.conditionalDeepCapturePolicy.maximumSourceMaxScrollY
    ? APPEARANCE_MATRIX_SPEC.conditionalDeepCapturePolicy.reason
    : null;
}

export function hasExactMembers(actual, expected) {
  return actual.length === expected.length && expected.every((value) => actual.includes(value));
}

export function isFullCoverageSelection({ targetKeys, appearances, contentSizes, locales }) {
  return hasExactMembers(targetKeys, APPEARANCE_MATRIX_SPEC.targets.map((target) => target.key))
    && hasExactMembers(appearances, APPEARANCE_MATRIX_SPEC.fullCoverage.appearances)
    && hasExactMembers(contentSizes, APPEARANCE_MATRIX_SPEC.fullCoverage.contentSizes)
    && hasExactMembers(locales, APPEARANCE_MATRIX_SPEC.fullCoverage.locales);
}
