# Study Planner: Syllabus AI

An Expo + React Native app for a calm student planner that turns courses, deadlines, grades, reminders, and AI-assisted syllabus imports into a daily execution plan.

## Run Locally

```bash
npm install
npm run typecheck
npx expo start
```

## What Is Included

- Polished first-run onboarding that leads into the subscription paywall.
- Editable on-device syllabus import flow for pasted text and text-based PDFs.
- Camera/photo import uses the native iOS Vision OCR module and always requires review before save.
- Course and semester setup with weekly class schedule.
- Assignment and exam objects with due dates, tags, priority, estimates, and status.
- Today screen with "what should I do next?" planning logic.
- Weighted grade tracker and final target calculator.
- Smart reminders using `expo-notifications`.
- Focus session timer tied to a selected assignment.
- Store-backed subscription paywall and app-access guards for syllabus imports, reminders, and grade forecasting.

## Configuration

The release product manifest records the known StudyPlanner StoreKit product IDs so code, local StoreKit QA, and drift checks agree. Build-time env can still override product IDs for sandbox or store-console validation:

```bash
EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=
EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS=
EXPO_PUBLIC_TERMS_URL=https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
EXPO_PUBLIC_PRIVACY_URL=https://political-turtle-752.notion.site/Study-Planner-Syllabus-AI-Privacy-Policy-51dfaa74348846e0996b2e0ca22b1408
EXPO_PUBLIC_SUPPORT_URL=https://political-turtle-752.notion.site/Study-Planner-Syllabus-AI-Privacy-Policy-51dfaa74348846e0996b2e0ca22b1408
```

If policy URLs are not provided, the app falls back to Apple's standard EULA and the hosted Study Planner privacy policy. If a support URL is not provided, the in-app Support link falls back to the hosted privacy/contact page. The active Scan experience processes supported imports on device; the legacy modular parser endpoint is not part of this release runtime and should not be advertised as a shipped feature.

Only include product IDs that exist in App Store Connect or Google Play Console. If no env product IDs are provided, the app uses `src/config/iap.ts` release manifest IDs; if the store does not return those products, the paywall fails closed and does not grant paid access.

Canvas is intentionally not a live V1 integration. Do not claim Canvas sync until OAuth, school-domain handling, and update reconciliation are implemented.
