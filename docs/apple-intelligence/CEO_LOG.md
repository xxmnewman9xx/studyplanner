# StudyPlanner 2.2 — CEO log

Running record of product decisions made during implementation. MASTER_PLAN.md is the reference; this file records where execution deviates and why.

## Environment reality (2026-09-23)
- Implementation runs in a Linux cloud container: no Xcode, no Swift compiler, no iOS Simulator, no device.
- Consequence: TypeScript, tests, eval scoring, and web-rendered UI QA are verified here. Swift (Foundation Models module, App Intents) is written against the iOS 26.5 SDK API surface but **must be compiled and device-verified by the owner** (see RELEASE_CHECKLIST.md).

## Decisions
| # | Decision | Why |
|---|---|---|
| D1 | Free before paywall = onboarding → scan/paste/manual for **every** class → Review → full Crunch Forecast + share card. **Applying** the import requires Plus. The "apply class 1 free" variant is deferred. | Delivers the aha (whole-semester forecast) before the paywall while keeping the Build 52 invariant that nothing persists into the live planner without an entitlement. A partial-unlock dashboard would touch every gate and widget path for marginal conversion gain. |
| D2 | Onboarding keeps its 3 steps; the final step now leads to "Scan your first syllabus" (camera / PDF / paste / add manually) instead of "Unlock to scan". Paywall appears after the forecast reveal, with the same screen structure. | Owner asked to keep onboarding + paywall structure and to emphasize scanning or manual input at onboarding. |
| D3 | Share card rendered in React Native (react-native-view-shot) instead of SwiftUI ImageRenderer. QR codes rendered with react-native-svg from a pure-TS encoder. | Keeps the card in the app's exact visual language, RTL and 10-locale support for free, and testable without Xcode. |
| D4 | App Intents live in the main app target via a config plugin; they read `intelligence-snapshot.json` and write `intent-inbox.json` in the App Group. No inference in intents. | Foreground-only inference rule; Siri works with the app killed. |
| D5 | Four model calls only (syllabusExtract, noteStudySet, dailyBrief, taskProposal). | Minimum inference. |
