# Runtime Localization Proof

Date: 2026-05-26

Result: pass.

The launch locale catalog was cleaned across all ten runtime locales:
- en-US
- ar
- de
- es
- fr
- hi
- ja
- ko
- pt-BR
- zh-Hans

The simulator capture path now supports a capture-file locale override, so every locale screenshot is native app output rather than an overlay.

Implementation points:
- `src/i18n.tsx`: locale override support for deterministic simulator capture.
- `App.tsx`: capture route parsing accepts supported locale IDs and passes them through `useI18n`.
- `scripts/sim-qa-product-depth.mjs`: passes `STUDYPLANNER_CAPTURE_LOCALE`.

Validation:

```sh
npm run check:localization
```

Result: `runtime localization completeness gate passed`.

Native proof root:
`AppStore/RawScreenshots-FinalWidgetLocalization-NoFree-2026-05-26/locales`

Each locale contains 14 native screenshots covering onboarding widget preview, paywall, core tabs, Widget Studio pick/save states, and both light and dark app modes where required.
