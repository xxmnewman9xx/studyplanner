import { readFileSync } from "node:fs";

const source = readFileSync("App.tsx", "utf8");
const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

expect(source.includes("function isValidPlannerTime(value: string)"), "manual forms must validate 12-hour and 24-hour times");
expect(source.includes('if (!draft.code.trim() && !draft.name.trim())'), "manual class creation must reject a fabricated blank class");
expect(source.includes('if (!missingDate && !isValidDateInput(dueDate))'), "class work creation must reject impossible nonblank dates");
expect(source.includes('if (draft.dueDate.trim() && !isValidDateInput(draft.dueDate.trim()))'), "task editing must reject impossible dates");
expect(source.includes('if (!isValidDateInput(draft.date.trim()))'), "assessment editing must reject impossible dates");
expect(source.includes("const updated = { ...d, tasks, studyBlocks: buildStudyPlan({ ...d, tasks }) };"), "task completion must rebuild the study plan");
expect(source.includes("const toggleSubtask = (index: number)") && source.includes("subtasks: next"), "subtask taps must persist immediately");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("manual edit-form safety checks passed");
