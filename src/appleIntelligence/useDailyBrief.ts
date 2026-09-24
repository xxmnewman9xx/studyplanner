// Study Now (F4) at the app root: one brief per day, shared by Today, the Today
// widget, the Siri/Spotlight snapshot, and notifications.
//
// Code always picks the candidates and writes the line. The on-device model may
// only choose among the candidates and rephrase the one-sentence reason, at most
// once per calendar day, in the foreground, and only with 2+ candidates. The
// validated reason is cached with its date and candidate id; any change to the
// plan re-derives the line from facts while keeping today's cached reason only
// when it still belongs to the same candidate.

import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { dateKey } from "../intelligence";
import type { AppData } from "../types";
import * as aiCache from "./cache";
import { createModelRunner, getAvailability } from "./client";
import { briefWithModel, studyNowCandidates, templateBrief, type CopyFn } from "./studyNow";
import type { DailyBrief } from "./types";

const BRIEF_META_KEY = "brief:v1";

type CachedBrief = { dateKey: string; candidateId: string; reason: string; origin: DailyBrief["origin"] };

function parseCached(raw: string | null): CachedBrief | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<CachedBrief>;
    if (typeof value.dateKey !== "string" || typeof value.candidateId !== "string" || typeof value.reason !== "string") return null;
    return { dateKey: value.dateKey, candidateId: value.candidateId, reason: value.reason, origin: value.origin === "onDevice" ? "onDevice" : "template" };
  } catch {
    return null;
  }
}

/**
 * @param data active planner data, or null when the planner is locked (no brief).
 * @param t    copy function (textFor adapter) so the line is localized.
 */
export function useDailyBrief(data: AppData | null, t: CopyFn, locale: string): DailyBrief | null {
  const today = dateKey(new Date());
  const candidates = useMemo(() => (data ? studyNowCandidates(data, new Date()) : []), [data]);
  const template = useMemo(() => (data ? templateBrief(candidates, data, new Date(), t) : null), [candidates, data, t]);
  const [cached, setCached] = useState<CachedBrief | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    let active = true;
    aiCache.metaGet(BRIEF_META_KEY).then((raw) => {
      if (active) setCached(parseCached(raw));
    });
    return () => {
      active = false;
    };
  }, [today]);

  useEffect(() => {
    if (!data || Platform.OS !== "ios" || candidates.length <= 1 || inFlight.current) return;
    if (cached && cached.dateKey === today) return;
    if (AppState.currentState !== "active") return;
    let cancelled = false;
    inFlight.current = true;
    (async () => {
      try {
        const availability = await getAvailability(locale);
        if (cancelled || availability.state !== "available" || AppState.currentState !== "active") return;
        const brief = await briefWithModel(candidates, data, new Date(), t, createModelRunner(locale), { locale });
        if (!brief || cancelled) return;
        const entry: CachedBrief = { dateKey: brief.dateKey, candidateId: brief.candidate.id, reason: brief.reason, origin: brief.origin };
        // Cache even a template result: it records that today's one call happened.
        await aiCache.metaSet(BRIEF_META_KEY, JSON.stringify(entry));
        if (!cancelled) setCached(entry);
      } finally {
        inFlight.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cached, candidates, data, locale, t, today]);

  return useMemo(() => {
    if (!data || !template) return null;
    if (!cached || cached.dateKey !== today || cached.origin !== "onDevice") return template;
    const index = candidates.findIndex((candidate) => candidate.id === cached.candidateId);
    if (index < 0) return template;
    const picked = templateBrief(candidates, data, new Date(), t, index) || template;
    return { ...picked, reason: cached.reason, origin: "onDevice" };
  }, [cached, candidates, data, t, template, today]);
}
