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
    return view("TextView", {
      text: String(value || ""),
      modifiers: (modifiers || []).concat([allowsTightening(true), minimumScaleFactor(0.72)])
    });
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
  var configuration = environment.configuration || {};
  var configuredViewMode = configuration.viewMode || props.kind || "today";
  var isMedium = environment.widgetFamily === "systemMedium";
  var isAccessoryCircular = environment.widgetFamily === "accessoryCircular";
  var isAccessoryRectangular = environment.widgetFamily === "accessoryRectangular";
  var isAccessoryInline = environment.widgetFamily === "accessoryInline";
  var renderingMode = environment.widgetRenderingMode || "fullColor";
  var isAccentedMode = renderingMode === "accented" || renderingMode === "vibrant";
  var isDark = environment.colorScheme === "dark";
  var isLuminanceReduced = environment.isLuminanceReduced === true;
  var levelOfDetail = environment.levelOfDetail || "default";
  var isSimplified = isLuminanceReduced || levelOfDetail === "simplified";
  var accent = props.accentColor || "#0A84FF";
  var bg = isLuminanceReduced ? "#F6F7FA" : (props.backgroundColor || "#F7F9FC");
  var ink = isDark ? "#F7F8FA" : (accent === "#000000" || accent === "#111111" || accent === "#111827" ? "#050505" : "#111318");
  var muted = isDark ? "#C9CDD6" : (isAccentedMode ? "#5F646D" : "#686D76");
  var quiet = isDark ? "#AEB4BF" : "#7A808B";
  var shellFill = isDark ? "#1C1C1ECC" : "#FFFFFF70";
  var shellPlane = isDark ? "#2A2A2ECC" : "#FFFFFF9C";
  var shellPlaneSoft = isDark ? "#2A2A2E88" : "#FFFFFF66";
  var progress = Math.max(0, Math.min(1, props.progress || 0));
  var ringValue = props.ringValue || String(Math.round(progress * 100));
  var ringLabel = props.ringLabel || "score";
  var signalLabel = props.signalLabel || props.headline || "Next";
  var timelineLabel = props.timelineLabel || props.headline || "Today";
  var updatedLabel = props.updatedLabel || "";
  var firstItem = items[0] || null;
  var circularValue = props.kind === "classProgress" ? ringValue : (firstItem ? (firstItem.courseCode || props.value) : props.value);
  var circularLabel = props.kind === "classProgress" ? ringLabel : (firstItem ? signalLabel : timelineLabel);
  var rowLimit = Math.min(items.length, isMedium ? 2 : 1);
  var isNextTaskLayout = configuredViewMode === "today" || configuredViewMode === "upcoming" || props.kind === "today" || props.kind === "upcoming";
  var weekLabels = props.weekLabels || ["M", "T", "W", "T", "F", "S", "S"];
  var weekCounts = props.weekCounts || [];
  var examDays = props.examDays || [];
  var todayIndex = typeof props.todayIndex === "number" ? props.todayIndex : -1;
  var calendarDays = props.calendarDays || [];
  var peakDayLabel = props.peakDayLabel || updatedLabel || "";
  var calendarHeadline = props.calendarHeadline || timelineLabel;
  var maxWeekdayCount = 0;
  for (var wc = 0; wc < weekCounts.length; wc += 1) maxWeekdayCount = Math.max(maxWeekdayCount, weekCounts[wc] || 0);
  for (var cd = 0; cd < calendarDays.length; cd += 1) maxWeekdayCount = Math.max(maxWeekdayCount, calendarDays[cd].count || 0);
  var maxWeek = Math.max(1, maxWeekdayCount);
  var corner = isMedium ? 28 : 24;
  var actionLabel = props.actionLabel || "";

  function actionControl() {
    if (!actionLabel || !isMedium || isSimplified) return view("SpacerView", { minLength: 1 });
    return Link({
      label: actionLabel,
      destination: props.openURL || "studyplanner://today",
      modifiers: [
        buttonStyle("glass"),
        controlSize("mini"),
        tint(accent),
        frame({ maxWidth: 112 })
      ]
    });
  }

  var shellModifiers = [
    frame({ maxWidth: isMedium ? 338 : 158, maxHeight: 158 }),
    containerBackground(bg, "widget"),
    background(shellFill, shapes.roundedRectangle({ cornerRadius: corner, roundedCornerStyle: "continuous" })),
    shadow({ color: "#0000001A", radius: 13, x: 0, y: 6 }),
    widgetURL(props.openURL || "studyplanner://today")
  ];

  function scoreRing(size) {
    return view("ZStackView", {
      alignment: "center",
      modifiers: [frame({ width: size, height: size })],
      children: [
        view("CircleView", {
          modifiers: [
            frame({ width: size, height: size }),
            background(accent, shapes.circle())
          ]
        }),
        view("CircleView", {
          modifiers: [
            frame({ width: size - 12, height: size - 12 }),
            background(isDark ? "#050505AA" : "#111318D9", shapes.circle())
          ]
        }),
        view("VStackView", {
          alignment: "center",
          spacing: 0,
          children: [
            text(ringValue, [font({ size: size > 58 ? 19 : 16, weight: "black", design: "rounded" }), foregroundStyle("#FFFFFF"), lineLimit(1)]),
            text(ringLabel, [font({ size: 7, weight: "bold" }), foregroundStyle("#FFFFFFCC"), lineLimit(1)])
          ]
        })
      ]
    });
  }

  var rows = [];
  for (var i = 0; i < rowLimit; i += 1) {
    var item = items[i];
    rows.push(view("HStackView", {
      alignment: "center",
      spacing: 7,
      modifiers: [frame({ maxWidth: 320 })],
      children: [
        circle(6, item.courseColor || accent),
        text(item.courseCode || "", [font({ size: 9, weight: "black" }), foregroundStyle(accent), lineLimit(1)]),
        text(item.title || "", [font({ size: 10, weight: "semibold" }), foregroundStyle(ink), lineLimit(1)]),
        view("SpacerView", { minLength: 2 }),
        text(item.dueLabel || "", [font({ size: 9, weight: "bold" }), foregroundStyle(muted), lineLimit(1)])
      ]
    }, item.id || String(i)));
  }

  if (isAccessoryInline) {
    return text(timelineLabel + ": " + circularValue + " " + signalLabel, [
      font({ size: 13, weight: "semibold" }),
      foregroundStyle(ink),
      lineLimit(1),
      widgetURL(props.openURL || "studyplanner://today")
    ]);
  }

  if (isAccessoryCircular) {
    return view("ZStackView", {
      alignment: "center",
      modifiers: [frame({ maxWidth: 74, maxHeight: 74 }), containerBackground(bg, "widget"), widgetURL(props.openURL || "studyplanner://today")],
      children: [
        view("AccessoryWidgetBackgroundView", {}),
        view("CircleView", { modifiers: [frame({ width: 66, height: 66 }), background(shellFill, shapes.circle()), glassEffect({ glass: { variant: "regular", interactive: false, tint: bg }, shape: "circle" })] }),
        view("CircleView", { modifiers: [frame({ width: 52, height: 52 }), background(accent, shapes.circle()), shadow({ color: "#00000022", radius: 5, x: 0, y: 2 })] }),
        view("VStackView", { alignment: "center", spacing: 1, children: [
          text(circularValue, [font({ size: 16, weight: "black", design: "rounded" }), foregroundStyle("#FFFFFF"), lineLimit(1)]),
          text(circularLabel, [font({ size: 8, weight: "bold" }), foregroundStyle("#FFFFFF"), lineLimit(1)])
        ]})
      ]
    });
  }

  if (isAccessoryRectangular) {
    return view("VStackView", {
      alignment: "leading",
      spacing: 3,
      modifiers: [frame({ maxWidth: 180, maxHeight: 72 }), containerBackground(bg, "widget"), widgetURL(props.openURL || "studyplanner://today")],
      children: [
        text(signalLabel, [font({ size: 10, weight: "black" }), foregroundStyle(accent), lineLimit(1)]),
        text(props.value + " " + props.detail, [font({ size: 14, weight: "black", design: "rounded" }), foregroundStyle(ink), lineLimit(1)]),
        text(props.footnote, [font({ size: 10, weight: "semibold" }), foregroundStyle(muted), lineLimit(1)])
      ]
    });
  }

  function hasExamDay(index) {
    for (var ed = 0; ed < examDays.length; ed += 1) {
      if (examDays[ed] === index) return true;
    }
    return false;
  }

  var calendarRows = [];
  for (var row = 0; row < 2; row += 1) {
    var calendarCells = [];
    for (var col = 0; col < 7; col += 1) {
      var calendarIndex = row * 7 + col;
      var day = calendarDays[calendarIndex] || {};
      var count = day.count || 0;
      var isToday = day.isToday === true || calendarIndex === todayIndex;
      var hasExam = day.hasExam === true || hasExamDay(calendarIndex);
      var load = Math.max(0, Math.min(1, count / maxWeek));
      var cellBg = isToday ? accent : (count > 0 ? shellPlane : shellPlaneSoft);
      var cellInk = isToday ? "#FFFFFF" : ink;
      var cellMuted = isToday ? "#FFFFFFCC" : muted;
      calendarCells.push(view("VStackView", {
        alignment: "center",
        spacing: isMedium ? 1 : 0,
        modifiers: [
          frame({ width: isMedium ? 38 : 17, height: isMedium ? 35 : 20 }),
          background(cellBg, shapes.roundedRectangle({ cornerRadius: isMedium ? 11 : 6, roundedCornerStyle: "continuous" }))
        ],
        children: [
          text(day.weekday || weekLabels[col] || "", [font({ size: isMedium ? 7 : 5, weight: "black" }), foregroundStyle(cellMuted), lineLimit(1)]),
          text(day.dayNumber || (count > 0 ? String(count) : "-"), [font({ size: isMedium ? 11 : 8, weight: "black", design: "rounded" }), foregroundStyle(cellInk), lineLimit(1)]),
          hasExam ? circle(isMedium ? 4 : 2, isToday ? "#FFFFFF" : "#FF5A1F") : circle(isMedium ? 2 : 1, count > 0 ? accent : "#D9DDE5")
        ]
      }, "cal-" + String(calendarIndex)));
    }
    calendarRows.push(view("HStackView", {
      alignment: "center",
      spacing: isMedium ? 4 : 2,
      children: calendarCells
    }, "cal-row-" + String(row)));
  }
  var calendarGrid = view("VStackView", { alignment: "leading", spacing: isMedium ? 4 : 2, children: calendarRows });

  if (!isMedium) {
    if (props.kind === "classProgress") {
      return view("ZStackView", {
        alignment: "topLeading",
        modifiers: shellModifiers,
        children: [
          view("VStackView", { modifiers: [frame({ maxWidth: 158, maxHeight: 42 }), background(shellPlaneSoft, shapes.roundedRectangle({ cornerRadius: 24, roundedCornerStyle: "continuous" }))] }),
          view("VStackView", {
            alignment: "leading",
            spacing: 7,
            modifiers: [padding({ all: 11 }), frame({ maxWidth: 158, maxHeight: 158 })],
            children: [
              view("HStackView", { alignment: "center", spacing: 6, children: [
                text(timelineLabel, [font({ size: 9, weight: "black" }), foregroundStyle(muted), lineLimit(1)]),
                view("SpacerView", { minLength: 2 }),
                text(signalLabel, [font({ size: 8, weight: "black" }), foregroundStyle(accent), lineLimit(1)])
              ]}),
              view("HStackView", { alignment: "center", spacing: 10, children: [
                scoreRing(54),
                view("VStackView", { alignment: "leading", spacing: 2, children: [
                  text(props.value, [font({ size: 15, weight: "black" }), foregroundStyle(ink), lineLimit(1)]),
                  text(props.detail, [font({ size: 10, weight: "bold" }), foregroundStyle(muted), lineLimit(1)])
                ]})
              ]}),
              text(props.footnote, [font({ size: 10, weight: "semibold" }), foregroundStyle(muted), lineLimit(2)]),
              rows.length ? rows[0] : text(updatedLabel || props.footnote, [font({ size: 9, weight: "semibold" }), foregroundStyle(quiet), lineLimit(1)])
            ]
          })
        ]
      });
    }

    return view("ZStackView", {
      alignment: "topLeading",
      modifiers: shellModifiers,
      children: [
        view("VStackView", { modifiers: [frame({ maxWidth: 158, maxHeight: 42 }), background(shellPlaneSoft, shapes.roundedRectangle({ cornerRadius: 24, roundedCornerStyle: "continuous" }))] }),
        view("VStackView", {
          alignment: "leading",
          spacing: 6,
          modifiers: [padding({ all: 11 }), frame({ maxWidth: 158, maxHeight: 158 })],
          children: [
            view("HStackView", { alignment: "center", spacing: 6, children: [
              circle(7, accent),
              text(timelineLabel, [font({ size: 9, weight: "black" }), foregroundStyle(muted), lineLimit(1)]),
              view("SpacerView", { minLength: 2 }),
              text(signalLabel, [font({ size: 8, weight: "black" }), foregroundStyle(accent), lineLimit(1)])
            ]}),
            text(props.value, [font({ size: isNextTaskLayout ? 21 : 23, weight: "black", design: "rounded" }), foregroundStyle(ink), lineLimit(1)]),
            text(props.detail, [font({ size: 11, weight: "black" }), foregroundStyle(ink), lineLimit(1)]),
            text(props.footnote, [font({ size: 10, weight: "semibold" }), foregroundStyle(muted), lineLimit(isMedium ? 2 : 1)]),
            props.kind === "week"
              ? view("VStackView", { alignment: "leading", spacing: 4, children: [
                calendarGrid,
                text(peakDayLabel || calendarHeadline, [font({ size: 8, weight: "black" }), foregroundStyle(accent), lineLimit(1)])
              ]})
              : view("VStackView", { alignment: "leading", spacing: 4, children: rows.length ? rows : [
                text(updatedLabel || props.footnote, [font({ size: 9, weight: "semibold" }), foregroundStyle(muted), lineLimit(1)])
              ]})
          ]
        })
      ]
    });
  }

  if (props.kind === "week") {
    return view("ZStackView", {
      alignment: "topLeading",
      modifiers: shellModifiers,
      children: [
        view("VStackView", { modifiers: [frame({ maxWidth: 338, maxHeight: 44 }), background(shellPlaneSoft, shapes.roundedRectangle({ cornerRadius: 28, roundedCornerStyle: "continuous" }))] }),
        view("VStackView", {
          alignment: "leading",
          spacing: 7,
          modifiers: [padding({ all: 12 }), frame({ maxWidth: 338, maxHeight: 158 })],
          children: [
            view("HStackView", { alignment: "center", spacing: 8, children: [
              text(timelineLabel, [font({ size: 10, weight: "black" }), foregroundStyle(muted), lineLimit(1)]),
              view("SpacerView", { minLength: 4 }),
              text(signalLabel, [font({ size: 9, weight: "black" }), foregroundStyle(accent), lineLimit(1)])
            ]}),
            view("VStackView", { alignment: "leading", spacing: 5, children: [
              calendarGrid,
              view("HStackView", { alignment: "center", spacing: 6, children: [
                text(props.value + " " + props.detail, [font({ size: 11, weight: "black", design: "rounded" }), foregroundStyle(ink), lineLimit(1)]),
                view("SpacerView", { minLength: 4 }),
                text(calendarHeadline, [font({ size: 9, weight: "black" }), foregroundStyle(muted), lineLimit(1)]),
                view("SpacerView", { minLength: 4 }),
                text(props.footnote, [font({ size: 9, weight: "semibold" }), foregroundStyle(quiet), lineLimit(1)])
              ]})
            ]}),
            view("HStackView", { alignment: "center", spacing: 6, children: [
              text(updatedLabel || peakDayLabel, [font({ size: 9, weight: "semibold" }), foregroundStyle(muted), lineLimit(1)]),
              view("SpacerView", { minLength: 4 }),
              actionControl()
            ]})
          ]
        })
      ]
    });
  }

  if (props.kind === "classProgress") {
    return view("ZStackView", {
      alignment: "topLeading",
      modifiers: shellModifiers,
      children: [
        view("VStackView", { modifiers: [frame({ maxWidth: 338, maxHeight: 44 }), background(shellPlaneSoft, shapes.roundedRectangle({ cornerRadius: 28, roundedCornerStyle: "continuous" }))] }),
        view("VStackView", {
          alignment: "leading",
          spacing: 7,
          modifiers: [padding({ all: 12 }), frame({ maxWidth: 338, maxHeight: 158 })],
          children: [
            view("HStackView", { alignment: "center", spacing: 8, children: [
              text(timelineLabel, [font({ size: 10, weight: "black" }), foregroundStyle(muted), lineLimit(1)]),
              view("SpacerView", { minLength: 4 }),
              text(signalLabel, [font({ size: 9, weight: "black" }), foregroundStyle(accent), lineLimit(1)])
            ]}),
            view("HStackView", { alignment: "center", spacing: 13, children: [
              scoreRing(66),
              view("VStackView", { alignment: "leading", spacing: 4, modifiers: [frame({ maxWidth: 236 })], children: [
                text(props.value, [font({ size: 21, weight: "black", design: "rounded" }), foregroundStyle(ink), lineLimit(1)]),
                text(props.detail, [font({ size: 11, weight: "black" }), foregroundStyle(muted), lineLimit(1)]),
                text(props.footnote, [font({ size: 11, weight: "semibold" }), foregroundStyle(muted), lineLimit(2)])
              ]})
            ]}),
            view("VStackView", { alignment: "leading", spacing: 4, children: rows.length ? rows : [
              text(updatedLabel || props.footnote, [font({ size: 10, weight: "semibold" }), foregroundStyle(muted), lineLimit(1)])
            ]}),
            view("HStackView", { alignment: "center", spacing: 6, children: [
              text(props.lastInteractionLabel || updatedLabel || props.footnote, [font({ size: 9, weight: "semibold" }), foregroundStyle(muted), lineLimit(1)]),
              view("SpacerView", { minLength: 4 }),
              actionControl()
            ]})
          ]
        })
      ]
    });
  }

  return view("ZStackView", {
    alignment: "topLeading",
    modifiers: shellModifiers,
    children: [
      view("VStackView", { modifiers: [frame({ maxWidth: 338, maxHeight: 44 }), background(shellPlaneSoft, shapes.roundedRectangle({ cornerRadius: 28, roundedCornerStyle: "continuous" }))] }),
      view("VStackView", {
        alignment: "leading",
        spacing: 7,
        modifiers: [padding({ all: 12 }), frame({ maxWidth: 338, maxHeight: 158 })],
        children: [
          view("HStackView", { alignment: "center", spacing: 8, children: [
            text(timelineLabel, [font({ size: 10, weight: "black" }), foregroundStyle(muted), lineLimit(1)]),
            view("SpacerView", { minLength: 4 }),
            text(signalLabel, [font({ size: 9, weight: "black" }), foregroundStyle(accent), lineLimit(1)])
          ]}),
          view("HStackView", { alignment: "firstTextBaseline", spacing: 6, children: [
            text(props.value, [font({ size: 24, weight: "black", design: "rounded" }), foregroundStyle(ink), lineLimit(1)]),
            text(props.detail, [font({ size: 12, weight: "bold" }), foregroundStyle(ink), lineLimit(1)])
          ]}),
          text(props.footnote, [font({ size: 12, weight: "black" }), foregroundStyle(muted), lineLimit(2)]),
          view("VStackView", { alignment: "leading", spacing: 4, children: rows.length ? rows : [
            text(props.footnote, [font({ size: 10, weight: "semibold" }), foregroundStyle(muted), lineLimit(2)])
          ]}),
          view("HStackView", { alignment: "center", spacing: 6, children: [
            text(props.lastInteractionLabel || updatedLabel || props.footnote, [font({ size: 9, weight: "semibold" }), foregroundStyle(muted), lineLimit(1)]),
            view("SpacerView", { minLength: 4 }),
            actionControl()
          ]})
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
