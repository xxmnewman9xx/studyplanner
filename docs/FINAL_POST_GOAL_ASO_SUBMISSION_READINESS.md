# Final Post-Goal ASO Submission Readiness

This is an interim readiness report, not a submit approval.

## Score

Initial v1-3 post-goal score: 7.82/10.  
Current evidence-adjusted score after fixes/docs/screenshots/accessibility/date/widget/reminder/settings/restore-access/iPad proof, partial localized/date proof, contrast guard quick wins, refreshed Settings/Restore Purchases screenshots, local App Store-sized screenshot export validation, a centralized no-submit submission verifier, external-proof packet templates, localization string audit, clean source-level VoiceOver readiness audit, English ASO copy audit, localized ASO structural audit, iOS archive source preflight audit, and StoreKit source handoff audit wired into the submission gate: 9.28/10.
Target: 9.4/10.  
Verdict: not reached.

## Fixed in this pass

- Parser semester metadata is no longer trusted into planner state.
- Date-key day counts are stable across DST boundaries.
- Assignment course names refresh from selected class after moves/renames.
- Submission-mode production verification fails without explicit monthly/yearly/lifetime IDs and support URL.
- AI parse contract now matches multipart code.
- App Store metadata draft now respects app name/subtitle/promo/description length limits, the 100-byte keyword constraint, and the unsafe-claim bank.
- ASO, localization, screenshot, App Review, and handoff docs now mark real blockers.
- A real simulator production empty Today screenshot was captured at artifacts/post-goal-aso-submission/06-today-empty.png.
- Parser grade items no longer enter the planner without a review surface.
- Reminder and calendar side effects now skip invalid legacy due dates.
- Capture-mode iOS build now responds to screenshot deep links.
- 47 raw simulator PNGs were captured in `artifacts/post-goal-aso-submission`.
- Manual Add and Check Work edit-item proof are now captured as `13-manual-add.png` and `17-check-new-work-edit-item.png`.
- Filtered Calendar proof is now captured as `23-calendar-filtered-class.png`, showing the Chemistry 101 course filter narrowing the calendar view.
- Import-path proof is now captured as `11-scan-paper.png`, `12-upload-file.png`, `14-parser-processing.png`, `18-check-new-work-duplicate.png`, and `19-check-new-work-imported.png`; the scan-paper state is honest about photo parsing being unavailable without a configured endpoint.
- Reminders proof is now captured as `28-reminders.png`; Today exposes real Queue Reminders and Sync Calendar actions without claiming notification permission success.
- Settings proof is now captured as `36-settings.png`; the screen surfaces planner status, appearance, Plus/store status, restore access, widget scope, privacy link, and the unresolved support URL requirement.
- Restore access proof is now captured as `39-restore-purchases.png`; it proves the Restore entry point exists but does not prove sandbox restore success.
- Settings now uses the clearer `Restore Purchases` action label, and `36-settings.png`, `39-restore-purchases.png`, and `45-final-contact-sheet.png` were refreshed from a real capture-mode iPhone simulator build.
- iPad support is confirmed enabled in both Expo and native project settings, and 11 real 13-inch iPad simulator proof PNGs plus `ipad-contact-sheet.png` are captured in `artifacts/post-goal-aso-submission/ipad`.
- Partial localized/date proof is now captured as `43-localized-ui-example.png`; it uses a real `fr-FR` / `fr_FR` iPhone simulator state and proves locale-sensitive Week Plan date ordering, but the app strings remain English.
- A generated contact sheet was captured at `artifacts/post-goal-aso-submission/45-final-contact-sheet.png`.
- Theme/class/widget contrast is guarded by `tests/themeContrast.test.ts`; `01-onboarding-welcome.png`, `07-today-populated.png`, `21-calendar-month.png`, `24-week-plan.png`, `26-classes-list.png`, and `29-widget-setup.png` were refreshed after the contrast-safe color pass.
- Local App Store-sized screenshot export proof is now captured: `npm run export:screenshots` generated 10 iPhone 6.9-inch candidate PNGs at 1290x2796, 10 iPad 13-inch candidate PNGs at 2064x2752, and `artifacts/post-goal-aso-submission/app-store-export/manifest.json`.
- Submission readiness is now guarded by `npm run verify:submission`, which passes local screenshot export checks, English ASO copy checks, products-loaded paywall screenshot check, and the clean source-level VoiceOver audit, then returns **NO-SUBMIT** until IAP env IDs, support URL, StoreKit sandbox proof, App Store Connect upload acceptance, signed archive entitlements, and VoiceOver traversal proof are supplied.
- External proof packet templates are now staged in `artifacts/post-goal-aso-submission/external-proof`; the verifier rejects template/TODO/placeholder wording so template files cannot accidentally count as proof.
- Localization string debt is now measured by `npm run audit:localization`; the current audit found 737 likely localizable strings across 46 tracked source files and wrote `docs/LOCALIZATION_STRING_AUDIT.md`.
- English ASO copy is now measured by `npm run verify:aso`; `docs/ASO_COPY_AUDIT.md` records length-safe app name/subtitle/promo/description/keyword fields and confirms avoided claims are absent from the recommended metadata.
- Localized ASO draft structure is now measured by `npm run verify:localized-aso`; `docs/ASO_LOCALIZATION_AUDIT.md` records 20 locale metadata rows and 20 caption QA rows with length-safe subtitles, no placeholder terms, safe claims, and explicit native-speaker/text-fit caveats.
- iOS archive source readiness is now measured by `npm run audit:ios-archive`; `docs/IOS_ARCHIVE_PREFLIGHT_AUDIT.md` verifies native app/widget entitlement wiring, App Group sharing, bundle IDs, privacy manifest, usage descriptions, and widget embedding, while warning that the signed archive must still prove production APNs entitlement.
- StoreKit source handoff readiness is now measured by `npm run audit:storekit`; `docs/STOREKIT_IAP_HANDOFF_AUDIT.md` verifies product IDs, environment-driven configuration, subscription vs Lifetime product paths, non-consumable/non-consumable-equivalent transaction finishing, restore resolution, store-sourced trial copy, and safe metadata while warning that sandbox/App Store Connect proof is still external.
- Paywall failure proof was captured honestly as `38-paywall-product-load-failure.png`; products-loaded proof is now captured as `37-paywall-products-loaded.png` with returned Yearly Plus and Plus Monthly products. Lifetime transaction availability and purchase/restore success remain unproven.
- A targeted Dynamic Type fix keeps the Today hero, metrics, warning card, and dock readable at `accessibility-extra-extra-large`; proof captured as `44-accessibility-large-text.png`.
- Month calendar planning now respects locale week-start rules with tests for Sunday, Monday, and Saturday-start regions.
- Due-date and Week Plan date labels now use the preferred locale, with 24-hour formatting tests for `fr-FR` and `en-GB`.
- Check Work, Assignment Detail, Widget Setup, Paywall, and shared buttons now use bounded text scaling plus clearer labels/hints; large-text proof is captured as `49-accessibility-check-work-large-text.png` through `52-accessibility-paywall-large-text.png`.
- Visual planner surfaces now expose VoiceOver labels for task rows, completion buttons, WeekStrip days, workload bars, calendar mini-days, workload forecasts, class balance rows, and completion cards; `npm run audit:voiceover` now writes `docs/VOICEOVER_READINESS_AUDIT.md` and reports 104/104 scanned interactive elements with explicit labels, roles, and recommended hints. The source-regression, ASO, localization, iOS archive preflight, StoreKit handoff, VoiceOver audit, and contrast tests pass in the current 53/53 suite.
- Capture/demo coursework dates now roll relative to the capture day so native WidgetKit screenshots do not age into false overdue states.
- Installed native small and medium Home Screen widget screenshots are captured as `30-small-widget-home-screen.png` and `31-medium-widget-home-screen.png`; both show current May 2026 due labels.
- Native widget empty and needs-check states are captured as `32-widget-empty-state.png` and `33-widget-needs-check-state.png`; App Group payloads show the empty state has no due items, while the needs-check state has accepted Lab Report as next due plus reviewQueueCount 3.
- App icon/Home Screen proof is captured as `40-app-icon-home-screen.png`.
- Widget refresh after completion is captured as `46-widget-refresh-after-completion.png`; the App Group payload in `widget-refresh-after-completion-snapshot.json` shows next due moved to Reading Reflection, This Week dropped to 4, monthly due dropped to 7, and completed count rose to 4.
- Widget refresh after edit is captured as `47-widget-refresh-after-edit.png`; the App Group payload in `widget-refresh-after-edit-snapshot.json` shows the edited title Reflection Draft in both small and medium widget data.
- Widget refresh after add is captured as `48-widget-refresh-after-add.png`; the App Group payload in `widget-refresh-after-add-snapshot.json` shows the added Field Notes assignment as next due, due Tomorrow, with This Week and monthly due counts updated to 1.
- Widget day-boundary behavior is code/build proven: render-time due label/urgency plus 00:01 timeline refresh are guarded by `tests/widgetPlugin.test.ts`; `npm run test` passed 44/44 and the iOS simulator build compiled the WidgetKit extension.

## Still blocking 9.4

StoreKit purchase/restore proof, support URL, manual App Store Connect screenshot upload acceptance, full UI localization/native review, signed archive entitlement check, full simulator VoiceOver traversal, and final simulator QA. The new `npm run verify:submission` command tracks these as explicit blockers instead of relying on prose; it now also runs the English ASO copy audit, localized ASO structural audit, iOS archive source preflight audit, StoreKit source handoff audit, products-loaded screenshot check, and source-level VoiceOver audit, but those do not replace App Store Connect acceptance, native review, signed archive inspection, StoreKit sandbox proof, Lifetime transaction proof, or manual traversal proof.

The capture-mode rebuild solved the original deep-link capture problem, installed small/medium WidgetKit screenshots now exist, app icon proof exists, native widget empty/needs-check states exist, reminders proof exists, settings proof exists, restore access proof exists, iPad raw proof exists, partial localized/date proof exists, contrast-token proof exists, local App Store-sized export proof exists, completion/edit/add refresh is proven, day-boundary behavior is code/build proven, core action large-text proof now exists, source-level VoiceOver readiness is clean, and Manual Add/Edit Item/filtered Calendar/import-path capture states are now real. The screenshot set is closer to upload-ready, but final App Store readiness still needs manual App Store Connect upload acceptance and StoreKit/localization proof. Missing proof includes restore purchase success/sandbox proof, translated UI/string extraction/native review, full simulator VoiceOver traversal, manual screenshot upload acceptance, and StoreKit products loaded.

## Next prompt

Run final App Store Connect validation for StudyPlanner on branch v1-3-post-goal-aso-submission-master: provide real support URL and IAP env IDs, run StoreKit sandbox monthly/yearly/Lifetime/restore tests, upload the exported iPhone and iPad screenshot sets to App Store Connect and record acceptance, complete full translated UI/native-speaker localization proof if submitting localizations, optionally capture overnight widget rollover, run production and submission verification, then update docs/APP_STORE_SUBMISSION_HANDOFF.md with a submit/no-submit decision.
