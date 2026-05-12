# Monetization and App Review Final

Score: 7.6/10 before external proof.

## Preserved IAP IDs

- Monthly: com.mattnewman.studyplanner.plus.monthly
- Yearly: com.mattnewman.studyplanner.plus.yearly
- Lifetime: com.mattnewman.studyplanner.plus.lifetime

## Fixed in this pass

- Added submission-mode production verification requiring explicit monthly/yearly/lifetime IDs and a support URL.
- Added iOS archive source preflight audit for entitlement/project wiring; signed App Store archive proof is still required.
- Added tests proving normal verification passes and submission verification fails closed without required env.
- Tightened import trust so unreviewed parser grade items do not enter the planner.
- Guarded reminder/calendar side effects against invalid legacy due dates.

## Blockers

- App Store Connect product status not proven.
- Sandbox monthly/yearly/Lifetime/restore not captured.
- Support URL missing.
- Signed archive entitlements need verification; source preflight reports `aps-environment=development`, so the final archive must prove production APNs entitlement.

Verdict: no-submit until external proof exists.
