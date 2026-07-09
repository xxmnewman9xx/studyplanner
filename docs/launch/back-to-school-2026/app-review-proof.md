# Back-to-School 2026 App Review Proof Packet

Date: 2026-07-09
Release: Back-to-School Semester Kickoff
Submitted build candidate: iOS 2.0.8 build 79
Submission status: Public supplemental URL verified for App Store Connect.

## Reviewer Story

The Back-to-School update helps a student start from an empty semester, add their name, see a white setup with automatic class colors, import or enter syllabus details, review detected coursework, then generate a live plan with Today priorities, Semester Pulse, focus blocks, reminders, calendar-ready dates, and recommended widgets.

## Claim Boundaries

- No Canvas, LMS, or school portal sync claim.
- No guaranteed syllabus extraction claim.
- No automatic homework submission claim.
- No unsupported Watch marketing claim.
- No fake Home Screen widget placement screenshots.
- Imported work is reviewed before it affects the live dashboard, reminders, widgets, or calendar sync.

## Purchase and Review Flow Evidence

Verified on 2026-07-09:

- `npm run test:hard-paywall`
- `npm run check:iap`
- `npm run qa:release`
- `npm run check:localization`
- `npm run check:back-to-school-release-cycle`

## Current Access Model

- A valid active App Store entitlement is required before imports can be applied to the live dashboard, reminders, widgets, or calendar-ready plan.
- Local premium cache values are scrubbed unless StoreKit validation confirms an active entitlement.
- Purchase updates and Restore Purchases both recheck App Store subscriptions before unlock.
- The app does not display fake subscription prices while StoreKit is loading. Fallback plans use `Shown by App Store`, and the App Store purchase sheet shows the current price and terms before purchase.
- The paywall keeps Restore Purchases available when App Store product metadata is unavailable.

## Review-Before-Save Proof

- Camera scan, PDF import, paste import, and manual setup are paywall-first.
- Imported syllabus rows are preview-only before unlock.
- After purchase, a pending import must return to Review. It does not auto-apply after unlock.
- Students must review before anything saves into the live semester.
- The review screen states that nothing saves until the student approves rows.
- The locked dashboard and paywall copy both explain that extracted classes, assignments, exams, and uncertain dates require review before they affect the dashboard, reminders, widgets, or calendar sync.

Supporting files:

- `docs/launch/2026-05-26/storekit-localization-proof.md`
- `store/apple/localized-upload-qa.txt`
- `docs/APP_REVIEW_NOTES.md`
- `qa/storekit/StudyPlannerLocal.storekit`
- `scripts/check-hard-paywall-app-gate.mjs`
- `scripts/check-iap-config.mjs`

## Nomination Proof Status

This packet is ready to use as the App Review and purchase-flow proof supplemental URL for the Back-to-School featuring nomination.

Current public supplemental proof includes:

- submitted iOS build candidate `2.0.8` build `79`,
- 9/9 App Store screenshot contact-sheet proof,
- real WidgetKit proof for the current public sheet,
- public accessibility/localization summary,
- public product video URL,
- public claim-boundary and purchase-flow proof.

The internal release gate still tracks optional extended WidgetKit proof states and final marketing asset polish. Those internal checks should continue, but they should not delay the August 24-31 featuring nomination unless App Store Connect or App Review rejects the event/build.

## Reviewer Notes Draft

The update is a seasonal App Enhancements release for Back-to-School 2026. The AI planning flow is assistive and review-first: students can import, paste, scan, or manually enter schoolwork, then review classes, assignments, exams, and uncertain dates before anything is saved into the active semester plan.

Subscription access is handled by the App Store. The purchase sheet shows current price and terms, Restore Purchases is available, and StudyPlanner unlocks only after StoreKit confirms an active entitlement. If a student creates an import preview before purchase, unlock returns them to Review so they can approve rows before the app updates the live dashboard, reminders, widgets, or calendar-ready plan.

No fake Home Screen widget placement screenshots should be used in App Review or featuring materials. Widget screenshots must come from a native release/TestFlight build with real WidgetKit placement.

## In-App Event Deep Link

Use `studyplanner://import` for `Semester Kickoff Week`.

Validation on 2026-07-07:

- `app.json` defines the production scheme as `studyplanner`.
- Current route parsing maps the `import` token to the app's syllabus scan/import route.
- A clean iPhone 17 simulator opened `studyplanner://import` into Study Planner's first-run onboarding path: "Unlock first, then use the camera scan to turn a syllabus into a reviewed plan."
- The local simulator proof used the freshest available release simulator artifact on disk (`2.0.6` build `76`); the current replacement submission candidate is `2.0.8` build `79`.
- The submitted build `79` IPA contains `CFBundleURLSchemes=["studyplanner","com.mattnewman.studyplanner"]`, and the current source/config preserve the same route parser.
- Re-run this runtime smoke check on processed TestFlight build `79` before final App Store submission.
