# StudyPlanner: Syllabus AI Implementation Notes

Status: DO NOT CODE YET until the Figma MCP limit is cleared and the SVG pack is imported/validated in Figma.

## Product Lock
- Keep the name: StudyPlanner: Syllabus AI.
- Do not rebrand to Student Life OS.
- Do not use a chatbot-first AI surface.
- Use the six attached GPT Image boards as the visual source of truth.

## Visual System
- White-first shell, black typography, high spacing, Apple-native hierarchy.
- Colored glass cards only for priority content.
- Orange exams/high impact; blue assignments/classes; green focus/wellness; teal activities/schedule; red risk/alerts; purple milestones/personalization.
- Native surfaces: iPhone feed, Widget Studio, Lock Screen, StandBy, Dynamic Island, Watch faces, complications, Live Activities.

## Component Contract
- PriorityCard, ProgressCard, FocusCard, RiskCard, MilestoneCard.
- WidgetPreview supports iOS Home, Lock Screen, StandBy, watchOS, Dynamic Island.
- ReviewInboxItem has approve/edit/dismiss states.
- ForecastInsight has confidence, trend, risk, and what-if variants.

## Engineering Notes
- SwiftUI + WidgetKit + ActivityKit + watchOS complications.
- Use semantic tokens, not hardcoded per-screen color.
- Large Dynamic Type pass required before implementation signoff.
- No old Figma assets should be reused.

## Watch Implementation Update
- Real watchOS target now exists: `StudyPlannerWatchApp`.
- Real WidgetKit complication extension now exists: `StudyPlannerWatchWidgets`.
- Watch content reads the same shared summary snapshot used by widgets, then syncs to watchOS with WatchConnectivity and App Group fallback.
- App Store copy may mention the Watch app and built complications only after release screenshots are captured from real watchOS/iOS simulator or device builds.
