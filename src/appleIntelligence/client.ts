// Real on-device intelligence client: availability (memoized per foreground
// session), the production ModelRunner, document reading, and the user's
// on-device AI switch. Orchestrators receive the ModelRunner by injection.

import { AppState, type AppStateStatus, type NativeEventSubscription } from "react-native";
import { extractTextFromImage } from "../imageTextRecognition";
import * as aiCache from "./cache";
import {
  AI_INSTRUCTIONS_VERSION,
  AI_SCHEMA_VERSION,
  nativeAvailability,
  nativeCancel,
  nativePrewarm,
  nativeReadDocument,
  nativeRun,
} from "./native";
import { createRunnerCore, type RunnerDeps } from "./runnerCore";
import type { AIAvailability, AIFeature, ModelRunner } from "./types";

export { stableHash, stableStringify, cacheKeyFor, foregroundGate, DEFAULT_TIMEOUT_MS } from "./runnerCore";

const USER_AI_PREF_KEY = "userAIEnabled";

// ---------------------------------------------------------------------------
// User switch (Profile -> On-device AI). Default: on.
// ---------------------------------------------------------------------------

let userAIEnabledMemo: Promise<boolean> | null = null;

export function isUserAIEnabled(): Promise<boolean> {
  if (!userAIEnabledMemo) {
    userAIEnabledMemo = aiCache
      .prefGet(USER_AI_PREF_KEY)
      .then((value) => value !== "0")
      .catch(() => true);
  }
  return userAIEnabledMemo;
}

export async function setUserAIEnabled(enabled: boolean): Promise<boolean> {
  userAIEnabledMemo = Promise.resolve(enabled);
  availabilityMemo.clear();
  return aiCache.prefSet(USER_AI_PREF_KEY, enabled ? "1" : "0");
}

// ---------------------------------------------------------------------------
// Availability, memoized per locale until the app next becomes active.
// ---------------------------------------------------------------------------

const availabilityMemo = new Map<string, Promise<AIAvailability>>();
let appStateSubscription: NativeEventSubscription | null = null;
let lastAppState: AppStateStatus | null = null;

function ensureAppStateListener() {
  if (appStateSubscription) return;
  try {
    lastAppState = AppState.currentState;
    appStateSubscription = AppState.addEventListener("change", (next) => {
      // Settings (Apple Intelligence toggle, model download, language) can only
      // change while we are away, so re-check on every return to the foreground.
      if (next === "active" && lastAppState !== "active") availabilityMemo.clear();
      lastAppState = next;
    });
  } catch {
    appStateSubscription = null;
  }
}

export function invalidateAvailability(): void {
  availabilityMemo.clear();
}

export function getAvailability(locale: string): Promise<AIAvailability> {
  ensureAppStateListener();
  const key = locale || "";
  const existing = availabilityMemo.get(key);
  if (existing) return existing;
  const pending = (async (): Promise<AIAvailability> => {
    const [native, enabled] = await Promise.all([nativeAvailability(key), isUserAIEnabled()]);
    if (!enabled && native.state !== "missingModule" && native.state !== "unsupportedOS") {
      return { ...native, state: "unavailable", reason: "userDisabled" };
    }
    return native;
  })().catch(
    (): AIAvailability => ({ state: "missingModule", contextSize: 0, osVersion: "", documentReader: false }),
  );
  availabilityMemo.set(key, pending);
  return pending;
}

// ---------------------------------------------------------------------------
// ModelRunner
// ---------------------------------------------------------------------------

export type ModelRunnerOverrides = Partial<Omit<RunnerDeps, "locale" | "schemaVersion" | "instructionsVersion">>;

/**
 * The production ModelRunner. Enforces: AppState "active" (else `background`),
 * availability "available" (else `unavailable`), cache-first (key = feature +
 * stableHash(input) + schema/instructions version + osVersion + locale), timeout
 * (20 s extraction / study set, 8 s brief / task) with native cancel, AbortSignal,
 * and guarded JSON.parse (`decoding`). Never throws.
 *
 * Input: `{ text?, language?, ref?, ...facts }`. `ref` (noteId / classId) tags the
 * cache row for purges and is not sent to the model; `language` defaults to `locale`.
 */
export function createModelRunner(locale: string, overrides: ModelRunnerOverrides = {}): ModelRunner {
  ensureAppStateListener();
  return createRunnerCore({
    locale,
    schemaVersion: AI_SCHEMA_VERSION,
    instructionsVersion: AI_INSTRUCTIONS_VERSION,
    appState: () => AppState.currentState,
    availability: () => getAvailability(locale),
    run: nativeRun,
    cancel: nativeCancel,
    cacheGet: aiCache.get,
    cachePut: aiCache.put,
    ...overrides,
  });
}

/** Call when an AI screen appears (Apple wants >= 1 s lead time). No-op when unavailable. */
export async function prewarm(feature: AIFeature, locale: string): Promise<void> {
  if (AppState.currentState !== "active") return;
  const availability = await getAvailability(locale);
  if (availability.state === "available") nativePrewarm(feature);
}

// ---------------------------------------------------------------------------
// Document reading
// ---------------------------------------------------------------------------

export type DocumentText = {
  text: string;
  pages: number;
  /** True when iOS 26 RecognizeDocumentsRequest (table-aware) produced the text. */
  usedDocumentReader: boolean;
  source: "native" | "visionFallback";
};

function lightNormalize(text: string) {
  // Keep line structure intact: table rows are "cell | cell" lines.
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[  -​  　]/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countWords(text: string) {
  return (text.match(/[\p{L}\p{N}]+/gu) || []).length;
}

/**
 * Reads an image or PDF (file:// URI). Uses the native document reader (table
 * aware on iOS 26, PDF text layer, 20-page cap) and falls back to the existing
 * extractTextFromImage path for images. Throws the same user-facing Error
 * messages as extractTextFromImage when nothing readable is found.
 */
export async function readDocumentText(uri: string): Promise<DocumentText> {
  const native = await nativeReadDocument(uri);
  if (native) {
    const text = lightNormalize(native.text);
    if (countWords(text) >= 8) {
      return { text, pages: native.pages, usedDocumentReader: native.usedDocumentReader, source: "native" };
    }
  }
  if (/\.pdf($|[?#])/i.test(uri)) {
    throw new Error("No readable school material text was found in that PDF.");
  }
  const text = await extractTextFromImage(uri);
  return { text, pages: 1, usedDocumentReader: false, source: "visionFallback" };
}
