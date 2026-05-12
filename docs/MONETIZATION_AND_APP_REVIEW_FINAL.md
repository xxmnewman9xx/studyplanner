# Monetization and App Review Final

Score: 7.6/10 before external proof.

## Preserved IAP IDs

- Monthly: com.mattnewman.studyplanner.plus.monthly
- Yearly: com.mattnewman.studyplanner.plus.yearly
- Lifetime: com.mattnewman.studyplanner.plus.lifetime

## Fixed in this pass

- Added submission-mode production verification requiring explicit monthly/yearly/lifetime IDs and a support URL.
- Added tests proving normal verification passes and submission verification fails closed without required env.
- Tightened import trust so unreviewed parser grade items do not enter the planner.
- Guarded reminder/calendar side effects against invalid legacy due dates.

## Blockers

- App Store Connect product status not proven.
- Sandbox monthly/yearly/Lifetime/restore not captured.
- Support URL missing.
- Signed archive entitlements need verification.

Verdict: no-submit until external proof exists.
