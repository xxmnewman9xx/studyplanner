# Dashboard Trust Audit

Agent: Dashboard Trust Auditor

## Root Causes

- `buildSemesterHealth()` produced fallback dimension values for empty coursework: workload near 100, grades 78, preparedness 62, consistency 82.
- `Today` rendered the full dashboard even when there were no classes, tasks, exams, or study blocks.
- The result was contradictory: "No semester loaded" alongside a populated score and colorful bars.

## Changes

- Added `hasRealSemesterData()` in `src/intelligence.ts`.
- `buildSemesterHealth()` now returns score `0`, graphite dimensions, and `Scan syllabus` when no real semester data exists.
- `Today` now exits early into a dedicated empty dashboard branch.
- `SemesterHealthHero` has a no-semester render:
  - Label: `SEMESTER HEALTH`
  - Title: `Add Syllabus`
  - Subtitle: `No semester loaded.`
  - Pill: `Start here`
  - Ring: `0`
  - Metrics: `Workload --`, `Grades --`, `Preparedness --`, `Consistency --`
  - Next Move: `Scan syllabus`, `Build your semester first.`
- Empty dashboard CTAs: `Scan syllabus`, `Paste text`, `Upload PDF`.

## GitNexus Impact

- `buildSemesterHealth`: CRITICAL risk. Feeds `buildSemesterSnapshot`, dashboard screens, widgets, reminders, and QA scripts.
- `SemesterHealthHero`: LOW risk. Direct caller: `Today`.
- `Today`: LOW upstream risk. Direct caller: `App`.

## Verification

- `npm run check:activation-spine`: PASS. It imports the health helper and verifies empty score/dimensions are `0`.
- `npm run qa:release`: PASS.
- Source search verified the old fallback literals still exist only for real-data grade labels/legacy logic, not empty semester output.

## Score

- Empty state truthfulness: 10/10
- Visual polish: 9/10
- Data integrity: 10/10
- CTA clarity: 10/10

Remaining risk: empty dashboard was not separately screenshot after completing onboarding because the simulator smoke focused on true fresh install. The branch is covered by deterministic checks.
