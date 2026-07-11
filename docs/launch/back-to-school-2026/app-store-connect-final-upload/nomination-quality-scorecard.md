# Nomination and App-Version Media Readiness Scorecard

Checked: 2026-07-10
Target window: 2026-08-24 to 2026-08-31

## Controlling Verdict

Historical In-App Event / featuring nomination state: **SUBMITTED ON 2026-07-09**.
Current iOS `2.0.8` Build `80` app-version media state: **BLOCKED / NOT AUTHORIZED**.
Current quality score: **withheld — the exact Build 80 media set does not yet have the evidence required for a truthful score**.

The July 9 submission record is not permission to upload or submit a newer app-version media set. No current asset set is 10/10, and no current app-version media upload is authorized.

## State Separation

| State | Result | Meaning |
| --- | --- | --- |
| In-App Event `Semester Kickoff Week` | Submitted July 9; historical record says Waiting for Review | No new event submission is implied by this scorecard. |
| Featuring nomination `8255bf6c-6cbf-45bd-b88c-1afc3074ca41` | Submitted July 9 | No new nomination submission is implied by this scorecard. |
| iOS app version `2.0.8` Build `80` | Not evidence-complete | The local version target is not proof that a real Build 80 exists in EAS, the IPA, or App Store Connect. |
| Standard App Store screenshots | Mechanically configured, not upload-authorized | `store.config.json` points to the canonical `store/apple/screenshot/` root with 144 valid references: 119 iPhone and 25 iPad. |
| GPT Image 2.0 Treatment B | **BLOCKED / DO NOT UPLOAD** | Independent review found UI drift, localization errors, seams, and incomplete or contradictory provenance. |
| In-App Event / supplemental art | **BLOCKED / OMITTED** | Independent scores were `8.5/10` for the event card, `7.3/10` for event details, and `7.5/10` for the supplemental hero. The files are omitted and manifest approvals remain `false` until regenerated candidates reach the requested `10/10` bar. |

## Current Gate Completion

Gate completion: **3/8**. This is an evidence-completion count, not an Apple-quality score.

| Gate | Result | Required evidence |
| --- | --- | --- |
| Local Build 80 target | Pass | `app.json` targets iOS `2.0.8` Build `80`, bundle `com.mattnewman.studyplanner`. |
| Canonical store configuration | Pass | All 144 configured references use `store/apple/screenshot/`, exist, and match the configured iPhone/iPad dimensions. |
| Local runtime/quality checks | Pass | First-experience, scanner stress, widget safeguards, and no-crop records are present in the readiness audit. |
| Real Build 80 identity | **Blocked** | Finished production EAS build UUID and artifact URL; downloaded IPA path, bytes, SHA-256, and inspected bundle identity; live ASC app `6766181202` showing Build 80 uploaded, processed, and selected. |
| Exact-binary iPhone provenance | **Blocked** | Per-file hashes for all 119 configured iPhone screenshots, each linked to the verified Build 80 IPA SHA-256. |
| Exact-binary iPad provenance | **Blocked** | Per-file hashes for all 25 configured iPad screenshots, each linked to the verified Build 80 IPA SHA-256. |
| App Preview decision | **Blocked** | Either a valid, reviewed, exact-Build-80 App Preview or an explicit `no_upload` decision because App Previews are optional. Existing 1080x1920 videos are supplemental-only and are not valid for the current App Preview slot. |
| Human upload authorization | **Blocked** | Named and timestamped authorization covering the exact IPA hash, all configured screenshot paths, the App Preview decision, and continued rejection of Treatment B. |

## Required Evidence Record

The control plane expects:

`qa/back-to-school-2026/build80-app-version-media-evidence.json`

That record must bind the same identity across EAS, the downloaded IPA, App Store Connect, iPhone provenance, iPad provenance, the App Preview upload/no-upload decision, and the final human authorization. A local `buildNumber: 80` string alone is never sufficient.

## App Preview Decision

App Previews are optional. The current videos remain supplemental nomination evidence only: they are not approved for the `APP_IPHONE_65` App Preview slot. Readiness can pass in either of two truthful ways:

1. Upload a newly reviewed App Preview that meets Apple’s current slot requirements and is sourced from the exact Build 80 binary.
2. Record an explicit `no_upload` decision and upload no App Preview.

## Human Authorization Boundary

Automation may verify paths, dimensions, hashes, identities, and declared state. It may not grant human upload authorization. The authorization must identify the reviewer, timestamp, version/build, IPA SHA-256, exact screenshot paths, App Preview decision, and confirm `treatmentBUploadAuthorized: false`.

## Treatment B Hold

- Do not upload any GPT Image 2.0 Treatment B asset.
- Mechanical `119/119` dimensions never override the independent human rejection.
- The six July 9 en-US deterministic candidates are historical internal review material, not the configured standard upload set and not upload-authorized.
- Do not upload a Home Screen / widget slide until its raw SpringBoard and WidgetKit source is linked to the exact submitted binary and re-reviewed by a human.

## Event Media Hold

- Do not reuse the prior event card, event details art, or supplemental hero.
- Regenerate the three assets, review them at full resolution, and require a `10/10` independent score before changing either event-media approval to `true`.
- Keep the event-media files absent from the curated release branch until they pass that bar.

## Final Recommendation

Do not submit the Build 80 app version for review and do not change App Store media until all eight app-version gates pass, replacement event media reaches `10/10`, and the readiness scripts report no blockers. The already-submitted July 9 event and nomination should remain recorded as historical state, not rerun as a new submission workflow.
