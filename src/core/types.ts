export type Accent = "blue" | "mint" | "violet" | "orange" | "cyan" | "rose";

export type Priority = "Low" | "Medium" | "High";
export type TaskType = "Homework" | "Reading" | "Report" | "Essay" | "Test" | "Project";
export type NoteStatus = "draft" | "reviewed" | "pinned";
export type WidgetType =
  | "nextClass"
  | "todayTasks"
  | "classPulse"
  | "weeklyLoad"
  | "roomReminder"
  | "upcomingTest"
  | "studyTime";
export type WidgetSize = "S" | "M" | "L" | "Hero";
export type WidgetDensity = "Compact" | "Detailed";
export type WatchScreen =
  | "today"
  | "room"
  | "pulse"
  | "tasks"
  | "notification"
  | "complications";

export type ReminderSettings = {
  enabled: boolean;
  minutesBefore: number;
  showRoom: boolean;
  bringItems: string[];
  customText: string;
};

export type Student = {
  id: string;
  name: string;
  school: string;
  year: string;
  semester: string;
  preferences: {
    preferredStudyWindow: string;
    defaultBringItems: string[];
  };
};

export type ClassCourse = {
  id: string;
  title: string;
  professor: string;
  room: string;
  days: string[];
  startTime: string;
  endTime: string;
  accent: Accent;
  pulse: number;
  reminderSettings: ReminderSettings;
};

export type Task = {
  id: string;
  title: string;
  classId: string;
  type: TaskType;
  dueDate: string;
  dueTime: string;
  priority: Priority;
  reminder: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  title: string;
  classId: string;
  body: string;
  tags: string[];
  status: NoteStatus;
  createdAt: string;
  updatedAt: string;
};

export type Exam = {
  id: string;
  title: string;
  classId: string;
  date: string;
  time: string;
};

export type WidgetSettings = {
  widgetType: WidgetType;
  accent: Accent;
  opacity: number;
  blur: number;
  glow: number;
  radius: number;
  size: WidgetSize;
  density: WidgetDensity;
  updatedAt: string;
};

export type AppSettings = {
  defaultClassReminder: number;
  showRoomInReminder: boolean;
  reduceTransparency: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  largerText: boolean;
};

export type ScannerState = {
  status: "idle" | "running" | "complete";
  stepIndex: number;
  completedAt: string | null;
};

export type AppState = {
  student: Student;
  classes: ClassCourse[];
  tasks: Task[];
  notes: Note[];
  exams: Exam[];
  widgetSettings: Record<WidgetType, WidgetSettings>;
  appSettings: AppSettings;
  onboardingComplete: boolean;
  scannerState: ScannerState;
};

export type PulseModel = {
  score: number;
  label: "Great" | "Good" | "Needs attention" | "Behind" | "Urgent";
  accent: Accent;
  primaryReason: string;
  suggestedActions: string[];
};

export type WidgetDisplayModel = {
  widgetType: WidgetType;
  label: string;
  value: string;
  title: string;
  copy: string;
  status: string;
  items: string[];
  chart?: "pulse" | "bars";
  accent: Accent;
};
