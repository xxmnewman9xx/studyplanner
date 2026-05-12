# Data Flow And State Integrity 9.2

## Current Data Flow

Upload/photo/file -> parser -> draft Review state -> user accept/edit/remove -> accepted assignments merge into planner -> Today/Calendar/Week/Classes/reminders/widgets.

## Trust Boundary Findings

| Boundary | Current Evidence | Risk | 9.2 Fix | Status |
| --- | --- | --- | --- | --- |
| Parsed assignments | Endpoint/local rows normalize to source syllabus and needsReview. | Good foundation. | Keep and add response schema validation. | Planned |
| Parsed courses/grades/semester | applyParsedPlan currently merges all parsed courses/gradeItems/semester dates. | Unreviewed metadata can alter trusted planner. | Only merge linked/approved metadata. | Planned |
| Manual assignments | Manual add creates accepted assignments directly. | Invalid date can crash later. | Validate before save. | Planned |
| Widgets | buildWidgetSnapshot uses isAssignmentOpen and reviewQueueCount. | Preview/native scope drift. | Separate supported native surfaces from preview ideas. | Planned |
| Storage | Single JSON blob; parse errors return null. | Silent data loss possible. | Add schema/version recovery later. | Deferred |
| Reminders/calendar sync | Confirmed assignments only. | No update/delete reconciliation. | Document/defer deeper lifecycle fix. | Deferred |
