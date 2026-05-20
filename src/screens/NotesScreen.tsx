import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NotebookPen, Pin, Save, Trash2 } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { GlassCard, EmptyState } from "../components/AppleComponents";
import { SectionHeader } from "../components/SectionHeader";
import { Course, StudyNote } from "../models";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { courseEmoji } from "../utils/courseVisuals";

type NotesScreenProps = {
  courses: Course[];
  notes: StudyNote[];
  onAddNote: (note: Omit<StudyNote, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateNote: (noteId: string, patch: Partial<StudyNote>) => void;
  onDeleteNote: (noteId: string) => void;
  onOpenClasses: () => void;
};

export function NotesScreen({ courses, notes, onAddNote, onUpdateNote, onDeleteNote, onOpenClasses }: NotesScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || "");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id || null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const selectedNote = notes.find((note) => note.id === selectedNoteId) || null;
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || courses[0];
  const grouped = useMemo(() => courses.map((course) => ({ course, notes: notes.filter((note) => note.courseId === course.id).sort(sortNotes) })), [courses, notes]);
  const uncategorized = notes.filter((note) => !note.courseId).sort(sortNotes);

  const createNote = () => {
    const cleanTitle = title.trim() || `${selectedCourse?.code || "Class"} note`;
    const cleanBody = body.trim();
    if (!cleanBody) {
      Alert.alert("Add note text", "Write the class note, reminder, link, or study context first.");
      return;
    }
    onAddNote({ courseId: selectedCourse?.id || selectedCourseId || undefined, title: cleanTitle, body: cleanBody, tags: [], pinned: false });
    setTitle("");
    setBody("");
  };

  return (
    <View style={styles.screen}>
      <GlassCard tone="hero" style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <View style={styles.heroTopRow}>
          <View style={styles.heroIcon}><NotebookPen color={colors.heroText} size={22} /></View>
          <Text style={styles.heroPill}>{notes.length} note{notes.length === 1 ? "" : "s"}</Text>
        </View>
        <Text style={styles.kicker}>Apple School Notes</Text>
        <Text style={styles.heroTitle}>Class context that lives beside your work.</Text>
        <Text style={styles.heroText}>Pin teacher preferences, rubric details, links, study ideas, and lecture notes directly to each class dashboard.</Text>
      </GlassCard>

      <SectionHeader title="New class note" note="Linked notes appear on Today, Classes, and the student dashboard." />
      <GlassCard style={styles.editorCard}>
        <View style={styles.coursePicker}>
          {courses.length ? courses.map((course) => {
            const active = selectedCourseId === course.id;
            return (
              <TouchableOpacity key={course.id} accessibilityRole="button" accessibilityState={{ selected: active }} style={[styles.courseChip, active ? styles.courseChipActive : null]} onPress={() => setSelectedCourseId(course.id)}>
                <Text style={styles.courseChipText}>{courseEmoji(course)} {course.code || course.name}</Text>
              </TouchableOpacity>
            );
          }) : <AppButton label="Add a class first" variant="secondary" onPress={onOpenClasses} />}
        </View>
        <TextInput value={title} onChangeText={setTitle} placeholder="Note title" placeholderTextColor={colors.faint} style={styles.titleInput} />
        <TextInput value={body} onChangeText={setBody} placeholder="Type a lecture note, rubric clue, link, or thing to remember…" placeholderTextColor={colors.faint} style={styles.bodyInput} multiline textAlignVertical="top" />
        <AppButton label="Save class note" icon={Save} onPress={createNote} />
      </GlassCard>

      <SectionHeader title="Class note library" note="Real notes only — no fake placeholder content." />
      {notes.length === 0 ? <EmptyState title="No notes yet" copy="Add the first class note above. It will connect to the dashboard and class context." emoji="writing" /> : null}
      {grouped.map(({ course, notes: courseNotes }) => courseNotes.length ? (
        <GlassCard key={course.id} style={styles.noteGroup}>
          <Text style={styles.groupTitle}>{courseEmoji(course)} {course.code || course.name}</Text>
          {courseNotes.map((note) => <NoteRow key={note.id} note={note} active={selectedNoteId === note.id} onPress={() => setSelectedNoteId(note.id)} onTogglePin={() => onUpdateNote(note.id, { pinned: !note.pinned })} />)}
        </GlassCard>
      ) : null)}
      {uncategorized.length ? (
        <GlassCard style={styles.noteGroup}>
          <Text style={styles.groupTitle}>Unlinked notes</Text>
          {uncategorized.map((note) => <NoteRow key={note.id} note={note} active={selectedNoteId === note.id} onPress={() => setSelectedNoteId(note.id)} onTogglePin={() => onUpdateNote(note.id, { pinned: !note.pinned })} />)}
        </GlassCard>
      ) : null}

      {selectedNote ? (
        <GlassCard style={styles.detailCard}>
          <Text style={styles.detailKicker}>Editing note</Text>
          <TextInput value={selectedNote.title} onChangeText={(nextTitle) => onUpdateNote(selectedNote.id, { title: nextTitle })} style={styles.titleInput} />
          <TextInput value={selectedNote.body} onChangeText={(nextBody) => onUpdateNote(selectedNote.id, { body: nextBody })} style={styles.bodyInput} multiline textAlignVertical="top" />
          <View style={styles.detailActions}>
            <AppButton label={selectedNote.pinned ? "Unpin" : "Pin note"} icon={Pin} variant="secondary" onPress={() => onUpdateNote(selectedNote.id, { pinned: !selectedNote.pinned })} style={styles.actionButton} />
            <AppButton label="Delete" icon={Trash2} variant="quiet" onPress={() => { const deleteId = selectedNote.id; setSelectedNoteId(null); onDeleteNote(deleteId); }} style={styles.actionButton} />
          </View>
        </GlassCard>
      ) : null}
    </View>
  );
}

function NoteRow({ note, active, onPress, onTogglePin }: { note: StudyNote; active: boolean; onPress: () => void; onTogglePin: () => void }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  return (
    <TouchableOpacity accessibilityRole="button" style={[styles.noteRow, active ? styles.noteRowActive : null]} onPress={onPress}>
      <View style={styles.noteCopy}>
        <Text style={styles.noteTitle}>{note.pinned ? "Pinned · " : ""}{note.title}</Text>
        <Text style={styles.noteBody}>{note.body}</Text>
      </View>
      <TouchableOpacity accessibilityRole="button" onPress={onTogglePin} style={styles.pinButton}>
        <Pin color={note.pinned ? colors.gold : colors.faint} size={16} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function sortNotes(a: StudyNote, b: StudyNote) {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;
  return StyleSheet.create({
    screen: { gap: spacing.md },
    heroCard: { padding: spacing.lg, gap: spacing.sm, overflow: "hidden" },
    heroGlow: { position: "absolute", right: -56, top: -80, width: 190, height: 190, borderRadius: 95, backgroundColor: colors.brandViolet, opacity: theme.isDark ? 0.20 : 0.10 },
    heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
    heroIcon: { width: 42, height: 42, borderRadius: radii.lg, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.14)" },
    heroPill: { color: colors.heroText, fontSize: 12, lineHeight: 16, fontWeight: "900", backgroundColor: "rgba(255,255,255,0.14)", paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radii.round, overflow: "hidden" },
    kicker: { color: colors.accent, fontSize: 12, lineHeight: 16, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
    heroTitle: { color: colors.heroText, fontSize: 30, lineHeight: 36, fontWeight: "900", letterSpacing: -0.8 },
    heroText: { color: colors.heroMuted, fontSize: 15, lineHeight: 22, fontWeight: "700" },
    editorCard: { gap: spacing.sm },
    coursePicker: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    courseChip: { borderRadius: radii.round, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.sm, paddingVertical: 8 },
    courseChipActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
    courseChipText: { color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: "900" },
    titleInput: { minHeight: 50, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, color: colors.ink, paddingHorizontal: spacing.md, fontSize: 16, lineHeight: 21, fontWeight: "900" },
    bodyInput: { minHeight: 132, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, color: colors.ink, padding: spacing.md, fontSize: 14, lineHeight: 21, fontWeight: "700" },
    noteGroup: { gap: spacing.xs },
    groupTitle: { ...typography.h2 },
    noteRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, backgroundColor: colors.surfaceAlt, padding: spacing.sm },
    noteRowActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
    noteCopy: { flex: 1, minWidth: 0, gap: 2 },
    noteTitle: { color: colors.ink, fontSize: 14, lineHeight: 19, fontWeight: "900" },
    noteBody: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: "700" },
    pinButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
    detailCard: { gap: spacing.sm },
    detailKicker: { color: colors.accent, fontSize: 11, lineHeight: 15, fontWeight: "900", textTransform: "uppercase" },
    detailActions: { flexDirection: "row", gap: spacing.sm },
    actionButton: { flex: 1 }
  });
}
