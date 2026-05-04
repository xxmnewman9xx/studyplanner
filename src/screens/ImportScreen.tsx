import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Camera, FileText, RotateCcw, Upload } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { Badge } from "../components/Badge";
import { SectionHeader } from "../components/SectionHeader";
import { AssignmentKind, Priority, SyllabusImportSource, SyllabusParseResult } from "../models";
import { parseSyllabusStub, updateParsedAssignment } from "../services/syllabusParser";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type ImportScreenProps = {
  onApplyParsedPlan: (parse: SyllabusParseResult) => void;
};

const priorities: Priority[] = ["low", "medium", "high"];
const kinds: AssignmentKind[] = ["assignment", "exam"];

export function ImportScreen({ onApplyParsedPlan }: ImportScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const [draft, setDraft] = useState<SyllabusParseResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runParse = async (source: SyllabusImportSource) => {
    try {
      setLoading(true);
      const result = await parseSyllabusStub(source);
      setDraft(result);
    } catch (error) {
      Alert.alert("Could not parse syllabus", errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (!asset) return;
      await runParse({ kind: "pdf", uri: asset.uri, name: asset.name });
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.85,
      allowsMultipleSelection: false
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (!asset) return;
      await runParse({ kind: "photo", uri: asset.uri, name: asset.fileName || "syllabus photo" });
    }
  };

  const capturePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission needed", "Camera access lets you photograph syllabus pages.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (!asset) return;
      await runParse({ kind: "photo", uri: asset.uri, name: asset.fileName || "camera scan" });
    }
  };

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.kicker}>Syllabus import</Text>
        <Text style={styles.title}>Scan, review, then apply.</Text>
        <Text style={styles.subtitle}>
          AI never silently edits the planner. Every detected course, date, and grade
          category stays editable first.
        </Text>
      </View>

      <View style={styles.importGrid}>
        <AppButton label="PDF" icon={FileText} variant="secondary" style={styles.importButton} onPress={pickPdf} />
        <AppButton label="Photo" icon={Upload} variant="secondary" style={styles.importButton} onPress={pickPhoto} />
        <AppButton label="Camera" icon={Camera} variant="secondary" style={styles.importButton} onPress={capturePhoto} />
      </View>

      <AppButton
        label={loading ? "Parsing" : "Try sample parse"}
        icon={RotateCcw}
        disabled={loading}
        onPress={() => runParse({ kind: "sample", name: "ENG 102 syllabus sample" })}
      />
      {loading ? <ActivityIndicator style={styles.loader} color={colors.ink} /> : null}

      {draft ? (
        <>
          <SectionHeader title="Review Results" note={draft.sourceName} />
          <View style={styles.resultCard}>
            <View style={styles.findings}>
              {draft.findings.map((finding) => (
                <Badge
                  key={finding.id}
                  label={finding.message}
                  tone={finding.severity === "needs_review" ? "red" : "green"}
                />
              ))}
            </View>

            {draft.courses.map((course) => (
              <View key={course.id} style={styles.coursePreview}>
                <Text style={styles.courseCode}>{course.code}</Text>
                <Text style={styles.courseName}>{course.name}</Text>
                <Text style={styles.courseMeta}>
                  {course.meetings.length} class meetings · {course.gradeCategories.length} grade
                  categories
                </Text>
              </View>
            ))}
          </View>

          <SectionHeader title="Editable Deadlines" />
          <View style={styles.editList}>
            {draft.assignments.map((assignment) => (
              <View key={assignment.id} style={styles.editCard}>
                <Text style={styles.editLabel}>Title</Text>
                <TextInput
                  value={assignment.title}
                  style={styles.input}
                  placeholderTextColor={colors.faint}
                  onChangeText={(title) =>
                    setDraft(updateParsedAssignment(draft, assignment.id, { title }))
                  }
                />
                <Text style={styles.editLabel}>Due date</Text>
                <TextInput
                  value={assignment.dueAt.slice(0, 10)}
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.faint}
                  onChangeText={(date) =>
                    setDraft(
                      updateParsedAssignment(draft, assignment.id, {
                        dueAt: `${date}T23:59:00-05:00`
                      })
                    )
                  }
                />
                <View style={styles.twoColumn}>
                  <View style={styles.fieldHalf}>
                    <Text style={styles.editLabel}>Estimate</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={String(assignment.estimatedMinutes)}
                      style={styles.input}
                      placeholder="Minutes"
                      placeholderTextColor={colors.faint}
                      onChangeText={(estimatedMinutes) =>
                        setDraft(
                          updateParsedAssignment(draft, assignment.id, {
                            estimatedMinutes: Number.parseInt(estimatedMinutes, 10) || 0
                          })
                        )
                      }
                    />
                  </View>
                  <View style={styles.fieldHalf}>
                    <Text style={styles.editLabel}>Course</Text>
                    <View style={styles.lockedField}>
                      <Text style={styles.lockedText}>
                        {draft.courses.find((course) => course.id === assignment.courseId)?.code}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.editLabel}>Kind</Text>
                <View style={styles.choiceRow}>
                  {kinds.map((kind) => (
                    <TouchableOpacity
                      accessibilityRole="button"
                      key={kind}
                      style={[styles.choice, assignment.kind === kind ? styles.choiceActive : null]}
                      onPress={() =>
                        setDraft(updateParsedAssignment(draft, assignment.id, { kind }))
                      }
                    >
                      <Text
                        style={[
                          styles.choiceText,
                          assignment.kind === kind ? styles.choiceTextActive : null
                        ]}
                      >
                        {kind}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.editLabel}>Priority</Text>
                <View style={styles.choiceRow}>
                  {priorities.map((priority) => (
                    <TouchableOpacity
                      accessibilityRole="button"
                      key={priority}
                      style={[
                        styles.choice,
                        assignment.priority === priority ? styles.choiceActive : null
                      ]}
                      onPress={() =>
                        setDraft(updateParsedAssignment(draft, assignment.id, { priority }))
                      }
                    >
                      <Text
                        style={[
                          styles.choiceText,
                          assignment.priority === priority ? styles.choiceTextActive : null
                        ]}
                      >
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.applyBar}>
            <AppButton label="Apply parsed plan" onPress={() => onApplyParsedPlan(draft)} />
          </View>
        </>
      ) : null}
    </View>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The import could not be read.";
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    header: {
      gap: spacing.xs
    },
    kicker: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900"
    },
    title: {
      ...typography.title
    },
    subtitle: {
      ...typography.body
    },
    importGrid: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.lg,
      marginBottom: spacing.sm
    },
    importButton: {
      flex: 1
    },
    loader: {
      marginTop: spacing.md
    },
    resultCard: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.md
    },
    findings: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    coursePreview: {
      borderTopWidth: 1,
      borderTopColor: colors.line,
      paddingTop: spacing.md,
      gap: 2
    },
    courseCode: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900"
    },
    courseName: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "900"
    },
    courseMeta: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18
    },
    editList: {
      gap: spacing.sm
    },
    editCard: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.xs
    },
    editLabel: {
      color: colors.faint,
      fontSize: 12,
      fontWeight: "900"
    },
    input: {
      minHeight: 44,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      color: colors.ink,
      fontSize: 15,
      fontWeight: "700",
      backgroundColor: colors.canvas
    },
    row: {
      flexDirection: "row",
      gap: spacing.xs,
      flexWrap: "wrap",
      marginTop: spacing.xs
    },
    twoColumn: {
      flexDirection: "row",
      gap: spacing.sm
    },
    fieldHalf: {
      flex: 1,
      gap: spacing.xs
    },
    lockedField: {
      minHeight: 44,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      justifyContent: "center",
      backgroundColor: colors.canvas
    },
    lockedText: {
      color: colors.ink,
      fontSize: 15,
      fontWeight: "900"
    },
    choiceRow: {
      flexDirection: "row",
      gap: spacing.xs,
      flexWrap: "wrap"
    },
    choice: {
      minHeight: 36,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center"
    },
    choiceActive: {
      backgroundColor: colors.softGold,
      borderColor: colors.gold
    },
    choiceText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "capitalize"
    },
    choiceTextActive: {
      color: colors.ink
    },
    applyBar: {
      marginTop: spacing.lg
    }
  });
}
