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
  endDate: "2026-07-12",
  targetGpa: 3.6
};

export const marketingCaptureCourses: Course[] = [
  {
    id: "marketing-calculus",
    code: "Calculus",
    name: "Calculus I",
    instructor: "Prof. Patel",
    color: "#1476FF",
    meetings: [{ id: "marketing-calc-wed", day: "Wed", startTime: "08:30", endTime: "09:20", location: "214" }],
    gradeCategories: [{ id: "marketing-calc-homework", name: "Homework", weight: 35 }]
  },
  {
    id: "marketing-organic-chemistry",
    code: "Organic Chemistry",
    name: "Organic Chemistry",
    instructor: "Dr. Lin",
    color: "#FF5A1F",
    meetings: [{ id: "marketing-ochem-wed", day: "Wed", startTime: "09:30", endTime: "10:20", location: "Lab 5" }],
    gradeCategories: [{ id: "marketing-ochem-labs", name: "Labs", weight: 35 }]
  },
  {
    id: "marketing-physics-201",
    code: "Physics 201",
    name: "Physics 201",
    instructor: "Dr. Cho",
    color: "#21B8A7",
    meetings: [{ id: "marketing-phys-thu", day: "Thu", startTime: "10:00", endTime: "10:50", location: "4A" }],
    gradeCategories: [{ id: "marketing-phys-labs", name: "Labs", weight: 30 }]
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
    id: "marketing-calc-problem-set",
    courseId: "marketing-calculus",
    title: "Calculus Problem Set",
    kind: "assignment",
    type: "assignment",
    dueAt: "2026-06-05T23:59:00",
    tags: ["problem-set", "calculus"],
    priority: "high",
    estimatedMinutes: 180,
    status: "in_progress",
    source: "syllabus",
    progress: 0.35,
    gradeWeight: 8
  },
  {
    id: "marketing-ochem-midterm",
    courseId: "marketing-organic-chemistry",
    title: "Organic Chemistry Midterm",
    kind: "exam",
    type: "exam",
    dueAt: "2026-06-07T09:00:00",
    tags: ["exam", "midterm"],
    priority: "high",
    estimatedMinutes: 120,
    status: "not_started",
    source: "syllabus",
    progress: 0,
    gradeWeight: 10
  },
  {
    id: "marketing-physics-preview",
    courseId: "marketing-physics-201",
    title: "Physics Lab Preview",
    kind: "reading",
    type: "reading",
    dueAt: "2026-06-03T10:00:00",
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
    id: "marketing-calc-ch3-test",
    courseId: "marketing-calculus",
    categoryId: "marketing-calc-homework",
    title: "Limits Test",
    earned: 91,
    possible: 100
  },
  {
    id: "marketing-ochem-lab-score",
    courseId: "marketing-organic-chemistry",
    categoryId: "marketing-ochem-labs",
    title: "Lab Practical",
    earned: 88,
    possible: 100
  },
  {
    id: "marketing-phys-lab-score",
    courseId: "marketing-physics-201",
    categoryId: "marketing-phys-labs",
    title: "Motion Lab",
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
