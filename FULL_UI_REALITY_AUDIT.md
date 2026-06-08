# Full UI Reality Audit

Date: 2026-06-02

Direction: white-first, minimal, Apple-native utility with subtle Liquid Glass depth. Product name remains `StudyPlanner: Syllabus AI`. Dark mode is not a shipped visual identity; dark requests now resolve to the light visual system and visible dark toggles are hidden.

## 1. Loading / Splash
- For: hydrate planner state and avoid a blank startup.
- Primary action: wait.
- Real vs preview-only: loading is real; skeleton is only a loading affordance.
- Feels fake/cluttered/old: large branded loading preview can overstate a screen before data exists.
- Delete: extra decorative skeleton detail.
- Simplify: one mark, one short label, one soft loading surface.
- More useful: reflect import/widget sync only if the app is actually doing that work.
- Needs proof: screenshot of cold load and restored-session load.

## 2. Onboarding
- For: get a student from setup to scan/import.
- Primary action: continue to scan/paywall flow.
- Real vs preview-only: onboarding controls are real; some preview panels are illustrative.
- Feels fake/cluttered/old: repeated branding, theme language, and too many capability previews.
- Delete: dark-mode toggle, personality/theme-pack language, unsupported ecosystem claims.
- Simplify: one hero per step and one primary CTA.
- More useful: make scan/import the strongest promise and only show real persisted customization.
- Needs proof: screenshots for first, scan, widget, and paywall steps.

## 3. Paywall
- For: explain premium access and purchase.
- Primary action: subscribe or restore.
- Real vs preview-only: purchase/restore should be live; benefit cards are explanatory.
- Feels fake/cluttered/old: too many benefit blocks can feel like marketing instead of a utility decision.
- Delete: nonessential badges and repeated brand marks.
- Simplify: price, access promise, primary CTA, restore.
- More useful: clearly state syllabus scan, planning, widgets, and restore behavior.
- Needs proof: no-product, loaded-product, purchase failure, restore success states.

## 4. Home / Today
- For: tell the student what matters today.
- Primary action: handle the top task or start import when empty.
- Real vs preview-only: assignments, semester pulse, reminders, calendar actions should be real.
- Feels fake/cluttered/old: dashboard density and multiple equal-weight cards.
- Delete: low-signal chips, duplicate summaries, decorative insight cards.
- Simplify: one hero, first urgent card, then secondary cards.
- More useful: make the first card the most important next action.
- Needs proof: normal, urgent, clean, post-customization, and reminder/calendar action screenshots.

## 5. Empty Today
- For: help a new student create value.
- Primary action: scan or paste a syllabus.
- Real vs preview-only: empty state is real; any sample cards must be removed or clearly absent.
- Feels fake/cluttered/old: example planners that do not affect state.
- Delete: fake class/task previews.
- Simplify: one sentence and one scan/import CTA.
- More useful: offer paste/file/camera only when those actions work.
- Needs proof: empty planner screenshot and first-import transition.

## 6. Scan / Import
- For: turn a syllabus, photo, file, or pasted text into reviewable assignments.
- Primary action: import content.
- Real vs preview-only: camera/file/paste/parser states are real; source-mode previews must be functional.
- Feels fake/cluttered/old: too many setup cards before the import action.
- Delete: unsupported OCR claims, fake setup guidance, redundant parser confidence copy.
- Simplify: source picker, input surface, parse CTA, result/error state.
- More useful: make parser status and next step unmistakable.
- Needs proof: paste, file, photo, parse success, parse error, and no-camera states.

## 7. Review Inbox
- For: confirm parsed assignments before they enter the planner.
- Primary action: accept or fix imported items.
- Real vs preview-only: parsed items and accept/edit flows should be real.
- Feels fake/cluttered/old: inbox can become a dense table without hierarchy.
- Delete: decorative confidence badges that do not change behavior.
- Simplify: group by class/date, keep accept-all primary.
- More useful: expose low-confidence items first.
- Needs proof: empty, mixed-confidence, accept-all, edited-item screenshots.

## 8. Forecast / Plan
- For: show upcoming workload and risk.
- Primary action: choose what to work on next.
- Real vs preview-only: forecast should come from planner data.
- Feels fake/cluttered/old: calendar/dash hybrid with too many equal cards.
- Delete: ornamental forecasts and non-actionable trend panels.
- Simplify: risk hero, week list, focus suggestion.
- More useful: map orange to exams/risk, blue to assignments/classes, green to progress.
- Needs proof: heavy week, clean week, urgent risk, localized long text.

## 9. Classes
- For: manage real courses.
- Primary action: open or add a class.
- Real vs preview-only: class colors/icons/settings should persist.
- Feels fake/cluttered/old: card soup and over-customization.
- Delete: theme-pack or personality language.
- Simplify: class list with assignments, next deadline, color/icon.
- More useful: make add/edit class obvious.
- Needs proof: empty classes, populated classes, edited color/icon.

## 10. Class Detail
- For: inspect one course.
- Primary action: add/manage assignments for that class.
- Real vs preview-only: assignments and class settings should be real.
- Feels fake/cluttered/old: too many stats before the actual work.
- Delete: decorative grade/progress cards unless backed by data.
- Simplify: class header, next due, assignment list.
- More useful: support quick add/edit.
- Needs proof: normal, no assignments, long class name, localized states.

## 11. Assignment Detail
- For: understand and update one assignment.
- Primary action: complete, edit, or schedule.
- Real vs preview-only: detail fields, completion, reminders/calendar actions should be real.
- Feels fake/cluttered/old: excess status pills.
- Delete: duplicate metadata and nonfunctional suggestions.
- Simplify: title, due date, status, actions, notes.
- More useful: show risk only when urgent.
- Needs proof: complete/edit/reminder states and long-title layout.

## 12. Focus
- For: convert workload into a study session.
- Primary action: start focus.
- Real vs preview-only: timer/session recording should be real.
- Feels fake/cluttered/old: decorative rings and motivational copy if not tied to sessions.
- Delete: fake streak/progress claims.
- Simplify: selected task, duration, start button.
- More useful: recommend duration from current workload.
- Needs proof: before, running, completed, no-task states.

## 13. Notes
- For: capture notes and convert useful notes into work.
- Primary action: write or convert a note.
- Real vs preview-only: notes and conversion should persist.
- Feels fake/cluttered/old: blank note cards that look like examples.
- Delete: decorative empty note previews.
- Simplify: input, pinned notes, converted tasks.
- More useful: make conversion result visible in Today.
- Needs proof: empty, created, pinned, converted screenshots.

## 14. Widget Studio / More
- For: configure real widgets.
- Primary action: save a widget configuration.
- Real vs preview-only: widget, class, color, and style controls must persist and affect output.
- Feels fake/cluttered/old: theme packs, Watch preview, dark backgrounds, ecosystem claims.
- Delete: Watch preview if decorative, dark mode controls, DNA/internal terms, more than four controls.
- Simplify: Widget, Class, Color, Style.
- More useful: preview must update immediately and saved config must alter snapshot.
- Needs proof: persisted settings, changed snapshot, native widget render.

## 15. Native Widget Previews / Snapshots
- For: prove the widget output matches saved configuration.
- Primary action: inspect/save widget setup.
- Real vs preview-only: preview must derive from `buildStudyPlannerWidgetSnapshots`.
- Feels fake/cluttered/old: pretty mock widgets not tied to native output.
- Delete: decorative widget gallery.
- Simplify: one preview per selected widget.
- More useful: show only supported widget kinds.
- Needs proof: snapshot diff after each of four controls changes.

## 16. Empty States
- For: guide the next useful action.
- Primary action: create/import/add the missing data.
- Real vs preview-only: no sample content unless it writes real state.
- Feels fake/cluttered/old: generic planner filler.
- Delete: fake lists.
- Simplify: one headline, one action.
- More useful: route to exact screen needed.
- Needs proof: empty Today, Classes, Notes, Review, Focus.

## 17. Error States
- For: recover from failed parsing, permissions, purchases, or sync.
- Primary action: retry, choose another source, or restore.
- Real vs preview-only: errors should come from actual failure paths.
- Feels fake/cluttered/old: vague friendly copy with no recovery.
- Delete: non-actionable reassurance.
- Simplify: error, cause, action.
- More useful: keep data the user entered.
- Needs proof: parser, camera permission, file read, purchase, widget sync.

## 18. Success States
- For: confirm the app changed real state.
- Primary action: continue to the next best screen.
- Real vs preview-only: success must follow persisted changes.
- Feels fake/cluttered/old: celebratory cards without next action.
- Delete: generic confetti/copy.
- Simplify: what changed and where to go.
- More useful: show count of imported/saved/completed items.
- Needs proof: import accepted, widget saved, assignment completed, calendar synced.

## 19. Localization-Sensitive States
- For: keep the UI trustworthy across supported locales.
- Primary action: same as each screen.
- Real vs preview-only: localized strings should render in real screenshots.
- Feels fake/cluttered/old: clipped buttons and oversized cards.
- Delete: fixed-width copy assumptions.
- Simplify: fewer labels per row.
- More useful: allow wrapping where action text is long.
- Needs proof: longest supported locale for Home, Scan, Review, Forecast, Classes, Paywall.

## Immediate Shared Foundation Actions
- Done: dark mode requests resolve to light colors/glass tokens.
- Done: visible app-shell and onboarding dark toggles removed.
- Next: consolidate shared white-first primitives around `AppSurface`, `AppHeader`, `AppCard`, `LiquidGlassCard`, `ColorAccentCard`, `AppButton`, `AppSection`, `EmptyState`, `StatusPill`, `SemesterPulse`, and `WidgetPreviewCard`.
- Next: remove purple-heavy/dark widget theme options from normal Widget Studio unless they are strictly native-widget outputs and not app identity.
- Next: capture real simulator screenshots and score Home, Scan, Review Inbox, Forecast, Classes against the reviewer rubric.
