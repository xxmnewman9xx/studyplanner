import * as Calendar from "expo-calendar";
import { Assignment, Course } from "../models";
import { isAssignmentOpen } from "../logic/assignmentModel";
import { getCourseForAssignment } from "../logic/planner";

const plannerCalendarTitle = "Study Planner";

export async function syncAssignmentsToDeviceCalendar(
  assignments: Assignment[],
  courses: Course[]
) {
  const permission = await Calendar.requestCalendarPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Calendar permission was not granted.");
  }

  const calendarId = await getOrCreatePlannerCalendar();
  const openAssignments = assignments.filter(
    (assignment) => isAssignmentOpen(assignment) && !assignment.externalCalendarEventId
  );
  const calendarEventIdsByAssignment: Record<string, string> = {};

  for (const assignment of openAssignments) {
    const course = getCourseForAssignment(courses, assignment);
    const due = new Date(assignment.dueAt);
    const startDate = assignment.kind === "exam" ? due : new Date(due.getTime() - 30 * 60 * 1000);
    const endDate = assignment.kind === "exam" ? new Date(due.getTime() + 75 * 60 * 1000) : due;

    const eventId = await Calendar.createEventAsync(calendarId, {
      title: `${course?.code || "Class"}: ${assignment.title}`,
      notes: `Created by Study Planner. Priority: ${assignment.priority}.`,
      startDate,
      endDate,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    calendarEventIdsByAssignment[assignment.id] = eventId;
  }

  return { count: openAssignments.length, calendarEventIdsByAssignment };
}

async function getOrCreatePlannerCalendar() {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const existing = calendars.find((calendar) => calendar.title === plannerCalendarTitle);
  if (existing) return existing.id;

  const defaultCalendar = calendars.find((calendar) => calendar.allowsModifications) || calendars[0];
  return Calendar.createCalendarAsync({
    title: plannerCalendarTitle,
    color: "#7FA184",
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: defaultCalendar?.source?.id,
    source: defaultCalendar?.source,
    name: plannerCalendarTitle,
    ownerAccount: "personal",
    accessLevel: Calendar.CalendarAccessLevel.OWNER
  });
}
