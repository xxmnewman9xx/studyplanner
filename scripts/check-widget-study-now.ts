// Study Now line on the Today widget: builder, sync timeline, and renderer.
// Widgets only display text the app wrote; nothing here generates copy.
import { readFileSync } from "node:fs";
import Module from "node:module";
import { fixtureData } from "./fixture-data";
import { dateKey } from "../src/intelligence";
import type { AppData } from "../src/types";
import type { NativeWidgetSnapshot } from "../src/widgetEngine";

type WidgetEngine = typeof import("../src/widgetEngine");
type TimelineCall = { widget: string; kind: "snapshot" | "timeline"; entries: Array<{ date: Date; props: NativeWidgetSnapshot }> };

const failures: string[] = [];
let passed = 0;

function expect(condition: unknown, message: string) {
  if (condition) passed += 1;
  else failures.push(message);
}

function premiumData(): AppData {
  const data = JSON.parse(JSON.stringify(fixtureData)) as AppData;
  data.prefs.premium = true;
  return data;
}

const calls: TimelineCall[] = [];

function fakeWidget(widget: string) {
  let entries: TimelineCall["entries"] = [];
  return {
    updateSnapshot(props: NativeWidgetSnapshot) {
      entries = [{ date: new Date(), props }];
      calls.push({ widget, kind: "snapshot", entries });
    },
    updateTimeline(next: TimelineCall["entries"]) {
      entries = next;
      calls.push({ widget, kind: "timeline", entries: next });
    },
    async getTimeline() {
      return entries;
    },
  };
}

function installShims() {
  type ModuleLoader = (request: string, parent: unknown, isMain: boolean) => unknown;
  const loader = Module as unknown as { _load: ModuleLoader };
  const original = loader._load;
  const widgets = {
    StudyPlannerTodayWidget: fakeWidget("today"),
    StudyPlannerUpcomingWidget: fakeWidget("upcoming"),
    StudyPlannerWeekWidget: fakeWidget("week"),
    StudyPlannerClassProgressWidget: fakeWidget("classProgress"),
  };
  loader._load = (request, parent, isMain) => {
    if (request === "react-native") return { Platform: { OS: "ios" } };
    if (request === "./widgets/StudyPlannerWidgets") return widgets;
    return original(request, parent, isMain);
  };
  return () => {
    loader._load = original;
  };
}

const JS_GLOBALS = new Set(["String", "Math", "Number", "Array", "Object", "JSON", "Boolean", "undefined", "NaN", "Infinity", "StudyPlannerWidgetLayout"]);

function loadLayout() {
  const source = readFileSync("src/widgets/StudyPlannerWidgets.tsx", "utf8");
  const match = source.match(/const layoutSource = `([\s\S]*?)`;/);
  if (!match) throw new Error("layoutSource not found");
  const modifier = (name: string) => (...args: unknown[]) => ({ modifier: name, args });
  const globals = new Proxy(
    { shapes: { circle: () => "circle", roundedRectangle: (options: unknown) => ({ roundedRectangle: options }) } } as Record<string, unknown>,
    {
      has: (_target, key) => typeof key === "string" && !JS_GLOBALS.has(key),
      get: (target, key) => (typeof key === "string" && key in target ? target[key] : modifier(String(key))),
    }
  );
  // eslint-disable-next-line no-new-func
  const factory = new Function("globals", `with (globals) { ${match[1]}\n }\n return StudyPlannerWidgetLayout;`);
  return factory(globals) as (props: NativeWidgetSnapshot, environment: Record<string, unknown>) => unknown;
}

async function main() {
  // The shim stays installed until after the sync checks: syncNativeWidgets requires the widgets module lazily.
  const restore = installShims();
  const engine: WidgetEngine = await import("../src/widgetEngine");
  const today = dateKey(new Date());
  const studyNow = { line: "Now: 25 min BIO 101 ch. 7", reason: "Exam in 3 days.", dateKey: today };

  // 1. Builder: no option means no change.
  const baseline = engine.buildNativeWidgetSnapshots(premiumData());
  expect(baseline.today.studyNowLine === undefined && baseline.today.studyNowReason === undefined, "no studyNow option leaves the Today snapshot unchanged");
  const explicitNull = engine.buildNativeWidgetSnapshots(premiumData(), undefined, { studyNow: null });
  expect(JSON.stringify({ ...explicitNull.today, generatedAt: "", updatedLabel: "" }) === JSON.stringify({ ...baseline.today, generatedAt: "", updatedLabel: "" }), "studyNow: null matches the baseline snapshot");

  // 2. Builder: today's line lands on Today only.
  const withLine = engine.buildNativeWidgetSnapshots(premiumData(), undefined, { studyNow });
  expect(withLine.today.studyNowLine === studyNow.line, "Today snapshot carries the Study Now line");
  expect(withLine.today.studyNowReason === studyNow.reason, "Today snapshot carries the Study Now reason");
  expect(withLine.today.footnote === baseline.today.footnote, "existing Today footnote is preserved as the fallback");
  for (const kind of ["upcoming", "week", "classProgress"] as const) {
    expect(withLine[kind].studyNowLine === undefined, `${kind} widget never carries the Study Now line`);
  }

  // 3. Builder: stale-day, blank, and locked inputs are ignored.
  const stale = engine.buildNativeWidgetSnapshots(premiumData(), undefined, { studyNow: { ...studyNow, dateKey: "2000-01-01" } });
  expect(stale.today.studyNowLine === undefined, "a line built for another day is ignored");
  const blank = engine.buildNativeWidgetSnapshots(premiumData(), undefined, { studyNow: { line: "   " } });
  expect(blank.today.studyNowLine === undefined, "a blank line is ignored");
  const lockedData = premiumData();
  lockedData.prefs.premium = false;
  const locked = engine.buildNativeWidgetSnapshots(lockedData, undefined, { studyNow });
  expect(locked.today.studyNowLine === undefined, "locked widgets never show Study Now");

  // 4. Sync: a midnight entry drops the line; no line keeps updateSnapshot.
  calls.length = 0;
  const synced = await engine.syncNativeWidgets(premiumData(), undefined, { studyNow });
  const todayCall = calls.find((call) => call.widget === "today");
  expect(synced.state === "synced", "sync with Study Now confirms timelines");
  expect(todayCall?.kind === "timeline" && todayCall.entries.length === 2, "Today widget gets a two-entry timeline when Study Now is present");
  const midnight = todayCall?.entries[1];
  expect(Boolean(midnight) && midnight!.date.getHours() === 0 && midnight!.date.getMinutes() === 0 && dateKey(midnight!.date) !== today, "second entry starts at the next local midnight");
  expect(midnight?.props.studyNowLine === undefined && midnight?.props.studyNowReason === undefined, "midnight entry has no Study Now text");
  expect(todayCall?.entries[0].props.studyNowLine === studyNow.line, "first entry shows the Study Now line");

  calls.length = 0;
  await engine.syncNativeWidgets(premiumData());
  expect(calls.find((call) => call.widget === "today")?.kind === "snapshot", "without Study Now the Today widget keeps updateSnapshot");
  restore();

  // 5. Renderer: medium and accessory rectangular show the line; fallback is the footnote.
  const layout = loadLayout();
  const render = (props: NativeWidgetSnapshot, widgetFamily: string) => JSON.stringify(layout(props, { widgetFamily }));
  for (const family of ["systemMedium", "accessoryRectangular"]) {
    const withText = render(withLine.today, family);
    const withoutText = render(baseline.today, family);
    expect(withText.includes(studyNow.line), `${family} renders the Study Now line`);
    expect(!withoutText.includes(studyNow.line) && withoutText.includes(JSON.stringify(baseline.today.footnote).slice(1, -1)), `${family} falls back to the footnote without Study Now`);
  }
  const upcomingWithLine = { ...withLine.upcoming, studyNowLine: studyNow.line };
  expect(!render(upcomingWithLine, "systemMedium").includes(studyNow.line), "non-Today widgets ignore a stray studyNowLine prop");

  // 6. Extensions never run inference.
  const rendererSource = readFileSync("src/widgets/StudyPlannerWidgets.tsx", "utf8");
  expect(!/FoundationModels|LanguageModelSession|appleIntelligence/.test(rendererSource), "widget renderer has no model or Apple Intelligence imports");

  if (failures.length) {
    console.error("Widget Study Now checks failed:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }
  console.log(`Widget Study Now checks passed (${passed} assertions).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
