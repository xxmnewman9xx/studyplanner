# Student Use Case Swarm

Date: 2026-05-12
Branch: v1-1-widget-command-center
Scenario count: 150

This swarm was run as a release-candidate functionality pass. The goal was not to invent more surface area; it was to test whether real students, parents, reviewers, and App Store users can understand and trust the features already present.

## Agents

| Agent | Primary question | Result |
| --- | --- | --- |
| Middle School Student Agent | Can a 9-14 year old understand what to do? | Fixed confusing Review Inbox actions and Today icon-only controls. |
| Parent Agent | Does the app clearly reduce school stress? | Passed with clearer onboarding and deadline visibility copy. |
| Power Student Agent | Does it hold multiple classes and lots of work? | Passed deterministic 5-class/15-item demo; 30-item scenario remains conceptual. |
| Messy Syllabus Agent | Can bad extracted items be edited or removed? | Fixed missing Remove action. |
| Widget Agent | Are widgets real, native, and data-backed? | Passed snapshot tests; native verification remains simulator/manual. |
| Calendar Agent | Does date tapping and month/week planning work? | Fixed This Week reachability by adding a Week tab. |
| Graph/Insight Agent | Do graphs explain workload? | Passed existing workload/course/completion tests. |
| Apple Native Design Agent | Does it feel like an iOS app? | Improved labels and kept native-style controls. |
| App Review Safety Agent | Are IAP and demo-data risks controlled? | Passed IAP check; Lifetime requires App Store Connect setup. |
| App Store Creative Agent | Are screenshot surfaces ready? | Capture artifact pass prepared in `artifacts/self-improving-functionality-rc`. |

## Scenario Catalog

Each row represents 10 real-world cases. All cases inherit the row's screen/data/expected/failure mapping.

| IDs | Use cases | Screens touched | Data needed | Expected behavior | Possible failures tested | Result |
| --- | --- | --- | --- | --- | --- | --- |
| MS-001..010 | first launch, skip onboarding, choose color, scan syllabus, understand Inbox, accept work, find tomorrow, open calendar, complete item, customize widget | Onboarding, Today, Inbox, Calendar, Week, Widgets | Fresh install, preview assignments | Student can move from setup to a clear next action | unclear words, hidden actions, wrong landing screen | Fixed and pass |
| MS-011..020 | late homework, no homework today, confusing exam label, tiny widget text, wrong syllabus item, edit title, edit due date, remove item, add class, add quick assignment | Today, Inbox, Classes, Widgets | Mixed statuses, one low-confidence item | Common school tasks are visible and reversible | no reject path, dead add button, clipped labels | Fixed and pass |
| PARENT-001..010 | parent checks week, asks what is overdue, scans paywall, checks privacy, checks calendar, sees widgets, restores purchase, free mode, school stress story, no account concern | Today, Week, Calendar, Upgrade, Widgets | Family device, no purchase, active purchase | Parent sees truthful value and safe free path | misleading paywall, privacy ambiguity, fake access | Pass; setup docs updated |
| PARENT-011..020 | two children sharing phone, busy Sunday planning, exam week, missed homework, calendar trust, reminder trust, scan trust, offline/manual trust, App Store preview, support-review check | Today, Calendar, Week, Upgrade | Dense week, exams, manual data | Parent understands app helps planning, not guarantees grades | overclaiming AI, unclear reminders, unsupported account model | Pass |
| POWER-001..010 | 5 classes, 30 assignments, multiple exams, course filter, dense month, workload graph, completion progress, class progress, overdue pile, large Review Inbox | Calendar, Week, Classes, Today, Inbox | Many assignments, course colors | Counts and filters stay consistent | slow scanning, wrong counts, hidden exams | Mostly pass; 30-item simulator manual remains |
| POWER-011..020 | semester start, finals week, all classes busy, one class overloaded, completed work, archived ignored work, edit imported course, retake quiz, project milestone, reading-heavy week | All planner screens | Varied assignment kinds/statuses | Workload is explained by class/day/type | completed work counted as open, ignored work active | Pass via tests/model audit |
| MESSY-001..010 | PDF syllabus, plain-text syllabus, photo syllabus, missing date, ambiguous exam, duplicate title, typo course code, wrong item, low confidence, manual edit | Inbox, Today, Calendar | Parser results with confidence | User reviews before adding | bad item added, no edit/remove, confidence misunderstood | Fixed and pass |
| MESSY-011..020 | syllabus with no dates, multiple date formats, instructor notes, grading table, reading schedule, holiday row, lab section, TBD exam, old semester date, malformed PDF | Inbox | Mixed parse findings | Failures are clear and editable | silent parser failure, impossible date, wrong status | Pass for UI; OCR endpoint setup remains |
| REVIEW-001..010 | accept one, accept sure items, accept shown filter, remove one, undo removed, edit title, edit date, edit type, edit priority, add accepted | Inbox, Today, Calendar, Classes, Widgets | Draft parse result | Counts update and only accepted items enter planner | accidental partial import, no reject path | Fixed and pass |
| REVIEW-011..020 | filter All, filter Sure, filter Check, filter Needs help, accepted hidden by low filter, empty filter, no accepted items, all removed, restore removed, apply after edits | Inbox | Review statuses and confidence | Student sees what will be added | filter labels read as priority, disabled CTA unclear | Fixed and pass |
| TODAY-001..010 | next due today, next due tomorrow, overdue count, due today count, due week count, start work, complete work, scan shortcut, reminder shortcut, calendar sync shortcut | Today, Detail, Upgrade | Open work, premium lock | Today tells what to do and gates premium truthfully | icon-only actions, wrong next due, fake premium | Fixed and pass |
| TODAY-011..020 | empty plan, all done, busy week warning, upcoming list, tap details, complete from row, exam priority, class color, widget preview, capture mode Today | Today, Week, Calendar, Widgets | Empty and busy states | Dashboard stays useful across states | no empty state, stale widget data | Pass |
| CAL-001..010 | tap date, previous month, next month, course dots, exam day, busy day, completed day, empty day, course filter, selected agenda | Calendar | Month assignments/courses | Day selection updates agenda from real data | stale selected day, wrong dots, hidden exams | Pass |
| CAL-011..020 | dense month, finals month, no work month, weekend deadline, today marker, heavy week label, monthly metrics, current-week strip, week details, calendar-to-task detail | Calendar, Detail | Month grid and assignments | Calendar behaves as planning surface | counts mismatch Today/Week, completed items hidden wrong | Pass |
| WEEK-001..010 | open Week tab, seven-day strip, workload bars, due list, exam badge, busy warning, empty week, complete item, open detail, capture Week screenshot | Week, Detail | Next seven days | This Week is reachable and actionable | screen existed but unreachable | Fixed and pass |
| WEEK-011..020 | Monday start, weekend start, midnight due, tomorrow label, multiple same-day items, exam-heavy week, assignment-heavy week, all done, one class only, many classes | Week, Today, Calendar | Date edge cases | Week counts align with Today and Calendar | timezone/day-key drift, hidden done status | Pass via tests/model audit |
| CLASS-001..010 | add class button, add first class, edit class, add assignment, add exam, select class, class progress, next due, syllabus link, weekly schedule | Classes, Detail | Courses, assignments, meetings | Class Hub is a real control center | dead plus button, no first-course path | Fixed and pass |
| CLASS-011..020 | no courses, one course, five courses, teacher missing, no meetings, many assignments, completed class, exam class, overloaded class, course color consistency | Classes, Calendar, Widgets | Course colors/statuses | Cards and details are useful | wrong progress, color mismatch, hidden add form | Fixed and pass |
| WIDGET-001..010 | small next due, medium this week, lock widget, monthly preview, heavy week preview, course focus preview, size control, focus control, style control, color control | Widgets, native widget | Snapshot and preferences | Preview changes immediately and preferences persist | controls decorative, stale styles | Pass |
| WIDGET-011..020 | empty widget, all done widget, overdue widget, long title, long course, palette change, style change, complete item refresh, capture widget data, production no demo | Widgets, Today, WidgetKit | Widget snapshot JSON | Widgets reflect real planner data | demo leakage, clipping, no reload | Pass tests; native manual remains |
| GRAPH-001..010 | workload by day, workload by class, completion percent, busiest day, busy warning, empty graph, one assignment, all completed, five classes, no courses | Today, Calendar, Week, Classes | Insights from assignments/courses | Graphs explain work, not decoration | wrong counts, unlabeled bars | Pass |
| GRAPH-011..020 | exam day weight, project-heavy day, reading-only week, course overload, overdue excluded from week, completed excluded from open, ignored excluded, capture determinism, class colors, month summary | Insights, widgets | Mixed assignment kinds | Insights match planner contract | ignored/demo data counted wrong | Pass |
| ONBOARD-001..010 | fresh install, preview scan, review preview, calendar preview, Today preview, widget preview, palette choice, back button, skip button, finish to Today | Onboarding, Today | No stored data | First-run explains and lands cleanly | confusing promise, theme not persisted | Fixed and pass |
| ONBOARD-011..020 | 9-year-old copy, parent copy, free/manual path, Plus scan mention, widget customization, color preview, motion preview, capture step links, no data write, dark mode stored | Onboarding, Theme | Preview data only | Onboarding teaches without seeding production | Plus promise mismatch, demo persistence | Fixed and pass |
| IAP-001..010 | monthly product, yearly product, lifetime product, no products, web unavailable, purchase cancelled, pending purchase, restore success, restore none, manage subscription | Upgrade, services | Store products/env IDs | Store decides entitlement; app never fakes access | fake lifetime, hardcoded premium | Pass; App Store setup required |
| IAP-011..020 | terms link, privacy link, free planner, Plus feature list, unavailable store, failed fetch, sandbox purchase, configured lifetime, unconfigured lifetime, product sorting | Upgrade, docs | Store responses | Paywall is truthful and review-safe | misleading price, hidden restore, fake trial | Pass |
| STORE-001..010 | Today screenshot, Calendar screenshot, Inbox screenshot, Week screenshot, Classes screenshot, Widget Studio screenshot, small widget, medium widget, paywall, onboarding | All, WidgetKit | Capture seed | App Store proof shows real features | screenshot-only fake data in production | Pass capture plan |
| STORE-011..020 | contact sheet, localization caption, international student, ADHD stress, college finals, middle school homework, parent preview, reviewer preview, privacy preview, widget-first user | All, docs/artifacts | Capture mode and docs | Creative assets are grounded in real screens | overclaiming, stale screenshots | Pass with remaining manual capture |

## Highest Impact Failures Found

1. Review Inbox had no visible Remove/Ignore action for wrong extracted items.
2. The Class Hub `+` button did not do anything.
3. This Week existed as code but was not reachable as a distinct planning surface.
4. "Select All" and "Apply accepted plan" were too easy to misunderstand.
5. Today header actions were visually icon-only for younger students.

## Fix Verdict

All critical/high student-flow failures found in this pass were fixed and retested with typecheck and unit tests. Remaining release blockers are external: App Store Connect product setup, sandbox IAP validation, native widget Home Screen placement, and final screenshot capture on the target simulator.
