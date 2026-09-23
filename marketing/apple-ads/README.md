# StudyPlanner Apple Ads Launch Pack

Date: 2026-06-19
Budget: 5 USD/day total account spend
Primary goal: highest install-to-subscription conversion efficiency, not reach

## Decision

Run one paid localization test at a time. Do not split 5 USD/day across every supported locale.

Launch order:

1. `es-MX` / Spanish LATAM
2. `pt-BR` / Brazil
3. `en-US` exact-only control
4. `ko` or `ja` after a paid conversion signal exists
5. `fr-FR` and `de-DE` after cheaper markets prove subscription quality

The first live setup should be:

- `SP_es-MX_Search_Exact_Core` at 4.50 USD/day
- `SP_es-MX_Search_Discovery` at 0.50 USD/day

If Apple Ads account management is easier with one campaign, mirror the same split as ad groups, but keep exact, broad, and Search Match separated.

## Why

Apple recommends separate campaign/ad group logic for Brand, Category, Competitor, and Discovery. Brand, category, and competitor keywords should use exact match with Search Match off, while discovery should use broad match and Search Match to mine new terms. Source: https://ads.apple.com/app-store/best-practices/campaign-structure

Apple also recommends stronger bids on exact match, moderate bids on broad/Search Match, and separate exact/broad management. Source: https://ads.apple.com/app-store/best-practices/manual-bidding

Apple daily budget is monthly-averaged as daily budget x 30.4, so 5 USD/day is approximately 152 USD/month and individual days may vary. If the operating constraint is never more than 5 USD on any calendar day, check spend daily and pause campaigns manually once spend approaches the cap. Source: https://ads.apple.com/app-store/help/bids-and-budget/0016-manage-budgets

Custom product pages and Apple Ads ad variations should be aligned to keyword theme and audience. Sources: https://ads.apple.com/app-store/help/ads/0077-create-ad-variations and https://developer.apple.com/app-store/custom-product-pages/

## Budget Rules

- Hard total: 5 USD/day.
- Core exact campaign: 4.50 USD/day for the first learning window.
- Discovery campaign: 0.50 USD/day for the first learning window.
- Increase Discovery to 1 USD/day only after exact terms produce install and subscription/trial signal.
- Competitor ad group: disabled at launch. Enable only after category exact terms are converting.
- Search tab, Today tab, and product page placements: disabled at launch. Search results has the highest user intent for this budget.

## Bid Guardrails

Use subscription economics as the real ceiling:

```text
max CPT = target subscription CPA x tap-to-install CVR x install-to-subscription CVR
```

If subscription/trial attribution is not yet available, use install CPA only as a temporary proxy and do not scale above 5 USD/day from install data alone.

Starting assumptions until Apple Ads has real data:

- LATAM / Brazil target trial/subscription CPA: 8.00 USD
- US target trial/subscription CPA: 12.00 USD
- JP/KR target trial/subscription CPA: 10.00 USD
- FR/DE target trial/subscription CPA: 10.00 USD
- Temporary install CPA guardrail while subscription data is sparse: 2.50 USD LATAM/Brazil, 4.00 USD US, 3.50 USD JP/KR/FR/DE
- Discovery max CPT: 35-50 percent of matching exact bid
- Brand max CPT can be higher, but spend should stay tiny unless competitors appear

Do not set a CPA cap in the first learning window unless spend escapes. Apple notes CPA caps are optional, can limit impressions/installs, and actual CPA may exceed the cap. Source: https://ads.apple.com/app-store/help/bids-and-budget/0063-set-and-adjust-your-CPA-cap

## Promotion Loop

Every 7 days:

1. Export search terms.
2. Promote any converting discovery term into exact match in the matching intent ad group.
3. Add promoted exact terms as exact negative keywords in Discovery.
4. Add non-converting spenders as exact negatives first.
5. Raise exact bids only when CPA is below target and impression share is constrained.
6. Lower or pause terms with taps and poor conversion above target CPA.
7. Keep a one-line rationale in `weekly-optimization-checklist.md`.

## Assets

- `campaign-plan.json`: market rotation, budgets, guardrails, CPP briefs.
- `localization-priority.csv`: every repo-supported Apple locale ranked for paid testing.
- `adgroup-setup.csv`: campaign/ad group setup, daily budgets, Search Match state, and starting bids.
- `keywords-exact.csv`: exact launch keywords by market and intent.
- `keywords-discovery.csv`: broad/Search Match discovery setup.
- `search-match-adgroups.csv`: Search Match ad groups with no keyword rows.
- `negatives-discovery.csv`: overlap and waste-control negatives.
- `custom-product-pages.md`: localized CPP/ad-variation briefs.
- `weekly-optimization-checklist.md`: operating routine.
- `decision-log-2026-06-19.md`: first decision record.
- `attribution-plan.md`: how to read subscription value by Apple Ads source/CPP.

## Review Boundary

Do not claim Canvas, LMS sync, automatic homework submission, camera/photo OCR, or guaranteed syllabus extraction in ads or CPP metadata. The active launch boundary is the current `store.config.json` review note: text-based PDF/plain-text imports from Files, reviewed before saving.
