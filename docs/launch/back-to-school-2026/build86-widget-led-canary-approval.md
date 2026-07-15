# Build 86 widget-led canary approval

Status: **approved through release-owner visual direction approval plus independent AI review**

Independent AI visual gate: **passed 14/14 at 9.5–9.8** with **9.8 pack coherence**. Machine gate: **68/68**. The release owner stated that the previews look good, then delegated locale review and submission preparation. Approval is recorded in `canary-review.json` and governed by `build86-release-source-waiver-2026-07-14.json`.

Scope: 14 en-US canary assets (seven slides × iPhone 6.5-inch and iPad 12.9-inch). Approval authorizes reuse of the 14 scene plates for deterministic localization after native-language approval and exact physical-device TestFlight Build 86 capture. It does not authorize simulator pixels for release, screenshot upload, or App Store review submission.

[Review the 14-image contact sheet](../../../outputs/imagegen/generative-polish/build86-widget-led-conversion/scene-canary/en-US/build86-en-US-scene-canary-contact-sheet.png)

## Approval criteria

- [x] All seven headlines are exact, readable, and inside their safe zones.
- [x] Slide 3 remains the Home Screen widget proof and uses genuine widget UI.
- [x] Slide 5 visibly shows the genuine **Focus Session** route.
- [x] Slide 6 visibly shows a distinct Today/class-movement screen.
- [x] Device scale keeps the real UI readable at App Store thumbnail size.
- [x] The light/dark sequence and restrained green, purple, blue, and orange accents feel coherent.
- [x] No scene contains generated app UI, generated widgets, logos, claims, coursework, or status-bar content.
- [x] The 14 scene plates may be reused across the 17 approved locales.

## Verified asset inventory

| Device | Slide | Headline | Final SHA-256 | UI source SHA-256 |
| --- | ---: | --- | --- | --- |
| iPhone 6.5-inch | 1 | Turn your syllabus into a plan. | `b5734d111bb0…` | `dd99a2c0545f…` |
| iPhone 6.5-inch | 2 | Know what needs you today. | `2aabe7f3e82a…` | `2a4da1ff9d6c…` |
| iPhone 6.5-inch | 3 | Your next move—before you open the app. | `7067028abd0a…` | `5a7510dd4193…` |
| iPhone 6.5-inch | 4 | See heavy weeks before they hit. | `c067bb5771e4…` | `5b9372c78661…` |
| iPhone 6.5-inch | 5 | Turn deadlines into focus time. | `b6e5345c5c69…` | `44b1d5baef5d…` |
| iPhone 6.5-inch | 6 | Keep every class moving. | `a95d17a74559…` | `1defbff2c70d…` |
| iPhone 6.5-inch | 7 | Review uncertain dates before they count. | `4a2c6a3ed605…` | `7a393ada18b2…` |
| iPad 12.9-inch | 1 | Turn your syllabus into a plan. | `97ed66614917…` | `1162fcee242f…` |
| iPad 12.9-inch | 2 | Know what needs you today. | `94c43717aea5…` | `05f9489def82…` |
| iPad 12.9-inch | 3 | Your next move—before you open the app. | `9689469ebcdc…` | `46071eff332f…` |
| iPad 12.9-inch | 4 | See heavy weeks before they hit. | `6699477df722…` | `11b52677648b…` |
| iPad 12.9-inch | 5 | Turn deadlines into focus time. | `2a5a79aa4750…` | `8c52de1675e8…` |
| iPad 12.9-inch | 6 | Keep every class moving. | `189850585535…` | `f0a8f29260ec…` |
| iPad 12.9-inch | 7 | Review uncertain dates before they count. | `1de10cadbcc6…` | `f59ef626a91c…` |

Machine verification: **68/68 checks passed**. Two independent rebuilds were byte-identical across all 15 PNGs (14 assets plus contact sheet). The independent visual scorecard is at `qa/back-to-school-2026/build86-canary-visual-scorecard.json`. All assets remain `releaseEligible: false` and `uploadAuthorized: false` until the final exact-capture and human-review gates pass.

## Decision record

Decision: [x] Approve all 14  [ ] Request revisions

Reviewer: release owner via Codex task

Date: 2026-07-14

Revision notes: __________________________________________________________
