# StudyPlanner 2.2 UI kit (`src/appleIntelligence/ui`)

Self-contained components for the on-device intelligence release. They never
mutate data: every action is a callback. App.tsx imports from `./src/appleIntelligence/ui`.

## Shared contract

Every component takes `AIBaseProps`:

| Prop | Type | Notes |
|---|---|---|
| `theme` | `AITheme` | Same shape as App.tsx `ReturnType<typeof palette>`. Pass the app `theme` straight through. |
| `t` | `AIText` = `(key, fallback, vars?) => string` | Same signature as App.tsx `textFor`. Keys are `ai.*`, listed with English source in `../copy.ts` (`AI_COPY_EN`, 233 keys). `createAIText(locale)` is a reference implementation. |
| `locale` | `string` | Drives `Intl` dates/numbers and layout direction. `ar` renders RTL. |

RTL: each component root sets `direction` from `locale` (Yoga and CSS both
honor it), uses `start`/`end` styles, and mirrors chevrons. This works whether
or not `I18nManager` is RTL. On web, do not also set `dir="rtl"` on the root.

Dynamic Type: text containers have no fixed heights; controls are at least 44pt.
The share card is the one exception: it is a fixed 360×640 image, so its text
sets `allowFontScaling={false}`.

Motion: fade-and-rise entrances, a staggered heatmap reveal, a card flip, and
eased bars and rings. All of it respects Reduce Motion (a crossfade replaces the flip).
Haptics are left to the caller.

AI disclosure: `AIBadge` (sparkles + "On-device") appears only on generated
content (`origin: "onDevice"`). The forecast is deterministic, so it never shows the badge.

## Components and placement

| Component | Key props | Place it in |
|---|---|---|
| `StudyNowCard` | `brief: DailyBrief`, `variant?: "full" \| "compact"`, `onStart`, `onReschedule?` | **Today, top.** `compact` mirrors the widget/Lock Screen line. |
| `ForecastSection` | `forecast: CrunchForecast \| null`, `mode?: "full" \| "compact" \| "preview"`, `hideNames?`, `selectedWeekStart?`, `onSelectWeek?`, `onShare?`, `onClassPack?`, `onUnlock?`, `onOpen?`, `onStartBy?`, `onImport?` | **Today** under StudyNowCard (`compact`, `onOpen` → full view). **ClassDetail** (`full`). **ReviewImport** (`preview`, `onUnlock`). |
| `ForecastHeatmap` | `forecast`, `selectedWeekStart?`, `onSelectWeek?`, `showItems?`, `hideNames?`, `surface?: "card" \| "hero"`, `showLegend?`, `maxCellSize?`, `maxItems?`, `animate?`, `interactive?`, `allowFontScaling?` | Used by ForecastSection and the share card. Use it directly for a full-screen forecast. |
| `ForecastShareCard` (forwardRef `View`) | `forecast`, `hideNames?` (default **true**), `caption?: "default" \| "cry"`, `linkText?` | Mount it off-screen (e.g. `position:absolute; start:-10000`) and pass its ref to `shareForecastCard`. |
| `shareForecastCard(ref, { message, url?, dialogTitle?, pixelRatio? })` | → `Promise<ShareOutcome>` | Captures a 1080×1920 PNG and opens `expo-sharing`. Falls back to `Share.share` with the text and link (on web, when capture fails, or when sharing is unavailable). |
| `shareLink(message, url?)`, `copyToClipboard(text)`, `captureShareCard(ref)` | helpers | |
| `ClassPackSheet` | `className`, `classCode?`, `itemCount`, `link`, `matrix: boolean[][] \| null`, `onShareLink?`, `onCopied?`, `onDone` | Modal/sheet body opened from ForecastSection "Class Pack" or ClassDetail. It copies and shares by itself unless you override. |
| `QRCodeView` | `matrix`, `size?`, `quietZone?` (4) | Black on white in both themes, snapped to whole points per module. |
| `OriginChip` | `origin: ImportOrigin \| undefined`, `showHeuristic?` | **ReviewImport** rows, next to the confidence label. |
| `AIBadge` | `tone?: "default" \| "onHero"`, `size?` | Any generated surface. |
| `ExamModeScreen` | `summary: ExamModeSummary`, `onPracticeCards`, `onPracticeQuiz`, `onDuel?`, `onProposeBlocks?`, `onAddNotes`, `onTopic?`, `scrollable?` | New `examMode` route, entered from **AssessmentDetail / ClassDetail**. `summary` is plain data (no AppData). Weak topics unlock at 20 answers. |
| `PracticeSession` | `mode: "cards" \| "quiz"`, `cards?`, `questions?`, `title?`, `origin?`, `onAnswer`, `onFinish?`, `onShareScore?`, `onReportWrong?`, `onClose?`, `initialState?` | New `practice` route, entered from **NoteDetail** ("Practice") and from Exam Mode. `onAnswer` → record a `PracticeResult`. |
| `QuickAddConfirmSheet` | `proposal: TaskProposal`, `classes: QuickAddClassOption[]`, `today`, `onConfirm(proposal)`, `onCancel` | Quick capture fallback and Siri inbox drain. `onConfirm` returns the edited proposal with `needs: []`. Re-validate before `mutate()`. |
| `ScanProgress` | `page`, `pageCount`, `found`, `documentReader?`, `onDevice?`, `done?`, `onCancel?` | Scan / CameraScanner / PasteImport while `analyzeSyllabusSmart` runs. |
| `AIStatusRow` | `availability: AIAvailability`, `enabled`, `onToggle`, `onClear`, `clearing?` | **Profile.** The parent confirms before clearing. `aiStatusCopy()` exposes the same honest copy for other surfaces. |
| `PastePackBanner` | `onPaste`, `onDismiss?` | First launch / Onboarding / empty Today. |
| `DuelIntroCard` | `senderName?`, `title`, `questionCount`, `targetScore?`, `onStart` | Header of a received Quiz Duel (free to play). |
| `UnlockForecastCTA` | `forecast`, `onPress?` | **LockedDashboard and top of the Paywall** when a pending import exists. |
| `AIGallery` | `only?` (filter by section label) | QA only. Renders every component in every state from `fixtures.ts`. |

## Files

`theme.ts` (types, light/dark palettes) · `tokens.ts` (radii, spacing, type,
hero colors, forecast scale, contrast-safe text colors) · `format.ts` (Intl
helpers, ISO date math at local noon, RTL detection) · `motion.ts` · `primitives.tsx`
(private Card/Button/Pill/ProgressBar/ActionRow equivalents) · `forecastModel.ts`
(pure view-model helpers: class aliases/colors, month rows, headline facts) ·
`share.ts` · `fixtures.ts` · one file per component (`GrowthCards.tsx` holds
PastePackBanner, DuelIntroCard and UnlockForecastCTA).

## Notes for translators

- `_one` / `_other` keys are picked in code with `count === 1`. Languages with
  more plural forms (for example `ar`) should phrase `_other` so it reads naturally for all counts.
- `ai.practice.quote` wraps a verbatim note line. Localize the quotation marks («…», 「…」, „…“).
- `ai.status.explainer` and `ai.status.not_enabled_body` name "Apple
  Intelligence". Keep that name in English (trademark rules, MASTER_PLAN §A3).
