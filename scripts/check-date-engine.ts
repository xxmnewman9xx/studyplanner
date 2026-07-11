import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import Module from "node:module";
import { mock } from "node:test";

function installReactNativeShim() {
  type ModuleLoader = (request: string, parent: unknown, isMain: boolean) => unknown;
  const moduleWithLoad = Module as unknown as { _load: ModuleLoader };
  const originalLoad = moduleWithLoad._load;
  moduleWithLoad._load = (request, parent, isMain) => {
    if (request === "react-native") return { Platform: { OS: "ios" } };
    return originalLoad(request, parent, isMain);
  };
  return () => {
    moduleWithLoad._load = originalLoad;
  };
}

void (async () => {
  const probeMode = process.argv.includes("--probe");

  if (!probeMode) {
    for (const timeZone of ["Pacific/Kiritimati", "America/New_York"]) {
      const result = spawnSync(process.execPath, ["--import", "tsx", __filename, "--probe"], {
        cwd: process.cwd(),
        encoding: "utf8",
        env: { ...process.env, TZ: timeZone },
      });
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
      assert.equal(result.status, 0, `${timeZone} date-engine probe failed`);
    }
    console.log("Date engine checks passed in Pacific/Kiritimati and America/New_York");
  } else {
    const RealDate = Date;
    const beforeMidnightMs = new RealDate(2026, 5, 30, 23, 55, 0, 0).getTime();
    const afterMidnightMs = new RealDate(2026, 6, 1, 0, 5, 0, 0).getTime();

    mock.timers.enable({ apis: ["Date"], now: beforeMidnightMs });

    const {
      buildDashboardSnapshot,
      buildNotificationPlan,
      buildSchedulePlan,
      buildSemesterSnapshot,
      createNaturalLanguageTask,
      dateKey,
      daysUntilTask,
      dueDateTime,
      replanAfterMissedBlock,
    } = await import("../src/intelligence");
    const { analyzeSyllabus, deadlineInsight } = await import("../src/ai");
    const { applyTaskRecurrencePatch } = await import("../src/ownership/semesterOwnership");
    const { scanStudyNoteText } = await import("../src/services/noteScanner");
    const { defaultData, isoFromOffset } = await import("../src/seed");
    let buildNativeWidgetSnapshots: typeof import("../src/widgetEngine").buildNativeWidgetSnapshots;
    let normalizeData: typeof import("../src/storage").normalizeData;
    const restoreReactNative = installReactNativeShim();
    try {
      buildNativeWidgetSnapshots = (await import("../src/widgetEngine")).buildNativeWidgetSnapshots;
      normalizeData = (await import("../src/storage")).normalizeData;
    } finally {
      restoreReactNative();
    }

    assert.equal(dateKey(new Date(2026, 0, 15, 12, 0, 0)), "2026-01-15", "January key must use the local calendar date");
    assert.equal(dateKey(new Date(2026, 6, 15, 12, 0, 0)), "2026-07-15", "July key must use the local calendar date");

    const relativeTask = {
      id: "relative-task",
      title: "Relative task",
      classId: "class",
      type: "Assignment",
      dueOffset: 0,
      dueDate: "",
      time: "5:00 PM",
      estimateMinutes: 45,
      done: false,
      urgent: true,
      source: "Date engine test",
      subtasks: [],
    };
    const fixedTask = {
      ...relativeTask,
      id: "fixed-task",
      dueOffset: 99,
      dueDate: "2026-07-01",
      time: "11:59 PM",
    };
    const relativeExam = {
      id: "relative-exam",
      classId: "class",
      title: "Relative exam",
      dueOffset: 0,
      dueDate: "",
      time: "9:00 AM",
      room: "Room 101",
      topics: [],
    };
    const relativeData = {
      ...defaultData,
      tasks: [relativeTask],
    };

    const classFixture = {
      id: "bio",
      code: "BIO 101",
      name: "Biology",
      professor: "Professor",
      room: "Room 101",
      days: "Mon Wed",
      time: "10:00 AM",
      next: "Monday",
      health: 0.8,
      grade: "Not set",
      color: "#0A84FF",
      color2: "#30D158",
      icon: "book-open",
    };
    const actionTask = { ...fixedTask, id: "action-task", classId: classFixture.id, dueDate: "2026-06-30" };
    const fixedData = {
      ...defaultData,
      classes: [classFixture],
      tasks: [actionTask],
    };
    const missedBlock = {
      id: "missed",
      day: "Tonight",
      time: "7:00 PM",
      taskId: actionTask.id,
      classId: classFixture.id,
      title: actionTask.title,
      minutes: 45,
      reason: "Date engine test",
      completed: false,
      missed: true,
      date: "2026-06-30",
    };

    assert.equal(isoFromOffset(0), "2026-06-30", "date offsets must begin on the pre-midnight local date");
    assert.equal(dateKey(dueDateTime(relativeTask)), "2026-06-30", "default due date must use the pre-midnight local date");
    assert.equal(daysUntilTask(fixedTask), 1, "fixed July 1 task must be one day away before midnight");
    assert.equal(buildDashboardSnapshot(relativeData).todayKey, "2026-06-30", "dashboard must begin on June 30");
    assert.equal(buildSemesterSnapshot(relativeData).todayKey, "2026-06-30", "semester snapshot must begin on June 30");
    assert.equal(buildSchedulePlan(relativeData).blocks[0]?.date, "2026-06-30", "default schedule must begin on June 30");
    assert.match(
      buildSemesterSnapshot(fixedData).recommendedActions.find((item) => item.taskId === actionTask.id)?.detail || "",
      /Today/,
      "recommended-action copy must use the pre-midnight date"
    );
    const captureBeforeMidnight = createNaturalLanguageTask("Draft outline for BIO 101 due tomorrow", fixedData);
    assert(captureBeforeMidnight.ok, "truthful capture must parse before midnight");
    if (captureBeforeMidnight.ok) assert.equal(captureBeforeMidnight.task.dueDate, "2026-07-01", "capture tomorrow must be July 1 before midnight");
    assert.equal(replanAfterMissedBlock(fixedData, missedBlock).studyBlocks[0]?.date, "2026-07-01", "missed-block repair must target July 1 before midnight");
    const importBeforeMidnight = analyzeSyllabus("BIO 101 Biology\nDraft outline due tomorrow", defaultData);
    const importedTaskBeforeMidnight = importBeforeMidnight.candidates.find((candidate) => candidate.kind === "task" && candidate.title !== "Review imported syllabus");
    assert.equal((importedTaskBeforeMidnight?.payload as { dueDate?: string } | undefined)?.dueDate, "2026-07-01", "syllabus tomorrow must be July 1 before midnight");
    const normalizedBeforeMidnight = normalizeData({
      ...defaultData,
      tasks: [{ ...relativeTask, dueDate: "" }],
      exams: [relativeExam],
    });
    assert.equal(normalizedBeforeMidnight.tasks[0]?.dueDate, "2026-06-30", "storage task fallback must use the pre-midnight local date");
    assert.equal(normalizedBeforeMidnight.exams[0]?.dueDate, "2026-06-30", "storage exam fallback must use the pre-midnight local date");
    const noteBeforeMidnight = scanStudyNoteText("Homework: review lab notes due today", "OCR note", new Date());
    assert.equal(noteBeforeMidnight.taskCandidates[0]?.dueDate, "2026-06-30", "note parsing must preserve the pre-midnight local date");
    const widgetBeforeMidnight = buildNativeWidgetSnapshots({
      ...defaultData,
      tasks: [{ ...fixedTask, dueDate: "2026-06-30" }],
      exams: [],
    });
    assert.equal(widgetBeforeMidnight.week.calendarDays?.[0]?.id, "2026-06-30", "widget calendar must begin on the pre-midnight local date");
    assert.equal(widgetBeforeMidnight.week.calendarDays?.[0]?.count, 1, "widget calendar must count work against its local day ID");

    const recurrenceAnchor = {
      ...fixedTask,
      id: "recurrence-0",
      dueDate: "2026-07-01",
      recurringId: "recurrence-series",
      recurrenceIndex: 0,
      recurrenceEndDate: "2026-07-31",
    };
    const recurrenceNext = {
      ...recurrenceAnchor,
      id: "recurrence-1",
      dueDate: "2026-07-08",
      recurrenceIndex: 1,
    };
    const shiftedRecurrence = applyTaskRecurrencePatch(
      [recurrenceAnchor, recurrenceNext],
      recurrenceAnchor,
      { dueDate: "2026-07-02" },
      "future"
    );
    assert.equal(shiftedRecurrence[0]?.dueDate, "2026-07-02", "recurrence edit must preserve the patched anchor date");
    assert.equal(shiftedRecurrence[1]?.dueDate, "2026-07-09", "recurrence edit must shift future local dates without UTC drift");

    mock.timers.setTime(afterMidnightMs);

    assert.equal(isoFromOffset(0), "2026-07-01", "date offsets must advance after midnight");
    assert.equal(dateKey(dueDateTime(relativeTask)), "2026-07-01", "default due date must advance after midnight");
    assert.equal(daysUntilTask(fixedTask), 0, "fixed July 1 task must become due today after midnight");
    assert.equal(buildDashboardSnapshot(relativeData).todayKey, "2026-07-01", "dashboard must advance after midnight");
    assert.equal(buildSemesterSnapshot(relativeData).todayKey, "2026-07-01", "semester snapshot must advance after midnight");
    assert.equal(buildSchedulePlan(relativeData).blocks[0]?.date, "2026-07-01", "default schedule must advance after midnight");
    assert.match(
      buildSemesterSnapshot(fixedData).recommendedActions.find((item) => item.taskId === actionTask.id)?.detail || "",
      /recover/,
      "recommended-action copy must advance after midnight"
    );
    const captureAfterMidnight = createNaturalLanguageTask("Draft outline for BIO 101 due tomorrow", fixedData);
    assert(captureAfterMidnight.ok, "truthful capture must parse after midnight");
    if (captureAfterMidnight.ok) assert.equal(captureAfterMidnight.task.dueDate, "2026-07-02", "capture tomorrow must advance to July 2 after midnight");
    assert.equal(replanAfterMissedBlock(fixedData, missedBlock).studyBlocks[0]?.date, "2026-07-02", "missed-block repair must advance after midnight");
    const importAfterMidnight = analyzeSyllabus("BIO 101 Biology\nDraft outline due tomorrow", defaultData);
    const importedTaskAfterMidnight = importAfterMidnight.candidates.find((candidate) => candidate.kind === "task" && candidate.title !== "Review imported syllabus");
    assert.equal((importedTaskAfterMidnight?.payload as { dueDate?: string } | undefined)?.dueDate, "2026-07-02", "syllabus tomorrow must advance after midnight");
    const normalizedAfterMidnight = normalizeData({
      ...defaultData,
      tasks: [{ ...relativeTask, dueDate: "" }],
      exams: [relativeExam],
    });
    assert.equal(normalizedAfterMidnight.tasks[0]?.dueDate, "2026-07-01", "storage task fallback must advance after midnight");
    assert.equal(normalizedAfterMidnight.exams[0]?.dueDate, "2026-07-01", "storage exam fallback must advance after midnight");
    const noteAfterMidnight = scanStudyNoteText("Homework: review lab notes due today", "OCR note", new Date());
    assert.equal(noteAfterMidnight.taskCandidates[0]?.dueDate, "2026-07-01", "note parsing must advance on the local midnight boundary");
    const widgetAfterMidnight = buildNativeWidgetSnapshots({
      ...defaultData,
      tasks: [{ ...fixedTask, dueDate: "2026-07-01" }],
      exams: [],
    });
    assert.equal(widgetAfterMidnight.week.calendarDays?.[0]?.id, "2026-07-01", "widget calendar must advance on the local midnight boundary");
    assert.equal(widgetAfterMidnight.week.calendarDays?.[0]?.count, 1, "widget calendar counts must follow the advanced local day ID");

    const injectedNow = new Date(2026, 0, 15, 9, 0, 0);
    assert.equal(dateKey(dueDateTime(relativeTask, injectedNow)), "2026-01-15", "explicit now must override the runtime clock");
    assert.equal(buildDashboardSnapshot(relativeData, injectedNow).todayKey, "2026-01-15", "dashboard must preserve explicit now injection");
    assert.match(deadlineInsight(fixedData, injectedNow).headline, /Thursday/, "deadline insight must use its injected weekday");

    const reminderTask = { ...relativeTask, id: "reminder-task", dueOffset: 1 };
    const notificationPlan = buildNotificationPlan({ ...defaultData, tasks: [reminderTask] }, injectedNow);
    const assignmentReminder = notificationPlan.items.find((item) => item.kind === "Assignment");
    assert(assignmentReminder, "notification plan must include the injected-now assignment");
    assert.equal(
      dateKey(new Date(assignmentReminder.triggerAt)),
      "2026-01-16",
      "notification internals must derive relative deadlines from the passed now"
    );

    mock.timers.reset();
    console.log(`Date engine probe passed (${process.env.TZ})`);
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
