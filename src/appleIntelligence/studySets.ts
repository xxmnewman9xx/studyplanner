// Study sets from the student's own notes (F5). The heuristic path is the
// product for every iPhone without Apple Intelligence and for locales the
// model does not support, so it has to be genuinely useful on its own.

import { parseNoteInsights } from "../intelligence";
import { AppData, NoteItem } from "../types";
import { noteForStudySet } from "./context";
import { cleanString, normalizeText, stableHash, tokenize } from "./text";
import { ModelRunner, StudyCard, StudyQuestion, StudySet } from "./types";
import { STUDY_SET_SCHEMA_VERSION, validateNoteStudySet } from "./validators";

export const MIN_MODEL_NOTE_CHARS = 400;
const MAX_CARDS = 12;
const MAX_QUESTIONS = 6;

export type DefinitionPair = { term: string; definition: string; line: number; quote: string };

const BULLET = /^\s*(?:[-•*·▪◦‣–—>]+|\(?\d{1,3}[.)]|\(?[a-zA-Z][.)](?=\s))\s*/u;
const ADMIN_TERM = /^(?:date|due|due date|deadline|homework|hw|assignment|reading|readings|page|pages|p|week|unit|lecture|chapter|ch|class|room|time|professor|prof|instructor|ta|office hours|email|e-mail|note|notes|todo|to do|reminder|question|answer|q|a|example|examples|e\.g|ex|eg|summary|topic|topics|agenda|exam|quiz|test|midterm|final|grade|grades|source|sources|ref|reference|references|http|https|www|tip|tips|important|remember|warning|update|announcement)\b/i;
const PRONOUN_START = /^(?:this|that|it|there|these|those|he|she|they|we|you|i|which|what|who|here|its|it's|each|every|one|some|many|most|all|our|my|your)\b/i;
const LEADING_ARTICLE = /^(?:the|a|an|el|la|los|las|le|les|l'|der|die|das|o|os|as|um|uma|un|una)\s+/i;
const CJK = /[぀-ヿ㐀-䶿一-鿿가-힯]/u;

function termOk(term: string) {
  if (term.length < 2 || term.length > 60) return false;
  if (!/\p{L}/u.test(term)) return false;
  if (ADMIN_TERM.test(term) || /https?:|www\./i.test(term)) return false;
  if (CJK.test(term)) return term.replace(/\s+/g, "").length <= 20;
  const words = term.split(/\s+/).filter(Boolean);
  return words.length >= 1 && words.length <= 6;
}

function definitionOk(term: string, definition: string) {
  if (definition.length < 6) return false;
  if (normalizeText(definition) === normalizeText(term)) return false;
  if (CJK.test(definition)) return definition.replace(/\s+/g, "").length >= 4;
  const letterWords = definition.split(/\s+/).filter((word) => /\p{L}{2,}/u.test(word));
  return letterWords.length >= 2;
}

const COPULA = /^(.{2,60}?)\s+(?:is defined as|is|are|means|refers to|describes|es|son|significa|se define como|est|sont|désigne|ist|sind|bezeichnet|é|são|significa|هو|هي|تعني)\s+(.{6,})$/iu;

/** Parses "Term: definition", "Term - definition", "Term is …", "Xとは…", "X是指…" lines. */
export function parseDefinitionLine(rawLine: string): { term: string; definition: string } | null {
  const line = rawLine.replace(BULLET, "").replace(/\s+/g, " ").trim();
  if (line.length < 8 || line.length > 400) return null;
  const tryPair = (term: string, definition: string) => {
    const cleanTerm = term.replace(/^[*_"'“”‘’`]+|[*_"'“”‘’`]+$/g, "").trim();
    const cleanDefinition = definition.replace(/^[*_"'“”‘’`\s]+|[*_"'“”‘’`\s]+$/g, "").trim();
    if (!termOk(cleanTerm) || !definitionOk(cleanTerm, cleanDefinition)) return null;
    return { term: cleanTerm, definition: cleanDefinition.slice(0, 240).trim() };
  };

  const colon = line.match(/^([^:：]{2,60}?)\s*[:：]\s*(.+)$/u);
  if (colon && !/\d$/.test(colon[1]) && !/^\d/.test(colon[2])) {
    const pair = tryPair(colon[1], colon[2]);
    if (pair) return pair;
  }
  const dash = line.match(/^(.{2,60}?)\s+[-–—]\s+(.+)$/u);
  if (dash) {
    const pair = tryPair(dash[1], dash[2]);
    if (pair) return pair;
  }
  const japanese = line.match(/^(.{1,30}?)とは[、,，]?\s*(.{4,})$/u);
  if (japanese) {
    const pair = tryPair(japanese[1], japanese[2].replace(/(?:のこと)?(?:である|です)?[。.]?$/u, ""));
    if (pair) return pair;
  }
  const chinese = line.match(/^(.{1,20}?)(?:是指|指的是|定义为|定義為)(.{4,})$/u);
  if (chinese) {
    const pair = tryPair(chinese[1], chinese[2]);
    if (pair) return pair;
  }
  const copula = line.match(COPULA);
  if (copula && !PRONOUN_START.test(copula[1])) {
    const term = copula[1].replace(LEADING_ARTICLE, "");
    if (term.split(/\s+/).length <= 4) {
      const pair = tryPair(term, copula[2]);
      if (pair) return pair;
    }
  }
  return null;
}

export function extractDefinitionPairs(sourceText: string): DefinitionPair[] {
  const pairs: DefinitionPair[] = [];
  const seen = new Set<string>();
  String(sourceText || "")
    .split(/\r\n|\r|\n/)
    .forEach((rawLine, index) => {
      const pair = parseDefinitionLine(rawLine);
      if (!pair) return;
      const key = normalizeText(pair.term);
      if (!key || seen.has(key)) return;
      seen.add(key);
      pairs.push({ ...pair, line: index + 1, quote: cleanString(rawLine, 240) });
    });
  return pairs;
}

function hashNumber(value: string) {
  return parseInt(stableHash(value).slice(0, 8), 16);
}

function blankTerm(definition: string, term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = CJK.test(term) ? new RegExp(escaped, "gu") : new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, "giu");
  return CJK.test(term) ? definition.replace(pattern, "___") : definition.replace(pattern, "$1___");
}

function questionsFromPairs(noteId: string, pairs: DefinitionPair[]): StudyQuestion[] {
  if (pairs.length < 4) return [];
  const questions: StudyQuestion[] = [];
  for (let i = 0; i < pairs.length && questions.length < MAX_QUESTIONS; i += 1) {
    const pair = pairs[i];
    const correctKey = normalizeText(pair.term);
    const distractors = pairs
      .filter((other) => other !== pair && normalizeText(other.term) !== correctKey)
      .map((other) => ({ term: other.term, order: hashNumber(`${noteId}|${i}|${other.term}`) }))
      .sort((a, b) => a.order - b.order || a.term.localeCompare(b.term))
      .map((entry) => entry.term)
      .filter((term, index, list) => list.findIndex((other) => normalizeText(other) === normalizeText(term)) === index)
      .slice(0, 3);
    if (distractors.length < 3) continue;
    const answerIndex = (hashNumber(`${noteId}|answer|${pair.term}`) % 4) as 0 | 1 | 2 | 3;
    const options = [...distractors];
    options.splice(answerIndex, 0, pair.term);
    const stem = blankTerm(pair.definition, pair.term).slice(0, 240);
    if (!tokenize(stem.replace(/___/g, " ")).length) continue;
    questions.push({
      id: `hq_${stableHash(`${noteId}|${pair.term}|${pair.line}`)}`,
      stem,
      options: [options[0], options[1], options[2], options[3]],
      answerIndex,
      why: `${pair.term}: ${pair.definition}`.slice(0, 240),
      source: { quote: pair.quote, line: pair.line },
    });
  }
  return questions;
}

function conceptCards(note: NoteItem, data: AppData | undefined, skip: Set<string>): { cards: StudyCard[]; concepts: string[] } {
  let concepts: string[] = [];
  try {
    concepts = parseNoteInsights(note, data).concepts;
  } catch {
    concepts = note.terms || [];
  }
  const lines = String(note.sourceText || "").split(/\r\n|\r|\n/);
  const cards: StudyCard[] = [];
  for (const concept of concepts) {
    const key = normalizeText(concept);
    if (!key || skip.has(key)) continue;
    const index = lines.findIndex((line) => normalizeText(line).includes(key) && normalizeText(line) !== key);
    if (index < 0) continue;
    const quote = cleanString(lines[index], 240);
    cards.push({ id: `hc_${stableHash(`${note.id}|concept|${concept}`)}`, front: cleanString(concept, 120), back: quote, source: { quote, line: index + 1 } });
  }
  return { cards, concepts: concepts.map((concept) => cleanString(concept, 60)).filter(Boolean) };
}

/** Deterministic, offline study set built only from the note's own lines. */
export function heuristicStudySet(note: NoteItem, data?: AppData, now: Date = new Date()): StudySet {
  const pairs = extractDefinitionPairs(note.sourceText);
  const cards: StudyCard[] = pairs.slice(0, MAX_CARDS).map((pair) => ({
    id: `hc_${stableHash(`${note.id}|${pair.term}|${pair.line}`)}`,
    front: pair.term,
    back: pair.definition,
    source: { quote: pair.quote, line: pair.line },
  }));
  const pairTerms = new Set(pairs.map((pair) => normalizeText(pair.term)));
  const fallback = conceptCards(note, data, pairTerms);
  if (cards.length < 3) cards.push(...fallback.cards.slice(0, MAX_CARDS - cards.length));
  const concepts = [...pairs.map((pair) => pair.term), ...fallback.concepts]
    .filter((concept, index, list) => list.findIndex((other) => normalizeText(other) === normalizeText(concept)) === index)
    .slice(0, 8);
  return {
    noteId: note.id,
    sourceHash: stableHash(String(note.sourceText || "")),
    origin: "heuristic",
    summary: cleanString(note.summary, 400),
    concepts,
    cards,
    questions: questionsFromPairs(note.id, pairs),
    createdAt: now.toISOString(),
    schemaVersion: STUDY_SET_SCHEMA_VERSION,
  };
}

export type BuildStudySetOptions = { contextSize: number; signal?: AbortSignal; timeoutMs?: number; now?: Date; locale?: string };

/**
 * Cache-agnostic orchestrator: validated on-device set when a runner exists
 * and the note is long enough, otherwise (or on any failure) the heuristic set.
 */
export async function buildStudySet(note: NoteItem, data: AppData, runner: ModelRunner | null, options: BuildStudySetOptions): Promise<StudySet> {
  const now = options.now || new Date();
  const fallback = () => heuristicStudySet(note, data, now);
  if (!runner || String(note.sourceText || "").length < MIN_MODEL_NOTE_CHARS) return fallback();
  const attempt = async (contextSize: number) => {
    const excerpt = noteForStudySet(note, contextSize);
    try {
      return await runner(
        "noteStudySet",
        { title: cleanString(note.title, 120), text: excerpt.text, startLine: excerpt.startLine, locale: options.locale },
        { signal: options.signal, timeoutMs: options.timeoutMs }
      );
    } catch {
      return { ok: false as const, code: "unavailable" as const };
    }
  };
  let result = await attempt(options.contextSize);
  if (!result.ok && result.code === "contextOverflow") {
    // One retry with half the note budget.
    result = await attempt(Math.floor((options.contextSize + 1400) / 2));
  }
  if (!result.ok) return fallback();
  return validateNoteStudySet(result.value, note, now) || fallback();
}
