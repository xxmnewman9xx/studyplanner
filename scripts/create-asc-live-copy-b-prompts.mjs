#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const STORE_CONFIG_PATH = "store.config.json";
const OUTPUT_JSON_PATH = "qa/back-to-school-2026/asc-live-copy-b-gpt-image-2-prompts.json";
const OUTPUT_JSONL_PATH = "qa/back-to-school-2026/asc-live-copy-b-gpt-image-2-prompts.jsonl";
const OUTPUT_RUNBOOK_PATH = "docs/launch/back-to-school-2026/asc-live-copy-b-gpt-image-2-runbook.md";
const OUTPUT_RESEARCH_PATH = "docs/launch/back-to-school-2026/max-impact-spotlight-research-cycle.md";

const generatedAt = "2026-07-07";
const release = "Back-to-School Semester Kickoff";

const slides = [
  {
    slideIndex: 1,
    slideFile: "01-scan-syllabus.png",
    title: "First week already sorted",
    hypothesis:
      "Lead with August setup intent: import the syllabus, review deadlines, and know the first next move before school ramps.",
    lockedSurface: "phone app UI",
  },
  {
    slideIndex: 2,
    slideFile: "02-semester-health.png",
    title: "Never miss what matters",
    hypothesis:
      "Show the outcome students search for: deadlines, exams, and today in one calm view.",
    lockedSurface: "phone app UI",
  },
  {
    slideIndex: 3,
    slideFile: "03-plan-autopilot.png",
    title: "Homework has a time",
    hypothesis:
      "Make the strongest conversion promise concrete: due dates become scheduled study blocks.",
    lockedSurface: "phone app UI",
  },
  {
    slideIndex: 4,
    slideFile: "04-manage-semester.png",
    title: "School week command center",
    hypothesis:
      "Differentiate from timetable-only apps by showing classes, tasks, reminders, and notes moving together.",
    lockedSurface: "phone app UI",
  },
  {
    slideIndex: 5,
    slideFile: "05-class-detail.png",
    title: "Every class under control",
    hypothesis:
      "Reduce comparison friction against homework/grade planners by proving course-level organization.",
    lockedSurface: "phone app UI",
  },
  {
    slideIndex: 6,
    slideFile: "06-notes.png",
    title: "Notes become next steps",
    hypothesis:
      "Move beyond storage: show notes becoming study tasks and review actions.",
    lockedSurface: "phone app UI",
  },
  {
    slideIndex: 7,
    slideFile: "07-real-home-screen-widgets.png",
    title: "Backpack Home Screen",
    hypothesis:
      "Make the always-visible WidgetKit proof feel like daily student utility, not a generic widget claim.",
    lockedSurface: "real Home Screen and WidgetKit pixels",
  },
];

const copyByLocale = {
  "en-US": [
    {
      headline: "Start school already organized.",
      subheadline: "From syllabus to first-week plan.",
      support: "Import once. Review every deadline. Know tonight's next move.",
      benefits: [
        ["Import syllabus", "Start from real class material"],
        ["Review deadlines", "Nothing saves until you confirm"],
        ["Plan study blocks", "Turn due dates into time"],
        ["See what's next", "Stay ready before week two"],
      ],
    },
    {
      headline: "Never miss what matters.",
      subheadline: "Today, deadlines, and exams in one view.",
      support: "See the schoolwork that needs attention before it gets urgent.",
    },
    {
      headline: "Your homework has a time.",
      subheadline: "Turn due dates into study blocks.",
      support: "Plan the work before Sunday night becomes a scramble.",
    },
    {
      headline: "Your school week, connected.",
      subheadline: "Classes, tasks, reminders, and notes stay together.",
      support: "Manage the moving pieces without rebuilding your planner.",
    },
    {
      headline: "Know what each class needs.",
      subheadline: "Assignments, exams, notes, and progress together.",
      support: "Open one course and see the work that actually matters.",
    },
    {
      headline: "Turn notes into next steps.",
      subheadline: "Capture ideas. Make review tasks. Stay ready.",
      support: "Keep study material connected to the plan.",
    },
    {
      headline: "School day answers, on Home Screen.",
      subheadline: "Real widgets show what is next before you open the app.",
      support: "Today, class progress, and the week ahead stay visible.",
    },
  ],
  "en-GB": [
    {
      headline: "Start term already organised.",
      subheadline: "From syllabus to first-week plan.",
      support: "Import once. Review every deadline. Know tonight's next move.",
      benefits: [
        ["Import syllabus", "Start from real course material"],
        ["Review deadlines", "Nothing saves until you confirm"],
        ["Plan study blocks", "Turn due dates into time"],
        ["See what's next", "Stay ready before week two"],
      ],
    },
    {
      headline: "Never miss what matters.",
      subheadline: "Today, deadlines, and exams in one view.",
      support: "See the coursework that needs attention before it gets urgent.",
    },
    {
      headline: "Your homework has a time.",
      subheadline: "Turn due dates into study blocks.",
      support: "Plan the work before Sunday night becomes a scramble.",
    },
    {
      headline: "Your school week, connected.",
      subheadline: "Classes, tasks, reminders, and notes stay together.",
      support: "Manage the moving pieces without rebuilding your planner.",
    },
    {
      headline: "Know what each class needs.",
      subheadline: "Assignments, exams, notes, and progress together.",
      support: "Open one course and see the work that actually matters.",
    },
    {
      headline: "Turn notes into next steps.",
      subheadline: "Capture ideas. Make revision tasks. Stay ready.",
      support: "Keep study material connected to the plan.",
    },
    {
      headline: "School day answers, on Home Screen.",
      subheadline: "Real widgets show what is next before you open the app.",
      support: "Today, class progress, and the week ahead stay visible.",
    },
  ],
  "en-AU": [
    {
      headline: "Start term already organised.",
      subheadline: "From syllabus to first-week plan.",
      support: "Import once. Review every deadline. Know tonight's next move.",
      benefits: [
        ["Import syllabus", "Start from real class material"],
        ["Review deadlines", "Nothing saves until you confirm"],
        ["Plan study blocks", "Turn due dates into time"],
        ["See what's next", "Stay ready before week two"],
      ],
    },
    {
      headline: "Never miss what matters.",
      subheadline: "Today, deadlines, and exams in one view.",
      support: "See the schoolwork that needs attention before it gets urgent.",
    },
    {
      headline: "Your homework has a time.",
      subheadline: "Turn due dates into study blocks.",
      support: "Plan the work before Sunday night becomes a scramble.",
    },
    {
      headline: "Your school week, connected.",
      subheadline: "Classes, tasks, reminders, and notes stay together.",
      support: "Manage the moving pieces without rebuilding your planner.",
    },
    {
      headline: "Know what each class needs.",
      subheadline: "Assignments, exams, notes, and progress together.",
      support: "Open one course and see the work that actually matters.",
    },
    {
      headline: "Turn notes into next steps.",
      subheadline: "Capture ideas. Make review tasks. Stay ready.",
      support: "Keep study material connected to the plan.",
    },
    {
      headline: "School day answers, on Home Screen.",
      subheadline: "Real widgets show what is next before you open the app.",
      support: "Today, class progress, and the week ahead stay visible.",
    },
  ],
  "en-CA": [
    {
      headline: "Start term already organized.",
      subheadline: "From course outline to first-week plan.",
      support: "Import once. Review every deadline. Know tonight's next move.",
      benefits: [
        ["Import outline", "Start from real class material"],
        ["Review deadlines", "Nothing saves until you confirm"],
        ["Plan study blocks", "Turn due dates into time"],
        ["See what's next", "Stay ready before week two"],
      ],
    },
    {
      headline: "Never miss what matters.",
      subheadline: "Today, deadlines, and exams in one view.",
      support: "See the coursework that needs attention before it gets urgent.",
    },
    {
      headline: "Your homework has a time.",
      subheadline: "Turn due dates into study blocks.",
      support: "Plan the work before Sunday night becomes a scramble.",
    },
    {
      headline: "Your school week, connected.",
      subheadline: "Classes, tasks, reminders, and notes stay together.",
      support: "Manage the moving pieces without rebuilding your planner.",
    },
    {
      headline: "Know what each class needs.",
      subheadline: "Assignments, exams, notes, and progress together.",
      support: "Open one course and see the work that actually matters.",
    },
    {
      headline: "Turn notes into next steps.",
      subheadline: "Capture ideas. Make review tasks. Stay ready.",
      support: "Keep study material connected to the plan.",
    },
    {
      headline: "School day answers, on Home Screen.",
      subheadline: "Real widgets show what is next before you open the app.",
      support: "Today, class progress, and the week ahead stay visible.",
    },
  ],
  "de-DE": [
    {
      headline: "Starte organisiert ins Semester.",
      subheadline: "Vom Kursplan zum Plan für Woche eins.",
      support: "Einmal importieren. Jede Frist prüfen. Den nächsten Schritt kennen.",
      benefits: [
        ["Kursplan importieren", "Mit echtem Stoff starten"],
        ["Fristen prüfen", "Nichts speichert ohne Bestätigung"],
        ["Lernzeiten planen", "Aus Fristen wird Zeit"],
        ["Nächsten Schritt sehen", "Vor Woche zwei bereit bleiben"],
      ],
    },
    {
      headline: "Verpasse nicht, was zählt.",
      subheadline: "Heute, Fristen und Prüfungen in einer Ansicht.",
      support: "Sieh, was Aufmerksamkeit braucht, bevor es dringend wird.",
    },
    {
      headline: "Hausaufgaben bekommen Zeit.",
      subheadline: "Mach aus Abgaben klare Lernblöcke.",
      support: "Plane die Arbeit, bevor Sonntagabend stressig wird.",
    },
    {
      headline: "Deine Schulwoche bleibt verbunden.",
      subheadline: "Kurse, Aufgaben, Erinnerungen und Notizen zusammen.",
      support: "Behalte alle Teile im Griff, ohne neu zu planen.",
    },
    {
      headline: "Wisse, was jeder Kurs braucht.",
      subheadline: "Aufgaben, Prüfungen, Notizen und Fortschritt zusammen.",
      support: "Öffne einen Kurs und sieh, was wirklich zählt.",
    },
    {
      headline: "Notizen werden nächste Schritte.",
      subheadline: "Ideen erfassen. Wiederholung planen. Bereit bleiben.",
      support: "Lernstoff bleibt mit deinem Plan verbunden.",
    },
    {
      headline: "Schultag-Antworten auf dem Home-Bildschirm.",
      subheadline: "Echte Widgets zeigen, was als Nächstes kommt.",
      support: "Heute, Kursfortschritt und die Woche bleiben sichtbar.",
    },
  ],
  "es-ES": [
    {
      headline: "Empieza el curso ya organizado.",
      subheadline: "De guía docente a plan de primera semana.",
      support: "Importa una vez. Revisa cada fecha. Sabe qué toca esta noche.",
      benefits: [
        ["Importa la guía", "Empieza con material real"],
        ["Revisa fechas", "Nada se guarda sin confirmar"],
        ["Planifica estudio", "Convierte entregas en tiempo"],
        ["Ve qué sigue", "Llega listo a la semana dos"],
      ],
    },
    {
      headline: "No pierdas lo importante.",
      subheadline: "Hoy, entregas y exámenes en una vista.",
      support: "Ve qué necesita atención antes de que sea urgente.",
    },
    {
      headline: "Tus deberes tienen hora.",
      subheadline: "Convierte entregas en bloques de estudio.",
      support: "Planifica antes de que el domingo por la noche pese.",
    },
    {
      headline: "Tu semana de clase, conectada.",
      subheadline: "Clases, tareas, recordatorios y notas juntos.",
      support: "Gestiona todo sin rehacer tu planificador.",
    },
    {
      headline: "Ve qué necesita cada clase.",
      subheadline: "Tareas, exámenes, notas y progreso juntos.",
      support: "Abre una clase y ve lo que de verdad importa.",
    },
    {
      headline: "Tus notas pasan a pasos.",
      subheadline: "Captura ideas. Crea repaso. Llega preparado.",
      support: "Mantén el material unido al plan.",
    },
    {
      headline: "Respuestas del día en Inicio.",
      subheadline: "Widgets reales muestran qué sigue antes de abrir la app.",
      support: "Hoy, progreso y semana siempre visibles.",
    },
  ],
  "es-MX": [
    {
      headline: "Empieza clases ya organizado.",
      subheadline: "Del temario al plan de primera semana.",
      support: "Importa una vez. Revisa cada fecha. Sabe qué toca esta noche.",
      benefits: [
        ["Importa el temario", "Empieza con material real"],
        ["Revisa fechas", "Nada se guarda sin confirmar"],
        ["Planea estudio", "Convierte entregas en tiempo"],
        ["Ve qué sigue", "Llega listo a la semana dos"],
      ],
    },
    {
      headline: "No pierdas lo importante.",
      subheadline: "Hoy, entregas y exámenes en una vista.",
      support: "Ve qué necesita atención antes de que sea urgente.",
    },
    {
      headline: "Tu tarea tiene hora.",
      subheadline: "Convierte entregas en bloques de estudio.",
      support: "Planea antes de que el domingo por la noche pese.",
    },
    {
      headline: "Tu semana escolar, conectada.",
      subheadline: "Clases, tareas, recordatorios y notas juntos.",
      support: "Maneja todo sin rehacer tu planner.",
    },
    {
      headline: "Ve qué necesita cada clase.",
      subheadline: "Tareas, exámenes, notas y progreso juntos.",
      support: "Abre una clase y ve lo que de verdad importa.",
    },
    {
      headline: "Tus notas pasan a pasos.",
      subheadline: "Captura ideas. Crea repaso. Llega preparado.",
      support: "Mantén el material unido al plan.",
    },
    {
      headline: "Respuestas del día en Inicio.",
      subheadline: "Widgets reales muestran qué sigue antes de abrir la app.",
      support: "Hoy, progreso y semana siempre visibles.",
    },
  ],
  "fr-FR": [
    {
      headline: "Commence la rentrée l'esprit clair.",
      subheadline: "Du syllabus au plan de première semaine.",
      support: "Importe une fois. Vérifie chaque date. Sache quoi faire ce soir.",
      benefits: [
        ["Importe le syllabus", "Pars de vrais supports"],
        ["Vérifie les dates", "Rien ne s'enregistre sans accord"],
        ["Planifie l'étude", "Les échéances deviennent du temps"],
        ["Vois la suite", "Arrive prêt en semaine deux"],
      ],
    },
    {
      headline: "Ne rate plus l'important.",
      subheadline: "Aujourd'hui, échéances et examens en une vue.",
      support: "Vois ce qui demande attention avant l'urgence.",
    },
    {
      headline: "Tes devoirs ont un créneau.",
      subheadline: "Transforme les échéances en sessions d'étude.",
      support: "Planifie avant le stress du dimanche soir.",
    },
    {
      headline: "Ta semaine de cours connectée.",
      subheadline: "Cours, tâches, rappels et notes restent ensemble.",
      support: "Gère les détails sans refaire ton planning.",
    },
    {
      headline: "Vois ce que chaque cours demande.",
      subheadline: "Devoirs, examens, notes et progrès ensemble.",
      support: "Ouvre un cours et vois ce qui compte vraiment.",
    },
    {
      headline: "Les notes deviennent des étapes.",
      subheadline: "Capture les idées. Prépare la révision. Reste prêt.",
      support: "Garde tes supports reliés au plan.",
    },
    {
      headline: "Les réponses du jour sur l'écran d'accueil.",
      subheadline: "De vrais widgets montrent la suite avant l'ouverture.",
      support: "Aujourd'hui, progrès et semaine restent visibles.",
    },
  ],
  "fr-CA": [
    {
      headline: "Commence la session bien organisée.",
      subheadline: "Du plan de cours au plan de première semaine.",
      support: "Importe une fois. Vérifie chaque date. Sache quoi faire ce soir.",
      benefits: [
        ["Importe le plan", "Pars de vrais contenus de cours"],
        ["Vérifie les dates", "Rien ne s'enregistre sans accord"],
        ["Planifie l'étude", "Les échéances deviennent du temps"],
        ["Vois la suite", "Arrive prêt en semaine deux"],
      ],
    },
    {
      headline: "Ne manque plus l'important.",
      subheadline: "Aujourd'hui, échéances et examens en une vue.",
      support: "Vois ce qui demande attention avant l'urgence.",
    },
    {
      headline: "Tes travaux ont un créneau.",
      subheadline: "Transforme les échéances en périodes d'étude.",
      support: "Planifie avant le stress du dimanche soir.",
    },
    {
      headline: "Ta semaine de cours connectée.",
      subheadline: "Cours, tâches, rappels et notes restent ensemble.",
      support: "Gère les détails sans refaire ton planificateur.",
    },
    {
      headline: "Vois ce que chaque cours demande.",
      subheadline: "Travaux, examens, notes et progrès ensemble.",
      support: "Ouvre un cours et vois ce qui compte vraiment.",
    },
    {
      headline: "Les notes deviennent des étapes.",
      subheadline: "Capture les idées. Prépare la révision. Reste prêt.",
      support: "Garde tes contenus reliés au plan.",
    },
    {
      headline: "Les réponses du jour sur l'écran d'accueil.",
      subheadline: "De vrais widgets montrent la suite avant l'ouverture.",
      support: "Aujourd'hui, progrès et semaine restent visibles.",
    },
  ],
  "pt-BR": [
    {
      headline: "Comece as aulas com tudo organizado.",
      subheadline: "Da ementa ao plano da primeira semana.",
      support: "Importe uma vez. Revise cada prazo. Saiba o próximo passo de hoje.",
      benefits: [
        ["Importe a ementa", "Comece com material real"],
        ["Revise prazos", "Nada salva sem confirmação"],
        ["Planeje estudos", "Prazos viram tempo"],
        ["Veja o próximo passo", "Chegue pronto à semana dois"],
      ],
    },
    {
      headline: "Não perca o que importa.",
      subheadline: "Hoje, prazos e provas em uma só visão.",
      support: "Veja o que precisa de atenção antes de virar urgência.",
    },
    {
      headline: "Sua tarefa tem horário.",
      subheadline: "Transforme prazos em blocos de estudo.",
      support: "Planeje antes de o domingo à noite virar correria.",
    },
    {
      headline: "Sua semana de aulas conectada.",
      subheadline: "Aulas, tarefas, lembretes e notas juntos.",
      support: "Gerencie tudo sem refazer o planner.",
    },
    {
      headline: "Saiba o que cada aula pede.",
      subheadline: "Tarefas, provas, notas e progresso juntos.",
      support: "Abra uma aula e veja o que realmente importa.",
    },
    {
      headline: "Notas viram próximos passos.",
      subheadline: "Capture ideias. Crie revisão. Fique pronto.",
      support: "Mantenha o material ligado ao plano.",
    },
    {
      headline: "Respostas do dia na Tela de Início.",
      subheadline: "Widgets reais mostram o próximo passo antes de abrir o app.",
      support: "Hoje, progresso e semana sempre visíveis.",
    },
  ],
  "pt-PT": [
    {
      headline: "Começa as aulas com tudo organizado.",
      subheadline: "Do programa ao plano da primeira semana.",
      support: "Importa uma vez. Revê cada prazo. Sabe o próximo passo de hoje.",
      benefits: [
        ["Importa o programa", "Começa com material real"],
        ["Revê prazos", "Nada é guardado sem confirmação"],
        ["Planeia estudo", "Prazos viram tempo"],
        ["Vê o próximo passo", "Chega pronto à semana dois"],
      ],
    },
    {
      headline: "Não percas o que importa.",
      subheadline: "Hoje, prazos e testes numa só vista.",
      support: "Vê o que precisa de atenção antes de virar urgência.",
    },
    {
      headline: "Os trabalhos têm horário.",
      subheadline: "Transforma prazos em blocos de estudo.",
      support: "Planeia antes de o domingo à noite ficar pesado.",
    },
    {
      headline: "A tua semana de aulas ligada.",
      subheadline: "Aulas, tarefas, lembretes e notas juntos.",
      support: "Gere tudo sem refazer o planeador.",
    },
    {
      headline: "Sabe o que cada aula pede.",
      subheadline: "Tarefas, testes, notas e progresso juntos.",
      support: "Abre uma aula e vê o que realmente importa.",
    },
    {
      headline: "Notas viram próximos passos.",
      subheadline: "Captura ideias. Cria revisão. Fica pronto.",
      support: "Mantém o material ligado ao plano.",
    },
    {
      headline: "Respostas do dia no Ecrã principal.",
      subheadline: "Widgets reais mostram o próximo passo antes de abrir a app.",
      support: "Hoje, progresso e semana sempre visíveis.",
    },
  ],
  ja: [
    {
      headline: "新学期を最初から整理。",
      subheadline: "シラバスから1週目の計画へ。",
      support: "一度取り込み、締切を確認し、今夜やることを把握。",
      benefits: [
        ["シラバスを取り込む", "実際の授業資料から開始"],
        ["締切を確認", "確認するまで保存しない"],
        ["学習時間を計画", "締切を時間に変える"],
        ["次を確認", "2週目の前に準備"],
      ],
    },
    {
      headline: "大事な予定を逃さない。",
      subheadline: "今日、締切、試験をひとつの画面で。",
      support: "急ぎになる前に、注意が必要な課題を確認。",
    },
    {
      headline: "宿題に時間を決める。",
      subheadline: "締切を学習ブロックに変える。",
      support: "日曜の夜に慌てる前に計画。",
    },
    {
      headline: "学校の1週間をつなげる。",
      subheadline: "授業、タスク、リマインダー、ノートを一緒に。",
      support: "プランを作り直さずに全体を管理。",
    },
    {
      headline: "各授業で必要なことが分かる。",
      subheadline: "課題、試験、ノート、進捗をまとめて。",
      support: "授業を開けば、本当に大事な作業が見える。",
    },
    {
      headline: "ノートを次の行動へ。",
      subheadline: "アイデアを記録。復習タスクを作成。準備を維持。",
      support: "学習資料を計画につなげておく。",
    },
    {
      headline: "学校の日の答えをホーム画面に。",
      subheadline: "実際のウィジェットで次の予定を確認。",
      support: "今日、進捗、今週の予定を見える状態に。",
    },
  ],
  ko: [
    {
      headline: "새 학기를 이미 정리된 상태로.",
      subheadline: "강의계획서에서 첫 주 계획까지.",
      support: "한 번 가져오고, 모든 마감을 확인하고, 오늘 밤 할 일을 봅니다.",
      benefits: [
        ["강의계획서 가져오기", "실제 수업 자료로 시작"],
        ["마감 확인", "확인 전에는 저장되지 않음"],
        ["공부 블록 계획", "마감을 시간으로 바꾸기"],
        ["다음 일 보기", "둘째 주 전에 준비"],
      ],
    },
    {
      headline: "중요한 일을 놓치지 마세요.",
      subheadline: "오늘, 마감, 시험을 한 화면에서.",
      support: "급해지기 전에 확인이 필요한 과제를 봅니다.",
    },
    {
      headline: "숙제에도 시간이 있습니다.",
      subheadline: "마감을 공부 블록으로 바꾸세요.",
      support: "일요일 밤에 급해지기 전에 계획합니다.",
    },
    {
      headline: "학교 주간이 연결됩니다.",
      subheadline: "수업, 할 일, 알림, 노트가 함께 움직입니다.",
      support: "플래너를 다시 만들지 않고 전체를 관리하세요.",
    },
    {
      headline: "각 수업에 필요한 일을 압니다.",
      subheadline: "과제, 시험, 노트, 진행 상황을 함께.",
      support: "수업을 열고 정말 중요한 일을 확인하세요.",
    },
    {
      headline: "노트가 다음 단계가 됩니다.",
      subheadline: "아이디어를 기록하고 복습 할 일을 만드세요.",
      support: "공부 자료를 계획과 계속 연결합니다.",
    },
    {
      headline: "학교 하루의 답을 홈 화면에.",
      subheadline: "실제 위젯이 앱을 열기 전 다음 일을 보여줍니다.",
      support: "오늘, 수업 진행, 이번 주가 계속 보입니다.",
    },
  ],
  "zh-Hans": [
    {
      headline: "开学前就整理好。",
      subheadline: "从课程大纲到第一周计划。",
      support: "导入一次。检查每个截止日。知道今晚下一步。",
      benefits: [
        ["导入大纲", "从真实课程资料开始"],
        ["检查截止日", "确认前不会保存"],
        ["安排学习时段", "把截止日变成时间"],
        ["查看下一步", "第二周前就准备好"],
      ],
    },
    {
      headline: "不再错过重要事项。",
      subheadline: "今天、截止日和考试放在一处。",
      support: "在变紧急前，看清需要关注的课业。",
    },
    {
      headline: "作业也有具体时间。",
      subheadline: "把截止日变成学习时段。",
      support: "别等到周日晚上才慌张。",
    },
    {
      headline: "你的上课周保持连接。",
      subheadline: "课程、任务、提醒和笔记放在一起。",
      support: "不用重做计划，也能管住所有变化。",
    },
    {
      headline: "看清每门课需要什么。",
      subheadline: "作业、考试、笔记和进度集中查看。",
      support: "打开一门课，就知道真正重要的事。",
    },
    {
      headline: "把笔记变成下一步。",
      subheadline: "记录想法。生成复习任务。保持准备。",
      support: "让学习资料始终连着计划。",
    },
    {
      headline: "开学日答案放在主屏幕。",
      subheadline: "真实小组件在打开应用前显示下一步。",
      support: "今天、课程进度和本周安排持续可见。",
    },
  ],
  "zh-Hant": [
    {
      headline: "開學前就整理好。",
      subheadline: "從課程大綱到第一週計畫。",
      support: "匯入一次。檢查每個截止日。知道今晚下一步。",
      benefits: [
        ["匯入大綱", "從真實課程資料開始"],
        ["檢查截止日", "確認前不會儲存"],
        ["安排讀書時段", "把截止日變成時間"],
        ["查看下一步", "第二週前就準備好"],
      ],
    },
    {
      headline: "不再錯過重要事項。",
      subheadline: "今天、截止日和考試放在一處。",
      support: "在變緊急前，看清需要注意的課業。",
    },
    {
      headline: "作業也有具體時間。",
      subheadline: "把截止日變成讀書時段。",
      support: "別等到週日晚上才慌張。",
    },
    {
      headline: "你的上課週保持連接。",
      subheadline: "課程、任務、提醒和筆記放在一起。",
      support: "不用重做計畫，也能管住所有變化。",
    },
    {
      headline: "看清每門課需要什麼。",
      subheadline: "作業、考試、筆記和進度集中查看。",
      support: "打開一門課，就知道真正重要的事。",
    },
    {
      headline: "把筆記變成下一步。",
      subheadline: "記錄想法。建立複習任務。保持準備。",
      support: "讓學習資料始終連著計畫。",
    },
    {
      headline: "開學日答案放在主畫面。",
      subheadline: "真實小工具在開啟 App 前顯示下一步。",
      support: "今天、課程進度和本週安排持續可見。",
    },
  ],
  hi: [
    {
      headline: "स्कूल शुरू होने से पहले व्यवस्थित रहें।",
      subheadline: "सिलेबस से पहली हफ्ते की योजना तक।",
      support: "एक बार इम्पोर्ट करें। हर तारीख जांचें। आज रात का अगला कदम जानें।",
      benefits: [
        ["सिलेबस इम्पोर्ट", "असली क्लास सामग्री से शुरू"],
        ["तारीखें जांचें", "पुष्टि से पहले कुछ सेव नहीं"],
        ["पढ़ाई समय बनाएं", "डेडलाइन को समय में बदलें"],
        ["अगला कदम देखें", "दूसरे हफ्ते से पहले तैयार"],
      ],
    },
    {
      headline: "ज़रूरी काम न छूटे।",
      subheadline: "आज, समयसीमा और परीक्षा एक जगह।",
      support: "ज़रूरी होने से पहले देखें कि किस पर ध्यान चाहिए।",
    },
    {
      headline: "होमवर्क का भी समय हो।",
      subheadline: "डेडलाइन को पढ़ाई ब्लॉक में बदलें।",
      support: "रविवार रात की घबराहट से पहले योजना बनाएं।",
    },
    {
      headline: "आपका स्कूल सप्ताह जुड़ा रहे।",
      subheadline: "क्लास, कार्य, रिमाइंडर और नोट्स साथ रहें।",
      support: "प्लानर दोबारा बनाए बिना सब संभालें।",
    },
    {
      headline: "हर क्लास की ज़रूरत जानें।",
      subheadline: "कार्य, परीक्षा, नोट्स और प्रगति साथ।",
      support: "एक क्लास खोलें और सच में ज़रूरी काम देखें।",
    },
    {
      headline: "नोट्स से अगला कदम बनाएं।",
      subheadline: "विचार पकड़ें। रिव्यू कार्य बनाएं। तैयार रहें।",
      support: "पढ़ाई सामग्री को योजना से जोड़े रखें।",
    },
    {
      headline: "स्कूल दिन के जवाब होम स्क्रीन पर।",
      subheadline: "असली विजेट ऐप खोलने से पहले अगला कदम दिखाते हैं।",
      support: "आज, क्लास प्रगति और सप्ताह हमेशा दिखें।",
    },
  ],
  "ar-SA": [
    {
      headline: "ابدأ الدراسة وأنت منظم.",
      subheadline: "من المنهج إلى خطة الأسبوع الأول.",
      support: "استورد مرة. راجع كل موعد. اعرف خطوتك التالية الليلة.",
      benefits: [
        ["استورد المنهج", "ابدأ من مادة حقيقية"],
        ["راجع المواعيد", "لا يحفظ شيء قبل التأكيد"],
        ["خطط وقت الدراسة", "حوّل المواعيد إلى وقت"],
        ["اعرف التالي", "كن جاهزًا قبل الأسبوع الثاني"],
      ],
    },
    {
      headline: "لا تفوّت ما يهم.",
      subheadline: "اليوم والمواعيد والاختبارات في عرض واحد.",
      support: "اعرف ما يحتاج انتباهك قبل أن يصبح عاجلًا.",
    },
    {
      headline: "لواجباتك وقت محدد.",
      subheadline: "حوّل المواعيد إلى جلسات دراسة.",
      support: "خطط قبل أن يتحول مساء الأحد إلى ضغط.",
    },
    {
      headline: "أسبوعك الدراسي متصل.",
      subheadline: "المواد والمهام والتذكيرات والملاحظات معًا.",
      support: "أدر كل التفاصيل دون إعادة بناء المخطط.",
    },
    {
      headline: "اعرف ما تحتاجه كل مادة.",
      subheadline: "واجبات واختبارات وملاحظات وتقدم معًا.",
      support: "افتح المادة وشاهد ما يهم فعلًا.",
    },
    {
      headline: "حوّل الملاحظات إلى خطوات.",
      subheadline: "التقط الأفكار. أنشئ مهام مراجعة. ابق جاهزًا.",
      support: "ابقِ مادة الدراسة متصلة بالخطة.",
    },
    {
      headline: "إجابات اليوم الدراسي على الشاشة الرئيسية.",
      subheadline: "أدوات مصغّرة حقيقية تعرض التالي قبل فتح التطبيق.",
      support: "اليوم وتقدم المواد والأسبوع تبقى ظاهرة.",
    },
  ],
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function escapeMd(text) {
  return text.replace(/\|/g, "\\|");
}

function makePrompt({ locale, sourcePath, slide, copy }) {
  const benefits = copy.benefits?.length
    ? `\nSide benefit labels, only if this source frame already has side benefit labels outside the phone:\n${copy.benefits
        .map(([label, detail]) => `- "${label}" — "${detail}"`)
        .join("\n")}`
    : "";
  const widgetRule =
    slide.slideIndex === 7
      ? "\nWidget-specific lock: the Home Screen, widgets, app icons, wallpaper, labels, dates, widget geometry, and all WidgetKit content must remain exact source pixels. Do not add, remove, resize, rewrite, recolor, blur, or invent any Home Screen/widget element."
      : "";

  return `Use case: text-localization + precise-object-edit
Asset type: App Store Connect Product Page Optimization Copy B, iPhone 6.5 screenshot, GPT Image 2.0 in the ChatGPT Mac app
Input image role: the attached image is the current live App Store Connect preview, Copy A. Source path for audit: ${sourcePath}
Locale: ${locale}
Slide ${slide.slideIndex}: ${slide.slideFile} (${slide.title})

Primary request: Generate Copy B from this current live ASC preview. Replace only the App Store preview marketing copy outside the phone/device/Home Screen area with the exact localized Copy B text below. Preserve the real product UI inside the phone/device/Home Screen exactly.

Editing mode: pixel-locked image edit / inpainting only. Do not create a new image, sketch a new composition, redraw the screenshot, reinterpret the device, or recreate the layout. Start from the attached source canvas and change only the glyph pixels of the existing external marketing text regions. If exact non-text pixel preservation is not possible, return the original source image unchanged rather than generating a redesigned image.

Copy B conversion hypothesis: ${slide.hypothesis}

Exact external Copy B text:
Primary headline: "${copy.headline}"
Secondary headline: "${copy.subheadline}"
Supporting copy: "${copy.support}"${benefits}

Text placement rules:
- Keep the current premium ASC preview structure, phone/device scale, brand lockup position, and overall visual hierarchy.
- Replace only the external marketing text glyphs that are already outside the locked product screenshot area.
- The external headline/subheadline/supporting copy may be reflowed, wrapped, or resized only enough to fit within the existing external text regions.
- Do not truncate text.
- Do not move, resize, redraw, recolor, or recreate the StudyPlanner AI brand lockup, app icon, phone, Home Screen, widgets, screenshot background, hand, shadows, or any non-text pixels.
- Do not add extra claims, prices, ratings, awards, school names, LMS names, or unreadable generated text.
- Do not "sketch", "render", "recreate", or "generate a new version" of the screenshot.

Hard invariants:
- The attached current live ASC preview is the source of truth.
- Preserve all ${slide.lockedSurface} exactly as source pixels.
- Do not redraw, rewrite, translate, crop out, blur, move, resize, recolor, or invent any visible app UI, phone screen, WidgetKit UI, Home Screen content, app icon, brand lockup, status bar, buttons, dates, course labels, screenshot boundary, background, hand, shadow, or phone geometry.
- Change only the external App Store marketing text glyphs outside the locked product screenshot area.
- No fake widgets, fake notifications, fake lock screens, fake app screens, fake LMS/school integrations, fake App Store UI, fake charts, fake phone UI, or unsupported claims.${widgetRule}
- Keep the result Apple-native, clean, bright, student-focused, and calmer than an ad.
- Return one PNG at the original source canvas size: exactly 1242x2688 pixels. Do not downscale, crop, add padding, or change aspect ratio.

Reject the output if any product UI, widget/Home Screen content, localized app UI text, icon, course data, date, button, screenshot boundary, phone geometry, or locked source pixels change.`;
}

function makeItem(locale, slide, sourcePath, copy) {
  return {
    id: `${locale}-${String(slide.slideIndex).padStart(2, "0")}`,
    locale,
    slideIndex: slide.slideIndex,
    slideFile: slide.slideFile,
    slideTitle: slide.title,
    copyTreatment: "B",
    copyAReference: "current live App Store Connect preview",
    sourcePath,
    sourceExists: existsSync(sourcePath),
    requiredOutputSize: { width: 1242, height: 2688 },
    outputPathRecommended: `store/apple/screenshot-copy-b/${locale}/APP_IPHONE_65/${slide.slideFile}`,
    modelTarget: "GPT Image 2.0 in ChatGPT Mac app",
    mode: "individual image edit prompt",
    hypothesis: slide.hypothesis,
    externalCopyB: copy,
    prompt: makePrompt({ locale, sourcePath, slide, copy }),
  };
}

function makeRunbook(items) {
  const rows = items
    .map((item) => {
      const copy = item.externalCopyB;
      return `| ${item.id} | ${item.slideFile} | \`${item.sourcePath}\` | ${escapeMd(copy.headline)} / ${escapeMd(copy.subheadline)} |`;
    })
    .join("\n");

  return `# ASC Live Copy B GPT Image 2.0 Runbook

Generated: ${generatedAt}
Release: ${release}

## Rule

Copy A is only the current live App Store Connect preview set referenced by \`store.config.json -> apple.info[*].screenshots.APP_IPHONE_65\`.

Copy B must be generated in GPT Image 2.0 from those live ASC preview images, one image at a time. Do not use older local preview variants, draft composers, social assets, event media, or non-ASC screenshots as inputs.

Current live test status: \`en-US-01\` was prompted successfully in the ChatGPT Mac app, but both generated candidates were rejected because ChatGPT returned \`853x1844\` output instead of the required \`1242x2688\`. A follow-up export/cache probe did not find a full-resolution file. Do not mass-send the full queue until one candidate passes the acceptance gate.

## Test Hypothesis

Back-to-school conversion should improve when the first visible preview copy names the exact student outcome: start school organized, review every deadline, turn homework into scheduled study time, and keep the next school-day answer visible.

This is a copy treatment, not a UI treatment. The real app UI, phone screenshot, Home Screen, WidgetKit content, app icon, course data, dates, and screenshot geometry stay locked.

## GPT Image 2.0 Method

For each item:

1. Open the source PNG from the \`sourcePath\`.
2. Attach only that PNG in the ChatGPT Mac app.
3. Paste the matching \`prompt\` from \`${OUTPUT_JSON_PATH}\` or \`${OUTPUT_JSONL_PATH}\`.
4. Generate exactly one Copy B candidate.
5. Save accepted output to \`store/apple/screenshot-copy-b/{locale}/APP_IPHONE_65/{slideFile}\`.
6. Reject and regenerate if any locked product UI/Home Screen/widget pixel changes.

Generated outputs remain candidates until visual QA confirms exact locked-pixel preservation, correct localized external text, and 1242x2688 dimensions.

No local renderer, older draft compositor, social asset, or manual rebuild may be used to create Copy B. If GPT Image 2.0 cannot return an accepted file, Copy B remains ungenerated.

## PPO Setup

Use Product Page Optimization with one treatment:

- Control: current live ASC previews, Copy A.
- Treatment: Copy B screenshots generated from this queue.
- Change screenshots only. Keep icon, subtitle, description, and app preview video unchanged for this first read.
- If traffic is low, test en-US first with all seven B frames; if traffic is sufficient, localize the treatment across all 17 locales.
- Run at least 14 days unless App Store Connect reaches a clear confidence result earlier. Apply only if Apple reports the treatment is performing better with at least 90% confidence and downstream activation does not drop.

## Priority

Minimum usage, maximum leverage order:

1. Generate and QA \`en-US-01\`.
2. Continue only if the candidate is exactly \`1242x2688\` and passes locked-pixel QA.
3. Generate and QA \`en-US-02\` and \`en-US-03\`.
4. If those pass, generate all remaining en-US frames.
5. Fan out all locales using the same per-item prompts.
6. Upload Copy B as one PPO treatment.

## Acceptance Gate

Reject if any output:

- Changes app UI, widget UI, Home Screen pixels, dates, course labels, status bar content, app icon, phone geometry, or screenshot boundary.
- Adds fake widgets, notifications, lock screens, app screens, LMS integrations, school names, prices, ratings, awards, or unsupported claims.
- Truncates, misspells, mistranslates, or invents external Copy B text.
- Changes dimensions away from 1242x2688.
- Looks like a loud ad instead of premium App Store preview creative.

## Queue

| ID | Slide | Source | Copy B headline |
| --- | --- | --- | --- |
${rows}
`;
}

function makeResearchMemo(items) {
  return `# Max Impact Spotlight Research Cycle

Generated: ${generatedAt}
Release: ${release}
Scope: current live ASC previews as Copy A; GPT Image 2.0-only localized Copy B treatment.

## Decision

Run one high-contrast screenshot copy treatment, not a broad redesign. The highest-likelihood conversion lift is in the first three preview frames because they are the fastest-visible proof of student intent: semester setup, deadlines/exams, and study blocks.

The current ASC live previews become the control. Copy B changes only external marketing copy and keeps the real product screenshots and WidgetKit proof locked.

## Highest-Leverage B Angle

Use the August promise:

- Start school already organized.
- Review every deadline before it hits the planner.
- Turn homework into scheduled study time.
- Keep the next school-day answer visible on Home Screen widgets.

This beats generic "AI planner" positioning because competitors are crowding around schedule/planner/AI claims, while students search for concrete relief: deadlines, homework, exams, first-week setup, and what to do next.

## Nomination Moves

1. Submit the App Store Connect featuring nomination now for the August 24-31 window.
2. Keep nomination type as App Enhancements unless the In-App Event is approved in time to attach.
3. Keep \`Semester Kickoff Week\` framed as a Challenge only if the actual in-app flow asks students to complete setup.
4. Use the live ASC screenshots and generated Copy B PPO treatment as evidence of product-page quality, but do not block nomination submission on PPO results.
5. Include accessibility/localization proof, real WidgetKit proof, and the review-before-save AI boundary in Helpful Details.

## A/B Test

Primary PPO test:

- Control: current live ASC screenshots.
- Treatment B: generated Copy B screenshots from \`${OUTPUT_JSON_PATH}\`.
- Traffic: one treatment only; avoid splitting into multiple variants.
- Metric: App Store Connect conversion rate lift and confidence.
- Minimum run: 14 days; stop/apply only at 90%+ confidence or after the test is clearly inconclusive.
- Guardrail: do not keep a CVR winner if first-class/task creation, trial start, or subscription start drops meaningfully.

## GPT Image 2.0 Gate

Live ChatGPT Mac app prompting works, but the first Copy B candidate returned by GPT Image 2.0 was \`853x1844\`, not \`1242x2688\`. A follow-up export/cache probe did not find a full-resolution output. The Copy B treatment should not be uploaded or mass-generated until one GPT Image 2.0 candidate passes exact App Store sizing and locked-pixel QA. There is no local compositor fallback for Copy B. See \`docs/launch/back-to-school-2026/chatgpt-copy-b-generation-report.md\`.

## Research Signals

- Apple supports Product Page Optimization for testing screenshots, icons, and app previews, with up to three treatments and confidence reporting.
- Apple explicitly calls out seasonal/culturally relevant content as a PPO use case.
- Apple recommends featuring nominations at least two weeks ahead and up to three months for wider consideration.
- In-App Events can appear across App Store surfaces, but they must be real timely in-app experiences and can publish up to 14 days before start.
- Competitors mostly cluster around broad planner, timetable, grades, widgets, or AI claims; the gap is a sharp first-week setup story.

## Source Links

- Apple Product Page Optimization: https://developer.apple.com/app-store/product-page-optimization/
- Apple Creating Your Product Page: https://developer.apple.com/app-store/product-page/
- Apple Custom Product Pages: https://developer.apple.com/app-store/custom-product-pages/
- Apple Getting Featured: https://developer.apple.com/app-store/getting-featured/
- Apple Nominate Your App: https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/
- Apple In-App Events: https://developer.apple.com/help/app-store-connect/offer-in-app-events/overview-of-in-app-events/

## Artifact Summary

- Locales: ${new Set(items.map((item) => item.locale)).size}
- Slides per locale: ${slides.length}
- Total GPT Image 2.0 prompts: ${items.length}
- Current ASC live preview source paths verified: ${items.every((item) => item.sourceExists) ? "yes" : "no"}
`;
}

const storeConfig = JSON.parse(readFileSync(STORE_CONFIG_PATH, "utf8"));
const info = storeConfig.apple?.info ?? {};
const locales = Object.keys(info).sort();
const items = [];

for (const locale of locales) {
  const localeCopy = copyByLocale[locale];
  assert(localeCopy, `Missing Copy B localization for ${locale}`);
  assert(localeCopy.length === slides.length, `Copy B slide count mismatch for ${locale}`);

  const sourcePaths = info[locale]?.screenshots?.APP_IPHONE_65 ?? [];
  assert(sourcePaths.length === slides.length, `${locale} must have ${slides.length} live ASC iPhone preview paths`);

  for (const slide of slides) {
    const expectedPath = sourcePaths[slide.slideIndex - 1];
    assert(expectedPath?.endsWith(slide.slideFile), `${locale} slide ${slide.slideIndex} expected ${slide.slideFile}, found ${expectedPath}`);
    items.push(makeItem(locale, slide, expectedPath, localeCopy[slide.slideIndex - 1]));
  }
}

const missing = items.filter((item) => !item.sourceExists).map((item) => item.sourcePath);
assert(missing.length === 0, `Missing source preview paths:\n${missing.join("\n")}`);

for (const item of items) {
  mkdirSync(dirname(item.outputPathRecommended), { recursive: true });
}

const payload = {
  generatedAt,
  release,
  purpose: "One current-live-ASC-preview-to-Copy-B GPT Image 2.0 prompt per submitted iPhone preview.",
  sourceOfTruth: "store.config.json apple.info[*].screenshots.APP_IPHONE_65",
  controlCopy: "A = current live App Store Connect previews",
  treatmentCopy: "B = GPT Image 2.0 edit that changes only external preview marketing copy",
  modelTarget: "GPT Image 2.0 in ChatGPT Mac app",
  counts: {
    locales: locales.length,
    slidesPerLocale: slides.length,
    totalPrompts: items.length,
    missingSources: missing.length,
  },
  acceptanceGate: {
    requiredOutputSize: { width: 1242, height: 2688 },
    rejectIf: [
      "Any app UI, widget UI, Home Screen content, app icon, phone geometry, status bar, course data, date, button, or screenshot boundary changes.",
      "Any fake widget, fake phone UI, fake notification, fake lock screen, fake LMS/school integration, fake rating, fake price, or unsupported claim appears.",
      "External Copy B text is misspelled, truncated, mistranslated, or replaced with invented text.",
      "The output is not generated from the current live ASC preview source path for that item.",
      "The style drifts into a loud ad or generic AI visual system.",
    ],
  },
  slides,
  items,
};

for (const path of [OUTPUT_JSON_PATH, OUTPUT_JSONL_PATH, OUTPUT_RUNBOOK_PATH, OUTPUT_RESEARCH_PATH]) {
  mkdirSync(dirname(path), { recursive: true });
}

writeFileSync(OUTPUT_JSON_PATH, `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(OUTPUT_JSONL_PATH, `${items.map((item) => JSON.stringify(item)).join("\n")}\n`);
writeFileSync(OUTPUT_RUNBOOK_PATH, makeRunbook(items));
writeFileSync(OUTPUT_RESEARCH_PATH, makeResearchMemo(items));

console.log(`Created ${items.length} Copy B GPT Image 2.0 prompts across ${locales.length} locales.`);
console.log(`Wrote ${OUTPUT_JSON_PATH}`);
console.log(`Wrote ${OUTPUT_JSONL_PATH}`);
console.log(`Wrote ${OUTPUT_RUNBOOK_PATH}`);
console.log(`Wrote ${OUTPUT_RESEARCH_PATH}`);
