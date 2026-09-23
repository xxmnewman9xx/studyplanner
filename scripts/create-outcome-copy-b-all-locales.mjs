#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const WIDTH = 1242;
const HEIGHT = 2688;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_ROOT = "store/apple/screenshot-copy-b-outcomes";
const QA_ROOT = "qa/back-to-school-2026/outcome-copy-b-all-locales";
const MANIFEST_PATH = `${QA_ROOT}/manifest.json`;

const logoPath = "assets/app/study-planner-icon.png";
const sourceRoot = "qa-screenshots/back-to-school-2026-native";

const slides = [
  {
    id: "scan",
    fileName: "01-scan-syllabus-notes.png",
    sourceFile: "app-06-review.png",
    sourceProof: "Build 77 review import outcome",
    accent: "#ff6a30",
    secondary: "#1d9f70",
    layout: "scanner",
  },
  {
    id: "approve",
    fileName: "02-approve-deadlines.png",
    sourceFile: "app-06-review.png",
    sourceProof: "Build 77 approve-before-save review UI",
    accent: "#ff6a30",
    secondary: "#121826",
    layout: "phone-left",
  },
  {
    id: "semester",
    fileName: "03-semester-built.png",
    sourceFile: "app-07-semester-ready.png",
    sourceProof: "Build 77 semester-ready outcome UI",
    accent: "#ff6a30",
    secondary: "#8b5cf6",
    layout: "phone-center",
  },
  {
    id: "today",
    fileName: "04-today-next-move.png",
    sourceFile: "app-08-today.png",
    sourceProof: "Build 77 Today dashboard outcome UI",
    accent: "#20b879",
    secondary: "#1977f3",
    layout: "phone-right",
  },
  {
    id: "study",
    fileName: "05-study-blocks.png",
    sourceFile: "app-09-focus.png",
    sourceProof: "Build 77 plan and focus outcome UI",
    accent: "#1977f3",
    secondary: "#20b879",
    layout: "phone-center",
  },
  {
    id: "sync",
    fileName: "06-widgets-sync.png",
    sourceFile: "app-10-widgets.png",
    sourceProof: "Build 77 in-app widget sync UI",
    accent: "#ffb020",
    secondary: "#20b879",
    layout: "phone-right",
  },
  {
    id: "widgets",
    fileName: "07-home-screen-widgets.png",
    sourceFile: "widget-02-normal-medium.png",
    sourceProof: "Build 77 real WidgetKit Home Screen proof",
    accent: "#1977f3",
    secondary: "#ffb020",
    layout: "widget",
  },
];

const copy = {
  "en-US": {
    lang: "en-US",
    dir: "ltr",
    slides: [
      ["Start with a reviewed plan.", "Class material becomes next steps."],
      ["Stay in control before save.", "You confirm what reaches the plan."],
      ["See the semester take shape.", "Classes, deadlines, and exams together."],
      ["Know what to do today.", "Health, deadlines, and focus in one view."],
      ["Study without the scramble.", "Real deadlines become calm study blocks."],
      ["Your plan stays with you.", "School priorities stay visible."],
      ["See the week at a glance.", "Today stays close on Home Screen."],
    ],
  },
  "en-CA": {
    lang: "en-CA",
    dir: "ltr",
    slides: [
      ["Start with a reviewed plan.", "Class material becomes next steps."],
      ["Stay in control before save.", "You confirm what reaches the plan."],
      ["See the term take shape.", "Classes, deadlines, and exams together."],
      ["Know what to do today.", "Health, deadlines, and focus in one view."],
      ["Study without the scramble.", "Real deadlines become calm study blocks."],
      ["Your plan stays with you.", "School priorities stay visible."],
      ["See the week at a glance.", "Today stays close on Home Screen."],
    ],
  },
  "en-GB": {
    lang: "en-GB",
    dir: "ltr",
    slides: [
      ["Start with a reviewed plan.", "Course material becomes next steps."],
      ["Stay in control before save.", "You confirm what reaches the plan."],
      ["See your term take shape.", "Classes, deadlines, and exams together."],
      ["Know what to do today.", "Progress, deadlines, and focus in one view."],
      ["Study without the scramble.", "Real deadlines become calm study blocks."],
      ["Your plan stays with you.", "Study priorities stay visible."],
      ["See the week at a glance.", "Today stays close on Home Screen."],
    ],
  },
  "en-AU": {
    lang: "en-AU",
    dir: "ltr",
    slides: [
      ["Start with a reviewed plan.", "Course material becomes next steps."],
      ["Stay in control before save.", "You confirm what reaches the plan."],
      ["See your term take shape.", "Classes, deadlines, and exams together."],
      ["Know what to do today.", "Progress, deadlines, and focus in one view."],
      ["Study without the scramble.", "Real deadlines become calm study blocks."],
      ["Your plan stays with you.", "Study priorities stay visible."],
      ["See the week at a glance.", "Today stays close on Home Screen."],
    ],
  },
  "de-DE": {
    lang: "de-DE",
    dir: "ltr",
    slides: [
      ["Starte mit geprüftem Plan.", "Kursmaterial wird zu nächsten Schritten."],
      ["Du behältst Kontrolle.", "Du bestätigst, was in den Plan kommt."],
      ["Sieh dein Semester entstehen.", "Kurse, Aufgaben und Prüfungen zusammen."],
      ["Wissen, was heute ansteht.", "Status, Fristen, Fokus."],
      ["Lernen ohne Last-Minute-Stress.", "Echte Fristen werden ruhige Lernblöcke."],
      ["Dein Plan bleibt bei dir.", "Studienprioritäten bleiben sichtbar."],
      ["Woche auf einen Blick.", "Heute bleibt auf dem Home-Bildschirm nah."],
    ],
  },
  "es-ES": {
    lang: "es-ES",
    dir: "ltr",
    slides: [
      ["Empieza con un plan revisado.", "El material se convierte en próximos pasos."],
      ["Mantén el control antes de guardar.", "Tú confirmas qué llega al plan."],
      ["Ve cómo toma forma el curso.", "Clases, fechas y exámenes juntos."],
      ["Sabe qué hacer hoy.", "Progreso, fechas y concentración en una vista."],
      ["Estudia sin agobios.", "Las fechas reales crean bloques tranquilos."],
      ["Tu plan te acompaña.", "Tus prioridades siguen visibles."],
      ["Ve la semana de un vistazo.", "Hoy siempre cerca en la pantalla de inicio."],
    ],
  },
  "es-MX": {
    lang: "es-MX",
    dir: "ltr",
    slides: [
      ["Empieza con un plan revisado.", "El material se convierte en próximos pasos."],
      ["Mantén el control antes de guardar.", "Tú confirmas qué llega al plan."],
      ["Ve cómo toma forma el semestre.", "Clases, fechas y exámenes juntos."],
      ["Conoce qué hacer hoy.", "Avance, fechas y enfoque en una vista."],
      ["Estudia sin prisas.", "Las fechas reales crean bloques tranquilos."],
      ["Tu plan te acompaña.", "Tus prioridades siguen visibles."],
      ["Ve la semana de un vistazo.", "Hoy siempre cerca en la pantalla de inicio."],
    ],
  },
  "fr-FR": {
    lang: "fr-FR",
    dir: "ltr",
    slides: [
      ["Commencez avec un plan validé.", "Les cours deviennent des prochaines étapes."],
      ["Gardez le contrôle avant d'enregistrer.", "Vous confirmez ce qui rejoint le plan."],
      ["Voyez le semestre prendre forme.", "Cours, échéances et examens réunis."],
      ["Sachez quoi faire aujourd'hui.", "État, échéances, focus."],
      ["Étudiez sans panique.", "Les vraies échéances deviennent des sessions calmes."],
      ["Votre plan vous suit.", "Vos priorités restent visibles."],
      ["Voyez la semaine d'un coup d'œil.", "Aujourd'hui reste proche sur l'écran d'accueil."],
    ],
  },
  "fr-CA": {
    lang: "fr-CA",
    dir: "ltr",
    slides: [
      ["Commencez avec un plan validé.", "Les cours deviennent des prochaines étapes."],
      ["Gardez le contrôle avant d'enregistrer.", "Vous confirmez ce qui rejoint le plan."],
      ["Voyez la session prendre forme.", "Cours, échéances et examens réunis."],
      ["Sachez quoi faire aujourd'hui.", "État, échéances, focus."],
      ["Étudiez sans panique.", "Les vraies échéances deviennent des blocs calmes."],
      ["Votre plan vous suit.", "Vos priorités restent visibles."],
      ["Voyez la semaine d'un coup d'œil.", "Aujourd'hui reste proche sur l'écran d'accueil."],
    ],
  },
  "pt-BR": {
    lang: "pt-BR",
    dir: "ltr",
    slides: [
      ["Comece com um plano revisado.", "O material vira próximos passos."],
      ["Controle tudo antes de salvar.", "Você confirma o que entra no plano."],
      ["Veja o semestre tomar forma.", "Aulas, prazos e provas juntos."],
      ["Saiba o que fazer hoje.", "Progresso, prazos e foco."],
      ["Estude sem correria.", "Prazos reais viram blocos tranquilos."],
      ["Seu plano acompanha você.", "Prioridades ficam visíveis."],
      ["Veja a semana num olhar.", "Hoje fica perto na Tela de Início."],
    ],
  },
  "pt-PT": {
    lang: "pt-PT",
    dir: "ltr",
    slides: [
      ["Comece com um plano revisto.", "O material torna-se próximos passos."],
      ["Controle tudo antes de guardar.", "Confirma o que entra no plano."],
      ["Veja o semestre ganhar forma.", "Aulas, prazos e exames juntos."],
      ["Saiba o que fazer hoje.", "Progresso, prazos e foco."],
      ["Estude sem correria.", "Prazos reais tornam-se blocos calmos."],
      ["O plano acompanha-o.", "Prioridades ficam visíveis."],
      ["Veja a semana num olhar.", "Hoje fica perto no Ecrã principal."],
    ],
  },
  "ar-SA": {
    lang: "ar-SA",
    dir: "rtl",
    slides: [
      ["ابدأ بخطة راجعتها.", "تتحول المواد إلى خطوات تالية."],
      ["تحكّم قبل الحفظ.", "تؤكد ما يدخل إلى الخطة."],
      ["شاهد الفصل يتشكل.", "المواد والمواعيد والاختبارات معًا."],
      ["اعرف ما تفعله اليوم.", "الحالة والمواعيد والتركيز."],
      ["ذاكر بلا ارتباك.", "المواعيد تتحول إلى جلسات هادئة."],
      ["تبقى خطتك معك.", "الأولويات الدراسية تبقى ظاهرة."],
      ["الأسبوع بلمحة واحدة.", "اليوم قريب على الشاشة الرئيسية."],
    ],
  },
  hi: {
    lang: "hi",
    dir: "ltr",
    slides: [
      ["समीक्षा किए प्लान से शुरू करें.", "सामग्री अगले कदमों में बदलती है."],
      ["सेव से पहले नियंत्रण रखें.", "प्लान में क्या जाए, आप तय करें."],
      ["सेमेस्टर को आकार लेते देखें.", "क्लास, डेडलाइन और परीक्षाएं साथ में."],
      ["आज क्या करना है जानें.", "प्रगति, डेडलाइन और फोकस एक जगह."],
      ["बिना हड़बड़ी पढ़ें.", "असली डेडलाइन शांत स्टडी ब्लॉक बनती हैं."],
      ["आपका प्लान साथ रहता है.", "पढ़ाई की प्राथमिकताएं दिखती रहती हैं."],
      ["सप्ताह एक नज़र में देखें.", "आज होम स्क्रीन पर पास रहता है."],
    ],
  },
  ja: {
    lang: "ja",
    dir: "ltr",
    slides: [
      ["確認済みの計画から始める。", "授業資料が次の一歩に変わる。"],
      ["保存前に自分で管理。", "計画に入る内容を確認。"],
      ["学期が形になっていく。", "授業、締切、試験をまとめて。"],
      ["今日やることがわかる。", "進捗、締切、集中を一画面で。"],
      ["慌てずに勉強できる。", "締切が落ち着いた学習枠に。"],
      ["計画がいつもそばに。", "学習の優先事項が見える。"],
      ["週をひと目で確認。", "今日がホーム画面に近く。"],
    ],
  },
  ko: {
    lang: "ko",
    dir: "ltr",
    slides: [
      ["검토된 계획으로 시작하세요.", "수업 자료가 다음 할 일로 바뀝니다."],
      ["저장 전까지 직접 관리하세요.", "계획에 들어갈 내용을 확인합니다."],
      ["학기 계획이 잡혀갑니다.", "수업, 마감일, 시험을 한곳에."],
      ["오늘 할 일을 알 수 있습니다.", "상태, 마감일, 집중을 한 화면에."],
      ["허둥대지 않고 공부하세요.", "실제 마감일이 차분한 공부 블록이 됩니다."],
      ["계획이 계속 따라옵니다.", "공부 우선순위가 보입니다."],
      ["한 주를 한눈에 보세요.", "오늘 할 일이 홈 화면 가까이에."],
    ],
  },
  "zh-Hans": {
    lang: "zh-Hans",
    dir: "ltr",
    slides: [
      ["从已审核的计划开始。", "课程资料变成下一步。"],
      ["保存前你始终掌控。", "你确认哪些进入计划。"],
      ["看见学期逐渐成形。", "课程、截止日期和考试集中管理。"],
      ["知道今天要做什么。", "进度、截止日期和专注一屏呈现。"],
      ["不再临时抱佛脚。", "真实截止日期变成从容学习时段。"],
      ["计划一直跟着你。", "学习重点始终可见。"],
      ["一眼看清本周。", "今天停留在主屏幕旁。"],
    ],
  },
  "zh-Hant": {
    lang: "zh-Hant",
    dir: "ltr",
    slides: [
      ["從已審核的計畫開始。", "課程資料變成下一步。"],
      ["儲存前你始終掌控。", "你確認哪些進入計畫。"],
      ["看見學期逐漸成形。", "課程、截止日期和考試集中管理。"],
      ["知道今天要做什麼。", "進度、截止日期和專注一屏呈現。"],
      ["不再臨時抱佛腳。", "真實截止日期變成從容學習時段。"],
      ["計畫一直跟著你。", "學習重點始終可見。"],
      ["一眼看清本週。", "今天停留在主畫面旁。"],
    ],
  },
};

const localeOrder = [
  "en-US",
  "en-CA",
  "en-GB",
  "en-AU",
  "de-DE",
  "es-ES",
  "es-MX",
  "fr-FR",
  "fr-CA",
  "pt-BR",
  "pt-PT",
  "ar-SA",
  "hi",
  "ja",
  "ko",
  "zh-Hans",
  "zh-Hant",
];

function htmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fileUrl(path) {
  return pathToFileURL(resolve(path)).href;
}

function readPngSize(path) {
  const bytes = readFileSync(path);
  if (bytes.toString("ascii", 1, 4) !== "PNG") {
    throw new Error(`${path} is not a PNG`);
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function assertInputs() {
  const required = [logoPath, ...slides.map((slide) => `${sourceRoot}/${slide.sourceFile}`)];
  for (const path of required) {
    if (!existsSync(path)) {
      throw new Error(`Missing required source: ${path}`);
    }
  }
  if (!existsSync(CHROME)) {
    throw new Error(`Missing Chrome renderer at ${CHROME}`);
  }
}

function localeClass(locale) {
  if (locale === "ar-SA") return "rtl arabic";
  if (locale === "hi") return "indic";
  if (["ja", "ko", "zh-Hans", "zh-Hant"].includes(locale)) return "cjk";
  if (["de-DE", "fr-FR", "fr-CA", "pt-PT", "es-ES", "es-MX"].includes(locale)) {
    return "long";
  }
  return "";
}

function renderScannerInsert(locale, slide) {
  const isRtl = copy[locale].dir === "rtl";
  return `
    <div class="scanner-paper ${isRtl ? "scanner-paper-rtl" : ""}">
      <div class="scan-corner top-left"></div>
      <div class="scan-corner top-right"></div>
      <div class="scan-corner bottom-left"></div>
      <div class="scan-corner bottom-right"></div>
      <div class="paper-kicker"></div>
      <div class="paper-title"></div>
      <div class="paper-row short"></div>
      <div class="paper-row"></div>
      <div class="paper-row"></div>
      <div class="paper-row tiny"></div>
      <div class="scan-beam" style="background:${slide.accent}"></div>
    </div>`;
}

function renderScreenshot(slide, sourcePath) {
  return `
    <div class="phone-shell ${slide.layout}">
      <img class="product-shot" src="${fileUrl(sourcePath)}" alt="">
    </div>`;
}

function renderHtml(locale, slide, index) {
  const data = copy[locale];
  const [headline, subhead] = data.slides[index];
  const sourcePath = `${sourceRoot}/${slide.sourceFile}`;
  const cls = localeClass(locale);
  const isRtl = data.dir === "rtl";
  const scanner = slide.layout === "scanner" ? renderScannerInsert(locale, slide) : "";
  const screenshot = renderScreenshot(slide, sourcePath);
  const topSide = isRtl ? "right" : "left";
  const inverseSide = isRtl ? "left" : "right";

  return `<!doctype html>
<html lang="${htmlEscape(data.lang)}" dir="${htmlEscape(data.dir)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${WIDTH}, height=${HEIGHT}, initial-scale=1">
<style>
  * { box-sizing: border-box; }
  html, body {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    margin: 0;
    overflow: hidden;
    background: #f5f7fb;
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Noto Sans", "Noto Sans Arabic", "Noto Sans Devanagari", "Noto Sans CJK JP", "Arial Unicode MS", sans-serif;
    color: #07111f;
  }
  .stage {
    position: relative;
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    overflow: hidden;
    background:
      linear-gradient(180deg, #ffffff 0%, #f7f8fb 58%, #f2f5f9 100%);
  }
  .plate {
    position: absolute;
    left: 54px;
    top: 52px;
    width: 1134px;
    height: 2584px;
    border-radius: 86px;
    background: rgba(255, 255, 255, 0.86);
    border: 1px solid rgba(17, 24, 39, 0.07);
    box-shadow: 0 42px 120px rgba(15, 23, 42, 0.10);
    overflow: hidden;
  }
  .brand {
    position: absolute;
    top: 104px;
    ${topSide}: 96px;
    display: flex;
    flex-direction: ${isRtl ? "row-reverse" : "row"};
    align-items: center;
    gap: 18px;
    color: #111827;
    font-size: 34px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: 0;
    z-index: 5;
  }
  .logo {
    width: 64px;
    height: 64px;
    border-radius: 18px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.16);
  }
  .copy {
    position: absolute;
    top: 218px;
    ${topSide}: 96px;
    width: ${isRtl ? 980 : 990}px;
    text-align: ${isRtl ? "right" : "left"};
    z-index: 5;
  }
  .headline {
    margin: 0;
    max-width: 100%;
    color: #07111f;
    font-size: 78px;
    line-height: 0.97;
    font-weight: 900;
    letter-spacing: 0;
  }
  .subhead {
    margin: 28px 0 0;
    max-width: 770px;
    color: #586174;
    font-size: 34px;
    line-height: 1.18;
    font-weight: 650;
    letter-spacing: 0;
  }
  .rtl .subhead {
    margin-${isRtl ? "right" : "left"}: 0;
    margin-${inverseSide}: auto;
  }
  .long .headline { font-size: 68px; line-height: 1.01; }
  .long .subhead { font-size: 31px; max-width: 840px; }
  .arabic .headline { font-size: 70px; line-height: 1.08; }
  .arabic .subhead { font-size: 34px; line-height: 1.32; max-width: 860px; }
  .indic .headline { font-size: 62px; line-height: 1.11; }
  .indic .subhead { font-size: 31px; line-height: 1.32; max-width: 890px; }
  .cjk .headline { font-size: 70px; line-height: 1.08; font-weight: 850; }
  .cjk .subhead { font-size: 34px; line-height: 1.25; max-width: 850px; }
  .accent-shape {
    position: absolute;
    border-radius: 999px;
    opacity: 0.96;
    z-index: 1;
  }
  .shape-a {
    width: 460px;
    height: 460px;
    right: -188px;
    bottom: 168px;
    background: ${slide.accent};
  }
  .shape-b {
    width: 380px;
    height: 380px;
    left: -172px;
    bottom: 430px;
    background: ${slide.secondary};
  }
  .shape-c {
    position: absolute;
    width: 380px;
    height: 24px;
    right: 88px;
    top: 672px;
    border-radius: 999px;
    background: ${slide.accent};
    opacity: 0.12;
    z-index: 1;
  }
  .phone-shell {
    position: absolute;
    z-index: 4;
    overflow: hidden;
    border-radius: 56px;
    background: #ffffff;
    box-shadow:
      0 42px 95px rgba(15, 23, 42, 0.18),
      0 0 0 1px rgba(15, 23, 42, 0.06);
  }
  .product-shot {
    display: block;
    width: 100%;
    height: auto;
  }
  .phone-center {
    width: 746px;
    left: 248px;
    top: 742px;
  }
  .phone-left {
    width: 722px;
    left: 112px;
    top: 746px;
  }
  .phone-right {
    width: 722px;
    right: 112px;
    top: 746px;
  }
  .widget {
    width: 760px;
    left: 241px;
    top: 746px;
  }
  .scanner {
    width: 650px;
    right: 96px;
    top: 884px;
  }
  .scanner-paper {
    position: absolute;
    z-index: 3;
    left: 96px;
    top: 736px;
    width: 432px;
    height: 548px;
    border-radius: 36px;
    background: #ffffff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 28px 80px rgba(15, 23, 42, 0.14);
    transform: rotate(-5deg);
    overflow: hidden;
  }
  .scanner-paper-rtl {
    left: auto;
    right: 96px;
    transform: rotate(5deg);
  }
  .scan-corner {
    position: absolute;
    width: 62px;
    height: 62px;
    border-color: ${slide.accent};
    opacity: 0.95;
  }
  .top-left { top: 26px; left: 26px; border-top: 8px solid; border-left: 8px solid; border-radius: 14px 0 0 0; }
  .top-right { top: 26px; right: 26px; border-top: 8px solid; border-right: 8px solid; border-radius: 0 14px 0 0; }
  .bottom-left { bottom: 26px; left: 26px; border-bottom: 8px solid; border-left: 8px solid; border-radius: 0 0 0 14px; }
  .bottom-right { bottom: 26px; right: 26px; border-bottom: 8px solid; border-right: 8px solid; border-radius: 0 0 14px 0; }
  .paper-kicker,
  .paper-title,
  .paper-row {
    position: absolute;
    left: 76px;
    right: 76px;
    border-radius: 999px;
    background: #e6eaf1;
  }
  .paper-kicker { top: 104px; height: 18px; width: 124px; background: ${slide.secondary}; opacity: 0.45; }
  .paper-title { top: 152px; height: 34px; background: #111827; opacity: 0.16; }
  .paper-row { height: 18px; left: 76px; right: 76px; background: #d8dee9; }
  .paper-row.short { top: 230px; right: 154px; }
  .paper-row:not(.short):not(.tiny) { top: 282px; }
  .paper-row:not(.short):not(.tiny) + .paper-row { top: 334px; }
  .paper-row.tiny { top: 386px; right: 210px; }
  .scan-beam {
    position: absolute;
    left: 40px;
    right: 40px;
    top: 246px;
    height: 8px;
    border-radius: 999px;
    box-shadow: 0 0 36px currentColor;
  }
  .outcome-pill {
    position: absolute;
    z-index: 5;
    left: 146px;
    top: 1320px;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 20px 26px;
    border-radius: 999px;
    color: #0c5138;
    background: rgba(228, 249, 239, 0.94);
    box-shadow: 0 22px 60px rgba(15, 23, 42, 0.11);
  }
  .outcome-dot {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: ${slide.secondary};
  }
  .outcome-line {
    width: 178px;
    height: 18px;
    border-radius: 999px;
    background: rgba(12, 81, 56, 0.18);
  }
</style>
</head>
<body>
<main class="stage ${cls}">
  <section class="plate"></section>
  <div class="shape-a accent-shape"></div>
  <div class="shape-b accent-shape"></div>
  <div class="shape-c"></div>
  <div class="brand">
    <img class="logo" src="${fileUrl(logoPath)}" alt="">
    <span>StudyPlanner AI</span>
  </div>
  <section class="copy">
    <h1 class="headline">${htmlEscape(headline)}</h1>
    <p class="subhead">${htmlEscape(subhead)}</p>
  </section>
  ${scanner}
  ${screenshot}
  ${slide.layout === "scanner" ? '<div class="outcome-pill"><span class="outcome-dot"></span><span class="outcome-line"></span></div>' : ""}
</main>
</body>
</html>`;
}

function screenshot(htmlPath, outputPath, width = WIDTH, height = HEIGHT) {
  mkdirSync(dirname(outputPath), { recursive: true });
  rmSync(outputPath, { force: true });
  const result = spawnSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--allow-file-access-from-files",
      "--force-device-scale-factor=1",
      `--window-size=${width},${height}`,
      "--virtual-time-budget=1000",
      `--screenshot=${resolve(outputPath)}`,
      pathToFileURL(resolve(htmlPath)).href,
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(
      `Chrome screenshot failed for ${htmlPath}\n${result.stdout}\n${result.stderr}`,
    );
  }
  const size = readPngSize(outputPath);
  if (size.width !== width || size.height !== height) {
    throw new Error(
      `Unexpected output size for ${outputPath}: ${size.width}x${size.height}`,
    );
  }
}

function renderContactSheet(locale, entries) {
  const width = 2140;
  const height = 980;
  const cards = entries
    .map(
      (entry, index) => `
        <figure>
          <img src="${fileUrl(entry.outputPath)}" alt="">
          <figcaption>${String(index + 1).padStart(2, "0")} ${htmlEscape(entry.slideId)}</figcaption>
        </figure>`,
    )
    .join("");
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body { width: ${width}px; height: ${height}px; margin: 0; background: #f5f7fb; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
  .sheet { width: ${width}px; height: ${height}px; padding: 34px; }
  h1 { margin: 0 0 24px; font-size: 34px; line-height: 1; color: #111827; }
  .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 18px; }
  figure { margin: 0; background: #fff; border: 1px solid #dde2ea; border-radius: 18px; padding: 12px; box-shadow: 0 16px 46px rgba(15, 23, 42, 0.09); }
  img { width: 100%; border-radius: 12px; display: block; }
  figcaption { padding-top: 10px; color: #4b5563; font-size: 17px; font-weight: 700; }
</style></head><body>
  <main class="sheet">
    <h1>${htmlEscape(locale)} Copy B outcomes: all seven screenshots</h1>
    <section class="grid">${cards}</section>
  </main>
</body></html>`;
  const htmlPath = `${QA_ROOT}/contact-sheets/${locale}.html`;
  const outputPath = `${QA_ROOT}/contact-sheets/${locale}.png`;
  mkdirSync(dirname(htmlPath), { recursive: true });
  writeFileSync(htmlPath, html);
  screenshot(htmlPath, outputPath, width, height);
  return outputPath;
}

function renderAllLocalesContactSheet(entries) {
  const width = 2260;
  const rowHeight = 404;
  const height = 150 + localeOrder.length * rowHeight;
  const rows = localeOrder
    .map((locale) => {
      const localeEntries = entries.filter((entry) => entry.locale === locale);
      return `<section class="row">
        <h2>${htmlEscape(locale)}</h2>
        <div class="thumbs">
          ${localeEntries
            .map((entry) => `<img src="${fileUrl(entry.outputPath)}" alt="${htmlEscape(entry.slideId)}">`)
            .join("")}
        </div>
      </section>`;
    })
    .join("");
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body { width: ${width}px; height: ${height}px; margin: 0; background: #f5f7fb; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
  main { width: ${width}px; min-height: ${height}px; padding: 34px; }
  h1 { margin: 0 0 26px; font-size: 38px; color: #111827; }
  .row { display: grid; grid-template-columns: 140px 1fr; align-items: center; height: ${rowHeight}px; border-top: 1px solid #dce3ee; }
  h2 { margin: 0; font-size: 26px; color: #111827; }
  .thumbs { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; align-items: center; }
  img { width: 100%; border-radius: 12px; box-shadow: 0 10px 26px rgba(15,23,42,0.12); }
</style></head><body>
  <main>
    <h1>Outcome Copy B all locales: ${entries.length} screenshots</h1>
    ${rows}
  </main>
</body></html>`;
  const htmlPath = `${QA_ROOT}/contact-sheets/all-locales.html`;
  const outputPath = `${QA_ROOT}/contact-sheets/all-locales.png`;
  mkdirSync(dirname(htmlPath), { recursive: true });
  writeFileSync(htmlPath, html);
  screenshot(htmlPath, outputPath, width, height);
  return outputPath;
}

function generate() {
  assertInputs();
  mkdirSync(QA_ROOT, { recursive: true });

  const entries = [];
  for (const locale of localeOrder) {
    const localeCopy = copy[locale];
    if (!localeCopy) {
      throw new Error(`Missing copy for locale ${locale}`);
    }
    for (const [index, slide] of slides.entries()) {
      const outputPath = `${OUTPUT_ROOT}/${locale}/APP_IPHONE_65/${slide.fileName}`;
      const htmlPath = `${QA_ROOT}/html/${locale}/${basename(slide.fileName, ".png")}.html`;
      mkdirSync(dirname(htmlPath), { recursive: true });
      writeFileSync(htmlPath, renderHtml(locale, slide, index));
      screenshot(htmlPath, outputPath);
      entries.push({
        locale,
        lang: localeCopy.lang,
        direction: localeCopy.dir,
        slideId: slide.id,
        slideIndex: index + 1,
        outputPath,
        sourcePath: `${sourceRoot}/${slide.sourceFile}`,
        sourceProof: slide.sourceProof,
        headline: localeCopy.slides[index][0],
        subhead: localeCopy.slides[index][1],
        size: { width: WIDTH, height: HEIGHT },
      });
      process.stdout.write(`rendered ${locale} ${slide.fileName}\n`);
    }
  }

  const localeContactSheets = Object.fromEntries(
    localeOrder.map((locale) => [
      locale,
      renderContactSheet(
        locale,
        entries.filter((entry) => entry.locale === locale),
      ),
    ]),
  );
  const allLocalesContactSheet = renderAllLocalesContactSheet(entries);

  writeFileSync(
    MANIFEST_PATH,
    `${JSON.stringify(
      {
        generatedAt: "2026-07-08",
        release: "Back-to-School Semester Kickoff",
        treatment: "Outcome Copy B all locales",
        outputRoot: OUTPUT_ROOT,
        sourceRule:
          "Use current live ASC previews as Copy A/control. Copy B uses only clean latest Build 77 outcome screenshots; no locked import screen or generated product UI.",
        requiredSize: { width: WIDTH, height: HEIGHT },
        logoPath,
        locales: localeOrder,
        slides: slides.map((slide) => ({
          id: slide.id,
          fileName: slide.fileName,
          sourcePath: `${sourceRoot}/${slide.sourceFile}`,
          sourceProof: slide.sourceProof,
        })),
        contactSheets: {
          ...localeContactSheets,
          allLocales: allLocalesContactSheet,
        },
        entries,
      },
      null,
      2,
    )}\n`,
  );

  process.stdout.write(`manifest ${MANIFEST_PATH}\n`);
}

function check() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const failures = [];
  for (const entry of manifest.entries) {
    if (!existsSync(entry.outputPath)) {
      failures.push(`${entry.outputPath}: missing`);
      continue;
    }
    const size = readPngSize(entry.outputPath);
    if (size.width !== WIDTH || size.height !== HEIGHT) {
      failures.push(`${entry.outputPath}: ${size.width}x${size.height}`);
    }
  }
  if (manifest.entries.length !== localeOrder.length * slides.length) {
    failures.push(`expected ${localeOrder.length * slides.length} entries, found ${manifest.entries.length}`);
  }
  for (const locale of localeOrder) {
    const count = manifest.entries.filter((entry) => entry.locale === locale).length;
    if (count !== slides.length) {
      failures.push(`${locale}: expected ${slides.length}, found ${count}`);
    }
  }
  if (failures.length) {
    throw new Error(`Outcome Copy B check failed:\n${failures.join("\n")}`);
  }
  process.stdout.write(
    `ok ${manifest.entries.length} screenshots, ${localeOrder.length} locales, ${WIDTH}x${HEIGHT}\n`,
  );
}

if (process.argv.includes("--check")) {
  check();
} else {
  generate();
}
