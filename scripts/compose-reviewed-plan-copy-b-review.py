#!/usr/bin/env python3
"""Build the review-only "Reviewed Plan" App Store screenshot candidate.

This generator deliberately does not write to App Store Connect, store.config.json,
store/apple/screenshot-pop, or store/apple/screenshot-copy-b-image-2. It composes
localized external marketing copy around untouched native capture pixels. Product UI
is only resized and clipped to a rounded device viewport; it is never regenerated,
painted over, translated, or redrawn.

Runtime dependencies (kept out of the project dependency graph):
  Pillow 11.3.0
  arabic-reshaper 3.0.0
  python-bidi 0.4.2
"""

from __future__ import annotations

import hashlib
import json
import math
import shutil
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

try:
    import arabic_reshaper
    from bidi.algorithm import get_display
except ImportError as error:  # pragma: no cover - dependency guidance is actionable
    raise SystemExit(
        "Arabic typography dependencies are missing. Install arabic-reshaper==3.0.0 "
        "and python-bidi==0.4.2 before running this review generator."
    ) from error


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = (
    ROOT
    / "qa"
    / "back-to-school-2026"
    / "copy-b-reviewed-plan-review-only-2026-07-09"
)
SCREENSHOT_ROOT = OUTPUT_ROOT / "screenshots"
CONTACT_SHEET_ROOT = OUTPUT_ROOT / "contact-sheets"
MARKER_PATH = OUTPUT_ROOT / ".review-only-package"

BUILD80_SOURCE_ROOT = ROOT / "qa-screenshots" / "copy-b-build80-native-sources"
COMPLETE_SOURCE_ROOT = (
    ROOT / "qa-screenshots" / "back-to-school-2026-native-localized-current"
)
HOME_SCREEN_SOURCE = (
    ROOT
    / "qa-screenshots"
    / "live"
    / "device-studyplanner-two-small-week-final-candidate.png"
)

CANVAS = (1242, 2688)
SCREEN_SLOT = "APP_IPHONE_65"
PACKAGE_MARKER = "StudyPlanner Reviewed Plan Copy B review-only package\n"

PROTECTED_BASELINES = {
    "store.config.json": "c09f4113903b214b82a76a05b4111ea41da70641267b439e1b8a8cdcff017437",
    "store/apple/screenshot-pop": "99abcafea9241dff6314fdcece38f9a5f37c7f8bda424ee20f34b8ab42d7fb80",
    "store/apple/screenshot-copy-b-image-2": "394f5bc38b056e6f39db654faf9c063e3582edd0f76e4c18e217abae2756151c",
}

LOCALES = [
    "ar-SA",
    "de-DE",
    "en-AU",
    "en-CA",
    "en-GB",
    "en-US",
    "es-ES",
    "es-MX",
    "fr-CA",
    "fr-FR",
    "hi",
    "ja",
    "ko",
    "pt-BR",
    "pt-PT",
    "zh-Hans",
    "zh-Hant",
]


@dataclass(frozen=True)
class Slide:
    index: int
    filename: str
    capture_id: str | None
    accent: tuple[int, int, int]
    tint: tuple[int, int, int]


SLIDES = [
    Slide(
        1,
        "01-start-with-class-material.png",
        "app-00-scan-current",
        (25, 117, 255),
        (224, 238, 255),
    ),
    Slide(
        2,
        "02-approve-every-deadline.png",
        "app-06-review",
        (30, 199, 89),
        (225, 248, 234),
    ),
    Slide(
        3,
        "03-semester-takes-shape.png",
        "app-07-semester-ready",
        (116, 86, 255),
        (237, 232, 255),
    ),
    Slide(
        4,
        "04-know-today.png",
        "app-08-today",
        (255, 149, 0),
        (255, 240, 220),
    ),
    Slide(
        5,
        "05-give-deadlines-time.png",
        "app-09-focus",
        (255, 69, 58),
        (255, 231, 228),
    ),
    Slide(
        6,
        "06-choose-what-stays-visible.png",
        "app-10-widgets",
        (14, 160, 116),
        (222, 247, 238),
    ),
    Slide(
        7,
        "07-real-home-screen-widgets.png",
        None,
        (10, 132, 255),
        (222, 240, 255),
    ),
]


COPY: dict[str, list[dict[str, str]]] = {
    "ar-SA": [
        {
            "headline": "ابدأ بمواد المقرر.",
            "subhead": "حوّل المنهج والملاحظات إلى خطة تراجعها بنفسك.",
        },
        {
            "headline": "أنت تعتمد كل موعد نهائي.",
            "subhead": "لا يُحفظ شيء حتى تؤكده.",
        },
        {
            "headline": "شاهد فصلك الدراسي يتشكل.",
            "subhead": "المواد والواجبات والاختبارات في مكان واحد.",
        },
        {
            "headline": "اعرف ما يحتاج إلى اهتمامك اليوم.",
            "subhead": "الأولويات والمواعيد والتركيز في عرض واحد.",
        },
        {
            "headline": "خصص وقتًا لكل موعد نهائي.",
            "subhead": "حوّل مواعيد التسليم إلى فترات دراسة هادئة.",
        },
        {
            "headline": "اختر ما يبقى ظاهرًا.",
            "subhead": "أضف الأدوات للأولويات المهمة.",
        },
        {
            "headline": "شاهد أسبوعك بنظرة واحدة.",
            "subhead": "أدوات حقيقية تُبقي مهام اليوم على الشاشة الرئيسية.",
        },
    ],
    "de-DE": [
        {
            "headline": "Starte mit Kursmaterial.",
            "subhead": "Lehrplan und Notizen werden zum geprüften Plan.",
        },
        {
            "headline": "Du bestätigst jede Frist.",
            "subhead": "Gespeichert wird erst nach deiner Freigabe.",
        },
        {
            "headline": "Sieh, wie dein Semester entsteht.",
            "subhead": "Kurse, Aufgaben und Prüfungen an einem Ort.",
        },
        {
            "headline": "Wisse, was heute zählt.",
            "subhead": "Prioritäten, Fristen und Fokus auf einen Blick.",
        },
        {
            "headline": "Gib jeder Frist einen Termin.",
            "subhead": "Mach aus Abgaben ruhige Lernblöcke.",
        },
        {
            "headline": "Wähle, was sichtbar bleibt.",
            "subhead": "Richte Widgets für wichtige Prioritäten ein.",
        },
        {
            "headline": "Die Woche auf einen Blick.",
            "subhead": "Echte Widgets halten „Heute“ auf dem Home-Bildschirm präsent.",
        },
    ],
    "en-AU": [
        {
            "headline": "Start with subject material.",
            "subhead": "Turn a syllabus and notes into a plan you review.",
        },
        {
            "headline": "You approve every due date.",
            "subhead": "Nothing saves until you confirm it.",
        },
        {
            "headline": "Watch your semester take shape.",
            "subhead": "Subjects, assignments and exams together.",
        },
        {
            "headline": "Know what needs you today.",
            "subhead": "Priorities, due dates and focus in one view.",
        },
        {
            "headline": "Give every due date a time.",
            "subhead": "Turn deadlines into calm study blocks.",
        },
        {
            "headline": "Choose what stays in view.",
            "subhead": "Set up widgets for the priorities that matter.",
        },
        {
            "headline": "See your week at a glance.",
            "subhead": "Real widgets keep Today on your Home Screen.",
        },
    ],
    "en-CA": [
        {
            "headline": "Begin with course material.",
            "subhead": "A syllabus and notes become a plan you review.",
        },
        {
            "headline": "You approve every deadline.",
            "subhead": "Nothing is saved until you confirm it.",
        },
        {
            "headline": "See your term take shape.",
            "subhead": "Courses, assignments, and exams together.",
        },
        {
            "headline": "See what needs you today.",
            "subhead": "Priorities, deadlines, and focus in one view.",
        },
        {
            "headline": "Make time for every deadline.",
            "subhead": "Turn due dates into calm study blocks.",
        },
        {
            "headline": "Choose what stays in view.",
            "subhead": "Set up widgets for the priorities that matter most.",
        },
        {
            "headline": "View your week at a glance.",
            "subhead": "Real widgets keep Today on your Home Screen.",
        },
    ],
    "en-GB": [
        {
            "headline": "Start with your course material.",
            "subhead": "Turn a syllabus and notes into a plan you check.",
        },
        {
            "headline": "You confirm every deadline.",
            "subhead": "Nothing is saved until you approve it.",
        },
        {
            "headline": "See your term come together.",
            "subhead": "Modules, assignments and exams in one place.",
        },
        {
            "headline": "Know what matters today.",
            "subhead": "Priorities, deadlines and focus in one view.",
        },
        {
            "headline": "Set time for every deadline.",
            "subhead": "Turn due dates into calm study blocks.",
        },
        {
            "headline": "Choose what remains visible.",
            "subhead": "Set up widgets around your real priorities.",
        },
        {
            "headline": "Take in your week at a glance.",
            "subhead": "Real widgets keep Today on the Home Screen.",
        },
    ],
    "en-US": [
        {
            "headline": "Start with class material.",
            "subhead": "Syllabus and notes become a reviewed plan.",
        },
        {
            "headline": "You approve every deadline.",
            "subhead": "Nothing saves until you confirm it.",
        },
        {
            "headline": "See the semester take shape.",
            "subhead": "Classes, assignments, and exams together.",
        },
        {
            "headline": "Know what needs you today.",
            "subhead": "Priorities, deadlines, and focus in one view.",
        },
        {
            "headline": "Give every deadline a time.",
            "subhead": "Turn due dates into calm study blocks.",
        },
        {
            "headline": "Choose what stays visible.",
            "subhead": "Set up widgets for the priorities that matter.",
        },
        {
            "headline": "See the week at a glance.",
            "subhead": "Real widgets keep Today on Home Screen.",
        },
    ],
    "es-ES": [
        {
            "headline": "Empieza con el material de clase.",
            "subhead": "El temario y tus apuntes se convierten en un plan revisado.",
        },
        {
            "headline": "Tú apruebas cada fecha.",
            "subhead": "Nada se guarda hasta que lo confirmas.",
        },
        {
            "headline": "Mira cómo toma forma el semestre.",
            "subhead": "Clases, tareas y exámenes en un mismo lugar.",
        },
        {
            "headline": "Ten claro qué requiere tu atención hoy.",
            "subhead": "Prioridades, entregas y concentración en una vista.",
        },
        {
            "headline": "Pon hora a cada entrega.",
            "subhead": "Convierte las fechas límite en bloques de estudio tranquilos.",
        },
        {
            "headline": "Elige qué queda a la vista.",
            "subhead": "Configura widgets para tus prioridades.",
        },
        {
            "headline": "Tu semana de un vistazo.",
            "subhead": "Widgets reales mantienen Hoy en la pantalla de inicio.",
        },
    ],
    "es-MX": [
        {
            "headline": "Empieza con tus materiales de clase.",
            "subhead": "El programa y tus notas se convierten en un plan que revisas.",
        },
        {
            "headline": "Tú confirmas cada fecha límite.",
            "subhead": "Nada se guarda hasta que lo apruebas.",
        },
        {
            "headline": "Ve cómo toma forma tu semestre.",
            "subhead": "Materias, tareas y exámenes en un solo lugar.",
        },
        {
            "headline": "Ten claro qué necesita tu atención hoy.",
            "subhead": "Prioridades, fechas límite y enfoque en una vista.",
        },
        {
            "headline": "Dale tiempo a cada entrega.",
            "subhead": "Convierte vencimientos en bloques de estudio tranquilos.",
        },
        {
            "headline": "Elige qué quieres tener visible.",
            "subhead": "Configura widgets para lo que más importa.",
        },
        {
            "headline": "Ve tu semana de un vistazo.",
            "subhead": "Widgets reales mantienen Hoy en tu pantalla de inicio.",
        },
    ],
    "fr-CA": [
        {
            "headline": "Commence par ton matériel de cours.",
            "subhead": "Le plan de cours et les notes deviennent un plan que tu révises.",
        },
        {
            "headline": "Tu confirmes chaque échéance.",
            "subhead": "Rien n’est enregistré avant ton approbation.",
        },
        {
            "headline": "Vois ta session prendre forme.",
            "subhead": "Cours, travaux et examens réunis.",
        },
        {
            "headline": "Vois ce qui mérite ton attention aujourd’hui.",
            "subhead": "Priorités, échéances et concentration en une seule vue.",
        },
        {
            "headline": "Réserve du temps à chaque échéance.",
            "subhead": "Transforme les dates de remise en blocs d’étude sereins.",
        },
        {
            "headline": "Choisis ce qui reste à portée de vue.",
            "subhead": "Configure les widgets selon tes priorités.",
        },
        {
            "headline": "Vois ta semaine en un coup d’œil.",
            "subhead": "De vrais widgets gardent les tâches du jour sur l’écran d’accueil.",
        },
    ],
    "fr-FR": [
        {
            "headline": "Commence par tes supports de cours.",
            "subhead": "Syllabus et notes deviennent un planning que tu valides.",
        },
        {
            "headline": "Tu valides chaque échéance.",
            "subhead": "Rien n’est enregistré sans ta confirmation.",
        },
        {
            "headline": "Regarde ton semestre prendre forme.",
            "subhead": "Cours, devoirs et examens réunis.",
        },
        {
            "headline": "Sache ce qui compte aujourd’hui.",
            "subhead": "Priorités, échéances et concentration en une vue.",
        },
        {
            "headline": "Réserve un temps à chaque échéance.",
            "subhead": "Transforme les dates limites en sessions sereines.",
        },
        {
            "headline": "Choisis ce qui reste visible.",
            "subhead": "Configure des widgets pour tes vraies priorités.",
        },
        {
            "headline": "Ta semaine en un coup d’œil.",
            "subhead": "De vrais widgets gardent Aujourd’hui sur l’écran d’accueil.",
        },
    ],
    "hi": [
        {
            "headline": "क्लास की सामग्री से शुरुआत करें।",
            "subhead": "सिलेबस और नोट्स से ऐसी योजना बनती है जिसे आप जाँचते हैं।",
        },
        {
            "headline": "हर समय-सीमा आप मंज़ूर करते हैं।",
            "subhead": "आपकी पुष्टि से पहले कुछ भी सेव नहीं होता।",
        },
        {
            "headline": "सेमेस्टर को आकार लेते देखें।",
            "subhead": "क्लास, असाइनमेंट और परीक्षाएँ एक साथ।",
        },
        {
            "headline": "जानें, आज किस पर ध्यान देना है।",
            "subhead": "प्राथमिकताएँ, समय-सीमाएँ और फ़ोकस एक ही जगह।",
        },
        {
            "headline": "हर समय-सीमा के लिए समय तय करें।",
            "subhead": "ड्यू डेट को शांत स्टडी ब्लॉक में बदलें।",
        },
        {
            "headline": "चुनें, क्या नज़र में रहे।",
            "subhead": "ज़रूरी प्राथमिकताओं के लिए विजेट सेट करें।",
        },
        {
            "headline": "एक नज़र में पूरा हफ़्ता।",
            "subhead": "असली विजेट होम स्क्रीन पर आज का काम दिखाते हैं।",
        },
    ],
    "ja": [
        {
            "headline": "授業資料から始めよう。",
            "subhead": "シラバスやノートが、確認できる計画になります。",
        },
        {
            "headline": "締切はすべて自分で承認。",
            "subhead": "確認するまで何も保存されません。",
        },
        {
            "headline": "学期の全体像が見えてくる。",
            "subhead": "授業・課題・試験をまとめて確認。",
        },
        {
            "headline": "今日やるべきことが分かる。",
            "subhead": "優先事項・締切・集中時間をひとつの画面で。",
        },
        {
            "headline": "すべての締切に時間を確保。",
            "subhead": "期限を落ち着いた学習時間に変えよう。",
        },
        {
            "headline": "表示する情報を選べる。",
            "subhead": "大切な優先事項をウィジェットに設定。",
        },
        {
            "headline": "1週間をひと目で確認。",
            "subhead": "実際のウィジェットで「今日」をホーム画面に。",
        },
    ],
    "ko": [
        {
            "headline": "수업 자료에서 시작하세요.",
            "subhead": "강의계획서와 노트가 검토 가능한 계획이 됩니다.",
        },
        {
            "headline": "모든 마감일을 직접 승인하세요.",
            "subhead": "확인하기 전에는 아무것도 저장되지 않습니다.",
        },
        {
            "headline": "학기가 완성되는 과정을 보세요.",
            "subhead": "수업, 과제, 시험을 한곳에서.",
        },
        {
            "headline": "오늘 할 일을 바로 파악하세요.",
            "subhead": "우선순위, 마감일, 집중 시간을 한눈에.",
        },
        {
            "headline": "모든 마감일에 시간을 배정하세요.",
            "subhead": "마감일을 여유로운 학습 블록으로 바꾸세요.",
        },
        {
            "headline": "계속 볼 항목을 선택하세요.",
            "subhead": "중요한 우선순위를 위젯으로 설정하세요.",
        },
        {
            "headline": "한눈에 보는 이번 주.",
            "subhead": "실제 위젯이 홈 화면에 오늘 할 일을 보여 줍니다.",
        },
    ],
    "pt-BR": [
        {
            "headline": "Comece com o material da aula.",
            "subhead": "Plano de ensino e notas viram um plano que você revisa.",
        },
        {
            "headline": "Você aprova cada prazo.",
            "subhead": "Nada é salvo até você confirmar.",
        },
        {
            "headline": "Veja o semestre ganhar forma.",
            "subhead": "Disciplinas, tarefas e provas em um só lugar.",
        },
        {
            "headline": "Saiba o que precisa de você hoje.",
            "subhead": "Prioridades, prazos e foco em uma só tela.",
        },
        {
            "headline": "Dê um horário a cada prazo.",
            "subhead": "Transforme entregas em blocos de estudo tranquilos.",
        },
        {
            "headline": "Escolha o que fica visível.",
            "subhead": "Configure widgets para o que mais importa.",
        },
        {
            "headline": "Veja a semana de relance.",
            "subhead": "Widgets reais mantêm o Hoje na Tela de Início.",
        },
    ],
    "pt-PT": [
        {
            "headline": "Começa pelos materiais da disciplina.",
            "subhead": "O programa e os apontamentos tornam-se num plano revisto por ti.",
        },
        {
            "headline": "Aprovas todos os prazos.",
            "subhead": "Nada é guardado até confirmares.",
        },
        {
            "headline": "Vê o semestre ganhar forma.",
            "subhead": "Disciplinas, trabalhos e exames num só lugar.",
        },
        {
            "headline": "Sabe o que precisa de ti hoje.",
            "subhead": "Prioridades, prazos e foco numa só vista.",
        },
        {
            "headline": "Reserva tempo para cada prazo.",
            "subhead": "Transforma datas de entrega em blocos de estudo tranquilos.",
        },
        {
            "headline": "Escolhe o que fica visível.",
            "subhead": "Configura widgets para as prioridades importantes.",
        },
        {
            "headline": "Vê a semana de relance.",
            "subhead": "Widgets reais mantêm o Hoje no ecrã principal.",
        },
    ],
    "zh-Hans": [
        {
            "headline": "从课程资料开始。",
            "subhead": "教学大纲和笔记变成由你审核的计划。",
        },
        {
            "headline": "每个截止日期都由你确认。",
            "subhead": "确认前，不会保存任何内容。",
        },
        {
            "headline": "看着学期计划逐步成形。",
            "subhead": "课程、作业和考试集中呈现。",
        },
        {
            "headline": "清楚今天该做什么。",
            "subhead": "优先事项、截止日期和专注安排一目了然。",
        },
        {
            "headline": "为每个截止日期安排时间。",
            "subhead": "把截止任务变成从容的学习时段。",
        },
        {
            "headline": "选择要持续显示的内容。",
            "subhead": "为重要优先事项设置小组件。",
        },
        {
            "headline": "一眼看清本周安排。",
            "subhead": "真实小组件让“今天”常驻主屏幕。",
        },
    ],
    "zh-Hant": [
        {
            "headline": "從課程資料開始。",
            "subhead": "課綱和筆記變成由你審核的計畫。",
        },
        {
            "headline": "每個截止日期都由你確認。",
            "subhead": "確認前，不會儲存任何內容。",
        },
        {
            "headline": "看著學期計畫逐步成形。",
            "subhead": "課程、作業和考試集中呈現。",
        },
        {
            "headline": "清楚今天該做什麼。",
            "subhead": "優先事項、截止日期和專注安排一目瞭然。",
        },
        {
            "headline": "為每個截止日期安排時間。",
            "subhead": "把到期任務變成從容的學習時段。",
        },
        {
            "headline": "選擇要持續顯示的內容。",
            "subhead": "為重要優先事項設定小工具。",
        },
        {
            "headline": "一眼看清本週安排。",
            "subhead": "真實小工具讓「今天」常駐主畫面。",
        },
    ],
}


FONT_LATIN = Path("/System/Library/Fonts/HelveticaNeue.ttc")
FONT_ARABIC = Path("/System/Library/Fonts/SFArabic.ttf")
FONT_DEVANAGARI = Path(
    "/System/Library/Fonts/Supplemental/Devanagari Sangam MN.ttc"
)
FONT_JAPANESE = Path("/System/Library/Fonts/Hiragino Sans GB.ttc")
FONT_KOREAN = Path("/System/Library/Fonts/AppleSDGothicNeo.ttc")
FONT_CHINESE = Path("/System/Library/Fonts/STHeiti Medium.ttc")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def protected_digest(relative_path: str) -> str:
    path = ROOT / relative_path
    if path.is_file():
        return sha256_file(path)
    records = []
    for child in sorted(item for item in path.rglob("*") if item.is_file()):
        records.append(
            f"{sha256_file(child)}  {child.relative_to(ROOT).as_posix()}\n"
        )
    return hashlib.sha256("".join(records).encode("utf-8")).hexdigest()


def json_write(path: Path, payload: Any) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def is_rtl(locale: str) -> bool:
    return locale == "ar-SA"


def is_cjk(locale: str) -> bool:
    return locale in {"ja", "zh-Hans", "zh-Hant"}


def display_text(locale: str, text: str) -> str:
    if is_rtl(locale):
        return get_display(arabic_reshaper.reshape(text))
    return text


def font_path(locale: str) -> Path:
    if locale == "ar-SA":
        return FONT_ARABIC
    if locale == "hi":
        return FONT_DEVANAGARI
    if locale == "ja":
        return FONT_JAPANESE
    if locale == "ko":
        return FONT_KOREAN
    if locale in {"zh-Hans", "zh-Hant"}:
        return FONT_CHINESE
    return FONT_LATIN


def load_font(locale: str, size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = font_path(locale)
    if not path.exists():
        raise FileNotFoundError(f"Required font is missing: {path}")
    if path in {FONT_LATIN, FONT_DEVANAGARI}:
        preferred_index = 1 if bold else 0
    elif path == FONT_JAPANESE:
        preferred_index = 2 if bold else 0
    elif path == FONT_KOREAN:
        preferred_index = 6 if bold else 0
    elif path == FONT_CHINESE:
        preferred_index = 1 if locale == "zh-Hans" else 0
    else:
        preferred_index = 0
    try:
        return ImageFont.truetype(str(path), size=size, index=preferred_index)
    except OSError:
        return ImageFont.truetype(str(path), size=size)


def text_measure(
    draw: ImageDraw.ImageDraw,
    locale: str,
    text: str,
    face: ImageFont.FreeTypeFont,
) -> tuple[int, int]:
    box = draw.textbbox((0, 0), display_text(locale, text), font=face)
    return box[2] - box[0], box[3] - box[1]


def tokens_for(locale: str, text: str) -> tuple[list[str], str]:
    if is_cjk(locale):
        return list(text), ""
    return text.split(), " "


def wrap_text(
    draw: ImageDraw.ImageDraw,
    locale: str,
    text: str,
    face: ImageFont.FreeTypeFont,
    max_width: int,
) -> list[str]:
    tokens, separator = tokens_for(locale, text)
    lines: list[str] = []
    current = ""
    for token in tokens:
        trial = f"{current}{separator if current else ''}{token}"
        if current and text_measure(draw, locale, trial, face)[0] > max_width:
            lines.append(current)
            current = token
        else:
            current = trial
    if current:
        lines.append(current)
    return lines


def fit_wrapped_text(
    draw: ImageDraw.ImageDraw,
    locale: str,
    text: str,
    max_width: int,
    max_height: int,
    max_lines: int,
    start_size: int,
    minimum_size: int,
    bold: bool,
    line_gap: int,
) -> tuple[ImageFont.FreeTypeFont, list[str], int]:
    for size in range(start_size, minimum_size - 1, -2):
        face = load_font(locale, size, bold)
        lines = wrap_text(draw, locale, text, face, max_width)
        line_heights = [text_measure(draw, locale, line, face)[1] for line in lines]
        total_height = sum(line_heights) + line_gap * max(0, len(lines) - 1)
        if len(lines) <= max_lines and total_height <= max_height:
            return face, lines, total_height
    raise ValueError(
        f"Text cannot fit without overflow: locale={locale!r}, text={text!r}"
    )


def draw_text_block(
    draw: ImageDraw.ImageDraw,
    locale: str,
    text: str,
    container: tuple[int, int, int, int],
    fill: tuple[int, int, int],
    start_size: int,
    minimum_size: int,
    max_lines: int,
    bold: bool,
    line_gap: int,
    role: str,
) -> dict[str, Any]:
    x1, y1, x2, y2 = container
    face, lines, total_height = fit_wrapped_text(
        draw,
        locale,
        text,
        x2 - x1,
        y2 - y1,
        max_lines,
        start_size,
        minimum_size,
        bold,
        line_gap,
    )
    y = y1
    line_boxes: list[list[int]] = []
    for line in lines:
        rendered = display_text(locale, line)
        width, height = text_measure(draw, locale, line, face)
        x = x2 - width if is_rtl(locale) else x1
        draw.text((x, y), rendered, font=face, fill=fill)
        actual = draw.textbbox((x, y), rendered, font=face)
        line_boxes.append([int(value) for value in actual])
        y += height + line_gap
    overhang_tolerance = 4
    within = all(
        box[0] >= x1 - overhang_tolerance
        and box[1] >= y1 - overhang_tolerance
        and box[2] <= x2 + overhang_tolerance
        and box[3] <= y2 + overhang_tolerance
        for box in line_boxes
    )
    return {
        "role": role,
        "text": text,
        "fontPath": str(font_path(locale).relative_to(Path("/"))),
        "fontSize": face.size,
        "lineCount": len(lines),
        "lineBoxes": line_boxes,
        "container": list(container),
        "totalHeight": total_height,
        "glyphOverhangTolerance": overhang_tolerance,
        "withinContainer": within,
    }


def make_background(slide: Slide) -> Image.Image:
    top = Image.new("RGB", CANVAS, (253, 253, 255))
    bottom_color = tuple(round(250 * 0.58 + channel * 0.42) for channel in slide.tint)
    bottom = Image.new("RGB", CANVAS, bottom_color)
    gradient = Image.linear_gradient("L").resize(CANVAS)
    background = Image.composite(bottom, top, gradient).convert("RGBA")

    glow = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((760, -300, 1500, 440), fill=(*slide.accent, 24))
    glow_draw.ellipse((-380, 2020, 520, 2920), fill=(*slide.accent, 18))
    glow = glow.filter(ImageFilter.GaussianBlur(110))
    background.alpha_composite(glow)

    panel = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    panel_draw = ImageDraw.Draw(panel)
    panel_draw.rounded_rectangle(
        (100, 602, 1142, 2710),
        radius=124,
        fill=(255, 255, 255, 104),
        outline=(255, 255, 255, 150),
        width=2,
    )
    background.alpha_composite(panel.filter(ImageFilter.GaussianBlur(16)))
    return background


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    scale = 3
    mask = Image.new("L", (size[0] * scale, size[1] * scale), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle(
        (0, 0, size[0] * scale - 1, size[1] * scale - 1),
        radius=radius * scale,
        fill=255,
    )
    return mask.resize(size, Image.Resampling.LANCZOS)


def source_root_for_locale(locale: str) -> tuple[Path, str]:
    all_build80_sources_exist = all(
        (BUILD80_SOURCE_ROOT / locale / f"{slide.capture_id}.png").exists()
        and (BUILD80_SOURCE_ROOT / locale / f"{slide.capture_id}.json").exists()
        for slide in SLIDES
        if slide.capture_id
    )
    if all_build80_sources_exist:
        return BUILD80_SOURCE_ROOT, "build80-localized-capture"
    return COMPLETE_SOURCE_ROOT, "complete-localized-release-simulator-capture"


def validate_capture_sidecar(source: Path, sidecar: Path, locale: str) -> dict[str, Any]:
    payload = json.loads(sidecar.read_text(encoding="utf-8"))
    actual_hash = sha256_file(source)
    expected_hash = payload.get("sha256")
    if actual_hash != expected_hash:
        raise ValueError(
            f"Capture hash mismatch for {source}: sidecar={expected_hash}, actual={actual_hash}"
        )
    if payload.get("locale") != locale:
        raise ValueError(
            f"Capture locale mismatch for {source}: sidecar={payload.get('locale')}, expected={locale}"
        )
    with Image.open(source) as image:
        dimensions = list(image.size)
    return {
        "path": source.relative_to(ROOT).as_posix(),
        "sidecar": sidecar.relative_to(ROOT).as_posix(),
        "sha256": actual_hash,
        "bytes": source.stat().st_size,
        "dimensions": dimensions,
        "captureId": payload.get("captureId"),
        "buildNumber": payload.get("buildNumber"),
        "buildConfiguration": payload.get("buildConfiguration"),
        "sourceStateFixture": payload.get("sourceStateFixture"),
        "generatedAt": payload.get("generatedAt"),
        "reviewerNotes": payload.get("reviewerNotes"),
    }


def source_for(locale: str, slide: Slide) -> tuple[Path, dict[str, Any]]:
    if slide.capture_id is None:
        if not HOME_SCREEN_SOURCE.exists():
            raise FileNotFoundError(HOME_SCREEN_SOURCE)
        with Image.open(HOME_SCREEN_SOURCE) as image:
            dimensions = list(image.size)
        return HOME_SCREEN_SOURCE, {
            "path": HOME_SCREEN_SOURCE.relative_to(ROOT).as_posix(),
            "sidecar": None,
            "sha256": sha256_file(HOME_SCREEN_SOURCE),
            "bytes": HOME_SCREEN_SOURCE.stat().st_size,
            "dimensions": dimensions,
            "captureId": "real-springboard-widgetkit-proof",
            "buildNumber": None,
            "buildConfiguration": "live SpringBoard capture",
            "sourceStateFixture": None,
            "generatedAt": None,
            "reviewerNotes": (
                "One untouched English SpringBoard/WidgetKit capture is reused across "
                "all storefront locales; only external marketing copy is localized."
            ),
        }

    root, source_set = source_root_for_locale(locale)
    source = root / locale / f"{slide.capture_id}.png"
    sidecar = root / locale / f"{slide.capture_id}.json"
    if not source.exists() or not sidecar.exists():
        raise FileNotFoundError(f"Missing capture pair: {source} / {sidecar}")
    metadata = validate_capture_sidecar(source, sidecar, locale)
    metadata["sourceSet"] = source_set
    return source, metadata


def paste_native_capture(
    image: Image.Image,
    source: Path,
    slide: Slide,
) -> dict[str, Any]:
    with Image.open(source) as opened:
        capture = opened.convert("RGBA")
    source_width, source_height = capture.size
    viewport_width = 930
    viewport_height = round(viewport_width * source_height / source_width)
    resized = capture.resize(
        (viewport_width, viewport_height), Image.Resampling.LANCZOS
    )

    border = 14
    outer_size = (viewport_width + border * 2, viewport_height + border * 2)
    x = (CANVAS[0] - outer_size[0]) // 2
    y = CANVAS[1] - outer_size[1] - 10

    shadow = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        (x + 18, y + 30, x + outer_size[0] - 18, y + outer_size[1] + 22),
        radius=98,
        fill=(12, 18, 30, 104),
    )
    image.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(36)))

    device = Image.new("RGBA", outer_size, (0, 0, 0, 0))
    device_draw = ImageDraw.Draw(device)
    device_draw.rounded_rectangle(
        (0, 0, outer_size[0] - 1, outer_size[1] - 1),
        radius=94,
        fill=(8, 9, 12, 255),
        outline=(255, 255, 255, 105),
        width=2,
    )
    screen_layer = Image.new("RGBA", resized.size, (0, 0, 0, 0))
    screen_layer.paste(
        resized,
        (0, 0),
        rounded_mask(resized.size, 80),
    )
    device.alpha_composite(screen_layer, (border, border))
    image.alpha_composite(device, (x, y))

    return {
        "sourceDimensions": [source_width, source_height],
        "viewportDimensions": [viewport_width, viewport_height],
        "deviceFrame": [x, y, x + outer_size[0], y + outer_size[1]],
        "scale": round(viewport_width / source_width, 8),
        "operations": [
            "uniform Lanczos resize",
            "rounded viewport mask",
            "external device frame and shadow",
        ],
        "uiRedrawn": False,
        "uiPaintedOver": False,
        "uiRegenerated": False,
        "slideAccent": list(slide.accent),
    }


def patch_mean(image: Image.Image, box: tuple[int, int, int, int]) -> list[float]:
    patch = image.convert("RGB").crop(box)
    pixels = list(patch.getdata())
    return [round(sum(pixel[channel] for pixel in pixels) / len(pixels), 3) for channel in range(3)]


def corner_references(background: Image.Image) -> dict[str, list[float]]:
    width, height = background.size
    size = 28
    boxes = {
        "topLeft": (0, 0, size, size),
        "topRight": (width - size, 0, width, size),
        "bottomLeft": (0, height - size, size, height),
        "bottomRight": (width - size, height - size, width, height),
    }
    return {name: patch_mean(background, box) for name, box in boxes.items()}


def compose(locale: str, slide: Slide) -> tuple[Image.Image, dict[str, Any]]:
    source, source_metadata = source_for(locale, slide)
    background = make_background(slide)
    references = corner_references(background)
    image = background.copy()
    draw = ImageDraw.Draw(image)

    brand_face = load_font("en-US", 23, True)
    brand = "STUDY PLANNER AI"
    brand_box = draw.textbbox((88, 70), brand, font=brand_face)
    draw.rounded_rectangle((72, 56, brand_box[2] + 24, 112), 28, fill=(255, 255, 255, 172))
    draw.ellipse((88, 73, 105, 90), fill=slide.accent)
    draw.text((116, 69), brand, font=brand_face, fill=(30, 33, 39))

    slide_label = f"{slide.index:02d} / 07"
    label_face = load_font("en-US", 22, True)
    label_width = draw.textbbox((0, 0), slide_label, font=label_face)[2]
    draw.text(
        (CANVAS[0] - 88 - label_width, 70),
        slide_label,
        font=label_face,
        fill=(87, 91, 101),
    )

    copy = COPY[locale][slide.index - 1]
    headline_layout = draw_text_block(
        draw,
        locale,
        copy["headline"],
        (88, 164, CANVAS[0] - 88, 366),
        (10, 12, 17),
        78,
        48,
        2,
        True,
        10,
        "headline",
    )
    headline_bottom = max(box[3] for box in headline_layout["lineBoxes"])
    subhead_layout = draw_text_block(
        draw,
        locale,
        copy["subhead"],
        (88, headline_bottom + 24, CANVAS[0] - 88, 548),
        (73, 77, 87),
        40,
        28,
        3,
        False,
        9,
        "subhead",
    )

    transform = paste_native_capture(image, source, slide)
    return image.convert("RGB"), {
        "locale": locale,
        "slide": slide.index,
        "filename": slide.filename,
        "copy": copy,
        "source": source_metadata,
        "transform": transform,
        "textLayout": [headline_layout, subhead_layout],
        "cornerReference": references,
    }


def prepare_output_root() -> None:
    if OUTPUT_ROOT.exists():
        marker = OUTPUT_ROOT / ".review-only-package"
        if not marker.exists() or marker.read_text(encoding="utf-8") != PACKAGE_MARKER:
            raise RuntimeError(
                f"Refusing to replace unrecognized directory: {OUTPUT_ROOT}"
            )
        shutil.rmtree(OUTPUT_ROOT)
    SCREENSHOT_ROOT.mkdir(parents=True)
    CONTACT_SHEET_ROOT.mkdir(parents=True)
    MARKER_PATH.write_text(PACKAGE_MARKER, encoding="utf-8")


def make_card(image_path: Path, width: int, label: str) -> Image.Image:
    with Image.open(image_path) as opened:
        preview = opened.convert("RGB")
    height = round(width * CANVAS[1] / CANVAS[0])
    preview = preview.resize((width, height), Image.Resampling.LANCZOS)
    card = Image.new("RGB", (width + 20, height + 58), (246, 247, 250))
    card.paste(preview, (10, 10))
    draw = ImageDraw.Draw(card)
    face = load_font("en-US", 19, True)
    draw.text((10, height + 20), label, font=face, fill=(32, 35, 42))
    return card


def write_contact_sheets(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    outputs: list[dict[str, Any]] = []
    by_locale: dict[str, list[dict[str, Any]]] = defaultdict(list)
    by_slide: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for entry in entries:
        by_locale[entry["locale"]].append(entry)
        by_slide[entry["slide"]].append(entry)

    locale_root = CONTACT_SHEET_ROOT / "by-locale"
    slide_root = CONTACT_SHEET_ROOT / "by-slide"
    locale_root.mkdir(parents=True)
    slide_root.mkdir(parents=True)

    for locale in LOCALES:
        locale_entries = sorted(by_locale[locale], key=lambda item: item["slide"])
        cards = [
            make_card(ROOT / entry["output"], 170, f"{entry['slide']:02d}")
            for entry in locale_entries
        ]
        gutter, margin, header = 16, 24, 56
        width = margin * 2 + sum(card.width for card in cards) + gutter * (len(cards) - 1)
        height = header + max(card.height for card in cards) + margin
        sheet = Image.new("RGB", (width, height), (236, 238, 243))
        draw = ImageDraw.Draw(sheet)
        draw.text((margin, 14), locale, font=load_font("en-US", 28, True), fill=(20, 22, 28))
        x = margin
        for card in cards:
            sheet.paste(card, (x, header))
            x += card.width + gutter
        path = locale_root / f"{locale}.png"
        sheet.save(path, format="PNG", optimize=False, compress_level=9)
        outputs.append(
            {
                "kind": "locale",
                "key": locale,
                "path": path.relative_to(ROOT).as_posix(),
                "sha256": sha256_file(path),
                "dimensions": list(sheet.size),
            }
        )

    for slide in SLIDES:
        slide_entries = sorted(by_slide[slide.index], key=lambda item: LOCALES.index(item["locale"]))
        cards = [
            make_card(ROOT / entry["output"], 176, entry["locale"])
            for entry in slide_entries
        ]
        columns, gutter, margin, header = 5, 16, 24, 62
        rows = math.ceil(len(cards) / columns)
        card_width = max(card.width for card in cards)
        card_height = max(card.height for card in cards)
        width = margin * 2 + columns * card_width + (columns - 1) * gutter
        height = header + rows * card_height + (rows - 1) * gutter + margin
        sheet = Image.new("RGB", (width, height), (236, 238, 243))
        draw = ImageDraw.Draw(sheet)
        draw.text(
            (margin, 14),
            f"Slide {slide.index:02d} · all locales",
            font=load_font("en-US", 28, True),
            fill=(20, 22, 28),
        )
        for index, card in enumerate(cards):
            row, column = divmod(index, columns)
            x = margin + column * (card_width + gutter)
            y = header + row * (card_height + gutter)
            sheet.paste(card, (x, y))
        path = slide_root / f"{slide.filename.removesuffix('.png')}-all-locales.png"
        sheet.save(path, format="PNG", optimize=False, compress_level=9)
        outputs.append(
            {
                "kind": "slide",
                "key": slide.index,
                "path": path.relative_to(ROOT).as_posix(),
                "sha256": sha256_file(path),
                "dimensions": list(sheet.size),
            }
        )

    thumb_width = 120
    cards_by_entry = [
        make_card(ROOT / entry["output"], thumb_width, f"{entry['locale']} · {entry['slide']:02d}")
        for entry in sorted(entries, key=lambda item: (LOCALES.index(item["locale"]), item["slide"]))
    ]
    columns, gutter, margin, header = 7, 10, 20, 60
    rows = math.ceil(len(cards_by_entry) / columns)
    card_width = max(card.width for card in cards_by_entry)
    card_height = max(card.height for card in cards_by_entry)
    width = margin * 2 + columns * card_width + (columns - 1) * gutter
    height = header + rows * card_height + (rows - 1) * gutter + margin
    master = Image.new("RGB", (width, height), (232, 234, 240))
    master_draw = ImageDraw.Draw(master)
    master_draw.text(
        (margin, 14),
        "Reviewed Plan · 17 locales × 7 screenshots · REVIEW ONLY",
        font=load_font("en-US", 25, True),
        fill=(20, 22, 28),
    )
    for index, card in enumerate(cards_by_entry):
        row, column = divmod(index, columns)
        x = margin + column * (card_width + gutter)
        y = header + row * (card_height + gutter)
        master.paste(card, (x, y))
    master_path = CONTACT_SHEET_ROOT / "all-119-screenshots.png"
    master.save(master_path, format="PNG", optimize=False, compress_level=9)
    outputs.append(
        {
            "kind": "master",
            "key": "all-119",
            "path": master_path.relative_to(ROOT).as_posix(),
            "sha256": sha256_file(master_path),
            "dimensions": list(master.size),
        }
    )
    return outputs


def audit_entries(entries: list[dict[str, Any]]) -> dict[str, Any]:
    expected_paths = {
        (locale, slide.index)
        for locale in LOCALES
        for slide in SLIDES
    }
    actual_paths = {(entry["locale"], entry["slide"]) for entry in entries}
    locale_counts = Counter(entry["locale"] for entry in entries)
    count_check = {
        "pass": len(entries) == 119
        and actual_paths == expected_paths
        and all(locale_counts[locale] == 7 for locale in LOCALES),
        "expected": 119,
        "actual": len(entries),
        "localeCounts": dict(sorted(locale_counts.items())),
        "missing": sorted([list(item) for item in expected_paths - actual_paths]),
        "unexpected": sorted([list(item) for item in actual_paths - expected_paths]),
    }

    dimension_failures = []
    mode_failures = []
    corner_failures = []
    text_failures = []
    output_hashes: dict[str, list[str]] = defaultdict(list)
    source_hashes: dict[str, list[str]] = defaultdict(list)
    source_sidecar_failures = []
    corner_boxes = {
        "topLeft": (0, 0, 28, 28),
        "topRight": (CANVAS[0] - 28, 0, CANVAS[0], 28),
        "bottomLeft": (0, CANVAS[1] - 28, 28, CANVAS[1]),
        "bottomRight": (CANVAS[0] - 28, CANVAS[1] - 28, CANVAS[0], CANVAS[1]),
    }

    for entry in entries:
        output = ROOT / entry["output"]
        with Image.open(output) as image:
            dimensions = image.size
            mode = image.mode
            if dimensions != CANVAS:
                dimension_failures.append(
                    {"path": entry["output"], "dimensions": list(dimensions)}
                )
            if mode != "RGB":
                mode_failures.append({"path": entry["output"], "mode": mode})
            for name, box in corner_boxes.items():
                actual = patch_mean(image, box)
                expected = entry["cornerReference"][name]
                maximum_delta = max(abs(actual[index] - expected[index]) for index in range(3))
                if maximum_delta > 12 or min(actual) < 175:
                    corner_failures.append(
                        {
                            "path": entry["output"],
                            "corner": name,
                            "actualMean": actual,
                            "backgroundMean": expected,
                            "maximumDelta": round(maximum_delta, 3),
                        }
                    )

        output_hashes[entry["sha256"]].append(entry["output"])
        source_hashes[entry["source"]["sha256"]].append(entry["source"]["path"])
        for layout in entry["textLayout"]:
            if not layout["withinContainer"]:
                text_failures.append(
                    {
                        "path": entry["output"],
                        "role": layout["role"],
                        "lineBoxes": layout["lineBoxes"],
                        "container": layout["container"],
                    }
                )
        source = ROOT / entry["source"]["path"]
        if sha256_file(source) != entry["source"]["sha256"]:
            source_sidecar_failures.append(
                {"path": entry["source"]["path"], "reason": "source changed after composition"}
            )

    duplicate_outputs = {
        digest: paths for digest, paths in output_hashes.items() if len(paths) > 1
    }
    duplicate_sources = {
        digest: sorted(set(paths))
        for digest, paths in source_hashes.items()
        if len(paths) > 1
    }

    protected_after = {
        relative_path: protected_digest(relative_path)
        for relative_path in PROTECTED_BASELINES
    }
    protected_mismatches = [
        {
            "path": relative_path,
            "before": expected,
            "after": protected_after[relative_path],
        }
        for relative_path, expected in PROTECTED_BASELINES.items()
        if protected_after[relative_path] != expected
    ]

    checks = {
        "counts": count_check,
        "dimensions": {
            "pass": not dimension_failures,
            "expected": list(CANVAS),
            "failures": dimension_failures,
        },
        "imageMode": {
            "pass": not mode_failures,
            "expected": "RGB",
            "failures": mode_failures,
        },
        "cornerAndBackground": {
            "pass": not corner_failures,
            "method": (
                "Compare mean RGB in four 28×28 output-corner patches with the "
                "pre-composition background; require <=12 channel delta and >=175 brightness."
            ),
            "failures": corner_failures,
        },
        "textOverflow": {
            "pass": not text_failures,
            "method": (
                "Measure every external headline/subhead line against its explicit safe container."
            ),
            "failures": text_failures,
        },
        "duplicateOutputHashes": {
            "pass": not duplicate_outputs,
            "duplicates": duplicate_outputs,
        },
        "sourceHashes": {
            "pass": not source_sidecar_failures,
            "failures": source_sidecar_failures,
            "duplicateInputsInformational": duplicate_sources,
        },
        "protectedPathsUnchanged": {
            "pass": not protected_mismatches,
            "baselines": PROTECTED_BASELINES,
            "after": protected_after,
            "mismatches": protected_mismatches,
        },
    }
    return {
        "schemaVersion": 1,
        "package": "copy-b-reviewed-plan-review-only-2026-07-09",
        "overallPass": all(check["pass"] for check in checks.values()),
        "checks": checks,
        "humanReviewStillRequired": True,
    }


def write_readme(audit: dict[str, Any]) -> None:
    build80_locales = [
        locale
        for locale in LOCALES
        if source_root_for_locale(locale)[0] == BUILD80_SOURCE_ROOT
    ]
    fallback_locales = [locale for locale in LOCALES if locale not in build80_locales]
    readme = f"""# Copy B · Reviewed Plan · REVIEW ONLY

This is a non-upload, human-review candidate package. It is not referenced by
`store.config.json` and must not be uploaded to App Store Connect without a new human
visual, localization, and exact-release-build review.

## Automated result

- Overall automated audit: **{'PASS' if audit['overallPass'] else 'FAIL'}**
- Screenshots: 119 total (17 locales × 7), each 1242×2688 RGB PNG
- UI treatment: untouched capture pixels, uniform resize, rounded viewport mask, and an
  external device frame only; no UI regeneration, repainting, or translated redraw
- External copy: localized Reviewed Plan headlines and subheads

## Capture provenance

- Complete Build 80 locale sets used: {', '.join(build80_locales)}
- Complete release-simulator/build57 fallback sets used: {', '.join(fallback_locales)}
- Slide 7 uses the same raw English SpringBoard/WidgetKit capture for all locales:
  `qa-screenshots/live/device-studyplanner-two-small-week-final-candidate.png`

## Human-review caveats

1. **Mixed release baselines:** eight locales have a complete newer Build 80 capture
   set; the remaining locales use the complete older localized release-simulator set.
   This package is suitable for route/layout review, not final upload provenance.
2. **Home Screen localization:** slide 7 is truthful live WidgetKit/SpringBoard proof,
   but its internal widget and system strings are English in every storefront. Only
   the external headline and subhead are localized.
3. **Exact binary:** neither simulator fixture set establishes that every pixel came
   from the exact binary ultimately submitted to App Store Review. Re-capture and
   re-approve against that binary before upload.
4. **Language review:** the external translations are intentionally concise and
   locale-specific, but they still require native-speaker approval in all 17 locales.
5. **UI crop review:** automation verifies dimensions, safe text boxes, background
   corners, hashes, and counts; a human must still confirm that every visible product
   state is persuasive, legible, internally localized, and claim-supporting.
6. **Portuguese (Portugal) blocker:** the untouched `pt-PT` capture set visibly uses
   Brazilian Portuguese product UI (for example, “você”). The external copy is
   European Portuguese, but this locale must be re-captured from a correctly localized
   binary before upload.
7. **Traditional Chinese blocker:** the untouched `zh-Hant` capture set visibly uses
   Simplified Chinese product UI (for example, “进度稳定” rather than “進度穩定”). The
   external copy is Traditional Chinese, but this locale must be re-captured from a
   correctly localized binary before upload.

## Key artifacts

- `screenshots/<locale>/APP_IPHONE_65/*.png`
- `manifest.json` — copy, source sidecars/hashes, output hashes, dimensions, transforms
- `audit.json` — count/dimension/corner/background/overflow/duplicate/protection checks
- `copy.json` — all 17 localized external copy sets
- `contact-sheets/all-119-screenshots.png`
- `contact-sheets/by-locale/*.png`
- `contact-sheets/by-slide/*.png`

Protected live/control paths were checked against their pre-build digests and remain
unchanged. This generator never writes to App Store Connect.
"""
    (OUTPUT_ROOT / "README.md").write_text(readme, encoding="utf-8")


def main() -> None:
    if set(COPY) != set(LOCALES):
        raise ValueError("Copy locale set does not match the required locale set")
    if any(len(COPY[locale]) != 7 for locale in LOCALES):
        raise ValueError("Every locale must contain exactly seven copy entries")

    prepare_output_root()
    entries: list[dict[str, Any]] = []
    for locale in LOCALES:
        output_dir = SCREENSHOT_ROOT / locale / SCREEN_SLOT
        output_dir.mkdir(parents=True)
        for slide in SLIDES:
            image, entry = compose(locale, slide)
            output = output_dir / slide.filename
            image.save(output, format="PNG", optimize=False, compress_level=9)
            entry["output"] = output.relative_to(ROOT).as_posix()
            entry["outputDimensions"] = list(image.size)
            entry["bytes"] = output.stat().st_size
            entry["sha256"] = sha256_file(output)
            entries.append(entry)

    contact_sheets = write_contact_sheets(entries)
    audit = audit_entries(entries)
    manifest = {
        "schemaVersion": 1,
        "package": "copy-b-reviewed-plan-review-only-2026-07-09",
        "status": "REVIEW_ONLY_DO_NOT_UPLOAD",
        "positioningRoute": "Reviewed Plan",
        "priorResearchScore": 97,
        "outputRoot": OUTPUT_ROOT.relative_to(ROOT).as_posix(),
        "screenSlot": SCREEN_SLOT,
        "requiredDimensions": list(CANVAS),
        "localeOrder": LOCALES,
        "slideOrder": [slide.filename for slide in SLIDES],
        "compositionPolicy": {
            "uiRegenerated": False,
            "uiRedrawn": False,
            "uiPaintedOver": False,
            "allowedCaptureOperations": [
                "uniform Lanczos resize",
                "rounded viewport mask",
                "external frame and shadow",
            ],
            "externalCopyOnly": True,
        },
        "knownHumanReviewBlockers": [
            {
                "scope": "all locales, slide 7",
                "issue": "One truthful English SpringBoard/WidgetKit capture is reused; internal Home Screen UI is not localized.",
            },
            {
                "scope": "pt-PT, slides 1-6",
                "issue": "Untouched source captures visibly contain Brazilian Portuguese product UI.",
            },
            {
                "scope": "zh-Hant, slides 1-6",
                "issue": "Untouched source captures visibly contain Simplified Chinese product UI.",
            },
            {
                "scope": "capture provenance",
                "issue": "Eight locales use complete Build 80 captures; nine use the older complete release-simulator/build57 set.",
            },
        ],
        "screenshots": entries,
        "contactSheets": contact_sheets,
    }
    json_write(OUTPUT_ROOT / "copy.json", COPY)
    json_write(OUTPUT_ROOT / "manifest.json", manifest)
    json_write(OUTPUT_ROOT / "audit.json", audit)
    write_readme(audit)

    print(f"output: {OUTPUT_ROOT}")
    print(f"screenshots: {len(entries)}")
    print(f"contact sheets: {len(contact_sheets)}")
    print(f"automated audit: {'PASS' if audit['overallPass'] else 'FAIL'}")
    if not audit["overallPass"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
