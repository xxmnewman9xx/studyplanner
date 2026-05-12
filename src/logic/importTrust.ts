import { SyllabusParseResult } from "../models";
import {
  createSyllabusSourceFromParse,
  isAssignmentConfirmed,
  normalizeAssignments
} from "./assignmentModel";

export function buildTrustedParsedPlan(parse: SyllabusParseResult) {
  const assignments = normalizeAssignments(parse.assignments, parse.courses).filter(
    isAssignmentConfirmed
  );
  if (assignments.length === 0) return null;

  const courseIds = new Set(assignments.map((assignment) => assignment.courseId));
  const courses = parse.courses.filter((course) => courseIds.has(course.id));
  const gradeItems: SyllabusParseResult["gradeItems"] = [];
  const trustedParse = {
    sourceName: parse.sourceName,
    courses,
    assignments,
    gradeItems,
    findings: parse.findings
  };
  const syllabusSource = parse.syllabusSource
    ? {
        ...parse.syllabusSource,
        courseIds: courses.map((course) => course.id),
        assignmentIds: assignments.map((assignment) => assignment.id),
        findings: parse.findings
      }
    : createSyllabusSourceFromParse(trustedParse, "device");

  return {
    ...trustedParse,
    syllabusSource
  };
}
