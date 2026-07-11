import { dateKey } from "../intelligence";

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

const relativeDateToken =
  "today|tomorrow|hoy|manana|mañana|heute|morgen|aujourd'hui|demain|hoje|amanha|amanhã|今日|明日|오늘|내일|今天|明天|आज|कल|اليوم|غدا|غدًا";
const monthToken =
  "jan(?:uary|uar|eiro|vier)?|ene(?:ro)?|feb(?:ruary|rero)?|fev(?:ereiro)?|fevr(?:ier)?|févr(?:ier)?|mar(?:ch|zo|ço|z)?|märz|apr(?:il)?|abr(?:il)?|avr(?:il)?|may|mai|mayo|maio|jun(?:e|io|ho|i)?|jui(?:n|llet)|jul(?:y|io|ho|i)?|aug(?:ust)?|ago(?:sto)?|aout|août|sep(?:tember|tiembre)?|sept(?:embre)?|set(?:embro)?|oct(?:ober|ubre|obre)?|okt(?:ober)?|out(?:ubro)?|nov(?:ember|iembre|embre)?|dec(?:ember)?|dez(?:ember|embro)?|dic(?:iembre)?|des(?:ember)?|déc(?:embre)?";
const isoDateToken = "\\d{4}-\\d{1,2}-\\d{1,2}";
const numericDateToken = "\\d{1,2}[/. -]\\d{1,2}(?:[/. -]\\d{2,4})?";
const cjkDateToken = "\\d{1,2}\\s*(?:月|월)\\s*\\d{1,2}\\s*(?:日|일)?";
const monthNameDateToken = `(?:${monthToken})\\.?\\s+\\d{1,2}(?:,?\\s+\\d{2,4})?|\\d{1,2}\\s+(?:${monthToken})\\.?(?:\\s+\\d{2,4})?`;
const dateTokenPattern = `${isoDateToken}|${numericDateToken}|${cjkDateToken}|${relativeDateToken}|${monthNameDateToken}`;
const dueLabelPattern = "(?:due|by|before|deadline|entrega|vence|para|avant|pour|frist|bis|prazo|até|期限|締切|마감|समय|नियत)";
const dueDatePattern = new RegExp(`(?:^|[\\s:;,.()\\-])${dueLabelPattern}\\s*:?\\s*(${dateTokenPattern})(?=$|[\\s:;,.()\\-])`, "iu");
const looseDatePattern = new RegExp(`(${dateTokenPattern})`, "iu");
const explicitTimePattern = /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i;
const meridiemTimePattern = /\b(\d{1,2})\s*(am|pm)\b/i;
const contextualTimePattern = /\b(?:at|by|before|a las|antes de|à|avant|um|bis|às|até)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|h)?\b/i;
const hStyleTimePattern = /\b(\d{1,2})h(?:(\d{2}))?\b/i;
const latinTaskWords =
  "todo|to do|task|homework|hw|finish|complete|submit|review|read|study|write|draft|email|ask|assignment|problem set|lab|quiz|exam|tarea|deber|entregar|leer|estudiar|repasar|revisar|réviser|lire|devoir|rendu|aufgabe|hausaufgabe|lesen|lernen|abgeben|tarefa|trabalho|estudar|ler";
const scriptTaskWords =
  "課題|宿題|読む|読書|勉強|復習|提出|試験|テスト|作业|复习|考试|提交|阅读|과제|숙제|읽기|공부|복습|제출|시험|होमवर्क|काम|पढ़ना|जमा|समीक्षा|परीक्षा|واجب|اختبار|مراجعة|تسليم|امتحان";
const taskPattern = new RegExp(`(?:^|[^\\p{L}\\p{N}_])(?:${latinTaskWords})(?=$|[^\\p{L}\\p{N}_])|(?:${scriptTaskWords})`, "iu");
const taskPrefixPattern = new RegExp(`^\\s*(?:todo|to do|task|homework|hw|tarea|deber|devoir|aufgabe|hausaufgabe|tarefa|trabalho|課題|宿題|作业|과제|숙제|होमवर्क|काम|واجب)\\s*:?\\s*`, "iu");
const duePrefixPattern = new RegExp(`^\\s*(?:due|by|before|deadline|entrega|vence|para|avant|pour|frist|bis|prazo|até|期限|締切|마감|समय|नियत)(?=$|[\\s:;,.()\\-])\\s*:?\\s*`, "iu");
const stopWords = new Set([
  "the", "and", "for", "with", "that", "this", "from", "into", "about", "today", "class",
  "para", "con", "las", "los", "les", "des", "und", "der", "die", "das", "ein", "uma", "com"
]);

export function scanStudyNoteText(rawText: string, sourceName = "Scanned notes", now = new Date()): NoteScanResult {
  const body = normalizeNoteText(rawText);
  if (!hasMinimumNoteSignal(body)) {
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
    .replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\u0000/g, "")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/([A-Za-z])-\n([A-Za-z])/g, "$1$2")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasMinimumNoteSignal(body: string) {
  if (body.length >= 8) return true;
  const compact = body.replace(/\s+/g, "");
  return compact.length >= 3 && (taskPattern.test(body) || looseDatePattern.test(body) || /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Devanagari}\p{Script=Arabic}]/u.test(compact));
}

function inferTitle(lines: string[], sourceName: string) {
  const explicit = lines.find((line) => /^#?\s*[\p{L}\p{N}].{3,70}$/u.test(line) && !taskPattern.test(line));
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
    .filter((line) => taskPattern.test(line) || dueDatePattern.test(line) || hasActionableDate(line))
    .slice(0, 6)
    .map((line, index) => {
      const dueDate = normalizeDueDate(line.match(dueDatePattern)?.[1] || line.match(looseDatePattern)?.[1], now);
      return {
        title: cleanTaskTitle(line),
        dueDate,
        dueTime: extractDueTime(line)
      };
    });
}

function cleanTaskTitle(line: string) {
  const cleaned = line
    .replace(/^[-*•]\s*/, "")
    .replace(taskPrefixPattern, "")
    .replace(duePrefixPattern, "")
    .trim();
  if (hasMeaningfulTaskTitle(cleaned)) return cleaned.slice(0, 80);
  return fallbackTaskTitle(line);
}

function hasMeaningfulTaskTitle(value: string) {
  const compact = value.replace(/[^\p{L}\p{N}]+/gu, "");
  if (compact.length < 4 && !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Devanagari}\p{Script=Arabic}]{2,}/u.test(compact)) return false;
  return !isDateWord(value.trim());
}

function fallbackTaskTitle(line: string) {
  const dueLabel = line.match(dueDatePattern)?.[1] || line.match(looseDatePattern)?.[1];
  const duePhrase = dueLabel ? ` due ${dueLabel}` : "";
  if (/\b(?:ask|question|office hours)\b/i.test(line)) return `Bring note question to class${duePhrase}`.slice(0, 80);
  if (/\b(?:exam|quiz|test|midterm|final)\b/i.test(line)) return `Review exam note${duePhrase}`.slice(0, 80);
  const subject = fallbackTaskSubject(line);
  if (dueLabel) return subject ? `Confirm ${subject}${duePhrase}`.slice(0, 80) : `Confirm deadline${duePhrase}`.slice(0, 80);
  if (taskPattern.test(line)) return subject ? `Follow up on ${subject}`.slice(0, 80) : "Review latest class note";
  return subject ? `Review ${subject}`.slice(0, 80) : "Review latest class note";
}

function fallbackTaskSubject(line: string) {
  return (line.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Devanagari}\p{Script=Arabic}]{2,}|[\p{L}\p{N}][\p{L}\p{N}-]{3,}/gu) || [])
    .filter((word) => !stopWords.has(word.toLowerCase()) && !isDateWord(word))
    .slice(0, 4)
    .join(" ");
}

function isDateWord(value: string) {
  return relativeDayOffset(value) !== undefined || new RegExp(`^\\s*(?:${dateTokenPattern})\\s*$`, "iu").test(value);
}

function hasActionableDate(line: string) {
  return looseDatePattern.test(line) && taskPattern.test(line);
}

function normalizeDueDate(raw: string | undefined, now: Date) {
  if (!raw) return undefined;
  const relativeOffset = relativeDayOffset(raw);
  if (relativeOffset !== undefined) {
    const date = new Date(now);
    date.setDate(date.getDate() + relativeOffset);
    return isoDay(date);
  }

  const cjk = raw.match(/(\d{1,2})\s*(?:月|월)\s*(\d{1,2})\s*(?:日|일)?/u);
  if (cjk) return chooseBestDate([dateFromParts(now.getFullYear(), Number(cjk[1]), Number(cjk[2])), dateFromParts(now.getFullYear() + 1, Number(cjk[1]), Number(cjk[2]))], now);

  const monthNameDate = parseMonthNameDate(raw, now);
  if (monthNameDate) return monthNameDate;

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return chooseBestDate([dateFromParts(Number(iso[1]), Number(iso[2]), Number(iso[3]))], now);

  const numeric = raw.match(/^(\d{1,2})[/. -](\d{1,2})(?:[/. -](\d{2,4}))?$/);
  if (!numeric) return undefined;
  const first = Number(numeric[1]);
  const second = Number(numeric[2]);
  const explicitYear = numeric[3] ? normalizeYear(numeric[3]) : undefined;
  const years = explicitYear ? [explicitYear] : [now.getFullYear(), now.getFullYear() + 1];
  const candidates: Date[] = [];
  for (const year of years) {
    if (first <= 12) candidates.push(dateFromParts(year, first, second));
    if (second <= 12) candidates.push(dateFromParts(year, second, first));
  }
  return chooseBestDate(candidates, now);
}

function normalizeDateToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[.。]/g, "")
    .trim();
}

function relativeDayOffset(raw: string) {
  const value = normalizeDateToken(raw);
  if (["today", "hoy", "heute", "aujourd'hui", "hoje", "今日", "오늘", "今天", "आज", "اليوم"].includes(value)) return 0;
  if (["tomorrow", "manana", "morgen", "demain", "amanha", "明日", "내일", "明天", "कल", "غدا"].includes(value)) return 1;
  return undefined;
}

function normalizeYear(raw: string) {
  return Number(raw.length === 2 ? `20${raw}` : raw);
}

function dateFromParts(year: number, month: number, day: number) {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return new Date(Number.NaN);
  return date;
}

function chooseBestDate(candidates: Date[], now: Date) {
  const valid = candidates.filter((date) => !Number.isNaN(date.getTime()));
  if (!valid.length) return undefined;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const upcoming = valid.filter((date) => date.getTime() >= today.getTime()).sort((a, b) => a.getTime() - b.getTime());
  return isoDay(upcoming[0] || valid.sort((a, b) => Math.abs(a.getTime() - today.getTime()) - Math.abs(b.getTime() - today.getTime()))[0]);
}

function parseMonthNameDate(raw: string, now: Date) {
  const clean = normalizeDateToken(raw).replace(/,/g, " ");
  const monthFirst = clean.match(/^([a-z]+)\s+(\d{1,2})(?:\s+(\d{2,4}))?$/i);
  const dayFirst = clean.match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{2,4}))?$/i);
  const monthName = monthFirst?.[1] || dayFirst?.[2];
  const day = Number(monthFirst?.[2] || dayFirst?.[1]);
  const month = monthName ? monthIndex(monthName) : undefined;
  if (!month || Number.isNaN(day)) return undefined;
  const explicitYear = monthFirst?.[3] || dayFirst?.[3];
  const years = explicitYear ? [normalizeYear(explicitYear)] : [now.getFullYear(), now.getFullYear() + 1];
  return chooseBestDate(years.map((year) => dateFromParts(year, month, day)), now);
}

function monthIndex(raw: string) {
  const value = normalizeDateToken(raw);
  if (/^(jan|ene)/.test(value)) return 1;
  if (/^(feb|fev)/.test(value)) return 2;
  if (/^(mar)/.test(value)) return 3;
  if (/^(apr|abr|avr)/.test(value)) return 4;
  if (/^(may|mai|mayo|maio)$/.test(value)) return 5;
  if (/^(jun|juin)/.test(value)) return 6;
  if (/^(jul|jui)/.test(value)) return 7;
  if (/^(aug|ago|aout)/.test(value)) return 8;
  if (/^(sep|set)/.test(value)) return 9;
  if (/^(oct|okt|out)/.test(value)) return 10;
  if (/^(nov)/.test(value)) return 11;
  if (/^(dec|dez|dic|des)/.test(value)) return 12;
  return undefined;
}

function extractDueTime(line: string) {
  const explicit = line.match(explicitTimePattern);
  if (explicit) return normalizeTime(explicit[1], explicit[2], explicit[3]);
  const meridiem = line.match(meridiemTimePattern);
  if (meridiem) return normalizeTime(meridiem[1], undefined, meridiem[2]);
  const hStyle = line.match(hStyleTimePattern);
  if (hStyle) return normalizeTime(hStyle[1], hStyle[2] || "0", undefined);
  const contextual = line.match(contextualTimePattern);
  if (!contextual) return undefined;
  if (!contextual[2] && !contextual[3]) return undefined;
  return normalizeTime(contextual[1], contextual[2], contextual[3]);
}

function normalizeTime(hourRaw: string | undefined, minuteRaw: string | undefined, meridiem: string | undefined) {
  if (!hourRaw) return undefined;
  let hour = Number(hourRaw);
  const minute = Number(minuteRaw || "0");
  const lower = meridiem?.toLowerCase();
  if (Number.isNaN(hour) || Number.isNaN(minute) || hour > 23 || minute > 59) return undefined;
  if (lower === "pm" && hour < 12) hour += 12;
  if (lower === "am" && hour === 12) hour = 0;
  if (hour > 23) return undefined;
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
  return dateKey(date);
}

function titleCase(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
