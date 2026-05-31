# PRODUCT_AUDIT.md

Date: 2026-05-31

## Verdict

StudyPlanner has a real foundation: parser contracts, local storage, StoreKit/IAP gates, WidgetKit snapshot tests, localization checks, planner logic, notes, focus sessions, and simulator capture tooling are already present.

The product does not yet feel like a 10/10 Student Life OS. It still reads as a planner with a prettier header.

## Current App Map

- Navigation: `App.tsx` owns onboarding, hard paywall, post-paywall tabs, deterministic simulator capture routes, and the bottom tab bar.
- Onboarding: `src/screens/OnboardingScreen.tsx` now routes into `LifeStudioOnboardingScreen`, then the paywall.
- Paywall/IAP: `src/screens/UpgradeScreen.tsx`, `src/services/subscriptions.tsx`, `src/config/iap.ts`, and `scripts/check-iap-config.mjs`.
- Home/feed: `src/screens/TodayScreen.tsx`, backed by `buildTodayBrain`, assignments, courses, notes, sessions, widgets, and Life Studio settings.
- Scan/import/review: `src/screens/ImportScreen.tsx`, `src/services/parserContract.ts`, `src/services/syllabusParser.ts`, local parser fallback, and parsed import/item models.
- Forecast/calendar: `src/screens/PlanScreen.tsx`, backed by `getWeekLoad`, calendar event grouping, workload insights, and focus block creation.
- Classes: `src/screens/CoursesScreen.tsx`, course schedule/details, upcoming work, notes, grade context.
- Focus: `src/screens/FocusScreen.tsx`, assignment-linked focus sessions and recommended duration.
- Notes: `src/screens/NotesScreen.tsx`, class-linked notes and note-to-task conversion.
- Widgets/Life: `src/screens/MoreScreen.tsx`, `src/widgets/*`, `src/services/widgetSnapshot.ts`, native widget eligibility, Widget Studio, Life Studio settings.
- Localization: `src/i18n.tsx`, `localized-app-strings/core-launch-strings.json`, and `npm run check:localization`.
- Test/capture tools: `scripts/sim-qa-product-depth.mjs`, widget/parser/backend/planner/IAP scripts, existing screenshot folders under `artifacts/`, `qa/`, and `marketing_exports/`.

## What Is Strong

- The app has real planner data and does not need fake AI chat to be useful.
- Import review is structurally correct: parsed rows are gated before entering the planner.
- IAP logic is store-backed and fails closed.
- Widget snapshots have truth tests and reviewed-data constraints.
- Life Studio data types already exist: `StudentDNA`, `OSBehavior`, `FrictionPoint`, `WidgetDNA`, `WatchDNA`.
- Simulator capture routing can force post-onboarding/post-paywall states for QA without weakening real IAP logic.

## Why It Is Not 10/10

- The first post-paywall screen still looks like a normal task planner. The Life OS thesis is stated, not felt.
- Personalization is mostly copy and accent color. Feed order, preview emphasis, widget suggestions, watch hints, and forecast language do not feel dramatically different enough.
- Screens are visually related, but too many are generic white cards stacked vertically. That is dashboard behavior.
- Purple is overused as the default action color, which fights the North Star’s multicolor card system.
- The old app shape remains visible: Today, Calendar, Classes, Widgets. The Student Life OS wrapper is not yet strong enough to reinterpret them.
- Several screens use dense helper cards, chips, and input panels that feel like web/SaaS UI rather than Apple-native student software.
- The Life Studio onboarding preview is the best product idea in the app, but it is not dominant enough across the actual app after onboarding.
- Empty, success, and error states are truthful, but not yet emotionally helpful or premium.
- Paywall value is plausible, but it needs to sell adaptation, widgets/watch, forecast, and unlimited import as one subscription-worthy OS, not a list of features.
- Current screenshots would not be elite App Store previews because the hero hierarchy is crowded and the screen rhythm is too repetitive.

## Required Product Shift

StudyPlanner must become:

- a personalized feed, not a task list
- a Life Studio configuration loop, not cosmetic themes
- a forecast engine, not a calendar clone
- a school/life conflict surface, not just assignment rows
- a widget/watch ecosystem, not a settings screen
- a calm import-review pipeline, not a file uploader

## Risk Notes

- Backend/parser/storage/IAP contracts should stay stable during this rebuild.
- The highest-risk frontend symbol is `StudentLifeShell` because every major screen calls it.
- The highest-risk app symbol is `AppContent` because it gates onboarding, paywall, capture routing, state persistence, and tab rendering.
- Visual edits must not create new paid-access bypasses outside simulator capture/dev QA paths.
