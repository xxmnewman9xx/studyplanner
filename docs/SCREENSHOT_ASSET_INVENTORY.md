# Screenshot Asset Inventory

Folder: `artifacts/post-goal-aso-submission`

Status: partial proof captured on 2026-05-12. The folder now contains **28 raw simulator PNGs** plus a generated contact sheet. These are real simulator screenshots, but most are capture-mode synthetic states and are **not final App Store upload assets** until StoreKit, iPad, and App Store-size export proof are complete.

## Capture Summary

- Production/no-demo proof captured: `06-today-empty.png`.
- Capture-mode feature proof captured: onboarding, populated Today, Add School Stuff, Check New Work, assignment detail, Calendar, Week Plan, Classes, Widget Setup, theme customization, and paywall product-load failure.
- Native Home Screen widget proof captured: `30-small-widget-home-screen.png` and `31-medium-widget-home-screen.png` show installed WidgetKit small and medium widgets, refreshed from a current May 2026 capture snapshot.
- App icon/Home Screen proof captured: `40-app-icon-home-screen.png`.
- Accessibility proof captured: Today at `accessibility-extra-extra-large` content size after capping the most failure-prone shared display labels.
- Widget refresh proof captured: `46-widget-refresh-after-completion.png` shows installed widgets after completing Lab Report, with the small widget moved to Reading Reflection and the medium list reduced to the remaining week items.
- Widget refresh payload captured: `widget-refresh-after-completion-snapshot.json`.
- Widget edit refresh proof captured: `47-widget-refresh-after-edit.png` and `widget-refresh-after-edit-snapshot.json`.
- Contact sheet captured: `45-final-contact-sheet.png`, regenerated from 28 PNGs.
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
| 11-scan-paper.png | Missing | Requires camera/photo flow proof; not captured. |
| 12-upload-file.png | Missing | Requires document picker/upload proof; not captured. |
| 13-manual-add.png | Missing | No direct capture state was available. |
| 14-parser-processing.png | Missing | Parser loading state was not safely captured. |
| 15-found-work-summary.png | Captured | Capture-mode import summary, 1179x2556 PNG. |
| 16-check-new-work-needs-check.png | Captured | Capture-mode review flow, 1179x2556 PNG. |
| 17-check-new-work-edit-item.png | Missing | Edit-item expanded state was not captured. |
| 18-check-new-work-duplicate.png | Missing | Duplicate import state was not captured. |
| 19-check-new-work-imported.png | Missing | Imported/success state was not captured. |
| 20-assignment-detail.png | Captured | Capture-mode assignment detail, 1179x2556 PNG. |
| 21-calendar-month.png | Captured | Capture-mode Calendar overview, 1179x2556 PNG. |
| 22-calendar-day-detail.png | Captured | Capture-mode Calendar scrolled/detail state, 1179x2556 PNG. |
| 23-calendar-filtered-class.png | Missing | Filtered class state not captured. |
| 24-week-plan.png | Captured | Capture-mode Week Plan, 1179x2556 PNG. |
| 25-busy-week.png | Captured | Capture-mode Busy Week evidence, 1179x2556 PNG. |
| 26-classes-list.png | Captured | Capture-mode classes list, 1179x2556 PNG. |
| 27-class-detail.png | Captured | Capture-mode class detail/lower scroll, 1179x2556 PNG. |
| 28-reminders.png | Missing | Reminder permission/schedule flow not captured. |
| 29-widget-setup.png | Captured | Capture-mode Widget Setup in-app preview, 1179x2556 PNG. Not native Home Screen proof. |
| 30-small-widget-home-screen.png | Captured | Real simulator Home Screen with installed WidgetKit small widget, 1179x2556 PNG. The widget shows current capture dates, not stale overdue demo data. |
| 31-medium-widget-home-screen.png | Captured | Real simulator Home Screen with installed WidgetKit medium widget, 1179x2556 PNG. The widget shows current capture dates, not stale overdue demo data. |
| 32-widget-empty-state.png | Missing | Native/widget empty state not captured. |
| 33-widget-needs-check-state.png | Missing | Native/widget needs-check state not captured. |
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
| 44-accessibility-large-text.png | Captured | Real simulator Today screen at `accessibility-extra-extra-large`, 1179x2556 PNG. It proves the top hierarchy no longer catastrophically explodes, but full Dynamic Type/VoiceOver audit remains open. |
| 45-final-contact-sheet.png | Captured | Generated from the 28 current PNGs, 1090x4302 PNG. |
| 46-widget-refresh-after-completion.png | Captured | Real simulator Home Screen after tapping Complete in the app. Small and medium widgets reflect the refreshed snapshot. |
| 47-widget-refresh-after-edit.png | Captured | Real simulator Home Screen after editing Reading Reflection to Reflection Draft. Small and medium widgets reflect the edited title. |

## Excluded Assets

- Any old asset with Lock Screen widget claims.
- In-app previews as the only native Home Screen widget proof.
- App preview videos.
- Demo/capture state as production proof.
- A products-loaded paywall screenshot until StoreKit products actually load.
