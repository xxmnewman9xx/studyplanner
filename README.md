# Study Planner: Syllabus AI

An Expo + React Native app for a calm student planner that turns courses, deadlines, grades, reminders, and syllabus scans into a daily execution plan.

## Run Locally

```bash
npm install
npm run typecheck
npx expo start
```

## What Is Included

- Polished first-run onboarding that leads into the Plus paywall.
- Editable syllabus import flow for PDF or photo uploads through a configured parse endpoint.
- Course and semester setup with weekly class schedule.
- Assignment and exam objects with due dates, tags, priority, estimates, and status.
- Today screen with "what should I do next?" planning logic.
- Weighted grade tracker and final target calculator.
- Smart reminders using `expo-notifications`.
- Device calendar sync using `expo-calendar`.
- Focus session timer tied to a selected assignment.
- Store-backed Plus paywall and premium guards for syllabus scan, calendar sync, reminders, and grade forecasting.

## Configuration

The app does not commit store product IDs, policy URLs, or scan-service endpoints. Set these at build time:

```bash
EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=<comma-separated-store-subscription-ids>
EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS=<comma-separated-store-nonconsumable-ids>
EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT=https://your-api.example.com/api/syllabus/parse
EXPO_PUBLIC_TERMS_URL=https://your-site.example.com/terms
EXPO_PUBLIC_PRIVACY_URL=https://your-site.example.com/privacy
```

If policy URLs are not provided, the app falls back to Apple's standard EULA and the hosted Study Planner privacy policy. If `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT` is not provided, the Scan tab stays available and uses the on-device text parser for text-based PDFs and plain-text syllabi.

Only include product IDs that exist in App Store Connect or Google Play Console. If no Plus products are configured, the paywall fails closed and does not grant premium access.

Canvas is intentionally not a live V1 integration. Do not claim Canvas sync until OAuth, school-domain handling, and update reconciliation are implemented.
