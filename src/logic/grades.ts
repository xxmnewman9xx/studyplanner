import { Course, GradeItem } from "../models";

export type GradeSummary = {
  currentPercent: number;
  completedWeight: number;
  categorySummaries: Array<{
    id: string;
    name: string;
    weight: number;
    average: number | null;
    contribution: number;
  }>;
};

export function summarizeCourseGrade(course: Course, gradeItems: GradeItem[]): GradeSummary {
  const categorySummaries = course.gradeCategories.map((category) => {
    const items = gradeItems.filter(
      (item) => item.courseId === course.id && item.categoryId === category.id
    );
    const earned = items.reduce((sum, item) => sum + item.earned, 0);
    const possible = items.reduce((sum, item) => sum + item.possible, 0);
    const average = possible > 0 ? (earned / possible) * 100 : null;
    const contribution = average === null ? 0 : average * (category.weight / 100);

    return {
      id: category.id,
      name: category.name,
      weight: category.weight,
      average,
      contribution
    };
  });

  const completedWeight = categorySummaries.reduce(
    (sum, category) => sum + (category.average === null ? 0 : category.weight),
    0
  );
  const earnedWeighted = categorySummaries.reduce(
    (sum, category) => sum + category.contribution,
    0
  );
  const currentPercent =
    completedWeight > 0 ? (earnedWeighted / completedWeight) * 100 : 0;

  return {
    currentPercent,
    completedWeight,
    categorySummaries
  };
}

export function calculateNeededOnRemaining(
  currentPercent: number,
  completedWeight: number,
  targetPercent: number
) {
  const remainingWeight = Math.max(100 - completedWeight, 0);

  if (remainingWeight === 0) {
    return currentPercent >= targetPercent ? 0 : Number.POSITIVE_INFINITY;
  }

  const earnedSoFar = currentPercent * (completedWeight / 100);
  const needed = (targetPercent - earnedSoFar) / (remainingWeight / 100);
  return Math.max(0, needed);
}

export function letterFromPercent(percent: number) {
  if (percent >= 93) return "A";
  if (percent >= 90) return "A-";
  if (percent >= 87) return "B+";
  if (percent >= 83) return "B";
  if (percent >= 80) return "B-";
  if (percent >= 77) return "C+";
  if (percent >= 73) return "C";
  if (percent >= 70) return "C-";
  if (percent >= 67) return "D+";
  if (percent >= 63) return "D";
  return "F";
}

export function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  if (!Number.isFinite(value)) return "Not possible";
  return `${value.toFixed(1)}%`;
}
