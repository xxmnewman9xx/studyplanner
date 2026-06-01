import {
  Assignment,
  Course,
  FocusSession,
  StudentLifeFeature,
  StudentLifeMemory,
  StudentLifeRecommendationAction,
  StudyNote,
  UserSettings,
  WidgetPreset,
  WidgetType
} from "../models";
import {
  daysUntil,
  getFocusCompletionStats,
  getNeedsReview,
  getRecommendedFocusDuration,
  getWeekLoad,
  scoreWork
} from "./planner";

type ForecastState = StudentLifeMemory["forecast"]["snapshots"][number]["state"];

export type FeatureDepthValue = {
  oneDay: string;
  sevenDays: string;
  thirtyDays: string;
  ninetyDays: string;
};

export type FeatureDepthInsight = FeatureDepthValue & {
  title: string;
  learned: string;
  memory: string;
  adaptation: string;
  personalization: string;
  recommendation: string;
  retention: string;
};

export type StudentLifeContext = {
  memory: StudentLifeMemory;
  ageDays: number;
  featureInsights: Record<StudentLifeFeature, FeatureDepthInsight>;
  feed: {
    assignment?: Assignment;
    course?: Course;
    reason: string;
    learned: string;
    adaptation: string;
    recommendation: string;
    nextAction: string;
    retention: string;
    score: number;
  };
  forecast: {
    state: ForecastState;
    riskScore: number;
    title: string;
    detail: string;
    learned: string;
    adaptation: string;
    recommendation: string;
    retention: string;
    heavyDayCount: number;
  };
  classes: {
    course?: Course;
    learned: string;
    adaptation: string;
    recommendation: string;
    retention: string;
  };
  focus: {
    assignment?: Assignment;
    course?: Course;
    minutes: number;
    learned: string;
    adaptation: string;
    recommendation: string;
    retention: string;
  };
  notes: {
    course?: Course;
    learned: string;
    adaptation: string;
    recommendation: string;
    retention: string;
  };
  widgets: {
    type: WidgetType;
    title: string;
    detail: string;
    learned: string;
    adaptation: string;
    recommendation: string;
    retention: string;
  };
  watch: {
    signal: string;
    action: string;
    escalation: string;
    learned: string;
    adaptation: string;
    recommendation: string;
    retention: string;
  };
};

const studentLifeFeatures: StudentLifeFeature[] = [
  "home",
  "forecast",
  "classes",
  "focus",
  "notes",
  "widgets",
  "watch"
];

export function createStudentLifeMemory(now = new Date()): StudentLifeMemory {
  const timestamp = now.toISOString();
  return {
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    featureVisits: {
      home: 0,
      forecast: 0,
      classes: 0,
      focus: 0,
      notes: 0,
      widgets: 0,
      watch: 0
    },
    featureLastSeenAt: {},
    recommendationEvents: [],
    home: {
      topActionSeenCount: {},
      completedTopActions: 0,
      delayedTopActions: 0
    },
    forecast: {
      snapshots: [],
      warningsSeen: 0,
      interventionsAccepted: 0
    },
    focus: {
      completedSessions: 0,
      stoppedSessions: 0,
      totalMinutes: 0,
      assignmentStats: {},
      courseStats: {}
    },
    notes: {
      created: 0,
      convertedToTasks: 0,
      pinned: 0,
      resurfaced: 0,
      courseCounts: {}
    },
    widgets: {
      savedCount: 0,
      recommendedTypeCounts: {}
    },
    watch: {
      signalsGenerated: 0,
      focusStarts: 0,
      smartSnoozes: 0
    }
  };
}

export function ensureStudentLifeMemory(memory?: StudentLifeMemory | null, now = new Date()) {
  if (!memory || memory.version !== 1) return createStudentLifeMemory(now);
  const fallback = createStudentLifeMemory(now);
  return {
    ...fallback,
    ...memory,
    featureVisits: { ...fallback.featureVisits, ...memory.featureVisits },
    featureLastSeenAt: { ...memory.featureLastSeenAt },
    recommendationEvents: (memory.recommendationEvents || []).slice(0, 120),
    home: {
      ...fallback.home,
      ...memory.home,
      topActionSeenCount: { ...(memory.home?.topActionSeenCount || {}) }
    },
    forecast: {
      ...fallback.forecast,
      ...memory.forecast,
      snapshots: (memory.forecast?.snapshots || []).slice(0, 45)
    },
    focus: {
      ...fallback.focus,
      ...memory.focus,
      assignmentStats: { ...(memory.focus?.assignmentStats || {}) },
      courseStats: { ...(memory.focus?.courseStats || {}) }
    },
    notes: {
      ...fallback.notes,
      ...memory.notes,
      courseCounts: { ...(memory.notes?.courseCounts || {}) }
    },
    widgets: {
      ...fallback.widgets,
      ...memory.widgets,
      recommendedTypeCounts: { ...(memory.widgets?.recommendedTypeCounts || {}) }
    },
    watch: {
      ...fallback.watch,
      ...memory.watch
    }
  } satisfies StudentLifeMemory;
}

export function buildStudentLifeContext({
  memory,
  assignments,
  courses,
  notes,
  focusSessions,
  widgetPresets,
  settings,
  now = new Date()
}: {
  memory?: StudentLifeMemory | null;
  assignments: Assignment[];
  courses: Course[];
  notes: StudyNote[];
  focusSessions: FocusSession[];
  widgetPresets: WidgetPreset[];
  settings?: UserSettings;
  now?: Date;
}): StudentLifeContext {
  const safeMemory = ensureStudentLifeMemory(memory, now);
  const ageDays = daysBetween(safeMemory.createdAt, now);
  const feed = buildFeedSignal(safeMemory, assignments, courses, notes, focusSessions, settings, now);
  const forecast = buildForecastSignal(safeMemory, assignments, courses, focusSessions, now);
  const classes = buildClassSignal(safeMemory, assignments, courses, notes, focusSessions);
  const focus = buildFocusSignal(safeMemory, feed.assignment, feed.course, assignments, focusSessions, settings, now);
  const notesSignal = buildNotesSignal(safeMemory, courses, notes);
  const widgets = buildWidgetSignal(safeMemory, forecast.state, feed.assignment, courses, widgetPresets);
  const watch = buildWatchSignal(safeMemory, feed, forecast, focus);
  const featureInsights = buildFeatureInsights({
    memory: safeMemory,
    ageDays,
    feed,
    forecast,
    classes,
    focus,
    notesSignal,
    widgets,
    watch
  });

  return {
    memory: safeMemory,
    ageDays,
    featureInsights,
    feed,
    forecast,
    classes,
    focus,
    notes: notesSignal,
    widgets,
    watch
  };
}

export function recordStudentLifeFeatureVisit(
  memory: StudentLifeMemory | undefined | null,
  feature: StudentLifeFeature,
  now = new Date()
): StudentLifeMemory {
  const current = ensureStudentLifeMemory(memory, now);
  const timestamp = now.toISOString();
  return {
    ...current,
    updatedAt: timestamp,
    featureVisits: {
      ...current.featureVisits,
      [feature]: (current.featureVisits[feature] || 0) + 1
    },
    featureLastSeenAt: {
      ...current.featureLastSeenAt,
      [feature]: timestamp
    }
  };
}

export function recordStudentLifeRecommendation(
  memory: StudentLifeMemory | undefined | null,
  event: Omit<StudentLifeMemory["recommendationEvents"][number], "id" | "createdAt">,
  now = new Date()
): StudentLifeMemory {
  const current = ensureStudentLifeMemory(memory, now);
  const timestamp = now.toISOString();
  return {
    ...current,
    updatedAt: timestamp,
    recommendationEvents: [
      {
        ...event,
        id: `life-event-${now.getTime()}-${current.recommendationEvents.length}`,
        createdAt: timestamp
      },
      ...current.recommendationEvents
    ].slice(0, 120)
  };
}

export function recordStudentLifeTopAction(
  memory: StudentLifeMemory | undefined | null,
  assignmentId: string | undefined,
  now = new Date()
): StudentLifeMemory {
  const current = ensureStudentLifeMemory(memory, now);
  if (!assignmentId) return current;
  const timestamp = now.toISOString();
  return {
    ...current,
    updatedAt: timestamp,
    home: {
      ...current.home,
      lastTopActionId: assignmentId,
      topActionSeenCount: {
        ...current.home.topActionSeenCount,
        [assignmentId]: (current.home.topActionSeenCount[assignmentId] || 0) + 1
      }
    }
  };
}

export function recordStudentLifeAssignmentCompleted(
  memory: StudentLifeMemory | undefined | null,
  assignment: Assignment | undefined,
  now = new Date()
): StudentLifeMemory {
  let current = ensureStudentLifeMemory(memory, now);
  if (!assignment) return current;
  current = recordStudentLifeRecommendation(current, {
    feature: "home",
    action: "completed",
    assignmentId: assignment.id,
    courseId: assignment.courseId
  }, now);
  return {
    ...current,
    home: {
      ...current.home,
      completedTopActions:
        current.home.lastTopActionId === assignment.id
          ? current.home.completedTopActions + 1
          : current.home.completedTopActions
    }
  };
}

export function recordStudentLifeForecastSnapshot(
  memory: StudentLifeMemory | undefined | null,
  assignments: Assignment[],
  focusSessions: FocusSession[],
  now = new Date()
): StudentLifeMemory {
  const current = ensureStudentLifeMemory(memory, now);
  const signal = calculateForecastState(assignments, focusSessions, now);
  const dateKey = dateKeyFromDate(now);
  const existing = current.forecast.snapshots[0];
  if (existing && existing.dateKey === dateKey && existing.state === signal.state && existing.riskScore === signal.riskScore) {
    return current;
  }
  const timestamp = now.toISOString();
  return {
    ...current,
    updatedAt: timestamp,
    forecast: {
      ...current.forecast,
      warningsSeen: signal.state === "warning" || signal.state === "storm"
        ? current.forecast.warningsSeen + 1
        : current.forecast.warningsSeen,
      snapshots: [
        {
          dateKey,
          state: signal.state,
          riskScore: signal.riskScore,
          heavyDayCount: signal.heavyDayCount,
          openCount: signal.openCount,
          completedFocusMinutes: signal.completedFocusMinutes,
          topAssignmentId: signal.topAssignmentId,
          createdAt: timestamp
        },
        ...current.forecast.snapshots.filter((snapshot) => snapshot.dateKey !== dateKey)
      ].slice(0, 45)
    }
  };
}

export function recordStudentLifeFocusSession(
  memory: StudentLifeMemory | undefined | null,
  session: FocusSession,
  assignment: Assignment | undefined,
  now = new Date()
): StudentLifeMemory {
  const current = ensureStudentLifeMemory(memory, now);
  const timestamp = now.toISOString();
  const duration = Math.max(1, session.durationMinutes || 0);
  const completed = session.status === "completed" ? 1 : 0;
  const stopped = session.status === "stopped" || session.status === "paused" ? 1 : 0;
  const action: StudentLifeRecommendationAction = completed ? "completed" : stopped ? "snoozed" : "started";
  const assignmentStats = assignment
    ? current.focus.assignmentStats[assignment.id] || { sessions: 0, completed: 0, stopped: 0, totalMinutes: 0, lastAt: timestamp }
    : undefined;
  const courseStats = assignment
    ? current.focus.courseStats[assignment.courseId] || { sessions: 0, completed: 0, stopped: 0, totalMinutes: 0, lastAt: timestamp }
    : undefined;

  return {
    ...current,
    updatedAt: timestamp,
    recommendationEvents: [
      {
        id: `life-event-${now.getTime()}-${current.recommendationEvents.length}`,
        feature: "focus" as const,
        action,
        assignmentId: session.assignmentId,
        courseId: assignment?.courseId,
        createdAt: timestamp
      },
      ...current.recommendationEvents
    ].slice(0, 120),
    focus: {
      ...current.focus,
      completedSessions: current.focus.completedSessions + completed,
      stoppedSessions: current.focus.stoppedSessions + stopped,
      totalMinutes: current.focus.totalMinutes + (completed ? duration : 0),
      preferredDurationMinutes: inferPreferredDuration(current.focus.preferredDurationMinutes, session),
      assignmentStats: assignment
        ? {
            ...current.focus.assignmentStats,
            [assignment.id]: {
              sessions: assignmentStats!.sessions + 1,
              completed: assignmentStats!.completed + completed,
              stopped: assignmentStats!.stopped + stopped,
              totalMinutes: assignmentStats!.totalMinutes + duration,
              lastAt: timestamp
            }
          }
        : current.focus.assignmentStats,
      courseStats: assignment
        ? {
            ...current.focus.courseStats,
            [assignment.courseId]: {
              sessions: courseStats!.sessions + 1,
              completed: courseStats!.completed + completed,
              stopped: courseStats!.stopped + stopped,
              totalMinutes: courseStats!.totalMinutes + duration,
              lastAt: timestamp
            }
          }
        : current.focus.courseStats
    }
  };
}

export function recordStudentLifeNoteCreated(
  memory: StudentLifeMemory | undefined | null,
  note: Pick<StudyNote, "courseId" | "pinned">,
  now = new Date()
): StudentLifeMemory {
  const current = ensureStudentLifeMemory(memory, now);
  const timestamp = now.toISOString();
  const courseId = note.courseId;
  return {
    ...current,
    updatedAt: timestamp,
    notes: {
      ...current.notes,
      created: current.notes.created + 1,
      pinned: current.notes.pinned + (note.pinned ? 1 : 0),
      courseCounts: courseId
        ? {
            ...current.notes.courseCounts,
            [courseId]: (current.notes.courseCounts[courseId] || 0) + 1
          }
        : current.notes.courseCounts
    }
  };
}

export function recordStudentLifeNoteConverted(
  memory: StudentLifeMemory | undefined | null,
  note: StudyNote | undefined,
  assignment: Assignment | undefined,
  now = new Date()
): StudentLifeMemory {
  const current = ensureStudentLifeMemory(memory, now);
  const timestamp = now.toISOString();
  return {
    ...recordStudentLifeRecommendation(current, {
      feature: "notes",
      action: "converted",
      noteId: note?.id,
      assignmentId: assignment?.id,
      courseId: assignment?.courseId || note?.courseId
    }, now),
    updatedAt: timestamp,
    notes: {
      ...current.notes,
      convertedToTasks: current.notes.convertedToTasks + 1
    }
  };
}

export function recordStudentLifeNotePinned(
  memory: StudentLifeMemory | undefined | null,
  now = new Date()
): StudentLifeMemory {
  const current = ensureStudentLifeMemory(memory, now);
  return {
    ...current,
    updatedAt: now.toISOString(),
    notes: {
      ...current.notes,
      pinned: current.notes.pinned + 1
    }
  };
}

export function recordStudentLifeWidgetSaved(
  memory: StudentLifeMemory | undefined | null,
  widgetType: WidgetType,
  now = new Date()
): StudentLifeMemory {
  const current = ensureStudentLifeMemory(memory, now);
  const timestamp = now.toISOString();
  return {
    ...recordStudentLifeRecommendation(current, {
      feature: "widgets",
      action: "saved",
      widgetType
    }, now),
    updatedAt: timestamp,
    widgets: {
      ...current.widgets,
      savedCount: current.widgets.savedCount + 1,
      lastRecommendedType: widgetType,
      recommendedTypeCounts: {
        ...current.widgets.recommendedTypeCounts,
        [widgetType]: (current.widgets.recommendedTypeCounts[widgetType] || 0) + 1
      }
    }
  };
}

export function recordStudentLifeWidgetRecommended(
  memory: StudentLifeMemory | undefined | null,
  widgetType: WidgetType,
  now = new Date()
): StudentLifeMemory {
  const current = ensureStudentLifeMemory(memory, now);
  const timestamp = now.toISOString();
  return {
    ...current,
    updatedAt: timestamp,
    widgets: {
      ...current.widgets,
      lastRecommendedType: widgetType,
      recommendedTypeCounts: {
        ...current.widgets.recommendedTypeCounts,
        [widgetType]: (current.widgets.recommendedTypeCounts[widgetType] || 0) + 1
      }
    }
  };
}

export function recordStudentLifeWatchSignal(
  memory: StudentLifeMemory | undefined | null,
  signal: string,
  now = new Date()
): StudentLifeMemory {
  const current = ensureStudentLifeMemory(memory, now);
  const timestamp = now.toISOString();
  if (current.watch.lastSignal === signal) return current;
  return {
    ...current,
    updatedAt: timestamp,
    watch: {
      ...current.watch,
      signalsGenerated: current.watch.signalsGenerated + 1,
      lastSignal: signal
    }
  };
}

export function seedStudentLifeMemoryForAge({
  ageDays,
  assignments,
  courses,
  now = new Date()
}: {
  ageDays: number;
  assignments: Assignment[];
  courses: Course[];
  now?: Date;
}) {
  const createdAt = new Date(now);
  createdAt.setDate(createdAt.getDate() - ageDays);
  let memory = createStudentLifeMemory(createdAt);
  const top = assignments
    .filter((assignment) => assignment.status !== "done" && assignment.status !== "archived")
    .slice()
    .sort((left, right) => scoreWork(right, now) - scoreWork(left, now))[0] || assignments[0];
  const topCourse = top ? courses.find((course) => course.id === top.courseId) : undefined;
  const completedSessions = ageDays >= 30 ? 18 : ageDays >= 7 ? 4 : 0;
  const totalMinutes = ageDays >= 30 ? 520 : ageDays >= 7 ? 95 : 0;
  memory = {
    ...memory,
    updatedAt: now.toISOString(),
    featureVisits: {
      home: Math.max(1, ageDays * 2),
      forecast: Math.max(1, Math.floor(ageDays / 2)),
      classes: Math.max(1, Math.floor(ageDays / 3)),
      focus: completedSessions + 1,
      notes: Math.max(1, Math.floor(ageDays / 4)),
      widgets: ageDays >= 30 ? 7 : 1,
      watch: ageDays >= 30 ? 24 : 1
    },
    home: {
      lastTopActionId: top?.id,
      topActionSeenCount: top ? { [top.id]: Math.max(1, Math.floor(ageDays / 3)) } : {},
      completedTopActions: ageDays >= 30 ? 11 : ageDays >= 7 ? 2 : 0,
      delayedTopActions: ageDays >= 30 ? 3 : 0
    },
    forecast: {
      snapshots: buildSeedForecastSnapshots(ageDays, assignments, now),
      warningsSeen: ageDays >= 30 ? 8 : ageDays >= 7 ? 2 : 0,
      interventionsAccepted: ageDays >= 30 ? 5 : ageDays >= 7 ? 1 : 0
    },
    focus: {
      completedSessions,
      stoppedSessions: ageDays >= 30 ? 4 : 1,
      totalMinutes,
      preferredDurationMinutes: ageDays >= 30 ? 20 : undefined,
      assignmentStats: top
        ? {
            [top.id]: {
              sessions: Math.max(1, completedSessions),
              completed: completedSessions,
              stopped: ageDays >= 30 ? 2 : 0,
              totalMinutes,
              lastAt: now.toISOString()
            }
          }
        : {},
      courseStats: topCourse
        ? {
            [topCourse.id]: {
              sessions: Math.max(1, completedSessions),
              completed: completedSessions,
              stopped: ageDays >= 30 ? 2 : 0,
              totalMinutes,
              lastAt: now.toISOString()
            }
          }
        : {}
    },
    notes: {
      created: ageDays >= 30 ? 14 : ageDays >= 7 ? 3 : 0,
      convertedToTasks: ageDays >= 30 ? 4 : 0,
      pinned: ageDays >= 30 ? 3 : 0,
      resurfaced: ageDays >= 30 ? 9 : 0,
      courseCounts: topCourse ? { [topCourse.id]: ageDays >= 30 ? 7 : 1 } : {}
    },
    widgets: {
      savedCount: ageDays >= 30 ? 3 : 0,
      lastRecommendedType: ageDays >= 30 ? "week" : "today",
      recommendedTypeCounts: ageDays >= 30 ? { week: 4, focus: 3, today: 2 } : { today: 1 }
    },
    watch: {
      signalsGenerated: ageDays >= 30 ? 36 : 1,
      focusStarts: ageDays >= 30 ? 8 : 0,
      smartSnoozes: ageDays >= 30 ? 5 : 0,
      lastSignal: ageDays >= 30 ? "Start the shorter review block before the heavy day." : "Show the next task."
    }
  };
  return memory;
}

function buildFeedSignal(
  memory: StudentLifeMemory,
  assignments: Assignment[],
  courses: Course[],
  notes: StudyNote[],
  focusSessions: FocusSession[],
  settings: UserSettings | undefined,
  now: Date
): StudentLifeContext["feed"] {
  const candidates = assignments
    .filter((assignment) => assignment.status !== "done" && assignment.status !== "archived")
    .map((assignment) => {
      const course = courses.find((item) => item.id === assignment.courseId);
      const noteCount = notes.filter((note) => note.assignmentId === assignment.id || note.courseId === assignment.courseId).length;
      const courseStats = memory.focus.courseStats[assignment.courseId];
      const stoppedPenalty = courseStats && courseStats.stopped > courseStats.completed ? 8 : 0;
      const actualAverage = courseStats && courseStats.sessions > 0 ? courseStats.totalMinutes / courseStats.sessions : 0;
      const overrunBoost = actualAverage > assignment.estimatedMinutes * 0.75 ? 7 : 0;
      const repeatSeenBoost = Math.min(8, (memory.home.topActionSeenCount[assignment.id] || 0) * 2);
      const noteBoost = Math.min(6, noteCount * 2);
      const stressBoost = (settings?.stressLevel === "high" || settings?.profile?.stressLevel === "high") && assignment.estimatedMinutes <= 30 ? 5 : 0;
      return {
        assignment,
        course,
        score: scoreWork(assignment, now) + stoppedPenalty + overrunBoost + repeatSeenBoost + noteBoost + stressBoost,
        noteCount,
        actualAverage
      };
    })
    .sort((left, right) => right.score - left.score);

  const top = candidates[0];
  if (!top) {
    return {
      reason: "No open work is competing for attention.",
      learned: "No study pattern yet.",
      adaptation: "The feed will switch from setup to action after the first reviewed assignment.",
      recommendation: "Scan a syllabus or quick-capture the next task.",
      nextAction: "Next: capture one task.",
      retention: valueGained(memory, "home"),
      score: 0
    };
  }

  const due = daysUntil(top.assignment.dueAt, now);
  const dueText = Number.isFinite(due)
    ? due <= 0
      ? "due now"
      : due === 1
        ? "due tomorrow"
        : `due in ${due} days`
    : "needs a date check";
  const kindText = top.assignment.kind === "exam" ? "exam" : top.assignment.priority === "high" ? "high priority" : "task";
  const courseText = top.course?.code || "this class";
  const averageMinutes = top.actualAverage ? Math.round(top.actualAverage) : 0;
  const learnedPattern = averageMinutes
    ? `${courseText} averages ${averageMinutes} min.`
    : top.noteCount > 0
      ? `${top.noteCount} saved note${top.noteCount === 1 ? "" : "s"} may help.`
      : memory.focus.completedSessions > 0
        ? `${memory.focus.completedSessions} focus sessions logged.`
        : "No study pattern yet.";
  const completedToday = getFocusCompletionStats(focusSessions, now).completedToday;
  const recommendation = averageMinutes
    ? `Use a ${averageMinutes}-min first block.`
    : top.noteCount > 0
      ? "Open saved notes before starting."
      : due <= 0
        ? "Start with the due-now task."
        : "Start with the closest deadline.";
  const reason = averageMinutes
    ? `${dueText}; ${averageMinutes}-min ${courseText} avg.`
    : `${dueText}; ${kindText}.`;

  return {
    assignment: top.assignment,
    course: top.course,
    reason,
    learned: learnedPattern,
    adaptation: averageMinutes
      ? `Ranking uses ${courseText}'s ${averageMinutes}-min focus average.`
      : completedToday > 0
        ? `${completedToday} completed focus session${completedToday === 1 ? "" : "s"} today affects the feed.`
        : "Ranking is using deadlines until behavior exists.",
    recommendation,
    nextAction: `Next: ${shorten(top.assignment.title)}.`,
    retention: valueGained(memory, "home"),
    score: top.score
  };
}

function buildForecastSignal(
  memory: StudentLifeMemory,
  assignments: Assignment[],
  courses: Course[],
  focusSessions: FocusSession[],
  now: Date
): StudentLifeContext["forecast"] {
  const signal = calculateForecastState(assignments, focusSessions, now);
  const previous = memory.forecast.snapshots.find((snapshot) => snapshot.dateKey !== dateKeyFromDate(now));
  const trend = previous ? trendText(previous.riskScore, signal.riskScore) : "No prior forecast yet.";
  const snapshotCount = memory.forecast.snapshots.length;
  const forecastMemory = snapshotCount > 1
    ? `${snapshotCount} local forecasts stored.`
    : "First forecast snapshot.";
  const titleByState: Record<ForecastState, string> = {
    clear: "Clear",
    watch: "Watch",
    warning: "Warning",
    storm: "Storm",
    recovery: "Recovery"
  };
  const topCourse = signal.topAssignmentId
    ? courses.find((course) => assignments.find((assignment) => assignment.id === signal.topAssignmentId)?.courseId === course.id)
    : undefined;
  const recommendation =
    signal.state === "storm" || signal.state === "warning"
      ? `Move one block earlier${topCourse ? ` for ${topCourse.code}` : ""}.`
      : signal.state === "watch"
        ? "Protect one short focus window before the week stacks up."
        : signal.state === "recovery"
          ? "Keep the slate clear and protect recovery."
          : "Stay with the current plan.";

  return {
    state: signal.state,
    riskScore: signal.riskScore,
    title: `${titleByState[signal.state]} forecast`,
    detail: `${signal.heavyDayCount} heavy day${signal.heavyDayCount === 1 ? "" : "s"}; ${signal.openCount} open item${signal.openCount === 1 ? "" : "s"}. ${forecastMemory}`,
    learned: `${forecastMemory} ${trend}`,
    adaptation: signal.completedFocusMinutes > 0 ? `Risk is adjusted by ${signal.completedFocusMinutes} completed focus minutes.` : "Risk is based on due clusters until focus history grows.",
    recommendation,
    retention: valueGained(memory, "forecast"),
    heavyDayCount: signal.heavyDayCount
  };
}

function buildClassSignal(
  memory: StudentLifeMemory,
  assignments: Assignment[],
  courses: Course[],
  notes: StudyNote[],
  focusSessions: FocusSession[]
): StudentLifeContext["classes"] {
  const summaries = courses.map((course) => {
    const open = assignments.filter((assignment) => assignment.courseId === course.id && assignment.status !== "done" && assignment.status !== "archived");
    const courseNotes = notes.filter((note) => note.courseId === course.id);
    const focusStats = memory.focus.courseStats[course.id];
    const stopped = focusStats?.stopped || 0;
    const completed = focusStats?.completed || 0;
    const totalMinutes = focusStats?.totalMinutes || 0;
    const risk = open.length * 3 + stopped * 2 + Math.min(6, courseNotes.length) + (completed === 0 && open.length > 0 ? 3 : 0);
    return { course, open, courseNotes, focusStats, stopped, completed, totalMinutes, risk };
  }).sort((left, right) => right.risk - left.risk);
  const top = summaries[0];
  const totalFocus = focusSessions.filter((session) => session.status === "completed").length;
  if (!top) {
    return {
      learned: "Classes will learn difficulty after courses and work exist.",
      adaptation: "No class-specific ranking yet.",
      recommendation: "Add or import a class.",
      retention: valueGained(memory, "classes")
    };
  }
  const average = top.focusStats && top.focusStats.sessions > 0 ? Math.round(top.totalMinutes / top.focusStats.sessions) : 0;
  return {
    course: top.course,
    learned: learningPrefix(memory, "classes", `${top.course.code} has ${top.open.length} open item${top.open.length === 1 ? "" : "s"}, ${top.courseNotes.length} note${top.courseNotes.length === 1 ? "" : "s"}, and ${top.completed} completed focus block${top.completed === 1 ? "" : "s"}.`),
    adaptation: average > 0 ? `${top.course.code} now uses a ${average} min real-effort average.` : "Class ranking is using open work and notes until effort history grows.",
    recommendation: top.open[0] ? `Open ${top.open[0].title} first.` : `Review ${top.course.code} context.`,
    retention: totalFocus > 0 ? `${totalFocus} completed focus block${totalFocus === 1 ? "" : "s"} now feed class intelligence.` : valueGained(memory, "classes")
  };
}

function buildFocusSignal(
  memory: StudentLifeMemory,
  feedAssignment: Assignment | undefined,
  feedCourse: Course | undefined,
  assignments: Assignment[],
  focusSessions: FocusSession[],
  settings: UserSettings | undefined,
  now: Date
): StudentLifeContext["focus"] {
  const minutes = memory.focus.preferredDurationMinutes || getRecommendedFocusDuration(assignments, focusSessions, settings, now);
  const stats = feedAssignment ? memory.focus.assignmentStats[feedAssignment.id] : undefined;
  const courseStats = feedAssignment ? memory.focus.courseStats[feedAssignment.courseId] : undefined;
  const completionRate = courseStats && courseStats.sessions > 0 ? Math.round((courseStats.completed / courseStats.sessions) * 100) : 0;
  const learned = stats
    ? `${feedAssignment?.title || "This task"} has ${stats.sessions} focus attempt${stats.sessions === 1 ? "" : "s"} and ${stats.totalMinutes} logged min.`
    : `Focus has learned from ${memory.focus.completedSessions} completed session${memory.focus.completedSessions === 1 ? "" : "s"}.`;
  return {
    assignment: feedAssignment,
    course: feedCourse,
    minutes,
    learned: learningPrefix(memory, "focus", learned),
    adaptation: courseStats ? `${feedCourse?.code || "This class"} completion rate is ${completionRate}%, so block size adapts locally.` : "Block size will adapt after a few starts, stops, and completions.",
    recommendation: feedAssignment ? `Start ${minutes} min on ${feedAssignment.title}.` : "Start after adding an open task.",
    retention: valueGained(memory, "focus")
  };
}

function buildNotesSignal(
  memory: StudentLifeMemory,
  courses: Course[],
  notes: StudyNote[]
): StudentLifeContext["notes"] {
  const [topCourseId, topCount] = Object.entries(memory.notes.courseCounts).sort((left, right) => right[1] - left[1])[0] || [];
  const course = topCourseId ? courses.find((item) => item.id === topCourseId) : undefined;
  const actualCount = course ? notes.filter((note) => note.courseId === course.id).length : notes.length;
  return {
    course,
    learned: learningPrefix(memory, "notes", course ? `${course.code} is your strongest note pattern with ${topCount || actualCount} saved context item${(topCount || actualCount) === 1 ? "" : "s"}.` : `${memory.notes.created || notes.length} note${(memory.notes.created || notes.length) === 1 ? "" : "s"} stored locally.`),
    adaptation: memory.notes.convertedToTasks > 0 ? `${memory.notes.convertedToTasks} note${memory.notes.convertedToTasks === 1 ? " has" : "s have"} become tasks, so notes can now affect ranking.` : "Notes will resurface once they link to classes, tasks, or focus sessions.",
    recommendation: course ? `Resurface ${course.code} notes before the next related task.` : "Capture one actionable class note.",
    retention: valueGained(memory, "notes")
  };
}

function buildWidgetSignal(
  memory: StudentLifeMemory,
  forecastState: ForecastState,
  feedAssignment: Assignment | undefined,
  courses: Course[],
  widgetPresets: WidgetPreset[]
): StudentLifeContext["widgets"] {
  void widgetPresets;
  const type: WidgetType =
    forecastState === "storm" || forecastState === "warning"
      ? "week"
      : feedAssignment?.kind === "exam"
        ? "due_next"
        : memory.focus.completedSessions === 0 && feedAssignment
          ? "focus"
          : courses.length > 0
            ? "class_focus"
            : "today";
  return {
    type,
    title: widgetTitle(type),
    detail: widgetDetail(type, forecastState),
    learned:
      memory.widgets.savedCount > 0
        ? `${memory.widgets.savedCount} saved widget${memory.widgets.savedCount === 1 ? "" : "s"}; last pick was ${widgetTitle(memory.widgets.lastRecommendedType || "today")}.`
        : "No saved widget pattern yet.",
    adaptation: `Recommended face changed to ${widgetTitle(type)} because the week is ${forecastState}.`,
    recommendation: `Use ${widgetTitle(type)} for this week.`,
    retention: valueGained(memory, "widgets")
  };
}

function buildWatchSignal(
  memory: StudentLifeMemory,
  feed: StudentLifeContext["feed"],
  forecast: StudentLifeContext["forecast"],
  focus: StudentLifeContext["focus"]
): StudentLifeContext["watch"] {
  const signal = forecast.state === "storm" || forecast.state === "warning"
    ? `${shortCourseCode(feed.course?.code || "Forecast")} early start.`
    : feed.assignment
      ? `${feed.course?.code || "Next"}: ${shorten(feed.assignment.title)}.`
      : "All clear.";
  const action = focus.assignment ? `Start ${focus.minutes} min` : "Capture work";
  const escalation = forecast.state === "storm" || forecast.state === "warning" ? "Open Forecast" : "Open task";
  return {
    signal,
    action,
    escalation,
    learned: memory.watch.signalsGenerated > 1
      ? `${memory.watch.signalsGenerated} wrist signals; ${memory.watch.focusStarts} became focus starts.`
      : "No wrist pattern yet.",
    adaptation: memory.watch.smartSnoozes > 0 ? `${memory.watch.smartSnoozes} snooze${memory.watch.smartSnoozes === 1 ? "" : "s"} have changed wrist timing.` : "Wrist timing will adapt after starts and snoozes.",
    recommendation: `${signal} Action: ${action}.`,
    retention: valueGained(memory, "watch")
  };
}

function buildFeatureInsights(input: {
  memory: StudentLifeMemory;
  ageDays: number;
  feed: StudentLifeContext["feed"];
  forecast: StudentLifeContext["forecast"];
  classes: StudentLifeContext["classes"];
  focus: StudentLifeContext["focus"];
  notesSignal: StudentLifeContext["notes"];
  widgets: StudentLifeContext["widgets"];
  watch: StudentLifeContext["watch"];
}): Record<StudentLifeFeature, FeatureDepthInsight> {
  return {
    home: insight("Home", featureDepthValues.home, input.feed, input.memory, "home"),
    forecast: insight("Forecast", featureDepthValues.forecast, input.forecast, input.memory, "forecast"),
    classes: insight("Classes", featureDepthValues.classes, input.classes, input.memory, "classes"),
    focus: insight("Focus", featureDepthValues.focus, input.focus, input.memory, "focus"),
    notes: insight("Notes", featureDepthValues.notes, input.notesSignal, input.memory, "notes"),
    widgets: insight("Widget Studio", featureDepthValues.widgets, input.widgets, input.memory, "widgets"),
    watch: insight("Watch", featureDepthValues.watch, input.watch, input.memory, "watch")
  };
}

function insight(
  title: string,
  values: FeatureDepthValue,
  source: Pick<FeatureDepthInsight, "learned" | "adaptation" | "recommendation" | "retention">,
  memory: StudentLifeMemory,
  feature: StudentLifeFeature
): FeatureDepthInsight {
  return {
    title,
    ...values,
    learned: source.learned,
    memory: `${memory.featureVisits[feature] || 0} local visit${(memory.featureVisits[feature] || 0) === 1 ? "" : "s"} stored.`,
    adaptation: source.adaptation,
    personalization: personalizationLine(feature, memory),
    recommendation: source.recommendation,
    retention: source.retention
  };
}

function calculateForecastState(assignments: Assignment[], focusSessions: FocusSession[], now: Date) {
  const open = assignments.filter((assignment) => assignment.status !== "done" && assignment.status !== "archived");
  const weekLoad = getWeekLoad(assignments, now);
  const needsReview = getNeedsReview(assignments);
  const heavyDayCount = weekLoad.filter((day) => day.heavy).length;
  const overdue = open.filter((assignment) => daysUntil(assignment.dueAt, now) < 0).length;
  const dueSoon = open.filter((assignment) => {
    const days = daysUntil(assignment.dueAt, now);
    return Number.isFinite(days) && days >= 0 && days <= 2;
  }).length;
  const examsSoon = open.filter((assignment) => {
    const days = daysUntil(assignment.dueAt, now);
    return assignment.kind === "exam" && Number.isFinite(days) && days <= 7;
  }).length;
  const completedFocusMinutes = getFocusCompletionStats(focusSessions, now).completedMinutesToday;
  const rawRisk = Math.round(
    weekLoad.reduce((sum, day) => sum + day.score, 0) +
      overdue * 10 +
      dueSoon * 3 +
      examsSoon * 4 +
      needsReview.length * 2 -
      Math.min(8, completedFocusMinutes / 20)
  );
  const riskScore = Math.max(0, rawRisk);
  const state: ForecastState =
    open.length === 0
      ? "recovery"
      : riskScore >= 24 || heavyDayCount >= 3
        ? "storm"
        : riskScore >= 15 || heavyDayCount >= 2
          ? "warning"
          : riskScore >= 8 || heavyDayCount >= 1
            ? "watch"
            : "clear";
  const topAssignmentId = open.slice().sort((left, right) => scoreWork(right, now) - scoreWork(left, now))[0]?.id;
  return {
    state,
    riskScore,
    heavyDayCount,
    openCount: open.length,
    completedFocusMinutes,
    topAssignmentId
  };
}

function inferPreferredDuration(current: number | undefined, session: FocusSession) {
  if (session.status !== "completed") return current;
  const duration = Math.max(1, session.durationMinutes || 0);
  if (!current) return duration;
  return Math.round(current * 0.7 + duration * 0.3);
}

function learningPrefix(memory: StudentLifeMemory, feature: StudentLifeFeature, text: string) {
  const visits = memory.featureVisits[feature] || 0;
  if (visits <= 1) return `Day 1 learning: ${text}`;
  return `Learned from ${visits} local visit${visits === 1 ? "" : "s"}: ${text}`;
}

function valueGained(memory: StudentLifeMemory, feature: StudentLifeFeature) {
  const age = daysBetween(memory.createdAt, new Date());
  const visits = memory.featureVisits[feature] || 0;
  if (age >= 90) return `90-day value: long-range patterns from ${visits} visits.`;
  if (age >= 30) return `30-day value: recommendations now use your repeated patterns.`;
  if (age >= 7) return `7-day value: the app can compare this week against your behavior.`;
  return "1-day value: the app is building its first local pattern.";
}

function personalizationLine(feature: StudentLifeFeature, memory: StudentLifeMemory) {
  if (feature === "focus" && memory.focus.preferredDurationMinutes) {
    return `Focus defaults are personalized to ${memory.focus.preferredDurationMinutes} min.`;
  }
  if (feature === "notes" && memory.notes.convertedToTasks > 0) {
    return "Notes are personalized by what you convert into tasks.";
  }
  if (feature === "widgets" && memory.widgets.lastRecommendedType) {
    return `Widget recommendations remember ${widgetTitle(memory.widgets.lastRecommendedType)}.`;
  }
  if (feature === "watch" && memory.watch.smartSnoozes > 0) {
    return "Watch timing is personalized by snoozes.";
  }
  return "Personalization starts local and strengthens with each action.";
}

function trendText(previousRisk: number, currentRisk: number) {
  const delta = currentRisk - previousRisk;
  if (Math.abs(delta) <= 2) return "Risk is steady.";
  return delta > 0 ? `Risk rose ${delta} points.` : `Risk dropped ${Math.abs(delta)} points.`;
}

function widgetTitle(type: WidgetType) {
  if (type === "week") return "Storm Watch";
  if (type === "focus") return "Focus Face";
  if (type === "class_focus") return "Class Face";
  if (type === "due_next") return "Exam Face";
  if (type === "needs_check") return "Review Face";
  if (type === "streak") return "Progress Face";
  return "Today Face";
}

function widgetDetail(type: WidgetType, forecastState: ForecastState) {
  if (type === "week") return `Best for ${forecastState} weeks and overload prevention.`;
  if (type === "focus") return "Best when starting is the highest leverage move.";
  if (type === "class_focus") return "Best once one class has enough memory to deserve space.";
  if (type === "due_next") return "Best for exam countdown and high-impact deadlines.";
  return "Best for the daily operating picture.";
}

function buildSeedForecastSnapshots(ageDays: number, assignments: Assignment[], now: Date) {
  const snapshots: StudentLifeMemory["forecast"]["snapshots"] = [];
  const count = Math.min(12, Math.max(1, Math.floor(ageDays / 3)));
  for (let index = 0; index < count; index += 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - index);
    const riskScore = Math.max(4, 18 - index);
    snapshots.push({
      dateKey: dateKeyFromDate(date),
      state: riskScore >= 15 ? "warning" : riskScore >= 8 ? "watch" : "clear",
      riskScore,
      heavyDayCount: riskScore >= 15 ? 2 : 1,
      openCount: assignments.filter((assignment) => assignment.status !== "done").length,
      completedFocusMinutes: ageDays >= 30 ? 35 : 0,
      topAssignmentId: assignments.find((assignment) => assignment.status !== "done")?.id,
      createdAt: date.toISOString()
    });
  }
  return snapshots;
}

function daysBetween(iso: string, now: Date) {
  const start = new Date(iso).getTime();
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((now.getTime() - start) / 86400000));
}

function dateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shorten(value: string) {
  return value.length <= 24 ? value : `${value.slice(0, 21)}...`;
}

function shortCourseCode(value: string) {
  return value
    .replace("World History", "History")
    .replace("Organic Chemistry", "Chem")
    .replace("Calculus", "Calc");
}

const featureDepthValues: Record<StudentLifeFeature, FeatureDepthValue> = {
  home: {
    oneDay: "Learns today's top action and whether the student acts.",
    sevenDays: "Learns recurring open loops and ignored recommendations.",
    thirtyDays: "Ranks by personal effort, course friction, and completion behavior.",
    ninetyDays: "Understands semester rhythm and long-range next-best-action patterns."
  },
  forecast: {
    oneDay: "Stores the first local risk snapshot.",
    sevenDays: "Compares this week against actual focus and completion behavior.",
    thirtyDays: "Predicts overload with real effort and class volatility.",
    ninetyDays: "Recognizes semester cycles before the student feels them."
  },
  classes: {
    oneDay: "Learns class roster, open work, and course context.",
    sevenDays: "Learns which classes accumulate notes, slips, and focus time.",
    thirtyDays: "Builds class personality: difficulty, effort, and risk.",
    ninetyDays: "Knows which classes need early warning and which stay stable."
  },
  focus: {
    oneDay: "Learns first start, stop, and completion signals.",
    sevenDays: "Learns useful block size and productive course windows.",
    thirtyDays: "Calibrates real effort by assignment and class.",
    ninetyDays: "Predicts realistic study plans from long-term behavior."
  },
  notes: {
    oneDay: "Learns what the student captures.",
    sevenDays: "Learns which notes become tasks or stay pinned.",
    thirtyDays: "Resurfaces class memory when it changes action.",
    ninetyDays: "Becomes a personal study memory by class and exam."
  },
  widgets: {
    oneDay: "Learns which outside-app surface the student saves.",
    sevenDays: "Adapts widget suggestions to current week state.",
    thirtyDays: "Recommends faces by goal, class risk, and real usage.",
    ninetyDays: "Rotates surfaces around the semester's changing rhythm."
  },
  watch: {
    oneDay: "Learns whether wrist signals should exist.",
    sevenDays: "Learns starts, snoozes, and tiny actions.",
    thirtyDays: "Chooses the one wrist signal most likely to help.",
    ninetyDays: "Becomes a reliable micro-action layer for school life."
  }
};
