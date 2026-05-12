# Data Flow And State Integrity

## Canonical Flow

1. User adds school material.
2. Source document or manual equivalent is saved.
3. Parser/import job creates untrusted found work.
4. Check New Work shows found work.
5. User accepts, edits, deletes, or merges.
6. Only accepted rows become confirmed assignments.
7. Confirmed assignments power Today, Calendar, Week, Classes, Busy Week, reminders, widgets, and screenshots.
8. WidgetSnapshot is generated from confirmed assignments plus a Needs Check count.
9. Native WidgetKit reads the current safe snapshot.

## Fixes Completed

- `src/logic/assignmentModel.ts` now exposes `isAssignmentConfirmed` and requires accepted review state for `isAssignmentOpen`.
- `src/services/syllabusParser.ts` forces endpoint/parser rows to stay `needsReview`.
- `src/services/syllabusLocalParser.ts` raises the local review limit to 75 and emits a warning finding when more work is found.
- `App.tsx` keeps all assignment rows for review visibility, but rebuilds trusted source IDs from accepted rows only.
- Planner, insights, class stats, reminders, and calendar sync now filter through confirmed/open helpers.
- Today shows Needs Check as an explicit review count, not as confirmed due dates.

## QA Evidence

- `npm run test` passed 20 tests, including confirmed-boundary, planner, widget snapshot, and local parser review-limit coverage.
- Capture WidgetKit verify produced accepted rows in `thisWeek` plus `reviewQueueCount: 3`.
- Production WidgetKit verify produced no `demoState`, no assignments, and `reviewQueueCount: 0`.

## Remaining Risk

- External calendar/reminder update lifecycle can still drift after a due-date edit because delete/update reconciliation is not fully implemented.
- Timezone and locale canonicalization need a broader date utility pass before international release.
