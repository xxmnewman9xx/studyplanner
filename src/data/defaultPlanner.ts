import { Course, GradeItem, Semester } from "../models";

export const defaultSemester: Semester = {
  id: "fall-2026",
  name: "Fall 2026",
  startDate: "2026-08-24",
  endDate: "2026-12-11",
  targetGpa: 3.5
};

export const defaultCourses: Course[] = [];

export const defaultGradeItems: GradeItem[] = [];
