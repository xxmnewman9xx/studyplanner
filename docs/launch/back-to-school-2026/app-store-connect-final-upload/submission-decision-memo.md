# Submission Decision Memo

Release: Back-to-School Semester Kickoff
Generated: 2026-07-07
Target featuring window: 2026-08-24 to 2026-08-31

## Decision

Submit the In-App Event and featuring nomination now through the individual manual App Store Connect workflow.

Do not wait for the three remaining extended WidgetKit proof states unless App Store Connect rejects the event, the iOS build is rejected, or one of the five supplemental URLs stops resolving publicly.

## Why This Is The Best August Strategy

- Editorial timing matters. For an August 24 start, submit by 2026-07-17 if possible and no later than 2026-07-24.
- The current replacement build candidate is iOS `2.0.8` build `79` because Apple closed the `2.0.7` pre-release train.
- The public proof package already covers the story Apple needs to evaluate: real screenshots, real WidgetKit captures, localization proof, accessibility proof, review notes, and purchase-flow boundaries.
- The remaining local gate blockers are stricter internal launch checks, not blockers for a featuring nomination. They track optional extended widget-state proof and final internal packaging status.
- The nomination copy does not claim unproven automation, LMS sync, institution-grade forecasting, or fake widgets.

## Current Public Proof

- Product video: HTTP 200 after GitHub redirect.
- Screenshot contact sheet: HTTP 200 and `Screenshots fulfilled: 9/9`.
- Native WidgetKit sheet: HTTP 200 and `Widget states captured: 5/8`.
- Accessibility/localization summary: HTTP 200 and public latest raw Gist readback shows build `2.0.8` / `79`.
- App Review proof: HTTP 200 and public latest raw Gist readback shows build `2.0.8` / `79`.
- Deep link smoke: `studyplanner://import` opened Study Planner on a clean iPhone 17 simulator and landed on the first-run syllabus onboarding path.

## Copy B PPO Status

Copy B is now locally upload-ready as an optional Product Page Optimization treatment: `119/119` final iPhone PNGs exist in `store/apple/screenshot-copy-b-image-2/` at exact `1242x2688` dimensions, and `npm run check:copy-b-image2` passes.

Slides 1-7 are the accepted outcome-led Image 2.0 set generated from the latest localized UI references. Slide 7 was regenerated from the real localized Home Screen WidgetKit composition references so the widget promise is backed by real Home Screen proof, not the in-app Widgets screen.

Previous downscaled or superseded GPT Image 2.0 widget-screen candidates are preserved as rejected/evidence assets outside final upload paths. The current accepted widget raw candidates are preserved in `qa/back-to-school-2026/copy-b-image2-widget-chatgpt-accepted-raw/`, final dimensions are audited in `qa/back-to-school-2026/copy-b-image2-widget-chatgpt-finalization-audit.json`, and provenance is recorded in `copy-b-image2-provenance.json`.

Copy A/control in `store/apple/screenshot-pop/` remains the safest nomination upload set. Copy B can be used for PPO after the In-App Event and nomination packet are stable, with no invalid PNGs in the final Copy B root.

## Local Gate Interpretation

`npm run check:back-to-school-release-cycle` passes locally but reports `submissionReady: false`.

This is expected because the internal release gate requires:

- `asset-finalization-plan.status === "applied"`.
- All eight WidgetKit proof states captured.
- Marketing assets marked final, not draft.
- The older draft upload package to report `packageReady: true`.

For the nomination, use the final upload bundle in this folder instead of the older draft upload package.

## Submit In This Order

1. Create the In-App Event `Semester Kickoff Week`.
2. Upload only the two files in `event-media/`.
3. Submit the In-App Event for review.
4. Create an individual featuring nomination, not a CSV import.
5. Paste the fields from `nomination-fields.md`.
6. Paste the five URLs from `supplemental-url-registry.md`.
7. Attach the In-App Event only if App Store Connect makes it selectable.
8. Submit the nomination.

## Do Not Do

- Do not upload the branded supplemental hero as In-App Event media.
- Do not use generated app screens, generated widgets, fake phone UI, or composited Home Screen widget placements.
- Do not wait until 2026-07-24 unless App Store Connect or app review blocks the earlier submission.
- Do not use CSV import for this nomination, because CSV imports submit automatically.
