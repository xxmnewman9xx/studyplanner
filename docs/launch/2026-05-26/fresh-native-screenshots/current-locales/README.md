# Current Locale Screenshot Proof

Date: 2026-05-26 03:00 EDT / 2026-05-26 07:00 UTC

These screenshots were captured from native `Release` iphonesimulator builds on `StudyPlanner-QA-iPhone`.

Each locale build used:

- `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1`
- `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT=https://studyplanner-parser-production.up.railway.app/api/syllabus/parse`
- `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly`
- locale-specific `EXPO_PUBLIC_STUDYPLANNER_LOCALE`

## Smoke Matrix

| Locale | Scan screenshot | Plus screenshot | Observed |
| --- | --- | --- | --- |
| `ar` | `ar/12-scan.png` | `ar/24-plus.png` | RTL Scan/Plus shell localized, Camera/Photo enabled, localized theme labels, two priced products. |
| `de` | `de/12-scan.png` | `de/24-plus.png` | German Scan/Plus shell localized, Camera/Photo enabled, localized theme labels, two priced products. |
| `ja` | `ja/12-scan.png` | `ja/24-plus.png` | Japanese Scan/Plus shell localized, Camera/Photo enabled, localized theme labels, two priced products. |
| `zh-Hans` | `zh-Hans/12-scan.png` | `zh-Hans/24-plus.png` | Simplified Chinese Scan/Plus shell localized, Camera/Photo enabled, localized theme labels, two priced products. |

## Blockers Exposed

- StoreKit product metadata still renders in English for localized builds. This must be fixed in App Store Connect subscription localizations and verified in TestFlight/native sandbox.
- Full runtime localization remains incomplete outside the smoked Scan/Plus/native shell. See `../../runtime-localization-proof.md`.
