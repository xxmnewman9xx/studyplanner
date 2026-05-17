import { Course } from "../models";

export type QuickHomeworkParseResult = {
  course?: Course;
  dueDate: string;
  title: string;
};

export function todayDateInput(offsetDays = 0, referenceDate = new Date()) {
  const date = new Date(referenceDate);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function parseQuickHomeworkInput(
  input: string,
  courses: Course[],
  fallbackCourse: Course | undefined,
  fallbackDueDate: string,
  referenceDate = new Date()
): QuickHomeworkParseResult {
  const trimmed = input.trim();
  const course = inferQuickCourse(trimmed, courses) || fallbackCourse;
  const dueDate = inferQuickDueDate(trimmed, referenceDate) || fallbackDueDate || todayDateInput(0, referenceDate);
  const title = cleanQuickHomeworkTitle(trimmed, course);

  return { course, dueDate, title };
}

export function inferQuickCourse(input: string, courses: Course[]) {
  const lower = input.toLowerCase();
  return courses.find((course) => {
    const code = course.code.toLowerCase();
    const name = course.name.toLowerCase();
    return lower.startsWith(`${code} `) || lower.startsWith(`${name} `) || lower.startsWith(`${code}:`) || lower.startsWith(`${name}:`);
  });
}

export function inferQuickDueDate(input: string, referenceDate = new Date()) {
  const lower = input.toLowerCase();
  const isoMatch = lower.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (isoMatch?.[1]) return isoMatch[1];

  if (/\bdue\s+today\b|\btoday\b/.test(lower)) return todayDateInput(0, referenceDate);
  if (/\bdue\s+tomorrow\b|\btomorrow\b/.test(lower)) return todayDateInput(1, referenceDate);

  const weekdayMatch = lower.match(/\b(?:due\s+)?(next\s+)?(sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)\b/);
  if (!weekdayMatch) return null;

  const weekdayToken = weekdayMatch[2];
  if (!weekdayToken) return null;

  const weekdayIndex = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].findIndex((day) => weekdayToken.startsWith(day));
  if (weekdayIndex < 0) return null;

  const date = new Date(referenceDate);
  const currentIndex = date.getDay();
  let daysToAdd = (weekdayIndex - currentIndex + 7) % 7;
  if (daysToAdd === 0 || weekdayMatch[1]) daysToAdd += 7;
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
}

export function cleanQuickHomeworkTitle(input: string, course: Course | undefined) {
  let title = input.trim();
  if (course) {
    const courseAliases = [course.code, course.name]
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp)
      .join("|");
    const coursePattern = new RegExp(`^(${courseAliases})(?=\\s|:)\\s*:?\\s*`, "i");
    title = title.replace(coursePattern, "");
  }

  title = title
    .replace(/\b(?:due\s+)?(?:today|tomorrow)\b/gi, "")
    .replace(/\b(?:due\s+)?(?:next\s+)?(?:sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)\b/gi, "")
    .replace(/\b(?:due\s+)?20\d{2}-\d{2}-\d{2}\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+[-–—:]\s*$/g, "")
    .trim();

  return title || input.trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
