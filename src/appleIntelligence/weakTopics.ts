// Weak topics (F7): deterministic clustering of practice misses. Hidden until
// the student has answered enough questions for the signal to mean something.

import { dateKey } from "../intelligence";
import { AppData, ExamItem, StudyBlock } from "../types";
import { addDaysKey, diffDaysKey, isValidDateInput, noonFromKey } from "./dateKeys";
import { cleanString, normalizeText, stableHash } from "./text";
import { PracticeResult, WeakTopic } from "./types";

export const WEAK_TOPIC_MIN_ANSWERS = 20;
const MIN_ATTEMPTS = 3;
const MAX_TOPICS = 8;
const MAX_BLOCKS = 3;
const BLOCK_MINUTES = 25;

function conceptKey(concept: string) {
  return normalizeText(concept)
    .split(" ")
    .map((word) => (word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word))
    .join(" ");
}

function mostCommon(values: Array<string | undefined>) {
  const counts = new Map<string, number>();
  values.forEach((value) => {
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
}

function examForTopic(key: string, classId: string | undefined, data: AppData) {
  return data.exams.find((exam) => (!classId || exam.classId === classId) && exam.topics.some((topic) => {
    const topicKey = conceptKey(topic);
    return topicKey && (topicKey === key || topicKey.includes(key) || key.includes(topicKey));
  }));
}

/** Weak concepts ranked by smoothed miss rate; [] until ≥ 20 answers exist. */
export function computeWeakTopics(results: PracticeResult[], data: AppData): WeakTopic[] {
  if (!Array.isArray(results) || results.length < WEAK_TOPIC_MIN_ANSWERS) return [];
  const groups = new Map<string, { labels: string[]; rows: PracticeResult[] }>();
  results.forEach((row) => {
    if (!row || typeof row.concept !== "string") return;
    const key = conceptKey(row.concept);
    if (!key) return;
    const group = groups.get(key) || { labels: [], rows: [] };
    group.labels.push(cleanString(row.concept, 60));
    group.rows.push(row);
    groups.set(key, group);
  });
  const topics: WeakTopic[] = [];
  groups.forEach((group, key) => {
    const attempts = group.rows.length;
    const misses = group.rows.filter((row) => !row.correct).length;
    if (attempts < MIN_ATTEMPTS || misses === 0) return;
    const weakness = Math.round(((misses + 1) / (attempts + 2)) * 1000) / 1000;
    if (weakness < 0.4) return;
    const classId = mostCommon(group.rows.map((row) => row.classId));
    const examId = mostCommon(group.rows.map((row) => row.examId)) || examForTopic(key, classId, data)?.id;
    const topic: WeakTopic = { concept: mostCommon(group.labels) || group.labels[0], misses, attempts, weakness };
    if (classId) topic.classId = classId;
    if (examId) topic.examId = examId;
    topics.push(topic);
  });
  return topics
    .sort((a, b) => b.weakness - a.weakness || b.misses - a.misses || a.concept.localeCompare(b.concept))
    .slice(0, MAX_TOPICS);
}

function upcomingExamFor(topic: WeakTopic, data: AppData, today: string): ExamItem | undefined {
  const upcoming = (exam: ExamItem) => isValidDateInput(exam.dueDate) && exam.dueDate > today && typeof exam.score !== "number";
  const direct = topic.examId ? data.exams.find((exam) => exam.id === topic.examId) : undefined;
  if (direct && upcoming(direct)) return direct;
  return data.exams
    .filter((exam) => upcoming(exam) && (!topic.classId || exam.classId === topic.classId))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id))[0];
}

/**
 * Up to three 25-minute exam_prep block PROPOSALS, each before its exam.
 * They are never written to AppData here; the confirm sheet decides.
 */
export function proposeWeakTopicBlocks(weak: WeakTopic[], data: AppData, now: Date): StudyBlock[] {
  const today = dateKey(now);
  const blocks: StudyBlock[] = [];
  const usedDays = new Map<string, number>();
  for (const topic of Array.isArray(weak) ? weak : []) {
    if (blocks.length >= MAX_BLOCKS) break;
    const exam = upcomingExamFor(topic, data, today);
    if (!exam) continue;
    const daysToExam = diffDaysKey(today, exam.dueDate);
    // Tomorrow when there is room before the exam, otherwise today; spread later topics a day apart.
    let day = daysToExam >= 2 ? addDaysKey(today, 1 + blocks.length) : today;
    if (day >= exam.dueDate) day = addDaysKey(exam.dueDate, -1);
    if (day < today) continue;
    const slot = usedDays.get(day) || 0;
    usedDays.set(day, slot + 1);
    const start = noonFromKey(day);
    if (!start) continue;
    start.setHours(19, slot * 30, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + BLOCK_MINUTES);
    const concept = cleanString(topic.concept, 80);
    blocks.push({
      id: `sb_weak_${stableHash(`${concept}|${exam.id}|${day}`).slice(0, 12)}`,
      day: start.toLocaleDateString(undefined, { weekday: "long" }),
      time: `${start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} - ${end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`,
      examId: exam.id,
      classId: exam.classId,
      title: concept,
      minutes: BLOCK_MINUTES,
      reason: cleanString(exam.title, 120),
      completed: false,
      date: day,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      source: "exam_prep",
    });
  }
  return blocks;
}
