# Semester Pulse Product Contract

## Definition

**Semester Pulse** is the live control state for StudyPlanner: Syllabus AI.

It answers:

- Where do I stand?
- What matters next?
- Am I on track?
- What action improves the semester?

Semester Pulse is not a theme, streak, or decorative score. It is the shared object that connects Home, Forecast, Scan, Review Inbox, Classes, Focus, Notes, Widgets, Watch, Studio, and Paywall.

## Inputs

Pulse uses only product-supported signals:

- completed assignments
- overdue assignments
- due-soon assignments
- upcoming exams
- workload pressure by day
- focus consistency and completed focus minutes
- review inbox confidence
- class-level open work and risk
- semester progress
- widget and Watch engagement when local memory exists

## Scoring

Score is a 0-100 health score.

Base score starts near "On Track" and moves from real semester conditions:

- progress completion raises score
- focus completion raises score
- reviewing imports raises score by improving trust
- overdue work lowers score sharply
- clustered due dates lower score
- exam pressure lowers score
- heavy days lower score
- unresolved review items lower score

The score must never imply academic grade prediction. It is a planning health score.

## Statuses

- **Ahead**: high score, no urgent cluster, user has buffer.
- **On Track**: healthy score with manageable upcoming work.
- **Building**: work or review load is forming but still easy to correct.
- **Heavy**: workload pressure is high and needs protected time.
- **At Risk**: overdue work, near exams, or high pressure threatens the week.
- **Recovery**: the student has cleared a load or has no active schoolwork.

## Required Display Fields

Every prominent Pulse display should include:

- score
- status
- trend
- top reason
- next action

Example:

Semester Pulse 82
On Track
+6 this week
Start Chemistry tonight.
Thursday is overloaded.

## Forecast States

Forecast translates Pulse pressure into weather-like states:

- **Calm**: low pressure, no urgent cluster.
- **Building**: pressure is forming.
- **Heavy**: multiple heavy signals require action.
- **Peak**: the semester has a near-term overloaded point.
- **Recovery**: cleared, low pressure, or post-heavy week.

Forecast must show:

- peak week/day
- top risk
- free time or breathing-room signal
- exam pressure
- recommended action

## Appearance

Pulse should feel like a native Apple score object:

- white-first on app surfaces
- strong black typography
- color only for meaning
- large score
- short status
- compact bars or ring
- one action

It should not become a dense analytics dashboard.

## How It Improves

After more usage, Pulse improves through local memory:

- focus durations tune recommendations
- completed top actions shape Home ranking
- forecast snapshots create trend
- saved widgets inform Widget Studio recommendations
- notes linked to classes improve class context
- Watch signals learn whether glance actions become focus starts

## Screen Contract

Every major screen must answer: **How does this affect Semester Pulse?**

- Scan creates the semester input.
- Review Inbox verifies Pulse trust.
- Home protects the Pulse.
- Forecast predicts Pulse pressure.
- Focus improves Pulse through real study time.
- Classes explains class-level Pulse risk.
- Notes support class progress and study context.
- Widgets broadcast Pulse.
- Apple Watch glances Pulse.
- Studio personalizes Pulse surfaces.
- Paywall sells advanced Pulse value.

## Guardrails

- Do not call Pulse a grade.
- Do not overclaim AI certainty.
- Do not show unreviewed imports as trusted widget data.
- Do not add fake chat or decorative personalization.
- Do not create new tabs.
- Do not hide the next action behind a card pile.
