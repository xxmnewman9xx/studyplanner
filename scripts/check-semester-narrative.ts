import { defaultData } from "./fixture-data";
import { buildSemesterSnapshot } from "../src/intelligence";
import { buildSemesterNarrative, healthBand } from "../src/semesterNarrative";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const snapshot = buildSemesterSnapshot(defaultData);
const narrative = buildSemesterNarrative(defaultData, snapshot);

assert(healthBand(92).label === "On Track", "85+ should be On Track");
assert(healthBand(76).label === "Attention Needed", "70-84 should be Attention Needed");
assert(healthBand(62).label === "Recovery Needed", "55-69 should be Recovery Needed");
assert(healthBand(40).label === "Immediate Action", "0-54 should be Immediate Action");
assert(narrative.state.length > 3 && narrative.state.length < 24, "narrative state should be short");
assert(narrative.primaryDriver.length > 5 && narrative.primaryDriver.length < 80, "primary driver should be concise");
assert(narrative.nextMoveLabel.length > 3 && narrative.nextMoveLabel.length < 42, "next move should be concise");
assert(narrative.dimensions.length === 4, "all four health dimensions should be narrated");
assert(narrative.dimensions.every((dimension) => ["↑", "↓", "→"].includes(dimension.trend)), "dimensions need trend symbols");
assert(narrative.importSummary.assignments === defaultData.tasks.length, "import summary should count assignments");
assert(narrative.importSummary.exams === defaultData.exams.length, "import summary should count exams");

console.log("Semester narrative checks passed", {
  state: narrative.state,
  healthLabel: narrative.healthLabel,
  nextMove: narrative.nextMoveLabel,
  driver: narrative.primaryDriver,
});
