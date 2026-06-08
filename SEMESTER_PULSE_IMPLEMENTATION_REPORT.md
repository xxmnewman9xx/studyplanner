# Semester Pulse Implementation Report

Date: 2026-06-01

## Outcome

StudyPlanner: Syllabus AI now centers the product around Semester Pulse: a score, status, trend, top reason, and next action that ties Home, Forecast, Focus, Classes, Widget Studio, widgets, Watch, and the paywall back to the same control-system promise.

The implementation kept the existing architecture, tabs, parser, IAP checks, storage contracts, localization pipeline, widget schema, and Watch snapshot schema intact.

## Product Changes

- Added a shared `src/logic/semesterPulse.ts` signal model that computes score, status, trend, reasons, next action, forecast weather state, risk, workload pressure, import confidence, focus consistency, wins, and class risk.
- Reworked Home into `Semester Pulse -> next best action -> reason -> today support -> momentum`.
- Reworked Forecast into a semester weather surface with Calm, Building, Heavy, Peak, and Recovery states plus peak week, top risk, free time, exam pressure, and recommended action.
- Added a small wins loop on Home and Focus completion.
- Reframed Classes as an explanation layer for Pulse, including class-level risk and progress.
- Reworked Widget Studio around practical recommendations: Semester Pulse, Exam Countdown, Next Assignment, Future Risk, Focus Window, and Class Progress.
- Updated native widget snapshots so the week widget broadcasts Semester Pulse while preserving the existing data shape.
- Updated Watch snapshot usage and Swift Watch UI to prioritize Semester Pulse, next due, exam countdown, focus window, and today progress instead of dense lists.
- Reframed the paywall around advanced Pulse, forecast, widgets, Watch, and import confidence.

## Deliverables

- `R_AND_D_PRODUCT_RESEARCH.md`
- `SEMESTER_PULSE_PRODUCT_CONTRACT.md`
- `FEATURE_IMPACT_MAP.md`
- `CEO_PRODUCT_SCORECARD.md`
- `SEMESTER_PULSE_IMPLEMENTATION_REPORT.md`
- `SEMESTER_PULSE_CONTACT_SHEET.png`

## Screenshots

Contact sheet:

- `SEMESTER_PULSE_CONTACT_SHEET.png`

Source captures:

- Home: `artifacts/semester-pulse/screenshots-clean/10-today-light.png`
- Forecast: `artifacts/semester-pulse/screenshots-clean/14-calendar.png`
- Scan: `artifacts/semester-pulse/screenshots-clean/12-scan.png`
- Review Inbox: `artifacts/semester-pulse/screenshots-clean/13-review.png`
- Classes: `artifacts/semester-pulse/screenshots-clean/17-classes.png`
- Focus: `artifacts/semester-pulse/screenshots-clean/18-focus.png`
- Notes: `artifacts/semester-pulse/screenshots-clean/20-notes.png`
- Studio: `artifacts/semester-pulse/screenshots-clean/19-widgets-ocean.png`
- Widgets: `artifacts/semester-pulse/screenshots-clean/22-widgets-native.png`
- Watch: `artifacts/semester-pulse/screenshots/21-watch.png`
- Paywall: `artifacts/semester-pulse/screenshots-clean/24-paywall.png`

## QA Results

Passed:

- `npm run typecheck`
- `npm run check:localization`
- `npm run check:scenarios`
- `npm run test:customization`
- `npm run test:student-life-depth`
- `npm run test:planner`
- `npm run test:widgets`
- `npm run test:widget-integrity`
- `npm run check:widget-no-crop`
- `npm run test:parser`
- `npm run test:capture-parser`
- `npm run test:backend-platform`
- `npm run check:iap`

Builds:

- iOS app: passed with `StudyPlannerSyllabusAI` Release workspace scheme on `iphonesimulator`.
- Widget extension: passed with `ExpoWidgetsTarget` Release workspace scheme on `iphonesimulator`.
- Watch app: passed with direct `StudyPlannerWatchApp` Release project target on `watchsimulator`.
- Watch complication/widgets: passed with direct `StudyPlannerWatchWidgets` Release project target on `watchsimulator`.

Notes:

- The standalone `StudyPlannerWatchApp` workspace scheme on `watchsimulator` currently pulls UIKit-only React Native pod targets into the watchOS compile and fails inside `RCTSwiftUIContainerView.swift`. The narrower direct native Watch target build passes and is the relevant proof for the Watch app code changed in this pass.
- The standalone `StudyPlannerWatchWidgets` workspace scheme initially used the wrong generic destination in parallel build testing and hit Xcode build-database contention. The direct Watch widgets target passes.

## GitNexus Impact Summary

Impact analysis was run before edits. Blast radius highlights:

- `SemesterPulse`: CRITICAL, because the shared component appears in high-visibility product flows. The public component API was kept backward compatible.
- `TodayScreen`, `PlanScreen`, `MoreScreen`, `FocusScreen`, `CoursesScreen`, `UpgradeScreen`, `AppContent`, and `WatchDashboardView`: LOW direct app-screen blast radius.
- `buildStudyPlannerWidgetSnapshots` and `buildStudyPlannerWatchSnapshot`: HIGH because they feed external surfaces. Existing schemas were preserved and widget privacy tests passed.

Final staged `gitnexus detect-changes --scope staged --repo studyplanner` result:

- Changes: 34 code/indexed files, 117 symbols.
- Affected processes: 43.
- Risk level: critical.
- Primary affected flows: `BuildStudyPlannerWidgetSnapshots`, `BuildStudyPlannerWatchSnapshot`, `MoreScreen`, `TodayScreen`, and `AppContent`.

The critical risk is expected because this pass intentionally promotes a shared Pulse signal into Home, Forecast, widget snapshots, and Watch snapshots.

## Reviewer Scores

Final scores are recorded in `CEO_PRODUCT_SCORECARD.md`.

Surface minimum: 9.0 after revisions.

- Home: 9.3
- Forecast: 9.2
- Scan: 9.0
- Review Inbox: 9.0
- Classes: 9.0
- Focus: 9.1
- Notes: 9.0
- Studio: 9.1
- Widgets: 9.1
- Watch: 9.0
- Paywall: 9.0

## Remaining Weaknesses

- The Watch simulator screenshot still shows the no-sync state, because paired simulator data handoff did not populate the Watch app during capture. The snapshot generation and native Watch UI were updated and builds/tests pass, but a real paired-device proof should be captured before App Store final review.
- Native widgets are represented by generated snapshot proof plus widget integrity and no-crop tests, not a manually placed Home Screen screenshot.
- Very long class names can still compress in compact Forecast fact rows. The copy is bounded and no-crop validation passes, but the next refinement should shorten risk labels earlier.
