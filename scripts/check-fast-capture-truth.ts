import { createNaturalLanguageTask, type NaturalLanguageTaskIssue } from "../src/intelligence";
import { defaultData, isoFromOffset } from "./fixture-data";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectFailure(input: string, issue: NaturalLanguageTaskIssue, data = defaultData) {
  const result = createNaturalLanguageTask(input, data);
  assert(!result.ok, `Expected Fast capture to reject ${JSON.stringify(input)}`);
  assert(result.issues.includes(issue), `Expected ${JSON.stringify(input)} to report ${issue}; got ${result.issues.join(", ")}`);
  return result;
}

function expectTask(input: string) {
  const result = createNaturalLanguageTask(input, defaultData);
  if (!result.ok) throw new Error(`Expected Fast capture to accept ${JSON.stringify(input)}; got ${result.issues.join(", ")}`);
  return result.task;
}

expectFailure("", "input");
expectFailure("   ", "input");
expectFailure("finish the worksheet", "class");
expectFailure("finish the worksheet", "date");
expectFailure("please finalize notes due tomorrow", "class");
expectFailure("CHEM lab report", "date");
expectFailure("lab report due tomorrow", "class");
expectFailure("CHEM due tomorrow", "title");
expectFailure("CHEM lab report due Friday", "date");
expectFailure("BIO CHEM lab report due tomorrow", "class-ambiguous");
expectFailure("CHEM lab report due today and tomorrow", "date-ambiguous");
expectFailure("CHEM lab report due 2026-02-30", "date-invalid");
expectFailure("CHEM lab report due tomorrow", "class", { ...defaultData, classes: [] });

const today = expectTask("CHEM lab report due today, estimate 2 hours");
assert(today.title === "lab report", `Expected a real title without capture metadata; got ${today.title}`);
assert(today.classId === "chem", `Expected CHEM to match the real chem class; got ${today.classId}`);
assert(today.dueOffset === 0, `Expected today offset 0; got ${today.dueOffset}`);
assert(today.dueDate === isoFromOffset(0), `Expected today's real date; got ${today.dueDate}`);
assert(today.estimateMinutes === 120, `Expected the explicit two-hour estimate; got ${today.estimateMinutes}`);

const tomorrow = expectTask("FIN 250 case study due tomorrow");
assert(tomorrow.classId === "fin", `Expected full FIN code match; got ${tomorrow.classId}`);
assert(tomorrow.dueOffset === 1, `Expected tomorrow offset 1; got ${tomorrow.dueOffset}`);
assert(tomorrow.dueDate === isoFromOffset(1), `Expected tomorrow's real date; got ${tomorrow.dueDate}`);

const nextWeek = expectTask("CS 214 project milestone due next week");
assert(nextWeek.classId === "cs", `Expected CS 214 class match; got ${nextWeek.classId}`);
assert(nextWeek.dueOffset === 7, `Expected next-week offset 7; got ${nextWeek.dueOffset}`);
assert(nextWeek.dueDate === isoFromOffset(7), `Expected next week's real date; got ${nextWeek.dueDate}`);

const isoDate = isoFromOffset(10);
const explicitIso = expectTask(`BIO genetics worksheet due ${isoDate}`);
assert(explicitIso.classId === "bio", `Expected BIO class match; got ${explicitIso.classId}`);
assert(explicitIso.dueOffset === 10, `Expected ISO offset 10; got ${explicitIso.dueOffset}`);
assert(explicitIso.dueDate === isoDate, `Expected ISO date ${isoDate}; got ${explicitIso.dueDate}`);

const className = expectTask("World essay outline due tomorrow");
assert(className.classId === "hist", `Expected a boundary-safe class-name match; got ${className.classId}`);

console.log("Fast capture truth checks passed", {
  acceptedDates: [today.dueDate, tomorrow.dueDate, nextWeek.dueDate, explicitIso.dueDate],
  matchedClasses: [today.classId, tomorrow.classId, nextWeek.classId, explicitIso.classId, className.classId],
});
