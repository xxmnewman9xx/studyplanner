# Final Preview Sweep - 2026-07-09

Scope: final Copy B / GPT Image 2.0 iPhone previews in `store/apple/screenshot-copy-b-image-2`, plus release packet readiness for the August Back-to-School In-App Event nomination.

## Result

- Copy B final root: ready.
- Machine gate: `npm run check:copy-b-image2` passed with `119/119` PNGs at exact `1242x2688`.
- Visual sweep: accepted for PPO use at 9+/10 across the 17 locales.
- First-three story: slide 1 shows scan syllabus/notes into reviewed plan; slide 2 shows review/approval before save; slide 3 shows semester built and Today payoff.
- Widget story: slides 6/7 use real localized Home Screen WidgetKit proof, not the old in-app widget gallery.
- Standard App Store upload path remains Copy A/control in `store/apple/screenshot-pop`; Copy B is for iPhone-only PPO after nomination submission.

## Contact Sheets

Each sheet is `1548x1662`, generated from the final Copy B PNGs.

- `copy-b-image2-contact-sheets/01-scan-syllabus-notes-all-locales.png`
- `copy-b-image2-contact-sheets/02-approve-deadlines-all-locales.png`
- `copy-b-image2-contact-sheets/03-semester-built-all-locales.png`
- `copy-b-image2-contact-sheets/04-today-next-move-all-locales.png`
- `copy-b-image2-contact-sheets/05-study-blocks-all-locales.png`
- `copy-b-image2-contact-sheets/06-widgets-sync-all-locales.png`
- `copy-b-image2-contact-sheets/07-home-screen-widgets-all-locales.png`

## Checks Run

- `eas metadata:lint` passed.
- `npm run check:copy-b-image2` passed.
- `npm run check:nomination-ready` passed.
- `npm run check:iap` passed.
- `npm run check:localization` passed.
- `git diff --check` passed.
- EAS build `1b391498-68eb-4cfe-af89-d099cebd0418` is `FINISHED` for iOS `2.0.8` build `79`.
- EAS submission `6a4dcc05-79dc-4e24-81b5-88826e7173f8` is `FINISHED` for ASC app `6766181202`.

## Non-Blocking Notes

- Some generated widget slides retain tiny dark crop slivers at the outer device/background edge. They do not affect the product story, dimensions, claims, or App Store upload validity.
- The later duplicate EAS submission `e873a70f-cee9-41de-94e6-4e0faff92e77` is `ERRORED`; ignore it and use the finished `6a4dcc05...` submission evidence.
- Final runtime deep-link smoke still needs to be performed from processed TestFlight build `2.0.8 (79)` before pressing final App Store submission.

## Remaining Manual ASC Checks

- Confirm build `2.0.8 (79)` is processed and selectable in App Store Connect.
- Confirm `studyplanner://import` on the processed TestFlight build.
- Confirm In-App Event media crops correctly in ASC.
- Confirm all five supplemental URLs open and are accepted by ASC.
- Submit the In-App Event and featuring nomination manually from `docs/launch/back-to-school-2026/app-store-connect-final-upload/`.
