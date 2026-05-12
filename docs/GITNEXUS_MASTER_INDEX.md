# GitNexus Master Index

Date: 2026-05-12
Branch: v1-1-widget-command-center
Starting commit: 3cd2663f75803dcd3ba86acaeacabc0e214597a5

## Result

npx gitnexus analyze passed: 2,108 nodes, 4,011 edges, 56 clusters, 182 flows.

## Architecture Map

| Area | Primary files | Release notes |
| --- | --- | --- |
| App shell/state | App.tsx, src/models.ts | Owns onboarding, navigation, planner persistence, premium gates, widget writes. |
| Assignment contract | src/logic/assignmentModel.ts, src/logic/planner.ts | Confirmed-vs-needs-review boundary now centralized in helper functions. |
| Parser/import | src/services/syllabusParser.ts, src/services/syllabusLocalParser.ts, src/screens/ImportScreen.tsx | Endpoint rows are forced untrusted; local parser review cap now warns instead of silently dropping heavy syllabi. |
| Today/Week/Calendar/Classes | src/screens/TodayScreen.tsx, MonthlyCalendarScreen.tsx, WeekPlannerScreen.tsx, CoursesScreen.tsx, src/logic/semesterInsights.ts | Major planner surfaces now use confirmed/open helpers. |
| Widgets | src/logic/widgetSnapshot.ts, src/services/widgetSnapshotService.ts, ios/StudyPlannerWidgetExtension/StudyPlannerWidget.swift | Native small/medium widgets verified; snapshot source excludes unreviewed due dates and carries Needs Check count. |
| IAP/paywall | src/services/purchaseConfig.ts, src/services/subscriptions.tsx, src/screens/UpgradeScreen.tsx | Store-backed monthly/yearly/lifetime config documented; product-load failure recovery fixed. |
| Capture/demo | src/config/storeCapture.ts, src/data/demoSemester.ts | Exact EXPO_PUBLIC_STORE_CAPTURE=1 gate verified; production no-demo proof passed. |
| App icon/assets | app.json, assets/app/study-planner-icon.png, ios/.../AppIcon.appiconset | Source/catalog icon assets refreshed, hash-matched, and simulator verified. |
| QA/tests | package.json, scripts/check-iap-config.mjs, scripts/verify-ios-widgetkit.sh, tests/*.test.ts | Pure logic tests are good; UI/perf/manual release checks remain. |
