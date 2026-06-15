#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
COMPOSER_PATH = ROOT / "scripts" / "compose-premium-localized-app-previews.py"
VARIANT_ROOT = ROOT / "assets" / "AppPreviews" / "ab-test"
OUTPUT_ROOT = VARIANT_ROOT / "variant-b"
REVIEW_PATH = VARIANT_ROOT / "review.html"


spec = importlib.util.spec_from_file_location("premium_previews", COMPOSER_PATH)
if not spec or not spec.loader:
    raise RuntimeError(f"Could not load {COMPOSER_PATH}")
premium = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = premium
spec.loader.exec_module(premium)


COPY_B = {
    "en-US": {
        "brand": "StudyPlanner AI",
        "s1h": "Review before it plans.",
        "s1s": "Scan a syllabus, confirm the dates, then let AI build the semester.",
        "s1r": "★★★★★ App Store clarity",
        "s2h": "Know what is due.",
        "s2s": "Today, next deadlines, and class risk stay visible before they get urgent.",
        "s2r": "★★★★★ Built for trust",
        "s3h": "From deadline to calendar.",
        "s3s": "Turn real coursework into study blocks you can move, edit, and trust.",
        "s3r": "★★★★★ Calm AI planning",
        "s4h": "One place for every class.",
        "s4s": "Courses, reminders, tasks, and notes stay connected to real work.",
        "s4r": "★★★★★ Student-first design",
        "s5h": "Study where it matters.",
        "s5s": "See assignments, exams, and course progress before your grade slips.",
        "s5r": "★★★★★ Grade-aware focus",
        "s6h": "Notes become review.",
        "s6s": "Capture notes, extract key concepts, and turn them into next steps.",
        "s6r": "★★★★★ Smart study flow",
        "s7h": "Start the right session.",
        "s7s": "Focus time follows the class, deadline, and task that need you now.",
        "s7r": "★★★★★ Less chaos, more control",
    },
    "de": {
        "brand": "StudyPlanner AI",
        "s1h": "Pruefen, dann planen.",
        "s1s": "Syllabus scannen, Termine bestaetigen, Semester von KI aufbauen lassen.",
        "s1r": "★★★★★ App Store Klarheit",
        "s2h": "Wissen, was faellig ist.",
        "s2s": "Heute, naechste Fristen und Kursrisiko sichtbar, bevor es dringend wird.",
        "s2r": "★★★★★ Gebaut fuer Vertrauen",
        "s3h": "Von Frist zu Kalender.",
        "s3s": "Kursarbeit wird zu Lernbloecken, die du verschieben und bearbeiten kannst.",
        "s3r": "★★★★★ Ruhige KI-Planung",
        "s4h": "Ein Ort fuer jeden Kurs.",
        "s4s": "Kurse, Erinnerungen, Aufgaben und Notizen bleiben bei echter Arbeit.",
        "s4r": "★★★★★ Design fuer Studierende",
        "s5h": "Lerne, wo es zaehlt.",
        "s5s": "Aufgaben, Pruefungen und Fortschritt sehen, bevor Noten kippen.",
        "s5r": "★★★★★ Notenbewusster Fokus",
        "s6h": "Notizen werden Wiederholung.",
        "s6s": "Notizen erfassen, Kernbegriffe finden und naechste Schritte erstellen.",
        "s6r": "★★★★★ Smarter Lernfluss",
        "s7h": "Starte die richtige Session.",
        "s7s": "Fokuszeit folgt Kurs, Frist und Aufgabe, die jetzt wichtig sind.",
        "s7r": "★★★★★ Weniger Chaos, mehr Kontrolle",
    },
    "es": {
        "brand": "StudyPlanner AI",
        "s1h": "Revisa antes de planear.",
        "s1s": "Escanea un programa, confirma fechas y deja que la IA arme el semestre.",
        "s1r": "★★★★★ Claridad App Store",
        "s2h": "Sabe que vence.",
        "s2s": "Hoy, proximas entregas y riesgo de clase visibles antes de ser urgentes.",
        "s2r": "★★★★★ Hecho para confiar",
        "s3h": "De entrega a calendario.",
        "s3s": "Convierte trabajo real en bloques de estudio que puedes editar.",
        "s3r": "★★★★★ IA tranquila",
        "s4h": "Un lugar para cada clase.",
        "s4s": "Cursos, recordatorios, tareas y notas conectados al trabajo real.",
        "s4r": "★★★★★ Diseno para estudiantes",
        "s5h": "Estudia donde importa.",
        "s5s": "Ve tareas, examenes y progreso antes de que baje tu nota.",
        "s5r": "★★★★★ Enfoque con notas",
        "s6h": "Notas listas para repasar.",
        "s6s": "Captura notas, extrae conceptos y conviertelos en pasos siguientes.",
        "s6r": "★★★★★ Flujo de estudio inteligente",
        "s7h": "Empieza la sesion correcta.",
        "s7s": "El foco sigue la clase, fecha y tarea que te necesitan ahora.",
        "s7r": "★★★★★ Menos caos, mas control",
    },
    "fr": {
        "brand": "StudyPlanner AI",
        "s1h": "Verifie avant de planifier.",
        "s1s": "Scanne un syllabus, confirme les dates, puis laisse l'IA creer le semestre.",
        "s1r": "★★★★★ Clarte App Store",
        "s2h": "Sais ce qui est du.",
        "s2s": "Aujourd'hui, prochaines dates et risque de cours visibles avant l'urgence.",
        "s2r": "★★★★★ Fait pour la confiance",
        "s3h": "De l'echeance au calendrier.",
        "s3s": "Transforme le travail reel en blocs d'etude modifiables.",
        "s3r": "★★★★★ IA calme",
        "s4h": "Un lieu pour chaque cours.",
        "s4s": "Cours, rappels, taches et notes restent lies au vrai travail.",
        "s4r": "★★★★★ Design etudiant",
        "s5h": "Etudie la ou ca compte.",
        "s5s": "Vois devoirs, examens et progres avant que la note baisse.",
        "s5r": "★★★★★ Focus avec notes",
        "s6h": "Notes pretes a reviser.",
        "s6s": "Capture les notes, extrait les notions et cree les prochaines etapes.",
        "s6r": "★★★★★ Flux d'etude intelligent",
        "s7h": "Lance la bonne session.",
        "s7s": "Le focus suit le cours, la date et la tache qui comptent maintenant.",
        "s7r": "★★★★★ Moins de chaos, plus de controle",
    },
    "pt-BR": {
        "brand": "StudyPlanner AI",
        "s1h": "Revise antes de planejar.",
        "s1s": "Escaneie o plano, confirme datas e deixe a IA montar o semestre.",
        "s1r": "★★★★★ Clareza App Store",
        "s2h": "Saiba o que vence.",
        "s2s": "Hoje, proximos prazos e risco da aula visiveis antes da urgencia.",
        "s2r": "★★★★★ Feito para confiar",
        "s3h": "Do prazo ao calendario.",
        "s3s": "Transforme tarefas reais em blocos de estudo editaveis.",
        "s3r": "★★★★★ IA calma",
        "s4h": "Um lugar para cada aula.",
        "s4s": "Aulas, lembretes, tarefas e notas conectados ao trabalho real.",
        "s4r": "★★★★★ Design para estudantes",
        "s5h": "Estude onde importa.",
        "s5s": "Veja tarefas, provas e progresso antes da nota cair.",
        "s5r": "★★★★★ Foco com notas",
        "s6h": "Notas prontas para revisar.",
        "s6s": "Capture notas, extraia conceitos e transforme em proximos passos.",
        "s6r": "★★★★★ Fluxo de estudo inteligente",
        "s7h": "Comece a sessao certa.",
        "s7s": "O foco segue a aula, prazo e tarefa que precisam de voce agora.",
        "s7r": "★★★★★ Menos caos, mais controle",
    },
    "ja": {
        "brand": "StudyPlanner AI",
        "s1h": "確認してから計画。",
        "s1s": "シラバスを読み取り、日付を確認して、AIが学期を組み立てます。",
        "s1r": "★★★★★ App Storeの明快さ",
        "s2h": "締切を先に把握。",
        "s2s": "今日の予定、次の締切、授業リスクを急ぐ前に確認。",
        "s2r": "★★★★★ 信頼のための設計",
        "s3h": "締切からカレンダーへ。",
        "s3s": "実際の課題を、編集できる学習ブロックに変換。",
        "s3r": "★★★★★ 落ち着いたAI計画",
        "s4h": "授業ごとに一か所。",
        "s4s": "授業、リマインダー、タスク、ノートが実際の作業につながります。",
        "s4r": "★★★★★ 学生中心のデザイン",
        "s5h": "大事な所を学習。",
        "s5s": "課題、試験、進捗を成績が下がる前に確認。",
        "s5r": "★★★★★ 成績を見た集中",
        "s6h": "ノートを復習へ。",
        "s6s": "ノートを保存し、重要概念を取り出し、次の行動へ。",
        "s6r": "★★★★★ 賢い学習フロー",
        "s7h": "正しいセッションを開始。",
        "s7s": "今必要な授業、締切、タスクに合わせて集中。",
        "s7r": "★★★★★ 混乱を減らし管理",
    },
    "ko": {
        "brand": "StudyPlanner AI",
        "s1h": "확인한 뒤 계획.",
        "s1s": "강의계획서를 스캔하고 날짜를 확인한 뒤 AI가 학기를 만듭니다.",
        "s1r": "★★★★★ App Store의 명확함",
        "s2h": "마감을 먼저 압니다.",
        "s2s": "오늘, 다음 마감, 수업 위험을 급해지기 전에 봅니다.",
        "s2r": "★★★★★ 신뢰를 위한 설계",
        "s3h": "마감에서 캘린더로.",
        "s3s": "실제 과제를 옮기고 편집할 수 있는 공부 블록으로 바꿉니다.",
        "s3r": "★★★★★ 차분한 AI 계획",
        "s4h": "모든 수업을 한곳에.",
        "s4s": "수업, 알림, 할 일, 노트가 실제 공부와 연결됩니다.",
        "s4r": "★★★★★ 학생 중심 디자인",
        "s5h": "중요한 곳을 공부.",
        "s5s": "성적이 흔들리기 전에 과제, 시험, 진행 상황을 봅니다.",
        "s5r": "★★★★★ 성적 인식 집중",
        "s6h": "노트를 복습으로.",
        "s6s": "노트를 저장하고 핵심 개념을 뽑아 다음 단계로 만듭니다.",
        "s6r": "★★★★★ 스마트 학습 흐름",
        "s7h": "맞는 세션을 시작.",
        "s7s": "지금 필요한 수업, 마감, 과제에 맞춰 집중합니다.",
        "s7r": "★★★★★ 덜 복잡하게, 더 통제",
    },
    "zh-Hans": {
        "brand": "StudyPlanner AI",
        "s1h": "先确认，再计划。",
        "s1s": "扫描课程大纲，确认日期，再让 AI 搭好学期计划。",
        "s1r": "★★★★★ App Store 清晰感",
        "s2h": "提前知道要交什么。",
        "s2s": "今日安排、下个截止日和课程风险，在紧急前看清。",
        "s2r": "★★★★★ 为信任而设计",
        "s3h": "从截止日到日历。",
        "s3s": "把真实作业变成可移动、可编辑的学习时段。",
        "s3r": "★★★★★ 安静的 AI 计划",
        "s4h": "每门课一个地方。",
        "s4s": "课程、提醒、任务和笔记都连接到真实学习。",
        "s4r": "★★★★★ 学生优先设计",
        "s5h": "把时间用在关键处。",
        "s5s": "成绩下滑前，先看清作业、考试和课程进度。",
        "s5r": "★★★★★ 关注成绩的专注",
        "s6h": "笔记变复习。",
        "s6s": "保存笔记，提取重点概念，并变成下一步。",
        "s6r": "★★★★★ 智能学习流程",
        "s7h": "开始正确的学习。",
        "s7s": "专注时间跟着当前最需要你的课程、截止日和任务。",
        "s7r": "★★★★★ 少混乱，多掌控",
    },
    "zh-Hant": {
        "brand": "StudyPlanner AI",
        "s1h": "先確認，再計畫。",
        "s1s": "掃描課程大綱，確認日期，再讓 AI 搭好學期計畫。",
        "s1r": "★★★★★ App Store 清晰感",
        "s2h": "提前知道要交什麼。",
        "s2s": "今日安排、下個截止日和課程風險，在緊急前看清。",
        "s2r": "★★★★★ 為信任而設計",
        "s3h": "從截止日到行事曆。",
        "s3s": "把真實作業變成可移動、可編輯的學習時段。",
        "s3r": "★★★★★ 安靜的 AI 計畫",
        "s4h": "每門課一個地方。",
        "s4s": "課程、提醒、任務和筆記都連接到真實學習。",
        "s4r": "★★★★★ 學生優先設計",
        "s5h": "把時間用在關鍵處。",
        "s5s": "成績下滑前，先看清作業、考試和課程進度。",
        "s5r": "★★★★★ 關注成績的專注",
        "s6h": "筆記變複習。",
        "s6s": "保存筆記，提取重點概念，並變成下一步。",
        "s6r": "★★★★★ 智慧學習流程",
        "s7h": "開始正確的學習。",
        "s7s": "專注時間跟著當前最需要你的課程、截止日和任務。",
        "s7r": "★★★★★ 少混亂，多掌控",
    },
    "hi": {
        "brand": "StudyPlanner AI",
        "s1h": "पहले जांचें, फिर प्लान.",
        "s1s": "सिलेबस स्कैन करें, तारीखें पक्की करें, फिर AI से सेमेस्टर बनवाएं.",
        "s1r": "★★★★★ App Store जैसी साफ़ योजना",
        "s2h": "क्या जमा करना है, पहले जानें.",
        "s2s": "आज, अगली तारीखें और क्लास जोखिम जल्द दिखते हैं.",
        "s2r": "★★★★★ भरोसे के लिए बनाया",
        "s3h": "तारीख से कैलेंडर तक.",
        "s3s": "असली काम को ऐसे स्टडी ब्लॉक में बदलें जिन्हें आप बदल सकें.",
        "s3r": "★★★★★ शांत AI योजना",
        "s4h": "हर क्लास एक जगह.",
        "s4s": "क्लास, रिमाइंडर, काम और नोट्स असली पढ़ाई से जुड़े रहते हैं.",
        "s4r": "★★★★★ छात्र-केंद्रित डिजाइन",
        "s5h": "जहां असर है, वहां पढ़ें.",
        "s5s": "ग्रेड गिरने से पहले काम, परीक्षा और प्रगति देखें.",
        "s5r": "★★★★★ ग्रेड-सचेत फोकस",
        "s6h": "नोट्स से रिविजन.",
        "s6s": "नोट्स रखें, मुख्य कॉन्सेप्ट निकालें और अगले कदम बनाएं.",
        "s6r": "★★★★★ स्मार्ट स्टडी फ्लो",
        "s7h": "सही सेशन शुरू करें.",
        "s7s": "फोकस उस क्लास, तारीख और काम पर रहता है जो अभी जरूरी है.",
        "s7r": "★★★★★ कम उलझन, ज्यादा नियंत्रण",
    },
    "ar": {
        "brand": "StudyPlanner AI",
        "s1h": "راجع قبل التخطيط.",
        "s1s": "امسح المنهج، اكد التواريخ، ثم دع الذكاء يبني الفصل.",
        "s1r": "★★★★★ وضوح App Store",
        "s2h": "اعرف ما يجب تسليمه.",
        "s2s": "اليوم والمواعيد القادمة وخطر المادة تظهر قبل الاستعجال.",
        "s2r": "★★★★★ مصمم للثقة",
        "s3h": "من الموعد الى التقويم.",
        "s3s": "حوّل العمل الحقيقي الى جلسات دراسة يمكن تعديلها.",
        "s3r": "★★★★★ تخطيط ذكاء هادئ",
        "s4h": "مكان واحد لكل مادة.",
        "s4s": "المواد والتذكيرات والمهام والملاحظات متصلة بالعمل الحقيقي.",
        "s4r": "★★★★★ تصميم للطلاب",
        "s5h": "ادرس حيث يهم.",
        "s5s": "شاهد الواجبات والاختبارات والتقدم قبل ان تتراجع الدرجة.",
        "s5r": "★★★★★ تركيز واعي بالدرجات",
        "s6h": "الملاحظات تصبح مراجعة.",
        "s6s": "احفظ الملاحظات، واستخرج المفاهيم، وحولها الى خطوات.",
        "s6r": "★★★★★ مسار دراسة ذكي",
        "s7h": "ابدأ الجلسة الصحيحة.",
        "s7s": "التركيز يتبع المادة والموعد والمهمة الاهم الآن.",
        "s7r": "★★★★★ فوضى اقل وتحكم اكثر",
    },
}


LOCALIZED_REFINEMENTS = {
    "de": {
        "s1h": "Prüfen, dann planen.",
        "s1s": "Syllabus scannen, Termine bestätigen, Semester von KI aufbauen lassen.",
        "s2h": "Wissen, was fällig ist.",
        "s2s": "Heute, nächste Fristen und Kursrisiko sichtbar, bevor es dringend wird.",
        "s3s": "Kursarbeit wird zu Lernblöcken, die du verschieben und bearbeiten kannst.",
        "s5h": "Lerne, wo es zählt.",
        "s5s": "Aufgaben, Prüfungen und Fortschritt sehen, bevor Noten kippen.",
        "s6s": "Notizen erfassen, Kernbegriffe finden und nächste Schritte erstellen.",
    },
    "es": {
        "s2h": "Sabe qué vence.",
        "s2s": "Hoy, próximas entregas y riesgo de clase visibles antes de ser urgentes.",
        "s4r": "★★★★★ Diseño para estudiantes",
        "s5s": "Ve tareas, exámenes y progreso antes de que baje tu nota.",
        "s6s": "Captura notas, extrae conceptos y conviértelos en pasos siguientes.",
        "s7r": "★★★★★ Menos caos, más control",
    },
    "fr": {
        "s1h": "Vérifie avant de planifier.",
        "s1s": "Scanne un syllabus, confirme les dates, puis laisse l'IA créer le semestre.",
        "s1r": "★★★★★ Clarté App Store",
        "s2h": "Sais ce qui est dû.",
        "s2s": "Aujourd'hui, prochaines dates et risque de cours visibles avant l'urgence.",
        "s3h": "De l'échéance au calendrier.",
        "s4s": "Cours, rappels, tâches et notes restent liés au vrai travail.",
        "s5h": "Étudie là où ça compte.",
        "s6h": "Notes prêtes à réviser.",
        "s6s": "Capture les notes, extrait les notions et crée les prochaines étapes.",
        "s7r": "★★★★★ Moins de chaos, plus de contrôle",
    },
    "pt-BR": {
        "s2s": "Hoje, próximos prazos e risco da aula visíveis antes da urgência.",
        "s3h": "Do prazo ao calendário.",
        "s3s": "Transforme tarefas reais em blocos de estudo editáveis.",
        "s5s": "Veja tarefas, provas e progresso antes da nota cair.",
        "s6s": "Capture notas, extraia conceitos e transforme em próximos passos.",
        "s7h": "Comece a sessão certa.",
        "s7s": "O foco segue a aula, prazo e tarefa que precisam de você agora.",
        "s7r": "★★★★★ Menos caos, mais controle",
    },
    "ar": {
        "s1s": "امسح المنهج، أكد التواريخ، ثم دع الذكاء يبني الفصل.",
        "s3h": "من الموعد إلى التقويم.",
        "s3s": "حوّل العمل الحقيقي إلى جلسات دراسة يمكن تعديلها.",
        "s5s": "شاهد الواجبات والاختبارات والتقدم قبل أن تتراجع الدرجة.",
        "s6s": "احفظ الملاحظات، واستخرج المفاهيم، وحولها إلى خطوات.",
        "s7s": "التركيز يتبع المادة والموعد والمهمة الأهم الآن.",
        "s7r": "★★★★★ فوضى أقل وتحكم أكثر",
    },
}

for locale, updates in LOCALIZED_REFINEMENTS.items():
    COPY_B[locale].update(updates)


FINAL_COPY_REFINEMENTS = {
    "en-US": {
        "s1r": "★★★★★ Reviewable planning",
        "s2r": "★★★★★ Deadlines before urgency",
        "s3r": "★★★★★ Calm, editable plans",
        "s4r": "★★★★★ Real class workflow",
        "s5r": "★★★★★ Grade-aware study",
        "s6r": "★★★★★ Notes ready to review",
        "s7r": "★★★★★ Less chaos, more control",
    },
    "de": {
        "s1s": "Vorlesungsplan scannen, Termine prüfen, Semesterplan erstellen lassen.",
        "s1r": "★★★★★ Planung mit Kontrolle",
        "s2s": "Heute, nächste Fristen und Kursrisiken sehen, bevor es knapp wird.",
        "s2r": "★★★★★ Fristen rechtzeitig sehen",
        "s3h": "Von Frist zu Kalender.",
        "s3r": "★★★★★ Ruhig und änderbar",
        "s4h": "Jeder Kurs an einem Ort.",
        "s4s": "Kurse, Erinnerungen, Aufgaben und Notizen bleiben beim Lernstoff.",
        "s4r": "★★★★★ Für den Studienalltag",
        "s5s": "Aufgaben, Prüfungen und Fortschritt sehen, bevor Noten kippen.",
        "s5r": "★★★★★ Lernen mit Notenblick",
        "s6r": "★★★★★ Notizen zum Wiederholen",
        "s7h": "Die richtige Lernzeit starten.",
        "s7s": "Fokuszeit richtet sich nach Kurs, Frist und Aufgabe.",
        "s7r": "★★★★★ Weniger Chaos, mehr Kontrolle",
    },
    "es": {
        "s1s": "Escanea el programa, confirma fechas y arma el semestre con inteligencia.",
        "s1r": "★★★★★ Planificación revisable",
        "s2s": "Hoy, próximas entregas y riesgo por clase antes de que sea urgente.",
        "s2r": "★★★★★ Entregas sin sorpresa",
        "s3r": "★★★★★ Planes tranquilos y editables",
        "s4s": "Clases, recordatorios, tareas y notas unidos al trabajo real.",
        "s4r": "★★★★★ Pensado para estudiantes",
        "s5r": "★★★★★ Estudio con mirada a notas",
        "s6r": "★★★★★ Apuntes listos para repasar",
        "s7h": "Empieza el estudio correcto.",
        "s7s": "La concentración sigue la clase, fecha y tarea más importantes.",
        "s7r": "★★★★★ Menos caos, más control",
    },
    "fr": {
        "s1s": "Scanne le syllabus, vérifie les dates, puis construis ton semestre.",
        "s1r": "★★★★★ Planification vérifiable",
        "s2s": "Aujourd'hui, prochaines échéances et risques de cours avant l'urgence.",
        "s2r": "★★★★★ Échéances sans surprise",
        "s3s": "Transforme le travail réel en blocs d'étude faciles à modifier.",
        "s3r": "★★★★★ Plans calmes et modifiables",
        "s4s": "Cours, rappels, tâches et notes restent liés à ce que tu étudies.",
        "s4r": "★★★★★ Pensé pour les étudiants",
        "s5s": "Vois devoirs, examens et progrès avant que la note baisse.",
        "s5r": "★★★★★ Étudier avec les notes en tête",
        "s6r": "★★★★★ Notes prêtes à réviser",
        "s7s": "La concentration suit le cours, la date et la tâche qui comptent.",
        "s7r": "★★★★★ Moins de désordre, plus de contrôle",
    },
    "pt-BR": {
        "s1s": "Escaneie o plano de aula, confirme datas e monte o semestre.",
        "s1r": "★★★★★ Planejamento revisável",
        "s2s": "Hoje, próximos prazos e risco por aula antes de virar urgência.",
        "s2r": "★★★★★ Prazos sem surpresa",
        "s3r": "★★★★★ Planos calmos e editáveis",
        "s4s": "Aulas, lembretes, tarefas e notas ligados ao estudo real.",
        "s4r": "★★★★★ Feito para estudantes",
        "s5s": "Veja tarefas, provas e progresso antes da nota cair.",
        "s5r": "★★★★★ Estudo de olho nas notas",
        "s6r": "★★★★★ Notas prontas para revisar",
        "s7s": "O foco segue a aula, o prazo e a tarefa mais importantes.",
        "s7r": "★★★★★ Menos bagunça, mais controle",
    },
    "ja": {
        "s1s": "シラバスを読み取り、日付を確認。人工知能が学期計画を組み立てます。",
        "s1r": "★★★★★ 見通しがすぐ立つ",
        "s2s": "今日の予定、次の締切、成績リスクを早めに確認。",
        "s3r": "★★★★★ 落ち着いて任せられる計画",
        "s4s": "授業、リマインダー、タスク、ノートを学習内容とひとつに。",
        "s5h": "成績に効く学習を。",
        "s5r": "★★★★★ 成績を意識した集中",
        "s7h": "今やるべき学習へ。",
        "s7r": "★★★★★ 混乱を減らして管理",
    },
    "ko": {
        "s1h": "확인하고 계획하세요.",
        "s1s": "강의계획서를 스캔하고 날짜를 확인하면 인공지능이 학기 계획을 세웁니다.",
        "s1r": "★★★★★ 한눈에 보이는 계획",
        "s2h": "마감일을 미리 확인하세요.",
        "s2s": "오늘 할 일, 다음 마감, 과목별 위험도를 급해지기 전에 확인하세요.",
        "s3r": "★★★★★ 차분한 인공지능 계획",
        "s5h": "성적에 중요한 공부부터.",
        "s5r": "★★★★★ 성적을 고려한 집중",
        "s7h": "지금 필요한 공부를 시작하세요.",
        "s7r": "★★★★★ 덜 복잡하게, 더 확실하게",
    },
    "zh-Hans": {
        "s1s": "扫描课程大纲，确认日期，再让智能规划安排整个学期。",
        "s1r": "★★★★★ 计划一目了然",
        "s3r": "★★★★★ 从容的智能规划",
        "s4h": "每门课都归好位。",
        "s6s": "保存笔记，提取重点，直接生成下一步。",
        "s7h": "开始最该学的一项。",
        "s7s": "专注时间跟随当前最重要的课程、截止日和任务。",
    },
    "zh-Hant": {
        "s1s": "掃描課程大綱，確認日期，再讓智慧規劃安排整個學期。",
        "s1r": "★★★★★ 計畫一目了然",
        "s3r": "★★★★★ 從容的智慧規劃",
        "s4h": "每門課都歸好位。",
        "s6s": "儲存筆記，提取重點，直接生成下一步。",
        "s7h": "開始最該讀的一項。",
        "s7s": "專注時間跟著當前最重要的課程、截止日和任務走。",
    },
    "hi": {
        "s1h": "पहले जांचें, फिर योजना बनाएं।",
        "s1s": "पाठ्यक्रम स्कैन करें, तारीखें पक्की करें, फिर कृत्रिम बुद्धिमत्ता से पूरी सत्र योजना बनवाएं।",
        "s1r": "★★★★★ साफ़ और भरोसेमंद योजना",
        "s2h": "क्या जमा करना है, पहले जानें।",
        "s2s": "आज का काम, अगली तारीखें और विषय का जोखिम समय रहते दिखें।",
        "s3h": "तारीख से समय-सारिणी तक।",
        "s3s": "असली काम को बदलने योग्य पढ़ाई के हिस्सों में बदलें।",
        "s3r": "★★★★★ शांत कृत्रिम बुद्धिमत्ता योजना",
        "s4h": "हर विषय एक जगह।",
        "s4s": "विषय, याद दिलाने वाली सूचनाएं, काम और नोट्स पढ़ाई से जुड़े रहते हैं।",
        "s4r": "★★★★★ छात्रों के लिए बनाया गया",
        "s5s": "अंक गिरने से पहले काम, परीक्षा और प्रगति देखें।",
        "s5r": "★★★★★ अंकों को ध्यान में रखकर पढ़ाई",
        "s6h": "नोट्स से दोहराई।",
        "s6s": "नोट्स रखें, मुख्य बातें निकालें और अगले कदम बनाएं।",
        "s6r": "★★★★★ समझदार पढ़ाई प्रवाह",
        "s7h": "सही पढ़ाई शुरू करें।",
        "s7s": "ध्यान उसी विषय, तारीख और काम पर रहे जो अभी जरूरी है।",
        "s7r": "★★★★★ कम उलझन, ज्यादा नियंत्रण",
    },
    "ar": {
        "s1s": "امسح المنهج، أكّد التواريخ، ثم دع الذكاء الاصطناعي يرتّب الفصل.",
        "s1r": "★★★★★ وضوح يطمئنك",
        "s2s": "اليوم، والمواعيد القادمة، ومخاطر المادة تظهر قبل أن تصبح عاجلة.",
        "s3r": "★★★★★ تخطيط هادئ بالذكاء الاصطناعي",
        "s4s": "المواد والتذكيرات والمهام والملاحظات مرتبطة بما تدرسه فعلاً.",
        "s5s": "تابع الواجبات والاختبارات والتقدم قبل أن تتراجع الدرجة.",
        "s5r": "★★★★★ تركيز يحمي درجاتك",
        "s6h": "الملاحظات تتحول إلى مراجعة.",
        "s6s": "احفظ الملاحظات، واستخرج المفاهيم، وحوّلها إلى خطوات تالية.",
        "s7s": "ركّز على المادة والموعد والمهمة الأهم الآن.",
        "s7r": "★★★★★ فوضى أقل وتحكم أكبر",
    },
}

for locale, updates in FINAL_COPY_REFINEMENTS.items():
    COPY_B[locale].update(updates)


NATIVE_COPY_FINAL = {
    "de": {
        "s1s": "Scanne deinen Kursplan, prüfe Termine, lass KI dein Semester planen.",
        "s1r": "★★★★★ Klarheit von Anfang an",
        "s2h": "Alles Fällige im Blick.",
        "s2s": "Heute, Fristen und Kursrisiken im Blick, bevor es dringend wird.",
        "s2r": "★★★★★ Verlässlich geplant",
        "s3h": "Von der Frist in den Kalender.",
        "s3s": "Aus Kursarbeit werden Lernblöcke, die du verschieben und bearbeiten kannst.",
        "s3r": "★★★★★ Planen ohne Stress",
        "s4h": "Ein Ort für jeden Kurs.",
        "s4s": "Kurse, Erinnerungen, Aufgaben und Notizen bleiben sinnvoll verbunden.",
        "s4r": "★★★★★ Für Studierende gemacht",
        "s5r": "★★★★★ Fokus auf deine Noten",
        "s6h": "Aus Notizen wird Wiederholung.",
        "s6s": "Notizen erfassen, Schlüsselkonzepte erkennen und nächste Schritte planen.",
        "s6r": "★★★★★ Lernfluss, der mitdenkt",
        "s7h": "Starte die passende Lerneinheit.",
        "s7s": "Lernzeit richtet sich nach Kurs, Frist und Aufgabe, die jetzt zählen.",
    },
    "es": {
        "s1s": "Escanea el plan de curso, confirma fechas y deja que la IA organice el semestre.",
        "s1r": "★★★★★ Claridad desde el inicio",
        "s2h": "Ten claro qué vence.",
        "s2s": "Hoy, próximas entregas y materias en riesgo, antes de que sea urgente.",
        "s2r": "★★★★★ Planificación confiable",
        "s3h": "De la entrega al calendario.",
        "s3s": "Convierte tus tareas en bloques de estudio editables.",
        "s3r": "★★★★★ Planificación sin estrés",
        "s4h": "Un lugar para cada materia.",
        "s4s": "Materias, recordatorios, tareas y notas siempre conectados.",
        "s5s": "Consulta tareas, exámenes y progreso antes de que baje tu nota.",
        "s5r": "★★★★★ Enfoque en tus calificaciones",
        "s6s": "Captura notas, extrae conceptos y conviértelos en próximos pasos.",
        "s7h": "Empieza la sesión correcta.",
        "s7s": "Concéntrate en la clase, fecha y tarea que más importan ahora.",
    },
    "fr": {
        "s1s": "Scanne ton programme, vérifie les dates, laisse l'IA organiser le semestre.",
        "s1r": "★★★★★ Clair dès le départ",
        "s2h": "Garde les échéances en vue.",
        "s2s": "Aujourd'hui, échéances à venir et cours à risque, avant l'urgence.",
        "s2r": "★★★★★ Planification fiable",
        "s3s": "Transforme tes devoirs en créneaux d'étude modifiables.",
        "s3r": "★★★★★ Planifier sans stress",
        "s4h": "Chaque cours au même endroit.",
        "s4s": "Cours, rappels, devoirs et notes restent connectés.",
        "s4r": "★★★★★ Pensé pour les étudiants",
        "s5s": "Vois devoirs, examens et progrès avant que ta moyenne baisse.",
        "s5r": "★★★★★ Cap sur ta moyenne",
        "s6s": "Prends des notes, extrais les notions clés et crée les prochaines étapes.",
        "s6r": "★★★★★ Flux d'étude intelligent",
        "s7h": "Lance la bonne séance.",
        "s7s": "Concentre-toi sur le cours, l'échéance et la tâche qui comptent maintenant.",
    },
    "pt-BR": {
        "s1h": "Confira antes de planejar.",
        "s1s": "Escaneie a ementa, confirme as datas e deixe a IA organizar o semestre.",
        "s1r": "★★★★★ Clareza desde o início",
        "s2s": "Hoje, próximos prazos e disciplinas em risco, antes da urgência.",
        "s2r": "★★★★★ Planejamento confiável",
        "s3s": "Transforme suas tarefas em blocos de estudo editáveis.",
        "s3r": "★★★★★ Planejamento sem estresse",
        "s4h": "Um lugar para cada disciplina.",
        "s4s": "Disciplinas, lembretes, tarefas e notas sempre conectados.",
        "s4r": "★★★★★ Feito para estudantes",
        "s5s": "Veja tarefas, provas e progresso antes que sua nota caia.",
        "s5r": "★★★★★ Foco nas suas notas",
        "s6s": "Registre notas, extraia conceitos e transforme tudo em próximos passos.",
        "s7s": "Concentre-se na disciplina, no prazo e na tarefa que mais importam agora.",
    },
}

for locale, updates in NATIVE_COPY_FINAL.items():
    COPY_B[locale].update(updates)


SOURCE_OVERRIDES = {
    ("pt-BR", "10-today-light.png"): "03-onboarding-today.png",
}


PHONE_CARD_COPY = {
    "zh-Hant": {
        1: ("匯入前先確認", ["日期、課程、任務都可檢查", "確認後再建立學期計畫"]),
        2: ("截止日先看清", ["今日任務與課程風險", "在緊急前就知道"]),
        3: ("安排到行事曆", ["學習時段可移動", "計畫可以隨時調整"]),
        4: ("每門課都歸好位", ["任務、提醒、筆記一起看", "學期脈絡不分散"]),
        5: ("把時間用在關鍵處", ["作業、考試、進度一目了然", "先處理最影響成績的事"]),
        6: ("筆記直接變複習", ["提取重點概念", "生成下一步學習任務"]),
        7: ("開始最該讀的一項", ["依課程、截止日、任務聚焦", "少混亂，多掌控"]),
    },
    "ar": {
        1: ("راجع قبل التخطيط", ["التواريخ والمواد والمهام قابلة للمراجعة", "أكّدها ثم ابنِ خطة الفصل"]),
        2: ("المواعيد واضحة مبكراً", ["مهام اليوم ومخاطر المادة أمامك", "قبل أن تصبح عاجلة"]),
        3: ("من الموعد إلى التقويم", ["جلسات دراسة قابلة للتعديل", "خطتك تبقى تحت سيطرتك"]),
        4: ("مكان واحد لكل مادة", ["المهام والتذكيرات والملاحظات معاً", "سياق الفصل لا يتشتت"]),
        5: ("ركّز حيث يهم", ["واجبات واختبارات وتقدم واضح", "قبل أن تتراجع الدرجة"]),
        6: ("الملاحظات تصبح مراجعة", ["استخرج المفاهيم المهمة", "حوّلها إلى خطوات تالية"]),
        7: ("ابدأ ما يهم الآن", ["حسب المادة والموعد والمهمة", "فوضى أقل وتحكم أكبر"]),
    },
}


def star_points(cx: float, cy: float, radius: float) -> list[tuple[float, float]]:
    points: list[tuple[float, float]] = []
    inner = radius * 0.43
    for i in range(10):
        angle = -premium.math.pi / 2 + i * premium.math.pi / 5
        r = radius if i % 2 == 0 else inner
        points.append((cx + premium.math.cos(angle) * r, cy + premium.math.sin(angle) * r))
    return points


def draw_star_rating(
    draw: ImageDraw.ImageDraw,
    locale: str,
    x: int,
    y: int,
    max_width: int,
    text: str,
    face,
    fill: tuple[int, int, int],
) -> None:
    clean = text.replace("★★★★★", "").strip()
    gap = 8
    star_count = 5
    star_radius = 11
    star_step = 26
    stars_width = star_step * (star_count - 1) + star_radius * 2
    rendered = premium.render_text(locale, clean)
    text_width = draw.textbbox((0, 0), rendered, font=face)[2]

    if premium.is_rtl(locale):
        text_x = x + max_width - text_width
        star_x = text_x - gap - stars_width
        draw.text((text_x, y), rendered, font=face, fill=fill)
    else:
        star_x = x
        text_x = x + stars_width + gap
        draw.text((text_x, y), rendered, font=face, fill=fill)

    cy = y + 19
    for index in range(star_count):
        cx = star_x + star_radius + index * star_step
        draw.polygon(star_points(cx, cy, star_radius), fill=fill)


def draw_header_b(img, locale: str, slide_spec) -> None:
    copy = premium.COPY[locale]
    draw = ImageDraw.Draw(img)
    x, max_width = 92, premium.CANVAS[0] - 184

    headline = copy[slide_spec.headline_key]
    headline_face = premium.fitted_font(draw, locale, headline, max_width, 98, 58, True)
    y = premium.draw_wrapped(draw, locale, x, 184, max_width, headline, headline_face, premium.TEXT, 10, 2)

    sub_face = premium.font(locale, 40, False)
    y = premium.draw_wrapped(draw, locale, x, y + 22, max_width - 24, copy[slide_spec.sub_key], sub_face, premium.MUTED, 12, 3)

    star_face = premium.font(locale, 29, True)
    draw_star_rating(
        draw,
        locale,
        x,
        y + 26,
        max_width,
        copy[f"s{slide_spec.index}r"],
        star_face,
        slide_spec.accent,
    )


def source_for(locale: str, slide_spec) -> Path:
    source_locale = premium.SOURCE_LOCALE.get(locale, locale)
    source_name = SOURCE_OVERRIDES.get((locale, slide_spec.source), slide_spec.source)
    return premium.SOURCE_ROOT / source_locale / source_name


def draw_overlay_card(
    draw: ImageDraw.ImageDraw,
    locale: str,
    box: tuple[int, int, int, int],
    title: str,
    lines: list[str],
    accent: tuple[int, int, int],
) -> None:
    x1, y1, x2, y2 = box
    draw.rounded_rectangle((x1, y1, x2, y2), 34, fill=(255, 255, 255, 232), outline=(228, 229, 234, 235), width=2)
    title_face = premium.fitted_font(draw, locale, title, x2 - x1 - 56, 42, 30, True)
    premium.draw_text_line(draw, locale, (x1 + 28, y1 + 25, x2 - 28, y1 + 75), title, title_face, premium.TEXT)
    y = y1 + 88
    line_face = premium.font(locale, 29, False)
    for line in lines:
        dot_x = x2 - 43 if premium.is_rtl(locale) else x1 + 34
        draw.ellipse((dot_x, y + 11, dot_x + 10, y + 21), fill=accent)
        premium.draw_text_line(draw, locale, (x1 + 56, y, x2 - 56, y + 42), line, line_face, premium.MUTED)
        y += 42


def draw_localized_overlay_phone(img, source: Path, locale: str, slide_spec) -> None:
    outer_w = 950
    border = 19
    inner_w = outer_w - border * 2
    with Image.open(source) as probe:
        sw, sh = probe.size
    inner_h = round(inner_w * sh / sw)
    outer_h = inner_h + border * 2
    x = (premium.CANVAS[0] - outer_w) // 2
    y = 760

    shadow = Image.new("RGBA", premium.CANVAS, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((x + 10, y + 42, x + outer_w - 10, y + outer_h + 58), 106, fill=(0, 0, 0, 118))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(42)))

    glow = Image.new("RGBA", premium.CANVAS, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle((x - 32, y - 34, x + outer_w + 32, y + outer_h + 28), 118, fill=(*slide_spec.accent, 26))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(34)))

    phone = Image.new("RGBA", (outer_w, outer_h), (0, 0, 0, 0))
    pd = ImageDraw.Draw(phone)
    pd.rounded_rectangle((0, 0, outer_w - 1, outer_h - 1), 104, fill=(7, 7, 8))
    pd.rounded_rectangle((border, border, outer_w - border - 1, outer_h - border - 1), 84, fill=(255, 255, 255))
    pd.rounded_rectangle((outer_w // 2 - 82, 23, outer_w // 2 + 82, 58), 18, fill=(5, 5, 6))

    screen = premium.fit_cover(Image.open(source).convert("RGBA"), (inner_w, inner_h)).filter(ImageFilter.GaussianBlur(10))
    wash = Image.new("RGBA", (inner_w, inner_h), (247, 248, 252, 178))
    screen = Image.alpha_composite(screen, wash)
    scr = ImageDraw.Draw(screen)
    scr.rounded_rectangle((46, 102, inner_w - 46, 248), 42, fill=(255, 255, 255, 220), outline=(232, 233, 238, 220), width=2)
    heading, rows = PHONE_CARD_COPY[locale][slide_spec.index]
    head_face = premium.fitted_font(scr, locale, heading, inner_w - 136, 49, 33, True)
    premium.draw_text_line(scr, locale, (76, 145, inner_w - 76, 198), heading, head_face, premium.TEXT)

    draw_overlay_card(scr, locale, (58, 326, inner_w - 58, 558), rows[0], [rows[1]], slide_spec.accent)
    draw_overlay_card(scr, locale, (58, 598, inner_w - 58, 830), rows[-1], [heading], slide_spec.accent)
    scr.rounded_rectangle((88, 902, inner_w - 88, 986), 42, fill=(8, 8, 10, 238))
    cta = "ابدأ الآن" if locale == "ar" else "開始"
    cta_face = premium.font(locale, 34, True)
    premium.draw_text_line(scr, locale, (118, 923, inner_w - 118, 970), cta, cta_face, premium.WHITE)

    screen_layer = Image.new("RGBA", (inner_w, inner_h), (0, 0, 0, 0))
    screen_layer.paste(screen, (0, 0), premium.rounded_mask((inner_w, inner_h), 82))
    phone.alpha_composite(screen_layer, (border, border))

    side = ImageDraw.Draw(img)
    side.rounded_rectangle((x - 6, y + 190, x + 2, y + 286), 4, fill=(28, 28, 30))
    side.rounded_rectangle((x - 7, y + 346, x + 2, y + 462), 4, fill=(28, 28, 30))
    side.rounded_rectangle((x + outer_w - 2, y + 315, x + outer_w + 7, y + 455), 4, fill=(28, 28, 30))
    img.alpha_composite(phone, (x, y))


def compose_b(locale: str, slide_spec) -> Image.Image:
    source = source_for(locale, slide_spec)
    if not source.exists():
        raise FileNotFoundError(source)
    img = premium.background(slide_spec)
    premium.paste_logo_and_brand(img, locale)
    draw_header_b(img, locale, slide_spec)
    if locale in PHONE_CARD_COPY:
        draw_localized_overlay_phone(img, source, locale, slide_spec)
    else:
        premium.draw_phone(img, source, slide_spec)
    return img.convert("RGB")


def clean_variant_outputs() -> None:
    for locale in premium.RAW_LOCALES:
        out_dir = OUTPUT_ROOT / locale / premium.SCREEN_SLOT
        if out_dir.exists():
            for stale in out_dir.glob("*.png"):
                stale.unlink()


def write_review_html() -> None:
    locales = premium.RAW_LOCALES
    slides = [{"file": s.output, "label": s.output.removesuffix(".png").replace("-", " ")} for s in premium.SLIDES]
    data = {"locales": locales, "slides": slides}
    html = f"""<!doctype html>
<html lang=\"en\">
<head>
<meta charset=\"utf-8\">
<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
<title>StudyPlanner App Preview A/B</title>
<style>
:root {{ color-scheme: light; --ink:#0d0d10; --muted:#6d717a; --line:#dedfd8; --bg:#f7f7f3; }}
* {{ box-sizing:border-box; }}
body {{ margin:0; font:15px/1.35 -apple-system,BlinkMacSystemFont,\"SF Pro Display\",\"Helvetica Neue\",Arial,sans-serif; background:var(--bg); color:var(--ink); }}
header {{ position:sticky; top:0; z-index:10; display:flex; gap:16px; align-items:center; justify-content:space-between; padding:18px 22px; border-bottom:1px solid var(--line); background:rgba(247,247,243,.86); backdrop-filter:blur(18px); }}
h1 {{ margin:0; font-size:20px; letter-spacing:0; }}
.controls {{ display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:flex-end; }}
select, button {{ appearance:none; border:1px solid var(--line); background:#fff; color:var(--ink); border-radius:8px; padding:10px 12px; font:inherit; }}
button.active {{ background:#0d0d10; color:#fff; border-color:#0d0d10; }}
main {{ padding:20px; }}
.grid {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:18px; align-items:start; }}
.tile {{ min-width:0; }}
.tile h2 {{ margin:0 0 8px; font-size:13px; font-weight:650; color:var(--muted); text-transform:uppercase; letter-spacing:.02em; }}
.pair {{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }}
.frame {{ background:#fff; border:1px solid var(--line); border-radius:8px; padding:7px; box-shadow:0 18px 45px rgba(19,22,27,.08); }}
.frame strong {{ display:block; margin:0 0 6px; font-size:12px; color:var(--muted); }}
img {{ display:block; width:100%; height:auto; border-radius:6px; background:#fff; }}
body[data-mode=\"a\"] .b, body[data-mode=\"b\"] .a {{ display:none; }}
body[data-mode=\"a\"] .pair, body[data-mode=\"b\"] .pair {{ grid-template-columns:1fr; }}
@media (max-width:680px) {{ header {{ align-items:flex-start; flex-direction:column; }} .controls {{ justify-content:flex-start; }} main {{ padding:14px; }} }}
</style>
</head>
<body data-mode=\"compare\">
<header>
  <h1>StudyPlanner App Preview A/B</h1>
  <div class=\"controls\">
    <select id=\"locale\"></select>
    <button data-mode=\"compare\" class=\"active\">Compare</button>
    <button data-mode=\"a\">A</button>
    <button data-mode=\"b\">B</button>
  </div>
</header>
<main><div class=\"grid\" id=\"grid\"></div></main>
<script>
const data = {json.dumps(data, ensure_ascii=False)};
const localeSelect = document.querySelector('#locale');
const grid = document.querySelector('#grid');
for (const locale of data.locales) {{
  const option = document.createElement('option');
  option.value = locale;
  option.textContent = locale;
  localeSelect.appendChild(option);
}}
function render() {{
  const locale = localeSelect.value;
  grid.innerHTML = data.slides.map(slide => `
    <section class=\"tile\">
      <h2>${{slide.label}}</h2>
      <div class=\"pair\">
        <div class=\"frame a\"><strong>Variant A</strong><img src=\"../final/${{locale}}/APP_IPHONE_65/${{slide.file}}\" alt=\"Variant A ${{locale}} ${{slide.label}}\"></div>
        <div class=\"frame b\"><strong>Variant B</strong><img src=\"variant-b/${{locale}}/APP_IPHONE_65/${{slide.file}}\" alt=\"Variant B ${{locale}} ${{slide.label}}\"></div>
      </div>
    </section>`).join('');
}}
localeSelect.addEventListener('change', render);
document.querySelectorAll('button[data-mode]').forEach(button => {{
  button.addEventListener('click', () => {{
    document.body.dataset.mode = button.dataset.mode;
    document.querySelectorAll('button[data-mode]').forEach(b => b.classList.toggle('active', b === button));
  }});
}});
render();
</script>
</body>
</html>
"""
    REVIEW_PATH.parent.mkdir(parents=True, exist_ok=True)
    REVIEW_PATH.write_text(html, encoding="utf-8")


def main() -> None:
    premium.ASSET_ROOT = OUTPUT_ROOT
    premium.COPY = COPY_B
    premium.draw_header = draw_header_b

    clean_variant_outputs()
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    count = 0
    for locale in premium.RAW_LOCALES:
        out_dir = premium.locale_asset_dir(locale)
        out_dir.mkdir(parents=True, exist_ok=True)
        for slide_spec in premium.SLIDES:
            output = out_dir / slide_spec.output
            compose_b(locale, slide_spec).save(output, optimize=True)
            count += 1
    write_review_html()
    print(f"wrote {count} Variant B preview PNGs")
    print(f"wrote {REVIEW_PATH}")


if __name__ == "__main__":
    main()
