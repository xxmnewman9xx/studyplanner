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
      modifiers: (modifiers || []).concat([allowsTightening(true)])
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

  function colorChannels(color) {
    var match = /^#([0-9a-f]{6})$/i.exec(String(color || ""));
    if (!match) return null;
    return [
      parseInt(match[1].slice(0, 2), 16),
      parseInt(match[1].slice(2, 4), 16),
      parseInt(match[1].slice(4, 6), 16)
    ];
  }

  function luminance(color) {
    var channels = colorChannels(color);
    if (!channels) return null;
    var values = [];
    for (var index = 0; index < channels.length; index += 1) {
      var normalized = channels[index] / 255;
      values.push(normalized <= 0.04045 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4));
    }
    return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
  }

  function contrastRatio(first, second) {
    var firstLuminance = luminance(first);
    var secondLuminance = luminance(second);
    if (firstLuminance === null || secondLuminance === null) return 1;
    var lighter = Math.max(firstLuminance, secondLuminance);
    var darker = Math.min(firstLuminance, secondLuminance);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function readableForeground(fill) {
    return contrastRatio(fill, "#050507") >= contrastRatio(fill, "#FFFFFF") ? "#050507" : "#FFFFFF";
  }

  function safeColorOn(color, surface, minimumRatio) {
    var channels = colorChannels(color);
    var surfaceLuminance = luminance(surface);
    if (!channels || surfaceLuminance === null) return readableForeground(surface);
    var candidate = color;
    var target = surfaceLuminance < 0.179 ? 255 : 0;
    var threshold = typeof minimumRatio === "number" ? minimumRatio : 4.5;
    var attempts = 0;
    while (contrastRatio(candidate, surface) < threshold && attempts < 32) {
      for (var index = 0; index < channels.length; index += 1) {
        channels[index] = Math.round(channels[index] + (target - channels[index]) * 0.12);
      }
      candidate = "#" + channels.map(function (value) { return value.toString(16).padStart(2, "0"); }).join("");
      attempts += 1;
    }
    return candidate;
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
  var bg = isAccentedMode ? "#00000000" : (isDark ? "#18181C" : (isLuminanceReduced ? "#E7E8EC" : (props.backgroundColor || "#F7F9FC")));
  var ink = isDark ? "#F7F8FA" : "#111318";
  var muted = isDark ? "#D0D3DA" : "#5F646D";
  var quiet = isDark ? "#B6BBC5" : "#686D76";
  var primaryStyle = isAccentedMode ? { type: "hierarchical", style: "primary" } : ink;
  var secondaryStyle = isAccentedMode ? { type: "hierarchical", style: "secondary" } : muted;
  var tertiaryStyle = isAccentedMode ? { type: "hierarchical", style: "tertiary" } : quiet;
  var accentFill = isAccentedMode ? "#FFFFFF" : (isLuminanceReduced ? safeColorOn(isDark ? "#6F747E" : "#737780", bg, 3) : safeColorOn(accent, bg, 3));
  var accentStyle = isAccentedMode ? { type: "hierarchical", style: "primary" } : safeColorOn(accent, bg);
  var accentFillInk = readableForeground(accentFill);
  var shellFill = isAccentedMode ? "#00000000" : (isDark ? "#1C1C1ECC" : "#FFFFFF70");
  var shellPlane = isAccentedMode ? "#FFFFFF26" : (isDark ? "#2A2A2ECC" : "#FFFFFF9C");
  var shellPlaneSoft = isAccentedMode ? "#FFFFFF18" : (isDark ? "#2A2A2E88" : "#FFFFFF66");
  var progress = Math.max(0, Math.min(1, props.progress || 0));
  var ringValue = props.ringValue || String(Math.round(progress * 100));
  var ringLabel = props.ringLabel || "score";
  var signalLabel = props.signalLabel || props.headline || "Next";
  var timelineLabel = props.timelineLabel || props.headline || "Today";
  var updatedLabel = props.updatedLabel || "";
  var firstItem = items[0] || null;
  var circularValue = props.kind === "classProgress" ? ringValue : (firstItem ? (firstItem.courseCode || props.value) : props.value);
  var circularLabel = props.kind === "classProgress" ? ringLabel : (firstItem ? signalLabel : timelineLabel);
  var rowLimit = isSimplified ? 0 : Math.min(items.length, isMedium ? 2 : 1);
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
    // The entire widget is already a large widgetURL target. A compact hint
    // preserves the 158pt layout budget without adding a competing tiny link.
    return text(actionLabel, [font({ textStyle: "caption2", weight: "black" }), foregroundStyle(accentStyle), lineLimit(1)]);
  }

  var shellModifiers = [
    frame({ maxWidth: isMedium ? 338 : 158, maxHeight: 158 }),
    containerBackground(bg, "widget"),
    widgetURL(props.openURL || "studyplanner://today")
  ];
  if (!isAccentedMode) {
    shellModifiers.splice(2, 0,
      background(shellFill, shapes.roundedRectangle({ cornerRadius: corner, roundedCornerStyle: "continuous" })),
      shadow({ color: "#0000001A", radius: 13, x: 0, y: 6 })
    );
  }

  function scoreRing(size) {
    return view("ZStackView", {
      alignment: "center",
      modifiers: [frame({ width: size, height: size })],
      children: [
        view("GaugeView", {
          value: progress,
          min: 0,
          max: 1,
          modifiers: [
            frame({ width: size, height: size }),
            gaugeStyle("circularCapacity"),
            tint(accentFill)
          ]
        }),
        view("VStackView", {
          alignment: "center",
          spacing: 0,
          children: [
            text(ringValue, [font({ textStyle: size > 58 ? "headline" : "subheadline", weight: "black", design: "rounded" }), foregroundStyle(primaryStyle), lineLimit(1)]),
            text(ringLabel, [font({ textStyle: "caption2", weight: "bold" }), foregroundStyle(secondaryStyle), lineLimit(1)])
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
        circle(7, isAccentedMode ? "#FFFFFFCC" : safeColorOn(item.courseColor || accentFill, bg, 3)),
        text(item.courseCode || "", [font({ textStyle: "caption2", weight: "black" }), foregroundStyle(accentStyle), lineLimit(1)]),
        text(item.title || "", [font({ textStyle: "caption", weight: "semibold" }), foregroundStyle(primaryStyle), lineLimit(1)]),
        view("SpacerView", { minLength: 2 }),
        text(item.dueLabel || "", [font({ textStyle: "caption2", weight: "bold" }), foregroundStyle(secondaryStyle), lineLimit(1)])
      ]
    }, item.id || String(i)));
  }

  if (isAccessoryInline) {
    return text(timelineLabel + ": " + circularValue + " " + signalLabel, [
      font({ textStyle: "caption", weight: "semibold" }),
      foregroundStyle(primaryStyle),
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
        view("CircleView", { modifiers: [frame({ width: 66, height: 66 }), background(shellFill, shapes.circle())] }),
        view("CircleView", { modifiers: [frame({ width: 52, height: 52 }), background(accentFill, shapes.circle()), shadow({ color: "#00000022", radius: 5, x: 0, y: 2 })] }),
        view("VStackView", { alignment: "center", spacing: 1, children: [
          text(circularValue, [font({ textStyle: "headline", weight: "black", design: "rounded" }), foregroundStyle(accentFillInk), lineLimit(1)]),
          text(circularLabel, [font({ textStyle: "caption2", weight: "bold" }), foregroundStyle(accentFillInk), lineLimit(1)])
        ]})
      ]
    });
  }

  if (isAccessoryRectangular) {
    return view("ZStackView", {
      alignment: "leading",
      modifiers: [frame({ maxWidth: 180, maxHeight: 72 }), containerBackground("#00000000", "widget"), widgetURL(props.openURL || "studyplanner://today")],
      children: [
        view("AccessoryWidgetBackgroundView", {}),
        view("VStackView", {
          alignment: "leading",
          spacing: 3,
          modifiers: [padding({ all: 6 })],
          children: [
            text(signalLabel, [font({ textStyle: "caption2", weight: "black" }), foregroundStyle(accentStyle), lineLimit(1)]),
            text(props.value + " " + props.detail, [font({ textStyle: "headline", weight: "black", design: "rounded" }), foregroundStyle(primaryStyle), lineLimit(1)]),
            text(props.footnote, [font({ textStyle: "caption", weight: "semibold" }), foregroundStyle(secondaryStyle), lineLimit(1)])
          ]
        })
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
      var isToday = calendarDays.length > 0 ? day.isToday === true : calendarIndex === todayIndex;
      var hasExam = day.hasExam === true || hasExamDay(calendarIndex);
      var load = Math.max(0, Math.min(1, count / maxWeek));
      var cellBg = isToday ? accentFill : (count > 0 ? shellPlane : shellPlaneSoft);
      var cellInk = isToday ? accentFillInk : primaryStyle;
      var cellMuted = isToday ? accentFillInk : secondaryStyle;
      calendarCells.push(view("VStackView", {
        alignment: "center",
        spacing: isMedium ? 1 : 0,
        modifiers: [
          frame({ width: isMedium ? 38 : 17, height: isMedium ? 35 : 20 }),
          background(cellBg, shapes.roundedRectangle({ cornerRadius: isMedium ? 11 : 6, roundedCornerStyle: "continuous" }))
        ],
        children: [
          text(day.weekday || weekLabels[col] || "", [font({ textStyle: "caption2", weight: "black" }), foregroundStyle(cellMuted), lineLimit(1)]),
          text(day.dayNumber || (count > 0 ? String(count) : "-"), [font({ textStyle: "caption2", weight: "black", design: "rounded" }), foregroundStyle(cellInk), lineLimit(1)]),
          hasExam ? circle(isMedium ? 5 : 4, isToday ? accentFillInk : (isAccentedMode ? "#FFFFFF" : safeColorOn("#FF5A1F", bg))) : circle(isMedium ? 3 : 2, count > 0 ? accentFill : (isAccentedMode ? "#FFFFFF99" : quiet))
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
                text(timelineLabel, [font({ textStyle: "caption2", weight: "black" }), foregroundStyle(secondaryStyle), lineLimit(1)]),
                view("SpacerView", { minLength: 2 }),
                text(signalLabel, [font({ textStyle: "caption2", weight: "black" }), foregroundStyle(accentStyle), lineLimit(1)])
              ]}),
              view("HStackView", { alignment: "center", spacing: 10, children: [
                scoreRing(54),
                view("VStackView", { alignment: "leading", spacing: 2, children: [
                  text(props.value, [font({ textStyle: "headline", weight: "black" }), foregroundStyle(primaryStyle), lineLimit(1)]),
                  text(props.detail, [font({ textStyle: "caption", weight: "bold" }), foregroundStyle(secondaryStyle), lineLimit(1)])
                ]})
              ]}),
              text(props.footnote, [font({ textStyle: "caption", weight: "semibold" }), foregroundStyle(secondaryStyle), lineLimit(2)]),
              rows.length ? rows[0] : text(updatedLabel || props.footnote, [font({ textStyle: "caption2", weight: "semibold" }), foregroundStyle(tertiaryStyle), lineLimit(1)])
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
              circle(7, accentFill),
              text(timelineLabel, [font({ textStyle: "caption2", weight: "black" }), foregroundStyle(secondaryStyle), lineLimit(1)]),
              view("SpacerView", { minLength: 2 }),
              text(signalLabel, [font({ textStyle: "caption2", weight: "black" }), foregroundStyle(accentStyle), lineLimit(1)])
            ]}),
            text(props.value, [font({ textStyle: isNextTaskLayout ? "title3" : "title2", weight: "black", design: "rounded" }), foregroundStyle(primaryStyle), lineLimit(1)]),
            text(props.detail, [font({ textStyle: "footnote", weight: "black" }), foregroundStyle(primaryStyle), lineLimit(1)]),
            text(props.footnote, [font({ textStyle: "caption", weight: "semibold" }), foregroundStyle(secondaryStyle), lineLimit(2)]),
            props.kind === "week"
              ? view("VStackView", { alignment: "leading", spacing: 4, children: [
                calendarGrid,
                text(peakDayLabel || calendarHeadline, [font({ textStyle: "caption2", weight: "black" }), foregroundStyle(accentStyle), lineLimit(1)])
              ]})
              : view("VStackView", { alignment: "leading", spacing: 4, children: rows.length ? rows : [
                text(updatedLabel || props.footnote, [font({ textStyle: "caption2", weight: "semibold" }), foregroundStyle(secondaryStyle), lineLimit(1)])
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
              text(timelineLabel, [font({ textStyle: "caption", weight: "black" }), foregroundStyle(secondaryStyle), lineLimit(1)]),
              view("SpacerView", { minLength: 4 }),
              text(signalLabel, [font({ textStyle: "caption2", weight: "black" }), foregroundStyle(accentStyle), lineLimit(1)])
            ]}),
            view("VStackView", { alignment: "leading", spacing: 5, children: [
              calendarGrid,
              view("HStackView", { alignment: "center", spacing: 6, children: [
                text(props.value + " " + props.detail, [font({ textStyle: "footnote", weight: "black", design: "rounded" }), foregroundStyle(primaryStyle), lineLimit(1)]),
                view("SpacerView", { minLength: 4 }),
                text(calendarHeadline, [font({ textStyle: "caption2", weight: "black" }), foregroundStyle(secondaryStyle), lineLimit(1)]),
                view("SpacerView", { minLength: 4 }),
                text(props.footnote, [font({ textStyle: "caption2", weight: "semibold" }), foregroundStyle(tertiaryStyle), lineLimit(1)])
              ]})
            ]}),
            view("HStackView", { alignment: "center", spacing: 6, children: [
              text(updatedLabel || peakDayLabel, [font({ textStyle: "caption2", weight: "semibold" }), foregroundStyle(secondaryStyle), lineLimit(1)]),
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
              text(timelineLabel, [font({ textStyle: "caption", weight: "black" }), foregroundStyle(secondaryStyle), lineLimit(1)]),
              view("SpacerView", { minLength: 4 }),
              text(signalLabel, [font({ textStyle: "caption2", weight: "black" }), foregroundStyle(accentStyle), lineLimit(1)])
            ]}),
            view("HStackView", { alignment: "center", spacing: 13, children: [
              scoreRing(66),
              view("VStackView", { alignment: "leading", spacing: 4, modifiers: [frame({ maxWidth: 236 })], children: [
                text(props.value, [font({ textStyle: "title3", weight: "black", design: "rounded" }), foregroundStyle(primaryStyle), lineLimit(1)]),
                text(props.detail, [font({ textStyle: "footnote", weight: "black" }), foregroundStyle(secondaryStyle), lineLimit(1)]),
                text(props.footnote, [font({ textStyle: "footnote", weight: "semibold" }), foregroundStyle(secondaryStyle), lineLimit(2)])
              ]})
            ]}),
            view("VStackView", { alignment: "leading", spacing: 4, children: rows.length ? rows : [
              text(updatedLabel || props.footnote, [font({ textStyle: "caption", weight: "semibold" }), foregroundStyle(secondaryStyle), lineLimit(1)])
            ]}),
            view("HStackView", { alignment: "center", spacing: 6, children: [
              text(props.lastInteractionLabel || updatedLabel || props.footnote, [font({ textStyle: "caption2", weight: "semibold" }), foregroundStyle(secondaryStyle), lineLimit(1)]),
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
            text(timelineLabel, [font({ textStyle: "caption", weight: "black" }), foregroundStyle(secondaryStyle), lineLimit(1)]),
            view("SpacerView", { minLength: 4 }),
            text(signalLabel, [font({ textStyle: "caption2", weight: "black" }), foregroundStyle(accentStyle), lineLimit(1)])
          ]}),
          view("HStackView", { alignment: "firstTextBaseline", spacing: 6, children: [
            text(props.value, [font({ textStyle: "title2", weight: "black", design: "rounded" }), foregroundStyle(primaryStyle), lineLimit(1)]),
            text(props.detail, [font({ textStyle: "subheadline", weight: "bold" }), foregroundStyle(primaryStyle), lineLimit(1)])
          ]}),
          text(props.footnote, [font({ textStyle: "subheadline", weight: "black" }), foregroundStyle(secondaryStyle), lineLimit(2)]),
          view("VStackView", { alignment: "leading", spacing: 4, children: rows.length ? rows : [
            text(props.footnote, [font({ textStyle: "caption", weight: "semibold" }), foregroundStyle(secondaryStyle), lineLimit(2)])
          ]}),
          view("HStackView", { alignment: "center", spacing: 6, children: [
            text(props.lastInteractionLabel || updatedLabel || props.footnote, [font({ textStyle: "caption2", weight: "semibold" }), foregroundStyle(secondaryStyle), lineLimit(1)]),
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
