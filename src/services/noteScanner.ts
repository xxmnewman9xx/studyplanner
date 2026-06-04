export type NoteScanTaskCandidate = {
  title: string;
  dueDate?: string;
  dueTime?: string;
};

export type NoteScanResult = {
  title: string;
  body: string;
  summary: string;
  keyIdeas: string[];
  tags: string[];
  taskCandidates: NoteScanTaskCandidate[];
};

const dueDatePattern =
  /\b(?:due|by|before)\s+(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[/. -]\d{1,2}(?:[/. -]\d{2,4})?|today|tomorrow)\b/i;
const dueTimePattern = /\b(?:at|by|before)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
const taskPattern = /\b(?:todo|to do|task|homework|hw|finish|complete|submit|review|read|study|write|draft|email|ask)\b/i;
const stopWords = new Set(["the", "and", "for", "with", "that", "this", "from", "into", "about", "today", "class"]);

export function scanStudyNoteText(rawText: string, sourceName = "Scanned notes", now = new Date()): NoteScanResult {
  const body = normalizeNoteText(rawText);
  if (body.length < 8) {
    throw new Error("Paste class notes, study notes, or homework details first.");
  }

  const lines = body.split("\n").map((line) => line.trim()).filter(Boolean);
  const title = inferTitle(lines, sourceName);
  const summary = summarize(lines);
  const keyIdeas = inferKeyIdeas(lines);
  const taskCandidates = inferTaskCandidates(lines, now);

  return {
    title,
    body,
    summary,
    keyIdeas,
    tags: inferTags(body, keyIdeas, taskCandidates),
    taskCandidates
  };
}

function normalizeNoteText(rawText: string) {
  return rawText
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\u0000/g, "")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function inferTitle(lines: string[], sourceName: string) {
  const explicit = lines.find((line) => /^#?\s*[A-Za-z0-9].{3,70}$/.test(line) && !taskPattern.test(line));
  if (explicit) return explicit.replace(/^#+\s*/, "").slice(0, 72);
  return sourceName.replace(/\.(txt|text|pdf)$/i, "") || "Scanned notes";
}

function summarize(lines: string[]) {
  const useful = lines
    .filter((line) => line.length > 12)
    .filter((line) => !/^(today|due|ask|remember)\s*:/i.test(line))
    .slice(0, 2);
  return useful.join(" ").slice(0, 180) || lines.slice(0, 2).join(" ").slice(0, 180);
}

function inferKeyIdeas(lines: string[]) {
  const candidates = lines
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter((line) => line.length >= 8)
    .filter((line) => !taskPattern.test(line))
    .slice(0, 5);

  if (candidates.length >= 3) return candidates.slice(0, 4);

  const terms = new Map<string, number>();
  for (const word of lines.join(" ").toLowerCase().match(/\b[a-z][a-z0-9-]{3,}\b/g) || []) {
    if (stopWords.has(word)) continue;
    terms.set(word, (terms.get(word) || 0) + 1);
  }

  return Array.from(terms.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([word]) => titleCase(word));
}

function inferTaskCandidates(lines: string[], now: Date): NoteScanTaskCandidate[] {
  return lines
    .filter((line) => taskPattern.test(line) || dueDatePattern.test(line))
    .slice(0, 4)
    .map((line, index) => {
      const dueDate = normalizeDueDate(line.match(dueDatePattern)?.[1], now);
      const timeMatch = line.match(dueTimePattern);
      return {
        title: cleanTaskTitle(line, index),
        dueDate,
        dueTime: normalizeTime(timeMatch?.[1], timeMatch?.[2], timeMatch?.[3])
      };
    });
}

function cleanTaskTitle(line: string, index: number) {
  const cleaned = line
    .replace(/^[-*•]\s*/, "")
    .replace(/\b(?:todo|to do|task|homework|hw)\s*:?\s*/i, "")
    .trim();
  return cleaned.slice(0, 80) || `Note task ${index + 1}`;
}

function normalizeDueDate(raw: string | undefined, now: Date) {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  const date = new Date(now);
  if (lower === "today") return isoDay(date);
  if (lower === "tomorrow") {
    date.setDate(date.getDate() + 1);
    return isoDay(date);
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return isoDay(parsed);
  const numeric = raw.match(/^(\d{1,2})[/. -](\d{1,2})(?:[/. -](\d{2,4}))?$/);
  if (!numeric) return undefined;
  const year = numeric[3] ? Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3]) : now.getFullYear();
  const month = Number(numeric[1]) - 1;
  const day = Number(numeric[2]);
  return isoDay(new Date(year, month, day));
}

function normalizeTime(hourRaw: string | undefined, minuteRaw: string | undefined, meridiem: string | undefined) {
  if (!hourRaw) return undefined;
  let hour = Number(hourRaw);
  const minute = Number(minuteRaw || "0");
  const lower = meridiem?.toLowerCase();
  if (lower === "pm" && hour < 12) hour += 12;
  if (lower === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function inferTags(body: string, keyIdeas: string[], taskCandidates: NoteScanTaskCandidate[]) {
  const tags = new Set<string>(["scan"]);
  if (taskCandidates.length) tags.add("tasks");
  if (/\bexam|quiz|test|midterm|final\b/i.test(body)) tags.add("exam");
  if (/\bask|question|office hours\b/i.test(body)) tags.add("ask");
  for (const idea of keyIdeas.slice(0, 2)) tags.add(idea.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  return Array.from(tags).filter(Boolean).slice(0, 5);
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function titleCase(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
