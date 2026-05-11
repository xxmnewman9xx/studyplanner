#!/usr/bin/env bash
set -euo pipefail

SIM_NAME="${SIM_NAME:-StudyPlanner-Codex-iPhone}"
BUNDLE_ID="${BUNDLE_ID:-com.mattnewman.studyplanner}"
APP_GROUP_ID="${APP_GROUP_ID:-group.com.mattnewman.studyplanner}"
CAPTURE_MODE="${EXPO_PUBLIC_STORE_CAPTURE:-1}"
PACKAGE_JSON_SNAPSHOT="$(mktemp)"

cp package.json "$PACKAGE_JSON_SNAPSHOT"
cleanup() {
  cp "$PACKAGE_JSON_SNAPSHOT" package.json
  rm -f "$PACKAGE_JSON_SNAPSHOT"
}
trap cleanup EXIT

find_latest_ios_runtime() {
  xcrun simctl list runtimes available |
    awk -F '[()]' '/iOS/ { runtime=$2 } END { print runtime }'
}

find_latest_iphone_device_type() {
  xcrun simctl list devicetypes |
    awk -F '[()]' '/iPhone/ { device=$2 } END { print device }'
}

find_simulator_udid() {
  xcrun simctl list devices available |
    awk -v name="$SIM_NAME" '$0 ~ name {
      gsub(/[()]/, "", $2);
      print $2;
      exit;
    }'
}

RUNTIME_ID="${RUNTIME_ID:-$(find_latest_ios_runtime)}"
DEVICE_TYPE_ID="${DEVICE_TYPE_ID:-$(find_latest_iphone_device_type)}"
UDID="$(find_simulator_udid)"

if [[ -z "$RUNTIME_ID" || -z "$DEVICE_TYPE_ID" ]]; then
  echo "Could not find an available iOS runtime and iPhone device type." >&2
  exit 1
fi

if [[ -z "$UDID" ]]; then
  UDID="$(xcrun simctl create "$SIM_NAME" "$DEVICE_TYPE_ID" "$RUNTIME_ID")"
  echo "Created $SIM_NAME ($UDID)"
else
  echo "Using $SIM_NAME ($UDID)"
fi

xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl bootstatus "$UDID" -b

EXPO_PUBLIC_STORE_CAPTURE="$CAPTURE_MODE" npx expo prebuild --platform ios
EXPO_PUBLIC_STORE_CAPTURE="$CAPTURE_MODE" npx expo run:ios --device "$UDID"
xcrun simctl launch "$UDID" "$BUNDLE_ID" >/dev/null

echo "Launched $BUNDLE_ID on $SIM_NAME ($UDID)"

GROUP_PATH="$(xcrun simctl get_app_container "$UDID" "$BUNDLE_ID" "$APP_GROUP_ID" 2>/dev/null || true)"
if [[ -n "$GROUP_PATH" ]]; then
  echo "App Group container: $GROUP_PATH"
  PREFS_PATH="$GROUP_PATH/Library/Preferences/$APP_GROUP_ID.plist"
  if [[ -f "$PREFS_PATH" ]]; then
    echo "Shared widget defaults:"
    plutil -p "$PREFS_PATH"
  else
    echo "Shared defaults plist has not been written yet: $PREFS_PATH"
  fi
else
  echo "App Group container was not available yet. Relaunch the app and retry the payload check." >&2
fi

cat <<MANUAL_QA

Manual widget verification:
1. In the $SIM_NAME simulator, long-press the Home Screen and add Study Planner small + medium widgets.
2. Confirm small shows Next Due and medium shows This Week.
3. Change an assignment in the app, then return Home and confirm the widget refreshes.
4. Run again without EXPO_PUBLIC_STORE_CAPTURE=1 to confirm production mode does not seed demo data.
MANUAL_QA
