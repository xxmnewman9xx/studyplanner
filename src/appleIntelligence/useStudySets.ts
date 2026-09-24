// Exam Mode (F5) study sets for a group of notes.
//
// Minimum inference: sets are cache-first per note version (sourceHash). The
// on-device model runs only when the student starts practice (`prepare`), only
// for notes long enough to be worth it, at most MAX_MODEL_NOTES per session,
// and only in the foreground. Everything else — and every device without
// Apple Intelligence — uses the deterministic heuristic set, immediately.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import type { AppData, NoteItem } from "../types";
import * as aiCache from "./cache";
import { createModelRunner, getAvailability } from "./client";
import { buildStudySet, heuristicStudySet, MIN_MODEL_NOTE_CHARS } from "./studySets";
import { stableHash } from "./text";
import type { StudyCard, StudyQuestion, StudySet, StudySetOrigin } from "./types";

const MAX_MODEL_NOTES = 2;
const MAX_CARDS = 24;
const MAX_QUESTIONS = 12;

export type CombinedStudySet = {
  cards: StudyCard[];
  questions: StudyQuestion[];
  concepts: string[];
  origin: StudySetOrigin | null;
  byNote: Record<string, StudySet>;
};

function combine(sets: StudySet[]): CombinedStudySet {
  const byNote: Record<string, StudySet> = {};
  sets.forEach((set) => {
    byNote[set.noteId] = set;
  });
  const cards = sets.flatMap((set) => set.cards).slice(0, MAX_CARDS);
  const questions = sets.flatMap((set) => set.questions).slice(0, MAX_QUESTIONS);
  const concepts = Array.from(new Set(sets.flatMap((set) => set.concepts))).slice(0, 12);
  const origin: StudySetOrigin | null = sets.some((set) => set.origin === "onDevice") ? "onDevice" : sets.length ? "heuristic" : null;
  return { cards, questions, concepts, origin, byNote };
}

export function useStudySets(notes: NoteItem[], data: AppData, locale: string) {
  const noteKey = notes.map((note) => `${note.id}:${stableHash(String(note.sourceText || ""))}`).join("|");
  const heuristicSets = useMemo(() => notes.map((note) => heuristicStudySet(note, data)), [noteKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [cached, setCached] = useState<Record<string, StudySet>>({});
  const [preparing, setPreparing] = useState(false);
  const preparedKey = useRef<string>("");
  // The cache read is kept as a promise so `prepare` can wait for it: a set
  // saved in an earlier session must never be regenerated.
  const cacheLoad = useRef<Promise<Record<string, StudySet>> | null>(null);

  useEffect(() => {
    let active = true;
    const load = Promise.all(notes.map((note) => aiCache.loadStudySet(note.id))).then((sets) => {
      const next: Record<string, StudySet> = {};
      sets.forEach((set, index) => {
        const note = notes[index];
        if (set && note && set.sourceHash === stableHash(String(note.sourceText || ""))) next[note.id] = set;
      });
      return next;
    });
    cacheLoad.current = load;
    load.then((next) => {
      if (active) setCached(next);
    });
    return () => {
      active = false;
    };
  }, [noteKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const combined = useMemo(
    () => combine(heuristicSets.map((set) => cached[set.noteId] || set)),
    [cached, heuristicSets]
  );

  /** Called when practice starts: upgrade eligible notes with the on-device model. */
  const prepare = useCallback(async () => {
    if (Platform.OS !== "ios" || preparedKey.current === noteKey) return;
    preparedKey.current = noteKey;
    const saved = (await cacheLoad.current?.catch(() => ({} as Record<string, StudySet>))) || cached;
    const eligible = notes
      .filter((note) => !saved[note.id] && !cached[note.id] && String(note.sourceText || "").trim().length >= MIN_MODEL_NOTE_CHARS)
      .slice(0, MAX_MODEL_NOTES);
    if (!eligible.length || AppState.currentState !== "active") return;
    const availability = await getAvailability(locale).catch(() => null);
    if (!availability || availability.state !== "available") return;
    setPreparing(true);
    const runner = createModelRunner(locale);
    const upgraded: Record<string, StudySet> = {};
    try {
      for (const note of eligible) {
        if (AppState.currentState !== "active") break;
        const set = await buildStudySet(note, data, runner, { contextSize: availability.contextSize, locale });
        if (set.origin === "onDevice") {
          upgraded[note.id] = set;
          await aiCache.saveStudySet(set);
        }
      }
    } finally {
      setPreparing(false);
      if (Object.keys(upgraded).length) setCached((current) => ({ ...current, ...upgraded }));
    }
  }, [cached, data, locale, noteKey, notes]);

  return { ...combined, preparing, prepare };
}
