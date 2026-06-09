# Reference Repo and Skill Map

Scope: high-leverage references used as patterns, not copied code.

| Source | Why it matters | Pattern adapted |
| --- | --- | --- |
| Expo Router docs: https://docs.expo.dev/develop/file-based-routing | Production navigation baseline | Keep routing thin and domain state outside route files. StudyPlanner currently uses state routing in `App.tsx`; future router work should preserve controlled screens. |
| Expo repo/templates: https://github.com/expo/expo | Canonical Expo structure | Keep services, logic, components, and screens separated instead of hiding app logic in navigation. |
| Reanimated layout docs: https://docs.swmansion.com/react-native-reanimated/docs/category/layout-animations | Motion discipline | Use one meaningful progress/transition driver for onboarding and review flow; avoid decorative animation scatter. |
| AnimateReactNative onboarding: https://www.animatereactnative.com/blog/animated-onboarding-with-react-native-reanimated | Premium onboarding pattern | One flow driver should coordinate preview, text, progress, and CTA state. |
| RNGH gesture composition: https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/gesture-composition | Gesture conflict reference | Future calendar/sheet interactions need explicit simultaneous/exclusive gesture relationships. |
| Gorhom Bottom Sheet docs: https://gorhom.dev/react-native-bottom-sheet/troubleshooting | Production sheet behavior | If sheets are added, use sheet scrollables, provider setup, and route cleanup. |
| Expo UI BottomSheet: https://docs.expo.dev/versions/latest/sdk/ui/drop-in-replacements/bottomsheet/ | Native-feeling sheet option | Prefer native drop-in for simple sheets; keep advanced gesture libraries only when needed. |
| Wix react-native-calendars: https://deepwiki.com/wix/react-native-calendars/1-overview | Calendar UX primitives | Provider-held selected date, density indicators, selected-day agenda, week/month rhythm. |
| RevenueCat Expo demo/docs: https://github.com/RevenueCat/expo-web-billing-demo and https://www.revenuecat.com/docs/getting-started/installation/expo | IAP/paywall separation | Keep entitlement state separate from paywall UI and payment module. |
| Widget Studio: https://widgets.studio/ | Customization studio UX | Live editor first, element/style controls second, premium presets clearly labeled. |
| Quotify widget app: https://github.com/chhedadhruv/Quotify | Widget app/extension boundary | Separate RN UI from native widget data/rendering boundaries. |
| TanStack Query React Native examples: https://tanstack.com/query/v4/docs/framework/react/examples/react-native | Backend state pattern | If a backend is added, model server state with stable keys, validation, invalidation, and local UI state separation. |
| API-first React contract pattern: https://ruixen.com/blog/api-first-ui-react | Contract discipline | Validate at API boundaries and keep mobile/backend schema drift visible. |
| Storybook RN testing: https://storybookjs.github.io/react-native/docs/intro/testing | Component screenshot path | Use stories/deep links for screenshot coverage of complex states. |
| Maestro React Native: https://docs.maestro.dev/platform-support/react-native | Native screenshot regression | Drive simulator flows and compare core screens in CI. |
| Local `frontend-design` skill | Taste bar | Refined Apple-native hierarchy, no generic AI visuals, real working UI only. |
| Local screenshot/frontend testing skills | QA loop | Render screens, inspect screenshots, verify interactions, then report gaps. |
| Local GitNexus skills | Change safety | Query architecture, run impact before edits, and detect affected symbols before commit. |
