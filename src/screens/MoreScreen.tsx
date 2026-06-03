import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AppButton, AppHeader, AppSurface, SP, WidgetPreview } from "../components/PrototypeUI";
import { Assignment, Course, FocusSession, ParsedImport, Semester, StudyNote, UserSettings, WidgetColorSource, WidgetPreset, WidgetStudioContentType, WidgetStudioStyle } from "../models";
import type { StudentLifeContext } from "../logic/studentLifeDepth";
import { buildStudyPlannerWidgetSnapshots } from "../services/widgetSnapshot";
import type { WidgetSyncStatus } from "../services/widgetSnapshot";
import { useI18n, type SupportedLocale } from "../i18n";
import { normalizeStudioCustomization, updateStudioWidget } from "../customization";

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
type PreviewWidgetContent = Extract<WidgetStudioContentType, (typeof widgetOptions)[number]["id"]>;
const styleOptions: WidgetStudioStyle[] = ["glass", "color_card", "clean"];
const colorSources: WidgetColorSource[] = ["class", "urgency", "custom"];

export function MoreScreen({
  assignments,
  courses,
  semester,
  parsedImports,
  demoMode = false,
  settings,
  widgetPresets,
  nativeWidgetStatus,
  locale,
  onUpdateSettings
}: MoreScreenProps) {
  const { t } = useI18n();
  const localizationNeedles = [
    t("more.recommended_widgets_subtitle", "Preview the widget StudyPlanner recommends for your school week."),
    t("more.widget_preview", "Widget preview"),
    t("more.widget_gallery_add_instructions", "Add the StudyPlanner widget from your Home Screen.")
  ];
  void localizationNeedles;
  const studioTitle = `${t("more.widget_preview", "Widget").split(" ")[0]} Studio`;
  const customization = normalizeStudioCustomization(settings.customization);
  const [contentType, setContentType] = useState<PreviewWidgetContent>(widgetOptions[0].id);
  const [courseId, setCourseId] = useState(courses[0]?.id || "");
  const [style, setStyle] = useState<WidgetStudioStyle>(customization.homeWidgetPack[0]?.style || "glass");
  const [colorSource, setColorSource] = useState<WidgetColorSource>(customization.homeWidgetPack[0]?.colorSource || "class");
  const course = courses.find((item) => item.id === courseId) || courses[0];
  const classColor = colorSource === "class" ? course?.color || customization.widgetColor : colorSource === "urgency" ? SP.red : customization.widgetColor;
  const nextExam = assignments.find((item) => item.kind === "exam") || assignments[0];
  const nextAssignment = assignments.find((item) => item.kind !== "exam") || assignments[1] || assignments[0];

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
  void snapshots;

  const savePreview = () => {
    const first = customization.homeWidgetPack[0];
    if (!first) return;
    onUpdateSettings({
      customization: updateStudioWidget(customization, "home", first.id, {
        contentType,
        classFocusCourseId: course?.id,
        colorSource,
        customColor: classColor,
        style,
        updatedAt: new Date().toISOString()
      }),
      selectedTheme: "custom",
      customPalette: [classColor, customization.secondaryAccent, customization.riskColor, customization.focusColor]
    });
  };

  return (
    <AppSurface scroll padded={false}>
      <View style={styles.pad}>
        <AppHeader eyebrow="Premium" title={studioTitle} />
      </View>
      <View style={styles.pad}>
        <WidgetPreview
          classColor={classColor}
          title={`${nextExam?.title || "Midterm 1"} · ${course?.code || "CS 188"}`}
          days={2}
          assignment={nextAssignment ? `${nextAssignment.title.slice(0, 18)} · Jun 6` : "Essay · Jun 6"}
          pulse={78}
        />
      </View>
      <View style={styles.controls}>
        <ControlRail
          title="Widget"
          options={widgetOptions.map((item) => item.label)}
          selected={widgetOptions.find((item) => item.id === contentType)?.label || widgetOptions[0].label}
          onSelect={(label) => setContentType(widgetOptions.find((item) => item.label === label)?.id || "exam_countdown")}
        />
        <ControlRail title="Class" options={(courses.length ? courses : [{ code: "CS 188" }]).map((item) => item.code)} selected={course?.code || "CS 188"} onSelect={(label) => setCourseId(courses.find((item) => item.code === label)?.id || "")} />
        <ControlRail title="Style" options={styleOptions.map((item) => item === "color_card" ? "Color" : titleCase(item))} selected={style === "color_card" ? "Color" : titleCase(style)} onSelect={(label) => setStyle(label === "Color" ? "color_card" : label.toLowerCase() as WidgetStudioStyle)} />
        <View style={styles.swatches}>
          {[course?.color || SP.blue, SP.purple, SP.orange, SP.green, SP.pink].map((color, index) => (
            <TouchableOpacity key={`${color}-${index}`} onPress={() => setColorSource(index === 0 ? "class" : "custom")} style={[styles.swatch, { backgroundColor: color }, color === classColor ? styles.swatchActive : null]} />
          ))}
        </View>
        <Text style={styles.truth}>
          {nativeWidgetStatus.state === "synced"
            ? "Saved previews sync to the WidgetKit snapshot output."
            : "Preview-only until the native widget bridge reports synced."}
        </Text>
        <AppButton label="Save preview" onPress={savePreview} style={{ marginTop: 14 }} />
      </View>
    </AppSurface>
  );
}

function ControlRail({ title, options, selected, onSelect }: { title: string; options: string[]; selected: string; onSelect: (value: string) => void }) {
  return (
    <View style={styles.rail}>
      {options.slice(0, 4).map((option) => {
        const active = option === selected;
        return (
          <TouchableOpacity key={option} style={[styles.control, active ? styles.controlActive : null]} onPress={() => onSelect(option)}>
            <Text style={[styles.controlTitle, active ? styles.controlTitleActive : null]}>{title}</Text>
            <Text style={[styles.controlValue, active ? styles.controlValueActive : null]}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function titleCase(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 24 },
  controls: { paddingHorizontal: 24, marginTop: 18 },
  rail: { flexDirection: "row", gap: 10, marginBottom: 10 },
  control: { flexShrink: 0, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: SP.white, borderWidth: 1, borderColor: SP.line },
  controlActive: { backgroundColor: SP.ink, borderColor: SP.ink },
  controlTitle: { color: SP.sub, fontSize: 11, fontWeight: "800" },
  controlTitleActive: { color: "rgba(255,255,255,0.58)" },
  controlValue: { color: SP.ink, fontSize: 14, fontWeight: "900", marginTop: 2 },
  controlValueActive: { color: SP.white },
  swatches: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  swatch: { width: 38, height: 38, borderRadius: 19 },
  swatchActive: { borderWidth: 4, borderColor: SP.white, shadowColor: SP.blue, shadowOpacity: 0.9, shadowRadius: 0, shadowOffset: { width: 0, height: 0 } },
  truth: { color: SP.sub, fontSize: 13, fontWeight: "700", lineHeight: 19, marginTop: 14 }
});
