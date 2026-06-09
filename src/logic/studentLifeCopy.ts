import type { StudentLifeFeature } from "../models";
import type { FeatureDepthInsight, StudentLifeContext } from "./studentLifeDepth";

type TranslateFn = (key: string, fallback?: string) => string;

export function localizedForecastCopy(
  forecast: StudentLifeContext["forecast"],
  openCount: number,
  t: TranslateFn
) {
  return {
    title: t("paywall.forecast", "Forecast"),
    detail: formatLocalized(t("today.risk_open_detail", "{risk} risk / {open} open"), {
      risk: String(forecast.riskScore),
      open: String(openCount)
    }),
    learned: t("more.semester_pulse_detail", "Next work and risk update as the semester changes."),
    recommendation: t("today.protect_one_block", "Protect one block")
  };
}

export function localizedStudentLifeCopy(
  feature: StudentLifeFeature,
  insight: Pick<FeatureDepthInsight, "learned" | "recommendation"> | StudentLifeContext["feed"],
  t: TranslateFn
) {
  if (feature === "classes") {
    return {
      learned: t("classes.semester_subtitle", "Your semester, simplified."),
      recommendation: t("classes.detail_note", "Edit details and see what is due.")
    };
  }
  if (feature === "focus") {
    return {
      learned: t("focus.predicted_block", "Predicted block"),
      recommendation: t("focus.timer_instructions", "Start the timer, add optional notes, then save the real time spent.")
    };
  }
  if (feature === "notes") {
    return {
      learned: t("notes.workflow_agenda_copy", "Capture what changed."),
      recommendation: t("notes.hero_copy", "Quick class notes for due dates, asks, links, and study context.")
    };
  }
  if (feature === "widgets") {
    return {
      learned: t("more.planner_preview_hint", "This preview uses planner data. Placement and ordering happen in the system widget gallery."),
      recommendation: t("more.home_screen_handoff", "Home Screen")
    };
  }
  if (feature === "home") {
    return {
      learned: t("today.updated_with_reviewed_work", "Today is updated with reviewed work."),
      recommendation: t("today.open_first_task", "Open first task")
    };
  }

  return {
    learned: insight.learned,
    recommendation: insight.recommendation
  };
}

function formatLocalized(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template);
}
