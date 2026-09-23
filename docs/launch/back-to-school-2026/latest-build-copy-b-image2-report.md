# Latest Build Copy B Image 2.0 Report

Generated: 2026-07-07
Queue: `qa/back-to-school-2026/latest-build-copy-b-image2-prompts.json`

## Status

Built and ran a new seven-image B queue from the latest Build 77 UI captures, not the older live ASC preview UI.

This set is now concept-only. It helped identify the stronger outcome narrative, but it is not upload-safe under the current final B rules because the native Image 2.0 outputs exported at `853x1844` and the `1242x2688` files below are resized derivatives.

The final B path is the outcome queue in `docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-image2-manual-queue.json`, with accepted files saved to `store/apple/screenshot-copy-b-image-2/{locale}/APP_IPHONE_65/`.

## Generation Result

All seven slides were prompted individually in the ChatGPT Mac app with GPT Image 2.0 and collected.

Native Image 2.0 cached outputs:

- `qa/back-to-school-2026/latest-build-copy-b-image2-candidates/latest-en-US-01-rejected-853x1844.png`
- `qa/back-to-school-2026/latest-build-copy-b-image2-candidates/latest-en-US-02-rejected-853x1844.png`
- `qa/back-to-school-2026/latest-build-copy-b-image2-candidates/latest-en-US-03-rejected-853x1844.png`
- `qa/back-to-school-2026/latest-build-copy-b-image2-candidates/latest-en-US-04-rejected-853x1844.png`
- `qa/back-to-school-2026/latest-build-copy-b-image2-candidates/latest-en-US-05-rejected-853x1844.png`
- `qa/back-to-school-2026/latest-build-copy-b-image2-candidates/latest-en-US-06-rejected-853x1844.png`
- `qa/back-to-school-2026/latest-build-copy-b-image2-candidates/latest-en-US-07-rejected-853x1844.png`

All native cached outputs are `853x1844`, so the direct Image 2.0 export path still fails the App Store size gate.

Exact-size review derivatives were created by resizing those Image 2.0 outputs to `1242x2688`. These are useful for visual discussion only and must not be treated as final PPO/upload assets:

- `store/apple/screenshot-copy-b-latest-build/en-US/APP_IPHONE_65/01-build-semester.png`
- `store/apple/screenshot-copy-b-latest-build/en-US/APP_IPHONE_65/02-review-before-save.png`
- `store/apple/screenshot-copy-b-latest-build/en-US/APP_IPHONE_65/03-semester-ready.png`
- `store/apple/screenshot-copy-b-latest-build/en-US/APP_IPHONE_65/04-today-next-move.png`
- `store/apple/screenshot-copy-b-latest-build/en-US/APP_IPHONE_65/05-plan-week.png`
- `store/apple/screenshot-copy-b-latest-build/en-US/APP_IPHONE_65/06-widgets-sync.png`
- `store/apple/screenshot-copy-b-latest-build/en-US/APP_IPHONE_65/07-real-home-widgets.png`

Review sheet:

- `qa/back-to-school-2026/latest-build-copy-b-image2-candidates/latest-build-copy-b-image2-final-contact-sheet.png`

## Gate

Each Image 2.0 result must pass:

- exact size: `1242x2688`
- source UI preservation: no fake/redrawn StudyPlanner UI
- minimal Apple-like style

Status:

- Direct Image 2.0 cache size: failed (`853x1844`)
- Exact-size derivatives: passed dimensions after resize (`1242x2688`)
- Visual direction: strong minimal Apple-like direction using latest Build 77 UI
- Upload status: not upload-safe under current rules; do not use for final PPO/upload

Do not block nomination on this B set. The nomination-safe path remains the final-upload packet with current live ASC previews as Copy A/control. For B, use the outcome-based manual Image 2.0 queue and pass `npm run check:copy-b-image2`.

## Items

- latest-en-US-01: qa-screenshots/back-to-school-2026-native/app-05-import-choice.png
- latest-en-US-02: qa-screenshots/back-to-school-2026-native/app-06-review.png
- latest-en-US-03: qa-screenshots/back-to-school-2026-native/app-07-semester-ready.png
- latest-en-US-04: qa-screenshots/back-to-school-2026-native/app-08-today.png
- latest-en-US-05: qa-screenshots/back-to-school-2026-native/app-09-focus.png
- latest-en-US-06: qa-screenshots/back-to-school-2026-native/app-10-widgets.png
- latest-en-US-07: qa-screenshots/back-to-school-2026-native/widget-02-normal-medium.png
