import SwiftUI
import WidgetKit

struct StudyPlannerWatchEntry: TimelineEntry {
  var date: Date
  var snapshot: StudyPlannerWatchSnapshot
}

struct StudyPlannerWatchTimelineProvider: TimelineProvider {
  private let store = StudyPlannerWatchSnapshotStore()

  func placeholder(in context: Context) -> StudyPlannerWatchEntry {
    StudyPlannerWatchEntry(date: Date(), snapshot: .noData())
  }

  func getSnapshot(in context: Context, completion: @escaping (StudyPlannerWatchEntry) -> Void) {
    completion(StudyPlannerWatchEntry(date: Date(), snapshot: snapshot()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<StudyPlannerWatchEntry>) -> Void) {
    let date = Date()
    let entry = StudyPlannerWatchEntry(date: date, snapshot: snapshot())
    completion(Timeline(entries: [entry], policy: .after(date.addingTimeInterval(15 * 60))))
  }

  private func snapshot() -> StudyPlannerWatchSnapshot {
    store.load() ?? .noData()
  }
}

struct StudyPlannerNextDueComplication: Widget {
  let kind = "studyplanner.watch.nextDue"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: StudyPlannerWatchTimelineProvider()) { entry in
      StudyPlannerRectangularComplication(item: entry.snapshot.nextAssignment)
        .containerBackground(for: .widget) {
          Color.black
        }
    }
    .configurationDisplayName(String(localized: "watch.complication.next_due.name"))
    .description(String(localized: "watch.complication.next_due.description"))
    .supportedFamilies([.accessoryInline, .accessoryRectangular])
  }
}

struct StudyPlannerExamComplication: Widget {
  let kind = "studyplanner.watch.exam"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: StudyPlannerWatchTimelineProvider()) { entry in
      StudyPlannerCircularComplication(item: entry.snapshot.examCountdown)
        .containerBackground(for: .widget) {
          Color.black
        }
    }
    .configurationDisplayName(String(localized: "watch.complication.exam.name"))
    .description(String(localized: "watch.complication.exam.description"))
    .supportedFamilies([.accessoryCircular, .accessoryCorner])
  }
}

struct StudyPlannerFocusComplication: Widget {
  let kind = "studyplanner.watch.focus"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: StudyPlannerWatchTimelineProvider()) { entry in
      StudyPlannerRectangularComplication(item: entry.snapshot.focus)
        .containerBackground(for: .widget) {
          Color.black
        }
    }
    .configurationDisplayName(String(localized: "watch.complication.focus.name"))
    .description(String(localized: "watch.complication.focus.description"))
    .supportedFamilies([.accessoryRectangular])
  }
}

struct StudyPlannerPulseComplication: Widget {
  let kind = "studyplanner.watch.semesterPulse"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: StudyPlannerWatchTimelineProvider()) { entry in
      StudyPlannerCircularComplication(item: entry.snapshot.semesterPulse)
        .containerBackground(for: .widget) {
          Color.black
        }
    }
    .configurationDisplayName(String(localized: "watch.complication.pulse.name"))
    .description(String(localized: "watch.complication.pulse.description"))
    .supportedFamilies([.accessoryCircular])
  }
}

@main
struct StudyPlannerWatchWidgetsBundle: WidgetBundle {
  var body: some Widget {
    StudyPlannerNextDueComplication()
    StudyPlannerExamComplication()
    StudyPlannerFocusComplication()
    StudyPlannerPulseComplication()
  }
}

private struct StudyPlannerRectangularComplication: View {
  var item: StudyPlannerWatchSnapshotItem

  var body: some View {
    VStack(alignment: .leading, spacing: 3) {
      Text(item.label.uppercased())
        .font(.system(size: 10, weight: .black, design: .rounded))
        .foregroundStyle(Color(studyPlannerHex: item.color))
        .lineLimit(1)
      Text(item.title)
        .font(.system(size: 15, weight: .bold, design: .rounded))
        .foregroundStyle(.white)
        .lineLimit(1)
        .minimumScaleFactor(0.55)
      Text("\(item.value)  \(item.detail)")
        .font(.system(size: 11, weight: .semibold, design: .rounded))
        .foregroundStyle(.white.opacity(0.72))
        .lineLimit(1)
        .minimumScaleFactor(0.58)
    }
  }
}

private struct StudyPlannerCircularComplication: View {
  var item: StudyPlannerWatchSnapshotItem

  var body: some View {
    Gauge(value: min(max(item.progress ?? 0, 0), 1)) {
      Image(systemName: watchWidgetSymbol(for: item.kind))
    } currentValueLabel: {
      Text(compactValue)
        .font(.system(size: 11, weight: .black, design: .rounded))
        .multilineTextAlignment(.center)
        .minimumScaleFactor(0.48)
    }
    .gaugeStyle(.accessoryCircular)
    .tint(Color(studyPlannerHex: item.color))
  }

  private var compactValue: String {
    if item.value.count <= 5 { return item.value }
    if let progress = item.progress {
      return "\(Int(progress * 100))%"
    }
    return item.value
  }
}

private func watchWidgetSymbol(for kind: String) -> String {
  switch kind {
  case "exam":
    return "exclamationmark.triangle.fill"
  case "focus":
    return "timer"
  case "semester":
    return "chart.pie.fill"
  default:
    return "calendar"
  }
}
