# App Preview Asset Readiness

Date: 2026-05-12
Folder: `artifacts/overnight-steroids-release-pass`

## Verdict

Pass for graphic-design handoff. The screenshots are deterministic capture-mode proofs, not direct App Store uploads yet. They are clean of dev warning overlays after the capture-mode LogBox fix.

## Captured Assets

| File | Surface |
| --- | --- |
| `01-onboarding.png` | First onboarding screen |
| `02-today.png` | Today dashboard |
| `03-calendar.png` | Monthly calendar |
| `04-review-inbox.png` | Review Inbox |
| `05-this-week.png` | This Week planner |
| `06-class-hub.png` | Class Hub |
| `07-widget-studio.png` | Widget Studio |
| `08-widget-customization.png` | Widget customization controls |
| `09-small-native-widget.png` | Small native widget |
| `10-medium-native-widget.png` | Medium native widget |
| `11-paywall.png` | Plus paywall |
| `12-contact-sheet.png` | Contact sheet |

## Asset QA

- Correct simulator: StudyPlanner-Codex-iPhone `6CBE6A7A-1778-406F-9F5B-3FDAA45310CE`.
- Status bar and battery are deterministic.
- Capture data is deterministic and only enabled by `EXPO_PUBLIC_STORE_CAPTURE=1`.
- App screenshots no longer show the Expo/RN warning pill.
- Native widget screenshots remain separate proof assets and should be recreated from the final signed build before App Store submission.

## Graphic Design Notes

- Use the contact sheet for selection and layout planning.
- Today, Calendar, Review Inbox, Widget Studio, and native widgets are the strongest first five App Store story beats.
- Paywall is acceptable for trust proof, but final App Store Connect IAP setup should be complete before using Lifetime messaging in marketing.
