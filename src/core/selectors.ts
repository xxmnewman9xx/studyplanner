import type { AppState, ClassCourse, Task } from "./types";
import { calculateClassPulse, calculateOverallPulse } from "./pulseEngine";

export function selectTodayClasses(state: AppState, now: Date = new Date()) {
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][now.getDay()];
  return state.classes
    .filter((course) => course.days.includes(day ?? ""))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function selectNextClass(state: AppState, now: Date = new Date()) {
  const today = selectTodayClasses(state, now);
  const current = toMinutes(now);
  return today.find((course) => timeToMinutes(course.startTime) >= current) ?? today[0] ?? state.classes[0] ?? null;
}

export function selectTodayTasks(state: AppState, now: Date = new Date()) {
  const today = dateOnly(now);
  return state.tasks.filter((task) => task.dueDate === today && !task.completed);
}

export function selectUpcomingTasks(state: AppState, now: Date = new Date()) {
  const today = dateOnly(now);
  return state.tasks.filter((task) => task.dueDate > today && !task.completed).sort(sortTasks);
}

export function selectOverdueTasks(state: AppState, now: Date = new Date()) {
  const today = dateOnly(now);
  return state.tasks.filter((task) => task.dueDate < today && !task.completed).sort(sortTasks);
}

export function selectCompletedTasks(state: AppState) {
  return state.tasks.filter((task) => task.completed);
}

export function selectTaskCountToday(state: AppState) {
  return selectTodayTasks(state).length;
}

export function selectClassById(state: AppState, classId: string) {
  return state.classes.find((course) => course.id === classId) ?? state.classes[0] ?? null;
}

export function selectTasksByClass(state: AppState, classId: string) {
  return state.tasks.filter((task) => task.classId === classId).sort(sortTasks);
}

export function selectNotesByClass(state: AppState, classId: string) {
  return state.notes.filter((note) => note.classId === classId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function selectUpcomingExams(state: AppState, now: Date = new Date()) {
  const today = dateOnly(now);
  return state.exams.filter((exam) => exam.date >= today).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export function selectClassPulse(state: AppState, classId: string) {
  return calculateClassPulse(state, classId);
}

export function selectOverallPulse(state: AppState) {
  return calculateOverallPulse(state);
}

export function selectWeeklyLoad(state: AppState) {
  const openTasks = state.tasks.filter((task) => !task.completed);
  const highPriority = openTasks.filter((task) => task.priority === "High").length;
  return {
    hours: 12 + openTasks.length + highPriority * 2,
    label: highPriority > 1 ? "heavy week" : "balanced week",
    heaviestDay: "Thursday",
    blocksToday: Math.max(1, selectTodayTasks(state).length)
  };
}

export function selectRoomReminder(state: AppState) {
  const nextClass = selectNextClass(state);
  if (!nextClass) return null;
  return {
    classId: nextClass.id,
    title: nextClass.title,
    room: nextClass.room,
    startsIn: minutesUntil(nextClass),
    bringItems: nextClass.reminderSettings.bringItems,
    reminderText: `${nextClass.title} starts in ${nextClass.reminderSettings.minutesBefore} min`
  };
}

export function selectHomeDashboardModel(state: AppState) {
  const todayClasses = selectTodayClasses(state);
  const nextClass = selectNextClass(state);
  const todayTasks = selectTodayTasks(state);
  const pulse = selectOverallPulse(state);
  return {
    student: state.student,
    todayClasses,
    nextClass,
    todayTasks,
    upcomingTasks: selectUpcomingTasks(state),
    taskCountToday: todayTasks.length,
    openTasks: state.tasks.filter((task) => !task.completed),
    pulse,
    roomReminder: selectRoomReminder(state),
    weeklyLoad: selectWeeklyLoad(state)
  };
}

export function selectIpadDashboardModel(state: AppState) {
  return {
    ...selectHomeDashboardModel(state),
    notes: state.notes,
    exams: selectUpcomingExams(state)
  };
}

export function selectWatchTodayModel(state: AppState) {
  const nextClass = selectNextClass(state);
  return {
    time: "10:57",
    nextClass,
    taskCount: state.tasks.filter((task) => !task.completed).length,
    startsIn: nextClass ? minutesUntil(nextClass) : "No class"
  };
}

export function selectWatchRoomModel(state: AppState) {
  return selectRoomReminder(state);
}

export function selectWatchPulseModel(state: AppState) {
  const nextClass = selectNextClass(state);
  return nextClass ? selectClassPulse(state, nextClass.id) : selectOverallPulse(state);
}

export function selectWatchTasksModel(state: AppState) {
  return state.tasks.filter((task) => !task.completed).sort(sortTasks).slice(0, 3);
}

export function selectWatchNotificationModel(state: AppState) {
  const reminder = selectRoomReminder(state);
  return {
    title: reminder?.reminderText ?? "No class reminder",
    value: reminder && state.appSettings.showRoomInReminder ? `Room ${reminder.room}` : "Ready",
    detail: reminder?.bringItems.length ? `Bring: ${reminder.bringItems.join(", ")}` : "Leave on time"
  };
}

export function selectComplicationModels(state: AppState) {
  const today = selectWatchTodayModel(state);
  const room = selectWatchRoomModel(state);
  const pulse = selectWatchPulseModel(state);
  return [
    { id: "next", title: "Next", value: shortClass(today.nextClass), detail: today.startsIn },
    { id: "room", title: "Room", value: room?.room ?? "--", detail: "Now" },
    { id: "tasks", title: "Tasks", value: String(today.taskCount), detail: "left" },
    { id: "pulse", title: "Pulse", value: String(pulse.score), detail: pulse.label }
  ];
}

export function classTitle(state: AppState, task: Task) {
  return selectClassById(state, task.classId)?.title ?? "Class";
}

export function dueLabel(task: Task, now: Date = new Date()) {
  const today = dateOnly(now);
  if (task.dueDate === today) return "Today";
  if (task.dueDate < today) return "Overdue";
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (task.dueDate === dateOnly(tomorrow)) return "Tomorrow";
  return task.dueDate;
}

function shortClass(course: ClassCourse | null) {
  if (!course) return "--";
  if (course.title === "Calculus II") return "Calc";
  return course.title.split(" ")[0] ?? course.title;
}

function minutesUntil(course: ClassCourse) {
  return course.startTime === "11:30" ? "28 min" : `${course.startTime}`;
}

function sortTasks(a: Task, b: Task) {
  return `${a.completed}${a.dueDate}${a.dueTime}`.localeCompare(`${b.completed}${b.dueDate}${b.dueTime}`);
}

function timeToMinutes(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function toMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}
