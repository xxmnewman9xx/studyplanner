# Build 86 widget-led readiness

Current release policy: the release owner waived the physical-device capture requirement and delegated multilingual review to AI in `build86-release-source-waiver-2026-07-14.json`. The strict physical workflow below remains available, but it is not the active preparation path for this package.

## Locked release identity

- App version: `2.0.9`
- iOS build: `86`
- Bundle: `com.mattnewman.studyplanner`
- Widget extension: `com.mattnewman.studyplanner.widgets`
- Territory: **Bold Academic Editorial**
- Promise: **Your next move, before you open the app.**

## Implemented locally

- Four subscriber-only widgets use a shared display-state contract: `live`, `empty`, `locked`, or `placeholder` plus one metric, one headline, one detail, one accent, one action, and one safe URL.
- Today is medium, Upcoming is small, Week is medium, and Class Progress is small; concise inline, circular, and rectangular accessories remain available.
- Locked snapshots contain no coursework and open Paywall. Empty snapshots open Scan. Live links are limited to Today, Plan, Class, Review, Focus, Scan, or Paywall.
- In-app preview and pre-purchase example consume the same snapshot display model as WidgetKit. The example is labeled and non-interactive.
- Week uses seven real rolling workload counts. Today accessories use the real due-state metric. Week and Class labels are localized across all 17 storefronts.
- Store metadata and the 17 × 2 × 7 screenshot matrix target Build 86, with the widget promise fixed in slot three.

## Strict-path external proof before media production

1. Native-language approval for every seven-headline locale set.
2. A committed Build 86 source revision and finished EAS production build.
3. Downloaded IPA identity inspection and SHA-256 binding.
4. Fresh exact-binary iPhone and iPad source atlases with immutable live UI pixels.
5. Approved 14-image canary covering all seven slides on both devices.
6. The remaining 224 Creative Production assets, deterministic localized headlines, OCR/safe-zone/truth checks, unique hashes, and 34 locale/device contact-sheet approvals.

## App Store Connect boundary

Upload and readback may proceed only after the exact IPA and 238-asset manifest pass the gates. Select Build 86 for version 2.0.9 and leave the version in Prepare for Submission / Ready for Review. Final **Submit for Review** remains reserved for the named release owner.

## Measurement

Record a 28-day pre-release App Store Connect baseline and compare weekly cohorts for product-page-view to first-time-download conversion, new paid subscriptions per first-time download, trial-to-paid conversion when a real trial is configured, and 7-/28-day subscription retention. No third-party analytics SDK is introduced.
