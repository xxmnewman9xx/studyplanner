import { normalizeAssignment } from "../logic/assignmentModel";
import { addDaysLocal, makeDueAt, startOfLocalDay, toDateKey } from "../logic/dateUtils";
import { Assignment, Course, PlannerData, Semester, SyllabusParseResult, SyllabusSource } from "../models";

export const storeCaptureNow = createStoreCaptureNow();

export const messySyllabusExample = `Calculus II / Chemistry 101 / Physics I / English 101 / World History semester packet
This week: Problem Set 4 due tonight, Chem Lab 3 titration around tomorrow.
Physics chapter 7 problems due later this week. English reading reflection tomorrow.
World History notes tomorrow. Chemistry unit exam next week. Midterm review later this month.
Some duplicate rows and scanned page marks included.`;

export const demoWidgetSnapshotCandidate = {
  nextDueAssignmentId: "problem-set-4",
  thisWeekAssignmentIds: [
    "problem-set-4",
    "lab-3-titration",
    "reading-reflection",
    "world-history-notes",
    "chapter-7-problems",
    "physics-motion-lab",
    "reading-quiz"
  ],
  heavyWeekStartsOn: toDateKey(storeCaptureNow),
  heavyWeekItemCount: 7,
  overdueItemCount: 0
};

export function createDemoSemesterSeed(now = storeCaptureNow): PlannerData {
  const semesterStart = toDateKey(addDaysLocal(startOfLocalDay(now), -90));
  const semesterEnd = toDateKey(addDaysLocal(startOfLocalDay(now), 45));
  const semester: Semester = {
    id: "current-semester-demo",
    name: "Current Semester Preview",
    startDate: semesterStart,
    endDate: semesterEnd,
    targetGpa: 3.8
  };
  const courses = createDemoCourses();
  const assignments = createDemoAssignments(courses, now);
  const syllabusSources: SyllabusSource[] = [
    {
      id: "syllabus-demo-messy-current-semester",
      kind: "demo",
      sourceName: "Messy current-semester syllabus packet.txt",
      importedAt: now.toISOString(),
      parser: "demo",
      courseIds: courses.map((course) => course.id),
      assignmentIds: assignments
        .filter((assignment) => assignment.source === "demo")
        .map((assignment) => assignment.id),
      findings: [
        {
          id: "demo-mixed-confidence",
          severity: "needs_review",
          message: "Mixed confidence dates were detected from a messy syllabus packet."
        }
      ],
      rawTextSample: messySyllabusExample
    }
  ];

  return {
    onboarded: true,
    paywallSeen: true,
    semester,
    courses,
    assignments,
    gradeItems: [],
    syllabusSources,
    targetGradePercent: 92,
    updatedAt: now.toISOString()
  };
}

export function createDemoSyllabusParseResult(now = storeCaptureNow): SyllabusParseResult {
  const seed = createDemoSemesterSeed(now);
  const syllabusSource = seed.syllabusSources[0];

  return {
    sourceName: syllabusSource?.sourceName || "Messy current-semester syllabus packet.txt",
    semesterName: seed.semester.name,
    semesterStartDate: seed.semester.startDate,
    semesterEndDate: seed.semester.endDate,
    courses: seed.courses,
    assignments: seed.assignments.filter((assignment) => assignment.source === "demo"),
    gradeItems: seed.gradeItems,
    findings: syllabusSource?.findings || [],
    syllabusSource
  };
}

function createDemoCourses(): Course[] {
  return [
    {
      id: "calc-2",
      code: "Calculus II",
      name: "Sequences and Series",
      instructor: "Professor Moore",
      color: "#2F7CF6",
      meetings: [
        {
          id: "calc-tue-1100",
          day: "Tue",
          startTime: "11:00",
          endTime: "12:15",
          location: "Math 118"
        },
        {
          id: "calc-thu-1100",
          day: "Thu",
          startTime: "11:00",
          endTime: "12:15",
          location: "Math 118"
        }
      ],
      gradeCategories: [
        { id: "calc-homework", name: "Problem Sets", weight: 35 },
        { id: "calc-quizzes", name: "Quizzes", weight: 25 },
        { id: "calc-exams", name: "Exams", weight: 40 }
      ]
    },
    {
      id: "chem-101",
      code: "Chemistry 101",
      name: "General Chemistry",
      instructor: "Dr. Patel",
      color: "#22A66B",
      meetings: [
        {
          id: "chem-mon-1000",
          day: "Mon",
          startTime: "10:00",
          endTime: "10:50",
          location: "Science 112"
        },
        {
          id: "chem-wed-1000",
          day: "Wed",
          startTime: "10:00",
          endTime: "10:50",
          location: "Science 112"
        }
      ],
      gradeCategories: [
        { id: "chem-labs", name: "Labs", weight: 35 },
        { id: "chem-homework", name: "Homework", weight: 25 },
        { id: "chem-exams", name: "Exams", weight: 40 }
      ]
    },
    {
      id: "physics-1",
      code: "Physics I",
      name: "Mechanics",
      instructor: "Prof. Anderson",
      color: "#F97316",
      meetings: [
        {
          id: "physics-tue-1300",
          day: "Tue",
          startTime: "13:00",
          endTime: "14:15",
          location: "Lab 4"
        }
      ],
      gradeCategories: [
        { id: "physics-problems", name: "Problems", weight: 35 },
        { id: "physics-labs", name: "Labs", weight: 30 },
        { id: "physics-exams", name: "Exams", weight: 35 }
      ]
    },
    {
      id: "english-101",
      code: "English 101",
      name: "Reading and Writing",
      instructor: "Prof. Johnson",
      color: "#7C3AED",
      meetings: [
        {
          id: "english-thu-0900",
          day: "Thu",
          startTime: "09:00",
          endTime: "10:15",
          location: "Humanities 220"
        }
      ],
      gradeCategories: [
        { id: "english-reading", name: "Reading", weight: 30 },
        { id: "english-papers", name: "Papers", weight: 50 },
        { id: "english-participation", name: "Participation", weight: 20 }
      ]
    },
    {
      id: "world-history",
      code: "World History",
      name: "Modern World History",
      instructor: "Prof. Lee",
      color: "#EF4444",
      meetings: [
        {
          id: "history-fri-1100",
          day: "Fri",
          startTime: "11:00",
          endTime: "11:50",
          location: "Room 208"
        }
      ],
      gradeCategories: [
        { id: "history-notes", name: "Notes", weight: 25 },
        { id: "history-projects", name: "Projects", weight: 35 },
        { id: "history-exams", name: "Exams", weight: 40 }
      ]
    }
  ];
}

function createDemoAssignments(courses: Course[], now: Date): Assignment[] {
  return [
    demoAssignment(courses, "syllabus-quiz-complete", "world-history", "Syllabus Quiz", "quiz", demoDueAt(now, -6, "14:00"), "accepted", 0.98, "completed", now),
    demoAssignment(courses, "english-reading-complete", "english-101", "Reading Reflection", "reading", demoDueAt(now, -4, "20:00"), "accepted", 0.96, "completed", now),
    demoAssignment(courses, "calc-quiz-complete", "calc-2", "Quiz 1", "quiz", demoDueAt(now, -4, "17:00"), "accepted", 0.96, "completed", now),
    demoAssignment(courses, "problem-set-4", "calc-2", "Problem Set 4", "assignment", demoDueAt(now, 0, "23:59"), "needsReview", 0.94, "open", now),
    demoAssignment(courses, "lab-3-titration", "chem-101", "Lab 3: Titration", "assignment", demoDueAt(now, 1, "23:59"), "needsReview", 0.66, "open", now),
    demoAssignment(courses, "chapter-7-problems", "physics-1", "Chapter 7 Problems", "assignment", demoDueAt(now, 3, "17:00"), "needsReview", 0.89, "open", now),
    demoAssignment(courses, "lab-report", "chem-101", "Lab Report", "assignment", demoDueAt(now, 1, "17:00"), "accepted", 0.97, "open", now),
    demoAssignment(courses, "reading-reflection", "english-101", "Reading Reflection", "reading", demoDueAt(now, 1, "20:00"), "accepted", 0.78, "open", now),
    demoAssignment(courses, "world-history-notes", "world-history", "World History Notes", "reading", demoDueAt(now, 1, "20:00"), "accepted", 0.82, "open", now),
    demoAssignment(courses, "reading-quiz", "world-history", "Reading Quiz", "quiz", demoDueAt(now, 2, "12:00"), "accepted", 0.93, "open", now),
    demoAssignment(courses, "physics-motion-lab", "physics-1", "Motion Lab", "assignment", demoDueAt(now, 6, "18:00"), "accepted", 0.91, "open", now),
    demoAssignment(courses, "chemistry-unit-exam", "chem-101", "Chemistry Unit Exam", "exam", demoDueAt(now, 8, "09:00"), "accepted", 0.98, "open", now),
    demoAssignment(courses, "english-essay-outline", "english-101", "Essay Outline", "project", demoDueAt(now, 10, "17:00"), "accepted", 0.88, "open", now),
    demoAssignment(courses, "midterm-review", "physics-1", "Midterm Review", "assignment", demoDueAt(now, 24, "17:00"), "accepted", 0.86, "open", now),
    demoAssignment(courses, "history-final-review", "world-history", "Final Review", "exam", demoDueAt(now, 13, "13:30"), "accepted", 0.95, "open", now)
  ];
}

function demoAssignment(
  courses: Course[],
  id: string,
  courseId: string,
  title: string,
  type: Assignment["type"],
  dueAt: string,
  reviewStatus: Assignment["reviewStatus"],
  confidence: number,
  completionStatus: Assignment["completionStatus"] = "open",
  now = storeCaptureNow
) {
  const course = courses.find((item) => item.id === courseId);

  return normalizeAssignment(
    {
      id,
      courseId,
      courseName: course?.name || "Course",
      title,
      type,
      kind: type,
      dueAt,
      sourceText: `${title} | ${dueAt.slice(0, 10)} | pulled from messy preview syllabus`,
      confidence,
      reviewStatus,
      completionStatus,
      status: completionStatus === "completed" ? "done" : "not_started",
      source: "demo",
      createdAt: addDaysLocal(startOfLocalDay(now), -100).toISOString(),
      updatedAt: now.toISOString()
    },
    courses,
    now
  );
}

function createStoreCaptureNow() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 41, 0, 0);
}

function demoDueAt(now: Date, dayOffset: number, time: string) {
  const dateKey = toDateKey(addDaysLocal(startOfLocalDay(now), dayOffset));
  return makeDueAt(dateKey, time) || `${dateKey}T${time}:00`;
}
