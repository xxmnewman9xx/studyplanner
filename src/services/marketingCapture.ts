import {
  Assignment,
  Course,
  GradeItem,
  NavTab,
  Semester,
  SyllabusParseResult
} from "../models";

declare const __DEV__: boolean;

export type MarketingCaptureScreen = "processing" | "extracted" | "review_edit" | "failed" | "agenda";

const screen = process.env.EXPO_PUBLIC_MARKETING_CAPTURE_SCREEN;
const initialTab = process.env.EXPO_PUBLIC_MARKETING_CAPTURE_INITIAL_TAB;

export const marketingCaptureEnabled =
  typeof __DEV__ !== "undefined" && __DEV__ && process.env.EXPO_PUBLIC_MARKETING_CAPTURE === "1";

export const marketingCaptureScreen: MarketingCaptureScreen | undefined =
  marketingCaptureEnabled && isMarketingCaptureScreen(screen) ? screen : undefined;

export const marketingCaptureSemester: Semester = {
  id: "marketing-spring-2026",
  name: "Spring 2026",
  startDate: "2026-01-12",
  endDate: "2026-07-12",
  targetGpa: 3.6
};

export const marketingCaptureCourses: Course[] = [
  {
    id: "marketing-calculus",
    code: "Calculus",
    name: "Calculus I",
    instructor: "Prof. Patel",
    color: "#1476FF",
    meetings: [{ id: "marketing-calc-wed", day: "Wed", startTime: "08:30", endTime: "09:20", location: "214" }],
    gradeCategories: [{ id: "marketing-calc-homework", name: "Homework", weight: 35 }]
  },
  {
    id: "marketing-organic-chemistry",
    code: "Organic Chemistry",
    name: "Organic Chemistry",
    instructor: "Dr. Lin",
    color: "#FF5A1F",
    meetings: [{ id: "marketing-ochem-wed", day: "Wed", startTime: "09:30", endTime: "10:20", location: "Lab 5" }],
    gradeCategories: [{ id: "marketing-ochem-labs", name: "Labs", weight: 35 }]
  },
  {
    id: "marketing-physics-201",
    code: "Physics 201",
    name: "Physics 201",
    instructor: "Dr. Cho",
    color: "#21B8A7",
    meetings: [{ id: "marketing-phys-thu", day: "Thu", startTime: "10:00", endTime: "10:50", location: "4A" }],
    gradeCategories: [{ id: "marketing-phys-labs", name: "Labs", weight: 30 }]
  },
  {
    id: "marketing-world-history",
    code: "World History",
    name: "World History",
    instructor: "Mr. Ahmed",
    color: "#F59E0B",
    meetings: [{ id: "marketing-hist-tue", day: "Tue", startTime: "11:30", endTime: "12:20", location: "302" }],
    gradeCategories: [{ id: "marketing-hist-essays", name: "Essays", weight: 40 }]
  },
  {
    id: "marketing-biology",
    code: "Biology",
    name: "Biology",
    instructor: "Dr. Rivera",
    color: "#14B8A6",
    meetings: [{ id: "marketing-bio-fri", day: "Fri", startTime: "12:35", endTime: "13:25", location: "Lab 2" }],
    gradeCategories: [{ id: "marketing-bio-quizzes", name: "Quizzes", weight: 25 }]
  },
  {
    id: "marketing-studio-art",
    code: "Studio Art",
    name: "Studio Art",
    instructor: "Ms. Vance",
    color: "#EC4899",
    meetings: [{ id: "marketing-art-fri", day: "Fri", startTime: "13:40", endTime: "14:30", location: "Studio 2" }],
    gradeCategories: [{ id: "marketing-art-projects", name: "Projects", weight: 70 }]
  }
];

export const marketingCaptureAssignments: Assignment[] = [
  {
    id: "marketing-calc-problem-set",
    courseId: "marketing-calculus",
    title: "Calculus Problem Set",
    kind: "assignment",
    type: "assignment",
    dueAt: "2026-06-05T23:59:00",
    tags: ["problem-set", "calculus"],
    priority: "high",
    estimatedMinutes: 180,
    status: "in_progress",
    source: "syllabus",
    progress: 0.35,
    gradeWeight: 8
  },
  {
    id: "marketing-ochem-midterm",
    courseId: "marketing-organic-chemistry",
    title: "Organic Chemistry Midterm",
    kind: "exam",
    type: "exam",
    dueAt: "2026-06-07T09:00:00",
    tags: ["exam", "midterm"],
    priority: "high",
    estimatedMinutes: 120,
    status: "not_started",
    source: "syllabus",
    progress: 0,
    gradeWeight: 10
  },
  {
    id: "marketing-physics-preview",
    courseId: "marketing-physics-201",
    title: "Physics Lab Preview",
    kind: "reading",
    type: "reading",
    dueAt: "2026-06-03T10:00:00",
    tags: ["reading", "notes"],
    priority: "medium",
    estimatedMinutes: 35,
    status: "not_started",
    source: "scan",
    needsReview: true,
    confidence: 0.72,
    progress: 0
  },
  {
    id: "marketing-history-essay",
    courseId: "marketing-world-history",
    title: "Essay Draft",
    kind: "assignment",
    dueAt: "2026-06-02T20:00:00",
    tags: ["essay", "draft"],
    priority: "high",
    estimatedMinutes: 55,
    status: "not_started",
    source: "manual",
    progress: 0
  },
  {
    id: "marketing-bio-cell-quiz",
    courseId: "marketing-biology",
    title: "Cell Quiz",
    kind: "exam",
    type: "exam",
    dueAt: "not-a-date",
    tags: ["quiz", "missing date"],
    priority: "medium",
    estimatedMinutes: 60,
    status: "not_started",
    source: "syllabus",
    needsReview: true,
    duplicateOf: "marketing-eng-reading",
    confidence: 0.62,
    progress: 0
  },
  {
    id: "marketing-art-sketchbook",
    courseId: "marketing-studio-art",
    title: "Sketchbook Review",
    kind: "project",
    dueAt: "2026-06-04T15:00:00",
    tags: ["sketchbook"],
    priority: "low",
    estimatedMinutes: 55,
    status: "done",
    source: "manual",
    progress: 1,
    gradeWeight: 6
  }
];

export const marketingCaptureGradeItems: GradeItem[] = [
  {
    id: "marketing-calc-ch3-test",
    courseId: "marketing-calculus",
    categoryId: "marketing-calc-homework",
    title: "Limits Test",
    earned: 91,
    possible: 100
  },
  {
    id: "marketing-ochem-lab-score",
    courseId: "marketing-organic-chemistry",
    categoryId: "marketing-ochem-labs",
    title: "Lab Practical",
    earned: 88,
    possible: 100
  },
  {
    id: "marketing-phys-lab-score",
    courseId: "marketing-physics-201",
    categoryId: "marketing-phys-labs",
    title: "Motion Lab",
    earned: 45,
    possible: 50
  }
];

export const marketingCaptureParseResult: SyllabusParseResult = {
  sourceName: "alex-kim-spring-syllabus.pdf",
  semesterName: marketingCaptureSemester.name,
  semesterStartDate: marketingCaptureSemester.startDate,
  semesterEndDate: marketingCaptureSemester.endDate,
  courses: marketingCaptureCourses,
  assignments: marketingCaptureAssignments,
  gradeItems: marketingCaptureGradeItems,
  findings: [
    {
      id: "marketing-review-before-apply",
      severity: "needs_review",
      message: "Review detected courses and dates before applying them."
    },
    {
      id: "marketing-deadlines-found",
      severity: "info",
      message: "Found 6 syllabus deadlines."
    },
    {
      id: "marketing-grade-weights-found",
      severity: "info",
      message: "Found grade weights for 6 courses."
    }
  ]
};

type MarketingCaptureLocalePack = {
  semesterName: string;
  sourceName: string;
  courses: Record<string, Partial<Course>>;
  assignments: Record<string, Partial<Assignment>>;
  gradeItems: Record<string, Partial<GradeItem>>;
  findings: SyllabusParseResult["findings"];
};

type MarketingCaptureData = {
  semester: Semester;
  courses: Course[];
  assignments: Assignment[];
  gradeItems: GradeItem[];
  parseResult: SyllabusParseResult;
};

const marketingCaptureLocalePacks: Record<string, MarketingCaptureLocalePack> = {
  es: {
    semesterName: "Primavera 2026",
    sourceName: "plan-de-curso-primavera-alex-kim.pdf",
    courses: {
      "marketing-calculus": { code: "Cálculo", name: "Cálculo I" },
      "marketing-organic-chemistry": { code: "Química orgánica", name: "Química orgánica" },
      "marketing-physics-201": { code: "Física 201", name: "Física 201" },
      "marketing-world-history": { code: "Historia mundial", name: "Historia mundial" },
      "marketing-biology": { code: "Biología", name: "Biología" },
      "marketing-studio-art": { code: "Arte", name: "Arte de estudio" }
    },
    assignments: {
      "marketing-calc-problem-set": { title: "Hoja de problemas de cálculo", tags: ["problemas", "cálculo"] },
      "marketing-ochem-midterm": { title: "Examen parcial de química orgánica", tags: ["examen", "parcial"] },
      "marketing-physics-preview": { title: "Preparación del laboratorio de física", tags: ["lectura", "notas"] },
      "marketing-history-essay": { title: "Borrador del ensayo", tags: ["ensayo", "borrador"] },
      "marketing-bio-cell-quiz": { title: "Prueba de células", tags: ["prueba", "fecha pendiente"] },
      "marketing-art-sketchbook": { title: "Revisión del cuaderno de bocetos", tags: ["bocetos"] }
    },
    gradeItems: {
      "marketing-calc-ch3-test": { title: "Prueba de límites" },
      "marketing-ochem-lab-score": { title: "Práctica de laboratorio" },
      "marketing-phys-lab-score": { title: "Laboratorio de movimiento" }
    },
    findings: [
      { id: "marketing-review-before-apply", severity: "needs_review", message: "Revisa cursos y fechas antes de aplicarlos." },
      { id: "marketing-deadlines-found", severity: "info", message: "Se encontraron 6 fechas del plan." },
      { id: "marketing-grade-weights-found", severity: "info", message: "Se encontraron ponderaciones para 6 clases." }
    ]
  },
  fr: {
    semesterName: "Printemps 2026",
    sourceName: "programme-printemps-alex-kim.pdf",
    courses: {
      "marketing-calculus": { code: "Calcul", name: "Calcul I" },
      "marketing-organic-chemistry": { code: "Chimie organique", name: "Chimie organique" },
      "marketing-physics-201": { code: "Physique 201", name: "Physique 201" },
      "marketing-world-history": { code: "Histoire mondiale", name: "Histoire mondiale" },
      "marketing-biology": { code: "Biologie", name: "Biologie" },
      "marketing-studio-art": { code: "Arts", name: "Atelier d'art" }
    },
    assignments: {
      "marketing-calc-problem-set": { title: "Série d'exercices de calcul", tags: ["exercices", "calcul"] },
      "marketing-ochem-midterm": { title: "Partiel de chimie organique", tags: ["examen", "partiel"] },
      "marketing-physics-preview": { title: "Préparation du labo de physique", tags: ["lecture", "notes"] },
      "marketing-history-essay": { title: "Brouillon de dissertation", tags: ["dissertation", "brouillon"] },
      "marketing-bio-cell-quiz": { title: "Quiz sur les cellules", tags: ["quiz", "date à vérifier"] },
      "marketing-art-sketchbook": { title: "Revue du carnet de croquis", tags: ["croquis"] }
    },
    gradeItems: {
      "marketing-calc-ch3-test": { title: "Test sur les limites" },
      "marketing-ochem-lab-score": { title: "Épreuve de laboratoire" },
      "marketing-phys-lab-score": { title: "Labo sur le mouvement" }
    },
    findings: [
      { id: "marketing-review-before-apply", severity: "needs_review", message: "Vérifiez les cours et les dates avant de les appliquer." },
      { id: "marketing-deadlines-found", severity: "info", message: "6 échéances du programme trouvées." },
      { id: "marketing-grade-weights-found", severity: "info", message: "Pondérations trouvées pour 6 cours." }
    ]
  },
  de: {
    semesterName: "Frühjahr 2026",
    sourceName: "kursplan-fruehjahr-alex-kim.pdf",
    courses: {
      "marketing-calculus": { code: "Analysis", name: "Analysis I" },
      "marketing-organic-chemistry": { code: "Organische Chemie", name: "Organische Chemie" },
      "marketing-physics-201": { code: "Physik 201", name: "Physik 201" },
      "marketing-world-history": { code: "Weltgeschichte", name: "Weltgeschichte" },
      "marketing-biology": { code: "Biologie", name: "Biologie" },
      "marketing-studio-art": { code: "Kunst", name: "Atelierkunst" }
    },
    assignments: {
      "marketing-calc-problem-set": { title: "Analysis-Aufgabensatz", tags: ["aufgaben", "analysis"] },
      "marketing-ochem-midterm": { title: "Zwischenprüfung Organische Chemie", tags: ["prüfung", "zwischenprüfung"] },
      "marketing-physics-preview": { title: "Physik-Laborvorbereitung", tags: ["lektüre", "notizen"] },
      "marketing-history-essay": { title: "Essay-Entwurf", tags: ["essay", "entwurf"] },
      "marketing-bio-cell-quiz": { title: "Zell-Quiz", tags: ["quiz", "datum fehlt"] },
      "marketing-art-sketchbook": { title: "Skizzenbuch-Besprechung", tags: ["skizzenbuch"] }
    },
    gradeItems: {
      "marketing-calc-ch3-test": { title: "Grenzwerttest" },
      "marketing-ochem-lab-score": { title: "Laborprüfung" },
      "marketing-phys-lab-score": { title: "Bewegungslabor" }
    },
    findings: [
      { id: "marketing-review-before-apply", severity: "needs_review", message: "Kurse und Termine vor dem Übernehmen prüfen." },
      { id: "marketing-deadlines-found", severity: "info", message: "6 Fristen im Kursplan gefunden." },
      { id: "marketing-grade-weights-found", severity: "info", message: "Bewertungsgewichte für 6 Kurse gefunden." }
    ]
  },
  "pt-BR": {
    semesterName: "Primavera 2026",
    sourceName: "plano-de-curso-primavera-alex-kim.pdf",
    courses: {
      "marketing-calculus": { code: "Cálculo", name: "Cálculo I" },
      "marketing-organic-chemistry": { code: "Química orgânica", name: "Química orgânica" },
      "marketing-physics-201": { code: "Física 201", name: "Física 201" },
      "marketing-world-history": { code: "História mundial", name: "História mundial" },
      "marketing-biology": { code: "Biologia", name: "Biologia" },
      "marketing-studio-art": { code: "Arte", name: "Ateliê de arte" }
    },
    assignments: {
      "marketing-calc-problem-set": { title: "Lista de exercícios de cálculo", tags: ["exercícios", "cálculo"] },
      "marketing-ochem-midterm": { title: "Prova parcial de química orgânica", tags: ["prova", "parcial"] },
      "marketing-physics-preview": { title: "Preparação do laboratório de física", tags: ["leitura", "notas"] },
      "marketing-history-essay": { title: "Rascunho da redação", tags: ["redação", "rascunho"] },
      "marketing-bio-cell-quiz": { title: "Questionário sobre células", tags: ["questionário", "data pendente"] },
      "marketing-art-sketchbook": { title: "Revisão do caderno de esboços", tags: ["esboços"] }
    },
    gradeItems: {
      "marketing-calc-ch3-test": { title: "Teste de limites" },
      "marketing-ochem-lab-score": { title: "Prática de laboratório" },
      "marketing-phys-lab-score": { title: "Laboratório de movimento" }
    },
    findings: [
      { id: "marketing-review-before-apply", severity: "needs_review", message: "Revise cursos e datas antes de aplicar." },
      { id: "marketing-deadlines-found", severity: "info", message: "6 prazos encontrados no plano." },
      { id: "marketing-grade-weights-found", severity: "info", message: "Pesos de nota encontrados para 6 matérias." }
    ]
  },
  ja: {
    semesterName: "2026年春学期",
    sourceName: "アレックス春学期シラバス.pdf",
    courses: {
      "marketing-calculus": { code: "微積分", name: "微積分I" },
      "marketing-organic-chemistry": { code: "有機化学", name: "有機化学" },
      "marketing-physics-201": { code: "物理201", name: "物理201" },
      "marketing-world-history": { code: "世界史", name: "世界史" },
      "marketing-biology": { code: "生物", name: "生物" },
      "marketing-studio-art": { code: "美術", name: "美術実習" }
    },
    assignments: {
      "marketing-calc-problem-set": { title: "微積分問題演習", tags: ["問題演習", "微積分"] },
      "marketing-ochem-midterm": { title: "有機化学中間試験", tags: ["試験", "中間"] },
      "marketing-physics-preview": { title: "物理実験の予習", tags: ["読書", "ノート"] },
      "marketing-history-essay": { title: "小論文下書き", tags: ["小論文", "下書き"] },
      "marketing-bio-cell-quiz": { title: "細胞クイズ", tags: ["クイズ", "日付確認"] },
      "marketing-art-sketchbook": { title: "スケッチ帳確認", tags: ["スケッチ"] }
    },
    gradeItems: {
      "marketing-calc-ch3-test": { title: "極限テスト" },
      "marketing-ochem-lab-score": { title: "実験実技" },
      "marketing-phys-lab-score": { title: "運動実験" }
    },
    findings: [
      { id: "marketing-review-before-apply", severity: "needs_review", message: "追加前に授業と日付を確認してください。" },
      { id: "marketing-deadlines-found", severity: "info", message: "シラバスから6件の締切を検出しました。" },
      { id: "marketing-grade-weights-found", severity: "info", message: "6科目の評価配分を検出しました。" }
    ]
  },
  ko: {
    semesterName: "2026년 봄학기",
    sourceName: "알렉스-봄학기-강의계획서.pdf",
    courses: {
      "marketing-calculus": { code: "미적분", name: "미적분 I" },
      "marketing-organic-chemistry": { code: "유기화학", name: "유기화학" },
      "marketing-physics-201": { code: "물리 201", name: "물리 201" },
      "marketing-world-history": { code: "세계사", name: "세계사" },
      "marketing-biology": { code: "생물", name: "생물" },
      "marketing-studio-art": { code: "미술", name: "스튜디오 미술" }
    },
    assignments: {
      "marketing-calc-problem-set": { title: "미적분 문제 세트", tags: ["문제", "미적분"] },
      "marketing-ochem-midterm": { title: "유기화학 중간고사", tags: ["시험", "중간"] },
      "marketing-physics-preview": { title: "물리 실험 예습", tags: ["읽기", "노트"] },
      "marketing-history-essay": { title: "에세이 초안", tags: ["에세이", "초안"] },
      "marketing-bio-cell-quiz": { title: "세포 퀴즈", tags: ["퀴즈", "날짜 확인"] },
      "marketing-art-sketchbook": { title: "스케치북 검토", tags: ["스케치"] }
    },
    gradeItems: {
      "marketing-calc-ch3-test": { title: "극한 시험" },
      "marketing-ochem-lab-score": { title: "실험 평가" },
      "marketing-phys-lab-score": { title: "운동 실험" }
    },
    findings: [
      { id: "marketing-review-before-apply", severity: "needs_review", message: "적용하기 전에 과목과 날짜를 확인하세요." },
      { id: "marketing-deadlines-found", severity: "info", message: "강의계획서 마감일 6개를 찾았습니다." },
      { id: "marketing-grade-weights-found", severity: "info", message: "6개 과목의 성적 비중을 찾았습니다." }
    ]
  },
  "zh-Hans": {
    semesterName: "2026年春季学期",
    sourceName: "亚历克斯春季课程大纲.pdf",
    courses: {
      "marketing-calculus": { code: "微积分", name: "微积分 I" },
      "marketing-organic-chemistry": { code: "有机化学", name: "有机化学" },
      "marketing-physics-201": { code: "物理 201", name: "物理 201" },
      "marketing-world-history": { code: "世界史", name: "世界史" },
      "marketing-biology": { code: "生物", name: "生物" },
      "marketing-studio-art": { code: "美术", name: "美术工作室" }
    },
    assignments: {
      "marketing-calc-problem-set": { title: "微积分习题集", tags: ["习题", "微积分"] },
      "marketing-ochem-midterm": { title: "有机化学期中考试", tags: ["考试", "期中"] },
      "marketing-physics-preview": { title: "物理实验预习", tags: ["阅读", "笔记"] },
      "marketing-history-essay": { title: "论文草稿", tags: ["论文", "草稿"] },
      "marketing-bio-cell-quiz": { title: "细胞小测", tags: ["小测", "日期待定"] },
      "marketing-art-sketchbook": { title: "速写本检查", tags: ["速写"] }
    },
    gradeItems: {
      "marketing-calc-ch3-test": { title: "极限测试" },
      "marketing-ochem-lab-score": { title: "实验操作" },
      "marketing-phys-lab-score": { title: "运动实验" }
    },
    findings: [
      { id: "marketing-review-before-apply", severity: "needs_review", message: "应用前请检查课程和日期。" },
      { id: "marketing-deadlines-found", severity: "info", message: "找到6个课程大纲截止日期。" },
      { id: "marketing-grade-weights-found", severity: "info", message: "找到6门课的成绩权重。" }
    ]
  },
  ar: {
    semesterName: "ربيع 2026",
    sourceName: "خطة-ربيع-أليكس-كيم.pdf",
    courses: {
      "marketing-calculus": { code: "تفاضل", name: "تفاضل I" },
      "marketing-organic-chemistry": { code: "كيمياء عضوية", name: "كيمياء عضوية" },
      "marketing-physics-201": { code: "فيزياء 201", name: "فيزياء 201" },
      "marketing-world-history": { code: "تاريخ عالمي", name: "تاريخ عالمي" },
      "marketing-biology": { code: "أحياء", name: "أحياء" },
      "marketing-studio-art": { code: "فن", name: "فن مرسم" }
    },
    assignments: {
      "marketing-calc-problem-set": { title: "تمارين التفاضل", tags: ["تمارين", "تفاضل"] },
      "marketing-ochem-midterm": { title: "اختبار الكيمياء العضوية النصفي", tags: ["اختبار", "نصفي"] },
      "marketing-physics-preview": { title: "تحضير مختبر الفيزياء", tags: ["قراءة", "ملاحظات"] },
      "marketing-history-essay": { title: "مسودة المقال", tags: ["مقال", "مسودة"] },
      "marketing-bio-cell-quiz": { title: "اختبار الخلايا", tags: ["اختبار قصير", "تاريخ ناقص"] },
      "marketing-art-sketchbook": { title: "مراجعة دفتر الرسم", tags: ["رسم"] }
    },
    gradeItems: {
      "marketing-calc-ch3-test": { title: "اختبار النهايات" },
      "marketing-ochem-lab-score": { title: "تطبيق المختبر" },
      "marketing-phys-lab-score": { title: "مختبر الحركة" }
    },
    findings: [
      { id: "marketing-review-before-apply", severity: "needs_review", message: "راجع الصفوف والتواريخ قبل التطبيق." },
      { id: "marketing-deadlines-found", severity: "info", message: "تم العثور على 6 مواعيد من الخطة." },
      { id: "marketing-grade-weights-found", severity: "info", message: "تم العثور على أوزان درجات لـ 6 مواد." }
    ]
  },
  hi: {
    semesterName: "वसंत 2026",
    sourceName: "एलेक्स-वसंत-पाठ्यक्रम.pdf",
    courses: {
      "marketing-calculus": { code: "कलन", name: "कलन I" },
      "marketing-organic-chemistry": { code: "कार्बनिक रसायन", name: "कार्बनिक रसायन" },
      "marketing-physics-201": { code: "भौतिकी 201", name: "भौतिकी 201" },
      "marketing-world-history": { code: "विश्व इतिहास", name: "विश्व इतिहास" },
      "marketing-biology": { code: "जीवविज्ञान", name: "जीवविज्ञान" },
      "marketing-studio-art": { code: "कला", name: "स्टूडियो कला" }
    },
    assignments: {
      "marketing-calc-problem-set": { title: "कलन समस्या सेट", tags: ["समस्याएँ", "कलन"] },
      "marketing-ochem-midterm": { title: "कार्बनिक रसायन मध्यावधि", tags: ["परीक्षा", "मध्यावधि"] },
      "marketing-physics-preview": { title: "भौतिकी प्रयोगशाला तैयारी", tags: ["पठन", "नोट्स"] },
      "marketing-history-essay": { title: "निबंध मसौदा", tags: ["निबंध", "मसौदा"] },
      "marketing-bio-cell-quiz": { title: "कोशिका प्रश्नोत्तरी", tags: ["प्रश्नोत्तरी", "तिथि चाहिए"] },
      "marketing-art-sketchbook": { title: "स्केचबुक समीक्षा", tags: ["स्केच"] }
    },
    gradeItems: {
      "marketing-calc-ch3-test": { title: "सीमा परीक्षण" },
      "marketing-ochem-lab-score": { title: "प्रयोगशाला अभ्यास" },
      "marketing-phys-lab-score": { title: "गति प्रयोगशाला" }
    },
    findings: [
      { id: "marketing-review-before-apply", severity: "needs_review", message: "लागू करने से पहले कक्षाएँ और तिथियाँ जाँचें।" },
      { id: "marketing-deadlines-found", severity: "info", message: "पाठ्यक्रम से 6 समय-सीमाएँ मिलीं।" },
      { id: "marketing-grade-weights-found", severity: "info", message: "6 कक्षाओं के ग्रेड वज़न मिले।" }
    ]
  }
};

export function getMarketingCaptureData(locale?: string): MarketingCaptureData {
  const pack = marketingCaptureLocalePacks[normalizeMarketingCaptureLocale(locale)];
  if (!pack) {
    return {
      semester: marketingCaptureSemester,
      courses: marketingCaptureCourses,
      assignments: marketingCaptureAssignments,
      gradeItems: marketingCaptureGradeItems,
      parseResult: marketingCaptureParseResult
    };
  }

  const courses = marketingCaptureCourses.map((course) => ({
    ...course,
    ...(pack.courses[course.id] || {})
  }));
  const assignments = marketingCaptureAssignments.map((assignment) => ({
    ...assignment,
    ...(pack.assignments[assignment.id] || {})
  }));
  const gradeItems = marketingCaptureGradeItems.map((item) => ({
    ...item,
    ...(pack.gradeItems[item.id] || {})
  }));
  const semester = { ...marketingCaptureSemester, name: pack.semesterName };
  const parseResult = {
    ...marketingCaptureParseResult,
    sourceName: pack.sourceName,
    semesterName: pack.semesterName,
    courses,
    assignments,
    gradeItems,
    findings: pack.findings
  };

  return { semester, courses, assignments, gradeItems, parseResult };
}

export function getMarketingCaptureParseResult(locale?: string) {
  return getMarketingCaptureData(locale).parseResult;
}

export function getMarketingCaptureInitialTab(): NavTab {
  if (marketingCaptureEnabled && isNavTab(initialTab)) return initialTab;

  return marketingCaptureScreen === "processing" ||
    marketingCaptureScreen === "extracted" ||
    marketingCaptureScreen === "review_edit"
    ? "import"
    : "today";
}

function normalizeMarketingCaptureLocale(locale?: string) {
  if (!locale) return "en-US";
  if (locale === "pt-BR" || locale.toLowerCase().startsWith("pt")) return "pt-BR";
  if (locale === "zh-Hans" || locale.toLowerCase().startsWith("zh")) return "zh-Hans";
  return locale.split("-")[0] || locale;
}

export function getMarketingCaptureScrollY() {
  if (marketingCaptureScreen === "extracted") return 520;
  if (marketingCaptureScreen === "review_edit") return 920;
  if (marketingCaptureScreen === "agenda") return 560;
  return 0;
}

function isNavTab(value: string | undefined): value is NavTab {
  return (
    value === "today" ||
    value === "import" ||
    value === "plan" ||
    value === "courses" ||
    value === "more" ||
    value === "focus" ||
    value === "grades" ||
    value === "subscribe"
  );
}

function isMarketingCaptureScreen(value: string | undefined): value is MarketingCaptureScreen {
  return (
    value === "processing" ||
    value === "extracted" ||
    value === "review_edit" ||
    value === "agenda"
  );
}
