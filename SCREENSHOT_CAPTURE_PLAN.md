# Screenshot Capture Plan

Fresh build-32 capture exists here:

- Root: `AppStore/Build32ReadinessCapture-2026-06-01/screenshots/en-US/`
- Manifest: `AppStore/Build32ReadinessCapture-2026-06-01/manifest.json`
- Contact sheet: `AppStore/Build32ReadinessCapture-2026-06-01/contact-sheet.png`
- Verified version/build: `1.0.2 (32)`

Older screenshots are not approved source material for this pass.

## Current Fresh Captures

| File | Screen | Use status |
|---|---|---|
| `00-onboarding-scan.png` | Onboarding scan | usable after locale recapture |
| `01-onboarding-review.png` | Onboarding review | usable after locale recapture |
| `02-onboarding-today.png` | Onboarding semester/calendar | usable after locale recapture |
| `10-home.png` | Home | usable after localization; check bottom card |
| `11-semester-organized-classes.png` | Classes / semester organized | usable after localization |
| `12-scan.png` | Scan | strong candidate |
| `13-review-inbox.png` | Review Inbox | strongest candidate |
| `14-forecast.png` | Forecast | strong candidate after localization |
| `15-widget-studio.png` | Widget Studio / Customize | usable after localization |
| `16-widget-watch-showcase.png` | Widget Studio lower section | do not label as Watch |
| `17-focus.png` | Focus | recapture; bottom action is cut |
| `18-notes.png` | Notes | usable after localization |
| `19-paywall.png` | Paywall | recapture; plan card is cut |
| `20-empty-home.png` | Empty Home | QA proof, not primary store art |

## Required Final Store Set

Capture only real UI from a rebuilt, unpatched archive where app and widget extension both report build `32`.

| Order | Screen | Required state |
|---:|---|---|
| 1 | Home | Active semester, 2-3 clear cards, no bottom clipping. |
| 2 | Semester Organized | Classes screen with progress, tasks, exams, and week summary. |
| 3 | Review Inbox | Parsed work waiting for confirmation, trust/check/fix visible. |
| 4 | Forecast | Workload forecast with clear next exam/task. |
| 5 | Widget Studio | Customization surface; no unsupported Watch/Lock claims. |
| 6 | Widget Showcase | Real supported Home Screen widgets or in-app widget preview clearly captioned. |
| 7 | Focus | Timer and chosen task visible, CTA not clipped. |
| 8 | Classes | Course overview, assignments/exams, no overlap. |
| 9 | Notes | Notes agenda, pinned/linked/latest stats visible. |
| 10 | Paywall | Plan cards, price, restore/trust text fully visible. |

Do not capture Watch unless a real watchOS target/surface is present.

## Locale Capture Order

For each locale, capture the 10-screen set above:

1. `en-US`
2. `es`
3. `fr`
4. `de`
5. `pt-BR`
6. `ja`
7. `ko`
8. `zh-Hans`
9. `ar`
10. `hi`

Locale QA focus:

- German/French/Portuguese: long labels and plan cards.
- Arabic: RTL layout, tab order, chips, number/date placement.
- Japanese/Korean/Chinese: mixed English fixture data and date formatting.
- Hindi: long labels in buttons/cards.

## Capture Rules

- No mockups.
- No design boards.
- No stale screenshots.
- No unsupported Watch or Lock Screen claims.
- Screenshot captions must match actual UI text: for example, current b32 says "Customize", not "Widget Studio".
