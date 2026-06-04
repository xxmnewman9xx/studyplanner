# StudyPlanner AI Implementation Map

This map translates the prototype lock into the current repo while preserving existing infrastructure.

Preflight:

- Worktree is already dirty. This implementation must avoid unrelated edits and never revert existing work.
- `src/design/` already exists with many requested primitive names.
- GitNexus impact tools were referenced in `AGENTS.md`, but no callable GitNexus MCP tools surfaced in this session. Any future symbol edits should run GitNexus impact analysis if the tools become available; otherwise record the limitation before editing.

## Current Repo Anchors

Primary app shell:

- `App.tsx`

Existing standalone screens:

- `src/screens/TodayScreen.tsx`
- `src/screens/ImportScreen.tsx`
- `src/screens/NotesScreen.tsx`
- `src/screens/PlanScreen.tsx`
- `src/screens/CoursesScreen.tsx`
- `src/screens/AssignmentDetailScreen.tsx`
- `src/screens/OnboardingScreen.tsx`
- `src/screens/UpgradeScreen.tsx`
- `src/screens/MoreScreen.tsx`
- `src/screens/FocusScreen.tsx`
- `src/screens/GradesScreen.tsx`

Core moat to preserve:

- OCR / Vision OCR: `src/services/imageTextRecognition.ts`
- Parser: `src/services/syllabusLocalParser.ts`, `src/services/syllabusParser.ts`, `src/services/syllabusParseNormalizer.ts`, `src/services/parserContract.ts`
- Import application: `src/core/actions.ts`, especially `applyParsedSyllabus`, `upsertParsedImport`, `upsertParsedItemsForImport`, `setActiveParseResult`
- Widget engine and snapshots: `src/core/widgetEngine.ts`, `src/core/nativeWidgetBridge.ts`, `src/services/widgetSnapshot.ts`, `src/widgets/*`
- Notes: `src/core/actions.ts`, `src/services/noteScanner.ts`, `src/screens/NotesScreen.tsx`
- Reminders: `src/services/reminders.ts`, reminder fields in `src/core/types.ts`
- Calendar: `src/services/calendarSync.ts`, plan/calendar surfaces in `App.tsx` and `src/screens/PlanScreen.tsx`
- Subscription: `src/services/subscriptions.tsx`, `src/config/iap.ts`, `src/services/purchaseConfig.ts`, `src/services/purchaseValidation.ts`
- Persistence: `src/core/repository.ts`, `src/core/storage.ts`, `src/core/store.ts`, `src/services/storage.ts`
- Localization: `src/i18n.tsx`, `localized-app-strings/*`, `scripts/check-localization-completeness.mjs`

Current design system:

- `src/design/tokens/colors.ts`
- `src/design/tokens/spacing.ts`
- `src/design/tokens/radius.ts`
- `src/design/tokens/typography.ts`
- `src/design/tokens/shadows.ts`
- `src/design/tokens/motion.ts`
- `src/design/components/*`

## Prototype Surface Mapping

| Prototype surface | Existing repo functionality | Missing / needed work |
|---|---|---|
| App shell tabs Today/Classes/Scan/Plan/Profile | `App.tsx` has phone/pad navigation and tab bar | Visual parity: glass pill tab bar, centered scan FAB, prototype route names/flows |
| Dashboard / Today | `App.tsx` `HomeDashboard`, `SchoolOSDashboard`; `src/screens/TodayScreen.tsx`; selectors in `src/core/selectors.ts` | Rebuild with prototype hierarchy: Semester Health, Today Load, Next Class, Class Pulse, Assignment Timeline, Notes Activity, Widget Stack, AI Insight |
| Semester Health | `selectOverallPulse`, `selectClassPulse`, `calculateOverallPulse`, `calculateClassPulse` | Visual ring + class bars + grades; connect to real class pulse and tasks |
| Today's Load | `selectTodayClasses`, `selectTodayTasks`, `selectWeeklyLoad` | Compact stat cards and study-planned metric |
| Next Class | `selectCurrentOrNextClass`, `selectRoomReminder` | Prototype card with countdown, room, reminder pill |
| Assignment Timeline | `selectCatchUpQueue`, tasks in state | Prototype grouped rows and urgency treatment |
| Notes Activity | `state.notes`, `selectNotesByClass` | Dashboard preview module and empty state |
| Widget Stack | `widgetSettings`, `widgetEngine`, `nativeWidgetBridge`, `widgetPresets` | Prototype stack preview using real enabled widgets/settings |
| AI Insight | `logic/studyPlannerBrain.ts`, `logic/studentLifeDepth.ts`, selectors | Compose real insight from workload/exams/tasks; empty/fallback copy only when data absent |
| Scan hub | `App.tsx` `ScannerScreen`, `ScannerContent`; `src/screens/ImportScreen.tsx` | Prototype scan hub with syllabus hero, scan type grid, import history |
| Syllabus scanner | OCR and parser services already exist | Preserve OCR, add prototype dark scanner presentation and extraction checklist |
| Review import | `src/screens/ImportScreen.tsx`, parser contract, parsed imports/items | Visual parity with confidence pills, edit affordances, sticky Apply CTA |
| Apply success | `applyParsedSyllabus`, scanner state | Prototype "Building School OS" sequence before returning dashboard |
| Notes scanner | `src/services/noteScanner.ts`, `addNoteScanDraft`, `applyNoteScanDraft` | Prototype OCR/AI phases and linked note review surface |
| Widget Studio home | `App.tsx` `WidgetStudio`, `StudioControls`; `src/customization.ts`; widgets infrastructure | Prototype preset grid, current preview, Home/Lock preview CTAs |
| Preset detail | `widgetPresets.ts`, `widgetThemes.ts`, `widgetLayoutEngine.ts` | Visibility/order controls, size segmented control, live activity concept |
| Home Screen preview | Widget snapshots and previews exist | Immersive prototype preview using real widget display models |
| Lock Screen preview | Widget snapshots and native bridge exist | Immersive lock preview and live activity card |
| Theme Studio | `UserSettings`, widget theme helpers | Prototype appearance grid and live update, preserve settings persistence |
| Notes home/detail | `src/screens/NotesScreen.tsx`, core notes actions | Visual parity, class filter chips, AI summary cards, suggested tasks |
| Classes home/detail | `App.tsx` class screens; courses/classes in models | Visual parity with health ring, grade/status pills, schedule/progress/notes/reminders/activity |
| Tasks home/detail | `App.tsx` task screens; core task actions | Prototype overdue/today/upcoming/later/completed hierarchy and row interaction |
| Calendar / Plan | `src/screens/PlanScreen.tsx`, `CalendarBlocks`, calendar sync | Prototype week/month segmented control, heat bars, class/study/exam blocks |
| Profile | `App.tsx` profile; subscriptions/settings | Student Identity Center with progress, premium card, setting rows |
| Reminders | `src/services/reminders.ts`, class reminder settings | Prototype default reminder segmented control, smart suggestion, active reminders list |
| Paywall | `src/screens/UpgradeScreen.tsx`, subscription provider | Prototype presentation; preserve backend purchase calls and product config |
| Onboarding | `src/screens/OnboardingScreen.tsx`, onboarding state/actions | Prototype onboarding steps after major screens reach parity |
| Empty states | scattered current UI | Standard empty-state primitive for syllabus/classes/notes/tasks/widgets |

## Gap Analysis

Scores are current app vs prototype on a 0-100 parity scale.

| Area | Score | Already implemented | Needs visual parity | Needs interaction parity | Missing entirely |
|---|---:|---|---|---|---|
| Dashboard | 45 | real dashboard selectors, tasks/classes/widgets | prototype dense health-first hierarchy | dashboard populate after apply | Notes Activity and Widget Stack parity |
| Scan | 55 | OCR, Vision OCR, parser, import review | dark scanner, scanline, extraction checklist | visible Import -> Extract -> Review -> Apply -> Dashboard loop | full scan hub taxonomy |
| Classes | 50 | class data, detail surface | class cards, colored hero, rings/pills | class activity and reminder affordances | class widget preview parity |
| Tasks | 60 | task data/actions/detail | grouped prototype rows and compact density | task completion animation/subtask polish | later/completed styling parity |
| Notes | 58 | notes storage, note scanner draft flow | notes cards/detail styling | scan notes phases and task conversion | related exam/reminder presentation |
| Calendar | 45 | plan/calendar event architecture | week timeline, workload heat, month dots | study block recommendation flow | prototype Week Plan detail polish |
| Widget Studio | 50 | settings, presets, snapshots, native bridge | preset grid/current stack/Home/Lock previews | ordering/visibility/placement interactions | flagship immersive preview parity |
| Reminders | 55 | scheduling service and class reminder settings | reminder center styling | segmented timing/smart suggestion flow | active reminder management surface parity |
| Onboarding | 35 | onboarding state and screen | prototype welcome/step cards | import handoff from onboarding | preset/theme personalization sequence |
| Profile | 45 | settings/profile/paywall links | Student Identity Center | row navigation/premium entry polish | semester progress/streak/GPA composition |
| Paywall | 60 | subscription backend and upgrade screen | prototype paywall presentation | plan picker/close states | none significant if backend retained |

Largest gaps by product impact:

1. Dashboard visual and information hierarchy.
2. Widget Studio flagship experience.
3. Scanner wow moment and visible extraction sequence.
4. Onboarding-to-import loop.
5. Calendar/week planning presentation.

## Implementation Order

### Phase 0 lock

Status: complete when `prototype-audit.md` and this `implementation-map.md` exist.

### Phase 1 design-system parity

Goal: make shared primitives match prototype tokens and density before screen rewrites.

Use current files:

- `src/design/tokens/*`
- `src/design/components/*`

Refine/add:

- `ScannerCard`
- progress/extraction components
- segmented control
- icon button
- health bar
- task row
- note card
- class glyph/badge
- toggle

Keep all primitives React Native compatible. Avoid CSS-only assumptions from the web prototype.

### Phase 2 dashboard

Primary files likely touched:

- `App.tsx` dashboard functions, or migrate to `src/screens/TodayScreen.tsx`
- `src/core/selectors.ts`
- `src/design/components/*`

Data bindings:

- Semester Health: `selectOverallPulse`, `state.classes`, `selectClassPulse`
- Today Load: `selectTodayClasses`, `selectTodayTasks`, `selectWeeklyLoad`
- Next Class: `selectCurrentOrNextClass`, `selectRoomReminder`
- Timeline: `selectCatchUpQueue`
- Notes Activity: `state.notes`
- Widget Stack: `state.widgetSettings`, `getWidgetDisplayModel`
- AI Insight: `studyPlannerBrain` / `studentLifeDepth` plus selector-derived facts

Do not invent persistent records. If missing data, show prototype empty states.

### Phase 3 scanner/import

Primary files:

- `App.tsx` scanner/import surfaces
- `src/screens/ImportScreen.tsx`
- `src/services/imageTextRecognition.ts`
- `src/services/parserContract.ts`
- `src/services/syllabusParser.ts`
- `src/core/actions.ts`

Preserve:

- native OCR and fallback OCR
- parser contract
- review-before-apply
- parsed item confidence and validation
- `applyParsedSyllabus`

Add:

- scan hub
- dark scanner presentation
- extraction progress mapping real parse states to prototype steps
- review inbox visual parity
- apply success sequence and dashboard handoff

### Phase 4 widget studio

Primary files:

- `App.tsx` `WidgetStudio` / `StudioControls`
- `src/customization.ts`
- `src/core/widgetEngine.ts`
- `src/core/nativeWidgetBridge.ts`
- `src/widgets/widgetPresets.ts`
- `src/widgets/widgetThemes.ts`
- `src/widgets/widgetLayoutEngine.ts`

Preserve:

- widget settings persistence
- snapshot generation
- native widget bridge
- existing widget tests

Add:

- preset grid matching prototype
- current preset dashboard stack
- visibility/order controls
- Home Screen preview
- Lock Screen preview
- theme studio

### Phase 5 notes/classes/tasks/calendar/profile/paywall/onboarding

Proceed after dashboard, scanner, and studio are strong.

Suggested order:

1. Notes
2. Classes
3. Tasks
4. Calendar
5. Profile
6. Onboarding
7. Paywall

## Design System Target

Current token mismatch:

- Current `schoolColors.blue` is `#2F6BFF`; prototype brand blue is `#0A84FF`.
- Current light canvas is mostly white; prototype app background is `#EFEFF4` with subtle radial gradient.
- Current corners trend 28; prototype uses 22 for cards and 28 for large moments.
- Current type in `TodayScreen.tsx` is larger and more Nike-like than prototype dashboard screenshot; dashboard should become denser and calmer.

Target token values:

- brand blue `#0A84FF`
- brand purple `#7B5CFF`
- green `#30D158`
- orange `#FF9F0A`
- red `#FF453A`
- pink `#FF375F`
- teal `#40C8E0`
- light bg `#EFEFF4`
- surface `#FFFFFF`
- surface-2 `#F6F6FA`
- surface-3 `#ECECF2`
- hairline `rgba(60,60,67,0.10)`
- label `#0A0A0D`
- label-2 `rgba(60,60,67,0.62)`
- label-3 `rgba(60,60,67,0.34)`
- glass `rgba(255,255,255,0.62)`

## Data Integrity Rules

- Prototype sample data is not application data.
- Real classes come from `AppState.classes` or existing `models.Course`.
- Real tasks come from `AppState.tasks` or existing assignments.
- Real notes come from `AppState.notes`.
- Real reminders come from reminder settings/services.
- Real widgets come from widget settings/presets/snapshots.
- Real imports come from parsed imports/items and active parse result.
- Missing data shows empty states, not seeded fake persistence.

## Localization Rules

- Any new user-visible string must enter the localization path used by `src/i18n.tsx` and `localized-app-strings/core-launch-strings.json`.
- Run `npm run check:localization` after implementation edits.
- Keep prototype copy as the English source text unless a backend/legal string already exists.

## QA Plan

Required commands after implementation:

- `npm run typecheck`
- `npm run check:localization`
- `npm run qa:release`
- OCR validation: `npm run test:photo-ocr`
- Import/parser validation: `npm run test:parser`, `npm run test:capture-parser`, `npm run test:parser-endpoint`
- Widget validation: `npm run test:widgets`, `npm run test:widget-integrity`, `npm run test:customization`, `npm run check:widget-no-crop`
- Semester loop validation: `npm run test:semester-loop`

Visual QA:

- Capture current app screenshots before each major screen rewrite.
- Capture prototype references from `/tmp/studyplanner-prototype/screenshots`.
- Capture implementation screenshots after each rewrite.
- Score hierarchy, fidelity, usability, consistency, accessibility, performance.
- Revise anything below 90 percent parity.

## Screenshot Comparison Matrix

| Screen | Prototype screenshot | Current capture target | Implementation capture target |
|---|---|---|---|
| Dashboard | `screenshots/dashboard.png` | app Today/Dashboard | app Today/Dashboard |
| Welcome | `screenshots/welcome.png` | app onboarding/welcome | app onboarding/welcome |
| Scanner | `screenshots/01-scanner.png`, `screenshots/02-scanner.png` | scan/import flow | scan/import flow |
| Import review | `screenshots/01-studio.png` appears to show Review Import | import review | import review |
| Widget studio | `screenshots/02-studio.png` | widget studio | widget studio |
| Widgets dashboard | `screenshots/01-widgets.png`, `02-widgets.png`, `03-widgets.png` | dashboard/widget studio | dashboard/widget studio |
| Home preview | `screenshots/01-previews.png`, `02-previews.png`, `03-previews.png` | widget preview | widget preview |
| Lock preview | `screenshots/01-lock.png`, `02-lock.png` | lock preview | lock preview |

## Risk Notes

- `App.tsx` is very large and contains many screen functions. It is the highest-risk visual edit zone.
- `src/design/` is already dirty/untracked in the worktree. Treat it as existing user work; inspect before modifying.
- Widget changes have broad QA blast radius because native snapshots, Home Screen widgets, Lock Screen widgets, watch snapshots, and localization all intersect.
- Scanner changes must never bypass review-before-apply.
- Subscription changes must never replace the backend/provider; only presentation should change.

## First Implementation Slice Recommendation

For maximum visible impact with minimum usage:

1. Refine design tokens and primitives to prototype values.
2. Rebuild dashboard using existing selectors and widget display models.
3. Re-skin scanner/import presentation while preserving parser calls.
4. Rebuild Widget Studio preview and preset list using existing widget settings.

This sequence touches the highest-value surfaces while preserving the moat.
