# App Preview Source Plan

Baseline: build `1.0.2 (32)` fresh simulator screenshots.

Current source folder:

- `AppStore/Build32ReadinessCapture-2026-06-01/screenshots/en-US/`

Do not use older screenshots.

## iPhone Preview Storyboard

| Beat | Story | Current source | Status |
|---:|---|---|---|
| 1 | Scan syllabus | `12-scan.png` | good |
| 2 | Semester organized automatically | `11-semester-organized-classes.png` | good after localization |
| 3 | Review Inbox | `13-review-inbox.png` | strongest |
| 4 | Forecast | `14-forecast.png` | good after localization |
| 5 | Widgets | `15-widget-studio.png` | good after localization |
| 6 | Focus | `17-focus.png` | recapture; CTA cut off |
| 7 | Notes or Classes | `18-notes.png` or `11-semester-organized-classes.png` | good after localization |
| 8 | Call to action | `19-paywall.png` | recapture; plan cut off |

Remove the Apple Watch beat from this submission unless a real watchOS target/surface is added and captured.

## iPad Preview Source Plan

No fresh iPad b32 screenshots were captured in this pass. Capture iPad from the rebuilt b32 archive after the iPhone fixes:

1. Dashboard/Home
2. Scan
3. Review Inbox
4. Forecast
5. Classes
6. Widget Studio
7. Focus
8. Paywall

## Production Preview Rules

- Use real app UI only.
- Avoid fake native widget placement unless captured from SpringBoard/WidgetKit gallery.
- Avoid Watch claims.
- Localize overlay text separately from raw UI only after the underlying localized UI is clean.
- Do not include any screen with clipped price cards or clipped CTAs.

## Replacement For Watch Beat

Use one of:

- Focus session starts from Forecast.
- Widget Studio customization.
- Review Inbox confirmation.

Best sequence for submission: Scan -> Review -> Home -> Forecast -> Widgets -> Focus -> Paywall.
