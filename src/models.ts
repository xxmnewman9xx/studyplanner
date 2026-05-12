export type NavTab =
  | "today"
  | "calendar"
  | "week"
  | "import"
  | "courses"
  | "grades"
  | "upgrade";

export type Priority = "low" | "medium" | "high";

export type AssignmentStatus = "not_started" | "in_progress" | "done" | "archived";

export type AssignmentType = "assignment" | "exam" | "quiz" | "project" | "reading" | "other";

export type AssignmentKind = AssignmentType;

export type ReviewStatus = "needsReview" | "accepted" | "ignored";

export type CompletionStatus = "open" | "completed";

export type ReminderPreset = "none" | "same_day" | "day_before" | "two_days_before" | "week_before" | "custom";

export type ReminderPreference = {
  preset: ReminderPreset;
  enabled: boolean;
  minutesBefore?: number;
};

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
  syllabusSources: SyllabusSource[];
  widgetSnapshot?: WidgetSnapshot;
  targetGradePercent: number;
  updatedAt?: string;
};

export type PlannerSettings = {
  themeMode: "light" | "dark";
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
  color: string;
  meetings: ClassMeeting[];
  gradeCategories: GradeCategory[];
};

export type Assignment = {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  type: AssignmentType;
  kind: AssignmentKind;
  dueAt: string;
  sourceText: string;
  confidence: number;
  reviewStatus: ReviewStatus;
  completionStatus: CompletionStatus;
  reminderPreset: ReminderPreset;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  priority: Priority;
  estimatedMinutes: number;
  status: AssignmentStatus;
  source: "manual" | "syllabus" | "calendar" | "canvas" | "demo";
  gradeWeight?: number;
  reminderIds?: string[];
  externalCalendarEventId?: string;
};

export type Exam = Assignment & {
  type: "exam";
  kind: "exam";
};

export type GradeItem = {
  id: string;
  courseId: string;
  categoryId: string;
  title: string;
  earned: number;
  possible: number;
};

export type ParserFinding = {
  id: string;
  severity: "info" | "needs_review";
  message: string;
};

export type SyllabusSource = {
  id: string;
  kind: "pdf" | "photo" | "text" | "demo" | "manual";
  sourceName: string;
  importedAt: string;
  parser: "device" | "endpoint" | "demo" | "manual";
  courseIds: string[];
  assignmentIds: string[];
  findings: ParserFinding[];
  rawTextSample?: string;
};

export type SyllabusImportSource = {
  kind: "pdf" | "photo";
  uri?: string;
  name?: string;
  mimeType?: string;
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
  syllabusSource?: SyllabusSource;
};

export type SemesterPlan = {
  id: string;
  semester: Semester;
  courses: Course[];
  assignments: Assignment[];
  exams: Exam[];
  gradeItems: GradeItem[];
  syllabusSources: SyllabusSource[];
  updatedAt: string;
};

export type WidgetUrgency = "overdue" | "today" | "soon" | "upcoming" | "empty";

export type WidgetSnapshotItem = {
  assignmentId: string;
  title: string;
  courseId: string;
  courseName: string;
  dueAt: string;
  type: AssignmentType;
  dueLabel: string;
  urgency: WidgetUrgency;
  urgencyLabel: string;
  reviewStatus: ReviewStatus;
  completionStatus: CompletionStatus;
};

export type WidgetSnapshotStyle = {
  paletteId: string;
  paletteName: string;
  styleId: string;
  styleName: string;
  background: string;
  text: string;
  muted: string;
  accent: string;
  secondary: string;
};

export type WidgetSnapshotInsight = {
  completionPercent: number;
  openCount: number;
  completedCount: number;
  workloadByDay: Array<{
    date: string;
    label: string;
    count: number;
    examCount: number;
  }>;
  courseBalance: Array<{
    courseId: string;
    courseName: string;
    color: string;
    openCount: number;
  }>;
};

export type WidgetSnapshotMonthly = {
  monthLabel: string;
  dueThisMonth: number;
  examCount: number;
  heavyDayCount: number;
  completedCount: number;
  days: Array<{
    date: string;
    dayNumber: number;
    itemCount: number;
    examCount: number;
    completedCount: number;
    isToday: boolean;
    isHeavy: boolean;
    courseColors: string[];
  }>;
};

export type WidgetHeavyWeekWarning = {
  isHeavy: boolean;
  label: string;
  itemCount: number;
  examCount: number;
};

export type WidgetSnapshot = {
  version: 1;
  generatedAt: string;
  lastUpdated: string;
  semesterId: string;
  semesterName: string;
  nextDue?: WidgetSnapshotItem;
  thisWeek: WidgetSnapshotItem[];
  overdueCount: number;
  reviewQueueCount: number;
  heavyWeekWarning?: WidgetHeavyWeekWarning;
  emptyState: {
    isEmpty: boolean;
    title: string;
    message: string;
  };
  widgetStyle?: WidgetSnapshotStyle;
  monthly?: WidgetSnapshotMonthly;
  insights?: WidgetSnapshotInsight;
  demoState?: {
    enabled: boolean;
    label: string;
  };
  surfaces: {
    small: {
      kind: "nextDue";
      item?: WidgetSnapshotItem;
      emptyTitle?: string;
    };
    medium: {
      kind: "thisWeek";
      items: WidgetSnapshotItem[];
      overflowCount: number;
    };
    large: {
      kind: "weeklyWorkload";
      items: WidgetSnapshotItem[];
      heavyWeekWarning?: WidgetHeavyWeekWarning;
    };
    lockScreen: {
      kind: "countdown";
      item?: WidgetSnapshotItem;
      countdownLabel?: string;
    };
    monthly: {
      kind: "monthlyCalendar";
      monthLabel: string;
      dueThisMonth: number;
      examCount: number;
      heavyDayCount: number;
    };
    heavyWeek: {
      kind: "heavyWeek";
      warning?: WidgetHeavyWeekWarning;
      workloadByDay: WidgetSnapshotInsight["workloadByDay"];
    };
    courseFocus: {
      kind: "courseFocus";
      courses: WidgetSnapshotInsight["courseBalance"];
    };
  };
};
