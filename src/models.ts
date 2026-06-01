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

export type StudioAccentRole = "primary" | "secondary" | "risk" | "focus" | "activity";

export type CardAccentStyle = "clean" | "glass" | "color_card" | "compact";

export type WidgetStudioStyle = "clean" | "glass" | "color_card" | "compact";

export type WidgetColorSource = "class" | "urgency" | "custom";

export type WidgetStudioSize = WidgetSize | "watch";

export type WidgetStudioSurface = "home" | "lock" | "watch";

export type WatchPreviewStyle = "rings" | "cards" | "compact";

export type WidgetStudioContentType =
  | "exam_countdown"
  | "next_assignment"
  | "next_class"
  | "focus_window"
  | "semester_progress"
  | "heavy_week_warning"
  | "free_time_forecast"
  | "review_inbox_status"
  | "class_progress";

export type WidgetStudioSetting = {
  id: string;
  contentType: WidgetStudioContentType;
  classFocusCourseId?: string;
  colorSource: WidgetColorSource;
  customColor?: string;
  size: WidgetStudioSize;
  style: WidgetStudioStyle;
  surface: WidgetStudioSurface;
  updatedAt: string;
};

export type StudioCustomization = {
  version: 1;
  primaryAccent: string;
  secondaryAccent: string;
  riskColor: string;
  focusColor: string;
  activityColor: string;
  forecastAccent: string;
  focusTimerAccent: string;
  cardAccentStyle: CardAccentStyle;
  widgetColor: string;
  watchPreviewStyle: WatchPreviewStyle;
  appIconVariant?: string;
  homeWidgetPack: WidgetStudioSetting[];
  lockWidgetPack: WidgetStudioSetting[];
  watchWidgetPack: WidgetStudioSetting[];
  savedSetupName?: string;
  updatedAt: string;
};

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
  studentLifeMemory?: StudentLifeMemory;
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
  customization?: StudioCustomization;
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

export type StudentLifeFeature =
  | "home"
  | "forecast"
  | "classes"
  | "focus"
  | "notes"
  | "widgets"
  | "watch";

export type StudentLifeRecommendationAction =
  | "viewed"
  | "started"
  | "completed"
  | "snoozed"
  | "converted"
  | "saved"
  | "ignored";

export type StudentLifeMemory = {
  version: 1;
  createdAt: string;
  updatedAt: string;
  featureVisits: Record<StudentLifeFeature, number>;
  featureLastSeenAt: Partial<Record<StudentLifeFeature, string>>;
  recommendationEvents: Array<{
    id: string;
    feature: StudentLifeFeature;
    action: StudentLifeRecommendationAction;
    assignmentId?: string;
    courseId?: string;
    noteId?: string;
    widgetType?: WidgetType;
    createdAt: string;
  }>;
  home: {
    lastTopActionId?: string;
    topActionSeenCount: Record<string, number>;
    completedTopActions: number;
    delayedTopActions: number;
  };
  forecast: {
    snapshots: Array<{
      dateKey: string;
      state: "clear" | "watch" | "warning" | "storm" | "recovery";
      riskScore: number;
      heavyDayCount: number;
      openCount: number;
      completedFocusMinutes: number;
      topAssignmentId?: string;
      createdAt: string;
    }>;
    warningsSeen: number;
    interventionsAccepted: number;
  };
  focus: {
    completedSessions: number;
    stoppedSessions: number;
    totalMinutes: number;
    preferredDurationMinutes?: number;
    assignmentStats: Record<string, {
      sessions: number;
      completed: number;
      stopped: number;
      totalMinutes: number;
      lastAt: string;
    }>;
    courseStats: Record<string, {
      sessions: number;
      completed: number;
      stopped: number;
      totalMinutes: number;
      lastAt: string;
    }>;
  };
  notes: {
    created: number;
    convertedToTasks: number;
    pinned: number;
    resurfaced: number;
    courseCounts: Record<string, number>;
  };
  widgets: {
    savedCount: number;
    recommendedTypeCounts: Partial<Record<WidgetType, number>>;
    lastRecommendedType?: WidgetType;
  };
  watch: {
    signalsGenerated: number;
    focusStarts: number;
    smartSnoozes: number;
    lastSignal?: string;
  };
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
