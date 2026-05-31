import SwiftUI

enum SPDesignTokens {
  static let page = Color(red: 0.965, green: 0.972, blue: 0.988)
  static let surface = Color.white
  static let ink = Color(red: 0.035, green: 0.045, blue: 0.07)
  static let muted = Color(red: 0.39, green: 0.43, blue: 0.50)
  static let hairline = Color(red: 0.875, green: 0.895, blue: 0.935)
  static let violet = Color(red: 0.43, green: 0.22, blue: 0.90)
  static let blue = Color(red: 0.06, green: 0.34, blue: 0.85)
  static let pink = Color(red: 0.83, green: 0.10, blue: 0.34)
  static let green = Color(red: 0.02, green: 0.48, blue: 0.24)
  static let orange = Color(red: 0.91, green: 0.36, blue: 0.03)
  static let teal = Color(red: 0.00, green: 0.55, blue: 0.62)

  static let radiusSmall: CGFloat = 14
  static let radiusCard: CGFloat = 22
  static let radiusPanel: CGFloat = 28
  static let radiusPhone: CGFloat = 44
  static let gap: CGFloat = 14
  static let panelPadding: CGFloat = 18
}

struct LifeStudioView: View {
  @State private var selectedIdentity = "Focused Scholar"
  @State private var selectedLayout = "Feed First"
  @State private var selectedBehavior = "Highest GPA"
  @State private var selectedWidgets: Set<String> = ["Exam Countdown", "Grade Impact"]
  @State private var selectedWatch: Set<String> = ["Next Class", "Focus Window"]
  @State private var selectedFriction: Set<String> = ["Procrastination"]
  @State private var selectedVibe = 0

  private let identities = [
    SPStudioChoice("Focused Scholar", "brain.head.profile", SPDesignTokens.violet),
    SPStudioChoice("Active Athlete", "figure.run", SPDesignTokens.blue),
    SPStudioChoice("Creative Artist", "music.note", SPDesignTokens.pink),
    SPStudioChoice("Competitive Leader", "trophy", SPDesignTokens.orange),
    SPStudioChoice("Balanced Wellness", "leaf", SPDesignTokens.green),
    SPStudioChoice("Working Professional", "briefcase", Color(red: 0.72, green: 0.28, blue: 0.08)),
    SPStudioChoice("Curious Explorer", "atom", Color(red: 0.50, green: 0.24, blue: 0.85)),
    SPStudioChoice("Research Driven", "scope", SPDesignTokens.teal)
  ]

  private let layouts = [
    SPStudioChoice("Feed First", "rectangle.grid.1x2", SPDesignTokens.violet),
    SPStudioChoice("Timeline", "calendar", SPDesignTokens.blue),
    SPStudioChoice("Focus First", "timer", SPDesignTokens.green),
    SPStudioChoice("Split View", "rectangle.split.2x1", SPDesignTokens.orange),
    SPStudioChoice("Minimal", "sparkles", Color.black)
  ]

  private let widgetChoices = [
    SPStudioChoice("Exam Countdown", "timer", SPDesignTokens.violet),
    SPStudioChoice("Grade Impact", "gauge.with.dots.needle.67percent", SPDesignTokens.ink),
    SPStudioChoice("Future Risk", "exclamationmark.triangle", SPDesignTokens.pink),
    SPStudioChoice("Free Time Forecast", "bolt", SPDesignTokens.green),
    SPStudioChoice("Recovery Window", "sparkles", SPDesignTokens.teal),
    SPStudioChoice("Life Balance", "circle.hexagongrid", SPDesignTokens.blue)
  ]

  private let watchChoices = [
    SPStudioChoice("Next Class", "calendar.badge.clock", SPDesignTokens.blue),
    SPStudioChoice("Focus Window", "clock", SPDesignTokens.teal),
    SPStudioChoice("Exam Risk", "lock.trianglebadge.exclamationmark", SPDesignTokens.pink),
    SPStudioChoice("Semester Progress", "arrow.triangle.2.circlepath", SPDesignTokens.violet),
    SPStudioChoice("Free Time", "power", SPDesignTokens.green)
  ]

  private let behaviors = [
    SPStudioChoice("Highest GPA", "graduationcap", SPDesignTokens.violet),
    SPStudioChoice("Less Stress", "heart", SPDesignTokens.green),
    SPStudioChoice("Athletic Performance", "figure.run", SPDesignTokens.blue),
    SPStudioChoice("Life Balance", "scalemass", SPDesignTokens.orange),
    SPStudioChoice("High Achievement", "rocket", Color(red: 0.48, green: 0.14, blue: 0.82))
  ]

  private let frictions = ["Procrastination", "Exam Anxiety", "Overcommitment", "Focus Issues", "Forgetfulness"]
  private let vibeColors: [Color] = [
    SPDesignTokens.violet,
    Color(red: 0.03, green: 0.09, blue: 0.18),
    SPDesignTokens.teal,
    SPDesignTokens.green,
    SPDesignTokens.orange,
    SPDesignTokens.pink
  ]

  var body: some View {
    GeometryReader { proxy in
      let wide = proxy.size.width > 840
      let nativePreview = ProcessInfo.processInfo.arguments.contains("-SPNativeLifeStudioPreview")

      ZStack {
        SPDesignTokens.page.ignoresSafeArea()
        if nativePreview {
          nativeSimulatorBoard
        } else {
          ScrollView(showsIndicators: false) {
          if wide {
            HStack(alignment: .top, spacing: 18) {
              leftRail
                .frame(width: 182)
              controlsColumn
                .frame(width: 320)
              SPPreviewPhone(
                identity: selectedIdentity,
                behavior: selectedBehavior,
                vibe: vibeColors[selectedVibe],
                selectedWidgets: Array(selectedWidgets).sorted()
              )
              .frame(width: 330)
              rightColumn
                .frame(width: 310)
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
          } else {
            VStack(alignment: .leading, spacing: 18) {
              headerCompact
              SPPreviewPhone(
                identity: selectedIdentity,
                behavior: selectedBehavior,
                vibe: vibeColors[selectedVibe],
                selectedWidgets: Array(selectedWidgets).sorted()
              )
              .frame(maxWidth: 380)
              .frame(height: 690)
              .frame(maxWidth: .infinity)
              controlsColumn
              rightColumn
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
          }
          }
        }
      }
    }
    .preferredColorScheme(.light)
  }

  private var nativeSimulatorBoard: some View {
    VStack(spacing: 0) {
      HStack(alignment: .top, spacing: 5) {
        scaledPreview(width: 182, height: 650, scale: 0.54) {
          leftRail
        }
        scaledPreview(width: 320, height: 720, scale: 0.55) {
          controlsColumn
        }
        scaledPreview(width: 330, height: 690, scale: 0.58) {
          SPPreviewPhone(
            identity: selectedIdentity,
            behavior: selectedBehavior,
            vibe: vibeColors[selectedVibe],
            selectedWidgets: Array(selectedWidgets).sorted()
          )
        }
        scaledPreview(width: 310, height: 720, scale: 0.55) {
          rightColumn
        }
      }
      .padding(.horizontal, 6)
      .padding(.vertical, 5)
      Spacer(minLength: 0)
    }
  }

  private func scaledPreview<Content: View>(
    width: CGFloat,
    height: CGFloat,
    scale: CGFloat,
    @ViewBuilder content: () -> Content
  ) -> some View {
    content()
      .frame(width: width, height: height, alignment: .topLeading)
      .scaleEffect(scale, anchor: .topLeading)
      .frame(width: width * scale, height: height * scale, alignment: .topLeading)
  }

  private var headerCompact: some View {
    VStack(alignment: .leading, spacing: 8) {
      LifeStudioMark()
      Text("Design your life OS.")
        .font(.system(size: 40, weight: .bold, design: .rounded))
        .foregroundStyle(SPDesignTokens.ink)
      Text("Every choice changes the feed, widgets, watch, forecast, colors, and recommendations.")
        .font(.system(size: 15, weight: .medium))
        .foregroundStyle(SPDesignTokens.muted)
    }
  }

  private var leftRail: some View {
    VStack(alignment: .leading, spacing: 18) {
      LifeStudioMark()
      VStack(alignment: .leading, spacing: 0) {
        Text("Design your")
          .font(.system(size: 28, weight: .bold, design: .rounded))
        Text("life OS.")
          .font(.system(size: 38, weight: .bold, design: .rounded))
          .foregroundStyle(SPDesignTokens.violet)
      }
      Text("We handle the intelligence. You shape the experience.")
        .font(.system(size: 13, weight: .semibold))
        .foregroundStyle(SPDesignTokens.muted)

      VStack(spacing: 10) {
        RailRow(icon: "person.crop.circle", title: "Identity", detail: "What drives you.", active: true)
        RailRow(icon: "rectangle.grid.1x2", title: "Layout", detail: "How you want to see it.", active: false)
        RailRow(icon: "square.grid.2x2", title: "Widget DNA", detail: "What shows up.", active: false)
        RailRow(icon: "applewatch", title: "Watch DNA", detail: "Complications and rings.", active: false)
        RailRow(icon: "gearshape", title: "OS Behavior", detail: "How your OS adapts.", active: false)
      }
      Spacer(minLength: 8)
    }
    .padding(16)
    .frame(maxHeight: .infinity, alignment: .top)
  }

  private var controlsColumn: some View {
    VStack(alignment: .leading, spacing: 14) {
      SPStudioSection(number: 1, title: "Choose Your Identity", note: "This influences your default OS.") {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 4), spacing: 10) {
          ForEach(identities) { choice in
            StudioIconTile(
              choice: choice,
              selected: selectedIdentity == choice.title,
              action: { selectedIdentity = choice.title }
            )
          }
        }
      }

      SPStudioSection(number: 2, title: "Pick Your Layout", note: "How your feed is structured.") {
        HStack(spacing: 8) {
          ForEach(layouts) { choice in
            StudioMiniTile(choice: choice, selected: selectedLayout == choice.title) {
              selectedLayout = choice.title
            }
          }
        }
        SPLifeCard {
          VStack(alignment: .leading, spacing: 9) {
            Text("Your Layout Preview")
              .font(.system(size: 12, weight: .bold))
              .foregroundStyle(SPDesignTokens.ink)
            LayoutPreviewBars(vibe: vibeColors[selectedVibe])
          }
        }
      }

      SPStudioSection(number: 3, title: "Choose Your Vibe", note: "Make it feel like you.") {
        HStack(spacing: 12) {
          ForEach(Array(vibeColors.enumerated()), id: \.offset) { index, color in
            Button {
              selectedVibe = index
            } label: {
              Circle()
                .fill(color.gradient)
                .frame(width: 34, height: 34)
                .overlay(Circle().stroke(selectedVibe == index ? SPDesignTokens.ink : Color.clear, lineWidth: 3))
                .overlay(Circle().stroke(Color.white, lineWidth: 2).padding(3))
            }
            .buttonStyle(.plain)
          }
          Button(action: {}) {
            Image(systemName: "plus")
              .font(.system(size: 15, weight: .bold))
              .foregroundStyle(SPDesignTokens.ink)
              .frame(width: 34, height: 34)
              .background(Circle().fill(SPDesignTokens.surface))
              .overlay(Circle().stroke(SPDesignTokens.hairline, lineWidth: 1))
          }
          .buttonStyle(.plain)
        }
      }

      SPWidgetDNASelector(choices: widgetChoices, selected: $selectedWidgets)
      SPWatchDNASelector(choices: watchChoices, selected: $selectedWatch)
    }
  }

  private var rightColumn: some View {
    VStack(alignment: .leading, spacing: 14) {
      SPStudioSection(number: 4, title: "Watch and Island Preview", note: "Everything adapts.") {
        HStack(alignment: .top, spacing: 12) {
          SPWatchPreview(vibe: vibeColors[selectedVibe], selectedWatch: Array(selectedWatch).sorted())
          SPLockScreenPreview(vibe: vibeColors[selectedVibe], behavior: selectedBehavior)
        }
      }

      SPOSBehaviorSelector(choices: behaviors, selected: $selectedBehavior)

      SPStudioSection(number: 5, title: "Friction Points", note: "What causes problems?") {
        FlowWrap(items: frictions, selected: $selectedFriction)
      }

      SPStudioSection(number: 6, title: "Live Preview: Your Life OS", note: "See it in yours.") {
        HStack(alignment: .bottom, spacing: 10) {
          ForEach(behaviors.prefix(5)) { choice in
            MiniPhonePreview(
              title: choice.title,
              color: choice.color,
              selected: selectedBehavior == choice.title,
              action: { selectedBehavior = choice.title }
            )
          }
        }
      }

      SPAdaptiveFeedPreview(vibe: vibeColors[selectedVibe], behavior: selectedBehavior, identity: selectedIdentity)
    }
  }
}

struct SPStudioChoice: Identifiable, Hashable {
  let id = UUID()
  let title: String
  let symbol: String
  let color: Color

  init(_ title: String, _ symbol: String, _ color: Color) {
    self.title = title
    self.symbol = symbol
    self.color = color
  }
}

struct LifeStudioMark: View {
  var body: some View {
    HStack(spacing: 10) {
      RoundedRectangle(cornerRadius: 10, style: .continuous)
        .fill(Color.black)
        .frame(width: 42, height: 42)
        .overlay(
          VStack(spacing: 4) {
            Capsule().fill(Color.blue).frame(width: 23, height: 4)
            Capsule().fill(Color.green).frame(width: 23, height: 4)
            Capsule().fill(Color.pink).frame(width: 23, height: 4)
            Capsule().fill(Color.orange).frame(width: 23, height: 4)
          }
        )
      VStack(alignment: .leading, spacing: 2) {
        Text("StudyPlanner")
          .font(.system(size: 15, weight: .bold, design: .rounded))
          .foregroundStyle(SPDesignTokens.ink)
          .lineLimit(1)
          .minimumScaleFactor(0.75)
        Text("Syllabus AI - Life Studio")
          .font(.system(size: 9, weight: .semibold))
          .foregroundStyle(SPDesignTokens.muted)
          .lineLimit(1)
          .minimumScaleFactor(0.65)
      }
    }
  }
}

struct SPLifeCard<Content: View>: View {
  let content: Content

  init(@ViewBuilder content: () -> Content) {
    self.content = content()
  }

  var body: some View {
    content
      .padding(SPDesignTokens.panelPadding)
      .background(
        RoundedRectangle(cornerRadius: SPDesignTokens.radiusCard, style: .continuous)
          .fill(SPDesignTokens.surface)
      )
      .overlay(
        RoundedRectangle(cornerRadius: SPDesignTokens.radiusCard, style: .continuous)
          .stroke(SPDesignTokens.hairline.opacity(0.8), lineWidth: 1)
      )
      .shadow(color: Color.black.opacity(0.055), radius: 22, x: 0, y: 10)
  }
}

struct SPStudioSection<Content: View>: View {
  let number: Int
  let title: String
  let note: String
  let content: Content

  init(number: Int, title: String, note: String, @ViewBuilder content: () -> Content) {
    self.number = number
    self.title = title
    self.note = note
    self.content = content()
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack(alignment: .top, spacing: 9) {
        Text("\(number)")
          .font(.system(size: 11, weight: .bold, design: .rounded))
          .foregroundStyle(.white)
          .frame(width: 22, height: 22)
          .background(Circle().fill(Color.black))
        VStack(alignment: .leading, spacing: 2) {
          Text(title)
            .font(.system(size: 15, weight: .bold, design: .rounded))
            .foregroundStyle(SPDesignTokens.ink)
          Text(note)
            .font(.system(size: 10, weight: .medium))
            .foregroundStyle(SPDesignTokens.muted)
        }
      }
      content
    }
  }
}

struct RailRow: View {
  let icon: String
  let title: String
  let detail: String
  let active: Bool

  var body: some View {
    HStack(spacing: 11) {
      Image(systemName: icon)
        .font(.system(size: 16, weight: .semibold))
        .foregroundStyle(active ? SPDesignTokens.violet : SPDesignTokens.blue)
        .frame(width: 34, height: 34)
        .background(Circle().fill(active ? SPDesignTokens.violet.opacity(0.12) : SPDesignTokens.blue.opacity(0.08)))
      VStack(alignment: .leading, spacing: 2) {
        Text(title)
          .font(.system(size: 12, weight: .bold))
          .foregroundStyle(SPDesignTokens.ink)
        Text(detail)
          .font(.system(size: 8.5, weight: .semibold))
          .foregroundStyle(SPDesignTokens.muted)
      }
      Spacer(minLength: 0)
      Image(systemName: "chevron.right")
        .font(.system(size: 9, weight: .bold))
        .foregroundStyle(SPDesignTokens.muted.opacity(0.65))
    }
    .padding(.horizontal, 10)
    .padding(.vertical, 8)
    .background(
      RoundedRectangle(cornerRadius: 16, style: .continuous)
        .fill(active ? SPDesignTokens.violet.opacity(0.08) : Color.clear)
    )
  }
}

struct StudioIconTile: View {
  let choice: SPStudioChoice
  let selected: Bool
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      VStack(spacing: 6) {
        Image(systemName: choice.symbol)
          .font(.system(size: 22, weight: .semibold))
          .foregroundStyle(choice.color)
        Text(choice.title)
          .font(.system(size: 9.5, weight: .bold))
          .foregroundStyle(SPDesignTokens.ink)
          .multilineTextAlignment(.center)
          .lineLimit(2)
          .minimumScaleFactor(0.74)
      }
      .frame(minHeight: 76)
      .frame(maxWidth: .infinity)
      .padding(.horizontal, 5)
      .background(
        RoundedRectangle(cornerRadius: 16, style: .continuous)
          .fill(SPDesignTokens.surface)
      )
      .overlay(
        RoundedRectangle(cornerRadius: 16, style: .continuous)
          .stroke(selected ? choice.color : SPDesignTokens.hairline, lineWidth: selected ? 2 : 1)
      )
      .overlay(alignment: .topTrailing) {
        if selected {
          Image(systemName: "checkmark.circle.fill")
            .font(.system(size: 16, weight: .bold))
            .foregroundStyle(choice.color)
            .offset(x: 6, y: -6)
        }
      }
      .shadow(color: selected ? choice.color.opacity(0.20) : Color.black.opacity(0.035), radius: selected ? 12 : 8, x: 0, y: 5)
    }
    .buttonStyle(.plain)
  }
}

struct StudioMiniTile: View {
  let choice: SPStudioChoice
  let selected: Bool
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      VStack(spacing: 5) {
        Image(systemName: choice.symbol)
          .font(.system(size: 13, weight: .bold))
        Text(choice.title)
          .font(.system(size: 8.5, weight: .bold))
          .lineLimit(1)
          .minimumScaleFactor(0.7)
      }
      .foregroundStyle(selected ? choice.color : SPDesignTokens.muted)
      .frame(maxWidth: .infinity)
      .frame(height: 50)
      .background(
        RoundedRectangle(cornerRadius: 14, style: .continuous)
          .fill(selected ? choice.color.opacity(0.11) : SPDesignTokens.surface)
      )
      .overlay(
        RoundedRectangle(cornerRadius: 14, style: .continuous)
          .stroke(selected ? choice.color : SPDesignTokens.hairline, lineWidth: 1)
      )
    }
    .buttonStyle(.plain)
  }
}

struct LayoutPreviewBars: View {
  let vibe: Color

  var body: some View {
    HStack(spacing: 11) {
      VStack(spacing: 6) {
        ForEach(0..<3, id: \.self) { index in
          RoundedRectangle(cornerRadius: 5, style: .continuous)
            .fill([vibe, SPDesignTokens.orange, SPDesignTokens.green][index].gradient)
            .frame(height: 10)
            .overlay(alignment: .leading) {
              Circle().fill(Color.white.opacity(0.8)).frame(width: 5, height: 5).padding(.leading, 5)
            }
        }
      }
      VStack(spacing: 6) {
        ForEach(0..<3, id: \.self) { _ in
          RoundedRectangle(cornerRadius: 5, style: .continuous)
            .fill(SPDesignTokens.page)
            .frame(height: 10)
        }
      }
      .frame(width: 72)
      VStack(spacing: 6) {
        ForEach(0..<3, id: \.self) { _ in
          HStack(spacing: 5) {
            RoundedRectangle(cornerRadius: 4).fill(SPDesignTokens.page).frame(height: 10)
            Circle().fill(vibe.opacity(0.35)).frame(width: 5, height: 5)
          }
        }
      }
      .frame(width: 48)
    }
  }
}

struct SPWidgetDNASelector: View {
  let choices: [SPStudioChoice]
  @Binding var selected: Set<String>

  var body: some View {
    SPStudioSection(number: 3, title: "Widget DNA", note: "Choose what your widgets optimize for.") {
      LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3), spacing: 10) {
        ForEach(choices) { choice in
          ToggleChoiceTile(choice: choice, selected: selected.contains(choice.title)) {
            toggle(choice.title)
          }
        }
      }
    }
  }

  private func toggle(_ title: String) {
    if selected.contains(title) {
      selected.remove(title)
    } else {
      selected.insert(title)
    }
  }
}

struct SPWatchDNASelector: View {
  let choices: [SPStudioChoice]
  @Binding var selected: Set<String>

  var body: some View {
    SPStudioSection(number: 4, title: "Watch DNA", note: "Pick complications that matter most.") {
      HStack(spacing: 8) {
        ForEach(choices) { choice in
          Button {
            toggle(choice.title)
          } label: {
            VStack(spacing: 5) {
              Image(systemName: choice.symbol)
                .font(.system(size: 14, weight: .bold))
              Text(choice.title)
                .font(.system(size: 8, weight: .bold))
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.7)
            }
            .foregroundStyle(selected.contains(choice.title) ? choice.color : SPDesignTokens.muted)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(
              RoundedRectangle(cornerRadius: 15, style: .continuous)
                .fill(selected.contains(choice.title) ? choice.color.opacity(0.10) : SPDesignTokens.surface)
            )
          }
          .buttonStyle(.plain)
        }
      }
    }
  }

  private func toggle(_ title: String) {
    if selected.contains(title) {
      selected.remove(title)
    } else {
      selected.insert(title)
    }
  }
}

struct ToggleChoiceTile: View {
  let choice: SPStudioChoice
  let selected: Bool
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      VStack(alignment: .leading, spacing: 7) {
        HStack {
          Image(systemName: choice.symbol)
            .font(.system(size: 15, weight: .bold))
            .foregroundStyle(choice.color)
          Spacer()
          if selected {
            Image(systemName: "checkmark.circle.fill")
              .font(.system(size: 14, weight: .bold))
              .foregroundStyle(choice.color)
          }
        }
        Text(choice.title)
          .font(.system(size: 10, weight: .bold))
          .foregroundStyle(SPDesignTokens.ink)
          .lineLimit(2)
          .minimumScaleFactor(0.76)
        Text(detail(for: choice.title))
          .font(.system(size: 7.8, weight: .semibold))
          .foregroundStyle(SPDesignTokens.muted)
          .lineLimit(1)
      }
      .padding(11)
      .frame(height: 88)
      .background(
        RoundedRectangle(cornerRadius: 16, style: .continuous)
          .fill(SPDesignTokens.surface)
      )
      .overlay(
        RoundedRectangle(cornerRadius: 16, style: .continuous)
          .stroke(selected ? choice.color : SPDesignTokens.hairline, lineWidth: selected ? 1.5 : 1)
      )
    }
    .buttonStyle(.plain)
  }

  private func detail(for title: String) -> String {
    switch title {
    case "Exam Countdown": return "Track important exams"
    case "Grade Impact": return "See what moves grades"
    case "Future Risk": return "Surface problems early"
    case "Free Time Forecast": return "Protect your time"
    case "Recovery Window": return "Plan rest and recharge"
    default: return "Balance all of it"
    }
  }
}

struct SPOSBehaviorSelector: View {
  let choices: [SPStudioChoice]
  @Binding var selected: String

  var body: some View {
    SPStudioSection(number: 5, title: "OS Behavior", note: "What are you optimizing for?") {
      HStack(spacing: 10) {
        ForEach(choices) { choice in
          Button {
            selected = choice.title
          } label: {
            VStack(spacing: 7) {
              Image(systemName: choice.symbol)
                .font(.system(size: 15, weight: .bold))
              Text(choice.title)
                .font(.system(size: 8.5, weight: .bold))
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.68)
            }
            .foregroundStyle(selected == choice.title ? choice.color : SPDesignTokens.muted)
            .frame(maxWidth: .infinity)
            .frame(height: 76)
            .background(
              RoundedRectangle(cornerRadius: 17, style: .continuous)
                .fill(selected == choice.title ? choice.color.opacity(0.10) : SPDesignTokens.surface)
            )
            .overlay(
              RoundedRectangle(cornerRadius: 17, style: .continuous)
                .stroke(selected == choice.title ? choice.color : SPDesignTokens.hairline, lineWidth: 1)
            )
          }
          .buttonStyle(.plain)
        }
      }
    }
  }
}

struct FlowWrap: View {
  let items: [String]
  @Binding var selected: Set<String>

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack(spacing: 8) {
        pill(items[0])
        pill(items[1])
        pill(items[2])
      }
      HStack(spacing: 8) {
        pill(items[3])
        pill(items[4])
        Button(action: {}) {
          Label("Add", systemImage: "plus")
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(SPDesignTokens.ink)
            .padding(.horizontal, 12)
            .frame(height: 30)
            .background(Capsule().fill(SPDesignTokens.surface))
            .overlay(Capsule().stroke(SPDesignTokens.hairline, lineWidth: 1))
        }
        .buttonStyle(.plain)
      }
    }
  }

  private func pill(_ title: String) -> some View {
    Button {
      if selected.contains(title) {
        selected.remove(title)
      } else {
        selected.insert(title)
      }
    } label: {
      Text(title)
        .font(.system(size: 10, weight: .bold))
        .foregroundStyle(selected.contains(title) ? SPDesignTokens.violet : SPDesignTokens.muted)
        .padding(.horizontal, 11)
        .frame(height: 30)
        .background(Capsule().fill(selected.contains(title) ? SPDesignTokens.violet.opacity(0.10) : SPDesignTokens.surface))
        .overlay(Capsule().stroke(selected.contains(title) ? SPDesignTokens.violet : SPDesignTokens.hairline, lineWidth: 1))
    }
    .buttonStyle(.plain)
  }
}

struct SPPreviewPhone: View {
  let identity: String
  let behavior: String
  let vibe: Color
  let selectedWidgets: [String]

  var body: some View {
    ZStack {
      RoundedRectangle(cornerRadius: SPDesignTokens.radiusPhone + 7, style: .continuous)
        .fill(Color.black)
        .shadow(color: Color.black.opacity(0.30), radius: 20, x: 0, y: 12)

      RoundedRectangle(cornerRadius: SPDesignTokens.radiusPhone, style: .continuous)
        .fill(
          LinearGradient(
            colors: [Color(red: 0.02, green: 0.06, blue: 0.16), vibe.opacity(0.92)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
          )
        )
        .padding(6)

      VStack(spacing: 0) {
        phoneStatus
        VStack(alignment: .leading, spacing: 14) {
          HStack {
            VStack(alignment: .leading, spacing: 3) {
              Text("Your Student Life OS")
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
              Label("Behavior: \(behavior)", systemImage: "sparkles")
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(.white.opacity(0.72))
            }
            Spacer()
            Text("Live")
              .font(.system(size: 10, weight: .bold))
              .foregroundStyle(.white)
              .padding(.horizontal, 10)
              .frame(height: 24)
              .background(Capsule().fill(vibe))
          }

          WeekStrip(vibe: vibe)

          VStack(spacing: 12) {
            PhoneFeedCard(
              title: "Chemistry Midterm",
              detail: "Thursday, May 2 - 8:00 AM",
              reason: "Start tonight. You tend to wait too long.",
              impact: "High Impact",
              symbol: "flask",
              color: SPDesignTokens.pink
            )
            PhoneFeedCard(
              title: "Calculus II Homework",
              detail: "Due Thu, May 2 - 10:59 PM",
              reason: "Best time: tonight - 50 min",
              impact: "High Impact",
              symbol: "doc.text.fill",
              color: vibe
            )
            PhoneFeedCard(
              title: "Physics Lab Report",
              detail: "Due Tue, May 7 - 11:59 PM",
              reason: "Break into 2 focused blocks.",
              impact: "Medium Impact",
              symbol: "book.closed.fill",
              color: SPDesignTokens.blue
            )
            PhoneFeedCard(
              title: "Soccer Practice",
              detail: "Today - 4:00 PM",
              reason: "Good time to move and reset.",
              impact: "Low Impact",
              symbol: "soccerball",
              color: SPDesignTokens.green
            )
          }

          Spacer(minLength: 0)

          PhoneTabBar(vibe: vibe, selectedWidgets: selectedWidgets)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 16)
      }
      .padding(6)
    }
    .aspectRatio(0.48, contentMode: .fit)
  }

  private var phoneStatus: some View {
    HStack {
      Text("9:41")
        .font(.system(size: 12, weight: .bold))
      Spacer()
      HStack(spacing: 4) {
        Image(systemName: "cellularbars")
        Image(systemName: "wifi")
        Image(systemName: "battery.100")
      }
      .font(.system(size: 10, weight: .semibold))
    }
    .foregroundStyle(.white)
    .padding(.horizontal, 28)
    .padding(.top, 14)
    .padding(.bottom, 12)
    .overlay(alignment: .top) {
      Capsule()
        .fill(Color.black)
        .frame(width: 112, height: 31)
        .padding(.top, 8)
    }
  }
}

struct WeekStrip: View {
  let vibe: Color
  private let days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  private let nums = ["8", "9", "10", "11", "12", "13", "14"]

  var body: some View {
    HStack {
      ForEach(Array(days.enumerated()), id: \.offset) { index, day in
        VStack(spacing: 4) {
          Text(day)
            .font(.system(size: 8, weight: .semibold))
            .foregroundStyle(.white.opacity(0.62))
          Text(nums[index])
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(.white)
            .frame(width: 25, height: 25)
            .background(Circle().fill(index == 3 ? vibe : Color.white.opacity(0.08)))
        }
        .frame(maxWidth: .infinity)
      }
    }
  }
}

struct PhoneFeedCard: View {
  let title: String
  let detail: String
  let reason: String
  let impact: String
  let symbol: String
  let color: Color

  var body: some View {
    HStack(alignment: .top, spacing: 12) {
      Image(systemName: symbol)
        .font(.system(size: 15, weight: .bold))
        .foregroundStyle(.white)
        .frame(width: 32, height: 32)
        .background(RoundedRectangle(cornerRadius: 9, style: .continuous).fill(Color.white.opacity(0.16)))
      VStack(alignment: .leading, spacing: 4) {
        HStack(alignment: .top) {
          Text(title)
            .font(.system(size: 13, weight: .bold))
            .foregroundStyle(.white)
          Spacer()
          Text(impact)
            .font(.system(size: 8, weight: .bold))
            .foregroundStyle(.white.opacity(0.85))
            .padding(.horizontal, 7)
            .frame(height: 18)
            .background(Capsule().fill(Color.white.opacity(0.14)))
        }
        Text(detail)
          .font(.system(size: 9.5, weight: .semibold))
          .foregroundStyle(.white.opacity(0.78))
        Text(reason)
          .font(.system(size: 10, weight: .bold))
          .foregroundStyle(.white)
          .lineLimit(2)
      }
    }
    .padding(13)
    .background(
      RoundedRectangle(cornerRadius: 18, style: .continuous)
        .fill(
          LinearGradient(
            colors: [color.opacity(0.96), color.opacity(0.56), Color.black.opacity(0.18)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
          )
        )
    )
    .overlay(
      RoundedRectangle(cornerRadius: 18, style: .continuous)
        .stroke(Color.white.opacity(0.14), lineWidth: 1)
    )
  }
}

struct PhoneTabBar: View {
  let vibe: Color
  let selectedWidgets: [String]

  var body: some View {
    HStack(spacing: 14) {
      tab("list.bullet", "Feed")
      tab("calendar", "Classes")
      Circle()
        .fill(vibe.gradient)
        .frame(width: 48, height: 48)
        .overlay(Circle().stroke(Color.white.opacity(0.25), lineWidth: 4))
        .shadow(color: vibe.opacity(0.65), radius: 12, x: 0, y: 0)
      tab("clock", "Focus")
      tab("person", "Life")
    }
    .padding(.horizontal, 12)
    .padding(.vertical, 9)
    .background(Capsule().fill(Color.black.opacity(0.36)))
    .overlay(alignment: .top) {
      if let first = selectedWidgets.first {
        Text(first)
          .font(.system(size: 7, weight: .bold))
          .foregroundStyle(.white.opacity(0.75))
          .offset(y: -13)
      }
    }
  }

  private func tab(_ symbol: String, _ label: String) -> some View {
    VStack(spacing: 3) {
      Image(systemName: symbol)
        .font(.system(size: 13, weight: .bold))
      Text(label)
        .font(.system(size: 7, weight: .bold))
    }
    .foregroundStyle(.white.opacity(0.70))
    .frame(maxWidth: .infinity)
  }
}

struct SPWatchPreview: View {
  let vibe: Color
  let selectedWatch: [String]

  var body: some View {
    ZStack {
      RoundedRectangle(cornerRadius: 48, style: .continuous)
        .fill(Color.black)
        .frame(width: 130, height: 164)
        .shadow(color: Color.black.opacity(0.25), radius: 18, x: 0, y: 8)
      RoundedRectangle(cornerRadius: 39, style: .continuous)
        .fill(
          LinearGradient(
            colors: [Color.black, vibe.opacity(0.62)],
            startPoint: .top,
            endPoint: .bottom
          )
        )
        .frame(width: 112, height: 142)
      VStack(spacing: 6) {
        Text("THU 11")
          .font(.system(size: 9, weight: .bold))
          .foregroundStyle(.white.opacity(0.70))
        Text("10:09")
          .font(.system(size: 25, weight: .medium, design: .rounded))
          .foregroundStyle(.white)
        SPLockPill(title: selectedWatch.first ?? "Next Class", value: "Calculus II", color: vibe)
        HStack(spacing: 8) {
          ring("72", "Focus", SPDesignTokens.teal)
          ring("8:15", "PM", SPDesignTokens.pink)
          ring("5", "Exam", SPDesignTokens.orange)
        }
      }
      .frame(width: 100)
    }
  }

  private func ring(_ value: String, _ label: String, _ color: Color) -> some View {
    VStack(spacing: 2) {
      Text(value)
        .font(.system(size: 10, weight: .bold))
        .foregroundStyle(.white)
      Text(label)
        .font(.system(size: 6, weight: .bold))
        .foregroundStyle(.white.opacity(0.65))
    }
    .frame(width: 30, height: 30)
    .overlay(Circle().stroke(color, lineWidth: 2))
  }
}

struct SPLockScreenPreview: View {
  let vibe: Color
  let behavior: String

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      SPLockPill(title: "Chemistry Midterm", value: "3 days - High Impact", color: SPDesignTokens.pink)
      SPLockPill(title: "Calculus II Homework", value: "Due tomorrow - Start tonight", color: vibe)
      SPLockPill(title: "Free Time", value: "2.4 hrs this week", color: SPDesignTokens.green)
      Text("Adaptive Complications")
        .font(.system(size: 10, weight: .bold))
        .foregroundStyle(SPDesignTokens.ink)
        .padding(.top, 5)
      complication("Next Class", "Always know what's next", SPDesignTokens.blue)
      complication("Focus Window", "Your best time to focus", SPDesignTokens.teal)
      complication("Exam Risk", "Know risk before it hits", SPDesignTokens.pink)
    }
  }

  private func complication(_ title: String, _ detail: String, _ color: Color) -> some View {
    HStack(spacing: 8) {
      Image(systemName: "circle.hexagongrid.fill")
        .font(.system(size: 11, weight: .bold))
        .foregroundStyle(color)
      VStack(alignment: .leading, spacing: 1) {
        Text(title)
          .font(.system(size: 9, weight: .bold))
        Text(detail)
          .font(.system(size: 7.5, weight: .semibold))
          .foregroundStyle(SPDesignTokens.muted)
      }
    }
  }
}

struct SPLockPill: View {
  let title: String
  let value: String
  let color: Color

  var body: some View {
    HStack(spacing: 9) {
      Image(systemName: "lock.circle")
        .font(.system(size: 12, weight: .bold))
        .foregroundStyle(.white)
      VStack(alignment: .leading, spacing: 1) {
        Text(title)
          .font(.system(size: 9.5, weight: .bold))
          .foregroundStyle(.white)
          .lineLimit(1)
        Text(value)
          .font(.system(size: 7.5, weight: .semibold))
          .foregroundStyle(.white.opacity(0.76))
          .lineLimit(1)
      }
      Spacer(minLength: 0)
    }
    .padding(.horizontal, 10)
    .frame(width: 154, height: 44)
    .background(
      Capsule()
        .fill(
          LinearGradient(
            colors: [color.opacity(0.96), color.opacity(0.62), Color.black.opacity(0.10)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
          )
        )
    )
    .shadow(color: color.opacity(0.22), radius: 10, x: 0, y: 5)
  }
}

struct MiniPhonePreview: View {
  let title: String
  let color: Color
  let selected: Bool
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      VStack(spacing: 6) {
        RoundedRectangle(cornerRadius: 16, style: .continuous)
          .fill(
            LinearGradient(colors: [Color.black, color], startPoint: .top, endPoint: .bottom)
          )
          .frame(width: 46, height: 88)
          .overlay(
            VStack(spacing: 4) {
              ForEach(0..<4, id: \.self) { index in
                RoundedRectangle(cornerRadius: 3)
                  .fill(index == 0 ? color.opacity(0.95) : Color.white.opacity(0.22))
                  .frame(width: 31, height: 8)
              }
            }
          )
        Text(title)
          .font(.system(size: 8, weight: .bold))
          .foregroundStyle(SPDesignTokens.ink)
          .lineLimit(1)
          .minimumScaleFactor(0.62)
        Circle()
          .stroke(selected ? color : SPDesignTokens.muted.opacity(0.45), lineWidth: selected ? 3 : 1)
          .frame(width: 13, height: 13)
          .overlay {
            if selected {
              Circle().fill(color).frame(width: 6, height: 6)
            }
          }
      }
    }
    .buttonStyle(.plain)
  }
}

struct SPAdaptiveFeedPreview: View {
  let vibe: Color
  let behavior: String
  let identity: String

  var body: some View {
    SPLifeCard {
      VStack(alignment: .leading, spacing: 12) {
        HStack {
          VStack(alignment: .leading, spacing: 2) {
            Text("Your OS In Action")
              .font(.system(size: 14, weight: .bold, design: .rounded))
              .foregroundStyle(SPDesignTokens.ink)
            Text("Once live, feed, widgets, watch, and reminders connect.")
              .font(.system(size: 9, weight: .semibold))
              .foregroundStyle(SPDesignTokens.muted)
          }
          Spacer()
          Image(systemName: "sparkles")
            .foregroundStyle(vibe)
        }
        HStack(spacing: 12) {
          metric("Workload", "High", SPDesignTokens.pink)
          metric("Focus Trend", "82%", SPDesignTokens.green)
          metric("Free Time", "6.2h", vibe)
        }
        HStack {
          Text(identity)
            .font(.system(size: 10, weight: .bold))
            .padding(.horizontal, 9)
            .frame(height: 26)
            .background(Capsule().fill(vibe.opacity(0.10)))
            .foregroundStyle(vibe)
          Text(behavior)
            .font(.system(size: 10, weight: .bold))
            .padding(.horizontal, 9)
            .frame(height: 26)
            .background(Capsule().fill(SPDesignTokens.page))
            .foregroundStyle(SPDesignTokens.ink)
        }
      }
    }
  }

  private func metric(_ title: String, _ value: String, _ color: Color) -> some View {
    VStack(alignment: .leading, spacing: 7) {
      Text(title)
        .font(.system(size: 8.5, weight: .bold))
        .foregroundStyle(SPDesignTokens.muted)
      Text(value)
        .font(.system(size: 18, weight: .bold, design: .rounded))
        .foregroundStyle(color)
      HStack(alignment: .bottom, spacing: 3) {
        ForEach([0.35, 0.62, 0.48, 0.82, 0.70], id: \.self) { height in
          Capsule().fill(color.opacity(0.75)).frame(width: 4, height: CGFloat(height * 22))
        }
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(10)
    .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(SPDesignTokens.page))
  }
}

#if DEBUG
struct LifeStudioView_Previews: PreviewProvider {
  static var previews: some View {
    LifeStudioView()
      .previewInterfaceOrientation(.landscapeLeft)
  }
}
#endif
