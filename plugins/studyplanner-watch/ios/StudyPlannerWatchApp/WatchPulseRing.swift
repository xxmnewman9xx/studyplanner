import SwiftUI

struct WatchPulseRing: View {
  var item: StudyPlannerWatchSnapshotItem

  var body: some View {
    VStack(spacing: 4) {
      ZStack {
        Circle()
          .stroke(StudyPlannerWatchTheme.cardSoft, lineWidth: 5)
        Circle()
          .trim(from: 0, to: CGFloat(min(max(item.progress ?? 0, 0), 1)))
          .stroke(
            Color(studyPlannerHex: item.color),
            style: StrokeStyle(lineWidth: 5, lineCap: .round)
          )
          .rotationEffect(.degrees(-90))
        Text(compactValue)
          .font(.system(size: 11, weight: .black, design: .rounded))
          .foregroundStyle(.white)
          .lineLimit(1)
          .minimumScaleFactor(0.50)
      }
      .frame(width: 43, height: 43)

      Text(item.label)
        .font(.system(size: 9, weight: .bold, design: .rounded))
        .foregroundStyle(StudyPlannerWatchTheme.muted)
        .lineLimit(1)
        .minimumScaleFactor(0.56)
    }
    .frame(maxWidth: .infinity)
    .padding(.vertical, 7)
    .background(
      RoundedRectangle(cornerRadius: 8, style: .continuous)
        .fill(StudyPlannerWatchTheme.card)
    )
  }

  private var compactValue: String {
    if item.value.count <= 5 { return item.value }
    if let progress = item.progress {
      return "\(Int(progress * 100))%"
    }
    return item.value
  }
}
