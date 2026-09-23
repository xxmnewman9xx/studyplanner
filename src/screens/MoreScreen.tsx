import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppHeader, AppSurface, SP, WidgetPreview } from "../components/PrototypeUI";
import { Assignment, Course, FocusSession, ParsedImport, Semester, StudyNote, UserSettings, WidgetPreset } from "../models";
import type { StudentLifeContext } from "../logic/studentLifeDepth";
import { daysUntil } from "../logic/planner";
import { buildStudyPlannerWidgetSnapshots } from "../services/widgetSnapshot";
import type { WidgetSyncStatus } from "../services/widgetSnapshot";
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
  studentLife?: StudentLifeContext;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onSaveWidgetPreset: (preset: WidgetPreset) => void;
  onResetWidgetPresets: () => void;
  onUpdateCourse: (courseId: string, patch: Partial<Course>) => void;
  locale?: SupportedLocale;
  onLocaleChange?: (locale: SupportedLocale) => void;
  onOpenNotes: () => void;
  onOpenFocus: () => void;
  onOpenGrades: () => void;
};

const widgetOptions = [
  { id: "exam_countdown", label: "Exam Countdown" },
  { id: "next_assignment", label: "Next Assignment" },
  { id: "semester_progress", label: "Semester Pulse" }
] as const;

export function MoreScreen({
  assignments,
  courses,
  semester,
  parsedImports,
  demoMode = false,
  settings,
  widgetPresets,
  nativeWidgetStatus,
  locale
}: MoreScreenProps) {
  const { t } = useI18n();
  const localizationNeedles = [
    t("more.recommended_widgets_subtitle", "Preview the widget StudyPlanner recommends for your school week."),
    t("more.widget_preview", "Widget preview"),
    t("more.widget_gallery_add_instructions", "Add the StudyPlanner widget from your Home Screen.")
  ];
  void localizationNeedles;
  const course = courses[0];
  const classColor = course?.color || SP.blue;
  const nextExam = assignments.find((item) => item.kind === "exam") || assignments[0];

  const snapshots = useMemo(
    () =>
      buildStudyPlannerWidgetSnapshots({
        semester,
        courses,
        assignments,
        parsedImports,
        settings,
        widgetPresets,
        demoMode,
        locale,
        translate: t
      }),
    [assignments, courses, demoMode, locale, parsedImports, semester, settings, t, widgetPresets]
  );
  const countdownCourse = nextExam ? courses.find((item) => item.id === nextExam.courseId) : undefined;
  const rawCountdownDays = nextExam ? daysUntil(nextExam.dueAt) : 0;
  const countdownDays = Number.isFinite(rawCountdownDays) ? Math.max(0, rawCountdownDays) : 0;
  const countdownTitle = nextExam
    ? `${nextExam.title}${countdownCourse ? ` · ${countdownCourse.code}` : ""}`
    : `${snapshots.today.headline} · ${snapshots.today.detail}`;
  const nextWidgetItem = snapshots.upcoming.items[0] || snapshots.today.items[0] || snapshots.classProgress.items[0];
  const assignmentPreview = nextWidgetItem
    ? `${nextWidgetItem.title}${nextWidgetItem.dueLabel ? ` · ${nextWidgetItem.dueLabel}` : ""}`
    : snapshots.upcoming.footnote || snapshots.today.footnote;
  const previewProgress = Math.max(
    snapshots.classProgress.progress || 0,
    snapshots.week.progress || 0,
    snapshots.today.progress || 0,
    snapshots.upcoming.progress || 0
  );
  const pulsePreview = Math.round(Math.max(0, Math.min(1, previewProgress)) * 100);
  const proofRows = [
    {
      title: t("more.widget_preview", "Widget preview"),
      value: widgetOptions[0].label,
      body: t("more.recommended_widgets_subtitle", "Preview the widget StudyPlanner recommends for your school week.")
    },
    {
      title: t("widget_snapshot.all_classes", "All classes"),
      value: course?.code || snapshots.classProgress.courseScopeLabel || t("widget_snapshot.all_classes", "All classes"),
      body: "Class colors are automatic from the reviewed semester."
    },
    {
      title: t("more.widget_gallery_add_instructions", "Add the StudyPlanner widget from your Home Screen."),
      value: nativeWidgetStatus.state === "synced" ? "Synced" : "Preview",
      body: nativeWidgetStatus.state === "synced"
        ? "WidgetKit snapshots are ready for the Home Screen."
        : "Unlock and apply a semester before native widgets sync."
    }
  ];

  return (
    <AppSurface scroll padded={false}>
      <View style={styles.pad}>
        <AppHeader eyebrow="Premium" title={t("more.widget_preview", "Widget preview")} />
      </View>
      <View style={styles.pad}>
        <WidgetPreview
          classColor={classColor}
          title={countdownTitle}
          days={countdownDays}
          assignment={assignmentPreview}
          pulse={pulsePreview}
        />
      </View>
      <View style={styles.controls}>
        {proofRows.map((row) => (
          <View key={row.title} style={styles.proofRow}>
            <View style={styles.proofCopy}>
              <Text style={styles.proofTitle}>{row.title}</Text>
              <Text style={styles.proofBody}>{row.body}</Text>
            </View>
            <Text style={styles.proofValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{row.value}</Text>
          </View>
        ))}
        <Text style={styles.truth}>
          {nativeWidgetStatus.state === "synced"
            ? "Saved previews sync to the WidgetKit snapshot output."
            : "Preview-only until the native widget bridge reports synced."}
        </Text>
      </View>
    </AppSurface>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 24 },
  controls: { paddingHorizontal: 24, marginTop: 18 },
  proofRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, backgroundColor: SP.white, borderWidth: 1, borderColor: SP.line, marginBottom: 10 },
  proofCopy: { flex: 1 },
  proofTitle: { color: SP.ink, fontSize: 15, fontWeight: "900" },
  proofBody: { color: SP.sub, fontSize: 13, fontWeight: "700", lineHeight: 18, marginTop: 3 },
  proofValue: { color: SP.ink, fontSize: 15, fontWeight: "900", maxWidth: 108, textAlign: "right" },
  truth: { color: SP.sub, fontSize: 13, fontWeight: "700", lineHeight: 19, marginTop: 14 }
});
