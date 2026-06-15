import { Linking } from "react-native";
import { loadJson, saveJson } from "./storage";

const reviewStateKey = "study-planner-review-state-v1";
const feedbackEmail = "xxmnewman9xx@gmail.com";

type ReviewTrigger = "import_applied" | "assignment_completed" | "focus_completed" | "widget_saved";
export type { ReviewTrigger };
export type ReviewRating = 1 | 2 | 3 | 4 | 5;
export type ReviewRouteDestination = "feedback" | "app_store";

export type ReviewRoute = {
  rating: ReviewRating;
  destination: ReviewRouteDestination;
  feedbackUrl?: string;
  shouldRequestStoreReview: boolean;
};

export type ReviewFeedbackCopy = {
  subject: string;
  body: string;
};

export type ReviewEventResult = {
  shouldPrompt: boolean;
  promptedAt?: string;
};

type ReviewPromptState = {
  promptedAt?: string;
  pendingRatingPromptAt?: string;
  lastRating?: ReviewRating;
  lastRoute?: ReviewRouteDestination;
  routedToFeedbackAt?: string;
  requestedStoreReviewAt?: string;
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

export async function recordReviewEvent(trigger: ReviewTrigger): Promise<ReviewEventResult> {
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
  if (shouldAsk) {
    const now = new Date().toISOString();
    next.promptedAt = now;
    next.pendingRatingPromptAt = now;
  }
  await saveJson(reviewStateKey, next);
  return { shouldPrompt: shouldAsk, promptedAt: next.pendingRatingPromptAt };
}

export function routeReviewRating(rating: ReviewRating): ReviewRoute {
  if (rating < 5) {
    return {
      rating,
      destination: "feedback",
      feedbackUrl: feedbackUrlForRating(rating),
      shouldRequestStoreReview: false
    };
  }

  return {
    rating,
    destination: "app_store",
    shouldRequestStoreReview: true
  };
}

export async function submitReviewRating(rating: ReviewRating, feedbackCopy?: ReviewFeedbackCopy) {
  const route = routeReviewRating(rating);
  const stored = (await loadJson<ReviewPromptState>(reviewStateKey)) || defaultState;
  const next: ReviewPromptState = {
    ...defaultState,
    ...stored,
    lastRating: rating,
    lastRoute: route.destination,
    pendingRatingPromptAt: undefined
  };

  try {
    if (route.destination === "feedback") {
      const feedbackUrl = feedbackUrlForRating(rating, feedbackCopy);
      next.routedToFeedbackAt = new Date().toISOString();
      await saveJson(reviewStateKey, next);
      await Linking.openURL(feedbackUrl);
      return { ...route, feedbackUrl };
    }

    next.requestedStoreReviewAt = new Date().toISOString();
    await saveJson(reviewStateKey, next);
    if (route.shouldRequestStoreReview) {
      const StoreReview = await import("expo-store-review").catch(() => null);
      if (!StoreReview) return route;
      const available = await StoreReview.isAvailableAsync();
      if (available) {
        await StoreReview.requestReview();
      }
    }
  } catch {
    // Review routing should never block the study flow.
  }

  return route;
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

function feedbackUrlForRating(rating: ReviewRating, feedbackCopy?: ReviewFeedbackCopy) {
  const subject = encodeURIComponent(feedbackCopy?.subject || `StudyPlanner ${rating}-star feedback`);
  const body = encodeURIComponent(feedbackCopy?.body || "What went wrong?\n\nWhat should StudyPlanner improve next?\n\n");
  return `mailto:${feedbackEmail}?subject=${subject}&body=${body}`;
}
