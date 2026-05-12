# Final Post-Goal ASO Submission Readiness

This is an interim readiness report, not a submit approval.

## Score

Initial v1-3 post-goal score: 7.82/10.  
Current evidence-adjusted score after fixes/docs/screenshots/accessibility/date/widget/reminder/settings quick wins: 9.07/10.
Target: 9.4/10.  
Verdict: not reached.

## Fixed in this pass

- Parser semester metadata is no longer trusted into planner state.
- Date-key day counts are stable across DST boundaries.
- Assignment course names refresh from selected class after moves/renames.
- Submission-mode production verification fails without explicit monthly/yearly/lifetime IDs and support URL.
- AI parse contract now matches multipart code.
- App Store metadata draft now respects 30-character subtitle and 100-byte keyword constraints.
- ASO, localization, screenshot, App Review, and handoff docs now mark real blockers.
- A real simulator production empty Today screenshot was captured at artifacts/post-goal-aso-submission/06-today-empty.png.
- Parser grade items no longer enter the planner without a review surface.
- Reminder and calendar side effects now skip invalid legacy due dates.
- Capture-mode iOS build now responds to screenshot deep links.
- 45 raw simulator PNGs were captured in `artifacts/post-goal-aso-submission`.
- Manual Add and Check Work edit-item proof are now captured as `13-manual-add.png` and `17-check-new-work-edit-item.png`.
- Filtered Calendar proof is now captured as `23-calendar-filtered-class.png`, showing the Chemistry 101 course filter narrowing the calendar view.
- Import-path proof is now captured as `11-scan-paper.png`, `12-upload-file.png`, `14-parser-processing.png`, `18-check-new-work-duplicate.png`, and `19-check-new-work-imported.png`; the scan-paper state is honest about photo parsing being unavailable without a configured endpoint.
- Reminders proof is now captured as `28-reminders.png`; Today exposes real Queue Reminders and Sync Calendar actions without claiming notification permission success.
- Settings proof is now captured as `36-settings.png`; the screen surfaces planner status, appearance, Plus/store status, restore access, widget scope, privacy link, and the unresolved support URL requirement.
- A generated contact sheet was captured at `artifacts/post-goal-aso-submission/45-final-contact-sheet.png`.
- Paywall failure proof was captured honestly as `38-paywall-product-load-failure.png`; products-loaded proof remains missing.
- A targeted Dynamic Type fix keeps the Today hero, metrics, warning card, and dock readable at `accessibility-extra-extra-large`; proof captured as `44-accessibility-large-text.png`.
- Month calendar planning now respects locale week-start rules with tests for Sunday, Monday, and Saturday-start regions.
- Due-date and Week Plan date labels now use the preferred locale, with 24-hour formatting tests for `fr-FR` and `en-GB`.
- Check Work, Assignment Detail, Widget Setup, Paywall, and shared buttons now use bounded text scaling plus clearer labels/hints; large-text proof is captured as `49-accessibility-check-work-large-text.png` through `52-accessibility-paywall-large-text.png`.
- Visual planner surfaces now expose VoiceOver labels for task rows, completion buttons, WeekStrip days, workload bars, calendar mini-days, workload forecasts, class balance rows, and completion cards; the source-regression test passes in the current 40/40 suite.
- Capture/demo coursework dates now roll relative to the capture day so native WidgetKit screenshots do not age into false overdue states.
- Installed native small and medium Home Screen widget screenshots are captured as `30-small-widget-home-screen.png` and `31-medium-widget-home-screen.png`; both show current May 2026 due labels.
- Native widget empty and needs-check states are captured as `32-widget-empty-state.png` and `33-widget-needs-check-state.png`; App Group payloads show the empty state has no due items, while the needs-check state has accepted Lab Report as next due plus reviewQueueCount 3.
- App icon/Home Screen proof is captured as `40-app-icon-home-screen.png`.
- Widget refresh after completion is captured as `46-widget-refresh-after-completion.png`; the App Group payload in `widget-refresh-after-completion-snapshot.json` shows next due moved to Reading Reflection, This Week dropped to 4, monthly due dropped to 7, and completed count rose to 4.
- Widget refresh after edit is captured as `47-widget-refresh-after-edit.png`; the App Group payload in `widget-refresh-after-edit-snapshot.json` shows the edited title Reflection Draft in both small and medium widget data.
- Widget refresh after add is captured as `48-widget-refresh-after-add.png`; the App Group payload in `widget-refresh-after-add-snapshot.json` shows the added Field Notes assignment as next due, due Tomorrow, with This Week and monthly due counts updated to 1.
- Widget day-boundary behavior is code/build proven: render-time due label/urgency plus 00:01 timeline refresh are guarded by `tests/widgetPlugin.test.ts`; `npm run test` passed 40/40 and the iOS simulator build compiled the WidgetKit extension.

## Still blocking 9.4

StoreKit proof, products-loaded paywall proof, support URL, remaining screenshots, iPad screenshot strategy, localized review, signed archive entitlement check, full simulator VoiceOver/contrast traversal, and final simulator QA.

The capture-mode rebuild solved the original deep-link capture problem, installed small/medium WidgetKit screenshots now exist, app icon proof exists, native widget empty/needs-check states exist, reminders proof exists, settings proof exists, completion/edit/add refresh is proven, day-boundary behavior is code/build proven, core action large-text proof now exists, and Manual Add/Edit Item/filtered Calendar/import-path capture states are now real. The screenshot set is still not App Store-ready. Missing proof includes restore purchase success/sandbox proof, localized UI screenshots/string extraction, full simulator VoiceOver/contrast coverage, iPad sizing, and StoreKit products loaded.

## Next prompt

Run final App Store Connect validation for StudyPlanner on branch v1-3-post-goal-aso-submission-master: provide real support URL and IAP env IDs, run StoreKit sandbox monthly/yearly/Lifetime/restore tests, resolve iPad screenshot strategy, capture the remaining supported PNGs in artifacts/post-goal-aso-submission, optionally capture overnight widget rollover, run production and submission verification, then update docs/APP_STORE_SUBMISSION_HANDOFF.md with a submit/no-submit decision.
