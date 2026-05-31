# STUDENT_LIFE_OS_PRODUCT_CONTRACT.md

Date: 2026-05-31

## Product Name

StudyPlanner: Syllabus AI

## Core Promise

Scan your syllabus. Get your life organized.

## Thesis

StudyPlanner is not a planner, calendar, or task app. It is a personalized Student Life OS that turns school material into an adaptive operating layer for classes, assignments, exams, readings, projects, sports, band, clubs, work, study sessions, focus blocks, notes, and recovery windows.

## Foundation To Preserve

- parser/import/review contracts
- local planner storage
- localization gates
- StoreKit/IAP and paywall logic
- widget snapshot truth tests
- planner/focus/notes/class models
- deterministic simulator capture tooling

## Shared Frontend System

All rebuilt screens should pull from shared primitives:

- `StudentLifeDesignSystem`
- `StudentLifeShell`
- `LifeCard`
- `LifeFeedCard`
- `LifeInsightCard`
- `LifeMetricTile`
- `LifeStudioTile`
- `LifeOSPreview`
- `LifeWidgetPreview`
- `LifeWatchPreview`
- `LifeActionButton`
- `LifeEmptyState`
- `LifeTabBar`

All major surfaces must read from:

- `StudentDNA`
- `OSBehavior`
- `FrictionPoint`
- `WidgetDNA`
- `WatchDNA`
- current courses, assignments, exams, activities, notes, sessions, widgets

## Personalization Contract

Personalization is behavioral, not cosmetic.

`Highest GPA`:

- exams and high-priority work rise first
- grade impact is visible
- study sessions are surfaced
- tone is direct

`Less Stress`:

- free time and recovery rise first
- copy softens
- urgency is reduced
- reminders avoid shame language

`Athletic Performance`:

- practices, recovery, and conflicts are visible
- school work is scheduled around sport commitments
- watch/widget suggestions promote next class, recovery, and exam risk

`Life Balance`:

- academics, activities, work, and wellness stay mixed
- feed avoids all-school or all-life bias
- forecast shows load distribution

`High Achievement`:

- future risk rises
- aggressive planning and long-range forecast are visible
- focus blocks are longer and more proactive

Friction points:

- `Procrastination`: smaller first steps and start-tonight nudges
- `Exam Anxiety`: calmer exam breakdowns and smaller sessions
- `Overcommitment`: conflict detection and load warnings
- `Focus Issues`: short focus windows and fewer visible tasks
- `Forgetfulness`: reminder-forward cards and widget/watch emphasis

## Screen Contract

- First-run Life Studio: identity, layout/behavior, Widget DNA, Watch DNA, friction points, live preview.
- Home / Student Life Feed: one dominant personalized recommendation plus 3-5 colorful adaptive cards.
- Semester Organized / Forecast: workload, conflicts, free time, risk, and focus blocks.
- Scan / Import: source choice, parser truth, status, and review-before-save confidence.
- AI Review Inbox: rows needing confirmation, date/confidence/duplicate warnings, add valid work only.
- Classes / Class Hub: class identity, next work, notes, grade context, meeting info.
- Focus: recommended block, timer, small first step, assignment link, completion.
- Notes: fast capture, class context, note-to-task conversion.
- Widgets / Life Studio: OS customization plus widget/watch ecosystem previews.
- Plus Paywall: sell adaptive OS value after Life Studio context, without weakening real IAP.
- Empty/error/success: truthful, calm, and OS-aware.

## Visual Contract

- white-first app canvas
- black typography
- colorful cards tied to meaning
- no fake chatbot
- no mascot/avatar
- no pasted reference images
- no poster-board screens
- no web app dashboards
- no purple domination
- no decorative orb backgrounds

## QA Contract

Required checks:

- `npm run typecheck`
- `npm run check:localization`
- `npm run test:widgets`
- `npm run test:parser`
- `npm run test:capture-parser`
- `npm run test:backend-platform`
- `npm run test:planner`
- `npm run check:iap`
- iOS simulator build
- post-onboarding/post-paywall simulator screenshots
- paywall screenshot separately
- contact sheet
- role-based screenshot scorecards
- GitNexus detect changes before commit
