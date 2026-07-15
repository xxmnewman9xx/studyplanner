# Build 86 exact-capture contract

This remains the strict physical-capture path. For the current package, the release owner explicitly waived physical-device provenance in `build86-release-source-waiver-2026-07-14.json`. The waiver accepts truthfully labeled installed-Build-86 simulator UI and does not permit it to be relabeled as physical or production-IPA capture.

The localized release compiler accepts only original PNG screenshots captured on a physical iPhone and physical iPad running TestFlight StudyPlanner 2.0.9 (86). Simulator, mirroring, resized, exported, or recompressed captures fail preflight.

## Required inventory

- 17 locales × 2 device classes × 7 slide states = **238 PNGs and 238 JSON sidecars**.
- Default manifest: `outputs/build86-exact-captures/manifest.json`.
- Capture environment: `physical_device_testflight_build86`.
- Production IPA SHA-256: `3cfc2d4c482fd088fba2b00e9ab8e39487b8edfc3b772dbb4b97176ab482888a`.
- EAS submission ID: `b7b78a63-e18c-43c7-b0db-279c7a7265af`.

For each locale/device, capture these states in order:

1. `scannerReady`, dark — guided syllabus scanner UI
2. `today`, light
3. `home-screen-widgets`, light
4. `plan`, dark
5. `studySession`, dark
6. `today`, dark
7. `review`, light

Slide 5 must show the genuine Focus Session route. Slide 6 must be a distinct Today screen.

## Sidecar fields

Every PNG sidecar must contain:

```json
{
  "schemaVersion": 1,
  "environment": "physical_device_testflight_build86",
  "appVersion": "2.0.9",
  "buildNumber": "86",
  "bundleId": "com.mattnewman.studyplanner",
  "ipaSha256": "3cfc2d4c482fd088fba2b00e9ab8e39487b8edfc3b772dbb4b97176ab482888a",
  "easSubmissionId": "b7b78a63-e18c-43c7-b0db-279c7a7265af",
  "deviceClass": "iphone",
  "deviceModel": "physical model name",
  "osVersion": "installed iOS/iPadOS version",
  "capturedAt": "2026-07-13T19:00:00Z",
  "requestedLocale": "en-US",
  "resolvedLocale": "en-US",
  "rtl": false,
  "slideIndex": 1,
  "route": "scannerReady",
  "appearance": "dark",
  "screenshotSha256": "64 lowercase hex characters",
  "sourceOriginal": true,
  "mirroredOrScaled": false
}
```

Use `deviceClass: "ipad"` for iPad captures and `rtl: true` only for `ar-SA`.

## Manifest shape

The manifest’s `records` array must cover each locale/device/slide tuple exactly once:

```json
{
  "schemaVersion": 1,
  "environment": "physical_device_testflight_build86",
  "sourceBinary": {
    "version": "2.0.9",
    "buildNumber": "86",
    "bundleId": "com.mattnewman.studyplanner",
    "ipaSha256": "3cfc2d4c482fd088fba2b00e9ab8e39487b8edfc3b772dbb4b97176ab482888a"
  },
  "records": [
    {
      "locale": "en-US",
      "device": "APP_IPHONE_65",
      "slideIndex": 1,
      "path": "outputs/build86-exact-captures/en-US/APP_IPHONE_65/01-scanner-ready-dark.png",
      "sidecarPath": "outputs/build86-exact-captures/en-US/APP_IPHONE_65/01-scanner-ready-dark.json",
      "screenshotSha256": "64 lowercase hex characters"
    }
  ]
}
```

## Guarded compiler sequence

```bash
PY=/Users/mattnewman/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3
$PY scripts/compose_build86_localized_release.py preflight
$PY scripts/compose_build86_localized_release.py compose
$PY scripts/compose_build86_localized_release.py verify
$PY scripts/compose_build86_localized_release.py contact-sheets
$PY scripts/compose_build86_localized_release.py finalize
npm run check:build86-media-ready
```

`compose` cannot run until the canary and all headline sets are approved. `finalize` cannot run until a named reviewer supplies hash-bound approval for all 34 contact sheets.
