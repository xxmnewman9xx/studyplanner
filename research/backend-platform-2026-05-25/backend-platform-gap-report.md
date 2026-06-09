# Backend Platform Gap Report

Date: 2026-05-25

## Closed In Code

- Parser endpoint contract now has deploy-ready server handler code at `server/syllabus-parser/handler.ts`.
- Image parsing is no longer implied by endpoint presence. Photo/camera import now requires `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT` plus `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1`.
- Parser endpoint URLs are trusted only when HTTPS or localhost development URLs.
- Optional server-side IAP validation path now exists through `EXPO_PUBLIC_IAP_VALIDATION_ENDPOINT` and `src/services/purchaseValidation.ts`.
- Widget snapshots filter leftover `demo-*` rows when `demoMode` is false.
- Turning widget sync off writes private `sync_disabled` snapshots in native iOS builds instead of leaving old planner rows visible.
- Motion foundation is centralized in `src/motion.tsx` with reduced-motion support and onboarding-only adoption.

## Still External

- No hosted parser URL is committed.
- No OCR provider is implemented for photos.
- No Apple App Store Server API private credentials are in the repo.
- No Google Play Developer API validation implementation is included.
- Native Release smoke must be rerun after these platform changes before App Review packaging.

## Truth Position

The app is more production-truthful, but not fully production-hosted. Backend services are deploy-ready contracts/foundations unless an actual HTTPS endpoint and private server credentials are configured outside this repo.
