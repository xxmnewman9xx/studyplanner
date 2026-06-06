# Build 52 Locked Funnel UX Report

## Allowed Without Entitlement

- welcome
- onboarding
- scan preview
- paste preview
- review preview
- locked dashboard shell
- paywall
- restore
- terms/privacy/support

## Locked Dashboard

Shows:

- `0 / locked`
- no active schedule
- no dashboard data
- no reminders
- CTA: Scan syllabus
- CTA: Unlock StudyPlanner

## Import Preview

Import preview can show parsed value and review rows, but apply routes to paywall if `data.prefs.premium` is false. Because screen data is sanitized unless entitlement is active, stale local premium cannot flip this branch.

## Widgets

Locked widget sync receives empty planner data with zero progress and no items.

