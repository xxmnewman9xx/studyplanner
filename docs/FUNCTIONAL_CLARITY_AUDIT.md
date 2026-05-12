# Functional Clarity Audit

Date: 2026-05-12
Branch: v1-1-widget-command-center
Baseline commit: 4e4870bb8180853ad54cc4b7b6b9f10ca76af4ff

## Goal

Make every visible StudyPlanner surface answer three questions:

- What is this?
- Why does it matter?
- What can I do next?

The release candidate should feel Apple-native and student-friendly, not like a generic analytics dashboard.

## Decisions

| Old wording | New wording | Decision |
| --- | --- | --- |
| Weekly Urgency | Due this week | Rename. Students need the deadline count, not a severity label. |
| Command Load | Workload | Rename. The graph counts assignments and exams by day. |
| Course Balance / Course Focus | Work by class | Rename. The view shows which classes have the most open work. |
| Heavy Week / Heavy Days | Busy week / Busy days | Rename. "Busy" is plainer and less alarmist. |
| Focus Mode | Widget shows | Rename in Widget Studio. The control changes what the widget displays. |
| Semester Pulse / semester flow | Progress / complete | Rename. Completion is a progress measure. |
| Command center | Plan / planner / Today | Rename where user-facing. Keep only internal component names for compatibility. |

## Screen Audit

### Onboarding

- Simplified captions so each step says exactly what happens: upload, review, calendar, Today, widgets, colors.
- Widget Studio step now says users choose what the widget shows, how big it is, and what colors it uses.
- Preview data remains local to onboarding and is not written as production planner data.

### Today

- Header now says "See what is due and what to do next."
- Weekly graph is labeled "Due this week."
- Workload graph explains that bars count assignments or exams due each day.
- Busy-week warning sends the student to Calendar for the days that need time.
- Upcoming section tells students to tap an item for details or mark it done.

### Calendar

- Header now says to tap any day to see assignments and exams.
- Month metrics use "Due This Month" and "Busy Days."
- Date taps continue to reveal the selected day's agenda.
- Week details clarify that each row shows what is due that day.

### This Week

- Copy now describes a seven-day deadline view.
- "Load Map" became "Workload."
- Busy-week warning tells students to block time on the busiest days.

### Review Inbox

- Existing accept, edit, ignore, and apply-plan actions remain intact.
- Existing scan/import flow remains unchanged.

### Classes

- Existing course selection and class detail behavior remain intact.
- Graph language now favors "Work by class" instead of dashboard wording.

### Widget Studio

- Widget choices are now functional and persistent:
  - size
  - what the widget shows
  - visual style
  - app palette
- The live preview updates immediately from the selected size, focus, style, and palette.
- Stored widget preferences are validated before use, so bad stored values fall back safely.

### Native Widgets

- Native WidgetKit small and medium widgets already read the snapshot's widget style.
- This pass makes native text and muted colors read from the selected style too.
- Empty states now use plain release copy:
  - "No upcoming deadlines"
  - "Scan a syllabus to start."
- Small and medium widget surfaces remain fixed to Next Due and This Week. Widget focus preferences are documented as in-app preview preferences until a future native configurable widget pass.

## Safety Notes

- Scanner/parser code was not changed.
- Review Inbox data flow was not changed.
- Calendar date selection and agenda behavior were not changed.
- IAP product IDs and purchase execution were not changed.
- Capture/demo seed still only activates through `EXPO_PUBLIC_STORE_CAPTURE=1`.
- Widget preferences are stored separately from planner data.

## Verification Plan

- `npm run typecheck`
- `npm run test`
- `npm run check:iap`
- `npx expo install --check`
- production-mode simulator install and smoke test
- capture-mode screenshot proof
- `EXPO_PUBLIC_STORE_CAPTURE=1 ./scripts/verify-ios-widgetkit.sh`

## Self-Improving RC Update - 2026-05-12

The persona audit found five high-impact clarity/functionality gaps and all five were fixed:

| Finding | Fix |
| --- | --- |
| Review Inbox had no visible way to reject a bad extracted item. | Added a `Remove` action to each review row and renamed restore copy to `Undo removed`. |
| `Select All` sounded risky and unclear. | Renamed to `Accept shown`; final import CTA is now `Add accepted items to planner`. |
| Confidence filters looked like assignment priority. | Renamed High/Medium/Low to `Sure`, `Check`, and `Needs help`, with an `AI confidence` caption. |
| Class Hub `+` button was dead. | Wired it to a top `Add Class` form so the obvious action works. |
| This Week existed but was not reachable. | Added a `Week` tab that routes to `WeekPlannerScreen`. |

Additional clarity fixes:

- Today header actions now show visible `Scan`, `Remind`, and `Sync` labels.
- Onboarding now says manual planning is free and Plus powers syllabus scanning, avoiding a broken-promise feel.
- The Review Inbox removal path excludes bad items before they touch Today, Calendar, Classes, or widgets.

Retest:

- `npm run typecheck`: pass
- `npm run test`: pass, 15/15
