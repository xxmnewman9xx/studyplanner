import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const pluginPath = path.join(process.cwd(), "plugins/withStudyPlannerWidget.js");

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
  const source = fs.readFileSync(pluginPath, "utf8");

  assert.ok(source.includes("func relativeDueLabel"));
  assert.ok(source.includes("DuePill(item: item, date: date)"));
  assert.ok(source.includes("relativeDueLabel(item.dueAt, from: date)"));
});
