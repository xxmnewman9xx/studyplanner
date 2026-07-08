# Submission Decision Memo

Release: Back-to-School Semester Kickoff
Generated: 2026-07-07
Target featuring window: 2026-08-24 to 2026-08-31

## Decision

Submit the In-App Event and featuring nomination now through the individual manual App Store Connect workflow.

Do not wait for the three remaining extended WidgetKit proof states unless App Store Connect rejects the event, the iOS build is rejected, or one of the five supplemental URLs stops resolving publicly.

## Why This Is The Best August Strategy

- Editorial timing matters. For an August 24 start, submit by 2026-07-17 if possible and no later than 2026-07-24.
- The submitted build candidate is iOS `2.0.7` build `78`.
- The public proof package already covers the story Apple needs to evaluate: real screenshots, real WidgetKit captures, localization proof, accessibility proof, review notes, and purchase-flow boundaries.
- The remaining local gate blockers are stricter internal launch checks, not blockers for a featuring nomination. They track optional extended widget-state proof and final internal packaging status.
- The nomination copy does not claim unproven automation, LMS sync, institution-grade forecasting, or fake widgets.

## Current Public Proof

- Product video: HTTP 200 after GitHub redirect.
- Screenshot contact sheet: HTTP 200 and `Screenshots fulfilled: 9/9`.
- Native WidgetKit sheet: HTTP 200 and `Widget states captured: 5/8`.
- Accessibility/localization summary: HTTP 200 and public latest raw Gist readback shows build `2.0.7` / `78`.
- App Review proof: HTTP 200 and public latest raw Gist readback shows build `2.0.7` / `78`.
- Deep link smoke: `studyplanner://import` opened Study Planner on a clean iPhone 17 simulator and landed on the first-run syllabus onboarding path.

## Copy B PPO Status

Do not block the In-App Event or featuring nomination on Copy B. The final Copy B root intentionally has no accepted PNGs because the July 8 ChatGPT Mac app/Image 2.0 canaries for `en-US-01` and `en-US-02` exported below the required `1242x2688`. The stronger `en-US-02` retry used real logo and real UI uploads through the Mac app file dialog and still exported `852x1846`; copying the visible generated image from the Mac app context menu also returned `852x1846`. Rejected candidates and state evidence are preserved under `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/` and `qa/back-to-school-2026/copy-b-image2-mac-app-auto-run-state.json`.

The July 8 fresh-chat final-prefix canary used the exact required opening sentence, the real app icon, latest Scan UI, latest Review Import UI, and first-three direction references. GPT Image 2.0 again returned a retrievable PNG at `853x1844`, not `1242x2688`. The rejected raw file is `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/2026-07-08-en-US-01-fresh-dimlock-chatgpt-mac-cache-853x1844.png` with SHA-256 `8ae7a82077e2ebe704ef5841333e946bb41b861902e69372b33d34029bf93b74`; visual proof is `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/2026-07-08-en-US-01-fresh-dimlock-chatgpt-mac-visual-proof.png`. Keep `store/apple/screenshot-copy-b-image-2/` empty unless a new GPT Image 2.0 canary is retrievable as a raw exact `1242x2688` PNG and passes visual QA.

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
