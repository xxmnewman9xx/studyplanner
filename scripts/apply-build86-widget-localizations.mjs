import { readFileSync, writeFileSync } from "node:fs";

const corePath = "localized-app-strings/core-launch-strings.json";
const storefrontPath = "localized-app-strings/storefront-runtime-copy.json";

const copy = {
  "en-US": {
    native: {
      locked_metric: "NEXT MOVE", locked_headline: "Your next move—on your Home Screen", locked_detail: "No coursework appears until you subscribe.", unlock_studyplanner: "Unlock StudyPlanner", private_locked: "Private by default", locked: "Locked",
      empty_metric: "START", empty_headline: "Your semester starts here", empty_detail: "Add a syllabus", add_syllabus: "Add a syllabus", empty_support: "Build the plan once. See what matters next.", setup: "Setup", ready: "Ready",
      today: "Today", tomorrow: "Tomorrow", overdue: "Overdue", days_metric: "{count} days", due_today_headline: "Due Today", next_deadline_headline: "Next Deadline", clear_today_headline: "Clear Today", clear: "Clear", due_today_detail: "due today", today_lower: "today", review_today: "Review today", clear_today: "Clear today", open_today: "Open Today",
      no_deadlines: "No upcoming deadlines", semester: "Semester", next_move: "Next move", next: "Next", review: "Review", heavy_day_insight: "{day} is heavy", light_week: "Light week", peak_count: "{count} on the peak day", seven_day_workload: "7-day workload", max_per_day: "{count} max/day", seven_days: "7 days", calendar_widget: "Calendar widget", peak_day: "Peak {day}", no_next_assignment: "No next assignment", class_pulse: "Class pulse", open_class: "Open Class"
    },
    weekday: { mon: "M", tue: "T", wed: "W", thu: "T", fri: "F", sat: "S", sun: "S" }
  },
  de: {
    native: {
      locked_metric: "NÄCHSTER SCHRITT", locked_headline: "Dein nächster Schritt—auf dem Home-Bildschirm", locked_detail: "Kursdaten erscheinen erst mit einem Abo.", unlock_studyplanner: "StudyPlanner freischalten", private_locked: "Standardmäßig privat", locked: "Gesperrt",
      empty_metric: "START", empty_headline: "Dein Semester beginnt hier", empty_detail: "Lehrplan hinzufügen", add_syllabus: "Lehrplan hinzufügen", empty_support: "Einmal planen. Sofort sehen, was zählt.", setup: "Einrichten", ready: "Bereit",
      today: "Heute", tomorrow: "Morgen", overdue: "Überfällig", days_metric: "{count} TAGE", due_today_headline: "Heute fällig", next_deadline_headline: "Nächste Abgabe", clear_today_headline: "Heute frei", clear: "Frei", due_today_detail: "heute fällig", today_lower: "heute", review_today: "Heute prüfen", clear_today: "Heute frei", open_today: "Heute öffnen",
      no_deadlines: "Keine kommenden Abgaben", semester: "Semester", next_move: "Nächster Schritt", next: "Als Nächstes", review: "Prüfen", heavy_day_insight: "{day} IST VOLL", light_week: "RUHIGE WOCHE", peak_count: "{count} am Spitzentag", seven_day_workload: "7-Tage-Auslastung", max_per_day: "max. {count}/Tag", seven_days: "7 Tage", calendar_widget: "Kalender-Widget", peak_day: "Spitze {day}", no_next_assignment: "Keine nächste Aufgabe", class_pulse: "Kursstatus", open_class: "Kurs öffnen"
    },
    weekday: { mon: "M", tue: "D", wed: "M", thu: "D", fri: "F", sat: "S", sun: "S" }
  },
  es: {
    native: {
      locked_metric: "SIGUIENTE PASO", locked_headline: "Tu siguiente paso—en la pantalla de inicio", locked_detail: "Tus cursos no aparecen hasta que te suscribas.", unlock_studyplanner: "Desbloquear StudyPlanner", private_locked: "Privado por defecto", locked: "Bloqueado",
      empty_metric: "EMPEZAR", empty_headline: "Tu semestre empieza aquí", empty_detail: "Añade un programa", add_syllabus: "Añadir un programa", empty_support: "Planifica una vez. Mira qué importa después.", setup: "Configurar", ready: "Listo",
      today: "Hoy", tomorrow: "Mañana", overdue: "Vencido", days_metric: "{count} DÍAS", due_today_headline: "Vence hoy", next_deadline_headline: "Próxima entrega", clear_today_headline: "Hoy libre", clear: "Libre", due_today_detail: "vence hoy", today_lower: "hoy", review_today: "Revisar hoy", clear_today: "Hoy libre", open_today: "Abrir Hoy",
      no_deadlines: "No hay próximas entregas", semester: "Semestre", next_move: "Siguiente paso", next: "Siguiente", review: "Revisar", heavy_day_insight: "{day} ESTÁ CARGADO", light_week: "SEMANA TRANQUILA", peak_count: "{count} el día más cargado", seven_day_workload: "Carga de 7 días", max_per_day: "máx. {count}/día", seven_days: "7 días", calendar_widget: "Widget de calendario", peak_day: "Pico {day}", no_next_assignment: "No hay próxima tarea", class_pulse: "Progreso de clase", open_class: "Abrir clase"
    },
    weekday: { mon: "L", tue: "M", wed: "X", thu: "J", fri: "V", sat: "S", sun: "D" }
  },
  fr: {
    native: {
      locked_metric: "PROCHAINE ÉTAPE", locked_headline: "Votre prochaine étape—sur l’écran d’accueil", locked_detail: "Aucun cours n’apparaît avant l’abonnement.", unlock_studyplanner: "Débloquer StudyPlanner", private_locked: "Privé par défaut", locked: "Verrouillé",
      empty_metric: "COMMENCER", empty_headline: "Votre semestre commence ici", empty_detail: "Ajouter un syllabus", add_syllabus: "Ajouter un syllabus", empty_support: "Planifiez une fois. Voyez la suite.", setup: "Configurer", ready: "Prêt",
      today: "Aujourd’hui", tomorrow: "Demain", overdue: "En retard", days_metric: "{count} JOURS", due_today_headline: "À rendre aujourd’hui", next_deadline_headline: "Prochaine échéance", clear_today_headline: "Rien aujourd’hui", clear: "Libre", due_today_detail: "à rendre aujourd’hui", today_lower: "aujourd’hui", review_today: "Voir aujourd’hui", clear_today: "Rien aujourd’hui", open_today: "Ouvrir Aujourd’hui",
      no_deadlines: "Aucune échéance à venir", semester: "Semestre", next_move: "Prochaine étape", next: "Ensuite", review: "Vérifier", heavy_day_insight: "{day} EST CHARGÉ", light_week: "SEMAINE CALME", peak_count: "{count} le jour le plus chargé", seven_day_workload: "Charge sur 7 jours", max_per_day: "{count} max/jour", seven_days: "7 jours", calendar_widget: "Widget calendrier", peak_day: "Pic {day}", no_next_assignment: "Aucun prochain devoir", class_pulse: "Progression du cours", open_class: "Ouvrir le cours"
    },
    weekday: { mon: "L", tue: "M", wed: "M", thu: "J", fri: "V", sat: "S", sun: "D" }
  },
  "pt-BR": {
    native: {
      locked_metric: "PRÓXIMO PASSO", locked_headline: "Seu próximo passo—na Tela de Início", locked_detail: "Nenhuma atividade aparece antes da assinatura.", unlock_studyplanner: "Desbloquear StudyPlanner", private_locked: "Privado por padrão", locked: "Bloqueado",
      empty_metric: "COMEÇAR", empty_headline: "Seu semestre começa aqui", empty_detail: "Adicionar plano de ensino", add_syllabus: "Adicionar plano de ensino", empty_support: "Planeje uma vez. Veja o que importa agora.", setup: "Configurar", ready: "Pronto",
      today: "Hoje", tomorrow: "Amanhã", overdue: "Atrasado", days_metric: "{count} DIAS", due_today_headline: "Vence hoje", next_deadline_headline: "Próximo prazo", clear_today_headline: "Hoje livre", clear: "Livre", due_today_detail: "vence hoje", today_lower: "hoje", review_today: "Revisar hoje", clear_today: "Hoje livre", open_today: "Abrir Hoje",
      no_deadlines: "Nenhum prazo próximo", semester: "Semestre", next_move: "Próximo passo", next: "Próximo", review: "Revisar", heavy_day_insight: "{day} ESTÁ PESADO", light_week: "SEMANA TRANQUILA", peak_count: "{count} no dia de pico", seven_day_workload: "Carga de 7 dias", max_per_day: "máx. {count}/dia", seven_days: "7 dias", calendar_widget: "Widget de calendário", peak_day: "Pico {day}", no_next_assignment: "Nenhuma próxima tarefa", class_pulse: "Progresso da turma", open_class: "Abrir turma"
    },
    weekday: { mon: "S", tue: "T", wed: "Q", thu: "Q", fri: "S", sat: "S", sun: "D" }
  },
  ar: {
    native: {
      locked_metric: "الخطوة التالية", locked_headline: "خطوتك التالية—على الشاشة الرئيسية", locked_detail: "لن تظهر بيانات المقررات قبل الاشتراك.", unlock_studyplanner: "فتح StudyPlanner", private_locked: "خاص افتراضيًا", locked: "مقفل",
      empty_metric: "ابدأ", empty_headline: "فصلك الدراسي يبدأ هنا", empty_detail: "أضف خطة دراسية", add_syllabus: "إضافة خطة دراسية", empty_support: "خطط مرة واحدة. واعرف ما يهم الآن.", setup: "إعداد", ready: "جاهز",
      today: "اليوم", tomorrow: "غدًا", overdue: "متأخر", days_metric: "{count} أيام", due_today_headline: "مستحق اليوم", next_deadline_headline: "الموعد التالي", clear_today_headline: "اليوم خالٍ", clear: "خالٍ", due_today_detail: "مستحق اليوم", today_lower: "اليوم", review_today: "راجع اليوم", clear_today: "اليوم خالٍ", open_today: "فتح اليوم",
      no_deadlines: "لا مواعيد قريبة", semester: "الفصل الدراسي", next_move: "الخطوة التالية", next: "التالي", review: "مراجعة", heavy_day_insight: "{day} مزدحم", light_week: "أسبوع هادئ", peak_count: "{count} في اليوم الأثقل", seven_day_workload: "عبء 7 أيام", max_per_day: "{count} كحد أقصى/يوم", seven_days: "7 أيام", calendar_widget: "أداة التقويم", peak_day: "الذروة {day}", no_next_assignment: "لا واجب تالٍ", class_pulse: "تقدم المقرر", open_class: "فتح المقرر"
    },
    weekday: { mon: "ن", tue: "ث", wed: "ر", thu: "خ", fri: "ج", sat: "س", sun: "ح" }
  },
  hi: {
    native: {
      locked_metric: "अगला कदम", locked_headline: "आपका अगला कदम—होम स्क्रीन पर", locked_detail: "सदस्यता लेने तक पाठ्यक्रम नहीं दिखेगा।", unlock_studyplanner: "StudyPlanner अनलॉक करें", private_locked: "डिफ़ॉल्ट रूप से निजी", locked: "लॉक",
      empty_metric: "शुरू करें", empty_headline: "आपका सेमेस्टर यहाँ शुरू होता है", empty_detail: "सिलेबस जोड़ें", add_syllabus: "सिलेबस जोड़ें", empty_support: "एक बार योजना बनाएँ। अगला ज़रूरी काम देखें।", setup: "सेटअप", ready: "तैयार",
      today: "आज", tomorrow: "कल", overdue: "देरी", days_metric: "{count} दिन", due_today_headline: "आज देय", next_deadline_headline: "अगली समय-सीमा", clear_today_headline: "आज खाली", clear: "खाली", due_today_detail: "आज देय", today_lower: "आज", review_today: "आज देखें", clear_today: "आज खाली", open_today: "आज खोलें",
      no_deadlines: "कोई आगामी समय-सीमा नहीं", semester: "सेमेस्टर", next_move: "अगला कदम", next: "अगला", review: "समीक्षा", heavy_day_insight: "{day} व्यस्त है", light_week: "हल्का सप्ताह", peak_count: "सबसे व्यस्त दिन {count}", seven_day_workload: "7-दिन का कार्यभार", max_per_day: "अधिकतम {count}/दिन", seven_days: "7 दिन", calendar_widget: "कैलेंडर विजेट", peak_day: "शिखर {day}", no_next_assignment: "कोई अगला असाइनमेंट नहीं", class_pulse: "कक्षा प्रगति", open_class: "कक्षा खोलें"
    },
    weekday: { mon: "सो", tue: "मं", wed: "बु", thu: "गु", fri: "शु", sat: "श", sun: "र" }
  },
  ja: {
    native: {
      locked_metric: "次の一手", locked_headline: "次の一手をホーム画面に", locked_detail: "登録するまで授業データは表示されません。", unlock_studyplanner: "StudyPlannerを解除", private_locked: "初期設定は非公開", locked: "ロック中",
      empty_metric: "開始", empty_headline: "学期はここから始まります", empty_detail: "シラバスを追加", add_syllabus: "シラバスを追加", empty_support: "一度計画すれば、次の重要事項が見えます。", setup: "設定", ready: "準備完了",
      today: "今日", tomorrow: "明日", overdue: "期限超過", days_metric: "あと{count}日", due_today_headline: "今日が期限", next_deadline_headline: "次の締切", clear_today_headline: "今日は余裕", clear: "余裕", due_today_detail: "今日が期限", today_lower: "今日", review_today: "今日を確認", clear_today: "今日は余裕", open_today: "今日を開く",
      no_deadlines: "今後の締切なし", semester: "学期", next_move: "次の一手", next: "次", review: "確認", heavy_day_insight: "{day}が多忙", light_week: "軽い週", peak_count: "最多日に{count}件", seven_day_workload: "7日間の負荷", max_per_day: "最大{count}件/日", seven_days: "7日間", calendar_widget: "カレンダーウィジェット", peak_day: "ピーク {day}", no_next_assignment: "次の課題なし", class_pulse: "授業の進捗", open_class: "授業を開く"
    },
    weekday: { mon: "月", tue: "火", wed: "水", thu: "木", fri: "金", sat: "土", sun: "日" }
  },
  ko: {
    native: {
      locked_metric: "다음 할 일", locked_headline: "다음 할 일을 홈 화면에서", locked_detail: "구독 전에는 수업 정보가 표시되지 않습니다.", unlock_studyplanner: "StudyPlanner 잠금 해제", private_locked: "기본 비공개", locked: "잠김",
      empty_metric: "시작", empty_headline: "학기가 여기서 시작됩니다", empty_detail: "강의계획서 추가", add_syllabus: "강의계획서 추가", empty_support: "한 번 계획하고 다음 중요한 일을 확인하세요.", setup: "설정", ready: "준비됨",
      today: "오늘", tomorrow: "내일", overdue: "기한 지남", days_metric: "{count}일", due_today_headline: "오늘 마감", next_deadline_headline: "다음 마감", clear_today_headline: "오늘은 여유", clear: "여유", due_today_detail: "오늘 마감", today_lower: "오늘", review_today: "오늘 검토", clear_today: "오늘은 여유", open_today: "오늘 열기",
      no_deadlines: "예정된 마감 없음", semester: "학기", next_move: "다음 할 일", next: "다음", review: "검토", heavy_day_insight: "{day}이 바쁨", light_week: "여유로운 주", peak_count: "가장 바쁜 날 {count}개", seven_day_workload: "7일 작업량", max_per_day: "하루 최대 {count}개", seven_days: "7일", calendar_widget: "캘린더 위젯", peak_day: "피크 {day}", no_next_assignment: "다음 과제 없음", class_pulse: "수업 진도", open_class: "수업 열기"
    },
    weekday: { mon: "월", tue: "화", wed: "수", thu: "목", fri: "금", sat: "토", sun: "일" }
  },
  "zh-Hans": {
    native: {
      locked_metric: "下一步", locked_headline: "下一步行动，就在主屏幕", locked_detail: "订阅前不会显示课程信息。", unlock_studyplanner: "解锁 StudyPlanner", private_locked: "默认保护隐私", locked: "已锁定",
      empty_metric: "开始", empty_headline: "你的学期从这里开始", empty_detail: "添加教学大纲", add_syllabus: "添加教学大纲", empty_support: "规划一次，随时看到下一要事。", setup: "设置", ready: "就绪",
      today: "今天", tomorrow: "明天", overdue: "已逾期", days_metric: "{count}天", due_today_headline: "今天截止", next_deadline_headline: "下个截止日期", clear_today_headline: "今天无任务", clear: "无任务", due_today_detail: "今天截止", today_lower: "今天", review_today: "查看今天", clear_today: "今天无任务", open_today: "打开今天",
      no_deadlines: "暂无即将到来的截止日期", semester: "学期", next_move: "下一步", next: "下一个", review: "查看", heavy_day_insight: "{day}任务繁重", light_week: "轻松的一周", peak_count: "最忙一天有{count}项", seven_day_workload: "7天任务量", max_per_day: "每天最多{count}项", seven_days: "7天", calendar_widget: "日历小组件", peak_day: "高峰 {day}", no_next_assignment: "暂无下一项作业", class_pulse: "课程进度", open_class: "打开课程"
    },
    weekday: { mon: "一", tue: "二", wed: "三", thu: "四", fri: "五", sat: "六", sun: "日" }
  },
  "pt-PT": {
    native: {
      locked_metric: "PRÓXIMO PASSO", locked_headline: "O próximo passo—no ecrã principal", locked_detail: "Nenhuma disciplina aparece antes da subscrição.", unlock_studyplanner: "Desbloquear StudyPlanner", private_locked: "Privado por predefinição", locked: "Bloqueado",
      empty_metric: "COMEÇAR", empty_headline: "O semestre começa aqui", empty_detail: "Adicionar programa", add_syllabus: "Adicionar programa", empty_support: "Planeie uma vez. Veja o que importa a seguir.", setup: "Configurar", ready: "Pronto",
      today: "Hoje", tomorrow: "Amanhã", overdue: "Em atraso", days_metric: "{count} DIAS", due_today_headline: "Entrega hoje", next_deadline_headline: "Próximo prazo", clear_today_headline: "Hoje livre", clear: "Livre", due_today_detail: "entrega hoje", today_lower: "hoje", review_today: "Rever hoje", clear_today: "Hoje livre", open_today: "Abrir Hoje",
      no_deadlines: "Sem prazos próximos", semester: "Semestre", next_move: "Próximo passo", next: "Próximo", review: "Rever", heavy_day_insight: "{day} ESTÁ PESADO", light_week: "SEMANA TRANQUILA", peak_count: "{count} no dia de pico", seven_day_workload: "Carga de 7 dias", max_per_day: "máx. {count}/dia", seven_days: "7 dias", calendar_widget: "Widget de calendário", peak_day: "Pico {day}", no_next_assignment: "Sem próximo trabalho", class_pulse: "Progresso da disciplina", open_class: "Abrir disciplina"
    },
    weekday: { mon: "S", tue: "T", wed: "Q", thu: "Q", fri: "S", sat: "S", sun: "D" }
  },
  "zh-Hant": {
    native: {
      locked_metric: "下一步", locked_headline: "下一步行動，就在主畫面", locked_detail: "訂閱前不會顯示課程資料。", unlock_studyplanner: "解鎖 StudyPlanner", private_locked: "預設保護私隱", locked: "已鎖定",
      empty_metric: "開始", empty_headline: "你的學期從這裡開始", empty_detail: "加入課程大綱", add_syllabus: "加入課程大綱", empty_support: "規劃一次，隨時看到下一要事。", setup: "設定", ready: "就緒",
      today: "今天", tomorrow: "明天", overdue: "已逾期", days_metric: "{count}天", due_today_headline: "今天截止", next_deadline_headline: "下個截止日期", clear_today_headline: "今天無任務", clear: "無任務", due_today_detail: "今天截止", today_lower: "今天", review_today: "查看今天", clear_today: "今天無任務", open_today: "打開今天",
      no_deadlines: "暫無即將到來的截止日期", semester: "學期", next_move: "下一步", next: "下一個", review: "查看", heavy_day_insight: "{day}任務繁重", light_week: "輕鬆的一週", peak_count: "最忙一天有{count}項", seven_day_workload: "7天工作量", max_per_day: "每天最多{count}項", seven_days: "7天", calendar_widget: "日曆小工具", peak_day: "高峰 {day}", no_next_assignment: "暫無下一項作業", class_pulse: "課程進度", open_class: "打開課程"
    },
    weekday: { mon: "一", tue: "二", wed: "三", thu: "四", fri: "五", sat: "六", sun: "日" }
  }
};

const core = JSON.parse(readFileSync(corePath, "utf8"));
for (const [locale, localized] of Object.entries(copy)) {
  if (!core[locale]) continue;
  core[locale].widget = localized;
}
writeFileSync(corePath, `${JSON.stringify(core, null, 2)}\n`);

const storefront = JSON.parse(readFileSync(storefrontPath, "utf8"));
for (const locale of ["pt-PT", "zh-Hant"]) {
  storefront.locales[locale].launch.widget = copy[locale];
}
storefront.provenance = "Build 86 exact storefront copy with deterministic paid-widget display states; no runtime language transforms.";
writeFileSync(storefrontPath, `${JSON.stringify(storefront, null, 2)}\n`);

console.log("Applied Build 86 localized widget copy to 10 content catalogs and 2 exact storefront overrides.");
