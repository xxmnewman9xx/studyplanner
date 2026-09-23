# Google Play Promotional Content — 7-Day Monthly Trial

This is the final submission pack for a Google Play Promotional content offer. It is designed for maximum organic reach with one text-free asset pair reused across all 19 localized store languages.

## Console configuration

| Field | Value |
| --- | --- |
| Internal event name | Fall Reset — 7-Day Monthly Trial |
| Event type | Offer |
| Offer subtype | Subscription trial |
| Eligibility | New users only |
| Featuring | Request featuring |
| Countries/regions | Select every country where the app and Monthly base plan are active |
| Start | 2026-09-18 12:00 UTC |
| End | 2026-10-15 12:00 UTC |
| Preview | Off — Google Play does not support preview for offers |
| Deep link | `studyplanner://paywall` |
| Product | `com.mattnewman.studyplanner.plus.monthly` |
| Base plan | `monthly1` |
| Offer ID | `seven-day-free-trial` |
| Trial | 7 days free, then the localized monthly price shown by Google Play |

## Upload once

- Primary image: `assets/primary-1920x1080.jpg`
- Square image: `assets/square-1080x1080.jpg`
- Use both as the default-language assets. Google Play will reuse them for every other locale because they contain no text.
- Copy each locale from `metadata.json`. Do not use automatic translation.

## Submission order

1. Activate the 7-day offer on the Monthly base plan in every active region.
2. Make Android build 80 available on Google Play so the offer-token selection reaches production.
3. Create the Promotional content item with the configuration above.
4. Add all 19 translations from `metadata.json`.
5. Upload the two default assets once and verify Play’s Spotlight crop previews.
6. Request featuring, validate the deep link, and submit at least 14 days before the start time.

## Current platform blocker

Google Play currently does not show **Grow users → Store presence → Promotional content** for this app. Google documents that apps need Premium growth tools eligibility for this feature. Keep the item in draft metadata until Google enables access; the offer, Android release, copy, assets, and schedule are otherwise ready.

## ASO rationale

- The offer value appears first in every tagline, with eligibility and monthly renewal expectation included.
- Taglines are within the 80-character limit and additionally target the shorter Spotlight limits.
- Descriptions state what users get, why it matters, how to redeem, eligibility, auto-renewal, localized price disclosure, and cancellation timing without duplicating the tagline.
- Natural search language covers syllabi, study plans, assignments, exams, deadlines, scanning, importing, and scheduling without keyword stuffing.
- Language-neutral imagery reduces upload work while retaining full localized reach.
