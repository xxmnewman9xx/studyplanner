export type NavTab =
  | "today"
  | "import"
  | "plan"
  | "courses"
  | "notes"
  | "more"
  | "focus"
  | "grades"
  | "subscribe";

export type Priority = "low" | "medium" | "high";

export type AssignmentStatus = "not_started" | "in_progress" | "done" | "archived";

export type AssignmentKind = "assignment" | "exam" | "project" | "reading" | "worksheet";

export type LifeItemType =
  | "assignment"
  | "exam"
  | "class"
  | "project"
  | "reading"
  | "sport"
  | "music"
  | "club"
  | "work"
  | "focus"
  | "personal";

export type LifePriority = "low" | "medium" | "high" | "critical";

export type LifeItem = {
  id: string;
  title: string;
  type: LifeItemType;
  startsAt?: string;
  endsAt?: string;
  dueAt?: string;
  courseId?: string;
  sourceAssignmentId?: string;
  location?: string;
  priority: LifePriority;
  estimatedMinutes?: number;
  progress?: number;
  color?: string;
  iconKey?: string;
  reason?: string;
  isFlexible?: boolean;
  conflictsWith?: string[];
};

export type LifeInsight = {
  id: string;
  title: string;
  detail: string;
  reason: string;
  priority: LifePriority;
  itemIds?: string[];
};

export type StudentDNAIdentity =
  | "focused_scholar"
  | "active_athlete"
  | "creative_artist"
  | "competitive_leader"
  | "balanced_wellness"
  | "working_professional"
  | "curious_explorer"
  | "research_driven";

export type StudentDNALayout = "feed_first" | "timeline" | "focus_first" | "split_view" | "minimal";

export type StudentDNA = {
  identity: StudentDNAIdentity;
  layout: StudentDNALayout;
  colorVibe: WidgetPalette | "custom";
};

export type OSBehavior =
  | "highest_gpa"
  | "less_stress"
  | "athletic_performance"
  | "life_balance"
  | "high_achievement";

export type FrictionPoint =
  | "procrastination"
  | "exam_anxiety"
  | "overcommitment"
  | "focus_issues"
  | "forgetfulness";

export type WidgetDNA = {
  priorities: Array<
    | "exam_countdown"
    | "free_time_forecast"
    | "next_class"
    | "practice_countdown"
    | "life_balance_ring"
    | "grade_impact"
    | "future_risk"
    | "focus_window"
  >;
  adaptiveOrdering: boolean;
};

export type WatchDNA = {
  complications: Array<"next_class" | "focus_window" | "exam_risk" | "semester_progress" | "free_time">;
  glanceDensity: "quiet" | "standard" | "dense";
};

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

export type WidgetBackground = "solid" | "gradient" | "glass" | "dark" | "light";

export type WidgetKind = "today" | "upcoming" | "week" | "classProgress";

export type WidgetPalette =
  | "sunset"
  | "ocean"
  | "forest"
  | "lavender"
  | "midnight"
  | "candy"
  | "minimal"
  | "graphite"
  | "aurora"
  | "paper"
  | "contrast";

export type WidgetTheme = "light" | "dark" | "ocean" | "graphite" | "forest" | "high_contrast";

export type WidgetDataMode =
  | "all_classes"
  | "single_class"
  | "today"
  | "this_week"
  | "urgent_only"
  | "next_up"
  | "next3";

export type WidgetLayout =
  | "compact"
  | "list"
  | "ring"
  | "calendar"
  | "grid"
  | "progress"
  | "timeline"
  | "strip"
  | "summary"
  | "next_task";

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
  demoMode?: boolean;
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
  notes?: StudyNote[];
  lifeItems?: LifeItem[];
  lifeInsights?: LifeInsight[];
};

export type PlannerSettings = {
  themeMode: "light" | "dark";
};

export type StudentProfile = {
  name: string;
  persona?: StudentPersona;
  stressLevel?: StressLevel;
  preferredLocale?: string;
  nightOwl?: boolean;
};

export type StudentPersona =
  | "organized_ap"
  | "overwhelmed"
  | "athlete"
  | "artist"
  | "stem_heavy"
  | "humanities_heavy"
  | "adhd_focus_support"
  | "bilingual"
  | "night_owl"
  | "all_caught_up"
  | "missing_dates_heavy"
  | "exam_week";

export type StressLevel = "low" | "steady" | "high";

export type UserSettings = {
  studentName: string;
  profile?: StudentProfile;
  persona?: StudentPersona;
  stressLevel?: StressLevel;
  locale?: string;
  selectedTheme: WidgetPalette | "custom";
  customPalette: string[];
  appTheme: "campus" | "classic" | "slate" | "mint" | "aura" | "rose" | "graphite" | "solar";
  defaultWidgetStyle: WidgetBackground;
  onboardingComplete: boolean;
  notificationDefault: string;
  focusDefaultMinutes: number;
  syncEnabled: boolean;
  privacyMode: boolean;
  emojiAccentEnabled: boolean;
  studentDNA?: StudentDNA;
  osBehavior?: OSBehavior;
  frictionPoints?: FrictionPoint[];
  widgetDNA?: WidgetDNA;
  watchDNA?: WatchDNA;
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
  notes?: string;
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

export type Reminder = ReminderConfig & {
  id?: string;
  assignmentId?: string;
  channel?: "local" | "calendar" | "widget";
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
  examples?: string[];
};

export type SyllabusParseResult = {
  sourceImportId?: string;
  sourceType?: ParsedImport["sourceType"];
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
  sourceText?: string;
  mimeType?: string;
  status:
    | "idle"
    | "picking"
    | "captured"
    | "queued"
    | "parsing"
    | "parsed"
    | "failed"
    | "retrying"
    | "reviewed"
    | "processing"
    | "ready"
    | "error"
    | "applied";
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
  widgetKind?: WidgetKind;
  type: WidgetType;
  size: WidgetSize;
  theme?: WidgetTheme;
  background: WidgetBackground;
  palette: WidgetPalette;
  dataMode?: WidgetDataMode;
  font: "SF Pro" | "New York" | "Rounded" | "Mono";
  classFocusCourseId?: string;
  layout: WidgetLayout;
  iconKey: string;
  smartStackSlot?: "morning" | "between_classes" | "study_time" | "night_review";
  scheduleLabel?: string;
  themePackId?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type StudyNote = {
  id: string;
  courseId?: string;
  assignmentId?: string;
  sourceId?: string;
  focusSessionId?: string;
  kind?: "quick" | "assignment" | "class" | "source" | "focus" | "today";
  title: string;
  body: string;
  tags: string[];
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Note = StudyNote;

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

export type ThemePreset = {
  id: WidgetPalette | "custom";
  label: string;
  palette: string[];
  highContrast?: boolean;
};

export type AppLocaleState = {
  locale: string;
  fallbackLocale: string;
  direction: "ltr" | "rtl";
  missingKeys: string[];
};
