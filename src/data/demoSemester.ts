import { normalizeAssignment } from "../logic/assignmentModel";
import { Assignment, Course, PlannerData, Semester, SyllabusParseResult, SyllabusSource } from "../models";

export const storeCaptureNow = new Date("2025-04-22T09:41:00-04:00");

export const messySyllabusExample = `Calculus II / Chemistry 101 / Physics I / English 101 / World History spring packet
Week of Apr 22: Problem Set 4 due Apr 22 11:59p, Chem Lab 3 titration around Apr 23.
Physics chapter 7 problems due Apr 25. English reading reflection Apr 23.
World History notes due Apr 23. Chemistry unit exam Apr 30. Midterm review May 16.
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
  heavyWeekStartsOn: "2025-04-22",
  heavyWeekItemCount: 7,
  overdueItemCount: 0
};

export function createDemoSemesterSeed(now = storeCaptureNow): PlannerData {
  const semester: Semester = {
    id: "spring-2025-demo",
    name: "Spring 2025 Preview",
    startDate: "2025-01-13",
    endDate: "2025-05-09",
    targetGpa: 3.8
  };
  const courses = createDemoCourses();
  const assignments = createDemoAssignments(courses);
  const syllabusSources: SyllabusSource[] = [
    {
      id: "syllabus-demo-messy-spring-2025",
      kind: "demo",
      sourceName: "Messy Spring 2025 syllabus packet.txt",
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
    sourceName: syllabusSource?.sourceName || "Messy Spring 2025 syllabus packet.txt",
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

function createDemoAssignments(courses: Course[]): Assignment[] {
  return [
    demoAssignment(courses, "syllabus-quiz-complete", "world-history", "Syllabus Quiz", "quiz", "2025-04-16T14:00:00", "accepted", 0.98, "completed"),
    demoAssignment(courses, "english-reading-complete", "english-101", "Reading Reflection", "reading", "2025-04-18T20:00:00", "accepted", 0.96, "completed"),
    demoAssignment(courses, "calc-quiz-complete", "calc-2", "Quiz 1", "quiz", "2025-04-18T17:00:00", "accepted", 0.96, "completed"),
    demoAssignment(courses, "problem-set-4", "calc-2", "Problem Set 4", "assignment", "2025-04-22T23:59:00", "needsReview", 0.94),
    demoAssignment(courses, "lab-3-titration", "chem-101", "Lab 3: Titration", "assignment", "2025-04-23T23:59:00", "needsReview", 0.66),
    demoAssignment(courses, "chapter-7-problems", "physics-1", "Chapter 7 Problems", "assignment", "2025-04-25T17:00:00", "needsReview", 0.89),
    demoAssignment(courses, "lab-report", "chem-101", "Lab Report", "assignment", "2025-04-23T17:00:00", "accepted", 0.97),
    demoAssignment(courses, "reading-reflection", "english-101", "Reading Reflection", "reading", "2025-04-23T20:00:00", "accepted", 0.78),
    demoAssignment(courses, "world-history-notes", "world-history", "World History Notes", "reading", "2025-04-23T20:00:00", "accepted", 0.82),
    demoAssignment(courses, "reading-quiz", "world-history", "Reading Quiz", "quiz", "2025-04-24T12:00:00", "accepted", 0.93),
    demoAssignment(courses, "physics-motion-lab", "physics-1", "Motion Lab", "assignment", "2025-04-28T18:00:00", "accepted", 0.91),
    demoAssignment(courses, "chemistry-unit-exam", "chem-101", "Chemistry Unit Exam", "exam", "2025-04-30T09:00:00", "accepted", 0.98),
    demoAssignment(courses, "english-essay-outline", "english-101", "Essay Outline", "project", "2025-05-02T17:00:00", "accepted", 0.88),
    demoAssignment(courses, "midterm-review", "physics-1", "Midterm Review", "assignment", "2025-05-16T17:00:00", "accepted", 0.86),
    demoAssignment(courses, "history-final-review", "world-history", "Final Review", "exam", "2025-05-05T13:30:00", "accepted", 0.95)
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
  completionStatus: Assignment["completionStatus"] = "open"
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
      createdAt: "2025-01-10T12:00:00.000Z",
      updatedAt: "2025-04-22T13:41:00.000Z"
    },
    courses,
    storeCaptureNow
  );
}
