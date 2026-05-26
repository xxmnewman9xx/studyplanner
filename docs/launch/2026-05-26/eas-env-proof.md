# EAS Env Proof

Date: 2026-05-25 23:50 EDT / 2026-05-26 03:50 UTC
Updated: 2026-05-26 01:38 EDT / 2026-05-26 05:38 UTC

## Commands

```sh
eas env:create production \
  --scope project \
  --name EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT \
  --value 'https://studyplanner-parser-production.up.railway.app/api/syllabus/parse' \
  --visibility plaintext \
  --force \
  --non-interactive

eas env:create production \
  --scope project \
  --name EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED \
  --value '0' \
  --visibility plaintext \
  --force \
  --non-interactive

eas env:create production \
  --scope project \
  --name EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED \
  --value '1' \
  --visibility plaintext \
  --force \
  --non-interactive

eas env:list production --format long --include-sensitive
```

## Production Env Observed

- `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly`
- `EXPO_PUBLIC_PRIVACY_URL=https://political-turtle-752.notion.site/Study-Planner-Syllabus-AI-Privacy-Policy-51dfaa74348846e0996b2e0ca22b1408`
- `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1`
- `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT=https://studyplanner-parser-production.up.railway.app/api/syllabus/parse`
- `EXPO_PUBLIC_TERMS_URL=https://www.apple.com/legal/internet-services/itunes/dev/stdeula/`

## Not Set

- `EXPO_PUBLIC_IAP_VALIDATION_ENDPOINT`

## Honesty Notes

- Production app builds can call the real HTTPS text parser endpoint.
- Image parsing is now enabled after Railway deployment `96f1fe35-2f55-4487-8b91-192eea973233` returned HTTP `200` for a generated syllabus PNG and parsed `Lab Report` plus `Final Exam`.
- IAP product IDs remain present. Server-side IAP validation is still not configured because no purchase validation endpoint was deployed in this pass.
