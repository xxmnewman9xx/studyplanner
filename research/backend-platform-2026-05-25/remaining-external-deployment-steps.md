# Remaining External Deployment Steps

Only these external steps remain. They are not claimed as complete in this repo.

1. Deploy `server/syllabus-parser/handler.ts` behind an HTTPS route.
2. Add a real OCR provider before setting `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1`.
3. Configure native build env:

```text
EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT=https://your-domain.example/api/syllabus/parse
EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1
```

4. Deploy a purchase validation endpoint implementing `server/purchase-validation/contract.ts`.
5. Store Apple App Store Server API credentials on that server, not in the app repo.
6. Configure native build env only after deployment:

```text
EXPO_PUBLIC_IAP_VALIDATION_ENDPOINT=https://your-domain.example/api/purchases/validate
```

7. Capture sandbox/TestFlight purchase and restore proof against the deployed validation server.
