import { createWidget } from "expo-widgets";

import type { StudyPlannerNativeWidgetProps } from "../services/widgetSnapshot";

type WidgetLayout = (props: StudyPlannerNativeWidgetProps, environment: object) => any;

const studyPlannerWidgetLayoutSource = `
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

  var isMedium = environment.widgetFamily === "systemMedium";
  var items = (props.items || []).slice(0, isMedium ? 3 : 1);
  var accent = props.accentColor || "#2F80ED";
  var backgroundColor = props.backgroundColor || "#FFFDF4";
  var ink = "#171A20";
  var muted = "#69707D";
  var quiet = "#8A93A3";
  var titleSize = isMedium ? 12 : 11;
  var valueSize = isMedium ? 34 : 32;
  var detailLines = isMedium ? 2 : 1;
  var rowNodes = [];

  for (var index = 0; index < items.length; index += 1) {
    var item = items[index];
    var label = isMedium
      ? (item.courseCode + " - " + item.title + " - " + item.dueLabel)
      : (item.courseCode + " - " + item.title);
    rowNodes.push(view("HStackView", {
      alignment: "center",
      spacing: 6,
      modifiers: [frame({ maxWidth: 400 })],
      children: [
        circle(6, item.courseColor || accent),
        text(label, [
          font({ size: isMedium ? 11 : 10, weight: "semibold" }),
          foregroundStyle(muted),
          lineLimit(1)
        ])
      ]
    }, item.id || String(index)));
  }

  return view("ZStackView", {
    alignment: "topLeading",
    modifiers: [
      frame({ maxWidth: 400, maxHeight: 220, alignment: "topLeading" }),
      background(backgroundColor),
      widgetURL(props.openURL || "studyplanner://widgets")
    ],
    children: [
      view("VStackView", {
        alignment: "leading",
        spacing: isMedium ? 9 : 8,
        modifiers: [
          frame({ maxWidth: 400, maxHeight: 220, alignment: "topLeading" }),
          padding({ all: isMedium ? 16 : 14 })
        ],
        children: [
          view("HStackView", {
            alignment: "center",
            spacing: 8,
            modifiers: [frame({ maxWidth: 400 })],
            children: [
              view("VStackView", {
                alignment: "leading",
                spacing: 2,
                children: [
                  text("StudyPlanner", [
                    font({ size: titleSize, weight: "black" }),
                    foregroundStyle(quiet),
                    lineLimit(1)
                  ]),
                  text(props.headline, [
                    font({ size: 11, weight: "bold" }),
                    foregroundStyle(accent),
                    lineLimit(1)
                  ])
                ]
              }),
              view("SpacerView", { minLength: 4 }),
              view("CircleView", {
                modifiers: [
                  frame({ width: 20, height: 20 }),
                  background(accent, shapes.circle()),
                  opacity(0.95)
                ]
              })
            ]
          }),
          view("VStackView", {
            alignment: "leading",
            spacing: 2,
            children: [
              text(props.value, [
                font({ size: valueSize, weight: "black", design: "rounded" }),
                foregroundStyle(ink),
                lineLimit(1)
              ]),
              text(props.detail, [
                font({ size: isMedium ? 14 : 13, weight: "bold" }),
                foregroundStyle(ink),
                lineLimit(detailLines)
              ])
            ]
          }),
          items.length > 0
            ? view("VStackView", {
                alignment: "leading",
                spacing: 5,
                modifiers: [frame({ maxWidth: 400 })],
                children: rowNodes
              })
            : text(props.footnote, [
                font({ size: isMedium ? 12 : 11, weight: "semibold" }),
                foregroundStyle(muted),
                lineLimit(2)
              ]),
          view("SpacerView", { minLength: 1 }),
          text(items.length > 0 ? props.footnote : props.semesterName, [
            font({ size: 10, weight: "semibold" }),
            foregroundStyle(quiet),
            lineLimit(1)
          ])
        ]
      })
    ]
  });
}
`;

const StudyPlannerWidgetLayout = studyPlannerWidgetLayoutSource as unknown as WidgetLayout;

export const StudyPlannerTodayWidget = createWidget<StudyPlannerNativeWidgetProps>(
  "StudyPlannerTodayWidget",
  StudyPlannerWidgetLayout
);

export const StudyPlannerUpcomingWidget = createWidget<StudyPlannerNativeWidgetProps>(
  "StudyPlannerUpcomingWidget",
  StudyPlannerWidgetLayout
);
