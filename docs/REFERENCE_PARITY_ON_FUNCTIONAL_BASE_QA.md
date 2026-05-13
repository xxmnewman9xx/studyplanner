# Reference Parity On Functional Base QA

## Required Commands

| Command | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run test` | Passed, 62 tests |
| `npm run check:iap` | Passed |
| `npm run verify:production` | Passed |
| `npm run audit:storekit` | Passed with expected external sandbox proof warning |
| `EXPO_PUBLIC_STORE_CAPTURE=1 ./scripts/verify-ios-widgetkit.sh` | Passed; capture snapshot includes `demoState` and review queue count |
| `EXPO_PUBLIC_STORE_CAPTURE=0 ./scripts/verify-ios-widgetkit.sh` | Passed; production snapshot uses persisted planner data and no `demoState` |

## Manual QA

- Today: screenshot proof confirms Scan entry, Focus card, Done action surface, reminder/calendar busy states, and Found Work review queue.
- Scan: screenshot proof confirms Scan Anything primary state and paper-scan unavailable explanation.
- Found Work: screenshot proof confirms persisted review inbox copy and Add to Planner review surface; automated tests cover accepted-only promotion and remaining inbox persistence.
- Planner sync: accepted work feeds Today, Calendar, Week, Classes, and widget snapshots; unreviewed found work remains a review count instead of confirmed planner data.
- Assignment edit/archive/done: automated tests cover stale app-owned reminder/calendar ID clearing; runtime cleanup attempts cancellation/deletion without blocking the edit.
- Widget Studio: screenshot proof confirms supported Small Next Due and Medium This Week previews, visual style cards, palette dots, and saved preferences.
- Theme/contrast: screenshot proof covers light Today, dark Today, light Widget Studio, dark Widget Studio, widget due labels, and course glyph readability; automated tests cover palette/style widget contrast.
- iPad: raw iPad screenshot captured for wide layout proof.

## Known External Proof

- StoreKit sandbox purchase/restore proof remains manual and external.
- Installed Home Screen widget refresh proof remains manual even when WidgetKit build/shared payload checks pass.
