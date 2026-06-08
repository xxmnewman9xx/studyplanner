import SwiftUI

struct WatchInfoCard: View {
  var item: StudyPlannerWatchSnapshotItem

  var body: some View {
    HStack(spacing: 8) {
      ZStack {
        Circle()
          .fill(Color(studyPlannerHex: item.color).opacity(0.18))
        Image(systemName: symbol(for: item.kind))
          .font(.system(size: 13, weight: .black))
          .foregroundStyle(Color(studyPlannerHex: item.color))
      }
      .frame(width: 28, height: 28)

      VStack(alignment: .leading, spacing: 2) {
        Text(item.label.uppercased())
          .font(.system(size: 9, weight: .black, design: .rounded))
          .foregroundStyle(Color(studyPlannerHex: item.color))
          .lineLimit(1)
        Text(item.title)
          .font(.system(size: 14, weight: .bold, design: .rounded))
          .foregroundStyle(.white)
          .lineLimit(1)
          .minimumScaleFactor(0.58)
        Text(item.detail)
          .font(.system(size: 10, weight: .semibold, design: .rounded))
          .foregroundStyle(StudyPlannerWatchTheme.muted)
          .lineLimit(1)
          .minimumScaleFactor(0.62)
      }

      Spacer(minLength: 2)

      Text(item.value)
        .font(.system(size: 13, weight: .black, design: .rounded))
        .foregroundStyle(StudyPlannerWatchTheme.soft)
        .lineLimit(1)
        .minimumScaleFactor(0.50)
    }
    .padding(9)
    .background(
      RoundedRectangle(cornerRadius: 8, style: .continuous)
        .fill(StudyPlannerWatchTheme.card)
    )
  }
}
