export type SemesterThemeColorId = "blue" | "green" | "orange" | "purple" | "pink" | "graphite";

export type SemesterThemeColor = {
  id: SemesterThemeColorId;
  label: string;
  accent: string;
  foreground: string;
  softBackground: string;
  widgetBackground: string;
  focus: string;
  courseColors: string[];
};

export const semesterThemeColors: SemesterThemeColor[] = [
  {
    id: "blue",
    label: "Blue",
    accent: "#1476FF",
    foreground: "#FFFFFF",
    softBackground: "#EEF5FF",
    widgetBackground: "#F2F7FF",
    focus: "#0A84FF",
    courseColors: ["#1476FF", "#16A66E", "#8B3DFF", "#FF5A1F"]
  },
  {
    id: "green",
    label: "Green",
    accent: "#16A66E",
    foreground: "#FFFFFF",
    softBackground: "#ECFDF5",
    widgetBackground: "#F0FFF8",
    focus: "#20C997",
    courseColors: ["#16A66E", "#1476FF", "#F59E0B", "#EC4899"]
  },
  {
    id: "orange",
    label: "Orange",
    accent: "#FF5A1F",
    foreground: "#FFFFFF",
    softBackground: "#FFF3EC",
    widgetBackground: "#FFF6F0",
    focus: "#FF7A1A",
    courseColors: ["#FF5A1F", "#1476FF", "#16A66E", "#8B3DFF"]
  },
  {
    id: "purple",
    label: "Purple",
    accent: "#8B3DFF",
    foreground: "#FFFFFF",
    softBackground: "#F5EEFF",
    widgetBackground: "#F8F2FF",
    focus: "#7C3AED",
    courseColors: ["#8B3DFF", "#1476FF", "#16A66E", "#EC4899"]
  },
  {
    id: "pink",
    label: "Pink",
    accent: "#EC4899",
    foreground: "#FFFFFF",
    softBackground: "#FDF2F8",
    widgetBackground: "#FFF3FA",
    focus: "#DB2777",
    courseColors: ["#EC4899", "#8B3DFF", "#1476FF", "#16A66E"]
  },
  {
    id: "graphite",
    label: "Graphite",
    accent: "#111827",
    foreground: "#FFFFFF",
    softBackground: "#F3F4F6",
    widgetBackground: "#F7F7FA",
    focus: "#374151",
    courseColors: ["#1476FF", "#16A66E", "#FF5A1F", "#8B3DFF"]
  }
];

export function isSemesterThemeColorId(value: string | undefined | null): value is SemesterThemeColorId {
  return semesterThemeColors.some((color) => color.id === value);
}

export function resolveSemesterThemeColor(value: string | undefined | null): SemesterThemeColor {
  return semesterThemeColors.find((color) => color.id === value) || semesterThemeColors[0];
}
