import {
  Assignment,
  Course,
  ParsedImport,
  ParsedItem,
  SyllabusImportSource,
  SyllabusParseResult
} from "../models";
import { isValidDeadline } from "../logic/planner";

export type CaptureSourceAsset = {
  uri?: string;
  name?: string;
  mimeType?: string;
  size?: number;
  text?: string;
};

export type ParseCapturedSourceOptions = {
  parseSyllabusSource: (source: SyllabusImportSource) => Promise<SyllabusParseResult>;
  existingWork?: Assignment[];
  existingParsedItems?: ParsedItem[];
  now?: Date;
};

export type ParsedDraftLabels = {
  studyHall?: string;
  spring2026?: string;
  coursework?: string;
  tests?: string;
  participation?: string;
  reviewInstructions?: string;
  blockStudyTime?: string;
  recentImportHandled?: string;
  parsedItemsFromSource?: string;
  mayAlreadyBeInPlanner?: string;
  itemNeedsDueDate?: string;
  itemNeedsReview?: string;
};

export const maxCaptureSourceBytes = 20 * 1024 * 1024;

export function createParsedImportFromCameraAsset(asset: CaptureSourceAsset, now = new Date()): ParsedImport {
  return buildParsedImport({
    title: asset.name || "Camera photo",
    sourceType: "photo",
    sourceUri: asset.uri,
    mimeType: asset.mimeType || "image/jpeg",
    status: "captured",
    now
  });
}

export function createParsedImportFromDocumentAsset(asset: CaptureSourceAsset, now = new Date()): ParsedImport {
  validateDocumentAsset(asset);
  return buildParsedImport({
    title: asset.name || "Uploaded school material",
    sourceType: sourceTypeForAsset(asset),
    sourceUri: asset.uri,
    mimeType: asset.mimeType,
    status: "captured",
    now
  });
}

export function createParsedImportFromTypedText(text: string, name = "Typed school material", now = new Date()): ParsedImport {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Paste syllabus lines, handout text, or homework notes first.");
  }

  return buildParsedImport({
    title: name,
    sourceType: "typed",
    sourceText: trimmed,
    status: "queued",
    now
  });
}

export async function parseCapturedSource(
  parsedImport: ParsedImport,
  source: SyllabusImportSource,
  options: ParseCapturedSourceOptions
) {
  const now = options.now || new Date();
  const parseResult = addCaptureMetadata(
    await options.parseSyllabusSource(source),
    parsedImport,
    now
  );
  const parsedItems = normalizeParsedItems(parseResult, parsedImport, {
    existingAssignments: options.existingWork || [],
    existingParsedItems: options.existingParsedItems || []
  });

  return {
    parsedImport: {
      ...parsedImport,
      status: "parsed" as const,
      itemCount: parsedItems.length,
      errorMessage: undefined,
      updatedAt: now.toISOString()
    },
    parsedItems,
    parseResult
  };
}

export function retryParsedImport(parsedImport: ParsedImport, now = new Date()): ParsedImport {
  return {
    ...parsedImport,
    status: "retrying",
    errorMessage: undefined,
    updatedAt: now.toISOString()
  };
}

export function getParsedImportById(parsedImports: ParsedImport[], parsedImportId: string) {
  return parsedImports.find((item) => item.id === parsedImportId);
}

export function getParsedItemsForImport(parsedItems: ParsedItem[], parsedImportId: string) {
  return parsedItems.filter((item) => item.parsedImportId === parsedImportId);
}

export function normalizeParsedItems(
  parseResult: SyllabusParseResult,
  parsedImport: ParsedImport,
  context: {
    existingAssignments?: Assignment[];
    existingParsedItems?: ParsedItem[];
  } = {}
): ParsedItem[] {
  const courseNamesById = new Map(parseResult.courses.map((course) => [course.id, course.name || course.code]));
  const items = parseResult.assignments.map((assignment) => {
    const courseName = courseNamesById.get(assignment.courseId) || parseResult.courses[0]?.name || "Study Hall";
    const duplicateCandidateId = detectDuplicates(
      assignment,
      courseName,
      context.existingAssignments || [],
      context.existingParsedItems || []
    );
    const missingDate = detectMissingDates(assignment);
    const confidence = estimateConfidence(assignment, missingDate, Boolean(duplicateCandidateId));

    return {
      id: stableParsedItemId(parsedImport.id, assignment.id || assignment.title),
      parsedImportId: parsedImport.id,
      title: assignment.title,
      courseName,
      type: assignment.kind || assignment.type || "assignment",
      dueAt: isValidDeadline(assignment.dueAt) ? assignment.dueAt : undefined,
      confidence,
      needsReview: Boolean(assignment.needsReview || missingDate || duplicateCandidateId || confidence < 0.75),
      duplicateCandidateId: duplicateCandidateId || assignment.duplicateOf,
      rawText: assignment.sourceId || assignment.title
    } satisfies ParsedItem;
  });

  return dedupeParsedItems(items);
}

export function detectMissingDates(assignment: Pick<Assignment, "dueAt">) {
  return !assignment.dueAt || !isValidDeadline(assignment.dueAt);
}

export function detectDuplicates(
  assignment: Assignment,
  courseName: string,
  existingAssignments: Assignment[] = [],
  existingParsedItems: ParsedItem[] = []
) {
  const dueDay = isValidDeadline(assignment.dueAt) ? assignment.dueAt.slice(0, 10) : "";
  const key = duplicateKey(assignment.title, courseName, dueDay);
  const assignmentMatch = existingAssignments.find((existing) => {
    const existingDueDay = isValidDeadline(existing.dueAt) ? existing.dueAt.slice(0, 10) : "";
    return duplicateKey(existing.title, courseName, existingDueDay) === key;
  });
  if (assignmentMatch) return assignmentMatch.id;

  const parsedMatch = existingParsedItems.find((existing) => {
    const existingDueDay = existing.dueAt && isValidDeadline(existing.dueAt) ? existing.dueAt.slice(0, 10) : "";
    return duplicateKey(existing.title, existing.courseName, existingDueDay) === key;
  });
  return parsedMatch?.id;
}

export function estimateConfidence(assignment: Assignment, missingDate = detectMissingDates(assignment), duplicate = false) {
  const base = clampConfidence(assignment.confidence ?? (missingDate ? 0.42 : 0.82));
  const dateAdjusted = missingDate ? Math.min(base, 0.48) : base;
  return duplicate ? Math.min(dateAdjusted, 0.62) : dateAdjusted;
}

export function buildDraftFromParsedImport(
  parsedImport: ParsedImport,
  parsedItems: ParsedItem[],
  labels: ParsedDraftLabels = {}
): SyllabusParseResult {
  const items = parsedItems.filter(
    (item) =>
      item.parsedImportId === parsedImport.id &&
      item.reviewStatus !== "dismissed" &&
      item.reviewStatus !== "accepted" &&
      !item.acceptedAt
  );
  const courseNames = Array.from(new Set(items.map((item) => item.courseName || labels.studyHall || "Study Hall")));
  const courses = courseNames.map((name, index) => buildCourseFromName(name, parsedImport, index, labels));

  if (items.length === 0) {
    return {
      sourceImportId: parsedImport.id,
      sourceType: parsedImport.sourceType,
      sourceName: parsedImport.title,
      courses,
      gradeItems: [],
      assignments: [],
      findings: [
        {
          id: `${parsedImport.id}-empty`,
          severity: "info",
          message: labels.recentImportHandled || "Everything from this import has already been handled."
        }
      ]
    };
  }

  return {
    sourceImportId: parsedImport.id,
    sourceType: parsedImport.sourceType,
    sourceName: parsedImport.title,
    courses,
    gradeItems: [],
    assignments: items.map((item) => {
      const courseName = item.courseName || labels.studyHall || "Study Hall";
      return {
        id: `review-${item.id}`,
        courseId: courseIdForName(courseName),
        title: item.title,
        kind: item.type,
        type: item.type,
        dueAt: item.dueAt || "",
        tags: ["imported", item.type],
        priority: item.needsReview ? "high" : "medium",
        estimatedMinutes: item.type === "exam" ? 120 : item.type === "reading" ? 35 : 55,
        status: "not_started",
        source: parsedImport.sourceType === "typed" ? "typed" : "scan",
        sourceId: parsedImport.id,
        progress: 0,
        checklist: [
          { id: `review-${item.id}-1`, title: labels.reviewInstructions || "Review instructions", done: false },
          { id: `review-${item.id}-2`, title: labels.blockStudyTime || "Block study time", done: false }
        ],
        reminder: { enabled: Boolean(item.dueAt), leadTimeHours: item.type === "exam" ? 72 : 24 },
        needsReview: item.needsReview || !item.dueAt,
        duplicateOf: item.duplicateCandidateId,
        confidence: item.confidence,
        createdAt: parsedImport.createdAt,
        updatedAt: parsedImport.updatedAt || new Date().toISOString()
      } satisfies Assignment;
    }),
    findings: [
      {
        id: `${parsedImport.id}-source`,
        severity: "info",
        message: formatTemplate(labels.parsedItemsFromSource || "{count} parsed items from {source}", {
          count: items.length,
          source: parsedImport.title
        })
      },
      ...items
        .filter((item) => item.needsReview || item.duplicateCandidateId || !item.dueAt)
        .slice(0, 3)
        .map((item, index) => ({
          id: `${item.id}-finding-${index}`,
          severity: "needs_review" as const,
          message: item.duplicateCandidateId
            ? formatTemplate(labels.mayAlreadyBeInPlanner || "{title} may already be in your planner", { title: item.title })
            : !item.dueAt
              ? formatTemplate(labels.itemNeedsDueDate || "{title} needs a due date", { title: item.title })
              : formatTemplate(labels.itemNeedsReview || "{title} needs review", { title: item.title })
        }))
    ]
  };
}

export function sourceForParsedImport(parsedImport: ParsedImport): SyllabusImportSource | null {
  if (parsedImport.sourceType === "typed") {
    return parsedImport.sourceText
      ? { kind: "typed", name: parsedImport.title, text: parsedImport.sourceText }
      : null;
  }
  if (!parsedImport.sourceUri) return null;
  return {
    kind: parsedImport.sourceType === "photo" || parsedImport.sourceType === "scan" ? "photo" : "pdf",
    uri: parsedImport.sourceUri,
    name: parsedImport.title,
    mimeType: parsedImport.mimeType
  };
}

export function normalizeParserError(error: unknown) {
  return error instanceof Error ? error.message : "The import could not be read.";
}

export function validateDocumentAsset(asset: CaptureSourceAsset) {
  if (asset.size && asset.size > maxCaptureSourceBytes) {
    throw new Error("This file is too large for quick import. Choose a file under 20 MB.");
  }
  if (!isSupportedDocumentAsset(asset)) {
    throw new Error("Upload a PDF or text file.");
  }
}

export function isSupportedDocumentAsset(asset: CaptureSourceAsset) {
  const mimeType = asset.mimeType?.toLowerCase() || "";
  const name = asset.name?.toLowerCase() || "";
  return (
    mimeType === "application/pdf" ||
    mimeType === "text/plain" ||
    /\.(pdf|txt|text)$/i.test(name)
  );
}

export function isValidParsedImportStatusTransition(from: ParsedImport["status"], to: ParsedImport["status"]) {
  const allowed: Record<ParsedImport["status"], ParsedImport["status"][]> = {
    idle: ["picking", "captured", "queued", "failed"],
    picking: ["captured", "idle", "failed"],
    captured: ["queued", "parsing", "failed"],
    queued: ["parsing", "failed"],
    parsing: ["parsed", "ready", "failed"],
    parsed: ["reviewed", "applied", "retrying"],
    failed: ["retrying", "picking"],
    retrying: ["parsing", "parsed", "failed"],
    reviewed: ["applied"],
    processing: ["ready", "error", "applied"],
    ready: ["applied", "retrying"],
    error: ["retrying"],
    applied: ["retrying"]
  };
  return allowed[from]?.includes(to) || from === to;
}

function buildParsedImport(input: {
  title: string;
  sourceType: ParsedImport["sourceType"];
  sourceUri?: string;
  sourceText?: string;
  mimeType?: string;
  status: ParsedImport["status"];
  now: Date;
}): ParsedImport {
  const timestamp = input.now.toISOString();
  return {
    id: `import-${input.sourceType}-${input.now.getTime()}-${slugify(input.title)}`,
    title: input.title,
    sourceType: input.sourceType,
    sourceUri: input.sourceUri,
    sourceText: input.sourceText,
    mimeType: input.mimeType,
    status: input.status,
    itemCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function addCaptureMetadata(parseResult: SyllabusParseResult, parsedImport: ParsedImport, now: Date): SyllabusParseResult {
  const missingDateAssignments = buildMissingDateAssignmentsFromFindings(parseResult, parsedImport, now);
  return {
    ...parseResult,
    sourceImportId: parsedImport.id,
    sourceType: parsedImport.sourceType,
    sourceName: parseResult.sourceName || parsedImport.title,
    assignments: [...parseResult.assignments, ...missingDateAssignments]
  };
}

function buildMissingDateAssignmentsFromFindings(
  parseResult: SyllabusParseResult,
  parsedImport: ParsedImport,
  now: Date
): Assignment[] {
  const course = parseResult.courses[0];
  if (!course) return [];
  const existingTitles = new Set(parseResult.assignments.map((assignment) => normalizeForDuplicate(assignment.title)));
  const examples = parseResult.findings
    .filter((finding) => finding.id === "possible-undated-work" || /no clear due date|no dated deadlines/i.test(finding.message))
    .flatMap((finding) => finding.examples || [])
    .filter(Boolean);

  return examples
    .filter((example) => !existingTitles.has(normalizeForDuplicate(example)))
    .slice(0, 4)
    .map((example, index) => {
      const title = cleanupExampleTitle(example);
      return {
        id: `${parsedImport.id}-missing-date-${index}-${slugify(title)}`,
        courseId: course.id,
        title,
        kind: inferKind(title),
        type: inferKind(title),
        dueAt: "",
        tags: ["needs-date", "imported"],
        priority: "high",
        estimatedMinutes: inferKind(title) === "exam" ? 120 : 55,
        status: "not_started",
        source: parsedImport.sourceType === "typed" ? "typed" : "scan",
        sourceId: parsedImport.id,
        progress: 0,
        needsReview: true,
        confidence: 0.38,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      } satisfies Assignment;
    });
}

function sourceTypeForAsset(asset: CaptureSourceAsset): ParsedImport["sourceType"] {
  const mimeType = asset.mimeType?.toLowerCase() || "";
  const name = asset.name?.toLowerCase() || "";
  if (mimeType.startsWith("image/") || /\.(png|jpe?g|heic|heif|webp)$/i.test(name)) return "photo";
  if (mimeType === "application/pdf" || /\.pdf$/i.test(name)) return "pdf";
  return "scan";
}

function stableParsedItemId(parsedImportId: string, value: string) {
  return `${parsedImportId}-${slugify(value) || "item"}`;
}

function dedupeParsedItems(items: ParsedItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${normalizeForDuplicate(item.title)}-${item.courseName}-${item.dueAt || "missing"}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function duplicateKey(title: string, courseName: string, dueDay: string) {
  return `${normalizeForDuplicate(title)}|${normalizeForDuplicate(courseName)}|${dueDay || "missing"}`;
}

function normalizeForDuplicate(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function clampConfidence(value: number) {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

const courseColors = ["#6D5CFF", "#FF4FA8", "#2F80ED", "#20A66B", "#F97316", "#8B5CF6"];

function buildCourseFromName(name: string, parsedImport: ParsedImport, index: number, labels: ParsedDraftLabels): Course {
  const id = courseIdForName(name);
  return {
    id,
    code: initialsForCourse(name),
    name,
    color: courseColors[index % courseColors.length] || "#6D5CFF",
    iconKey: "book",
    emojiKey: index % 2 === 0 ? "study" : "science",
    semester: labels.spring2026 || "Spring 2026",
    createdAt: parsedImport.createdAt,
    updatedAt: parsedImport.updatedAt,
    meetings: [],
    gradeCategories: [
      { id: `${id}-work`, name: labels.coursework || "Coursework", weight: 50 },
      { id: `${id}-tests`, name: labels.tests || "Tests", weight: 30 },
      { id: `${id}-participation`, name: labels.participation || "Participation", weight: 20 }
    ]
  };
}

function courseIdForName(name: string) {
  return `parsed-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "course"}`;
}

function initialsForCourse(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words.slice(0, 2).map((word) => word[0]).join("") : name.slice(0, 3);
  return letters.toUpperCase();
}

function cleanupExampleTitle(value: string) {
  return value
    .replace(/\b(due date|deadline|due)\b\s*:*/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^[-:| ]+|[-:| ]+$/g, "")
    .trim();
}

function inferKind(title: string): Assignment["kind"] {
  if (/\b(exam|midterm|final|quiz|test)\b/i.test(title)) return "exam";
  if (/\b(project|presentation)\b/i.test(title)) return "project";
  if (/\b(reading|chapter)\b/i.test(title)) return "reading";
  if (/\b(worksheet|problem set)\b/i.test(title)) return "worksheet";
  return "assignment";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 44);
}

function formatTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template
  );
}
