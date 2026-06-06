import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildSemesterSnapshot } from "../src/intelligence";
import { buildSemesterNarrative } from "../src/semesterNarrative";
import { defaultData } from "./fixture-data";

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf8");
const appJson = JSON.parse(read("app.json")).expo;
const appSource = read("App.tsx");
const widgetSource = read("src/widgetEngine.ts");
const failures: string[] = [];

function expect(condition: unknown, message: string) {
  if (!condition) failures.push(message);
}

const snapshot = buildSemesterSnapshot(defaultData);
const narrative = buildSemesterNarrative(defaultData, snapshot);

expect(["45", "46", "47", "48"].includes(appJson.ios?.buildNumber), "iOS build number must remain in the Build 45+ delight release train");
expect(appJson.version === "1.0.3", "version must remain 1.0.3");
expect(appJson.ios?.bundleIdentifier === "com.mattnewman.studyplanner", "bundle id must remain com.mattnewman.studyplanner");
expect(appSource.includes("Keep seeing where you stand.") || appSource.includes("Know your semester.") || appSource.includes("build your live semester"), "paywall must sell continuity and visibility");
expect(appSource.includes("Built from your syllabus."), "post-import completion must make the source/value clear");
expect(appSource.includes("pulseScale"), "post-import success pulse must exist");
expect(appSource.includes("Next Move") && appSource.includes("narrative.nextMoveDetail"), "health/next move detail must remain visible");
expect(appSource.includes("Notes → Preparedness → Class Pulse"), "notes motivation loop must remain visible");
expect(widgetSource.includes("headline: narrative.pressureLabel"), "week widget must lead with pressure state");
expect(widgetSource.includes("footnote: narrative.nextMoveDetail"), "next widget must explain the action");
expect(widgetSource.includes("headline: narrative.widgetLabel"), "today widget must match dashboard narrative");
expect(widgetSource.includes('headline: "Next Move"'), "upcoming widget must be a daily next-move surface");

mkdirSync(join(root, "qa", "build45"), { recursive: true });
const report = `# Build 45 Delight Check

## Result
${failures.length ? "FAIL" : "PASS"}

## Metadata
- Version: ${appJson.version}
- Build: ${appJson.ios?.buildNumber}
- Bundle: ${appJson.ios?.bundleIdentifier}

## Checks
- Value-first paywall copy: ${appSource.includes("Keep seeing where you stand.") || appSource.includes("Know your semester.") || appSource.includes("build your live semester") ? "PASS" : "FAIL"}
- Post-import source/value line: ${appSource.includes("Built from your syllabus.") ? "PASS" : "FAIL"}
- Success pulse: ${appSource.includes("pulseScale") ? "PASS" : "FAIL"}
- State-first health hierarchy: ${appSource.includes("Next Move") && appSource.includes("narrative.nextMoveDetail") ? "PASS" : "FAIL"}
- Notes motivation loop: ${appSource.includes("Notes → Preparedness → Class Pulse") ? "PASS" : "FAIL"}
- Widget daily touchpoint copy: ${widgetSource.includes("headline: narrative.pressureLabel") && widgetSource.includes("footnote: narrative.nextMoveDetail") ? "PASS" : "FAIL"}

## Narrative Sample
- State: ${narrative.state}
- Driver: ${narrative.primaryDriver}
- Next Move: ${narrative.nextMoveLabel}
- Widget: ${narrative.widgetLabel}

${failures.length ? `## Failures\n${failures.map((failure) => `- ${failure}`).join("\n")}\n` : ""}
`;

writeFileSync(join(root, "BUILD_45_DELIGHT_CHECK.md"), report);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Build 45 delight checks passed");
