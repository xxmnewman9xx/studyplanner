# Post-Goal QA Execution Log

| Command/test | Result | Evidence | Notes |
| --- | --- | --- | --- |
| git fetch origin | Passed | exit 0 | Remote fetched |
| git pull --ff-only origin v1-2-goal-9-2-root-concept-transformation | Failed | remote ref not found | Non-blocking; local v1-2 used |
| npx gitnexus analyze | Passed | 2,495 nodes, 4,690 edges, 72 clusters, 213 flows | Baseline architecture index |
| npx expo install --check | Passed | Dependencies up to date | Baseline |
| npm run typecheck | Passed | exit 0 | Re-run after fixes |
| npm run test | Passed | 32/32 | Added import trust, production config, DST, course-name, side-effect due-date tests |
| npm run check:iap | Passed | IAP and premium gate configuration passed | Static only |
| npm run verify:production | Passed | Production config verification passed | Normal mode |
| STUDYPLANNER_SUBMISSION_VERIFY=1 npm run verify:production | Failed as intended | Missing monthly product ID | Submission guard works; provide env/support URL before submit |
| xcrun simctl launch/openurl/screenshot | Partial | Captured `artifacts/post-goal-aso-submission/06-today-empty.png` | Installed app did not respond to capture deep link; screenshot is real production empty Today state |

Unrun/blocked: simulator screenshot pass, WidgetKit rerun, StoreKit sandbox, native widget Home Screen placement screenshots.
