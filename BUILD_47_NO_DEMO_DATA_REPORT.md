# Build 47 No Demo Data Report

## Changes
- Production `defaultData` now ships with no classes, tasks, exams, notes, reminders, study blocks, or fake student coursework.
- Storage normalization no longer repopulates empty arrays from default fake data.
- First import starts from a clean slate.
- Visible profile fake progress was removed.
- Regression fixtures moved to `scripts/fixture-data.ts`, outside production first-run state.

## Verification
- First launch has no fake schoolwork: PASS.
- Empty state does not crash SemesterSnapshot: PASS.
- Widgets handle locked/empty state: PASS.
- Notifications do not schedule fake reminders: PASS.
- Parser tests still use script-only fixtures: PASS.

## Risk
Medium-low. Empty production data is now intentional; future tests must not depend on production defaults containing coursework.
