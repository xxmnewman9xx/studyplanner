# Study Planner: Syllabus AI

An Expo + React Native app for a calm student planner that turns courses, deadlines, grades, reminders, and AI-assisted syllabus imports into a daily execution plan.

## Run Locally

```bash
npm install
npm run typecheck
npx expo start
```

## What Is Included

- Polished first-run onboarding that leads into the Plus paywall.
- Editable syllabus import flow for pasted text and text-based PDFs through the local parser or configured parse endpoint.
- Camera/photo import stays disabled unless a configured endpoint and verified OCR/image parsing support are present.
- Course and semester setup with weekly class schedule.
- Assignment and exam objects with due dates, tags, priority, estimates, and status.
- Today screen with "what should I do next?" planning logic.
- Weighted grade tracker and final target calculator.
- Smart reminders using `expo-notifications`.
- Device calendar sync using `expo-calendar`.
- Focus session timer tied to a selected assignment.
- Store-backed Plus paywall and premium guards for syllabus imports, calendar sync, reminders, and grade forecasting.

## Configuration

The app does not commit store product IDs, policy URLs, or parser endpoints. Set these at build time:

```bash
EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=
EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS=
EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT=
EXPO_PUBLIC_TERMS_URL=https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
EXPO_PUBLIC_PRIVACY_URL=https://political-turtle-752.notion.site/Study-Planner-Syllabus-AI-Privacy-Policy-51dfaa74348846e0996b2e0ca22b1408
EXPO_PUBLIC_SUPPORT_URL=https://political-turtle-752.notion.site/Study-Planner-Syllabus-AI-Privacy-Policy-51dfaa74348846e0996b2e0ca22b1408
```

If policy URLs are not provided, the app falls back to Apple's standard EULA and the hosted Study Planner privacy policy. If a support URL is not provided, the in-app Support link falls back to the hosted privacy/contact page. If `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT` is not provided, the Scan tab stays available and uses the on-device text parser for text-based PDFs and plain-text syllabi.

Only include product IDs that exist in App Store Connect or Google Play Console. If no Plus products are configured, the paywall fails closed and does not grant premium access.

Canvas is intentionally not a live V1 integration. Do not claim Canvas sync until OAuth, school-domain handling, and update reconciliation are implemented.
