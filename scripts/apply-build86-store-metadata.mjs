import { readFileSync, writeFileSync } from "node:fs";

const path = "store.config.json";
const config = JSON.parse(readFileSync(path, "utf8"));
const localeMap = {
  "de-DE": "de", "fr-CA": "fr", "en-GB": "en", "en-AU": "en", "zh-Hans": "zh-Hans", "es-ES": "es",
  "pt-BR": "pt-BR", "pt-PT": "pt-PT", "ar-SA": "ar", hi: "hi", ko: "ko", "es-MX": "es",
  "zh-Hant": "zh-Hant", "fr-FR": "fr", ja: "ja", "en-CA": "en", "en-US": "en"
};
const copy = {
  en: {
    paragraph: "Your next move, before you open the app. Subscriber-only Today, Upcoming, Week, and Class Progress widgets keep the next decision visible on your Home Screen without revealing coursework while locked.",
    promo: "Turn a syllabus into a plan—and see your next move on subscriber-only Home Screen widgets before you open the app.",
    notes: "Version 2.0.9 redesigns the subscriber-only Today, Upcoming, Week, and Class Progress widgets for faster decisions, truthful workload counts, localized labels, and private locked states."
  },
  de: {
    paragraph: "Dein nächster Schritt, bevor du die App öffnest. Die Widgets Heute, Demnächst, Woche und Kursfortschritt zeigen Abonnenten die nächste Entscheidung auf dem Home-Bildschirm und bleiben im gesperrten Zustand privat.",
    promo: "Vom Lehrplan zum Plan—und den nächsten Schritt schon vor dem Öffnen der App auf dem Home-Bildschirm sehen.",
    notes: "Version 2.0.9 gestaltet die Abo-Widgets Heute, Demnächst, Woche und Kursfortschritt neu: klarere Entscheidungen, echte Wochenlast, lokalisierte Texte und private Sperrzustände."
  },
  es: {
    paragraph: "Tu siguiente paso, antes de abrir la app. Los widgets para suscriptores Hoy, Próximo, Semana y Progreso de clase mantienen visible la siguiente decisión en Inicio y no muestran cursos cuando están bloqueados.",
    promo: "Convierte un programa en un plan y mira tu siguiente paso en los widgets de Inicio antes de abrir la app.",
    notes: "La versión 2.0.9 renueva los widgets para suscriptores Hoy, Próximo, Semana y Progreso de clase con decisiones más claras, carga semanal real, textos localizados y estados bloqueados privados."
  },
  fr: {
    paragraph: "Votre prochaine étape, avant d’ouvrir l’app. Les widgets abonnés Aujourd’hui, À venir, Semaine et Progression gardent la prochaine décision visible sur l’écran d’accueil sans afficher les cours lorsqu’ils sont verrouillés.",
    promo: "Transformez un syllabus en plan et voyez la prochaine étape sur vos widgets avant d’ouvrir l’app.",
    notes: "La version 2.0.9 repense les widgets abonnés Aujourd’hui, À venir, Semaine et Progression : décisions plus claires, charge réelle, libellés localisés et états verrouillés privés."
  },
  "pt-BR": {
    paragraph: "Seu próximo passo, antes de abrir o app. Os widgets para assinantes Hoje, Próximos, Semana e Progresso da aula mantêm a próxima decisão visível na Tela de Início sem mostrar atividades quando bloqueados.",
    promo: "Transforme o plano de ensino em um plano e veja o próximo passo nos widgets antes de abrir o app.",
    notes: "A versão 2.0.9 redesenha os widgets para assinantes Hoje, Próximos, Semana e Progresso da aula com decisões mais claras, carga real, textos localizados e estados bloqueados privados."
  },
  "pt-PT": {
    paragraph: "O próximo passo, antes de abrir a app. Os widgets para subscritores Hoje, Próximos, Semana e Progresso da disciplina mantêm a próxima decisão visível no ecrã principal sem mostrar trabalhos quando bloqueados.",
    promo: "Transforme o programa num plano e veja o próximo passo nos widgets antes de abrir a app.",
    notes: "A versão 2.0.9 redesenha os widgets para subscritores Hoje, Próximos, Semana e Progresso da disciplina com decisões mais claras, carga real, textos localizados e estados bloqueados privados."
  },
  ar: {
    paragraph: "خطوتك التالية، قبل فتح التطبيق. تعرض أدوات اليوم والقادم والأسبوع وتقدم المقرر للمشتركين القرار التالي على الشاشة الرئيسية من دون إظهار بيانات المقررات عند القفل.",
    promo: "حوّل الخطة الدراسية إلى خطة وشاهد خطوتك التالية على أدوات الشاشة الرئيسية قبل فتح التطبيق.",
    notes: "يعيد الإصدار 2.0.9 تصميم أدوات اليوم والقادم والأسبوع وتقدم المقرر للمشتركين بقرارات أوضح وأعداد عمل حقيقية ونصوص محلية وحالات قفل خاصة."
  },
  hi: {
    paragraph: "ऐप खोलने से पहले अपना अगला कदम जानें। सदस्यों के लिए आज, आगामी, सप्ताह और कक्षा प्रगति विजेट अगला निर्णय होम स्क्रीन पर दिखाते हैं और लॉक होने पर पाठ्यक्रम छिपा रहता है।",
    promo: "सिलेबस को योजना में बदलें और ऐप खोलने से पहले होम स्क्रीन विजेट पर अगला कदम देखें।",
    notes: "संस्करण 2.0.9 सदस्य विजेट—आज, आगामी, सप्ताह और कक्षा प्रगति—को साफ निर्णयों, वास्तविक कार्यभार, स्थानीयकृत लेबल और निजी लॉक स्थिति के साथ नया बनाता है।"
  },
  ja: {
    paragraph: "アプリを開く前に、次の一手を。登録者向けの「今日」「まもなく」「週」「授業進捗」ウィジェットが次の判断をホーム画面に表示し、ロック中は授業データを隠します。",
    promo: "シラバスを計画に変え、アプリを開く前にホーム画面ウィジェットで次の一手を確認。",
    notes: "バージョン2.0.9では、登録者向けの「今日」「まもなく」「週」「授業進捗」ウィジェットを刷新。判断しやすい階層、実際の負荷、ローカライズ表示、非公開のロック状態に対応しました。"
  },
  ko: {
    paragraph: "앱을 열기 전에, 다음 할 일을 확인하세요. 구독자용 오늘, 예정, 주간, 수업 진행 위젯이 홈 화면에 다음 결정을 보여 주고 잠긴 상태에서는 수업 정보를 숨깁니다.",
    promo: "강의계획서를 계획으로 바꾸고 앱을 열기 전에 홈 화면 위젯에서 다음 할 일을 확인하세요.",
    notes: "버전 2.0.9는 구독자용 오늘, 예정, 주간, 수업 진행 위젯을 더 명확한 결정, 실제 작업량, 현지화 레이블, 비공개 잠금 상태로 새롭게 디자인했습니다."
  },
  "zh-Hans": {
    paragraph: "打开 App 前，就知道下一步。订阅用户可通过今天、即将到来、本周和课程进度小组件在主屏幕查看下一项决策；锁定时不会显示课程信息。",
    promo: "把教学大纲变成计划，在打开 App 前通过主屏幕小组件看到下一步。",
    notes: "2.0.9 版重新设计了订阅用户专享的今天、即将到来、本周和课程进度小组件，带来更清晰的决策、真实任务量、本地化标签和私密锁定状态。"
  },
  "zh-Hant": {
    paragraph: "打開 App 前，就知道下一步。訂閱用戶可透過今天、即將到來、本週和課程進度小工具在主畫面查看下一項決策；鎖定時不會顯示課程資料。",
    promo: "把課程大綱變成計畫，在打開 App 前透過主畫面小工具看到下一步。",
    notes: "2.0.9 版重新設計了訂閱用戶專享的今天、即將到來、本週和課程進度小工具，帶來更清晰的決策、真實工作量、本地化標籤和私密鎖定狀態。"
  }
};

for (const [storefront, info] of Object.entries(config.apple.info)) {
  const localized = copy[localeMap[storefront]];
  if (!localized) throw new Error(`Missing Build 86 store copy for ${storefront}`);
  const priorDescription = String(info.description || "").replace(/^Your next move,[\s\S]*?locked\.\n\n/, "");
  info.description = `${localized.paragraph}\n\n${priorDescription}`;
  info.promoText = localized.promo;
  info.releaseNotes = localized.notes;
}

writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`);
console.log("Applied localized Build 86 widget-led descriptions, promotional text, and release notes for 17 storefronts.");
