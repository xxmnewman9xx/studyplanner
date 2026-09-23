# Apple Ads Decision Log

Date: 2026-06-19

## Decision

Launch Apple Ads as a rotating localization test, not a simultaneous global campaign.

Initial live market:

- Locale: `es-MX`
- Exact campaign: `SP_es-MX_Search_Exact_Core`
- Discovery campaign: `SP_es-MX_Search_Discovery`
- Total daily budget setting: 5 USD/day
- Initial split: 4.50 USD exact / 0.50 USD discovery

## Rationale

The app already has 17 Apple locales, but 5 USD/day cannot create meaningful signal across all of them at once. Spanish LATAM has the best mix of localized readiness, lower expected acquisition costs, and reusable language coverage across multiple markets.

## Guardrails

- Optimize for subscription/trial CPA when attribution is available.
- Treat install CPA as a proxy only.
- Keep Search Match in its own ad group.
- Add all exact winners as exact negatives in Discovery.
- Keep unsupported LMS/school-account/automatic submission claims out of ad copy.
- Ads follow the current `store.config.json` review boundary: text-based PDF/plain-text import from Files is advertised; camera/photo OCR is not used as an ad claim until the store metadata boundary changes.

## Next Review

Run the first review after 7 days or 20 USD spend, whichever comes later.
