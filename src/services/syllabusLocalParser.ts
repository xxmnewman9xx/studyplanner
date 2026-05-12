import { Assignment, Course, GradeCategory, SyllabusParseResult } from "../models";
import { normalizeAssignment } from "../logic/assignmentModel";

type InferredSemester = {
  name?: string;
  startDate?: string;
  endDate?: string;
};

const assignmentKeywords =
  /\b(assignment|homework|hw|exam|midterm|final|quiz|test|paper|project|presentation|lab|essay|due)\b/i;
const examKeywords = /\b(exam|midterm|final|quiz|test)\b/i;
const assignmentReviewLimit = 75;
const datePattern =
  /\b(?:\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[/. -]\d{1,2}(?:[/. -]\d{2,4})?|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)\b/i;

export function parseSyllabusText(rawText: string, sourceName: string): SyllabusParseResult {
  const text = normalizeSyllabusText(rawText);
  if (text.length < 20) {
    throw new Error(
      "The selected syllabus did not include readable text. Choose a text-based PDF or plain-text syllabus and try again."
    );
  }

  const lines = buildLines(text);
  const inferredYear = inferYear(text);
  const semester = inferSemester(text, inferredYear);
  const course = inferCourse(lines, sourceName);
  const inferredAssignments = inferAssignments(lines, course, inferredYear);
  const assignments = inferredAssignments.slice(0, assignmentReviewLimit);
  const gradeCategories = inferGradeCategories(lines, course.id);
  const courseWithGrades = {
    ...course,
    gradeCategories
  };

  return {
    sourceName,
    semesterName: semester.name,
    semesterStartDate: semester.startDate,
    semesterEndDate: semester.endDate,
    courses: [courseWithGrades],
    assignments,
    gradeItems: [],
    findings: [
      {
        id: "review-before-apply",
        severity: "needs_review",
        message: "Review detected courses and dates before applying them."
      },
      ...(assignments.length === 0
        ? [
            {
              id: "no-deadlines-found",
              severity: "needs_review" as const,
              message: "No dated deadlines were found. You can still apply the course and add deadlines manually."
            }
          ]
        : []),
      ...(inferredAssignments.length > assignmentReviewLimit
        ? [
            {
              id: "deadline-review-limit",
              severity: "needs_review" as const,
              message: `More than ${assignmentReviewLimit} dated items were found. The first ${assignmentReviewLimit} are ready to check; add any extras manually.`
            }
          ]
        : [])
    ]
  };
}

function normalizeSyllabusText(rawText: string) {
  return addDeadlineBreaks(rawText)
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\u0000/g, "")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function addDeadlineBreaks(text: string) {
  const nextDeadlineLookahead =
    "(?=[A-Z][^\\n]{0,80}\\b(?:due|assignment|homework|hw|exam|midterm|final|quiz|test|paper|project|presentation|lab|essay)\\b)";

  return text
    .replace(new RegExp(`(\\b20[2-4]\\d\\b)\\s+${nextDeadlineLookahead}`, "gi"), "$1\n")
    .replace(
      new RegExp(`(\\b\\d{1,2}[/. -]\\d{1,2}(?:[/. -]\\d{2,4})?)\\s+${nextDeadlineLookahead}`, "gi"),
      "$1\n"
    )
    .replace(
      new RegExp(
        `((?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+20[2-4]\\d)?)\\s+${nextDeadlineLookahead}`,
        "gi"
      ),
      "$1\n"
    );
}

function buildLines(text: string) {
  const rawLines = text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 1 && !/^[_.-]+$/.test(line));

  const combined = rawLines.flatMap((line, index) => {
    const next = rawLines[index + 1];
    if (!next || line.length + next.length > 150) return [line];
    const lineHasDate = datePattern.test(line);
    const lineHasAssignment = assignmentKeywords.test(line);
    const nextHasDate = datePattern.test(next);
    const nextHasAssignment = assignmentKeywords.test(next);

    if ((lineHasDate && !lineHasAssignment && nextHasAssignment) || (lineHasAssignment && !lineHasDate && nextHasDate)) {
      return [line, `${line} ${next}`];
    }
    return [line];
  });

  return Array.from(new Set(combined));
}

function inferYear(text: string) {
  const year = text.match(/\b20[2-4]\d\b/)?.[0];
  return year ? Number.parseInt(year, 10) : new Date().getFullYear();
}

function inferSemester(text: string, year: number): InferredSemester {
  const seasonMatch = text.match(/\b(fall|spring|summer|winter)\s+20[2-4]\d\b/i);
  if (!seasonMatch) {
    return {};
  }

  const season = capitalize(seasonMatch[1]);
  const semesterYear = Number.parseInt(seasonMatch[0].match(/20[2-4]\d/)?.[0] || String(year), 10);
  const datesBySeason: Record<string, { startDate: string; endDate: string }> = {
    Spring: { startDate: `${semesterYear}-01-12`, endDate: `${semesterYear}-05-08` },
    Summer: { startDate: `${semesterYear}-05-18`, endDate: `${semesterYear}-08-07` },
    Fall: { startDate: `${semesterYear}-08-24`, endDate: `${semesterYear}-12-11` },
    Winter: { startDate: `${semesterYear}-01-02`, endDate: `${semesterYear}-01-23` }
  };

  return {
    name: `${season} ${semesterYear}`,
    ...datesBySeason[season]
  };
}

function inferCourse(lines: string[], sourceName: string): Course {
  const explicitCourse = findCourseFromLines(lines);
  const fromName = findCourseFromName(sourceName);
  const code = explicitCourse?.code || fromName?.code || "SYL 101";
  const name = explicitCourse?.name || fromName?.name || titleFromSourceName(sourceName);

  return {
    id: slugify(code) || "imported-syllabus",
    code,
    name,
    color: "#22577A",
    meetings: inferMeetings(lines),
    gradeCategories: []
  };
}

function findCourseFromLines(lines: string[]) {
  const patterns = [
    /\b(?:course|class)\s*(?:number|code|title)?\s*:?\s*([A-Z]{2,6}\s*[- ]?\s*\d{2,4}[A-Z]?)\s*[-:–]\s*(.{3,90})/i,
    /\b([A-Z]{2,6}\s*[- ]?\s*\d{2,4}[A-Z]?)\b\s*[-:–]\s*(.{3,90})/,
    /\b(?:course|class)\s*(?:number|code)?\s*:?\s*([A-Z]{2,6}\s*[- ]?\s*\d{2,4}[A-Z]?)/i
  ];

  for (const line of lines.slice(0, 40)) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match?.[1] && isCourseLikeCode(match[1])) {
        return {
          code: normalizeCourseCode(match[1]),
          name: cleanupTitle(match[2] || line.replace(match[1], ""))
        };
      }
    }
  }

  return undefined;
}

function findCourseFromName(sourceName: string) {
  const normalized = sourceName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  const match = normalized.match(/\b([A-Z]{2,6}\s*\d{2,4}[A-Z]?)\b/i);
  if (!match?.[1] || !isCourseLikeCode(match[1])) return undefined;

  return {
    code: normalizeCourseCode(match[1]),
    name: cleanupTitle(normalized.replace(match[1], "")) || "Imported Syllabus"
  };
}

function inferMeetings(lines: string[]) {
  const dayPattern = /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:day)?s?\b/gi;
  const timePattern = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;

  for (const line of lines) {
    const time = line.match(timePattern);
    const days = Array.from(line.matchAll(dayPattern))
      .map((match) => match[1])
      .filter((day): day is string => Boolean(day))
      .map((day) => normalizeDay(day));
    if (!time || days.length === 0) continue;

    return days.map((day) => ({
      id: `${day.toLowerCase()}-${toMinutes(time[1], time[2], time[3])}`,
      day,
      startTime: toTimeString(time[1], time[2], time[3]),
      endTime: toTimeString(time[4], time[5], time[6]),
      location: inferLocation(line)
    }));
  }

  return [];
}

function inferGradeCategories(lines: string[], courseId: string): GradeCategory[] {
  const categories: GradeCategory[] = [];
  const categoryPattern =
    /\b(assignments?|homework|exams?|midterms?|final|quizzes|tests?|labs?|projects?|papers?|participation|attendance)\b[^0-9%]{0,30}(\d{1,3})\s*%/i;

  for (const line of lines) {
    const match = line.match(categoryPattern);
    const weight = Number.parseInt(match?.[2] || "", 10);
    if (!match?.[1] || !Number.isFinite(weight) || weight <= 0 || weight > 100) continue;

    const name = normalizeCategoryName(match[1]);
    if (categories.some((category) => category.name === name)) continue;

    categories.push({
      id: `${courseId}-${slugify(name)}`,
      name,
      weight
    });
  }

  return categories;
}

function inferAssignments(lines: string[], course: Course, inferredYear: number): Assignment[] {
  const assignments: Assignment[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const date = line.match(datePattern)?.[0];
    if (!date || !assignmentKeywords.test(line)) continue;

    const dueDate = parseDateToken(date, inferredYear);
    if (!dueDate) continue;

    const title = cleanupTitle(
      line
        .replace(date, "")
        .replace(/\b(due|date|deadline)\b\s*:?\s*/gi, "")
        .replace(/\s*[-–|]\s*$/, "")
    );
    if (!title || title.length < 3) continue;

    const key = `${title.toLowerCase()}-${dueDate}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const kind = examKeywords.test(title) ? "exam" : "assignment";
    assignments.push(
      normalizeAssignment(
        {
          id: `${course.id}-${slugify(title)}-${dueDate}`,
          courseId: course.id,
          courseName: course.name,
          title,
          type: kind,
          kind,
          dueAt: `${dueDate}T${kind === "exam" ? "09:00" : "23:59"}:00`,
          sourceText: line,
          confidence: 0.74,
          reviewStatus: "needsReview",
          completionStatus: "open",
          reminderPreset: kind === "exam" ? "week_before" : "day_before",
          createdAt: new Date(`${dueDate}T12:00:00`).toISOString(),
          updatedAt: new Date(`${dueDate}T12:00:00`).toISOString(),
          tags: kind === "exam" ? ["exam", "study"] : ["syllabus"],
          priority: kind === "exam" ? "high" : "medium",
          estimatedMinutes: kind === "exam" ? 180 : 60,
          status: "not_started",
          source: "syllabus"
        },
        [course]
      )
    );
  }

  return assignments;
}

function parseDateToken(token: string, inferredYear: number) {
  const normalized = token.replace(/(\d)(st|nd|rd|th)\b/gi, "$1").replace(/\s+/g, " ").trim();
  const iso = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return formatDateParts(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const numeric = normalized.match(/^(\d{1,2})[/. -](\d{1,2})(?:[/. -](\d{2,4}))?$/);
  if (numeric) {
    const year = normalizeYear(numeric[3], inferredYear);
    return formatDateParts(year, Number(numeric[1]), Number(numeric[2]));
  }

  const parsed = new Date(`${normalized}${/\b\d{4}\b/.test(normalized) ? "" : `, ${inferredYear}`}`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return formatDateParts(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
}

function normalizeYear(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return parsed < 100 ? 2000 + parsed : parsed;
}

function formatDateParts(year: number, month: number, day: number) {
  if (!year || !month || !day || month > 12 || day > 31) return undefined;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeCourseCode(value: string) {
  return value.replace(/\s*-\s*/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
}

function isCourseLikeCode(value: string) {
  return !/^(fall|spring|summer|winter)\b/i.test(value.trim());
}

function normalizeCategoryName(value: string) {
  const lower = value.toLowerCase();
  if (/assignments?|homework|hw/.test(lower)) return "Assignments";
  if (/exams?|midterms?|final|tests?/.test(lower)) return "Exams";
  if (/quizzes/.test(lower)) return "Quizzes";
  if (/labs?/.test(lower)) return "Labs";
  if (/projects?/.test(lower)) return "Projects";
  if (/papers?/.test(lower)) return "Papers";
  if (/participation/.test(lower)) return "Participation";
  if (/attendance/.test(lower)) return "Attendance";
  return capitalize(value.replace(/s$/i, ""));
}

function titleFromSourceName(sourceName: string) {
  return cleanupTitle(sourceName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ")) || "Imported Syllabus";
}

function cleanupTitle(value: string) {
  return value
    .replace(/\bsyllabus\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^[-:–| ]+|[-:–| ]+$/g, "")
    .trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function capitalize(value: string | undefined) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function normalizeDay(value: string) {
  return capitalize(value.slice(0, 3)) as "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
}

function toMinutes(hour: string | undefined, minute: string | undefined, meridiem: string | undefined) {
  let parsedHour = Number.parseInt(hour || "0", 10);
  const parsedMinute = Number.parseInt(minute || "0", 10);
  const lowerMeridiem = meridiem?.toLowerCase();
  if (lowerMeridiem === "pm" && parsedHour < 12) parsedHour += 12;
  if (lowerMeridiem === "am" && parsedHour === 12) parsedHour = 0;
  return parsedHour * 60 + parsedMinute;
}

function toTimeString(hour: string | undefined, minute: string | undefined, meridiem: string | undefined) {
  const totalMinutes = toMinutes(hour, minute, meridiem);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

function inferLocation(line: string) {
  const location = line.match(/\b(?:room|building|hall|center|centre)\s+[-A-Z0-9 ]{2,24}\b/i)?.[0];
  return location ? cleanupTitle(location) : "";
}
