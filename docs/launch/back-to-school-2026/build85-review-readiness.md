# Build 85 review readiness

Status: blocked before binary upload, screenshot replacement, build selection, and review submission.

## Implemented

- `app.json` targets StudyPlanner `2.0.8` build `85`.
- Expo prebuild propagates build `85` to the app and WidgetKit extension.
- The widget extension uses the production display name `StudyPlanner Widgets`.
- Widget layouts register during app startup, so a first-download user cannot reach a red `No layout found` gallery preview before manually syncing.
- The active onboarding/paywall path retains live StoreKit pricing, eligibility-aware trial copy, validated entitlement activation, restore, legal links, and destination recovery.
- The ASC release checker now requires Build 85, 119 iPhone screenshots, 119 iPad screenshots, exact Build 85 provenance, and explicit approval of the 238 final GPT Image 2.0 assets.

## Verified locally

- A locally signed Build 85 simulator binary was built and installed with exact app and widget identity: version `2.0.8`, build `85`, `com.mattnewman.studyplanner`, and `com.mattnewman.studyplanner.widgets`.
- Build 85 allocates `group.com.mattnewman.studyplanner` and persists all four exact Expo layout keys on first launch.
- The Build 85 English gallery tests pass on both iPhone and iPad under the exact `Study Planner` search and expose seven supported pages without the red missing-layout state.
- The real Today widget can be placed on both iPhone and iPad Home Screens. The placement probes are retained as QA evidence but rejected as production sources because fresh-launch privacy protection renders empty content; the plan requires visible priorities/week data, and the iPhone probe also contains edit-mode simulator clutter.
- TypeScript, IAP, privacy, first-experience, WidgetKit key/integrity, 17-storefront localization, runtime-safety, accessibility, activation, semester-kickoff, dark-mode, and Build 85 release checks pass.

The certified English artifacts are:

`/Users/mattnewman/work/StudyPlanner-release-artifacts/build85/widget-certification/iphone-widget-gallery-en-US-second-pass.png`

- iPhone SHA-256: `b9e946045c04c621f90ecbf29146e50a303ea2af4fdd7df6cb1dd8ddc878dd2f`
- iPad: `/Users/mattnewman/work/StudyPlanner-release-artifacts/build85/widget-certification/ipad-widget-gallery-en-US.png`
- iPad SHA-256: `720e22ed1c55a0c0e7fc430219e4df1f589c6d846d3e334045e84dc24c8886f0`

These artifacts certify widget-gallery discovery on both device families. They are not placed-widget Home Screen captures and must not be promoted into the 34-source production atlas matrix.

Rejected placed-widget probes:

- iPhone: `/Users/mattnewman/work/StudyPlanner-release-artifacts/build85/widget-certification/iphone-home-screen-widget-en-US.png` (`318e8060b172f8cd3e4d7b780a0d01a9cdc63908f86967c552dba31b90a5dd7a`)
- iPad: `/Users/mattnewman/work/StudyPlanner-release-artifacts/build85/widget-certification/ipad-home-screen-widget-en-US.png` (`b79deb0a1390642ff568d47b653806f110a59a54dc71a1671c888dcd3dc8a9b6`)

## ASC backup and current remote media

The read-only ASC backup is stored at:

`/Users/mattnewman/work/StudyPlanner-release-artifacts/build85/asc-backup-2026-07-13`

The live `2.0.8` listing currently has 143 screenshots:

- iPhone: 118 of the requested 119 slots.
- iPad: 25 of the requested 119 slots.

No remote metadata, screenshot relationship, selected build, or review state was changed during this cycle. Build 82 must remain selected until every gate below passes.

## Blocking gates

1. The desktop Computer Use runtime refuses access to the signed-in ChatGPT Mac app (`com.openai.chat`) for safety reasons. The required 14-job canary and 224 remaining Mac-app jobs have not run; browser/API substitution is prohibited.
2. Build 85 has not been uploaded, processed, selected, or read back from ASC. Local simulator signing/install proof is complete, but it is not an App Store distribution artifact.
3. All 34 Build 85 localized placed-widget Home Screen captures remain, and the complete atlas set does not exist.
4. The existing 17-locale marketing copy is marked `draft_requires_native_language_review`; it cannot be treated as final native-reviewed copy.
5. The repository contains 170 prior five-slide assets, not 238 accepted Build 85 GPT Image 2.0 outputs.
6. No 238-asset machine QA, independent 10/10 scorecards, provenance ledger, contact sheets, remote media completion receipts, selected-build readback, or submission receipt exists.

## Release order after the blockers clear

1. Produce the App Store distribution Build 85 binary; capture all 34 localized placed-widget Home Screen sources and Build 85 atlases.
2. Obtain native-language approval for every headline, subhead, line break, and Arabic direction rule.
3. Run the 14-image ChatGPT Mac-app canary. Reject any UI or typography drift and do not start full production until all 14 pass.
4. Generate and approve the remaining 224 images, preserving every attempt and provenance record.
5. Update `store.config.json` to the canonical `store/apple/screenshot-build85-image2/` 119+119 set and pass `npm run check:asc-final-upload`.
6. Run the full repository/CI suite and GitNexus `detect_changes --scope compare --base-ref main`.
7. Build/upload through EAS, upload metadata/media, poll every asset to `COMPLETE`, select Build 85, read the relationship back, then submit for App Review.
