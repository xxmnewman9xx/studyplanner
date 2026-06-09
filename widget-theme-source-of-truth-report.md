# Widget Theme Source Of Truth

Date: 2026-05-26

Result: pass.

The widget theme model is consolidated in `src/widgets/widgetThemes.ts`. It defines the six real choices used by React previews, saved presets, native snapshot generation, and WidgetKit output:
- light
- dark
- ocean
- graphite
- forest
- high contrast

Connected surfaces:
- `src/screens/OnboardingScreen.tsx`: onboarding preview resolves the selected choice through the shared theme model, and finish applies the selected theme to native-eligible presets.
- `src/screens/MoreScreen.tsx`: Widget Studio style rail iterates the shared theme order and saves the resolved preset values.
- `src/components/AppleComponents.tsx`: in-app native preview rendering uses the shared style colors.
- `src/data/defaultPlanner.ts`: native default presets use real shared theme values, including the light Next Up preset.
- `src/services/widgetSnapshot.ts`: App Group snapshots use the same resolved style colors that previews use.
- `scripts/check-widget-snapshots.ts` and `scripts/check-widget-integrity.ts`: tests assert all six themes persist and drive native snapshot colors.

Validation:

```sh
npm run test:widgets
npm run test:widget-integrity
```

Results:
- `StudyPlanner widget snapshot gates passed`
- `widget persistence and integrity gates passed`

Native theme captures:
- `AppStore/RawScreenshots-FinalWidgetLocalization-NoFree-2026-05-26/theme-matrix/en-US/theme_variations/05-light-next-up.png`
- `AppStore/RawScreenshots-FinalWidgetLocalization-NoFree-2026-05-26/theme-matrix/en-US/widget_variations/00-small-next-up-light.png`
- `AppStore/RawScreenshots-FinalWidgetLocalization-NoFree-2026-05-26/home-screen-proof/02-widget-gallery-upcoming-small-light.png`
- `AppStore/RawScreenshots-FinalWidgetLocalization-NoFree-2026-05-26/home-screen-proof/05-home-screen-multiple-customized-widgets.png`
