import * as StoreReview from "expo-store-review";
import { loadJson, saveJson } from "./storage";

const reviewStateKey = "study-planner-review-state-v1";

type ReviewTrigger = "import_applied" | "assignment_completed" | "focus_completed" | "widget_saved";

type ReviewPromptState = {
  promptedAt?: string;
  completedAssignments: number;
  importsApplied: number;
  focusSessionsCompleted: number;
  widgetsSaved: number;
};

const defaultState: ReviewPromptState = {
  completedAssignments: 0,
  importsApplied: 0,
  focusSessionsCompleted: 0,
  widgetsSaved: 0
};

export async function recordReviewEvent(trigger: ReviewTrigger) {
  const stored = (await loadJson<ReviewPromptState>(reviewStateKey)) || defaultState;
  const next: ReviewPromptState = {
    ...defaultState,
    ...stored,
    completedAssignments: stored.completedAssignments || 0,
    importsApplied: stored.importsApplied || 0,
    focusSessionsCompleted: stored.focusSessionsCompleted || 0,
    widgetsSaved: stored.widgetsSaved || 0
  };

  if (trigger === "assignment_completed") next.completedAssignments += 1;
  if (trigger === "import_applied") next.importsApplied += 1;
  if (trigger === "focus_completed") next.focusSessionsCompleted += 1;
  if (trigger === "widget_saved") next.widgetsSaved += 1;

  const shouldAsk = shouldRequestReview(next);
  if (shouldAsk) next.promptedAt = new Date().toISOString();
  await saveJson(reviewStateKey, next);

  if (!shouldAsk) return;

  try {
    const available = await StoreReview.isAvailableAsync();
    if (available) {
      await StoreReview.requestReview();
    }
  } catch {
    // Review prompts should never block the study flow.
  }
}

function shouldRequestReview(state: ReviewPromptState) {
  if (state.promptedAt) return false;
  return (
    state.importsApplied >= 1 ||
    state.completedAssignments >= 2 ||
    state.focusSessionsCompleted >= 1 ||
    state.widgetsSaved >= 1
  );
}
