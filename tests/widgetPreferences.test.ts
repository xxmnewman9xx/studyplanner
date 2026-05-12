import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultWidgetPreferences,
  normalizeWidgetPreferences
} from "../src/services/widgetPreferences";

test("widget preferences keep valid user choices", () => {
  const preferences = normalizeWidgetPreferences({
    size: "lock",
    focus: "courseFocus",
    styleId: "emerald"
  });

  assert.deepEqual(preferences, {
    size: "lock",
    focus: "courseFocus",
    styleId: "emerald"
  });
});

test("widget preferences fall back safely when stored values are invalid", () => {
  const preferences = normalizeWidgetPreferences({
    size: "poster" as never,
    focus: "semesterPulse" as never,
    styleId: "neonChaos" as never
  });

  assert.deepEqual(preferences, defaultWidgetPreferences);
});
