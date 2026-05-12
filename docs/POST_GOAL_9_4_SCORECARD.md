# Post-Goal 9.4 Scorecard

Date started: 2026-05-12  
Branch: `v1-3-post-goal-aso-submission-master`  
Starting commit: `e766ddaf17c9954ab1aaf53e09be8dbe4b6b0b8e`  
Target score: 9.4/10 minimum, 9.7/10 stretch  
Baseline posture: Treat the app as **not submission-ready** until screenshots, StoreKit, ASO/localization, App Review handoff, and widget proof are complete.

## Initial Weighted Score

Initial weighted score before implementation in this branch: **7.82/10**.

Current evidence-adjusted score after screenshot capture, contact-sheet proof, targeted large-text fix, core action large-text proof, manual-add/edit-item/filtered-calendar/import-path capture states, locale-aware month grid coverage, 24-hour date formatting coverage, source-tested VoiceOver labels, native widget Home Screen proof, native widget empty/needs-check proof, current-date capture seed fix, widget refresh-after-completion/edit/add proof, widget day-boundary code/build proof, and app icon Home Screen proof: **9.05/10**.

This is intentionally lower than the prior v1-2 audited 8.88 because this score includes new ASO, localization, screenshot, App Store submission, and handoff requirements that were not completed by v1-2.

| Category | Weight | Initial | Weighted | Evidence | Root cause | Proposed fix | Status | Retest |
| --- | ---: | ---: | ---: | --- | --- | --- | --- | --- |
| Core product promise clarity | 8 | 8.6 | 0.688 | Onboarding and Today now center reviewed schoolwork and next action: `src/screens/OnboardingScreen.tsx`, `src/screens/TodayScreen.tsx` | Product thesis is strong in app, weaker in ASO copy/handoff | Align App Store copy, screenshots, and onboarding around checked work -> trusted plan -> visible next action | In progress | Pending screenshots |
| End-to-end functionality | 10 | 8.5 | 0.850 | Latest `npm run test` 40/40; prior audit fixed invalid dates/import trust and current-date capture seed drift; simulator proof shows completing, editing, and adding work updates app state, App Group widget snapshot, installed widgets, and capture-only Manual Add/Edit Item states | Full simulator e2e matrix still missing | Run simulator flows and widget scripts; document failures honestly | In progress | Partial e2e proof |
| Data integrity and trust | 10 | 8.7 | 0.870 | `src/logic/importTrust.ts`, `tests/importTrust.test.ts`, production verify passed | Endpoint/parser and duplicate import proof remain limited | Add submission docs and targeted tests only if subagents find high-risk gaps | In progress | Pending |
| Feature usefulness | 8 | 8.1 | 0.648 | Today/Calendar/Week/Classes/Widgets are functional; docs still flag graphs/preview ambiguity | Some surfaces still feel dashboard-like or screenshot-driven | Simplify/hide low-value surfaces if screenshots or agents show confusion | In progress | Pending |
| UX clarity for a 9-year-old | 7 | 8.4 | 0.588 | Plain labels exist: Today, Calendar, Week, Classes, Check Work, Widgets | Some adult terms remain: Sync, automation, forecasting, product copy | Apply clarity pass to labels/captions/docs/paywall | In progress | Pending |
| Middle-school stress reduction | 6 | 8.2 | 0.492 | Today hero is next-action oriented; onboarding uses calm language | Today still includes many analytics below the hero | Use screenshot audit to decide whether to move/hide dense cards | In progress | Pending |
| Apple-native visual design | 10 | 8.5 | 0.850 | v1-2 visual audit, premium components, and fresh contact sheet at `artifacts/post-goal-aso-submission/45-final-contact-sheet.png` | Visual proof now covers core app screens, app icon/Home Screen, native widgets, Manual Add, Check Work edit item, filtered Calendar, import-path states, and several large-text core action states, but not iPad or product-loaded paywall | Capture remaining proof states and patch only obvious polish issues | In progress | Partial: 41 raw PNGs captured |
| Graphic design identity and screenshot quality | 8 | 8.1 | 0.648 | Fresh raw screenshots now exist for onboarding, Today, Add School Stuff, scan/upload/processing import states, Check New Work, duplicate/imported found-work states, Check Work edit item, Manual Add, Calendar, filtered Calendar, Week, Classes, Widget Setup, themes, app icon/Home Screen, native widgets, native widget empty/needs-check states, widget refresh, paywall failure, and large-text core action states | Screenshot story is materially stronger but still incomplete for App Store upload, iPad, StoreKit, and several edge states | Finish required raw PNG set; export App Store-sized assets after StoreKit/iPad proof | In progress | Partial contact sheet captured from 43 PNGs |
| Customization richness and simplicity | 5 | 8.1 | 0.405 | Theme context, widget styles, class colors exist; `34-theme-customization.png` and `35-class-color-customization.png` captured | Personalization is useful but full widget preference persistence proof is still missing | Verify class color/theme/widget persistence and screenshot appeal | In progress | Partial screenshot proof |
| Widget usefulness and refresh behavior | 8 | 9.6 | 0.768 | Widget tests pass; native scope small/medium; bridge exists; installed small/medium Home Screen screenshots captured with current May 2026 labels; native empty and needs-check states are captured with App Group payload proof; completing, editing, and adding assignments updated the App Group snapshot and refreshed installed widgets; day-boundary labels/urgency are render-time and timeline refreshes at 00:01 local | Overnight visual rollover screenshot not captured | Optional overnight screenshot after StoreKit/screenshot blockers | In progress | Empty/needs-check/completion/edit/add refresh proof captured; day-boundary code/build proof passed |
| Onboarding conversion quality | 9 | 8.5 | 0.765 | Onboarding has emotional promise, review proof, widgets, first action path; all five onboarding screenshots captured | Paywall/value timing and first-run analytics are still unproven | Use captured story for ASO and test skipped-onboarding/first-action flows | In progress | Partial screenshot proof |
| Paywall conversion and monetization trust | 5 | 7.4 | 0.370 | `check:iap` passes; StoreKit-backed code; IAP IDs preserved | Product load and purchase/restore not sandbox-proven | Document StoreKit blockers; improve copy only if safe | Pending | Pending |
| ASO metadata and localization readiness | 10 | 4.7 | 0.470 | Official research doc exists; prior marketing files are untracked | Full metadata packs, localized captions, keywords, CPP/PPO missing | Create ASO master system and localized packs | Pending | Pending |
| Submission handoff completeness | 6 | 4.8 | 0.288 | Starting state and research docs created | App Review notes, screenshot inventory, exact metadata, blockers not complete | Build complete handoff doc | Pending | Pending |
| Code health, performance, accessibility, localization implementation | 6 | 8.2 | 0.492 | Typecheck/test pass; GitNexus indexed; `44-accessibility-large-text.png` plus `49`-`52` large-text core action screenshots captured; locale-aware month grid tests cover Sunday/Monday/Saturday starts; date format tests cover `fr-FR` and `en-GB` 24-hour labels; visual planner surfaces now have source-tested VoiceOver labels | Hardcoded English, limited UI localization, full simulator VoiceOver traversal, contrast proof, and real localized screenshots remain incomplete | Fix quick wins only; document deferred implementation | In progress | Partial large-text, locale-date, and source-label proof |

Total weighted score at branch start: **7.82/10**. Current evidence-adjusted score: **9.05/10**.

## Current Submit Recommendation

**No-submit.** The app code baseline is healthy and the core raw screenshot story is now partially captured, but the post-goal ASO/submission package is not complete. The largest blockers are StoreKit sandbox proof, products-loaded paywall proof, support URL confirmation, iPad screenshot strategy, localized ASO/native-speaker review, and final App Review/simulator QA.

## Score Movement Log

| Cycle | Objective | Score before | Score after | Evidence | Continue/stop |
| --- | --- | ---: | ---: | --- | --- |
| 1 | Branch safety, official Apple research, baseline commands | 7.0 assumed | 7.82 | `POST_GOAL_STARTING_STATE.md`, `APPLE_ASO_AND_SUBMISSION_RESEARCH.md`, command results | Continue |
| 2 | Data trust, date safety, ASO/submission package, no-submit guards | 7.82 | 8.28 | 31/31 tests, stricter submission verification, safer metadata, 950 use cases, 50 root problems, one real screenshot | Continue |
| 3 | Residual trust edge cleanup | 8.28 | 8.35 | 32/32 tests; parser grade items blocked until reviewed; reminder/calendar side effects skip invalid legacy due dates | Continue |
| 4 | Screenshot evidence recovery | 8.35 | 8.52 | Capture-mode build launched; 22 raw simulator PNGs plus `45-final-contact-sheet.png` captured; products-loaded paywall and native widgets still missing | Continue |
| 5 | Targeted Dynamic Type proof | 8.52 | 8.58 | `44-accessibility-large-text.png`; `npm run typecheck`; shared premium header/hero/metric/warning/dock labels capped to prevent catastrophic layout at accessibility content size | Continue |
| 6 | Locale/date proof | 8.58 | 8.62 | Month calendar respects locale week-start logic; `npm run typecheck`; `npm run test` 34/34 with Sunday/Monday/Saturday week-start coverage | Continue |
| 7 | 24-hour date formatting proof | 8.62 | 8.64 | Due-date and Week Plan date labels use preferred locale; `npm run typecheck`; `npm run test` 35/35 with `fr-FR`/`en-GB` 24-hour date coverage | Continue |
| 8 | Visual-surface VoiceOver labels | 8.64 | 8.66 | `src/components/PremiumUI.tsx`, `src/components/InsightCards.tsx`, `tests/accessibilitySource.test.ts`; `npm run typecheck`; `npm run test` 36/36 | Continue |
| 9 | Native widget and current-date screenshot proof | 8.66 | 8.76 | Capture/demo seed dates roll relative to capture day; `npm run test` 37/37; native small/medium widgets installed and captured as `30-small-widget-home-screen.png` and `31-medium-widget-home-screen.png`; contact sheet regenerated from 25 PNGs | Continue |
| 10 | Widget refresh-after-completion proof | 8.76 | 8.86 | Tapped Complete for Lab Report in the simulator; App Group snapshot changed to Reading Reflection, This Week 4, monthly due 7, completed 4; installed small/medium widgets refreshed in `46-widget-refresh-after-completion.png`; contact sheet regenerated from 26 PNGs | Continue |
| 11 | App icon Home Screen proof | 8.86 | 8.87 | Captured `40-app-icon-home-screen.png`; contact sheet regenerated from 27 PNGs | Continue |
| 12 | Widget refresh-after-edit proof | 8.87 | 8.90 | Edited Reading Reflection to Reflection Draft in Assignment Detail; App Group snapshot and installed widgets rendered the edited title in `47-widget-refresh-after-edit.png`; contact sheet regenerated from 28 PNGs | Continue |
| 13 | Widget refresh-after-add proof | 8.90 | 8.92 | Added Field Notes to Science Lab in normal mode; App Group snapshot and installed widgets rendered the added assignment in `48-widget-refresh-after-add.png`; contact sheet regenerated from 29 PNGs | Continue |
| 14 | Widget day-boundary behavior | 8.92 | 8.95 | WidgetKit template now recomputes label/urgency at render time and refreshes at 00:01 local; `npm run typecheck`, `npm run test` 38/38, and iOS simulator build passed | Continue |
| 15 | Core action accessibility proof | 8.95 | 8.98 | Check Work, Assignment Detail, Widget Setup, and Paywall now expose stronger labels/hints and bounded text scaling; captured `49`-`52` at `accessibility-extra-extra-large`; `npm run typecheck`, `npm run test` 39/39, and contact sheet regenerated from 33 PNGs | Continue |
| 16 | Missing screenshot state recovery | 8.98 | 8.99 | Added capture-only states for Manual Add and expanded Check Work edit item; captured `13-manual-add.png` and `17-check-new-work-edit-item.png`; `npm run typecheck`, `npm run test` 40/40, and contact sheet regenerated from 35 PNGs | Continue |
| 17 | Filtered Calendar proof | 8.99 | 9.00 | Added capture-only Calendar course-filter state; captured `23-calendar-filtered-class.png`; `npm run typecheck`, `npm run test` 40/40, and contact sheet regenerated from 36 PNGs | Continue |
| 18 | Import-path screenshot proof | 9.00 | 9.03 | Added capture-only scan/upload/processing/duplicate/imported states; captured `11`, `12`, `14`, `18`, and `19`; `npm run typecheck`, `npm run test` 40/40, capture-mode iOS rebuild passed, and contact sheet regenerated from 41 PNGs | Continue |
| 19 | Native widget edge-state proof | 9.03 | 9.05 | Added capture-only widget-empty/widget-needs-check snapshot states; captured `32` and `33`; App Group payloads prove empty has no due items and needs-check keeps unreviewed work out of nextDue while showing reviewQueueCount 3; contact sheet regenerated from 43 PNGs | Continue |

## Minimum To Claim 9.4

1. StoreKit/IAP status must be either sandbox-proven or explicitly marked as a remaining submit blocker.
2. Required screenshot folder must contain real PNGs or missing items must be intentionally excluded with reasons.
3. ASO metadata, localization packs, PPO, custom pages, and Apple Search Ads seeds must be complete and claim-safe.
4. App Review notes and submission handoff must let another person submit without guessing.
5. All high-risk subagent findings must be fixed, deferred, or blocked with evidence.
