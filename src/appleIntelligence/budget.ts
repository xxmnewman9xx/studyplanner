// Inference budget policy (MASTER_PLAN §C6). Pure functions only; the cache
// storage itself lives in the client layer.

import { stableHash } from "./text";
import { AIAvailability, AIFeature } from "./types";

/** Bump when any prompt or @Generable schema changes so old cache rows miss. */
export const AI_SCHEMA_VERSION = 1;
export const MAX_REGENERATIONS_PER_DAY = 10;

/** `feature:v<schema>:<fnv64 of parts>`; parts should include text, OS version and locale. */
export function cacheKey(feature: AIFeature, parts: Array<string | number | undefined | null>) {
  const joined = (Array.isArray(parts) ? parts : []).map((part) => (part === undefined || part === null ? "" : String(part))).join("␟");
  return `${feature}:v${AI_SCHEMA_VERSION}:${stableHash(joined)}`;
}

/** The daily brief runs at most once per local day. */
export function shouldRunBrief(lastDateKey: string | null | undefined, todayKey: string) {
  return Boolean(todayKey) && lastDateKey !== todayKey;
}

/** Study-set regenerations are capped at 10 per local day. */
export function regenAllowed(countsByDay: Record<string, number> | null | undefined, today: string) {
  const raw = countsByDay ? countsByDay[today] : 0;
  const count = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
  return count < MAX_REGENERATIONS_PER_DAY;
}

export type InferenceGateInput = {
  appState: string | null | undefined;
  availability: Pick<AIAvailability, "state"> | null | undefined;
  platform: string | null | undefined;
};

/** Foreground-only, iOS-only, and only when the system model reports "available". */
export function canInfer(input: InferenceGateInput) {
  return Boolean(input) && input.platform === "ios" && input.appState === "active" && input.availability?.state === "available";
}
