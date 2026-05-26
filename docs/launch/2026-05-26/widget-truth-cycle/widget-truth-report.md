# Widget Truth Report

Date: 2026-05-26

## State Flow

Widget Studio draft state is built in `MoreScreen`, previewed through `buildStudyPlannerWidgetSnapshots`, saved into `widgetPresets`, persisted in `study-planner-data-v3`, then synced through `syncStudyPlannerWidgets`.

Native sync uses `expo-widgets`:

`Widget Studio -> widgetPresets -> PlannerData AsyncStorage -> syncStudyPlannerWidgets -> StudyPlannerTodayWidget.updateSnapshot / StudyPlannerUpcomingWidget.updateSnapshot -> App Group UserDefaults timeline -> WidgetKit reloadTimelines(ofKind:)`.

## Fixes

- Replaced synthetic native progress defaults with completion ratios from saved assignments.
- Today widgets now carry real due-today completion progress while overdue catch-up rows can still lead the action list.
- Upcoming widgets now carry visible-week completion progress.
- Small native widgets use the first real assignment/course as the primary answer instead of count-first output.
- Circular accessory widgets now render state-specific labels such as `Review`, `Class/Add`, `Scan/Start`, `Clear`, or the next real course.
- Widget Studio advanced previews use real week workload bars, class assignment rows, and focus completion copy instead of hard-coded ring/bar values.
- Saved focus timer starts are now persisted as transient sessions and replaced by paused/completed/stopped records.
- `check:scenarios` no longer fails only because generated `ios/` files are absent; it validates generated Swift when present and app/native config otherwise.

## Native Build Proof

Temporary native project: `/tmp/studyplanner-native-qa.MIlPZI`.

Final current-worktree rebuild: `/tmp/studyplanner-native-final-qa.jsqQSY`.

Validated:

- `npx expo prebuild --platform ios --no-install` generated `ios/ExpoWidgetsTarget/StudyPlannerTodayWidget.swift`.
- Generated `StudyPlannerTodayWidget` and `StudyPlannerUpcomingWidget` support `systemSmall`, `systemMedium`, `accessoryCircular`, `accessoryRectangular`, and `accessoryInline`.
- App target and widget target both include `group.com.mattnewman.studyplanner`.
- Widget bundle id is `com.mattnewman.studyplanner.widgets`.
- Release simulator build succeeded for `StudyPlanner-QA-iPhone`.
- Installed Release app launched on simulator.
- App Group plist contains both widget layouts and both widget timelines after launch.
- Final current-worktree Release build succeeded and embedded `StudyPlannerSyllabusAI.app/PlugIns/ExpoWidgetsTarget.appex`.

Screenshots:

- `screenshots/native-release-launch.png`
- `screenshots/native-home-screen-after-install.png`
- `screenshots/native-widget-gallery-studyplanner-search.png`
- `screenshots/native-widget-gallery-studyplanner-detail.png`
- `screenshots/native-widget-gallery-medium-preview.png`
- `screenshots/native-home-screen-small-widget-placed.png`
- `screenshots/native-home-screen-small-medium-widgets-final.png`
- `screenshots/native-home-screen-after-relaunch-small-medium-widgets.png`
- `screenshots/widget-fixtures/widget-fixture-contact-sheet.png`

Fixture proof:

- `screenshots/widget-fixtures/widget-fixture-summary.txt`
- `screenshots/widget-fixtures/widget-fixture-proof.json`

## Result

The previous native visibility risk was not a bad WidgetKit target. The concrete repo failure was stale scenario validation that assumed a checked-in generated `ios/` directory. Generated native output and Release simulator build both validate the extension target, App Group, supported families, embedded appex, and App Group timeline writes.
