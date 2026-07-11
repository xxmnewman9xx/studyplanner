import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const detailScreens = [
  ["ClassDetail", "Tasks", "classes", "c"],
  ["TaskDetail", "AssessmentDetail", "tasks", "task"],
  ["AssessmentDetail", "Scan", "exams", "exam"],
  ["StudySession", "Notes", "studyBlocks", "block"],
  ["NoteDetail", "NativeHomeWidgetPreview", "notes", "note"],
];

for (const [screen, nextScreen, collection, record] of detailScreens) {
  const start = appSource.indexOf(`function ${screen}(`);
  const end = appSource.indexOf(`\nfunction ${nextScreen}(`, start);
  assert.ok(start >= 0 && end > start, `${screen} source section must be discoverable`);

  const section = appSource.slice(start, end);
  assert.match(section, new RegExp(`const ${record} = data\\.${collection}\\.find\\([^\\n]*\\.id === params\\.id\\);`), `${screen} must resolve its requested record by ID`);
  assert.doesNotMatch(section, new RegExp(`data\\.${collection}\\s*\\[\\s*0\\s*\\]`), `${screen} must never fall back to the first ${collection} record`);
  assert.match(section, new RegExp(`if \\(!${record}\\)`), `${screen} must guard a missing requested record`);
  assert.match(section, /<RecoveryScreen/, `${screen} must give a stale route a recoverable not-found screen`);
}

for (const route of ["classDetail", "taskDetail", "assessmentDetail", "noteDetail"]) {
  assert.ok(
    appSource.includes(`key={\`${route}:\${params.id || ""}\`}`),
    `${route} must remount when navigation changes record identity`
  );
}

console.log("detail route safety gate passed");
