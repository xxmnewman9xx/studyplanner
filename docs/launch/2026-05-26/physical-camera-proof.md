# Physical Camera Proof

Date: 2026-05-26 08:55 EDT

## Result

Release status: blocked.

No physical iPhone is connected to this machine, so physical camera permission, live camera capture, and TestFlight camera-to-review proof were not produced in this pass.

## Local Device Check

Command:

```sh
xcrun xctrace list devices
```

Observed devices:

```text
Matt's Mac mini
```

Observed simulators:

```text
ScentAI-QA-iPhone Simulator (26.5)
ScentAI-QA-iPhone-17-Pro Simulator (26.5)
StudyPlanner-QA-iPhone Simulator (26.5)
```

No physical iPhone appeared in the device list.

## Build/TestFlight State

Current source config:

- App version: `1.0.2`
- iOS build number: `28`
- Bundle ID: `com.mattnewman.studyplanner`
- ASC app ID: `6766181202`

`eas build:list --platform ios --limit 5 --non-interactive` returned only older remote iOS builds:

| EAS build | Version | Build | Finished | Commit |
| --- | --- | --- | --- | --- |
| `8e84469a-8af5-4bc7-a8a4-9675d3dbe439` | `1.0.0` | `11` | 2026-05-06 07:00 | `b393850df3781c705bf5a36115849a0d92e18bb2` |
| `93f77597-d52b-42c2-ac0b-0a2b77537c45` | `1.0.0` | `10` | 2026-05-05 19:00 | `a6717d9d0f53d52b2735df3f311b151cf60ad4e0` |
| `301b0693-b84e-410a-a6fb-f0e34566b0a7` | `1.0.0` | `9` | 2026-05-05 11:00 | `82e748aa9fae244fb2de410bf7f7a71bb70e8979` |

The existing `docs/launch/2026-05-26/testflight-upload-receipt.md` documents build `27` as a historical upload and explicitly says no new TestFlight upload was performed after the 2026-05-26 OCR rescue changes. The latest proven native build is a Release simulator build, not physical TestFlight proof.

## Already Proven Outside Physical Device

- Saved-photo import works in native Release simulator.
- Production Railway OCR/parser returns reviewable work.
- Review cards are created from photo import.
- Reviewed rows can be applied into Today.

Primary existing proof:

- `docs/launch/2026-05-26/scanner-photo-proof.md`
- `docs/launch/2026-05-26/ocr-implementation-proof.md`
- `docs/launch/2026-05-26/fresh-native-screenshots/photo-rescue/`

## Missing Required Physical Proof

The release still lacks:

- device/build identifier from a physical iPhone/TestFlight install
- native camera permission prompt proof
- live camera capture proof
- Railway OCR/parser log or response tied to the physical capture
- review cards created from physical camera capture
- applied-to-Today proof from that capture

## Manual Steps To Unblock

1. Wait for a current TestFlight candidate that includes the OCR rescue state, or upload a new candidate only after the release owner approves the remaining blockers.
2. Install the build on a physical iPhone through TestFlight.
3. Fresh launch the app and complete onboarding/paywall access with sandbox entitlement as needed.
4. Open Scan.
5. Tap Camera and capture a simple syllabus fixture.
6. Accept the native camera permission prompt and capture screenshot or screen recording.
7. Confirm the upload reaches `https://studyplanner-parser-production.up.railway.app/api/syllabus/parse`.
8. Confirm OCR/parser output creates review cards.
9. Confirm reviewed rows apply into Today.
10. Save screenshots/screen recording and Railway response/log excerpt with the build number and device model.

## Recommendation

Do not ship or upload a new build from this machine state. The physical camera blocker remains open until the proof above is captured on real hardware.
