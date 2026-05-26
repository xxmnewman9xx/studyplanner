# Runtime Localization Proof

Date: 2026-05-26 08:44 EDT / 2026-05-26 12:44 UTC

## Current Runtime Wiring

- `App.tsx` wraps the app in `I18nProvider`.
- Runtime locale can be forced with `EXPO_PUBLIC_STUDYPLANNER_LOCALE` for native screenshot QA.
- The launch catalog contains all 10 required locales: `ar`, `de`, `en-US`, `es`, `fr`, `hi`, `ja`, `ko`, `pt-BR`, and `zh-Hans`.
- The reviewed runtime catalog now contains 1094 flattened entries per locale.
- Navigation, onboarding headline/copy/preview mockups/theme choices, Today launch surface, Calendar/Plan launch surface, Classes launch surface, Focus launch surface, Grades launch surface, More/Widget Studio shell, native widget snapshot payloads, Widget Studio native preview fallbacks, Widgets settings/trust shell, Scan headline/copy/source picker/review shell/review edit controls/review findings, Assignment detail shell/edit/trust controls, Notes shell/editor/library/detail controls, PremiumGate chrome, App alert/error paths, App system-preview header, photo-disabled errors, Plus paywall headline/copy/features/status/legal/CTA shell, widget sync fallback, and the app theme toggle are wired through runtime keys.
- `src/screens/OnboardingScreen.tsx` no longer renders app-owned preview mockup text directly for Scan, Review, Calendar, Today, Classes, Focus, Widgets, weekday labels, due-date fallback, duration labels, review actions, or theme choice labels; it uses `onboarding.*`, `tabs.*`, `import.*`, `classes.*`, `focus.*`, `today.*`, and `plan.*` runtime keys with locale-aware date formatting.
- `src/components/ModeToggle.tsx` no longer renders app-owned `Light` / `Dark` / `Appearance` strings directly; it uses `theme.*` runtime keys.
- `src/screens/TodayScreen.tsx` no longer renders app-owned launch text directly for the default Today hero, command tiles, quick capture, import handoff, due lists, and empty states; it uses `today.*` runtime keys.
- `src/screens/PlanScreen.tsx` no longer renders app-owned launch text directly for the default Calendar hero, capture card, survival plan, month panel, week load, plan state, and urgency groups; it uses `plan.*` runtime keys and locale-aware date/month formatting.
- `src/screens/CoursesScreen.tsx` and `ClassIdentityCard` no longer render app-owned launch text directly for the default Classes hero, course hub, state card, course list, detail shell, add-course/add-homework forms, and weekly schedule; they use `classes.*` runtime keys and locale-aware date formatting.
- `src/screens/FocusScreen.tsx` no longer renders app-owned launch text directly for the focus timer hero, status labels, note shell, empty queue, saved blocks, and recent sessions; it uses `focus.*` runtime keys and locale-aware date formatting.
- `src/screens/GradesScreen.tsx` no longer renders app-owned launch text directly for the grade hero, course setup state, target calculator, what-if math, grade-weight list, add-grade form, recent grades, and grade meaning card; it uses `grades.*` runtime keys.
- `src/screens/MoreScreen.tsx` no longer renders app-owned first-viewport Widget Studio, More hub, settings/trust, Smart Stack, theme pack, app appearance, template gallery, saved preset, and install guidance text directly; it uses `more.*` runtime keys.
- `src/screens/ImportScreen.tsx` no longer renders app-owned Scan review/edit text directly for parse alerts, camera/photo permission alerts, recent import status, review gate messaging, review stats, trust checks, row confidence, add-to-Today blockers, generated review findings/checklist notes, and import-created course fallback semester text; it uses `import.*`, `common.*`, `paywall.*`, and tab runtime keys.
- `src/screens/AssignmentDetailScreen.tsx` no longer renders app-owned assignment detail/edit/trust text directly for validation alerts, header labels, task-state copy, kind/priority/status/source labels, reminder/confidence meta, review callouts, checklist empty state, and save/archive actions; it uses `assignment_detail.*` plus existing tab/runtime keys and locale-aware date formatting.
- `src/screens/NotesScreen.tsx` no longer renders app-owned Notes text directly for empty states, note counts, editor actions, templates, pin/delete controls, note detail metadata, and agenda workflow copy; it uses `notes.*` runtime keys and locale-aware date formatting.
- `src/components/PremiumGate.tsx` no longer renders app-owned Plus lock copy directly; it uses `premium_gate.*` runtime keys.
- `App.tsx` no longer renders app-owned quick-add, course-add, import-apply, reminder, calendar, sidebar Plus, or device-permission alert copy directly; those paths use `app.*`, `common.*`, `import.*`, `paywall.*`, and tab runtime keys.
- `App.tsx` no longer renders app-owned system-preview header state, fact labels, status details, or state action copy directly; those paths use `app.system_*` runtime keys and existing tab/runtime keys.
- `scripts/check-localization-completeness.mjs` scans the launch files plus `ModeToggle`, `TodayScreen`, `PlanScreen`, `CoursesScreen`, `FocusScreen`, `GradesScreen`, `MoreScreen`, `ImportScreen`, `AssignmentDetailScreen`, `NotesScreen`, `PremiumGate`, `widgetSnapshot`, and `AppleComponents`, verifies required keys in every locale, rejects selected hard-coded launch strings, and rejects non-English values that silently equal `en-US` except intentional product/platform terms.

## Missing-Key Check

Command:

```sh
npm run check:localization
```

Actual result after the onboarding preview localization patch:

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
- `18-focus.png` for `ar`, `de`, `ja`, and `zh-Hans` shows localized Focus timer shell strings, localized theme labels, localized timer status/stat labels, localized duration chips, and localized date formatting in the native Release bundle. Assignment title and course code remain English because they are fixture/imported planner data, not app-owned UI copy.
- `25-grades.png` for `ar`, `de`, `ja`, and `zh-Hans` shows localized Grades shell strings, localized theme labels, localized metric labels, localized target-calculator copy, and localized what-if copy in the native Release bundle. Course codes and letter grades remain fixture/imported planner data, not app-owned UI copy.
- `19-widgets-ocean.png` for `ar`, `de`, `ja`, and `zh-Hans` was rebuilt with explicit install-after-build proof and shows localized Widget Studio shell strings, localized theme labels, localized step labels, localized size/palette labels, localized tab labels, and localized embedded native widget snapshot labels/date/status copy in the native Release bundle. Assignment titles/course codes remain English because they are fixture/imported planner data, not app-owned UI copy.
- `12-scan.png` for `ar`, `de`, `ja`, and `zh-Hans` shows localized Scan shell, localized theme labels, enabled Camera/Photo controls, and image-capable import copy.
- `13-review.png` for `ar`, `de`, `ja`, and `zh-Hans` shows localized Scan review shell, localized review-gate status, localized review stats, localized trust-check copy, localized confidence chips, localized checklist notes, and localized tab labels in the native Release bundle. Assignment titles/course codes remain English because they are fixture/imported planner data, not app-owned UI copy.
- `24-plus.png` for `ar`, `de`, `ja`, and `zh-Hans` shows localized Plus/paywall shell, localized theme labels, two loaded products, yearly `$24.99`, monthly `$3.99`, restore visible, and legal links visible.
- `00-onboarding-scan.png` through `06-onboarding-widgets.png` for `ar` were captured after the final onboarding patch from a fresh Release iphonesimulator build and show localized onboarding preview titles, method chips, review labels, weekday labels, stats, focus labels, widget labels, and theme choice copy. Imported fixture assignment/course text remains English where it represents planner data.

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

The launch-critical app-owned runtime localization gap identified during this rescue cycle is now closed in source. The static launch gate now covers onboarding preview mockups, native widget snapshot service, Widget Studio preview fallbacks, Scan review controls, Assignment detail, Notes, PremiumGate, App alert paths, and App system-preview header.

The current gate proves all existing static runtime keys are populated and the smoked Today/Calendar/Classes/Focus/Grades/More/Scan/Review/Plus/native shell plus onboarding, Assignment detail, Notes, PremiumGate, App alert, and App system-preview source coverage is localized. It does not prove every future or unlisted runtime string outside the launch-critical audited files, so the gate remains in place to catch regressions.

## RTL Risk

Arabic is marked `direction: "rtl"` and the app shell receives RTL direction. Current Arabic screenshots show right-to-left Today/Calendar/Classes/Focus/Grades/More/Scan/Plus shell ordering and localized theme labels, but release still has RTL risk because:

- `I18nManager.allowRTL(true)` does not force a restart-time native RTL flip.
- Some nested row layouts remain manually left-to-right.
- Mixed Latin course/assignment fixture data remains left-to-right inside Arabic cards.
- Product metadata from StoreKit is still English.
- Some compact date/status labels outside the smoked surfaces still use English-oriented formatting.

## Release Status

Do not upload a new build from this state. App-owned launch-critical runtime localization is now wired and gated, with current native Release proof for Arabic onboarding plus existing native Release locale proof for Today/Calendar/Classes/Focus/Grades/More/Widgets/Scan/Review/Plus. Release remains blocked until Arabic RTL risk is accepted or fixed and StoreKit product metadata localizations are verified in App Store Connect/TestFlight.
