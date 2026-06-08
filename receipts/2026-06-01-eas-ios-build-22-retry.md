# StudyPlanner EAS iOS Build 22 Retry Receipt

- Time: 2026-06-01 09:00 America/New_York / 13:00 UTC
- Goal: retry StudyPlanner 1.0.2 build 22 TestFlight push after Expo iOS quota reset
- Workspace: /Users/mattnewman/work/StudyPlanner
- Branch: main
- Latest commit at start: 09ae355 Prepare final TestFlight candidate
- Git cleanliness at start: dirty before this run; existing modified/untracked files were preserved
- EAS auth check: `npx eas whoami` succeeded as `xxmnewman9xx` / `xxmnewman9xx@gmail.com`
- QA command: `npm run qa:release`
- Result: failed before build/submit
- Failure point: `npm run test:customization`
- Error: `Studio should stay preview-first and explain recommendations, secondary accent states, lock, and watch customization surfaces.`
- Build command NOT run: `npx eas build --platform ios --profile production --auto-submit --non-interactive`
- Reason build was skipped: release QA did not pass
- Secrets/tokens: none exposed

## Recommended next safe step
Inspect the current changes around `src/customization.ts`, `src/widgets/widgetThemes.ts`, and `scripts/check-customization-studio.ts`, then repair the customization contract or content mismatch and rerun `npm run qa:release` before attempting EAS build 22 again.
