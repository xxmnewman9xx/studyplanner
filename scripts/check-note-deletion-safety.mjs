import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const detailStart = app.indexOf("function NoteDetail(");
const detailEnd = app.indexOf("\nfunction NativeHomeWidgetPreview", detailStart);

assert.ok(detailStart >= 0 && detailEnd > detailStart, "NoteDetail source must be present");

const detail = app.slice(detailStart, detailEnd);
assert.match(detail, /const deleteNote = \(\) => Alert\.alert\(/, "Note deletion must require confirmation");
assert.match(detail, /style: "destructive"/, "Note deletion must be marked destructive");
assert.match(detail, /notes: d\.notes\.filter\(\(item\) => item\.id !== note\.id\)/, "Deletion must remove only the open note");
assert.match(detail, /Tasks you already added will stay in your planner\./, "Confirmation must explain that added tasks are retained");
assert.match(detail, /onPress=\{deleteNote\}/, "NoteDetail must expose the delete action");

console.log("note deletion safety: pass");
