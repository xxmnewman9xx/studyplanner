# iOS Archive Preflight Audit

Generated: 2026-05-12T22:20:27.895Z

Sources:
- `ios/StudyPlannerSyllabusAI/StudyPlannerSyllabusAI.entitlements`
- `ios/StudyPlannerWidgetExtension/StudyPlannerWidgetExtension.entitlements`
- `ios/StudyPlannerSyllabusAI/Info.plist`
- `ios/StudyPlannerWidgetExtension/StudyPlannerWidgetExtension-Info.plist`
- `ios/StudyPlannerSyllabusAI/PrivacyInfo.xcprivacy`
- `ios/StudyPlannerSyllabusAI.xcodeproj/project.pbxproj`

This audit checks native iOS project wiring that can be validated before App Store signing. It does **not** prove a signed App Store archive, production provisioning profile, App Store Connect processing, push-notification entitlement in the final archive, or WidgetKit behavior on device.

## Result

PASS: no source-level iOS archive blockers found. 1 warning(s) remain.

| Check | Status | Detail |
| --- | --- | --- |
| App target entitlements are wired | PASS |  |
| Widget target entitlements are wired | PASS |  |
| App bundle ID is configured | PASS |  |
| Widget bundle ID is configured | PASS |  |
| App App Group entitlement | PASS |  |
| Widget App Group entitlement | PASS |  |
| APNs entitlement exists in app source | PASS |  |
| APNs source entitlement is production | WARN | Current source value is development; final App Store archive must prove signed production entitlement. |
| Widget extension point is WidgetKit | PASS |  |
| Notification usage description exists | PASS |  |
| Calendar usage description exists | PASS |  |
| Reminders usage description exists | PASS |  |
| Transport security blocks arbitrary loads | PASS |  |
| Privacy manifest exists | PASS |  |
| Privacy manifest is included in project | PASS |  |
| Widget extension is embedded in app target | PASS |  |

## Remaining External Proof

- A signed App Store archive must still be produced and inspected for production entitlements.
- The `aps-environment` entitlement must be verified from the signed archive, not inferred from source.
- App Store Connect must still process the build and widgets.
- StoreKit products and restore behavior still need sandbox/App Store Connect proof.
