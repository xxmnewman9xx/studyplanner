import { CLASS_COLORS, defaultData, isoFromOffset } from "./seed";
import { scanStudyNoteText } from "./services/noteScanner";
import { AppData, ClassItem, ExamItem, ImportBatch, ImportCandidate, NoteItem, StudyBlock, TaskItem } from "./types";
import { buildSchedulePlan, buildSemesterSnapshot, parseNoteInsights } from "./intelligence";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function clean(s: string) {
  return s.replace(/[–—]/g, "-").replace(/\s+/g, " ").replace(/[•*]/g, "").trim();
}

function uniqueCleanStrings(values: string[], limit: number) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const value = clean(raw).slice(0, 88);
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
    if (result.length >= limit) break;
  }
  return result;
}

function displayTimeFromClock(clock?: string) {
  const match = clock?.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return undefined;
  const hour24 = Number(match[1]);
  const minute = match[2];
  if (Number.isNaN(hour24) || hour24 > 23) return undefined;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${minute} ${suffix}`;
}

function offsetFromIsoDay(iso?: string) {
  if (!iso) return 1;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const target = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(target.getTime())) return 1;
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function fallbackClass(): ClassItem {
  return {
    id: "class_pending_import",
    code: "Class",
    name: "Imported class",
    professor: "Professor TBD",
    room: "Room TBD",
    days: "Tue Thu",
    time: "10:00 AM",
    next: "Next class",
    health: 0.72,
    grade: "Not set",
    color: "#0A84FF",
    color2: "#30D158",
    icon: "book-open",
  };
}

function classSlug(code: string) {
  return code.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_PATTERN = String.raw`(?:jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)\.?[a-z]*`;
const DATE_PATTERN = String.raw`\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\s+${MONTH_PATTERN}(?:,?\s+\d{4})?|${MONTH_PATTERN}\s+\d{1,2}(?:,?\s+\d{4})?|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?|today|tomorrow|next\s+\w+|(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:day)?(?:,\s+${MONTH_PATTERN}\s+\d{1,2})?|in\s+\d+\s+days?|midnight`;

const GLOBAL_MONTHS: Record<string, string> = {
  enero: "January", janeiro: "January", janvier: "January", januar: "January", eneroo: "January", "1月": "January", "1월": "January", जनवरी: "January", يناير: "January",
  febrero: "February", fevereiro: "February", fevrier: "February", février: "February", februar: "February", "2月": "February", "2월": "February", फ़रवरी: "February", फरवरी: "February", فبراير: "February",
  marzo: "March", marco: "March", março: "March", mars: "March", marz: "March", märz: "March", "3月": "March", "3월": "March", मार्च: "March", مارس: "March",
  abril: "April", avril: "April", april: "April", "4月": "April", "4월": "April", अप्रैल: "April", أبريل: "April",
  mayo: "May", maio: "May", mai: "May", "5月": "May", "5월": "May", मई: "May", مايو: "May",
  junio: "June", junho: "June", juin: "June", juni: "June", "6月": "June", "6월": "June", जून: "June", يونيو: "June",
  julio: "July", julho: "July", juillet: "July", juli: "July", "7月": "July", "7월": "July", जुलाई: "July", يوليو: "July",
  agosto: "August", aout: "August", août: "August", august: "August", "8月": "August", "8월": "August", अगस्त: "August", أغسطس: "August",
  septiembre: "September", setembro: "September", septembre: "September", september: "September", "9月": "September", "9월": "September", सितंबर: "September", सितम्बर: "September", سبتمبر: "September",
  octubre: "October", outubro: "October", octobre: "October", oktober: "October", "10月": "October", "10월": "October", अक्तूबर: "October", अक्टूबर: "October", أكتوبر: "October",
  noviembre: "November", novembro: "November", novembre: "November", november: "November", "11月": "November", "11월": "November", नवंबर: "November", نوفمبر: "November",
  diciembre: "December", dezembro: "December", decembre: "December", décembre: "December", dezember: "December", "12月": "December", "12월": "December", दिसंबर: "December", ديسمبر: "December",
};

const GLOBAL_KEYWORD_NORMALIZATIONS: [RegExp, string][] = [
  [/\b(tarea|deber|trabajo|trabalho|relatorio|relatório|devoir|hausaufgabe|aufgabe|課題|作业|作業|숙제|과제|असाइनमेंट|कार्य|واجب)\b/gi, " assignment "],
  [/\b(examen|exame|prüfung|prufung|klausur|試験|考试|考試|시험|परीक्षा|اختبار|امتحان)\b/gi, " exam "],
  [/\b(prueba|quiz|questionnaire|controle|contrôle|小テスト|测验|퀴즈)\b/gi, " quiz "],
  [/\b(proyecto|projeto|projet|projekt|プロジェクト|项目|項目|프로젝트|परियोजना|مشروع)\b/gi, " project "],
  [/\b(laboratorio|laboratório|laboratoire|labor|実験|实验|實驗|실험|प्रयोगशाला|مختبر)\b/gi, " lab "],
  [/\b(lectura|leitura|lecture|lesen|読書|阅读|閱讀|읽기|पठन|قراءة)\b/gi, " reading "],
  [/\b(ensayo|ensaio|dissertation|aufsatz|エッセイ|论文|論文|에세이|निबंध|مقال)\b/gi, " essay "],
  [/\b(presentacion|presentación|apresentacao|apresentação|présentation|prasentation|präsentation|発表|演示|발표|प्रस्तुति|عرض)\b/gi, " presentation "],
  [/\b(discusion|discusión|discussao|discussão|discussion|討論|讨论|토론|चर्चा|مناقشة)\b/gi, " discussion "],
  [/\b(vence|vencimiento|entrega|entregar|prazo|à rendre|a rendre|abzugeben|fällig|faellig|締切|截止|마감|देय|مستحق)\b/gi, " due "],
  [/\b(confuso|confusa|confus|dificil|difícil|schwer|verwirrend|わからない|困惑|혼란|समझ नहीं|مربك)\b/gi, " confusing "],
  [/\b(repasa|revisar|revisao|revisão|réviser|reviser|wiederholen|復習|复习|복습|समीक्षा|مراجعة)\b/gi, " review "],
];

const GLOBAL_LITERAL_NORMALIZATIONS: Record<string, string> = {
  課題: " assignment ", 作业: " assignment ", 作業: " assignment ", 숙제: " assignment ", 과제: " assignment ", असाइनमेंट: " assignment ", कार्य: " assignment ", واجب: " assignment ",
  試験: " exam ", 考试: " exam ", 考試: " exam ", 시험: " exam ", परीक्षा: " exam ", اختبار: " exam ", امتحان: " exam ",
  小テスト: " quiz ", 测验: " quiz ", 퀴즈: " quiz ",
  プロジェクト: " project ", 项目: " project ", 프로젝트: " project ", परियोजना: " project ", مشروع: " project ",
  実験: " lab ", 实验: " lab ", 실험: " lab ", प्रयोगशाला: " lab ", مختبر: " lab ",
  復習: " review ", 复习: " review ", 복습: " review ", समीक्षा: " review ", مراجعة: " review ",
  締切: " due ", 截止: " due ", 마감: " due ", देय: " due ", مستحق: " due ",
};

function normalizeNumericScripts(value: string) {
  const devanagari = "०१२३४५६७८९";
  const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
  const easternArabic = "۰۱۲۳۴۵۶۷۸۹";
  return value.replace(/[०-९٠-٩۰-۹]/g, (char) => {
    const dev = devanagari.indexOf(char);
    if (dev >= 0) return String(dev);
    const ar = arabicIndic.indexOf(char);
    if (ar >= 0) return String(ar);
    const ear = easternArabic.indexOf(char);
    if (ear >= 0) return String(ear);
    return char;
  });
}

export function normalizeGlobalAcademicText(sourceText: string) {
  let text = normalizeNumericScripts(sourceText)
    .replace(/[：]/g, ":")
    .replace(/[；]/g, ";")
    .replace(/[，]/g, ",")
    .replace(/[–—]/g, "-")
    .replace(/(\d)\s*([/-])\s*(\d)/g, "$1$2$3")
    .replace(/(\d{1,2})\s*[月월]\s*(\d{1,2})\s*[日일]?/g, "$1/$2");

  Object.entries(GLOBAL_LITERAL_NORMALIZATIONS).forEach(([from, to]) => {
    text = text.split(from).join(to);
  });

  Object.entries(GLOBAL_MONTHS).forEach(([from, to]) => {
    text = text.split(from).join(to);
  });

  const monthKeys = Object.keys(GLOBAL_MONTHS).sort((a, b) => b.length - a.length).map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const englishMonthKeys = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthPattern = [...monthKeys, ...englishMonthKeys].join("|");
  text = text.replace(new RegExp(`\\b(\\d{1,2})\\s+(?:de\\s+|del\\s+|do\\s+|de\\s+l['’])?(${monthPattern})\\b`, "gi"), (_match, day, month) => `${GLOBAL_MONTHS[String(month).toLowerCase()] || month} ${day}`);
  text = text.replace(new RegExp(`\\b(\\d{1,2})\\.\\s*(${monthPattern})\\b`, "gi"), (_match, day, month) => `${GLOBAL_MONTHS[String(month).toLowerCase()] || month} ${day}`);
  text = text.replace(/\b(\d{1,2})\s*[.]\s*(\d{1,2})(?:\s*[.]\s*(\d{2,4}))?\b/g, (_match, day, month, year) => `${month}/${day}${year ? `/${year}` : ""}`);
  text = text.replace(/\b(?:le|la|el|um|am)\s+(?=(?:January|February|March|April|May|June|July|August|September|October|November|December)\b)/gi, "");

  GLOBAL_KEYWORD_NORMALIZATIONS.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });

  return text.replace(/\b(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[/-]\d{1,2})\s*\|\s*([^|\n;]{3,80})/g, "$1: $2");
}

function fullYear(year: string | undefined, now: Date) {
  if (!year) return now.getFullYear();
  return Number(year.length === 2 ? `20${year}` : year);
}

function validDateParts(year: number, month: number, day: number) {
  const target = new Date(year, month - 1, day, 12, 0, 0);
  return target.getFullYear() === year && target.getMonth() === month - 1 && target.getDate() === day;
}

function dateFromParts(year: number, month: number, day: number, explicitYear: boolean, now: Date) {
  if (!validDateParts(year, month, day)) return null;
  const target = new Date(year, month - 1, day, 12, 0, 0);
  if (!explicitYear && target.getTime() < now.getTime()) {
    const nextYear = year + 1;
    return validDateParts(nextYear, month, day) ? new Date(nextYear, month - 1, day, 12, 0, 0) : null;
  }
  return target;
}

function hasDateLikeToken(phrase: string) {
  return /\b\d{4}-\d{1,2}-\d{1,2}\b|\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b|\b(?:[a-z]+\.?\s+\d{1,2}|\d{1,2}\s+[a-z]+\.?)\b/i.test(phrase);
}

function dateFromPhrase(phrase: string, now: Date) {
  const p = phrase.toLowerCase().replace(/[–—]/g, "-").replace(/\./g, "").trim();
  if (p.includes("today")) return new Date(now);
  if (p.includes("tomorrow")) {
    const target = new Date(now);
    target.setDate(target.getDate() + 1);
    return target;
  }
  const isoMatch = p.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    return dateFromParts(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]), true, now);
  }
  const slashMatch = p.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/);
  if (slashMatch) {
    let month = Number(slashMatch[1]);
    let day = Number(slashMatch[2]);
    if (month > 12 && day <= 12) {
      month = Number(slashMatch[2]);
      day = Number(slashMatch[1]);
    }
    return dateFromParts(fullYear(slashMatch[3], now), month, day, Boolean(slashMatch[3]), now);
  }
  const monthFirst = p.match(new RegExp(`\\b(${MONTH_PATTERN})\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?\\b`, "i"));
  if (monthFirst) {
    const month = MONTHS.findIndex((m) => monthFirst[1].toLowerCase().startsWith(m));
    return month >= 0 ? dateFromParts(fullYear(monthFirst[3], now), month + 1, Number(monthFirst[2]), Boolean(monthFirst[3]), now) : null;
  }
  const dayFirst = p.match(new RegExp(`\\b(\\d{1,2})\\s+(${MONTH_PATTERN})(?:,?\\s+(\\d{4}))?\\b`, "i"));
  if (dayFirst) {
    const month = MONTHS.findIndex((m) => dayFirst[2].toLowerCase().startsWith(m));
    return month >= 0 ? dateFromParts(fullYear(dayFirst[3], now), month + 1, Number(dayFirst[1]), Boolean(dayFirst[3]), now) : null;
  }
  return null;
}

function offsetForDatePhrase(phrase: string, now: Date) {
  const p = phrase.toLowerCase().trim();
  if (p.includes("today")) return 0;
  if (p.includes("tomorrow")) return 1;
  const parsed = dateFromPhrase(p, now);
  if (parsed) return Math.round((parsed.getTime() - now.getTime()) / 86400000);
  if (hasDateLikeToken(p)) return null;
  const shortDay = { sun: "sunday", mon: "monday", tue: "tuesday", tues: "tuesday", wed: "wednesday", thu: "thursday", fri: "friday", sat: "saturday" } as Record<string, string>;
  const short = Object.keys(shortDay).find((key) => new RegExp(`\\b${key}\\b`).test(p));
  const normalized = short ? `${p} ${shortDay[short]}` : p;
  const day = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].findIndex((d) => normalized.includes(d));
  if (day >= 0) {
    const current = now.getDay();
    let delta = day - current;
    if (delta <= 0 || p.includes("next")) delta += 7;
    return delta;
  }
  const numberMatch = p.match(/in\s+(\d+)\s+days?/);
  if (numberMatch) return Number(numberMatch[1]);
  return 7;
}

function dueFromDatePhrase(phrase: string, now: Date) {
  const offset = offsetForDatePhrase(phrase, now);
  if (offset === null) return null;
  return { offset, dueDate: isoFromOffset(offset, now) };
}

function inferType(title: string) {
  const t = title.toLowerCase();
  if (t.includes("lab")) return "Lab";
  if (t.includes("essay") || t.includes("paper")) return "Essay";
  if (t.includes("read")) return "Reading";
  if (t.includes("project")) return "Project";
  if (t.includes("review")) return "Review";
  if (t.includes("discussion")) return "Discussion";
  return "Assignment";
}

function estimateMinutes(title: string) {
  const t = title.toLowerCase();
  if (t.includes("project")) return 240;
  if (t.includes("case") || t.includes("essay") || t.includes("paper")) return 180;
  if (t.includes("problem") || t.includes("mechanism") || t.includes("set")) return 120;
  if (t.includes("lab")) return 90;
  if (t.includes("read")) return 40;
  return 75;
}

function isPolicyOnly(text: string) {
  const t = text.toLowerCase();
  return /(attendance|late work|academic integrity|plagiarism|grading scale|participation|accessibility|office hours|spring break|no class|holiday|policy|policies)/.test(t) &&
    !/(due|deadline|quiz|exam|midterm|final|test|project|essay|paper|problem set|lab report|case memo|discussion post|reflection|presentation)/.test(t);
}

function titleFromDatePrefix(clause: string, datePhrase: string) {
  return clean(clause
    .replace(datePhrase, "")
    .replace(/^[:\-\s|]+/, "")
    .replace(/\b(?:due|deadline|by|on|para|pour|le|la|el|del|do|de|um|am)\b/gi, "")
    .replace(/\b\d{1,2}:\d{2}\s?(?:AM|PM)\b/gi, "")
    .replace(/[;|]+$/g, ""));
}

function cleanImportedTitle(title: string) {
  return clean(title
    .replace(/\b[A-Z]{2,5}\s?\d{2,4}\b/g, "")
    .replace(/\b(?:due|deadline|by|on|at|para|pour|le|la|el|del|do|de|um|am|à|a)\b/gi, " ")
    .replace(/\b(?:is|will be|held|scheduled)\b/gi, " ")
    .replace(/^[:\-\s|]+/, "")
    .replace(/[;|:]+$/g, ""));
}

const ACTIONABLE_TITLE_PATTERN = "assignment|homework|problem set|lab report|case memo|discussion|reflection|presentation|project|reading|essay|paper|clinical|module|report|response";
const EXAM_TITLE_PATTERN = "quiz|exam|midterm|final|test|lab practical";

function findClassId(code: string, classes: ClassItem[]) {
  const found = classes.find((c) => c.code.replace(/\s+/g, "").toLowerCase() === code.replace(/\s+/g, "").toLowerCase());
  return found?.id || classSlug(code);
}

export function analyzeSyllabus(sourceText: string, existing: AppData = defaultData, now = new Date()): ImportBatch {
  const normalizedSourceText = normalizeGlobalAcademicText(sourceText);
  const lines = normalizedSourceText
    .split(/\n+/)
    .map(clean)
    .filter(Boolean);
  const classes = [...existing.classes];
  const candidates: ImportCandidate[] = [];
  const seenClasses = new Set(classes.map((c) => c.code.toLowerCase()));
  let activeClassId = classes[0]?.id || "bio";

  const datePattern = DATE_PATTERN;
  const splitIntoClauses = (line: string) =>
    line
      .split(/(?<=[.;|])\s+/)
      .flatMap((part) => [part])
      .flatMap((part) => part.split(new RegExp(`(?=\\b(?:${DATE_PATTERN})\\s*[:\\-])`, "gi")))
      .map(clean)
      .filter(Boolean);

  lines.forEach((line, index) => {
    const classSegment = clean(line.split(/[.;|]/)[0] || line);
    const classMatch = classSegment.match(/\b([A-Z]{2,5})\s?(\d{2,4})\b\s*(?:[-—:]\s*)?([^|,;]*)/);
    if (classMatch && !["MWF", "MW", "TR"].includes(classMatch[1])) {
      const code = `${classMatch[1]} ${classMatch[2]}`;
      if (!seenClasses.has(code.toLowerCase())) {
        const palette = CLASS_COLORS[(classes.length + candidates.length) % CLASS_COLORS.length];
        const days = classSegment.match(/\b(MWF|MW|TR|Mon Wed|Tue Thu|Monday Wednesday|Mon Wed Fri|Monday Wednesday Friday|Tuesday Thursday)\b/i)?.[0] || "Tue Thu";
        const time = classSegment.match(/\b\d{1,2}(?::\d{2})?\s?(?:AM|PM)\b/i)?.[0]?.toUpperCase() || "10:00 AM";
        const room = classSegment.match(/\b(?:Room|Hall|Building|Online|Lab|Ryder|Richards|Science|Business)\s?[A-Za-z0-9 ]{2,24}/i)?.[0] || "Room TBD";
        const name = clean((classMatch[3] || "New Course").replace(/\b(?:meets?|meeting|lecture)\b.*$/i, "")) || "New Course";
        const klass: ClassItem = {
          id: classSlug(code),
          code,
          name,
          professor: classSegment.match(/\b(?:Dr\.|Prof\.)\s+[A-Z][a-z]+/i)?.[0] || "Professor TBD",
          room,
          days,
          time,
          next: `${dayShort[(now.getDay() + 1) % 7]} · ${time}`,
          health: 0.76,
          grade: "Not set",
          color: palette[0],
          color2: palette[1],
          icon: line.toLowerCase().includes("chem") || line.toLowerCase().includes("bio") ? "flask-conical" : "book-open",
        };
        classes.push(klass);
        seenClasses.add(code.toLowerCase());
        activeClassId = klass.id;
        candidates.push({
          id: id("ic"),
          kind: "class",
          title: `${klass.code} · ${klass.name}`,
          meta: `${klass.days} · ${klass.time} · ${klass.room}`,
          classId: klass.id,
          confidence: room === "Room TBD" ? 0.72 : 0.94,
          payload: klass,
          approved: true,
        });
      } else {
        activeClassId = findClassId(code, classes);
      }
    }

    const lineClassId = activeClassId || classes[index % Math.max(classes.length, 1)]?.id || "bio";
    const looseDatePattern = String.raw`\d{4}-\d{1,2}-\d{1,2}|[A-Za-z]+\.?\s+\d{1,2}|\d{1,2}\s+[A-Za-z]+\.?|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?|today|tomorrow|next\s+\w+`;
    const dueSegments = line.split(/[.;|]/).map(clean).filter((segment) => /\bdue\b/i.test(segment));
    const dueScan = dueSegments.length <= 1 ? (dueSegments[0] || line) : "";
    const lineDue = dueScan && !isPolicyOnly(dueScan) ? dueScan.match(new RegExp(`(.{3,120}?)(?:\\s+is)?\\s+due\\s+(${looseDatePattern})`, "i")) : null;
    if (lineDue) {
      const due = dueFromDatePhrase(lineDue[2], now);
      const title = cleanImportedTitle(lineDue[1].split("|").pop() || lineDue[1]) || "Imported assignment";
      const key = `task-${title.toLowerCase()}-${due?.dueDate || ""}`;
      if (due && !candidates.some((candidate) => `${candidate.kind}-${candidate.title.toLowerCase()}-${(candidate.payload as any).dueDate || ""}` === key)) {
        const task: TaskItem = {
          id: id("t"),
          title,
          classId: lineClassId,
          type: inferType(title),
          dueOffset: due.offset,
          dueDate: due.dueDate,
          time: line.match(/\b\d{1,2}:\d{2}\s?(?:AM|PM)\b/i)?.[0]?.toUpperCase() || "11:59 PM",
          estimateMinutes: estimateMinutes(title),
          done: false,
          urgent: due.offset <= 2,
          source: "AI syllabus import",
          subtasks: [{ title: "Confirm requirements", done: false }, { title: "Complete first pass", done: false }],
        };
        candidates.push({ id: id("ic"), kind: "task", title: task.title, meta: `${task.type} · due ${task.dueDate} · ${task.time}`, classId: lineClassId, confidence: 0.82, payload: task, approved: true });
      }
    }

    const lineExam = !isPolicyOnly(line) ? line.match(new RegExp(`(.{0,100}?(?:exam|midterm|quiz|test|final)[^.;,]*?)(?:\\s+(?:will\\s+be\\s+)?(?:held|scheduled|on)\\s+|:\\s*)(${looseDatePattern})`, "i")) : null;
    if (lineExam) {
      const due = dueFromDatePhrase(lineExam[2], now);
      const examPrefix = lineExam[1].split(/\band\s+(?:the\s+)?/i).pop() || lineExam[1];
      const title = cleanImportedTitle(examPrefix.split("|").pop() || examPrefix) || "Imported exam";
      const key = `exam-${title.toLowerCase()}-${due?.dueDate || ""}`;
      if (due && !candidates.some((candidate) => `${candidate.kind}-${candidate.title.toLowerCase()}-${(candidate.payload as any).dueDate || ""}` === key)) {
        const exam: ExamItem = {
          id: id("e"),
          classId: lineClassId,
          title,
          dueOffset: due.offset,
          dueDate: due.dueDate,
          time: line.match(/\b\d{1,2}:\d{2}\s?(?:AM|PM)\b/i)?.[0]?.toUpperCase() || "9:00 AM",
          room: line.match(/\b(?:Room|Hall|Building|Online|Lab|Richards|Science|Business)\s?[A-Za-z0-9 ]{2,24}/i)?.[0] || "Room TBD",
          topics: ["Core concepts", "Practice problems", "Lecture notes"],
        };
        candidates.push({ id: id("ic"), kind: "exam", title: exam.title, meta: `${exam.dueDate} · ${exam.time} · ${exam.room}`, classId: lineClassId, confidence: exam.room === "Room TBD" ? 0.72 : 0.88, payload: exam, approved: true });
      }
    }

    const linePrefix = !isPolicyOnly(line) ? line.match(new RegExp(`^\\s*(${looseDatePattern})\\s*[:\\-]?\\s+(.{3,120})`, "i")) : null;
    if (linePrefix) {
      const title = clean(linePrefix[2].replace(/\b(?:due|deadline|by)\b/gi, "").replace(/[;|]+$/g, ""));
      const due = dueFromDatePhrase(linePrefix[1], now);
      const isExamLike = new RegExp(EXAM_TITLE_PATTERN, "i").test(title);
      const isTaskLike = isExamLike || new RegExp(ACTIONABLE_TITLE_PATTERN, "i").test(title);
      const key = `${isExamLike ? "exam" : "task"}-${title.toLowerCase()}-${due?.dueDate || ""}`;
      if (due && isTaskLike && title && !candidates.some((candidate) => `${candidate.kind}-${candidate.title.toLowerCase()}-${(candidate.payload as any).dueDate || ""}` === key)) {
        if (isExamLike) {
          const exam: ExamItem = {
            id: id("e"),
            classId: lineClassId,
            title,
            dueOffset: due.offset,
            dueDate: due.dueDate,
            time: line.match(/\b\d{1,2}:\d{2}\s?(?:AM|PM)\b/i)?.[0]?.toUpperCase() || "9:00 AM",
            room: "Room TBD",
            topics: ["Core concepts", "Practice problems", "Lecture notes"],
          };
          candidates.push({ id: id("ic"), kind: "exam", title: exam.title, meta: `${exam.dueDate} · ${exam.time} · ${exam.room}`, classId: lineClassId, confidence: 0.72, payload: exam, approved: true });
        } else {
          const task: TaskItem = {
            id: id("t"),
            title,
            classId: lineClassId,
            type: inferType(title),
            dueOffset: due.offset,
            dueDate: due.dueDate,
            time: line.match(/\b\d{1,2}:\d{2}\s?(?:AM|PM)\b/i)?.[0]?.toUpperCase() || "11:59 PM",
            estimateMinutes: estimateMinutes(title),
            done: false,
            urgent: due.offset <= 2,
            source: "AI syllabus import",
            subtasks: [{ title: "Confirm requirements", done: false }, { title: "Complete first pass", done: false }],
          };
          candidates.push({ id: id("ic"), kind: "task", title: task.title, meta: `${task.type} · due ${task.dueDate} · ${task.time}`, classId: lineClassId, confidence: 0.8, payload: task, approved: true });
        }
      }
    }

    const actionOn = !isPolicyOnly(line) ? line.match(new RegExp(`^\\s*((?:presentation|clinical checkoff|lab practical|project milestone|discussion post|reading response|essay|paper|case memo)[^.;,]*?)\\s+(?:on|scheduled)\\s+(${looseDatePattern})`, "i")) : null;
    if (actionOn) {
      const title = clean(actionOn[1]);
      const due = dueFromDatePhrase(actionOn[2], now);
      const isExamLike = /lab practical/i.test(title);
      const key = `${isExamLike ? "exam" : "task"}-${title.toLowerCase()}-${due?.dueDate || ""}`;
      if (due && !candidates.some((candidate) => `${candidate.kind}-${candidate.title.toLowerCase()}-${(candidate.payload as any).dueDate || ""}` === key)) {
        if (isExamLike) {
          const exam: ExamItem = { id: id("e"), classId: lineClassId, title, dueOffset: due.offset, dueDate: due.dueDate, time: "9:00 AM", room: "Room TBD", topics: ["Core concepts", "Practice problems", "Lecture notes"] };
          candidates.push({ id: id("ic"), kind: "exam", title: exam.title, meta: `${exam.dueDate} · ${exam.time} · ${exam.room}`, classId: lineClassId, confidence: 0.72, payload: exam, approved: true });
        } else {
          const task: TaskItem = { id: id("t"), title, classId: lineClassId, type: inferType(title), dueOffset: due.offset, dueDate: due.dueDate, time: "11:59 PM", estimateMinutes: estimateMinutes(title), done: false, urgent: due.offset <= 2, source: "AI syllabus import", subtasks: [{ title: "Confirm requirements", done: false }, { title: "Complete first pass", done: false }] };
          candidates.push({ id: id("ic"), kind: "task", title: task.title, meta: `${task.type} · due ${task.dueDate} · ${task.time}`, classId: lineClassId, confidence: 0.8, payload: task, approved: true });
        }
      }
    }

    splitIntoClauses(line).forEach((clause) => {
      if (isPolicyOnly(clause)) return;
      const code = clause.match(/\b([A-Z]{2,5})\s?(\d{2,4})\b/);
      const classId = code ? findClassId(`${code[1]} ${code[2]}`, classes) : activeClassId || classes[index % Math.max(classes.length, 1)]?.id || "bio";
      const datedAction = clause.match(new RegExp(`^\\s*(?:week\\s+\\d+\\s+)?(${datePattern})\\s*[:\\-|]\\s*(.{3,120})`, "i"));
      if (datedAction && !/(spring break|no class|holiday|office hours)/i.test(clause)) {
        const due = dueFromDatePhrase(datedAction[1], now);
        const rawTitle = cleanImportedTitle(datedAction[2]);
        const actionable = new RegExp(`${ACTIONABLE_TITLE_PATTERN}|${EXAM_TITLE_PATTERN}|memo|read chapter`, "i").test(rawTitle);
        if (due && actionable) {
          const isExamLike = new RegExp(EXAM_TITLE_PATTERN, "i").test(rawTitle);
          const key = `${isExamLike ? "exam" : "task"}-${rawTitle.toLowerCase()}-${due.dueDate}`;
          if (!candidates.some((candidate) => `${candidate.kind}-${candidate.title.toLowerCase()}-${(candidate.payload as any).dueDate || ""}` === key)) {
            if (isExamLike) {
              const exam: ExamItem = {
                id: id("e"),
                classId,
                title: rawTitle,
                dueOffset: due.offset,
                dueDate: due.dueDate,
                time: clause.match(/\b\d{1,2}:\d{2}\s?(?:AM|PM)\b/i)?.[0]?.toUpperCase() || "9:00 AM",
                room: clause.match(/\b(?:Room|Hall|Building|Online|Lab|Richards|Science|Business)\s?[A-Za-z0-9 ]{2,24}/i)?.[0] || "Room TBD",
                topics: ["Core concepts", "Practice problems", "Lecture notes"],
              };
              candidates.push({ id: id("ic"), kind: "exam", title: exam.title, meta: `${exam.dueDate} · ${exam.time} · ${exam.room}`, classId, confidence: exam.room === "Room TBD" ? 0.72 : 0.88, payload: exam, approved: true });
            } else {
              const task: TaskItem = {
                id: id("t"),
                title: rawTitle,
                classId,
                type: inferType(rawTitle),
                dueOffset: due.offset,
                dueDate: due.dueDate,
                time: clause.match(/\b\d{1,2}:\d{2}\s?(?:AM|PM)\b/i)?.[0]?.toUpperCase() || "11:59 PM",
                estimateMinutes: estimateMinutes(rawTitle),
                done: false,
                urgent: due.offset <= 2,
                source: "AI syllabus import",
                subtasks: [{ title: "Confirm requirements", done: false }, { title: "Complete first pass", done: false }],
              };
              candidates.push({ id: id("ic"), kind: "task", title: task.title, meta: `${task.type} · due ${task.dueDate} · ${task.time}`, classId, confidence: rawTitle.length > 8 ? 0.84 : 0.66, payload: task, approved: true });
            }
            return;
          }
        }
      }
      const dueMatch = clause.match(new RegExp(`(.{4,100}?)(?:\\s+due\\s+|\\s+deadline\\s+|\\s+by\\s+)(${datePattern})`, "i"));
      const looseDatePattern = String.raw`\d{4}-\d{1,2}-\d{1,2}|[A-Za-z]+\.?\s+\d{1,2}|\d{1,2}\s+[A-Za-z]+\.?|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?|today|tomorrow|next\s+\w+`;
      const simpleDueMatch = dueMatch || clause.match(new RegExp(`(.{3,100}?)(?:\\s+is)?\\s+due\\s+(${looseDatePattern})`, "i"));
      const datePrefix = clause.match(new RegExp(`^\\s*(?:week\\s+\\d+\\s+)?(${datePattern})(?:\\s*[-:|]\\s*|\\s+)`, "i"));
      const datePrefixTitle = datePrefix ? titleFromDatePrefix(clause, datePrefix[1]) : "";
      const prefixLooksActionable = new RegExp(`due|${ACTIONABLE_TITLE_PATTERN}|${EXAM_TITLE_PATTERN}|memo|read chapter`, "i").test(datePrefixTitle);
      const keywordDateMatch = clause.match(new RegExp(`(.{0,100}?(?:${ACTIONABLE_TITLE_PATTERN}|${EXAM_TITLE_PATTERN})[^.;,|]*?)\\s*(?:[:\\-]|\\s+)?\\s*(${datePattern})\\b`, "i"));
      if (simpleDueMatch) {
        const due = dueFromDatePhrase(simpleDueMatch[2], now);
        const title = cleanImportedTitle(simpleDueMatch[1].replace(/\b(?:meets?|with|office hours?).*$/i, ""));
        if (due) {
          const task: TaskItem = {
            id: id("t"),
            title: title || "Imported assignment",
            classId,
            type: inferType(title),
            dueOffset: due.offset,
            dueDate: due.dueDate,
            time: clause.toLowerCase().includes("midnight") ? "11:59 PM" : clause.match(/\b\d{1,2}:\d{2}\s?(?:AM|PM)\b/i)?.[0]?.toUpperCase() || "11:59 PM",
            estimateMinutes: estimateMinutes(title),
            done: false,
            urgent: due.offset <= 2,
            source: "AI syllabus import",
            subtasks: [
              { title: "Read requirements", done: false },
              { title: "Draft or solve first pass", done: false },
              { title: "Final check before submit", done: false },
            ],
          };
          candidates.push({
            id: id("ic"),
            kind: "task",
            title: task.title,
            meta: `${task.type} · due ${task.dueDate} · ${task.time}`,
            classId,
            confidence: clause.length > 18 ? 0.9 : 0.68,
            payload: task,
            approved: true,
          });
        }
      } else if (keywordDateMatch && !datePrefix && !/(spring break|no class|holiday|office hours|grading)/i.test(clause)) {
        const title = cleanImportedTitle(keywordDateMatch[1]);
        const due = dueFromDatePhrase(keywordDateMatch[2], now);
        if (due && new RegExp(EXAM_TITLE_PATTERN, "i").test(title)) {
          const exam: ExamItem = {
            id: id("e"),
            classId,
            title: title || "Imported exam",
            dueOffset: due.offset,
            dueDate: due.dueDate,
            time: clause.match(/\b\d{1,2}:\d{2}\s?(?:AM|PM)\b/i)?.[0]?.toUpperCase() || "9:00 AM",
            room: clause.match(/\b(?:Room|Hall|Building|Online|Lab|Richards|Science|Business)\s?[A-Za-z0-9 ]{2,24}/i)?.[0] || "Room TBD",
            topics: ["Core concepts", "Practice problems", "Lecture notes"],
          };
          candidates.push({
            id: id("ic"),
            kind: "exam",
            title: exam.title,
            meta: `${exam.dueDate} · ${exam.time} · ${exam.room}`,
            classId,
            confidence: exam.room === "Room TBD" ? 0.72 : 0.88,
            payload: exam,
            approved: true,
          });
        } else if (due) {
          const task: TaskItem = {
            id: id("t"),
            title: title || "Imported assignment",
            classId,
            type: inferType(title),
            dueOffset: due.offset,
            dueDate: due.dueDate,
            time: clause.match(/\b\d{1,2}:\d{2}\s?(?:AM|PM)\b/i)?.[0]?.toUpperCase() || "11:59 PM",
            estimateMinutes: estimateMinutes(title),
            done: false,
            urgent: due.offset <= 2,
            source: "AI syllabus import",
            subtasks: [{ title: "Confirm requirements", done: false }, { title: "Complete first pass", done: false }],
          };
          candidates.push({
            id: id("ic"),
            kind: "task",
            title: task.title,
            meta: `${task.type} · due ${task.dueDate} · ${task.time}`,
            classId,
            confidence: title.length > 8 ? 0.82 : 0.64,
            payload: task,
            approved: true,
          });
        }
      } else if (datePrefix && prefixLooksActionable && !/(spring break|no class|holiday|office hours)/i.test(clause)) {
        const due = dueFromDatePhrase(datePrefix[1], now);
        const title = clean(datePrefixTitle.replace(/\b(?:MWF|MW|TR|Tue Thu|Mon Wed Fri|Monday Wednesday Friday|Tuesday Thursday)\b/gi, ""));
        if (due && new RegExp(EXAM_TITLE_PATTERN, "i").test(title)) {
          const exam: ExamItem = {
            id: id("e"),
            classId,
            title: title || "Imported exam",
            dueOffset: due.offset,
            dueDate: due.dueDate,
            time: clause.match(/\b\d{1,2}:\d{2}\s?(?:AM|PM)\b/i)?.[0]?.toUpperCase() || "9:00 AM",
            room: clause.match(/\b(?:Room|Hall|Building|Online|Lab|Richards|Science|Business)\s?[A-Za-z0-9 ]{2,24}/i)?.[0] || "Room TBD",
            topics: ["Core concepts", "Practice problems", "Lecture notes"],
          };
          candidates.push({
            id: id("ic"),
            kind: "exam",
            title: exam.title,
            meta: `${exam.dueDate} · ${exam.time} · ${exam.room}`,
            classId,
            confidence: exam.room === "Room TBD" ? 0.72 : 0.88,
            payload: exam,
            approved: true,
          });
        } else if (due) {
          const task: TaskItem = {
            id: id("t"),
            title: title || "Imported assignment",
            classId,
            type: inferType(title),
            dueOffset: due.offset,
            dueDate: due.dueDate,
            time: clause.match(/\b\d{1,2}:\d{2}\s?(?:AM|PM)\b/i)?.[0]?.toUpperCase() || (clause.toLowerCase().includes("midnight") ? "11:59 PM" : "11:59 PM"),
            estimateMinutes: estimateMinutes(title),
            done: false,
            urgent: due.offset <= 2,
            source: "AI syllabus import",
            subtasks: [{ title: "Confirm requirements", done: false }, { title: "Complete first pass", done: false }],
          };
          candidates.push({
            id: id("ic"),
            kind: "task",
            title: task.title,
            meta: `${task.type} · due ${task.dueDate} · ${task.time}`,
            classId,
            confidence: title.length > 8 ? 0.82 : 0.62,
            payload: task,
            approved: true,
          });
        }
      }

      const examMatch = clause.match(new RegExp(`(.{0,70}?(?:exam|midterm|quiz|test)[^.;,]*?)(?:\\s+on\\s+|:\\s*|\\s+)(${datePattern.replace("|midnight", "")})`, "i"));
      const examHeldMatch = examMatch || clause.match(new RegExp(`(.{0,70}?(?:exam|midterm|quiz|test|final)[^.;,]*?)(?:\\s+(?:will\\s+be\\s+)?(?:held|scheduled|on)\\s+)(${looseDatePattern})`, "i"));
      if (examHeldMatch) {
        const due = dueFromDatePhrase(examHeldMatch[2], now);
        if (due) {
          const exam: ExamItem = {
            id: id("e"),
            classId,
            title: cleanImportedTitle(examHeldMatch[1]) || "Imported exam",
            dueOffset: due.offset,
            dueDate: due.dueDate,
            time: clause.match(/\b\d{1,2}:\d{2}\s?(?:AM|PM)\b/i)?.[0]?.toUpperCase() || "9:00 AM",
            room: clause.match(/\b(?:Room|Hall|Building|Online|Lab)\s?[A-Za-z0-9 ]{2,24}/i)?.[0] || "Room TBD",
            topics: ["Core concepts", "Practice problems", "Lecture notes"],
          };
          candidates.push({
            id: id("ic"),
            kind: "exam",
            title: exam.title,
            meta: `${exam.dueDate} · ${exam.time} · ${exam.room}`,
            classId,
            confidence: exam.room === "Room TBD" ? 0.72 : 0.9,
            payload: exam,
            approved: true,
          });
        }
      }
    });
  });

  const dedupedCandidates = candidates.filter((candidate, index, list) => {
    if (candidate.kind !== "task" && candidate.kind !== "exam") return true;
    const dueDate = (candidate.payload as any).dueDate || "";
    const key = `${candidate.kind}-${candidate.title.toLowerCase()}-${dueDate}`;
    return list.findIndex((item) => {
      const itemDueDate = (item.payload as any).dueDate || "";
      return `${item.kind}-${item.title.toLowerCase()}-${itemDueDate}` === key;
    }) === index;
  });
  candidates.splice(0, candidates.length, ...dedupedCandidates);

  if (!candidates.some((c) => c.kind === "task")) {
    const fallback: TaskItem = {
      id: id("t"),
      title: "Review imported syllabus",
      classId: classes[0]?.id || "bio",
      type: "Review",
      dueOffset: 1,
      dueDate: isoFromOffset(1),
      time: "7:00 PM",
      estimateMinutes: 45,
      done: false,
      urgent: true,
      source: "AI syllabus import",
      subtasks: [{ title: "Confirm dates", done: false }, { title: "Add missing assignments", done: false }],
    };
    candidates.push({ id: id("ic"), kind: "task", title: fallback.title, meta: "Safety task · due tomorrow", classId: fallback.classId, confidence: 0.61, payload: fallback, approved: true });
  }

  return {
    id: id("imp"),
    sourceName: "Pasted syllabus",
    sourceText,
    createdAt: new Date().toISOString(),
    status: "review",
    candidates,
  };
}

export function analyzeNotes(sourceText: string, data: AppData): ImportBatch {
  const normalizedSourceText = normalizeGlobalAcademicText(sourceText);
  const words = normalizedSourceText.split(/\s+/).filter(Boolean);
  if (!words.length) {
    return {
      id: id("imp"),
      sourceName: "Pasted notes",
      sourceText,
      createdAt: new Date().toISOString(),
      status: "review",
      candidates: [],
    };
  }
  let scannedNotes: ReturnType<typeof scanStudyNoteText> | null = null;
  try {
    scannedNotes = scanStudyNoteText(normalizedSourceText, "Pasted notes");
  } catch {
    scannedNotes = null;
  }
  const scannedIdeas = scannedNotes?.keyIdeas.map((idea) => clean(idea)).filter((idea) => idea.length >= 4) || [];
  const scannedTaskTitles = uniqueCleanStrings(scannedNotes?.taskCandidates.map((task) => task.title) || [], 3);
  const scannedTask = scannedNotes?.taskCandidates.find((task) => task.title.trim().length);
  const terms = Array.from(
    new Set(
      [
        ...scannedIdeas,
        ...(normalizedSourceText
          .match(/\b[A-Z][a-zA-Z]{4,}\b/g)
          ?.filter((w) => !["Today", "Notes", "Lecture", "Chapter"].includes(w)) || []),
        ...words.filter((word) => /^\p{L}[\p{L}-]{4,}$/u.test(word) && !/(today|notes|lecture|chapter|review|exam|assignment|confusing)/i.test(word)),
      ].map((term) => clean(term).slice(0, 60)).filter(Boolean).slice(0, 10)
    )
  );
  if (!terms.length) terms.push("Concept", "Evidence", "Practice");
  const firstClass = data.classes.find((c) => normalizedSourceText.toLowerCase().includes(c.code.toLowerCase().split(" ")[0])) || data.classes[0] || fallbackClass();
  const sentences = normalizedSourceText.split(/[.!?]+/).map(clean).filter((s) => s.length > 20);
  const summary = scannedNotes?.summary
    ? clean(scannedNotes.summary)
    : sentences.slice(0, 2).join(". ") || `These notes cover ${terms.slice(0, 3).join(", ")} and need a short active-recall review.`;
  const scannedTitle = scannedNotes?.title && !/^pasted notes$/i.test(scannedNotes.title) ? clean(scannedNotes.title) : "";
  const initialSuggestedTasks = scannedTaskTitles.length
    ? scannedTaskTitles
    : [`Make flashcards for ${terms.slice(0, 3).join(", ")}`, `Self-quiz ${firstClass.code} for 15 minutes`];
  const note: NoteItem = {
    id: id("n"),
    classId: firstClass.id,
    title: scannedTitle || `${terms[0] || firstClass.code} Study Notes`,
    createdAt: new Date().toISOString(),
    summary,
    terms,
    suggestedTasks: initialSuggestedTasks,
    examId: data.exams.find((e) => e.classId === firstClass.id)?.id,
    pages: Math.max(1, Math.ceil(words.length / 180)),
    sourceText,
  };
  const insight = parseNoteInsights(note, data);
  note.terms = insight.concepts.slice(0, 8);
  note.suggestedTasks = uniqueCleanStrings([
    ...scannedTaskTitles,
    `Make flashcards for ${insight.concepts.slice(0, 3).join(", ") || note.title}`,
    `Self-quiz ${firstClass.code} for 15 minutes`,
    insight.weakAreas[0] ? `Review weak area: ${insight.weakAreas[0].slice(0, 48)}` : `Review ${firstClass.code} before next class`,
  ].filter(Boolean), 4);
  const noteConfidence = words.length > 20 ? 0.91 : words.length >= 4 ? 0.66 : 0.42;
  const noteCandidate: ImportCandidate = {
    id: id("ic"),
    kind: "note",
    title: note.title,
    meta: `${firstClass.code} · ${note.terms.length} terms · ${note.pages} page`,
    classId: firstClass.id,
    confidence: noteConfidence,
    payload: note,
    approved: noteConfidence >= 0.55,
  };
  const suggestedDueDate = scannedTask?.dueDate || isoFromOffset(1);
  const suggestedTime = displayTimeFromClock(scannedTask?.dueTime) || "7:00 PM";
  const suggestedTitle = note.suggestedTasks[0];
  const reviewTask: ImportCandidate = {
    id: id("ic"),
    kind: "task",
    title: suggestedTitle,
    meta: `${firstClass.code} · ${scannedTask?.dueDate ? "from notes" : "active recall"} · ${scannedTask?.dueDate || "tomorrow"}`,
    classId: firstClass.id,
    confidence: scannedTask ? 0.88 : words.length >= 8 ? 0.84 : 0.52,
    approved: words.length >= 8,
    payload: {
      id: id("t"),
      title: suggestedTitle,
      classId: firstClass.id,
      type: "Review",
      dueOffset: offsetFromIsoDay(suggestedDueDate),
      dueDate: suggestedDueDate,
      time: suggestedTime,
      estimateMinutes: 30,
      done: false,
      urgent: true,
      source: scannedTask ? "Notes → scanned action" : "Notes → suggested",
      subtasks: [],
    },
  };
  return {
    id: id("imp"),
    sourceName: "Pasted notes",
    sourceText,
    createdAt: new Date().toISOString(),
    status: "review",
    candidates: words.length >= 4 ? [noteCandidate, reviewTask] : [noteCandidate],
  };
}

export function buildStudyPlan(data: AppData): StudyBlock[] {
  return buildSchedulePlan(data).blocks;
}

export function deadlineInsight(data: AppData, now = new Date()) {
  const snapshot = buildSemesterSnapshot(data);
  const due = data.tasks.filter((task) => !task.done && task.dueDate === snapshot.todayKey).length;
  const focus = snapshot.schedulePlan.blocks.find((block) => !block.completed);
  const nearest = data.tasks.filter((task) => !task.done).slice().sort((a, b) => a.dueOffset - b.dueOffset)[0];
  const nextClass = data.classes[0];
  const day = dayNames[now.getDay()];
  return {
    headline: `${due || 1} priority move${due === 1 ? "" : "s"} for ${day}`,
    body: due
      ? `Start ${focus?.title || nearest?.title || "the closest deadline"}.`
      : focus ? `Use ${focus.time} for ${focus.title}.` : nextClass ? `${nextClass.code} next.` : "Add a scan.",
    classId: focus?.classId || nearest?.classId || nextClass?.id || data.classes[0]?.id,
  };
}
