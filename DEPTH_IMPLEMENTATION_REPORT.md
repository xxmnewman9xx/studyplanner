# StudyPlanner Depth Implementation Report

Date: 2026-05-31

## Summary

Converted `STUDENT_LIFE_DEPTH_PLAN.md` into local-first implementation.

This pass does not call AI APIs, LLMs, network services, or cloud storage. The depth engine is deterministic TypeScript and persists inside the existing planner JSON through `AsyncStorage` / local storage.

Implemented priority order:

1. Feed ranking
2. Forecast memory
3. Focus memory
4. Widget adaptation
5. Watch adaptation

Also wired Classes and Notes into the same memory model so every major feature can answer: "What did the app learn about me?"

## What Was Implemented

### Local Memory Model

Added `StudentLifeMemory` in `src/models.ts`.

Stored with `PlannerData.studentLifeMemory`, so it travels with the rest of the local planner state.

New local engine: `src/logic/studentLifeDepth.ts`

It provides:

- `createStudentLifeMemory`
- `ensureStudentLifeMemory`
- `buildStudentLifeContext`
- local recorders for visits, top actions, forecast snapshots, focus sessions, notes, widgets, and watch signals
- deterministic Day 1 / Day 30 fixture memory for simulator proof

### App Integration

Updated `App.tsx` to:

- hydrate and persist `studentLifeMemory`
- build one shared `studentLifeContext`
- record feature visits locally
- record forecast snapshots locally
- record Home top-action exposure locally
- record focus outcomes locally
- record note creation/conversion/pinning locally
- record widget saves/recommendations locally
- record watch signals locally
- pass depth context into Home, Forecast, Classes, Focus, Notes, and Widget Studio

### Surface Integration

Updated screens:

- `src/screens/TodayScreen.tsx`
- `src/screens/PlanScreen.tsx`
- `src/screens/CoursesScreen.tsx`
- `src/screens/FocusScreen.tsx`
- `src/screens/NotesScreen.tsx`
- `src/screens/MoreScreen.tsx`

Each now surfaces a compact "What I learned" / adaptive recommendation block without changing the visual system or introducing a new UI direction.

## What Memory Is Stored

### Shared

- feature visit counts
- feature last-seen timestamps
- recommendation events
- local created/updated timestamps

### Home

- last top action
- top action seen counts by assignment
- completed top-action count
- delayed top-action count

### Forecast

- daily local forecast snapshots
- forecast state: clear, watch, warning, storm, recovery
- risk score
- heavy day count
- open count
- completed focus minutes
- top assignment id
- warning count
- accepted intervention count placeholder

### Classes

Classes consume:

- assignment state by course
- note counts by course
- focus stats by course
- stopped/completed focus ratio
- real total focus minutes by course

### Focus

- completed session count
- stopped/paused session count
- total completed focus minutes
- inferred preferred duration
- per-assignment focus stats
- per-course focus stats

### Notes

- created note count
- converted-to-task count
- pinned note count
- resurfaced note count placeholder
- note counts by course

### Widget Studio

- saved widget count
- recommended widget type counts
- last recommended widget type

### Watch

- generated signal count
- focus starts placeholder
- smart snooze placeholder
- last signal

## What Adapts

### Home

Feed ranking now adjusts using:

- original planner urgency score
- repeated top-action exposure
- course focus history
- stopped-vs-completed course pattern
- real average focus minutes
- linked note density
- stress profile when available

Users see:

- recommended next action
- why it is ranked first
- what Home has learned so far
- the current retention value tier

### Forecast

Forecast now stores daily snapshots and adapts risk with:

- week load
- overdue work
- due-soon clusters
- exams within 7 days
- needs-review work
- completed focus minutes

Users see:

- Clear / Watch / Warning / Storm / Recovery
- risk details
- risk trend vs prior local snapshot
- one recommended intervention

### Classes

Classes now adapt around the course with the strongest signal:

- open work
- course notes
- focus completion
- stopped focus attempts
- real effort minutes

Users see:

- which class the app has learned most about
- what class-specific action to take next

### Focus

Focus now adapts using:

- preferred duration inferred from completed sessions
- assignment focus attempts
- course completion rate
- stopped/paused history

Users see:

- what Focus learned from prior sessions
- why block size is adapting
- the locally recommended focus action

### Notes

Notes now adapt around:

- which course accumulates context
- which notes become tasks
- pinned notes
- local note counts

Users see:

- what the app learned from their notes
- which class memory should resurface next

### Widget Studio

Widget recommendations now adapt to:

- forecast state
- next assignment kind
- focus history
- saved/recommended widget history

Users see:

- recommended widget face
- why it changed
- what Widget Studio remembers

### Watch

Watch preview inputs now adapt through `MoreScreen` without editing the high-risk shared `SPWatchPreview` component.

The watch signal changes based on:

- forecast warning/storm state
- next recommended task
- recommended focus duration
- previous wrist signals

Users see:

- adaptive watch signal
- wrist action
- phone escalation target
- what Watch has learned locally

## What Improves Over Time

### Home

1 day:

- learns first top action and first response pattern

7 days:

- recognizes recurring ignored or completed recommendations

30 days:

- ranks with real course effort and completion behavior

90 days:

- understands semester rhythm and long-range next-best-action patterns

### Forecast

1 day:

- stores first risk snapshot

7 days:

- compares workload against real behavior

30 days:

- predicts overload with real focus and class volatility

90 days:

- recognizes semester cycles before they become urgent

### Classes

1 day:

- learns course roster, open work, and context

7 days:

- sees which classes accumulate notes, slips, and focus time

30 days:

- builds class personality: difficulty, effort, and risk

90 days:

- knows which classes need early warning and which stay stable

### Focus

1 day:

- learns first start, stop, and completion signals

7 days:

- learns useful block size and course windows

30 days:

- calibrates real effort by assignment and class

90 days:

- predicts realistic study plans from long-term behavior

### Notes

1 day:

- learns what the student captures

7 days:

- learns which notes become tasks or stay pinned

30 days:

- resurfaces class memory when it changes action

90 days:

- becomes personal study memory by class and exam

### Widget Studio

1 day:

- learns which outside-app surface the student saves

7 days:

- adapts widget suggestions to current week state

30 days:

- recommends faces by goal, class risk, and real usage

90 days:

- rotates surfaces around semester rhythm

### Watch

1 day:

- learns whether wrist signals are useful

7 days:

- learns starts, snoozes, and tiny actions

30 days:

- chooses the one wrist signal most likely to help

90 days:

- becomes a reliable micro-action layer

## Validation

Completed:

- `npm run typecheck`
- `npm run test:planner`
- `npm run test:widgets`
- `npm run test:widget-integrity`
- `EXPO_PUBLIC_SIM_QA_CAPTURE=1 npx expo run:ios --configuration Release --device "StudyPlanner QA Vertical"`
- `STUDYPLANNER_SIMULATOR="StudyPlanner QA Vertical" STUDYPLANNER_SIM_CAPTURE_TABS=depth-day1,depth-day30 STUDYPLANNER_SIM_CAPTURE_WAIT_MS=9000 npm run qa:sim-product-depth -- qa-screenshots/student-life-depth`

Simulator proof targets added and captured:

- `depth-day1`
- `depth-day30`

Screenshot outputs:

- `qa-screenshots/student-life-depth/40-depth-day1-home.png`
- `qa-screenshots/student-life-depth/41-depth-day30-home.png`
- `qa-screenshots/student-life-depth/manifest.json`

Day 1 shows the app still learning the student's effort pattern.

Day 30 shows the same student/top action with learned course effort: World History has averaged 29 minutes in focus, and Home labels the value as 30-day repeated-pattern adaptation.

## GitNexus

Impact checks before edits:

- `AppContent`: LOW
- `TodayScreen`: LOW
- `PlanScreen`: LOW
- `CoursesScreen`: LOW
- `NotesScreen`: LOW
- `FocusScreen`: LOW
- `MoreScreen`: LOW

`SPWatchPreview` returned HIGH, so it was intentionally not edited. Watch adaptation is implemented through existing props from `MoreScreen`.

The GitNexus index refresh attempted first but crashed inside GitNexus after reporting a skipped large file; impact checks used the available `studyplanner` index.

Post-change `npx gitnexus detect-changes --repo studyplanner` reported CRITICAL because the diff touches the app shell, persistence model, and six primary screens. This matches the intended cross-surface depth implementation scope.
