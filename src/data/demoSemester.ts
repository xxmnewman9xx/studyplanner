import { normalizeAssignment } from "../logic/assignmentModel";
import { Assignment, Course, PlannerData, Semester, SyllabusParseResult, SyllabusSource } from "../models";

export const storeCaptureNow = new Date("2026-10-05T12:00:00-04:00");

export const messySyllabusExample = `BIO 101 / HIST 204 / STAT 215 / ART 118 fall packet
week 5: reading response? due maybe 10/3; STAT p-set due 10/4 (see table)
Oct 5 discussion board - primary source post
10/6 lab prep, cells + microscope; Oct. 8 stats worksheet quiz review
BIO MIDTERM Friday Oct 9 9am. Art critique notes by 10/10.
Later: essay outline 10/20, regression lab 10/21, portfolio check 10/22, Stat Exam 10/23.
Final exam: HIST 204 Dec 9 1:30pm. Some rows duplicated in the PDF export.`;

export const demoWidgetSnapshotCandidate = {
  nextDueAssignmentId: "hist-forum-week-6",
  thisWeekAssignmentIds: [
    "hist-forum-week-6",
    "bio-lab-prep-cells",
    "stat-worksheet-quiz-review",
    "bio-midterm-cells",
    "art-critique-notes"
  ],
  heavyWeekStartsOn: "2026-10-05",
  heavyWeekItemCount: 5,
  overdueItemCount: 2
};

export function createDemoSemesterSeed(now = storeCaptureNow): PlannerData {
  const semester: Semester = {
    id: "fall-2026-demo",
    name: "Fall 2026 Preview",
    startDate: "2026-08-24",
    endDate: "2026-12-11",
    targetGpa: 3.7
  };
  const courses = createDemoCourses();
  const assignments = createDemoAssignments(courses);
  const syllabusSources: SyllabusSource[] = [
    {
      id: "syllabus-demo-messy-fall-2026",
      kind: "demo",
      sourceName: "Messy Fall 2026 syllabus packet.txt",
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
    targetGradePercent: 91,
    updatedAt: now.toISOString()
  };
}

export function createDemoSyllabusParseResult(now = storeCaptureNow): SyllabusParseResult {
  const seed = createDemoSemesterSeed(now);
  const syllabusSource = seed.syllabusSources[0];

  return {
    sourceName: syllabusSource?.sourceName || "Messy Fall 2026 syllabus packet.txt",
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
      code: "BIO 101",
      name: "Intro Biology",
      instructor: "Dr. Nguyen",
      color: "#2F855A",
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
      id: "hist-204",
      code: "HIST 204",
      name: "Modern World History",
      instructor: "Prof. Alvarez",
      color: "#8B5CF6",
      meetings: [
        {
          id: "hist-tue-1100",
          day: "Tue",
          startTime: "11:00",
          endTime: "12:15",
          location: "Humanities 118"
        }
      ],
      gradeCategories: [
        { id: "hist-papers", name: "Papers", weight: 45 },
        { id: "hist-exams", name: "Exams", weight: 35 },
        { id: "hist-discussion", name: "Discussion", weight: 20 }
      ]
    },
    {
      id: "stat-215",
      code: "STAT 215",
      name: "Applied Statistics",
      instructor: "Dr. Brooks",
      color: "#2563EB",
      meetings: [
        {
          id: "stat-mon-1400",
          day: "Mon",
          startTime: "14:00",
          endTime: "15:15",
          location: "Data Lab 3"
        },
        {
          id: "stat-thu-1400",
          day: "Thu",
          startTime: "14:00",
          endTime: "15:15",
          location: "Data Lab 3"
        }
      ],
      gradeCategories: [
        { id: "stat-homework", name: "Homework", weight: 30 },
        { id: "stat-projects", name: "Projects", weight: 30 },
        { id: "stat-exams", name: "Exams", weight: 40 }
      ]
    },
    {
      id: "art-118",
      code: "ART 118",
      name: "Design Studio",
      instructor: "Maya Chen",
      color: "#D97706",
      meetings: [
        {
          id: "art-fri-1000",
          day: "Fri",
          startTime: "10:00",
          endTime: "12:40",
          location: "Studio B"
        }
      ],
      gradeCategories: [
        { id: "art-critiques", name: "Critiques", weight: 40 },
        { id: "art-portfolio", name: "Portfolio", weight: 40 },
        { id: "art-process", name: "Process", weight: 20 }
      ]
    }
  ];
}

function createDemoAssignments(courses: Course[]): Assignment[] {
  return [
    demoAssignment(courses, "hist-timeline-complete", "hist-204", "Timeline warmup", "assignment", "2026-09-25T17:00:00", "accepted", 0.98, "completed"),
    demoAssignment(courses, "bio-safety-quiz-complete", "bio-101", "Lab safety quiz", "quiz", "2026-09-28T23:59:00", "accepted", 0.97, "completed"),
    demoAssignment(courses, "stat-problem-set-overdue", "stat-215", "Problem Set 4: sampling distributions", "assignment", "2026-10-04T23:59:00", "needsReview", 0.62),
    demoAssignment(courses, "art-reading-overdue", "art-118", "Reading response: Bauhaus notes", "reading", "2026-10-03T18:00:00", "accepted", 0.91),
    demoAssignment(courses, "hist-forum-week-6", "hist-204", "Discussion board: primary source post", "assignment", "2026-10-05T18:00:00", "needsReview", 0.58),
    demoAssignment(courses, "bio-lab-prep-cells", "bio-101", "Lab prep: cells and microscopes", "assignment", "2026-10-06T21:00:00", "accepted", 0.94),
    demoAssignment(courses, "stat-worksheet-quiz-review", "stat-215", "Quiz review worksheet", "quiz", "2026-10-08T16:00:00", "needsReview", 0.76),
    demoAssignment(courses, "art-critique-notes", "art-118", "Critique notes: color systems", "assignment", "2026-10-10T12:00:00", "needsReview", 0.81),
    demoAssignment(courses, "bio-lab-mitosis", "bio-101", "Mitosis lab report", "assignment", "2026-10-14T23:59:00", "accepted", 0.92),
    demoAssignment(courses, "hist-primary-source", "hist-204", "Primary source annotation set", "reading", "2026-10-15T17:00:00", "needsReview", 0.68),
    demoAssignment(courses, "stat-regression-lab", "stat-215", "Regression lab notebook", "project", "2026-10-17T20:00:00", "accepted", 0.9),
    demoAssignment(courses, "art-color-study", "art-118", "Color study board", "project", "2026-10-18T15:00:00", "accepted", 0.96),
    demoAssignment(courses, "bio-problem-set-5", "bio-101", "Problem Set 5: genetics", "assignment", "2026-10-20T23:59:00", "accepted", 0.93),
    demoAssignment(courses, "hist-essay-outline", "hist-204", "Essay outline and thesis", "project", "2026-10-20T17:00:00", "needsReview", 0.71),
    demoAssignment(courses, "stat-project-proposal", "stat-215", "Project proposal: campus survey", "project", "2026-10-21T18:00:00", "needsReview", 0.69),
    demoAssignment(courses, "art-portfolio-check", "art-118", "Portfolio checkpoint", "project", "2026-10-22T12:00:00", "accepted", 0.95),
    demoAssignment(courses, "bio-chapter-9-reading", "bio-101", "Reading notes: Chapter 9", "reading", "2026-10-26T20:00:00", "accepted", 0.89),
    demoAssignment(courses, "hist-map-quiz-prep", "hist-204", "Map quiz prep sheet", "quiz", "2026-10-28T17:00:00", "accepted", 0.88),
    demoAssignment(courses, "stat-mini-project", "stat-215", "Mini project: visualization draft", "project", "2026-10-30T18:00:00", "accepted", 0.91),
    demoAssignment(courses, "art-gallery-reflection", "art-118", "Gallery reflection", "reading", "2026-11-02T19:00:00", "needsReview", 0.73),
    demoAssignment(courses, "bio-midterm-cells", "bio-101", "Midterm: cells and genetics", "exam", "2026-10-09T09:00:00", "accepted", 0.98),
    demoAssignment(courses, "stat-exam-regression", "stat-215", "Exam 2: regression and inference", "exam", "2026-10-23T14:00:00", "accepted", 0.97),
    demoAssignment(courses, "hist-final-exam", "hist-204", "Final exam: global systems", "exam", "2026-12-09T13:30:00", "accepted", 0.95)
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
      createdAt: "2026-08-20T12:00:00.000Z",
      updatedAt: "2026-10-05T16:00:00.000Z"
    },
    courses,
    storeCaptureNow
  );
}
