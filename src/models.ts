export type NavTab =
  | "today"
  | "import"
  | "plan"
  | "courses"
  | "more"
  | "focus"
  | "grades"
  | "upgrade";

export type Priority = "low" | "medium" | "high";

export type AssignmentStatus = "not_started" | "in_progress" | "done" | "archived";

export type AssignmentKind = "assignment" | "exam" | "project" | "reading" | "worksheet";

export type SourceType = "manual" | "syllabus" | "calendar" | "canvas" | "scan" | "typed";

export type ReviewStatus = "needs_review" | "accepted" | "dismissed";

export type WidgetType =
  | "due_next"
  | "today"
  | "needs_check"
  | "week"
  | "class_focus"
  | "empty"
  | "focus"
  | "streak";

export type WidgetSize = "small" | "medium" | "large" | "lock_round" | "lock_inline" | "lock_rect";

export type WidgetBackground = "solid" | "gradient" | "glass" | "dark";

export type WidgetPalette =
  | "sunset"
  | "ocean"
  | "forest"
  | "lavender"
  | "midnight"
  | "candy"
  | "minimal";

export type FocusSessionStatus = "planned" | "running" | "paused" | "completed" | "stopped";

export type Semester = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  targetGpa?: number;
};

export type PlannerData = {
  onboarded: boolean;
  paywallSeen: boolean;
  semester: Semester;
  courses: Course[];
  assignments: Assignment[];
  gradeItems: GradeItem[];
  targetGradePercent: number;
  settings?: UserSettings;
  parsedImports?: ParsedImport[];
  parsedItems?: ParsedItem[];
  widgetPresets?: WidgetPreset[];
  focusSessions?: FocusSession[];
};

export type PlannerSettings = {
  themeMode: "light" | "dark";
};

export type UserSettings = {
  studentName: string;
  selectedTheme: WidgetPalette | "custom";
  customPalette: string[];
  defaultWidgetStyle: WidgetBackground;
  onboardingComplete: boolean;
  notificationDefault: string;
  focusDefaultMinutes: number;
  syncEnabled: boolean;
  privacyMode: boolean;
  emojiAccentEnabled: boolean;
};

export type ClassMeeting = {
  id: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  startTime: string;
  endTime: string;
  location: string;
};

export type GradeCategory = {
  id: string;
  name: string;
  weight: number;
};

export type Course = {
  id: string;
  code: string;
  name: string;
  instructor?: string;
  teacher?: string;
  period?: string;
  room?: string;
  color: string;
  iconKey?: string;
  emojiKey?: string;
  semester?: string;
  createdAt?: string;
  updatedAt?: string;
  meetings: ClassMeeting[];
  gradeCategories: GradeCategory[];
};

export type ChecklistItem = {
  id: string;
  title: string;
  done: boolean;
};

export type ReminderConfig = {
  enabled: boolean;
  leadTimeHours: number;
};

export type Assignment = {
  id: string;
  courseId: string;
  title: string;
  kind: AssignmentKind;
  type?: AssignmentKind;
  dueAt: string;
  tags: string[];
  priority: Priority;
  estimatedMinutes: number;
  status: AssignmentStatus;
  source: SourceType;
  sourceId?: string;
  gradeWeight?: number;
  progress?: number;
  checklist?: ChecklistItem[];
  reminder?: ReminderConfig;
  needsReview?: boolean;
  duplicateOf?: string;
  confidence?: number;
  reminderIds?: string[];
  externalCalendarEventId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type GradeItem = {
  id: string;
  courseId: string;
  categoryId: string;
  title: string;
  earned: number;
  possible: number;
};

export type SyllabusImportSource = {
  kind: "pdf" | "photo" | "typed";
  uri?: string;
  name?: string;
  mimeType?: string;
  text?: string;
};

export type ParserFinding = {
  id: string;
  severity: "info" | "needs_review";
  message: string;
};

export type SyllabusParseResult = {
  sourceName: string;
  semesterName?: string;
  semesterStartDate?: string;
  semesterEndDate?: string;
  courses: Course[];
  assignments: Assignment[];
  gradeItems: GradeItem[];
  findings: ParserFinding[];
};

export type ParsedImport = {
  id: string;
  title: string;
  sourceType: "pdf" | "photo" | "typed" | "scan";
  sourceUri?: string;
  status: "processing" | "ready" | "error" | "applied";
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
};

export type ParsedItem = {
  id: string;
  parsedImportId: string;
  title: string;
  courseName: string;
  type: AssignmentKind;
  dueAt?: string;
  confidence: number;
  needsReview: boolean;
  duplicateCandidateId?: string;
  rawText: string;
  acceptedAt?: string;
  dismissedAt?: string;
  reviewStatus?: ReviewStatus;
};

export type WidgetPreset = {
  id: string;
  name: string;
  type: WidgetType;
  size: WidgetSize;
  background: WidgetBackground;
  palette: WidgetPalette;
  font: "SF Pro" | "New York" | "Rounded" | "Mono";
  classFocusCourseId?: string;
  layout: "compact" | "list" | "ring" | "calendar" | "grid";
  iconKey: string;
  createdAt: string;
  updatedAt: string;
};

export type FocusSession = {
  id: string;
  assignmentId: string;
  durationMinutes: number;
  startedAt: string;
  endedAt?: string;
  status: FocusSessionStatus;
  sessionNumber: number;
  notes?: string;
};
