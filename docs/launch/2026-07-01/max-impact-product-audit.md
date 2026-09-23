# Max Impact Product Audit

Date: 2026-07-01

## R&D Signals

- MyStudyLife, Power Planner, Class Timetable, Todoist, Notion, Quizlet, StudySmarter, Knowunity, Goodnotes, Notability, Apple Calendar, Apple Reminders, and Apple Notes all reinforce the same pattern: setup must start from existing school material, and retention comes from a daily next action plus reminders, widgets, and study assets.
- Current competitor checks also show direct AI-syllabus competitors converging on the same promise: scan or paste school material, review what was found, then keep a daily planner/widget loop current. That makes trust copy, real preview data, and App Store checkout accuracy higher leverage than more decorative screens.
- StudyPlanner's strongest differentiation is editable trust: scan or paste, review before save, then turn approved coursework into Today, Plan, Notes, Reminders, and Widgets.
- The highest-value paid outcome is not "more screens"; it is a semester operating loop that keeps adjusting from the user's real classes, deadlines, notes, grades, and availability.

## Top 20 Improvements

| Rank | Surface | Improvement | Status |
| ---: | --- | --- | --- |
| 1 | Scan/Paywall | Match the monetization gate exactly: unlock first, then scan/paste/manual setup, with review before anything saves. | Implemented now |
| 2 | Review | Add source excerpts, confidence flags, duplicate warnings, and undo import. | Next |
| 3 | Scan | Support multi-page photo/PDF batches and Share Sheet handoff from Files/Mail/LMS exports. | Next |
| 4 | Plan | Add rotating timetable support: A/B days, week cycles, holidays, term ranges. | Next |
| 5 | Reminders | Add Calendar/Reminders sync with stored event IDs and reconciliation. | Next |
| 6 | Today | Keep one primary next action with "why now," time needed, and risk driver. | Existing strength |
| 7 | Plan | Auto time-block around class schedule and existing commitments. | Next |
| 8 | Plan | Show 7/14-day overload forecast with a "fix this week" reschedule action. | Next |
| 9 | Classes | Add grade-impact math: target score, remaining weight, risk-driving assignments. | Next |
| 10 | Notes | Convert scanned notes into summaries, concepts, tasks, and class context. | Improved now |
| 11 | Notes | Generate flashcards, quizzes, and exam study guides from notes and upcoming exams. | Existing strength |
| 12 | Study Session | Add Exam Mode: countdown, revision queue, weak-topic practice, spaced reviews. | Next |
| 13 | Scan | Add voice/natural-language homework capture for in-class assignments. | Existing quick capture, next for voice |
| 14 | Widgets | Make widgets actionable and honest: next move, deadline, week load, class pulse. | Improved now |
| 15 | Widgets | Build Widget Studio around outcomes and live snapshot previews, not static rows. | Implemented now |
| 16 | Today/Profile | Add weekly recap: completed work, missed blocks, crunch week, suggested adjustments. | Next |
| 17 | Today | Add subtle consistency stats without gamified clutter. | Next |
| 18 | Profile | Add optional parent/coach weekly share for high-school segment. | Next |
| 19 | Export | Add ICS, CSV, Notion-compatible export, and optional flashcard export. | Next |
| 20 | Paywall | Rewrite around outcomes: "Unlock the scanner, then stay ahead all semester." | Implemented now |

## Implemented This Pass

- Widgets now show live previews for Today, Upcoming, Week Load, and Class Progress using the same native snapshot payloads sent to WidgetKit.
- Widget customization now exposes density, visual theme, and class focus directly from the active screen.
- The widget sync CTA now calls native sync and reports success/error instead of only navigating away.
- Native widget items now carry real class colors instead of hard-coded black.
- Notes analysis now consumes the scanner service for title, summary, concepts, and scanned task dates/times while preserving the existing Review Import contract.
- Expo SDK 56 widget configuration now uses nested `ios.supportedFamilies` and `ios.contentMarginsDisabled`.
- English app-preview composition now reserves a widget-focused slide sourced from a fresh simulator capture.
- Notes scanning no longer emits numbered or scanner-generic task filler. Bare due-date and ask lines now become actionable task titles, and the notes stress test guards against regressions.
- The App Store proof card no longer claims a hardcoded 5.0 rating or shows five rating stars. It now describes the App Store checkout boundary.
- Paywall fallback plans no longer show real-looking prices when StoreKit products are unavailable. The UI uses `Shown by App Store`, keeps purchase available through real fallback product IDs, and relies on the App Store sheet for current price and terms.
- The root concept behind the removed loop-score widget phrase was generic future-state filler: pre-data surfaces looked confident without a real class, due date, note, or WidgetKit snapshot behind them. Widget copy now stays action-first, and the widget integrity guard rejects loop-score filler phrases while also checking native/in-app preview parity.
- Onboarding, locked home, paste, scan fallback, and paywall copy now align to the actual hard gate: unlock first, then scan/paste/manual setup, then review every row before save. `check:build52` rejects the old preview-before-unlock language.
- Widget previews are tested as Home Screen previews, not decorative cards: `NativeHomeWidgetPreview` uses the same snapshot payload, native widget dimensions, row limits, and week rail logic checked by `test:widget-integrity`.

## Current Highest-Leverage Backlog

- Replace prototype-only fabricated import counts in `src/screens/ImportScreen.tsx` before those screens are mounted in the shipping runtime.
- Add import review trust details: source excerpt, confidence reason, duplicate warning, and undo.
- Recompose the first three App Store screenshots around scan, review-before-save, and next action/widgets.
