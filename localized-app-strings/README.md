# Localized App Strings

Date: 2026-05-26

`core-launch-strings.json` is a reviewed starter catalog for the 10 requested locales:

- `ar`
- `de`
- `en-US`
- `es`
- `fr`
- `hi`
- `ja`
- `ko`
- `pt-BR`
- `zh-Hans`

## Scope

This catalog covers launch-critical student-facing copy:

- tab labels
- Today default launch surface
- onboarding headlines and CTAs
- import/scanner truth copy
- paywall/subscription labels
- parser error states
- native permission purpose strings

## Truth Boundaries

- The current production parser endpoint supports text, pasted text, multipart text uploads, readable text-based PDFs, and readable image OCR.
- Photo picker image OCR is enabled after production smoke proof and native Release simulator proof. Physical camera capture still needs TestFlight/device proof before release claims are broadened.
- Copy uses AI-assisted language only for reviewed syllabus organization from supported sources, and avoids unsupported Canvas/LMS, fake automation, fake prices, and fake unlimited claims.

## Runtime Integration Status

The React Native source now includes `src/i18n.tsx` and launch-critical wiring for navigation, onboarding, Today, import/scanner truth copy, paywall value copy, brand text, and core widget-sync copy. Current native Release simulator screenshots under `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/` prove Today/Scan/Plus shell localization for `ar`, `de`, `ja`, and `zh-Hans`.

This is still not complete runtime localization for the full app. Calendar, Classes, Focus, Grades, Widgets/settings, detail screens, and some alert/error paths still need app-owned hard-coded strings replaced before release.
