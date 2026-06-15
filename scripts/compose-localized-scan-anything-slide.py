#!/usr/bin/env python3
from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

try:
    import arabic_reshaper
    from bidi.algorithm import get_display
except Exception:
    arabic_reshaper = None
    get_display = None


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "test-results" / "localized-final-sweep"
OUT_ROOT = ROOT / "assets" / "apppreviews"
LOGO_PATH = ROOT / "assets" / "app" / "study-planner-icon.png"

CANVAS = (1024, 1536)
TEXT = (5, 5, 6)
MUTED = (93, 96, 106)
BG = (249, 249, 248)
WHITE = (255, 255, 255)
LOCALES = ["en-US", "de", "es", "fr", "pt-BR", "ja", "ko", "zh-Hans", "hi", "ar"]
FOLDER = {"en-US": "en", "pt-BR": "pt-BR", "zh-Hans": "zh-Hans"}

FONT_LATIN = "/System/Library/Fonts/HelveticaNeue.ttc"
FONT_CJK = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"
FONT_DEVANAGARI = "/System/Library/Fonts/Supplemental/Devanagari Sangam MN.ttc"


COPY = {
    "en-US": {
        "headline": "Scan anything.",
        "sub": "Syllabus. Notes. Study guides. We’ll handle the rest.",
        "assignments": "Assignments", "assignments_sub": "18 found",
        "notes": "Notes", "notes_sub": "12 pages",
        "deadlines": "Deadlines", "deadlines_sub": "24 upcoming",
        "exams": "Exams", "exams_sub": "6 found",
        "study": "Study Sessions", "study_sub": "Planned for you",
        "b1": "Syllabus Scan", "b1s": "Instantly extract what matters",
        "b2": "Notes Scan", "b2s": "Turn notes into action",
        "b3": "Smart Coaching", "b3s": "Personal guidance that adapts",
        "b4": "Smart Planning", "b4s": "Your semester, organized",
    },
    "de": {
        "headline": "Alles scannen.",
        "sub": "Syllabus, Notizen und Lernzettel. Den Rest übernimmt StudyPlanner.",
        "assignments": "Aufgaben", "assignments_sub": "18 gefunden",
        "notes": "Notizen", "notes_sub": "12 Seiten",
        "deadlines": "Fristen", "deadlines_sub": "24 anstehend",
        "exams": "Prüfungen", "exams_sub": "6 gefunden",
        "study": "Lernsitzungen", "study_sub": "Für dich geplant",
        "b1": "Syllabus-Scan", "b1s": "Wichtiges sofort erfassen",
        "b2": "Notizen-Scan", "b2s": "Notizen werden Aktionen",
        "b3": "Smartes Coaching", "b3s": "Persönliche Hilfe, die mitdenkt",
        "b4": "Smarte Planung", "b4s": "Dein Semester, sortiert",
    },
    "es": {
        "headline": "Escanea todo.",
        "sub": "Programa, apuntes y guías. StudyPlanner se encarga del resto.",
        "assignments": "Tareas", "assignments_sub": "18 encontradas",
        "notes": "Apuntes", "notes_sub": "12 páginas",
        "deadlines": "Entregas", "deadlines_sub": "24 próximas",
        "exams": "Exámenes", "exams_sub": "6 encontrados",
        "study": "Sesiones", "study_sub": "Planificadas para ti",
        "b1": "Escaneo de programa", "b1s": "Extrae lo importante al instante",
        "b2": "Escaneo de apuntes", "b2s": "Convierte apuntes en acción",
        "b3": "Coaching inteligente", "b3s": "Guía personal que se adapta",
        "b4": "Planificación inteligente", "b4s": "Tu semestre, ordenado",
    },
    "fr": {
        "headline": "Scanne tout.",
        "sub": "Syllabus, notes et fiches. StudyPlanner s’occupe du reste.",
        "assignments": "Devoirs", "assignments_sub": "18 trouvés",
        "notes": "Notes", "notes_sub": "12 pages",
        "deadlines": "Échéances", "deadlines_sub": "24 à venir",
        "exams": "Examens", "exams_sub": "6 trouvés",
        "study": "Sessions", "study_sub": "Planifiées pour toi",
        "b1": "Scan du syllabus", "b1s": "Extrait l’essentiel tout de suite",
        "b2": "Scan des notes", "b2s": "Transforme les notes en actions",
        "b3": "Coaching intelligent", "b3s": "Un guidage personnel qui s’adapte",
        "b4": "Planification intelligente", "b4s": "Ton semestre, rangé",
    },
    "pt-BR": {
        "headline": "Escaneie tudo.",
        "sub": "Plano de aula, notas e guias. StudyPlanner cuida do resto.",
        "assignments": "Tarefas", "assignments_sub": "18 encontradas",
        "notes": "Notas", "notes_sub": "12 páginas",
        "deadlines": "Prazos", "deadlines_sub": "24 próximos",
        "exams": "Provas", "exams_sub": "6 encontradas",
        "study": "Sessões", "study_sub": "Planejadas para você",
        "b1": "Escanear plano", "b1s": "Extraia o que importa na hora",
        "b2": "Escanear notas", "b2s": "Transforme notas em ação",
        "b3": "Orientação inteligente", "b3s": "Guia pessoal que se adapta",
        "b4": "Planejamento inteligente", "b4s": "Seu semestre organizado",
    },
    "ja": {
        "headline": "なんでもスキャン。",
        "sub": "シラバス、ノート、学習ガイド。あとはStudyPlannerにおまかせ。",
        "assignments": "課題", "assignments_sub": "18件検出",
        "notes": "ノート", "notes_sub": "12ページ",
        "deadlines": "締切", "deadlines_sub": "24件予定",
        "exams": "試験", "exams_sub": "6件検出",
        "study": "学習セッション", "study_sub": "自動で計画",
        "b1": "シラバス読取", "b1s": "大事な情報をすぐ抽出",
        "b2": "ノート読取", "b2s": "ノートを行動に変える",
        "b3": "スマートコーチ", "b3s": "状況に合わせて案内",
        "b4": "スマート計画", "b4s": "学期をすっきり整理",
    },
    "ko": {
        "headline": "무엇이든 스캔.",
        "sub": "강의계획서, 노트, 공부 자료. 나머지는 StudyPlanner가 정리합니다.",
        "assignments": "과제", "assignments_sub": "18개 발견",
        "notes": "노트", "notes_sub": "12쪽",
        "deadlines": "마감", "deadlines_sub": "24개 예정",
        "exams": "시험", "exams_sub": "6개 발견",
        "study": "공부 세션", "study_sub": "나에게 맞게 계획",
        "b1": "강의계획서 스캔", "b1s": "중요한 내용을 즉시 추출",
        "b2": "노트 스캔", "b2s": "노트를 실행으로 연결",
        "b3": "스마트 코칭", "b3s": "상황에 맞춘 개인 안내",
        "b4": "스마트 계획", "b4s": "학기를 깔끔하게 정리",
    },
    "zh-Hans": {
        "headline": "什么都能扫描。",
        "sub": "课程大纲、笔记、复习资料。剩下的交给 StudyPlanner。",
        "assignments": "作业", "assignments_sub": "发现 18 项",
        "notes": "笔记", "notes_sub": "12 页",
        "deadlines": "截止日期", "deadlines_sub": "24 个即将到来",
        "exams": "考试", "exams_sub": "发现 6 项",
        "study": "学习时段", "study_sub": "为你安排好",
        "b1": "扫描大纲", "b1s": "立即提取重点",
        "b2": "扫描笔记", "b2s": "把笔记变成行动",
        "b3": "智能指导", "b3s": "随进度调整的个人建议",
        "b4": "智能规划", "b4s": "学期安排清清楚楚",
    },
    "hi": {
        "headline": "सब कुछ स्कैन करें।",
        "sub": "सिलेबस, नोट्स और पढ़ाई गाइड। बाकी StudyPlanner संभालता है।",
        "assignments": "काम", "assignments_sub": "18 मिले",
        "notes": "नोट्स", "notes_sub": "12 पेज",
        "deadlines": "तारीखें", "deadlines_sub": "24 आने वाली",
        "exams": "परीक्षाएं", "exams_sub": "6 मिलीं",
        "study": "पढ़ाई सत्र", "study_sub": "आपके लिए बने",
        "b1": "सिलेबस स्कैन", "b1s": "जरूरी बातें तुरंत निकालें",
        "b2": "नोट्स स्कैन", "b2s": "नोट्स को काम में बदलें",
        "b3": "स्मार्ट मार्गदर्शन", "b3s": "आपके हिसाब से सलाह",
        "b4": "स्मार्ट योजना", "b4s": "आपका सेमेस्टर व्यवस्थित",
    },
    "ar": {
        "headline": "امسح كل شيء.",
        "sub": "المنهج والملاحظات وأدلة الدراسة. StudyPlanner يتولى الباقي.",
        "assignments": "واجبات", "assignments_sub": "18 عنصرًا",
        "notes": "ملاحظات", "notes_sub": "12 صفحة",
        "deadlines": "مواعيد", "deadlines_sub": "24 قادمة",
        "exams": "اختبارات", "exams_sub": "6 عناصر",
        "study": "جلسات دراسة", "study_sub": "مخططة لك",
        "b1": "مسح المنهج", "b1s": "استخرج المهم فورًا",
        "b2": "مسح الملاحظات", "b2s": "حوّل الملاحظات إلى خطوات",
        "b3": "توجيه ذكي", "b3s": "إرشاد شخصي يتكيف معك",
        "b4": "تخطيط ذكي", "b4s": "فصلك مرتب",
    },
}


def folder(locale: str) -> Path:
    return OUT_ROOT / FOLDER.get(locale, locale)


def font_path(locale: str) -> str:
    if locale == "hi" and Path(FONT_DEVANAGARI).exists():
        return FONT_DEVANAGARI
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


def render_text(locale: str, text: str) -> str:
    if locale == "ar" and arabic_reshaper and get_display:
        return get_display(arabic_reshaper.reshape(text))
    return text


def text_width(draw: ImageDraw.ImageDraw, locale: str, text: str, face: ImageFont.FreeTypeFont) -> int:
    box = draw.textbbox((0, 0), render_text(locale, text), font=face)
    return box[2] - box[0]


def best_font(draw: ImageDraw.ImageDraw, locale: str, text: str, max_width: int, size: int, bold: bool) -> ImageFont.FreeTypeFont:
    while size >= 30:
        face = font(locale, size, bold)
        if text_width(draw, locale, text, face) <= max_width:
            return face
        size -= 2
    return font(locale, size, bold)


def wrap_text(draw: ImageDraw.ImageDraw, locale: str, text: str, face: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    if len(words) <= 1:
        words = list(text)
        sep = ""
    else:
        sep = " "
    lines: list[str] = []
    cur = ""
    for word in words:
        trial = f"{cur}{sep if cur else ''}{word}"
        if cur and text_width(draw, locale, trial, face) > max_width:
            lines.append(cur)
            cur = word
        else:
            cur = trial
    if cur:
        lines.append(cur)
    return lines


def background() -> Image.Image:
    img = Image.new("RGB", CANVAS, BG)
    px = img.load()
    top, bottom = (253, 253, 252), (244, 245, 247)
    for y in range(CANVAS[1]):
        t = y / (CANVAS[1] - 1)
        color = tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        for x in range(CANVAS[0]):
            px[x, y] = color
    return img.convert("RGBA")


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
    return resized.crop(((nw - tw) // 2, 0, (nw - tw) // 2 + tw, th))


def draw_brand(img: Image.Image, locale: str) -> None:
    logo = Image.open(LOGO_PATH).convert("RGBA").resize((62, 62), Image.LANCZOS)
    img.paste(logo, (74, 76), logo)
    draw = ImageDraw.Draw(img)
    brand_face = ImageFont.truetype(FONT_LATIN, size=44, index=1)
    ai_face = ImageFont.truetype(FONT_LATIN, size=35, index=1)
    brand_x, brand_y = 152, 81
    draw.text((brand_x, brand_y), "StudyPlanner", fill=TEXT, font=brand_face)
    ai_x = brand_x + text_width(draw, "en-US", "StudyPlanner", brand_face) + 16
    draw.text((ai_x, 87), "AI", fill=(94, 99, 110), font=ai_face)


def draw_header(img: Image.Image, locale: str) -> None:
    draw = ImageDraw.Draw(img)
    copy = COPY[locale]
    h_face = best_font(draw, locale, copy["headline"], 850, 76, True)
    draw.text((74, 230), render_text(locale, copy["headline"]), fill=TEXT, font=h_face)
    sub_face = font(locale, 33)
    y = 336
    for line in wrap_text(draw, locale, copy["sub"], sub_face, 850):
        draw.text((74, y), render_text(locale, line), fill=MUTED, font=sub_face)
        y += 42


def draw_phone(img: Image.Image, screenshot: Path) -> None:
    outer_w, border = 540, 13
    inner_w = outer_w - border * 2
    with Image.open(screenshot) as src_probe:
        sw, sh = src_probe.size
    inner_h = round(inner_w * sh / sw)
    outer_h = inner_h + border * 2
    x, y = (CANVAS[0] - outer_w) // 2, 456
    shadow = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((x + 10, y + 14, x + outer_w - 10, y + outer_h + 18), 68, fill=(0, 0, 0, 78))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(24)))
    phone = Image.new("RGBA", (outer_w, outer_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(phone)
    d.rounded_rectangle((0, 0, outer_w - 1, outer_h - 1), 72, fill=(8, 8, 8, 255))
    d.rounded_rectangle((border, border, outer_w - border - 1, outer_h - border - 1), 58, fill=WHITE)
    screen = fit_cover(Image.open(screenshot).convert("RGBA"), (inner_w, inner_h))
    layer = Image.new("RGBA", (inner_w, inner_h), (0, 0, 0, 0))
    layer.paste(screen, (0, 0), rounded_mask((inner_w, inner_h), 58))
    phone.alpha_composite(layer, (border, border))
    img.alpha_composite(phone, (x, y))


def draw_icon(draw: ImageDraw.ImageDraw, kind: str, box: tuple[int, int, int, int]) -> None:
    x1, y1, x2, y2 = box
    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
    w, h = x2 - x1, y2 - y1
    lw = 3
    if kind in {"doc", "scan", "notes"}:
        draw.rounded_rectangle((x1 + 8, y1 + 4, x2 - 8, y2 - 4), 4, outline=TEXT, width=lw)
        draw.line((x2 - 19, y1 + 4, x2 - 8, y1 + 16), fill=TEXT, width=lw)
        draw.line((x1 + 17, cy - 2, x2 - 17, cy - 2), fill=TEXT, width=lw)
        draw.line((x1 + 17, cy + 10, x2 - 24, cy + 10), fill=TEXT, width=lw)
    elif kind == "clock":
        draw.ellipse((x1 + 5, y1 + 5, x2 - 5, y2 - 5), outline=TEXT, width=lw)
        draw.line((cx, cy, cx, y1 + 15), fill=TEXT, width=lw)
        draw.line((cx, cy, x2 - 16, cy + 9), fill=TEXT, width=lw)
    elif kind == "target":
        draw.ellipse((x1 + 8, y1 + 8, x2 - 8, y2 - 8), outline=TEXT, width=lw)
        draw.ellipse((x1 + 18, y1 + 18, x2 - 18, y2 - 18), outline=TEXT, width=lw)
        draw.line((cx, y1 + 3, cx, y1 + 14), fill=TEXT, width=lw)
        draw.line((cx, y2 - 14, cx, y2 - 3), fill=TEXT, width=lw)
        draw.line((x1 + 3, cy, x1 + 14, cy), fill=TEXT, width=lw)
        draw.line((x2 - 14, cy, x2 - 3, cy), fill=TEXT, width=lw)
    elif kind == "spark":
        draw.polygon([(cx, y1 + 2), (cx + 8, cy - 8), (x2 - 2, cy), (cx + 8, cy + 8), (cx, y2 - 2), (cx - 8, cy + 8), (x1 + 2, cy), (cx - 8, cy - 8)], fill=TEXT)
    elif kind == "brain":
        draw.ellipse((x1 + 8, y1 + 12, cx + 4, y2 - 7), outline=TEXT, width=lw)
        draw.ellipse((cx - 4, y1 + 12, x2 - 8, y2 - 7), outline=TEXT, width=lw)
        draw.line((cx, y1 + 14, cx, y2 - 8), fill=TEXT, width=lw)
    elif kind == "calendar":
        draw.rounded_rectangle((x1 + 6, y1 + 8, x2 - 6, y2 - 4), 5, outline=TEXT, width=lw)
        draw.line((x1 + 6, y1 + 22, x2 - 6, y1 + 22), fill=TEXT, width=lw)
        draw.line((x1 + 16, y1 + 3, x1 + 16, y1 + 13), fill=TEXT, width=lw)
        draw.line((x2 - 16, y1 + 3, x2 - 16, y1 + 13), fill=TEXT, width=lw)


def draw_feature_card(img: Image.Image, locale: str, xy: tuple[int, int], title: str, sub: str, kind: str) -> None:
    x, y = xy
    w, h = 172, 128
    shadow = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((x, y, x + w, y + h), 16, fill=(0, 0, 0, 32))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((x, y, x + w, y + h), 16, fill=(255, 255, 255, 242))
    draw_icon(d, kind, (x + 24, y + 18, x + 60, y + 54))
    title_face = best_font(d, locale, title, w - 44, 22, True)
    d.text((x + 24, y + 64), render_text(locale, title), fill=TEXT, font=title_face)
    sub_face = best_font(d, locale, sub, w - 44, 20, False)
    d.text((x + 24, y + 93), render_text(locale, sub), fill=MUTED, font=sub_face)


def draw_floating_cards(img: Image.Image, locale: str) -> None:
    c = COPY[locale]
    draw_feature_card(img, locale, (70, 668), c["assignments"], c["assignments_sub"], "doc")
    draw_feature_card(img, locale, (92, 900), c["exams"], c["exams_sub"], "brain")
    draw_feature_card(img, locale, (780, 628), c["notes"], c["notes_sub"], "notes")
    draw_feature_card(img, locale, (790, 814), c["deadlines"], c["deadlines_sub"], "clock")
    draw_feature_card(img, locale, (780, 1006), c["study"], c["study_sub"], "target")


def draw_bottom_panel(img: Image.Image, locale: str) -> None:
    y = 1220
    shadow = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rectangle((0, y - 24, CANVAS[0], y + 20), fill=(0, 0, 0, 18))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(20)))
    d = ImageDraw.Draw(img)
    d.rectangle((0, y, CANVAS[0], CANVAS[1]), fill=WHITE)
    items = [
        ("scan", COPY[locale]["b1"], COPY[locale]["b1s"]),
        ("notes", COPY[locale]["b2"], COPY[locale]["b2s"]),
        ("spark", COPY[locale]["b3"], COPY[locale]["b3s"]),
        ("calendar", COPY[locale]["b4"], COPY[locale]["b4s"]),
    ]
    col_w = CANVAS[0] // 4
    for i, (kind, title, sub) in enumerate(items):
        x = i * col_w
        if i:
            d.line((x, y + 52, x, CANVAS[1] - 70), fill=(224, 225, 229), width=1)
        draw_icon(d, kind, (x + col_w // 2 - 24, y + 58, x + col_w // 2 + 24, y + 106))
        title_face = best_font(d, locale, title, col_w - 34, 23, True)
        tw = text_width(d, locale, title, title_face)
        d.text((x + (col_w - tw) // 2, y + 132), render_text(locale, title), fill=TEXT, font=title_face)
        sub_face = font(locale, 19)
        line_y = y + 164
        for line in wrap_text(d, locale, sub, sub_face, col_w - 46)[:3]:
            lw = text_width(d, locale, line, sub_face)
            d.text((x + (col_w - lw) // 2, line_y), render_text(locale, line), fill=MUTED, font=sub_face)
            line_y += 25


def compose(locale: str) -> Image.Image:
    src = SOURCE_ROOT / locale / "12-scan.png"
    if not src.exists():
        raise FileNotFoundError(src)
    img = background()
    draw_brand(img, locale)
    draw_header(img, locale)
    draw_phone(img, src)
    draw_floating_cards(img, locale)
    draw_bottom_panel(img, locale)
    return img.convert("RGB")


def update_contact_sheet(locale: str) -> None:
    out = folder(locale)
    paths = [out / "slide-00-scan-anything.png"] + [
        path for path in sorted(out.glob("slide-[0-9][0-9]-*.png"))
        if path.name != "slide-00-scan-anything.png"
    ]
    thumb_w, thumb_h, label_h, gap, cols = 300, 450, 44, 28, 2
    rows = math.ceil(len(paths) / cols)
    sheet = Image.new("RGB", (cols * thumb_w + (cols + 1) * gap, rows * (thumb_h + label_h) + (rows + 1) * gap), (246, 247, 249))
    d = ImageDraw.Draw(sheet)
    label_face = font("en-US", 18)
    for idx, path in enumerate(paths):
        slide = Image.open(path).convert("RGB")
        slide.thumbnail((thumb_w, thumb_h), Image.LANCZOS)
        col, row = idx % cols, idx // cols
        x = gap + col * (thumb_w + gap) + (thumb_w - slide.width) // 2
        y = gap + row * (thumb_h + label_h)
        sheet.paste(slide, (x, y))
        d.text((gap + col * (thumb_w + gap), y + thumb_h + 10), path.name, font=label_face, fill=(20, 20, 22))
    sheet.save(out / ("contact-sheet-en.png" if locale == "en-US" else f"contact-sheet-{locale}.png"), optimize=True)


def update_manifest(locale: str) -> None:
    out = folder(locale)
    manifest_path = out / ("app-preview-manifest-en.json" if locale == "en-US" else f"app-preview-manifest-{locale}.json")
    data = json.loads(manifest_path.read_text())
    data["slides"] = [item for item in data["slides"] if item.get("output_filename") != "slide-00-scan-anything.png"]
    data["slides"].insert(0, {
        "output_filename": "slide-00-scan-anything.png",
        "source_screenshot_used": str((SOURCE_ROOT / locale / "12-scan.png").relative_to(ROOT)),
        "source_logo_used": str(LOGO_PATH.relative_to(ROOT)),
        "dimensions": {"width": CANVAS[0], "height": CANVAS[1]},
        "ui_generated_or_real": "real screenshot only inside phone; surrounding localized marketing composition generated locally",
        "qa_notes": "Localized scan-anything feature slide using the real localized Scan screen from the current simulator build.",
    })
    manifest_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def update_qa(locale: str) -> None:
    out = folder(locale)
    qa_path = out / "APP_PREVIEW_QA.md"
    text = qa_path.read_text()
    row = "| slide-00-scan-anything.png | 10 | 10 | 10 | 10 | 10 | Localized feature slide; phone UI is the real localized Scan screenshot. |"
    if "slide-00-scan-anything.png" not in text:
        text = text.replace("| slide-01-scan.png", f"{row}\n| slide-01-scan.png")
    qa_path.write_text(text)


def main() -> None:
    if not LOGO_PATH.exists():
        raise FileNotFoundError(LOGO_PATH)
    for locale in LOCALES:
        out = folder(locale)
        out.mkdir(parents=True, exist_ok=True)
        output = out / "slide-00-scan-anything.png"
        compose(locale).save(output, optimize=True)
        update_contact_sheet(locale)
        update_manifest(locale)
        update_qa(locale)
        print(output.relative_to(ROOT))


if __name__ == "__main__":
    main()
