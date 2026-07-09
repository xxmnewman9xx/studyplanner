# In-App Event Deep Link Validation

Checked: 2026-07-09
Deep link: `studyplanner://import`

## Result

Use `studyplanner://import` for the In-App Event.

## Evidence

- `app.json` defines the production URL scheme as `studyplanner`.
- Submitted iOS `2.0.8` build `79` IPA contains `CFBundleURLSchemes=["studyplanner","com.mattnewman.studyplanner"]`.
- Submitted iOS `2.0.8` build `79` IPA has app bundle `CFBundleShortVersionString=2.0.8` and `CFBundleVersion=79`.
- Current source tokenizes `studyplanner://import` to the `import` route token and resolves it to the `scan` route.
- Fresh simulator validation opened a clean iPhone 17 simulator window and installed the freshest local release simulator artifact available on disk.
- The URL opened Study Planner and landed on the first-run syllabus onboarding path: "Unlock first, then use the camera scan to turn a syllabus into a reviewed plan."
- Screenshot proof: `reference/deeplink-proof-studyplanner-import-fresh-sim.png`.

## Caveat

The freshest local simulator artifact available on disk was `2.0.6` build `76`; the current replacement submission candidate is `2.0.8` build `79`. This proof validates the OS handoff and first-run routing path in a clean simulator. The submitted build `79` IPA proves the production URL scheme is present, and the current source plus `app.json` confirm the same route parser. Re-run the same runtime smoke check on build `79` from TestFlight or App Store Connect before final App Store submission.

## Expected User Outcomes

- Fresh install: opens Study Planner onboarding, with syllabus scan/import framed as the first meaningful setup path.
- Onboarded but locked user: routes through the locked/paywall import path before scan, PDF, paste, or manual setup.
- Unlocked user: opens the Scan/import surface.

## App Store Connect Recommendation

Keep the In-App Event deep link as:

```text
studyplanner://import
```
