import React from "react";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Sparkles,
  Timer,
  Watch
} from "lucide-react-native";
import { LifeItem, LifeInsight } from "../models";
import { AppTheme, themePalettes } from "../theme";
import { useAppTheme } from "../themeContext";

export const SPSpacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32
};

export const SPRadius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 34,
  round: 999
};

export const SPTypography = {
  hero: { fontSize: 34, lineHeight: 38, fontWeight: "900" as const },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "900" as const },
  body: { fontSize: 14, lineHeight: 20, fontWeight: "700" as const },
  caption: { fontSize: 11, lineHeight: 15, fontWeight: "900" as const }
};

export const SPColorTokens = {
  shell: "#F7F8FC",
  surface: "#FFFFFF",
  ink: "#111827",
  muted: "#586174",
  line: "#E4E8F0",
  blue: "#315BFF",
  purple: "#7C3AED",
  cyan: "#0891B2",
  green: "#16A66E",
  orange: "#F97316",
  red: "#D92D4B"
};

export const SPDesignTokens = {
  colors: SPColorTokens,
  spacing: SPSpacing,
  radii: SPRadius,
  typography: SPTypography
};

type IconComponent = React.ComponentType<{ color: string; size: number }>;

export function SPCard({
  children,
  style,
  selected = false,
  accent
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  selected?: boolean;
  accent?: string;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={[styles.card, selected ? [styles.cardSelected, { borderColor: accent || theme.colors.accent }] : null, style]}>
      {children}
    </View>
  );
}

export function SPButton({
  label,
  onPress,
  icon: Icon = Sparkles,
  selected = false,
  quiet = false,
  style
}: {
  label: string;
  onPress: () => void;
  icon?: IconComponent;
  selected?: boolean;
  quiet?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const color = selected ? theme.colors.accentText : quiet ? theme.colors.ink : theme.colors.accent;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      activeOpacity={0.72}
      style={[styles.button, selected ? styles.buttonSelected : quiet ? styles.buttonQuiet : null, style]}
      onPress={onPress}
    >
      <Icon color={color} size={17} />
      <Text style={[styles.buttonLabel, selected ? styles.buttonLabelSelected : null]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function SPMetricTile({
  label,
  value,
  detail,
  accent
}: {
  label: string;
  value: string;
  detail?: string;
  accent?: string;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <SPCard style={styles.metricTile} accent={accent}>
      <View style={[styles.metricAccent, { backgroundColor: accent || theme.colors.accent }]} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{value}</Text>
      {detail ? <Text style={styles.metricDetail} numberOfLines={2}>{detail}</Text> : null}
    </SPCard>
  );
}

export function SPProgressRing({
  value,
  size = 72,
  accent,
  label
}: {
  value: number;
  size?: number;
  accent?: string;
  label?: string;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, value));
  return (
    <View style={[styles.ringWrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.colors.surfaceAlt} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={accent || theme.colors.accent}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={styles.ringText}>{label || `${Math.round(progress * 100)}`}</Text>
    </View>
  );
}

export function SPFeedCard({
  item,
  onPress
}: {
  item: LifeItem;
  onPress?: () => void;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const accent = item.color || accentForLifeType(item.type);
  const Icon = iconForLifeType(item.type);
  const content = (
    <>
      <View style={[styles.feedIcon, { backgroundColor: `${accent}18` }]}>
        <Icon color={accent} size={18} />
      </View>
      <View style={styles.feedCopy}>
        <View style={styles.feedTopRow}>
          <Text style={styles.feedEyebrow}>{labelForLifeType(item.type)}</Text>
          <Text style={[styles.feedPriority, { color: accent }]}>{item.priority}</Text>
        </View>
        <Text style={styles.feedTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.feedDetail} numberOfLines={1}>{formatLifeItemWindow(item)}</Text>
        {item.reason ? <Text style={styles.feedReason} numberOfLines={2}>{item.reason}</Text> : null}
      </View>
      {onPress ? <ChevronRight color={theme.colors.faint} size={18} /> : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.74} onPress={onPress} style={[styles.feedCard, { borderLeftColor: accent }]}>
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.feedCard, { borderLeftColor: accent }]}>
      {content}
    </View>
  );
}

export function SPInsightCard({
  insight,
  accent
}: {
  insight: LifeInsight;
  accent?: string;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const color = accent || priorityAccent(insight.priority);
  return (
    <SPCard style={styles.insightCard} accent={color}>
      <View style={styles.insightHeader}>
        <View style={[styles.insightIcon, { backgroundColor: `${color}18` }]}>
          <Sparkles color={color} size={16} />
        </View>
        <Text style={styles.insightTitle}>{insight.title}</Text>
      </View>
      <Text style={styles.insightDetail}>{insight.detail}</Text>
      <Text style={styles.insightReason}>{insight.reason}</Text>
    </SPCard>
  );
}

export function SPSectionHeader({
  title,
  note,
  action
}: {
  title: string;
  note?: string;
  action?: React.ReactNode;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {note ? <Text style={styles.sectionNote}>{note}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function SPTabBar<T extends string>({
  tabs,
  value,
  onChange
}: {
  tabs: Array<{ id: T; label: string; icon?: IconComponent }>;
  value: T;
  onChange: (value: T) => void;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        const Icon = tab.icon || Sparkles;
        return (
          <TouchableOpacity
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={tab.id}
            style={[styles.tab, active ? styles.tabActive : null]}
            onPress={() => onChange(tab.id)}
          >
            <Icon color={active ? theme.colors.accentText : theme.colors.muted} size={15} />
            <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export function SPPreviewPhone({
  title,
  subtitle,
  behavior,
  items,
  palette = "ocean"
}: {
  title: string;
  subtitle: string;
  behavior: string;
  items: LifeItem[];
  palette?: keyof typeof themePalettes;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const colors = themePalettes[palette] || themePalettes.ocean;
  return (
    <View style={styles.phoneShell}>
      <View style={styles.phoneBezel}>
        <View style={styles.phoneIsland} />
        <View style={[styles.phoneScreen, { backgroundColor: colors[0] }]}>
          <View style={styles.phoneStatus}>
            <Text style={styles.phoneTime}>9:41</Text>
            <Text style={styles.liveBadge}>Live</Text>
          </View>
          <Text style={styles.phoneTitle}>{title}</Text>
          <Text style={styles.phoneSubtitle}>{subtitle}</Text>
          <View style={styles.behaviorPill}>
            <Sparkles color={colors[2]} size={13} />
            <Text style={styles.behaviorText}>{behavior}</Text>
          </View>
          <View style={styles.phoneList}>
            {items.slice(0, 5).map((item, index) => {
              const accent = item.color || colors[(index % 3) + 1] || theme.colors.accent;
              return (
                <View key={item.id} style={[styles.phoneCard, { backgroundColor: `${accent}32`, borderColor: `${accent}80` }]}>
                  <View style={styles.phoneCardTop}>
                    <Text style={styles.phoneCardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.phoneCardTag}>{item.priority}</Text>
                  </View>
                  <Text style={styles.phoneCardMeta} numberOfLines={1}>{formatLifeItemWindow(item)}</Text>
                  {item.reason ? <Text style={styles.phoneCardReason} numberOfLines={1}>{item.reason}</Text> : null}
                </View>
              );
            })}
          </View>
          <View style={styles.phoneDock}>
            <View style={styles.dockIconActive} />
            <View style={styles.dockIcon} />
            <View style={styles.orb} />
            <View style={styles.dockIcon} />
            <View style={styles.dockIcon} />
          </View>
        </View>
      </View>
    </View>
  );
}

export function SPWidgetPreviewCard({
  title,
  value,
  detail,
  accent
}: {
  title: string;
  value: string;
  detail: string;
  accent?: string;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const color = accent || theme.colors.accent;
  return (
    <View style={[styles.widgetPreview, { borderColor: `${color}40` }]}>
      <View style={[styles.widgetDot, { backgroundColor: color }]} />
      <Text style={styles.widgetTitle}>{title}</Text>
      <Text style={styles.widgetValue}>{value}</Text>
      <Text style={styles.widgetDetail}>{detail}</Text>
    </View>
  );
}

export function SPWatchPreviewCard({
  title,
  value,
  detail,
  accent
}: {
  title: string;
  value: string;
  detail: string;
  accent?: string;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const color = accent || theme.colors.accent;
  return (
    <View style={styles.watchWrap}>
      <View style={styles.watchFace}>
        <Watch color={theme.colors.faint} size={16} />
        <Text style={styles.watchTitle}>{title}</Text>
        <Text style={[styles.watchValue, { color }]}>{value}</Text>
        <Text style={styles.watchDetail}>{detail}</Text>
      </View>
    </View>
  );
}

export function formatLifeItemWindow(item: LifeItem) {
  const iso = item.dueAt || item.startsAt;
  if (!iso) return item.estimatedMinutes ? `${item.estimatedMinutes} min` : "Flexible";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Check time";
  const day = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
  if (item.endsAt) {
    const end = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(item.endsAt));
    return `${day} ${time}-${end}`;
  }
  return item.dueAt ? `Due ${day} ${time}` : `${day} ${time}`;
}

function iconForLifeType(type: LifeItem["type"]): IconComponent {
  if (type === "class") return CalendarDays;
  if (type === "focus") return Timer;
  if (type === "exam") return Clock3;
  return Sparkles;
}

function labelForLifeType(type: LifeItem["type"]) {
  return type.replace(/_/g, " ");
}

function accentForLifeType(type: LifeItem["type"]) {
  if (type === "exam") return SPColorTokens.red;
  if (type === "focus") return SPColorTokens.purple;
  if (type === "class") return SPColorTokens.blue;
  if (type === "sport") return SPColorTokens.green;
  if (type === "work") return SPColorTokens.orange;
  return SPColorTokens.cyan;
}

function priorityAccent(priority: LifeInsight["priority"]) {
  if (priority === "critical") return SPColorTokens.red;
  if (priority === "high") return SPColorTokens.orange;
  if (priority === "medium") return SPColorTokens.blue;
  return SPColorTokens.green;
}

function createStyles(theme: AppTheme) {
  const { colors } = theme;
  return StyleSheet.create({
    card: {
      borderRadius: 22,
      backgroundColor: theme.isDark ? colors.surface : "#FFFFFF",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.13)" : "#E4E8F0",
      padding: 14,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.16 : 0.07,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 2
    },
    cardSelected: {
      borderWidth: 1.5,
      backgroundColor: theme.isDark ? colors.surfaceAlt : "#FBFCFF"
    },
    button: {
      minHeight: 44,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.12)" : "#E4E8F0",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.06)" : "#FFFFFF",
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    },
    buttonSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent
    },
    buttonQuiet: {
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.04)" : "#F3F5FA"
    },
    buttonLabel: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900",
      letterSpacing: 0
    },
    buttonLabelSelected: {
      color: colors.accentText
    },
    metricTile: {
      flex: 1,
      minWidth: 112,
      minHeight: 104,
      gap: 4,
      overflow: "hidden"
    },
    metricAccent: {
      width: 30,
      height: 5,
      borderRadius: 3,
      marginBottom: 4
    },
    metricLabel: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    metricValue: {
      color: colors.ink,
      fontSize: 24,
      lineHeight: 28,
      fontWeight: "900"
    },
    metricDetail: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "700"
    },
    ringWrap: {
      alignItems: "center",
      justifyContent: "center"
    },
    ringText: {
      position: "absolute",
      color: colors.ink,
      fontSize: 15,
      lineHeight: 19,
      fontWeight: "900"
    },
    feedCard: {
      borderRadius: 20,
      backgroundColor: theme.isDark ? colors.surface : "#FFFFFF",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.12)" : "#E5EAF2",
      borderLeftWidth: 5,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10
    },
    feedIcon: {
      width: 38,
      height: 38,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center"
    },
    feedCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    feedTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8
    },
    feedEyebrow: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    feedPriority: {
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    feedTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 19,
      fontWeight: "900"
    },
    feedDetail: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    feedReason: {
      color: colors.faint,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700"
    },
    insightCard: {
      gap: 7
    },
    insightHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8
    },
    insightIcon: {
      width: 30,
      height: 30,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center"
    },
    insightTitle: {
      flex: 1,
      color: colors.ink,
      fontSize: 16,
      lineHeight: 20,
      fontWeight: "900"
    },
    insightDetail: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
    },
    insightReason: {
      color: colors.faint,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 4,
      marginBottom: 8
    },
    sectionCopy: {
      flex: 1,
      minWidth: 0
    },
    sectionTitle: {
      color: colors.ink,
      fontSize: 20,
      lineHeight: 25,
      fontWeight: "900"
    },
    sectionNote: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    tabBar: {
      gap: 8,
      paddingVertical: 2
    },
    tab: {
      minHeight: 38,
      borderRadius: 19,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      backgroundColor: theme.isDark ? colors.surface : "#FFFFFF",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.12)" : "#E4E8F0"
    },
    tabActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent
    },
    tabLabel: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 15,
      fontWeight: "900"
    },
    tabLabelActive: {
      color: colors.accentText
    },
    phoneShell: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8
    },
    phoneBezel: {
      width: 252,
      height: 500,
      borderRadius: 44,
      backgroundColor: "#090B12",
      padding: 10,
      shadowColor: "#000000",
      shadowOpacity: 0.26,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 18 },
      elevation: 8
    },
    phoneIsland: {
      position: "absolute",
      top: 20,
      alignSelf: "center",
      width: 86,
      height: 25,
      borderRadius: 14,
      backgroundColor: "#05060A",
      zIndex: 2
    },
    phoneScreen: {
      flex: 1,
      borderRadius: 36,
      padding: 17,
      overflow: "hidden"
    },
    phoneStatus: {
      marginTop: 5,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center"
    },
    phoneTime: {
      color: "#FFFFFF",
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    liveBadge: {
      overflow: "hidden",
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
      backgroundColor: "rgba(255,255,255,0.18)",
      color: "#FFFFFF",
      fontSize: 10,
      lineHeight: 12,
      fontWeight: "900"
    },
    phoneTitle: {
      color: "#FFFFFF",
      fontSize: 20,
      lineHeight: 25,
      fontWeight: "900",
      marginTop: 18
    },
    phoneSubtitle: {
      color: "rgba(255,255,255,0.72)",
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800",
      marginTop: 2
    },
    behaviorPill: {
      alignSelf: "flex-start",
      marginTop: 10,
      borderRadius: 15,
      backgroundColor: "rgba(255,255,255,0.13)",
      paddingHorizontal: 9,
      paddingVertical: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 6
    },
    behaviorText: {
      color: "#FFFFFF",
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    phoneList: {
      gap: 9,
      marginTop: 14
    },
    phoneCard: {
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      padding: 11,
      gap: 3
    },
    phoneCardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    },
    phoneCardTitle: {
      flex: 1,
      color: "#FFFFFF",
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    phoneCardTag: {
      color: "rgba(255,255,255,0.72)",
      fontSize: 8,
      lineHeight: 11,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    phoneCardMeta: {
      color: "rgba(255,255,255,0.78)",
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "800"
    },
    phoneCardReason: {
      color: "rgba(255,255,255,0.58)",
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "700"
    },
    phoneDock: {
      marginTop: "auto",
      minHeight: 43,
      borderRadius: 22,
      backgroundColor: "rgba(255,255,255,0.12)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.18)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingHorizontal: 12
    },
    dockIcon: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: "rgba(255,255,255,0.32)"
    },
    dockIconActive: {
      width: 17,
      height: 17,
      borderRadius: 9,
      backgroundColor: "#FFFFFF"
    },
    orb: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "#7C3AED",
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.40)"
    },
    widgetPreview: {
      minWidth: 142,
      borderRadius: 22,
      backgroundColor: theme.isDark ? colors.surface : "#FFFFFF",
      borderWidth: 1,
      padding: 14,
      gap: 4
    },
    widgetDot: {
      width: 26,
      height: 5,
      borderRadius: 3,
      marginBottom: 3
    },
    widgetTitle: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    widgetValue: {
      color: colors.ink,
      fontSize: 19,
      lineHeight: 24,
      fontWeight: "900"
    },
    widgetDetail: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "700"
    },
    watchWrap: {
      alignItems: "center",
      justifyContent: "center"
    },
    watchFace: {
      width: 132,
      minHeight: 154,
      borderRadius: 34,
      backgroundColor: "#090B12",
      borderWidth: 4,
      borderColor: "#1F2937",
      alignItems: "center",
      justifyContent: "center",
      padding: 14,
      gap: 4
    },
    watchTitle: {
      color: "rgba(255,255,255,0.72)",
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    watchValue: {
      fontSize: 22,
      lineHeight: 27,
      fontWeight: "900"
    },
    watchDetail: {
      color: "rgba(255,255,255,0.70)",
      fontSize: 10,
      lineHeight: 13,
      textAlign: "center",
      fontWeight: "800"
    }
  });
}
