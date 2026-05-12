# Use Case Swarm 200

Date: 2026-05-12
Count: 200 real-world use cases

Each row contains 10 concrete use cases. The expected behavior, screens, likely failure, actual result, and fix need apply to each ID in that row.

| IDs | Use cases | Screens | Expected behavior | Likely failure | Actual result | Fix needed |
| --- | --- | --- | --- | --- | --- | --- |
| MS-001..010 | 6 classes, late homework, tomorrow quiz, no data, parent setup, skipped onboarding, theme change, complete item, wrong imported item, widget-only check | Onboarding, Today, Inbox, Calendar, Week, Widgets | A young student can see what is due and recover from mistakes | Hidden actions, confusing copy | Mostly pass | Widget copy honesty fixed |
| MS-011..020 | middle school color coding, exam panic, reading-heavy week, one class only, all done, overdue, add class, add assignment, remove bad scan row, open details | Today, Classes, Detail, Week | Every button works and labels are plain | Dead buttons, fake scheduling | Fixed from prior pass | Retest |
| HS-001..010 | 5 syllabi, AP exam week, recurring homework, lab reports, sports conflict, semester project, finals review, class filter, dense month, completed work | Inbox, Calendar, Week, Classes | Counts match across screens | Drift between graphs/calendar | Pass tests | None |
| HS-011..020 | no syllabus dates, ambiguous date, image-only PDF, text PDF, plain text, photo import, parser failure, duplicate title, manual edit, accept shown | Inbox | Parser limits are honest; review before add | Overpromised OCR/photo | Needs copy fix | Fixed |
| COL-001..010 | college 5 courses, seminar reading, lab, midterm, project, grade forecast, calendar sync, reminders, syllabus scan, weekly planning | All | Premium gates are truthful | Stranded Grades route | High | Do not overclaim |
| COL-011..020 | no purchase, purchase unavailable, monthly, yearly, lifetime, restore, cancel, pending, manage subscription, lifetime buyer | Upgrade | Store drives entitlement and UI wording | Lifetime CTA says Subscribe | High | Fixed label |
| SHIFT-001..010 | nurse/student irregular shifts, only 4 class days/month, compressed semester, weekend deadlines, night study, long gap, monthly-only planning, widget-only, reminder check, class color check | Calendar, Week, Widgets | Sparse schedule still useful | "This week empty" sounds like no plan | High | Fixed medium widget empty state |
| ADHD-001..010 | overwhelmed week, one next task, icon confusion, quick complete, clear overdue, visible widget, color preference, no random metrics, plain warning, parent support | Today, Week, Widgets | Calm next step and low cognitive load | Decorative graphs or unclear icons | Mostly pass | Clarified copy |
| PARENT-001..010 | parent checks deadlines, privacy, paywall trust, child has overdue work, calendar density, widget value, free mode, no account, scan value, support links | Today, Calendar, Upgrade | Trustworthy value and no fake access | Overclaiming AI/store | Pass | Docs |
| INTL-001..010 | international captions, month/day clarity, no localized UI yet, English learner, color meaning, no slang, calendar-only user, widget-only, App Store screenshot, privacy check | All | Plain English and visual clarity | Idioms/ambiguous labels | Pass enough | Future localization |
| REVIEW-001..010 | accept one, edit title, edit date, edit type, edit priority, remove item, undo remove, accept shown, add accepted, empty filter | Inbox | Draft review is reversible | Bad item added accidentally | Pass after prior fix | None |
| REVIEW-011..020 | sure/check/help filter, missing date, low confidence, high confidence, all removed, no accepted, restore, apply partial, source text, reminder preset | Inbox | User understands what gets added | "Remind" feels scheduled | High | Rename/remove implication |
| TODAY-001..010 | next due today, tomorrow, overdue, due today count, due week count, complete, start, detail open, scan shortcut, sync shortcut | Today, Detail, Upgrade | Today is accurate and navigable | Premium gates or nested press confusion | Pass | Future row press cleanup |
| CAL-001..010 | tap date, previous month, next month, course dots, exam day, busy day, completed day, empty day, filter course, open task | Calendar | Month is a real planning surface | Agenda/dots drift | Pass tests | None |
| WEEK-001..010 | open Week tab, workload bars, grouped due list, exam badge, busy label, empty week, complete item, open detail, weekend, dense day | Week | Seven-day planner reachable | Was unreachable | Fixed | None |
| CLASS-001..010 | add class, edit class, select class, quick add, add exam, course progress, next due, syllabus source, schedule view, no meetings | Classes | Class Hub works without dead affordances | Syllabus chevron fake, schedule not editable | High | Fix chevron/copy |
| WIDGET-001..010 | small next due, medium this week, no data, future work, all done, midnight rollover, style color, capture snapshot, production no demo, Home Screen add | Widgets, WidgetKit | Native widgets are truthful and fresh | Demo placeholder, stale label | Critical | Fixed |
| WIDGET-011..020 | change size, change shows, monthly preview, heavy preview, course preview, lock preview, style, palette, persist, app relaunch | Widget Studio | Preview is live and native limits are clear | Overpromises native focus | High | Clarify copy/defaults |
| ONBOARD-001..010 | fresh install, skip, back, finish, scan preview, review preview, calendar preview, Today preview, widget preview, color choose | Onboarding | Understandable to 9-year-old | Plus scan promise too broad | Pass with copy fixes | None |
| STORE-001..010 | reviewer no data, no capture leak, screenshot Today, Calendar, Inbox, Week, Classes, Widget Studio, native widgets, paywall, contact sheet | All | App Store proof uses real UI | Fake placeholder/demo leak | Critical | Fixed native placeholder |

## Critical/High Fix Queue

1. Fix native widget placeholder demo leakage.
2. Fix stale native widget relative labels.
3. Add or verify widget extension embedding.
4. Clarify Widget Studio native support.
5. Fix Lifetime CTA.
6. Fix scan/photo copy.
7. Remove fake-feeling Review Inbox reminder wording.
8. Remove fake chevron in Class Hub syllabus row.
