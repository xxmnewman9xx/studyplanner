// Candidate payload builders that mirror the exact shapes `analyzeSyllabus`
// (src/ai.ts) emits, so on-device and Class Pack candidates flow through
// ReviewImport / applyImport exactly like Build 90 heuristic candidates.

import { daysUntilDate } from "../intelligence";
import { classColors, makeOwnershipId } from "../ownership/semesterOwnership";
import { AppData, ClassItem, ExamItem, ImportCandidate, TaskItem } from "../types";
import { noonFromKey } from "./dateKeys";

export const ON_DEVICE_SOURCE = "On-device AI import";
export const CLASS_PACK_SOURCE = "Class Pack";
export const DEFAULT_EXAM_TOPICS = ["Core concepts", "Practice problems", "Lecture notes"];
export type ExamKind = NonNullable<ExamItem["kind"]>;
export const EXAM_KINDS: ExamKind[] = ["Quiz", "Exam", "Midterm", "Final", "Presentation", "Project"];

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function classSlug(code: string) {
  return code.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
}

export function normalizeCode(code: string) {
  return String(code || "").replace(/[\s._-]+/g, "").toLowerCase();
}

/** "bio210", "BIO-210", "Bio 210" → "BIO 210". Returns null for anything that is not a course code. */
export function canonicalCourseCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const match = raw.normalize("NFKC").match(/\b([A-Za-z]{2,5})\s?[-._]?\s?(\d{2,4}[A-Za-z]?)\b/);
  if (!match) return null;
  const letters = match[1].toUpperCase();
  if (["MWF", "MW", "TR", "TTH"].includes(letters)) return null;
  return `${letters} ${match[2].toUpperCase()}`;
}

export function findClassByCode(data: AppData, code: string) {
  const key = normalizeCode(code);
  return data.classes.find((klass) => !klass.archivedAt && normalizeCode(klass.code) === key);
}

/** Same rules as the private `inferType` in src/ai.ts. */
export function inferTaskType(title: string) {
  const t = title.toLowerCase();
  if (t.includes("lab")) return "Lab";
  if (t.includes("essay") || t.includes("paper")) return "Essay";
  if (t.includes("read")) return "Reading";
  if (t.includes("project")) return "Project";
  if (t.includes("review")) return "Review";
  if (t.includes("discussion")) return "Discussion";
  return "Assignment";
}

/** Same rules as the private `estimateMinutes` in src/ai.ts. */
export function estimateTaskMinutes(title: string) {
  const t = title.toLowerCase();
  if (t.includes("project")) return 240;
  if (t.includes("case") || t.includes("essay") || t.includes("paper")) return 180;
  if (t.includes("problem") || t.includes("mechanism") || t.includes("set")) return 120;
  if (t.includes("lab")) return 90;
  if (t.includes("read")) return 40;
  return 75;
}

export function examKindFromTitle(title: string): ExamKind {
  const t = title.toLowerCase();
  if (/\bfinal\b/.test(t)) return "Final";
  if (/\bmidterm|mid-term\b/.test(t)) return "Midterm";
  if (/\bquiz/.test(t)) return "Quiz";
  if (/\bpresentation\b/.test(t)) return "Presentation";
  if (/\bproject\b/.test(t)) return "Project";
  return "Exam";
}

/** "5:00 pm" / "17:00" / "11:59PM" → "5:00 PM" style used across the app, or undefined. */
export function displayTime(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const text = raw.normalize("NFKC");
  const meridiem = text.match(/\b(\d{1,2}):(\d{2})\s?([AaPp])\.?[Mm]\.?/);
  if (meridiem) {
    const hour = Number(meridiem[1]);
    const minute = Number(meridiem[2]);
    if (hour >= 1 && hour <= 12 && minute <= 59) return `${hour}:${meridiem[2]} ${meridiem[3].toUpperCase()}M`;
    return undefined;
  }
  const clock = text.match(/\b([01]?\d|2[0-3])[:h](\d{2})\b/);
  if (clock) {
    const hour24 = Number(clock[1]);
    const minute = clock[2];
    if (Number(minute) > 59) return undefined;
    return `${hour24 % 12 || 12}:${minute} ${hour24 >= 12 ? "PM" : "AM"}`;
  }
  if (/\bmidnight\b/i.test(text)) return "11:59 PM";
  if (/\bnoon\b/i.test(text)) return "12:00 PM";
  return undefined;
}

function offsetFor(dueDate: string, now: Date) {
  const target = noonFromKey(dueDate);
  return target ? daysUntilDate(target, now) : 0;
}

export function buildTaskCandidate(input: {
  title: string;
  classId: string;
  dueDate: string;
  now: Date;
  time?: string;
  type?: string;
  weight?: number;
  source: string;
  confidence: number;
  approved: boolean;
  origin?: ImportCandidate["origin"];
}): ImportCandidate {
  const dueOffset = offsetFor(input.dueDate, input.now);
  const task: TaskItem = {
    id: makeOwnershipId("t"),
    title: input.title,
    classId: input.classId,
    type: input.type || inferTaskType(input.title),
    dueOffset,
    dueDate: input.dueDate,
    time: input.time || "11:59 PM",
    estimateMinutes: estimateTaskMinutes(input.title),
    done: false,
    urgent: dueOffset <= 2,
    source: input.source,
    subtasks: [{ title: "Confirm requirements", done: false }, { title: "Complete first pass", done: false }],
  };
  if (typeof input.weight === "number") task.weight = input.weight;
  const candidate: ImportCandidate = {
    id: makeOwnershipId("ic"),
    kind: "task",
    title: task.title,
    meta: `${task.type} · due ${task.dueDate} · ${task.time}`,
    classId: input.classId,
    confidence: input.confidence,
    payload: task,
    approved: input.approved,
  };
  if (input.origin) candidate.origin = input.origin;
  return candidate;
}

export function buildExamCandidate(input: {
  title: string;
  classId: string;
  dueDate: string;
  now: Date;
  time?: string;
  kind?: ExamKind;
  weight?: number;
  confidence: number;
  approved: boolean;
  origin?: ImportCandidate["origin"];
}): ImportCandidate {
  const exam: ExamItem = {
    id: makeOwnershipId("e"),
    classId: input.classId,
    title: input.title,
    dueOffset: offsetFor(input.dueDate, input.now),
    dueDate: input.dueDate,
    time: input.time || "9:00 AM",
    room: "Room TBD",
    topics: [...DEFAULT_EXAM_TOPICS],
  };
  if (input.kind) exam.kind = input.kind;
  if (typeof input.weight === "number") exam.weight = input.weight;
  const candidate: ImportCandidate = {
    id: makeOwnershipId("ic"),
    kind: "exam",
    title: exam.title,
    meta: `${exam.dueDate} · ${exam.time} · ${exam.room}`,
    classId: input.classId,
    confidence: input.confidence,
    payload: exam,
    approved: input.approved,
  };
  if (input.origin) candidate.origin = input.origin;
  return candidate;
}

const MEETING_DAYS = /\b(MWF|MW|TR|Mon Wed|Tue Thu|Monday Wednesday|Mon Wed Fri|Monday Wednesday Friday|Tuesday Thursday)\b/i;

export function buildClassCandidate(input: {
  code: string;
  name?: string;
  meetingText?: string;
  data: AppData;
  now: Date;
  paletteIndex: number;
  confidence: number;
  approved: boolean;
  origin?: ImportCandidate["origin"];
  days?: string;
  time?: string;
}): ImportCandidate {
  const meeting = input.meetingText || "";
  const days = input.days || meeting.match(MEETING_DAYS)?.[0] || "Tue Thu";
  const time = input.time || meeting.match(/\b\d{1,2}(?::\d{2})?\s?(?:AM|PM)\b/i)?.[0]?.toUpperCase() || "10:00 AM";
  const room = meeting.match(/\b(?:Room|Hall|Building|Online|Lab|Science|Business)\s?[A-Za-z0-9 ]{2,24}/i)?.[0]?.trim() || "Room TBD";
  let id = classSlug(input.code) || "class";
  if (input.data.classes.some((klass) => klass.id === id && normalizeCode(klass.code) !== normalizeCode(input.code))) {
    id = `${id}_${classSlug(input.code).length}${input.data.classes.length}`;
  }
  const [color, color2] = classColors(input.paletteIndex);
  const klass: ClassItem = {
    id,
    code: input.code,
    name: input.name || "New Course",
    professor: "Professor TBD",
    room,
    days,
    time,
    next: `${DAY_SHORT[(input.now.getDay() + 1) % 7]} · ${time}`,
    health: 0.76,
    grade: "Not set",
    color,
    color2,
    icon: /chem|bio/i.test(`${input.code} ${input.name || ""}`) ? "flask-conical" : "book-open",
  };
  const candidate: ImportCandidate = {
    id: makeOwnershipId("ic"),
    kind: "class",
    title: `${klass.code} · ${klass.name}`,
    meta: `${klass.days} · ${klass.time} · ${klass.room}`,
    classId: klass.id,
    confidence: input.confidence,
    payload: klass,
    approved: input.approved,
  };
  if (input.origin) candidate.origin = input.origin;
  return candidate;
}

export function candidateDueDate(candidate: ImportCandidate): string {
  const due = (candidate.payload as { dueDate?: unknown }).dueDate;
  return typeof due === "string" ? due : "";
}
