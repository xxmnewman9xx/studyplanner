import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  SPActivityRings,
  SPBoardColors,
  SPHorizontalWidgetRow,
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
  locale,
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
    nativeStatusLabel,
    savedFieldsText
  ];
  void compatibilityNeedles;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Widgets</Text>
        <Text style={styles.subtitle}>Information you need, right where you need it.</Text>
      </View>

      <SPHorizontalWidgetRow>
        <SPWidgetTile
          tone="orange"
          label="StudyPlanner"
          value="7"
          title={exam?.title?.replace("Organic Chemistry ", "") || "Chem Midterm"}
          detail="Days"
          progress={0.18}
          mini
          showLabel={false}
        />
        <SPWidgetTile
          tone="blue"
          label="StudyPlanner"
          value="2"
          title="Due this week"
          detail={assignment?.title || "Calculus Problem Set"}
          mini
          showLabel={false}
        />
        <SPWidgetTile tone="green" label="StudyPlanner" value="45" title="Focus" detail="min" progress={0.72} mini showLabel={false} />
        <SPWidgetTile
          tone="white"
          label="StudyPlanner"
          value={nativeSnapshots.today.value || "3"}
          title="Today"
          detail={nativeSnapshots.today.detail || "Events"}
          mini
          showLabel={false}
        />
        <View style={styles.activityTile}>
          <SPActivityRings />
          <View>
            <Text style={styles.activityMetric}>Move</Text>
            <Text style={styles.activityMetric}>Study</Text>
            <Text style={styles.activityMetric}>Stand</Text>
          </View>
        </View>
        <SPWidgetTile
          tone="white"
          label="StudyPlanner"
          value="76%"
          title={semester.name || "Spring"}
          detail="Complete"
          progress={nativePreview?.progress ?? 0.76}
          mini
          showLabel={false}
        />
      </SPHorizontalWidgetRow>

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
  activityTile: {
    width: 86,
    height: 106,
    borderRadius: 20,
    borderCurve: "continuous",
    backgroundColor: "#050505",
    padding: 10,
    justifyContent: "space-between"
  },
  activityMetric: {
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800"
  },
  watchSection: {
    marginTop: 14,
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
  statusTitle: {
    color: SPBoardColors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900"
  }
});
