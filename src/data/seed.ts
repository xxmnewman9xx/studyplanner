import { Assignment, Course, GradeItem, Semester } from "../models";
import { colors } from "../theme";

export const seedSemester: Semester = {
  id: "fall-2026",
  name: "Fall 2026",
  startDate: "2026-08-24",
  endDate: "2026-12-11",
  targetGpa: 3.5
};

export const seedCourses: Course[] = [
  {
    id: "bio-101",
    code: "BIO 101",
    name: "Intro Biology",
    instructor: "Dr. Nguyen",
    color: colors.sage,
    meetings: [
      {
        id: "bio-mon",
        day: "Mon",
        startTime: "09:00",
        endTime: "10:15",
        location: "Science 204"
      },
      {
        id: "bio-wed",
        day: "Wed",
        startTime: "09:00",
        endTime: "10:15",
        location: "Science 204"
      }
    ],
    gradeCategories: [
      { id: "bio-exams", name: "Exams", weight: 45 },
      { id: "bio-labs", name: "Labs", weight: 25 },
      { id: "bio-homework", name: "Homework", weight: 20 },
      { id: "bio-participation", name: "Participation", weight: 10 }
    ]
  },
  {
    id: "hist-210",
    code: "HIST 210",
    name: "U.S. History Since 1877",
    instructor: "Prof. Alvarez",
    color: colors.coral,
    meetings: [
      {
        id: "hist-tue",
        day: "Tue",
        startTime: "13:30",
        endTime: "14:45",
        location: "Humanities 118"
      },
      {
        id: "hist-thu",
        day: "Thu",
        startTime: "13:30",
        endTime: "14:45",
        location: "Humanities 118"
      }
    ],
    gradeCategories: [
      { id: "hist-papers", name: "Papers", weight: 40 },
      { id: "hist-exams", name: "Exams", weight: 35 },
      { id: "hist-discussion", name: "Discussion", weight: 15 },
      { id: "hist-quizzes", name: "Quizzes", weight: 10 }
    ]
  },
  {
    id: "math-150",
    code: "MATH 150",
    name: "Precalculus",
    instructor: "Ms. Brooks",
    color: colors.blue,
    meetings: [
      {
        id: "math-mon",
        day: "Mon",
        startTime: "11:00",
        endTime: "11:50",
        location: "Math 12"
      },
      {
        id: "math-wed",
        day: "Wed",
        startTime: "11:00",
        endTime: "11:50",
        location: "Math 12"
      },
      {
        id: "math-fri",
        day: "Fri",
        startTime: "11:00",
        endTime: "11:50",
        location: "Math 12"
      }
    ],
    gradeCategories: [
      { id: "math-tests", name: "Tests", weight: 50 },
      { id: "math-homework", name: "Homework", weight: 25 },
      { id: "math-quizzes", name: "Quizzes", weight: 15 },
      { id: "math-final", name: "Final", weight: 10 }
    ]
  }
];

export const seedAssignments: Assignment[] = [
  {
    id: "bio-lab-1",
    courseId: "bio-101",
    title: "Lab 1 writeup",
    kind: "assignment",
    dueAt: "2026-09-02T23:59:00-04:00",
    tags: ["lab", "writing"],
    priority: "medium",
    estimatedMinutes: 75,
    status: "in_progress",
    source: "syllabus"
  },
  {
    id: "hist-primary-source",
    courseId: "hist-210",
    title: "Primary source response",
    kind: "assignment",
    dueAt: "2026-09-03T17:00:00-04:00",
    tags: ["paper"],
    priority: "medium",
    estimatedMinutes: 90,
    status: "not_started",
    source: "syllabus"
  },
  {
    id: "math-quiz-1",
    courseId: "math-150",
    title: "Quiz 1: functions",
    kind: "exam",
    dueAt: "2026-09-04T11:00:00-04:00",
    tags: ["quiz", "functions"],
    priority: "high",
    estimatedMinutes: 120,
    status: "not_started",
    source: "syllabus",
    gradeWeight: 5
  },
  {
    id: "bio-exam-1",
    courseId: "bio-101",
    title: "Exam 1: cells and genetics",
    kind: "exam",
    dueAt: "2026-09-18T09:00:00-04:00",
    tags: ["exam", "study"],
    priority: "high",
    estimatedMinutes: 240,
    status: "not_started",
    source: "syllabus",
    gradeWeight: 15
  }
];

export const seedGradeItems: GradeItem[] = [
  {
    id: "bio-hw-0",
    courseId: "bio-101",
    categoryId: "bio-homework",
    title: "Syllabus quiz",
    earned: 10,
    possible: 10
  },
  {
    id: "bio-lab-0",
    courseId: "bio-101",
    categoryId: "bio-labs",
    title: "Lab safety",
    earned: 18,
    possible: 20
  },
  {
    id: "hist-discussion-0",
    courseId: "hist-210",
    categoryId: "hist-discussion",
    title: "Week 1 discussion",
    earned: 9,
    possible: 10
  },
  {
    id: "math-hw-0",
    courseId: "math-150",
    categoryId: "math-homework",
    title: "Problem set 1",
    earned: 28,
    possible: 30
  }
];
