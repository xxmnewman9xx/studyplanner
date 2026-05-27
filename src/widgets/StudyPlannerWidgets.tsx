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
  var rowLimit = 1;
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
  var titleSize = isMedium ? 11 : 10;
  var valueSize = isMedium ? 28 : 27;
  var detailLines = 1;
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
        frame({ maxWidth: 220, maxHeight: 220, alignment: "topLeading" }),
        background(backgroundColor),
        widgetURL(props.openURL || "studyplanner://widgets")
      ],
      children: [
        view("VStackView", {
          modifiers: [
            frame({ maxWidth: 220, maxHeight: 58, alignment: "topLeading" }),
            background(highlight)
          ],
          children: []
        }),
        view("VStackView", {
          alignment: "leading",
          spacing: 8,
          modifiers: [
            frame({ maxWidth: 220, maxHeight: 220, alignment: "topLeading" }),
            padding({ all: 14 })
          ],
          children: [
            view("HStackView", {
              alignment: "center",
              spacing: 6,
              modifiers: [frame({ maxWidth: 220 })],
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
                    text(signalLabel, [
                      font({ size: 11, weight: "bold" }),
                      foregroundStyle(accent),
                      lineLimit(1)
                    ])
                  ]
                }),
                view("SpacerView", { minLength: 3 }),
                text(timelineLabel, [
                  font({ size: 10, weight: "black" }),
                  foregroundStyle(ink),
                  lineLimit(1)
                ])
              ]
            }),
            text(smallValue, [
              font({ size: 27, weight: "black", design: "rounded" }),
              foregroundStyle(ink),
              lineLimit(1)
            ]),
            text(smallDetail, [
              font({ size: 13, weight: "bold" }),
              foregroundStyle(ink),
              lineLimit(1)
            ]),
            props.kind === "week" && weekdayCounts.length > 0
              ? view("HStackView", {
                  alignment: "center",
                  spacing: 5,
                  modifiers: [
                    frame({ maxWidth: 220 }),
                    padding({ all: 5 }),
                    background(surface)
                  ],
                  children: weekDots
                })
              : text(items.length > 0 ? nextLabel : props.footnote, [
                font({ size: 11, weight: "semibold" }),
                foregroundStyle(muted),
                lineLimit(2)
              ]),
            text(metricLabel, [
              font({ size: 10, weight: "bold" }),
              foregroundStyle(quiet),
              lineLimit(1)
            ]),
            props.kind === "week" && weekdayCounts.length > 0
              ? text(smallWeekFootnote, [
                  font({ size: 10, weight: "semibold" }),
                  foregroundStyle(muted),
                  lineLimit(1)
                ])
              : view("SpacerView", { minLength: 1 })
          ]
        })
      ]
    });
  }

  return view("ZStackView", {
    alignment: "topLeading",
    modifiers: [
      frame({ maxWidth: 400, maxHeight: 170, alignment: "topLeading" }),
      background(backgroundColor),
      widgetURL(props.openURL || "studyplanner://widgets")
    ],
    children: [
      view("VStackView", {
        modifiers: [
          frame({ maxWidth: 400, maxHeight: isMedium ? 72 : 58, alignment: "topLeading" }),
          background(highlight)
        ],
        children: []
      }),
      view("VStackView", {
        alignment: "leading",
        spacing: isMedium ? 6 : 8,
        modifiers: [
          frame({ maxWidth: 400, maxHeight: 170, alignment: "topLeading" }),
          padding({ all: isMedium ? 13 : 14 })
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
                  text(signalLabel, [
                    font({ size: 11, weight: "bold" }),
                    foregroundStyle(accent),
                    lineLimit(1)
                  ])
                ]
              }),
              view("SpacerView", { minLength: 4 }),
              view("VStackView", {
                alignment: "trailing",
                spacing: 2,
                children: [
                  text(props.windowLabel || "Today", [
                    font({ size: 10, weight: "black" }),
                    foregroundStyle(ink),
                    lineLimit(1)
                  ]),
                  text(metricLabel, [
                    font({ size: 9, weight: "bold" }),
                    foregroundStyle(quiet),
                    lineLimit(1)
                  ])
                ]
              })
            ]
          }),
          view("HStackView", {
            alignment: "center",
            spacing: isMedium ? 12 : 8,
            modifiers: [frame({ maxWidth: 400 })],
            children: [
              view("VStackView", {
                alignment: "leading",
                spacing: 2,
                modifiers: [frame({ maxWidth: isMedium ? 134 : 160 })],
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
              isMedium
                ? view("VStackView", {
                    alignment: "trailing",
                    spacing: 2,
                    modifiers: [
                      padding({ all: 6 }),
                      background(surface)
                    ],
                    children: [
                      text(nextKicker, [
                        font({ size: 7, weight: "black" }),
                        foregroundStyle(quiet),
                        lineLimit(1)
                      ]),
                      text(nextLabel, [
                        font({ size: 9, weight: "bold" }),
                        foregroundStyle(ink),
                        lineLimit(2)
                      ])
                    ]
                  })
                : view("SpacerView", { minLength: 1 })
            ]
          }),
          isMedium && !isProgressLayout
            ? view("HStackView", {
                alignment: "center",
                spacing: 5,
                modifiers: [
                  frame({ maxWidth: 400 }),
                  padding({ all: 4 }),
                  background(surface)
                ],
                children: weekDots
              })
            : view("SpacerView", { minLength: 1 }),
          view("HStackView", {
            alignment: "center",
            spacing: 5,
            modifiers: [
              frame({ maxWidth: 400 }),
              padding({ all: 2 })
            ],
            children: [
              text(metricLabel, [
                font({ size: 10, weight: "bold" }),
                foregroundStyle(quiet),
                lineLimit(1)
              ]),
              view("SpacerView", { minLength: 4 }),
              view("HStackView", {
                alignment: "center",
                spacing: 3,
                children: progressDots
              })
            ]
          }),
          isProgressLayout
              ? view("VStackView", {
                  alignment: "leading",
                  spacing: 2,
                  modifiers: [frame({ maxWidth: 400 })],
                  children: [
                    text(props.progressLabel || props.metricLabel || props.detail, [
                      font({ size: 11, weight: "black" }),
                      foregroundStyle(ink),
                      lineLimit(1)
                    ]),
                    text(props.nextLabel || props.footnote, [
                      font({ size: 9, weight: "semibold" }),
                      foregroundStyle(muted),
                      lineLimit(1)
                    ])
                  ]
                })
              : firstItem
                ? view("HStackView", {
                    alignment: "center",
                    spacing: 5,
                    modifiers: [frame({ maxWidth: 400 })],
                    children: [
                      circle(5, firstItem.courseColor || accent),
                      text(firstItem.courseCode || props.courseScopeLabel || props.headline, [
                        font({ size: 9, weight: "black" }),
                        foregroundStyle(firstItem.courseColor || accent),
                        lineLimit(1)
                      ]),
                      text(firstItem.title || props.footnote, [
                        font({ size: 9, weight: "semibold" }),
                        foregroundStyle(muted),
                        lineLimit(1)
                      ]),
                      view("SpacerView", { minLength: 2 }),
                      text(firstItem.dueLabel || timelineLabel, [
                        font({ size: 9, weight: "bold" }),
                        foregroundStyle(quiet),
                        lineLimit(1)
                      ])
                    ]
                  })
                : text(props.footnote, [
                  font({ size: isMedium ? 10 : 11, weight: "semibold" }),
                  foregroundStyle(muted),
                  lineLimit(1)
                ]),
          view("HStackView", {
            alignment: "center",
            spacing: 5,
            modifiers: [frame({ maxWidth: 400 })],
            children: [
              text(items.length > 0 ? props.footnote : props.semesterName, [
                font({ size: 10, weight: "semibold" }),
                foregroundStyle(quiet),
                lineLimit(1)
              ]),
              view("SpacerView", { minLength: 3 }),
              text(props.layoutLabel || props.styleLabel || props.headline, [
                font({ size: 9, weight: "bold" }),
                foregroundStyle(accent),
                lineLimit(1)
              ])
            ]
          })
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

export const StudyPlannerWeekWidget = createWidget<StudyPlannerNativeWidgetProps>(
  "StudyPlannerWeekWidget",
  StudyPlannerWidgetLayout
);

export const StudyPlannerClassProgressWidget = createWidget<StudyPlannerNativeWidgetProps>(
  "StudyPlannerClassProgressWidget",
  StudyPlannerWidgetLayout
);
