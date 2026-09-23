import React, { useMemo, useState } from "react";
import { Animated, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { CalendarDays, Check, ShieldCheck } from "lucide-react-native";
import type { TaskProposal } from "../types";
import { AIBadge } from "./AIBadge";
import { addDaysISO, directionFor, formatDuration, formatLongDate, formatPercent, formatWeekdayMonthDay, formatWeekdayShort, formatDayNumber } from "./format";
import { useEntrance } from "./motion";
import { AIButton, Kicker, LinkButton, Pill } from "./primitives";
import type { AIBaseProps, AITheme, AIText } from "./theme";
import { COLORS, QUICK_ADD_DAY_RANGE, RADII, semanticText, SPACE, TOUCH, TYPE } from "./tokens";

const TITLE_MIN = 3;
const TITLE_MAX = 120;
/** Fact tiles wrap instead of breaking words ("Presentation") at large Dynamic Type sizes. */
const FACT_MIN_WIDTH = 120;

export type QuickAddClassOption = { id: string; code: string; name?: string; color?: string };

export type QuickAddConfirmSheetProps = AIBaseProps & {
  proposal: TaskProposal;
  classes: QuickAddClassOption[];
  /** Local "today" as YYYY-MM-DD, the first date chip. */
  today: string;
  /** Receives the edited proposal with `needs` cleared. Deterministic validators run again before saving. */
  onConfirm: (proposal: TaskProposal) => void;
  onCancel: () => void;
};

export function taskTypeLabel(t: AIText, type: string) {
  switch (type) {
    case "exam":
      return t("ai.type.exam", "Exam");
    case "quiz":
      return t("ai.type.quiz", "Quiz");
    case "midterm":
      return t("ai.type.midterm", "Midterm");
    case "final":
      return t("ai.type.final", "Final");
    case "project":
      return t("ai.type.project", "Project");
    case "reading":
      return t("ai.type.reading", "Reading");
    case "lab":
      return t("ai.type.lab", "Lab");
    case "presentation":
      return t("ai.type.presentation", "Presentation");
    default:
      return t("ai.type.assignment", "Assignment");
  }
}

export function QuickAddConfirmSheet({ proposal, classes, today, onConfirm, onCancel, theme, t, locale }: QuickAddConfirmSheetProps) {
  const entrance = useEntrance();
  const [title, setTitle] = useState(proposal.title);
  const [classId, setClassId] = useState<string | undefined>(proposal.classId);
  const [dueDate, setDueDate] = useState<string | undefined>(proposal.dueDate);
  const [pickingDate, setPickingDate] = useState(proposal.needs.includes("date") || !proposal.dueDate);
  const days = useMemo(() => Array.from({ length: QUICK_ADD_DAY_RANGE }, (_, offset) => addDaysISO(today, offset)), [today]);

  const trimmed = title.trim();
  const titleOk = trimmed.length >= TITLE_MIN && trimmed.length <= TITLE_MAX;
  const classOk = Boolean(classId) || classes.length === 0;
  const dateOk = Boolean(dueDate);
  const ready = titleOk && classOk && dateOk;
  const green = semanticText(COLORS.green, theme);
  const warn = semanticText(COLORS.orange, theme);

  const confirm = () => {
    if (!ready) return;
    onConfirm({ ...proposal, title: trimmed, classId, dueDate, needs: [] });
  };

  const dayLabel = (iso: string, offset: number) =>
    offset === 0 ? t("ai.quick.today", "Today") : offset === 1 ? t("ai.quick.tomorrow", "Tomorrow") : `${formatWeekdayShort(locale, iso)} ${formatDayNumber(locale, iso)}`;

  return (
    <Animated.View style={[{ direction: directionFor(locale), gap: SPACE.lg, padding: SPACE.xl, backgroundColor: theme.surface, borderRadius: RADII.hero }, entrance]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACE.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.sm, flexShrink: 1, flexWrap: "wrap" }}>
          <Kicker text={t("ai.quick.kicker", "QUICK ADD")} theme={theme} />
          <Pill text={taskTypeLabel(t, proposal.type)} theme={theme} />
        </View>
        {proposal.origin === "onDevice" ? <AIBadge theme={theme} t={t} locale={locale} /> : null}
      </View>

      <View style={{ flexDirection: "row", gap: SPACE.sm, alignItems: "flex-start", padding: SPACE.md, borderRadius: RADII.inner, backgroundColor: theme.surface2 }}>
        <ShieldCheck color={green} size={17} style={{ marginTop: 1 }} />
        <Text selectable style={{ flex: 1, color: theme.label, lineHeight: 19 }}>
          <Text style={{ fontWeight: "900" }}>{t("ai.quick.check", "Check before saving.")}</Text> {t("ai.quick.check_body", "Nothing is added until you confirm.")}
        </Text>
      </View>

      <View>
        <Text style={{ color: theme.label2, fontSize: TYPE.caption, fontWeight: "900", marginBottom: 5 }}>{t("ai.quick.title_label", "Title")}</Text>
        <TextInput
          accessibilityLabel={t("ai.quick.title_label", "Title")}
          value={title}
          onChangeText={setTitle}
          maxLength={TITLE_MAX}
          returnKeyType="done"
          placeholder={t("ai.quick.title_placeholder", "What is due?")}
          placeholderTextColor={theme.label3}
          style={{ minHeight: 50, borderRadius: RADII.inner, backgroundColor: theme.surface2, color: theme.label, paddingHorizontal: 14, paddingVertical: 12, fontSize: TYPE.callout + 1, fontWeight: "800", borderWidth: 1, borderColor: titleOk ? theme.hairline : COLORS.orange }}
        />
        {!titleOk ? <Text accessibilityRole="alert" style={{ color: warn, fontWeight: "800", marginTop: 6 }}>{t("ai.quick.title_needed", "Add a short title (3 characters or more).")}</Text> : null}
      </View>

      {classes.length ? (
        <View style={{ gap: SPACE.sm }}>
          <Text style={{ color: theme.label2, fontSize: TYPE.caption, fontWeight: "900" }}>{t("ai.quick.class_label", "Class")}</Text>
          <View accessibilityRole="radiogroup" style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm }}>
            {classes.map((option) => (
              <ChoiceChip
                key={option.id}
                label={option.code}
                a11y={option.name ? `${option.code}, ${option.name}` : option.code}
                dot={option.color}
                selected={classId === option.id}
                onPress={() => setClassId(option.id)}
                theme={theme}
              />
            ))}
          </View>
          {!classOk ? <Text accessibilityRole="alert" style={{ color: warn, fontWeight: "800" }}>{t("ai.quick.class_needed", "Pick the class this belongs to.")}</Text> : null}
        </View>
      ) : null}

      <View style={{ gap: SPACE.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACE.sm }}>
          <Text style={{ color: theme.label2, fontSize: TYPE.caption, fontWeight: "900" }}>{t("ai.quick.date_label", "Due")}</Text>
          {!pickingDate && dueDate ? <LinkButton label={t("ai.quick.change", "Change")} color={theme.label} onPress={() => setPickingDate(true)} /> : null}
        </View>
        {pickingDate ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACE.sm, paddingVertical: 2 }} accessibilityRole="radiogroup">
            {days.map((iso, offset) => (
              <ChoiceChip key={iso} label={dayLabel(iso, offset)} a11y={formatLongDate(locale, iso)} selected={dueDate === iso} onPress={() => setDueDate(iso)} theme={theme} />
            ))}
          </ScrollView>
        ) : null}
        {dueDate ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.sm }}>
            <CalendarDays color={theme.label2} size={16} />
            <Text selectable style={{ color: theme.label, fontWeight: "900" }}>{[formatWeekdayMonthDay(locale, dueDate), proposal.time].filter(Boolean).join(" · ")}</Text>
          </View>
        ) : (
          <Text accessibilityRole="alert" style={{ color: warn, fontWeight: "800" }}>{t("ai.quick.date_needed", "Pick a due date.")}</Text>
        )}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm }}>
        {typeof proposal.weight === "number" ? <Fact label={t("ai.quick.weight_label", "Weight")} value={formatPercent(locale, proposal.weight)} theme={theme} /> : null}
        <Fact label={t("ai.quick.estimate_label", "Estimate")} value={formatDuration(t, locale, proposal.estimateMinutes)} theme={theme} />
      </View>

      <View style={{ flexDirection: "row", gap: SPACE.sm }}>
        <View style={{ flex: 1 }}>
          <AIButton label={t("ai.common.cancel", "Cancel")} variant="secondary" theme={theme} onPress={onCancel} />
        </View>
        <View style={{ flex: 1.4 }}>
          <AIButton
            label={t("ai.quick.confirm", "Add to planner")}
            icon={Check}
            theme={theme}
            onPress={ready ? confirm : undefined}
            accessibilityHint={ready ? undefined : t("ai.quick.confirm_disabled_hint", "Fill in the highlighted fields first")}
          />
        </View>
      </View>
    </Animated.View>
  );
}

function ChoiceChip({ label, a11y, dot, selected, onPress, theme }: { label: string; a11y: string; dot?: string; selected: boolean; onPress: () => void; theme: AITheme }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={a11y}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: TOUCH,
        paddingHorizontal: 14,
        borderRadius: RADII.pill,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: selected ? theme.accent : theme.surface2,
        borderWidth: 1,
        borderColor: selected ? theme.accent : theme.hairline,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {dot ? <View style={{ width: 8, height: 8, borderRadius: RADII.pill, backgroundColor: dot }} /> : null}
      <Text style={{ color: selected ? "#FFFFFF" : theme.label, fontWeight: "900" }}>{label}</Text>
      {selected ? <Check color="#FFFFFF" size={14} strokeWidth={3} /> : null}
    </Pressable>
  );
}

function Fact({ label, value, theme }: { label: string; value: string; theme: AITheme }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={{ flexGrow: 1, flexBasis: FACT_MIN_WIDTH, minWidth: FACT_MIN_WIDTH, borderRadius: RADII.tile, backgroundColor: theme.surface2, padding: SPACE.md }}>
      <Text style={{ color: theme.label2, fontSize: TYPE.caption, fontWeight: "800" }}>{label}</Text>
      <Text selectable style={{ color: theme.label, fontSize: TYPE.callout, fontWeight: "900", marginTop: 2 }}>{value}</Text>
    </View>
  );
}
