// On-device AI cache and practice history, stored in the SAME SQLite database as
// src/storage.ts (via its exported `database()`), in separate tables so AppData's
// `kv` row is never touched. Everything is async and never throws: failures
// resolve to null / [] / false. No network.

import { Platform } from "react-native";
import { database } from "../storage";
import type { AIFeature, PracticeResult, StudySet } from "./types";

type Db = Awaited<ReturnType<typeof database>>;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS ai_cache (key TEXT PRIMARY KEY NOT NULL, feature TEXT, ref TEXT, created_at TEXT, json TEXT);
CREATE INDEX IF NOT EXISTS ai_cache_ref ON ai_cache (ref);
CREATE TABLE IF NOT EXISTS practice_results (id TEXT PRIMARY KEY NOT NULL, note_id TEXT, exam_id TEXT, class_id TEXT, item_id TEXT, kind TEXT, concept TEXT, correct INTEGER, answered_at TEXT);
CREATE INDEX IF NOT EXISTS practice_results_note ON practice_results (note_id);
CREATE INDEX IF NOT EXISTS practice_results_class ON practice_results (class_id);
CREATE TABLE IF NOT EXISTS ai_meta (key TEXT PRIMARY KEY NOT NULL, value TEXT);
CREATE TABLE IF NOT EXISTS ai_prefs (key TEXT PRIMARY KEY NOT NULL, value TEXT);
`;

let readyPromise: Promise<Db | null> | null = null;

async function ready(): Promise<Db | null> {
  if (Platform.OS === "web") return null;
  if (!readyPromise) {
    readyPromise = (async () => {
      const db = await database();
      await db.execAsync(SCHEMA_SQL);
      return db;
    })().catch(() => {
      readyPromise = null;
      return null;
    });
  }
  return readyPromise;
}

async function withDb<T>(fallback: T, fn: (db: Db) => Promise<T>): Promise<T> {
  try {
    const db = await ready();
    if (!db) return fallback;
    return await fn(db);
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// ai_cache
// ---------------------------------------------------------------------------

export async function get(key: string): Promise<string | null> {
  return withDb<string | null>(null, async (db) => {
    const row = await db.getFirstAsync<{ json: string | null }>("SELECT json FROM ai_cache WHERE key = ?", key);
    return typeof row?.json === "string" ? row.json : null;
  });
}

/** `ref` is the noteId / classId the entry belongs to ("" when none), used for purges. */
export async function put(key: string, feature: AIFeature | string, ref: string, json: string): Promise<boolean> {
  return withDb(false, async (db) => {
    await db.runAsync(
      "INSERT OR REPLACE INTO ai_cache (key, feature, ref, created_at, json) VALUES (?, ?, ?, ?, ?)",
      key,
      feature,
      ref,
      new Date().toISOString(),
      json,
    );
    return true;
  });
}

export async function deleteByRef(ref: string): Promise<boolean> {
  if (!ref) return false;
  return withDb(false, async (db) => {
    await db.runAsync("DELETE FROM ai_cache WHERE ref = ?", ref);
    return true;
  });
}

/** Drops cache rows for one feature older than `olderThanIso` (e.g. yesterday's briefs). */
export async function deleteFeatureOlderThan(feature: AIFeature, olderThanIso: string): Promise<boolean> {
  return withDb(false, async (db) => {
    await db.runAsync("DELETE FROM ai_cache WHERE feature = ? AND created_at < ?", feature, olderThanIso);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Study sets (validated StudySet, one per note)
// ---------------------------------------------------------------------------

const studySetKey = (noteId: string) => `studyset:${noteId}`;

export async function saveStudySet(set: StudySet): Promise<boolean> {
  if (!set?.noteId) return false;
  let json: string;
  try {
    json = JSON.stringify(set);
  } catch {
    return false;
  }
  return put(studySetKey(set.noteId), "noteStudySet", set.noteId, json);
}

export async function loadStudySet(noteId: string): Promise<StudySet | null> {
  if (!noteId) return null;
  const json = await get(studySetKey(noteId));
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as StudySet;
    return parsed && typeof parsed === "object" && parsed.noteId === noteId && Array.isArray(parsed.cards) && Array.isArray(parsed.questions)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// practice_results
// ---------------------------------------------------------------------------

type PracticeRow = {
  id: string;
  note_id: string | null;
  exam_id: string | null;
  class_id: string | null;
  item_id: string | null;
  kind: string | null;
  concept: string | null;
  correct: number | null;
  answered_at: string | null;
};

export type PracticeFilter = {
  noteId?: string;
  examId?: string;
  classId?: string;
  concept?: string;
  /** ISO timestamp; only results answered at or after it. */
  since?: string;
  limit?: number;
};

export async function recordPractice(result: PracticeResult): Promise<boolean> {
  if (!result?.id) return false;
  return withDb(false, async (db) => {
    await db.runAsync(
      "INSERT OR REPLACE INTO practice_results (id, note_id, exam_id, class_id, item_id, kind, concept, correct, answered_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      result.id,
      result.noteId ?? null,
      result.examId ?? null,
      result.classId ?? null,
      result.itemId ?? null,
      result.kind,
      result.concept ?? null,
      result.correct ? 1 : 0,
      result.answeredAt ?? new Date().toISOString(),
    );
    return true;
  });
}

export async function listPractice(filter: PracticeFilter = {}): Promise<PracticeResult[]> {
  return withDb<PracticeResult[]>([], async (db) => {
    const clauses: string[] = [];
    const params: Array<string | number> = [];
    if (filter.noteId) {
      clauses.push("note_id = ?");
      params.push(filter.noteId);
    }
    if (filter.examId) {
      clauses.push("exam_id = ?");
      params.push(filter.examId);
    }
    if (filter.classId) {
      clauses.push("class_id = ?");
      params.push(filter.classId);
    }
    if (filter.concept) {
      clauses.push("concept = ?");
      params.push(filter.concept);
    }
    if (filter.since) {
      clauses.push("answered_at >= ?");
      params.push(filter.since);
    }
    const limit = Math.max(1, Math.min(5000, Math.floor(filter.limit ?? 1000)));
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = await db.getAllAsync<PracticeRow>(
      `SELECT id, note_id, exam_id, class_id, item_id, kind, concept, correct, answered_at FROM practice_results ${where} ORDER BY answered_at DESC LIMIT ${limit}`,
      ...params,
    );
    return rows.map(rowToPractice).filter((row): row is PracticeResult => row !== null);
  });
}

function rowToPractice(row: PracticeRow): PracticeResult | null {
  if (!row?.id || (row.kind !== "card" && row.kind !== "question")) return null;
  const result: PracticeResult = {
    id: row.id,
    noteId: row.note_id ?? "",
    itemId: row.item_id ?? "",
    kind: row.kind,
    correct: row.correct === 1,
    answeredAt: row.answered_at ?? "",
  };
  if (row.exam_id) result.examId = row.exam_id;
  if (row.class_id) result.classId = row.class_id;
  if (row.concept) result.concept = row.concept;
  return result;
}

export async function deletePracticeForNote(noteId: string): Promise<boolean> {
  if (!noteId) return false;
  return withDb(false, async (db) => {
    await db.runAsync("DELETE FROM practice_results WHERE note_id = ?", noteId);
    return true;
  });
}

export async function deletePracticeForClass(classId: string): Promise<boolean> {
  if (!classId) return false;
  return withDb(false, async (db) => {
    await db.runAsync("DELETE FROM practice_results WHERE class_id = ?", classId);
    return true;
  });
}

/** Note delete handler: drops the note's cache rows, study set and practice history. */
export async function purgeAIDataForNote(noteId: string): Promise<boolean> {
  const [cache, practice] = await Promise.all([deleteByRef(noteId), deletePracticeForNote(noteId)]);
  return cache && practice;
}

/** Class delete handler: drops the class's cache rows and practice history. */
export async function purgeAIDataForClass(classId: string): Promise<boolean> {
  const [cache, practice] = await Promise.all([deleteByRef(classId), deletePracticeForClass(classId)]);
  return cache && practice;
}

/** Profile "Clear on-device AI data". Keeps ai_prefs (the user's on/off choice). */
export async function clearAllAIData(): Promise<boolean> {
  return withDb(false, async (db) => {
    await db.execAsync("DELETE FROM ai_cache; DELETE FROM practice_results; DELETE FROM ai_meta;");
    return true;
  });
}

// ---------------------------------------------------------------------------
// ai_meta (brief date, regen counters, processed inbox ids) and ai_prefs
// ---------------------------------------------------------------------------

export async function metaGet(key: string): Promise<string | null> {
  return withDb<string | null>(null, async (db) => {
    const row = await db.getFirstAsync<{ value: string | null }>("SELECT value FROM ai_meta WHERE key = ?", key);
    return typeof row?.value === "string" ? row.value : null;
  });
}

export async function metaSet(key: string, value: string | null): Promise<boolean> {
  return withDb(false, async (db) => {
    if (value === null) {
      await db.runAsync("DELETE FROM ai_meta WHERE key = ?", key);
    } else {
      await db.runAsync("INSERT OR REPLACE INTO ai_meta (key, value) VALUES (?, ?)", key, value);
    }
    return true;
  });
}

export async function prefGet(key: string): Promise<string | null> {
  return withDb<string | null>(null, async (db) => {
    const row = await db.getFirstAsync<{ value: string | null }>("SELECT value FROM ai_prefs WHERE key = ?", key);
    return typeof row?.value === "string" ? row.value : null;
  });
}

export async function prefSet(key: string, value: string): Promise<boolean> {
  return withDb(false, async (db) => {
    await db.runAsync("INSERT OR REPLACE INTO ai_prefs (key, value) VALUES (?, ?)", key, value);
    return true;
  });
}
