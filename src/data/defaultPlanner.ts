import {
  Assignment,
  Course,
  FocusSession,
  GradeItem,
  ParsedImport,
  ParsedItem,
  Semester,
  UserSettings,
  WidgetPreset
} from "../models";
import { buildCanonicalWidgetPreset } from "../widgets/widgetPresets";

const now = "2026-05-27T09:41:00";

export const defaultSemester: Semester = {
  id: "spring-2026",
  name: "Spring Semester",
  startDate: "2026-01-12",
  endDate: "2026-07-12",
  targetGpa: 3.7
};

export const defaultSettings: UserSettings = {
  studentName: "Alex Kim",
  selectedTheme: "ocean",
  customPalette: ["#2F80ED", "#35F2D0", "#A3E635", "#F97316"],
  appTheme: "campus",
  defaultWidgetStyle: "glass",
  onboardingComplete: false,
  notificationDefault: "2 hours before due",
  focusDefaultMinutes: 25,
  syncEnabled: true,
  privacyMode: false,
  emojiAccentEnabled: true
};

export const defaultCourses: Course[] = [
  {
    id: "calculus",
    code: "Calculus",
    name: "Calculus I",
    instructor: "Prof. Patel",
    teacher: "Prof. Patel",
    period: "Period 3",
    room: "Room 214",
    color: "#1476FF",
    iconKey: "calculator",
    emojiKey: "study",
    semester: defaultSemester.name,
    createdAt: now,
    updatedAt: now,
    meetings: [
      { id: "calc-mon", day: "Mon", startTime: "08:30", endTime: "09:20", location: "214" },
      { id: "calc-wed", day: "Wed", startTime: "08:30", endTime: "09:20", location: "214" },
      { id: "calc-fri", day: "Fri", startTime: "08:30", endTime: "09:20", location: "214" }
    ],
    gradeCategories: [
      { id: "calc-homework", name: "Homework", weight: 35 },
      { id: "calc-exams", name: "Exams", weight: 45 },
      { id: "calc-classwork", name: "Classwork", weight: 20 }
    ]
  },
  {
    id: "organic-chemistry",
    code: "Organic Chemistry",
    name: "Organic Chemistry",
    instructor: "Dr. Lin",
    teacher: "Dr. Lin",
    period: "Period 4",
    room: "Lab 5",
    color: "#FF5A1F",
    iconKey: "flask",
    emojiKey: "science",
    semester: defaultSemester.name,
    createdAt: now,
    updatedAt: now,
    meetings: [
      { id: "ochem-tue", day: "Tue", startTime: "09:30", endTime: "10:20", location: "Lab 5" },
      { id: "ochem-thu", day: "Thu", startTime: "09:30", endTime: "10:20", location: "Lab 5" }
    ],
    gradeCategories: [
      { id: "ochem-labs", name: "Labs", weight: 35 },
      { id: "ochem-exams", name: "Exams", weight: 40 },
      { id: "ochem-notes", name: "Notes", weight: 25 }
    ]
  },
  {
    id: "physics-201",
    code: "Physics 201",
    name: "Physics 201",
    instructor: "Dr. Cho",
    teacher: "Dr. Cho",
    period: "Period 5",
    room: "Room 4A",
    color: "#21B8A7",
    iconKey: "book",
    emojiKey: "writing",
    semester: defaultSemester.name,
    createdAt: now,
    updatedAt: now,
    meetings: [
      { id: "phys-mon", day: "Mon", startTime: "10:00", endTime: "10:50", location: "4A" },
      { id: "phys-wed", day: "Wed", startTime: "10:00", endTime: "10:50", location: "4A" }
    ],
    gradeCategories: [
      { id: "phys-labs", name: "Labs", weight: 35 },
      { id: "phys-exams", name: "Exams", weight: 45 },
      { id: "phys-problems", name: "Problem sets", weight: 20 }
    ]
  },
  {
    id: "world-history",
    code: "World History",
    name: "World History",
    instructor: "Mr. Ahmed",
    teacher: "Mr. Ahmed",
    period: "Period 6",
    room: "Room 302",
    color: "#F59E0B",
    iconKey: "globe",
    emojiKey: "history",
    semester: defaultSemester.name,
    createdAt: now,
    updatedAt: now,
    meetings: [
      { id: "hist-tue", day: "Tue", startTime: "11:30", endTime: "12:20", location: "302" },
      { id: "hist-thu", day: "Thu", startTime: "11:30", endTime: "12:20", location: "302" }
    ],
    gradeCategories: [
      { id: "hist-projects", name: "Projects", weight: 30 },
      { id: "hist-tests", name: "Tests", weight: 40 },
      { id: "hist-notes", name: "Notes", weight: 30 }
    ]
  },
  {
    id: "biology",
    code: "Biology",
    name: "Biology",
    instructor: "Dr. Rivera",
    teacher: "Dr. Rivera",
    period: "Period 1",
    room: "Lab 2",
    color: "#14B8A6",
    iconKey: "leaf",
    emojiKey: "science",
    semester: defaultSemester.name,
    createdAt: now,
    updatedAt: now,
    meetings: [
      { id: "bio-mon", day: "Mon", startTime: "12:35", endTime: "13:25", location: "Lab 2" },
      { id: "bio-fri", day: "Fri", startTime: "12:35", endTime: "13:25", location: "Lab 2" }
    ],
    gradeCategories: [
      { id: "bio-labs", name: "Labs", weight: 35 },
      { id: "bio-quizzes", name: "Quizzes", weight: 25 },
      { id: "bio-tests", name: "Tests", weight: 40 }
    ]
  },
  {
    id: "studio-art",
    code: "Studio Art",
    name: "Studio Art",
    instructor: "Ms. Vance",
    teacher: "Ms. Vance",
    period: "Period 7",
    room: "Studio 2",
    color: "#EC4899",
    iconKey: "palette",
    emojiKey: "art",
    semester: defaultSemester.name,
    createdAt: now,
    updatedAt: now,
    meetings: [
      { id: "art-wed", day: "Wed", startTime: "13:40", endTime: "14:30", location: "Studio 2" },
      { id: "art-fri", day: "Fri", startTime: "13:40", endTime: "14:30", location: "Studio 2" }
    ],
    gradeCategories: [
      { id: "art-projects", name: "Projects", weight: 70 },
      { id: "art-critique", name: "Critique", weight: 30 }
    ]
  }
];

export const defaultAssignments: Assignment[] = [
  {
    id: "calc-problem-set",
    courseId: "calculus",
    title: "Calculus Problem Set",
    kind: "assignment",
    type: "assignment",
    dueAt: "2026-06-05T23:59:00",
    tags: ["problem-set", "calculus"],
    priority: "high",
    estimatedMinutes: 180,
    status: "in_progress",
    source: "syllabus",
    sourceId: "scan-spring-syllabus",
    progress: 0.35,
    checklist: [
      { id: "calc-1", title: "Problems 1-12", done: true },
      { id: "calc-2", title: "Problems 13-24", done: false },
      { id: "calc-3", title: "Check odd answers", done: false }
    ],
    reminder: { enabled: true, leadTimeHours: 2 },
    confidence: 0.94,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "organic-chem-midterm",
    courseId: "organic-chemistry",
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
    checklist: [
      { id: "ochem-1", title: "Reaction mechanisms", done: false },
      { id: "ochem-2", title: "Spectroscopy review", done: false },
      { id: "ochem-3", title: "Practice set", done: false }
    ],
    reminder: { enabled: true, leadTimeHours: 3 },
    confidence: 0.9,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "physics-lab-preview",
    courseId: "physics-201",
    title: "Physics Lab Preview",
    kind: "reading",
    type: "reading",
    dueAt: "2026-06-03T10:00:00",
    tags: ["lab", "preview"],
    priority: "medium",
    estimatedMinutes: 35,
    status: "not_started",
    source: "scan",
    progress: 0,
    needsReview: true,
    confidence: 0.72,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "hist-dbq-outline",
    courseId: "world-history",
    title: "Research Essay Draft",
    kind: "project",
    dueAt: "2026-05-26T20:00:00",
    tags: ["essay", "outline"],
    priority: "high",
    estimatedMinutes: 45,
    status: "not_started",
    source: "manual",
    progress: 0,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "bio-cell-quiz",
    courseId: "biology",
    title: "Organic Chemistry Quiz",
    kind: "exam",
    type: "exam",
    dueAt: "not-a-date",
    tags: ["quiz", "missing date"],
    priority: "medium",
    estimatedMinutes: 60,
    status: "not_started",
    source: "syllabus",
    progress: 0,
    needsReview: true,
    confidence: 0.64,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "art-sketchbook-review",
    courseId: "studio-art",
    title: "Sketchbook Review",
    kind: "project",
    dueAt: "2026-05-29T15:00:00",
    tags: ["sketchbook"],
    priority: "low",
    estimatedMinutes: 55,
    status: "done",
    source: "manual",
    progress: 1,
    createdAt: now,
    updatedAt: now
  }
];

export const defaultParsedImports: ParsedImport[] = [
  {
    id: "scan-spring-syllabus",
    title: "Spring Syllabus.pdf",
    sourceType: "pdf",
    status: "ready",
    itemCount: 24,
    createdAt: "2026-05-27T08:31:00",
    updatedAt: "2026-05-27T08:32:00"
  },
  {
    id: "scan-ochem-photo",
    title: "Organic Chemistry handout photo",
    sourceType: "photo",
    status: "applied",
    itemCount: 7,
    createdAt: "2026-05-27T08:05:00",
    updatedAt: "2026-05-27T08:08:00"
  }
];

export const defaultParsedItems: ParsedItem[] = [
  {
    id: "parsed-physics-preview",
    parsedImportId: "scan-spring-syllabus",
    title: "Physics Lab Preview",
    courseName: "Physics 201",
    type: "reading",
    dueAt: "2026-06-03T10:00:00",
    confidence: 0.72,
    needsReview: true,
    rawText: "Physics lab preview due June 3.",
    reviewStatus: "needs_review"
  },
  {
    id: "parsed-bio-cell-quiz",
    parsedImportId: "scan-spring-syllabus",
    title: "Organic Chemistry Quiz",
    courseName: "Organic Chemistry",
    type: "exam",
    confidence: 0.64,
    needsReview: true,
    duplicateCandidateId: "bio-cell-quiz",
    rawText: "Cell quiz - no date found.",
    reviewStatus: "needs_review"
  },
  {
    id: "parsed-ochem-midterm",
    parsedImportId: "scan-ochem-photo",
    title: "Organic Chemistry Midterm",
    courseName: "Organic Chemistry",
    type: "exam",
    dueAt: "2026-06-07T09:00:00",
    confidence: 0.9,
    needsReview: false,
    rawText: "Organic Chemistry midterm on June 7.",
    acceptedAt: "2026-05-27T08:08:00",
    reviewStatus: "accepted"
  }
];

export const defaultWidgetPresets: WidgetPreset[] = [
  buildCanonicalWidgetPreset("today", { theme: "light", layout: "list", dataMode: "today", size: "medium" }, new Date(now)),
  buildCanonicalWidgetPreset("upcoming", { theme: "ocean", layout: "timeline", dataMode: "next3", size: "small" }, new Date(now)),
  buildCanonicalWidgetPreset("week", { theme: "graphite", layout: "strip", dataMode: "this_week", size: "medium" }, new Date(now)),
  buildCanonicalWidgetPreset("classProgress", { theme: "forest", layout: "progress", dataMode: "single_class", size: "small" }, new Date(now))
];

export const defaultFocusSessions: FocusSession[] = [
  {
    id: "focus-seed-1",
    assignmentId: "calc-problem-set",
    durationMinutes: 25,
    startedAt: "2026-05-27T09:00:00",
    status: "running",
    sessionNumber: 7,
    notes: "Finished first half of worksheet."
  }
];

export const defaultGradeItems: GradeItem[] = [
  {
    id: "calc-ch3-test",
    courseId: "calculus",
    categoryId: "calc-exams",
    title: "Limits Test",
    earned: 91,
    possible: 100
  },
  {
    id: "ochem-lab-practical",
    courseId: "organic-chemistry",
    categoryId: "ochem-labs",
    title: "Lab Practical",
    earned: 88,
    possible: 100
  },
  {
    id: "phys-lab-score",
    courseId: "physics-201",
    categoryId: "phys-labs",
    title: "Motion Lab",
    earned: 45,
    possible: 50
  }
];
