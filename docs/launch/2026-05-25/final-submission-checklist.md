# Final Submission Checklist

Date: 2026-05-25

## Build

- App name: `StudyPlanner: Syllabus AI`
- Bundle ID: `com.mattnewman.studyplanner`
- ASC App ID: `6766181202`
- Version/build: `1.0.2` / `25`
- TestFlight upload receipt: `AppStore/FinalSweep-2026-05-25/testflight-upload-receipt.md`

## Assets

- Screenshots: `AppStore/LaunchPackage-2026-05-25/screenshots/`
  - 8 PNG files verified at `1290 x 2796`.
- App Store preview candidate:
  - `AppStore/LaunchPackage-2026-05-25/video/studyplanner-app-preview-886x1920.mp4`
  - H.264/AAC, `886 x 1920`, 30 fps, 21 seconds.
- Vertical marketing preview:
  - `AppStore/LaunchPackage-2026-05-25/video/studyplanner-launch-preview-1080x1920.mp4`
  - H.264/AAC, `1080 x 1920`, 30 fps, 21 seconds.

## Metadata And Legal

- Metadata uses `StudyPlanner` naming.
- Terms URL: `https://www.apple.com/legal/internet-services/itunes/dev/stdeula/`
- Privacy URL: `https://political-turtle-752.notion.site/Study-Planner-Syllabus-AI-Privacy-Policy-51dfaa74348846e0996b2e0ca22b1408`
- Subscription IDs expected:
  - `com.mattnewman.studyplanner.plus.monthly`
  - `com.mattnewman.studyplanner.plus.yearly`

## Blocking Checks Before App Review Submission

- Production EAS env currently does not show `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT` at project scope. Build 25 softens/disables photo scan paths when the image parser is unavailable; add the endpoint before using photo-parser claims in App Review copy.
- Confirm App Store Connect IAP product status, pricing, localization, subscription group, and cleared-for-sale state.
- Run a real TestFlight sandbox purchase and restore pass.
- Capture Lock Screen accessory placement if Lock Screen placement is used in submission copy.

## Exact Endpoint Command If Endpoint Exists

```sh
npx eas-cli env:create production \
  --scope project \
  --name EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT \
  --value '<https endpoint>' \
  --visibility plaintext \
  --non-interactive
```
