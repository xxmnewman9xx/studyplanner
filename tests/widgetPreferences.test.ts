import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultWidgetPreferences,
  normalizeWidgetPreferences
} from "../src/services/widgetPreferences";

test("widget preferences keep valid user choices", () => {
  const preferences = normalizeWidgetPreferences({
    size: "small",
    focus: "nextDue",
    styleId: "emerald"
  });

  assert.deepEqual(preferences, {
    size: "small",
    focus: "nextDue",
    styleId: "emerald",
    courseFocusId: "all",
    layoutId: "standard"
  });
});

test("widget preferences default to native-supported medium this week", () => {
  assert.deepEqual(defaultWidgetPreferences, {
    size: "medium",
    focus: "thisWeek",
    styleId: "glass",
    courseFocusId: "all",
    layoutId: "standard"
  });
});

test("widget preferences keep class focus and layout choices", () => {
  const preferences = normalizeWidgetPreferences({
    size: "medium",
    focus: "classFocus",
    styleId: "softGradient",
    courseFocusId: "chem-101",
    layoutId: "compact"
  });

  assert.deepEqual(preferences, {
    size: "medium",
    focus: "classFocus",
    styleId: "softGradient",
    courseFocusId: "chem-101",
    layoutId: "compact"
  });
});

test("widget preferences fall back safely when stored values are invalid", () => {
  const preferences = normalizeWidgetPreferences({
    size: "lock" as never,
    focus: "lockScreen" as never,
    styleId: "neonChaos" as never,
    courseFocusId: "" as never,
    layoutId: "poster" as never
  });

  assert.deepEqual(preferences, defaultWidgetPreferences);
});
