import { AppData, ThemeId, WidgetPreset } from "./types";

const now = new Date();
export const TODAY = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);

export const COLORS = {
  blue: "#0A84FF",
  purple: "#7B5CFF",
  green: "#30D158",
  orange: "#FF9F0A",
  red: "#FF453A",
  pink: "#FF375F",
  teal: "#40C8E0",
  yellow: "#FFD60A",
  ink: "#0A0A0D",
};

export const CLASS_COLORS = [
  ["#30D158", "#1FA346"],
  ["#0A84FF", "#0768CC"],
  ["#BF5AF2", "#9A3FCB"],
  ["#FF9F0A", "#D97E00"],
  ["#FF375F", "#D4234A"],
  ["#40C8E0", "#1197AD"],
];

export const PRESETS: WidgetPreset[] = [
  { id: "academic", name: "Academic", tag: "Balanced & clear", icon: "graduation-cap", widgets: ["health", "nextClass", "deadline", "load"] },
  { id: "athlete", name: "Athlete", tag: "Momentum & streaks", icon: "flame", widgets: ["streak", "nextClass", "load", "deadline"] },
  { id: "minimal", name: "Minimalist", tag: "Just the essentials", icon: "moon", widgets: ["nextClass", "deadline"] },
  { id: "adhd", name: "ADHD Focus", tag: "One thing at a time", icon: "zap", widgets: ["focus", "deadline", "nextClass"] },
  { id: "premed", name: "Pre-med", tag: "Exam-driven", icon: "flask-conical", widgets: ["exam", "health", "deadline", "notes"] },
  { id: "eng", name: "Engineering", tag: "Project tracking", icon: "layers", widgets: ["deadline", "load", "nextClass", "streak"] },
  { id: "finals", name: "Finals Week", tag: "All-in crunch mode", icon: "flame", widgets: ["exam", "deadline", "health", "streak"] },
  { id: "colorpop", name: "Color Pop", tag: "Vivid & playful", icon: "sparkles", widgets: ["streak", "nextClass", "notes", "load"] },
];

export const THEMES: { id: ThemeId; name: string; swatches: [string, string] }[] = [
  { id: "light", name: "Light", swatches: ["#FBFBFE", "#0A0A0D"] },
  { id: "dark", name: "Dark", swatches: ["#0A0A0C", "#5E5CE6"] },
  { id: "ocean", name: "Ocean", swatches: ["#0AC3E0", "#0A84FF"] },
  { id: "grape", name: "Grape", swatches: ["#A24BFF", "#FF375F"] },
  { id: "neon", name: "Neon", swatches: ["#39FF88", "#00E5FF"] },
  { id: "minimal", name: "Minimal", swatches: ["#1C1C1E", "#48484A"] },
  { id: "athlete", name: "Athlete", swatches: ["#FF6A00", "#FFD60A"] },
  { id: "academic", name: "Academic", swatches: ["#1B5FE0", "#7B5CFF"] },
];

export const defaultData: AppData = {
  prefs: {
    name: "Student",
    firstName: "Student",
    level: "Student",
    semesterType: "Semesters",
    workloadStyle: "Balanced",
    studyPersonality: "Need a nudge",
    reminderStyle: "Standard",
    studentType: "College",
    studentPersona: "School semester",
    mainGoal: "Stay ahead",
    semesterGoal: "Stay ahead",
    scanIntent: "Syllabus PDF",
    theme: "light",
    presetId: "academic",
    widgetTheme: "liquidLight",
    widgetDensity: "balanced",
    onboardingComplete: false,
    osLive: false,
    premium: false,
  },
  classes: [],
  tasks: [],
  exams: [],
  notes: [],
  reminders: [],
  studyBlocks: [],
  imports: [],
};

export function formatDue(offset: number) {
  if (offset < -1) return `${Math.abs(offset)} days ago`;
  if (offset === -1) return "Yesterday";
  if (offset === 0) return "Today";
  if (offset === 1) return "Tomorrow";
  return `In ${offset} days`;
}

export function minutesLabel(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function isoFromOffset(offset: number) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
