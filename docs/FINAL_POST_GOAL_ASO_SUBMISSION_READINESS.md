# Final Post-Goal ASO Submission Readiness

This is an interim readiness report, not a submit approval.

## Score

Initial v1-3 post-goal score: 7.82/10.  
Current evidence-adjusted score after fixes/docs/screenshots/accessibility/date quick wins: 8.64/10.
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
- 23 raw simulator PNGs were captured in `artifacts/post-goal-aso-submission`.
- A generated contact sheet was captured at `artifacts/post-goal-aso-submission/45-final-contact-sheet.png`.
- Paywall failure proof was captured honestly as `38-paywall-product-load-failure.png`; products-loaded proof remains missing.
- A targeted Dynamic Type fix keeps the Today hero, metrics, warning card, and dock readable at `accessibility-extra-extra-large`; proof captured as `44-accessibility-large-text.png`.
- Month calendar planning now respects locale week-start rules with tests for Sunday, Monday, and Saturday-start regions.
- Due-date and Week Plan date labels now use the preferred locale, with 24-hour formatting tests for `fr-FR` and `en-GB`.

## Still blocking 9.4

StoreKit proof, products-loaded paywall proof, support URL, remaining screenshots, native widget Home Screen proof, iPad screenshot strategy, localized review, signed archive entitlement check, and final simulator QA.

The capture-mode rebuild solved the original deep-link capture problem, but the screenshot set is still not App Store-ready. Missing proof includes native small/medium widgets on the Home Screen, upload/photo/manual/parser success states, restore purchases, app icon Home Screen, localized UI screenshots/string extraction, full VoiceOver/Dynamic Type screen coverage, iPad sizing, and StoreKit products loaded.

## Next prompt

Run final App Store Connect validation for StudyPlanner on branch v1-3-post-goal-aso-submission-master: provide real support URL and IAP env IDs, run StoreKit sandbox monthly/yearly/Lifetime/restore tests, resolve iPad screenshot strategy, capture the remaining supported PNGs in artifacts/post-goal-aso-submission, verify native small/medium widgets on the Home Screen, run production and submission verification, then update docs/APP_STORE_SUBMISSION_HANDOFF.md with a submit/no-submit decision.
