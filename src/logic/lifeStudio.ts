import { Assignment, Course, FrictionPoint, OSBehavior, StudentDNA, UserSettings, WatchDNA, WidgetDNA } from "../models";

export const studentDNAOptions: Array<{ id: StudentDNA; label: string; icon: string; color: string }> = [
  { id: "focused_scholar", label: "Focused Scholar", icon: "brain", color: "#6D3DF2" },
  { id: "active_athlete", label: "Active Athlete", icon: "run", color: "#2563EB" },
  { id: "creative_artist", label: "Creative Artist", icon: "music", color: "#DB2777" },
  { id: "competitive_leader", label: "Competitive Leader", icon: "trophy", color: "#EA580C" },
  { id: "balanced_wellness", label: "Balanced Wellness", icon: "leaf", color: "#16A34A" },
  { id: "working_professional", label: "Working Professional", icon: "briefcase", color: "#A16207" },
  { id: "curious_explorer", label: "Curious Explorer", icon: "atom", color: "#7C3AED" },
  { id: "research_driven", label: "Research Driven", icon: "scope", color: "#0891B2" }
];

export const osBehaviorOptions: Array<{ id: OSBehavior; label: string; detail: string; color: string }> = [
  { id: "highest_gpa", label: "Highest GPA", detail: "Rank grade-impact work first.", color: "#6D3DF2" },
  { id: "less_stress", label: "Less Stress", detail: "Spread work before overload.", color: "#16A34A" },
  { id: "athletic_performance", label: "Athletic Performance", detail: "Protect practice and recovery.", color: "#2563EB" },
  { id: "life_balance", label: "Life Balance", detail: "Balance school, work, and life.", color: "#EA580C" },
  { id: "high_achievement", label: "High Achievement", detail: "Push ambitious focus windows.", color: "#9333EA" }
];

export const frictionPointOptions: Array<{ id: FrictionPoint; label: string }> = [
  { id: "procrastination", label: "Procrastination" },
  { id: "exam_anxiety", label: "Exam Anxiety" },
  { id: "overcommitment", label: "Overcommitment" },
  { id: "focus_issues", label: "Focus Issues" },
  { id: "forgetfulness", label: "Forgetfulness" }
];

export const widgetDNAOptions: Array<{ id: WidgetDNA; label: string; detail: string; color: string }> = [
  { id: "exam_countdown", label: "Exam Countdown", detail: "What matters next", color: "#6D3DF2" },
  { id: "grade_impact", label: "Grade Impact", detail: "Score pressure", color: "#111827" },
  { id: "future_risk", label: "Future Risk", detail: "Overload ahead", color: "#DB2777" },
  { id: "free_time_forecast", label: "Free Time", detail: "Protected windows", color: "#16A34A" },
  { id: "recovery_window", label: "Recovery", detail: "Reset time", color: "#0891B2" },
  { id: "life_balance", label: "Life Balance", detail: "School/life mix", color: "#2563EB" }
];

export const watchDNAOptions: Array<{ id: WatchDNA; label: string; color: string }> = [
  { id: "next_class", label: "Next Class", color: "#2563EB" },
  { id: "focus_window", label: "Focus Window", color: "#0891B2" },
  { id: "exam_risk", label: "Exam Risk", color: "#DB2777" },
  { id: "semester_progress", label: "Semester Progress", color: "#6D3DF2" },
  { id: "free_time", label: "Free Time", color: "#16A34A" }
];

export function lifeStudioReason(settings: UserSettings | undefined, assignments: Assignment[], courses: Course[]) {
  const behavior = osBehaviorOptions.find((item) => item.id === settings?.osBehavior) || osBehaviorOptions[0]!;
  const open = assignments.filter((item) => item.status !== "done" && item.status !== "archived");
  const highImpact = open.filter((item) => item.priority === "high").length;
  if (highImpact > 0) return `Start tonight because ${highImpact} high-impact item${highImpact === 1 ? "" : "s"} can move your ${behavior.label.toLowerCase()} goal.`;
  if (courses.length > 3) return `Your feed is spreading work across ${courses.length} classes to avoid overload.`;
  return `${behavior.label} mode is ranking the next useful step first.`;
}
