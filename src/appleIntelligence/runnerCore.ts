// Pure ModelRunner core with injected dependencies. No react-native imports, so
// tsx tests can drive it with fakes; client.ts wires it to AppState, the native
// module and the SQLite cache.
//
// Gates, in order: foreground (AppState "active") -> abort signal -> cache hit ->
// availability -> native run with timeout + native cancel -> JSON.parse guard.

import type { AIAvailability, AIErrorCode, AIFeature, AIResult, ModelRunner, ModelRunOptions } from "./types";

export type RunnerNativeResult = { ok: true; json: string } | { ok: false; code: AIErrorCode };

export type RunnerDeps = {
  locale: string;
  schemaVersion: number;
  instructionsVersion: number;
  /** Current AppState.currentState ("active" | "background" | "inactive" | ...). */
  appState: () => string | null | undefined;
  availability: () => Promise<AIAvailability>;
  run: (feature: AIFeature, inputJson: string, requestId: string) => Promise<RunnerNativeResult>;
  cancel: (requestId: string) => void;
  cacheGet: (key: string) => Promise<string | null>;
  cachePut: (key: string, feature: AIFeature, ref: string, json: string) => Promise<unknown>;
  /** Features that must never be cached (C6: taskProposal). */
  uncachedFeatures?: readonly AIFeature[];
  defaultTimeoutMs?: Partial<Record<AIFeature, number>>;
  makeRequestId?: () => string;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
};

export const DEFAULT_TIMEOUT_MS: Record<AIFeature, number> = {
  syllabusExtract: 20_000,
  noteStudySet: 20_000,
  dailyBrief: 8_000,
  taskProposal: 8_000,
};

/** Returns the error code that blocks inference in this AppState, or null when allowed. */
export function foregroundGate(appState: string | null | undefined): AIErrorCode | null {
  return appState === "active" ? null : "background";
}

// ---------------------------------------------------------------------------
// Stable hashing (local FNV-1a; src/appleIntelligence/text.ts did not exist when
// this was written. Swap to its stableHash once it lands if they differ.)
// ---------------------------------------------------------------------------

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    const encoded = JSON.stringify(value);
    return encoded === undefined ? "null" : encoded;
  }
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((key) => record[key] !== undefined && typeof record[key] !== "function")
    .sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

function fnv1a32(text: string, seed: number): number {
  let hash = seed >>> 0;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** 64-bit (two independent 32-bit FNV-1a lanes) hex hash of the string. */
export function fnv1aHash(text: string): string {
  const a = fnv1a32(text, 0x811c9dc5);
  const b = fnv1a32(text, 0x01000193 ^ text.length);
  return a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0");
}

export function stableHash(value: unknown): string {
  return fnv1aHash(typeof value === "string" ? value : stableStringify(value));
}

export function cacheKeyFor(
  feature: AIFeature,
  input: Record<string, unknown>,
  parts: { schemaVersion: number; instructionsVersion: number; osVersion: string; locale: string },
): string {
  return [
    feature,
    stableHash(input),
    `s${parts.schemaVersion}.i${parts.instructionsVersion}`,
    parts.osVersion || "os?",
    parts.locale || "locale?",
  ].join("|");
}

/** `ref` (noteId / classId) is bookkeeping for purges; it is never sent to the model. */
export function nativePayload(input: Record<string, unknown>, locale: string): Record<string, unknown> {
  const { ref: _ref, ...rest } = input;
  if (typeof rest.language !== "string" || !rest.language) rest.language = locale;
  return rest;
}

let requestCounter = 0;
function defaultRequestId() {
  requestCounter += 1;
  return `ai-${Date.now().toString(36)}-${requestCounter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createRunnerCore(deps: RunnerDeps): ModelRunner {
  const setTimer = deps.setTimer ?? ((fn: () => void, ms: number) => setTimeout(fn, ms));
  const clearTimer = deps.clearTimer ?? ((handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>));
  const makeRequestId = deps.makeRequestId ?? defaultRequestId;
  const uncached = new Set<AIFeature>(deps.uncachedFeatures ?? ["taskProposal"]);

  return async function runModel(feature: AIFeature, input: Record<string, unknown>, options: ModelRunOptions = {}): Promise<AIResult<unknown>> {
    try {
      const gate = foregroundGate(safeCall(deps.appState));
      if (gate) return { ok: false, code: gate };
      if (options.signal?.aborted) return { ok: false, code: "cancelled" };

      const availability = await deps.availability();
      if (availability.state !== "available") return { ok: false, code: "unavailable" };

      const ref = typeof input.ref === "string" ? input.ref : "";
      const useCache = !uncached.has(feature);
      const key = cacheKeyFor(feature, input, {
        schemaVersion: deps.schemaVersion,
        instructionsVersion: deps.instructionsVersion,
        osVersion: availability.osVersion,
        locale: deps.locale,
      });

      if (useCache) {
        const cached = await deps.cacheGet(key).catch(() => null);
        if (cached != null) {
          const parsed = parseJson(cached);
          if (parsed.ok) return { ok: true, value: parsed.value, cached: true };
        }
      }

      // Re-check: the availability/cache awaits may have spanned a backgrounding.
      const lateGate = foregroundGate(safeCall(deps.appState));
      if (lateGate) return { ok: false, code: lateGate };
      if (options.signal?.aborted) return { ok: false, code: "cancelled" };

      let inputJson: string;
      try {
        inputJson = JSON.stringify(nativePayload(input, deps.locale));
      } catch {
        return { ok: false, code: "decoding" };
      }

      const requestId = makeRequestId();
      const timeoutMs = options.timeoutMs ?? deps.defaultTimeoutMs?.[feature] ?? DEFAULT_TIMEOUT_MS[feature];
      const outcome = await raceNative(deps, setTimer, clearTimer, feature, inputJson, requestId, timeoutMs, options.signal);
      if (!outcome.ok) return outcome;

      const parsed = parseJson(outcome.json);
      if (!parsed.ok) return { ok: false, code: "decoding" };
      if (useCache) await Promise.resolve(deps.cachePut(key, feature, ref, outcome.json)).catch(() => undefined);
      return { ok: true, value: parsed.value, cached: false };
    } catch {
      return { ok: false, code: "unavailable" };
    }
  };
}

function safeCall(fn: () => string | null | undefined): string | null | undefined {
  try {
    return fn();
  } catch {
    return null;
  }
}

function parseJson(json: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(json) };
  } catch {
    return { ok: false };
  }
}

function raceNative(
  deps: RunnerDeps,
  setTimer: (fn: () => void, ms: number) => unknown,
  clearTimer: (handle: unknown) => void,
  feature: AIFeature,
  inputJson: string,
  requestId: string,
  timeoutMs: number,
  signal: AbortSignal | undefined,
): Promise<RunnerNativeResult> {
  return new Promise<RunnerNativeResult>((resolve) => {
    let settled = false;
    let timer: unknown = null;

    const settle = (result: RunnerNativeResult, cancelNative: boolean) => {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimer(timer);
      signal?.removeEventListener?.("abort", onAbort);
      if (cancelNative) {
        try {
          deps.cancel(requestId);
        } catch {
          // ignore
        }
      }
      resolve(result);
    };
    const onAbort = () => settle({ ok: false, code: "cancelled" }, true);

    signal?.addEventListener?.("abort", onAbort);
    if (timeoutMs > 0 && Number.isFinite(timeoutMs)) {
      timer = setTimer(() => settle({ ok: false, code: "timeout" }, true), timeoutMs);
    }

    deps
      .run(feature, inputJson, requestId)
      .then((result) => settle(result, false))
      .catch(() => settle({ ok: false, code: "unavailable" }, false));
  });
}
