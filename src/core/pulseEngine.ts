import type { Accent, AppState, ClassCourse, PulseModel } from "./types";

export function getPulseLabel(score: number): PulseModel["label"] {
  if (!Number.isFinite(score)) return "Needs attention";
  if (score >= 90) return "Great";
  if (score >= 75) return "Good";
  if (score >= 50) return "Needs attention";
  if (score >= 25) return "Behind";
  return "Urgent";
}

export function calculateClassPulse(state: AppState, classId: string, now: Date = new Date()): PulseModel {
  const course = state.classes.find((item) => item.id === classId) ?? state.classes[0];
  if (!course) {
    return {
      score: 0,
      label: "Urgent",
      accent: "rose",
      primaryReason: "No class data available",
      suggestedActions: ["Add class", "Add task", "Set reminder"]
    };
  }

  const today = toDateOnly(now);
  const soonLimit = addDays(today, 2);
  const tasks = state.tasks.filter((task) => task.classId === course.id && !task.completed);
  const overdue = tasks.filter((task) => task.dueDate < today);
  const dueSoon = tasks.filter((task) => task.dueDate >= today && task.dueDate <= soonLimit);
  const exams = state.exams.filter((exam) => exam.classId === course.id && exam.date >= today && exam.date <= addDays(today, 7));
  const notes = state.notes.filter((note) => note.classId === course.id);
  const missingNotesPenalty = Math.max(0, 2 - notes.length) * 4;
  const reminderBonus = course.reminderSettings.enabled ? 4 : -6;
  const studyTimePlaceholder = course.id === "calc" || course.id === "bio" ? 3 : 0;

  const basePulse = Number.isFinite(course.pulse) ? course.pulse : 72;
  const score = clamp(
    basePulse
      - overdue.length * 18
      - dueSoon.length * 6
      - exams.length * 5
      - missingNotesPenalty
      + reminderBonus
      + studyTimePlaceholder,
    0,
    100
  );

  const primaryReason =
    overdue[0] ? `${overdue[0].title} is overdue` :
    dueSoon[0] ? `${dueSoon[0].title} due ${relativeDue(dueSoon[0].dueDate, today)}` :
    exams[0] ? `${exams[0].title} coming up` :
    !course.reminderSettings.enabled ? "Class reminder is off" :
    "Schedule and reminders are current";

  return {
    score,
    label: getPulseLabel(score),
    accent: pulseAccent(score, course),
    primaryReason,
    suggestedActions: buildSuggestedActions(Boolean(dueSoon[0] || overdue[0]), notes.length, course.reminderSettings.enabled)
  };
}

export function calculateOverallPulse(state: AppState, now: Date = new Date()): PulseModel {
  const pulses = state.classes.map((course) => calculateClassPulse(state, course.id, now));
  const score = pulses.length ? Math.round(pulses.reduce((sum, pulse) => sum + pulse.score, 0) / pulses.length) : 0;
  const weakest = [...pulses].sort((a, b) => a.score - b.score)[0];
  return {
    score,
    label: getPulseLabel(score),
    accent: pulseAccent(score),
    primaryReason: weakest?.primaryReason ?? "No class data available",
    suggestedActions: weakest?.suggestedActions ?? ["Add class", "Add task", "Set reminder"]
  };
}

function buildSuggestedActions(hasDueWork: boolean, noteCount: number, reminderEnabled: boolean) {
  const actions = [];
  if (hasDueWork) actions.push("Finish task");
  if (noteCount < 2) actions.push("Review notes");
  if (!reminderEnabled) actions.push("Set reminder");
  if (!actions.length) actions.push("Open next class");
  return actions.slice(0, 3);
}

function pulseAccent(score: number, course?: ClassCourse): Accent {
  if (!Number.isFinite(score)) return "orange";
  if (score < 50) return "rose";
  if (score < 75) return "orange";
  return course?.accent ?? "mint";
}

function relativeDue(dueDate: string, today: string) {
  if (dueDate === today) return "today";
  if (dueDate === addDays(today, 1)) return "tomorrow";
  return "soon";
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);
  return toDateOnly(value);
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}
