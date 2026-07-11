import {
  AppData,
  ClassItem,
  ClassPulseBreakdown,
  ClassPulseV2,
  DashboardSnapshot,
  ExamItem,
  FeedbackEvent,
  GradeForecast,
  HealthDimension,
  HealthDimensionKey,
  NoteItem,
  NotificationPlan,
  ParsedNoteInsight,
  PressureForecast,
  RiskRecommendation,
  SchedulePlan,
  SemanticColorState,
  SemesterAction,
  SemesterHealth,
  SemesterSnapshot,
  StudyRecommendation,
  StudyBlock,
  TaskItem,
  WidgetKey,
} from "./types";
import { COLORS, formatDue, minutesLabel } from "./seed";

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_ALIASES: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

export type RiskItem = RiskRecommendation;

export type StudyAsset = {
  noteId: string;
  flashcards: { front: string; back: string }[];
  quiz: { prompt: string; answer: string }[];
  guide: string[];
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
}

export function dateKey(date: Date) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseClock(time?: string) {
  const match = (time || "").match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return { hour: 17, minute: 0 };
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

function withClock(date: Date, time?: string) {
  const { hour, minute } = parseClock(time);
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function parseDateTime(date?: string, time?: string, fallbackOffset?: number, now = new Date()) {
  let base: Date | null = null;
  if (date && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [year, month, day] = date.slice(0, 10).split("-").map(Number);
    base = new Date(year, month - 1, day, 12, 0, 0);
  }
  if (!base && Number.isFinite(fallbackOffset)) {
    base = new Date(startOfDay(now));
    base.setDate(base.getDate() + Number(fallbackOffset));
  }
  if (!base) base = startOfDay(now);
  return withClock(base, time);
}

export function dueDateTime(item: Pick<TaskItem | ExamItem, "dueDate" | "time" | "dueOffset">, now = new Date()) {
  return parseDateTime(item.dueDate, item.time, item.dueOffset, now);
}

export function daysUntilDate(date: Date, now = new Date()) {
  return Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

export function daysUntilTask(task: TaskItem, now = new Date()) {
  return daysUntilDate(dueDateTime(task, now), now);
}

export function daysUntilExam(exam: ExamItem, now = new Date()) {
  return daysUntilDate(dueDateTime(exam, now), now);
}

function classDays(klass: ClassItem) {
  return klass.days
    .split(/[\s,/]+/)
    .map((part) => DAY_ALIASES[part.toLowerCase()])
    .filter((day): day is number => Number.isInteger(day));
}

export function nextClassOccurrence(klass: ClassItem, now = new Date()) {
  const days = classDays(klass);
  const today = startOfDay(now);
  for (let offset = 0; offset < 14; offset += 1) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + offset);
    if (!days.includes(candidate.getDay())) continue;
    const startsAt = withClock(candidate, klass.time);
    if (startsAt.getTime() > now.getTime() - 15 * 60 * 1000) return startsAt;
  }
  const fallback = new Date(today);
  fallback.setDate(today.getDate() + 1);
  return withClock(fallback, klass.time);
}

function findNextClass(data: AppData, now = new Date()) {
  return data.classes
    .map((klass) => ({ klass, startsAt: nextClassOccurrence(klass, now) }))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];
}

function classFor(data: AppData, classId?: string) {
  return data.classes.find((klass) => klass.id === classId) || data.classes[0] || {
    id: "class",
    code: "Class",
    name: "Imported class",
    professor: "Professor TBD",
    room: "Room TBD",
    days: "Tue Thu",
    time: "10:00 AM",
    next: "Next class",
    health: 0.65,
    grade: "Not set",
    color: COLORS.blue,
    color2: COLORS.green,
    icon: "book-open",
  } satisfies ClassItem;
}

function taskDueLabel(task: TaskItem, now = new Date()) {
  return formatDue(daysUntilTask(task, now));
}

function sortedActiveTasks(data: AppData, now = new Date()) {
  return data.tasks
    .filter((task) => !task.done)
    .slice()
    .sort((a, b) => {
      const dayDelta = daysUntilTask(a, now) - daysUntilTask(b, now);
      return dayDelta || dueDateTime(a, now).getTime() - dueDateTime(b, now).getTime() || b.estimateMinutes - a.estimateMinutes;
    });
}

function classStats(data: AppData, klass: ClassItem, now = new Date()) {
  const tasks = data.tasks.filter((task) => task.classId === klass.id);
  const active = tasks.filter((task) => !task.done);
  const overdue = active.filter((task) => daysUntilTask(task, now) < 0);
  const dueSoon = active.filter((task) => daysUntilTask(task, now) <= 2);
  const completed = tasks.filter((task) => task.done);
  const nextExam = data.exams.filter((exam) => exam.classId === klass.id).sort((a, b) => daysUntilExam(a, now) - daysUntilExam(b, now))[0];
  const noteCount = data.notes.filter((note) => note.classId === klass.id).length;
  return { tasks, active, overdue, dueSoon, completed, nextExam, noteCount };
}

export function buildClassPulseBreakdowns(data: AppData, now = new Date()): ClassPulseBreakdown[] {
  return data.classes.map((klass) => {
    const stats = classStats(data, klass, now);
    const examDays = stats.nextExam ? daysUntilExam(stats.nextExam, now) : 99;
    const completionTrend = stats.tasks.length ? stats.completed.length / stats.tasks.length : 0.72;
    const workload = clamp(100 - stats.active.reduce((sum, task) => sum + Math.max(18, task.estimateMinutes) / 18, 0) - Math.max(0, 8 - examDays) * 5);
    const momentum = clamp(completionTrend * 100 + Math.min(15, stats.noteCount * 4) - stats.overdue.length * 16);
    const confidence = clamp(klass.health * 100 - stats.overdue.length * 14 - stats.dueSoon.length * 5 - Math.max(0, 7 - examDays) * 4 + Math.min(10, stats.noteCount * 2));
    const score = Math.round(clamp(confidence * 0.46 + workload * 0.28 + momentum * 0.26, 15, 99));
    const label: ClassPulseBreakdown["label"] = score >= 82 ? "On track" : score >= 68 ? "Watch" : "Needs focus";
    const causes = [
      stats.overdue.length ? `${stats.overdue.length} overdue` : "",
      stats.dueSoon.length ? `${stats.dueSoon.length} due soon` : "",
      stats.nextExam && examDays <= 7 ? `${stats.nextExam.title} in ${examDays}d` : "",
      stats.noteCount ? `${stats.noteCount} notes ready` : "",
    ].filter(Boolean);
    return {
      classId: klass.id,
      score,
      label,
      confidence: Math.round(confidence),
      momentum: Math.round(momentum),
      workload: Math.round(workload),
      completionTrend: Math.round(completionTrend * 100),
      nextMove: stats.overdue[0]?.title || stats.dueSoon[0]?.title || (stats.nextExam ? `Review ${stats.nextExam.title}` : "Add a short review"),
      causes: causes.length ? causes : ["No immediate pressure"],
      accentColor: klass.color,
    };
  }).sort((a, b) => a.score - b.score);
}

function slotForDate(date: Date, slotIndex: number, persona: string) {
  const early = persona.includes("early");
  const slots = early
    ? [{ h: 9, m: 0, minutes: 60 }, { h: 10, m: 30, minutes: 75 }, { h: 15, m: 0, minutes: 60 }, { h: 18, m: 0, minutes: 60 }]
    : [{ h: 16, m: 30, minutes: 45 }, { h: 18, m: 30, minutes: 60 }, { h: 20, m: 0, minutes: 45 }, { h: 10, m: 0, minutes: 75 }];
  const slot = slots[slotIndex % slots.length];
  const startsAt = new Date(date);
  startsAt.setHours(slot.h, slot.m, 0, 0);
  return { startsAt, minutes: slot.minutes };
}

function blockFromSlot(params: {
  id: string;
  date: Date;
  slotIndex: number;
  minutes: number;
  classId: string;
  title: string;
  reason: string;
  taskId?: string;
  examId?: string;
  noteId?: string;
  source: StudyBlock["source"];
  persona: string;
}) {
  const slot = slotForDate(params.date, params.slotIndex, params.persona);
  const startsAt = slot.startsAt;
  const minutes = Math.min(params.minutes, slot.minutes);
  const endsAt = new Date(startsAt);
  endsAt.setMinutes(endsAt.getMinutes() + minutes);
  const time = `${startsAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} - ${endsAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  return {
    id: params.id,
    day: startsAt.toLocaleDateString(undefined, { weekday: "long" }),
    time,
    taskId: params.taskId,
    examId: params.examId,
    noteId: params.noteId,
    classId: params.classId,
    title: params.title,
    minutes,
    reason: params.reason,
    completed: false,
    date: dateKey(startsAt),
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    source: params.source,
  } satisfies StudyBlock;
}

export function buildSchedulePlan(data: AppData, now = new Date()): SchedulePlan {
  const persona = `${data.prefs.studyPersonality} ${data.prefs.workloadStyle}`.toLowerCase();
  const dailyCap = persona.includes("heavy") ? 210 : persona.includes("nudge") || persona.includes("adhd") ? 110 : 150;
  const dailyLoad: Record<string, number> = {};
  const blocks: StudyBlock[] = [];
  const rationale: string[] = [];
  const changedSinceLastPlan: string[] = [];
  const active = sortedActiveTasks(data, now).slice(0, 12);

  const reserve = (target: Date, minutes: number, descriptor: Omit<Parameters<typeof blockFromSlot>[0], "date" | "slotIndex" | "minutes" | "persona">) => {
    const candidate = new Date(target);
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const key = dateKey(candidate);
      const load = dailyLoad[key] || 0;
      if (load + minutes <= dailyCap || attempt >= 9) {
        dailyLoad[key] = load + minutes;
        blocks.push(blockFromSlot({ ...descriptor, date: candidate, slotIndex: blocks.filter((b) => b.date === key).length, minutes, persona }));
        return;
      }
      candidate.setDate(candidate.getDate() + 1);
      changedSinceLastPlan.push(`${descriptor.title} moved to ${candidate.toLocaleDateString(undefined, { weekday: "short" })}.`);
    }
  };

  active.forEach((task, index) => {
    const dueAt = dueDateTime(task, now);
    const days = daysUntilTask(task, now);
    const chunks = Math.max(1, Math.min(4, Math.ceil(task.estimateMinutes / (days <= 1 ? 50 : 75))));
    for (let chunk = 0; chunk < chunks; chunk += 1) {
      const target = new Date(now);
      const leadDays = Math.max(0, Math.min(Math.max(days - 1, 0), chunks - chunk - 1));
      target.setDate(startOfDay(now).getDate() + leadDays);
      const minutes = Math.max(25, Math.ceil(task.estimateMinutes / chunks));
      reserve(target, minutes, {
        id: `sb_${task.id}_${chunk}`,
        taskId: task.id,
        classId: task.classId,
        title: chunks > 1 ? `${task.title} ${chunk + 1}/${chunks}` : task.title,
        reason: days < 0
          ? "Recover first."
          : chunks > 1
            ? `Split before ${dueAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}.`
            : "Protected time.",
        source: chunks > 1 ? "large_task_split" : "deadline",
      });
    }
  });

  data.exams
    .slice()
    .sort((a, b) => daysUntilExam(a, now) - daysUntilExam(b, now))
    .slice(0, 6)
    .forEach((exam) => {
      const days = daysUntilExam(exam, now);
      if (days < 0 || days > 14) return;
      [Math.min(7, days - 2), Math.min(3, days - 1), 1].filter((lead, index, arr) => lead >= 0 && arr.indexOf(lead) === index).forEach((lead, index) => {
        const target = new Date(now);
        target.setDate(startOfDay(now).getDate() + lead);
        reserve(target, index === 0 ? 45 : 35, {
          id: `sb_exam_${exam.id}_${lead}`,
          examId: exam.id,
          classId: exam.classId,
          title: `${exam.title} review`,
          reason: "Exam prep.",
          source: "exam_prep",
        });
      });
    });

  data.notes.slice(0, 5).forEach((note, index) => {
    if (!note.terms.length && !note.sourceText) return;
    const target = new Date(now);
    target.setDate(startOfDay(now).getDate() + 1 + (index % 3));
    reserve(target, 25, {
      id: `sb_note_${note.id}`,
      noteId: note.id,
      classId: note.classId,
      title: `Recall ${note.title}`,
      reason: "Keep notes active.",
      source: "note_review",
    });
  });

  const cappedDays = Object.entries(dailyLoad).filter(([, load]) => load >= dailyCap).map(([key]) => key);
  if (blocks.length) rationale.push(`${blocks.length} blocks built.`);
  if (active.some((task) => task.estimateMinutes >= 150)) rationale.push("Large work split.");
  if (data.exams.some((exam) => daysUntilExam(exam, now) <= 14)) rationale.push("Exam prep added.");

  return {
    generatedAt: new Date(now).toISOString(),
    blocks: blocks.slice(0, 24),
    dailyLoad,
    cappedDays,
    changedSinceLastPlan: [...new Set(changedSinceLastPlan)].slice(0, 6),
    rationale,
  };
}

export function buildRiskRecommendations(data: AppData, schedulePlan = buildSchedulePlan(data), now = new Date()): RiskRecommendation[] {
  const active = sortedActiveTasks(data, now);
  const overdue = active.filter((task) => daysUntilTask(task, now) < 0);
  const dueToday = active.filter((task) => daysUntilTask(task, now) === 0);
  const unscheduled = active.filter((task) => !schedulePlan.blocks.some((block) => block.taskId === task.id));
  const nextExam = data.exams.slice().sort((a, b) => daysUntilExam(a, now) - daysUntilExam(b, now))[0];
  const weakPulse = buildClassPulsesV2(data, buildGradeForecasts(data, now), now)[0];
  const weakClass = classFor(data, weakPulse?.classId);
  const recommendations: RiskRecommendation[] = [
    {
      id: "overdue",
      label: overdue.length ? `${overdue.length} overdue` : "No overdue work",
      detail: overdue[0]?.title || "Clear.",
      score: overdue.length ? 98 : 12,
      severity: overdue.length ? "high" : "low",
      confidence: overdue.length ? 0.96 : 0.82,
      cause: overdue.length ? "Past due." : "No overdue work.",
      action: overdue.length ? "startFocus" : "addReview",
      affectedDate: overdue[0]?.dueDate,
      color: overdue.length ? COLORS.red : COLORS.green,
      taskId: overdue[0]?.id,
      classId: overdue[0]?.classId,
    },
    {
      id: "today",
      label: `${dueToday.length} due today`,
      detail: dueToday[0]?.title || "Get ahead.",
      score: dueToday.length ? 82 : 20,
      severity: dueToday.length >= 2 ? "high" : dueToday.length ? "medium" : "low",
      confidence: 0.9,
      cause: dueToday.length ? "Due today." : "No due date today.",
      action: dueToday.length ? "splitTask" : "addReview",
      affectedDate: dueToday[0]?.dueDate,
      color: dueToday.length ? COLORS.orange : COLORS.blue,
      taskId: dueToday[0]?.id,
      classId: dueToday[0]?.classId,
    },
    {
      id: "exam",
      label: nextExam ? `Exam in ${daysUntilExam(nextExam, now)}d` : "No exam risk",
      detail: nextExam?.title || "Clear.",
      score: nextExam ? clamp(100 - daysUntilExam(nextExam, now) * 8, 24, 94) : 10,
      severity: nextExam && daysUntilExam(nextExam, now) <= 3 ? "high" : nextExam && daysUntilExam(nextExam, now) <= 7 ? "medium" : "low",
      confidence: nextExam ? 0.88 : 0.62,
      cause: nextExam ? "Exam ahead." : "No exam date.",
      action: nextExam ? "addReview" : "markMissingInfo",
      affectedDate: nextExam?.dueDate,
      color: COLORS.purple,
      classId: nextExam?.classId,
      examId: nextExam?.id,
    },
    {
      id: "class-pulse",
      label: weakClass ? `${weakClass.code} ${weakPulse?.forecastLabel || ""}`.trim() : "Add classes",
      detail: weakPulse?.nudge || "Import a syllabus.",
      score: weakPulse?.forecastScore ? 100 - weakPulse.forecastScore : 20,
      severity: weakPulse?.forecastScore && weakPulse.forecastScore < 68 ? "high" : weakPulse?.forecastScore && weakPulse.forecastScore < 82 ? "medium" : "low",
      confidence: weakPulse ? 0.72 : 0.7,
      cause: weakPulse?.reason || "No class data.",
      action: "addReview",
      color: weakClass?.color || COLORS.blue,
      classId: weakClass?.id,
    },
    {
      id: "unscheduled",
      label: `${unscheduled.length} unscheduled tasks`,
      detail: unscheduled[0]?.title || "All set.",
      score: Math.min(90, unscheduled.length * 16),
      severity: unscheduled.length >= 3 ? "high" : unscheduled.length ? "medium" : "low",
      confidence: 0.84,
      cause: "No study block.",
      action: "reschedule",
      affectedDate: unscheduled[0]?.dueDate,
      color: unscheduled.length ? COLORS.teal : COLORS.green,
      taskId: unscheduled[0]?.id,
      classId: unscheduled[0]?.classId,
    },
  ];
  return recommendations.sort((a, b) => b.score - a.score);
}

export function buildDashboardSnapshot(data: AppData, now = new Date()): DashboardSnapshot {
  const schedulePlan = buildSchedulePlan(data, now);
  const active = sortedActiveTasks(data, now);
  const pulses = buildClassPulseBreakdowns(data, now);
  const risks = buildRiskRecommendations(data, schedulePlan, now);
  const overdueCount = active.filter((task) => daysUntilTask(task, now) < 0).length;
  const dueNowCount = active.filter((task) => daysUntilTask(task, now) <= 0).length;
  const studyMinutes = schedulePlan.blocks.filter((block) => block.date === dateKey(now) && !block.completed).reduce((sum, block) => sum + block.minutes, 0);
  const classHealth = data.classes.reduce((sum, klass) => sum + klass.health, 0) / Math.max(1, data.classes.length);
  const completion = data.tasks.length ? data.tasks.filter((task) => task.done).length / data.tasks.length : 0.7;
  const pressureScore = clamp(100 - overdueCount * 24 - dueNowCount * 12 - Math.max(0, studyMinutes - 120) / 3);
  const semesterScore = Math.round(clamp(classHealth * 62 + completion * 24 + pressureScore * 0.14));
  const nextClass = findNextClass(data, new Date(now));
  const nearestDeadline = active[0];
  return {
    generatedAt: new Date().toISOString(),
    todayKey: dateKey(now),
    greeting: `Good morning, ${data.prefs.name.split(" ")[0]}`,
    semesterHealth: {
      score: semesterScore,
      label: semesterScore >= 82 ? "On track" : semesterScore >= 68 ? "Watch" : "Needs focus",
      rings: [
        { label: "Classes", value: classHealth, color: COLORS.blue },
        { label: "Work", value: pressureScore / 100, color: overdueCount ? COLORS.red : COLORS.orange },
        { label: "Focus", value: completion, color: COLORS.green },
      ],
    },
    todayPressure: {
      score: Math.round(pressureScore),
      label: pressureScore >= 78 ? "Light" : pressureScore >= 52 ? "Focused" : "Heavy",
      dueNowCount,
      overdueCount,
      studyMinutes,
      reason: overdueCount ? "Recover first." : dueNowCount ? "Due today." : "Clear day.",
    },
    nextClass: nextClass ? {
      classId: nextClass.klass.id,
      code: nextClass.klass.code,
      title: nextClass.klass.name,
      startsAt: nextClass.startsAt.toISOString(),
      room: nextClass.klass.room,
      color: nextClass.klass.color,
    } : undefined,
    nearestDeadline: nearestDeadline ? {
      taskId: nearestDeadline.id,
      title: nearestDeadline.title,
      classId: nearestDeadline.classId,
      dueAt: dueDateTime(nearestDeadline, now).toISOString(),
      dueLabel: taskDueLabel(nearestDeadline, now),
    } : undefined,
    recommendedFocus: schedulePlan.blocks.find((block) => !block.completed && block.date === dateKey(now)) || schedulePlan.blocks.find((block) => !block.completed),
    classPulses: pulses,
    risks,
    schedulePlan,
  };
}

export function parseNoteInsights(note: NoteItem, data?: AppData): ParsedNoteInsight {
  const rawText = `${note.title}\n${note.summary}\n${note.sourceText}`.replace(/[–—]/g, "-").trim();
  const text = rawText.replace(/\s+/g, " ").trim();
  const rawSentences = rawText
    .split(/(?<=[.!?])\s+|\n+/)
    .map((line) => line.replace(/^[\-•*\d.)\s]+/, "").trim())
    .filter((line) => line.length > 12);
  const formulas = Array.from(new Set([
    ...(text.match(/[A-Za-zΔμσπ()^0-9]+\s*=\s*[^.;\n]+/g) || []),
    ...(text.match(/\b(?:PV\s*=\s*nRT|F\s*=\s*ma|E\s*=\s*mc\^?2|ROI\s*=\s*[^.;\n]+|NPV\s*=\s*[^.;\n]+)\b/gi) || []),
  ])).slice(0, 8);
  const explicitTerms = rawText.match(/\b([A-Za-z][A-Za-z0-9-]{2,})\s*(?::|-|=)\s*[^.\n]{8,}/g)?.map((item) => item.split(/[:=-]/)[0].trim()) || [];
  const terms = note.terms.length
    ? note.terms
    : Array.from(new Set([...explicitTerms, ...(text.match(/\b[A-Z][a-zA-Z0-9-]{3,}\b/g) || [])])).slice(0, 8);
  const definitions = terms.slice(0, 6).map((term) => {
    const sentence = rawSentences.find((item) => item.toLowerCase().includes(term.toLowerCase())) || note.summary;
    return { term, definition: sentence || `Review ${term} from the source note.` };
  });
  const likelyExamTopics = Array.from(new Set([
    ...rawSentences.filter((sentence) => /exam|quiz|know this|test|professor|hint/i.test(sentence)).flatMap((sentence) => sentence.match(/\b[A-Z][a-zA-Z0-9-]{3,}\b/g) || []),
    ...terms.slice(0, 5),
    ...formulas.map((formula) => formula.split("=")[0].trim()),
  ])).filter(Boolean).slice(0, 8);
  const weakAreas = rawSentences
    .filter((sentence) => /confus|weak|miss|review later|don't understand|dont understand|practice|memorize|quiz|exam/i.test(sentence))
    .slice(0, 4);
  const linkedExamIds = data?.exams.filter((exam) => exam.classId === note.classId && (note.examId === exam.id || exam.topics.some((topic) => text.toLowerCase().includes(topic.toLowerCase().split(" ")[0])))).map((exam) => exam.id) || (note.examId ? [note.examId] : []);
  const linkedTaskIds = data?.tasks.filter((task) => task.classId === note.classId && (note.suggestedTasks.some((suggestion) => task.title.toLowerCase().includes(suggestion.toLowerCase().slice(0, 10))) || task.source.includes(note.title))).map((task) => task.id) || [];
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const confidence = clamp(
    35 + Math.min(23, terms.length * 3) + Math.min(16, formulas.length * 4) + Math.min(12, rawSentences.length * 2) + Math.min(8, wordCount / 35),
    wordCount < 25 ? 28 : 35,
    wordCount < 25 ? 62 : 94
  ) / 100;
  return {
    noteId: note.id,
    concepts: terms.slice(0, 8),
    definitions,
    formulas,
    likelyExamTopics,
    weakAreas: weakAreas.length ? weakAreas : [`Practice active recall for ${terms[0] || note.title}.`],
    linkedTaskIds,
    linkedExamIds,
    confidence,
  };
}

export function buildNotificationPlan(data: AppData, now = new Date()): NotificationPlan {
  const items: NotificationPlan["items"] = [];
  const skipped: NotificationPlan["skipped"] = [];
  const add = (item: NotificationPlan["items"][number]) => {
    const trigger = new Date(item.triggerAt);
    if (trigger.getTime() <= now.getTime()) {
      skipped.push({ sourceId: item.sourceId || item.stableId, reason: "Trigger is in the past." });
      return;
    }
    const quietAdjusted = new Date(trigger);
    if (quietAdjusted.getHours() >= 22) quietAdjusted.setHours(20, 30, 0, 0);
    if (quietAdjusted.getHours() < 7) quietAdjusted.setHours(7, 30, 0, 0);
    items.push({ ...item, triggerAt: quietAdjusted.toISOString() });
  };

  data.classes.forEach((klass) => {
    const startsAt = nextClassOccurrence(klass, now);
    const trigger = new Date(startsAt);
    trigger.setMinutes(trigger.getMinutes() - 15);
    add({
      stableId: `class:${klass.id}:${dateKey(startsAt)}`,
      kind: "Class",
      title: `${klass.code} starts soon`,
      body: `${klass.room} · ${klass.time}. Stay ready.`,
      classId: klass.id,
      triggerAt: trigger.toISOString(),
      explanation: "Class reminder scheduled 15 minutes before the next meeting.",
      sourceId: klass.id,
    });
  });

  sortedActiveTasks(data, now).slice(0, 10).forEach((task) => {
    const dueAt = dueDateTime(task, now);
    const trigger = new Date(dueAt);
    trigger.setHours(Math.max(8, trigger.getHours() - (daysUntilTask(task, now) <= 1 ? 2 : 24)));
    add({
      stableId: `task:${task.id}:${task.dueDate}`,
      kind: "Assignment",
      title: `${task.title} due ${taskDueLabel(task, now).toLowerCase()}`,
      body: `${classFor(data, task.classId).code}: one block keeps pace.`,
      classId: task.classId,
      triggerAt: trigger.toISOString(),
      explanation: daysUntilTask(task, now) <= 1 ? "Deadline is close, so the reminder lands two hours before due time." : "Reminder lands the day before to protect a study block.",
      sourceId: task.id,
    });
  });

  data.exams.slice(0, 8).forEach((exam) => {
    const examAt = dueDateTime(exam, now);
    const trigger = new Date(examAt);
    trigger.setDate(trigger.getDate() - 1);
    trigger.setHours(19, 0, 0, 0);
    add({
      stableId: `exam:${exam.id}:${exam.dueDate}`,
      kind: "Exam",
      title: `${exam.title} is tomorrow`,
      body: "One recall pass tonight.",
      classId: exam.classId,
      triggerAt: trigger.toISOString(),
      explanation: "Exam reminder scheduled the evening before for final active recall.",
      sourceId: exam.id,
    });
  });

  buildSchedulePlan(data, now).blocks.slice(0, 8).forEach((block) => {
    if (!block.startsAt) return;
    const trigger = new Date(block.startsAt);
    trigger.setMinutes(trigger.getMinutes() - 10);
    add({
      stableId: `study:${block.id}:${block.date}`,
      kind: "Study",
      title: `Focus block: ${block.title}`,
      body: `${minutesLabel(block.minutes)}. Stay ahead.`,
      classId: block.classId,
      triggerAt: trigger.toISOString(),
      explanation: "Study reminder lands ten minutes before a planned block.",
      sourceId: block.id,
    });
  });

  return { permissionNeeded: true, quietHours: { startHour: 22, endHour: 7 }, items, skipped };
}

export function colorForState(state: SemanticColorState) {
  if (state === "green") return COLORS.green;
  if (state === "yellow") return COLORS.yellow;
  if (state === "orange") return COLORS.orange;
  if (state === "red") return COLORS.red;
  if (state === "blue") return COLORS.blue;
  if (state === "purple") return COLORS.purple;
  return COLORS.ink;
}

function semanticForScore(score: number): SemanticColorState {
  if (score >= 82) return "green";
  if (score >= 72) return "yellow";
  if (score >= 60) return "orange";
  return "red";
}

function stateCopy(state: SemanticColorState) {
  if (state === "green") return "On track.";
  if (state === "yellow") return "Stay close.";
  if (state === "orange") return "Pressure building.";
  if (state === "red") return "Needs attention.";
  if (state === "purple") return "Exam mode.";
  if (state === "blue") return "Focus next.";
  return "Add data.";
}

function daysCopy(days: number) {
  if (days < 0) return "Overdue.";
  if (days === 0) return "Due today.";
  if (days === 1) return "Tomorrow.";
  return `${days} days.`;
}

function gradeLabelForScore(score?: number) {
  if (!Number.isFinite(score)) return "Not enough data";
  const value = Number(score);
  if (value >= 97) return "A+";
  if (value >= 93) return "A";
  if (value >= 90) return "A-";
  if (value >= 87) return "B+";
  if (value >= 83) return "B";
  if (value >= 80) return "B-";
  if (value >= 77) return "C+";
  if (value >= 73) return "C";
  if (value >= 70) return "C-";
  if (value >= 67) return "D+";
  if (value >= 63) return "D";
  return "Needs recovery";
}

function scoreForGradeLabel(label?: string) {
  const normalized = (label || "").trim().toUpperCase();
  const map: Record<string, number> = { "A+": 98, A: 95, "A-": 91, "B+": 88, B: 85, "B-": 81, "C+": 78, C: 75, "C-": 71, "D+": 68, D: 65, F: 55 };
  return map[normalized];
}

function dimension(key: HealthDimensionKey, label: string, score: number, reason: string, trend: HealthDimension["trend"] = "flat"): HealthDimension {
  const rounded = Math.round(clamp(score));
  return { key, label, score: rounded, colorState: semanticForScore(rounded), trend, reason };
}

export function hasRealSemesterData(data: Pick<AppData, "classes" | "tasks" | "exams" | "studyBlocks">) {
  return Boolean(
    data.classes.length > 0 ||
      data.tasks.length > 0 ||
      data.exams.length > 0 ||
      data.studyBlocks.length > 0
  );
}

function emptySemesterDimension(key: HealthDimensionKey, label: string): HealthDimension {
  return {
    key,
    label,
    score: 0,
    colorState: "graphite",
    trend: "flat",
    reason: "Add syllabus first.",
  };
}

function scoreSnapshot(semester: SemesterSnapshot | { semesterHealth: SemesterHealth }) {
  const dims = semester.semesterHealth.dimensions;
  return {
    semesterHealth: semester.semesterHealth.overallScore,
    preparedness: dims.preparedness.score,
    workload: dims.workload.score,
    grades: dims.grades.score,
    consistency: dims.consistency.score,
  };
}

function knownGradeScore(klass: ClassItem) {
  const entries = klass.gradeEntries || [];
  if (entries.length) {
    const weightTotal = entries.reduce((sum, entry) => sum + (entry.weight || 0), 0);
    if (weightTotal > 0) {
      return entries.reduce((sum, entry) => sum + (entry.score / Math.max(1, entry.maxScore)) * 100 * (entry.weight || 0), 0) / weightTotal;
    }
    return entries.reduce((sum, entry) => sum + (entry.score / Math.max(1, entry.maxScore)) * 100, 0) / entries.length;
  }
  return scoreForGradeLabel(klass.grade);
}

export function buildGradeForecasts(data: AppData, now = new Date()): GradeForecast[] {
  const legacyPulses = buildClassPulseBreakdowns(data, now);
  return data.classes.map((klass) => {
    const explicit = knownGradeScore(klass);
    const tasks = data.tasks.filter((task) => task.classId === klass.id);
    const active = tasks.filter((task) => !task.done);
    const missing = active.filter((task) => task.missing || daysUntilTask(task, now) < 0);
    const dueSoon = active.filter((task) => daysUntilTask(task, now) <= 2);
    const exam = data.exams.filter((item) => item.classId === klass.id).sort((a, b) => daysUntilExam(a, now) - daysUntilExam(b, now))[0];
    const examDays = exam ? daysUntilExam(exam, now) : 99;
    const notePrep = data.notes.filter((note) => note.classId === klass.id).reduce((sum, note) => sum + Math.min(8, (note.terms.length + (note.reviewedConcepts?.length || 0)) * 1.4), 0);
    const completedBlocks = data.studyBlocks.filter((block) => block.classId === klass.id && block.completed).length;
    const missedBlocks = data.studyBlocks.filter((block) => block.classId === klass.id && block.missed).length;
    const legacyPulse = legacyPulses.find((pulse) => pulse.classId === klass.id);

    if (Number.isFinite(explicit)) {
      const score = clamp(Number(explicit) - missing.length * 3 - Math.max(0, 4 - examDays) * 1.5 + Math.min(5, completedBlocks));
      return {
        classId: klass.id,
        mode: "known" as const,
        label: gradeLabelForScore(score),
        numericScore: Math.round(score),
        trend: score >= Number(explicit) ? "up" as const : score < Number(explicit) - 4 ? "down" as const : "flat" as const,
        colorState: semanticForScore(score),
        confidence: 0.9,
        reason: missing.length ? "Needs attention." : "Stable.",
        missingInputs: [],
        nextGradeAction: dueSoon[0]?.title ? `Finish ${dueSoon[0].title}` : exam ? `Review ${exam.title}` : "Stay current.",
      };
    }

    if (tasks.length || exam || data.notes.some((note) => note.classId === klass.id)) {
      const baseline = Math.max(82, klass.health * 100, legacyPulse?.score || 0);
      const estimated = clamp(baseline + notePrep * 0.35 + completedBlocks * 2 - missing.length * 8 - dueSoon.length * 3 - Math.max(0, 5 - examDays) * 4 - missedBlocks * 5, 58, 96);
      return {
        classId: klass.id,
        mode: "estimated" as const,
        label: gradeLabelForScore(estimated),
        numericScore: Math.round(estimated),
        trend: missing.length || missedBlocks ? "down" as const : completedBlocks || notePrep ? "up" as const : "flat" as const,
        colorState: semanticForScore(estimated),
        confidence: 0.62,
        reason: exam && examDays <= 5 && notePrep < 10 ? "Prep is light." : "Estimated.",
        missingInputs: ["current grade", "assignment weights"],
        nextGradeAction: exam && examDays <= 7 ? `Review ${exam.title}` : dueSoon[0]?.title ? `Finish ${dueSoon[0].title}` : "Add grade.",
      };
    }

    return {
      classId: klass.id,
      mode: "unknown" as const,
      label: "Not enough data",
      trend: "flat" as const,
      colorState: "graphite" as const,
      confidence: 0.25,
      reason: "Add grade.",
      missingInputs: ["current grade", "assignment weights", "graded work"],
      nextGradeAction: "Add grade.",
    };
  }).sort((a, b) => (a.numericScore ?? 999) - (b.numericScore ?? 999));
}

export function buildPressureForecast(data: AppData, schedulePlan = buildSchedulePlan(data), now = new Date()): PressureForecast {
  const labels: string[] = [];
  const loads: number[] = [];
  const clusters: PressureForecast["clusters"] = [];
  const overloadedDays: string[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(now);
    day.setDate(startOfDay(now).getDate() + offset);
    const key = dateKey(day);
    const taskCount = data.tasks.filter((task) => !task.done && task.dueDate === key).length;
    const examCount = data.exams.filter((exam) => exam.dueDate === key).length;
    const blockMinutes = schedulePlan.blocks.filter((block) => block.date === key).reduce((sum, block) => sum + block.minutes, 0);
    const load = taskCount * 24 + examCount * 38 + blockMinutes / 4;
    labels.push(day.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1));
    loads.push(Math.round(load));
    if (taskCount + examCount >= 3) clusters.push({ date: key, label: "Deadline cluster", count: taskCount + examCount, colorState: "orange" });
    if (load >= 82) overloadedDays.push(key);
  }
  const maxLoad = Math.max(0, ...loads);
  return {
    colorState: maxLoad >= 95 ? "red" : maxLoad >= 72 ? "orange" : maxLoad >= 48 ? "yellow" : "green",
    score: Math.round(clamp(100 - maxLoad * 0.7)),
    label: overloadedDays.length ? "Heavy week" : "Balanced week",
    weekLabels: labels,
    weekLoads: loads,
    clusters,
    overloadedDays,
    recoverySuggestion: overloadedDays[0] ? `Lighten ${new Date(overloadedDays[0]).toLocaleDateString(undefined, { weekday: "long" })}.` : undefined,
  };
}

export function buildClassPulsesV2(data: AppData, forecasts = buildGradeForecasts(data), now = new Date()): ClassPulseV2[] {
  return data.classes.map((klass) => {
    const forecast = forecasts.find((item) => item.classId === klass.id)!;
    const nextDeadline = data.tasks.filter((task) => task.classId === klass.id && !task.done).sort((a, b) => daysUntilTask(a, now) - daysUntilTask(b, now))[0];
    const nextExam = data.exams.filter((exam) => exam.classId === klass.id).sort((a, b) => daysUntilExam(a, now) - daysUntilExam(b, now))[0];
    const missingWork = data.tasks.filter((task) => task.classId === klass.id && !task.done && (task.missing || daysUntilTask(task, now) < 0)).length;
    const nudge = missingWork
        ? `Recover ${nextDeadline?.title || "missing work"}.`
      : nextExam && daysUntilExam(nextExam, now) <= 7
        ? `Prep for ${nextExam.title}.`
        : forecast.nextGradeAction;
    return {
      classId: klass.id,
      forecastLabel: forecast.label,
      forecastScore: forecast.numericScore,
      mode: forecast.mode,
      trend: forecast.trend,
      colorState: forecast.colorState,
      reason: forecast.reason,
      nextDeadline: nextDeadline ? { taskId: nextDeadline.id, title: nextDeadline.title, dueLabel: taskDueLabel(nextDeadline, now) } : undefined,
      nextExam: nextExam ? { examId: nextExam.id, title: nextExam.title, dueLabel: formatDue(daysUntilExam(nextExam, now)) } : undefined,
      missingWork,
      nudge,
    };
  }).sort((a, b) => (a.forecastScore ?? 999) - (b.forecastScore ?? 999));
}

function buildStudyRecommendations(data: AppData, classPulses: ClassPulseV2[], now = new Date()): StudyRecommendation[] {
  return classPulses.slice(0, 5).map((pulse) => {
    const klass = classFor(data, pulse.classId);
    const exam = data.exams.filter((item) => item.classId === pulse.classId).sort((a, b) => daysUntilExam(a, now) - daysUntilExam(b, now))[0];
    const examDays = exam ? daysUntilExam(exam, now) : 99;
    const deadline = data.tasks.filter((task) => task.classId === pulse.classId && !task.done).sort((a, b) => daysUntilTask(a, now) - daysUntilTask(b, now))[0];
    return {
      id: `rec_${pulse.classId}`,
      classId: pulse.classId,
      title: pulse.nextExam && exam ? `${klass.code} exam mode` : `${klass.code} next`,
      reason: pulse.nextExam && exam
        ? `Review ${exam.title}. ${daysCopy(examDays)}`
        : deadline
          ? `Start ${deadline.title}.`
          : pulse.nudge,
      minutes: pulse.colorState === "red" ? 45 : 30,
      colorState: pulse.nextExam ? "purple" : pulse.colorState === "red" ? "red" : "blue",
      source: pulse.nextExam ? "exam" : pulse.missingWork ? "recovery" : "consistency",
    };
  });
}

function buildRecommendedActions(data: AppData, risks: RiskRecommendation[], recommendations: StudyRecommendation[], now = new Date()): SemesterAction[] {
  const riskDetail = (risk: RiskRecommendation) => {
    const klass = risk.classId ? classFor(data, risk.classId) : classFor(data);
    const task = risk.taskId ? data.tasks.find((item) => item.id === risk.taskId) : undefined;
    const exam = risk.examId ? data.exams.find((item) => item.id === risk.examId) : undefined;
    if (task) {
      const due = taskDueLabel(task, now);
      if (daysUntilTask(task, now) < 0) return `${klass.code}: recover ${task.title}.`;
      return `${klass.code}: ${task.title}. ${due}.`;
    }
    if (exam) {
      const days = daysUntilExam(exam, now);
      return `${klass.code}: prep ${exam.title}. ${daysCopy(days)}`;
    }
    if (risk.id === "unscheduled") return "Add protected time.";
    return risk.detail;
  };
  const activeRisks = risks.filter((risk) => risk.severity !== "low" && risk.score > 30);
  return [
    ...activeRisks.slice(0, 4).map((risk, index) => ({
      id: `risk_${risk.id}`,
      label: risk.label,
      detail: riskDetail(risk),
      action: risk.action,
      priority: 100 - index * 8,
      colorState: risk.severity === "high" ? "red" as const : risk.severity === "medium" ? "orange" as const : "yellow" as const,
      classId: risk.classId,
      taskId: risk.taskId,
      examId: risk.examId,
    })),
    ...recommendations.slice(0, 3).map((rec, index) => ({
      id: rec.id,
      label: rec.title,
      detail: rec.reason,
      action: "addReview" as const,
      priority: 80 - index * 5,
      colorState: rec.colorState,
      classId: rec.classId,
    })),
  ].sort((a, b) => b.priority - a.priority);
}

function buildSemesterHealth(data: AppData, forecasts: GradeForecast[], pressure: PressureForecast, schedulePlan: SchedulePlan, now = new Date()): SemesterHealth {
  if (!hasRealSemesterData(data)) {
    const dimensions = {
      workload: emptySemesterDimension("workload", "Workload"),
      grades: emptySemesterDimension("grades", "Grades"),
      preparedness: emptySemesterDimension("preparedness", "Preparedness"),
      consistency: emptySemesterDimension("consistency", "Consistency"),
    };
    return {
      overallScore: 0,
      dimensions,
      colorState: "graphite",
      trend: "flat",
      reason: "No semester loaded.",
      biggestRisk: "No semester loaded.",
      biggestWin: "Build your semester first.",
      nextBestAction: "Scan syllabus",
    };
  }

  const active = sortedActiveTasks(data, now);
  const overdue = active.filter((task) => daysUntilTask(task, now) < 0);
  const dueSoon = active.filter((task) => daysUntilTask(task, now) <= 2);
  const missedBlocks = data.studyBlocks.filter((block) => block.missed).length;
  const completedBlocks = data.studyBlocks.filter((block) => block.completed).length;
  const totalBlocks = Math.max(1, data.studyBlocks.length);
  const notePrep = data.notes.reduce((sum, note) => sum + note.terms.length + (note.reviewedConcepts?.length || 0), 0);
  const closeExamCount = data.exams.filter((exam) => daysUntilExam(exam, now) >= 0 && daysUntilExam(exam, now) <= 7).length;
  const examPrepBlocks = schedulePlan.blocks.filter((block) => block.source === "exam_prep").length;
  const unknownForecasts = forecasts.filter((forecast) => forecast.mode === "unknown").length;
  const forecastsNeedingGrades = forecasts.filter((forecast) => forecast.mode !== "known").length;
  const knownForecastCount = forecasts.filter((forecast) => forecast.mode === "known").length;
  const knownScores = forecasts.map((forecast) => forecast.numericScore).filter((score): score is number => Number.isFinite(score));
  const avgForecast = knownScores.length ? knownScores.reduce((sum, score) => sum + score, 0) / knownScores.length : 68;

  const workload = dimension(
    "workload",
    "Workload",
    100 - overdue.length * 18 - dueSoon.length * 7 - pressure.overloadedDays.length * 9 - missedBlocks * 6,
    overdue.length ? `${overdue.length} overdue.` : pressure.recoverySuggestion || "On pace.",
    pressure.overloadedDays.length || overdue.length ? "down" : "flat"
  );
  const grades = dimension(
    "grades",
    "Grades",
    knownForecastCount ? avgForecast - unknownForecasts * 2 : Math.max(78, avgForecast),
    forecastsNeedingGrades ? "Add grades." : `Projected ${gradeLabelForScore(avgForecast)}.`,
    forecasts.some((forecast) => forecast.trend === "down") ? "down" : forecasts.some((forecast) => forecast.trend === "up") ? "up" : "flat"
  );
  const preparedness = dimension(
    "preparedness",
    "Preparedness",
    62 + notePrep * 1.4 + examPrepBlocks * 5 - closeExamCount * 8,
    closeExamCount && examPrepBlocks < closeExamCount
      ? "Exam prep is light."
      : data.exams.length && notePrep === 0
        ? "Add notes or review."
        : "Prep is building.",
    examPrepBlocks >= closeExamCount ? "up" : closeExamCount ? "down" : "flat"
  );
  const consistency = dimension(
    "consistency",
    "Consistency",
    completedBlocks || missedBlocks ? 58 + (completedBlocks / totalBlocks) * 34 + data.tasks.filter((task) => task.done).length * 2 - missedBlocks * 9 : 82,
    missedBlocks ? `${missedBlocks} missed.` : completedBlocks ? "On rhythm." : "Start one block.",
    missedBlocks ? "down" : completedBlocks ? "up" : "flat"
  );
  const dimensions = { workload, grades, preparedness, consistency };
  const overallScore = Math.round(clamp(workload.score * 0.3 + grades.score * 0.28 + preparedness.score * 0.24 + consistency.score * 0.18));
  const sortedDimensions = Object.values(dimensions).sort((a, b) => a.score - b.score);
  const bestDimension = Object.values(dimensions).sort((a, b) => b.score - a.score)[0];
  const nextBest = schedulePlan.blocks.find((block) => !block.completed)?.title || active[0]?.title || "Scan or add school material";
  return {
    overallScore,
    dimensions,
    colorState: semanticForScore(overallScore),
    trend: sortedDimensions[0].trend === "down" ? "down" : bestDimension.trend === "up" ? "up" : "flat",
    reason: sortedDimensions[0].reason,
    biggestRisk: sortedDimensions[0].reason,
    biggestWin: `${bestDimension.label}: ${bestDimension.reason}`,
    nextBestAction: nextBest,
  };
}

export function buildSemesterSnapshot(data: AppData, now = new Date()): SemesterSnapshot {
  const schedulePlan = buildSchedulePlan(data, now);
  const gradeForecasts = buildGradeForecasts(data, now);
  const classPulses = buildClassPulsesV2(data, gradeForecasts, now);
  const pressureForecast = buildPressureForecast(data, schedulePlan, now);
  const semesterHealth = buildSemesterHealth(data, gradeForecasts, pressureForecast, schedulePlan, now);
  const riskFactors = buildRiskRecommendations(data, schedulePlan, now);
  const studyRecommendations = buildStudyRecommendations(data, classPulses, now);
  const recommendedActions = buildRecommendedActions(data, riskFactors, studyRecommendations, now);
  const notificationPlan = buildNotificationPlan(data, new Date(now));
  const feedbackEvents = (data.feedbackEvents || []).slice(0, 10);
  const topAction = recommendedActions[0];
  const coachCopy = {
    headline: `Semester health ${semesterHealth.overallScore}`,
    body: stateCopy(semesterHealth.colorState),
    nextAction: topAction ? `${topAction.label}. ${topAction.detail}` : semesterHealth.nextBestAction,
    feedback: feedbackEvents[0]?.message,
  };
  return {
    generatedAt: new Date(now).toISOString(),
    todayKey: dateKey(now),
    semesterHealth,
    classPulses,
    gradeForecasts,
    pressureForecast,
    recommendedActions,
    riskFactors,
    studyRecommendations,
    feedbackEvents,
    coachCopy,
    colorState: semesterHealth.colorState,
    schedulePlan,
    notificationPlan,
  };
}

export function appendFeedbackEvent(beforeData: AppData, afterData: AppData, action: FeedbackEvent["action"], options: { classId?: string; actionId?: string; message?: string; dimension?: HealthDimensionKey } = {}): AppData {
  const before = buildSemesterSnapshot(beforeData);
  const after = buildSemesterSnapshot(afterData);
  const beforeScore = scoreSnapshot(before);
  const afterScore = scoreSnapshot(after);
  const delta = afterScore.semesterHealth - beforeScore.semesterHealth;
  const dimensionKey = options.dimension || "semesterHealth";
  const beforeDimension = dimensionKey === "semesterHealth" ? beforeScore.semesterHealth : beforeScore[dimensionKey];
  const afterDimension = dimensionKey === "semesterHealth" ? afterScore.semesterHealth : afterScore[dimensionKey];
  const klass = options.classId ? afterData.classes.find((item) => item.id === options.classId) : undefined;
  const beforeForecast = options.classId ? before.gradeForecasts.find((item) => item.classId === options.classId) : undefined;
  const afterForecast = options.classId ? after.gradeForecasts.find((item) => item.classId === options.classId) : undefined;
  const dimensionLabel = dimensionKey === "semesterHealth" ? "Semester Health" : dimensionKey[0].toUpperCase() + dimensionKey.slice(1);
  const forecastCopy = klass && beforeForecast?.label !== afterForecast?.label
    ? ` ${klass.code} ${afterForecast?.label || "improved"}.`
    : "";
  const message = options.message || (delta >= 0
    ? `${dimensionLabel} +${Math.max(0, afterDimension - beforeDimension)}.${forecastCopy}`
    : `${dimensionLabel} -${Math.abs(afterDimension - beforeDimension)}.${forecastCopy}`);
  const event: FeedbackEvent = {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    action,
    message,
    before: beforeScore,
    after: afterScore,
    delta,
    classId: options.classId,
    dimension: options.dimension,
    actionId: options.actionId,
  };
  return { ...afterData, feedbackEvents: [event, ...(afterData.feedbackEvents || [])].slice(0, 20) };
}

export function resolveWidgetStack(data: AppData): WidgetKey[] {
  if (!data.prefs.premium) return ["nextClass", "deadline"];
  const custom = data.prefs.customWidgets;
  if (custom?.length) return custom;
  const persona = `${data.prefs.studyPersonality} ${data.prefs.workloadStyle}`.toLowerCase();
  if (persona.includes("nudge") || persona.includes("adhd")) return ["focus", "deadline", "nextClass", "streak"];
  if (persona.includes("heavy")) return ["exam", "deadline", "load", "health"];
  return data.prefs.presetId === "minimal" ? ["nextClass", "deadline"] : ["health", "nextClass", "deadline", "load"];
}

export function computeRiskItems(data: AppData): RiskItem[] {
  return buildRiskRecommendations(data);
}

export function generateStudyAssets(note: NoteItem, data?: AppData): StudyAsset {
  const insight = parseNoteInsights(note, data);
  const concepts = insight.concepts.length ? insight.concepts : ["Key concept", "Evidence", "Practice"];
  return {
    noteId: note.id,
    flashcards: insight.definitions.slice(0, 8).map((definition) => ({
      front: `Explain ${definition.term}`,
      back: definition.definition,
    })),
    quiz: concepts.slice(0, 5).map((term, index) => ({
      prompt: `Q${index + 1}. Apply ${term} to a likely exam question.`,
      answer: insight.formulas[index] ? `Use ${insight.formulas[index]}, then explain the result in words.` : `Define ${term}, connect it to the note, then give one example.`,
    })),
    guide: [
      `Core summary: ${note.summary}`,
      `Likely exam topics: ${insight.likelyExamTopics.slice(0, 4).join(", ") || concepts.slice(0, 3).join(", ")}`,
      `Weak area: ${insight.weakAreas[0]}`,
    ],
  };
}

export type NaturalLanguageTaskIssue =
  | "input"
  | "title"
  | "date"
  | "date-invalid"
  | "date-ambiguous"
  | "class"
  | "class-ambiguous";

export type NaturalLanguageTaskResult =
  | { ok: true; task: TaskItem }
  | { ok: false; issues: NaturalLanguageTaskIssue[] };

type CaptureClassMatch = {
  klass: ClassItem;
  alias: string;
  priority: number;
};

type CaptureDateResult =
  | { ok: true; dueDate: string; dueOffset: number }
  | { ok: false; issue: "date" | "date-invalid" | "date-ambiguous" };

function normalizeCapturePhrase(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function captureClassAliases(klass: ClassItem) {
  const code = normalizeCapturePhrase(klass.code);
  const name = normalizeCapturePhrase(klass.name);
  const aliases: { value: string; priority: number }[] = [];
  const add = (value: string, priority: number) => {
    if (!value || aliases.some((alias) => alias.value === value)) return;
    aliases.push({ value, priority });
  };

  add(code, 4);
  add(code.replace(/\s+/g, ""), 4);
  add(code.split(" ")[0] || "", 3);
  add(name, 4);
  name.split(" ").forEach((word) => {
    if (word.length >= 4 && !["and", "introductory", "introduction", "the", "to"].includes(word)) add(word, 1);
  });

  return aliases;
}

function findCaptureClassMatches(input: string, data: AppData): CaptureClassMatch[] {
  const normalizedInput = ` ${normalizeCapturePhrase(input)} `;
  return data.classes
    .filter((klass) => !klass.archivedAt)
    .map((klass) => {
      const aliases = captureClassAliases(klass)
        .filter((alias) => normalizedInput.includes(` ${alias.value} `))
        .sort((a, b) => b.priority - a.priority || b.value.length - a.value.length);
      return aliases[0] ? { klass, alias: aliases[0].value, priority: aliases[0].priority } : null;
    })
    .filter((match): match is CaptureClassMatch => Boolean(match));
}

function parseCaptureDate(input: string, now = new Date()): CaptureDateResult {
  const relativeDates = [
    { phrase: "today", offset: 0, pattern: /\btoday\b/i },
    { phrase: "tomorrow", offset: 1, pattern: /\btomorrow\b/i },
    { phrase: "next week", offset: 7, pattern: /\bnext\s+week\b/i },
  ].filter((candidate) => candidate.pattern.test(input));
  const isoDates = Array.from(new Set(input.match(/\b\d{4}-\d{2}-\d{2}\b/g) || []));

  if (relativeDates.length + isoDates.length === 0) return { ok: false, issue: "date" };
  if (relativeDates.length + isoDates.length > 1) return { ok: false, issue: "date-ambiguous" };

  if (relativeDates.length === 1) {
    const dueOffset = relativeDates[0].offset;
    const dueAt = startOfDay(now);
    dueAt.setDate(dueAt.getDate() + dueOffset);
    return { ok: true, dueOffset, dueDate: dateKey(dueAt) };
  }

  const dueDate = isoDates[0];
  const [year, month, day] = dueDate.split("-").map(Number);
  const parsed = new Date(0);
  parsed.setHours(12, 0, 0, 0);
  parsed.setFullYear(year, month - 1, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
    return { ok: false, issue: "date-invalid" };
  }
  return { ok: true, dueDate, dueOffset: daysUntilDate(parsed, now) };
}

function escapeCaptureRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeCaptureAlias(value: string, alias: string) {
  const phrase = alias.split(" ").map(escapeCaptureRegExp).join("[\\s._/#-]+");
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${phrase}(?=$|[^\\p{L}\\p{N}])`, "giu");
  return value.replace(pattern, "$1");
}

function captureTitle(input: string, classMatches: CaptureClassMatch[]) {
  let title = input
    .replace(/\b(?:due\s*(?:on\s*)?[:=-]?\s*)?(?:today|tomorrow|next\s+week)\b/giu, " ")
    .replace(/\b(?:due\s*(?:on\s*)?[:=-]?\s*)?\d{4}-\d{2}-\d{2}\b/giu, " ")
    .replace(/\b(?:estimate(?:d)?\s*[:=-]?\s*)?\d+(?:\.\d+)?\s*(?:hours?|hrs?|hr|h|minutes?|mins?|min|m)\b/giu, " ");
  classMatches.forEach((match) => {
    title = removeCaptureAlias(title, match.alias);
  });
  return title
    .replace(/\s+/g, " ")
    .replace(/^[\s,;:|/\\\-–—]+|[\s,;:|/\\\-–—]+$/g, "")
    .replace(/\b(?:for|in|class)\s*$/i, "")
    .trim();
}

function captureEstimateMinutes(input: string) {
  const match = input.match(/\b(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|h|minutes?|mins?|min|m)\b/i);
  if (!match) return 60;
  const amount = Number(match[1]);
  return Math.max(30, Math.round(/^h|hour|hr/i.test(match[2]) ? amount * 60 : amount));
}

export function createNaturalLanguageTask(input: string, data: AppData): NaturalLanguageTaskResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, issues: ["input"] };

  const parsedDate = parseCaptureDate(trimmed, new Date());
  const classMatches = findCaptureClassMatches(trimmed, data);
  const title = captureTitle(trimmed, classMatches);
  const issues: NaturalLanguageTaskIssue[] = [];
  if (!title) issues.push("title");
  if (classMatches.length === 0) issues.push("class");
  if (classMatches.length > 1) issues.push("class-ambiguous");
  if (!parsedDate.ok) issues.push(parsedDate.issue);
  if (!parsedDate.ok || classMatches.length !== 1 || !title) return { ok: false, issues };

  const lower = trimmed.toLowerCase();
  const matchedClass = classMatches[0].klass;
  return {
    ok: true,
    task: {
      id: `t_${Date.now()}`,
      title,
      classId: matchedClass.id,
      type: lower.includes("exam") ? "Review" : lower.includes("read") ? "Reading" : "Assignment",
      dueOffset: parsedDate.dueOffset,
      dueDate: parsedDate.dueDate,
      time: lower.includes("morning") ? "9:00 AM" : "7:00 PM",
      estimateMinutes: captureEstimateMinutes(trimmed),
      done: false,
      urgent: parsedDate.dueOffset <= 2,
      source: "Natural language capture",
      subtasks: [{ title: "Clarify requirements", done: false }, { title: "Work first pass", done: false }],
    },
  };
}

export function suggestSmartReminders(data: AppData) {
  return buildNotificationPlan(data).items.slice(0, 8).map((item) => ({
    title: item.title,
    classId: item.classId,
    lead: item.explanation,
    kind: item.kind,
    explanation: item.body,
    scheduledFor: [item.triggerAt],
  }));
}

export function replanAfterMissedBlock(data: AppData, missedBlock: StudyBlock, now = new Date()): AppData {
  const blocks = data.studyBlocks.filter((block) => block.id !== missedBlock.id);
  const target = startOfDay(now);
  target.setDate(target.getDate() + 1);
  const makeup = blockFromSlot({
    id: `sb_makeup_${Date.now()}`,
    date: target,
    slotIndex: 0,
    minutes: Math.max(30, Math.min(75, missedBlock.minutes)),
    taskId: missedBlock.taskId,
    classId: missedBlock.classId,
    title: missedBlock.title,
    reason: `Makeup block created after missing ${missedBlock.day}.`,
    source: "missed_repair",
    persona: `${data.prefs.studyPersonality} ${data.prefs.workloadStyle}`.toLowerCase(),
  });
  return { ...data, studyBlocks: [makeup, ...blocks] };
}
