# WidgetKit Metadata Audit

Date: 2026-05-27

## Result

Pass. The committed EAS source of truth now defines four real WidgetKit Home Screen widgets with canonical kinds, clean gallery names, student-readable descriptions, App Group sharing, and only supported families.

## Widget Matrix

| Widget | WidgetKit kind | Gallery name | Description | Families |
| --- | --- | --- | --- | --- |
| Today | `studyplanner.today` | StudyPlanner Today | See what needs your attention today. | `systemSmall`, `systemMedium` |
| Upcoming | `studyplanner.upcoming` | StudyPlanner Upcoming | Preview upcoming assignments and deadlines. | `systemSmall`, `systemMedium` |
| Week | `studyplanner.week` | StudyPlanner Week | Check your weekly workload at a glance. | `systemMedium` |
| Class Progress | `studyplanner.classProgress` | StudyPlanner Class Progress | Track progress for a selected class. | `systemSmall`, `systemMedium` |

## Registration And Build Source

- `app.json` registers `StudyPlannerTodayWidget`, `StudyPlannerUpcomingWidget`, `StudyPlannerWeekWidget`, and `StudyPlannerClassProgressWidget`.
- `src/widgets/StudyPlannerWidgets.tsx` uses `createWidget("studyplanner.*", ...)` for the native storage/reload keys.
- `./plugins/with-widgetkit-kinds` is listed before `expo-widgets` so Expo mod execution rewrites generated Swift `let name` values to `studyplanner.*` during EAS prebuild.
- Verified with `CI=1 npx expo prebuild --platform ios --no-install`; generated `ios/ExpoWidgetsTarget/StudyPlanner*Widget.swift` files contained the four canonical `studyplanner.*` kinds.
- `ios/ExpoWidgetsTarget/index.swift` registers the four Swift widget structs in the WidgetBundle in the native simulator output.

## Entitlements And App Group

- App Group: `group.com.mattnewman.studyplanner`.
- Widget extension bundle id: `com.mattnewman.studyplanner.widgets`.
- Simulator `appinfo` for build 29 showed `GroupContainers.group.com.mattnewman.studyplanner`.
- Native-readable App Group plist includes `__expo_widgets_studyplanner.today_*`, `__expo_widgets_studyplanner.upcoming_*`, `__expo_widgets_studyplanner.week_*`, and `__expo_widgets_studyplanner.classProgress_*`.

## Stale Metadata Check

- No current config claims Lock Screen accessory families.
- Week is only offered as `systemMedium`.
- Class Progress is a real Swift/provider/view-backed widget, not a fake Studio entry.
- Release notes no longer describe Today/Upcoming-only Lock Screen widgets.
