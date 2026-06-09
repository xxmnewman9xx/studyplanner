# Final Remaining Risks

Date: 2026-05-25

## Blocking Risks

- Parser deployment is blocked by missing authenticated hosting target/config.
- Purchase validation is blocked by missing deployed validation route and Apple App Store Server API secrets.
- Production EAS endpoint env vars are intentionally unset because no endpoint proof exists.
- Build `25` is not proven uploaded to TestFlight.
- Sandbox purchase and restore are not proven.

## Non-Blocking Truth State

- Photo/image parsing remains disabled unless both `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT` and `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1` are configured.
- The current parser handler has no OCR provider and correctly returns `OCR_NOT_CONFIGURED` for image uploads.
- The app does not claim server-side purchase validation unless `EXPO_PUBLIC_IAP_VALIDATION_ENDPOINT` is configured.

## Next Real Deployment Step

Authenticate or choose one hosting target, deploy the parser route, deploy a real purchase validation route with Apple credentials, smoke-test both URLs, then set production EAS env and build/upload the next TestFlight binary.
