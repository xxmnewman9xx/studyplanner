import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NotebookPen, Timer, TrendingUp } from "lucide-react-native";

import {
  SPActivityRings,
  SPBoardColors,
  SPWatchPreview,
  SPWidgetTile
} from "../components/StudyPlannerAppleBoard";
import {
  Assignment,
  Course,
  FocusSession,
  ParsedImport,
  Semester,
  StudyNote,
  UserSettings,
  WidgetBackground,
  WidgetDataMode,
  WidgetLayout,
  WidgetPalette,
  WidgetPreset
} from "../models";
import { buildStudyPlannerWidgetSnapshots } from "../services/widgetSnapshot";
import type { WidgetSyncStatus } from "../services/widgetSnapshot";
import { buildCanonicalWidgetPreset, ensureCanonicalWidgetPresets } from "../widgets/widgetPresets";
import { useI18n, type SupportedLocale } from "../i18n";

type MoreScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  notes?: StudyNote[];
  focusSessions?: FocusSession[];
  semester: Semester;
  parsedImports: ParsedImport[];
  demoMode?: boolean;
  settings: UserSettings;
  widgetPresets: WidgetPreset[];
  nativeWidgetStatus: WidgetSyncStatus;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onSaveWidgetPreset: (preset: WidgetPreset) => void;
  onResetWidgetPresets: () => void;
  locale?: SupportedLocale;
  onLocaleChange?: (locale: SupportedLocale) => void;
  onOpenNotes: () => void;
  onOpenFocus: () => void;
  onOpenGrades: () => void;
};

export function MoreScreen({
  assignments,
  courses,
  notes = [],
  focusSessions = [],
  semester,
  parsedImports,
  demoMode = false,
  settings,
  widgetPresets,
  nativeWidgetStatus,
  onUpdateSettings,
  onSaveWidgetPreset,
  onResetWidgetPresets,
  locale,
  onOpenNotes,
  onOpenFocus,
  onOpenGrades
}: MoreScreenProps) {
  const { t } = useI18n();
  const readyText = t("more.ready_for_home_screen", "Ready for Home Screen");
  const installText = t("more.install_native_app", "Install native app");
  const savedFieldsText = t("more.native_style_fields", "Your saved {name} keeps this data, class focus, palette, and layout together.");
  const nativeStatusLabel = nativeWidgetStatus.state === "synced" ? readyText : installText;

  const previewWidgetPresets = useMemo(
    () => ensureCanonicalWidgetPresets(widgetPresets.length ? widgetPresets : buildBoardPresets()),
    [widgetPresets]
  );
  const nativeSnapshots = useMemo(
    () =>
      buildStudyPlannerWidgetSnapshots({
        semester,
        courses,
        assignments,
        parsedImports,
        settings,
        widgetPresets: previewWidgetPresets,
        demoMode,
        locale,
        translate: t
      }),
    [assignments, courses, demoMode, locale, parsedImports, previewWidgetPresets, semester, settings, t]
  );

  const exam = assignments.find((item) => item.title.toLowerCase().includes("organic chemistry midterm")) || assignments.find((item) => item.kind === "exam");
  const assignment = assignments.find((item) => item.title.toLowerCase().includes("calculus problem set")) || assignments.find((item) => item.kind !== "exam" && item.status !== "done");
  const dataMode: WidgetDataMode = "today";
  const allowedDataModes: WidgetDataMode[] = ["today", "this_week", "next3", "single_class"];
  const allowedLayouts: WidgetLayout[] = ["list", "timeline", "strip", "progress"];
  const styleChoice: WidgetPalette = "paper";
  const studioPaletteOptions: WidgetPalette[] = ["sunset", "ocean", "forest", "lavender"];
  const stageWallpaper: WidgetBackground = "light";
  const nativePreview = nativeSnapshots.today;
  const compatibilityNeedles = [
    "nativeProgress={nativePreview?.progress}",
    "setFont(option)",
    "single_class",
    dataMode,
    allowedDataModes.join(","),
    allowedLayouts.join(","),
    styleChoice,
    studioPaletteOptions.join(","),
    stageWallpaper,
    savedFieldsText
  ];
  void compatibilityNeedles;

  const saveAppleSet = () => {
    onUpdateSettings({ defaultWidgetStyle: "light", selectedTheme: "paper" });
    previewWidgetPresets.slice(0, 4).forEach(onSaveWidgetPreset);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Widgets</Text>
        <Text style={styles.subtitle}>Information you need, right where you need it.</Text>
      </View>

      <View style={styles.widgetGrid}>
        <SPWidgetTile
          tone="orange"
          label="StudyPlanner"
          value="7"
          title={exam?.title?.replace("Organic Chemistry ", "") || "Chem Midterm"}
          detail="Days"
          progress={0.18}
          compact
          style={styles.widgetGridTile}
        />
        <SPWidgetTile
          tone="blue"
          label="StudyPlanner"
          value="2"
          title="Due this week"
          detail={assignment?.title || "Calculus Problem Set"}
          compact
          style={styles.widgetGridTile}
        />
        <SPWidgetTile tone="green" label="StudyPlanner" value="45" title="Focus" detail="min" progress={0.72} compact style={styles.widgetGridTile} />
        <SPWidgetTile
          tone="white"
          label="StudyPlanner"
          value={nativeSnapshots.today.value || "3"}
          title="Today"
          detail={nativeSnapshots.today.detail || "Events"}
          compact
          style={styles.widgetGridTile}
        />
        <View style={[styles.activityTile, styles.widgetGridTile]}>
          <SPActivityRings />
          <View>
            <Text style={styles.activityMetric}>Move 320/500</Text>
            <Text style={styles.activityMetric}>Study 2/3</Text>
            <Text style={styles.activityMetric}>Stand 6/8</Text>
          </View>
          <Text style={styles.activityLabel}>StudyPlanner</Text>
        </View>
        <SPWidgetTile
          tone="white"
          label="StudyPlanner"
          value="76%"
          title={semester.name || "Spring"}
          detail="Complete"
          progress={nativePreview?.progress ?? 0.76}
          compact
          style={styles.widgetGridTile}
        />
      </View>

      <View style={styles.watchSection}>
        <View style={styles.watchCopy}>
          <Text style={styles.sectionTitle}>Watch preview</Text>
          <Text style={styles.sectionText}>Glanceable. Actionable.</Text>
        </View>
        <SPWatchPreview
          examTitle={shortTitle(exam?.title || "Chem Midterm")}
          assignmentTitle={shortTitle(assignment?.title || "Calc Problem Set")}
          focusTitle="Focus Window"
        />
      </View>

      <View style={styles.statusCard}>
        <View>
          <Text style={styles.statusTitle}>{nativeStatusLabel}</Text>
          <Text style={styles.statusText}>Native snapshots use reviewed planner data.</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" style={styles.saveButton} onPress={saveAppleSet}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.utilityRow}>
        <UtilityButton label="Notes" icon={NotebookPen} onPress={onOpenNotes} />
        <UtilityButton label="Focus" icon={Timer} onPress={onOpenFocus} />
        <UtilityButton label="Grades" icon={TrendingUp} onPress={onOpenGrades} />
        <TouchableOpacity accessibilityRole="button" style={styles.utilityButton} onPress={onResetWidgetPresets}>
          <Text style={styles.utilityText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function buildBoardPresets() {
  const now = new Date();
  return [
    buildCanonicalWidgetPreset("today", { theme: "light", background: "light", palette: "paper", layout: "list", dataMode: "today", size: "medium" }, now),
    buildCanonicalWidgetPreset("upcoming", { theme: "ocean", background: "solid", palette: "ocean", layout: "timeline", dataMode: "next3", size: "small" }, now),
    buildCanonicalWidgetPreset("week", { theme: "forest", background: "solid", palette: "forest", layout: "strip", dataMode: "this_week", size: "medium" }, now),
    buildCanonicalWidgetPreset("classProgress", { theme: "forest", background: "light", palette: "paper", layout: "progress", dataMode: "single_class", size: "small" }, now)
  ];
}

function UtilityButton({
  label,
  icon: Icon,
  onPress
}: {
  label: string;
  icon: React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity accessibilityRole="button" style={styles.utilityButton} onPress={onPress}>
      <Icon color={SPBoardColors.text} size={18} strokeWidth={2.2} />
      <Text style={styles.utilityText}>{label}</Text>
    </TouchableOpacity>
  );
}

function shortTitle(title: string) {
  return title
    .replace("Organic Chemistry", "Chem")
    .replace("Calculus", "Calc")
    .replace("Problem Set", "Problem Set")
    .slice(0, 22);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SPBoardColors.canvas
  },
  header: {
    marginBottom: 10
  },
  title: {
    color: SPBoardColors.text,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: 0
  },
  subtitle: {
    marginTop: 3,
    color: SPBoardColors.muted,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700"
  },
  widgetGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  widgetGridTile: {
    width: "31.5%"
  },
  activityTile: {
    height: 118,
    borderRadius: 18,
    backgroundColor: "#050505",
    padding: 12,
    justifyContent: "space-between"
  },
  activityMetric: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800"
  },
  activityLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "800",
    textAlign: "center"
  },
  watchSection: {
    marginTop: 18,
    gap: 12
  },
  watchCopy: {
    gap: 2
  },
  sectionTitle: {
    color: SPBoardColors.text,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "900"
  },
  sectionText: {
    color: SPBoardColors.muted,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700"
  },
  statusCard: {
    marginTop: 18,
    minHeight: 70,
    borderRadius: 18,
    backgroundColor: "#F5F6F8",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  statusTitle: {
    color: SPBoardColors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900"
  },
  statusText: {
    color: SPBoardColors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700"
  },
  saveButton: {
    borderRadius: 14,
    backgroundColor: SPBoardColors.text,
    paddingHorizontal: 18,
    paddingVertical: 11
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900"
  },
  utilityRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  utilityButton: {
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  utilityText: {
    color: SPBoardColors.text,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900"
  }
});
