import { NativeModules, Platform } from "react-native";

import { WidgetSnapshot } from "../models";

type StudyPlannerWidgetBridgeModule = {
  writeSnapshot?: (snapshotJson: string) => void | Promise<void>;
};

export const widgetAppGroupIdentifier = "group.com.mattnewman.studyplanner";

export async function mirrorWidgetSnapshotToNative(
  snapshot: WidgetSnapshot
): Promise<void> {
  if (Platform.OS !== "ios") return;

  const bridge = NativeModules.StudyPlannerWidgetBridge as
    | StudyPlannerWidgetBridgeModule
    | undefined;

  if (typeof bridge?.writeSnapshot !== "function") return;

  await bridge.writeSnapshot(JSON.stringify(snapshot));
}
