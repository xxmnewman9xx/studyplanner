import type {
  WidgetBackground,
  WidgetLayout,
  WidgetPalette,
  WidgetSize,
  WidgetType
} from "../models";

export type WidgetCompressionMode = "standard" | "compact" | "tight" | "fallback";
export type WidgetRowDensity = "calm" | "standard" | "dense";

export type WidgetLayoutPlan = {
  version: 1;
  widgetType: WidgetType;
  size: WidgetSize;
  locale: string;
  availableWidth: number;
  availableHeight: number;
  maxRows: number;
  maxTitleLines: number;
  metadataVisible: boolean;
  ctaVisible: boolean;
  iconVisible: boolean;
  weekRailVisible: boolean;
  progressVisible: boolean;
  footerVisible: boolean;
  fontScale: number;
  compressionMode: WidgetCompressionMode;
  rowDensity: WidgetRowDensity;
  safePadding: number;
  topSafeInset: number;
  bottomSafeInset: number;
  titleMaxChars: number;
  emptyState: boolean;
  overflowState: boolean;
  noCropGuarantee: true;
};

type ResolveWidgetLayoutPlanInput = {
  widgetType: WidgetType;
  size: WidgetSize;
  locale?: string;
  layout?: WidgetLayout;
  background?: WidgetBackground;
  palette?: WidgetPalette;
  availableWidth?: number;
  availableHeight?: number;
  itemCount?: number;
  dataState?: string;
};

export const widgetFrameBySize: Record<WidgetSize, { width: number; height: number }> = {
  small: { width: 158, height: 158 },
  medium: { width: 338, height: 158 },
  large: { width: 338, height: 354 },
  lock_round: { width: 68, height: 68 },
  lock_inline: { width: 220, height: 28 },
  lock_rect: { width: 176, height: 72 }
};

const longLocalePrefixes = ["de", "es", "fr", "hi", "pt", "ar", "he"];
const compactLocalePrefixes = ["ja", "ko", "zh"];
const pseudoLocalePrefixes = ["en-xa", "en-xb", "ar-xb"];

export function resolveWidgetLayoutPlan(input: ResolveWidgetLayoutPlanInput): WidgetLayoutPlan {
  const frame = widgetFrameBySize[input.size] || widgetFrameBySize.medium;
  const locale = input.locale || "en-US";
  const availableWidth = input.availableWidth || frame.width;
  const availableHeight = input.availableHeight || frame.height;
  const itemCount = Math.max(0, input.itemCount || 0);
  const emptyState = itemCount === 0 || input.widgetType === "empty";
  const lockSize = input.size === "lock_round" || input.size === "lock_inline" || input.size === "lock_rect";
  const longLocale = isLongWidgetLocale(locale);
  const compactLocale = isCompactWidgetLocale(locale);
  const pseudoLocale = isPseudoWidgetLocale(locale);
  const localePressure = (longLocale ? 1 : 0) + (pseudoLocale ? 2 : 0);
  const small = input.size === "small";
  const medium = input.size === "medium";
  const large = input.size === "large";
  const week = input.widgetType === "week";
  const progressType = input.widgetType === "focus" || input.widgetType === "streak";
  const density = resolveRowDensity(input.layout, input.size, localePressure);
  const compressionMode = resolveCompressionMode(input.size, localePressure, itemCount, input.widgetType);
  const maxRows = lockSize ? 0 : resolveMaxRows(input.widgetType, input.size, itemCount, localePressure, density);
  const maxTitleLines = lockSize ? 1 : small ? 2 : input.widgetType === "due_next" ? 2 : 1;
  const metadataVisible = !lockSize && !small && compressionMode !== "tight" && !emptyState;
  const progressVisible = !lockSize && !emptyState && (large || (medium && progressType)) && compressionMode !== "tight";
  const weekRailVisible = !lockSize && week && (medium || large) && compressionMode !== "fallback";
  const footerVisible = !lockSize && large;
  const ctaVisible = !lockSize && large && compressionMode === "standard";
  const iconVisible = !lockSize && !medium && !week && !progressType && compressionMode === "standard";
  const fontScale = resolveFontScale(input.size, compressionMode, compactLocale);
  const safePadding = resolveSafePadding(input.size, compressionMode);
  const titleMaxChars = resolveTitleMaxChars(input.widgetType, input.size, compressionMode, localePressure);

  return {
    version: 1,
    widgetType: input.widgetType,
    size: input.size,
    locale,
    availableWidth,
    availableHeight,
    maxRows,
    maxTitleLines,
    metadataVisible,
    ctaVisible,
    iconVisible,
    weekRailVisible,
    progressVisible,
    footerVisible,
    fontScale,
    compressionMode,
    rowDensity: density,
    safePadding,
    topSafeInset: safePadding,
    bottomSafeInset: Math.max(8, safePadding - 2),
    titleMaxChars,
    emptyState,
    overflowState: itemCount > maxRows,
    noCropGuarantee: true
  };
}

export function ellipsizeWidgetText(value: string, maxChars: number) {
  const compact = String(value || "").trim().replace(/\s+/g, " ");
  if (compact.length <= maxChars) return compact;
  if (maxChars <= 1) return compact.slice(0, maxChars);
  return `${compact.slice(0, maxChars - 1).trimEnd()}...`;
}

export function isLongWidgetLocale(locale: string) {
  const normalized = normalizeLocaleForLayout(locale);
  return longLocalePrefixes.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}-`));
}

export function isCompactWidgetLocale(locale: string) {
  const normalized = normalizeLocaleForLayout(locale);
  return compactLocalePrefixes.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}-`));
}

export function isPseudoWidgetLocale(locale: string) {
  const normalized = normalizeLocaleForLayout(locale);
  return pseudoLocalePrefixes.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}-`));
}

function resolveRowDensity(layout: WidgetLayout | undefined, size: WidgetSize, localePressure: number): WidgetRowDensity {
  if (size === "small" || size.startsWith("lock")) return "calm";
  if (layout === "compact" || layout === "timeline" || localePressure > 0) return "dense";
  return "standard";
}

function resolveCompressionMode(
  size: WidgetSize,
  localePressure: number,
  itemCount: number,
  widgetType: WidgetType
): WidgetCompressionMode {
  if (size.startsWith("lock")) return "tight";
  if (size === "small" && (localePressure > 0 || itemCount > 1)) return "tight";
  if (localePressure >= 2) return "tight";
  if (localePressure > 0 || itemCount > 2 || widgetType === "week") return "compact";
  return "standard";
}

function resolveMaxRows(
  widgetType: WidgetType,
  size: WidgetSize,
  itemCount: number,
  localePressure: number,
  density: WidgetRowDensity
) {
  if (size === "small") {
    return ["due_next", "today", "needs_check", "class_focus", "focus"].includes(widgetType) && itemCount > 0 ? 1 : 0;
  }

  if (size === "medium") {
    if (widgetType === "week" || widgetType === "empty" || widgetType === "streak") return 0;
    if (widgetType === "focus") return itemCount > 0 ? 1 : 0;
    if (localePressure >= 2) return Math.min(itemCount, 1);
    return Math.min(itemCount, density === "dense" ? 2 : 2);
  }

  if (size === "large") {
    if (widgetType === "week") return 0;
    if (widgetType === "empty" || widgetType === "streak") return 0;
    return Math.min(itemCount, localePressure > 0 ? 4 : 5);
  }

  return 0;
}

function resolveFontScale(size: WidgetSize, compressionMode: WidgetCompressionMode, compactLocale: boolean) {
  const base = size === "small" ? 0.96 : size === "medium" ? 0.98 : 1;
  const compressionScale =
    compressionMode === "tight" ? 0.9 : compressionMode === "compact" ? 0.94 : compressionMode === "fallback" ? 0.88 : 1;
  const localeScale = compactLocale ? 0.96 : 1;
  return Number((base * compressionScale * localeScale).toFixed(2));
}

function resolveSafePadding(size: WidgetSize, compressionMode: WidgetCompressionMode) {
  if (size.startsWith("lock")) return 4;
  if (size === "small") return compressionMode === "tight" ? 10 : 11;
  if (size === "medium") return compressionMode === "tight" ? 10 : 12;
  return compressionMode === "tight" ? 14 : 16;
}

function resolveTitleMaxChars(
  widgetType: WidgetType,
  size: WidgetSize,
  compressionMode: WidgetCompressionMode,
  localePressure: number
) {
  const base =
    size === "small"
      ? widgetType === "due_next" || widgetType === "focus" || widgetType === "class_focus"
        ? 36
        : 32
      : size === "medium"
        ? 48
        : 64;
  const pressure = compressionMode === "tight" ? 8 : compressionMode === "compact" ? 4 : 0;
  return Math.max(22, base - pressure - localePressure * 4);
}

function normalizeLocaleForLayout(locale: string) {
  return locale.replace("_", "-").toLowerCase();
}
