# Nomination and App-Version Media Readiness Scorecard

Checked: 2026-07-11
Target window: 2026-08-24 to 2026-08-31

## Controlling Verdict

Historical In-App Event / featuring nomination state: **SUBMITTED ON 2026-07-09**.
Current iOS `2.0.8` Build `80` app-version media state: **BLOCKED / NOT AUTHORIZED**.
Current event-media candidate score: **9.6/10**. Current app-version media score remains **withheld** because exact Build 80 screenshot provenance is absent.

The July 9 submission record is not permission to upload or submit a newer app-version media set. The replacement event pair is candidate-approved but does not reach the requested literal `10/10` bar, and no current app-version media upload is authorized.

## State Separation

| State | Result | Meaning |
| --- | --- | --- |
| In-App Event `Semester Kickoff Week` | Submitted July 9; historical record says Waiting for Review | No new event submission is implied by this scorecard. |
| Featuring nomination `8255bf6c-6cbf-45bd-b88c-1afc3074ca41` | Submitted July 9 | No new nomination submission is implied by this scorecard. |
| iOS app version `2.0.8` Build `80` | Processed; not selected | EAS build/submission and IPA identity/hash are verified. Live ASC readback shows Build 80 `VALID`, while the editable version still selects Build 79. |
| Standard App Store screenshots | Mechanically configured, not upload-authorized | `store.config.json` points to the canonical `store/apple/screenshot/` root with 144 valid references: 119 iPhone and 25 iPad. |
| GPT Image 2.0 Treatment B | **BLOCKED / DO NOT UPLOAD** | Independent review found UI drift, localization errors, seams, and incomplete or contradictory provenance. |
| In-App Event art | **CANDIDATE-APPROVED / UPLOAD BLOCKED** | Exact 1920x1080 card and 1080x1920 details replacements each scored `9.6/10`; manifest upload authorization remains `false`. |
| Supplemental hero | **OMITTED** | The rejected `7.5/10` press-only asset remains absent; it is optional and is not event media. |

## Current Gate Completion

Gate completion: **4/8**. This is an evidence-completion count, not an Apple-quality score.

| Gate | Result | Required evidence |
| --- | --- | --- |
| Local Build 80 target | Pass | `app.json` targets iOS `2.0.8` Build `80`, bundle `com.mattnewman.studyplanner`. |
| Canonical store configuration | Pass | All 144 configured references use `store/apple/screenshot/`, exist, and match the configured iPhone/iPad dimensions. |
| Local runtime/quality checks | Pass | First-experience, scanner stress, widget safeguards, and no-crop records are present in the readiness audit. |
| Real Build 80 identity | **Partial / Blocked** | EAS build, IPA identity/hash, submission, and live ASC `VALID` processing are verified. ASC app `6766181202` must still select Build 80 for version `2.0.8`. |
| Exact-binary iPhone provenance | **Blocked** | Per-file hashes for all 119 configured iPhone screenshots, each linked to the verified Build 80 IPA SHA-256. |
| Exact-binary iPad provenance | **Blocked** | Per-file hashes for all 25 configured iPad screenshots, each linked to the verified Build 80 IPA SHA-256. |
| App Preview decision | Pass | Explicit `no_upload` decision recorded because App Previews are optional; the invalid existing videos remain blocked. |
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

- The old event card, details art, and supplemental hero remain retired.
- Exact replacement card/details files are present and independently reviewed at `9.6/10`; their manifest status is candidate-approved, not upload-authorized.
- The optional supplemental hero stays omitted.
- Do not upload the pair while either manifest authorization is false or the controlling app-version/human gates are blocked.

## Final Recommendation

Do not submit the Build 80 app version for review and do not change App Store media until all eight app-version gates pass, the requested final quality bar is explicitly accepted, and the readiness scripts report no blockers. The already-submitted July 9 event and nomination should remain recorded as historical state, not rerun as a new submission workflow.
