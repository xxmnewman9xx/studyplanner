import React, { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { Check, Copy, Link2, QrCode, Share2, ShieldCheck } from "lucide-react-native";
import { directionFor, formatNumber } from "./format";
import { useEntrance } from "./motion";
import { AIButton, IconTile } from "./primitives";
import { copyToClipboard, shareLink } from "./share";
import type { AIBaseProps } from "./theme";
import { COLORS, QR_QUIET_ZONE, RADII, semanticText, SPACE, TYPE } from "./tokens";

const COPIED_RESET_MS = 1800;

export type QRCodeViewProps = {
  matrix: boolean[][];
  /** Target edge in points (includes the quiet zone); snapped down to whole points per module. */
  size?: number;
  quietZone?: number;
  accessibilityLabel?: string;
};

/** Crisp QR from a module matrix. Always black on white, including in dark mode. */
export function QRCodeView({ matrix, size = 212, quietZone = QR_QUIET_ZONE, accessibilityLabel }: QRCodeViewProps) {
  const modules = matrix.length;
  const path = useMemo(() => {
    const parts: string[] = [];
    for (let y = 0; y < modules; y += 1) {
      const row = matrix[y];
      let x = 0;
      while (x < row.length) {
        if (!row[x]) {
          x += 1;
          continue;
        }
        // Merge horizontal runs so the path stays small and edges stay crisp.
        let run = 1;
        while (x + run < row.length && row[x + run]) run += 1;
        parts.push(`M${x + quietZone} ${y + quietZone}h${run}v1h-${run}z`);
        x += run;
      }
    }
    return parts.join("");
  }, [matrix, modules, quietZone]);
  const extent = modules + quietZone * 2;
  // Snap to a whole number of points per module so module edges land on pixel boundaries.
  const edge = Math.max(1, Math.floor(size / extent)) * extent;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ width: edge, height: edge, backgroundColor: "#FFFFFF" }}>
      <Svg width={edge} height={edge} viewBox={`0 0 ${extent} ${extent}`}>
        <Rect x={0} y={0} width={extent} height={extent} fill="#FFFFFF" />
        <Path d={path} fill="#000000" />
      </Svg>
    </View>
  );
}

export type ClassPackSheetProps = AIBaseProps & {
  className: string;
  classCode?: string;
  itemCount: number;
  /** Full universal link, payload in the #fragment. */
  link: string;
  /** QR modules for `link`; null when the payload is over the QR budget. */
  matrix: boolean[][] | null;
  /** Override the default system share (e.g. to add haptics/analytics). */
  onShareLink?: () => void;
  /** Called after the link is copied (the sheet copies with expo-clipboard itself). */
  onCopied?: () => void;
  onDone: () => void;
};

export function ClassPackSheet({ className, classCode, itemCount, link, matrix, onShareLink, onCopied, onDone, theme, t, locale }: ClassPackSheetProps) {
  const entrance = useEntrance();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const title = classCode ? `${classCode} · ${className}` : className;
  const countLabel =
    itemCount === 1 ? t("ai.pack.items_one", "1 date") : t("ai.pack.items_other", "{count} dates", { count: formatNumber(locale, itemCount) });

  const share = () => {
    if (onShareLink) {
      onShareLink();
      return;
    }
    void shareLink(t("ai.pack.share_message", "Here are the {class} dates for StudyPlanner. Tap to import:", { class: classCode || className }), link);
  };
  const copy = async () => {
    const ok = await copyToClipboard(link);
    if (!ok) return;
    setCopied(true);
    AccessibilityInfo.announceForAccessibility(t("ai.pack.copied", "Copied"));
    onCopied?.();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  };

  return (
    <Animated.View style={[{ direction: directionFor(locale), gap: SPACE.lg, padding: SPACE.xl, backgroundColor: theme.surface, borderRadius: RADII.hero }, entrance]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.md }}>
        <IconTile icon={QrCode} color={COLORS.blue} />
        <View style={{ flex: 1 }}>
          <Text selectable style={{ color: theme.label2, fontSize: TYPE.caption, fontWeight: "900", letterSpacing: 0.7 }}>{t("ai.pack.kicker", "CLASS PACK")}</Text>
          <Text selectable accessibilityRole="header" style={{ color: theme.label, fontSize: TYPE.title3, lineHeight: 27, fontWeight: "900" }}>{title}</Text>
          <Text selectable style={{ color: theme.label2, fontWeight: "800", marginTop: 2 }}>{countLabel}</Text>
        </View>
      </View>

      {matrix ? (
        <View style={{ alignItems: "center", gap: SPACE.sm }}>
          <View style={{ padding: SPACE.md, borderRadius: RADII.panel, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: theme.hairline }}>
            <QRCodeView matrix={matrix} accessibilityLabel={t("ai.pack.qr_a11y", "QR code for the {class} Class Pack", { class: classCode || className })} />
          </View>
          <Text selectable style={{ color: theme.label2, textAlign: "center", lineHeight: 19 }}>{t("ai.pack.qr_hint", "Classmates scan this with the iPhone Camera.")}</Text>
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: SPACE.md, alignItems: "center", padding: SPACE.md + 2, borderRadius: RADII.tile, backgroundColor: theme.surface2 }}>
          <Link2 color={theme.label2} size={20} />
          <Text selectable style={{ flex: 1, color: theme.label, fontWeight: "800", lineHeight: 20 }}>{t("ai.pack.too_big", "Too many items for a QR — share the link")}</Text>
        </View>
      )}

      <View style={{ borderRadius: RADII.tile, backgroundColor: theme.surface2, paddingHorizontal: SPACE.md + 2, paddingVertical: SPACE.md }}>
        <Text selectable style={{ color: theme.label2, fontSize: TYPE.caption, fontWeight: "900", marginBottom: 3 }}>{t("ai.pack.link_label", "Link")}</Text>
        <Text selectable numberOfLines={2} ellipsizeMode="middle" style={{ color: theme.label, fontSize: TYPE.footnote, fontWeight: "700", writingDirection: "ltr" }}>{link}</Text>
      </View>

      <View style={{ gap: SPACE.sm }}>
        <AIButton label={t("ai.pack.share", "Share link")} icon={Share2} theme={theme} onPress={share} />
        <AIButton
          label={copied ? t("ai.pack.copied", "Copied") : t("ai.pack.copy", "Copy link")}
          icon={copied ? Check : Copy}
          variant="secondary"
          theme={theme}
          onPress={() => void copy()}
          accessibilityHint={t("ai.pack.copy_hint", "Copies the Class Pack link")}
        />
        <AIButton label={t("ai.common.done", "Done")} variant="secondary" theme={theme} onPress={onDone} />
      </View>

      <View style={{ flexDirection: "row", gap: SPACE.sm, alignItems: "flex-start" }}>
        <ShieldCheck color={semanticText(COLORS.green, theme)} size={16} style={{ marginTop: 2 }} />
        <Text selectable style={{ flex: 1, color: theme.label2, fontSize: TYPE.footnote, lineHeight: 18 }}>
          {t("ai.pack.privacy", "Only dates, titles and weights are shared — never your notes.")}
        </Text>
      </View>
    </Animated.View>
  );
}
