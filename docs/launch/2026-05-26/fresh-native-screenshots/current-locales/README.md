# Current Locale Screenshot Proof

Date: 2026-05-26 05:07 EDT / 2026-05-26 09:07 UTC

These screenshots were captured from native `Release` iphonesimulator builds on `StudyPlanner-QA-iPhone`.

Each locale build used:

- `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1`
- `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT=https://studyplanner-parser-production.up.railway.app/api/syllabus/parse`
- `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly`
- locale-specific `EXPO_PUBLIC_STUDYPLANNER_LOCALE`

## Smoke Matrix

| Locale | Today screenshot | Calendar screenshot | Classes screenshot | Focus screenshot | Scan screenshot | Plus screenshot | Observed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ar` | `ar/10-today-light.png` | `ar/14-calendar.png` | `ar/17-classes.png` | `ar/18-focus.png` | `ar/12-scan.png` | `ar/24-plus.png` | RTL Today/Calendar/Classes/Focus/Scan/Plus shell localized, Camera/Photo enabled, localized theme labels, localized date/duration/class/focus status, two priced products. |
| `de` | `de/10-today-light.png` | `de/14-calendar.png` | `de/17-classes.png` | `de/18-focus.png` | `de/12-scan.png` | `de/24-plus.png` | German Today/Calendar/Classes/Focus/Scan/Plus shell localized, Camera/Photo enabled, localized theme labels, localized date/duration/class/focus status, two priced products. |
| `ja` | `ja/10-today-light.png` | `ja/14-calendar.png` | `ja/17-classes.png` | `ja/18-focus.png` | `ja/12-scan.png` | `ja/24-plus.png` | Japanese Today/Calendar/Classes/Focus/Scan/Plus shell localized, Camera/Photo enabled, localized theme labels, localized date/duration/class/focus status, two priced products. |
| `zh-Hans` | `zh-Hans/10-today-light.png` | `zh-Hans/14-calendar.png` | `zh-Hans/17-classes.png` | `zh-Hans/18-focus.png` | `zh-Hans/12-scan.png` | `zh-Hans/24-plus.png` | Simplified Chinese Today/Calendar/Classes/Focus/Scan/Plus shell localized, Camera/Photo enabled, localized theme labels, localized date/duration/class/focus status, two priced products. |

## Blockers Exposed

- StoreKit product metadata still renders in English for localized builds. This must be fixed in App Store Connect subscription localizations and verified in TestFlight/native sandbox.
- Full runtime localization remains incomplete outside the smoked Today/Calendar/Classes/Focus/Scan/Plus/native shell. See `../../runtime-localization-proof.md`.
