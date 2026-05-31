# IMPLEMENTATION_PLAN.md

Date: 2026-05-31

## Visual Spec Source

Primary: uploaded Life Studio / Student Life OS North Star image.

Secondary: existing approved GPT Image assets under:

- `marketing_exports/app_preview_slides_gpt_image_2/`
- `artifacts/life-studio-onboarding-vs-northstar.png`
- `artifacts/student-life-os-contact-sheet-vertical.png`

New GPT Image generation is not required for this pass because the uploaded North Star is specific, approved, and covers Life Studio, feed preview, Widget DNA, Watch DNA, and OS behavior. Missing exact per-screen specs are documented as a weakness to keep usage low.

## Build Order

1. Shared OS system
   - Remove decorative orb language from shared components.
   - Make `StudentLifeShell` simpler, whiter, more Apple-native.
   - Make feed/insight/metric/action primitives read like the North Star.
   - Add widget/watch preview primitives if missing.

2. Life Studio
   - Keep onboarding first-run as the flagship visual.
   - Increase preview dominance.
   - Make identity, behavior, Widget DNA, Watch DNA, and friction choices clearly affect preview cards.

3. Main screens
   - Home: make Student Life Feed the product, not a Today dashboard.
   - Scan/Import: make source choice and review trust feel premium and simple.
   - Review Inbox: keep parser truth, reduce admin feel.
   - Forecast: show risk/free time/focus blocks as OS adaptation.
   - Classes: class hubs with colorful next-work signals.
   - Focus: one timer, one recommended block, one next action.
   - Notes: capture what changes the plan.
   - Widgets/Life: make widgets/watch feel subscription-worthy.
   - Paywall: sell adaptive OS value, not generic feature bullets.

4. QA
   - Run required npm checks.
   - Build/run iOS simulator with simulator capture bypass only for QA states.
   - Capture required screenshots past onboarding and paywall.
   - Generate contact sheet.
   - Score screenshots with required reviewer roles.
   - Iterate any screen below 9/10 as time permits.

5. Git safety
   - Run GitNexus impact before each edited symbol.
   - Warn on HIGH/CRITICAL risk.
   - Run `npx gitnexus detect-changes --repo studyplanner` before commit.
   - Commit only scoped files.

## Current Blast-Radius Expectation

- `StudentLifeShell`: broad frontend impact. Called by all main screens. Visual-only changes, but high screenshot blast radius.
- `LifeStudioOnboardingScreen`: onboarding-only functional impact. Must not change finish/paywall path.
- `AppContent`: avoid unless absolutely required because it controls paywall, persistence, tab routing, capture routing, and widget sync.
- Screen components: medium visual risk, low backend risk if props/contracts are preserved.

## Minimum Viable 10/10 Pass

- Centralize the visual DNA in `StudentLifeSystem`.
- Make the actual post-paywall home look like the North Star phone preview.
- Make Life Studio changes visibly alter feed cards, forecast copy, widget preview, and watch preview.
- Avoid changing parser/IAP/storage behavior.
- Use existing simulator capture tooling for proof.

## Known Constraints

- This is an Expo React Native app, not pure SwiftUI.
- Existing native widgets and StoreKit need to remain compatible.
- Some current screenshots in the repo are stale and should not be treated as final proof.
- Exact Apple Watch complications are previews in-app; native Watch implementation is not currently present.
