# Reference Extraction

Date: 2026-05-25

## Cloned Inputs

All mandatory repositories were cloned into `research/reference-repos/`.

| Repo | Extracted Pattern | Applied In StudyPlanner |
| --- | --- | --- |
| `Leonxlnx/taste-skill` | Taste gate: avoid generic card piles, fake data, weak hierarchy, cheap purple/blue AI visuals, missing states, and untruthful claims. | Used as the first audit pass. New work emphasizes real planner data, explicit states, restrained color, and true backend/widget boundaries. |
| `react-native-reanimated` | Use one intentional transition driver; animate opacity/transform, not layout dimensions. | Onboarding keeps a single `Animated.Value` transition across copy and previews. No new dependency was added because the package is not installed. |
| `react-native-gesture-handler` | Native-driven gestures are best when interaction complexity justifies the dependency. | No new gesture dependency was added; current controls remain simple tap/scroll surfaces. Future sheets should specify simultaneous/exclusive gesture relationships. |
| `react-native-bottom-sheet` | Bottom sheets need scrollable-aware content and keyboard handling. | Avoided adding sheets in this pass; Widget Studio and Scan stay inline to reduce state complexity. |
| `moti` | Small, isolated mount/press animations and skeleton patterns should not re-render parent screens. | Preserved existing native `Animated` onboarding transitions; no `moti` import because it is not in `package.json`. |
| `flash-list` | High-volume lists should use recycling, stable item identity, and type-aware item pools. | Current assignment/widget lists are small; documented FlashList as future migration only if real list volume grows. |
| `react-native-skia` | Canvas/Skia is appropriate for custom rendering, not for simple app chrome. | No Skia dependency added. Widget preview remains native RN views so it can reflect real widget data. |
| `tamagui` | Tokens, themes, and flattened component architecture keep UI coherent across web/native. | Reused existing `theme.ts` tokens and app theme packs rather than introducing a new system. |
| `gluestack-ui` | Copyable, accessible component variants with clear size/action semantics. | Strengthened switch/tile semantics via `accessibilityRole`/`accessibilityState` and explicit Widget Studio step states. |
| `expo/expo` | Keep Expo modules isolated in services and avoid hiding native/platform truth in UI. | Backend, IAP, calendar, reminders, storage, and widgets stay behind service files. |

## Dependency Truth

The repo currently depends on Expo, React Native, `lucide-react-native`, `expo-widgets`, `expo-iap`, calendar/reminder/import modules, and local planner/parser/widget services. It does not depend on Reanimated, Gesture Handler, Bottom Sheet, Moti, FlashList, Skia, Tamagui, or Gluestack. This pass used those repos as design and architecture references instead of adding large dependencies that would require native integration risk.

## Patterns Implemented

- Widget Studio now leads the Widgets tab.
- Widget Studio exposes the real setup sequence: choose widget, choose data, choose style, then place from iOS.
- Today now acts as a command center with direct Scan, Review, Calendar, and Widget actions tied to live planner counts.
- Onboarding preview range includes Scan, Review, Calendar, Today, Classes, Focus, and Widgets.
- Scan review explicitly blocks invalid/unreviewed work before Today, Calendar, reminders, or widgets use it.
