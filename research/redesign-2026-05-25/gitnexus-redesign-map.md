# GitNexus Redesign Map

GitNexus status: up to date for repo `studyplanner` at commit `a512aa1`.

## App Shell

- `AppContent` is the central route/state hub.
- Direct screen dependents: `OnboardingScreen`, `TodayScreen`, `ImportScreen`, `PlanScreen`, `CoursesScreen`, `FocusScreen`, `MoreScreen`, `UpgradeScreen`, `NotesScreen`, `GradesScreen`, `AssignmentDetailScreen`.
- Screen function impact checks for Today, Import, Plan, Courses, Focus, More, Onboarding, Upgrade, and `AppContent` were LOW: each routes through `AppContent` then `App`.

## Scan / Parser Flow

- `ImportScreen.runParse` calls `parseSyllabus`.
- `parseSyllabus` calls `parseSyllabusWithEndpoint`, `parseSyllabusOnDevice`, and `parseSyllabusText`.
- Photo/camera parsing requires the endpoint path; typed text and text PDF flow can parse locally.
- `buildUploadBody` was previously flagged as CRITICAL risk, so this pass did not modify parser upload code.

## Planner / Today / Calendar

- `TodayScreen` uses `buildTodayPlan`, `daysUntil`, `formatDateOnly`, `getCourseForAssignment`, and `parseQuickHomeworkInput`.
- `PlanScreen` uses `getCalendarEventsByDay`, `getWeekLoad`, `getBusyWeekInsight`, and quick homework parsing.
- Quick assignment creation remains routed through `AppContent.onAddQuickAssignment`.

## Classes / Focus

- `CoursesScreen` uses real `Course`, `Assignment`, `Semester`, and `StudyNote` state plus `getClassAssignmentCounts` and `groupMeetingsByDay`.
- `FocusScreen` records real `FocusSession` rows and can mark assignments complete.

## Widgets

- `MoreScreen.nativeSnapshots` and `OnboardingScreen.widgetSnapshots` call `buildStudyPlannerWidgetSnapshots`.
- `syncStudyPlannerWidgets` also calls `buildStudyPlannerWidgetSnapshots` for native widget sync.
- Widget snapshots depend on reviewed assignments, due dates, style presets, privacy mode, and platform availability.

## Change Risk

- Current aggregate uncommitted diff maps to 28 symbols and 25 affected processes, risk CRITICAL due to breadth.
- Individual screen function blast radius remains LOW.
- Required pre-commit check: `npx gitnexus detect-changes --repo studyplanner`.
