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
  var isAccessoryCircular = environment.widgetFamily === "accessoryCircular";
  var isAccessoryRectangular = environment.widgetFamily === "accessoryRectangular";
  var isAccessoryInline = environment.widgetFamily === "accessoryInline";
  var layout = props.presetLayout || "";
  var isStripLayout = layout === "strip";
  var isProgressLayout = layout === "progress";
  var isSummaryLayout = layout === "summary";
  var isNextTaskLayout = layout === "next_task";
  var rowLimit = isMedium ? (props.mediumMaxRows || 2) : (props.smallMaxRows || 1);
  var titleLineLimit = isMedium ? (props.mediumTitleLines || 1) : (props.smallTitleLines || 2);
  var fontScale = isMedium ? (props.mediumFontScale || 0.96) : (props.smallFontScale || 0.92);
  var safePadding = isMedium ? (props.mediumSafePadding || 12) : (props.smallSafePadding || 10);
  var showFooter = isMedium ? props.mediumShowFooter === true : props.smallShowFooter === true;
  var showWeekRail = isMedium ? props.mediumShowWeekRail === true : props.smallShowWeekRail === true;
  var showMetric = isMedium && props.kind === "class_progress";
  var items = (props.items || []).slice(0, rowLimit);
  var firstItem = items.length > 0 ? items[0] : null;
  var accent = props.accentColor || "#2F80ED";
  var backgroundColor = props.backgroundColor || "#101723";
  var isDark = backgroundColor === "#171A20" || backgroundColor === "#101723" || backgroundColor === "#0D1422" || backgroundColor === "#061827" || backgroundColor === "#070A12" || backgroundColor === "#05070B";
  var ink = isDark ? "#F8FAFC" : "#171A20";
  var muted = isDark ? "#D7DEE9" : "#69707D";
  var quiet = isDark ? "#A8B3C5" : "#8A93A3";
  var soft = isDark ? "#263245" : "#E7EAF0";
  var surface = isDark ? "#172132" : "#FFFFFF";
  var highlight = isDark ? "#111B2B" : "#FFFFFF";
  var signalLabel = props.signalLabel || (props.state === "ready" ? props.headline : props.state === "needs_review" ? props.detail : props.footnote);
  var metricLabel = props.metricLabel || props.progressLabel || props.headline;
  var nextLabel = props.nextLabel || props.footnote || props.headline;
  var timelineLabel = props.timelineLabel || props.windowLabel || (props.kind === "today" ? "Today" : "Next");
  var nextKicker = props.actionLabel || nextLabel;
  var smallValue = firstItem && firstItem.courseCode ? firstItem.courseCode : props.value;
  var smallDetail = firstItem ? firstItem.title : props.detail;
  var titleSize = Math.round((isMedium ? 10 : 9) * fontScale);
  var valueSize = Math.round((isMedium ? 24 : 21) * fontScale);
  var detailLines = titleLineLimit;
  var progress = Math.max(0, Math.min(1, props.progress || 0));
  var weekdayLabels = props.weekdayLabels || ["M", "T", "W", "T", "F", "S", "S"];
  var weekdayCounts = props.weekdayCounts || [];
  var maxWeekdayCount = 1;
  for (var weekdayCountIndex = 0; weekdayCountIndex < weekdayCounts.length; weekdayCountIndex += 1) {
    maxWeekdayCount = Math.max(maxWeekdayCount, weekdayCounts[weekdayCountIndex] || 0);
  }
  var activeWeekDots = Math.round(progress * 7);
  var progressDots = [];
  var weekDots = [];
  var rowNodes = [];
  var weekTotalCount = 0;
  for (var weekTotalIndex = 0; weekTotalIndex < weekdayCounts.length; weekTotalIndex += 1) {
    weekTotalCount += weekdayCounts[weekTotalIndex] || 0;
  }
  var smallWeekFootnote = props.biggestDeadlineLabel
    ? "Biggest: " + props.biggestDeadlineLabel
    : props.footnote || props.detail;
  var smallTitle = firstItem ? (firstItem.title || props.detail) : props.detail;
  var smallMeta = firstItem
    ? ((firstItem.courseCode || props.courseScopeLabel || props.headline) + " / " + (firstItem.dueLabel || timelineLabel))
    : props.footnote || props.metricLabel || props.detail;
  var mediumSummary = firstItem ? (props.value + " " + props.detail) : props.detail;

  if (props.kind === "week" && weekdayCounts.length > 0) {
    smallValue = String(weekTotalCount);
    smallDetail = weekTotalCount === 1 ? "task this week" : "tasks this week";
  }

  for (var progressIndex = 0; progressIndex < 5; progressIndex += 1) {
    progressDots.push(circle(5, progress >= (progressIndex + 1) / 5 ? accent : soft));
  }

  for (var weekIndex = 0; weekIndex < 7; weekIndex += 1) {
    weekDots.push(view("VStackView", {
      alignment: "center",
      spacing: 2,
      children: [
        circle(
          props.kind === "week" && weekdayCounts.length > 0
            ? Math.max(4, Math.min(10, 4 + ((weekdayCounts[weekIndex] || 0) / maxWeekdayCount) * 6))
            : weekIndex < activeWeekDots ? 6 : 4,
          props.kind === "week" && (weekdayCounts[weekIndex] || 0) > 0
            ? accent
            : weekIndex < activeWeekDots ? accent : soft
        ),
        text(weekdayLabels[weekIndex] || "", [
          font({ size: 7, weight: "black" }),
          foregroundStyle(quiet),
          lineLimit(1)
        ])
      ]
    }, "week-" + String(weekIndex)));
  }

  for (var index = 0; index < items.length; index += 1) {
    var item = items[index];
    rowNodes.push(view("HStackView", {
      alignment: "center",
      spacing: 7,
      modifiers: [frame({ maxWidth: 400 })],
      children: [
        circle(6, item.courseColor || accent),
        text(item.courseCode || props.courseScopeLabel || props.headline, [
          font({ size: 10, weight: "black" }),
          foregroundStyle(item.courseColor || accent),
          lineLimit(1)
        ]),
        text(item.title || props.detail, [
          font({ size: isMedium ? 11 : 10, weight: "semibold" }),
          foregroundStyle(ink),
          lineLimit(1)
        ]),
        view("SpacerView", { minLength: 2 }),
        text(item.dueLabel || timelineLabel, [
          font({ size: 10, weight: "bold" }),
          foregroundStyle(muted),
          lineLimit(1)
        ])
      ]
    }, item.id || String(index)));
  }

  if (isAccessoryInline) {
    return text(
      signalLabel + ": " + props.value + " - " + props.detail,
      [
        font({ size: 13, weight: "semibold" }),
        foregroundStyle(ink),
        lineLimit(1),
        widgetURL(props.openURL || "studyplanner://widgets")
      ]
    );
  }

  if (isAccessoryCircular) {
    var circularValue = firstItem && firstItem.courseCode ? firstItem.courseCode : props.value;
    var circularLabel = firstItem ? signalLabel : timelineLabel;
    if (!firstItem) {
      if (props.state === "needs_review") {
        circularValue = props.detail;
        circularLabel = props.value;
      } else if (props.state === "no_classes") {
        circularValue = props.value;
        circularLabel = props.detail;
      } else if (props.state === "no_reviewed_syllabus") {
        circularValue = props.value;
        circularLabel = props.detail;
      } else if (props.state === "no_due_today" || props.state === "no_upcoming") {
        circularValue = props.value;
        circularLabel = timelineLabel;
      } else if (props.state === "sync_disabled") {
        circularValue = props.value;
        circularLabel = signalLabel;
      }
    }
    return view("ZStackView", {
      alignment: "center",
      modifiers: [
        frame({ maxWidth: 80, maxHeight: 80, alignment: "center" }),
        widgetURL(props.openURL || "studyplanner://widgets")
      ],
      children: [
      view("CircleView", {
        modifiers: [
          frame({ width: 62, height: 62 }),
          background(backgroundColor, shapes.circle())
        ]
      }),
      view("CircleView", {
        modifiers: [
          frame({ width: 48, height: 48 }),
          background(accent, shapes.circle())
        ]
      }),
        view("VStackView", {
          alignment: "center",
          spacing: 1,
          children: [
            text(circularValue, [
              font({ size: 18, weight: "black", design: "rounded" }),
              foregroundStyle("#FFFFFF"),
              lineLimit(1)
            ]),
            text(circularLabel, [
              font({ size: 9, weight: "bold" }),
              foregroundStyle("#FFFFFF"),
              lineLimit(1)
            ])
          ]
        })
      ]
    });
  }

  if (isAccessoryRectangular) {
    return view("VStackView", {
      alignment: "leading",
      spacing: 3,
      modifiers: [
        frame({ maxWidth: 180, maxHeight: 72, alignment: "leading" }),
        widgetURL(props.openURL || "studyplanner://widgets")
      ],
      children: [
        text(props.headline + " - " + signalLabel, [
          font({ size: 11, weight: "black" }),
          foregroundStyle(accent),
          lineLimit(1)
        ]),
        text(props.value + " " + props.detail, [
          font({ size: 14, weight: "bold", design: "rounded" }),
          foregroundStyle(ink),
          lineLimit(1)
        ]),
        text(items.length > 0 ? (items[0].courseCode + " - " + items[0].title + " - " + items[0].dueLabel) : nextLabel, [
          font({ size: 11, weight: "semibold" }),
          foregroundStyle(muted),
          lineLimit(1)
        ])
      ]
    });
  }

  if (!isMedium) {
    return view("ZStackView", {
      alignment: "topLeading",
      modifiers: [
        frame({ maxWidth: 158, maxHeight: 158, alignment: "topLeading" }),
        background(backgroundColor),
        widgetURL(props.openURL || "studyplanner://widgets")
      ],
      children: [
        view("VStackView", {
          modifiers: [
            frame({ maxWidth: 158, maxHeight: 44, alignment: "topLeading" }),
            background(highlight)
          ],
          children: []
        }),
        view("VStackView", {
          alignment: "leading",
          spacing: 5,
          modifiers: [
            frame({ maxWidth: 158, maxHeight: 158, alignment: "topLeading" }),
            padding({ all: safePadding })
          ],
          children: [
            view("HStackView", {
              alignment: "center",
              spacing: 6,
              modifiers: [frame({ maxWidth: 158 })],
              children: [
                view("VStackView", {
                  alignment: "leading",
                  spacing: 1,
                  children: [
                    text("StudyPlanner", [
                      font({ size: titleSize, weight: "black" }),
                      foregroundStyle(quiet),
                      lineLimit(1)
                    ]),
                    text(signalLabel, [
                      font({ size: Math.round(10 * fontScale), weight: "bold" }),
                      foregroundStyle(accent),
                      lineLimit(1)
                    ])
                  ]
                }),
                view("SpacerView", { minLength: 3 }),
                text(timelineLabel, [
                  font({ size: Math.round(9 * fontScale), weight: "black" }),
                  foregroundStyle(ink),
                  lineLimit(1)
                ])
              ]
            }),
            text(props.kind === "week" && weekdayCounts.length > 0 ? smallValue : smallTitle, [
              font({ size: props.kind === "week" && weekdayCounts.length > 0 ? valueSize : Math.round(17 * fontScale), weight: "black", design: "rounded" }),
              foregroundStyle(ink),
              lineLimit(props.kind === "week" && weekdayCounts.length > 0 ? 1 : titleLineLimit)
            ]),
            props.kind === "week" && weekdayCounts.length > 0
              ? view("HStackView", {
                  alignment: "center",
                  spacing: 4,
                  modifiers: [
                    frame({ maxWidth: 158 }),
                    padding({ all: 4 }),
                    background(surface)
                  ],
                  children: weekDots
                })
              : text(smallMeta, [
                font({ size: Math.round(10 * fontScale), weight: "semibold" }),
                foregroundStyle(muted),
                lineLimit(1)
              ]),
            text(props.kind === "week" && weekdayCounts.length > 0 ? smallWeekFootnote : metricLabel, [
              font({ size: Math.round(9 * fontScale), weight: "bold" }),
              foregroundStyle(quiet),
              lineLimit(1)
            ])
          ]
        })
      ]
    });
  }

  return view("ZStackView", {
    alignment: "topLeading",
    modifiers: [
      frame({ maxWidth: 338, maxHeight: 158, alignment: "topLeading" }),
      background(backgroundColor),
      widgetURL(props.openURL || "studyplanner://widgets")
    ],
    children: [
      view("VStackView", {
        modifiers: [
          frame({ maxWidth: 338, maxHeight: 46, alignment: "topLeading" }),
          background(highlight)
        ],
        children: []
      }),
      view("VStackView", {
        alignment: "leading",
        spacing: 5,
        modifiers: [
          frame({ maxWidth: 338, maxHeight: 158, alignment: "topLeading" }),
          padding({ all: safePadding })
        ],
        children: [
          view("HStackView", {
            alignment: "center",
            spacing: 8,
            modifiers: [frame({ maxWidth: 338 })],
            children: [
              view("VStackView", {
                alignment: "leading",
                spacing: 1,
                children: [
                  text("StudyPlanner", [
                    font({ size: titleSize, weight: "black" }),
                    foregroundStyle(quiet),
                    lineLimit(1)
                  ]),
                  text(signalLabel, [
                    font({ size: Math.round(10 * fontScale), weight: "bold" }),
                    foregroundStyle(accent),
                    lineLimit(1)
                  ])
                ]
              }),
              view("SpacerView", { minLength: 4 }),
              view("VStackView", {
                alignment: "trailing",
                spacing: 1,
                children: [
                  text(props.windowLabel || "Today", [
                    font({ size: Math.round(9 * fontScale), weight: "black" }),
                    foregroundStyle(ink),
                    lineLimit(1)
                  ]),
                  text(showMetric ? metricLabel : props.layoutLabel || props.styleLabel || props.headline, [
                    font({ size: Math.round(8 * fontScale), weight: "bold" }),
                    foregroundStyle(quiet),
                    lineLimit(1)
                  ])
                ]
              })
            ]
          }),
          view("HStackView", {
            alignment: "center",
            spacing: 10,
            modifiers: [frame({ maxWidth: 338 })],
            children: [
              view("VStackView", {
                alignment: "leading",
                spacing: 2,
                modifiers: [frame({ maxWidth: props.kind === "week" ? 142 : 112 })],
                children: [
                  text(props.value, [
                    font({ size: valueSize, weight: "black", design: "rounded" }),
                    foregroundStyle(ink),
                    lineLimit(1)
                  ]),
                  text(props.detail, [
                    font({ size: Math.round(12 * fontScale), weight: "bold" }),
                    foregroundStyle(ink),
                    lineLimit(1)
                  ])
                ]
              }),
              view("VStackView", {
                alignment: "leading",
                spacing: 3,
                modifiers: [frame({ maxWidth: 190 })],
              children: props.kind === "week" && weekdayCounts.length > 0 && showWeekRail
                  ? [
                      view("HStackView", {
                        alignment: "center",
                        spacing: 4,
                        modifiers: [
                          frame({ maxWidth: 190 }),
                          padding({ all: 4 }),
                          background(surface)
                        ],
                        children: weekDots
                      }),
                      text(smallWeekFootnote, [
                        font({ size: Math.round(9 * fontScale), weight: "semibold" }),
                        foregroundStyle(muted),
                        lineLimit(1)
                      ])
                    ]
                  : items.length > 0
                    ? rowNodes
                    : [
                        text(props.footnote || nextLabel, [
                          font({ size: Math.round(10 * fontScale), weight: "semibold" }),
                          foregroundStyle(muted),
                          lineLimit(2)
                        ])
                      ]
              })
            ]
          }),
          isProgressLayout && showMetric
              ? view("VStackView", {
                  alignment: "leading",
                  spacing: 2,
                  modifiers: [frame({ maxWidth: 338 })],
                  children: [
                    text(props.progressLabel || props.metricLabel || props.detail, [
                      font({ size: Math.round(10 * fontScale), weight: "black" }),
                      foregroundStyle(ink),
                      lineLimit(1)
                    ]),
                    text(props.nextLabel || props.footnote, [
                      font({ size: Math.round(8 * fontScale), weight: "semibold" }),
                      foregroundStyle(muted),
                      lineLimit(1)
                    ])
                  ]
                })
              : showFooter
                ? text(items.length > 0 ? props.footnote : props.semesterName, [
                    font({ size: Math.round(9 * fontScale), weight: "semibold" }),
                    foregroundStyle(quiet),
                    lineLimit(1)
                  ])
                : view("SpacerView", { minLength: 1 })
        ]
      })
    ]
  });
}
`;

const StudyPlannerWidgetLayout = studyPlannerWidgetLayoutSource as unknown as WidgetLayout;

export const StudyPlannerTodayWidget = createWidget<StudyPlannerNativeWidgetProps>(
  "studyplanner.today",
  StudyPlannerWidgetLayout
);

export const StudyPlannerUpcomingWidget = createWidget<StudyPlannerNativeWidgetProps>(
  "studyplanner.upcoming",
  StudyPlannerWidgetLayout
);

export const StudyPlannerWeekWidget = createWidget<StudyPlannerNativeWidgetProps>(
  "studyplanner.week",
  StudyPlannerWidgetLayout
);

export const StudyPlannerClassProgressWidget = createWidget<StudyPlannerNativeWidgetProps>(
  "studyplanner.classProgress",
  StudyPlannerWidgetLayout
);
