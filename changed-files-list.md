# Changed Files List

Date: 2026-05-26

Summary:
- Added the shared widget theme source: `src/widgets/widgetThemes.ts`.
- Updated widget-related app surfaces: `App.tsx`, `src/screens/OnboardingScreen.tsx`, `src/screens/MoreScreen.tsx`, `src/services/widgetSnapshot.ts`, `src/widgets/StudyPlannerWidgets.tsx`, `src/components/AppleComponents.tsx`, and `src/data/defaultPlanner.ts`.
- Updated subscription/paywall and entitlement surfaces: `src/screens/UpgradeScreen.tsx`, `src/components/PremiumGate.tsx`, `src/services/subscriptions.tsx`, and `src/services/purchaseValidation.ts`.
- Updated localization and release validation scripts: `localized-app-strings/core-launch-strings.json`, `scripts/check-localization-completeness.mjs`, `scripts/check-iap-config.mjs`, `scripts/check-scenarios.mjs`, `scripts/check-widget-snapshots.ts`, `scripts/check-widget-integrity.ts`, and related release guardrails.
- Updated release-facing documentation and localization metadata to match the hard post-onboarding subscription model.
- Added final proof reports for language cleanup, hard-paywall routing, widget theme source of truth, Widget Studio simplification, widget customization, Home Screen widget proof, runtime localization, screenshot coverage, and GitNexus change detection.

Native screenshot output is intentionally kept in the ignored `AppStore/RawScreenshots-FinalWidgetLocalization-NoFree-2026-05-26` folder.
