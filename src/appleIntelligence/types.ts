// Shared contract for StudyPlanner 2.2 on-device intelligence.
// Pure types only: no react-native imports, so tsx tests can load this file.
//
// Rule of the layer: the model proposes, deterministic code validates, and the
// student confirms. Nothing in here is ever written into AppData directly.

export type AIFeature = "syllabusExtract" | "noteStudySet" | "dailyBrief" | "taskProposal";

export type AIAvailabilityState = "available" | "unavailable" | "unsupportedOS" | "missingModule";

export type AIUnavailableReason =
  | "deviceNotEligible"
  | "appleIntelligenceNotEnabled"
  | "modelNotReady"
  | "localeUnsupported"
  | "userDisabled";

export type AIAvailability = {
  state: AIAvailabilityState;
  reason?: AIUnavailableReason;
  /** Token window reported by SystemLanguageModel.contextSize (4096 on iOS 26). */
  contextSize: number;
  osVersion: string;
  /** Whether iOS 26 RecognizeDocumentsRequest (table-aware OCR) exists on this OS. */
  documentReader: boolean;
};

export type AIErrorCode =
  | "contextOverflow"
  | "guardrail"
  | "refusal"
  | "unsupportedLocale"
  | "rateLimited"
  | "busy"
  | "decoding"
  | "assetsUnavailable"
  | "timeout"
  | "cancelled"
  | "background"
  | "unavailable";

export type AIResult<T> = { ok: true; value: T; cached: boolean } | { ok: false; code: AIErrorCode };

// ---------------------------------------------------------------------------
// Raw model output shapes (mirror the Swift @Generable schemas 1:1).
// Everything here is UNTRUSTED until it passes validators.ts.
// ---------------------------------------------------------------------------

export type RawSyllabusKind =
  | "assignment"
  | "exam"
  | "quiz"
  | "midterm"
  | "final"
  | "project"
  | "reading"
  | "lab"
  | "presentation";

export type RawSyllabusCourse = {
  code: string;
  title?: string;
  meetingText?: string;
  sourceSpan: string;
};

export type RawSyllabusItem = {
  kind: RawSyllabusKind;
  title: string;
  courseCode?: string;
  /** Verbatim date text copied from the source. Parsed ONLY by deterministic code. */
  dateText: string;
  timeText?: string;
  weightPercent?: number;
  sourceSpan: string;
};

export type RawSyllabusChunk = {
  courses: RawSyllabusCourse[];
  items: RawSyllabusItem[];
};

export type RawStudyCard = { front: string; back: string; sourceSpan: string };

export type RawStudyQuestion = {
  stem: string;
  options: string[];
  answerIndex: number;
  why: string;
  sourceSpan: string;
};

export type RawNoteStudySet = {
  summary: string;
  concepts: string[];
  cards: RawStudyCard[];
  questions: RawStudyQuestion[];
};

export type RawDailyBrief = { headline: string; body: string; focusIndex: number };

export type RawTaskProposal = {
  title: string;
  courseHint: string;
  dateText: string;
  timeText?: string;
  kind: RawSyllabusKind;
  estimateMinutes: number;
};

// ---------------------------------------------------------------------------
// Validated shapes (safe to display; still proposals, never AppData).
// ---------------------------------------------------------------------------

export type ImportOrigin = "heuristic" | "onDevice" | "both";

/** A span into the user's own note text, used to cite every generated item. */
export type SourceCitation = {
  /** Verbatim (normalized-matched) line from the note. */
  quote: string;
  /** 1-based line number in the note sourceText, when resolvable. */
  line?: number;
};

export type StudyCard = { id: string; front: string; back: string; source: SourceCitation };

export type StudyQuestion = {
  id: string;
  stem: string;
  options: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
  why: string;
  source: SourceCitation;
  /** Set on questions imported from a friend's Quiz Duel. */
  sharedByClassmate?: boolean;
};

export type StudySetOrigin = "onDevice" | "heuristic" | "duel";

export type StudySet = {
  noteId: string;
  /** Hash of note.sourceText the set was built from; stale when it changes. */
  sourceHash: string;
  origin: StudySetOrigin;
  summary: string;
  concepts: string[];
  cards: StudyCard[];
  questions: StudyQuestion[];
  createdAt: string;
  schemaVersion: number;
};

export type PracticeResult = {
  id: string;
  noteId: string;
  examId?: string;
  classId?: string;
  itemId: string;
  kind: "card" | "question";
  concept?: string;
  correct: boolean;
  answeredAt: string;
};

export type WeakTopic = {
  concept: string;
  classId?: string;
  examId?: string;
  misses: number;
  attempts: number;
  /** 0..1, higher is weaker. */
  weakness: number;
};

/** Deterministic Study Now pick plus optional on-device phrasing. */
export type StudyNowCandidate = {
  id: string;
  kind: "task" | "exam_prep" | "note_review" | "study_block";
  classId?: string;
  classCode?: string;
  title: string;
  minutes: number;
  /** Days until the related deadline/exam, when known. */
  daysUntil?: number;
  taskId?: string;
  examId?: string;
  noteId?: string;
  blockId?: string;
};

export type DailyBrief = {
  dateKey: string;
  candidate: StudyNowCandidate;
  /** "Now: 25 min Bio ch. 7" style line, always template-built from facts. */
  line: string;
  /** One sentence "why". Template unless model copy passed fidelity checks. */
  reason: string;
  origin: "template" | "onDevice";
};

export type TaskProposal = {
  title: string;
  classId?: string;
  /** Resolved by deterministic date parsers only. */
  dueDate?: string;
  time?: string;
  type: string;
  estimateMinutes: number;
  weight?: number;
  /** What still needs the student's decision before it can be saved. */
  needs: Array<"class" | "date" | "title">;
  origin: "heuristic" | "onDevice";
};

// ---------------------------------------------------------------------------
// Crunch Forecast (deterministic, zero inference).
// ---------------------------------------------------------------------------

export type ForecastColor = "calm" | "steady" | "busy" | "crunch";

export type ForecastItemRef = {
  id: string;
  kind: "task" | "exam";
  classId?: string;
  classCode?: string;
  title: string;
  dueDate: string;
  weight?: number;
  /** Prep minutes attributed to this item. */
  prepMinutes: number;
};

export type ForecastWeek = {
  /** ISO date (YYYY-MM-DD) of the first day of the week in the user's week convention. */
  weekStart: string;
  weekIndex: number;
  loadScore: number;
  /** 0..1 normalized against the term max and absolute thresholds. */
  intensity: number;
  color: ForecastColor;
  items: ForecastItemRef[];
  isCurrent: boolean;
};

export type ForecastStartBy = {
  /** Class the start date is for. */
  classId?: string;
  classCode?: string;
  /** The crunch week this start date defends against. */
  weekStart: string;
  startDate: string;
  prepMinutes: number;
  reasonItemIds: string[];
};

export type CrunchForecast = {
  generatedFor: string;
  termStart: string;
  termEnd: string;
  weeks: ForecastWeek[];
  crunchWeeks: string[];
  startBy: ForecastStartBy[];
  totals: { items: number; exams: number; tasks: number; classes: number };
  /** True when built from a pending (not yet applied) import. */
  fromPreview: boolean;
};

// ---------------------------------------------------------------------------
// Growth payloads (no server; fragment-only links).
// ---------------------------------------------------------------------------

export type ClassPackItem = {
  k: "t" | "e";
  t: string;
  d: string;
  tm?: string;
  w?: number;
  x?: string;
};

export type ClassPack = {
  v: 1;
  c: { code: string; name?: string; days?: string; time?: string };
  i: ClassPackItem[];
};

export type QuizDuel = {
  v: 1;
  title: string;
  q: Array<{ s: string; o: [string, string, string, string]; a: 0 | 1 | 2 | 3 }>;
  /** Sender's score, shown as the target to beat. */
  score?: number;
};

export type SharedPayload = { kind: "pack"; pack: ClassPack } | { kind: "duel"; duel: QuizDuel };

// ---------------------------------------------------------------------------
// Dependency-injected model runner. Pure orchestrators (smartSyllabus, study
// sets, briefs, quick-add) take one of these so they are testable with fakes;
// client.ts provides the real one backed by the native module.
// ---------------------------------------------------------------------------

export type ModelRunOptions = { signal?: AbortSignal; timeoutMs?: number };

export type ModelRunner = (feature: AIFeature, input: Record<string, unknown>, options?: ModelRunOptions) => Promise<AIResult<unknown>>;
