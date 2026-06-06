import { createWidget } from "expo-widgets";
import type { NativeWidgetSnapshot } from "../widgetEngine";

type WidgetLayout = (props: NativeWidgetSnapshot, environment: object) => any;

const layoutSource = `
function StudyPlannerWidgetLayout(props, environment) {
  "widget";

  function view(type, props, key) {
    return { type: type, key: key || null, props: props || {} };
  }

  function text(value, modifiers) {
    return view("TextView", { text: String(value || ""), modifiers: modifiers || [] });
  }

  function circle(size, color) {
    return view("CircleView", {
      modifiers: [
        frame({ width: size, height: size }),
        background(color, shapes.circle())
      ]
    });
  }

  var items = props.items || [];
  var isMedium = environment.widgetFamily === "systemMedium";
  var isAccessoryCircular = environment.widgetFamily === "accessoryCircular";
  var isAccessoryRectangular = environment.widgetFamily === "accessoryRectangular";
  var isAccessoryInline = environment.widgetFamily === "accessoryInline";
  var accent = props.accentColor || "#0A84FF";
  var bg = props.backgroundColor || "#FFFFFF";
  var ink = accent === "#000000" || accent === "#111111" ? "#050505" : "#111318";
  var muted = "#686D76";
  var progress = Math.max(0, Math.min(1, props.progress || 0));
  var weekLabels = props.weekLabels || ["M", "T", "W", "T", "F", "S", "S"];
  var weekCounts = props.weekCounts || [];
  var maxWeek = 1;
  for (var wc = 0; wc < weekCounts.length; wc += 1) maxWeek = Math.max(maxWeek, weekCounts[wc] || 0);
  var rows = [];
  for (var i = 0; i < Math.min(items.length, isMedium ? 2 : 1); i += 1) {
    var item = items[i];
    rows.push(view("HStackView", {
      alignment: "center",
      spacing: 7,
      modifiers: [frame({ maxWidth: 320 })],
      children: [
        circle(7, accent),
        text(item.courseCode || "", [font({ size: 10, weight: "black" }), foregroundStyle(accent), lineLimit(1)]),
        text(item.title || "", [font({ size: 11, weight: "semibold" }), foregroundStyle(ink), lineLimit(1)]),
        view("SpacerView", { minLength: 2 }),
        text(item.dueLabel || "", [font({ size: 10, weight: "bold" }), foregroundStyle(muted), lineLimit(1)])
      ]
    }, item.id || String(i)));
  }

  if (isAccessoryInline) {
    return text(props.headline + ": " + props.value + " " + props.detail, [
      font({ size: 13, weight: "semibold" }),
      foregroundStyle(ink),
      lineLimit(1),
      widgetURL(props.openURL || "studyplanner://today")
    ]);
  }

  if (isAccessoryCircular) {
    return view("ZStackView", {
      alignment: "center",
      modifiers: [frame({ maxWidth: 74, maxHeight: 74 }), widgetURL(props.openURL || "studyplanner://today")],
      children: [
        view("CircleView", { modifiers: [frame({ width: 66, height: 66 }), background(bg, shapes.circle())] }),
        view("CircleView", { modifiers: [frame({ width: 52, height: 52 }), background(accent, shapes.circle())] }),
        view("VStackView", { alignment: "center", spacing: 1, children: [
          text(props.value, [font({ size: 17, weight: "black", design: "rounded" }), foregroundStyle("#FFFFFF"), lineLimit(1)]),
          text(props.headline, [font({ size: 8, weight: "bold" }), foregroundStyle("#FFFFFF"), lineLimit(1)])
        ]})
      ]
    });
  }

  if (isAccessoryRectangular) {
    return view("VStackView", {
      alignment: "leading",
      spacing: 3,
      modifiers: [frame({ maxWidth: 180, maxHeight: 72 }), widgetURL(props.openURL || "studyplanner://today")],
      children: [
        text(props.headline, [font({ size: 11, weight: "black" }), foregroundStyle(accent), lineLimit(1)]),
        text(props.value + " " + props.detail, [font({ size: 15, weight: "black", design: "rounded" }), foregroundStyle(ink), lineLimit(1)]),
        text(props.footnote, [font({ size: 11, weight: "semibold" }), foregroundStyle(muted), lineLimit(1)])
      ]
    });
  }

  var weekRail = [];
  for (var d = 0; d < 7; d += 1) {
    weekRail.push(view("VStackView", { alignment: "center", spacing: 2, children: [
      circle(Math.max(5, Math.min(11, 5 + ((weekCounts[d] || 0) / maxWeek) * 6)), (weekCounts[d] || 0) > 0 ? accent : "#D9DDE5"),
      text(weekLabels[d] || "", [font({ size: 7, weight: "black" }), foregroundStyle(muted), lineLimit(1)])
    ]}, "d-" + String(d)));
  }

  return view("ZStackView", {
    alignment: "topLeading",
    modifiers: [frame({ maxWidth: isMedium ? 338 : 158, maxHeight: 158 }), background(bg), widgetURL(props.openURL || "studyplanner://today")],
    children: [
      view("VStackView", { modifiers: [frame({ maxWidth: isMedium ? 338 : 158, maxHeight: 44 }), background("#FFFFFF")] }),
      view("VStackView", {
        alignment: "leading",
        spacing: isMedium ? 7 : 6,
        modifiers: [padding({ all: isMedium ? 12 : 10 }), frame({ maxWidth: isMedium ? 338 : 158, maxHeight: 158 })],
        children: [
          view("HStackView", { alignment: "center", spacing: 8, children: [
            text("StudyPlanner", [font({ size: 10, weight: "black" }), foregroundStyle(muted), lineLimit(1)]),
            view("SpacerView", { minLength: 4 }),
            text(props.headline, [font({ size: 9, weight: "black" }), foregroundStyle(accent), lineLimit(1)])
          ]}),
          view("HStackView", { alignment: "firstTextBaseline", spacing: 6, children: [
            text(props.value, [font({ size: isMedium ? 28 : 24, weight: "black", design: "rounded" }), foregroundStyle(ink), lineLimit(1)]),
            text(props.detail, [font({ size: 13, weight: "bold" }), foregroundStyle(ink), lineLimit(1)])
          ]}),
          text(props.footnote, [font({ size: isMedium ? 14 : 12, weight: "black" }), foregroundStyle(muted), lineLimit(isMedium ? 2 : 1)]),
          props.kind === "week"
            ? view("HStackView", { alignment: "center", spacing: 4, modifiers: [frame({ maxWidth: isMedium ? 300 : 130 })], children: weekRail })
            : view("VStackView", { alignment: "leading", spacing: 4, children: rows.length ? rows : [
              text(props.footnote, [font({ size: 11, weight: "semibold" }), foregroundStyle(muted), lineLimit(isMedium ? 2 : 1)])
            ]}),
          isMedium ? text(props.footnote, [font({ size: 10, weight: "semibold" }), foregroundStyle(muted), lineLimit(1)]) : view("SpacerView", { minLength: 1 })
        ]
      })
    ]
  });
}
`;

const StudyPlannerWidgetLayout = layoutSource as unknown as WidgetLayout;

export const StudyPlannerTodayWidget = createWidget<NativeWidgetSnapshot>(
  "studyplanner.today",
  StudyPlannerWidgetLayout
);

export const StudyPlannerUpcomingWidget = createWidget<NativeWidgetSnapshot>(
  "studyplanner.upcoming",
  StudyPlannerWidgetLayout
);

export const StudyPlannerWeekWidget = createWidget<NativeWidgetSnapshot>(
  "studyplanner.week",
  StudyPlannerWidgetLayout
);

export const StudyPlannerClassProgressWidget = createWidget<NativeWidgetSnapshot>(
  "studyplanner.classProgress",
  StudyPlannerWidgetLayout
);
