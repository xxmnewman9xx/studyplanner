# Back-to-School 2026 Accessibility and Localization Summary

Date: 2026-07-07
Release: Back-to-School Semester Kickoff
Submitted build candidate: iOS 2.0.8 build 79
Submission status: Public supplemental URL verified for App Store Connect.

## Scope

This summary supports the Back-to-School featuring nomination. It covers the new two-step semester setup story, paywall-first scan/import path, automatic class colors, semester-ready payoff, calendar widget positioning, and the existing localization/accessibility safeguards that must be rechecked on the native release build.

## Local Evidence

- `npm run check:localization` passed in the Back-to-School release cycle.
- `npm run check:first-experience` passes and asserts the two-step onboarding funnel, no visible color customization, paywall-first scan/paste/manual setup, and real StoreKit purchase routing back to the chosen destination.
- `npm run check:build52` asserts build 79 metadata, localized white system and automatic class-color labels, VoiceOver copy semantics, no visible color picker, and dynamic label fitting for compact setup proof.
- `npm run test:back-to-school-widgets` passed on 2026-07-07 and writes `qa/widgets/back-to-school-2026-widget-qa.json`.
- `npm run qa:release` passed on 2026-07-07.
- `npm run check:back-to-school-release-cycle` passed locally on 2026-07-07 while correctly keeping final submission readiness separate from optional extended widget proof.
- `localized-screenshot-coverage-report.md`
- `LOCALIZATION_AUDIT.md`
- `runtime-localization-proof.md`
- `widgetkit-localization-proof.md`
- `docs/launch/back-to-school-2026/native-screenshot-qa-runbook.md`
- `qa/back-to-school-2026/native-capture-preflight.json`

## White Setup And Class-Color Proof

The onboarding flow now uses two minimal steps: name and build action. The visible color customization feature is removed. A white system with automatic class colors is applied by default, with localized white system and automatic class-color labels and supporting copy through `SEMESTER_THEME_COPY` for:

- `en-US`
- `de`
- `es`
- `fr`
- `pt-BR`
- `ja`
- `ko`
- `zh-Hans`
- `hi`
- `ar`

The compact setup proof exposes:

- no color-control buttons or decorative theme choices,
- localized setup title, body, and white default and automatic class-color proof,
- a minimal default system card that works without user customization,
- `numberOfLines`, `adjustsFontSizeToFit`, and `minimumFontScale` safeguards where compact localized labels need them.

The post-apply semester-ready payoff states that dashboard, focus blocks, classes, and widgets keep black controls with automatic course colors for context.

## Widget Accessibility and Localization Proof

The Back-to-School widget QA fixture validates:

- default white system styling carries into widget snapshots when the state is calm or empty,
- urgent overdue and exam-heavy states keep red/orange warning colors,
- long student copy relies on native line limits and minimum scale factors,
- medium widgets expose action labels and stable interaction targets,
- iOS 26 environment fields for detail level and reduced luminance are guarded,
- WidgetKit container background, glass effect, and accented/tinted rendering paths are present in the native widget renderer.

This is local fixture/preflight evidence plus current public supplemental proof. Real WidgetKit screenshots are represented in the public widget sheet for the nomination, and the internal release gate continues to track the remaining extended widget proof states separately.

## Native Capture Coverage

Current public and local evidence covers the nomination's accessibility/localization story through localized screenshots, local accessibility checks, widget QA fixtures, and the public WidgetKit sheet. Continue to improve native capture coverage for:

- Dynamic Type on setup proof, semester-ready payoff, Today, Focus, and widget recommendation screens.
- Reduce Transparency or fallback surfaces for Liquid Glass.
- RTL layout where available.
- Long localized copy in the widget gallery and calendar widget preview.
- Real WidgetKit Home Screen and Lock Screen states for light, dark, and tinted/accented appearances.

## Internal Gate Status

The internal release gate still tracks optional extended native/widget capture proof. This should continue for launch polish, but the public supplemental package is ready for the August 24-31 featuring nomination.

## App Store Claim Boundary

This summary does not claim universal accessibility certification. It documents current localization/accessibility proof, public supplemental evidence, and the remaining internal capture checks that should continue after nomination submission.
