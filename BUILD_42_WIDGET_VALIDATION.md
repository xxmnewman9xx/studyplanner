# Build 42 Widget Validation

Date: 2026-06-05  
Build: 1.0.3 (42)

## Evidence

- Widget App Group: `group.com.mattnewman.studyplanner`
- Widget bundle: `com.mattnewman.studyplanner.widgets`
- App URL scheme: `studyplanner`
- App Group preference snapshot inspected from simulator.
- Timeline entries present for:
  - `studyplanner.today`
  - `studyplanner.upcoming`
  - `studyplanner.week`
  - `studyplanner.classProgress`

## Results

| Check | Result | Notes |
|---|---:|---|
| WidgetKit extension target exists | Pass | `ios/ExpoWidgetsTarget` exists and builds. |
| App Group entitlement | Pass | App and widget extension both use `group.com.mattnewman.studyplanner`. |
| Snapshot generation | Pass | App Group plist contains widget layouts and timelines. |
| SemesterSnapshot integration | Pass | Timeline values include health/next action/class pulse data. |
| Deep link | Pass | Widget URLs are `studyplanner://today`; URL scheme is registered in `Info.plist`. |
| Home Screen placement | Not completed | Simulator placement could not be driven reliably. |
| Lock Screen placement | Not completed | Same limitation as Home Screen placement. |

## Decision

Widget architecture and data sync are release-ready by build evidence. Physical placement screenshots are still missing and should be captured on a real device or with manual simulator interaction before App Store review confidence is considered complete.

