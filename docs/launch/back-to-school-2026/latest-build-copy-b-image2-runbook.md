# Latest Build Copy B Image 2.0 Runbook

Generated: 2026-07-07
Release: Back-to-School Semester Kickoff

## Source Rule

This queue is deprecated as a final-asset runbook and should be used only as concept evidence. It replaces stale UI sources with latest-build captures under `qa-screenshots/back-to-school-2026-native`, but the resulting native Image 2.0 exports were `853x1844` and the exact-size files were resized derivatives.

The current live App Store Connect previews remain Copy A/control. The final B path is the outcome-based queue in `docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-image2-manual-queue.json`.

## Prompting Rule

Do not use this runbook for final B production. Final B must be generated individually in the ChatGPT Mac app with GPT Image 2.0, with exactly two references attached for each job: `assets/app/study-planner-icon.png` and the slide-specific real UI reference from the outcome queue.

## Queue

| ID | Source | Copy | Proof |
| --- | --- | --- | --- |
| latest-en-US-01 | qa-screenshots/back-to-school-2026-native/app-05-import-choice.png | Build your semester. | latest Build 77 import choice UI |
| latest-en-US-02 | qa-screenshots/back-to-school-2026-native/app-06-review.png | Review before anything saves. | latest Build 77 review-before-save UI |
| latest-en-US-03 | qa-screenshots/back-to-school-2026-native/app-07-semester-ready.png | Semester ready in minutes. | latest Build 77 semester ready UI |
| latest-en-US-04 | qa-screenshots/back-to-school-2026-native/app-08-today.png | Know today's next move. | latest Build 77 Today dashboard UI |
| latest-en-US-05 | qa-screenshots/back-to-school-2026-native/app-09-focus.png | Plan the week calmly. | latest Build 77 plan/focus UI |
| latest-en-US-06 | qa-screenshots/back-to-school-2026-native/app-10-widgets.png | Widgets stay in sync. | latest Build 77 in-app widget sync UI |
| latest-en-US-07 | qa-screenshots/back-to-school-2026-native/widget-02-normal-medium.png | Real widgets on Home Screen. | latest Build 77 real WidgetKit Home Screen proof |

## Replacement Outcome Queue

Use this final sequence instead:

| Slide | Source | Copy | Proof |
| --- | --- | --- | --- |
| 01-scan-syllabus-notes.png | qa-screenshots/back-to-school-2026-native/app-06-review.png | Scan syllabus or notes. | review/import UI, not locked scanner UI |
| 02-approve-deadlines.png | qa-screenshots/back-to-school-2026-native/app-06-review.png | Approve every deadline. | review-before-save UI |
| 03-semester-built.png | qa-screenshots/back-to-school-2026-native/app-07-semester-ready.png | See the semester built. | semester ready UI |
| 04-today-next-move.png | qa-screenshots/back-to-school-2026-native/app-08-today.png | Know today's next move. | Today dashboard UI |
| 05-study-blocks.png | qa-screenshots/back-to-school-2026-native/app-09-focus.png | Plan study time calmly. | plan/focus UI |
| 06-widgets-sync.png | qa-screenshots/back-to-school-2026-native/app-10-widgets.png | Widgets stay in sync. | in-app widget sync UI |
| 07-home-screen-widgets.png | qa-screenshots/back-to-school-2026-native/widget-02-normal-medium.png | Real widgets on Home Screen. | real WidgetKit Home Screen proof |
