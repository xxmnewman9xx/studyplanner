# App Store Readiness Report

Baseline reviewed: `StudyPlanner: Syllabus AI` `1.0.2 (32)`.

Fresh evidence only:

- Installed simulator app verified as `com.mattnewman.studyplanner` `1.0.2 (32)`.
- Widget extension verified as `com.mattnewman.studyplanner.widgets` `1.0.2 (32)`.
- Fresh screenshots: `AppStore/Build32ReadinessCapture-2026-06-01/screenshots/en-US/`.
- Contact sheet: `AppStore/Build32ReadinessCapture-2026-06-01/contact-sheet.png`.
- Older screenshots were discarded for this pass.

Verdict: **Do not submit yet.** The current app is visually much stronger than the old candidate, but the submission still has launch-blocking App Review and localization risk.

## Release Blockers

| Severity | Issue | Evidence | Required fix |
|---|---|---|---|
| critical | Native build config is inconsistent. `app.json` says build `32`, but source `ios/StudyPlannerSyllabusAI/Info.plist` still says `29`. The local b32 build first produced parent app `29` and widget extension `32`. | Xcode warning: extension `32` must match parent `29`; installed capture artifact was corrected after build for screenshoting only. | Sync native iOS build number to `32` before archive. Do not rely on a patched simulator artifact. |
| critical | Apple Watch claims are not review-safe. | No watchOS target found. Fresh b32 capture did not show a real Watch surface. Source contains in-app watch-style settings/previews only. | Remove Watch from submission screenshots/App Preview unless a real watchOS target or real Watch surface exists. |
| critical | Lock Screen widget claims are not review-safe. | `app.json` and Swift widget targets support only `systemSmall` and `systemMedium`; no accessory families. | Do not claim Lock Screen widgets until accessory families are configured and tested. |
| critical | Current build still has hardcoded English on key screens. | Runtime source leaks remain in Home, Forecast, Classes, Widget Studio, widget strings, and watch preview text. | Localize visible strings before localized screenshots and submission. |
| major | Paywall is not screenshot-ready. | `19-paywall.png` cuts off the yearly plan at the bottom. | Adjust capture state/scroll or layout before App Store screenshots. |
| major | Widget Studio screenshot does not support a Watch showcase claim. | `16-widget-watch-showcase.png` shows class colors and iPhone widget setup, not a watch surface. | Capture a real supported surface or omit Watch from marketing. |

## Screen Review

| Screen | Clarity | Utility | Simplicity | Localization | Visual | Screenshot | Issue | Severity | Recommended fix |
|---|---:|---:|---:|---:|---:|---:|---|---|---|
| Onboarding | 8.9 | 8.6 | 8.8 | 7.6 | 9.0 | 8.8 | Strong flow, but only first three pages freshly captured; copy depends on localized runtime proof. | minor | Capture full localized onboarding after strings are fixed. |
| Home | 8.5 | 8.9 | 8.1 | 6.4 | 8.7 | 8.4 | Good editorial value, but bottom content is cramped by the tab bar and English leaks remain. | major | Localize and recapture with the bottom card fully visible. |
| Scan | 9.0 | 9.0 | 8.8 | 8.0 | 8.7 | 8.9 | Clear real UI. Minor repeated "syllabus into..." phrasing on one screen. | minor | Keep as a top screenshot after localized copy pass. |
| Review Inbox | 9.1 | 9.2 | 8.8 | 8.0 | 8.9 | 9.1 | Best current App Store screenshot. Strong trust/check/fix loop. | minor | Use after locale recapture. |
| Forecast | 8.7 | 8.8 | 8.2 | 6.5 | 8.9 | 8.8 | Strong visual story, but "Storm forecast" and fixture items need localization/tonal check. | major | Localize and consider less alarming fixture state for store screenshots. |
| Classes | 8.6 | 8.7 | 8.2 | 6.7 | 8.7 | 8.5 | Useful and screenshot-worthy; "What I learned" phrasing may feel odd in some locales. | major | Localize all summary strings and recapture. |
| Focus | 8.3 | 8.5 | 8.1 | 6.8 | 8.4 | 7.8 | Good surface, but bottom action is cut by the tab bar in the fresh capture. | major | Recapture with scroll/state that shows the CTA cleanly. |
| Notes | 8.5 | 8.3 | 8.4 | 7.2 | 8.6 | 8.4 | Solid secondary feature screenshot. | minor | Use only after localized notes/fixture pass. |
| Widget Studio | 8.1 | 8.4 | 7.9 | 5.9 | 8.6 | 7.7 | The current label is "Customize", not "Widget Studio"; many controls are hardcoded English. | critical | Localize and align screenshot caption to actual UI. |
| Paywall | 8.2 | 8.1 | 7.8 | 6.8 | 8.0 | 6.9 | Plan card is cut off; "APP STORE - STORE PLANS" reads internal. | major | Recapture/fix bottom plan visibility and polish trust copy. |
| Empty states | 8.4 | 8.1 | 8.8 | 7.0 | 8.5 | 8.0 | Empty Home is clear and honest. | minor | Use as QA proof, not a primary store screenshot. |
| Error states | 7.8 | 8.0 | 8.0 | 7.0 | 7.8 | 7.2 | Error-state screenshots were not part of fresh b32 capture. | major | Capture parser failure and permission-denied states before final QA signoff. |

## Screenshot Candidates

Use after localization recapture:

- `13-review-inbox.png`
- `12-scan.png`
- `14-forecast.png`
- `11-semester-organized-classes.png`
- `10-home.png`
- `18-notes.png`

Do not use yet:

- `19-paywall.png`: lower plan is cut off.
- `17-focus.png`: lower action is cut off.
- `16-widget-watch-showcase.png`: not a Watch showcase.

## Fix List Before Submission

1. Sync native iOS build number to `1.0.2 (32)` in source and rebuild without the parent/widget mismatch.
2. Remove or defer Apple Watch and Lock Screen widget claims unless real targets/families are present.
3. Localize all hardcoded runtime strings in current screens, especially Home, Forecast, Classes, Widget Studio, widgets, and watch preview copy.
4. Recapture localized screenshots from the rebuilt archive only.
5. Recapture Paywall and Focus with all primary actions and prices visible.
6. Use Review Inbox, Scan, Forecast, Classes, Home, Widget Studio, Focus, and Paywall as the core App Store story after the above fixes.
