import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const pluginPath = path.join(process.cwd(), "plugins/withStudyPlannerWidget.js");
const nativeWidgetPath = path.join(
  process.cwd(),
  "ios/StudyPlannerWidgetExtension/StudyPlannerWidget.swift"
);

function widgetSources() {
  return fs.existsSync(nativeWidgetPath)
    ? [pluginPath, nativeWidgetPath]
    : [pluginPath];
}

test("native widget placeholder does not ship demo coursework", () => {
  const source = fs.readFileSync(pluginPath, "utf8");
  const placeholderStart = source.indexOf("static let placeholder = StudyPlannerWidgetSnapshot(");
  const placeholderEnd = source.indexOf("struct StudyPlannerWidgetSnapshotItem", placeholderStart);
  assert.notEqual(placeholderStart, -1);
  assert.notEqual(placeholderEnd, -1);

  const placeholder = source.slice(placeholderStart, placeholderEnd);
  assert.ok(placeholder.includes("nextDue: nil"));
  assert.ok(placeholder.includes("demoState: nil"));
  assert.ok(placeholder.includes("Study Planner"));
  assert.ok(!placeholder.includes("Spring 2025 Preview"));
  assert.ok(!placeholder.includes("Problem Set 4"));
  assert.ok(!placeholder.includes("Lab Report"));
});

test("native widget swift computes due labels at render time", () => {
  for (const sourcePath of widgetSources()) {
    const source = fs.readFileSync(sourcePath, "utf8");

    assert.ok(source.includes("func relativeDueLabel"), sourcePath);
    assert.ok(source.includes("DuePill(item: item, date: date)"), sourcePath);
    assert.ok(source.includes("relativeDueLabel(item.dueAt, from: date)"), sourcePath);
  }
});

test("native widget refreshes date-sensitive display around day boundaries", () => {
  for (const sourcePath of widgetSources()) {
    const source = fs.readFileSync(sourcePath, "utf8");

    assert.ok(source.includes("func nextWidgetRefreshDate"), sourcePath);
    assert.ok(source.includes("DateComponents(hour: 0, minute: 1, second: 0)"), sourcePath);
    assert.ok(source.includes("relativeUrgency(item.dueAt, from: date, fallback: item.urgency)"), sourcePath);
    assert.ok(source.includes("urgencyColor(urgency)"), sourcePath);
  }
});
