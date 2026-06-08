# Build 52 Locked Experience Doctrine

## Rule

No entitlement plus no applied semester means the product is in Build Your Semester mode.

It must not show:

- fake Semester Health score
- fake Workload, Grades, Preparedness, or Consistency values
- real Today, Plan, Classes, Notes, Reminders, Widgets, or Profile routes
- unlocked tab UX
- scheduled reminders
- populated widgets
- persisted active semester

It may show:

- personalized greeting
- syllabus import options
- locked feature previews
- import preview summaries
- paywall CTA
- restore, terms, privacy, and support

## Product Sentence

Use: "Build your semester."

Do not use: "Here is your dashboard."

## Implementation

- `LockedDashboard` is now a locked home, not a dashboard.
- Semester Health is a locked preview card. No ring, no score, no fake numeric dimensions.
- Pending import preview can show real found counts: classes, assignments, exams, pressure, and a sample next move.
- Applying a preview requires active StoreKit entitlement.
- Widgets in locked mode remain empty, progress `0`, and copy says locked/unlock.

