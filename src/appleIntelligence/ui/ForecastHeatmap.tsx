import React, { useCallback, useMemo, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { FileText, GraduationCap } from "lucide-react-native";
import type { CrunchForecast, ForecastColor, ForecastWeek } from "../types";
import {
  buildClassLegend,
  classColor,
  classLabel,
  countsPhrase,
  defaultSelectedWeek,
  levelLabel,
  monthRows,
  sortItems,
  weekCounts,
  type ClassLegend,
} from "./forecastModel";
import { directionFor, formatDayNumber, formatMonthDay, formatNumber, formatPercent, formatWeekdayMonthDay } from "./format";
import { useReduceMotion, useStagger } from "./motion";
import { ClassChip, IconTile, Pill } from "./primitives";
import type { AIBaseProps, AITheme } from "./theme";
import { COLORS, forecastAccent, forecastCellStyle, HERO, RADII, SPACE, TYPE, type ForecastSurface } from "./tokens";

const LEVELS: ForecastColor[] = ["calm", "steady", "busy", "crunch"];
const MIN_COLUMNS = 4;
const MONTH_LABEL_WIDTH = 50;
const CELL_GAP = 6;
const SELECT_RING = 2;

export type ForecastHeatmapProps = AIBaseProps & {
  forecast: CrunchForecast;
  /** Controlled selection. Omit to let the heatmap manage it (defaults to the next crunch week). */
  selectedWeekStart?: string | null;
  onSelectWeek?: (week: ForecastWeek) => void;
  /** Show the selected week's items under the grid (default true). */
  showItems?: boolean;
  /** Replace class codes with "Class 1/2/3". */
  hideNames?: boolean;
  /** "hero" renders for dark hero/share cards. */
  surface?: ForecastSurface;
  showLegend?: boolean;
  /** Upper bound for a cell's edge; cells shrink to fit narrower containers. */
  maxCellSize?: number;
  /** Items listed for the selected week before "+N more". */
  maxItems?: number;
  /** Staggered entrance (default true). Share cards pass false so captures are static. */
  animate?: boolean;
  /** Disable taps (share card / previews). */
  interactive?: boolean;
  /** Dynamic Type scaling for labels (default true). The fixed-size share card passes false. */
  allowFontScaling?: boolean;
};

export function ForecastHeatmap({
  forecast,
  theme,
  t,
  locale,
  selectedWeekStart,
  onSelectWeek,
  showItems = true,
  hideNames = false,
  surface = "card",
  showLegend = true,
  maxCellSize = 40,
  maxItems = 6,
  animate = true,
  interactive = true,
  allowFontScaling = true,
}: ForecastHeatmapProps) {
  const [internalSelected, setInternalSelected] = useState<string | null>(() => defaultSelectedWeek(forecast));
  const selected = selectedWeekStart !== undefined ? selectedWeekStart : internalSelected;
  const rows = useMemo(() => monthRows(forecast, locale), [forecast, locale]);
  const legend = useMemo(() => buildClassLegend(forecast, locale, t), [forecast, locale, t]);
  const columns = useMemo(() => Math.max(MIN_COLUMNS, ...rows.map((row) => row.weeks.length)), [rows]);
  const reduce = useReduceMotion();
  const progress = useStagger(`${forecast.generatedFor}:${forecast.weeks.length}`);
  const staticProgress = useMemo(() => new Animated.Value(1), []);
  const driver = animate && !reduce ? progress : staticProgress;
  const onHero = surface === "hero";

  const handleSelect = useCallback(
    (week: ForecastWeek) => {
      if (selectedWeekStart === undefined) setInternalSelected(week.weekStart);
      onSelectWeek?.(week);
    },
    [onSelectWeek, selectedWeekStart],
  );

  const selectedWeek = useMemo(() => forecast.weeks.find((week) => week.weekStart === selected) || null, [forecast.weeks, selected]);
  const total = forecast.weeks.length || 1;

  return (
    <View style={{ direction: directionFor(locale), gap: SPACE.md }}>
      <View style={{ gap: CELL_GAP }}>
        {rows.map((row) => (
          <View key={row.key} style={{ flexDirection: "row", alignItems: "center", gap: CELL_GAP }}>
            <Text
              allowFontScaling={allowFontScaling}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={{ width: MONTH_LABEL_WIDTH, color: onHero ? HERO.onHero3 : theme.label2, fontSize: TYPE.caption, fontWeight: "900" }}
            >
              {row.label}
            </Text>
            <View style={{ flex: 1, flexDirection: "row", gap: CELL_GAP }}>
              {Array.from({ length: columns }, (_, slot) => {
                const week = row.weeks[slot];
                if (!week) return <View key={`${row.key}-empty-${slot}`} style={{ flex: 1, maxWidth: maxCellSize }} />;
                return (
                  <HeatCell
                    key={week.weekStart}
                    week={week}
                    theme={theme}
                    t={t}
                    locale={locale}
                    surface={surface}
                    selected={week.weekStart === selected}
                    interactive={interactive}
                    maxCellSize={maxCellSize}
                    progress={driver}
                    order={week.weekIndex}
                    total={total}
                    onSelect={handleSelect}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </View>
      {showLegend ? <HeatmapLegend theme={theme} t={t} surface={surface} allowFontScaling={allowFontScaling} /> : null}
      {showItems && selectedWeek ? (
        <WeekItems week={selectedWeek} legend={legend} hideNames={hideNames} theme={theme} t={t} locale={locale} maxItems={maxItems} />
      ) : null}
    </View>
  );
}

type HeatCellProps = {
  week: ForecastWeek;
  theme: AITheme;
  t: AIBaseProps["t"];
  locale: string;
  surface: ForecastSurface;
  selected: boolean;
  interactive: boolean;
  maxCellSize: number;
  progress: Animated.Value;
  order: number;
  total: number;
  onSelect: (week: ForecastWeek) => void;
};

const HeatCell = React.memo(function HeatCell({ week, theme, t, locale, surface, selected, interactive, maxCellSize, progress, order, total, onSelect }: HeatCellProps) {
  const onHero = surface === "hero";
  const colors = forecastCellStyle(week.color, theme, surface);
  const counts = weekCounts(week);
  const a11yLabel = t("ai.heatmap.cell_a11y", "Week of {date}, {level}, {items}", {
    date: formatMonthDay(locale, week.weekStart),
    level: levelLabel(t, week.color),
    items: countsPhrase(t, locale, counts),
  });
  const start = (order / total) * 0.6;
  const opacity = progress.interpolate({ inputRange: [start, start + 0.4], outputRange: [0, 1], extrapolate: "clamp" });
  const scale = progress.interpolate({ inputRange: [start, start + 0.4], outputRange: [0.82, 1], extrapolate: "clamp" });
  const currentOutline = onHero ? "#FFFFFF" : theme.label;
  const selectRing = onHero ? HERO.lavender : theme.accent;

  const face = (
    <View
      style={{
        flex: 1,
        borderRadius: RADII.cell,
        backgroundColor: colors.background,
        borderWidth: week.isCurrent ? 2 : colors.ring ? 1.5 : 0,
        borderStyle: week.isCurrent ? "dashed" : "solid",
        borderColor: week.isCurrent ? currentOutline : colors.ring || "transparent",
        boxShadow: colors.glow,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text allowFontScaling={false} importantForAccessibility="no" style={{ color: colors.foreground, fontSize: TYPE.micro, fontWeight: "900" }}>
        {formatDayNumber(locale, week.weekStart)}
      </Text>
      {counts.exams > 0 ? (
        <View style={{ position: "absolute", bottom: 4, width: 4, height: 4, borderRadius: RADII.pill, backgroundColor: colors.foreground }} />
      ) : null}
    </View>
  );

  // Interactive cells reserve space for the selection ring so selecting never shifts the grid.
  const ringStyle = interactive
    ? { flex: 1, padding: SELECT_RING, borderRadius: RADII.cell + SELECT_RING * 2, borderWidth: SELECT_RING, borderColor: selected ? selectRing : "transparent" }
    : { flex: 1, padding: 1 };

  return (
    <Animated.View style={{ flex: 1, maxWidth: maxCellSize, aspectRatio: 1, opacity, transform: [{ scale }] }}>
      {interactive ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
          accessibilityHint={t("ai.heatmap.cell_hint", "Shows this week's deadlines")}
          accessibilityState={{ selected }}
          hitSlop={3}
          onPress={() => onSelect(week)}
          style={({ pressed }) => [ringStyle, { opacity: pressed ? 0.75 : 1 }]}
        >
          {face}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={a11yLabel} style={ringStyle}>
          {face}
        </View>
      )}
    </Animated.View>
  );
});

export function HeatmapLegend({ theme, t, surface = "card", allowFontScaling = true }: { theme: AITheme; t: AIBaseProps["t"]; surface?: ForecastSurface; allowFontScaling?: boolean }) {
  const onHero = surface === "hero";
  return (
    <View accessible accessibilityLabel={t("ai.heatmap.legend_a11y", "Color scale from calm to crunch. The dashed square is this week.")} style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: SPACE.md, rowGap: SPACE.xs }}>
      {LEVELS.map((level) => {
        const colors = forecastCellStyle(level, theme, surface);
        return (
          <View key={level} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 11, height: 11, borderRadius: 3, backgroundColor: colors.background, borderWidth: colors.ring ? 1 : 0, borderColor: colors.ring || "transparent" }} />
            <Text allowFontScaling={allowFontScaling} style={{ color: onHero ? HERO.onHero3 : theme.label2, fontSize: TYPE.micro, fontWeight: "800" }}>{levelLabel(t, level)}</Text>
          </View>
        );
      })}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <View style={{ width: 11, height: 11, borderRadius: 3, borderWidth: 1.5, borderStyle: "dashed", borderColor: onHero ? "#FFFFFF" : theme.label }} />
        <Text allowFontScaling={allowFontScaling} style={{ color: onHero ? HERO.onHero3 : theme.label2, fontSize: TYPE.micro, fontWeight: "800" }}>{t("ai.heatmap.this_week", "this week")}</Text>
      </View>
    </View>
  );
}

function WeekItems({ week, legend, hideNames, theme, t, locale, maxItems }: { week: ForecastWeek; legend: ClassLegend; hideNames: boolean; theme: AITheme; t: AIBaseProps["t"]; locale: string; maxItems: number }) {
  const items = useMemo(() => sortItems(week.items), [week.items]);
  const shown = items.slice(0, maxItems);
  const counts = weekCounts(week);
  return (
    <View accessibilityLiveRegion="polite" style={{ borderRadius: RADII.tile + 2, backgroundColor: theme.surface2, padding: SPACE.md + 2, gap: SPACE.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACE.sm, flexWrap: "wrap" }}>
        <View style={{ flexShrink: 1 }}>
          <Text selectable accessibilityRole="header" style={{ color: theme.label, fontSize: TYPE.callout, fontWeight: "900" }}>
            {t("ai.heatmap.week_of", "Week of {date}", { date: formatMonthDay(locale, week.weekStart) })}
          </Text>
          <Text selectable style={{ color: theme.label2, fontSize: TYPE.footnote, fontWeight: "700", marginTop: 2 }}>{countsPhrase(t, locale, counts)}</Text>
        </View>
        <Pill text={levelLabel(t, week.color)} color={forecastAccent(week.color, theme)} theme={theme} />
      </View>
      {shown.length === 0 ? (
        <Text selectable style={{ color: theme.label2, lineHeight: 20 }}>{t("ai.heatmap.empty_week", "Nothing due this week. A good week to get ahead.")}</Text>
      ) : (
        shown.map((item, index) => {
          const cls = classLabel(legend, item, hideNames, t);
          const dateLabel = formatWeekdayMonthDay(locale, item.dueDate);
          const kindLabel = item.kind === "exam" ? t("ai.kind.exam", "Exam") : t("ai.kind.task", "Assignment");
          const weightLabel = typeof item.weight === "number" ? formatPercent(locale, item.weight) : "";
          return (
            <View
              key={item.id}
              accessible
              accessibilityLabel={[kindLabel, item.title, cls, dateLabel, weightLabel ? t("ai.heatmap.weight_a11y", "{weight} of grade", { weight: weightLabel }) : ""].filter(Boolean).join(", ")}
              style={{ flexDirection: "row", alignItems: "center", gap: SPACE.md, paddingTop: index === 0 ? SPACE.xs : SPACE.sm, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: theme.hairline }}
            >
              <IconTile icon={item.kind === "exam" ? GraduationCap : FileText} color={item.kind === "exam" ? COLORS.purple : COLORS.blue} size={36} />
              <View style={{ flex: 1, gap: 5 }}>
                <Text selectable numberOfLines={2} style={{ color: theme.label, fontSize: TYPE.body, fontWeight: "900" }}>{item.title}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.sm, flexWrap: "wrap" }}>
                  <ClassChip label={cls} color={classColor(legend, item, theme.label3)} theme={theme} />
                  <Text selectable style={{ color: theme.label2, fontSize: TYPE.footnote, fontWeight: "800" }}>{dateLabel}</Text>
                </View>
              </View>
              {weightLabel ? <Text selectable style={{ color: theme.label, fontSize: TYPE.body, fontWeight: "900" }}>{weightLabel}</Text> : null}
            </View>
          );
        })
      )}
      {items.length > shown.length ? (
        <Text selectable style={{ color: theme.label2, fontSize: TYPE.footnote, fontWeight: "800" }}>
          {t("ai.heatmap.more", "+{count} more", { count: formatNumber(locale, items.length - shown.length) })}
        </Text>
      ) : null}
    </View>
  );
}
