export type ThemeId =
  | "light"
  | "dark"
  | "ocean"
  | "grape"
  | "neon"
  | "minimal"
  | "athlete"
  | "academic";

export type ClassItem = {
  id: string;
  code: string;
  name: string;
  professor: string;
  room: string;
  days: string;
  time: string;
  next: string;
  health: number;
  grade: string;
  color: string;
  color2: string;
  icon: string;
  notes?: string;
  archivedAt?: string;
  userEditedAt?: string;
  gradeEntries?: GradeEntry[];
  targetGrade?: string;
};

export type Subtask = {
  title: string;
  done: boolean;
};

export type TaskItem = {
  id: string;
  title: string;
  classId: string;
  type: string;
  dueOffset: number;
  dueDate: string;
  time: string;
  estimateMinutes: number;
  done: boolean;
  urgent: boolean;
  source: string;
  priority?: "Low" | "Medium" | "High";
  description?: string;
  recurringId?: string;
  recurrenceIndex?: number;
  recurrenceEndDate?: string;
  userEditedAt?: string;
  subtasks: Subtask[];
  weight?: number;
  score?: number;
  missing?: boolean;
};

export type ExamItem = {
  id: string;
  classId: string;
  title: string;
  dueOffset: number;
  dueDate: string;
  time: string;
  room: string;
  kind?: "Quiz" | "Exam" | "Midterm" | "Final" | "Presentation" | "Project";
  description?: string;
  effortMinutes?: number;
  priority?: "Low" | "Medium" | "High";
  notes?: string;
  userEditedAt?: string;
  topics: string[];
  weight?: number;
  score?: number;
};

export type NoteItem = {
  id: string;
  classId: string;
  title: string;
  createdAt: string;
  summary: string;
  terms: string[];
  suggestedTasks: string[];
  examId?: string;
  pages: number;
  sourceText: string;
  reviewedConcepts?: string[];
  generatedAssetsAt?: string;
};

export type ReminderItem = {
  id: string;
  kind: "Class" | "Assignment" | "Exam" | "Study";
  title: string;
  classId: string;
  lead: string;
  room?: string;
  enabled: boolean;
  notificationIds?: string[];
  scheduledFor?: string[];
  snoozedUntil?: string;
  explanation?: string;
};

export type WidgetKey =
  | "health"
  | "nextClass"
  | "deadline"
  | "streak"
  | "load"
  | "exam"
  | "notes"
  | "focus";

export type WidgetThemeChoice =
  | "liquidLight"
  | "graphite"
  | "campus"
  | "focus"
  | "contrast";

export type WidgetDensity = "quiet" | "balanced" | "detailed";

export type WidgetPreset = {
  id: string;
  name: string;
  tag: string;
  icon: string;
  widgets: WidgetKey[];
};

export type UserPrefs = {
  name: string;
  firstName?: string;
  level: string;
  semesterType: string;
  workloadStyle: string;
  studyPersonality: string;
  reminderStyle: string;
  studentType?: string;
  studentPersona?: string;
  mainGoal?: string;
  semesterGoal?: string;
  scanIntent?: string;
  theme: ThemeId;
  presetId: string;
  customWidgets?: WidgetKey[];
  widgetTheme?: WidgetThemeChoice;
  widgetDensity?: WidgetDensity;
  widgetClassId?: string;
  onboardingComplete?: boolean;
  osLive: boolean;
  premium: boolean;
  premiumProductId?: string;
  premiumCheckedAt?: string;
};

export type StudyBlock = {
  id: string;
  day: string;
  time: string;
  taskId?: string;
  examId?: string;
  noteId?: string;
  classId: string;
  title: string;
  minutes: number;
  reason: string;
  completed: boolean;
  missed?: boolean;
  date?: string;
  startsAt?: string;
  endsAt?: string;
  source?: "deadline" | "exam_prep" | "missed_repair" | "note_review" | "large_task_split";
};

export type SemanticColorState = "green" | "yellow" | "orange" | "red" | "blue" | "purple" | "graphite";

export type TrendState = "up" | "down" | "flat";

export type GradeEntry = {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  weight?: number;
  date?: string;
  source?: "manual" | "import" | "estimate";
};

export type ClassPulseBreakdown = {
  classId: string;
  score: number;
  label: "On track" | "Watch" | "Needs focus";
  confidence: number;
  momentum: number;
  workload: number;
  completionTrend: number;
  nextMove: string;
  causes: string[];
  accentColor: string;
};

export type RiskRecommendation = {
  id: string;
  label: string;
  detail: string;
  score: number;
  severity: "low" | "medium" | "high";
  confidence: number;
  cause: string;
  action: "startFocus" | "splitTask" | "reschedule" | "addReview" | "addReminder" | "markMissingInfo";
  affectedDate?: string;
  color: string;
  classId?: string;
  taskId?: string;
  examId?: string;
};

export type SchedulePlan = {
  generatedAt: string;
  blocks: StudyBlock[];
  dailyLoad: Record<string, number>;
  cappedDays: string[];
  changedSinceLastPlan: string[];
  rationale: string[];
};

export type ParsedNoteInsight = {
  noteId: string;
  concepts: string[];
  definitions: { term: string; definition: string }[];
  formulas: string[];
  likelyExamTopics: string[];
  weakAreas: string[];
  linkedTaskIds: string[];
  linkedExamIds: string[];
  confidence: number;
};

export type NotificationPlan = {
  permissionNeeded: boolean;
  quietHours: { startHour: number; endHour: number };
  items: {
    stableId: string;
    kind: ReminderItem["kind"];
    title: string;
    body: string;
    classId: string;
    triggerAt: string;
    explanation: string;
    sourceId?: string;
  }[];
  skipped: { sourceId: string; reason: string }[];
};

export type HealthDimensionKey = "workload" | "grades" | "preparedness" | "consistency";

export type HealthDimension = {
  key: HealthDimensionKey;
  label: string;
  score: number;
  colorState: SemanticColorState;
  trend: TrendState;
  reason: string;
};

export type SemesterHealth = {
  overallScore: number;
  dimensions: Record<HealthDimensionKey, HealthDimension>;
  colorState: SemanticColorState;
  trend: TrendState;
  reason: string;
  biggestRisk: string;
  biggestWin: string;
  nextBestAction: string;
};

export type GradeForecast = {
  classId: string;
  mode: "known" | "estimated" | "unknown";
  label: string;
  numericScore?: number;
  trend: TrendState;
  colorState: SemanticColorState;
  confidence: number;
  reason: string;
  missingInputs: string[];
  nextGradeAction: string;
};

export type ClassPulseV2 = {
  classId: string;
  forecastLabel: string;
  forecastScore?: number;
  mode: GradeForecast["mode"];
  trend: TrendState;
  colorState: SemanticColorState;
  reason: string;
  nextDeadline?: { taskId: string; title: string; dueLabel: string };
  nextExam?: { examId: string; title: string; dueLabel: string };
  missingWork: number;
  nudge: string;
};

export type PressureForecast = {
  colorState: SemanticColorState;
  score: number;
  label: string;
  weekLabels: string[];
  weekLoads: number[];
  clusters: { date: string; label: string; count: number; colorState: SemanticColorState }[];
  overloadedDays: string[];
  recoverySuggestion?: string;
};

export type SemesterAction = {
  id: string;
  label: string;
  detail: string;
  action: RiskRecommendation["action"];
  priority: number;
  colorState: SemanticColorState;
  classId?: string;
  taskId?: string;
  examId?: string;
  blockId?: string;
};

export type StudyRecommendation = {
  id: string;
  classId: string;
  title: string;
  reason: string;
  minutes: number;
  colorState: SemanticColorState;
  source: "deadline" | "exam" | "note" | "recovery" | "consistency";
};

export type FeedbackEvent = {
  id: string;
  createdAt: string;
  action:
    | "completeTask"
    | "completeStudyBlock"
    | "missStudyBlock"
    | "importSyllabus"
    | "importNotes"
    | "generateFlashcards"
    | "reviewWeakConcept"
    | "addGrade"
    | "reschedulePlan";
  message: string;
  before: { semesterHealth: number; preparedness: number; workload: number; grades: number; consistency: number };
  after: { semesterHealth: number; preparedness: number; workload: number; grades: number; consistency: number };
  delta: number;
  classId?: string;
  dimension?: HealthDimensionKey;
  actionId?: string;
};

export type SemesterCoachCopy = {
  headline: string;
  body: string;
  nextAction: string;
  feedback?: string;
};

export type SemesterSnapshot = {
  generatedAt: string;
  todayKey: string;
  semesterHealth: SemesterHealth;
  classPulses: ClassPulseV2[];
  gradeForecasts: GradeForecast[];
  pressureForecast: PressureForecast;
  recommendedActions: SemesterAction[];
  riskFactors: RiskRecommendation[];
  studyRecommendations: StudyRecommendation[];
  feedbackEvents: FeedbackEvent[];
  coachCopy: SemesterCoachCopy;
  colorState: SemanticColorState;
  schedulePlan: SchedulePlan;
  notificationPlan: NotificationPlan;
};

export type DashboardSnapshot = {
  generatedAt: string;
  todayKey: string;
  greeting: string;
  semesterHealth: {
    score: number;
    label: "On track" | "Watch" | "Needs focus";
    rings: { label: string; value: number; color: string }[];
  };
  todayPressure: {
    score: number;
    label: "Light" | "Focused" | "Heavy";
    dueNowCount: number;
    overdueCount: number;
    studyMinutes: number;
    reason: string;
  };
  nextClass?: {
    classId: string;
    code: string;
    title: string;
    startsAt: string;
    room: string;
    color: string;
  };
  nearestDeadline?: {
    taskId: string;
    title: string;
    classId: string;
    dueAt: string;
    dueLabel: string;
  };
  recommendedFocus?: StudyBlock;
  classPulses: ClassPulseBreakdown[];
  risks: RiskRecommendation[];
  schedulePlan: SchedulePlan;
};

export type ImportCandidate = {
  id: string;
  kind: "class" | "task" | "exam" | "note";
  title: string;
  meta: string;
  classId?: string;
  confidence: number;
  payload: Partial<ClassItem & TaskItem & ExamItem & NoteItem>;
  approved: boolean;
  reconciliationChoice?: "keep" | "update" | "duplicate";
};

export type ImportBatch = {
  id: string;
  sourceName: string;
  sourceText: string;
  createdAt: string;
  status: "review" | "applied";
  candidates: ImportCandidate[];
};

export type AppData = {
  prefs: UserPrefs;
  classes: ClassItem[];
  tasks: TaskItem[];
  exams: ExamItem[];
  notes: NoteItem[];
  reminders: ReminderItem[];
  studyBlocks: StudyBlock[];
  imports: ImportBatch[];
  feedbackEvents?: FeedbackEvent[];
};
