# App Store Preview Widget Storyboard

## Scope

Windows prepared the deterministic data and storyboard. Final screenshots and videos must be captured on Mac after native WidgetKit is implemented and verified.

Enable preview mode with:

```bash
EXPO_PUBLIC_STORE_CAPTURE=1
```

This mode loads deterministic demo data, does not persist the demo planner blob, and does not fake purchase execution.

## Demo Data States

The preview seed includes:

- 4 courses
- 20 non-exam assignments
- 3 exams
- 2 overdue open items
- 5 due-this-week items
- mixed confidence review inbox items
- completed items
- one heavy-week warning
- one messy syllabus text sample
- one clean widget snapshot candidate

Primary demo date:

```text
October 5, 2026 at 12:00 PM America/New_York
```

## Preferred Capture Devices

Capture final assets on Mac in Simulator.

Recommended sizes:

- iPhone 6.9-inch display for primary App Store screenshots
- iPhone 6.5-inch display if Apple requires fallback assets
- iPhone 5.5-inch only if the current App Store Connect slot requires legacy screenshots

Use actual app screens and actual widgets. Do not create fake app UI outside the app. Polished framing around real captures is acceptable.

## Shot List

### 1. Messy Syllabus

Screen: Scan tab in capture mode.

State:

- Show `Preview syllabus` text block.
- Show file/photo/camera controls.
- Review Inbox should already contain demo parse results below the fold.

Caption key:

```text
preview.messySyllabus.caption
```

Caption:

```text
Turn a messy syllabus into a real plan.
```

### 2. Upload / Scan

Screen: Scan tab.

State:

- Capture import controls and guided upload/review/apply rail.
- If recording video, tap File or show the parser loading state with a prepared text syllabus.

Caption key:

```text
preview.scan.caption
```

Caption:

```text
Scan deadlines without losing control.
```

### 3. Review Inbox

Screen: Review Inbox section.

State:

- Mixed confidence badges visible.
- At least one `Needs review` item.
- At least one accepted item.
- Show Accept high action.

Caption key:

```text
preview.reviewInbox.caption
```

Caption:

```text
Accept, edit, or ignore every extracted item.
```

### 4. Today Dashboard

Screen: Today tab.

State:

- Review count visible.
- Overdue count visible.
- Next due card visible.
- Due Today and This Week Planner visible if possible.

Caption key:

```text
preview.today.caption
```

Caption:

```text
Know what matters today.
```

### 5. This Week Planner

Screen: Today tab, scrolled to This Week Planner.

State:

- Heavy week warning visible.
- Exam strip visible.
- Grouped day rows visible.

Caption key:

```text
preview.week.caption
```

Caption:

```text
Spot heavy weeks before they hit.
```

### 6. Class Hub

Screen: Courses tab / Class Hub.

State:

- Selected course hub card visible.
- Progress, open count, exam count, meeting count visible.
- Reminder defaults and syllabus source visible.

Caption key:

```text
preview.classHub.caption
```

Caption:

```text
See every class from one hub.
```

### 7. Home Screen Widget

Screen: iOS Home Screen.

State:

- Small widget: Next Due.
- Medium widget: This Week.
- Use capture seed snapshot.
- Verify data came from the app-side `WidgetSnapshot` contract.

Caption key:

```text
preview.homeWidget.caption
```

Caption:

```text
Your next deadline stays visible.
```

### 8. Lock Screen Widget Concept

Screen: iOS Lock Screen if implemented in the Mac phase.

State:

- Countdown / due soon item.
- If Lock Screen is not implemented for v1.1, capture the native handoff/spec screen or omit this asset.

Caption key:

```text
preview.lockWidget.caption
```

Caption:

```text
Countdowns where you already look.
```

### 9. Semester-Control Hero

Screen: Today tab or composed contact sheet from real captures.

State:

- Today Dashboard plus widget capture.
- Do not fake UI; use real app/widget screenshots only.

Caption key:

```text
preview.hero.caption
```

Caption:

```text
Run the semester from one command center.
```

## Video Preview Story

Sequence:

1. Show messy syllabus text.
2. Tap scan/upload.
3. Review mixed confidence extracted items.
4. Accept high-confidence items.
5. Move to Today.
6. Complete one item.
7. Scroll This Week Planner.
8. Open Class Hub.
9. Cut to Home Screen widget.
10. End on final command-center hero.

Target duration:

```text
15 to 30 seconds
```

## Mac Capture Checklist

- Pull latest `v1-1-widget-command-center`.
- Build/run app with `EXPO_PUBLIC_STORE_CAPTURE=1`.
- Confirm demo data appears.
- Confirm production mode does not show demo data.
- Implement and verify WidgetKit first.
- Capture real app screens.
- Capture real widgets.
- Export assets into:

```text
artifacts/store-preview-widget-update
```

- Record filenames, dimensions, simulator model, and iOS version.
