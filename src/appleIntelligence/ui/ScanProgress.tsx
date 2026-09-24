import React from "react";
import { ActivityIndicator, Animated, Text, View } from "react-native";
import { CheckCircle2, ScanLine } from "lucide-react-native";
import { AIBadge } from "./AIBadge";
import { directionFor, formatNumber } from "./format";
import { useEntrance } from "./motion";
import { LinkButton, ProgressBar } from "./primitives";
import type { AIBaseProps } from "./theme";
import { COLORS, RADII, semanticText, SPACE, TYPE } from "./tokens";

export type ScanProgressProps = AIBaseProps & {
  /** 1-based page being read. */
  page: number;
  pageCount: number;
  /** Items found so far. */
  found: number;
  /** iOS 26 table-aware reader in use. */
  documentReader?: boolean;
  /** Show the on-device badge when the model is extracting. */
  onDevice?: boolean;
  done?: boolean;
  onCancel?: () => void;
};

/** Inline extraction banner: "Page 2 of 5 · 17 found". */
export function ScanProgress({ page, pageCount, found, documentReader = false, onDevice = false, done = false, onCancel, theme, t, locale }: ScanProgressProps) {
  const entrance = useEntrance();
  const safeCount = Math.max(1, pageCount);
  const current = Math.min(Math.max(1, page), safeCount);
  const value = done ? 1 : (current - 1 + 0.5) / safeCount;
  const foundLabel = found === 1 ? t("ai.scan.found_one", "1 found") : t("ai.scan.found_other", "{count} found", { count: formatNumber(locale, found) });
  const line = done
    ? t("ai.scan.done", "Done · {found}", { found: foundLabel })
    : t("ai.scan.progress", "Page {page} of {count} · {found}", { page: formatNumber(locale, current), count: formatNumber(locale, safeCount), found: foundLabel });
  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel={line}
      accessibilityValue={{ min: 0, max: safeCount, now: done ? safeCount : current - 1 }}
      accessibilityLiveRegion="polite"
      style={[{ direction: directionFor(locale), borderRadius: RADII.panel, padding: SPACE.lg - 2, gap: SPACE.sm + 2, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.hairline }, entrance]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.md }}>
        <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface2 }}>
          {done ? <CheckCircle2 color={semanticText(COLORS.green, theme)} size={20} /> : <ActivityIndicator color={theme.label2} />}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text selectable style={{ color: theme.label, fontSize: TYPE.callout, fontWeight: "900" }}>{line}</Text>
          {documentReader && !done ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <ScanLine color={theme.label2} size={13} />
              <Text selectable style={{ color: theme.label2, fontSize: TYPE.footnote, fontWeight: "700" }}>{t("ai.scan.document_reader", "Reading tables on this iPhone")}</Text>
            </View>
          ) : null}
        </View>
        {onDevice ? <AIBadge theme={theme} t={t} locale={locale} /> : null}
      </View>
      <ProgressBar value={value} color={done ? COLORS.green : theme.accent} track={theme.surface3} height={6} />
      {onCancel && !done ? <LinkButton label={t("ai.common.cancel", "Cancel")} color={theme.label2} onPress={onCancel} accessibilityHint={t("ai.scan.cancel_hint", "Stops reading. Items found so far are kept for review.")} /> : null}
    </Animated.View>
  );
}
