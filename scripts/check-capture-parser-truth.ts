import {
  buildTodayPlan,
  getWidgetData
} from "../src/logic/planner";
import { StudyPlannerBrain } from "../src/logic/studyPlannerBrain";
import type { Assignment, Course, ParsedImport, ParsedItem, Semester, UserSettings, WidgetPreset } from "../src/models";
import {
  createParsedImportFromCameraAsset,
  createParsedImportFromDocumentAsset,
  createParsedImportFromTypedText,
  isSupportedDocumentAsset,
  isValidParsedImportStatusTransition,
  normalizeParserError,
  parseCapturedSource,
  retryParsedImport,
  sourceForParsedImport,
  validateDocumentAsset,
  buildDraftFromParsedImport
} from "../src/services/parserContract";
import { parseSyllabusText } from "../src/services/syllabusLocalParser";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
  const map = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) map.set(item.id, item);
  return Array.from(map.values());
}

const now = new Date("2026-05-27T12:00:00");
const semester: Semester = {
  id: "fall-2026",
  name: "Fall 2026",
  startDate: "2026-08-24",
  endDate: "2026-12-11"
};
const courses: Course[] = [
  {
    id: "bio-101",
    code: "BIO 101",
    name: "Biology",
    color: "#2F80ED",
    meetings: [],
    gradeCategories: []
  }
];
const existingAssignment: Assignment = {
  id: "existing-lab-report",
  courseId: "bio-101",
  title: "Lab report",
  kind: "assignment",
  type: "assignment",
  dueAt: "2026-09-12T17:00:00",
  tags: ["manual"],
  priority: "medium",
  estimatedMinutes: 60,
  status: "not_started",
  source: "manual",
  progress: 0
};
const typedText = `
BIO 101 - Biology
Fall 2026
Assignments 40%
Lab report due September 12, 2026 at 5pm
Final exam due December 10, 2026 at 9am
Poster project deadline TBD
`;

async function main() {
  const typedImport = createParsedImportFromTypedText(typedText, "BIO 101 pasted syllabus", now);
  assert(typedImport.status === "queued", "typed import should start queued");
  assert(typedImport.sourceText?.includes("Lab report"), "typed import should preserve source text for retry");

  const parsed = await parseCapturedSource(
    typedImport,
    sourceForParsedImport(typedImport)!,
    {
      parseSyllabusSource: async (source) => parseSyllabusText(source.text || "", source.name || "typed"),
      existingWork: [existingAssignment],
      existingParsedItems: [],
      now
    }
  );

  assert(parsed.parsedImport.status === "parsed", "successful parse should persist parsed status");
  assert(parsed.parsedItems.length >= 3, "typed import should create parsed items");
  assert(parsed.parsedItems.some((item) => item.title.includes("Lab report")), "typed import should create parsed assignment");
  assert(parsed.parsedItems.some((item) => item.duplicateCandidateId === existingAssignment.id), "duplicate parsed item should be flagged");
  const missingDate = parsed.parsedItems.find((item) => item.title.toLowerCase().includes("poster project"));
  assert(missingDate?.needsReview && !missingDate.dueAt, "missing-date parsed item should be flagged without inventing a date");

  const reviewDraft = buildDraftFromParsedImport(parsed.parsedImport, parsed.parsedItems);
  assert(reviewDraft.sourceImportId === typedImport.id, "recent import should reopen the correct source import");
  assert(reviewDraft.assignments.some((assignment) => assignment.needsReview), "recent review should preserve parser review flags");

  const reviewedItems: ParsedItem[] = parsed.parsedItems.map((item) => ({
    ...item,
    needsReview: false,
    duplicateCandidateId: undefined,
    dueAt: item.dueAt || "2026-10-01T23:59:00",
    reviewStatus: "accepted"
  }));
  const firstAdd = StudyPlannerBrain.convertParsedItemsToAssignments(reviewedItems, courses, now);
  const once = mergeById([existingAssignment], firstAdd);
  const twice = mergeById(once, firstAdd);
  assert(once.length === twice.length, "repeated Add All should not duplicate assignment IDs");

  const widgetPreset: WidgetPreset = {
    id: "capture-widget",
    name: "Next",
    type: "due_next",
    size: "small",
    palette: "ocean",
    background: "glass",
    font: "SF Pro",
    layout: "compact",
    iconKey: "calendar",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
  const widgetData = getWidgetData(widgetPreset, firstAdd, courses, now);
  assert(widgetData.value !== "Clear", "parser results should update widget selectors");
  const todayPlan = buildTodayPlan(firstAdd, semester, now);
  assert(todayPlan.openCount >= 1, "parser results should update Today/Plan selectors");

  const retryable = retryParsedImport({ ...parsed.parsedImport, status: "failed", errorMessage: "Network timeout" });
  assert(retryable.status === "retrying", "failed parse should have retrying state");
  assert(sourceForParsedImport(retryable)?.kind === "typed", "retry should preserve typed source");

  const cameraImport = createParsedImportFromCameraAsset({
    uri: "file:///tmp/syllabus.jpg",
    name: "syllabus.jpg",
    mimeType: "image/jpeg"
  }, now);
  assert(cameraImport.sourceType === "photo" && sourceForParsedImport(cameraImport)?.kind === "photo", "camera asset should create a photo parsed import");
  const documentImport = createParsedImportFromDocumentAsset({
    uri: "file:///tmp/syllabus.pdf",
    name: "syllabus.pdf",
    mimeType: "application/pdf",
    size: 1024
  }, now);
  assert(documentImport.sourceType === "pdf" && sourceForParsedImport(documentImport)?.kind === "pdf", "document asset should create a PDF parsed import");

  assert(isSupportedDocumentAsset({ name: "worksheet.png", mimeType: "image/png" }), "image upload should be supported when OCR is configured");
  assert(!isSupportedDocumentAsset({ name: "archive.zip", mimeType: "application/zip" }), "unsupported files should be rejected");
  assertThrows(() => validateDocumentAsset({ name: "archive.zip", mimeType: "application/zip" }), "unsupported file should return useful error");
  assertThrows(() => validateDocumentAsset({ name: "huge.pdf", mimeType: "application/pdf", size: 25 * 1024 * 1024 }), "large file should return useful error");

  assert(isValidParsedImportStatusTransition("picking", "idle"), "cancel from picker should return cleanly");
  assert(isValidParsedImportStatusTransition("failed", "retrying"), "failed import should be retryable");
  assert(isValidParsedImportStatusTransition("permission_denied" as ParsedImport["status"], "idle" as ParsedImport["status"]) === false, "permission_denied is UI-only, not a persisted parser status");
  assert(normalizeParserError(new Error("OCR is not configured")).includes("OCR"), "parser error should preserve honest OCR message");

  const settings: UserSettings = {
    studentName: "Taylor",
    selectedTheme: "ocean",
    customPalette: [],
    appTheme: "campus",
    defaultWidgetStyle: "glass",
    onboardingComplete: true,
    notificationDefault: "2 hours before due",
    focusDefaultMinutes: 25,
    syncEnabled: true,
    privacyMode: false,
    emojiAccentEnabled: true
  };
  const brain = StudyPlannerBrain.buildTodayBrain({
    assignments: firstAdd,
    courses,
    semester,
    notes: [],
    focusSessions: [],
    widgetPresets: [widgetPreset],
    settings,
    now
  });
  assert(brain.openCount >= 1 && brain.recommendedFocusDuration > 0 && Boolean(brain.recommendedWidgetPreset), "parser results should feed StudyPlannerBrain loop");

  console.log("capture parser truth fixtures passed");
}

function assertThrows(fn: () => void, message: string) {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  assert(threw, message);
}

void main();
