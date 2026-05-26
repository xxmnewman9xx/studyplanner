# Current Locale Screenshot Proof

Date: 2026-05-26 08:44 EDT / 2026-05-26 12:44 UTC

These screenshots were captured from native `Release` iphonesimulator builds on `StudyPlanner-QA-iPhone`.

Each locale build used:

- `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1`
- `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT=https://studyplanner-parser-production.up.railway.app/api/syllabus/parse`
- `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly`
- locale-specific `EXPO_PUBLIC_STUDYPLANNER_LOCALE`

## Smoke Matrix

| Locale | Onboarding screenshot | Today screenshot | Calendar screenshot | Classes screenshot | Focus screenshot | Grades screenshot | Widgets screenshot | Scan screenshot | Review screenshot | Plus screenshot | Observed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ar` | `ar/00-onboarding-scan.png` through `ar/06-onboarding-widgets.png` | `ar/10-today-light.png` | `ar/14-calendar.png` | `ar/17-classes.png` | `ar/18-focus.png` | `ar/25-grades.png` | `ar/19-widgets-ocean.png` | `ar/12-scan.png` | `ar/13-review.png` | `ar/24-plus.png` | RTL Onboarding/Today/Calendar/Classes/Focus/Grades/Widgets/Scan/Review/Plus shell localized, native widget snapshot labels localized, Camera/Photo enabled, localized theme labels, localized date/duration/class/focus/grade/widget/review status, two priced products. |
| `de` | static source/catalog gate | `de/10-today-light.png` | `de/14-calendar.png` | `de/17-classes.png` | `de/18-focus.png` | `de/25-grades.png` | `de/19-widgets-ocean.png` | `de/12-scan.png` | `de/13-review.png` | `de/24-plus.png` | German Today/Calendar/Classes/Focus/Grades/Widgets/Scan/Review/Plus shell localized, native widget snapshot labels localized, Camera/Photo enabled, localized theme labels, localized date/duration/class/focus/grade/widget/review status, two priced products. |
| `ja` | static source/catalog gate | `ja/10-today-light.png` | `ja/14-calendar.png` | `ja/17-classes.png` | `ja/18-focus.png` | `ja/25-grades.png` | `ja/19-widgets-ocean.png` | `ja/12-scan.png` | `ja/13-review.png` | `ja/24-plus.png` | Japanese Today/Calendar/Classes/Focus/Grades/Widgets/Scan/Review/Plus shell localized, native widget snapshot labels localized, Camera/Photo enabled, localized theme labels, localized date/duration/class/focus/grade/widget/review status, two priced products. |
| `zh-Hans` | static source/catalog gate | `zh-Hans/10-today-light.png` | `zh-Hans/14-calendar.png` | `zh-Hans/17-classes.png` | `zh-Hans/18-focus.png` | `zh-Hans/25-grades.png` | `zh-Hans/19-widgets-ocean.png` | `zh-Hans/12-scan.png` | `zh-Hans/13-review.png` | `zh-Hans/24-plus.png` | Simplified Chinese Today/Calendar/Classes/Focus/Grades/Widgets/Scan/Review/Plus shell localized, native widget snapshot labels localized, Camera/Photo enabled, localized theme labels, localized date/duration/class/focus/grade/widget/review status, two priced products. |

## Blockers Exposed

- StoreKit product metadata still renders in English for localized builds. This must be fixed in App Store Connect subscription localizations and verified in TestFlight/native sandbox.
- Arabic RTL still has layout risk from manually left-to-right nested rows and mixed Latin fixture data. See `../../runtime-localization-proof.md`.
