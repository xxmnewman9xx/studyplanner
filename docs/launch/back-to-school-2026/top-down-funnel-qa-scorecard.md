# Back-to-School Top-Down Funnel QA Scorecard

Generated: 2026-07-06

## Funnel Presentation And Backend Wiring

| Step | Presentation | Backend / state contract | Evidence |
| --- | --- | --- | --- |
| Onboarding name | Single first-name field with one Continue CTA. | Stores the onboarding name in preferences before semester setup. | `qa-screenshots/back-to-school-2026-native/app-01-name.png` |
| Personal preview | White Apple-style semester preview with automatic class colors, no color picker, no student-type or goal branching. | Saves the default graphite system; dashboard accents and widget snapshots resolve from the default white system. | `app-02-color-blue.png`, `app-03-color-orange.png`, `app-04-color-graphite.png` |
| Build semester | Three choices only: camera scan, paste syllabus, add manually. | Routes through the hard unlock gate before scan/paste/manual import; no syllabus data saves before review approval. | `app-05-import-choice.png` |
| Review import | Shows trusted import summary, duplicate/review controls, and guarded apply CTA. | Parsed import rows stay pending until approved; duplicate rows require explicit handling. | `app-06-review.png` |
| Apply success | Semester-ready confirmation, white system and class-color proof, health ring, next move. | Uses approved semester data, semester narrative, and native widget snapshot builder. | `app-07-semester-ready.png` |
| Today dashboard | Action-first next task, urgency, class context. | Reads active semester tasks/classes and planner intelligence. | `app-08-today.png` |
| Focus | Shows active focus state from the generated schedule. | Uses focus blocks tied to approved assignments. | `app-09-focus.png` |
| Widgets | Shows synced widget recommendations and real preview data. | Calls `buildNativeWidgetSnapshots`; app capture uses the Release binary with the widget extension installed. | `app-10-widgets.png` |
| Real Home Screen widgets | App Store preview slide uses a raw SpringBoard/WidgetKit placement screenshot. | Source is `qa-screenshots/live/device-studyplanner-two-small-week-final-candidate.png`; no fake widget UI. | `store/apple/screenshot/en-US/APP_IPHONE_65/07-real-home-screen-widgets.png` |

## Automated QA

| Check | Result |
| --- | --- |
| TypeScript | Passed |
| Widget integrity | Passed |
| Localization | Passed |
| Back-to-School widget fixture QA | Passed |
| Release QA funnel | Passed |
| Hard paywall gate | Passed |
| IAP config | Passed |
| Back-to-School asset preflight | Passed |
| Native app capture registration | Passed, 10/10 captures found |
| Launch readiness wrapper | Passed, with remaining readiness blockers recorded |

## Score

Current funnel score: **9.1 / 10**.

The in-app onboarding, review, success, dashboard, and widget preview funnel is release-testable from a real Release simulator build. The score is not 10/10 because two plan items still require external/manual evidence that cannot be truthfully fabricated:

- WidgetKit matrix capture is still incomplete: `qa/back-to-school-2026/widget-capture-ingest.json` reports `0/8` required runbook captures.
- Supplemental URL registration is still incomplete: `qa/back-to-school-2026/supplemental-url-registry.json` reports `0/5` URLs.
- GPT Image 2.0 polishing in the Mac ChatGPT app was not automated from this environment; prompts are prepared in `docs/launch/back-to-school-2026/gpt-image-2-localized-preview-prompt-pack.md`.

## Next 10/10 Work

1. Capture the eight real WidgetKit states named in `docs/launch/back-to-school-2026/native-screenshot-qa-runbook.md`.
2. Register the five supplemental URLs with `npm run register:back-to-school-supplemental-urls`.
3. Run each localized preview through GPT Image 2.0 manually using the prompt pack, preserving the real app/widget pixels.
4. Rerun `npm run check:back-to-school-launch` and confirm the widget and supplemental blockers clear.
