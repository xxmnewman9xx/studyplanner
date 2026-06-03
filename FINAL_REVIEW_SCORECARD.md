# Final Review Scorecard

Baseline: verified build `1.0.2 (32)` fresh b32 screenshots and source/config review.

Final decision: **Do not submit yet.**

## Reviewer Board

| Reviewer | Score | Primary concern |
|---|---:|---|
| Apple App Review | 6.8 | Watch/Lock claims and native build config mismatch. |
| Apple Editorial | 8.1 | Strong story, but Paywall/Focus clipping and unsupported Watch beat hurt polish. |
| Localization QA | 6.2 | Runtime hardcoded English remains across current screens. |
| Student UX | 8.4 | Useful, clear student value; some labels feel dense. |
| Widget Reviewer | 7.0 | Home widgets plausible; Lock/Watch unsupported. |
| Watch Reviewer | 4.2 | No real watchOS surface. |
| Monetization Reviewer | 7.8 | Clear value; paywall screenshot not clean. |
| Product Quality Reviewer | 7.5 | Native build-number source mismatch must be fixed. |

Overall average: **7.0 / 10**.

## Required Final Averages

Anything below `8.8` is flagged.

| Area | Average | Flag | Reason |
|---|---:|---|---|
| Home | 8.3 | flagged | Good, but localization and bottom spacing need proof. |
| Forecast | 8.5 | flagged | Strong screenshot, but hardcoded/fixture wording risk remains. |
| Review Inbox | 8.9 | pass | Best current surface. |
| Widgets | 7.2 | flagged | Widget Studio is good; Lock/Watch claims are not supported. |
| Watch | 4.2 | flagged | No real Watch target/surface. |
| Paywall | 7.8 | flagged | Plan card clipped and localization needs proof. |
| Localization | 6.2 | flagged | Hardcoded English blocks localized submission. |

## What To Fix

1. Sync native iOS build number to build `32` in source before archiving.
2. Remove Apple Watch and Lock Screen widget claims unless real shipped surfaces exist.
3. Localize current runtime strings, not just catalog keys.
4. Recapture Paywall and Focus without clipped bottom content.
5. Recapture all locales from the rebuilt b32 archive.

## What To Capture

Fresh final set per locale:

1. Home
2. Semester Organized / Classes
3. Review Inbox
4. Forecast
5. Widget Studio / Customize
6. Supported widget showcase
7. Focus
8. Notes
9. Classes detail if distinct
10. Paywall

Do not capture Watch for this submission.

## What To Use

Current best b32 source screenshots:

- `13-review-inbox.png`
- `12-scan.png`
- `14-forecast.png`
- `11-semester-organized-classes.png`
- `10-home.png`
- `15-widget-studio.png`
- `18-notes.png`

Current rejected b32 source screenshots:

- `16-widget-watch-showcase.png`: not Watch.
- `17-focus.png`: bottom action clipped.
- `19-paywall.png`: plan card clipped.

## App Preview Flow

Use: Scan -> Review Inbox -> Home -> Forecast -> Widgets -> Focus -> Paywall.

Replace the requested Watch beat with Focus or Widget Studio unless a real Watch target is available.
