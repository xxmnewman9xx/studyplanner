import { Assignment, Course, GradeItem, SyllabusImportSource, SyllabusParseResult } from "../models";
import { colors } from "../theme";

export async function parseSyllabusStub(
  source: SyllabusImportSource
): Promise<SyllabusParseResult> {
  await delay(650);

  const courseId = "eng-102";
  const courses: Course[] = [
    {
      id: courseId,
      code: "ENG 102",
      name: "Composition and Research",
      instructor: "Dr. Patel",
      color: colors.green,
      meetings: [
        {
          id: "eng-tue",
          day: "Tue",
          startTime: "10:00",
          endTime: "11:15",
          location: "Library 302"
        },
        {
          id: "eng-thu",
          day: "Thu",
          startTime: "10:00",
          endTime: "11:15",
          location: "Library 302"
        }
      ],
      gradeCategories: [
        { id: "eng-essays", name: "Essays", weight: 45 },
        { id: "eng-research", name: "Research Project", weight: 30 },
        { id: "eng-discussion", name: "Discussion", weight: 15 },
        { id: "eng-final", name: "Final Portfolio", weight: 10 }
      ]
    }
  ];

  const assignments: Assignment[] = [
    {
      id: "eng-rhetorical-analysis",
      courseId,
      title: "Rhetorical analysis draft",
      kind: "assignment",
      dueAt: "2026-09-08T23:59:00-04:00",
      tags: ["essay", "draft"],
      priority: "high",
      estimatedMinutes: 150,
      status: "not_started",
      source: "syllabus",
      gradeWeight: 10
    },
    {
      id: "eng-library-workshop",
      courseId,
      title: "Library research worksheet",
      kind: "assignment",
      dueAt: "2026-09-15T10:00:00-04:00",
      tags: ["research"],
      priority: "medium",
      estimatedMinutes: 45,
      status: "not_started",
      source: "syllabus"
    },
    {
      id: "eng-midterm",
      courseId,
      title: "Midterm portfolio check",
      kind: "exam",
      dueAt: "2026-10-13T10:00:00-04:00",
      tags: ["portfolio", "exam"],
      priority: "high",
      estimatedMinutes: 180,
      status: "not_started",
      source: "syllabus",
      gradeWeight: 15
    },
    {
      id: "eng-final-portfolio",
      courseId,
      title: "Final portfolio",
      kind: "assignment",
      dueAt: "2026-12-08T23:59:00-05:00",
      tags: ["final", "portfolio"],
      priority: "high",
      estimatedMinutes: 240,
      status: "not_started",
      source: "syllabus",
      gradeWeight: 10
    }
  ];

  const gradeItems: GradeItem[] = [
    {
      id: "eng-discussion-week-1",
      courseId,
      categoryId: "eng-discussion",
      title: "Discussion check-in",
      earned: 10,
      possible: 10
    }
  ];

  return {
    sourceName: source.name || source.kind,
    semesterName: "Fall 2026",
    semesterStartDate: "2026-08-24",
    semesterEndDate: "2026-12-11",
    courses,
    assignments,
    gradeItems,
    findings: [
      {
        id: "office-hours",
        severity: "info",
        message: "Office hours detected but not added to schedule."
      },
      {
        id: "date-confidence",
        severity: "needs_review",
        message: "One assignment used a relative date; review before applying."
      }
    ]
  };
}

export function updateParsedAssignment(
  parse: SyllabusParseResult,
  assignmentId: string,
  patch: Partial<Assignment>
) {
  return {
    ...parse,
    assignments: parse.assignments.map((assignment) =>
      assignment.id === assignmentId ? { ...assignment, ...patch } : assignment
    )
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
