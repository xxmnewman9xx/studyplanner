# Functionality Button Swarm QA

## Baseline

| Command | Result |
| --- | --- |
| `npm run typecheck` | Passed before edits |
| `npm run verify:production` | Passed before edits |
| `npm run test` | Failed before edits on widget plugin/native Swift mismatch |

## Post-fix Required Runs

| Command | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run test` | Passed, 55/55 |
| `npm run check:iap` | Passed |
| `npm run verify:production` | Passed |
| `npm run audit:storekit` | Passed with expected external sandbox-proof warning |
| `EXPO_PUBLIC_STORE_CAPTURE=1 ./scripts/verify-ios-widgetkit.sh` | Passed build/launch/shared-payload check; payload includes capture demo state and course colors |
| `EXPO_PUBLIC_STORE_CAPTURE=0 ./scripts/verify-ios-widgetkit.sh` | Passed build/launch/shared-payload check; payload has no `demoState` flag |

## Screenshot Proof

Folder: `artifacts/functionality-button-swarm-proof`

- `01-today-buttons-fixed.png`
- `02-scan-actions-fixed.png`
- `03-found-work-actions-fixed.png`
- `04-calendar-actions-fixed.png`
- `05-classes-actions-fixed.png`
- `06-widget-studio-controls-fixed.png`
- `07-widget-theme-preview-fixed.png`
- `08-theme-contrast-light.png`
- `09-theme-contrast-dark.png`
- `10-paywall-actions-fixed.png`

## Manual QA Checklist

- Open every bottom tab.
- Today: Add, Focus, Done, Remind Me, Add to Calendar.
- Import: Upload, Type It In, Find Work, Approve Shown, Edit First, Looks good, Remove, Add to Planner.
- Calendar: month arrows, week strip, class filters, day cells, assignment rows.
- Week: day strip and assignment rows.
- Classes: Add class, class color, Add to Planner, class assignment done.
- Widget Setup: size, focus, style, palette color, Plus plan link.
- Settings/Paywall: restore, purchase unavailable states, legal/privacy/support links.
- Light/dark mode and large text spot checks.

Manual Home Screen widget placement and StoreKit sandbox purchase/restore remain external proof items before final App Store submission.
