import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { OSBehavior, StudentDNA, UserSettings, WatchDNA, WidgetDNA } from "../models";
import {
  frictionPointOptions,
  osBehaviorOptions,
  studentDNAOptions,
  watchDNAOptions,
  widgetDNAOptions
} from "../logic/lifeStudio";

type Props = {
  settings: UserSettings;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  compact?: boolean;
};

export function LifeStudioSetup({ settings, onUpdateSettings, compact = false }: Props) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const selectedIdentity = settings.studentDNA || "focused_scholar";
  const selectedBehavior = settings.osBehavior || "highest_gpa";
  const selectedWidgets = settings.widgetDNA || ["exam_countdown", "grade_impact"];
  const selectedWatch = settings.watchDNA || ["next_class", "focus_window"];
  const selectedFriction = settings.frictionPoints || ["procrastination"];

  const toggleWidget = (id: WidgetDNA) =>
    onUpdateSettings({
      widgetDNA: selectedWidgets.includes(id)
        ? selectedWidgets.filter((item) => item !== id)
        : [...selectedWidgets, id]
    });
  const toggleWatch = (id: WatchDNA) =>
    onUpdateSettings({
      watchDNA: selectedWatch.includes(id)
        ? selectedWatch.filter((item) => item !== id)
        : [...selectedWatch, id]
    });

  return (
    <View style={styles.shell}>
      <View style={styles.headerRow}>
        <View style={styles.logoMark}>
          <View style={[styles.logoLine, { backgroundColor: "#0A84FF" }]} />
          <View style={[styles.logoLine, { backgroundColor: "#30D158" }]} />
          <View style={[styles.logoLine, { backgroundColor: "#FF2D55" }]} />
          <View style={[styles.logoLine, { backgroundColor: "#FF9F0A" }]} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>StudyPlanner: Syllabus AI</Text>
          <Text style={[styles.title, compact ? styles.titleCompact : null]}>Design your student life OS.</Text>
          <Text style={styles.subtitle}>Every choice changes feed priority, widgets, watch signals, reminders, and focus recommendations.</Text>
        </View>
      </View>

      <View style={compact ? styles.compactGrid : styles.grid}>
        <View style={styles.panel}>
          <SectionLabel number="1" title="Identity" />
          <View style={styles.identityGrid}>
            {studentDNAOptions.map((item) => (
              <ChoiceTile
                key={item.id}
                label={item.label}
                color={item.color}
                active={selectedIdentity === item.id}
                compact={compact}
                onPress={() => onUpdateSettings({ studentDNA: item.id })}
              />
            ))}
          </View>
        </View>

        <SPPreviewPhone settings={settings} compact={compact} />

        <View style={styles.panel}>
          <SectionLabel number="2" title="OS Behavior" />
          <SPOSBehaviorSelector value={selectedBehavior} onChange={(osBehavior) => onUpdateSettings({ osBehavior })} />
          <SectionLabel number="3" title="Widget DNA" />
          <SPWidgetDNASelector values={selectedWidgets} onToggle={toggleWidget} />
          <SectionLabel number="4" title="Watch DNA" />
          <SPWatchDNASelector values={selectedWatch} onToggle={toggleWatch} />
          <SectionLabel number="5" title="Friction Points" />
          <View style={styles.pillWrap}>
            {frictionPointOptions.map((item) => {
              const active = selectedFriction.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.pill, active ? styles.pillActive : null]}
                  onPress={() =>
                    onUpdateSettings({
                      frictionPoints: active
                        ? selectedFriction.filter((value) => value !== item.id)
                        : [...selectedFriction, item.id]
                    })
                  }
                >
                  <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

export function SPOSBehaviorSelector({ value, onChange }: { value: OSBehavior; onChange: (value: OSBehavior) => void }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.behaviorRow}>
      {osBehaviorOptions.map((item) => (
        <TouchableOpacity key={item.id} style={[styles.behaviorTile, value === item.id ? styles.behaviorTileActive : null]} onPress={() => onChange(item.id)}>
          <View style={[styles.behaviorDot, { backgroundColor: item.color }]} />
          <Text style={styles.behaviorTitle} numberOfLines={1}>{item.label}</Text>
          <Text style={styles.behaviorDetail} numberOfLines={2}>{item.detail}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function SPWidgetDNASelector({ values, onToggle }: { values: WidgetDNA[]; onToggle: (value: WidgetDNA) => void }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.dnaGrid}>
      {widgetDNAOptions.map((item) => {
        const active = values.includes(item.id);
        return (
          <TouchableOpacity key={item.id} style={[styles.dnaTile, active ? styles.dnaTileActive : null]} onPress={() => onToggle(item.id)}>
            <View style={[styles.dnaIcon, { backgroundColor: `${item.color}18` }]}>
              <Sparkles color={item.color} size={14} />
            </View>
            <Text style={styles.dnaTitle} numberOfLines={1}>{item.label}</Text>
            <Text style={styles.dnaDetail} numberOfLines={1}>{item.detail}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function SPWatchDNASelector({ values, onToggle }: { values: WatchDNA[]; onToggle: (value: WatchDNA) => void }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.watchRow}>
      {watchDNAOptions.map((item) => {
        const active = values.includes(item.id);
        return (
          <TouchableOpacity key={item.id} style={[styles.watchPill, active ? styles.watchPillActive : null]} onPress={() => onToggle(item.id)}>
            <View style={[styles.watchDot, { backgroundColor: item.color }]} />
            <Text style={styles.watchText} numberOfLines={1}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function SPPreviewPhone({ settings, compact = false }: { settings: UserSettings; compact?: boolean }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const behavior = osBehaviorOptions.find((item) => item.id === settings.osBehavior) || osBehaviorOptions[0]!;
  return (
    <View style={[styles.phone, compact ? styles.phoneCompact : null]}>
      <View style={styles.island} />
      <Text style={styles.phoneTitle}>Your Student Life OS</Text>
      <Text style={styles.phoneMeta}>Behavior: {behavior.label}</Text>
      {[
        ["Chemistry Midterm", "Thursday · 8:00 AM", "Start tonight. You tend to wait too long.", "#C81E5B"],
        ["Calculus II Homework", "Due Thu · 10:59 PM", "Best time: tonight · 50 min", "#6337E8"],
        ["Physics Lab Report", "Due Tue · 11:59 PM", "Break into 2 focused blocks.", "#1557D8"],
        ["Soccer Practice", "Today · 4:00 PM", "Good time to move and reset.", "#087A3F"]
      ].map(([title, meta, reason, color]) => (
        <View key={title} style={[styles.feedCard, { backgroundColor: color }]}>
          <Text style={styles.feedTitle}>{title}</Text>
          <Text style={styles.feedMeta}>{meta}</Text>
          <Text style={styles.feedReason}>{reason}</Text>
        </View>
      ))}
    </View>
  );
}

function SectionLabel({ number, title }: { number: string; title: string }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionNumber}>{number}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function ChoiceTile({
  label,
  color,
  active,
  compact = false,
  onPress
}: {
  label: string;
  color: string;
  active: boolean;
  compact?: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: active }} style={[styles.choiceTile, compact ? styles.choiceTileCompact : null, active ? styles.choiceTileActive : null]} onPress={onPress}>
      <View style={[styles.choiceIcon, { backgroundColor: `${color}18` }]}>
        <Text style={[styles.choiceIconText, { color }]}>{label.slice(0, 1)}</Text>
      </View>
      <Text style={styles.choiceText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.76}>{label}</Text>
    </TouchableOpacity>
  );
}

function createStyles(theme: AppTheme) {
  const { spacing } = theme;
  const ink = "#05070B";
  const muted = "#586174";
  const shadow = "#15233A";
  return StyleSheet.create({
    shell: {
      borderRadius: 28,
      backgroundColor: "#F9FBFF",
      padding: spacing.md,
      borderWidth: 1,
      borderColor: "rgba(17,24,39,0.08)",
      shadowColor: shadow,
      shadowOpacity: 0.08,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
      gap: spacing.md
    },
    headerRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
    logoMark: { width: 42, height: 42, borderRadius: 11, backgroundColor: "#05070B", justifyContent: "center", alignItems: "center", gap: 3 },
    logoLine: { width: 23, height: 4, borderRadius: 4 },
    headerCopy: { flex: 1, minWidth: 0 },
    kicker: { color: ink, fontSize: 12, fontWeight: "900" },
    title: { color: ink, fontSize: 28, lineHeight: 32, fontWeight: "900" },
    titleCompact: { fontSize: 25, lineHeight: 29 },
    subtitle: { color: muted, fontSize: 13, lineHeight: 18, fontWeight: "700" },
    grid: { gap: spacing.md },
    compactGrid: { gap: spacing.sm },
    panel: { borderRadius: 22, backgroundColor: "#FFFFFF", padding: spacing.sm, borderWidth: 1, borderColor: "rgba(17,24,39,0.08)", gap: spacing.sm },
    sectionLabel: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    sectionNumber: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#05070B", color: "#FFFFFF", textAlign: "center", lineHeight: 22, fontWeight: "900", fontSize: 11 },
    sectionTitle: { color: ink, fontSize: 14, fontWeight: "900" },
    identityGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    choiceTile: { width: "23.5%", minHeight: 88, borderRadius: 16, backgroundColor: "#F7F9FD", borderWidth: 1, borderColor: "rgba(17,24,39,0.07)", padding: spacing.xs, alignItems: "center", gap: 5 },
    choiceTileCompact: { width: "31.2%", minHeight: 82 },
    choiceTileActive: { borderColor: "#6D3DF2", backgroundColor: "#F4F0FF" },
    choiceIcon: { width: 30, height: 30, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    choiceIconText: { fontSize: 14, fontWeight: "900" },
    choiceText: { color: ink, fontSize: 9, lineHeight: 11, fontWeight: "900", textAlign: "center" },
    behaviorRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    behaviorTile: { width: "31.8%", minHeight: 92, borderRadius: 16, backgroundColor: "#F7F9FD", borderWidth: 1, borderColor: "rgba(17,24,39,0.07)", padding: spacing.xs, gap: 4 },
    behaviorTileActive: { borderColor: "#6D3DF2", backgroundColor: "#F4F0FF" },
    behaviorDot: { width: 20, height: 20, borderRadius: 10 },
    behaviorTitle: { color: ink, fontSize: 10, fontWeight: "900" },
    behaviorDetail: { color: muted, fontSize: 9, lineHeight: 12, fontWeight: "700" },
    dnaGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    dnaTile: { width: "31.8%", minHeight: 78, borderRadius: 15, backgroundColor: "#F8FAFD", borderWidth: 1, borderColor: "rgba(17,24,39,0.07)", padding: spacing.xs, gap: 3 },
    dnaTileActive: { borderColor: "#6D3DF2", backgroundColor: "#F4F0FF" },
    dnaIcon: { width: 24, height: 24, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    dnaTitle: { color: ink, fontSize: 10, fontWeight: "900" },
    dnaDetail: { color: muted, fontSize: 9, fontWeight: "700" },
    watchRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    watchPill: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, backgroundColor: "#F7F9FD", borderWidth: 1, borderColor: "rgba(17,24,39,0.07)", paddingHorizontal: 10, paddingVertical: 7 },
    watchPillActive: { backgroundColor: "#F4F0FF", borderColor: "#6D3DF2" },
    watchDot: { width: 8, height: 8, borderRadius: 4 },
    watchText: { color: ink, fontSize: 10, fontWeight: "900" },
    pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    pill: { borderRadius: 999, backgroundColor: "#F7F9FD", borderWidth: 1, borderColor: "rgba(17,24,39,0.07)", paddingHorizontal: 11, paddingVertical: 7 },
    pillActive: { backgroundColor: "#F4F0FF", borderColor: "#6D3DF2" },
    pillText: { color: muted, fontSize: 10, fontWeight: "900" },
    pillTextActive: { color: "#6D3DF2" },
    phone: { minHeight: 440, borderRadius: 38, backgroundColor: "#0A123B", padding: spacing.md, borderWidth: 7, borderColor: "#05070B", gap: spacing.sm, shadowColor: "#05070B", shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
    phoneCompact: { minHeight: 350, borderRadius: 34, padding: spacing.sm },
    island: { alignSelf: "center", width: 104, height: 28, borderRadius: 999, backgroundColor: "#000000", marginBottom: spacing.xs },
    phoneTitle: { color: "#FFFFFF", fontSize: 23, lineHeight: 27, fontWeight: "900" },
    phoneMeta: { color: "rgba(255,255,255,0.70)", fontSize: 12, fontWeight: "800" },
    feedCard: { borderRadius: 20, padding: spacing.sm, gap: 3 },
    feedTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
    feedMeta: { color: "rgba(255,255,255,0.78)", fontSize: 11, fontWeight: "700" },
    feedReason: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }
  });
}
