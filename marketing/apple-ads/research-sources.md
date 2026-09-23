# Research Sources

Apple / official:

- Expo SDK v56 reference, read before implementation per project instruction: https://docs.expo.dev/versions/v56.0.0/
- Expo v56 app config, including `locales`: https://docs.expo.dev/versions/v56.0.0/config/app/
- Expo v56 localization: https://docs.expo.dev/versions/v56.0.0/sdk/localization/
- Apple Ads campaign structure: https://ads.apple.com/app-store/best-practices/campaign-structure
- Apple Ads manual bidding: https://ads.apple.com/app-store/best-practices/manual-bidding
- Apple Ads keywords: https://ads.apple.com/app-store/best-practices/keywords
- Apple Ads manage budgets: https://ads.apple.com/app-store/help/bids-and-budget/0016-manage-budgets
- Apple Ads create campaigns: https://ads.apple.com/app-store/help/campaigns/0005-create-campaigns
- Apple Ads CPA cap: https://ads.apple.com/app-store/help/bids-and-budget/0063-set-and-adjust-your-CPA-cap
- Apple Ads ad variations: https://ads.apple.com/app-store/help/ads/0077-create-ad-variations
- Apple Developer custom product pages: https://developer.apple.com/app-store/custom-product-pages/

Repo-local context:

- `AGENTS.md`
- `docs/APP_STORE_METADATA.md`
- `store.config.json`
- `store/apple/aso-scorecard-2026-06-09.txt`
- `store/apple/metadata-qa-locale-summary.json`

Known source-of-truth note:

- Current `store.config.json` review notes advertise text-based PDF/plain-text import from Files and explicitly do not advertise camera/photo OCR for this binary. Apple Ads copy and CPP metadata follow that narrower boundary until store metadata is updated. `docs/APP_REVIEW_NOTES.md` is broader than the active store metadata and is not the ad-claim source for this launch pack.
