# Submission Status - 2026-07-01

## Current State

- EAS auth works as `xxmnewman9xx` / `xxmnewman9xx@gmail.com`.
- Local app config is now `version: 2.0.6`, iOS build `75`, bundle id `com.mattnewman.studyplanner`.
- App Store metadata was pushed successfully for `2.0.6` after removing the previous waiting-review submission.
- EAS production iOS build `1ddfb0a1-fd75-4924-9b24-2e71fabaf1aa` finished successfully.
- EAS App Store Connect upload submission `c367a413-d13b-4621-91b0-c6401f63833c` uploaded the binary successfully.
- Fastlane selected build `2.0.6 (75)` and App Store Connect accepted the version for review.
- App Store Connect state was verified directly after submission: `WAITING_FOR_REVIEW`, attached build `75`, processing state `VALID`.
- Current App Review submission id: `537ec141-d4ad-41fe-a58a-1cd1f1e13c42`.
- Subscription price schedule was updated in App Store Connect:
  - weekly: `$9.99` starting `2026-07-02`
  - monthly: `$19.99` starting `2026-07-02`
  - annual: `$59.99` already active from `2026-06-15`
  - existing weekly/monthly subscriber cohorts are preserved.
- IPA artifact:
  - `https://expo.dev/artifacts/eas/o8uhyQ9YlEQ8mDihvCkJ3zO8XM4JUICzok0hc-eTSUk.ipa`
- English App Store screenshot sets now use the widget screenshot as slot 7:
  - `en-US`
  - `en-GB`
  - `en-AU`
  - `en-CA`
- All screenshot paths referenced by `store.config.json` exist.
- Fresh simulator widget-screen screenshot after the copy/widget guard pass:
  - `qa-screenshots/max-impact-2026-07-01/current-simulator-after-copy-widget-fix.png`
- Existing widget app-preview/home-screen-style evidence remains:
  - `qa-screenshots/max-impact-2026-07-01/widgets-action-first-clean-final.png`
  - `qa-screenshots/max-impact-2026-07-01/native-widget-payload-summary.txt`
  - `qa-screenshots/max-impact-2026-07-01/native-widget-app-group-payload.txt`

## Verified Gates

- `npm run test:notes-stress`
- `npm run test:global-notes`
- `npm run test:hard-paywall`
- `npm run check:iap`
- `npm run check:build52`
- `npm run test:widgets`
- `npm run test:widget-integrity`
- `npm run typecheck`
- `npm run qa:release`

## Submission Notes

1. The root concept behind the removed `89 loop score ready` issue was generic future-state filler copy presented as if it were a real personalized metric. The fix removes that stale synthetic score language and keeps widget/app-preview messaging tied to real planner logic.

2. The 2.0.6 conversion pass makes the locked experience camera-first:
   - onboarding defaults to `Scan with camera`
   - camera scan is positioned as paid before import
   - import entry points route through the App Store paywall when entitlement is missing
   - paywall value proof focuses on scan, extract, review, dashboard, widgets, and reminders

3. Submission needed two corrections:
   - metadata updated the waiting-for-review 2.0.5 listing to `2.0.6` while build `72` was still attached, so that review request was cancelled and build `73` was selected
   - a final subagent audit found the paywall CTA could be disabled when StoreKit localized prices had not loaded, so build `74` keeps purchase available through real fallback product IDs, removes the paywall close affordance, cancels the build `73` review request, and submits build `74`
   - the final conversion/pricing pass bumped to build `75`, removed the build `74` waiting-review submission, attached build `75`, refreshed metadata/screenshots, and submitted review submission `537ec141-d4ad-41fe-a58a-1cd1f1e13c42`

4. A failed EAS build exposed stale generated iOS widget project references:
   - failed build: `66cc744b-931a-4902-8e77-df2352e62a57`
   - failure: generated widget Swift files were referenced with local absolute paths
   - fix: ignore generated `/ios` for EAS remote builds and run `./plugins/with-widgetkit-kinds` after `expo-widgets` creates the widget Swift files

5. Disposable managed prebuild verification passed after the fix:
   - generated `ios/ExpoWidgetsTarget/index.swift`
   - generated all four StudyPlanner widget Swift files
   - widget kind strings matched `studyplanner.today`, `studyplanner.upcoming`, `studyplanner.week`, and `studyplanner.classProgress`
   - generated Xcode file references were relative, with no local `/Users/mattnewman` or `/private/tmp` paths

6. Actual pinned Home Screen widget visual proof is still limited by simulator tooling:
   - `simctl` on the booted iPhone simulator has no widget-placement command
   - current SpringBoard screenshot does not show StudyPlanner widgets pinned
   - native/in-app parity is covered by `npm run test:widget-integrity`, which checks shared snapshot payloads, native widget dimensions, row limits, and week rail sizing
