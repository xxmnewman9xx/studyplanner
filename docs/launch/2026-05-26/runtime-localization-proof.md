# Runtime Localization Proof

Date: 2026-05-26 04:45 EDT / 2026-05-26 08:45 UTC

## Current Runtime Wiring

- `App.tsx` wraps the app in `I18nProvider`.
- Runtime locale can be forced with `EXPO_PUBLIC_STUDYPLANNER_LOCALE` for native screenshot QA.
- The launch catalog contains all 10 required locales: `ar`, `de`, `en-US`, `es`, `fr`, `hi`, `ja`, `ko`, `pt-BR`, and `zh-Hans`.
- The reviewed runtime catalog now contains 432 flattened entries per locale.
- Navigation, onboarding headline/copy, Today launch surface, Calendar/Plan launch surface, Classes launch surface, Scan headline/copy/source picker/review shell, photo-disabled errors, Plus paywall headline/copy/features/status/legal/CTA shell, widget sync fallback, and the app theme toggle are wired through runtime keys.
- `src/components/ModeToggle.tsx` no longer renders app-owned `Light` / `Dark` / `Appearance` strings directly; it uses `theme.*` runtime keys.
- `src/screens/TodayScreen.tsx` no longer renders app-owned launch text directly for the default Today hero, command tiles, quick capture, import handoff, due lists, and empty states; it uses `today.*` runtime keys.
- `src/screens/PlanScreen.tsx` no longer renders app-owned launch text directly for the default Calendar hero, capture card, survival plan, month panel, week load, plan state, and urgency groups; it uses `plan.*` runtime keys and locale-aware date/month formatting.
- `src/screens/CoursesScreen.tsx` and `ClassIdentityCard` no longer render app-owned launch text directly for the default Classes hero, course hub, state card, course list, detail shell, add-course/add-homework forms, and weekly schedule; they use `classes.*` runtime keys and locale-aware date formatting.
- `scripts/check-localization-completeness.mjs` scans the launch files plus `ModeToggle`, `TodayScreen`, `PlanScreen`, and `CoursesScreen`, verifies required keys in every locale, rejects selected hard-coded launch strings, and rejects non-English values that silently equal `en-US` except intentional product/platform terms.

## Missing-Key Check

Command:

```sh
npm run check:localization
```

Actual result after the Classes localization patch:

```text
runtime localization completeness gate passed
```

## Current Native Screenshot Smoke

Current image-enabled/IAP-configured Release simulator screenshots were rebuilt and captured for:

```text
docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/
docs/launch/2026-05-26/fresh-native-screenshots/current-locales/de/
docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ja/
docs/launch/2026-05-26/fresh-native-screenshots/current-locales/zh-Hans/
```

Each build was compiled with:

- `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1`
- `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT=https://studyplanner-parser-production.up.railway.app/api/syllabus/parse`
- `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly`
- locale-specific `EXPO_PUBLIC_STUDYPLANNER_LOCALE`

Observed:

- `10-today-light.png` and `11-today-dark.png` for `ar`, `de`, `ja`, and `zh-Hans` show localized Today shell strings, localized theme labels, localized dates, and localized duration units in the native Release bundle. The assignment title/course name remain English because they are fixture data, not app-owned UI copy.
- `14-calendar.png` for `ar`, `de`, `ja`, and `zh-Hans` shows localized Calendar shell strings, localized theme labels, localized selected-day/month formatting, and localized duration units in the native Release bundle. The assignment title/course name remain English because they are fixture data, not app-owned UI copy.
- `17-classes.png` for `ar`, `de`, `ja`, and `zh-Hans` shows localized Classes shell strings, localized theme labels, localized class count/open/completed labels, localized date formatting, and localized tab labels in the native Release bundle. Course names, teacher names, room names, note titles, and assignment titles remain English because they are fixture/imported planner data, not app-owned UI copy.
- `12-scan.png` for `ar`, `de`, `ja`, and `zh-Hans` shows localized Scan shell, localized theme labels, enabled Camera/Photo controls, and image-capable import copy.
- `24-plus.png` for `ar`, `de`, `ja`, and `zh-Hans` shows localized Plus/paywall shell, localized theme labels, two loaded products, yearly `$24.99`, monthly `$3.99`, restore visible, and legal links visible.

## StoreKit Localization Blocker

The app-owned paywall shell is localized, but StoreKit product metadata is still English in localized screenshots:

- `Yearly Plus`
- `Plus Monthly`
- `Yearly`
- `Monthly`
- `Study Planner Plus Annual Subscription`
- `Study Planner Plus Monthly Subscription`

These strings come from App Store Connect product metadata, not from the runtime catalog. Before release, manually enter/verify subscription localizations for both products in App Store Connect app `6766181202`, then confirm a processed TestFlight/native sandbox build shows localized product title, period, and description for the target storefronts.

## Hard-Coded Runtime Gap

Release localization is not complete. A direct hard-coded JSX text audit no longer flags `TodayScreen`, `PlanScreen`, or `CoursesScreen`, but still finds 94 candidate app-owned English matches in launch-relevant surfaces including:

- `FocusScreen`
- `GradesScreen`
- `MoreScreen` / Widgets and secondary settings
- `AssignmentDetailScreen`
- `NotesScreen`
- several alert/error paths in `App.tsx`

The current gate proves all existing static runtime keys are populated and the smoked Today/Calendar/Classes/Scan/Plus/native shell is localized. It does not prove every runtime string in the app has been replaced with reviewed translations.

## RTL Risk

Arabic is marked `direction: "rtl"` and the app shell receives RTL direction. Current Arabic screenshots show right-to-left Today/Calendar/Classes/Scan/Plus shell ordering and localized theme labels, but release still has RTL risk because:

- `I18nManager.allowRTL(true)` does not force a restart-time native RTL flip.
- Some nested row layouts remain manually left-to-right.
- Mixed Latin course/assignment fixture data remains left-to-right inside Arabic cards.
- Product metadata from StoreKit is still English.
- Widgets and some compact date/status labels still use English-oriented formatting.

## Release Status

Do not upload a new build from this localization state. Today/Calendar/Classes/Scan/Plus runtime localization is materially improved and proven in current native Release simulator screenshots, but release remains blocked until the remaining app-owned hard-coded launch strings are replaced with reviewed translations, Arabic RTL risk is accepted or fixed, and StoreKit product metadata localizations are verified in App Store Connect/TestFlight.
