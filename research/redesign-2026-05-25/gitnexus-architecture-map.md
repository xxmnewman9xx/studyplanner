# GitNexus Architecture Map

Index: `studyplanner`, commit `a512aa1`, 103 files, 2399 symbols, 4487 edges, 209 flows. Status was up to date.

## App Shell

- `App.tsx` owns `AppContent`, route state, onboarding/paywall gates, deep links, capture routes, planner state, persistence, and screen callbacks.
- Main tabs: `today`, `import`, `plan`, `courses`, `more`.
- Secondary screens: `notes`, `focus`, `grades`, `upgrade`, `AssignmentDetailScreen`.
- Tablet system header now sends review action to `import`, not `plan`.

## Frontend Screens

- `TodayScreen`: daily command center built from `buildTodayPlan`; now renders the existing quick homework capture loop.
- `ImportScreen`: source selection, parser call, editable review, apply gate; now has a summary gate and bulk confirm for valid rows.
- `PlanScreen`: month grid, selected-day agenda, workload density, week groups; now renders quick capture and saved focus-block survival plan.
- `CoursesScreen`: class library, course hub, class details, linked notes, homework add.
- `MoreScreen`: Widget Studio, settings, trust, paywall/support links; secondary tools now appear before the studio.
- `OnboardingScreen`: animated real app previews; now includes Today between Calendar and Classes.

## Parser and Review

- `ImportScreen.runParse` calls `parseSyllabus`.
- `parseSyllabus` routes typed text to `parseSyllabusText`.
- PDF/photo use `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT` when configured.
- Without endpoint, local text extraction handles text PDFs/plain text; local image OCR throws.
- `normalizeParseResult` validates endpoint JSON into the app model.
- `AppContent.applyParsedPlan` merges courses, assignments, grades, parsed imports/items, semester data, and then opens Today.

## Persistence

- `storage.ts` writes local data through AsyncStorage, then web localStorage, cookie, memory fallback.
- Whole planner record uses `study-planner-data-v3`.
- No account/cloud sync exists in this repo.

## IAP and Entitlement

- `SubscriptionProvider` uses `expo-iap` on native when product IDs are configured.
- Web/unconfigured store fails closed as unavailable.
- `resolveEntitlement` derives Plus from store subscriptions or lifetime purchases.
- A 24-hour local grace record is used only after a recent verified entitlement.

## Widgets

- `buildStudyPlannerWidgetSnapshots` emits Today/Upcoming snapshots from reviewed, valid assignments only.
- `syncStudyPlannerWidgets` opportunistically updates native widgets on iOS when the native widget module is present.
- `StudyPlannerWidgets.tsx` defines the Expo widget layouts.

## GitNexus Impact Notes

- `TodayScreen`, `PlanScreen`, `ImportScreen`, `MoreScreen`, `OnboardingScreen`, `AppContent`, `StudySystemHeader`, and `isSyllabusParsingConfigured`: LOW risk.
- `isDraftAssignmentFlagged`: LOW risk.
- `buildUploadBody`: CRITICAL risk, so this pass did not change parser upload code.
