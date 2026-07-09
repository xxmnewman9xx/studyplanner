# App Store Connect Live Session Checklist

Use this file during the actual App Store Connect session.

## Status

- Release build: iOS `2.0.8` build `79`
- Target featuring window: `2026-08-24` to `2026-08-31`
- Submission type: individual featuring nomination
- Nomination type: `App Enhancements`
- In-App Event: `Semester Kickoff Week`
- Event deep link: `studyplanner://import`
- Live ASC check on 2026-07-09: build `79` is attached to iOS app version `2.0.8`; In-App Event Add for Review is enabled; nomination Submit Nomination is enabled; no final submit buttons have been pressed.
- Seasonal offer: Weekly Plus, Monthly Plus, and Yearly Plus each show a worldwide one-week introductory offer from `2026-07-09` through `2026-09-30` across 175 countries or regions. Apple eligibility still applies at the subscription-group level, so customer-facing copy should say eligible new subscribers.
- Product Page Optimization: draft `Copy B Back-to-School 2026` exists at `/distribution/optimization/8f3b740d-28e8-4ae5-8f51-5e2809932b09` with one treatment and 17 localizations. Copy A/control remains the standard/live product page. Chrome upload was interrupted after English (U.S.) Treatment A iPhone 6.5 inherited screenshots were cleared, before B files were attached.

## Before Opening App Store Connect

- Keep this folder open: `docs/launch/back-to-school-2026/app-store-connect-final-upload/`
- Use only the two images in `event-media/` for the In-App Event.
- Use only the five URLs in `supplemental-url-registry.md` for supplemental materials.
- Do not upload `supplemental/studyplanner-branded-supplemental-hero-1920x1080.png` as In-App Event media.
- Do not use CSV import for the nomination.

## Create The In-App Event

1. Open App Store Connect.
2. Select Study Planner AI / Studyplanner: Syllabus AI.
3. Open In-App Events.
4. Create a new event.
5. Enter:
   - Reference name: `Back-to-School Semester Kickoff 2026`
   - Event name: `Semester Kickoff Week`
   - Badge: `Challenge`
   - Short description: `Review your first-week plan`
   - Long description: `Import a syllabus, approve deadlines, and finish setup before classes ramp.`
   - Start: `2026-08-24 08:00 local time`
   - End: `2026-08-31 23:59 local time`
   - Publish start: `2026-08-10 08:00 local time`
   - Deep link: `studyplanner://import`
   - Availability: all storefronts matching app availability
6. Upload:
   - Event card image: `event-media/01-event-card-image-1920x1080.png`
   - Event details page image: `event-media/02-event-details-image-1080x1920.png`
7. Submit the event for review. The draft is already created and ready; do not recreate it.

## If App Store Connect Rejects The Event Badge

Use `Major Update` as the fallback badge. Keep every other field the same.

## Create The Featuring Nomination

1. Open Featuring Nominations.
2. Create a new individual nomination.
3. Do not use CSV import.
4. Enter:
   - Nomination name: `Back-to-School Semester Kickoff`
   - Nomination type: `App Enhancements`
   - Publish Date Start: `2026-08-24`
   - Publish Date End: `2026-08-31`
   - Relevant countries or regions: all available regions
   - Launch in certain markets first: `No`
   - Do you intend to submit a new In-App Event: `Yes`
   - Platforms: iOS iPhone and iPad
   - Pre-order: `No`
5. Paste the description and helpful details from `nomination-fields.md`.
6. Add the five supplemental URLs from `supplemental-url-registry.md`.
7. Attach `Semester Kickoff Week` only if App Store Connect makes it selectable.
8. Submit. The draft nomination is already saved and ready; do not recreate it.
9. After the nomination is submitted, continue the existing iPhone-only Product Page Optimization draft using `copy-b-image2-upload-map.json`; keep Copy A/control active as the standard screenshot set and do not press `Start Test` until all 17 locales are uploaded and verified.

## If The In-App Event Is Not Selectable

Submit the nomination anyway as `App Enhancements`.

Use this answer for related event handling:

```text
Semester Kickoff Week has been submitted as a supporting In-App Event. If it is not selectable yet, please evaluate this nomination as an App Enhancements release for the August 24-31 Back-to-School window.
```

## Stop Conditions

Stop and do not submit if any of these happen:

- App Store Connect does not show build `2.0.8` build `79` as the current submitted/approved candidate.
- Any of Weekly Plus, Monthly Plus, or Yearly Plus does not show `Jul 9, 2026 to Sep 30, 2026`, `175 Countries or Regions`, and `Free for the first week`.
- Any supplemental URL fails to open publicly.
- App Store Connect requires screenshots or event media that are not in this folder.
- The event media preview crops the desk/planner art in a way that looks broken.
- App Store Connect asks for generated app UI, generated widgets, or fake device screenshots.

## Final Confirmation

Before pressing final submit, confirm:

- The nomination description does not claim LMS sync, guaranteed extraction, automatic homework submission, or unsupported automation.
- The event media contains no fake app UI, fake widgets, fake phones, or readable generated text.
- The supplemental URLs open without login.
- The deep link is exactly `studyplanner://import`.
- The desired feature window is exactly `2026-08-24` to `2026-08-31`.
