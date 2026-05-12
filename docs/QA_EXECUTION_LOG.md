# QA Execution Log

## Baseline

- Branch: `v1-1-widget-command-center`
- Starting commit: `3cd2663f75803dcd3ba86acaeacabc0e214597a5`
- Working tree at start included pre-existing untracked docs/artifacts; they were not treated as baseline regressions.
- `git fetch origin v1-1-widget-command-center`: passed.
- `git pull --ff-only origin v1-1-widget-command-center`: passed, already up to date.
- `npx gitnexus analyze`: passed, 2,108 nodes, 4,011 edges, 56 clusters, 182 flows.

## Commands Run

| Command | Result |
| --- | --- |
| `npx expo install --check` | Passed, dependencies are up to date. |
| `npm run typecheck` | Passed. |
| `npm run test` | Passed after expectation updates; 20/20 tests passing. |
| `npm run check:iap` | Passed. |
| `npm run verify:production` | Passed. |
| `npx expo run:ios --device 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE` | Passed, build/install/launch succeeded. |
| `EXPO_PUBLIC_STORE_CAPTURE=1 ./scripts/verify-ios-widgetkit.sh` | Passed, capture payload included preview demo marker and accepted widget data. |
| `EXPO_PUBLIC_STORE_CAPTURE=0 ./scripts/verify-ios-widgetkit.sh` | Passed, production payload had no demo marker and no demo assignments. |

## Test Results

- Tests passed: 20.
- Tests failed: 0 in final run.
- New coverage: confirmed-boundary assignment behavior and local parser heavy-syllabus review limit.

## Simulator

- Name: StudyPlanner-Codex-iPhone
- UDID: `6CBE6A7A-1778-406F-9F5B-3FDAA45310CE`

## Notes

- Expo run commands keep Metro open after successful launch, so processes were stopped after screenshots and payload verification completed.
- The SafeAreaView development warning was suppressed for screenshot readability; the underlying migration to `react-native-safe-area-context` remains a polish task.
