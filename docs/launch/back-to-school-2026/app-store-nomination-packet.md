# App Store Featuring Nomination Packet

Status: Superseded by `docs/launch/back-to-school-2026/app-store-connect-final-upload/` for the live App Store Connect session. Keep this file as internal background only; do not use it to block nomination submission.

Current media override (2026-07-10): overall media is **blocked / not submission-ready**. The internal nomination packet selects only slides 01-06 from `qa/back-to-school-2026/copy-b-reviewed-plan-review-only-2026-07-09/screenshots/en-US/APP_IPHONE_65/`; slide 07 is conditional on exact submitted-binary provenance. All GPT Image 2.0 Treatment B assets are blocked/do-not-upload, and every existing 1080x1920 App Preview export is supplemental-only rather than ASC-ready.

Release: Back-to-School Semester Kickoff
Campaign: Back-to-School Semester Kickoff
Target window: 2026-08-24 to 2026-08-31
Submission target: 2026-07-24
Nomination type: App Enhancements
Platforms: iOS (iPhone), iOS (iPad)
Relevant countries or regions: All available regions
In-App Event: Yes - draft `Semester Kickoff Week`; attach only after App Store approval or publication

## Source Rules

- Apple App Store Connect supports individual nominations or CSV import.
- Use `App Enhancements` because this is a major feature/design update to an existing app.
- Submit at least three weeks before the requested publish date.
- Nomination description must be 1,000 characters or fewer.
- Helpful Details must be 500 characters or fewer.
- In-App Events can be attached to a nomination after the event is approved or published; attach as early as possible once available.
- Supplemental Materials supports up to five URLs.
- CSV imports submit nominations automatically, so use the individual nomination workflow in the final-upload packet.

Sources:

- https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/
- https://developer.apple.com/help/app-store-connect/reference/nominations/nominations-template/
- https://developer.apple.com/help/app-store-connect/offer-in-app-events/offer-in-app-events/
- https://developer.apple.com/help/app-store-connect/reference/in-app-events/in-app-event-badges

## Nomination Name

Back-to-School Semester Kickoff

## Nomination Description

Study Planner AI's Back-to-School Semester Kickoff update helps students turn the first stack of syllabi into a calm, reviewed semester plan before classes begin. In under a minute, onboarding guides them to scan or import a syllabus, review detected courses, assignments, exams, and uncertain dates, then save a plan they control. Native WidgetKit surfaces keep the plan visible after setup: Today, Upcoming, Week/Semester Calendar, Class Progress, dark/tinted-ready states, and Home Screen views for heavy weeks. The update is localized across key student markets, uses real release screenshots and WidgetKit captures, respects accessibility settings, and keeps the promise focused: a reviewed Apple-native path from syllabus chaos to a calmer first week.

## Helpful Details

Built by an independent developer focused on reducing semester overwhelm, not selling generic AI. The release pairs privacy-conscious review-before-save planning with Apple-native details: real WidgetKit proof, submitted iPhone/iPad screenshots, localized store presence, Dynamic Type/RTL/accessibility QA, and a timed Semester Kickoff Week event that helps students finish setup before classes ramp.

## In-App Event Draft

Reference name: Back-to-School Semester Kickoff 2026
Event name: Semester Kickoff Week
Badge: Challenge
Short description: Build your semester plan
Long description: Scan a syllabus, review deadlines, and finish first-week setup.
Start: 2026-08-24 08:00 local time
End: 2026-08-31 23:59 local time
Publish start: 2026-08-10 08:00 local time
Deep link candidate: studyplanner://import
Media rule: Use editorial/marketing context assets only; do not invent app screens, fake widgets, or fake phone UI.
Attachment rule: Attach to the featuring nomination only after the In-App Event is approved or published in App Store Connect.

## Supplemental Materials To Prepare

1. Supplemental product video: import, review, semester-ready payoff, Home, focus, widgets.
2. Screenshot contact sheet from the release build.
3. Native WidgetKit screenshot sheet: light, dark, tinted/accented, empty, normal, exam-heavy.
4. Accessibility/localization QA summary.
5. App Review notes with claim boundaries and purchase/review flow proof.

## App Review Claim Boundaries

- Do not claim Canvas, LMS, or school portal sync.
- Do not claim guaranteed syllabus extraction.
- Do not claim automatic homework submission.
- Do not market Watch surfaces unless a real, reviewed Watch target is included.
- Do not use fake Home Screen widget placement screenshots.

## Internal Launch Polish Gate

These checks are useful for launch polish, but the final-upload packet supersedes this gate for the live App Store Connect nomination. Submit the nomination now once the In-App Event is submitted or the five supplemental URLs are confirmed public.

- A native iOS/TestFlight build renders the Liquid Glass onboarding and WidgetKit surfaces correctly.
- App Store screenshot set is generated from real release UI.
- `npm run typecheck`, `npm run qa:release`, `npm run test:widget-integrity`, `npm run test:back-to-school-widgets`, `npm run check:back-to-school-launch`, `npm run check:back-to-school-assets`, `npm run check:back-to-school-supplementals`, `npm run check:back-to-school-upload-package`, `npm run check:back-to-school-marketing-assets`, `npm run check:back-to-school-remote-capture`, `npm run check:back-to-school-editorial`, `npm run finalize:back-to-school-assets`, `npm run check:back-to-school-submission`, `npm run check:back-to-school-submission-runbook`, `npm run check:back-to-school-execution-board`, `npm run test:hard-paywall`, and `npm run check:iap` pass.
- Screenshot QA covers Blue, Orange, Graphite, dark mode, Dynamic Type, long localized copy, and RTL where available.
- In-App Event deep link, metadata, media, and localization are reviewed and either approved/published or intentionally removed from the nomination before final submit.
- Product video or contact sheet URL is ready for Supplemental Materials.
- Do not use a CSV import until all gates pass, because App Store Connect submits imported nominations automatically.

Run `npm run check:back-to-school-release-cycle` for one aggregate local evidence artifact after any release, asset, widget, supplemental URL, or nomination copy change.
