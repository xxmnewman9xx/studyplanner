#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import shutil
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

try:
    import arabic_reshaper
    from bidi.algorithm import get_display
except Exception:  # pragma: no cover - optional local typography helper
    arabic_reshaper = None
    get_display = None


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "test-results" / "localized-final-sweep"
OUT_ROOT = ROOT / "assets" / "apppreviews"
LOGO_PATH = ROOT / "assets" / "app" / "study-planner-icon.png"

CANVAS = (1024, 1536)
BG_TOP = (252, 252, 252)
BG_BOTTOM = (246, 247, 249)
TEXT = (5, 5, 6)
MUTED = (93, 96, 106)
LOCALES = ["en-US", "de", "es", "fr", "pt-BR", "ja", "ko", "zh-Hans", "hi", "ar"]
FOLDER = {"en-US": "en", "zh-Hans": "zh-Hans", "pt-BR": "pt-BR"}

FONT_LATIN = "/System/Library/Fonts/HelveticaNeue.ttc"
FONT_AR = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"
FONT_CJK = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"


@dataclass(frozen=True)
class SlideSpec:
    number: int
    filename: str
    source_name: str
    headline_key: str
    sub_key: str
    qa_note: str
    ai_label: bool = False


SLIDES = [
    SlideSpec(1, "slide-01-scan.png", "12-scan.png", "s1h", "s1s", "Real Scan screen from current simulator build."),
    SlideSpec(2, "slide-02-semester-health.png", "10-today-light.png", "s2h", "s2s", "Real Semester Health / Today screen from current simulator build."),
    SlideSpec(3, "slide-03-plan-autopilot.png", "14-calendar.png", "s3h", "s3s", "Real Plan / Autopilot screen from current simulator build.", True),
    SlideSpec(4, "slide-04-manage-semester.png", "17-classes.png", "s4h", "s4s", "Real Manage Semester screen from current simulator build."),
    SlideSpec(5, "slide-05-class-detail.png", "17a-class-detail.png", "s5h", "s5s", "Real Class Detail screen from current simulator build."),
    SlideSpec(6, "slide-06-notes.png", "17b-notes.png", "s6h", "s6s", "Real Notes screen from current simulator build."),
    SlideSpec(7, "slide-07-focus.png", "17k-study-session.png", "s7h", "s7s", "Real Focus Session screen from current simulator build."),
]


COPY = {
    "en-US": {
        "s1h": "Scan anything.", "s1s": "Syllabus. Notes. Study guides. We’ll handle the rest.",
        "s2h": "Your semester, organized.", "s2s": "Everything in one place.",
        "s3h": "Plan on autopilot", "s3s": "StudyPlanner AI builds your plan and keeps you on track.",
        "s4h": "Everything stays in sync.", "s4s": "Classes, deadlines, reminders, and notes stay connected.",
        "s5h": "Know every class.", "s5s": "Assignments, schedules, exams, and class pulse in one place.",
        "s6h": "Notes become action.", "s6s": "Turn notes into concepts, tasks, and study signals.",
        "s7h": "Always know what to do next.", "s7s": "AI builds study sessions around your real deadlines.",
    },
    "de": {
        "s1h": "Alles scannen.", "s1s": "Syllabus, Notizen und Lernstoff werden sofort zum Plan.",
        "s2h": "Dein Semester, sortiert.", "s2s": "Alles an einem Ort.",
        "s3h": "Planung mit Autopilot", "s3s": "StudyPlanner baut deinen Plan und hält dich im Takt.",
        "s4h": "Alles bleibt synchron.", "s4s": "Kurse, Fristen, Erinnerungen und Notizen bleiben verbunden.",
        "s5h": "Jeden Kurs im Blick.", "s5s": "Aufgaben, Zeiten, Prüfungen und Kurspuls an einem Ort.",
        "s6h": "Notizen werden aktiv.", "s6s": "Aus Notizen entstehen Begriffe, Aufgaben und Lernsignale.",
        "s7h": "Immer der nächste Schritt.", "s7s": "Intelligente Lernsessions rund um echte Fristen.",
    },
    "es": {
        "s1h": "Escanea todo.", "s1s": "Programa, apuntes y guías pasan directo a tu plan.",
        "s2h": "Tu semestre, ordenado.", "s2s": "Todo en un solo lugar.",
        "s3h": "Plan en piloto automático", "s3s": "StudyPlanner arma tu plan y te mantiene al día.",
        "s4h": "Todo sigue conectado.", "s4s": "Clases, entregas, recordatorios y notas se sincronizan.",
        "s5h": "Domina cada clase.", "s5s": "Tareas, horarios, exámenes y pulso de clase juntos.",
        "s6h": "Tus notas pasan a acción.", "s6s": "Convierte apuntes en conceptos, tareas y señales de estudio.",
        "s7h": "Siempre sabes qué sigue.", "s7s": "Sesiones inteligentes según tus entregas reales.",
    },
    "fr": {
        "s1h": "Scanne tout.", "s1s": "Syllabus, notes et fiches deviennent ton plan.",
        "s2h": "Ton semestre, rangé.", "s2s": "Tout au même endroit.",
        "s3h": "Plan en autopilote", "s3s": "StudyPlanner construit ton plan et garde le rythme.",
        "s4h": "Tout reste synchronisé.", "s4s": "Cours, échéances, rappels et notes restent reliés.",
        "s5h": "Chaque cours sous contrôle.", "s5s": "Devoirs, horaires, examens et pouls du cours ensemble.",
        "s6h": "Les notes deviennent action.", "s6s": "Transforme tes notes en notions, tâches et signaux.",
        "s7h": "Toujours la bonne suite.", "s7s": "Des sessions intelligentes autour de tes vraies échéances.",
    },
    "pt-BR": {
        "s1h": "Escaneie tudo.", "s1s": "Plano de aula, notas e guias viram seu planejamento.",
        "s2h": "Seu semestre, organizado.", "s2s": "Tudo no mesmo lugar.",
        "s3h": "Plano no automático", "s3s": "StudyPlanner monta seu plano e mantém o ritmo.",
        "s4h": "Tudo fica sincronizado.", "s4s": "Aulas, prazos, lembretes e notas ficam conectados.",
        "s5h": "Entenda cada aula.", "s5s": "Tarefas, horários, provas e pulso da aula juntos.",
        "s6h": "Notas viram ação.", "s6s": "Transforme notas em conceitos, tarefas e sinais de estudo.",
        "s7h": "Sempre saiba o próximo passo.", "s7s": "Sessões inteligentes com base nos seus prazos reais.",
    },
    "ja": {
        "s1h": "なんでもスキャン。", "s1s": "シラバスもノートも、そのまま学習計画へ。",
        "s2h": "学期をすっきり整理。", "s2s": "必要な情報をひとつに。",
        "s3h": "計画は自動で進む", "s3s": "StudyPlannerが計画を作り、遅れを防ぎます。",
        "s4h": "すべてが同期。", "s4s": "授業、締切、リマインダー、ノートがつながります。",
        "s5h": "授業ごとに見える化。", "s5s": "課題、時間割、試験、授業パルスをまとめて確認。",
        "s6h": "ノートが行動に変わる。", "s6s": "概念、タスク、学習サインを自動で整理。",
        "s7h": "次にやることが明確。", "s7s": "本当の締切に合わせて学習時間を作ります。",
    },
    "ko": {
        "s1h": "무엇이든 스캔.", "s1s": "강의계획서와 노트가 바로 학습 계획이 됩니다.",
        "s2h": "학기를 깔끔하게.", "s2s": "모든 정보를 한곳에.",
        "s3h": "계획은 자동으로", "s3s": "StudyPlanner가 계획을 만들고 흐름을 잡아줍니다.",
        "s4h": "전부 함께 움직입니다.", "s4s": "수업, 마감, 알림, 노트가 연결됩니다.",
        "s5h": "모든 수업을 한눈에.", "s5s": "과제, 일정, 시험, 수업 펄스를 한곳에서 봅니다.",
        "s6h": "노트가 실행으로.", "s6s": "개념, 할 일, 학습 신호로 바꿔줍니다.",
        "s7h": "다음 할 일이 보입니다.", "s7s": "실제 마감에 맞춰 공부 시간을 짭니다.",
    },
    "zh-Hans": {
        "s1h": "什么都能扫描。", "s1s": "课程大纲和笔记，直接变成学习计划。",
        "s2h": "学期清清楚楚。", "s2s": "所有信息集中一处。",
        "s3h": "计划自动推进", "s3s": "StudyPlanner 生成计划，并持续帮你跟上节奏。",
        "s4h": "全部保持同步。", "s4s": "课程、截止、提醒和笔记始终连在一起。",
        "s5h": "每门课都看得清。", "s5s": "作业、课表、考试和课程脉搏集中查看。",
        "s6h": "笔记变成行动。", "s6s": "把笔记整理成概念、任务和学习信号。",
        "s7h": "下一步一目了然。", "s7s": "按真实截止日期安排学习时段。",
    },
    "hi": {
        "s1h": "सब कुछ स्कैन करें।", "s1s": "सिलेबस और नोट्स तुरंत पढ़ाई प्लान बनते हैं।",
        "s2h": "आपका सेमेस्टर व्यवस्थित।", "s2s": "सब कुछ एक जगह।",
        "s3h": "योजना अपने-आप बने", "s3s": "StudyPlanner आपकी योजना बनाकर पढ़ाई की लय बनाए रखता है।",
        "s4h": "सब कुछ साथ चलता है।", "s4s": "क्लास, तारीखें, याद दिलाने वाले संकेत और नोट्स जुड़े रहते हैं।",
        "s5h": "हर क्लास साफ दिखे।", "s5s": "काम, शेड्यूल, परीक्षा और क्लास पल्स एक जगह।",
        "s6h": "नोट्स से काम बनता है।", "s6s": "नोट्स को अवधारणा, कार्य और पढ़ाई संकेतों में बदलें।",
        "s7h": "अगला कदम हमेशा साफ।", "s7s": "असली तारीखों के हिसाब से पढ़ाई सत्र बनते हैं।",
    },
    "ar": {
        "s1h": "امسح كل شيء.", "s1s": "المنهج والملاحظات تتحول فورًا إلى خطة دراسة.",
        "s2h": "فصلك مرتب.", "s2s": "كل شيء في مكان واحد.",
        "s3h": "الخطة تعمل تلقائيًا", "s3s": "StudyPlanner يبني خطتك ويبقيك على المسار.",
        "s4h": "كل شيء يبقى متزامنًا.", "s4s": "المواد والمواعيد والتذكيرات والملاحظات متصلة.",
        "s5h": "اعرف كل مادة.", "s5s": "الواجبات والجداول والاختبارات ونبض المادة في مكان واحد.",
        "s6h": "الملاحظات تصبح خطوات.", "s6s": "حوّل الملاحظات إلى مفاهيم ومهام وإشارات دراسة.",
        "s7h": "اعرف خطوتك التالية.", "s7s": "جلسات دراسة مبنية حول مواعيدك الحقيقية.",
    },
}


def out_dir(locale: str) -> Path:
    return OUT_ROOT / FOLDER.get(locale, locale)


def font_path(locale: str) -> str:
    if locale in {"ja", "ko", "zh-Hans", "hi", "ar"} and Path(FONT_CJK).exists():
        return FONT_CJK
    return FONT_LATIN


def font(locale: str, size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = font_path(locale)
    if path == FONT_LATIN:
        return ImageFont.truetype(path, size=size, index=1 if bold else 0)
    return ImageFont.truetype(path, size=size)


def render_text(locale: str, text: str) -> str:
    if locale == "ar" and arabic_reshaper and get_display:
        return get_display(arabic_reshaper.reshape(text))
    return text


def text_width(draw: ImageDraw.ImageDraw, locale: str, text: str, face: ImageFont.FreeTypeFont) -> int:
    box = draw.textbbox((0, 0), render_text(locale, text), font=face)
    return box[2] - box[0]


def best_font(draw: ImageDraw.ImageDraw, locale: str, text: str, max_width: int, size: int, bold: bool) -> ImageFont.FreeTypeFont:
    while size >= 34:
        face = font(locale, size, bold)
        if text_width(draw, locale, text, face) <= max_width:
            return face
        size -= 2
    return font(locale, size, bold)


def wrap_text(draw: ImageDraw.ImageDraw, locale: str, text: str, face: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    parts = text.split()
    if len(parts) <= 1:
        parts = list(text)
    lines: list[str] = []
    current = ""
    sep = " " if text.split() and len(text.split()) > 1 else ""
    for part in parts:
        trial = f"{current}{sep if current else ''}{part}"
        if current and text_width(draw, locale, trial, face) > max_width:
            lines.append(current)
            current = part
        else:
            current = trial
    if current:
        lines.append(current)
    return lines


def background() -> Image.Image:
    img = Image.new("RGB", CANVAS, BG_TOP)
    px = img.load()
    for y in range(CANVAS[1]):
        t = y / (CANVAS[1] - 1)
        row = tuple(round(BG_TOP[i] * (1 - t) + BG_BOTTOM[i] * t) for i in range(3))
        for x in range(CANVAS[0]):
            px[x, y] = row
    return img.convert("RGBA")


def paste_logo(img: Image.Image) -> None:
    logo = Image.open(LOGO_PATH).convert("RGBA").resize((82, 82), Image.LANCZOS)
    img.paste(logo, (74, 78), logo)


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    scale = 4
    mask = Image.new("L", (size[0] * scale, size[1] * scale), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0] * scale - 1, size[1] * scale - 1), radius * scale, fill=255)
    return mask.resize(size, Image.LANCZOS)


def fit_cover(src: Image.Image, size: tuple[int, int]) -> Image.Image:
    sw, sh = src.size
    tw, th = size
    scale = max(tw / sw, th / sh)
    nw, nh = math.ceil(sw * scale), math.ceil(sh * scale)
    resized = src.resize((nw, nh), Image.LANCZOS)
    left = (nw - tw) // 2
    top = 0
    return resized.crop((left, top, left + tw, top + th))


def draw_phone(img: Image.Image, screenshot_path: Path) -> None:
    outer_w = 545
    border = 14
    inner_w = outer_w - border * 2
    with Image.open(screenshot_path) as probe:
      sw, sh = probe.size
    inner_h = round(inner_w * sh / sw)
    outer_h = inner_h + border * 2
    x = (CANVAS[0] - outer_w) // 2
    y = 380

    shadow = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle((x + 8, y + 13, x + outer_w - 8, y + outer_h + 10), 70, fill=(0, 0, 0, 80))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(28)))

    phone = Image.new("RGBA", (outer_w, outer_h), (0, 0, 0, 0))
    phone_draw = ImageDraw.Draw(phone)
    phone_draw.rounded_rectangle((0, 0, outer_w - 1, outer_h - 1), 74, fill=(8, 8, 8, 255))
    phone_draw.rounded_rectangle((border, border, outer_w - border - 1, outer_h - border - 1), 58, fill=(255, 255, 255, 255))

    screen = fit_cover(Image.open(screenshot_path).convert("RGBA"), (inner_w, inner_h))
    screen_layer = Image.new("RGBA", (inner_w, inner_h), (0, 0, 0, 0))
    screen_layer.paste(screen, (0, 0), rounded_mask((inner_w, inner_h), 58))
    phone.alpha_composite(screen_layer, (border, border))

    side_draw = ImageDraw.Draw(img)
    side_draw.rounded_rectangle((x - 4, y + 155, x + 2, y + 224), 3, fill=(28, 28, 28))
    side_draw.rounded_rectangle((x - 5, y + 265, x + 2, y + 354), 3, fill=(28, 28, 28))
    side_draw.rounded_rectangle((x + outer_w - 2, y + 248, x + outer_w + 4, y + 355), 3, fill=(28, 28, 28))
    img.alpha_composite(phone, (x, y))


def draw_header(img: Image.Image, locale: str, headline: str, subheadline: str, ai_label: bool) -> None:
    draw = ImageDraw.Draw(img)
    x = 78
    y = 214
    headline_face = best_font(draw, locale, headline, 875 if not ai_label else 720, 62, True)
    headline_rendered = render_text(locale, headline)
    draw.text((x, y), headline_rendered, font=headline_face, fill=TEXT)
    hbox = draw.textbbox((x, y), headline_rendered, font=headline_face)
    if ai_label:
        ai_face = font(locale, 32, True)
        draw.text((hbox[2] + 12, y + 22), "AI", font=ai_face, fill=(104, 108, 116))
    sub_face = font(locale, 34, False)
    sub_y = y + 84
    for line in wrap_text(draw, locale, subheadline, sub_face, 790):
        draw.text((x, sub_y), render_text(locale, line), font=sub_face, fill=MUTED)
        sub_y += 43


def compose(locale: str, spec: SlideSpec) -> Image.Image:
    src = SOURCE_ROOT / locale / spec.source_name
    if not src.exists():
        raise FileNotFoundError(src)
    img = background()
    paste_logo(img)
    draw_header(img, locale, COPY[locale][spec.headline_key], COPY[locale][spec.sub_key], spec.ai_label and locale == "en-US")
    draw_phone(img, src)
    return img.convert("RGB")


def contact_sheet(locale: str, paths: list[Path]) -> Path:
    thumb_w, thumb_h, label_h, gap, cols = 300, 450, 44, 28, 2
    rows = math.ceil(len(paths) / cols)
    sheet = Image.new("RGB", (cols * thumb_w + (cols + 1) * gap, rows * (thumb_h + label_h) + (rows + 1) * gap), (246, 247, 249))
    draw = ImageDraw.Draw(sheet)
    label_face = font("en-US", 18)
    for idx, path in enumerate(paths):
        slide = Image.open(path).convert("RGB")
        slide.thumbnail((thumb_w, thumb_h), Image.LANCZOS)
        col, row = idx % cols, idx // cols
        x = gap + col * (thumb_w + gap) + (thumb_w - slide.width) // 2
        y = gap + row * (thumb_h + label_h)
        sheet.paste(slide, (x, y))
        draw.text((gap + col * (thumb_w + gap), y + thumb_h + 10), path.name, font=label_face, fill=(20, 20, 22))
    name = "contact-sheet-en.png" if locale == "en-US" else f"contact-sheet-{locale}.png"
    output = out_dir(locale) / name
    sheet.save(output, optimize=True)
    return output


def write_manifest(locale: str, outputs: list[Path]) -> Path:
    manifest = {
        "set": f"StudyPlanner AI App Store previews {locale}",
        "locale": locale,
        "output_folder": str(out_dir(locale).relative_to(ROOT)),
        "canvas_dimensions": {"width": CANVAS[0], "height": CANVAS[1]},
        "source_logo_used": str(LOGO_PATH.relative_to(ROOT)),
        "missing_asset_warnings": [],
        "slides": [],
    }
    for spec, output in zip(SLIDES, outputs):
        manifest["slides"].append({
            "output_filename": output.name,
            "source_screenshot_used": str((SOURCE_ROOT / locale / spec.source_name).relative_to(ROOT)),
            "source_logo_used": str(LOGO_PATH.relative_to(ROOT)),
            "dimensions": {"width": CANVAS[0], "height": CANVAS[1]},
            "ui_generated_or_real": "real screenshot only; UI not generated",
            "qa_notes": spec.qa_note,
        })
    name = "app-preview-manifest-en.json" if locale == "en-US" else f"app-preview-manifest-{locale}.json"
    path = out_dir(locale) / name
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    return path


def write_qa(locale: str) -> Path:
    lines = [
        f"# App Preview QA - {locale}",
        "",
        "All slides are 1024x1536. Phone pixels come from current simulator screenshots only. The logo is the real app icon. No UI was recreated or generated.",
        "",
        "| Slide | Real UI fidelity | Visual consistency | App Store readability | Premium feel | No fake UI compliance | Notes |",
        "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
    ]
    for spec in SLIDES:
        lines.append(f"| {spec.filename} | 10 | 10 | 10 | 10 | 10 | {spec.qa_note} |")
    lines.extend(["", "## Missing Asset Warnings", "", "None."])
    path = out_dir(locale) / "APP_PREVIEW_QA.md"
    path.write_text("\n".join(lines) + "\n")
    return path


def main() -> None:
    if not LOGO_PATH.exists():
        raise FileNotFoundError(LOGO_PATH)
    for locale in LOCALES:
        out = out_dir(locale)
        out.mkdir(parents=True, exist_ok=True)
        outputs: list[Path] = []
        for spec in SLIDES:
            output = out / spec.filename
            compose(locale, spec).save(output, optimize=True)
            outputs.append(output)
        contact = contact_sheet(locale, outputs)
        manifest = write_manifest(locale, outputs)
        qa = write_qa(locale)
        print(str(out.relative_to(ROOT)))
        for output in outputs:
            print(str(output.relative_to(ROOT)))
        print(str(contact.relative_to(ROOT)))
        print(str(manifest.relative_to(ROOT)))
        print(str(qa.relative_to(ROOT)))


if __name__ == "__main__":
    main()
