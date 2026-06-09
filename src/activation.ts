import type { AppData, ImportBatch } from "./types";

export type InitialRoute =
  | "onboarding"
  | "reviewPendingImport"
  | "dashboard"
  | "paywall";

type InitialRouteState = {
  hasCompletedOnboarding: boolean;
  pendingImportDraft?: ImportBatch | null;
};

export function resolveInitialRoute(state: InitialRouteState): InitialRoute {
  if (!state.hasCompletedOnboarding) return "onboarding";
  if (state.pendingImportDraft) return "reviewPendingImport";
  return "dashboard";
}

export function resolveInitialRouteForData(data: AppData, pendingImportDraft?: ImportBatch | null): InitialRoute {
  return resolveInitialRoute({
    hasCompletedOnboarding: Boolean(data.prefs.onboardingComplete),
    pendingImportDraft,
  });
}
