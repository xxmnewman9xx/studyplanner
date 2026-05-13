# Reference UI/UX Revamp Plan

Date: 2026-05-13
Branch: v1-4-reference-one-to-one-uiux-revamp
Starting commit: 12a560c
Reference image: /Users/mattnewman/Documents/studyplanner_ui_reference.png
Raw screenshot evidence: artifacts/raw-customization-video-screenshots

## Mission

Revamp StudyPlanner toward the saved reference without redesigning stable data, IAP, or unsupported widget systems. The app should make the loop obvious:

1. Scan
2. AI Reads
3. Plan
4. Focus
5. Review

## Subagent Findings

Reference Match Director: current match is 6.4/10, target 9.2/10. Biggest gaps are oversized screen hierarchy, technical Scan/Found Work copy, underpowered Widget Studio, missing Focus/Progress emphasis, and weak iPad/reference proof. Decision: improve real app/screens and raw proof screenshots, not a new marketing composite renderer.

9-Year-Old Product Clarity Agent: current clarity is 5.8/10, target 9.2/10. Rename the main loop around Scan, make Plan and Focus obvious, and replace jargon like Check Work, parser, confidence, and candidate with Found Work, Looks Good, Needs Date, and Add Checked Work to Plan.

Premium Apple-Native UI Agent: current UI is 8.2/10, target 9.4/10. Tighten cards, shadows, radii, whitespace, dock density, and widget readability. Keep the app bright, white, colorful, and native-feeling.

Widget Studio Product Agent: current Widget Studio is 5.8/10, target 9.1/10. It needs preview-first structure, style swatches, background/theme cards, icon/layout controls, class color mapping, and saved presets. Risk: native widgets currently support small/medium fixed layouts, so this pass will improve supported small/medium previews and snapshot styling without claiming unsupported families.

Scan + Parser Trust Agent: current parser trust is 6.8/10, target 8.8/10. Keep the trust gate: found work stays review-only until accepted. Add honest large syllabus warnings, progress copy, duplicate/no-date tests, and source evidence wording. Do not claim perfect 80-page parsing.

Contrast and Theme QA Agent: current contrast score is 61/100, target 95/100. Dark mode has hardcoded light cards, weak widget due/icon contrast, and bottom dock overlap. Fix shared component contrast and add better widget foreground selection.

Feature Flow Agent: current flow is strong but labels blur Scan, Widget Studio, and Plus. Keep all existing flows working while clarifying copy and capture states.

Regression Sentinel: current guarded baseline is 9.25/10, target 9.4/10. Preserve production no-demo state, IAP IDs, trusted import behavior, widget small/medium scope, and exact `EXPO_PUBLIC_STORE_CAPTURE=1` behavior.

## Implementation Priorities

1. Fix global contrast and visual tokens in `src/theme.ts` and `src/components/PremiumUI.tsx`.
2. Change the main dock to Today, Scan, Plan, Classes, More while preserving internal routes.
3. Rewrite onboarding, Today, and Scan copy around the five-step loop.
4. Make Scan the first entry point and Found Work the review state.
5. Rebuild Widget Studio presentation around live preview, presets, swatches, backgrounds, icons, layouts, and supported small/medium widgets.
6. Add parser readiness tests for long syllabi, duplicates, and no-date honesty.
7. Capture raw proof screenshots to `artifacts/reference-one-to-one-revamp`.

## Design System Changes

- Bright light surfaces: whiter cards, softer canvas, smaller decorative washes.
- Dark surfaces: no hardcoded white cards with dark text tokens.
- Paired warning tokens: warning background, warning text, warning muted.
- Widget text rules: readable foreground for every widget background, icon, due label, and urgency chip.
- Dock spacing: five top-level labels, more bottom inset, no overlap in capture screens.
- Cards: slightly tighter radii/shadows and clearer hierarchy.

## Screen Changes

Onboarding: show Scan Anything, AI Reads It, Plan It All, Focus Daily, Review & Improve.

Today: make the hero say what to do next, keep Focus action visible, and rename Needs Check actions to Review Found Work.

Scan: header becomes Scan Anything. Actions become Scan Document, Upload File, Type It In. Loading becomes AI Is Reading. Review becomes Found Work.

Found Work: show found count, Looks Good, Needs Date, Needs Check, source evidence, and Add Checked Work to Plan.

Plan/Calendar/Week: preserve month/week functionality, label Plan clearly, and keep checked-work language.

Classes: keep class cards and class colors readable in light/dark mode.

Widget Studio: make it preview-first with supported small/medium controls, theme/background/icon/layout/class color panels, and saved preset language.

Widgets: small/medium only. Improve in-app previews and snapshot style contrast without claiming large or lock-screen support.

Paywall/Settings: light visual polish only; preserve StoreKit IDs and restore behavior.

## Parser 80-Page Syllabus Readiness

This pass will not claim perfect extraction. The responsible behavior is:

- Warn that very long files may take time and need review.
- Keep all found work out of trusted planner surfaces until accepted.
- Keep duplicate/no-date/invalid-date behavior tested.
- Show source snippets and honest review wording.
- Document that page/chunk provenance remains a future hardening item unless implemented.

## Screenshot Proof Needed

Final raw screenshots go to `artifacts/reference-one-to-one-revamp`:

- Core: onboarding, Today, Scan, Found Work, Calendar, Week, Classes, Class Detail, Assignment Detail, Widget Studio, Theme Customization, Paywall.
- Widgets: Due Next, Today/This Week, Needs Check, Week, Class Focus, Empty.
- Themes: Sunset, Ocean, Forest, Lavender, Midnight, Candy, Minimal, Create Your Own.
- Dark mode: Today, Scan, Calendar, Widget Studio, Widget.
- iPad: Today, Calendar, Widget Studio.

## Risk Notes

- Do not change purchase product identifiers or fake StoreKit.
- Do not let capture data persist in production.
- Do not add unsupported widget families.
- Do not change trusted parser import behavior except through tests and safer copy.
- Commit only intentional source/docs/screenshot artifacts for this goal.
