# Build 49 Stress Report

## Result
PARTIAL PASS.

The locked funnel stress runs passed, but final release readiness is blocked by incomplete real homescreen widget validation. TestFlight submission was not attempted.

## Repeated Simulator Runs
- Fresh install onboarding runs: 10/10 PASS
- Skip-to-locked-dashboard runs: 10/10 PASS
- Import-preview-to-paywall runs: 10/10 PASS
- Deep-link locked route runs: 11/10 PASS
- Old/corrupt storage migration runs: 5/5 PASS

Stress log:

```text
qa/build49-stress-loop-results.log
```

## Fresh Install Onboarding
All 10 runs completed onboarding and stopped at import options with:

```json
{"premium":false,"onboardingComplete":true,"classes":0,"tasks":0,"exams":0,"notes":0}
```

Representative screenshots:
- `qa/build49-stress-fresh-1.png`
- `qa/build49-stress-fresh-10.png`

## Skip To Locked Dashboard
All 10 runs skipped import and remained locked with no active data:

```json
{"premium":false,"onboardingComplete":true,"classes":0,"tasks":0,"exams":0,"notes":0}
```

Representative screenshots:
- `qa/build49-stress-skip-1.png`
- `qa/build49-stress-skip-10.png`

## Import Preview To Paywall
All 10 runs used paste/manual syllabus preview, reviewed parsed value, tapped the apply/unlock CTA, and reached the hard paywall without applying data.

Representative screenshots:
- `qa/build49-review-after-multitap.png`
- `qa/build49-stress-import-paywall-1.png`
- `qa/build49-stress-import-paywall-10.png`

Storage stayed locked and empty in every run:

```json
{"premium":false,"onboardingComplete":true,"classes":0,"tasks":0,"exams":0,"notes":0}
```

## Deep Links
Routes tested without entitlement:
- `studyplanner://today`
- `studyplanner://scan`
- `studyplanner://notes`
- `studyplanner://classes`
- `studyplanner://plan`
- `studyplanner://study`
- `studyplanner://widgets`
- `studyplanner://widget`
- `studyplanner://reminders`
- `studyplanner://notification`
- `studyplanner://today`

All 11 stayed locked or preview-only, with no active data applied.

Representative screenshots:
- `qa/build49-stress-deeplink-1.png`
- `qa/build49-stress-deeplink-10.png`
- `qa/build49-stress-deeplink-final.png`

## Old And Corrupt Storage
Cases tested:
- Old Build 47/48-style `osLive` without premium
- Stale local premium flag, empty data
- Stale local premium flag with old coursework
- Pending import/import history without premium
- Corrupted JSON

Results:
- Stale premium was reset to `premium:false`.
- Old `osLive` migrated to onboarding complete without premium.
- Pending import did not unlock.
- Corrupted JSON reset to valid default storage.
- No case granted entitlement.

Representative outputs:

```text
old_storage_migration,1,old_oslive_no_premium,{"validJson":true,"premium":false,"onboardingComplete":true,"osLive":true,"classes":0,"tasks":0,"exams":0,"imports":0}
old_storage_migration,2,stale_premium_empty,{"validJson":true,"premium":false,"onboardingComplete":true,"osLive":true,"classes":0,"tasks":0,"exams":0,"imports":0}
old_storage_migration,3,stale_premium_old_coursework,{"validJson":true,"premium":false,"onboardingComplete":true,"osLive":true,"classes":1,"tasks":1,"exams":0,"imports":0}
old_storage_migration,4,pending_import_no_premium,{"validJson":true,"premium":false,"onboardingComplete":true,"osLive":true,"classes":0,"tasks":0,"exams":0,"imports":1}
old_storage_migration,5,corrupt_json,{"validJson":true,"premium":false,"onboardingComplete":false,"osLive":false,"classes":0,"tasks":0,"exams":0,"imports":0}
```

Screenshots:
- `qa/build49-stress-migration-1-old_oslive_no_premium.png`
- `qa/build49-stress-migration-2-stale_premium_empty.png`
- `qa/build49-stress-migration-3-stale_premium_old_coursework.png`
- `qa/build49-stress-migration-4-pending_import_no_premium.png`
- `qa/build49-stress-migration-5-corrupt_json.png`

## Widget Stress Status
Static/widget gating remains configured:
- Widget bundle: `com.mattnewman.studyplanner.widgets`
- App Group: `group.com.mattnewman.studyplanner`
- Widget extension exists in the simulator app bundle: `PlugIns/ExpoWidgetsTarget.appex`
- Build 49 check requires widget sync to be premium-gated.

Physical homescreen widget validation did not pass because the available simulator install had no active `GroupContainers`, and a signed simulator build failed before producing an installable app.

## Final Verification Status
The full final verification suite was not rerun after the widget validation blocker. Earlier Build 49 automated verification had passed, but current submission readiness remains blocked by incomplete physical widget validation.

## Decision
No run showed real dashboard access without entitlement.

Submission readiness: FAIL until real homescreen widgets can be validated on a signed install or physical device.
