import * as planner from "./planner";

export const StudyPlannerBrain = {
  buildTodayBrain: planner.buildTodayBrain,
  buildTodayPlan: planner.buildTodayPlan,
  getNextUp: planner.getNextUp,
  getDueToday: planner.getDueToday,
  getDueSoon: planner.getDueSoon,
  getOverdue: planner.getOverdue,
  getNeedsReview: planner.getNeedsReview,
  getCalendarEventsByDay: planner.getCalendarEventsByDay,
  getWeekLoad: planner.getWeekLoad,
  getBusyWeekInsight: planner.getBusyWeekInsight,
  getClassAssignmentCounts: planner.getClassAssignmentCounts,
  getAssignmentNotes: planner.getAssignmentNotes,
  getCourseNotes: planner.getCourseNotes,
  getRelevantNotesForToday: planner.getRelevantNotesForToday,
  getPinnedNotes: planner.getPinnedNotes,
  getWidgetData: planner.getWidgetData,
  getRecommendedWidgetPreset: planner.getRecommendedWidgetPreset,
  getRecommendedFocusDuration: planner.getRecommendedFocusDuration,
  getRecommendedTheme: planner.getRecommendedTheme,
  convertParsedItemsToAssignments: planner.convertParsedItemsToAssignments,
  convertNoteToTask: planner.convertNoteToTask,
  saveWidgetPreset: planner.saveWidgetPreset,
  loadWidgetPreset: planner.loadWidgetPreset,
  resetWidgetPreset: planner.resetWidgetPreset,
  applyTheme: planner.applyTheme,
  applyLocale: planner.applyLocale,
  completeAssignment: planner.completeAssignment,
  startFocusSession: planner.startFocusSession,
  pauseFocusSession: planner.pauseFocusSession,
  endFocusSession: planner.endFocusSession
};

export * from "./planner";
