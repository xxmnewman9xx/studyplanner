# iOS WidgetKit Verification

Use a dedicated simulator so other running devices are not disturbed:

```bash
./scripts/verify-ios-widgetkit.sh
```

The script finds or creates `StudyPlanner-Codex-iPhone`, boots only that simulator, prebuilds the iOS project, installs the app with `EXPO_PUBLIC_STORE_CAPTURE=1`, launches it, and prints the App Group container path.

## Manual Widget QA

1. Open the dedicated simulator named `StudyPlanner-Codex-iPhone`.
2. Launch Study Planner with capture mode:

   ```bash
   EXPO_PUBLIC_STORE_CAPTURE=1 npx expo run:ios --device StudyPlanner-Codex-iPhone
   ```

3. Confirm the app opens to the demo semester and the Today dashboard shows a next due item.
4. Long-press the Home Screen, tap `+`, search for Study Planner, and add the small widget.
5. Add the medium widget from the same widget gallery entry.
6. Verify the small widget shows the Next Due surface.
7. Verify the medium widget shows the This Week surface, including overflow or heavy-week context.
8. Return to the app and complete, edit, accept, or ignore an assignment.
9. Return to the Home Screen and confirm the widgets refresh after the app-side change.
10. Relaunch without capture mode and confirm demo data is not seeded:

    ```bash
    npx expo run:ios --device StudyPlanner-Codex-iPhone
    ```

## App Group Payload Check

After the app launches, inspect the shared defaults:

```bash
UDID="$(xcrun simctl list devices available | awk -v name='StudyPlanner-Codex-iPhone' '$0 ~ name { gsub(/[()]/, "", $2); print $2; exit }')"
GROUP_PATH="$(xcrun simctl get_app_container "$UDID" com.mattnewman.studyplanner group.com.mattnewman.studyplanner)"
plutil -p "$GROUP_PATH/Library/Preferences/group.com.mattnewman.studyplanner.plist"
```

The `study-planner-widget-snapshot-v1` value should contain the same JSON contract written by `WidgetSnapshotService`.
