#!/usr/bin/env python3
from __future__ import annotations

import math
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

try:
    import arabic_reshaper
    from bidi.algorithm import get_display
except Exception:  # pragma: no cover - optional typography helper
    arabic_reshaper = None
    get_display = None


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "test-results" / "localized-final-sweep"
ASSET_ROOT = ROOT / "assets" / "AppPreviews" / "final"
STORE_ROOT = ROOT / "store" / "apple" / "screenshot"
LOGO_PATH = ROOT / "assets" / "app" / "study-planner-icon.png"
WIDGET_HOME_SOURCE = ROOT / "qa-screenshots" / "live" / "device-studyplanner-two-small-week-final-candidate.png"

CANVAS = (1242, 2688)
SCREEN_SLOT = "APP_IPHONE_65"
TEXT = (10, 10, 12)
MUTED = (91, 94, 104)
SUBTLE = (133, 136, 145)
WHITE = (255, 255, 255)

FONT_LATIN = "/System/Library/Fonts/HelveticaNeue.ttc"
FONT_CJK = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"
FONT_CHINESE = "/System/Library/Fonts/STHeiti Medium.ttc"
FONT_DEVANAGARI = "/System/Library/Fonts/Supplemental/Devanagari Sangam MN.ttc"

RAW_LOCALES = ["en-US", "de", "es", "fr", "pt-BR", "ja", "ko", "zh-Hans", "zh-Hant", "hi", "ar"]
SOURCE_LOCALE = {"zh-Hant": "zh-Hans"}
STORE_LOCALES = {
    "en-US": ["en-US", "en-GB", "en-AU", "en-CA"],
    "de": ["de-DE"],
    "es": ["es-ES", "es-MX"],
    "fr": ["fr-FR", "fr-CA"],
    "pt-BR": ["pt-BR", "pt-PT"],
    "ja": ["ja"],
    "ko": ["ko"],
    "zh-Hans": ["zh-Hans"],
    "zh-Hant": ["zh-Hant"],
    "hi": ["hi"],
    "ar": ["ar-SA"],
}


@dataclass(frozen=True)
class SlideSpec:
    index: int
    output: str
    source: str
    headline_key: str
    sub_key: str
    proof_key: str
    accent: tuple[int, int, int]
    ambient: tuple[int, int, int]


SLIDES = [
    SlideSpec(1, "01-scan-anything.png", "12-scan.png", "s1h", "s1s", "s1p", (28, 99, 242), (232, 241, 255)),
    SlideSpec(2, "02-semester-health.png", "10-today-light.png", "s2h", "s2s", "s2p", (18, 143, 83), (231, 247, 238)),
    SlideSpec(3, "03-plan-autopilot.png", "14-calendar.png", "s3h", "s3s", "s3p", (111, 86, 206), (242, 239, 255)),
    SlideSpec(4, "04-manage-semester.png", "17-classes.png", "s4h", "s4s", "s4p", (230, 126, 34), (255, 242, 229)),
    SlideSpec(5, "05-class-detail.png", "17a-class-detail.png", "s5h", "s5s", "s5p", (32, 128, 141), (229, 247, 248)),
    SlideSpec(6, "06-notes.png", "17b-notes.png", "s6h", "s6s", "s6p", (79, 98, 148), (235, 239, 250)),
    SlideSpec(7, "07-real-home-screen-widgets.png", "__real_home_screen_widgets__", "s8h", "s8s", "s8p", (10, 132, 255), (232, 244, 255)),
    SlideSpec(8, "08-focus.png", "17k-study-session.png", "s7h", "s7s", "s7p", (35, 35, 39), (241, 242, 244)),
]


COPY = {
    "en-US": {
        "brand": "StudyPlanner AI",
        "s1h": "Scan anything.",
        "s1s": "Syllabus, notes, and study guides become a plan you can trust.",
        "s1p": "Real import screen",
        "s2h": "Your semester, organized.",
        "s2s": "Today, deadlines, and course health stay beautifully in view.",
        "s2p": "Live semester pulse",
        "s3h": "Plan on autopilot.",
        "s3s": "AI turns real deadlines into focused study blocks.",
        "s3p": "Calendar-ready",
        "s4h": "Everything stays in sync.",
        "s4s": "Classes, reminders, tasks, and notes move together.",
        "s4p": "Connected courses",
        "s5h": "Know every class.",
        "s5s": "Assignments, exams, notes, and progress in one calm place.",
        "s5p": "Course detail",
        "s6h": "Notes become action.",
        "s6s": "Capture ideas and turn them into tasks, concepts, and review.",
        "s6p": "Smart notes",
        "s7h": "Always know what’s next.",
        "s7s": "Study sessions adapt around the work that matters most.",
        "s7p": "Focus session",
        "s8h": "Keep it on your Home Screen.",
        "s8s": "Real widgets show Today, class progress, and the week ahead.",
        "s8p": "Real WidgetKit proof",
    },
    "de": {
        "brand": "StudyPlanner AI",
        "s1h": "Alles scannen.",
        "s1s": "Syllabus, Notizen und Lernstoff werden zu einem klaren Plan.",
        "s1p": "Echter Import",
        "s2h": "Dein Semester, sortiert.",
        "s2s": "Heute, Fristen und Kursstatus bleiben im Blick.",
        "s2p": "Semester-Puls",
        "s3h": "Planung mit Autopilot.",
        "s3s": "KI macht aus echten Fristen fokussierte Lernzeiten.",
        "s3p": "Kalenderbereit",
        "s4h": "Alles bleibt synchron.",
        "s4s": "Kurse, Erinnerungen, Aufgaben und Notizen bleiben verbunden.",
        "s4p": "Verbundene Kurse",
        "s5h": "Jeden Kurs im Blick.",
        "s5s": "Aufgaben, Prüfungen, Notizen und Fortschritt an einem Ort.",
        "s5p": "Kursdetails",
        "s6h": "Notizen werden aktiv.",
        "s6s": "Ideen werden zu Aufgaben, Begriffen und Wiederholung.",
        "s6p": "Smarte Notizen",
        "s7h": "Immer wissen, was kommt.",
        "s7s": "Lernsitzungen passen sich deinen wichtigsten Aufgaben an.",
        "s7p": "Fokuszeit",
        "s8h": "Auf dem Home-Bildschirm.",
        "s8s": "Echte Widgets zeigen Heute, Kursfortschritt und die Woche.",
        "s8p": "Echter WidgetKit-Nachweis",
    },
    "es": {
        "brand": "StudyPlanner AI",
        "s1h": "Escanea todo.",
        "s1s": "Programa, apuntes y guías se convierten en un plan claro.",
        "s1p": "Importación real",
        "s2h": "Tu semestre, ordenado.",
        "s2s": "Hoy, entregas y estado de cada clase siempre visibles.",
        "s2p": "Pulso del curso",
        "s3h": "Plan en automático.",
        "s3s": "La IA convierte entregas reales en bloques de estudio.",
        "s3p": "Listo para calendario",
        "s4h": "Todo sigue conectado.",
        "s4s": "Clases, recordatorios, tareas y notas se sincronizan.",
        "s4p": "Clases conectadas",
        "s5h": "Domina cada clase.",
        "s5s": "Tareas, exámenes, notas y progreso en un lugar tranquilo.",
        "s5p": "Detalle de clase",
        "s6h": "Tus notas pasan a acción.",
        "s6s": "Convierte ideas en tareas, conceptos y repaso.",
        "s6p": "Notas inteligentes",
        "s7h": "Siempre sabes qué sigue.",
        "s7s": "Sesiones adaptadas al trabajo que más importa.",
        "s7p": "Sesión de foco",
        "s8h": "En tu pantalla de inicio.",
        "s8s": "Widgets reales muestran Hoy, progreso y la semana.",
        "s8p": "Prueba real de WidgetKit",
    },
    "fr": {
        "brand": "StudyPlanner AI",
        "s1h": "Scanne tout.",
        "s1s": "Syllabus, notes et fiches deviennent un plan clair.",
        "s1p": "Import réel",
        "s2h": "Ton semestre, rangé.",
        "s2s": "Aujourd’hui, échéances et état des cours restent visibles.",
        "s2p": "Pouls du semestre",
        "s3h": "Plan en autopilote.",
        "s3s": "L’IA transforme tes échéances en sessions d’étude.",
        "s3p": "Prêt pour calendrier",
        "s4h": "Tout reste synchronisé.",
        "s4s": "Cours, rappels, tâches et notes restent reliés.",
        "s4p": "Cours connectés",
        "s5h": "Chaque cours sous contrôle.",
        "s5s": "Devoirs, examens, notes et progrès au même endroit.",
        "s5p": "Détail du cours",
        "s6h": "Les notes deviennent action.",
        "s6s": "Transforme tes idées en tâches, notions et révision.",
        "s6p": "Notes intelligentes",
        "s7h": "Toujours la bonne suite.",
        "s7s": "Des sessions adaptées au travail le plus important.",
        "s7p": "Session focus",
        "s8h": "Sur ton écran d’accueil.",
        "s8s": "De vrais widgets montrent Aujourd’hui, progrès et semaine.",
        "s8p": "Preuve WidgetKit réelle",
    },
    "pt-BR": {
        "brand": "StudyPlanner AI",
        "s1h": "Escaneie tudo.",
        "s1s": "Plano de aula, notas e guias viram um plano claro.",
        "s1p": "Importação real",
        "s2h": "Seu semestre, organizado.",
        "s2s": "Hoje, prazos e saúde das aulas ficam sempre visíveis.",
        "s2p": "Pulso do semestre",
        "s3h": "Plano no automático.",
        "s3s": "A IA transforma prazos reais em blocos de estudo.",
        "s3p": "Pronto para calendário",
        "s4h": "Tudo fica sincronizado.",
        "s4s": "Aulas, lembretes, tarefas e notas ficam conectados.",
        "s4p": "Aulas conectadas",
        "s5h": "Entenda cada aula.",
        "s5s": "Tarefas, provas, notas e progresso em um lugar calmo.",
        "s5p": "Detalhe da aula",
        "s6h": "Notas viram ação.",
        "s6s": "Transforme ideias em tarefas, conceitos e revisão.",
        "s6p": "Notas inteligentes",
        "s7h": "Sempre saiba o próximo passo.",
        "s7s": "Sessões adaptadas ao que mais importa.",
        "s7p": "Sessão de foco",
        "s8h": "Na sua Tela de Início.",
        "s8s": "Widgets reais mostram Hoje, progresso e a semana.",
        "s8p": "Prova real do WidgetKit",
    },
    "ja": {
        "brand": "StudyPlanner AI",
        "s1h": "なんでもスキャン。",
        "s1s": "シラバスもノートも、信頼できる学習計画へ。",
        "s1p": "実際の取り込み画面",
        "s2h": "学期をすっきり整理。",
        "s2s": "今日の予定、締切、授業の状態を見やすく。",
        "s2p": "学期パルス",
        "s3h": "計画は自動で進む。",
        "s3s": "AIが締切から集中できる学習時間を作成。",
        "s3p": "カレンダー対応",
        "s4h": "すべてが同期。",
        "s4s": "授業、リマインダー、タスク、ノートがつながります。",
        "s4p": "授業をまとめて管理",
        "s5h": "授業ごとに見える化。",
        "s5s": "課題、試験、ノート、進捗をひとつに。",
        "s5p": "授業詳細",
        "s6h": "ノートが行動に変わる。",
        "s6s": "アイデアをタスク、概念、復習に整理。",
        "s6p": "スマートノート",
        "s7h": "次にやることが明確。",
        "s7s": "大事な作業に合わせて学習セッションを調整。",
        "s7p": "集中セッション",
        "s8h": "ホーム画面で確認。",
        "s8s": "実際のウィジェットで今日・進捗・週予定を表示",
        "s8p": "実際のWidgetKit証明",
    },
    "ko": {
        "brand": "StudyPlanner AI",
        "s1h": "무엇이든 스캔.",
        "s1s": "강의계획서와 노트가 믿을 수 있는 계획이 됩니다.",
        "s1p": "실제 가져오기 화면",
        "s2h": "학기를 깔끔하게.",
        "s2s": "오늘 할 일, 마감, 수업 상태를 한눈에 봅니다.",
        "s2p": "학기 흐름",
        "s3h": "계획은 자동으로.",
        "s3s": "AI가 실제 마감에 맞춰 공부 블록을 만듭니다.",
        "s3p": "캘린더 준비 완료",
        "s4h": "전부 함께 움직입니다.",
        "s4s": "수업, 알림, 할 일, 노트가 연결됩니다.",
        "s4p": "연결된 수업",
        "s5h": "모든 수업을 한눈에.",
        "s5s": "과제, 시험, 노트, 진행 상황을 한곳에서.",
        "s5p": "수업 상세",
        "s6h": "노트가 실행으로.",
        "s6s": "아이디어를 할 일, 개념, 복습으로 정리합니다.",
        "s6p": "스마트 노트",
        "s7h": "다음 할 일이 보입니다.",
        "s7s": "중요한 일에 맞춰 공부 세션이 조정됩니다.",
        "s7p": "집중 세션",
        "s8h": "홈 화면에서 바로.",
        "s8s": "실제 위젯이 오늘, 진행률, 이번 주를 보여줍니다.",
        "s8p": "실제 WidgetKit 증거",
    },
    "zh-Hans": {
        "brand": "StudyPlanner AI",
        "s1h": "什么都能扫描。",
        "s1s": "课程大纲和笔记，变成可靠的学习计划。",
        "s1p": "真实导入界面",
        "s2h": "学期清清楚楚。",
        "s2s": "今日任务、截止日期和课程状态一目了然。",
        "s2p": "学期脉搏",
        "s3h": "计划自动推进。",
        "s3s": "AI 按真实截止日期安排专注学习时段。",
        "s3p": "可加入日历",
        "s4h": "全部保持同步。",
        "s4s": "课程、提醒、任务和笔记始终连接。",
        "s4p": "课程互联",
        "s5h": "每门课都看得清。",
        "s5s": "作业、考试、笔记和进度集中查看。",
        "s5p": "课程详情",
        "s6h": "笔记变成行动。",
        "s6s": "把想法整理成任务、概念和复习。",
        "s6p": "智能笔记",
        "s7h": "下一步一目了然。",
        "s7s": "学习时段围绕最重要的任务自动调整。",
        "s7p": "专注学习",
        "s8h": "放在主屏幕上。",
        "s8s": "真实小组件显示今日、进度和本周安排。",
        "s8p": "真实 WidgetKit 证明",
    },
    "zh-Hant": {
        "brand": "StudyPlanner AI",
        "s1h": "什麼都能掃描。",
        "s1s": "課程大綱和筆記，變成可靠的學習計畫。",
        "s1p": "真實匯入介面",
        "s2h": "學期清清楚楚。",
        "s2s": "今日任務、截止日期和課程狀態一目了然。",
        "s2p": "學期脈搏",
        "s3h": "計畫自動推進。",
        "s3s": "AI 按真實截止日期安排專注學習時段。",
        "s3p": "可加入行事曆",
        "s4h": "全部保持同步。",
        "s4s": "課程、提醒、任務和筆記始終連接。",
        "s4p": "課程互聯",
        "s5h": "每門課都看得清。",
        "s5s": "作業、考試、筆記和進度集中查看。",
        "s5p": "課程詳情",
        "s6h": "筆記變成行動。",
        "s6s": "把想法整理成任務、概念和複習。",
        "s6p": "智慧筆記",
        "s7h": "下一步一目了然。",
        "s7s": "學習時段圍繞最重要的任務自動調整。",
        "s7p": "專注學習",
        "s8h": "放在主畫面上。",
        "s8s": "真實小工具顯示今日、進度和本週安排。",
        "s8p": "真實 WidgetKit 證明",
    },
    "hi": {
        "brand": "StudyPlanner AI",
        "s1h": "सब कुछ स्कैन करें।",
        "s1s": "सिलेबस और नोट्स भरोसेमंद पढ़ाई योजना बनते हैं।",
        "s1p": "असली इम्पोर्ट स्क्रीन",
        "s2h": "आपका सेमेस्टर व्यवस्थित।",
        "s2s": "आज का काम, तारीखें और क्लास स्थिति साफ दिखती है।",
        "s2p": "सेमेस्टर पल्स",
        "s3h": "योजना अपने-आप बने।",
        "s3s": "AI असली तारीखों से फोकस पढ़ाई समय बनाता है।",
        "s3p": "कैलेंडर तैयार",
        "s4h": "सब कुछ साथ चलता है।",
        "s4s": "क्लास, रिमाइंडर, काम और नोट्स जुड़े रहते हैं।",
        "s4p": "जुड़ी हुई क्लास",
        "s5h": "हर क्लास साफ दिखे।",
        "s5s": "काम, परीक्षा, नोट्स और प्रगति एक जगह।",
        "s5p": "क्लास विवरण",
        "s6h": "नोट्स से काम बनता है।",
        "s6s": "विचारों को काम, अवधारणा और रिविजन में बदलें।",
        "s6p": "स्मार्ट नोट्स",
        "s7h": "अगला कदम हमेशा साफ।",
        "s7s": "जरूरी काम के हिसाब से पढ़ाई सत्र बदलते हैं।",
        "s7p": "फोकस सत्र",
        "s8h": "होम स्क्रीन पर रखें।",
        "s8s": "असली विजेट आज, प्रगति और हफ्ते को दिखाते हैं।",
        "s8p": "असली WidgetKit प्रमाण",
    },
    "ar": {
        "brand": "StudyPlanner AI",
        "s1h": "امسح كل شيء.",
        "s1s": "المنهج والملاحظات تتحول إلى خطة دراسة واضحة.",
        "s1p": "شاشة استيراد حقيقية",
        "s2h": "فصلك مرتب.",
        "s2s": "اليوم والمواعيد وحالة المواد تبقى واضحة.",
        "s2p": "نبض الفصل",
        "s3h": "الخطة تعمل تلقائيًا.",
        "s3s": "الذكاء الاصطناعي يحول المواعيد إلى جلسات تركيز.",
        "s3p": "جاهز للتقويم",
        "s4h": "كل شيء يبقى متزامنًا.",
        "s4s": "المواد والتذكيرات والمهام والملاحظات متصلة.",
        "s4p": "مواد مترابطة",
        "s5h": "اعرف كل مادة.",
        "s5s": "الواجبات والاختبارات والملاحظات والتقدم في مكان واحد.",
        "s5p": "تفاصيل المادة",
        "s6h": "الملاحظات تصبح خطوات.",
        "s6s": "حوّل الأفكار إلى مهام ومفاهيم ومراجعة.",
        "s6p": "ملاحظات ذكية",
        "s7h": "اعرف خطوتك التالية.",
        "s7s": "جلسات دراسة تتكيف مع أهم عمل لديك.",
        "s7p": "جلسة تركيز",
        "s8h": "على الشاشة الرئيسية.",
        "s8s": "ويدجت حقيقية تعرض اليوم والتقدم والأسبوع.",
        "s8p": "إثبات WidgetKit حقيقي",
    },
}

WIDGET_COPY = {
    "en-US": {
        "today": "Today", "review": "Review today", "due": "due today", "reading": "Reading reflection", "readingShort": "Reading...",
        "todayShort": "Today", "forecast": "Forecast", "score": "score", "recover": "Recover reading.", "flat": "flat",
        "days": "7 days", "maxDay": "44 max/day", "busy": "5 busy days", "calendar": "Calendar widget", "peak": "Peak M",
        "weekdays": ["M", "T", "W", "T", "F", "S", "S"],
    },
    "de": {
        "today": "Heute", "review": "Heute prüfen", "due": "heute fällig", "reading": "Lese-Reflexion", "readingShort": "Lesen...",
        "todayShort": "Heute", "forecast": "Prognose", "score": "Punkte", "recover": "Lesen nachholen.", "flat": "flach",
        "days": "7 Tage", "maxDay": "44 max./Tag", "busy": "5 volle Tage", "calendar": "Kalender-Widget", "peak": "Spitze Mo",
        "weekdays": ["M", "D", "M", "D", "F", "S", "S"],
    },
    "es": {
        "today": "Hoy", "review": "Revisar hoy", "due": "vence hoy", "reading": "Reflexión de lectura", "readingShort": "Lectura...",
        "todayShort": "Hoy", "forecast": "Pronóstico", "score": "puntos", "recover": "Recuperar lectura.", "flat": "plano",
        "days": "7 días", "maxDay": "44 máx./día", "busy": "5 días cargados", "calendar": "Widget calendario", "peak": "Pico lun",
        "weekdays": ["L", "M", "X", "J", "V", "S", "D"],
    },
    "fr": {
        "today": "Aujourd’hui", "review": "Réviser", "due": "à rendre", "reading": "Réflexion lecture", "readingShort": "Lecture...",
        "todayShort": "Aujourd’hui", "forecast": "Prévision", "score": "score", "recover": "Reprendre la lecture.", "flat": "plat",
        "days": "7 jours", "maxDay": "44 max/jour", "busy": "5 jours chargés", "calendar": "Widget calendrier", "peak": "Pic lun",
        "weekdays": ["L", "M", "M", "J", "V", "S", "D"],
    },
    "pt-BR": {
        "today": "Hoje", "review": "Revisar hoje", "due": "vence hoje", "reading": "Reflexão de leitura", "readingShort": "Leitura...",
        "todayShort": "Hoje", "forecast": "Previsão", "score": "pontos", "recover": "Retomar leitura.", "flat": "plano",
        "days": "7 dias", "maxDay": "44 máx./dia", "busy": "5 dias cheios", "calendar": "Widget calendário", "peak": "Pico seg",
        "weekdays": ["S", "T", "Q", "Q", "S", "S", "D"],
    },
    "ja": {
        "today": "今日", "review": "今日確認", "due": "今日締切", "reading": "読書リフレクション", "readingShort": "読書...",
        "todayShort": "今日", "forecast": "予測", "score": "点", "recover": "読書を回復。", "flat": "フラット",
        "days": "7日", "maxDay": "44/日 最大", "busy": "忙しい日5日", "calendar": "カレンダー", "peak": "ピーク 月",
        "weekdays": ["月", "火", "水", "木", "金", "土", "日"],
    },
    "ko": {
        "today": "오늘", "review": "오늘 확인", "due": "오늘 마감", "reading": "읽기 리플렉션", "readingShort": "읽기...",
        "todayShort": "오늘", "forecast": "예측", "score": "점수", "recover": "읽기 보완.", "flat": "플랫",
        "days": "7일", "maxDay": "44 최대/일", "busy": "바쁜 날 5일", "calendar": "캘린더 위젯", "peak": "피크 월",
        "weekdays": ["월", "화", "수", "목", "금", "토", "일"],
    },
    "zh-Hans": {
        "today": "今天", "review": "今天查看", "due": "今天截止", "reading": "阅读反思", "readingShort": "阅读...",
        "todayShort": "今天", "forecast": "预测", "score": "分", "recover": "补上阅读。", "flat": "扁平",
        "days": "7天", "maxDay": "44/天最高", "busy": "5个忙碌日", "calendar": "日历小组件", "peak": "高峰 周一",
        "weekdays": ["一", "二", "三", "四", "五", "六", "日"],
    },
    "zh-Hant": {
        "today": "今天", "review": "今天查看", "due": "今天截止", "reading": "閱讀反思", "readingShort": "閱讀...",
        "todayShort": "今天", "forecast": "預測", "score": "分", "recover": "補上閱讀。", "flat": "扁平",
        "days": "7天", "maxDay": "44/天最高", "busy": "5個忙碌日", "calendar": "行事曆小工具", "peak": "高峰 週一",
        "weekdays": ["一", "二", "三", "四", "五", "六", "日"],
    },
    "hi": {
        "today": "आज", "review": "आज समीक्षा", "due": "आज देय", "reading": "पढ़ाई चिंतन", "readingShort": "पढ़ना...",
        "todayShort": "आज", "forecast": "पूर्वानुमान", "score": "स्कोर", "recover": "पढ़ाई संभालें.", "flat": "फ्लैट",
        "days": "7 दिन", "maxDay": "44 अधिक/दिन", "busy": "5 व्यस्त दिन", "calendar": "कैलेंडर विजेट", "peak": "शिखर सोम",
        "weekdays": ["सो", "मं", "बु", "गु", "शु", "श", "र"],
    },
    "ar": {
        "today": "اليوم", "review": "راجع اليوم", "due": "مستحق اليوم", "reading": "تأمل قراءة", "readingShort": "قراءة...",
        "todayShort": "اليوم", "forecast": "التوقع", "score": "درجة", "recover": "استعد القراءة.", "flat": "مسطح",
        "days": "٧ أيام", "maxDay": "٤٤ كحد/يوم", "busy": "٥ أيام مزدحمة", "calendar": "ويدجت التقويم", "peak": "الذروة الاثنين",
        "weekdays": ["ن", "ث", "ر", "خ", "ج", "س", "ح"],
    },
}


def font_path(locale: str) -> str:
    if locale == "hi" and Path(FONT_DEVANAGARI).exists():
        return FONT_DEVANAGARI
    if locale in {"zh-Hans", "zh-Hant"} and Path(FONT_CHINESE).exists():
        return FONT_CHINESE
    if locale in {"ja", "ko", "zh-Hans", "hi", "ar"} and Path(FONT_CJK).exists():
        return FONT_CJK
    return FONT_LATIN


def font(locale: str, size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = font_path(locale)
    if path == FONT_LATIN:
        return ImageFont.truetype(path, size=size, index=1 if bold else 0)
    if path == FONT_DEVANAGARI:
        return ImageFont.truetype(path, size=size, index=1 if bold else 0)
    return ImageFont.truetype(path, size=size)


def is_rtl(locale: str) -> bool:
    return locale == "ar"


def render_text(locale: str, text: str) -> str:
    if is_rtl(locale) and arabic_reshaper and get_display:
        return get_display(arabic_reshaper.reshape(text))
    return text


def text_size(draw: ImageDraw.ImageDraw, locale: str, text: str, face: ImageFont.FreeTypeFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), render_text(locale, text), font=face)
    return box[2] - box[0], box[3] - box[1]


def wrap_text(
    draw: ImageDraw.ImageDraw,
    locale: str,
    text: str,
    face: ImageFont.FreeTypeFont,
    max_width: int,
    max_lines: int,
) -> list[str]:
    words = text.split()
    sep = " "
    if len(words) <= 1:
        words = list(text)
        sep = ""
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current}{sep if current else ''}{word}"
        if current and text_size(draw, locale, trial, face)[0] > max_width:
            lines.append(current)
            current = word
            if len(lines) == max_lines - 1:
                break
        else:
            current = trial
    if current and len(lines) < max_lines:
        lines.append(current)
    return lines


def fitted_font(
    draw: ImageDraw.ImageDraw,
    locale: str,
    text: str,
    max_width: int,
    start: int,
    minimum: int,
    bold: bool,
) -> ImageFont.FreeTypeFont:
    size = start
    while size >= minimum:
        face = font(locale, size, bold)
        if text_size(draw, locale, text, face)[0] <= max_width:
            return face
        size -= 2
    return font(locale, minimum, bold)


def draw_text_line(
    draw: ImageDraw.ImageDraw,
    locale: str,
    box: tuple[int, int, int, int],
    text: str,
    face: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
) -> None:
    x1, y1, x2, _ = box
    rendered = render_text(locale, text)
    width = draw.textbbox((0, 0), rendered, font=face)[2]
    x = x2 - width if is_rtl(locale) else x1
    draw.text((x, y1), rendered, font=face, fill=fill)


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    locale: str,
    x: int,
    y: int,
    max_width: int,
    text: str,
    face: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
    line_gap: int,
    max_lines: int,
) -> int:
    lines = wrap_text(draw, locale, text, face, max_width, max_lines)
    for line in lines:
        draw_text_line(draw, locale, (x, y, x + max_width, y + 80), line, face, fill)
        y += face.size + line_gap
    return y


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    scale = 3
    mask = Image.new("L", (size[0] * scale, size[1] * scale), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0] * scale - 1, size[1] * scale - 1), radius * scale, fill=255)
    return mask.resize(size, Image.LANCZOS)


def blend(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(3))


def background(spec: SlideSpec) -> Image.Image:
    top = blend((255, 255, 255), spec.ambient, 0.10)
    bottom = blend((248, 248, 247), spec.ambient, 0.34)
    img = Image.new("RGB", CANVAS, top)
    px = img.load()
    for y in range(CANVAS[1]):
        t = y / (CANVAS[1] - 1)
        row = blend(top, bottom, t)
        for x in range(CANVAS[0]):
            px[x, y] = row

    layer = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.rounded_rectangle((132, 760, 1110, 2450), 118, fill=(255, 255, 255, 155))
    draw.rounded_rectangle((172, 810, 1070, 2385), 98, fill=(*spec.ambient, 44))
    draw.rounded_rectangle((92, 652, 1160, 2510), 132, outline=(255, 255, 255, 135), width=3)
    layer = layer.filter(ImageFilter.GaussianBlur(22))
    return Image.alpha_composite(img.convert("RGBA"), layer)


def paste_logo_and_brand(img: Image.Image, locale: str) -> None:
    draw = ImageDraw.Draw(img)
    logo_size = 54
    logo = Image.open(LOGO_PATH).convert("RGBA").resize((logo_size, logo_size), Image.LANCZOS)
    x, y = 94, 78
    shadow = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((x, y + 7, x + logo_size, y + logo_size + 7), 14, fill=(0, 0, 0, 28))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(12)))
    img.paste(logo, (x, y), logo)
    face = font(locale, 28, True)
    brand = COPY[locale]["brand"]
    bx = x + logo_size + 18
    by = y + 12
    draw_text_line(draw, locale, (bx, by, CANVAS[0] - 92, by + 50), brand, face, TEXT)


def draw_header(img: Image.Image, locale: str, spec: SlideSpec) -> None:
    copy = COPY[locale]
    draw = ImageDraw.Draw(img)
    x, max_width = 92, CANVAS[0] - 184

    headline = copy[spec.headline_key]
    headline_face = fitted_font(draw, locale, headline, max_width, 104, 62, True)
    y = 184
    y = draw_wrapped(draw, locale, x, y, max_width, headline, headline_face, 10, 12, 2)

    sub_face = font(locale, 43, False)
    draw_wrapped(draw, locale, x, y + 26, max_width - 30, copy[spec.sub_key], sub_face, MUTED, 14, 3)


def fit_cover(src: Image.Image, size: tuple[int, int]) -> Image.Image:
    sw, sh = src.size
    tw, th = size
    scale = max(tw / sw, th / sh)
    nw, nh = math.ceil(sw * scale), math.ceil(sh * scale)
    resized = src.resize((nw, nh), Image.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def widget_copy(locale: str, key: str):
    return WIDGET_COPY.get(locale, WIDGET_COPY["en-US"])[key]


def draw_widget_text(
    draw: ImageDraw.ImageDraw,
    locale: str,
    box: tuple[int, int, int, int],
    text: str,
    size: int,
    fill: tuple[int, int, int],
    bold: bool = False,
    minimum: int = 15,
) -> None:
    x1, y1, x2, y2 = box
    face = fitted_font(draw, locale, text, max(1, x2 - x1), size, minimum, bold)
    draw_text_line(draw, locale, (x1, y1, x2, y2), text, face, fill)


def draw_widget_wrapped(
    draw: ImageDraw.ImageDraw,
    locale: str,
    x: int,
    y: int,
    max_width: int,
    text: str,
    size: int,
    fill: tuple[int, int, int],
    bold: bool = False,
    max_lines: int = 2,
) -> None:
    face = font(locale, size, bold)
    draw_wrapped(draw, locale, x, y, max_width, text, face, fill, 5, max_lines)


def localized_widget_home_source(locale: str, source: Path) -> Image.Image:
    raw = Image.open(source).convert("RGBA")
    width = raw.width
    out_height = raw.height
    blur = raw.filter(ImageFilter.GaussianBlur(34))
    label_blur = raw.filter(ImageFilter.GaussianBlur(120))
    out = blur.crop((0, 0, width, out_height))
    out.alpha_composite(raw.crop((0, 0, width, min(1395, raw.height))), (0, 0))

    def paste_blurred_band(y1: int, y2: int, opacity: int, feather: int) -> None:
        band = label_blur.crop((0, y1, width, y2))
        height = y2 - y1
        mask = Image.new("L", (width, height), 0)
        pixels = mask.load()
        for y in range(height):
            edge = min(y, height - 1 - y)
            strength = min(1.0, edge / max(1, feather))
            value = round(opacity * strength)
            for x in range(width):
                pixels[x, y] = value
        out.paste(band, (0, y1), mask)

    # Remove original English widget attribution labels and lower Home Screen app grid.
    paste_blurred_band(665, 902, 255, 78)
    paste_blurred_band(1255, 1465, 255, 72)
    lower = blur.crop((0, 1395, width, out_height))
    fade = Image.new("L", (width, out_height - 1395), 230)
    out.alpha_composite(Image.composite(lower, Image.new("RGBA", lower.size, (236, 248, 250, 255)), fade), (0, 1395))

    draw = ImageDraw.Draw(out)
    ink = (12, 12, 15)
    muted = (106, 111, 123)
    orange = (255, 149, 0)
    green = (22, 166, 110)
    black = (0, 0, 0)

    # Small Today widget.
    draw.rounded_rectangle((78, 265, 562, 746), 62, fill=(255, 250, 242, 236), outline=(255, 255, 255, 160), width=2)
    draw.ellipse((119, 368, 139, 388), fill=black)
    draw_widget_text(draw, locale, (160, 360, 330, 402), widget_copy(locale, "today"), 30, muted, True)
    draw_widget_text(draw, locale, (340, 360, 540, 402), widget_copy(locale, "review"), 24, orange, True)
    draw_widget_text(draw, locale, (120, 425, 235, 500), "1", 62, ink, True)
    draw_widget_text(draw, locale, (120, 512, 505, 560), widget_copy(locale, "due"), 34, ink, True)
    draw_widget_text(draw, locale, (120, 580, 510, 625), widget_copy(locale, "reading"), 28, muted, True)
    draw.ellipse((119, 650, 139, 670), fill=black)
    draw_widget_text(draw, locale, (160, 642, 270, 684), "CS 201", 27, orange, True)
    draw_widget_text(draw, locale, (286, 646, 420, 684), widget_copy(locale, "readingShort"), 22, ink, True)
    draw_widget_text(draw, locale, (430, 646, 535, 684), widget_copy(locale, "todayShort"), 22, muted, True)

    # Class progress widget.
    draw.rounded_rectangle((620, 265, 1128, 746), 62, fill=(244, 255, 249, 238), outline=(255, 255, 255, 170), width=2)
    draw_widget_text(draw, locale, (672, 327, 820, 370), "CS 201", 26, muted, True)
    draw_widget_text(draw, locale, (1012, 327, 1102, 370), widget_copy(locale, "flat"), 22, green, True)
    draw.ellipse((666, 420, 830, 584), fill=black)
    draw_widget_text(draw, locale, (700, 455, 796, 510), "88", 42, (255, 255, 255), True)
    draw_widget_text(draw, locale, (704, 512, 794, 550), widget_copy(locale, "score"), 20, (220, 220, 224), True)
    draw_widget_text(draw, locale, (858, 420, 1110, 468), widget_copy(locale, "forecast"), 36, ink, True)
    draw_widget_text(draw, locale, (858, 472, 1110, 512), widget_copy(locale, "forecast"), 27, muted, True)
    draw_widget_wrapped(draw, locale, 672, 592, 390, widget_copy(locale, "recover"), 27, muted, True, 2)
    draw.ellipse((668, 654, 688, 674), fill=black)
    draw_widget_text(draw, locale, (708, 646, 820, 684), "CS 201", 25, green, True)
    draw_widget_text(draw, locale, (835, 646, 966, 684), widget_copy(locale, "readingShort"), 22, ink, True)
    draw_widget_text(draw, locale, (994, 646, 1112, 684), widget_copy(locale, "todayShort"), 22, muted, True)

    # Week widget.
    draw.rounded_rectangle((78, 855, 1128, 1328), 68, fill=(244, 255, 250, 238), outline=(255, 255, 255, 168), width=2)
    draw_widget_text(draw, locale, (130, 895, 360, 935), widget_copy(locale, "days"), 27, muted, True)
    draw_widget_text(draw, locale, (884, 895, 1085, 935), widget_copy(locale, "maxDay"), 24, green, True)
    weekdays = widget_copy(locale, "weekdays")
    xs = [132, 255, 378, 501, 624, 747, 870]
    ys = [950, 1065]
    numbers = [["6", "7", "8", "9", "10", "11", "12"], ["13", "14", "15", "16", "17", "18", "19"]]
    for row, y in enumerate(ys):
        for index, x in enumerate(xs):
            active = row == 0 and index == 0
            fill = green if active else (255, 255, 255, 214)
            text_fill = (255, 255, 255) if active else ink
            label_fill = (229, 255, 244) if active else muted
            draw.rounded_rectangle((x, y, x + 82, y + 84), 25, fill=fill)
            draw_widget_text(draw, locale, (x + 10, y + 11, x + 72, y + 39), weekdays[index], 18, label_fill, True, 10)
            draw_widget_text(draw, locale, (x + 10, y + 38, x + 72, y + 72), numbers[row][index], 28, text_fill, True, 14)
            draw.ellipse((x + 38, y + 70, x + 44, y + 76), fill=text_fill)
    draw_widget_text(draw, locale, (130, 1190, 355, 1230), widget_copy(locale, "busy"), 25, ink, True)
    draw_widget_text(draw, locale, (460, 1190, 735, 1230), widget_copy(locale, "calendar"), 20, muted, True)
    draw_widget_text(draw, locale, (812, 1190, 1088, 1230), f"{widget_copy(locale, 'reading')} {widget_copy(locale, 'todayShort')}", 19, muted, True, 12)
    draw_widget_text(draw, locale, (130, 1260, 355, 1305), widget_copy(locale, "peak"), 27, muted, True)

    return out


def draw_phone(img: Image.Image, source: Path, spec: SlideSpec, locale: str) -> None:
    outer_w = 950
    border = 19
    inner_w = outer_w - border * 2
    if spec.source == "__real_home_screen_widgets__":
        source_image = localized_widget_home_source(locale, source)
        sw, sh = source_image.size
    else:
        source_image = Image.open(source).convert("RGBA")
        sw, sh = source_image.size
    inner_h = round(inner_w * sh / sw)
    outer_h = inner_h + border * 2
    x = (CANVAS[0] - outer_w) // 2
    y = 760

    shadow = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((x + 10, y + 42, x + outer_w - 10, y + outer_h + 58), 106, fill=(0, 0, 0, 118))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(42)))

    glow = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle((x - 32, y - 34, x + outer_w + 32, y + outer_h + 28), 118, fill=(*spec.accent, 26))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(34)))

    phone = Image.new("RGBA", (outer_w, outer_h), (0, 0, 0, 0))
    pd = ImageDraw.Draw(phone)
    pd.rounded_rectangle((0, 0, outer_w - 1, outer_h - 1), 104, fill=(7, 7, 8))
    pd.rounded_rectangle((border, border, outer_w - border - 1, outer_h - border - 1), 84, fill=(255, 255, 255))
    pd.rounded_rectangle((outer_w // 2 - 82, 23, outer_w // 2 + 82, 58), 18, fill=(5, 5, 6))

    screen = fit_cover(source_image, (inner_w, inner_h))
    screen_layer = Image.new("RGBA", (inner_w, inner_h), (0, 0, 0, 0))
    screen_layer.paste(screen, (0, 0), rounded_mask((inner_w, inner_h), 82))
    phone.alpha_composite(screen_layer, (border, border))

    side = ImageDraw.Draw(img)
    side.rounded_rectangle((x - 6, y + 190, x + 2, y + 286), 4, fill=(28, 28, 30))
    side.rounded_rectangle((x - 7, y + 346, x + 2, y + 462), 4, fill=(28, 28, 30))
    side.rounded_rectangle((x + outer_w - 2, y + 315, x + outer_w + 7, y + 455), 4, fill=(28, 28, 30))
    img.alpha_composite(phone, (x, y))


def source_path_for(locale: str, spec: SlideSpec) -> Path:
    if spec.source == "__real_home_screen_widgets__":
        return WIDGET_HOME_SOURCE
    return SOURCE_ROOT / SOURCE_LOCALE.get(locale, locale) / spec.source


def compose(locale: str, spec: SlideSpec) -> Image.Image:
    source = source_path_for(locale, spec)
    if not source.exists():
        raise FileNotFoundError(source)
    img = background(spec)
    paste_logo_and_brand(img, locale)
    draw_header(img, locale, spec)
    draw_phone(img, source, spec, locale)
    return img.convert("RGB")


def locale_asset_dir(locale: str) -> Path:
    return ASSET_ROOT / locale / SCREEN_SLOT


def copy_to_store(locale: str, outputs: list[Path]) -> list[Path]:
    copied: list[Path] = []
    for store_locale in STORE_LOCALES[locale]:
        target_dir = STORE_ROOT / store_locale / SCREEN_SLOT
        target_dir.mkdir(parents=True, exist_ok=True)
        stale_focus = target_dir / "07-focus.png"
        if stale_focus.exists() and any(src.name == "08-focus.png" for src in outputs):
            stale_focus.unlink()
        for src in outputs:
            dst = target_dir / src.name
            shutil.copy2(src, dst)
            copied.append(dst)
    return copied


def main() -> None:
    if not LOGO_PATH.exists():
        raise FileNotFoundError(LOGO_PATH)

    ASSET_ROOT.mkdir(parents=True, exist_ok=True)
    outputs: dict[str, list[Path]] = {}
    copied_count = 0
    requested_slides = [spec for spec in SLIDES if spec.source == "__real_home_screen_widgets__"] if "--widgets-only" in sys.argv else SLIDES
    for stale in list(ASSET_ROOT.glob("**/contact-sheet*.png")) + [ASSET_ROOT / "manifest.json", ASSET_ROOT / "review-gallery.html"]:
        if stale.exists():
            stale.unlink()

    for locale in RAW_LOCALES:
        out_dir = locale_asset_dir(locale)
        out_dir.mkdir(parents=True, exist_ok=True)
        locale_outputs: list[Path] = []
        for spec in requested_slides:
            output = out_dir / spec.output
            compose(locale, spec).save(output, optimize=True)
            locale_outputs.append(output)
        outputs[locale] = locale_outputs
        copied_count += len(copy_to_store(locale, locale_outputs))

    print(f"wrote {sum(len(v) for v in outputs.values())} preview PNGs")
    print(f"copied {copied_count} store screenshot PNGs")


if __name__ == "__main__":
    main()
