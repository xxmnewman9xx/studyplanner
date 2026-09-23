# Max Impact Spotlight Research Cycle

Generated: 2026-07-07
Release: Back-to-School Semester Kickoff
Scope: current live ASC previews as Copy A/control; GPT Image 2.0 outcome-based Copy B PPO exploration.

## Decision

Submit the In-App Event nomination now using the final-upload packet. For PPO after submission, explore one high-contrast Creative Copy B direction, not multiple variants. The highest-likelihood conversion lift is in the first three preview frames because they are the fastest-visible proof of student intent: semester setup, deadlines/exams, and study blocks.

The current ASC live previews remain the control and nomination-safe upload set. Copy B exploration now uses the outcome-based manual Image 2.0 queue in `docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-image2-manual-queue.json`.

## Highest-Leverage B Angle

Use a real-outcome system:

- Scan syllabus or notes.
- Approve every deadline.
- See the semester built.
- Know today's next move.
- Plan study time calmly.
- Keep widgets in sync.
- Show real Home Screen widgets.

This beats generic "AI planner" positioning because competitors are crowding around schedule/planner/AI claims, while students search for concrete relief: deadlines, homework, exams, first-week setup, and what to do next.

## Nomination Moves

1. Submit the App Store Connect featuring nomination now for the August 24-31 window.
2. Keep nomination type as App Enhancements unless the In-App Event is approved in time to attach.
3. Keep `Semester Kickoff Week` framed as a Challenge only if the actual in-app flow asks students to complete setup.
4. Use the live ASC screenshots as the nomination-safe product-page proof. Do not block nomination submission on Creative Copy B.
5. Include accessibility/localization proof, real WidgetKit proof, and the review-before-save AI boundary in Helpful Details.

## A/B Test

Primary PPO test:

- Control: current live ASC screenshots.
- Treatment B: final accepted outcome Copy B screenshots from `store/apple/screenshot-copy-b-image-2/{locale}/APP_IPHONE_65/` only after `npm run check:copy-b-image2` passes.
- Traffic: one treatment only; avoid splitting into multiple variants.
- Metric: App Store Connect conversion rate lift and confidence.
- Minimum run: 14 days; stop/apply only at 90%+ confidence or after the test is clearly inconclusive.
- Guardrail: do not keep a CVR winner if first-class/task creation, trial start, or subscription start drops meaningfully.

## GPT Image 2.0 Gate

Live ChatGPT Mac app prompting works, but the earlier latest-build B set remains concept-only because the native cached outputs exported at `853x1844` and the exact-size files were resized derivatives. Do not use `store/apple/screenshot-copy-b-latest-build/` as final B. Final B must be generated one image at a time in the ChatGPT Mac app with GPT Image 2.0, using the real logo and slide-specific real UI reference, saved natively at `1242x2688`, and recorded in `copy-b-image2-provenance.json`.

## Research Signals

- Apple supports Product Page Optimization for testing screenshots, icons, and app previews, with up to three treatments and confidence reporting.
- Apple explicitly calls out seasonal/culturally relevant content as a PPO use case.
- Apple recommends featuring nominations at least two weeks ahead and up to three months for wider consideration.
- In-App Events can appear across App Store surfaces, but they must be real timely in-app experiences and can publish up to 14 days before start.
- Competitors mostly cluster around broad planner, timetable, grades, widgets, or AI claims; the gap is a sharp first-week setup story.

## Source Links

- Apple Product Page Optimization: https://developer.apple.com/app-store/product-page-optimization/
- Apple Creating Your Product Page: https://developer.apple.com/app-store/product-page/
- Apple Custom Product Pages: https://developer.apple.com/app-store/custom-product-pages/
- Apple Getting Featured: https://developer.apple.com/app-store/getting-featured/
- Apple Nominate Your App: https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/
- Apple In-App Events: https://developer.apple.com/help/app-store-connect/offer-in-app-events/overview-of-in-app-events/

## Artifact Summary

- Locales: 17
- Slides per locale: 7
- Creative Copy B GPT Image 2.0 prompts: 119
- Current ASC live preview source paths verified: yes, as Copy A/control
- Creative proof generated: `creative-en-US-01`
- Reference-inspired proofs generated: `refpop-en-US-01` style-first and source-first canaries
- Latest-build B set generated: `latest-en-US-01` through `latest-en-US-07`, concept-only because the accepted-size files were resized from `853x1844`
- Copy B proof status: 119 manual outcome jobs queued; final PPO treatment blocked until native `1242x2688` Mac-app outputs and accepted provenance exist
