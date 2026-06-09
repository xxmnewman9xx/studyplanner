# StudyPlanner AI Prototype 1:1 Inventory

Source of truth: `/Users/mattnewman/Downloads/study planner ai/`

Production target: `/Users/mattnewman/work/StudyPlanner`

This inventory was created before the final parity patch in this pass and supersedes the earlier broad audit. It maps every prototype surface to the current production implementation and names whether the implementation is exact, partial, missing, or an honest future concept.

## Subagent Passes

- Prototype Inspector: inspected `app.jsx`, `data.jsx`, `kit.jsx`, `screens-flow.jsx`, `screens-today.jsx`, `screens-scan.jsx`, `screens-studio.jsx`, `screens-notes.jsx`, `screens-tasks.jsx`, `screens-account.jsx`, `studyplanner.css`, and supplied screenshots.
- Product Parity Architect: mapped prototype screens to `App.tsx`, `src/core/*`, `src/services/*`, `src/widgets/*`, and existing screen modules.
- Design System Extractor: ported prototype-like tokens and reusable surfaces into `src/design`.
- Frontend Implementer: rebuilt the main product shell, dashboard, scan/import, notes, classes, tasks, plan, widget studio, profile, reminders, theme, paywall, and iOS preview surfaces.
- Functionality Integrator: preserved real classes, tasks, exams, notes, reminders, parser/import review, widget settings, subscriptions, storage, and native OCR gating.
- Screenshot QA Agent: production QA screenshots exist under `qa/screenshots/apple-school-os/`; prototype reference screenshots exist under `qa/screenshots/prototype-reference/`.
- Parity Score Reviewer: final scores are in `prototype-parity-scorecard.md`.
- Regression Tester: release QA is run through `npm run qa:release`.

## Inventory

| Prototype screen / route | Visible sections | Components | Interactions | Animation / state | Data dependencies | Current app files | Status |
|---|---|---|---|---|---|---|---|
| Global app shell | Today, Classes, Tasks, Notes, Profile, Scan quick action, iPad sidebar | glass tab bar, FAB, sidebar, modal action sheet, shared cards | tab switching, quick add, premium gating | toast, sheet open/close | route state, subscription state | `App.tsx`, `src/services/subscriptions.tsx` | exact |
| Welcome / onboarding | setup intro, value cards, setup choices | cards, CTA buttons, segmented progress | start setup, skip demo, scan handoff | staged setup | onboarding/sample data | `src/screens/OnboardingScreen.tsx`, `App.tsx` | partial: represented by app shell and sample state, not a separate first-run forced route in this pass |
| Today / School OS Dashboard | greeting, Semester Health, Today's Load, Next Class, Upcoming Deadlines, Class Pulse, Assignment Timeline, Notes Activity, Study Progress, Widget Stack, AI Insight, scan CTA | `HeroCard`, `WidgetCard`, `ProgressRing`, `TimelineRow`, `DashboardWidgetPreview`, `LiquidWidget` | scan, calendar, classes, tasks, notes, studio routing | live data changes after apply | `selectHomeDashboardModel`, classes, tasks, notes, exams, widget settings, native widget sync | `App.tsx`, `src/core/selectors.ts`, `src/design/*` | exact |
| Scan Hub | syllabus hero, camera/photo/PDF/paste, notes scan, recent imports, availability/trust copy | import status card, camera frame, text areas, review list | camera/photo/document/paste parse, notes scan, apply reviewed import | working state, parsed state, success state | OCR availability, parser contract, parsed imports, note scanner | `App.tsx`, `src/services/parserContract.ts`, `src/services/imageTextRecognition.ts`, `src/services/noteScanner.ts` | exact |
| Syllabus Scanner Wow Flow | camera card, scan frame, extraction checklist, classes/tasks/exams counts | scan frame, progress steps, parser status | camera, photo, PDF, paste, review handoff | processing/ready/live states | OCR/parser/import review | `App.tsx`, `src/services/syllabusParser.ts`, `src/services/parserContract.ts` | exact within native RN constraints |
| Review Import | classes found, assignments, exams, confidence, no silent save | review rows, confidence/status labels, CTA | apply reviewed items, preserve review-before-save | low confidence / needs date states | `activeParseResult`, parsed imports/items | `App.tsx`, `src/screens/ImportScreen.tsx`, `src/core/actions.ts` | exact |
| Apply Success | dashboard updated, classes/tasks/exams counts, widget sync copy | `ImportStatusCard`, toast, dashboard handoff | apply to Today/School OS | live success state | `applyParsedSyllabus`, widget bridge | `App.tsx`, `src/core/actions.ts`, `src/core/nativeWidgetBridge.ts` | exact |
| Notes Scanner Flow | scan notes, extracted text, AI summary, linked class, suggested task, save | text capture, summary preview, task conversion copy | review note scan, save note | draft/review/applied | note scanner, classes, tasks | `App.tsx`, `src/services/noteScanner.ts`, `src/core/actions.ts` | exact |
| Notes Home | class filters, scan CTA, recent notes, summaries, task counts | note cards, class rows, dock actions | filter/select, scan, add note | empty notes state | notes, classes, suggested task fields | `App.tsx`, `src/screens/NotesScreen.tsx` | exact |
| Note Detail | metadata, AI Summary, key ideas, suggested tasks, extracted text, review actions | detail cards, action bar, pills | mark reviewed, create task, save summary | reviewed/open states | note body, summary, class linkage, tasks | `App.tsx`, `src/services/noteScanner.ts` | exact |
| Classes Home | semester count, class cards, health, next meeting, room, due/exam/note pills | class cards, pulse rings/pills | select class, open detail | empty class state | classes, tasks, exams, notes, reminders | `App.tsx`, `src/core/selectors.ts` | exact |
| Class Detail | colored hero, reminders, schedule, assignments, exams, notes, widget preview | hero, toggles, schedule rows, widgets | reminder toggles, task completion | live task/note updates | class, tasks, exams, notes, reminder settings | `App.tsx`, `src/core/actions.ts` | exact |
| Tasks Home | active/done, workload, overdue/today/upcoming/later/completed | grouped task cards, check controls | filter, complete, select detail | completed/open states | tasks, classes, due dates | `App.tsx`, `src/core/actions.ts` | exact |
| Task Detail | class/type pills, due/reminder/source, complete CTA | detail panel, info pills | mark complete/open | completed/open states | task/class data | `App.tsx` | exact |
| Calendar / Plan | classes, assignments, exams, workload, today emphasis | timeline blocks, empty state, class/task/exam rows | route from dashboard/profile | empty/live states | classes, tasks, exams, reminders | `App.tsx`, `src/screens/PlanScreen.tsx` | exact |
| Widget Studio | Build your School OS, current preview, presets, placement, size, density, glass controls | `LiquidWidget`, preset cards, chips, sliders, save/reset | preset apply, placement, accent, size, density, save/reset | live preview | widget settings, native widget sync | `App.tsx`, `src/core/widgetEngine.ts`, `src/widgets/*` | exact |
| Presets | Academic, Athlete, Minimalist, ADHD, Pre-med, Engineering, Finals Week, Color Pop | preset grid cards | tap to apply preset patch | active preset styling | widget settings | `App.tsx` | exact |
| Home Screen Widget Preview | iOS wallpaper, app grid, StudyPlanner icon, next class, due today, exam, class pulse, dock | real-looking Home Screen preview, widgets | back to studio | live widget render | widget settings, tasks, exams, classes | `App.tsx` | exact |
| Lock Screen Widget Preview | lock widgets, clock/date, streak, Live Activity, today task widget | lock chips, live activity card, widget preview | back to studio | live widget render | widget settings, tasks, exams, classes, reminders | `App.tsx` | exact |
| Reminders | lead times, room/location, smart suggestion, active class reminders, assignment/exam reminders | picker rows, toggles, suggestion card, reminder list | set 5/10/15/30/60 minute defaults, room toggle | no-reminders empty state | app settings, class reminders, tasks, exams | `App.tsx`, `src/services/reminders.ts` | exact |
| Profile / Student Identity Center | student profile, semester progress, customization, widget preset, reminders, accessibility, subscription entry | stats, profile fields, panels, navigation buttons | edit profile, open studio/theme/reminders/watch | saved profile/settings | student, settings, tasks, exams, widgets | `App.tsx` | exact |
| Theme Studio | live widget preview, appearance toggles, accent palette | toggles, swatches, widget preview | reduce transparency/motion, high contrast, larger text | live settings update | `AppSettings`, widget settings | `App.tsx` | exact |
| Paywall | premium framing, features, subscription/restore | paywall card, purchase/restore buttons | purchase, restore, manage fallback | loading/error/message states | subscription provider, product config, IAP validation | `App.tsx`, `src/screens/UpgradeScreen.tsx`, `src/services/subscriptions.tsx` | exact |
| Empty states | no syllabus, no classes, no notes, no tasks, no widgets, no reminders | `EmptyState`, action copy | directs to scan/studio/profile | empty/live states | app state counts | `App.tsx`, `src/design/components/EmptyState.tsx` | exact |
| Error / low confidence states | OCR unavailable, parse error, missing dates, low confidence review | status copy, disabled buttons, parser errors | retry/paste/upload path | unavailable/error/needs review | OCR capability, parser validation | `App.tsx`, `src/services/parserContract.ts` | exact |

## Files Touched By This Final Pass

- `App.tsx`
- `prototype-1to1-inventory.md`
- `prototype-parity-scorecard.md`

## Preserved Systems

- Native Vision OCR module and availability gating.
- Camera/photo/PDF/paste import paths.
- Parser and parser contract.
- Parsed import review/apply flow.
- Storage and migration.
- Widget settings, widget snapshots, and native widget bridge.
- Reminder settings and reminder service boundaries.
- Notes infrastructure and note scan drafts.
- Classes/tasks/exams/calendar data.
- Subscription/IAP provider and release checks.
- Localization scripts and runtime i18n.
- QA scripts and release gate.
