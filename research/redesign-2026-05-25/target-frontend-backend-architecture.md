# Target Frontend and Backend Architecture

## Product Spine

StudyPlanner should remain one loop:

1. Scan or capture coursework.
2. Review and confirm every extracted row.
3. Save to Today, Calendar, Classes, Focus, and Widgets.
4. Use Today as the daily command center.
5. Use Widgets and Plus features as durable retention and paid value.

## Frontend Target

- Tabs: Today, Scan, Calendar, Classes, Widgets.
- Secondary tools: Notes, Focus, Grades, Plus, Settings reachable from Widgets/More.
- Today: one next task, quick capture, progress, reminders/calendar actions, scan shortcut.
- Scan: camera/photo/PDF/paste inputs, parser status, review summary, editable rows, blocked invalid dates.
- Calendar: month density, selected-day agenda, workload bars, quick capture, focus-block planning.
- Classes: course hubs with upcoming work, notes, schedule, teacher/room details.
- Focus: simple start/pause/save/done tied to assignment context.
- Widget Studio: choose widget, choose data, choose style, preview, save; native truth labels remain explicit.
- Onboarding: real app previews in sequence: scan, review, calendar, today, classes, focus, widgets.

## Backend Truth Target

Current truth: local-first app with optional parser endpoint and native store entitlement. No app backend exists in repo.

Required backend contracts before stronger cloud claims:

- `POST /api/syllabus/parse`: accepts the current FormData client request or client is changed with tests.
- Parser response schema: `SyllabusParseResult` with validated courses, assignments, grade items, findings.
- Local parser fallback: text/PDF only; image fallback must clearly fail with retry/paste/PDF options.
- Planner persistence model: versioned local data with migration and write-failure surfacing.
- Entitlement model: store-derived native entitlement now; server receipt validation needed for account/cloud entitlement.
- Widget sync: snapshots contain reviewed planner rows only; native refresh age should be visible.
- Calendar/reminders: local device integrations only; reconciliation needed for edits/deletes.

## Implementation Boundary for This Pass

Implemented:

- Reconnected Today and Calendar capture loops.
- Added Import review summary and confirm-all-valid action.
- Added Today onboarding preview.
- Moved More hub above Widget Studio.
- Fixed tablet review routing to Scan.
- Aligned parser config truth and parser contract docs.

Deferred because risk is high/critical:

- Changing parser upload body.
- Adding server receipt validation.
- Adding storage migration.
- Reworking app state architecture.
- Rebuilding native widget sync internals.
