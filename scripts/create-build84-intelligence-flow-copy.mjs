#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const source = JSON.parse(readFileSync(resolve("docs/launch/back-to-school-2026/build83-five-slide-copy.json"), "utf8"));
const output = resolve(process.argv[2] || "docs/launch/back-to-school-2026/build84-intelligence-flow-copy.json");

const opening = {
  "ar-SA": ["امسح. استورد. ابدأ متقدمًا.", "حوّل منهجًا أو ملاحظات إلى خطة تراجعها.", "أضفه بطريقتك.", "استورد ملف PDF، أو الصق نصًا، أو أدخل التفاصيل بنفسك."],
  "de-DE": ["Scannen. Importieren. Vorsprung gewinnen.", "Mach aus Lehrplan oder Notizen einen Plan, den du prüfst.", "Füge es auf deine Art hinzu.", "Importiere ein PDF, füge Text ein oder gib die Details selbst ein."],
  "en-AU": ["Scan. Import. Start ahead.", "Turn a syllabus or notes into a plan you review.", "Add it your way.", "Import a PDF, paste text or enter details yourself."],
  "en-CA": ["Scan. Import. Start ahead.", "Turn a syllabus or notes into a plan you review.", "Add it your way.", "Import a PDF, paste text, or enter details yourself."],
  "en-GB": ["Scan. Import. Start ahead.", "Turn a syllabus or notes into a plan you review.", "Add it your way.", "Import a PDF, paste text or enter details yourself."],
  "en-US": ["Scan. Import. Start ahead.", "Turn a syllabus or notes into a plan you review.", "Add it your way.", "Import a PDF, paste text, or enter details yourself."],
  "es-ES": ["Escanea. Importa. Toma ventaja.", "Convierte un temario o unos apuntes en un plan que tú revisas.", "Añádelo a tu manera.", "Importa un PDF, pega texto o introduce los detalles tú mismo."],
  "es-MX": ["Escanea. Importa. Empieza con ventaja.", "Convierte un temario o tus apuntes en un plan que tú revisas.", "Agrégalo a tu manera.", "Importa un PDF, pega texto o ingresa los detalles tú mismo."],
  "fr-CA": ["Numérise. Importe. Prends de l’avance.", "Transforme un plan de cours ou des notes en plan que tu révises.", "Ajoute-le à ta façon.", "Importe un PDF, colle du texte ou saisis toi-même les détails."],
  "fr-FR": ["Scanne. Importe. Prends de l’avance.", "Transforme un syllabus ou des notes en plan que tu vérifies.", "Ajoute-le à ta façon.", "Importe un PDF, colle du texte ou saisis toi-même les détails."],
  hi: ["स्कैन करें। इम्पोर्ट करें। आगे रहें।", "सिलेबस या नोट्स को ऐसे प्लान में बदलें जिसे आप जाँचते हैं।", "अपने तरीके से जोड़ें।", "PDF इम्पोर्ट करें, टेक्स्ट पेस्ट करें या विवरण खुद भरें।"],
  ja: ["スキャン。読み込み。先回り。", "シラバスやノートを、確認できる計画に変えます。", "自分に合う方法で追加。", "PDFの読み込み、テキストの貼り付け、手入力から選べます。"],
  ko: ["스캔. 가져오기. 한발 앞서기.", "강의계획서나 노트를 검토 가능한 계획으로 바꾸세요.", "내 방식대로 추가하세요.", "PDF를 가져오거나 텍스트를 붙여넣거나 직접 입력하세요."],
  "pt-BR": ["Escaneie. Importe. Saia na frente.", "Transforme um plano de ensino ou anotações em um plano que você revisa.", "Adicione do seu jeito.", "Importe um PDF, cole o texto ou insira os detalhes manualmente."],
  "pt-PT": ["Digitalize. Importe. Comece à frente.", "Transforme um plano de estudos ou apontamentos num plano que revê.", "Adicione à sua maneira.", "Importe um PDF, cole texto ou introduza os detalhes manualmente."],
  "zh-Hans": ["扫描。导入。提前一步。", "把教学大纲或笔记变成由你检查的计划。", "按你的方式添加。", "导入 PDF、粘贴文本，或亲自输入详细信息。"],
  "zh-Hant": ["掃描。匯入。提早一步。", "把課程大綱或筆記變成由你檢查的計畫。", "依你的方式加入。", "匯入 PDF、貼上文字，或自行輸入詳細資料。"],
};

const localizations = {};
for (const [locale, oldSlides] of Object.entries(source.localizations)) {
  const [headline1, subhead1, headline2, subhead2] = opening[locale];
  const oldControl = oldSlides.find(({ id }) => id === "02-approve-deadlines");
  const oldPlan = oldSlides.find(({ id }) => id === "04-plan-the-week");
  const oldToday = oldSlides.find(({ id }) => id === "03-today-next-move");
  localizations[locale] = [
    { id: "01-scan-material", proof: ["scan-light", "scanner-ready-dark"], appearance: "light", headline: headline1, subhead: subhead1 },
    { id: "02-add-your-way", proof: ["import-options-light", "manual-input-light"], appearance: "light", headline: headline2, subhead: subhead2 },
    { id: "03-approve-deadlines", proof: ["review-light"], appearance: "light", headline: oldControl.headline, subhead: oldControl.subhead },
    { id: "04-make-time", proof: ["plan-dark"], appearance: "dark", headline: oldPlan.headline, subhead: oldPlan.subhead },
    { id: "05-next-move", proof: ["today-light", "widgets-light"], appearance: "light", headline: oldToday.headline, subhead: oldToday.subhead },
  ];
}

const payload = {
  schemaVersion: 1,
  status: "draft_requires_native_language_review",
  story: "intelligence-flow",
  productUiPolicy: "exact_build84_pixels_only",
  sourceCommit: "33172679b07f23b6d43da3733191508170830840",
  localeCount: Object.keys(localizations).length,
  slideCount: 5,
  hardClaims: [],
  localizations,
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${Object.keys(localizations).length * 5} localized slide-copy records to ${output}`);
