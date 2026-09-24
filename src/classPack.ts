// Class Pack + Quiz Duel codec (F3/F5). Payloads live only in the URL
// fragment, so no server ever sees them. Format:
//   "v1." + base64url(deflateRaw(utf8(JSON)))
// Decoding is hostile-input safe: hard size caps, a streaming inflate guard,
// strict shape validation, and it never throws.

import { deflateRaw, Inflate } from "pako";
import { ClassPack, ClassPackItem, QuizDuel, SharedPayload, StudyQuestion, StudySet } from "./appleIntelligence/types";
import { addDaysKey, isValidDateInput } from "./appleIntelligence/dateKeys";
import {
  buildClassCandidate,
  buildExamCandidate,
  buildTaskCandidate,
  CLASS_PACK_SOURCE,
  EXAM_KINDS,
  ExamKind,
  findClassByCode,
} from "./appleIntelligence/payloads";
import { normalizeText, stableHash } from "./appleIntelligence/text";
import { dateKey } from "./intelligence";
import { findImportMatch, makeOwnershipId } from "./ownership/semesterOwnership";
import { AppData, ImportBatch, ImportCandidate } from "./types";

export const SHARE_BASE_URL = "https://studyplanner-ai.xxmnewman9xx.workers.dev";
export const APP_STORE_ID = "6766181202";
export const PAYLOAD_PREFIX = "v1.";
export const MAX_ENCODED_CHARS = 4096;
export const MAX_INFLATED_BYTES = 16 * 1024;
export const MAX_LINK_PAYLOAD_CHARS = 2048;
export const MAX_QR_PAYLOAD_CHARS = 1024;
export const MAX_STRING_CHARS = 120;
export const MAX_PACK_ITEMS = 60;
export const MAX_DUEL_QUESTIONS = 10;

export type CampaignToken = "pack" | "duel" | "forecast";

export function appStoreLink(ct: CampaignToken) {
  return `https://apps.apple.com/app/id${APP_STORE_ID}?ct=${ct}`;
}

// ---------------------------------------------------------------------------
// base64url + UTF-8 (no Buffer/btoa dependency so Hermes and Node agree)
// ---------------------------------------------------------------------------

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const B64_INDEX = (() => {
  const map = new Int16Array(128).fill(-1);
  for (let i = 0; i < B64.length; i += 1) map[B64.charCodeAt(i)] = i;
  return map;
})();

export function base64UrlEncode(bytes: Uint8Array) {
  let out = "";
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
  }
  const rest = bytes.length - i;
  if (rest === 1) {
    const n = bytes[i] << 16;
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
  } else if (rest === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63];
  }
  return out;
}

export function base64UrlDecode(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) return null;
  const out = new Uint8Array(Math.floor((text.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (let i = 0; i < text.length; i += 1) {
    const value = B64_INDEX[text.charCodeAt(i)];
    if (value < 0) return null;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[index] = (buffer >> bits) & 0xff;
      index += 1;
    }
  }
  return out.subarray(0, index);
}

/** Strict UTF-8 decoder: null on any malformed or overlong sequence. */
function utf8Decode(bytes: Uint8Array): string | null {
  let out = "";
  for (let i = 0; i < bytes.length; ) {
    const b0 = bytes[i];
    let code: number;
    let need: number;
    if (b0 < 0x80) {
      code = b0;
      need = 0;
    } else if (b0 >= 0xc2 && b0 <= 0xdf) {
      code = b0 & 0x1f;
      need = 1;
    } else if (b0 >= 0xe0 && b0 <= 0xef) {
      code = b0 & 0x0f;
      need = 2;
    } else if (b0 >= 0xf0 && b0 <= 0xf4) {
      code = b0 & 0x07;
      need = 3;
    } else return null;
    for (let k = 1; k <= need; k += 1) {
      const next = bytes[i + k];
      if (next === undefined || (next & 0xc0) !== 0x80) return null;
      code = (code << 6) | (next & 0x3f);
    }
    if ((need === 2 && code < 0x800) || (need === 3 && (code < 0x10000 || code > 0x10ffff)) || (code >= 0xd800 && code <= 0xdfff)) return null;
    out += String.fromCodePoint(code);
    i += need + 1;
  }
  return out;
}

function inflateGuarded(bytes: Uint8Array): Uint8Array | null {
  const chunks: Uint8Array[] = [];
  let total = 0;
  let overflow = false;
  const inflator = new Inflate({ raw: true, chunkSize: 4096 });
  inflator.onData = (chunk: Uint8Array) => {
    total += chunk.length;
    if (total > MAX_INFLATED_BYTES) {
      overflow = true;
      throw new Error("inflate limit");
    }
    chunks.push(chunk);
  };
  try {
    inflator.push(bytes, true);
  } catch {
    return null;
  }
  if (overflow || inflator.err || !(inflator as unknown as { ended?: boolean }).ended) return null;
  const out = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    out.set(chunk, offset);
    offset += chunk.length;
  });
  return out;
}

// ---------------------------------------------------------------------------
// Shape validation
// ---------------------------------------------------------------------------

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strictString(value: unknown, required: boolean): string | undefined | null {
  if (value === undefined) return required ? null : undefined;
  if (typeof value !== "string") return null;
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_STRING_CHARS) return null;
  return trimmed;
}

function validatePack(value: Record<string, unknown>): ClassPack | null {
  if (value.v !== 1 || !isObject(value.c) || !Array.isArray(value.i)) return null;
  if (value.i.length > MAX_PACK_ITEMS) return null;
  const code = strictString(value.c.code, true);
  const name = strictString(value.c.name, false);
  const days = strictString(value.c.days, false);
  const time = strictString(value.c.time, false);
  if (!code || name === null || days === null || time === null) return null;
  const c: ClassPack["c"] = { code };
  if (name) c.name = name;
  if (days) c.days = days;
  if (time) c.time = time;
  const items: ClassPackItem[] = [];
  for (const raw of value.i) {
    if (!isObject(raw)) return null;
    if (raw.k !== "t" && raw.k !== "e") return null;
    const t = strictString(raw.t, true);
    const d = typeof raw.d === "string" && isValidDateInput(raw.d) ? raw.d : null;
    const tm = strictString(raw.tm, false);
    const x = strictString(raw.x, false);
    if (!t || !d || tm === null || x === null) return null;
    let w: number | undefined;
    if (raw.w !== undefined) {
      if (typeof raw.w !== "number" || !Number.isFinite(raw.w) || raw.w < 0 || raw.w > 100) return null;
      w = raw.w;
    }
    const item: ClassPackItem = { k: raw.k, t, d };
    if (tm) item.tm = tm;
    if (w !== undefined) item.w = w;
    if (x) item.x = x;
    items.push(item);
  }
  return { v: 1, c, i: items };
}

function validateDuel(value: Record<string, unknown>): QuizDuel | null {
  if (value.v !== 1 || !Array.isArray(value.q)) return null;
  const title = strictString(value.title, true);
  if (!title || value.q.length < 1 || value.q.length > MAX_DUEL_QUESTIONS) return null;
  const q: QuizDuel["q"] = [];
  for (const raw of value.q) {
    if (!isObject(raw) || !Array.isArray(raw.o) || raw.o.length !== 4) return null;
    const s = strictString(raw.s, true);
    if (!s) return null;
    const options = raw.o.map((option) => strictString(option, true));
    if (options.some((option) => !option)) return null;
    const normalized = options.map((option) => normalizeText(option as string));
    if (new Set(normalized).size !== 4 || normalized.some((option) => !option)) return null;
    if (typeof raw.a !== "number" || !Number.isInteger(raw.a) || raw.a < 0 || raw.a > 3) return null;
    q.push({ s, o: [options[0] as string, options[1] as string, options[2] as string, options[3] as string], a: raw.a as 0 | 1 | 2 | 3 });
  }
  const duel: QuizDuel = { v: 1, title, q };
  if (value.score !== undefined) {
    if (typeof value.score !== "number" || !Number.isInteger(value.score) || value.score < 0 || value.score > q.length) return null;
    duel.score = value.score;
  }
  return duel;
}

// ---------------------------------------------------------------------------
// Encode / decode
// ---------------------------------------------------------------------------

export function encodeShared(payload: SharedPayload): string {
  const body = payload.kind === "pack" ? payload.pack : payload.duel;
  const compressed = deflateRaw(JSON.stringify(body), { level: 9 });
  return `${PAYLOAD_PREFIX}${base64UrlEncode(compressed)}`;
}

/** Decodes "v1.<data>" (a leading "#" is tolerated). Returns null for anything invalid. Never throws. */
export function decodeShared(raw: unknown): SharedPayload | null {
  try {
    if (typeof raw !== "string") return null;
    const text = raw.startsWith("#") ? raw.slice(1) : raw;
    if (text.length > MAX_ENCODED_CHARS || !text.startsWith(PAYLOAD_PREFIX)) return null;
    const bytes = base64UrlDecode(text.slice(PAYLOAD_PREFIX.length));
    if (!bytes || !bytes.length) return null;
    const inflated = inflateGuarded(bytes);
    if (!inflated) return null;
    const json = utf8Decode(inflated);
    if (json === null) return null;
    const value: unknown = JSON.parse(json);
    if (!isObject(value)) return null;
    if ("c" in value || "i" in value) {
      const pack = validatePack(value);
      return pack ? { kind: "pack", pack } : null;
    }
    if ("q" in value) {
      const duel = validateDuel(value);
      return duel ? { kind: "duel", duel } : null;
    }
    return null;
  } catch {
    return null;
  }
}

const HTTPS_LINK = /^https:\/\/studyplanner-ai\.xxmnewman9xx\.workers\.dev\/(p|d)\/?(?:\?[^#]*)?#(.+)$/i;
const SCHEME_LINK = /^studyplanner:\/\/(pack|duel|p|d)\/?(?:\?[^#]*)?#(.+)$/i;

/**
 * Reads a pack/duel from the RAW, case-preserved URL (call before any
 * lowercasing router). The path must agree with the decoded payload kind.
 */
export function sharedFromUrl(rawUrl: unknown): SharedPayload | null {
  try {
    if (typeof rawUrl !== "string") return null;
    const url = rawUrl.trim();
    if (!url || url.length > MAX_ENCODED_CHARS + 256) return null;
    let expected: SharedPayload["kind"] | null = null;
    let fragment = "";
    const https = url.match(HTTPS_LINK);
    const scheme = https ? null : url.match(SCHEME_LINK);
    if (https) {
      expected = https[1].toLowerCase() === "p" ? "pack" : "duel";
      fragment = https[2];
    } else if (scheme) {
      // The static landing page's "Open" button uses the short p/d hosts.
      expected = ["pack", "p"].includes(scheme[1].toLowerCase()) ? "pack" : "duel";
      fragment = scheme[2];
    } else {
      return null;
    }
    const decoded = decodeShared(fragment);
    return decoded && decoded.kind === expected ? decoded : null;
  } catch {
    return null;
  }
}

export function packLink(pack: ClassPack) {
  return `${SHARE_BASE_URL}/p?ct=pack#${encodeShared({ kind: "pack", pack })}`;
}

export function duelLink(duel: QuizDuel) {
  return `${SHARE_BASE_URL}/d?ct=duel#${encodeShared({ kind: "duel", duel })}`;
}

/** QR codes stay scannable only for small payloads (≤ 1 KB after the "#"). */
export function qrEligible(link: string) {
  if (typeof link !== "string") return false;
  const hash = link.indexOf("#");
  const payload = hash >= 0 ? link.slice(hash + 1) : link;
  return payload.length > 0 && payload.length <= MAX_QR_PAYLOAD_CHARS;
}

// ---------------------------------------------------------------------------
// Building packs and duels
// ---------------------------------------------------------------------------

function clip(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_STRING_CHARS).trim();
}

/**
 * Shareable schedule for one class: dates, kinds, weights, titles, and the
 * class code/name/days/time. Never notes, descriptions, rooms, grades, or
 * syllabus text. Items are trimmed (furthest-out first) to fit a 2 KB link.
 */
export function classPackFromData(data: AppData, classId: string, now: Date = new Date()): ClassPack | null {
  const klass = data.classes.find((item) => item.id === classId);
  if (!klass || !clip(klass.code)) return null;
  const since = addDaysKey(dateKey(now), -14);
  const items: ClassPackItem[] = [];
  data.exams.forEach((exam) => {
    if (exam.classId !== classId || !isValidDateInput(exam.dueDate) || exam.dueDate < since || !clip(exam.title)) return;
    const item: ClassPackItem = { k: "e", t: clip(exam.title), d: exam.dueDate };
    if (clip(exam.time)) item.tm = clip(exam.time);
    if (typeof exam.weight === "number" && Number.isFinite(exam.weight) && exam.weight >= 0 && exam.weight <= 100) item.w = exam.weight;
    if (exam.kind) item.x = exam.kind;
    items.push(item);
  });
  data.tasks.forEach((task) => {
    if (task.classId !== classId || task.missing || !isValidDateInput(task.dueDate) || task.dueDate < since || !clip(task.title)) return;
    const item: ClassPackItem = { k: "t", t: clip(task.title), d: task.dueDate };
    if (clip(task.time)) item.tm = clip(task.time);
    if (typeof task.weight === "number" && Number.isFinite(task.weight) && task.weight >= 0 && task.weight <= 100) item.w = task.weight;
    if (clip(task.type)) item.x = clip(task.type);
    items.push(item);
  });
  items.sort((a, b) => a.d.localeCompare(b.d) || a.k.localeCompare(b.k) || a.t.localeCompare(b.t));
  const unique = items.filter((item, index, list) => list.findIndex((other) => other.k === item.k && other.d === item.d && other.t === item.t) === index);
  const c: ClassPack["c"] = { code: clip(klass.code) };
  if (clip(klass.name)) c.name = clip(klass.name);
  if (clip(klass.days)) c.days = clip(klass.days);
  if (clip(klass.time)) c.time = clip(klass.time);
  const pack: ClassPack = { v: 1, c, i: unique.slice(0, MAX_PACK_ITEMS) };
  while (pack.i.length && encodeShared({ kind: "pack", pack }).length > MAX_LINK_PAYLOAD_CHARS) pack.i.pop();
  return pack;
}

/** Turns a received pack into a normal review batch (ReviewImport stays mandatory). */
export function packToImportBatch(pack: ClassPack, data: AppData, now: Date): ImportBatch {
  const candidates: ImportCandidate[] = [];
  const existing = findClassByCode(data, pack.c.code);
  let classId = existing?.id;
  if (!existing) {
    const classCandidate = buildClassCandidate({
      code: pack.c.code,
      name: pack.c.name || pack.c.code,
      data,
      now,
      paletteIndex: data.classes.length,
      confidence: 0.9,
      approved: true,
      days: pack.c.days,
      time: pack.c.time,
    });
    classId = classCandidate.classId;
    candidates.push(classCandidate);
  }
  const resolvedClassId = classId || "class";
  for (const item of pack.i) {
    const candidate = item.k === "e"
      ? buildExamCandidate({
          title: item.t,
          classId: resolvedClassId,
          dueDate: item.d,
          now,
          time: item.tm,
          kind: item.x && (EXAM_KINDS as string[]).includes(item.x) ? (item.x as ExamKind) : undefined,
          weight: item.w,
          confidence: 0.9,
          approved: true,
        })
      : buildTaskCandidate({
          title: item.t,
          classId: resolvedClassId,
          dueDate: item.d,
          now,
          time: item.tm,
          type: item.x && /^[\p{L} ]{2,24}$/u.test(item.x) ? item.x : undefined,
          weight: item.w,
          source: CLASS_PACK_SOURCE,
          confidence: 0.9,
          approved: true,
        });
    if (existing) {
      const match = findImportMatch(data, candidate);
      if (match && match.oldDate === item.d) continue;
    }
    candidates.push(candidate);
  }
  return {
    id: makeOwnershipId("imp"),
    sourceName: CLASS_PACK_SOURCE,
    sourceText: pack.i.map((item) => `${item.d} ${item.t}`).join("\n"),
    createdAt: now.toISOString(),
    status: "review",
    candidates,
  };
}

/** A duel carries only stems, options, and keys: no note text, no citations. */
export function duelFromStudySet(set: StudySet, title: string, score?: number): QuizDuel | null {
  const q: QuizDuel["q"] = [];
  for (const question of set?.questions || []) {
    if (q.length >= MAX_DUEL_QUESTIONS) break;
    const stemRaw = clip(question.stem.length > MAX_STRING_CHARS ? `${question.stem.slice(0, MAX_STRING_CHARS - 1).replace(/\s+\S*$/, "")}…` : question.stem);
    const options = question.options.map(clip);
    if (!stemRaw || options.some((option, index) => !option || option.length !== question.options[index].trim().length)) continue;
    if (new Set(options.map((option) => normalizeText(option))).size !== 4) continue;
    if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex > 3) continue;
    q.push({ s: stemRaw, o: [options[0], options[1], options[2], options[3]], a: question.answerIndex });
  }
  const cleanTitle = clip(title) || "Quiz Duel";
  if (!q.length) return null;
  const duel: QuizDuel = { v: 1, title: cleanTitle, q };
  if (typeof score === "number" && Number.isFinite(score)) duel.score = Math.max(0, Math.min(q.length, Math.round(score)));
  return duel;
}

export function duelToStudyQuestions(duel: QuizDuel): StudyQuestion[] {
  return duel.q.map((question) => ({
    id: `dq_${stableHash(`${duel.title}|${question.s}|${question.o.join("|")}`)}`,
    stem: question.s,
    options: [question.o[0], question.o[1], question.o[2], question.o[3]],
    answerIndex: question.a,
    why: "",
    source: { quote: "" },
    sharedByClassmate: true,
  }));
}
