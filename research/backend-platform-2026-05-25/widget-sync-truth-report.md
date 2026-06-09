# Widget Sync Truth Report

Implemented reliability fixes:

- Native snapshots filter leftover `demo-*` assignment/source IDs when `demoMode` is false.
- Empty/setup states are covered for no classes, class-only setup, applied import with no homework, needs-review-only data, clean future-work days, and urgent overdue work.
- Sync-off now writes a private `sync_disabled` snapshot in native iOS builds when the widget module is available.

Known limits:

- Widget timelines are compact one-entry snapshots.
- Day-boundary urgency can become stale until the app opens or state changes.
- Non-iOS builds cannot update WidgetKit.
- Advanced Widget Studio presets remain in-app previews unless a future native widget kind is added.

Tests:

- `npm run test:widgets` covers demo filtering, empty/setup/clean/urgent states, privacy redaction, and native preview source checks.
