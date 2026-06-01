import SwiftUI

struct WatchDashboardView: View {
  @StateObject private var provider = WatchSnapshotProvider()

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 9) {
        header
        hero
        ringRow
        cardStack
      }
      .padding(.horizontal, 8)
      .padding(.vertical, 6)
    }
    .background(StudyPlannerWatchTheme.background.ignoresSafeArea())
    .preferredColorScheme(.dark)
    .onAppear {
      provider.activate()
    }
  }

  private var snapshot: StudyPlannerWatchSnapshot {
    provider.snapshot
  }

  private var header: some View {
    HStack(spacing: 7) {
      StudyPlannerMark(color: Color(studyPlannerHex: snapshot.accentColor))
      VStack(alignment: .leading, spacing: 0) {
        Text("StudyPlanner")
          .font(.system(size: 12, weight: .black, design: .rounded))
          .foregroundStyle(.white)
          .lineLimit(1)
        Text("Syllabus AI")
          .font(.system(size: 9, weight: .bold, design: .rounded))
          .foregroundStyle(StudyPlannerWatchTheme.muted)
          .lineLimit(1)
      }
      Spacer(minLength: 0)
    }
  }

  private var hero: some View {
    let color = Color(studyPlannerHex: snapshot.hero.color)

    return VStack(alignment: .leading, spacing: 7) {
      HStack(spacing: 5) {
        Image(systemName: symbol(for: snapshot.hero.kind))
          .font(.system(size: 12, weight: .black))
        Text(snapshot.hero.label.uppercased())
          .font(.system(size: 10, weight: .black, design: .rounded))
      }
      .foregroundStyle(color)

      Text(snapshot.hero.title)
        .font(.system(size: 22, weight: .black, design: .rounded))
        .foregroundStyle(.white)
        .lineLimit(2)
        .minimumScaleFactor(0.52)

      HStack(alignment: .lastTextBaseline, spacing: 8) {
        Text(snapshot.hero.value)
          .font(.system(size: 32, weight: .black, design: .rounded))
          .foregroundStyle(.white)
          .lineLimit(1)
          .minimumScaleFactor(0.45)

        Text(snapshot.hero.detail)
          .font(.system(size: 12, weight: .bold, design: .rounded))
          .foregroundStyle(color)
          .lineLimit(1)
          .minimumScaleFactor(0.58)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(11)
    .background(
      RoundedRectangle(cornerRadius: 8, style: .continuous)
        .fill(StudyPlannerWatchTheme.card)
        .overlay(
          RoundedRectangle(cornerRadius: 8, style: .continuous)
            .stroke(color.opacity(0.46), lineWidth: 1)
        )
    )
  }

  private var ringRow: some View {
    HStack(spacing: 7) {
      ForEach(snapshot.rings.prefix(3)) { item in
        WatchPulseRing(item: item)
      }
    }
  }

  private var cardStack: some View {
    VStack(spacing: 7) {
      WatchInfoCard(item: snapshot.nextAssignment)
      WatchInfoCard(item: snapshot.nextClass)
      WatchInfoCard(item: snapshot.focus)
    }
  }
}

struct StudyPlannerMark: View {
  var color: Color

  var body: some View {
    ZStack {
      RoundedRectangle(cornerRadius: 8, style: .continuous)
        .fill(color)
      Circle()
        .fill(.white.opacity(0.18))
        .frame(width: 22, height: 22)
        .offset(x: -7, y: -7)
      Text("SP")
        .font(.system(size: 11, weight: .black, design: .rounded))
        .foregroundStyle(.white)
    }
    .frame(width: 30, height: 30)
  }
}

enum StudyPlannerWatchTheme {
  static let background = Color(red: 0.02, green: 0.03, blue: 0.06)
  static let card = Color(red: 0.07, green: 0.09, blue: 0.13)
  static let cardSoft = Color(red: 0.10, green: 0.12, blue: 0.17)
  static let muted = Color(red: 0.63, green: 0.68, blue: 0.76)
  static let soft = Color(red: 0.83, green: 0.87, blue: 0.93)
}

func symbol(for kind: String) -> String {
  switch kind {
  case "exam":
    return "exclamationmark.triangle.fill"
  case "focus":
    return "timer"
  case "class":
    return "book.closed.fill"
  case "semester":
    return "chart.pie.fill"
  case "today":
    return "checkmark.circle.fill"
  default:
    return "calendar"
  }
}

#Preview {
  WatchDashboardView()
}
