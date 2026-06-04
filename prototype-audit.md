# StudyPlanner AI Prototype Audit

Source of truth: `/Users/mattnewman/Downloads/study planner ai.zip`

Inspected prototype files:

- `/tmp/studyplanner-prototype/app.jsx`
- `/tmp/studyplanner-prototype/data.jsx`
- `/tmp/studyplanner-prototype/kit.jsx`
- `/tmp/studyplanner-prototype/screens-flow.jsx`
- `/tmp/studyplanner-prototype/screens-today.jsx`
- `/tmp/studyplanner-prototype/screens-scan.jsx`
- `/tmp/studyplanner-prototype/screens-studio.jsx`
- `/tmp/studyplanner-prototype/screens-notes.jsx`
- `/tmp/studyplanner-prototype/screens-tasks.jsx`
- `/tmp/studyplanner-prototype/screens-account.jsx`
- `/tmp/studyplanner-prototype/studyplanner.css`
- `/tmp/studyplanner-prototype/screenshots/*.png`

## Product Read

The prototype defines StudyPlanner AI as a compact Apple-native "School OS" for student life. The emotional loop is:

Scan syllabus -> review extracted truth -> apply -> dashboard comes alive -> widgets mirror the semester -> reminders and notes keep the system current.

The prototype is not a marketing shell. It is the real app experience: dense, calm, iOS-native, card-based, and data-first. The flagship is the dashboard; the scanner and widget studio are the two showpiece moments.

## Screens

### App Shell

- Five root tabs: Today, Classes, Scan, Plan, Profile.
- Scan is a raised center floating action button in a glass tab bar.
- Detail/fullscreen stack overlays the active tab root.
- Fullscreen screens: splash, welcome, onboarding, import choice, syllabus scanner, notes scanner, import review, apply success, paste text, Home Screen preview, Lock Screen preview.
- Dark status treatment for splash, scanner, notes scanner, Home/Lock previews, and apply success.

### Welcome and Onboarding

- Welcome headline: "Scan your syllabus. Build your semester."
- Three value cards:
  - AI finds your assignments.
  - Widgets keep you on track.
  - Everything updates everywhere.
- Primary CTA: Start setup.
- Secondary CTA: Skip and try demo semester.
- Onboarding steps personalize:
  - student year
  - biggest pain
  - widget preset
  - theme
  - first import path
- Progress is shown as segmented top bars.
- Choices are large tappable cards with active borders.

### Dashboard / Today

Hero hierarchy:

- Date eyebrow and greeting: "Good morning, Maya".
- Profile avatar action.
- Semester Health card with health ring, class health bars, grades, and on-track status.
- Stat trio: classes today, due today, study planned.
- Next Class card with class identity, room, time, countdown, and reminder pill.
- Upcoming Deadlines section with grouped task rows.
- Class Pulse horizontal cards.
- AI Insight card.
- Widget Stack preview with current preset and synced Home/Lock Screen copy.

The dashboard must immediately communicate: "Your semester is organized."

### Scan

Scan hub:

- Primary gradient syllabus hero.
- Secondary grid for notes, whiteboard, assignment sheet, exam review, PDF upload, paste text.
- Import history with applied/review states.

Syllabus scanner:

- Fullscreen dark camera view.
- Faux document centered with corner brackets.
- Scanline animation.
- Capture flash.
- Floating extraction chips.
- Step checklist:
  - Reading document
  - Finding classes
  - Detecting due dates
  - Building assignments
  - Scheduling exams
  - Creating calendar
  - Preparing widgets
- Completion state: "Syllabus understood", counts, and review CTA.

Review import:

- Reassurance card: "Nothing saves until you approve."
- Sections: classes found, assignments, exams.
- Each row has class glyph, title, metadata, confidence pill, edit affordance.
- Low-confidence banner appears for uncertain dates.
- Sticky glass bottom CTA: "Apply to my School OS".

Apply success:

- Animated "Building your School OS..." sequence.
- Checklist cards for classes, assignments, exams, calendar, reminders, widgets.
- Final success: "Your School OS is live."
- CTA opens dashboard.

### Widget Studio

Widget Studio home:

- Header: "Build your School OS."
- Current preset live preview.
- Preset grid:
  - Academic
  - Athlete
  - Minimalist
  - ADHD Focus
  - Pre-med
  - Engineering
  - Finals Week
  - Color Pop
- Home Screen and Lock Screen preview buttons.

Preset detail:

- Preset hero.
- Dashboard stack preview.
- Segmented size control: Small, Medium, Large.
- Visible widgets list with drag handles and toggles.
- Accent color/theme swatches.
- Live Activity concept.
- Save preset CTA.

Home Screen preview:

- Fullscreen iOS Home Screen simulation.
- StudyPlanner widgets embedded among app icons.
- Dock at bottom.

Lock Screen preview:

- Fullscreen Lock Screen simulation.
- Above-clock widget chips.
- Inline streak widget.
- Live Activity card.

Theme Studio:

- Live preview cards.
- Appearance grid of theme swatches.

### Notes

Notes scanner:

- Fullscreen dark capture.
- Handwritten note mock.
- Scanline / OCR highlight sweep.
- Phase labels: capture, handwriting OCR, AI summary.
- Done state links note to detected class and displays:
  - AI summary
  - key terms
  - suggested study tasks
  - exam reminder
  - save CTA

Notes home:

- Class filter chips.
- Purple scan notes CTA.
- Note cards with class chip, timestamp, title, summary, AI summary pill, task count pill.

Note detail:

- Class chip and note metadata.
- AI Summary card.
- Key term chips.
- Suggested study tasks with Add task buttons.
- Related exam card.
- Extracted text.
- Convert to task / share actions.

### Classes

Classes home:

- Spring semester eyebrow and class count.
- One card per class with colored top rail.
- Class glyph, code, grade pill, title, ring health.
- Next meeting, room, due/exam/note pills.

Class detail:

- Colored hero per class.
- Back and reminder buttons.
- Code/title identity.
- Grade, health, due, exams stat row.
- Schedule card.
- Class progress card.
- Assignments, exams, recent notes, class widget sections.

### Tasks

Tasks home:

- Active/done count.
- Weekly progress card with class workload counts.
- Grouped task sections:
  - Overdue
  - Today
  - Upcoming
  - Later
  - Completed
- Task rows have completion control, class dot, due label, urgency dot, chevron.

Task detail:

- Class/type pills.
- Mark complete CTA.
- Details list: due, estimated, source, calendar block.
- Subtasks.
- AI Suggestion card.
- Reminder and attach note actions.

### Calendar / Plan

Plan screen:

- Week/month segmented control.
- Week header with workload heat.
- Timeline grid with class blocks, exam blocks, study blocks, now line.
- Legend.
- Week plan insight card.

Month view:

- Calendar grid with dots.
- Selected day task list.

Week plan:

- Busiest day and next exam cards.
- Workload heat bars.
- Recommended study blocks.
- Week widget preview.

### Profile

Student Identity Center:

- Identity hero with avatar, name, year/major.
- Streak and GPA pills.
- Semester progress bar.
- Stat trio: semester done, consistency, tasks done.
- Premium card.
- Settings rows for widget preset, theme, reminders, import history, data/privacy.
- Utility rows: App Store preview, design notes, replay onboarding.

### Reminders

- Default class reminder segmented control.
- Smart suggestion card.
- Active reminders list with class glyphs and toggles.
- Reminder types include class, assignment, exam.

### Paywall

- Modal/fullscreen surface.
- Close button.
- Crown icon card.
- Headline: "Run your whole semester on autopilot."
- Feature list:
  - Unlimited syllabus scans
  - Notes scanner and AI summaries
  - Advanced widgets and presets
  - Smart reminders
  - Calendar intelligence
  - Class insights
- Plan picker: monthly/yearly, yearly save badge.
- Sticky glass CTA: start 7-day free trial.

### Empty States

- Explicit empty states for syllabus, classes, notes, tasks, widgets.
- Each has icon, short copy, and next-action CTA.
- No dead ends.

### Notifications / Live Activity

- Live Activity hero for next class and room.
- Notification preview list for class, exam, assignment, study block.
- Emphasis on room-aware, deadline-aware, exam-aware nudges.

## Navigation

Root tab map:

- `today` -> TodayScreen
- `classes` -> ClassesHome
- `scan` -> ScanHub
- `plan` -> PlanScreen
- `profile` -> ProfileScreen

Push screens:

- onboarding/import: splash, welcome, onboarding, importChoice, pasteText
- scanner: syllabusScan, reviewImport, applySuccess, notesScan
- widgets: widgetStudio, presetDetail, themeStudio, homePreview, lockPreview
- academics: classDetail, tasks, taskDetail, notesHome, noteDetail, weekPlan
- account: reminders, appStore, implNotes, emptyStates, notifications

## Interactions

- Tab changes fade.
- Push/pop screens slide.
- Scan FAB opens scan tab.
- Scanner auto-advances through phases.
- Import review does not persist until Apply.
- Applying syllabus sets OS live and navigates to dashboard.
- Task completion toggles row state with check animation.
- Note scanner can generate note, terms, suggested tasks, and reminder.
- Preset card opens preset detail.
- Save preset updates active preset.
- Theme swatches live-update the app theme.
- Home/Lock preview screens are immersive fullscreen mockups.
- Paywall opens from profile/premium surfaces and closes without changing backend state.

## Animations and Motion

Defined CSS animations:

- `spa-rise`: staggered card entry.
- `spa-pop`: scale/pop success and chip entry.
- `spa-fade`: screen and flash fade.
- `spa-sheet`: bottom sheet entry.
- `spa-scan`: scanner line / OCR sweep.
- `spa-shimmer`: loading skeleton.
- `spa-spin`: extraction spinner.
- `spa-pulse`: attention pulse.
- `spa-check`: completion check stroke.
- `spa-float`: floating success/icon motion.
- `spa-glow`: glow pulse.
- `spa-bar`: progress bar fill.
- `spa-pushin` / `spa-popin`: screen stack transitions.

Reduced motion:

- `prefers-reduced-motion: reduce` collapses decorative animation durations and stops shimmer.

## Design Tokens

### Colors

Base brand:

- blue `#0A84FF`
- purple `#7B5CFF`
- green `#30D158`
- orange `#FF9F0A`
- red `#FF453A`
- pink `#FF375F`
- teal `#40C8E0`
- yellow `#FFD60A`

Light theme:

- bg `#EFEFF4`
- bg gradient `radial-gradient(120% 80% at 50% -10%, #FBFBFE 0%, #EFEFF4 46%, #E9E9F0 100%)`
- surface `#FFFFFF`
- surface-2 `#F6F6FA`
- surface-3 `#ECECF2`
- hairline `rgba(60,60,67,0.10)`
- label `#0A0A0D`
- label-2 `rgba(60,60,67,0.62)`
- label-3 `rgba(60,60,67,0.34)`
- glass `rgba(255,255,255,0.62)`
- tab bg `rgba(248,248,252,0.72)`

Dark theme:

- bg `#000000`
- bg gradient `radial-gradient(120% 80% at 50% -10%, #14141B 0%, #050507 60%, #000 100%)`
- surface `#1A1A1E`
- surface-2 `#232329`
- surface-3 `#2C2C33`
- hairline `rgba(255,255,255,0.09)`
- label `#FFFFFF`
- label-2 `rgba(235,235,245,0.60)`
- label-3 `rgba(235,235,245,0.30)`

Class identity:

- BIO green `#30D158`
- FIN blue `#0A84FF`
- CHEM purple `#BF5AF2`
- HIST orange `#FF9F0A`
- CS pink `#FF375F`

Theme variants:

- ocean, grape, neon, minimal, athlete, academic.

### Typography

Prototype uses Apple system fonts.

- hero: 40 / 1.04 / 800
- title: 30 / 1.08 / 800
- title2: 24 / 1.12 / 750
- section: 19 / 1.2 / 720
- card: 16 / 1.25 / 650
- body: 15 / 1.4 / 450
- meta: 12.5 / 1.3 / 500
- badge: 11 / 700 / uppercase
- numeric values use tabular numerals.

### Radius

- xs 10
- sm 14
- md 18
- lg 22
- xl 28
- pill 999

### Shadows and Materials

- Default card shadow: small y shadow plus soft 8-24 blur.
- Large shadow: 12-40 blur.
- Glass cards use blur 28px, saturate 180%, translucent fill, subtle border.
- Tab bar uses glass fill, large shadow, and inset highlight.

### Spacing

The prototype uses compact iOS spacing:

- outer screen horizontal padding: 16-20
- stacked card gap: 11-18
- card padding: 14-18
- section header bottom padding: 8-10
- tab bar bottom inset: 10
- top content usually begins at 56 to account for iOS status/nav chrome.

## Component Inventory

Prototype shared components:

- ClassGlyph
- Section
- Ring
- Segmented
- Pill
- Sheet
- TaskRow
- NoteCard
- TopBar
- IconBtn
- HealthBar
- Toggle
- Widget
- DetailBar
- iOS preview components in `ios-frame.jsx`

Directive component names to keep/refine in the real app:

- HeroCard
- SurfaceCard
- GlassCard
- WidgetCard
- TimelineRow
- ClassBadge
- ReminderPill
- SectionHeader
- EmptyState
- ImportStatusCard
- ScannerCard
- ProgressComponents

## Visual Hierarchy

The hierarchy is "status before action":

1. Semester health and current state.
2. Next immediate context.
3. Deadlines and schedule.
4. AI insight / recommended action.
5. Widgets and cross-device continuity.
6. Detail and customization.

Cards are compact and information-dense. The prototype avoids oversized marketing hero layouts inside the app.

## Data Truth

Prototype sample data includes:

- 5 classes
- 9 tasks
- 4 exams
- 5 notes
- 4 reminders
- 8 widget keys
- 8 presets
- 8 themes
- 7 scan extraction steps

Real implementation must not persist fake data. Prototype data only defines shape, hierarchy, labels, states, and interaction behavior.

## Prototype Screenshots

Reference screenshots in zip:

- dashboard.png
- welcome.png
- 01-scanner.png
- 02-scanner.png
- 01-studio.png
- 02-studio.png
- 01-widgets.png
- 02-widgets.png
- 03-widgets.png
- 01-previews.png
- 02-previews.png
- 03-previews.png
- 01-lock.png
- 02-lock.png

Screenshot contact sheet generated during audit:

- `/tmp/studyplanner-prototype/contact-sheet.png`

## Non-Negotiables

- Preserve OCR, Vision OCR, parser, import review, widget persistence, reminders, notes, calendar, subscriptions, persistence, localization, navigation, and data models.
- Replace presentation and interaction hierarchy, not backend foundations.
- No fake persistent data.
- Empty states must guide the next action.
- Dashboard, scanner, and widget studio are the highest-fidelity targets.
