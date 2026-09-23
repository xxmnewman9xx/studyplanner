# App Store Connect Submission Runbook

Generated: 2026-07-09T09:32:56.429Z
Release: Back-to-School Semester Kickoff
Status: draft_only
Recommended mode: Save as Draft only
Manual submission ready: no
CSV allowed: no

This runbook keeps the Back-to-School featuring nomination in the individual App Store Connect draft workflow until every screenshot, WidgetKit, supplemental URL, editorial, launch, and submission gate is ready. Do not use CSV import for this nomination while the status is `draft_only`.

## App Store Connect Fields

- Nomination name: Back-to-School Semester Kickoff
- Nomination type: App Enhancements
- Platforms: iOS (iPhone), iOS (iPad)
- Target window: 2026-08-24 to 2026-08-31
- Submission target: 2026-07-24
- Countries or regions: All available regions
- Description: 757/1000 characters
- Helpful Details: 400/500 characters

## Manual Steps

1. Open App Store Connect, select the app, then open Featuring > Nominations.
2. Create an individual nomination, not a CSV import.
3. Choose App Enhancements as the nomination type.
4. Paste the nomination name, publish window, platforms, countries, description, and Helpful Details from the draft payload.
5. Attach only the five stable HTTPS supplemental material URLs after the URL registry reports 5/5 registered.
6. Save as Draft while any local gate remains blocked.
7. Click Submit Nomination only after this runbook, the aggregate release-cycle gate, and the submission gate all report ready.

## Supplemental Materials

| Slot | URL Status | Upload | Local Status | URL |
| --- | --- | --- | --- | --- |
| product-video | registered | ready | url_ready | https://github.com/xxmnewman9xx/studyplanner/releases/download/back-to-school-2026-supplementals/product-video.mp4 |
| screenshot-contact-sheet | registered | blocked | blocked | https://gist.githubusercontent.com/xxmnewman9xx/8ce183d571c61df26dc64d69c429f166/raw/d7d4ce8b31e7b505396476fce416625758134698/screenshot-contact-sheet.md |
| native-widget-sheet | registered | blocked | blocked | https://gist.githubusercontent.com/xxmnewman9xx/8ce183d571c61df26dc64d69c429f166/raw/853620915fcfbacc173b7c4ebc93670cbe914277/native-widget-sheet.md |
| accessibility-localization-summary | registered | blocked | local_candidate_ready | https://gist.githubusercontent.com/xxmnewman9xx/8ce183d571c61df26dc64d69c429f166/raw/e493098bad5f3e498b3917f3d52177a34e200e56/accessibility-localization-summary.md |
| app-review-proof | registered | ready | url_ready | https://gist.githubusercontent.com/xxmnewman9xx/8ce183d571c61df26dc64d69c429f166/raw/bd0c7707da477a34bf716ab2154f78e6674e66e0/app-review-proof.md |

## Artifact Status

| Artifact | Status | Summary |
| --- | --- | --- |
| docs/launch/back-to-school-2026/app-store-connect-draft-payload.json | blocked | App Enhancements nomination, 757/1000 description characters, 400/500 helpful-details characters. |
| qa/back-to-school-2026/supplemental-url-registry.json | ready | 5/5 stable supplemental URLs registered. |
| qa/back-to-school-2026/supplemental-upload-manifest.json | blocked | 9/9 screenshots, 5/8 WidgetKit states, 2/5 supplemental URLs. |
| qa/back-to-school-2026/submission-gate.json | blocked | 10 submission gate(s) blocked. |
| qa/back-to-school-2026/launch-readiness-audit.json | blocked | 14 launch blocker(s). |
| qa/back-to-school-2026/editorial-readiness-board.json | blocked | 5 editorial item(s) blocked. |
| qa/back-to-school-2026/release-cycle-gate.json | blocked | Previous aggregate cycle generated at 2026-07-09T09:23:38.461Z; submission ready: no. |

## Pre-Submit Commands

- `npm run check:back-to-school-submission-runbook`
- `npm run check:back-to-school-release-cycle`
- `npm run check:back-to-school-submission`

## Blocked Gates

- nomination-copy
- native-capture-preflight
- remote-capture-fallback
- app-store-screenshots
- widgetkit-proof
- supplemental-materials
- upload-package
- all-assets-ready
- editorial-board
- launch-audit

## Current Blockers

- submission: nomination-copy: Nomination copy, type, platform, character limits, or lead time is not ready.
- submission: native-capture-preflight: Free local disk before rerunning the native simulator build.
- submission: remote-capture-fallback: eas-auth: Authenticate with EAS or set EXPO_TOKEN before remote capture.
- submission: remote-capture-fallback: capture-targets: Regenerate the Back-to-School native capture plan.
- submission: app-store-screenshots: Final App Store screenshot manifest has not been applied from native captures.
- submission: widgetkit-proof: Real WidgetKit Home Screen and Lock Screen placement screenshots are missing.
- submission: supplemental-materials: screenshot-contact-sheet: Generate the screenshot contact sheet from native release captures only.
- submission: supplemental-materials: native-widget-sheet: Capture real Home Screen and Lock Screen WidgetKit states.
- submission: supplemental-materials: accessibility-localization-summary: Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence.
- submission: supplemental-materials: accessibility-localization-summary: Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization.
- submission: supplemental-materials: accessibility-localization-summary: Summarize localization and accessibility QA with final native screenshots.
- submission: upload-package: Finalize all nine App Store screenshots from native release captures.
- submission: upload-package: Capture every required real WidgetKit Home Screen and Lock Screen state.
- submission: upload-package: Upload all five supplemental materials to stable HTTPS URLs and update the asset manifest.
- submission: upload-package: screenshot-contact-sheet is not upload-ready: Generate the screenshot contact sheet from native release captures only.
- submission: upload-package: native-widget-sheet is not upload-ready: Capture real Home Screen and Lock Screen WidgetKit states.
- submission: upload-package: accessibility-localization-summary is not upload-ready: Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence. Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization. Summarize localization and accessibility QA with final native screenshots.
- submission: all-assets-ready: 16/21 assets are marked ready.
- submission: all-assets-ready: 13 assets still depend on native app or WidgetKit capture proof.
- submission: all-assets-ready: Upload or link all five supplemental materials before App Store Connect nomination submission.
- submission: editorial-board: Editorial readiness board still has blocked or planned items.
- submission: launch-audit: Launch readiness audit still records blockers.
- upload-package: Finalize all nine App Store screenshots from native release captures.
- upload-package: Capture every required real WidgetKit Home Screen and Lock Screen state.
- upload-package: Upload all five supplemental materials to stable HTTPS URLs and update the asset manifest.
- upload-package: screenshot-contact-sheet is not upload-ready: Generate the screenshot contact sheet from native release captures only.
- upload-package: native-widget-sheet is not upload-ready: Capture real Home Screen and Lock Screen WidgetKit states.
- upload-package: accessibility-localization-summary is not upload-ready: Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence. Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization. Summarize localization and accessibility QA with final native screenshots.
- launch: Native iOS build rerun after freeing disk for Xcode DerivedData
- launch: Free local disk before rerunning native build/capture.
- launch: Finalize all nine App Store screenshots from native release captures.
- launch: Capture every required real WidgetKit Home Screen and Lock Screen state.
- launch: Upload all five supplemental materials to stable HTTPS URLs and update the asset manifest.
- launch: screenshot-contact-sheet is not upload-ready: Generate the screenshot contact sheet from native release captures only.
- launch: native-widget-sheet is not upload-ready: Capture real Home Screen and Lock Screen WidgetKit states.
- launch: accessibility-localization-summary is not upload-ready: Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence. Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization. Summarize localization and accessibility QA with final native screenshots.
- launch: promo-hero: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- launch: promo-widget-sheet: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- launch: social-import: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- launch: social-trust: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- launch: social-widget: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- launch: social-focus: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- editorial: apple-fields is not ready.
- editorial: native-build is not ready.
- editorial: app-store-screenshots is not ready.
- editorial: widgets is not ready.
- editorial: supplemental-materials is not ready.

## Source Rules

- Apple individual nominations can be saved as drafts until ready to submit.
- Apple supplemental materials support up to five URLs.
- Apple CSV nomination imports submit automatically, so this release must stay in the individual draft workflow until every local gate is ready.

Sources:

- https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/
- https://developer.apple.com/help/app-store-connect/reference/nominations/nominations-template/
