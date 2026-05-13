import {
  Assignment,
  Course,
  GradeItem,
  NavTab,
  Semester,
  SyllabusParseResult
} from "../models";

declare const __DEV__: boolean;

export type MarketingCaptureScreen = "processing" | "extracted" | "review_edit" | "agenda";

const screen = process.env.EXPO_PUBLIC_MARKETING_CAPTURE_SCREEN;

export const marketingCaptureEnabled =
  typeof __DEV__ !== "undefined" && __DEV__ && process.env.EXPO_PUBLIC_MARKETING_CAPTURE === "1";

export const marketingCaptureScreen: MarketingCaptureScreen | undefined =
  marketingCaptureEnabled && isMarketingCaptureScreen(screen) ? screen : undefined;

export const marketingCaptureSemester: Semester = {
  id: "marketing-spring-2026",
  name: "Spring 2026",
  startDate: "2026-01-12",
  endDate: "2026-05-22",
  targetGpa: 3.6
};

export const marketingCaptureCourses: Course[] = [
  {
    id: "marketing-bio-101",
    code: "BIO 101",
    name: "Biology in the Real World",
    instructor: "Dr Patel",
    color: "#22577A",
    meetings: [
      {
        id: "marketing-bio-101-mon",
        day: "Mon",
        startTime: "10:00",
        endTime: "11:15",
        location: "Science Hall 204"
      },
      {
        id: "marketing-bio-101-wed",
        day: "Wed",
        startTime: "10:00",
        endTime: "11:15",
        location: "Science Hall 204"
      }
    ],
    gradeCategories: [
      { id: "marketing-bio-labs", name: "Labs", weight: 30 },
      { id: "marketing-bio-exams", name: "Exams", weight: 45 },
      { id: "marketing-bio-projects", name: "Project", weight: 25 }
    ]
  },
  {
    id: "marketing-psych-214",
    code: "PSYC 214",
    name: "Social Psychology",
    instructor: "Professor Kim",
    color: "#D49A21",
    meetings: [
      {
        id: "marketing-psych-214-tue",
        day: "Tue",
        startTime: "13:30",
        endTime: "14:45",
        location: "Mason 118"
      },
      {
        id: "marketing-psych-214-thu",
        day: "Thu",
        startTime: "13:30",
        endTime: "14:45",
        location: "Mason 118"
      }
    ],
    gradeCategories: [
      { id: "marketing-psych-quizzes", name: "Quizzes", weight: 20 },
      { id: "marketing-psych-papers", name: "Papers", weight: 35 },
      { id: "marketing-psych-final", name: "Final", weight: 45 }
    ]
  }
];

export const marketingCaptureAssignments: Assignment[] = [
  {
    id: "marketing-bio-lab-report",
    courseId: "marketing-bio-101",
    title: "Lab Report: Enzyme Simulation",
    kind: "assignment",
    dueAt: "2026-05-11T23:59:00",
    tags: ["lab", "syllabus"],
    priority: "high",
    estimatedMinutes: 95,
    status: "not_started",
    source: "syllabus",
    gradeWeight: 8
  },
  {
    id: "marketing-psych-chapter-quiz",
    courseId: "marketing-psych-214",
    title: "Chapter 12 Quiz",
    kind: "assignment",
    dueAt: "2026-05-13T09:00:00",
    tags: ["quiz", "chapter 12"],
    priority: "medium",
    estimatedMinutes: 45,
    status: "not_started",
    source: "syllabus",
    gradeWeight: 5
  },
  {
    id: "marketing-psych-reflection",
    courseId: "marketing-psych-214",
    title: "Research Reflection",
    kind: "assignment",
    dueAt: "2026-05-14T23:59:00",
    tags: ["paper", "reflection"],
    priority: "medium",
    estimatedMinutes: 70,
    status: "in_progress",
    source: "syllabus",
    gradeWeight: 10
  },
  {
    id: "marketing-bio-final-project",
    courseId: "marketing-bio-101",
    title: "Final Project Checkpoint",
    kind: "assignment",
    dueAt: "2026-05-17T23:59:00",
    tags: ["project", "checkpoint"],
    priority: "high",
    estimatedMinutes: 130,
    status: "not_started",
    source: "syllabus",
    gradeWeight: 15
  },
  {
    id: "marketing-bio-final-exam",
    courseId: "marketing-bio-101",
    title: "Cumulative Final Exam",
    kind: "exam",
    dueAt: "2026-05-20T14:00:00",
    tags: ["exam", "final"],
    priority: "high",
    estimatedMinutes: 180,
    status: "not_started",
    source: "syllabus",
    gradeWeight: 25
  }
];

export const marketingCaptureGradeItems: GradeItem[] = [
  {
    id: "marketing-bio-lab-score",
    courseId: "marketing-bio-101",
    categoryId: "marketing-bio-labs",
    title: "Lab Practical",
    earned: 88,
    possible: 100
  },
  {
    id: "marketing-bio-midterm-score",
    courseId: "marketing-bio-101",
    categoryId: "marketing-bio-exams",
    title: "Midterm Exam",
    earned: 91,
    possible: 100
  },
  {
    id: "marketing-psych-paper-score",
    courseId: "marketing-psych-214",
    categoryId: "marketing-psych-papers",
    title: "Observation Paper",
    earned: 46,
    possible: 50
  }
];

export const marketingCaptureParseResult: SyllabusParseResult = {
  sourceName: "spring-bio-psych-syllabus.pdf",
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
      message: "Found 5 syllabus deadlines."
    },
    {
      id: "marketing-grade-weights-found",
      severity: "info",
      message: "Found grade weights for 2 courses."
    }
  ]
};

export function getMarketingCaptureInitialTab(): NavTab {
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

function isMarketingCaptureScreen(value: string | undefined): value is MarketingCaptureScreen {
  return (
    value === "processing" ||
    value === "extracted" ||
    value === "review_edit" ||
    value === "agenda"
  );
}
