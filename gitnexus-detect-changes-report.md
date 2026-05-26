# GitNexus Detect Changes Report

Date: 2026-05-26

Command:

```sh
npx gitnexus detect-changes --repo studyplanner --scope all
```

Result:
- Changed files: 71
- Changed symbols: 306
- Affected processes: 119
- Risk level: critical

The critical result is expected for this release cycle because the change set intentionally crosses native widget snapshots, Widget Studio preset state, onboarding/capture routing, localization catalogs, subscription copy, IAP validation checks, and release proof documents.

Top affected flows reported by GitNexus:
- `NativeSnapshots -> IsValidDateInput`
- `WidgetSnapshots -> IsValidDateInput`
- `BuildStudyPlannerWidgetSnapshots -> IsValidTimeInput`
- `MoreScreen -> IsValidDateInput`
- `MoreScreen -> IsValidTimeInput`
- `PremiumGate -> IsSupportedLocale`

Review conclusion:
The affected scope matches the requested work. The final validation suite and native Home Screen proof passed after the last code changes and screenshot recapture.
