# Evidence Ledger

Date: 2026-05-12

| Claim | Evidence | Verdict |
| --- | --- | --- |
| Baseline branch was synchronized before implementation | `git fetch origin v1-1-widget-command-center` and `git pull --ff-only origin v1-1-widget-command-center` both passed; branch `v1-1-widget-command-center`; starting commit `3cd2663f75803dcd3ba86acaeacabc0e214597a5`. | Pass |
| GitNexus indexing was run before implementation | `npx gitnexus analyze` passed with 2,108 nodes, 4,011 edges, 56 clusters, and 182 flows. | Pass |
| Subagent review happened before coding | Five explorer subagents produced evidence bundles covering all 22 requested roles; findings are summarized in `docs/SUBAGENT_REVIEWS.md`. | Pass |
| 250 use cases were generated before coding | `docs/USE_CASE_SWARM_250.md` contains 250 scenarios across the required categories. | Pass |
| Top 20 weaknesses were ranked before coding | `docs/TOP_20_WEAKNESSES.md` ranks 20 issues with evidence, impact, fix strategy, status, and QA status. | Pass |
| Parser output remains untrusted until review | `src/services/syllabusParser.ts` forces endpoint/parser rows to `source: "syllabus"` and `reviewStatus: "needsReview"`; `src/logic/assignmentModel.ts` centralizes `isAssignmentConfirmed` and `isAssignmentOpen`. | Fixed |
| Unreviewed work does not power confirmed due-date surfaces | `src/logic/planner.ts`, `src/logic/semesterInsights.ts`, `src/screens/CoursesScreen.tsx`, `src/services/reminders.ts`, and `src/services/calendarSync.ts` filter through confirmed/open helpers. | Fixed |
| Review Inbox can still show unreviewed Needs Check work | `App.tsx` persists all assignments; `src/screens/TodayScreen.tsx` surfaces a Needs Check card without treating those rows as due dates. | Pass |
| Accepted assignment source proof is not inflated by ignored rows | `App.tsx` rebuilds `syllabusSource.assignmentIds` from normalized accepted rows in `applyParsedPlan`. | Fixed |
| Local parser no longer silently drops heavy syllabi at 30 items | `src/services/syllabusLocalParser.ts` raises the review limit to 75 and emits `deadline-review-limit`; `tests/syllabusLocalParser.test.ts` covers the behavior. | Fixed |
| Widgets are powered by confirmed data plus review count | `npm run test` widget snapshot tests passed; capture WidgetKit payload had accepted `thisWeek` rows and `reviewQueueCount: 3`. | Pass |
| Production mode does not leak demo widget data | `EXPO_PUBLIC_STORE_CAPTURE=0 ./scripts/verify-ios-widgetkit.sh` produced payload with no `demoState`, empty `thisWeek`, and `reviewQueueCount: 0`. | Pass |
| Capture mode is visibly labeled | `EXPO_PUBLIC_STORE_CAPTURE=1 ./scripts/verify-ios-widgetkit.sh` produced payload with `demoState.enabled: true` and label `Preview`. | Pass |
| Monthly/yearly IAP IDs are preserved | `src/services/purchaseConfig.ts` documents `com.mattnewman.studyplanner.plus.monthly` and `com.mattnewman.studyplanner.plus.yearly`; `npm run check:iap` passed. | Pass |
| Lifetime is only prepared as a real non-consumable path | `src/services/purchaseConfig.ts` documents `com.mattnewman.studyplanner.plus.lifetime`; `src/services/subscriptions.tsx` uses store-backed in-app purchase paths, not fake entitlement. | Pass, store configuration still external |
| Paywall can recover from product-load failure | `src/services/subscriptions.tsx` now catches product load failures, exits loading, clears selected products, and retries through `refreshStore`. | Fixed |
| Production capture flag is guarded | `scripts/verify-production-config.mjs` fails if `EXPO_PUBLIC_STORE_CAPTURE=1`; `npm run verify:production` passed. | Pass |
| App icon assets are synchronized | `assets/app/study-planner-icon.png` and iOS AppIcon 1024 PNG share SHA-256 `3333a89f570b9d6b6e211b76c13a4be31b9648b377cd8d0a6b474bbc95e7d53e`. | Fixed |
| App icon was verified on simulator home screen | `artifacts/master-review-and-reimplementation/20-app-icon-home-screen.png` shows the refreshed icon on StudyPlanner-Codex-iPhone. | Pass |
| Required non-video screenshot proof exists where supported | 18 screenshots plus `21-contact-sheet.png` were captured in `artifacts/master-review-and-reimplementation`; large and lock-screen native widgets are documented unsupported. | Partial pass |
| Final non-simulator checks pass | `npx expo install --check`, `npm run typecheck`, `npm run test`, `npm run check:iap`, and `npm run verify:production` passed after fixes. | Pass |
| iOS simulator build passed | `npx expo run:ios --device 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE` built, installed, and launched successfully. | Pass |
