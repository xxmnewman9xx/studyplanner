import { createWidget } from "expo-widgets";
import type { NativeWidgetSnapshot } from "../widgetEngine";

type WidgetLayout = (props: NativeWidgetSnapshot, environment: object) => any;

// Expo SDK 56 serializes only this function body into WidgetKit. Keep every
// helper and constant inside the function, return synchronously, and rely only
// on snapshot props plus the WidgetEnvironment.
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

  function dot(size, color) {
    return view("CircleView", {
      modifiers: [frame({ width: size, height: size }), background(color, shapes.circle())]
    });
  }

  function rounded(width, height, color, radius) {
    return view("VStackView", {
      modifiers: [frame({ width: width, height: height }), background(color, shapes.roundedRectangle({ cornerRadius: radius, roundedCornerStyle: "continuous" }))]
    });
  }

  function channels(color) {
    var match = /^#([0-9a-f]{6})$/i.exec(String(color || ""));
    if (!match) return null;
    return [parseInt(match[1].slice(0, 2), 16), parseInt(match[1].slice(2, 4), 16), parseInt(match[1].slice(4, 6), 16)];
  }

  function luminance(color) {
    var rgb = channels(color);
    if (!rgb) return null;
    var values = [];
    for (var index = 0; index < rgb.length; index += 1) {
      var value = rgb[index] / 255;
      values.push(value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4));
    }
    return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
  }

  function readableForeground(color) {
    var value = luminance(color);
    return value !== null && value < 0.36 ? "#FFFFFF" : "#050507";
  }

  function contrastRatio(first, second) {
    var firstValue = luminance(first);
    var secondValue = luminance(second);
    if (firstValue === null || secondValue === null) return 1;
    var lighter = Math.max(firstValue, secondValue);
    var darker = Math.min(firstValue, secondValue);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function safeColorOn(color, surface, minimumRatio) {
    var rgb = channels(color);
    var surfaceValue = luminance(surface);
    if (!rgb || surfaceValue === null) return readableForeground(surface);
    var target = surfaceValue < 0.179 ? 255 : 0;
    var candidate = color;
    var attempts = 0;
    while (contrastRatio(candidate, surface) < minimumRatio && attempts < 32) {
      for (var channelIndex = 0; channelIndex < rgb.length; channelIndex += 1) {
        rgb[channelIndex] = Math.round(rgb[channelIndex] + (target - rgb[channelIndex]) * 0.12);
      }
      candidate = "#" + rgb.map(function(value) { return value.toString(16).padStart(2, "0"); }).join("");
      attempts += 1;
    }
    return candidate;
  }

  var family = environment.widgetFamily || "systemSmall";
  var isMedium = family === "systemMedium";
  var isInline = family === "accessoryInline";
  var isCircular = family === "accessoryCircular";
  var isRectangular = family === "accessoryRectangular";
  var renderingMode = environment.widgetRenderingMode || "fullColor";
  var isSystemTint = renderingMode === "accented" || renderingMode === "vibrant";
  var isDark = environment.colorScheme === "dark";
  var isReduced = environment.isLuminanceReduced === true || environment.levelOfDetail === "simplified";
  var hasSystemMargins = !!environment.widgetContentMargins;
  var mode = props.mode || "placeholder";
  var metric = props.primaryMetric || props.value || "—";
  var headline = props.headline || "StudyPlanner";
  var detail = props.detail || "";
  var action = props.actionLabel || "Open";
  var accent = props.accent || props.accentColor || "#8B5CF6";
  var bg = isSystemTint ? "#00000000" : (isDark ? "#111113" : (props.backgroundColor || "#FFFFFF"));
  var ink = isSystemTint ? { type: "hierarchical", style: "primary" } : (isDark ? "#FFFFFF" : "#050507");
  var secondary = isSystemTint ? { type: "hierarchical", style: "secondary" } : (isDark ? "#C8C8CE" : "#55555D");
  var tertiary = isSystemTint ? { type: "hierarchical", style: "tertiary" } : (isDark ? "#A6A6AE" : "#6E6E76");
  var accentStyle = isSystemTint ? { type: "hierarchical", style: "primary" } : safeColorOn(accent, bg, 4.5);
  var accentFill = isSystemTint ? "#FFFFFF" : (isReduced ? (isDark ? "#8E8E93" : "#636366") : safeColorOn(accent, bg, 3));
  var plane = isSystemTint ? "#FFFFFF22" : (isDark ? "#FFFFFF12" : "#0505070D");
  var contentPadding = hasSystemMargins ? 2 : (isMedium ? 12 : 11);
  var items = props.items || [];
  var firstItem = items[0] || null;
  var openURL = props.openURL || "studyplanner://paywall";

  var rootModifiers = [
    frame({ maxWidth: isMedium ? 338 : 158, maxHeight: 158 }),
    containerBackground(bg, "widget"),
    widgetURL(openURL)
  ];

  if (mode === "placeholder") {
    return view("ZStackView", {
      alignment: "topLeading",
      modifiers: rootModifiers,
      children: [
        view("VStackView", {
          alignment: "leading",
          spacing: 12,
          modifiers: [padding({ all: contentPadding })],
          children: [
            rounded(isMedium ? 92 : 66, 10, plane, 5),
            rounded(isMedium ? 210 : 118, isMedium ? 34 : 28, plane, 10),
            rounded(isMedium ? 270 : 132, 13, plane, 6),
            view("HStackView", { alignment: "center", spacing: 8, children: [
              dot(11, accentFill),
              rounded(isMedium ? 96 : 72, 10, plane, 5)
            ]})
          ]
        })
      ]
    });
  }

  if (isInline) {
    return text(metric + " · " + action, [
      font({ textStyle: "caption", weight: "black" }),
      foregroundStyle(ink),
      lineLimit(1),
      widgetURL(openURL)
    ]);
  }

  if (isCircular) {
    var circularMetric = metric.length > 5 ? metric.slice(0, 5) : metric;
    var circularAction = action.length > 8 ? action.slice(0, 8) : action;
    return view("ZStackView", {
      alignment: "center",
      modifiers: [frame({ maxWidth: 74, maxHeight: 74 }), containerBackground("#00000000", "widget"), widgetURL(openURL)],
      children: [
        view("AccessoryWidgetBackgroundView", {}),
        view("VStackView", { alignment: "center", spacing: 1, children: [
          text(circularMetric, [font({ textStyle: "headline", weight: "black", design: "rounded" }), foregroundStyle(ink), lineLimit(1)]),
          text(circularAction, [font({ textStyle: "caption2", weight: "bold" }), foregroundStyle(secondary), lineLimit(1)])
        ]})
      ]
    });
  }

  if (isRectangular) {
    return view("ZStackView", {
      alignment: "leading",
      modifiers: [frame({ maxWidth: 180, maxHeight: 72 }), containerBackground("#00000000", "widget"), widgetURL(openURL)],
      children: [
        view("AccessoryWidgetBackgroundView", {}),
        view("VStackView", {
          alignment: "leading",
          spacing: 2,
          modifiers: [padding({ all: 5 })],
          children: [
            text(metric, [font({ textStyle: "headline", weight: "black", design: "rounded" }), foregroundStyle(ink), lineLimit(1)]),
            text(headline, [font({ textStyle: "caption", weight: "semibold" }), foregroundStyle(secondary), lineLimit(1)]),
            text(action, [font({ textStyle: "caption2", weight: "black" }), foregroundStyle(accentStyle), lineLimit(1)])
          ]
        })
      ]
    });
  }

  if (mode === "locked" || mode === "empty") {
    return view("ZStackView", {
      alignment: "topLeading",
      modifiers: rootModifiers,
      children: [
        view("VStackView", {
          alignment: "leading",
          spacing: isMedium ? 8 : 7,
          modifiers: [padding({ all: contentPadding })],
          children: [
            text(metric, [font({ textStyle: "caption", weight: "black" }), foregroundStyle(accentStyle), lineLimit(1)]),
            text(headline, [font({ textStyle: isMedium ? "title2" : "title3", weight: "black", design: "rounded" }), foregroundStyle(ink), lineLimit(isMedium ? 2 : 3)]),
            text(detail, [font({ textStyle: "caption", weight: "semibold" }), foregroundStyle(secondary), lineLimit(2)]),
            view("SpacerView", { minLength: 2 }),
            view("HStackView", { alignment: "center", spacing: 7, children: [
              dot(8, accentFill),
              text(action, [font({ textStyle: "caption", weight: "black" }), foregroundStyle(accentStyle), lineLimit(1)])
            ]})
          ]
        })
      ]
    });
  }

  if (props.kind === "week") {
    var weekLabels = props.weekLabels || ["M", "T", "W", "T", "F", "S", "S"];
    var weekCounts = props.weekCounts || [];
    var maxCount = 1;
    for (var countIndex = 0; countIndex < weekCounts.length; countIndex += 1) {
      maxCount = Math.max(maxCount, weekCounts[countIndex] || 0);
    }
    var workloadCells = [];
    for (var dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      var dayCount = weekCounts[dayIndex] || 0;
      var barHeight = isReduced ? 5 : 5 + Math.round((dayCount / maxCount) * 21);
      workloadCells.push(view("VStackView", {
        alignment: "center",
        spacing: 3,
        children: [
          text(String(dayCount), [font({ textStyle: "caption2", weight: "black", design: "rounded" }), foregroundStyle(dayCount === maxCount && dayCount > 0 ? accentStyle : secondary), lineLimit(1)]),
          rounded(26, barHeight, dayCount === maxCount && dayCount > 0 ? accentFill : plane, 5),
          text(weekLabels[dayIndex] || "", [font({ textStyle: "caption2", weight: "black" }), foregroundStyle(tertiary), lineLimit(1)])
        ]
      }, "week-" + String(dayIndex)));
    }
    return view("ZStackView", {
      alignment: "topLeading",
      modifiers: rootModifiers,
      children: [
        view("VStackView", {
          alignment: "leading",
          spacing: 7,
          modifiers: [padding({ all: contentPadding })],
          children: [
            view("HStackView", { alignment: "firstTextBaseline", spacing: 8, children: [
              text(metric, [font({ textStyle: "title3", weight: "black", design: "rounded" }), foregroundStyle(ink), lineLimit(1)]),
              view("SpacerView", { minLength: 3 }),
              text(action, [font({ textStyle: "caption", weight: "black" }), foregroundStyle(accentStyle), lineLimit(1)])
            ]}),
            text(headline, [font({ textStyle: "caption", weight: "semibold" }), foregroundStyle(secondary), lineLimit(1)]),
            view("HStackView", { alignment: "bottom", spacing: 10, children: workloadCells })
          ]
        })
      ]
    });
  }

  if (props.kind === "today" && isMedium) {
    var todayCourse = firstItem ? firstItem.courseCode : "";
    var todayTime = firstItem ? (firstItem.timeLabel || firstItem.dueLabel) : props.footnote;
    return view("ZStackView", {
      alignment: "topLeading",
      modifiers: rootModifiers,
      children: [
        view("VStackView", {
          alignment: "leading",
          spacing: 7,
          modifiers: [padding({ all: contentPadding })],
          children: [
            view("HStackView", { alignment: "firstTextBaseline", spacing: 8, children: [
              text(metric, [font({ size: 42, weight: "black", design: "rounded" }), foregroundStyle(ink), lineLimit(1)]),
              text(headline, [font({ textStyle: "caption", weight: "black" }), foregroundStyle(accentStyle), lineLimit(1)]),
              view("SpacerView", { minLength: 4 }),
              text(action, [font({ textStyle: "caption", weight: "black" }), foregroundStyle(accentStyle), lineLimit(1)])
            ]}),
            text(detail, [font({ textStyle: "headline", weight: "black" }), foregroundStyle(ink), lineLimit(1)]),
            view("HStackView", { alignment: "center", spacing: 7, children: [
              dot(8, firstItem ? safeColorOn(firstItem.courseColor || accentFill, bg, 3) : accentFill),
              text(todayCourse, [font({ textStyle: "caption", weight: "black" }), foregroundStyle(accentStyle), lineLimit(1)]),
              text(todayTime, [font({ textStyle: "caption", weight: "semibold" }), foregroundStyle(secondary), lineLimit(1)])
            ]})
          ]
        })
      ]
    });
  }

  var courseColor = firstItem ? safeColorOn(firstItem.courseColor || accentFill, bg, 3) : accentFill;
  var supportingDetail = firstItem
    ? (firstItem.courseCode + (firstItem.timeLabel ? " · " + firstItem.timeLabel : ""))
    : props.footnote;
  return view("ZStackView", {
    alignment: "topLeading",
    modifiers: rootModifiers,
    children: [
      view("VStackView", {
        alignment: "leading",
        spacing: 7,
        modifiers: [padding({ all: contentPadding })],
        children: [
          text(metric, [font({ size: 31, weight: "black", design: "rounded" }), foregroundStyle(ink), lineLimit(1)]),
          text(headline, [font({ textStyle: "headline", weight: "black" }), foregroundStyle(ink), lineLimit(2)]),
          text(detail, [font({ textStyle: "caption", weight: "semibold" }), foregroundStyle(secondary), lineLimit(1)]),
          view("SpacerView", { minLength: 2 }),
          view("HStackView", { alignment: "center", spacing: 6, children: [
            dot(7, courseColor),
            text(supportingDetail, [font({ textStyle: "caption2", weight: "bold" }), foregroundStyle(secondary), lineLimit(1)]),
            view("SpacerView", { minLength: 2 }),
            text(action, [font({ textStyle: "caption", weight: "black" }), foregroundStyle(accentStyle), lineLimit(1)])
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
