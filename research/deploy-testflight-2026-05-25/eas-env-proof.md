# EAS Env Proof

Date: 2026-05-25

## Command

```sh
eas env:list --environment production
```

## Production Env Observed

- `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly`
- `EXPO_PUBLIC_PRIVACY_URL`
- `EXPO_PUBLIC_TERMS_URL`

## Not Present

- `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT`
- `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED`
- `EXPO_PUBLIC_IAP_VALIDATION_ENDPOINT`

## Changes Made

None. No production EAS env var was created in this pass because neither a deployed parser endpoint nor a deployed purchase validation endpoint was proven.

## Correct Next Env Commands After Real Deployment

```sh
eas env:create production \
  --scope project \
  --name EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT \
  --value 'https://<deployed-host>/api/syllabus/parse' \
  --visibility plaintext \
  --non-interactive
```

Do not create `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1` until real image OCR is implemented and tested.

```sh
eas env:create production \
  --scope project \
  --name EXPO_PUBLIC_IAP_VALIDATION_ENDPOINT \
  --value 'https://<deployed-host>/api/purchases/validate' \
  --visibility plaintext \
  --non-interactive
```
