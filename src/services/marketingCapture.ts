import {
  Assignment,
  Course,
  GradeItem,
  NavTab,
  Semester,
  SyllabusParseResult
} from "../models";

declare const __DEV__: boolean;

export type MarketingCaptureScreen = "processing" | "extracted" | "review_edit" | "failed" | "agenda";

const screen = process.env.EXPO_PUBLIC_MARKETING_CAPTURE_SCREEN;
const initialTab = process.env.EXPO_PUBLIC_MARKETING_CAPTURE_INITIAL_TAB;

export const marketingCaptureEnabled =
  typeof __DEV__ !== "undefined" && __DEV__ && process.env.EXPO_PUBLIC_MARKETING_CAPTURE === "1";

export const marketingCaptureScreen: MarketingCaptureScreen | undefined =
  marketingCaptureEnabled && isMarketingCaptureScreen(screen) ? screen : undefined;

export const marketingCaptureSemester: Semester = {
  id: "marketing-spring-2026",
  name: "Spring 2026",
  startDate: "2026-01-12",
  endDate: "2026-06-12",
  targetGpa: 3.6
};

export const marketingCaptureCourses: Course[] = [
  {
    id: "marketing-algebra-ii",
    code: "Algebra II",
    name: "Algebra II",
    instructor: "Ms. Patel",
    color: "#2F80ED",
    meetings: [{ id: "marketing-alg-wed", day: "Wed", startTime: "08:30", endTime: "09:20", location: "214" }],
    gradeCategories: [{ id: "marketing-alg-homework", name: "Homework", weight: 35 }]
  },
  {
    id: "marketing-chemistry",
    code: "Chemistry",
    name: "Chemistry",
    instructor: "Dr. Lin",
    color: "#10B981",
    meetings: [{ id: "marketing-chem-wed", day: "Wed", startTime: "09:30", endTime: "10:20", location: "Lab 5" }],
    gradeCategories: [{ id: "marketing-chem-labs", name: "Labs", weight: 35 }]
  },
  {
    id: "marketing-english-lit",
    code: "English Lit",
    name: "English Literature",
    instructor: "Mrs. Cho",
    color: "#8B5CF6",
    meetings: [{ id: "marketing-eng-thu", day: "Thu", startTime: "10:30", endTime: "11:20", location: "118" }],
    gradeCategories: [{ id: "marketing-eng-reading", name: "Reading", weight: 30 }]
  },
  {
    id: "marketing-world-history",
    code: "World History",
    name: "World History",
    instructor: "Mr. Ahmed",
    color: "#F59E0B",
    meetings: [{ id: "marketing-hist-tue", day: "Tue", startTime: "11:30", endTime: "12:20", location: "302" }],
    gradeCategories: [{ id: "marketing-hist-essays", name: "Essays", weight: 40 }]
  },
  {
    id: "marketing-biology",
    code: "Biology",
    name: "Biology",
    instructor: "Dr. Rivera",
    color: "#14B8A6",
    meetings: [{ id: "marketing-bio-fri", day: "Fri", startTime: "12:35", endTime: "13:25", location: "Lab 2" }],
    gradeCategories: [{ id: "marketing-bio-quizzes", name: "Quizzes", weight: 25 }]
  },
  {
    id: "marketing-studio-art",
    code: "Studio Art",
    name: "Studio Art",
    instructor: "Ms. Vance",
    color: "#EC4899",
    meetings: [{ id: "marketing-art-fri", day: "Fri", startTime: "13:40", endTime: "14:30", location: "Studio 2" }],
    gradeCategories: [{ id: "marketing-art-projects", name: "Projects", weight: 70 }]
  }
];

export const marketingCaptureAssignments: Assignment[] = [
  {
    id: "marketing-alg-worksheet",
    courseId: "marketing-algebra-ii",
    title: "Worksheet Ch. 4 Review",
    kind: "worksheet",
    type: "worksheet",
    dueAt: "2026-05-27T11:30:00",
    tags: ["worksheet", "review"],
    priority: "high",
    estimatedMinutes: 45,
    status: "in_progress",
    source: "syllabus",
    progress: 0.35,
    gradeWeight: 8
  },
  {
    id: "marketing-chem-lab",
    courseId: "marketing-chemistry",
    title: "Lab Report: Titration",
    kind: "assignment",
    dueAt: "2026-05-27T17:00:00",
    tags: ["lab", "report"],
    priority: "high",
    estimatedMinutes: 90,
    status: "not_started",
    source: "syllabus",
    progress: 0,
    gradeWeight: 10
  },
  {
    id: "marketing-eng-reading",
    courseId: "marketing-english-lit",
    title: "Reading Notes Ch. 9-11",
    kind: "reading",
    type: "reading",
    dueAt: "2026-05-28T08:30:00",
    tags: ["reading", "notes"],
    priority: "medium",
    estimatedMinutes: 35,
    status: "not_started",
    source: "scan",
    needsReview: true,
    confidence: 0.72,
    progress: 0
  },
  {
    id: "marketing-history-essay",
    courseId: "marketing-world-history",
    title: "Essay Draft",
    kind: "assignment",
    dueAt: "2026-05-26T20:00:00",
    tags: ["essay", "draft"],
    priority: "high",
    estimatedMinutes: 55,
    status: "not_started",
    source: "manual",
    progress: 0
  },
  {
    id: "marketing-bio-cell-quiz",
    courseId: "marketing-biology",
    title: "Cell Quiz",
    kind: "exam",
    type: "exam",
    dueAt: "not-a-date",
    tags: ["quiz", "missing date"],
    priority: "medium",
    estimatedMinutes: 60,
    status: "not_started",
    source: "syllabus",
    needsReview: true,
    duplicateOf: "marketing-eng-reading",
    confidence: 0.62,
    progress: 0
  },
  {
    id: "marketing-art-sketchbook",
    courseId: "marketing-studio-art",
    title: "Sketchbook Review",
    kind: "project",
    dueAt: "2026-05-29T15:00:00",
    tags: ["sketchbook"],
    priority: "low",
    estimatedMinutes: 55,
    status: "done",
    source: "manual",
    progress: 1,
    gradeWeight: 6
  }
];

export const marketingCaptureGradeItems: GradeItem[] = [
  {
    id: "marketing-alg-ch3-test",
    courseId: "marketing-algebra-ii",
    categoryId: "marketing-alg-homework",
    title: "Chapter 3 Test",
    earned: 91,
    possible: 100
  },
  {
    id: "marketing-chem-lab-score",
    courseId: "marketing-chemistry",
    categoryId: "marketing-chem-labs",
    title: "Lab Practical",
    earned: 88,
    possible: 100
  },
  {
    id: "marketing-eng-notes-score",
    courseId: "marketing-english-lit",
    categoryId: "marketing-eng-reading",
    title: "Reading Notes",
    earned: 45,
    possible: 50
  }
];

export const marketingCaptureParseResult: SyllabusParseResult = {
  sourceName: "alex-kim-spring-syllabus.pdf",
  semesterName: marketingCaptureSemester.name,
  semesterStartDate: marketingCaptureSemester.startDate,
  semesterEndDate: marketingCaptureSemester.endDate,
  courses: marketingCaptureCourses,
  assignments: marketingCaptureAssignments,
  gradeItems: marketingCaptureGradeItems,
  findings: [
    {
      id: "marketing-review-before-apply",
      severity: "needs_review",
      message: "Review detected courses and dates before applying them."
    },
    {
      id: "marketing-deadlines-found",
      severity: "info",
      message: "Found 6 syllabus deadlines."
    },
    {
      id: "marketing-grade-weights-found",
      severity: "info",
      message: "Found grade weights for 6 courses."
    }
  ]
};

export function getMarketingCaptureInitialTab(): NavTab {
  if (marketingCaptureEnabled && isNavTab(initialTab)) return initialTab;

  return marketingCaptureScreen === "processing" ||
    marketingCaptureScreen === "extracted" ||
    marketingCaptureScreen === "review_edit"
    ? "import"
    : "today";
}

export function getMarketingCaptureScrollY() {
  if (marketingCaptureScreen === "extracted") return 520;
  if (marketingCaptureScreen === "review_edit") return 920;
  if (marketingCaptureScreen === "agenda") return 560;
  return 0;
}

function isNavTab(value: string | undefined): value is NavTab {
  return (
    value === "today" ||
    value === "import" ||
    value === "plan" ||
    value === "courses" ||
    value === "more" ||
    value === "focus" ||
    value === "grades" ||
    value === "subscribe"
  );
}

function isMarketingCaptureScreen(value: string | undefined): value is MarketingCaptureScreen {
  return (
    value === "processing" ||
    value === "extracted" ||
    value === "review_edit" ||
    value === "agenda"
  );
}
