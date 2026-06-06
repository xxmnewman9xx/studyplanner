# Build 42 Coach Voice Report

Date: 2026-06-05

Build: 42

No build-number change. No Build 43. No TestFlight submission.

## Surfaces Reviewed

- Semester Health
- Health dimensions
- What Matters Now
- Next Action
- Class Pulse
- Grade Forecast
- Pressure Forecast
- Plan Autopilot
- Study Sessions
- Feedback Events
- Notifications
- Widget snapshots
- Reminder copy
- Notes intelligence
- Scan/import copy

## Implementation Summary

Changed copy only:

- `src/intelligence.ts`
- `src/widgetEngine.ts`
- `src/storage.ts`
- `src/ai.ts`
- `App.tsx`
- `scripts/check-build42-living-semester.mjs`

The script update only accepts the shortened "Autopilot" label in addition to the old "Semester autopilot" wording.

## Copy Reductions

Representative reductions:

- "Upcoming exams are mapped; add notes or complete review blocks to raise preparedness." -> "Add notes or review."
- "Estimated from completion, deadlines, notes, and study behavior." -> "Estimated."
- "Add your current grade for a tighter forecast." -> "Add grade."
- "One active-recall pass tonight protects your forecast." -> "One recall pass tonight."
- "Study blocks are generated from due dates, workload estimates, exam proximity, scanned notes, and unfinished work." -> "Plan is balanced."
- "Completing this block strengthens Preparedness..." -> "BIO 101 preparedness. B- forecast."

## Verification

Passed:

- `npm run typecheck`
- `npm run test:intelligence`
- `npm run test:semester`
- `npm run check:build42`

One exploratory `tsx` command that imported `widgetEngine` directly failed because it pulled React Native into Node. That was not part of the required verification path and did not affect product code.

## Estimated Impact

Premium Feel:

- Before: 8.6/10
- After: 9.0/10

Apple-Native Feel:

- Before: 8.4/10
- After: 8.9/10

The app now sounds less like an AI productivity app and more like a compact semester coach.

## Remaining Weak Copy Areas

1. Some paywall copy is still more App Store/product-oriented than Apple-native.
2. A few parser-generated note summaries can still be long because they come from source text.
3. Review Import metadata remains technical in places, but it is useful for trust.
4. "Preparedness" is still a product term; it works, but "Ready" may feel more Apple-native in a future visual pass.

## Final Scores

- Coach Voice: 9.1/10
- Premium Feel: 9.0/10
- Apple-Native Feel: 8.9/10
- Emotional Impact: 8.9/10

## Release Note

This pass improves how Build 42 feels, but it does not change the prior TestFlight recommendation by itself. The remaining RC blockers from the previous report still need physical widget placement, paste/review simulator validation, and notification permission/delivery validation.

