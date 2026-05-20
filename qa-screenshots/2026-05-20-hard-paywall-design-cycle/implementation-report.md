# Implementation Report

## What changed
- Added a hard paywall immediately after onboarding for non-Plus users.
- Rebuilt `UpgradeScreen` into a premium conversion surface with value tiles, widget preview, clearer pricing hierarchy, restore/legal actions, and trust language.
- Improved onboarding progression so the first CTA advances through the value story before asking users to scan.
- Upgraded Widget Studio hero and template readability.
- Removed avoidable one-line/two-line clipping from Today, Plan, and Widget Studio copy surfaces.
- Strengthened button text behavior for long CTAs.

## What stayed safe
- No IAP product IDs changed.
- No planner data models changed.
- No widget bundle IDs changed.
- No syllabus parser/planner logic was weakened.
- Restore purchase and legal links remain available.
- Free plan remains App Review-safe and useful, with a clear limited-free continuation path.

## Validation
- `npm run lint` passed.
- `npm test` / `npm run qa:release` passed.
- `npx expo-doctor` passed.
- `git diff --check` passed.
- Native arm64 iOS simulator build passed.
- Real simulator screenshots captured for first launch, hard paywall, Scan/import, Today, Plan, Classes, Widget Studio, and Plus.

## Screenshots captured
- `after/01-first-launch-onboarding.png`
- `after/04-hard-paywall.png`
- `after/tab-import.png`
- `after/tab-today.png`
- `after/tab-plan.png`
- `after/tab-courses.png`
- `after/tab-widget-studio.png`
- `after/tab-upgrade.png`
