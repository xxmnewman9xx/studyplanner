import {
  buildStudentLifeContext,
  createStudentLifeMemory,
  seedStudentLifeMemoryForAge
} from "../src/logic/studentLifeDepth";
import type { Assignment, Course, StudentLifeMemory } from "../src/models";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const now = new Date("2026-05-31T09:00:00");

const courses: Course[] = [
  {
    id: "math",
    code: "Math",
    name: "Math",
    color: "#1476FF",
    meetings: [],
    gradeCategories: []
  },
  {
    id: "history",
    code: "World History",
    name: "World History",
    color: "#F59E0B",
    meetings: [],
    gradeCategories: []
  }
];

function assignment(input: {
  id: string;
  courseId: string;
  title: string;
  dueAt: string;
  estimatedMinutes?: number;
  priority?: Assignment["priority"];
  kind?: Assignment["kind"];
}): Assignment {
  return {
    id: input.id,
    courseId: input.courseId,
    title: input.title,
    kind: input.kind || "assignment",
    type: input.kind || "assignment",
    dueAt: input.dueAt,
    tags: [],
    priority: input.priority || "medium",
    estimatedMinutes: input.estimatedMinutes || 60,
    status: "not_started",
    source: "manual",
    progress: 0
  };
}

function context(memory: StudentLifeMemory, assignments: Assignment[]) {
  return buildStudentLifeContext({
    memory,
    assignments,
    courses,
    notes: [],
    focusSessions: [],
    widgetPresets: [],
    now
  });
}

const essayDraft = assignment({
  id: "essay-draft",
  courseId: "history",
  title: "Essay Draft",
  dueAt: "2026-05-31T20:00:00",
  estimatedMinutes: 55,
  priority: "high"
});

const day1 = context(
  seedStudentLifeMemoryForAge({ ageDays: 0, assignments: [essayDraft], courses, now }),
  [essayDraft]
);
assert(day1.feed.learned === "No study pattern yet.", "Day 1 should expose starter learning, not fake memory");
assert(day1.feed.recommendation === "Start with the due-now task.", "Day 1 should use generic starter guidance");
assert(day1.feed.nextAction === "Next: Essay Draft.", "Day 1 should still name the next action");
assert(day1.feed.reason === "due now; high priority.", "Day 1 should give a concrete reason");

const day30 = context(
  seedStudentLifeMemoryForAge({ ageDays: 30, assignments: [essayDraft], courses, now }),
  [essayDraft]
);
assert(day30.feed.learned === "World History averages 29 min.", "Day 30 should expose a learned class pattern");
assert(day30.feed.recommendation === "Use a 29-min first block.", "Day 30 should adapt the recommendation");
assert(day30.feed.reason === "due now; 29-min World History avg.", "Day 30 should explain why the recommendation changed");
assert(
  !/os adapted|personalized for you|smart recommendation/i.test(
    [day30.feed.learned, day30.feed.recommendation, day30.feed.reason].join(" ")
  ),
  "Learned copy should not sound like generic AI marketing"
);

const mathWork = assignment({
  id: "math-work",
  courseId: "math",
  title: "Math Worksheet",
  dueAt: "2026-06-01T20:00:00"
});
const historyWork = assignment({
  id: "history-work",
  courseId: "history",
  title: "History Source Notes",
  dueAt: "2026-06-01T20:00:00"
});
const noMemoryRanking = context(createStudentLifeMemory(now), [mathWork, historyWork]);
assert(noMemoryRanking.feed.assignment?.id === "math-work", "Baseline ranking should use the first equal deadline");

const learnedMemory = createStudentLifeMemory(now);
const historyLearnedMemory: StudentLifeMemory = {
  ...learnedMemory,
  focus: {
    ...learnedMemory.focus,
    completedSessions: 2,
    totalMinutes: 180,
    courseStats: {
      history: {
        sessions: 2,
        completed: 2,
        stopped: 0,
        totalMinutes: 180,
        lastAt: now.toISOString()
      }
    }
  }
};
const memoryRanking = context(historyLearnedMemory, [mathWork, historyWork]);
assert(memoryRanking.feed.assignment?.id === "history-work", "Changing memory should change the ranked recommendation");
assert(memoryRanking.feed.recommendation === "Use a 90-min first block.", "Changing memory should change recommendation copy");

const previousFetch = (globalThis as { fetch?: unknown }).fetch;
try {
  (globalThis as { fetch?: unknown }).fetch = () => {
    throw new Error("studentLifeDepth must not call the network");
  };
  context(day30.memory, [essayDraft]);
} finally {
  if (previousFetch) {
    (globalThis as { fetch?: unknown }).fetch = previousFetch;
  } else {
    delete (globalThis as { fetch?: unknown }).fetch;
  }
}

const laterWork = assignment({
  id: "later-work",
  courseId: "math",
  title: "Practice Set",
  dueAt: "2026-06-20T20:00:00",
  estimatedMinutes: 45
});
const starterWidgetContext = context(createStudentLifeMemory(now), [laterWork]);
const adaptedWidgetMemory = createStudentLifeMemory(now);
const adaptedWidgetContext = context(
  {
    ...adaptedWidgetMemory,
    focus: {
      ...adaptedWidgetMemory.focus,
      completedSessions: 3,
      totalMinutes: 90
    }
  },
  [laterWork]
);
assert(starterWidgetContext.widgets.type === "focus", "Starter widget recommendation should push focus when no sessions exist");
assert(adaptedWidgetContext.widgets.type === "class_focus", "Widget recommendation should adapt after focus memory exists");
assert(
  starterWidgetContext.widgets.type !== adaptedWidgetContext.widgets.type,
  "Widget proof should show memory affecting recommendation output"
);

console.log("studentLifeDepth memory/adaptation tests passed");
