# Screenshot Asset Inventory

Folder: `artifacts/post-goal-aso-submission`

Status: partial proof captured on 2026-05-12. The folder now contains **43 raw simulator PNGs** plus a generated contact sheet. These are real simulator screenshots, but most are capture-mode synthetic states and are **not final App Store upload assets** until StoreKit, iPad, and App Store-size export proof are complete.

## Capture Summary

- Production/no-demo proof captured: `06-today-empty.png`.
- Capture-mode feature proof captured: onboarding, populated Today, Add School Stuff, scan-paper unavailable state, upload-file state, parser-processing state, Check New Work, Check Work edit item, duplicate-found-work state, imported-found-work state, Manual Add, assignment detail, Calendar, filtered Calendar, Week Plan, Classes, Widget Setup, theme customization, and paywall product-load failure.
- Native Home Screen widget proof captured: `30-small-widget-home-screen.png` and `31-medium-widget-home-screen.png` show installed WidgetKit small and medium widgets, refreshed from a current May 2026 capture snapshot.
- Native Home Screen widget edge-state proof captured: `32-widget-empty-state.png` and `33-widget-needs-check-state.png`, with App Group payload proof in `widget-empty-state-snapshot.json` and `widget-needs-check-state-snapshot.json`.
- App icon/Home Screen proof captured: `40-app-icon-home-screen.png`.
- Accessibility proof captured: Today plus Check Work, Assignment Detail, Widget Setup, and Paywall at `accessibility-extra-extra-large` content size after capping high-risk display/action labels.
- Widget refresh proof captured: `46-widget-refresh-after-completion.png` shows installed widgets after completing Lab Report, with the small widget moved to Reading Reflection and the medium list reduced to the remaining week items.
- Widget refresh payload captured: `widget-refresh-after-completion-snapshot.json`.
- Widget edit refresh proof captured: `47-widget-refresh-after-edit.png` and `widget-refresh-after-edit-snapshot.json`.
- Widget add refresh proof captured: `48-widget-refresh-after-add.png` and `widget-refresh-after-add-snapshot.json`.
- Contact sheet captured: `45-final-contact-sheet.png`, regenerated from 43 PNGs.
- Paywall products-loaded proof is still missing. The captured paywall state shows purchases unavailable and is correctly stored as `38-paywall-product-load-failure.png`.

| Required PNG | Status | Notes |
| --- | --- | --- |
| 00-contact-sheet-before.png | Missing | No fresh before contact sheet was captured for this v1-3 branch. |
| 01-onboarding-welcome.png | Captured | Capture-mode simulator UI, 1179x2556 PNG. |
| 02-onboarding-syllabus-to-plan.png | Captured | Capture-mode simulator UI, 1179x2556 PNG. |
| 03-onboarding-check-found-work.png | Captured | Capture-mode simulator UI, 1179x2556 PNG. |
| 04-onboarding-widgets.png | Captured | Capture-mode simulator UI, 1179x2556 PNG. |
| 05-onboarding-first-action.png | Captured with caveat | Capture-mode simulator UI, 1179x2556 PNG. Current capture shows the final style/palette step; a cleaner first-action button close-up is still useful for App Store-ready assets. |
| 06-today-empty.png | Captured | Real simulator production empty Today state, 1179x2556 PNG. Not App Store-size exported yet. |
| 07-today-populated.png | Captured | Capture-mode simulator UI with safe synthetic assignments, 1179x2556 PNG. |
| 08-today-overdue.png | Missing | Current capture seed has no overdue state; do not fabricate one. |
| 09-today-needs-check.png | Captured | Capture-mode Today scrolled to needs-check warning, 1179x2556 PNG. |
| 10-add-school-stuff.png | Captured | Capture-mode Check Work/Add School Stuff entry state, 1179x2556 PNG. |
| 11-scan-paper.png | Captured | Capture-mode import state, 1179x2556 PNG. It honestly shows Camera/Photo disabled when photo parsing is not configured. |
| 12-upload-file.png | Captured | Capture-mode upload-file state, 1179x2556 PNG. It explains text-based PDF/plain text upload and the review boundary. |
| 13-manual-add.png | Captured | Capture-mode manual Add Work state, 1179x2556 PNG. It shows a filled Field Notes assignment and enabled Add to Planner action using safe synthetic data. |
| 14-parser-processing.png | Captured | Capture-mode parser-processing state, 1179x2556 PNG. It shows loading while stating that parsed work remains untrusted until review finishes. |
| 15-found-work-summary.png | Captured | Capture-mode import summary, 1179x2556 PNG. |
| 16-check-new-work-needs-check.png | Captured | Capture-mode review flow, 1179x2556 PNG. |
| 17-check-new-work-edit-item.png | Captured | Capture-mode Check Work expanded edit panel for Problem Set 4, 1179x2556 PNG. It shows source evidence plus editable title/date/type controls before planner import. |
| 18-check-new-work-duplicate.png | Captured | Capture-mode duplicate-found-work state, 1179x2556 PNG. It flags repeated-looking work without auto-confirming it. |
| 19-check-new-work-imported.png | Captured | Capture-mode imported-found-work state, 1179x2556 PNG. It shows checked work ready for planner surfaces. |
| 20-assignment-detail.png | Captured | Capture-mode assignment detail, 1179x2556 PNG. |
| 21-calendar-month.png | Captured | Capture-mode Calendar overview, 1179x2556 PNG. |
| 22-calendar-day-detail.png | Captured | Capture-mode Calendar scrolled/detail state, 1179x2556 PNG. |
| 23-calendar-filtered-class.png | Captured | Capture-mode Calendar with Chemistry 101 filter selected, 1179x2556 PNG. It shows class-specific dots and agenda context from real planner data. |
| 24-week-plan.png | Captured | Capture-mode Week Plan, 1179x2556 PNG. |
| 25-busy-week.png | Captured | Capture-mode Busy Week evidence, 1179x2556 PNG. |
| 26-classes-list.png | Captured | Capture-mode classes list, 1179x2556 PNG. |
| 27-class-detail.png | Captured | Capture-mode class detail/lower scroll, 1179x2556 PNG. |
| 28-reminders.png | Missing | Reminder permission/schedule flow not captured. |
| 29-widget-setup.png | Captured | Capture-mode Widget Setup in-app preview, 1179x2556 PNG. Not native Home Screen proof. |
| 30-small-widget-home-screen.png | Captured | Real simulator Home Screen with installed WidgetKit small widget, 1179x2556 PNG. The widget shows current capture dates, not stale overdue demo data. |
| 31-medium-widget-home-screen.png | Captured | Real simulator Home Screen with installed WidgetKit medium widget, 1179x2556 PNG. The widget shows current capture dates, not stale overdue demo data. |
| 32-widget-empty-state.png | Captured | Real simulator Home Screen with installed WidgetKit widgets in empty state, 1179x2556 PNG. Payload proof shows no next due, no weekly items, and emptyState true. |
| 33-widget-needs-check-state.png | Captured | Real simulator Home Screen with installed WidgetKit widgets in needs-check state, 1179x2556 PNG. Payload proof shows accepted Lab Report as next due plus reviewQueueCount 3. |
| 34-theme-customization.png | Captured | Capture-mode Widget Setup/theme preview, 1179x2556 PNG. |
| 35-class-color-customization.png | Captured | Capture-mode widget color/style controls, 1179x2556 PNG. |
| 36-settings.png | Missing | Settings screen not captured. |
| 37-paywall-products-loaded.png | Missing | StoreKit products were not loaded; do not claim this state. |
| 38-paywall-product-load-failure.png | Captured | Real simulator paywall failure state: "Purchases are unavailable", 1179x2556 PNG. |
| 39-restore-purchases.png | Missing | Restore flow not captured or sandbox-proven. |
| 40-app-icon-home-screen.png | Captured | Real simulator Home Screen showing installed StudyPlanner app icons/widgets, 1179x2556 PNG. |
| 41-no-data-app-review-state.png | Missing | Production no-data Today is captured as `06-today-empty.png`; separate App Review state not captured. |
| 42-sample-plan-state.png | Missing | Sample plan entry/state not separately captured. |
| 43-localized-ui-example.png | Missing | UI localization proof not captured. |
| 44-accessibility-large-text.png | Captured | Real simulator Today screen at `accessibility-extra-extra-large`, 1179x2556 PNG. It proves the top hierarchy no longer catastrophically explodes, but full VoiceOver/contrast audit remains open. |
| 45-final-contact-sheet.png | Captured | Generated from the 43 current raw PNGs, 1230x7305 PNG. |
| 46-widget-refresh-after-completion.png | Captured | Real simulator Home Screen after tapping Complete in the app. Small and medium widgets reflect the refreshed snapshot. |
| 47-widget-refresh-after-edit.png | Captured | Real simulator Home Screen after editing Reading Reflection to Reflection Draft. Small and medium widgets reflect the edited title. |
| 48-widget-refresh-after-add.png | Captured | Real simulator Home Screen after adding Field Notes to Science Lab. Small and medium widgets reflect the added assignment from the App Group snapshot. |
| 49-accessibility-check-work-large-text.png | Captured | Real simulator Check Work screen at `accessibility-extra-extra-large`, 1179x2556 PNG. It proves Add School Stuff and Needs Check remain legible with large type; deeper review-row VoiceOver traversal remains open. |
| 50-accessibility-assignment-detail-large-text.png | Captured | Real simulator Assignment Detail at `accessibility-extra-extra-large`, 1179x2556 PNG. Title/date/time/course controls remain legible; full edit/save VoiceOver traversal remains open. |
| 51-accessibility-widget-setup-large-text.png | Captured | Real simulator Widget Setup at `accessibility-extra-extra-large`, 1179x2556 PNG. Supported size/focus controls remain legible; native widget VoiceOver proof remains open. |
| 52-accessibility-paywall-large-text.png | Captured | Real simulator Paywall at `accessibility-extra-extra-large`, 1179x2556 PNG. The paywall remains readable in product-load-failure mode; products-loaded StoreKit proof remains missing. |

## Excluded Assets

- Any old asset with Lock Screen widget claims.
- In-app previews as the only native Home Screen widget proof.
- App preview videos.
- Demo/capture state as production proof.
- A products-loaded paywall screenshot until StoreKit products actually load.
