# StudyPlanner Monthly Trial Paywall Static QA

Date: 2026-08-20

## Scope

- Runtime: `App.tsx` single-file navigation runtime
- Offer: `com.mattnewman.studyplanner.plus.monthly`
- Renewal: USD $9.99/month in the U.S.; StoreKit-localized monthly price in production
- Other options retained: weekly and yearly, without introductory-trial metadata or messaging
- Runtime locales: Arabic, German, English (U.S.), Spanish, French, Hindi, Japanese, Korean, Portuguese (Brazil), Simplified Chinese
- Regional App Store locales map to those runtime language families.

## Automated score

| Check | Score | Evidence |
| --- | ---: | --- |
| Monthly-only offer truth | 10/10 | `STUDYPLANNER_TRIAL_PRODUCT_ID` is the exact Monthly SKU and `hasOneWeekFreeTrial` rejects Weekly and Yearly. |
| Trial duration truth | 10/10 | The only manifest and local StoreKit intro offer uses `P1W`; no Weekly or Yearly intro-offer metadata remains. |
| Store eligibility truth | 10/10 | Trial UI requires StoreKit intro-offer data plus Apple eligibility confirmation. |
| Price truth | 10/10 | Localized trial text uses the StoreKit `{price}` value and never hardcodes a checkout price. |
| Localization completeness | 10/10 | Headline, terms body, badge, CTA, and renewal summary exist in all 10 runtime locales with `{price}` and `{plan}` placeholders preserved. |
| Selection hierarchy | 10/10 | Monthly is the initial selection target; the offer card selects Monthly; Weekly and Yearly remain separate paid options. |
| Accessibility | 10/10 | Offer card is a named Monthly-plan button; plan choices remain radios; trial eligibility is included in the Monthly accessibility label only; persistent utility actions retain full roles, labels, hints, and disabled/busy state. |
| Legal clarity | 10/10 | Eligibility, post-trial renewal, cancellation, Restore Purchases, Terms, Privacy, and Support remain visible in the persistent purchase footer. |

Automated total: **80/80**.

## Superseded screenshot boundary

The screenshots in this legacy `weekly-trial-paywall-2026-08-20` directory predate the superseding Monthly pricing rule and must not be used as proof of current trial pricing. This update intentionally performed source and static validation only, with no native build or recapture, to avoid simulator contention.

- Per-locale captures: `qa/weekly-trial-paywall-2026-08-20/screenshots/<locale>/`
- Contact sheets: `contact-00-onboarding-scan.png`, `contact-01-onboarding-review.png`, `contact-02-onboarding-calendar.png`, and `contact-24-paywall.png`
- Historical English screenshot: `screenshots/en-US/24-paywall.png` — superseded; do not use for pricing proof

Current pricing truth is established by `src/iap.ts`, `src/config/iap.ts`, `qa/storekit/StudyPlannerLocal.storekit`, and the static gates. Monthly alone receives one week free and then renews at StoreKit’s localized monthly price; Weekly and Yearly receive no trial messaging.

## Static localization scorecard

All 10 runtime locales contain localized Monthly-selection body copy, a one-week-free Monthly badge/CTA, and `{price}` plus `{plan}` renewal placeholders. Static gates reject the former Weekly-selection phrases in German, English, Spanish, French, Hindi, Japanese, Korean, Portuguese, Simplified Chinese, and Arabic.

Static pricing/localization score: **10.0/10**. No post-change simulator visual score is claimed.

## Screenshot-driven correction

The first Hindi capture exposed a real localization fallback defect: all onboarding choice cards displayed the Hindi label for “Continue.” The missing `option.*` keys were added to `APP_COPY.hi`, the app hot-reloaded without another native build, and all four Hindi screenshots were recaptured. The current Hindi onboarding screenshot now distinguishes high school, college, graduate study, online classes, deadlines, exams, notes, grades, and everything without clipping.

The first footer closure capture also showed awkward single-letter wrapping in the longest French and German utility labels. The persistent action widths and single-line fitting were tuned, then all 10 paywalls were recaptured. The final contact sheet shows every action intact and legible while Restore remains a full-height accessible target.

## Final regression checks

- `npm run check:first-experience` — Monthly-only StoreKit and persistent-footer assertions
- `npm run test:hard-paywall` — passed
- `npm run typecheck` — passed
- `npm run check:iap` — passed
