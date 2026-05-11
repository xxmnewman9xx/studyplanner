import { WidgetSnapshot } from "../models";
import {
  buildWidgetSnapshot,
  WidgetSnapshotInput
} from "../logic/widgetSnapshot";
import { saveJson } from "./storage";

export const widgetSnapshotStorageKey = "study-planner-widget-snapshot-v1";

export const WidgetSnapshotService = {
  storageKey: widgetSnapshotStorageKey,
  build: buildWidgetSnapshot,
  write: writeWidgetSnapshot
};

export async function writeWidgetSnapshot(
  input: WidgetSnapshotInput,
  now = new Date()
): Promise<WidgetSnapshot> {
  const snapshot = buildWidgetSnapshot(input, now);
  await saveJson(widgetSnapshotStorageKey, snapshot);
  return snapshot;
}
