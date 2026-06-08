import { Course } from "../models";

const emojiByKey: Record<string, string> = {
  study: "📚",
  science: "🧪",
  writing: "✍️",
  history: "🌍",
  art: "🎨",
  math: "📐",
  calculator: "📐",
  book: "📖",
  flask: "🧪",
  leaf: "🌱",
  globe: "🌍",
  palette: "🎨",
  music: "🎧",
  language: "💬",
  computer: "💻",
  fitness: "⚡"
};

const subjectMatchers: Array<[RegExp, string]> = [
  [/psych|behavior|cognitive|sociology/i, "🧠"],
  [/bio|anatomy|physiology|life science/i, "🌱"],
  [/chem|lab/i, "🧪"],
  [/physics|engineering/i, "⚛️"],
  [/algebra|geometry|calculus|math|stats|statistics|precalc/i, "📐"],
  [/english|writing|literature|essay|composition/i, "✍️"],
  [/history|civics|government|world|social studies/i, "🌍"],
  [/art|studio|design|photo|ceramic/i, "🎨"],
  [/music|band|choir|orchestra/i, "🎧"],
  [/spanish|french|german|latin|language/i, "💬"],
  [/computer|coding|programming|cs|robotics/i, "💻"],
  [/health|pe|fitness|sports/i, "⚡"],
  [/economics|business|finance|accounting/i, "💵"]
];

export function courseEmoji(course?: Pick<Course, "code" | "name" | "emojiKey" | "iconKey">) {
  if (!course) return "📚";

  const explicit = course.emojiKey || course.iconKey;
  if (explicit && emojiByKey[explicit]) return emojiByKey[explicit];

  const label = `${course.code || ""} ${course.name || ""}`.trim();
  const match = subjectMatchers.find(([regex]) => regex.test(label));
  return match?.[1] || "📚";
}
