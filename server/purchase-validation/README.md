# Purchase Validation Server Contract

`contract.ts` defines the server-side receipt validation request and response shapes. It does not contain Apple or Google private credentials and does not claim production validation by itself.

## Request

```json
{
  "platform": "ios",
  "productId": "<one of src/config/iap.ts product IDs>",
  "transactionId": "2000000123456789",
  "purchaseToken": "optional-store-token-or-jws",
  "source": "purchase"
}
```

`source` is one of `purchase`, `restore`, or `refresh`.

## Response

```json
{
  "isPremium": true,
  "productId": "<validated StudyPlanner product ID>",
  "validatedAt": "2026-05-25T13:00:00.000Z",
  "environment": "Sandbox",
  "expiresAt": "2026-06-25T13:00:00.000Z",
  "validationSource": "app-store-server-api"
}
```

## Required Production Implementation

For iOS, the server must use App Store Server API credentials:

- `STUDYPLANNER_APPLE_BUNDLE_ID`
- `STUDYPLANNER_APPLE_ISSUER_ID`
- `STUDYPLANNER_APPLE_KEY_ID`
- `STUDYPLANNER_APPLE_PRIVATE_KEY`

The server must verify transaction status with Apple before returning `isPremium: true`. If credentials or validation fail, return a non-2xx response or `isPremium: false`.

## App Wiring

The app only calls server validation when this public endpoint is configured:

```text
EXPO_PUBLIC_IAP_VALIDATION_ENDPOINT=https://your-domain.example/api/purchases/validate
```

If that endpoint is absent, the app keeps the existing local store-query entitlement path and does not claim server receipt validation.
