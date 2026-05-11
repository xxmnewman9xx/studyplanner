# StudyPlanner Widget Core Repo Map

Generated on Windows after a fresh clone into `C:\Users\xxmne\work\studyplanner-widget-core`.

## GitNexus Baseline

- Command run first: `npx gitnexus analyze`
- Result: 265 nodes, 765 edges, 23 clusters, 20 flows
- Indexed commit: `a6717d9d0f53d52b2735df3f311b151cf60ad4e0`
- Status check: `npx gitnexus status` reported the index up to date
- Limitation in this Codex session: GitNexus MCP resources/tools were not exposed after indexing, so blast-radius work used the CLI index, generated `AGENTS.md`/`CLAUDE.md`, and direct source inspection.

## App Architecture

StudyPlanner is a compact Expo React Native app with a single top-level state owner in `App.tsx`.

- Entry point: `package.json` uses `node_modules/expo/AppEntry.js`
- App shell: `App.tsx`
- Shared theme: `src/theme.ts`, `src/themeContext.tsx`
- Components: `src/components/*`
- Screens: `src/screens/*`
- Pure planner logic: `src/logic/planner.ts`
- Storage and native services: `src/services/*`
- Defaults: `src/data/defaultPlanner.ts`
- Expo config: `app.json`, `eas.json`, `babel.config.js`, `tsconfig.json`

`App.tsx` owns hydrated planner state and persists it as one JSON blob under `study-planner-data-v2`.

## Navigation Structure

Navigation is state-based, not React Navigation.

- `activeTab` chooses the main tab.
- `selectedAssignmentId` temporarily replaces the active tab with `AssignmentDetailScreen`.
- Current tabs: `today`, `import`, `courses`, `grades`, `focus`, `upgrade`.
- Plus-gated tabs/actions are checked in `App.tsx` before rendering import, grades, reminders, and calendar sync.

Current screens:

- `OnboardingScreen`
- `TodayScreen`
- `ImportScreen`
- `CoursesScreen`
- `GradesScreen`
- `FocusScreen`
- `UpgradeScreen`
- `AssignmentDetailScreen`

Safest navigation extension points:

- Add new tabs in `NavTab` and `tabs` only when the tab bar can still fit.
- Prefer embedding Review Inbox, Week Planner, and Class Hub inside existing `import`, `today`, and `courses` surfaces to keep scope controlled.
- Use `selectedAssignmentId` for deep assignment editing instead of adding a new navigation framework.

## Scanner And Parser Flow

Current flow:

1. `ImportScreen` picks a PDF/text file, photo, or camera image.
2. `parseSyllabus` in `src/services/syllabusParser.ts` routes to the configured endpoint when `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT` exists.
3. Without an endpoint, `parseSyllabusOnDevice` reads text-based PDFs/plain text and calls `parseSyllabusText`.
4. `parseSyllabusText` in `src/services/syllabusLocalParser.ts` infers semester, course, meetings, grade categories, and assignment/exam deadlines.
5. `ImportScreen` stores the result as an editable local `draft`.
6. `App.tsx` `applyParsedPlan` merges parsed courses, assignments, and grade items into planner state.

Important parser safety:

- The scanner already follows review-before-apply.
- Photo/camera parsing is hidden unless an online parser endpoint is configured.
- The local parser returns only text-based PDF/plain-text results.
- `docs/AI_PARSE_CONTRACT.md` documents the production endpoint.

Safest parser extension points:

- Normalize parser assignment output to the v1.1 assignment contract in parser services.
- Keep `parseSyllabusText` deterministic and side-effect free.
- Add review status and confidence data without changing upload behavior.

## Current Data And Storage Model

Core types live in `src/models.ts`.

Current assignment shape:

- `id`
- `courseId`
- `title`
- `kind: "assignment" | "exam"`
- `dueAt`
- `tags`
- `priority`
- `estimatedMinutes`
- `status: "not_started" | "in_progress" | "done" | "archived"`
- `source: "manual" | "syllabus" | "calendar" | "canvas"`
- optional `gradeWeight`, `reminderIds`, `externalCalendarEventId`

Current course shape:

- `id`
- `code`
- `name`
- optional `instructor`
- `color`
- `meetings`
- `gradeCategories`

Storage:

- `src/services/storage.ts` wraps `AsyncStorage`
- Fallback order: AsyncStorage, web localStorage, cookie, memory
- Planner blob: `study-planner-data-v2`
- Theme blob: `study-planner-theme-mode-v1`
- Premium entitlement cache: `study-planner-premium-entitlement-v1`

Model gaps for v1.1:

- No explicit `SyllabusSource`.
- No `SemesterPlan` wrapper beyond `PlannerData`.
- No `WidgetSnapshot`.
- No `reviewStatus` or `completionStatus`; current UI uses `status`.
- No `courseName` denormalized onto assignments.
- No assignment `type` beyond `kind`.
- No `sourceText`, `confidence`, `reminderPreset`, `createdAt`, or `updatedAt`.

Recommended compatibility approach:

- Extend `Assignment` while keeping legacy `kind` and `status` aliases during migration.
- Add helpers to derive `completionStatus` from legacy `status`.
- Add helpers to derive `type` from legacy `kind`.
- Migrate loaded planner data in `App.tsx` instead of changing the storage key immediately.

## Plus, Paywall, And App Review Safety

Key files:

- `src/services/purchaseConfig.ts`
- `src/services/subscriptions.tsx`
- `src/screens/UpgradeScreen.tsx`
- `scripts/check-iap-config.mjs`
- `docs/APP_REVIEW_NOTES.md`
- `app.json`

Existing behavior:

- No product IDs are committed in source.
- Product IDs are read from `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS` and `EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS`.
- If no product IDs are configured, purchases fail closed and do not grant premium.
- Web or unavailable purchases use `UnavailableSubscriptionProvider` and do not fake premium.
- Native purchase execution uses `expo-iap` APIs.
- Upgrade copy states that prices, trials, and periods come from the store.

App Review guardrails for this update:

- Do not hardcode premium access.
- Do not fake purchase execution.
- Do not invent subscription states.
- Do not alter product ID handling for:
  - `com.mattnewman.studyplanner.plus.monthly`
  - `com.mattnewman.studyplanner.plus.yearly`
- Keep demo/capture mode gated by `EXPO_PUBLIC_STORE_CAPTURE=1`.
- Keep demo data out of normal production loads.

Current check issue:

- `npm run check:iap` fails on Windows before assertions because `scripts/check-iap-config.mjs` derives root from `new URL(...).pathname`, producing `C:\C:\...`.
- Fixing this script with `fileURLToPath` is a low-risk tooling change and should happen before relying on the App Review check.

## Tests, Scripts, And Config

Available scripts:

- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run typecheck`
- `npm run check:iap`
- `npm run export:web`

Baseline results from Windows:

- `npm ci`: passed; npm reported 4 moderate audit findings in existing dependencies.
- `npm run typecheck`: passed.
- `npm run check:iap`: failed due to the Windows path bug above.

No dedicated test runner or `test` script exists yet.

Recommended test approach:

- Add pure TypeScript tests around model normalization, demo seed, planner calculations, and widget snapshots.
- Prefer a Node test runner for non-React pure logic so Windows can verify without native iOS tooling.

## Widget Snapshot Trigger Points

Widget snapshots should update after changes to the planner state, not only from a native extension.

Good trigger points in `App.tsx`:

- `applyParsedPlan`
- `updateAssignmentStatus`
- `addQuickAssignment`
- `updateAssignment`
- `archiveAssignment`
- `handleScheduleReminders` after reminder IDs are attached
- demo seed load when `EXPO_PUBLIC_STORE_CAPTURE=1`

Lower-risk implementation:

- Compute snapshots in a pure service from `semester`, `courses`, and `assignments`.
- Persist app-side snapshot through existing storage first.
- Document the future iOS App Group/shared storage bridge for Mac validation.

## Blast Radius

Low-risk files for pure additions:

- `src/models.ts`
- `src/logic/planner.ts`
- new pure modules in `src/services` or `src/data`
- docs under `docs/`
- Node-only tests under `tests/`

Medium-risk files:

- `App.tsx`, because it owns hydration, persistence, navigation, and premium gates.
- `src/screens/ImportScreen.tsx`, because it is the parser review bridge.
- `src/screens/TodayScreen.tsx` and `src/screens/CoursesScreen.tsx`, because they are daily use surfaces.

High-risk files:

- `src/services/subscriptions.tsx`
- `src/services/purchaseConfig.ts`
- `src/screens/UpgradeScreen.tsx`
- `app.json`

Avoid unless required:

- native iOS project files on Windows
- App Review payment behavior
- IAP product ID assumptions
- scanner endpoint contract changes that break existing parser output

## Safest Implementation Order

1. Fix Windows-safe verification tooling.
2. Extend models and add pure normalization helpers.
3. Add deterministic capture/demo seed behind `EXPO_PUBLIC_STORE_CAPTURE=1`.
4. Add pure widget snapshot service and tests.
5. Wire snapshot persistence into planner state changes.
6. Upgrade Review Inbox inside the existing Import screen.
7. Upgrade Today into the command center surface.
8. Add This Week and Class Hub inside existing Today/Courses surfaces or a controlled new tab only if layout remains usable.
9. Add docs for widget architecture, Mac WidgetKit handoff, and preview storyboard.
10. Run final Windows checks and leave native WidgetKit validation explicitly for Mac.
