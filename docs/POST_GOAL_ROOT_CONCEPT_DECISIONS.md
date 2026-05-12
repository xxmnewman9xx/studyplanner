# Post-Goal Root Concept Decisions

## Product Thesis

StudyPlanner is a reviewed due-date planner with useful small and medium Home Screen widgets: school materials become found work, students check it, then confirmed deadlines power Today, Calendar, Week, Classes, reminders, and widgets.

## Decisions

| Decision | Rationale | Status |
| --- | --- | --- |
| Position v1 as reviewed due-date planner with widgets | Strongest truthful, test-backed loop | Adopted |
| Remove broad class schedule/focus/perfect AI claims | Current shipped features do not support those claims fully | Adopted in metadata docs |
| Keep native widget support to small/medium only | Swift widget supports only these families | Adopted |
| Treat StoreKit sandbox proof as external blocker | Static checks cannot prove products in App Store Connect | Adopted |
| Do not trust parser semester metadata automatically | Parser metadata was not separately reviewed | Fixed |
| Use submission verification mode for stricter release gates | Normal dev checks stay usable while submission gates fail closed | Fixed |
| Defer FoundWorkDraft model | High-value but larger data model/routing change | Deferred |
| Defer calendar/reminder reconciliation | Requires external event/notification update/delete semantics | Deferred |
