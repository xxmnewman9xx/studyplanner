#!/usr/bin/env node
// StudyPlanner 2.2 App Store screenshots: four minimalist, Apple-style slides
// per store locale (1284×2778, APP_IPHONE_65).
//
//   node scripts/compose-2-2-store-screenshots.mjs --capture-url http://localhost:8765
//     captures the real app screens from a QA web build
//     (EXPO_PUBLIC_STUDYPLANNER_CAPTURE_QA=1 npx expo export -p web), then composes.
//   node scripts/compose-2-2-store-screenshots.mjs --captures <dir>
//     composes from simulator captures: <dir>/<captureLocale>/<slide>.png
//     (preferred for final upload: real iOS rendering).
//   --rating 4.9   adds "★★★★★ 4.9 · App Store" to the hero. Only pass the
//                  rating App Store Connect actually shows; omitted by default.
//
// Honesty rules baked in: "Apple Intelligence" stays in English, appears only as
// a referential line on the hero, never in zh-Hans / hi / ar, and always with
// the device-requirement footnote. No Apple logos.
import { mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const OpenCC = require("opencc-js/cn2t");
const toTraditional = OpenCC.Converter({ from: "cn", to: "tw" });

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, value, index, list) => (value.startsWith("--") ? [...acc, [value.slice(2), list[index + 1] && !list[index + 1].startsWith("--") ? list[index + 1] : true]] : acc), []));
const rating = args.rating && /^[1-5](\.\d)?$/.test(String(args.rating)) ? String(args.rating) : null;
const CANVAS = { width: 1284, height: 2778 };

// store locale -> [browser/capture locale, copy language, AI hero allowed]
const STORE = {
  "en-US": ["en-US", "en", true], "en-AU": ["en-US", "en", true], "en-CA": ["en-US", "en", true], "en-GB": ["en-US", "en", true],
  "de-DE": ["de-DE", "de", true], "es-ES": ["es-ES", "es", true], "es-MX": ["es-ES", "es", true],
  "fr-FR": ["fr-FR", "fr", true], "fr-CA": ["fr-FR", "fr", true], "pt-BR": ["pt-BR", "pt", true], "pt-PT": ["pt-PT", "pt", true],
  ja: ["ja-JP", "ja", true], ko: ["ko-KR", "ko", true], "zh-Hant": ["zh-TW", "zht", true],
  "zh-Hans": ["zh-CN", "zh", false], hi: ["hi-IN", "hi", false], "ar-SA": ["ar", "ar", false],
};

// Screens: the four highest-leverage moments of the 2.2 story.
const SLIDES = [
  { id: "01-semester", capture: { tab: "today", qaState: "examHeavy" } },
  { id: "02-crunch-forecast", capture: { screen: "forecast", qaState: "examHeavy" } },
  { id: "03-exam-mode", capture: { screen: "practiceQuiz", qaState: "build57" } },
  { id: "04-scan-anything", capture: { onboardingIndex: 2, emptyPlanner: true } },
];
// Extra raw screens for App Preview / hero editing (captured, not composed).
const RAW_EXTRA = [
  { id: "05-review-forecast", capture: { route: "review", qaState: "build57" } },
  { id: "06-exam-mode", capture: { screen: "examMode", qaState: "build57" } },
];

const COPY = {
  en: { ai: "Now with Apple Intelligence", h: ["See your semester coming.", "Spot crunch weeks months early.", "Quiz yourself from your own notes.", "Scan it, paste it, or type it."], s: ["Scan every syllabus. Get one clear move every day.", "Every class on one heatmap, with start-by dates.", "Flashcards and questions that cite the line they came from.", "Review every deadline before anything saves."], trust: ["No account", "Private on your iPhone", "Free to scan"], foot: "Apple Intelligence features need iPhone 15 Pro or later with Apple Intelligence turned on." },
  de: { ai: "Jetzt mit Apple Intelligence", h: ["Sieh dein Semester kommen.", "Stresswochen Monate vorher sehen.", "Lerne mit deinen eigenen Notizen.", "Scannen, einfügen oder tippen."], s: ["Jeden Lehrplan scannen. Jeden Tag ein klarer Schritt.", "Alle Kurse auf einer Heatmap, mit Startterminen.", "Karteikarten und Fragen mit Quellzeile aus deinen Notizen.", "Jede Frist prüfen, bevor etwas gespeichert wird."], trust: ["Kein Konto", "Privat auf deinem iPhone", "Scannen gratis"], foot: "Apple Intelligence-Funktionen brauchen ein iPhone 15 Pro oder neuer mit aktivierter Apple Intelligence." },
  es: { ai: "Ahora con Apple Intelligence", h: ["Ve venir tu semestre.", "Detecta semanas pesadas con meses.", "Estudia con tus propios apuntes.", "Escanéalo, pégalo o escríbelo."], s: ["Escanea cada programa. Un paso claro cada día.", "Todas tus clases en un mapa de calor, con fechas de inicio.", "Tarjetas y preguntas que citan la línea de origen.", "Revisa cada entrega antes de guardar nada."], trust: ["Sin cuenta", "Privado en tu iPhone", "Escanear es gratis"], foot: "Las funciones de Apple Intelligence requieren iPhone 15 Pro o posterior con Apple Intelligence activado." },
  fr: { ai: "Désormais avec Apple Intelligence", h: ["Vois ton semestre venir.", "Repère les semaines de rush.", "Révise avec tes propres notes.", "Scanne, colle ou saisis."], s: ["Scanne chaque programme. Une action claire chaque jour.", "Tous tes cours sur une carte de chaleur, avec dates de départ.", "Fiches et questions qui citent la ligne source.", "Vérifie chaque échéance avant tout enregistrement."], trust: ["Sans compte", "Privé sur ton iPhone", "Scan gratuit"], foot: "Les fonctions Apple Intelligence nécessitent un iPhone 15 Pro ou ultérieur avec Apple Intelligence activé." },
  pt: { ai: "Agora com Apple Intelligence", h: ["Veja o seu semestre chegando.", "Antecipe as semanas mais puxadas.", "Estude com as suas próprias notas.", "Digitalize, cole ou digite."], s: ["Digitalize cada plano de ensino. Um passo claro por dia.", "Todas as matérias num mapa de calor, com datas de início.", "Cartões e perguntas que citam a linha de origem.", "Revise cada prazo antes de guardar."], trust: ["Sem conta", "Privado no seu iPhone", "Digitalizar é grátis"], foot: "Os recursos do Apple Intelligence exigem iPhone 15 Pro ou posterior com o Apple Intelligence ativado." },
  ja: { ai: "Apple Intelligenceに対応", h: ["学期の山場が、先に見える。", "山場の週を数か月前に。", "自分のノートで小テスト。", "撮る、貼る、入力する。"], s: ["シラバスを取り込むだけ。毎日、次の一手がわかる。", "全授業を1つのヒートマップに。開始日も提案。", "出典の行を示すフラッシュカードと問題。", "保存前にすべての締切を確認。"], trust: ["アカウント不要", "iPhoneの中だけで処理", "取り込みは無料"], foot: "Apple Intelligenceの機能には、Apple IntelligenceをオンにしたiPhone 15 Pro以降が必要です。" },
  ko: { ai: "이제 Apple Intelligence 지원", h: ["학기의 고비가 먼저 보여요.", "고비 주간을 몇 달 전에.", "내 노트로 퀴즈를 풀어요.", "찍고, 붙이고, 입력하세요."], s: ["강의계획서를 스캔하면 매일 할 일이 분명해져요.", "모든 수업을 하나의 히트맵으로, 시작일까지.", "출처 줄을 알려주는 카드와 문제.", "저장 전에 모든 마감을 검토해요."], trust: ["계정 불필요", "iPhone 안에서만", "스캔은 무료"], foot: "Apple Intelligence 기능은 Apple Intelligence가 켜진 iPhone 15 Pro 이상에서 사용할 수 있어요." },
  zh: { ai: "", h: ["学期高压周，提前看见。", "提前几个月发现高压周。", "用你自己的笔记来测验。", "拍照、粘贴或手动输入。"], s: ["扫描每份课程大纲，每天都有明确的下一步。", "所有课程一张热力图，附开始日期。", "闪卡和题目都标注出处行。", "保存前逐条确认每个截止日期。"], trust: ["无需账户", "数据留在你的 iPhone", "扫描免费"], foot: "" },
  zht: { ai: "現已支援 Apple Intelligence", foot: "Apple Intelligence 功能需要開啟 Apple Intelligence 的 iPhone 15 Pro 或後續機型。" },
  hi: { ai: "", h: ["अपना सेमेस्टर पहले से देखें।", "भारी सप्ताह महीनों पहले पहचानें।", "अपने नोट्स से खुद को क्विज़ करें।", "स्कैन करें, पेस्ट करें या लिखें।"], s: ["हर सिलेबस स्कैन करें। हर दिन एक साफ़ अगला कदम।", "सभी क्लास एक हीटमैप पर, शुरू करने की तारीख़ों के साथ।", "फ़्लैशकार्ड और सवाल, स्रोत पंक्ति के साथ।", "सेव से पहले हर डेडलाइन जाँचें।"], trust: ["खाता ज़रूरी नहीं", "आपके iPhone पर निजी", "स्कैन मुफ़्त"], foot: "" },
  ar: { ai: "", h: ["شاهد فصلك الدراسي قبل أن يأتي.", "اكتشف أسابيع الضغط قبلها بأشهر.", "اختبر نفسك من ملاحظاتك.", "امسح، الصق، أو اكتب."], s: ["امسح كل منهج. خطوة واضحة كل يوم.", "كل موادك في خريطة حرارية واحدة، مع مواعيد البدء.", "بطاقات وأسئلة تذكر السطر الذي جاءت منه.", "راجع كل موعد قبل أن يُحفظ أي شيء."], trust: ["بلا حساب", "خاص على جهاز iPhone", "المسح مجاني"], foot: "" },
};
COPY.zht = { ...Object.fromEntries(Object.entries(COPY.zh).map(([key, value]) => [key, Array.isArray(value) ? value.map((item) => toTraditional(item)) : toTraditional(value)])), ...COPY.zht };

const FONT_CSS = "https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&family=Noto+Sans+JP:wght@500;700;800&family=Noto+Sans+KR:wght@500;700;800&family=Noto+Sans+SC:wght@500;700;800&family=Noto+Sans+TC:wght@500;700;800&family=Noto+Sans+Devanagari:wght@500;700;800&family=Noto+Sans+Arabic:wght@500;700;800&display=block";
const fontStack = (lang) => {
  const cjk = { ja: "'Noto Sans JP'", ko: "'Noto Sans KR'", zh: "'Noto Sans SC'", zht: "'Noto Sans TC'", hi: "'Noto Sans Devanagari'", ar: "'Noto Sans Arabic'" }[lang];
  return ["'Inter'", cjk, "'Noto Sans SC'", "'Noto Sans Devanagari'", "'Noto Sans Arabic'", "sans-serif"].filter(Boolean).join(", ");
};

async function captureScreens(browser, captureDir) {
  const captureLocales = [...new Set(Object.values(STORE).map(([capture, lang]) => `${capture}|${lang}`))];
  for (const entry of captureLocales) {
    const [locale, lang] = entry.split("|");
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale });
    for (const slide of args["raw-only"] ? SLIDES.slice(0, 3) : [...SLIDES, ...RAW_EXTRA]) {
      const out = join(captureDir, locale, `${slide.id}.png`);
      mkdirSync(join(captureDir, locale), { recursive: true });
      const page = await context.newPage();
      const config = encodeURIComponent(JSON.stringify({ ...slide.capture, locale }));
      await page.goto(`${args["capture-url"]}/capture?config=${config}`, { waitUntil: "networkidle" }).catch(() => {});
      await page.addStyleTag({ url: FONT_CSS }).catch(() => {});
      await page.addStyleTag({ content: `* { font-family: ${fontStack(lang)} !important; }` });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1600);
      await page.screenshot({ path: out });
      await page.close();
    }
    await context.close();
  }
}

function slideHtml({ lang, rtl, index, screenPath, aiAllowed }) {
  const copy = COPY[lang];
  const hero = index === 0;
  const kicker = hero && aiAllowed && copy.ai ? `<div class="kicker"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9z" fill="#0A0A0A"/></svg>${copy.ai}</div>` : "";
  const stars = hero && rating ? `<div class="rating">★★★★★ <b>${rating}</b> · App Store</div>` : "";
  const trust = hero ? `<div class="trust">${copy.trust.map((item) => `<span>${item}</span>`).join("")}</div>` : "";
  const foot = hero && aiAllowed && copy.foot ? `<div class="foot">${copy.foot}</div>` : "";
  return `<!doctype html><html dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><link rel="stylesheet" href="${FONT_CSS}"><style>
    html,body{margin:0;width:${CANVAS.width}px;height:${CANVAS.height}px;overflow:hidden;background:${index % 2 ? "#F5F5F7" : "#FFFFFF"};font-family:${fontStack(lang)};color:#0A0A0A;-webkit-font-smoothing:antialiased}
    .top{position:absolute;top:150px;left:96px;right:96px;text-align:center}
    .kicker{display:inline-flex;align-items:center;gap:14px;font-size:38px;font-weight:700;letter-spacing:-0.2px;padding:16px 30px;border-radius:999px;border:2px solid rgba(0,0,0,0.12);margin-bottom:34px}
    .rating{font-size:34px;font-weight:600;color:#1D1D1F;margin-bottom:26px;letter-spacing:1px}
    h1{font-size:${lang === "de" || lang === "fr" ? 88 : 96}px;line-height:1.06;font-weight:800;letter-spacing:-2.5px;margin:0}
    p{font-size:42px;line-height:1.3;font-weight:500;color:#6E6E73;margin:28px auto 0;max-width:1000px}
    .trust{display:flex;justify-content:center;flex-wrap:wrap;gap:14px;margin-top:34px}
    .trust span{font-size:30px;font-weight:600;padding:12px 24px;border-radius:999px;background:#F2F2F4;color:#1D1D1F}
    .phone{position:absolute;left:50%;transform:translateX(-50%);top:${hero ? 1010 : 820}px;width:1030px;border-radius:120px;background:#0A0A0A;padding:22px;box-shadow:0 40px 90px rgba(0,0,0,0.16)}
    .screen{position:relative;border-radius:100px;overflow:hidden;background:#fff}
    .screen img{display:block;width:100%}
    .status{position:absolute;top:0;left:0;right:0;height:150px;display:flex;justify-content:space-between;align-items:center;padding:0 90px;font:700 44px Inter,sans-serif;color:#0A0A0A;direction:ltr}
    .icons{display:flex;align-items:center;gap:18px}.sig{display:block;width:52px;height:30px;background:linear-gradient(90deg,#0A0A0A 0 20%,transparent 20% 27%,#0A0A0A 27% 47%,transparent 47% 54%,#0A0A0A 54% 74%,transparent 74% 80%,#0A0A0A 80%);clip-path:polygon(0 100%,100% 0,100% 100%)}.bat{display:block;width:62px;height:30px;border:3px solid #0A0A0A;border-radius:9px;box-sizing:border-box;background:linear-gradient(90deg,#0A0A0A 0 80%,transparent 80%);background-clip:content-box;padding:3px}
    .island{position:absolute;top:34px;left:50%;transform:translateX(-50%);width:300px;height:86px;border-radius:50px;background:#0A0A0A}
    .foot{position:absolute;bottom:40px;left:90px;right:90px;text-align:center;font-size:24px;line-height:1.35;color:#8E8E93;background:rgba(255,255,255,0.92);padding:12px 18px;border-radius:18px}
  </style></head><body>
    <div class="top">${kicker}${stars}<h1>${copy.h[index]}</h1><p>${copy.s[index]}</p>${trust}</div>
    <div class="phone"><div class="screen"><img src="file://${screenPath}"><div class="status"><span>9:41</span><span class="icons"><i class="sig"></i><i class="bat"></i></span></div><div class="island"></div></div></div>
    ${foot}
  </body></html>`;
}

async function main() {
  const browser = await chromium.launch();
  const captureDir = resolve(args.captures || join(ROOT, "store", "app-preview-raw-2.2"));
  if (args["capture-url"]) await captureScreens(browser, captureDir);
  if (args["raw-only"]) {
    await browser.close();
    console.log(`Raw screens written to ${captureDir}`);
    return;
  }
  const page = await browser.newPage({ viewport: CANVAS, deviceScaleFactor: 1 });
  let written = 0;
  for (const [storeLocale, [captureLocale, lang, aiAllowed]] of Object.entries(STORE)) {
    const outDir = join(ROOT, "store", "apple", "screenshot", storeLocale, "APP_IPHONE_65");
    mkdirSync(outDir, { recursive: true });
    for (const [index, slide] of SLIDES.entries()) {
      const screenPath = join(captureDir, captureLocale, `${slide.id}.png`);
      if (!existsSync(screenPath)) throw new Error(`Missing capture ${screenPath}`);
      await page.setContent(slideHtml({ lang, rtl: lang === "ar", index, screenPath, aiAllowed }), { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: join(outDir, `${slide.id}.png`), clip: { x: 0, y: 0, ...CANVAS } });
      written += 1;
    }
  }
  await browser.close();
  console.log(`Composed ${written} screenshots (${Object.keys(STORE).length} store locales × ${SLIDES.length}).${rating ? ` Rating ${rating} shown.` : " No rating line (pass --rating from App Store Connect)."}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
