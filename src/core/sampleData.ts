import type { AppSettings, AppState, ClassCourse, Note, ReminderSettings, Student, Task, WidgetSettings, WidgetType } from "./types";
import { getDefaultWidgetSettings } from "./widgetEngine";

export const todayDate = "2026-06-03";
export const tomorrowDate = "2026-06-04";
export const fridayDate = "2026-06-05";

export const defaultReminderSettings: ReminderSettings = {
  enabled: true,
  minutesBefore: 15,
  showRoom: true,
  bringItems: ["Calculator", "Notebook"],
  customText: ""
};

export const sampleStudent: Student = {
  id: "student-maya",
  name: "Maya Rodriguez",
  school: "Eastbrook University",
  year: "Sophomore",
  semester: "Fall semester",
  preferences: {
    preferredStudyWindow: "5:00 PM",
    defaultBringItems: ["Notebook", "Laptop"]
  }
};

export const sampleClasses: ClassCourse[] = [
  { id: "bio", title: "Biology 101", professor: "Dr. Chen", room: "B204", days: ["Mon", "Wed", "Fri"], startTime: "09:00", endTime: "09:50", accent: "mint", pulse: 88, reminderSettings: { ...defaultReminderSettings, bringItems: ["Lab notebook", "Slides"] } },
  { id: "calc", title: "Calculus II", professor: "Prof. Harris", room: "M112", days: ["Tue", "Thu", "Wed"], startTime: "11:30", endTime: "12:45", accent: "blue", pulse: 85, reminderSettings: defaultReminderSettings },
  { id: "eng", title: "English Literature", professor: "Dr. Patel", room: "H310", days: ["Mon", "Wed", "Fri"], startTime: "14:00", endTime: "14:50", accent: "violet", pulse: 74, reminderSettings: { ...defaultReminderSettings, minutesBefore: 10, bringItems: ["Essay draft"] } },
  { id: "cs", title: "Computer Science", professor: "Prof. Kim", room: "CS50", days: ["Tue", "Thu"], startTime: "15:30", endTime: "16:45", accent: "cyan", pulse: 91, reminderSettings: { ...defaultReminderSettings, bringItems: ["Laptop"] } }
];

export const sampleTasks: Task[] = [
  { id: "task-1", title: "Problem Set 4", classId: "calc", type: "Homework", dueDate: todayDate, dueTime: "17:00", priority: "High", reminder: "15 min before", completed: false, createdAt: todayDate, updatedAt: todayDate },
  { id: "task-2", title: "Read Chapter 6", classId: "bio", type: "Reading", dueDate: todayDate, dueTime: "20:00", priority: "Medium", reminder: "Tonight", completed: false, createdAt: todayDate, updatedAt: todayDate },
  { id: "task-3", title: "Lab Report", classId: "bio", type: "Report", dueDate: tomorrowDate, dueTime: "09:00", priority: "High", reminder: "30 min before", completed: false, createdAt: todayDate, updatedAt: todayDate },
  { id: "task-4", title: "English essay draft", classId: "eng", type: "Essay", dueDate: fridayDate, dueTime: "12:00", priority: "Medium", reminder: "Tomorrow", completed: false, createdAt: todayDate, updatedAt: todayDate }
];

export const sampleNotes: Note[] = [
  { id: "note-1", title: "Thermodynamics", classId: "bio", body: "Energy transfer, entropy, and lab examples.", tags: ["exam", "lab"], status: "reviewed", createdAt: todayDate, updatedAt: todayDate },
  { id: "note-2", title: "Shakespeare Themes", classId: "eng", body: "Ambition, delay, betrayal, and point of view.", tags: ["essay"], status: "draft", createdAt: todayDate, updatedAt: todayDate },
  { id: "note-3", title: "Integration by Parts", classId: "calc", body: "Pick u with LIATE and check by differentiating.", tags: ["practice"], status: "pinned", createdAt: todayDate, updatedAt: todayDate },
  { id: "note-4", title: "Recursion Basics", classId: "cs", body: "Base case first, then shrink the problem.", tags: ["code"], status: "reviewed", createdAt: todayDate, updatedAt: todayDate }
];

export const sampleExams = [
  { id: "exam-1", title: "Biology quiz", classId: "bio", date: fridayDate, time: "10:00" },
  { id: "exam-2", title: "Calculus midterm", classId: "calc", date: "2026-06-10", time: "11:30" }
];

export const defaultAppSettings: AppSettings = {
  defaultClassReminder: 15,
  showRoomInReminder: true,
  reduceTransparency: false,
  reduceMotion: false,
  highContrast: false,
  largerText: false
};

export const widgetTypes: WidgetType[] = ["nextClass", "todayTasks", "classPulse", "weeklyLoad", "roomReminder", "upcomingTest", "studyTime"];

export function createDefaultWidgetSettings(): Record<WidgetType, WidgetSettings> {
  return widgetTypes.reduce((settings, type) => {
    settings[type] = getDefaultWidgetSettings(type);
    return settings;
  }, {} as Record<WidgetType, WidgetSettings>);
}

export function createInitialAppState(): AppState {
  return {
    student: sampleStudent,
    classes: sampleClasses,
    tasks: sampleTasks,
    notes: sampleNotes,
    exams: sampleExams,
    widgetSettings: createDefaultWidgetSettings(),
    appSettings: defaultAppSettings,
    onboardingComplete: false,
    scannerState: { status: "idle", stepIndex: 0, completedAt: null }
  };
}
