# StudyPlanner: Syllabus AI Legacy UI Audit

Baseline: `7ef63b6ec0c11631b6d56bbf478464b9549e81e7`

GitNexus impact note: `AppLogo`, `AppButton`, and `EmptyState` are shared visual symbols. `AppLogo` and `AppButton` reported CRITICAL blast radius because they feed app shell, onboarding, paywall, loading, focus, notes, import, grades, and detail screens. Changes were kept visual-only.

| Item | Path | Where visible | Decision | Replacement plan |
| --- | --- | --- | --- | --- |
| Legacy dark illustrated app icon with bubbles and colored checklist | `assets/app/study-planner-icon.png` | iOS app icon, splash, Expo icon references, prior in-app logo image | Replace | Replaced with minimal white-first StudyPlanner page/check mark; added SVG source at `assets/app/studyplanner-syllabus-ai-icon.svg`. |
| Generated native iOS icon/splash images | `ios/StudyPlannerSyllabusAI/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png`, `ios/StudyPlannerSyllabusAI/Images.xcassets/SplashScreenLegacy.imageset/*` | Installed simulator app icon and launch screen | Replace | Regenerated the local ignored native app icon and launch images from the new StudyPlanner page/check mark on a white-first background for simulator QA. |
| In-app logo used raster icon asset | `src/components/AppleComponents.tsx` | App shell, loading, onboarding, paywall, premium gate | Replace | Added `AppMark` vector component; `AppLogo` now composes the new mark with StudyPlanner / Syllabus AI wordmark. |
| Icon-style empty states | `src/components/AppleComponents.tsx` | Notes empty state and any shared `EmptyState` surface | Replace | Empty states now use the app mark instead of generic lucide/legacy accent badges. |
| Gradient/sheen primary buttons | `src/components/AppButton.tsx` | App-wide CTAs and secondary actions | Replace | Primary buttons now use a quiet Apple black/white treatment with no glossy gradient sheen. |
| Dark onboarding hero with per-slide icon badge | `src/screens/OnboardingScreen.tsx` | First-run onboarding | Replace | Rebuilt hero as white-first Liquid Glass card with restrained brand mark lockup and preview chips. |
| “Sample” onboarding preview badges | `src/screens/OnboardingScreen.tsx`, `localized-app-strings/core-launch-strings.json` | Onboarding preview cards | Replace | Changed English visible badge copy to “Preview” to avoid demo/placeholder feel. |
| Dark/glow scan hero | `src/screens/ImportScreen.tsx` | Scan / Import source picker and empty scan flow | Replace | Removed purple/pink glows; converted scan hero, source picker, and capture buttons to white-first Apple-native surfaces. |
| Dark paywall hero and old logo surface | `src/screens/UpgradeScreen.tsx` | Paywall / locked app | Replace | Paywall now uses `AppMark`, white-first hero copy, and black/white premium controls with colorful value cards below. |
| Empty Today two-primary-action clutter | `src/screens/TodayScreen.tsx` | Empty Today | Replace | Added the app mark and reduced the main empty state to a single primary “Scan syllabus” action. |
| Generic Widget Studio top identity | `src/screens/MoreScreen.tsx` | Widget Studio / More | Replace | Top card now leads with `StudyPlanner: Syllabus AI`, app mark, and explicit Widget Studio badge. |
| Purple activity card in Forecast | `src/screens/PlanScreen.tsx` | Forecast | Replace | Switched the activity card to teal so the surface reads as Apple Sports color, not legacy purple branding. |
| Purple timeline dot | `src/screens/CoursesScreen.tsx` | Classes timeline | Replace | Replaced purple timeline color with green in the mini timeline rotation. |
| Dark Focus cockpit glows | `src/screens/FocusScreen.tsx` | Focus | Replace | Converted Focus stage to white-first card with black controls and calm green progress. |
| Notes hero purple glow/dark text stack | `src/screens/NotesScreen.tsx` | Notes | Replace | Converted Notes hero to white-first Liquid Glass, hid purple glow, and normalized text/icon colors. |
| Assignment detail dark hero and “school operating system” drift | `src/screens/AssignmentDetailScreen.tsx`, `localized-app-strings/core-launch-strings.json` | Assignment detail | Replace | Converted detail hero/trust cards to white-first surfaces and renamed drift copy to “active StudyPlanner flow.” |
| Visible “student” brand drift in launch strings | `App.tsx`, `localized-app-strings/core-launch-strings.json`, `src/logic/studentLifeDepth.ts` | Tablet system header and depth copy | Replace | Reworded visible English strings to avoid Student / Student Life OS phrasing while preserving behavior. |
| Purple-heavy token names and optional widget gradient values | `src/theme.ts`, `src/components/StudyPlannerAppleBoard.tsx`, `src/widgets/widgetThemes.ts` | Theme internals and optional customization choices | Keep | Kept because they are typed theme/color options, not the product identity. Main surfaces no longer lead with purple. |
| Historical marketing/App Store screenshots and Figma artifacts | `AppStore/**`, `marketing_exports/**`, `artifacts/syllabus-ai-figma-pack/**`, `artifacts/figma-approval-review/**` | Archival files, not runtime app UI | Keep | Left as archive/reference material. New proof screenshots live under `artifacts/brand-refresh/`. |

Native icon pipeline status: Expo points all iOS/splash/adaptive icon references at `assets/app/study-planner-icon.png`; that source PNG is updated and committed. The generated `ios/` directory is repo-ignored, so its local asset catalog icon and launch images were refreshed for the simulator build but remain generated output. No font files were added or exposed.
