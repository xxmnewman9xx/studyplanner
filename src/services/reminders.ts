import * as Notifications from "expo-notifications";
import { Assignment, Course } from "../models";
import { isAssignmentOpen } from "../logic/assignmentModel";
import { getCourseForAssignment } from "../logic/planner";

export async function scheduleSmartReminders(assignments: Assignment[], courses: Course[]) {
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Notifications permission was not granted.");
  }

  const openAssignments = assignments.filter((assignment) => isAssignmentOpen(assignment));
  let scheduled = 0;
  const reminderIdsByAssignment: Record<string, string[]> = {};

  for (const assignment of openAssignments) {
    if (assignment.reminderIds?.length) continue;

    const dueDate = new Date(assignment.dueAt);
    const offsets = assignment.kind === "exam" ? [7, 2, 1] : [2, 1];

    for (const offsetDays of offsets) {
      const reminderAt = new Date(dueDate.getTime() - offsetDays * 24 * 60 * 60 * 1000);
      if (reminderAt.getTime() <= Date.now()) continue;

      const course = getCourseForAssignment(courses, assignment);
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title:
            assignment.kind === "exam"
              ? `${course?.code || "Class"} exam countdown`
              : `${course?.code || "Class"} deadline coming up`,
          body: `${assignment.title} is due ${dueDate.toLocaleDateString()}.`,
          data: { assignmentId: assignment.id, courseId: assignment.courseId }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderAt
        }
      });
      reminderIdsByAssignment[assignment.id] = [
        ...(reminderIdsByAssignment[assignment.id] || []),
        id
      ];
      scheduled += 1;
    }
  }

  return { count: scheduled, reminderIdsByAssignment };
}
