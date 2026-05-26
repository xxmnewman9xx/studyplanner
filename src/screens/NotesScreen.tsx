import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { BookOpenCheck, Clock3, NotebookPen, Pin, Save, Trash2 } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { GlassCard, EmptyState } from "../components/AppleComponents";
import { SectionHeader } from "../components/SectionHeader";
import { Course, StudyNote } from "../models";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { courseEmoji } from "../utils/courseVisuals";
import { useI18n } from "../i18n";

type NotesScreenProps = {
  courses: Course[];
  notes: StudyNote[];
  onAddNote: (note: Omit<StudyNote, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateNote: (noteId: string, patch: Partial<StudyNote>) => void;
  onDeleteNote: (noteId: string) => void;
  onOpenClasses: () => void;
};
type TranslateFn = (key: string, fallback?: string) => string;
type TemplateKind = "class" | "due" | "ask" | "remember";

export function NotesScreen({ courses, notes, onAddNote, onUpdateNote, onDeleteNote, onOpenClasses }: NotesScreenProps) {
  const { theme } = useAppTheme();
  const { locale, t } = useI18n();
  const { colors } = theme;
  const styles = createStyles(theme);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || "");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id || null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const selectedNote = notes.find((note) => note.id === selectedNoteId) || null;
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || courses[0];
  const selectedNoteCourse = selectedNote?.courseId
    ? courses.find((course) => course.id === selectedNote.courseId)
    : undefined;
  const grouped = useMemo(() => courses.map((course) => ({ course, notes: notes.filter((note) => note.courseId === course.id).sort(sortNotes) })), [courses, notes]);
  const uncategorized = notes.filter((note) => !note.courseId).sort(sortNotes);
  const sortedNotes = useMemo(() => notes.slice().sort(sortNotes), [notes]);
  const pinnedCount = notes.filter((note) => note.pinned).length;
  const linkedCount = notes.filter((note) => note.courseId).length;
  const latestNote = sortedNotes[0];

  useEffect(() => {
    if (courses.length === 0) {
      setSelectedCourseId("");
      return;
    }
    if (!courses.some((course) => course.id === selectedCourseId)) {
      setSelectedCourseId(courses[0]?.id || "");
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (notes.length === 0) {
      setSelectedNoteId(null);
      return;
    }
    if (!selectedNoteId || !notes.some((note) => note.id === selectedNoteId)) {
      setSelectedNoteId(notes.slice().sort(sortNotes)[0]?.id || null);
    }
  }, [notes, selectedNoteId]);

  const createNote = () => {
    const cleanTitle = title.trim() || formatNotes(t("notes.default_note_title", "{course} note"), {
      course: selectedCourse?.code || t("notes.agenda", "Agenda")
    });
    const cleanBody = body.trim();
    if (!cleanBody) {
      Alert.alert(t("notes.add_note_text_title", "Add note text"), t("notes.add_note_text_message", "Write the agenda note first."));
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
          <Text style={styles.heroPill}>
            {formatNotes(notes.length === 1 ? t("notes.note_count_one", "{count} note") : t("notes.note_count", "{count} notes"), {
              count: notes.length
            })}
          </Text>
        </View>
        <Text style={styles.kicker}>{t("notes.agenda_notes", "Agenda notes")}</Text>
        <Text style={styles.heroTitle}>{t("notes.hero_title", "Capture what changes the plan.")}</Text>
        <Text style={styles.heroText}>{t("notes.hero_copy", "Quick class notes for due dates, asks, links, and study context.")}</Text>
        <View style={styles.heroStats}>
          <MiniStat label={t("notes.pinned", "Pinned")} value={String(pinnedCount)} />
          <MiniStat label={t("notes.linked", "Linked")} value={String(linkedCount)} />
          <MiniStat label={t("notes.latest", "Latest")} value={latestNote ? formatShortDate(latestNote.updatedAt, locale, t) : t("notes.none", "None")} />
        </View>
      </GlassCard>

      <SectionHeader title={t("notes.new_agenda_note", "New agenda note")} note={t("notes.link_to_class", "Link it to a class.")} />
      <GlassCard style={styles.editorCard}>
        <View style={styles.coursePicker}>
          {courses.length ? courses.map((course) => {
            const active = selectedCourseId === course.id;
            return (
              <TouchableOpacity key={course.id} accessibilityRole="button" accessibilityState={{ selected: active }} style={[styles.courseChip, active ? styles.courseChipActive : null]} onPress={() => setSelectedCourseId(course.id)}>
                <Text style={styles.courseChipText} numberOfLines={1}>{courseEmoji(course)} {course.code || course.name}</Text>
              </TouchableOpacity>
            );
          }) : <AppButton label={t("notes.add_class_first", "Add a class first")} variant="secondary" onPress={onOpenClasses} />}
        </View>
        <View style={styles.agendaStrip}>
          <TemplateChip label={templateKindLabel("class", t)} onPress={() => applyTemplate("class")} />
          <TemplateChip label={templateKindLabel("due", t)} onPress={() => applyTemplate("due")} />
          <TemplateChip label={templateKindLabel("ask", t)} onPress={() => applyTemplate("ask")} />
          <TemplateChip label={templateKindLabel("remember", t)} onPress={() => applyTemplate("remember")} />
        </View>
        <TextInput value={title} onChangeText={setTitle} placeholder={t("notes.short_title", "Short title")} placeholderTextColor={colors.faint} style={styles.titleInput} />
        <TextInput value={body} onChangeText={setBody} placeholder={t("notes.default_template", "Today:\nDue:\nAsk:\nRemember:")} placeholderTextColor={colors.faint} style={styles.bodyInput} multiline textAlignVertical="top" />
        <AppButton label={t("notes.save_note", "Save note")} icon={Save} onPress={createNote} />
      </GlassCard>

      <SectionHeader
        title={t("notes.agenda_library", "Agenda library")}
        note={notes.length ? formatNotes(t("notes.saved_count", "{count} saved"), { count: notes.length }) : t("notes.no_saved_notes", "No saved notes")}
      />
      {notes.length === 0 ? (
        <GlassCard style={styles.emptyWorkflow}>
          <EmptyState title={t("notes.no_notes_yet", "No notes yet")} copy={t("notes.no_notes_copy", "Add one note above. It will show with class context.")} emoji="writing" />
          <View style={styles.workflowRow}>
            <WorkflowStep icon={BookOpenCheck} title={t("notes.workflow_link", "Link")} copy={t("notes.workflow_link_copy", "Choose the class.")} />
            <WorkflowStep icon={Clock3} title={t("notes.workflow_agenda", "Agenda")} copy={t("notes.workflow_agenda_copy", "Capture what changed.")} />
            <WorkflowStep icon={Pin} title={t("notes.workflow_pin", "Pin")} copy={t("notes.workflow_pin_copy", "Keep it visible.")} />
          </View>
        </GlassCard>
      ) : null}
      {grouped.map(({ course, notes: courseNotes }) => courseNotes.length ? (
        <GlassCard key={course.id} style={styles.noteGroup}>
          <Text style={styles.groupTitle} numberOfLines={1}>{courseEmoji(course)} {course.code || course.name}</Text>
          {courseNotes.map((note) => <NoteRow key={note.id} note={note} active={selectedNoteId === note.id} onPress={() => setSelectedNoteId(note.id)} onTogglePin={() => onUpdateNote(note.id, { pinned: !note.pinned })} />)}
        </GlassCard>
      ) : null)}
      {uncategorized.length ? (
        <GlassCard style={styles.noteGroup}>
          <Text style={styles.groupTitle} numberOfLines={1}>{t("notes.unlinked_notes", "Unlinked notes")}</Text>
          {uncategorized.map((note) => <NoteRow key={note.id} note={note} active={selectedNoteId === note.id} onPress={() => setSelectedNoteId(note.id)} onTogglePin={() => onUpdateNote(note.id, { pinned: !note.pinned })} />)}
        </GlassCard>
      ) : null}

      {selectedNote ? (
        <GlassCard style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={styles.detailHeaderCopy}>
              <Text style={styles.detailKicker}>{t("notes.editing", "Editing")}</Text>
              <Text style={styles.detailMeta} numberOfLines={1}>
                {selectedNoteCourse ? `${courseEmoji(selectedNoteCourse)} ${selectedNoteCourse.code || selectedNoteCourse.name}` : t("notes.unlinked", "Unlinked")} · {formatShortDate(selectedNote.updatedAt, locale, t)}
              </Text>
            </View>
            <TouchableOpacity accessibilityRole="button" onPress={() => onUpdateNote(selectedNote.id, { pinned: !selectedNote.pinned })} style={styles.pinButton}>
              <Pin color={selectedNote.pinned ? colors.gold : colors.faint} size={16} />
            </TouchableOpacity>
          </View>
          <TextInput value={selectedNote.title} onChangeText={(nextTitle) => onUpdateNote(selectedNote.id, { title: nextTitle })} placeholder={t("notes.short_title", "Short title")} placeholderTextColor={colors.faint} style={styles.titleInput} />
          <TextInput value={selectedNote.body} onChangeText={(nextBody) => onUpdateNote(selectedNote.id, { body: nextBody })} placeholder={t("notes.default_template", "Today:\nDue:\nAsk:\nRemember:")} placeholderTextColor={colors.faint} style={styles.bodyInput} multiline textAlignVertical="top" />
          <View style={styles.detailActions}>
            <AppButton label={selectedNote.pinned ? t("notes.unpin", "Unpin") : t("notes.pin", "Pin")} icon={Pin} variant="secondary" onPress={() => onUpdateNote(selectedNote.id, { pinned: !selectedNote.pinned })} style={styles.actionButton} />
            <AppButton label={t("notes.delete", "Delete")} icon={Trash2} variant="quiet" onPress={() => { const deleteId = selectedNote.id; setSelectedNoteId(null); onDeleteNote(deleteId); }} style={styles.actionButton} />
          </View>
        </GlassCard>
      ) : null}
    </View>
  );

  function applyTemplate(kind: TemplateKind) {
    const courseLabel = selectedCourse?.code || selectedCourse?.name || t("notes.class_fallback", "Class");
    const template = {
      class: t("notes.default_template", "Today:\nDue:\nAsk:\nRemember:"),
      due: t("notes.due_template", "Due:\nWhat changed:\nNext step:"),
      ask: t("notes.ask_template", "Question:\nWho to ask:\nNeeded before:"),
      remember: t("notes.remember_template", "Remember:\nWhy it matters:\nUse this when:")
    }[kind];
    if (!title.trim()) {
      setTitle(formatNotes(t("notes.template_title", "{course} {kind}"), {
        course: courseLabel,
        kind: templateKindLabel(kind, t)
      }));
    }
    setBody((current) => current.trim() ? current : template);
  }
}

function NoteRow({ note, active, onPress, onTogglePin }: { note: StudyNote; active: boolean; onPress: () => void; onTogglePin: () => void }) {
  const { theme } = useAppTheme();
  const { t } = useI18n();
  const { colors } = theme;
  const styles = createStyles(theme);
  return (
    <TouchableOpacity accessibilityRole="button" style={[styles.noteRow, active ? styles.noteRowActive : null]} onPress={onPress}>
      <View style={styles.noteCopy}>
        <Text style={styles.noteTitle} numberOfLines={1}>{note.pinned ? `${t("notes.pinned", "Pinned")} · ` : ""}{note.title}</Text>
        <Text style={styles.noteBody} numberOfLines={2}>{note.body}</Text>
      </View>
      <TouchableOpacity accessibilityRole="button" onPress={onTogglePin} style={styles.pinButton}>
        <Pin color={note.pinned ? colors.gold : colors.faint} size={16} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{value}</Text>
      <Text style={styles.miniStatLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function TemplateChip({ label, onPress }: { label: string; onPress: () => void }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <TouchableOpacity accessibilityRole="button" style={styles.agendaChipButton} onPress={onPress}>
      <Text style={styles.agendaChipText}>{label}</Text>
    </TouchableOpacity>
  );
}

function WorkflowStep({
  icon: Icon,
  title,
  copy
}: {
  icon: React.ComponentType<{ color: string; size: number }>;
  title: string;
  copy: string;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.workflowStep}>
      <View style={styles.workflowIcon}>
        <Icon color={theme.colors.accent} size={16} />
      </View>
      <Text style={styles.workflowTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.workflowCopy} numberOfLines={2}>{copy}</Text>
    </View>
  );
}

function sortNotes(a: StudyNote, b: StudyNote) {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function templateKindLabel(kind: TemplateKind, t: TranslateFn) {
  if (kind === "class") return t("notes.template_class", "Class");
  if (kind === "due") return t("notes.template_due", "Due");
  if (kind === "ask") return t("notes.template_ask", "Ask");
  return t("notes.template_remember", "Remember");
}

function formatNotes(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template
  );
}

function formatShortDate(value: string, locale: string, t: TranslateFn) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("notes.recent", "recent");
  return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
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
    heroTitle: { color: colors.heroText, fontSize: 30, lineHeight: 36, fontWeight: "900", letterSpacing: 0 },
    heroText: { color: colors.heroMuted, fontSize: 15, lineHeight: 22, fontWeight: "700" },
    heroStats: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs },
    miniStat: { flex: 1, minWidth: 0, borderRadius: radii.lg, backgroundColor: "rgba(255,255,255,0.12)", padding: spacing.sm },
    miniStatValue: { color: colors.heroText, fontSize: 17, lineHeight: 21, fontWeight: "900" },
    miniStatLabel: { color: colors.heroMuted, fontSize: 10, lineHeight: 13, fontWeight: "900", textTransform: "uppercase" },
    editorCard: { gap: spacing.sm },
    coursePicker: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    courseChip: { maxWidth: "100%", borderRadius: radii.round, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.sm, paddingVertical: 8 },
    courseChipActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
    courseChipText: { color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: "900" },
    agendaStrip: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    agendaChipButton: { borderRadius: radii.round, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.sm, paddingVertical: 7, overflow: "hidden" },
    agendaChipText: { color: colors.muted, fontSize: 11, lineHeight: 15, fontWeight: "900" },
    titleInput: { minHeight: 50, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, color: colors.ink, paddingHorizontal: spacing.md, fontSize: 16, lineHeight: 21, fontWeight: "900" },
    bodyInput: { minHeight: 150, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, color: colors.ink, padding: spacing.md, fontSize: 14, lineHeight: 21, fontWeight: "700" },
    emptyWorkflow: { gap: spacing.md },
    workflowRow: { flexDirection: "row", gap: spacing.xs },
    workflowStep: { flex: 1, minWidth: 0, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, backgroundColor: colors.surfaceAlt, padding: spacing.sm, gap: 4 },
    workflowIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentSoft },
    workflowTitle: { color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: "900" },
    workflowCopy: { color: colors.muted, fontSize: 11, lineHeight: 15, fontWeight: "700" },
    noteGroup: { gap: spacing.xs },
    groupTitle: { ...typography.h2 },
    noteRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, backgroundColor: colors.surfaceAlt, padding: spacing.sm },
    noteRowActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
    noteCopy: { flex: 1, minWidth: 0, gap: 2 },
    noteTitle: { color: colors.ink, fontSize: 14, lineHeight: 19, fontWeight: "900" },
    noteBody: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: "700" },
    pinButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
    detailCard: { gap: spacing.sm },
    detailHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
    detailHeaderCopy: { flex: 1, minWidth: 0 },
    detailKicker: { color: colors.accent, fontSize: 11, lineHeight: 15, fontWeight: "900", textTransform: "uppercase" },
    detailMeta: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: "800" },
    detailActions: { flexDirection: "row", gap: spacing.sm },
    actionButton: { flex: 1 }
  });
}
