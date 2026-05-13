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
    styleId: "emerald"
  });
});

test("widget preferences default to native-supported medium this week", () => {
  assert.deepEqual(defaultWidgetPreferences, {
    size: "medium",
    focus: "thisWeek",
    styleId: "cleanWhite"
  });
});

test("widget preferences fall back safely when stored values are invalid", () => {
  const preferences = normalizeWidgetPreferences({
    size: "lock" as never,
    focus: "courseFocus" as never,
    styleId: "neonChaos" as never
  });

  assert.deepEqual(preferences, defaultWidgetPreferences);
});
