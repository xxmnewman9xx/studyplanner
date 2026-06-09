# Repo Map — Apple School AI OS

## External patterns reviewed
- Apple HIG / Liquid Glass: layered materials, depth, restrained motion, clarity over decoration.
- Widgetsmith/Widgy/Color Widgets/WidgetClub: template gallery, theme packs, live previews, saveable presets, customization as identity.
- Structured/Fantastical/Things 3: time-aware agenda, next action clarity, calm urgency, compact schedule cards.
- Notion/Apple Notes/Linear: document-like organization, high information density, simple hierarchy, fast capture.
- Expo Liquid Glass + Expo UI direction: SwiftUI-native materials are promising later, but current highest leverage is RN-safe glass tokens/cards.

## Local repo discovery
- `studyplanner-widget-core` and `StudyPlanner_ReferenceUI` were not available/readable in this runtime path scan, so implementation used the current app source of truth.
- Existing StudyPlanner strengths: planner logic, widget presets, theme engine, hard paywall, import/review flow, Widget Studio.

## Implementation choice
Do not bolt on shadcn/framer/storybook packages just to satisfy buzzwords. This is React Native/Expo; the high-leverage move is adapting their patterns: tokenized cards, composable preview states, clear variants, motion-ready structure, and screenshot-based QA.
