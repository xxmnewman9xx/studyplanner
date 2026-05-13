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

const now = "2026-05-13T09:41:00";

export const defaultSemester: Semester = {
  id: "spring-2026",
  name: "Spring Semester",
  startDate: "2026-01-12",
  endDate: "2026-05-22",
  targetGpa: 3.7
};

export const defaultSettings: UserSettings = {
  studentName: "Alex Kim",
  selectedTheme: "sunset",
  customPalette: ["#6C5CE7", "#FF5DA2", "#2DD4BF", "#FDBA2D"],
  defaultWidgetStyle: "glass",
  onboardingComplete: false,
  notificationDefault: "2 hours before due",
  focusDefaultMinutes: 25,
  syncEnabled: true,
  privacyMode: true,
  emojiAccentEnabled: true
};

export const defaultCourses: Course[] = [
  {
    id: "algebra-ii",
    code: "Algebra II",
    name: "Algebra II",
    instructor: "Ms. Patel",
    teacher: "Ms. Patel",
    period: "Period 3",
    room: "Room 214",
    color: "#2F80ED",
    iconKey: "calculator",
    emojiKey: "study",
    semester: defaultSemester.name,
    createdAt: now,
    updatedAt: now,
    meetings: [
      { id: "alg-mon", day: "Mon", startTime: "08:30", endTime: "09:20", location: "214" },
      { id: "alg-wed", day: "Wed", startTime: "08:30", endTime: "09:20", location: "214" },
      { id: "alg-fri", day: "Fri", startTime: "08:30", endTime: "09:20", location: "214" }
    ],
    gradeCategories: [
      { id: "alg-homework", name: "Homework", weight: 35 },
      { id: "alg-tests", name: "Tests", weight: 45 },
      { id: "alg-classwork", name: "Classwork", weight: 20 }
    ]
  },
  {
    id: "chemistry",
    code: "Chemistry",
    name: "Chemistry",
    instructor: "Dr. Lin",
    teacher: "Dr. Lin",
    period: "Period 4",
    room: "Lab 5",
    color: "#10B981",
    iconKey: "flask",
    emojiKey: "science",
    semester: defaultSemester.name,
    createdAt: now,
    updatedAt: now,
    meetings: [
      { id: "chem-tue", day: "Tue", startTime: "09:30", endTime: "10:20", location: "Lab 5" },
      { id: "chem-thu", day: "Thu", startTime: "09:30", endTime: "10:20", location: "Lab 5" }
    ],
    gradeCategories: [
      { id: "chem-labs", name: "Labs", weight: 35 },
      { id: "chem-tests", name: "Tests", weight: 40 },
      { id: "chem-notes", name: "Notes", weight: 25 }
    ]
  },
  {
    id: "english-lit",
    code: "English Lit",
    name: "English Literature",
    instructor: "Mrs. Cho",
    teacher: "Mrs. Cho",
    period: "Period 5",
    room: "Room 118",
    color: "#8B5CF6",
    iconKey: "book",
    emojiKey: "writing",
    semester: defaultSemester.name,
    createdAt: now,
    updatedAt: now,
    meetings: [
      { id: "eng-mon", day: "Mon", startTime: "10:30", endTime: "11:20", location: "118" },
      { id: "eng-wed", day: "Wed", startTime: "10:30", endTime: "11:20", location: "118" }
    ],
    gradeCategories: [
      { id: "eng-essays", name: "Essays", weight: 45 },
      { id: "eng-reading", name: "Reading", weight: 30 },
      { id: "eng-discussion", name: "Discussion", weight: 25 }
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
    id: "alg-worksheet-ch4",
    courseId: "algebra-ii",
    title: "Worksheet Ch. 4 Review",
    kind: "worksheet",
    type: "worksheet",
    dueAt: "2026-05-13T11:30:00",
    tags: ["worksheet", "review"],
    priority: "high",
    estimatedMinutes: 45,
    status: "in_progress",
    source: "syllabus",
    sourceId: "scan-english-syllabus",
    progress: 0.35,
    checklist: [
      { id: "alg-1", title: "Problems 1-12", done: true },
      { id: "alg-2", title: "Problems 13-24", done: false },
      { id: "alg-3", title: "Check odd answers", done: false }
    ],
    reminder: { enabled: true, leadTimeHours: 2 },
    confidence: 0.94,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "chem-lab-report",
    courseId: "chemistry",
    title: "Lab Report: Titration",
    kind: "assignment",
    dueAt: "2026-05-13T17:00:00",
    tags: ["lab", "report"],
    priority: "high",
    estimatedMinutes: 90,
    status: "not_started",
    source: "syllabus",
    progress: 0,
    checklist: [
      { id: "chem-1", title: "Results table", done: false },
      { id: "chem-2", title: "Error analysis", done: false },
      { id: "chem-3", title: "Conclusion", done: false }
    ],
    reminder: { enabled: true, leadTimeHours: 3 },
    confidence: 0.9,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "eng-reading-notes",
    courseId: "english-lit",
    title: "Reading Notes: Act II",
    kind: "reading",
    type: "reading",
    dueAt: "2026-05-14T08:30:00",
    tags: ["reading", "notes"],
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
    title: "Front-load DBQ Outline",
    kind: "project",
    dueAt: "2026-05-14T20:00:00",
    tags: ["essay", "outline"],
    priority: "medium",
    estimatedMinutes: 45,
    status: "not_started",
    source: "manual",
    progress: 0,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "bio-study-guide",
    courseId: "biology",
    title: "Study Guide: Cell Energy",
    kind: "assignment",
    dueAt: "2026-05-15T23:59:00",
    tags: ["study guide"],
    priority: "medium",
    estimatedMinutes: 60,
    status: "not_started",
    source: "syllabus",
    progress: 0,
    duplicateOf: "chem-lab-report",
    needsReview: true,
    confidence: 0.64,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "art-portfolio",
    courseId: "studio-art",
    title: "Portfolio Selects",
    kind: "project",
    dueAt: "2026-05-16T15:00:00",
    tags: ["portfolio"],
    priority: "low",
    estimatedMinutes: 55,
    status: "done",
    source: "manual",
    progress: 1,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "alg-quiz",
    courseId: "algebra-ii",
    title: "Quadratics Quiz",
    kind: "exam",
    dueAt: "2026-05-18T09:00:00",
    tags: ["quiz"],
    priority: "high",
    estimatedMinutes: 120,
    status: "not_started",
    source: "calendar",
    progress: 0,
    createdAt: now,
    updatedAt: now
  }
];

export const defaultParsedImports: ParsedImport[] = [
  {
    id: "scan-english-syllabus",
    title: "English Syllabus.pdf",
    sourceType: "pdf",
    status: "ready",
    itemCount: 24,
    createdAt: "2026-05-13T08:31:00",
    updatedAt: "2026-05-13T08:32:00"
  },
  {
    id: "scan-chem-photo",
    title: "Chemistry handout photo",
    sourceType: "photo",
    status: "applied",
    itemCount: 7,
    createdAt: "2026-05-12T16:05:00",
    updatedAt: "2026-05-12T16:08:00"
  }
];

export const defaultParsedItems: ParsedItem[] = [
  {
    id: "parsed-eng-reading",
    parsedImportId: "scan-english-syllabus",
    title: "Reading Notes",
    courseName: "English Lit",
    type: "reading",
    dueAt: "2026-05-14T08:30:00",
    confidence: 0.72,
    needsReview: true,
    rawText: "Reading notes due May 14.",
    reviewStatus: "needs_review"
  },
  {
    id: "parsed-bio-study",
    parsedImportId: "scan-english-syllabus",
    title: "Study Guide",
    courseName: "Biology",
    type: "assignment",
    confidence: 0.64,
    needsReview: true,
    duplicateCandidateId: "chem-lab-report",
    rawText: "Study guide - no date found.",
    reviewStatus: "needs_review"
  },
  {
    id: "parsed-chem-lab",
    parsedImportId: "scan-chem-photo",
    title: "Lab Report",
    courseName: "Chemistry",
    type: "assignment",
    dueAt: "2026-05-13T17:00:00",
    confidence: 0.9,
    needsReview: false,
    rawText: "Titration lab report due Wednesday.",
    acceptedAt: "2026-05-12T16:08:00",
    reviewStatus: "accepted"
  }
];

export const defaultWidgetPresets: WidgetPreset[] = [
  {
    id: "preset-due-next",
    name: "Due Next",
    type: "due_next",
    size: "medium",
    background: "gradient",
    palette: "sunset",
    font: "SF Pro",
    classFocusCourseId: "algebra-ii",
    layout: "compact",
    iconKey: "book",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "preset-today",
    name: "Today",
    type: "today",
    size: "small",
    background: "solid",
    palette: "ocean",
    font: "SF Pro",
    layout: "list",
    iconKey: "calendar",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "preset-class",
    name: "Class Focus",
    type: "class_focus",
    size: "small",
    background: "dark",
    palette: "midnight",
    font: "Rounded",
    classFocusCourseId: "chemistry",
    layout: "compact",
    iconKey: "flask",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "preset-needs-check",
    name: "Needs Check",
    type: "needs_check",
    size: "small",
    background: "gradient",
    palette: "candy",
    font: "Rounded",
    layout: "list",
    iconKey: "check",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "preset-week",
    name: "Week",
    type: "week",
    size: "medium",
    background: "glass",
    palette: "lavender",
    font: "SF Pro",
    layout: "calendar",
    iconKey: "calendar",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "preset-focus",
    name: "Focus",
    type: "focus",
    size: "small",
    background: "dark",
    palette: "midnight",
    font: "Mono",
    layout: "ring",
    iconKey: "timer",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "preset-streak",
    name: "Streak",
    type: "streak",
    size: "small",
    background: "solid",
    palette: "forest",
    font: "Rounded",
    layout: "ring",
    iconKey: "spark",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "preset-empty",
    name: "Empty State",
    type: "empty",
    size: "small",
    background: "glass",
    palette: "minimal",
    font: "SF Pro",
    layout: "compact",
    iconKey: "check",
    createdAt: now,
    updatedAt: now
  }
];

export const defaultFocusSessions: FocusSession[] = [
  {
    id: "focus-seed-1",
    assignmentId: "alg-worksheet-ch4",
    durationMinutes: 25,
    startedAt: "2026-05-13T08:00:00",
    endedAt: "2026-05-13T08:25:00",
    status: "completed",
    sessionNumber: 7,
    notes: "Finished first half of worksheet."
  }
];

export const defaultGradeItems: GradeItem[] = [
  {
    id: "alg-ch3-test",
    courseId: "algebra-ii",
    categoryId: "alg-tests",
    title: "Chapter 3 Test",
    earned: 91,
    possible: 100
  },
  {
    id: "chem-lab-practical",
    courseId: "chemistry",
    categoryId: "chem-labs",
    title: "Lab Practical",
    earned: 88,
    possible: 100
  },
  {
    id: "eng-essay",
    courseId: "english-lit",
    categoryId: "eng-essays",
    title: "Poetry Essay",
    earned: 45,
    possible: 50
  }
];
