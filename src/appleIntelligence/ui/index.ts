// Public surface of the StudyPlanner 2.2 UI kit. See README.md for placement.
export type { AIBaseProps, AIText, AITheme } from "./theme";
export { AI_THEME_DARK, AI_THEME_LIGHT } from "./theme";

export { AIBadge, OriginChip } from "./AIBadge";
export type { AIBadgeProps, OriginChipProps } from "./AIBadge";

export { ForecastHeatmap, HeatmapLegend } from "./ForecastHeatmap";
export type { ForecastHeatmapProps } from "./ForecastHeatmap";

export { ForecastSection, forecastHeadline } from "./ForecastSection";
export type { ForecastSectionMode, ForecastSectionProps } from "./ForecastSection";

export { ForecastShareCard } from "./ForecastShareCard";
export type { ForecastShareCaption, ForecastShareCardProps } from "./ForecastShareCard";

export { captureShareCard, copyToClipboard, shareForecastCard, shareLink } from "./share";
export type { ShareForecastOptions, ShareMethod, ShareOutcome } from "./share";

export { ClassPackSheet, QRCodeView } from "./ClassPackSheet";
export type { ClassPackSheetProps, QRCodeViewProps } from "./ClassPackSheet";

export { StudyNowCard, studyNowCountdown } from "./StudyNowCard";
export type { StudyNowCardProps } from "./StudyNowCard";

export { ExamModeScreen } from "./ExamModeScreen";
export type { ExamModeScreenProps, ExamModeSummary } from "./ExamModeScreen";

export { PracticeSession, SourceQuote } from "./PracticeSession";
export type { PracticeAnswer, PracticeInitialState, PracticeMode, PracticeScore, PracticeSessionProps } from "./PracticeSession";

export { QuickAddConfirmSheet, taskTypeLabel } from "./QuickAddConfirmSheet";
export type { QuickAddClassOption, QuickAddConfirmSheetProps } from "./QuickAddConfirmSheet";

export { ScanProgress } from "./ScanProgress";
export type { ScanProgressProps } from "./ScanProgress";

export { AIStatusRow, aiStatusCopy } from "./AIStatusRow";
export type { AIStatusCopy, AIStatusRowProps } from "./AIStatusRow";

export { DuelIntroCard, PastePackBanner, UnlockForecastCTA } from "./GrowthCards";
export type { DuelIntroCardProps, PastePackBannerProps, UnlockForecastCTAProps } from "./GrowthCards";

export { AIGallery } from "./AIGallery";
export type { AIGalleryProps } from "./AIGallery";

export * as AIFixtures from "./fixtures";
export {
  directionFor,
  formatDuration,
  formatLongDate,
  formatMonthDay,
  formatNumber,
  formatPercent,
  formatWeekdayMonthDay,
  isRTLLocale,
  parseISODate,
  toISODate,
} from "./format";
export { COLORS, forecastCellStyle, HERO, RADII, SHARE_CARD, SPACE } from "./tokens";
