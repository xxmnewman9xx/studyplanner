export type NavTab = "today" | "import" | "courses" | "grades" | "focus" | "upgrade";

export type Priority = "low" | "medium" | "high";

export type AssignmentStatus = "not_started" | "in_progress" | "done" | "archived";

export type AssignmentKind = "assignment" | "exam";

export type Semester = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  targetGpa?: number;
};

export type PlannerData = {
  onboarded: boolean;
  paywallSeen: boolean;
  semester: Semester;
  courses: Course[];
  assignments: Assignment[];
  gradeItems: GradeItem[];
  targetGradePercent: number;
};

export type PlannerSettings = {
  themeMode: "light" | "dark";
};

export type ClassMeeting = {
  id: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  startTime: string;
  endTime: string;
  location: string;
};

export type GradeCategory = {
  id: string;
  name: string;
  weight: number;
};

export type Course = {
  id: string;
  code: string;
  name: string;
  instructor?: string;
  color: string;
  meetings: ClassMeeting[];
  gradeCategories: GradeCategory[];
};

export type Assignment = {
  id: string;
  courseId: string;
  title: string;
  kind: AssignmentKind;
  dueAt: string;
  tags: string[];
  priority: Priority;
  estimatedMinutes: number;
  status: AssignmentStatus;
  source: "manual" | "syllabus" | "calendar" | "canvas";
  gradeWeight?: number;
  reminderIds?: string[];
  externalCalendarEventId?: string;
};

export type GradeItem = {
  id: string;
  courseId: string;
  categoryId: string;
  title: string;
  earned: number;
  possible: number;
};

export type SyllabusImportSource = {
  kind: "pdf" | "photo";
  uri?: string;
  name?: string;
  mimeType?: string;
};

export type ParserFinding = {
  id: string;
  severity: "info" | "needs_review";
  message: string;
};

export type SyllabusParseResult = {
  sourceName: string;
  semesterName?: string;
  semesterStartDate?: string;
  semesterEndDate?: string;
  courses: Course[];
  assignments: Assignment[];
  gradeItems: GradeItem[];
  findings: ParserFinding[];
};
