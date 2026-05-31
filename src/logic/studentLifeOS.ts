import {
  Assignment,
  Course,
  FocusSession,
  FrictionPoint,
  LifeInsight,
  LifeItem,
  LifeItemType,
  LifePriority,
  OSBehavior,
  StudentDNA,
  StudyNote,
  UserSettings,
  WidgetDNA,
  WatchDNA
} from "../models";
import {
  daysUntil,
  getCourseForAssignment,
  getNeedsReview,
  getOverdue,
  getSchedulableAssignments,
  getWeekLoad,
  scoreWork
} from "./planner";

export type StudentLifeOS = {
  dna: StudentDNA;
  behavior: OSBehavior;
  frictionPoints: FrictionPoint[];
  widgetDNA: WidgetDNA;
  watchDNA: WatchDNA;
  feedItems: LifeItem[];
  insights: LifeInsight[];
  workloadScore: number;
  stressScore: number;
  freeTimeHours: number;
  busiestDayLabel: string;
  focusWindowLabel: string;
  examClusterCount: number;
  recoveryWindowLabel: string;
};

export function buildStudentLifeOS({
  assignments,
  courses,
  focusSessions = [],
  notes = [],
  settings,
  now = new Date()
}: {
  assignments: Assignment[];
  courses: Course[];
  focusSessions?: FocusSession[];
  notes?: StudyNote[];
  settings?: UserSettings;
  now?: Date;
}): StudentLifeOS {
  const dna = resolveStudentDNA(settings);
  const behavior = settings?.osBehavior || defaultOSBehaviorForIdentity(dna.identity);
  const frictionPoints = settings?.frictionPoints || defaultFrictionPointsForIdentity(dna.identity);
  const widgetDNA = settings?.widgetDNA || defaultWidgetDNA(behavior);
  const watchDNA = settings?.watchDNA || defaultWatchDNA(behavior);
  const assignmentItems = getSchedulableAssignments(assignments).map((assignment) =>
    assignmentToLifeItem(assignment, courses, now)
  );
  const classItems = buildClassLifeItems(courses, now);
  const focusItems = buildFocusRecommendations(assignments, courses, focusSessions, settings, now);
  const noteItems = notes
    .filter((note) => note.pinned || note.kind === "today")
    .slice(0, 3)
    .map((note) => noteToLifeItem(note, now));
  const feedItems = [...assignmentItems, ...classItems, ...focusItems, ...noteItems]
    .map((item) => ({
      ...item,
      reason: item.reason || reasonForLifeItem(item, assignments, courses, behavior, now)
    }))
    .sort((a, b) => rankLifeItem(b, behavior, frictionPoints, now) - rankLifeItem(a, behavior, frictionPoints, now))
    .slice(0, 12);
  const weekLoad = getWeekLoad(assignments, now);
  const busiestDay = [...weekLoad].sort((a, b) => b.score - a.score)[0];
  const workloadScore = Math.min(100, Math.round(weekLoad.reduce((sum, day) => sum + day.score, 0) * 7));
  const overdue = getOverdue(assignments, now);
  const needsReview = getNeedsReview(assignments);
  const examClusterCount = countExamCluster(assignments, now);
  const freeTimeHours = estimateFreeTimeHours(assignments, courses, focusSessions, now);
  const stressScore = Math.min(
    100,
    Math.round(workloadScore * 0.58 + overdue.length * 10 + needsReview.length * 6 + examClusterCount * 9)
  );
  const focusWindowLabel = chooseFocusWindow(assignments, courses, now);
  const recoveryWindowLabel = freeTimeHours >= 5 ? "Tonight" : freeTimeHours >= 2 ? "After your first focus block" : "Tomorrow morning";
  const insights = buildLifeInsights({
    assignments,
    courses,
    feedItems,
    workloadScore,
    stressScore,
    freeTimeHours,
    busiestDayLabel: busiestDay?.label || "This week",
    focusWindowLabel,
    examClusterCount,
    now
  });

  return {
    dna,
    behavior,
    frictionPoints,
    widgetDNA,
    watchDNA,
    feedItems,
    insights,
    workloadScore,
    stressScore,
    freeTimeHours,
    busiestDayLabel: busiestDay?.label || "Balanced",
    focusWindowLabel,
    examClusterCount,
    recoveryWindowLabel
  };
}

export function resolveStudentDNA(settings?: UserSettings): StudentDNA {
  const inferredIdentity = settings?.profile?.persona === "athlete" ? "active_athlete" : "focused_scholar";
  return {
    identity: settings?.studentDNA?.identity || inferredIdentity,
    layout: settings?.studentDNA?.layout || "feed_first",
    colorVibe: settings?.studentDNA?.colorVibe || settings?.selectedTheme || "ocean"
  };
}

export function defaultWidgetDNA(behavior: OSBehavior): WidgetDNA {
  const priorities: WidgetDNA["priorities"] =
    behavior === "less_stress"
      ? ["free_time_forecast", "focus_window", "future_risk", "life_balance_ring"]
      : behavior === "athletic_performance"
        ? ["practice_countdown", "free_time_forecast", "focus_window", "next_class"]
        : ["exam_countdown", "grade_impact", "future_risk", "focus_window"];
  return { priorities, adaptiveOrdering: true };
}

export function defaultWatchDNA(behavior: OSBehavior): WatchDNA {
  return {
    complications:
      behavior === "life_balance"
        ? ["free_time", "focus_window", "next_class"]
        : ["next_class", "focus_window", "exam_risk", "semester_progress"],
    glanceDensity: behavior === "less_stress" ? "quiet" : "standard"
  };
}

export function lifePriorityForAssignment(assignment: Assignment, now = new Date()): LifePriority {
  if (assignment.needsReview || daysUntil(assignment.dueAt, now) < 0) return "critical";
  if (assignment.priority === "high" || assignment.kind === "exam") return "high";
  if (assignment.priority === "medium" || assignment.kind === "project") return "medium";
  return "low";
}

function assignmentToLifeItem(assignment: Assignment, courses: Course[], now: Date): LifeItem {
  const course = getCourseForAssignment(courses, assignment);
  const type: LifeItemType =
    assignment.kind === "worksheet" ? "assignment" : assignment.kind === "exam" ? "exam" : assignment.kind;
  return {
    id: `assignment-${assignment.id}`,
    title: assignment.title,
    type,
    dueAt: assignment.dueAt,
    courseId: assignment.courseId,
    sourceAssignmentId: assignment.id,
    priority: lifePriorityForAssignment(assignment, now),
    estimatedMinutes: assignment.estimatedMinutes,
    progress: assignment.progress,
    color: course?.color,
    iconKey: course?.iconKey,
    isFlexible: true
  };
}

function buildClassLifeItems(courses: Course[], now: Date): LifeItem[] {
  const today = weekdayLabel(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowLabel = weekdayLabel(tomorrow);
  return courses.flatMap((course) =>
    course.meetings
      .filter((meeting) => meeting.day === today || meeting.day === tomorrowLabel)
      .slice(0, 2)
      .map((meeting) => {
        const date = meeting.day === today ? now : tomorrow;
        const startsAt = dateWithTime(date, meeting.startTime).toISOString();
        const endsAt = dateWithTime(date, meeting.endTime).toISOString();
        return {
          id: `class-${course.id}-${meeting.id}`,
          title: course.code || course.name,
          type: "class" as const,
          startsAt,
          endsAt,
          courseId: course.id,
          location: meeting.location || course.room,
          priority: "medium" as const,
          color: course.color,
          iconKey: course.iconKey,
          isFlexible: false,
          reason: meeting.day === today ? "Next class stays fixed in your OS." : "Tomorrow's class shapes the forecast."
        };
      })
  );
}

function buildFocusRecommendations(
  assignments: Assignment[],
  courses: Course[],
  sessions: FocusSession[],
  settings: UserSettings | undefined,
  now: Date
): LifeItem[] {
  const completedToday = sessions.filter((session) => {
    if (session.status !== "completed") return false;
    return dateKey(session.endedAt || session.startedAt) === dateKey(now.toISOString());
  }).length;
  const next = getSchedulableAssignments(assignments)
    .sort((a, b) => scoreWork(b, now) - scoreWork(a, now))[0];
  if (!next) return [];
  const course = getCourseForAssignment(courses, next);
  const minutes = completedToday > 1 ? 20 : Math.min(Math.max(settings?.focusDefaultMinutes || 25, 20), 45);
  const start = new Date(now.getTime() + 60 * 60 * 1000);
  return [
    {
      id: `focus-${next.id}`,
      title: `${minutes}m focus: ${next.title}`,
      type: "focus",
      startsAt: start.toISOString(),
      endsAt: new Date(start.getTime() + minutes * 60 * 1000).toISOString(),
      courseId: next.courseId,
      sourceAssignmentId: next.id,
      priority: next.kind === "exam" ? "high" : "medium",
      estimatedMinutes: minutes,
      color: course?.color,
      iconKey: "timer",
      isFlexible: true,
      reason: focusReason(next, assignments, now)
    }
  ];
}

function noteToLifeItem(note: StudyNote, now: Date): LifeItem {
  return {
    id: `note-${note.id}`,
    title: note.title,
    type: "personal",
    startsAt: note.updatedAt || now.toISOString(),
    courseId: note.courseId,
    sourceAssignmentId: note.assignmentId,
    priority: note.pinned ? "medium" : "low",
    iconKey: "note",
    isFlexible: true,
    reason: note.pinned ? "Pinned context should stay visible today." : "Recent note connected to today."
  };
}

function rankLifeItem(item: LifeItem, behavior: OSBehavior, frictionPoints: FrictionPoint[], now: Date) {
  const time = item.dueAt || item.startsAt;
  const days = time ? daysUntil(time, now) : 7;
  const urgency = Number.isFinite(days) ? Math.max(0, 90 - Math.max(days, -1) * 16) : 8;
  const priority = item.priority === "critical" ? 55 : item.priority === "high" ? 34 : item.priority === "medium" ? 18 : 6;
  const typeBoost =
    item.type === "exam"
      ? behavior === "highest_gpa" || behavior === "high_achievement" ? 35 : 24
      : item.type === "sport"
        ? behavior === "athletic_performance" ? 30 : 6
        : item.type === "focus"
          ? frictionPoints.includes("focus_issues") || frictionPoints.includes("procrastination") ? 30 : 16
          : item.type === "class"
            ? 12
            : 10;
  const recoveryPenalty = behavior === "less_stress" && item.priority === "low" ? -5 : 0;
  return urgency + priority + typeBoost + recoveryPenalty;
}

function reasonForLifeItem(
  item: LifeItem,
  assignments: Assignment[],
  courses: Course[],
  behavior: OSBehavior,
  now: Date
) {
  if (item.sourceAssignmentId) {
    const assignment = assignments.find((candidate) => candidate.id === item.sourceAssignmentId);
    if (assignment) return focusReason(assignment, assignments, now);
  }
  if (item.type === "class") {
    const course = item.courseId ? courses.find((candidate) => candidate.id === item.courseId) : undefined;
    return course ? `${course.code || course.name} anchors this part of your day.` : "Fixed class time anchors the feed.";
  }
  if (behavior === "less_stress") return "Kept visible to reduce last-minute pressure.";
  return "Ranked from urgency, load, and your OS behavior.";
}

function focusReason(assignment: Assignment, assignments: Assignment[], now: Date) {
  const days = daysUntil(assignment.dueAt, now);
  const week = getWeekLoad(assignments, now);
  const peakDay = [...week].sort((a, b) => b.score - a.score)[0];
  if (assignment.needsReview) return "Review first so widgets and reminders trust it.";
  if (days <= 0) return "Start now because it is due today.";
  if (assignment.kind === "exam") return `Start early because ${assignment.title} affects your exam week.`;
  if (peakDay?.heavy) return `Start tonight because ${peakDay.label} is overloaded.`;
  return `Start with one block because it is due in ${days} day${days === 1 ? "" : "s"}.`;
}

function buildLifeInsights({
  assignments,
  courses,
  feedItems,
  workloadScore,
  stressScore,
  freeTimeHours,
  busiestDayLabel,
  focusWindowLabel,
  examClusterCount,
  now
}: {
  assignments: Assignment[];
  courses: Course[];
  feedItems: LifeItem[];
  workloadScore: number;
  stressScore: number;
  freeTimeHours: number;
  busiestDayLabel: string;
  focusWindowLabel: string;
  examClusterCount: number;
  now: Date;
}): LifeInsight[] {
  const conflicts = detectActivityConflicts(feedItems);
  const overdue = getOverdue(assignments, now);
  const needsReview = getNeedsReview(assignments);
  const next = getSchedulableAssignments(assignments)
    .sort((a, b) => scoreWork(b, now) - scoreWork(a, now))[0];
  const nextCourse = next ? getCourseForAssignment(courses, next) : undefined;
  const insights: LifeInsight[] = [
    {
      id: "workload-score",
      title: workloadScore >= 70 ? "High-load week" : workloadScore >= 38 ? "Steady week" : "Balanced week",
      detail: `${workloadScore}/100 workload score`,
      reason: workloadScore >= 70 ? `${busiestDayLabel} is carrying the most weight.` : "Your due dates are spread out enough to plan calmly.",
      priority: workloadScore >= 70 ? "high" : "medium",
      itemIds: feedItems.slice(0, 3).map((item) => item.id)
    },
    {
      id: "free-time",
      title: `${freeTimeHours.toFixed(1)}h free forecast`,
      detail: `Best window: ${focusWindowLabel}`,
      reason: "Calculated from fixed class time and estimated open work this week.",
      priority: freeTimeHours < 2 ? "high" : "medium"
    },
    {
      id: "stress-score",
      title: `${stressScore}/100 load pressure`,
      detail: stressScore >= 72 ? "Recovery needs protection" : "Pressure is manageable",
      reason: "Combines workload, overdue work, review flags, and exam clustering.",
      priority: stressScore >= 72 ? "high" : "medium"
    }
  ];
  if (next) {
    insights.unshift({
      id: "grade-impact",
      title: next.kind === "exam" ? "Exam priority" : "Grade-impact priority",
      detail: nextCourse ? `${nextCourse.code || nextCourse.name}: ${next.title}` : next.title,
      reason: focusReason(next, assignments, now),
      priority: next.kind === "exam" || next.priority === "high" ? "high" : "medium",
      itemIds: [`assignment-${next.id}`]
    });
  }
  if (examClusterCount > 1) {
    insights.push({
      id: "exam-cluster",
      title: "Exam cluster ahead",
      detail: `${examClusterCount} exams are close together`,
      reason: "Spread review blocks now so the cluster does not become one cram session.",
      priority: "high"
    });
  }
  if (overdue.length > 0 || needsReview.length > 0) {
    insights.push({
      id: "trust-cleanup",
      title: overdue.length > 0 ? "Catch-up first" : "Review inbox first",
      detail: overdue.length > 0 ? `${overdue.length} overdue item(s)` : `${needsReview.length} item(s) need review`,
      reason: "The OS keeps uncertain or late work above lower-risk tasks.",
      priority: "critical"
    });
  }
  if (conflicts.length > 0) {
    insights.push({
      id: "activity-conflict",
      title: "Possible conflict",
      detail: conflicts[0] || "Two commitments overlap",
      reason: "Fixed activities should not compete with flexible study blocks.",
      priority: "high"
    });
  }
  return insights.slice(0, 7);
}

function detectActivityConflicts(items: LifeItem[]) {
  const fixed = items
    .filter((item) => item.startsAt && item.endsAt)
    .sort((a, b) => new Date(a.startsAt || 0).getTime() - new Date(b.startsAt || 0).getTime());
  const conflicts: string[] = [];
  fixed.forEach((item, index) => {
    const next = fixed[index + 1];
    if (!next || !item.endsAt || !next.startsAt) return;
    if (new Date(item.endsAt).getTime() > new Date(next.startsAt).getTime()) {
      conflicts.push(`${item.title} overlaps ${next.title}.`);
    }
  });
  return conflicts;
}

function estimateFreeTimeHours(assignments: Assignment[], courses: Course[], sessions: FocusSession[], now: Date) {
  const weekAssignments = getSchedulableAssignments(assignments).filter((assignment) => {
    const days = daysUntil(assignment.dueAt, now);
    return days >= 0 && days <= 6 && assignment.status !== "done";
  });
  const workloadHours = weekAssignments.reduce((sum, assignment) => sum + Math.max(15, assignment.estimatedMinutes || 45), 0) / 60;
  const classHours = courses.reduce((sum, course) => {
    return sum + course.meetings.length * 0.85;
  }, 0);
  const completedFocusHours = sessions
    .filter((session) => session.status === "completed")
    .reduce((sum, session) => sum + session.durationMinutes / 60, 0);
  return Math.max(0, 28 - workloadHours - classHours + Math.min(completedFocusHours, 4));
}

function countExamCluster(assignments: Assignment[], now: Date) {
  const exams = getSchedulableAssignments(assignments)
    .filter((assignment) => assignment.kind === "exam")
    .filter((assignment) => {
      const days = daysUntil(assignment.dueAt, now);
      return days >= 0 && days <= 10;
    });
  return exams.length;
}

function chooseFocusWindow(assignments: Assignment[], courses: Course[], now: Date) {
  const morningClasses = courses.flatMap((course) => course.meetings).filter((meeting) => meeting.startTime < "10:30").length;
  const dueSoon = getSchedulableAssignments(assignments).filter((assignment) => daysUntil(assignment.dueAt, now) <= 2).length;
  if (dueSoon >= 3) return "Tonight";
  if (morningClasses >= 3) return "Late afternoon";
  return "After school";
}

function defaultOSBehaviorForIdentity(identity: StudentDNA["identity"]): OSBehavior {
  if (identity === "active_athlete") return "athletic_performance";
  if (identity === "balanced_wellness") return "life_balance";
  if (identity === "competitive_leader" || identity === "research_driven") return "high_achievement";
  return "highest_gpa";
}

function defaultFrictionPointsForIdentity(identity: StudentDNA["identity"]): FrictionPoint[] {
  if (identity === "balanced_wellness") return ["overcommitment"];
  if (identity === "working_professional") return ["forgetfulness", "overcommitment"];
  if (identity === "focused_scholar") return ["exam_anxiety"];
  return ["procrastination"];
}

function weekdayLabel(date: Date) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()] || "Mon";
}

function dateWithTime(date: Date, time: string) {
  const [hour = 0, minute = 0] = time.split(":").map((part) => Number.parseInt(part, 10));
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function dateKey(iso: string) {
  return iso.slice(0, 10);
}
