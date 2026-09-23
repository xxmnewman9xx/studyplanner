# Back-to-School 2026 Editorial Readiness Board

Generated: 2026-07-09T09:32:55.693Z
Release: Back-to-School Semester Kickoff
Target window: 2026-08-24 to 2026-08-31
Submission target: 2026-07-24
Submission ready: no

This board is intentionally not an uploadable App Store Connect CSV. Apple's CSV import submits nominations automatically, so the release should use a draft nomination until every native screenshot, WidgetKit proof, supplemental URL, and upload package gate is final.

## Board

| Area | Status | Evidence | Blocker | Next action |
| --- | --- | --- | --- | --- |
| App Store Connect fields | blocked | Nomination type: App Enhancements<br>Description: 757/1000 chars<br>Helpful Details: 400/500 chars<br>Supplemental URLs: 2/5<br>Upload package ready: no | Nomination copy, type, platform, character limits, or lead time is not ready. | Copy fields manually into a draft nomination after native screenshots, supplemental URLs, and launch audit are approved. |
| Editorial student outcome | ready | Back to School with AI narrative is consistent across nomination, release copy, and asset manifest.<br>Student outcome is empty semester to reviewed plan, focus rhythm, and widgets. | None | Keep all final screenshots anchored to setup, review, semester-ready payoff, focus, and widgets. |
| Native build and capture | blocked | qa/back-to-school-2026/native-build-attempt-2026-07-06.json<br>qa/back-to-school-2026/native-capture-preflight.json<br>qa/back-to-school-2026/native-capture-run.json<br>Build status: blocked_by_environment<br>Preflight ready: no<br>Capture run: captured<br>Widget placement: manual_native_capture_required<br>Current blocker: host_disk_full<br>0.6 GiB free; minimum 15 GiB recommended before Xcode build/capture. | Native release/TestFlight app screenshots and real WidgetKit placement proof are not complete. | Free disk or use the guarded remote fallback, rerun the native build, install on simulator/TestFlight, then capture Liquid Glass and WidgetKit proof. |
| App Store screenshots | blocked | 9 planned frames<br>9 native/native-widget required frames<br>102 deterministic app capture targets planned<br>9/9 screenshot slots mapped by finalizer<br>Ready assets: 16/21<br>Upload package screenshot coverage: 9/9 | 16/21 assets are marked ready.<br>13 assets still depend on native app or WidgetKit capture proof.<br>Upload or link all five supplemental materials before App Store Connect nomination submission. | Attach real native files to the asset manifest and regenerate the asset audit. |
| Widget editorial proof | blocked | Widget fixture QA covers empty, calm, exam-heavy, long-copy, tinted-ready states.<br>Expo SDK 56 widgets require native builds and cannot be proven in Expo Go.<br>Widget placement status: manual_native_capture_required<br>Upload package WidgetKit coverage: 5/8 | Native WidgetKit Home Screen, Lock Screen, dark, and tinted captures are missing. | Capture real WidgetKit surfaces after the native build succeeds. |
| Supplemental materials | blocked | 5 nomination URL slots planned<br>2/5 supplemental URLs ready<br>1/5 local supplemental candidates ready<br>qa/back-to-school-2026/supplemental-materials-plan.json<br>qa/back-to-school-2026/supplemental-upload-manifest.json | screenshot-contact-sheet: Generate the screenshot contact sheet from native release captures only.<br>native-widget-sheet: Capture real Home Screen and Lock Screen WidgetKit states.<br>accessibility-localization-summary: Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence.<br>accessibility-localization-summary: Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization.<br>accessibility-localization-summary: Summarize localization and accessibility QA with final native screenshots. | Produce, approve, and upload all five supplemental materials after native capture. |
| Claim boundaries | ready | Nomination packet excludes LMS sync, guaranteed extraction, homework submission, fake widget placement, and unsupported Watch claims. | None | Re-run launch and editorial gates after every copy or screenshot update. |

## Source Rules

- App Store Connect nominations can be submitted individually or by CSV; CSV imports submit automatically.
- App Enhancements is the correct nomination type for a major update to an existing app.
- Submit at least three weeks before the requested publication window.
- Supplemental Materials supports up to five URLs.
- Expo SDK 56 widgets require native builds for real WidgetKit proof.
- Expo SDK 56 GlassView is the Liquid Glass path and still needs runtime/fallback validation.

Sources:

- https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/
- https://developer.apple.com/help/app-store-connect/reference/nominations/nominations-template/
- https://docs.expo.dev/versions/v56.0.0/sdk/widgets/
- https://docs.expo.dev/versions/v56.0.0/sdk/glass-effect/
