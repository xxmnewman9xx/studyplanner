# StudyPlanner: Syllabus AI — Student Life OS Product Contract

## App Thesis

StudyPlanner is not a generic planner. StudyPlanner: Syllabus AI turns messy school inputs into a personalized Student Life OS: a local-first operating layer for classes, assignments, exams, projects, readings, sports, music, clubs, work shifts, focus sessions, notes, widgets, and watch surfaces.

The app should feel like Apple built a student command center: simple, white-first, vibrant only where meaning demands it, and visibly personalized by the student's Life Studio choices.

## Product Spine

Onboarding → Life Studio → Paywall → Student Life Feed → Scan → Review → Forecast → Classes → Focus → Notes → Widgets/Watch

Every screen must answer one question in under three seconds:

- What matters next?
- Why does it matter?
- What is the next action?

## Visual Rules

- White luxury shell first. Avoid gray dashboard slabs and dense boxed layouts.
- Black typography, large hierarchy, short copy, generous whitespace.
- Colorful cards only when they encode meaning: risk, focus, recovery, activity, work, completed, or OS behavior.
- Prefer Apple Sports clarity: one strong hero, 2–4 meaningful cards, obvious next action.
- Prefer Apple Watch Face Gallery energy: personalized preview, identity-driven modules, polished tile selection.
- Use soft shadows, restrained glass, rounded native cards, and clear touch targets.
- Avoid noisy gradients, fake glows, tiny chips, chart clutter, SaaS dashboards, and web-style panels.

## Personalization Rules

All major surfaces must read from:

- `StudentDNA`
- `OSBehavior`
- `FrictionPoint`
- `WidgetDNA`
- `WatchDNA`

Life Studio choices affect:

- feed ordering
- hero copy
- visible metrics
- card accent colors
- recommendation tone
- widget/watch preview emphasis
- forecast framing
- empty, error, and success states

Behavior rules:

- Highest GPA: exams rise, grade impact appears, risk accents sharpen, study copy becomes direct.
- Less Stress: free time and recovery rise, copy softens, urgency is reduced.
- Athletic Performance: practice/recovery and conflicts rise, school work is framed around activities.
- Life Balance: academics, activity, work, and wellness stay visibly mixed.
- High Achievement: future risk, aggressive planning, and long-range forecasts rise.

Friction rules:

- Procrastination: start-tonight nudges and smaller first steps.
- Exam Anxiety: calmer exam copy and broken-down study sessions.
- Overcommitment: load warnings and conflict language.
- Focus Issues: shorter blocks and focus-window language.
- Forgetfulness: reminder-forward cards and watch/widget emphasis.

## Surfaces Affected

- Onboarding / Life Studio setup
- Plus paywall
- Home / Student Life Feed
- Scan / Import
- AI Review Inbox
- Smart Forecast / Plan
- Classes
- Focus
- Notes
- Widgets / Life tab / More
- Empty states
- Error states
- Success states

## Feature Map

- Syllabus AI import: camera/file/paste input, local parser fallback, review gating, duplicate/date confidence checks.
- AI Review Inbox: low-confidence, duplicate, and missing-date review before planner commit.
- Student Life Feed: personalized mixed academic/life feed with reasons and next actions.
- Smart Forecast: deterministic workload, busy-week, focus-window, risk, recovery, and calendar guidance.
- Classes: class identity, upcoming work, notes, grade context, quick add.
- Focus: recommended blocks, assignment-linked sessions, short starts, completion tracking.
- Notes: class-context notes, pinned notes, note-to-task conversion.
- Life Studio: identity, layout, Widget DNA, Watch DNA, OS Behavior, friction points.
- Widgets/Watch: adaptive previews and native widget sync architecture.
- Plus: unlocks unlimited imports, full Life Studio, advanced forecast, adaptive widgets/watch, smart reminders, personalization.

## QA Gates

- `npm run typecheck`
- `npm run check:localization`
- `npm run test:widgets`
- `npm run test:parser`
- `npm run test:capture-parser`
- `npm run test:backend-platform`
- `npm run test:planner`
- `npm run check:iap`
- iOS simulator build
- iPhone simulator screenshots for onboarding, paywall, feed, scan/import, review, forecast, classes, focus, notes, Life/widgets, empty state

Visual QA gate:

- If a screenshot looks like a normal planner, fail it.
- If it looks like a web dashboard, fail it.
- If Life Studio choices are invisible, fail it.
- If the screen cannot work as an App Store preview, keep iterating.

## Anti-Slop Rules

- No horizontal poster boards inside the app.
- No pasted reference image.
- No fake chatbot.
- No random color for decoration.
- No one-off screen styling when a shared Student Life OS component exists.
- No backend/parser/IAP/storage contract changes for visual work.
- No new external AI, API keys, Ollama, or remote dependency.
- No cramped chip clouds, tiny text panels, or generic settings lists as primary UI.
