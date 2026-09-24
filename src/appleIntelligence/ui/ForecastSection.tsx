import React, { useCallback, useMemo } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { CalendarClock, Crown, Flame, Lock, QrCode, ScanLine, Share2 } from "lucide-react-native";
import type { CrunchForecast, ForecastStartBy, ForecastWeek } from "../types";
import { ForecastHeatmap } from "./ForecastHeatmap";
import { buildClassLegend, classColor, classLabel, crunchWeeksAhead, isEmptyForecast, sortedStartBy, topCrunchWeeks, type ClassLegend } from "./forecastModel";
import { directionFor, formatDuration, formatMonthDay, formatNumber, isRTLLocale } from "./format";
import { useEntrance } from "./motion";
import { AIButton, AICard, ForwardChevron, HeroCard, IconTile, Kicker, LinkButton, Pill } from "./primitives";
import type { AIBaseProps, AITheme, AIText } from "./theme";
import { COLORS, HERO, RADII, semanticText, SPACE, TYPE } from "./tokens";

export type ForecastSectionMode = "full" | "compact" | "preview";

export type ForecastSectionProps = AIBaseProps & {
  forecast: CrunchForecast | null;
  /** full: Today/ClassDetail. compact: top of Today. preview: ReviewImport / LockedDashboard before purchase. */
  mode?: ForecastSectionMode;
  hideNames?: boolean;
  selectedWeekStart?: string | null;
  onSelectWeek?: (week: ForecastWeek) => void;
  onShare?: () => void;
  onClassPack?: () => void;
  /** preview only: "Unlock to turn this into a daily plan". */
  onUnlock?: () => void;
  /** compact: open the full forecast. */
  onOpen?: () => void;
  onStartBy?: (entry: ForecastStartBy) => void;
  /** Empty state CTA. */
  onImport?: () => void;
};

const COMPACT_CELL = 30;
const START_BY_LIMIT: Record<ForecastSectionMode, number> = { full: 4, compact: 1, preview: 1 };

export function forecastHeadline(t: AIText, locale: string, forecast: CrunchForecast) {
  const ahead = crunchWeeksAhead(forecast).length;
  if (ahead === 0) return t("ai.forecast.headline_none", "No crunch weeks yet");
  if (ahead === 1) return t("ai.forecast.headline_one", "1 red week ahead");
  return t("ai.forecast.headline_other", "{count} red weeks ahead", { count: formatNumber(locale, ahead) });
}

export function deadlinesPhrase(t: AIText, locale: string, count: number) {
  return count === 1 ? t("ai.count.deadlines_one", "1 deadline") : t("ai.count.deadlines_other", "{count} deadlines", { count: formatNumber(locale, count) });
}

export function classesPhrase(t: AIText, locale: string, count: number) {
  return count === 1 ? t("ai.count.classes_one", "1 class") : t("ai.count.classes_other", "{count} classes", { count: formatNumber(locale, count) });
}

export function ForecastSection({
  forecast,
  mode = "full",
  theme,
  t,
  locale,
  hideNames = false,
  selectedWeekStart,
  onSelectWeek,
  onShare,
  onClassPack,
  onUnlock,
  onOpen,
  onStartBy,
  onImport,
}: ForecastSectionProps) {
  const entrance = useEntrance();
  const rtl = isRTLLocale(locale);
  const legend = useMemo(() => (forecast ? buildClassLegend(forecast, locale, t) : null), [forecast, locale, t]);
  const startBy = useMemo(() => (forecast ? sortedStartBy(forecast) : []), [forecast]);
  const compactSelect = useCallback(
    (week: ForecastWeek) => {
      onSelectWeek?.(week);
      onOpen?.();
    },
    [onOpen, onSelectWeek],
  );

  if (!forecast || !legend || isEmptyForecast(forecast)) {
    return (
      <Animated.View style={[{ direction: directionFor(locale) }, entrance]}>
        <AICard theme={theme} style={{ gap: SPACE.md }}>
          <SectionKicker theme={theme} t={t} />
          <Text selectable accessibilityRole="header" style={{ color: theme.label, fontSize: TYPE.title3, lineHeight: 27, fontWeight: "900" }}>
            {t("ai.forecast.empty_title", "Your forecast is waiting")}
          </Text>
          <Text selectable style={{ color: theme.label2, lineHeight: 21 }}>{t("ai.forecast.empty_body", "Import a syllabus to see every crunch week this term, months early.")}</Text>
          {onImport ? <AIButton label={t("ai.forecast.empty_cta", "Scan a syllabus")} icon={ScanLine} theme={theme} onPress={onImport} /> : null}
        </AICard>
      </Animated.View>
    );
  }

  const top = topCrunchWeeks(forecast, 1)[0];
  const limit = START_BY_LIMIT[mode];
  const shownStartBy = startBy.slice(0, limit);
  const hiddenStartBy = startBy.length - shownStartBy.length;
  const summary = [
    deadlinesPhrase(t, locale, forecast.totals.items),
    classesPhrase(t, locale, forecast.totals.classes),
    t("ai.forecast.range", "{start} – {end}", { start: formatMonthDay(locale, forecast.termStart), end: formatMonthDay(locale, forecast.termEnd) }),
  ].join(" · ");

  return (
    <Animated.View style={[{ direction: directionFor(locale) }, entrance]}>
      <AICard theme={theme} style={{ gap: SPACE.lg }}>
        <View style={{ gap: SPACE.xs + 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACE.sm }}>
            <SectionKicker theme={theme} t={t} />
            {forecast.fromPreview ? <Pill text={t("ai.forecast.preview_pill", "Preview")} color={theme.label2} theme={theme} /> : null}
          </View>
          <Text selectable accessibilityRole="header" style={{ color: theme.label, fontSize: mode === "compact" ? TYPE.title3 : TYPE.title2, lineHeight: mode === "compact" ? 27 : 30, fontWeight: "900" }}>
            {forecastHeadline(t, locale, forecast)}
          </Text>
          <Text selectable style={{ color: theme.label2, fontSize: TYPE.footnote + 1, fontWeight: "700", lineHeight: 19 }}>{summary}</Text>
          {top && mode !== "compact" ? (
            <Text selectable style={{ color: semanticText(COLORS.red, theme), fontSize: TYPE.footnote + 1, fontWeight: "900" }}>
              {t("ai.forecast.toughest", "Toughest: week of {date}", { date: formatMonthDay(locale, top.weekStart) })}
            </Text>
          ) : null}
        </View>

        <ForecastHeatmap
          forecast={forecast}
          theme={theme}
          t={t}
          locale={locale}
          hideNames={hideNames}
          selectedWeekStart={mode === "compact" && selectedWeekStart === undefined ? null : selectedWeekStart}
          onSelectWeek={mode === "compact" ? compactSelect : onSelectWeek}
          showItems={mode !== "compact"}
          showLegend={mode !== "compact"}
          maxCellSize={mode === "compact" ? COMPACT_CELL : undefined}
          interactive={mode !== "compact" || Boolean(onOpen || onSelectWeek)}
          maxItems={mode === "full" ? 6 : 4}
        />

        {shownStartBy.length ? (
          <View style={{ gap: SPACE.sm }}>
            <Text selectable accessibilityRole="header" style={{ color: theme.label, fontSize: TYPE.headline - 1, fontWeight: "900" }}>{t("ai.startby.title", "Start by")}</Text>
            <View style={{ borderRadius: RADII.tile + 2, borderWidth: 1, borderColor: theme.hairline, overflow: "hidden" }}>
              {shownStartBy.map((entry, index) => (
                <StartByRow
                  key={`${entry.classId || entry.classCode || "class"}-${entry.startDate}-${entry.weekStart}`}
                  entry={entry}
                  legend={legend}
                  hideNames={hideNames}
                  today={forecast.generatedFor}
                  theme={theme}
                  t={t}
                  locale={locale}
                  rtl={rtl}
                  first={index === 0}
                  onPress={onStartBy ? () => onStartBy(entry) : undefined}
                />
              ))}
              {mode === "preview" && hiddenStartBy > 0 ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.sm, padding: SPACE.md + 1, borderTopWidth: 1, borderTopColor: theme.hairline, backgroundColor: theme.surface2 }}>
                  <Lock color={theme.label3} size={15} />
                  <Text selectable style={{ color: theme.label2, flex: 1, fontWeight: "800" }}>
                    {hiddenStartBy === 1
                      ? t("ai.startby.more_locked_one", "1 more start date in your plan")
                      : t("ai.startby.more_locked_other", "{count} more start dates in your plan", { count: formatNumber(locale, hiddenStartBy) })}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {mode === "preview" ? (
          <HeroCard theme={theme} tone="ink" style={{ padding: SPACE.lg + 2, gap: SPACE.md, borderRadius: RADII.panel }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.md }}>
              <IconTile icon={Crown} color="#FFFFFF" onHero />
              <View style={{ flex: 1 }}>
                <Text selectable style={{ color: HERO.onHero, fontSize: TYPE.callout + 1, lineHeight: 22, fontWeight: "900" }}>{t("ai.forecast.unlock_title", "Unlock to turn this into a daily plan")}</Text>
                <Text selectable style={{ color: HERO.onHero2, lineHeight: 19, marginTop: 3 }}>{t("ai.forecast.unlock_body", "Start dates, Study Now and reminders that beat every red week.")}</Text>
              </View>
            </View>
            <AIButton label={t("ai.forecast.unlock_cta", "Unlock my plan")} theme={theme} variant="onHero" icon={Crown} onPress={onUnlock} />
          </HeroCard>
        ) : null}

        {onShare || onClassPack || (mode === "compact" && onOpen) ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm, alignItems: "center" }}>
            {onShare ? <AIButton compact variant="secondary" label={t("ai.forecast.share", "Share card")} icon={Share2} theme={theme} onPress={onShare} accessibilityHint={t("ai.forecast.share_hint", "Creates an image of your forecast. Class names are hidden by default.")} /> : null}
            {onClassPack ? <AIButton compact variant="secondary" label={t("ai.forecast.class_pack", "Class Pack")} icon={QrCode} theme={theme} onPress={onClassPack} accessibilityHint={t("ai.forecast.class_pack_hint", "Share a class's dates with classmates")} /> : null}
            {mode === "compact" && onOpen ? (
              <View style={{ marginStart: "auto" }}>
                <LinkButton label={t("ai.forecast.open", "See forecast")} color={theme.label} onPress={onOpen} />
              </View>
            ) : null}
          </View>
        ) : null}
      </AICard>
    </Animated.View>
  );
}

function SectionKicker({ theme, t }: { theme: AITheme; t: AIText }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Flame color={semanticText(COLORS.red, theme)} size={14} strokeWidth={2.6} />
      <Kicker text={t("ai.forecast.kicker", "CRUNCH FORECAST")} theme={theme} />
    </View>
  );
}

function StartByRow({
  entry,
  legend,
  hideNames,
  today,
  theme,
  t,
  locale,
  rtl,
  first,
  onPress,
}: {
  entry: ForecastStartBy;
  legend: ClassLegend;
  hideNames: boolean;
  today: string;
  theme: AITheme;
  t: AIText;
  locale: string;
  rtl: boolean;
  first: boolean;
  onPress?: () => void;
}) {
  const cls = entry.classId || entry.classCode ? classLabel(legend, entry, hideNames, t) : "";
  const startsNow = entry.startDate <= today;
  const line = cls
    ? startsNow
      ? t("ai.startby.row_today", "Start {class} today", { class: cls })
      : t("ai.startby.row", "Start {class} on {date}", { class: cls, date: formatMonthDay(locale, entry.startDate) })
    : startsNow
      ? t("ai.startby.row_today_noclass", "Start prep today")
      : t("ai.startby.row_noclass", "Start prep on {date}", { date: formatMonthDay(locale, entry.startDate) });
  const meta = [
    t("ai.startby.prep", "{duration} prep", { duration: formatDuration(t, locale, entry.prepMinutes) }),
    t("ai.startby.before_week", "before the week of {date}", { date: formatMonthDay(locale, entry.weekStart) }),
  ].join(" · ");
  const body = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.md, padding: SPACE.md + 1, borderTopWidth: first ? 0 : 1, borderTopColor: theme.hairline }}>
      <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface2 }}>
        <CalendarClock color={classColor(legend, entry, theme.label2)} size={18} strokeWidth={2.4} />
      </View>
      <View style={{ flex: 1 }}>
        <Text selectable style={{ color: theme.label, fontSize: TYPE.body, fontWeight: "900" }}>{line}</Text>
        <Text selectable style={{ color: theme.label2, fontSize: TYPE.footnote, fontWeight: "700", marginTop: 2 }}>{meta}</Text>
      </View>
      {onPress ? <ForwardChevron rtl={rtl} color={theme.label3} size={17} /> : null}
    </View>
  );
  if (!onPress) return <View accessible accessibilityLabel={`${line}. ${meta}`}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${line}. ${meta}`} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, backgroundColor: theme.surface })}>
      {body}
    </Pressable>
  );
}
