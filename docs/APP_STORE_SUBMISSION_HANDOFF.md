# App Store Submission Handoff

Status: NO-SUBMIT as of 2026-05-12.

## Build identity

- Branch: v1-3-post-goal-aso-submission-master
- Starting commit: e766ddaf17c9954ab1aaf53e09be8dbe4b6b0b8e
- Bundle ID: com.mattnewman.studyplanner
- Version: 1.0.0
- Build number: 10
- iPad support: enabled in app.json; capture 13-inch iPad screenshots or intentionally disable tablet support before submission.

## IAP IDs

- Monthly: com.mattnewman.studyplanner.plus.monthly
- Yearly: com.mattnewman.studyplanner.plus.yearly
- Lifetime: com.mattnewman.studyplanner.plus.lifetime

## Submit blockers

1. App Store Connect IAP product status and sandbox monthly/yearly/Lifetime/restore proof missing.
2. Support URL missing; submission verification fails without EXPO_PUBLIC_SUPPORT_URL in submission mode.
3. Fresh screenshot folder is incomplete: 23 raw simulator PNGs and a contact sheet are captured, but remaining required states are missing.
4. Native small/medium Home Screen widget screenshots and freshness proof missing.
5. iPad screenshot strategy unresolved while ios.supportsTablet is true.
6. Privacy URL/support page must be publicly verified and updated for parser endpoint/upload retention if endpoint is enabled.
7. Signed App Store archive entitlement for notifications must be checked.
8. Localized metadata packs require native-speaker and text-fit review.
9. Products-loaded paywall screenshot is missing; the captured paywall proof currently shows purchases unavailable.

## Reviewer flow draft

See docs/APP_REVIEW_NOTES_FINAL.md.

## Metadata

Use docs/APP_STORE_METADATA.md, docs/ASO_METADATA_PACK_EN.md, and localized ASO docs after native review.

## Screenshot folder

`artifacts/post-goal-aso-submission`

Current capture inventory:

- 23 raw simulator PNGs captured.
- Contact sheet captured: `artifacts/post-goal-aso-submission/45-final-contact-sheet.png`.
- Production empty Today proof captured: `06-today-empty.png`.
- Capture-mode proof captured for onboarding, populated Today, Add School Stuff, Check New Work, assignment detail, Calendar, Week Plan, Classes, Widget Setup, themes, and paywall product-load failure.
- Missing: native small/medium Home Screen widgets, products-loaded paywall, upload/photo/manual/parser-success states, restore purchases, app icon Home Screen, localized UI screenshots/string extraction, full VoiceOver/Dynamic Type screen sweep, iPad screenshots.

Date/localization implementation note:

- Month calendar logic now respects locale week-start rules and has Sunday/Monday/Saturday-start unit coverage.
- Full localized submission still requires localized UI review, hardcoded string extraction, and real locale screenshots.

## Recommendation

Do not submit this branch yet. Continue with remaining screenshot capture, StoreKit sandbox proof, support/privacy finalization, native widget Home Screen proof, iPad strategy, and final QA.
