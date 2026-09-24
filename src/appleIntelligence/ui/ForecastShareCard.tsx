import React, { forwardRef, useMemo } from "react";
import { Image, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import { Flame } from "lucide-react-native";
import type { CrunchForecast } from "../types";
import { ForecastHeatmap } from "./ForecastHeatmap";
import { buildClassLegend, classColor, classLabel, classKeyOf, countsPhrase, crunchWeeksAhead, topCrunchWeeks, weekCounts } from "./forecastModel";
import { classesPhrase, deadlinesPhrase } from "./ForecastSection";
import { directionFor, formatMonthDay, formatNumber } from "./format";
import type { AIBaseProps } from "./theme";
import { COLORS, HERO, RADII, SHARE_CARD, SPACE } from "./tokens";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const APP_ICON = require("../../../assets/icon.png");

const TOP_WEEKS = 3;
const CHIPS_PER_WEEK = 3;
const HEADLINE_RED = "#FF6961";

export type ForecastShareCaption = "default" | "cry";

export type ForecastShareCardProps = AIBaseProps & {
  forecast: CrunchForecast;
  /** Default true: classes print as "Class 1/2/3". */
  hideNames?: boolean;
  /** "cry": "the week I'm going to cry" + the worst week's date. Falls back to default when there is no red week. */
  caption?: ForecastShareCaption;
  /** Printed link (no QR). */
  linkText?: string;
};

/**
 * Fixed 360x640 story card, captured at 3x (1080x1920) by `shareForecastCard`.
 * Always dark, whatever the app theme. Text does not scale with Dynamic Type
 * because the canvas is an image of fixed size.
 */
export const ForecastShareCard = forwardRef<View, ForecastShareCardProps>(function ForecastShareCard(
  { forecast, theme, t, locale, hideNames = true, caption = "default", linkText = SHARE_CARD.defaultLinkText },
  ref,
) {
  const legend = useMemo(() => buildClassLegend(forecast, locale, t), [forecast, locale, t]);
  const topWeeks = useMemo(() => topCrunchWeeks(forecast, TOP_WEEKS), [forecast]);
  const aheadCount = crunchWeeksAhead(forecast).length;
  const redCount = forecast.crunchWeeks.length || forecast.weeks.filter((week) => week.color === "crunch").length;
  const worst = topCrunchWeeks(forecast, 1)[0];
  const cry = caption === "cry" && Boolean(worst);
  const headline = cry
    ? t("ai.share.cry_headline", "the week I'm going to cry")
    : redCount === 0
      ? t("ai.share.headline_none", "No red weeks this term")
      : redCount === 1
        ? t("ai.share.headline_one", "1 red week this term")
        : t("ai.share.headline_other", "{count} red weeks this term", { count: formatNumber(locale, redCount) });
  const facts = [deadlinesPhrase(t, locale, forecast.totals.items), classesPhrase(t, locale, forecast.totals.classes)].join(" · ");
  const accessibilityLabel = [headline, cry && worst ? formatMonthDay(locale, worst.weekStart) : "", facts].filter(Boolean).join(". ");

  return (
    <View
      ref={ref}
      collapsable={false}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ direction: directionFor(locale), width: SHARE_CARD.width, height: SHARE_CARD.height, borderRadius: RADII.hero, overflow: "hidden", backgroundColor: HERO.ink }}
    >
      <Svg width={SHARE_CARD.width} height={SHARE_CARD.height} style={{ position: "absolute", top: 0, start: 0 }}>
        <Defs>
          <LinearGradient id="sp-share-bg" x1="0" y1="0" x2="0.35" y2="1">
            <Stop offset="0" stopColor="#2A1F4A" />
            <Stop offset="0.55" stopColor={HERO.plum} />
            <Stop offset="1" stopColor={HERO.ink} />
          </LinearGradient>
          <RadialGradient id="sp-share-glow" cx="0.85" cy="0.08" rx="0.7" ry="0.4">
            <Stop offset="0" stopColor={HERO.lavender} stopOpacity="0.34" />
            <Stop offset="1" stopColor={HERO.lavender} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="sp-share-heat" cx="0.2" cy="0.55" rx="0.6" ry="0.3">
            <Stop offset="0" stopColor={COLORS.red} stopOpacity="0.16" />
            <Stop offset="1" stopColor={COLORS.red} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={SHARE_CARD.width} height={SHARE_CARD.height} fill="url(#sp-share-bg)" />
        <Rect x="0" y="0" width={SHARE_CARD.width} height={SHARE_CARD.height} fill="url(#sp-share-glow)" />
        <Rect x="0" y="0" width={SHARE_CARD.width} height={SHARE_CARD.height} fill="url(#sp-share-heat)" />
      </Svg>

      <View style={{ flex: 1, padding: SHARE_CARD.padding, gap: SPACE.md + 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, borderRadius: RADII.pill, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: HERO.chip }}>
            <Flame color={HERO.lavenderSoft} size={12} strokeWidth={2.6} />
            <Text allowFontScaling={false} style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 0.7 }}>{t("ai.forecast.kicker", "CRUNCH FORECAST")}</Text>
          </View>
          <Text allowFontScaling={false} style={{ color: HERO.onHero3, fontSize: 12, fontWeight: "800" }}>
            {t("ai.forecast.range", "{start} – {end}", { start: formatMonthDay(locale, forecast.termStart), end: formatMonthDay(locale, forecast.termEnd) })}
          </Text>
        </View>

        <View style={{ gap: 4 }}>
          {cry && worst ? (
            <>
              <Text allowFontScaling={false} style={{ color: HERO.lavenderSoft, fontSize: 15, fontWeight: "800" }}>{t("ai.share.cry_kicker", "my phone found")}</Text>
              <Text allowFontScaling={false} numberOfLines={2} style={{ color: "#FFFFFF", fontSize: 28, lineHeight: 31, fontWeight: "900" }}>{headline}</Text>
              <Text allowFontScaling={false} numberOfLines={1} style={{ color: HEADLINE_RED, fontSize: 40, lineHeight: 45, fontWeight: "900" }}>
                {formatMonthDay(locale, worst.weekStart)}
              </Text>
            </>
          ) : (
            <>
              <Text allowFontScaling={false} numberOfLines={2} style={{ color: "#FFFFFF", fontSize: 32, lineHeight: 35, fontWeight: "900" }}>{headline}</Text>
              {aheadCount > 0 && aheadCount !== redCount ? (
                <Text allowFontScaling={false} style={{ color: HEADLINE_RED, fontSize: 15, fontWeight: "900" }}>
                  {aheadCount === 1 ? t("ai.forecast.headline_one", "1 red week ahead") : t("ai.forecast.headline_other", "{count} red weeks ahead", { count: formatNumber(locale, aheadCount) })}
                </Text>
              ) : null}
            </>
          )}
          <Text allowFontScaling={false} style={{ color: HERO.onHero2, fontSize: 14, fontWeight: "800", marginTop: 2 }}>{facts}</Text>
        </View>

        <View style={{ borderRadius: RADII.panel, padding: 14, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
          <ForecastHeatmap
            forecast={forecast}
            theme={theme}
            t={t}
            locale={locale}
            surface="hero"
            showItems={false}
            interactive={false}
            animate={false}
            allowFontScaling={false}
            hideNames={hideNames}
            maxCellSize={32}
            selectedWeekStart={null}
          />
        </View>

        {topWeeks.length ? (
          <View style={{ gap: 8 }}>
            {topWeeks.map((week) => {
              const counts = weekCounts(week);
              const keys: string[] = [];
              for (const item of week.items) {
                const key = classKeyOf(item);
                if (key && !keys.includes(key)) keys.push(key);
              }
              const refs = keys.slice(0, CHIPS_PER_WEEK).map((key) => week.items.find((item) => classKeyOf(item) === key)!);
              return (
                <View key={week.weekStart} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                  <View style={{ width: 8, height: 8, marginTop: 6, borderRadius: RADII.pill, backgroundColor: COLORS.red, boxShadow: "0 0 8px rgba(255,69,58,0.8)" }} />
                  <View style={{ flex: 1, gap: 5 }}>
                    <Text allowFontScaling={false} numberOfLines={1} style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "900" }}>
                      {t("ai.heatmap.week_of", "Week of {date}", { date: formatMonthDay(locale, week.weekStart) })}
                      <Text allowFontScaling={false} style={{ color: HERO.onHero3, fontSize: 13, fontWeight: "800" }}>{` · ${countsPhrase(t, locale, counts)}`}</Text>
                    </Text>
                    <View style={{ flexDirection: "row", gap: 4 }}>
                      {refs.map((ref) => (
                        <View key={classKeyOf(ref)} style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: RADII.pill, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: HERO.chip }}>
                          <View style={{ width: 6, height: 6, borderRadius: RADII.pill, backgroundColor: classColor(legend, ref, HERO.onHero3) }} />
                          <Text allowFontScaling={false} numberOfLines={1} style={{ color: "#FFFFFF", fontSize: 10.5, fontWeight: "900" }}>{classLabel(legend, ref, hideNames, t)}</Text>
                        </View>
                      ))}
                      {keys.length > refs.length ? (
                        <View style={{ borderRadius: RADII.pill, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: HERO.chip }}>
                          <Text allowFontScaling={false} style={{ color: HERO.onHero2, fontSize: 10.5, fontWeight: "900" }}>
                            {t("ai.heatmap.more", "+{count} more", { count: formatNumber(locale, keys.length - refs.length) })}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={{ marginTop: "auto", flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.10)" }}>
          <Image source={APP_ICON} style={{ width: 30, height: 30, borderRadius: 8 }} accessibilityIgnoresInvertColors />
          <View style={{ flex: 1 }}>
            <Text allowFontScaling={false} style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "900" }}>{t("ai.share.footer", "Made with StudyPlanner")}</Text>
            <Text allowFontScaling={false} numberOfLines={1} style={{ color: HERO.onHero3, fontSize: 11, fontWeight: "800", marginTop: 1 }}>{linkText}</Text>
          </View>
        </View>
      </View>
    </View>
  );
});
