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
3. Fresh screenshot folder is incomplete.
4. Native small/medium Home Screen widget screenshots and freshness proof missing.
5. iPad screenshot strategy unresolved while ios.supportsTablet is true.
6. Privacy URL/support page must be publicly verified and updated for parser endpoint/upload retention if endpoint is enabled.
7. Signed App Store archive entitlement for notifications must be checked.
8. Localized metadata packs require native-speaker and text-fit review.
9. Capture-mode build is required for the remaining screenshot set; current installed simulator app only yielded the production empty Today screenshot.

## Reviewer flow draft

See docs/APP_REVIEW_NOTES_FINAL.md.

## Metadata

Use docs/APP_STORE_METADATA.md, docs/ASO_METADATA_PACK_EN.md, and localized ASO docs after native review.

## Screenshot folder

artifacts/post-goal-aso-submission

## Recommendation

Do not submit this branch yet. Continue with screenshot capture, StoreKit sandbox proof, support/privacy finalization, and final QA.
