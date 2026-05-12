import { normalizeAssignment } from "../logic/assignmentModel";
import { Assignment, Course, PlannerData, Semester, SyllabusParseResult, SyllabusSource } from "../models";

export const storeCaptureNow = new Date("2025-03-10T09:41:00-04:00");

export const messySyllabusExample = `BIO 101 / CALC II / ENG 201 / PSY 201 spring packet
Week 9: problem set maybe 3/10, discussion post due 3/10 11:59p, group worksheet 3.
BIO lab report #2 due Mar 11. Reading response 3 due Mar 12.
Psych weekly quiz 5 around Mar 14. Midterm exam BIO Mar 28.
Research paper April 24. Essay outline April 14. Some duplicate PDF rows.`;

export const demoWidgetSnapshotCandidate = {
  nextDueAssignmentId: "problem-set-4",
  thisWeekAssignmentIds: [
    "problem-set-4",
    "discussion-post",
    "group-worksheet-3",
    "lab-report-2",
    "reading-response-3",
    "weekly-quiz-5"
  ],
  heavyWeekStartsOn: "2025-03-10",
  heavyWeekItemCount: 6,
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
      id: "bio-101",
      code: "Biology 101",
      name: "Intro to Biology",
      instructor: "Dr. Nguyen",
      color: "#31C77F",
      meetings: [
        {
          id: "bio-mon-0900",
          day: "Mon",
          startTime: "09:00",
          endTime: "10:15",
          location: "Science 204"
        },
        {
          id: "bio-wed-0900",
          day: "Wed",
          startTime: "09:00",
          endTime: "10:15",
          location: "Science 204"
        }
      ],
      gradeCategories: [
        { id: "bio-exams", name: "Exams", weight: 45 },
        { id: "bio-labs", name: "Labs", weight: 35 },
        { id: "bio-homework", name: "Homework", weight: 20 }
      ]
    },
    {
      id: "calc-2",
      code: "Calculus II",
      name: "Differential Calculus",
      instructor: "Prof. Singh",
      color: "#7C4DFF",
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
      id: "eng-201",
      code: "English 201",
      name: "Academic Writing",
      instructor: "Prof. Alvarez",
      color: "#F97316",
      meetings: [
        {
          id: "eng-fri-1000",
          day: "Fri",
          startTime: "10:00",
          endTime: "11:15",
          location: "Humanities 220"
        }
      ],
      gradeCategories: [
        { id: "eng-papers", name: "Papers", weight: 55 },
        { id: "eng-reading", name: "Reading", weight: 25 },
        { id: "eng-participation", name: "Participation", weight: 20 }
      ]
    },
    {
      id: "psych-201",
      code: "Psychology 201",
      name: "Intro to Psychology",
      instructor: "Dr. Brooks",
      color: "#4ADE80",
      meetings: [
        {
          id: "psych-mon-1400",
          day: "Mon",
          startTime: "14:00",
          endTime: "15:15",
          location: "Social Science 3"
        }
      ],
      gradeCategories: [
        { id: "psych-discussion", name: "Discussion", weight: 30 },
        { id: "psych-quizzes", name: "Quizzes", weight: 30 },
        { id: "psych-exams", name: "Exams", weight: 40 }
      ]
    }
  ];
}

function createDemoAssignments(courses: Course[]): Assignment[] {
  return [
    demoAssignment(courses, "bio-chapter-review-complete", "bio-101", "Chapter 6 review notes", "reading", "2025-03-03T20:00:00", "accepted", 0.98, "completed"),
    demoAssignment(courses, "calc-quiz-complete", "calc-2", "Limits quiz corrections", "quiz", "2025-03-05T17:00:00", "accepted", 0.96, "completed"),
    demoAssignment(courses, "problem-set-4", "calc-2", "Problem Set 4", "assignment", "2025-03-10T17:00:00", "needsReview", 0.94),
    demoAssignment(courses, "discussion-post", "psych-201", "Discussion Post", "assignment", "2025-03-10T23:59:00", "needsReview", 0.66),
    demoAssignment(courses, "group-worksheet-3", "calc-2", "Group Worksheet 3", "assignment", "2025-03-10T19:30:00", "needsReview", 0.89),
    demoAssignment(courses, "lab-report-2", "bio-101", "Lab Report #2", "assignment", "2025-03-11T23:59:00", "needsReview", 0.97),
    demoAssignment(courses, "reading-response-3", "eng-201", "Reading Response 3", "reading", "2025-03-12T23:59:00", "needsReview", 0.78),
    demoAssignment(courses, "weekly-quiz-5", "psych-201", "Weekly Quiz 5", "quiz", "2025-03-14T12:00:00", "needsReview", 0.82),
    demoAssignment(courses, "research-paper", "eng-201", "Research Paper", "project", "2025-04-24T17:00:00", "needsReview", 0.93),
    demoAssignment(courses, "midterm-exam", "bio-101", "Midterm Exam", "exam", "2025-03-28T09:00:00", "accepted", 0.98),
    demoAssignment(courses, "bio-midterm-study-guide", "bio-101", "Midterm study guide", "reading", "2025-03-28T20:00:00", "accepted", 0.91),
    demoAssignment(courses, "essay-outline", "eng-201", "Essay outline", "project", "2025-04-14T17:00:00", "accepted", 0.88),
    demoAssignment(courses, "calc-midterm-review", "calc-2", "Midterm review packet", "assignment", "2025-03-20T18:00:00", "accepted", 0.86),
    demoAssignment(courses, "psych-final-exam", "psych-201", "Final exam review", "exam", "2025-05-05T13:30:00", "accepted", 0.95)
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
      updatedAt: "2025-03-10T13:41:00.000Z"
    },
    courses,
    storeCaptureNow
  );
}
