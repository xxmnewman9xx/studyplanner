# Build 49 Post-Upload Widget QA

Run this checklist from the signed Build 49 TestFlight install on a real iPhone.

## Locked State
1. Install Build 49 from TestFlight.
2. Complete onboarding.
3. Choose `Skip for now`.
4. Confirm the locked dashboard appears.
5. Confirm Semester Health is `0 / locked`.
6. Confirm there is no demo data and no active semester data.
7. Add a Home Screen widget.
8. Confirm the widget shows locked/no-data state.
9. Tap the widget.
10. Confirm the app opens locked dashboard or paywall, not the unlocked app.

## Preview State
1. Install or reset Build 49.
2. Complete onboarding.
3. Import or paste a syllabus preview.
4. Review parsed preview value.
5. Do not purchase or restore.
6. Add a Home Screen widget.
7. Confirm the widget does not show applied semester data.
8. Tap the widget.
9. Confirm the app remains locked or returns to paywall/preview.

## Unlocked State
1. Purchase or restore entitlement.
2. Apply pending import.
3. Confirm the app routes to Today.
4. Confirm a real SemesterSnapshot exists.
5. Add or refresh a Home Screen widget.
6. Confirm the widget shows SemesterSnapshot-driven state.
7. Tap the widget.
8. Confirm the app opens Today.

## Lock Screen Widgets
If supported on the device and widget family:
1. Add each supported StudyPlanner Lock Screen widget.
2. Confirm locked users see locked/no-data state.
3. Confirm preview-only users do not see applied semester data.
4. Confirm unlocked users see appropriate SemesterSnapshot state.
5. Tap each Lock Screen widget and confirm route gating matches entitlement.

## Pass Criteria
- Locked and preview-only users never see real applied semester data in widgets.
- Widget taps never bypass the premium gate.
- Unlocked users see current SemesterSnapshot data.
- Widget refresh reflects App Group data after purchase/restore and schedule apply.
