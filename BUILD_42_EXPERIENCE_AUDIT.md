# Build 42 Experience Audit

## Audit Method

- Current local Build 42 was installed and launched in the iPhone simulator.
- Confirmed bundle `com.mattnewman.studyplanner` running from the local Build 42 install.
- Captured live Today/Dashboard screenshot:
  - `qa/build42-phase2/before-01-today.png`
- Host click injection into the Simulator device surface did not reliably activate controls, even after calibrating against the rendered device group. Because of that, Classes, Plan, Notes, Study Session, and widget surfaces were audited from the current Build 42 source and widget snapshot code rather than physical navigation screenshots.
- No code changes were made before this audit.

## Dashboard / Today

Evidence:
- Screenshot: `qa/build42-phase2/before-01-today.png`
- Source: `App.tsx` Today uses `buildSemesterSnapshot`.

Answers:
- Feels alive: partially. The screen has live intelligence, but the first card still feels like a task command card.
- Clearly communicates semester status: partially. Semester Health is visible, but it is second, not the unmistakable hero.
- Visibly uses SemesterSnapshot: yes. Health dimensions, pressure, risk, class pulse, recommendations are connected.
- Apple-native: mostly. Large type, white cards, bottom tab are aligned, but card density is high.
- Premium: partially. Strong typography, but too many similarly-weighted surfaces.
- Emotionally motivating: partially. The user sees risk, but not enough "you improved your semester" feedback.
- Semester cockpit: emerging, not complete.
- Generic productivity app: still somewhat, because tasks and cards compete with semester health.

Scores:
- Intelligence: 8/10
- Clarity: 7/10
- Visual hierarchy: 6/10
- Emotional impact: 6/10
- Premium feel: 7/10

Highest leverage gaps:
- Semester Health must become the first dominant surface.
- Feedback events need a dedicated visible surface with before/after deltas.
- Recommendations should be more specific than "3 overdue".

## Classes

Evidence:
- Source: Classes uses `buildSemesterSnapshot(data).classPulses`.

Answers:
- Feels alive: partially. Cards are forecast-first, but no strong trend/next action hierarchy.
- Clearly communicates semester status: class-level only, not semester-level.
- Visibly uses SemesterSnapshot: yes.
- Apple-native: mostly.
- Premium: partially.
- Emotionally motivating: moderate. Forecast labels help, but "what to do next" is secondary.
- Semester cockpit: yes at class level.
- Generic productivity app: less than before, but due/exam/note pills still read like a dashboard.

Scores:
- Intelligence: 8/10
- Clarity: 7/10
- Visual hierarchy: 7/10
- Emotional impact: 6/10
- Premium feel: 7/10

Highest leverage gaps:
- Make forecast label the main artifact.
- Make risk/trend and next action clearer in one glance.
- Reduce decorative class color bars where status color should dominate.

## Plan

Evidence:
- Source: Plan uses `buildSemesterSnapshot`, pressure forecast, schedule plan, missed repair.

Answers:
- Feels alive: yes, but still reads like a monthly planner plus generated blocks.
- Clearly communicates semester status: partially through pressure label, not enough through why/recovery.
- Visibly uses SemesterSnapshot: yes.
- Apple-native: mostly.
- Premium: moderate.
- Emotionally motivating: moderate. Repairs exist, but feedback consequence is not visible enough.
- Semester cockpit: strong foundation.
- Generic productivity app: still somewhat because "Study blocks" list dominates.

Scores:
- Intelligence: 8/10
- Clarity: 7/10
- Visual hierarchy: 7/10
- Emotional impact: 6/10
- Premium feel: 7/10

Highest leverage gaps:
- Make "why this exists" explicit on every block.
- Show pressure clusters/recovery in plain language.
- Show plan changes as semester impact, not only schedule changes.

## Notes

Evidence:
- Source: Notes uses preparedness dimension; Note Detail links notes to Class Pulse.

Answers:
- Feels alive: partially. Notes feed readiness, but the connection is mostly textual.
- Clearly communicates semester status: only preparedness.
- Visibly uses SemesterSnapshot: yes.
- Apple-native: mostly.
- Premium: moderate.
- Emotionally motivating: moderate. "Notes feed exam readiness" is useful but not yet consequence-driven.
- Semester cockpit: yes, but needs stronger "this note changed preparedness" language.
- Generic productivity app: still slightly, because note cards look like note cards.

Scores:
- Intelligence: 8/10
- Clarity: 7/10
- Visual hierarchy: 7/10
- Emotional impact: 6/10
- Premium feel: 7/10

Highest leverage gaps:
- Surface preparedness score and weakest class/note effect more clearly.
- Make note actions show consequence: readiness, class pulse, exam risk.

## Study Sessions

Evidence:
- Source: Study Session completes blocks and appends feedback event.

Answers:
- Feels alive: partially. Completion updates data, but the session screen itself is not enough of a "semester improvement" moment.
- Clearly communicates semester status: no, session is local to the block.
- Visibly uses SemesterSnapshot: indirect only through feedback event after completion.
- Apple-native: acceptable.
- Premium: moderate.
- Emotionally motivating: weak. Active recall is useful, but the outcome is not shown before completion.
- Semester cockpit: partial.
- Generic productivity app: yes, still somewhat like a focus/task screen.

Scores:
- Intelligence: 7/10
- Clarity: 7/10
- Visual hierarchy: 7/10
- Emotional impact: 5/10
- Premium feel: 7/10

Highest leverage gaps:
- Show projected impact before completing the session.
- After completion, make the feedback message specific to preparedness/class forecast.

## Widgets

Evidence:
- Source: `src/widgetEngine.ts` uses `buildSemesterSnapshot`.
- Widget gallery/studio remains hidden.
- Deep link preserved: `studyplanner://today`.

Answers:
- Feels alive: yes at data level.
- Clearly communicates semester status: Week/Semester Health widget does.
- Visibly uses SemesterSnapshot: yes.
- Apple-native: partially. Snapshot content is useful, but Liquid Glass treatment is still mostly static theme background.
- Premium: moderate.
- Emotionally motivating: moderate.
- Semester cockpit: yes.
- Generic productivity app: less than app screens, but Next Due still resembles a task widget.

Scores:
- Intelligence: 8/10
- Clarity: 8/10
- Visual hierarchy: 7/10
- Emotional impact: 6/10
- Premium feel: 7/10

Highest leverage gaps:
- Make widget backgrounds state-aware and subtly glass-tinted.
- Make Semester Health widget the strongest widget.
- Make Next Action widget more coaching-oriented.

## Highest Leverage Polish Targets

1. Move Semester Health into the dominant Today hero.
2. Add a visible Feedback Loop surface with before/after deltas.
3. Make deterministic recommendations specific: exam timing, forecast impact, overload repair, missed block recovery.
4. Improve health dimension copy so scores feel understandable, not dashboard-like.
5. Make Class Pulse cards forecast-first with trend/risk/action hierarchy.
6. Improve Plan block explanation copy.
7. Strengthen Notes -> Preparedness -> Class Pulse connection.
8. Make WidgetKit snapshots more state-aware and liquid-glass in data style.
9. Preserve white/black app surfaces and semantic color only.
10. Keep all existing Build 42 architecture intact.
