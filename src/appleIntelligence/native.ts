// Thin, typed, never-throwing wrappers over the StudyPlannerAppleIntelligence
// Expo module (modules/studyplanner-apple-intelligence). iOS only; every other
// platform (and an iOS build without the module) gets safe fallback values.

import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
import type { AIAvailability, AIErrorCode, AIFeature } from "./types";

/** Must equal `Name(...)` in StudyPlannerAppleIntelligenceModule.swift. */
export const NATIVE_MODULE_NAME = "StudyPlannerAppleIntelligence";
/** Must equal AIVersions.schema in ios/Schemas.swift. */
export const AI_SCHEMA_VERSION = 1;
/** Must equal AIVersions.instructions in ios/Schemas.swift. */
export const AI_INSTRUCTIONS_VERSION = 1;

export type AppGroupFileName = "intelligence-snapshot" | "intent-inbox";

export type NativeDocumentText = { text: string; pages: number; usedDocumentReader: boolean };

export type SpotlightSnapshot = {
  classes: Array<{ id: string; code: string; name: string }>;
  deadlines: Array<{ id: string; title: string; classCode: string; dueDate: string; kind: string }>;
};

export type NativeRunResult = { ok: true; json: string } | { ok: false; code: AIErrorCode };

type StudyPlannerAppleIntelligenceModule = {
  availability(localeId: string): Promise<AIAvailability>;
  prewarm(feature: AIFeature): Promise<boolean>;
  run(feature: AIFeature, inputJson: string, requestId: string): Promise<string>;
  cancel(requestId: string): Promise<boolean>;
  readDocument(uri: string): Promise<NativeDocumentText>;
  writeAppGroupJSON(name: AppGroupFileName, json: string): Promise<boolean>;
  readAppGroupJSON(name: AppGroupFileName): Promise<string | null>;
  deleteAppGroupJSON(name: AppGroupFileName): Promise<boolean>;
  indexSpotlight(json: string): Promise<number>;
  clearSpotlight(): Promise<boolean>;
};

const AI_ERROR_CODES: readonly AIErrorCode[] = [
  "contextOverflow",
  "guardrail",
  "refusal",
  "unsupportedLocale",
  "rateLimited",
  "busy",
  "decoding",
  "assetsUnavailable",
  "timeout",
  "cancelled",
  "background",
  "unavailable",
];

let cachedModule: StudyPlannerAppleIntelligenceModule | null | undefined;

function nativeModule(): StudyPlannerAppleIntelligenceModule | null {
  if (cachedModule !== undefined) return cachedModule;
  if (Platform.OS !== "ios") {
    cachedModule = null;
    return cachedModule;
  }
  try {
    cachedModule = requireOptionalNativeModule<StudyPlannerAppleIntelligenceModule>(NATIVE_MODULE_NAME) ?? null;
  } catch {
    cachedModule = null;
  }
  return cachedModule;
}

export function hasAppleIntelligenceModule(): boolean {
  return nativeModule() !== null;
}

export function missingModuleAvailability(osVersion = ""): AIAvailability {
  return { state: "missingModule", contextSize: 0, osVersion, documentReader: false };
}

export function toAIErrorCode(value: unknown): AIErrorCode {
  const code = typeof value === "object" && value !== null ? (value as { code?: unknown }).code : value;
  return typeof code === "string" && (AI_ERROR_CODES as readonly string[]).includes(code) ? (code as AIErrorCode) : "unavailable";
}

const STATES: readonly AIAvailability["state"][] = ["available", "unavailable", "unsupportedOS", "missingModule"];
const REASONS: readonly NonNullable<AIAvailability["reason"]>[] = [
  "deviceNotEligible",
  "appleIntelligenceNotEnabled",
  "modelNotReady",
  "localeUnsupported",
  "userDisabled",
];

function sanitizeAvailability(raw: unknown): AIAvailability {
  if (!raw || typeof raw !== "object") return missingModuleAvailability();
  const value = raw as Record<string, unknown>;
  const state = STATES.includes(value.state as AIAvailability["state"]) ? (value.state as AIAvailability["state"]) : "unavailable";
  const reason = REASONS.includes(value.reason as NonNullable<AIAvailability["reason"]>)
    ? (value.reason as AIAvailability["reason"])
    : undefined;
  const contextSize = typeof value.contextSize === "number" && Number.isFinite(value.contextSize) ? value.contextSize : 4096;
  const osVersion = typeof value.osVersion === "string" ? value.osVersion : "";
  const documentReader = value.documentReader === true;
  const result: AIAvailability = { state, contextSize, osVersion, documentReader };
  if (reason) result.reason = reason;
  if (state === "unavailable" && !result.reason) result.reason = "modelNotReady";
  return result;
}

export async function nativeAvailability(localeId: string): Promise<AIAvailability> {
  const module = nativeModule();
  if (!module) return missingModuleAvailability();
  try {
    return sanitizeAvailability(await module.availability(localeId));
  } catch {
    return missingModuleAvailability();
  }
}

/** Fire-and-forget. Call only when an AI screen appears (>= 1 s before the request). */
export function nativePrewarm(feature: AIFeature): void {
  const module = nativeModule();
  if (!module) return;
  try {
    module.prewarm(feature).catch(() => undefined);
  } catch {
    // ignore
  }
}

export async function nativeRun(feature: AIFeature, inputJson: string, requestId: string): Promise<NativeRunResult> {
  const module = nativeModule();
  if (!module) return { ok: false, code: "unavailable" };
  try {
    const json = await module.run(feature, inputJson, requestId);
    if (typeof json !== "string") return { ok: false, code: "decoding" };
    return { ok: true, json };
  } catch (error) {
    return { ok: false, code: toAIErrorCode(error) };
  }
}

export function nativeCancel(requestId: string): void {
  const module = nativeModule();
  if (!module) return;
  try {
    module.cancel(requestId).catch(() => undefined);
  } catch {
    // ignore
  }
}

/** Returns null when the module is missing or the document could not be read. */
export async function nativeReadDocument(uri: string): Promise<NativeDocumentText | null> {
  const module = nativeModule();
  if (!module) return null;
  try {
    const result = await module.readDocument(uri);
    if (!result || typeof result.text !== "string") return null;
    return {
      text: result.text,
      pages: typeof result.pages === "number" ? result.pages : 1,
      usedDocumentReader: result.usedDocumentReader === true,
    };
  } catch {
    return null;
  }
}

export async function writeAppGroupJSON(name: AppGroupFileName, json: string): Promise<boolean> {
  const module = nativeModule();
  if (!module) return false;
  try {
    return (await module.writeAppGroupJSON(name, json)) === true;
  } catch {
    return false;
  }
}

export async function readAppGroupJSON(name: AppGroupFileName): Promise<string | null> {
  const module = nativeModule();
  if (!module) return null;
  try {
    const value = await module.readAppGroupJSON(name);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

export async function deleteAppGroupJSON(name: AppGroupFileName): Promise<boolean> {
  const module = nativeModule();
  if (!module) return false;
  try {
    return (await module.deleteAppGroupJSON(name)) === true;
  } catch {
    return false;
  }
}

/** Replaces all StudyPlanner Spotlight items. Returns the number indexed (0 on failure). */
export async function indexSpotlight(snapshot: SpotlightSnapshot): Promise<number> {
  const module = nativeModule();
  if (!module) return 0;
  try {
    const count = await module.indexSpotlight(JSON.stringify(snapshot));
    return typeof count === "number" ? count : 0;
  } catch {
    return 0;
  }
}

export async function clearSpotlight(): Promise<boolean> {
  const module = nativeModule();
  if (!module) return false;
  try {
    return (await module.clearSpotlight()) === true;
  } catch {
    return false;
  }
}
