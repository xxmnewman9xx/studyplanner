# Back-to-School 2026 Supplemental Materials Packet

Generated: 2026-07-09T09:32:53.082Z
Release: Back to School with AI
Supplemental URLs ready: 2/5
Local candidates ready: 1/5
Submission ready: no

Apple supplemental materials are URL fields, so local files are only candidates until they are uploaded to stable HTTPS URLs. Keep this packet in draft status until every row is `url_ready`.

URL registry: `qa/back-to-school-2026/supplemental-url-registry.json`

## Materials

| Material | Status | URL | Local evidence | Blockers | Next action |
| --- | --- | --- | --- | --- | --- |
| Import, Review, Semester Ready, Home, Focus, Widgets | url_ready | https://github.com/xxmnewman9xx/studyplanner/releases/download/back-to-school-2026-supplementals/product-video.mp4 | Local candidate exists: marketing/social-launch-video/final/studyplanner-scanner-demo-app-preview-1080x1920.mp4 (1331420 bytes)<br>Product video review status: legacy_supporting_approved<br>Primary video: 1080x1920, 15.00s, 60.00fps, h264<br>App Preview ready: no<br>Native capture run status: captured | None | Keep the linked video aligned with final screenshots. |
| Release Build Screenshot Contact Sheet | blocked | https://gist.githubusercontent.com/xxmnewman9xx/8ce183d571c61df26dc64d69c429f166/raw/d7d4ce8b31e7b505396476fce416625758134698/screenshot-contact-sheet.md | Asset finalization status: ready_to_apply<br>9/9 App Store screenshot slots fulfilled<br>Local contact sheet exists: docs/launch/back-to-school-2026/app-store-screenshot-contact-sheet.md (3464 bytes) | Generate the screenshot contact sheet from native release captures only. | Verify the URL after any screenshot refresh. |
| Native WidgetKit Screenshot Sheet | blocked | https://gist.githubusercontent.com/xxmnewman9xx/8ce183d571c61df26dc64d69c429f166/raw/853620915fcfbacc173b7c4ebc93670cbe914277/native-widget-sheet.md | Native WidgetKit placement status: manual_native_capture_required<br>Local widget sheet exists: docs/launch/back-to-school-2026/native-widgetkit-screenshot-sheet.md (2423 bytes)<br>Expo SDK 56 widgets require native WidgetKit proof, not Expo Go or web smoke screenshots. | Capture real Home Screen and Lock Screen WidgetKit states. | Keep widget URL aligned with final WidgetKit captures. |
| Accessibility and Localization QA Summary | local_candidate_ready | https://gist.githubusercontent.com/xxmnewman9xx/8ce183d571c61df26dc64d69c429f166/raw/e493098bad5f3e498b3917f3d52177a34e200e56/accessibility-localization-summary.md | 8/8 local accessibility/localization source files exist<br>White setup/class-color accessibility/localization source coverage: no<br>Build metadata white setup/class-color gate coverage: no<br>Summary content current: no<br>Native capture preflight ready: no<br>Native runbook includes Dynamic Type, Reduce Transparency, and RTL capture slots. | Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence.<br>Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization.<br>Summarize localization and accessibility QA with final native screenshots. | Re-check URL after native accessibility screenshots change. |
| App Review Notes and Purchase Flow Proof | url_ready | https://gist.githubusercontent.com/xxmnewman9xx/8ce183d571c61df26dc64d69c429f166/raw/bd0c7707da477a34bf716ab2154f78e6674e66e0/app-review-proof.md | Claim boundaries ready: yes<br>Proof content current: yes<br>Purchase/review source coverage: yes<br>Hard-paywall and IAP command gates: yes<br>6/6 local review-proof source files exist | None | Verify review notes still match the linked proof. |

## URL Slots

1. Product video or App Preview: import, review, semester-ready payoff, Home, focus, widgets.
2. Screenshot contact sheet from the release build.
3. Native WidgetKit screenshot sheet: light, dark, tinted/accented, empty, normal, exam-heavy.
4. Accessibility/localization QA summary.
5. App Review notes with claim boundaries and purchase/review flow proof.

## Source Rules

- Apple supports up to five supplemental material URLs for a featuring nomination.
- CSV nomination import is unsafe before final proof because imported rows submit immediately.
- Product video candidates must be approved against the Back-to-School story before upload.
- App Store screenshot and widget sheets must come from native release/TestFlight captures.
- Expo SDK 56 widgets require native WidgetKit proof; Expo Go and web smoke screenshots are not enough.
- Expo SDK 56 GlassView is the Liquid Glass path and still requires native runtime validation.
- Run `npm run register:back-to-school-supplemental-urls -- --set slot-id=https://...` after uploading final materials, then refresh this packet.

Sources:

- https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/
- https://developer.apple.com/help/app-store-connect/reference/nominations/nominations-template/
- https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications/
- https://docs.expo.dev/versions/v56.0.0/sdk/widgets/
- https://docs.expo.dev/versions/v56.0.0/sdk/glass-effect/
