import React, { useEffect, useMemo, useState } from "react";
import {
  LogBox,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import type { DimensionValue } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Polyline, Rect, Stop } from "react-native-svg";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  FileText,
  Grid2X2,
  Home,
  NotebookPen,
  Plus,
  ScanLine,
  Search,
  SlidersHorizontal,
  User,
  X
} from "lucide-react-native";
import {
  classTitle,
  dueLabel,
  getDefaultWidgetSettings,
  getWidgetDisplayModel,
  getWidgetStyleVars,
  selectClassById,
  selectCatchUpQueue,
  selectClassPulse,
  selectComplicationModels,
  selectCurrentClass,
  selectCurrentOrNextClass,
  selectDonePercentToday,
  selectHomeDashboardModel,
  selectIpadDashboardModel,
  selectNotesByClass,
  selectRoomReminder,
  selectTasksByClass,
  selectTodayClasses,
  selectTodayTasks,
  selectUpcomingExams,
  selectWatchNotificationModel,
  selectWatchPulseModel,
  selectWatchRoomModel,
  selectWatchTasksModel,
  selectWatchTodayModel,
  type Accent,
  type AppSettings,
  type AppState,
  type ClassCourse,
  type NativeWidgetSyncStatus,
  type Note,
  type ReminderSettings,
  type StudyPlannerActions,
  type Task,
  type WidgetSettings,
  type WidgetType,
  type WatchScreen,
  nativeWidgetKindForCoreWidget,
  syncCorePlannerWidgets,
  widgetTypes,
  useStudyPlannerStore
} from "./src/core";
import { I18nProvider, useI18n } from "./src/i18n";
import { parseSyllabus, supportsSyllabusImageParsing } from "./src/services/syllabusParser";
import { hasNativeImageTextRecognition } from "./src/services/imageTextRecognition";
import { scanStudyNoteText } from "./src/services/noteScanner";
import {
  ClassBadge,
  DashboardWidgetPreview,
  EmptyState,
  HeroCard,
  ImportStatusCard,
  PresetCard,
  ProgressRing,
  ReminderPill,
  SectionHeader,
  StatPill,
  SurfaceCard,
  TimelineRow,
  WidgetCard
} from "./src/design";
import {
  createParsedImportFromCameraAsset,
  createParsedImportFromDocumentAsset,
  createParsedImportFromTypedText,
  normalizeParserError,
  parseCapturedSource,
  validateDocumentAsset
} from "./src/services/parserContract";
import { SubscriptionProvider, useSubscription } from "./src/services/subscriptions";

LogBox.ignoreLogs(["RCTScrollViewComponentView implements focusItemsInRect"]);

type PhoneTab = "home" | "classes" | "tasks" | "notes" | "profile";
type PadTab = PhoneTab | "calendar";
type Route =
  | PadTab
  | "studio"
  | "scanner"
  | "subscribe"
  | "classDetail"
  | "addTask"
  | "noteEditor"
  | "watchPreview"
  | "homePreview"
  | "lockPreview"
  | "themeStudio"
  | "reminders";

type WidgetDraft = WidgetSettings;
type StudioPreset = {
  id: string;
  label: string;
  copy: string;
  patch: Partial<WidgetDraft>;
};
type FeatureCapability = {
  id: string;
  label: string;
  state: "available" | "unavailable";
  backing: string;
};
type FeatureCapabilityId =
  | "addTask"
  | "addNote"
  | "noteSummary"
  | "noteTask"
  | "plannerReview"
  | "widgetStudio"
  | "cameraOcr"
  | "fileUpload";

const T = {
  "--bg": "#FFFFFF",
  "--surface": "#FFFFFF",
  "--surface-2": "#FAFAFB",
  "--text": "#08090A",
  "--muted": "#5B5F66",
  "--line": "#ECECEF",
  "--blue": "#2F6BFF",
  "--mint": "#17C784",
  "--violet": "#7857FF",
  "--orange": "#FF7A32",
  "--cyan": "#11BFE3",
  "--rose": "#FF4F8B",
  "--radius-sm": 12,
  "--radius-md": 18,
  "--radius-lg": 24,
  "--radius-xl": 30,
  "--shadow-sm": 0.08,
  "--shadow-md": 0.14,
  "--shadow-lg": 0.22,
  "--widget-opacity": 88,
  "--widget-blur": 18,
  "--widget-glow": 52,
  "--widget-radius": 30
} as const;

const accentMap: Record<Accent, { color: string; end: string; pale: string; label: string }> = {
  blue: { color: T["--blue"], end: "#00C2FF", pale: "#EDF3FF", label: "Blue" },
  mint: { color: T["--mint"], end: "#00E0B7", pale: "#EAFBF3", label: "Mint" },
  violet: { color: T["--violet"], end: "#D45DFF", pale: "#F3EEFF", label: "Violet" },
  orange: { color: T["--orange"], end: "#FFB443", pale: "#FFF2E8", label: "Orange" },
  cyan: { color: T["--cyan"], end: "#5DEBFF", pale: "#E9FBFF", label: "Cyan" },
  rose: { color: T["--rose"], end: "#FF8DC7", pale: "#FFF0F6", label: "Rose" }
};

const widgetTypeLabels: Record<WidgetType, string> = {
  nextClass: "Next Class",
  todayTasks: "Today's Tasks",
  classPulse: "Class Pulse",
  weeklyLoad: "Weekly Load",
  roomReminder: "Room Reminder",
  upcomingTest: "Upcoming Test",
  studyTime: "Study Time"
};

const studioPresets: StudioPreset[] = [
  {
    id: "academic",
    label: "Academic",
    copy: "Balanced classes, deadlines, pulse, and study time.",
    patch: { widgetType: "nextClass", accent: "blue", size: "Hero", density: "Detailed", opacity: 94, blur: 18, glow: 48, radius: 30 }
  },
  {
    id: "athlete",
    label: "Athlete",
    copy: "Fast schedule checks around practice and travel days.",
    patch: { widgetType: "roomReminder", accent: "cyan", size: "L", density: "Compact", opacity: 96, blur: 14, glow: 42, radius: 28 }
  },
  {
    id: "minimalist",
    label: "Minimalist",
    copy: "Low-noise glanceables with compact density.",
    patch: { widgetType: "todayTasks", accent: "blue", size: "M", density: "Compact", opacity: 100, blur: 6, glow: 18, radius: 24 }
  },
  {
    id: "adhd",
    label: "ADHD",
    copy: "Next action first, fewer competing details.",
    patch: { widgetType: "studyTime", accent: "orange", size: "Hero", density: "Detailed", opacity: 96, blur: 12, glow: 58, radius: 30 }
  },
  {
    id: "premed",
    label: "Pre-med",
    copy: "Exam prep and class pulse stay visible.",
    patch: { widgetType: "upcomingTest", accent: "rose", size: "L", density: "Detailed", opacity: 92, blur: 18, glow: 66, radius: 30 }
  },
  {
    id: "engineering",
    label: "Engineering",
    copy: "Projects, workload, and weekly load take priority.",
    patch: { widgetType: "weeklyLoad", accent: "violet", size: "L", density: "Detailed", opacity: 92, blur: 16, glow: 52, radius: 28 }
  },
  {
    id: "finals",
    label: "Finals Week",
    copy: "Exam countdowns, study blocks, and pulse recovery first.",
    patch: { widgetType: "upcomingTest", accent: "orange", size: "Hero", density: "Detailed", opacity: 94, blur: 18, glow: 70, radius: 30 }
  },
  {
    id: "colorPop",
    label: "Color Pop",
    copy: "Bright glanceables for motivation and visual memory.",
    patch: { widgetType: "classPulse", accent: "rose", size: "L", density: "Detailed", opacity: 90, blur: 22, glow: 78, radius: 32 }
  }
];

const featureCapabilities: Record<FeatureCapabilityId, FeatureCapability> = {
  addTask: { id: "addTask", label: "Add task", state: "available", backing: "actions.addTask" },
  addNote: { id: "addNote", label: "Add note", state: "available", backing: "actions.addNote/updateNote" },
  noteSummary: { id: "noteSummary", label: "Save summary", state: "available", backing: "actions.updateNote" },
  noteTask: { id: "noteTask", label: "Note to task", state: "available", backing: "actions.addTask" },
  plannerReview: { id: "plannerReview", label: "Apply review", state: "available", backing: "actions.applyParsedSyllabus" },
  widgetStudio: { id: "widgetStudio", label: "Widget Studio", state: "available", backing: "actions.updateWidgetSettings + syncCorePlannerWidgets" },
  cameraOcr: { id: "cameraOcr", label: "Camera OCR", state: "available", backing: "iOS Vision OCR on device; backend Tesseract only when the parser endpoint is configured" },
  fileUpload: { id: "fileUpload", label: "Text/PDF upload", state: "available", backing: "expo-document-picker + local syllabus parser" }
};

export default function App() {
  const { state, hydrated, actions } = useStudyPlannerStore();
  const viewport = useWindowDimensions();
  const previewWidth = viewport.width > 1420 ? 1180 : viewport.width;
  const isPad = previewWidth >= 700;
  const [route, setRoute] = useState<Route>("home");
  const [activeTab, setActiveTab] = useState<PadTab>("home");
  const [selectedClass, setSelectedClass] = useState("calc");
  const [selectedTask, setSelectedTask] = useState("task-1");
  const [selectedNote, setSelectedNote] = useState("note-1");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [subscriptionAccess, setSubscriptionAccess] = useState({ isPremium: false, status: "checking" });
  const [nativeWidgetStatus, setNativeWidgetStatus] = useState<NativeWidgetSyncStatus>({
    state: "idle",
    message: "Preparing widgets"
  });
  const settings = state.appSettings;
  const scale = settings.largerText ? 1.06 : 1;
  const homeModel = useMemo(() => selectHomeDashboardModel(state), [state]);
  const ipadModel = useMemo(() => selectIpadDashboardModel(state), [state]);

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    syncCorePlannerWidgets(state).then((status) => {
      if (active) setNativeWidgetStatus(status);
    }).catch(() => {
      if (active) {
        setNativeWidgetStatus({
          state: "error",
          message: "Native widget sync is unavailable in this build."
        });
      }
    });
    return () => {
      active = false;
    };
  }, [hydrated, state]);

  const go = (next: Route) => {
    const target = requiresPremiumRoute(next) && !subscriptionAccess.isPremium ? "subscribe" : next;
    setSheetOpen(false);
    setRoute(target);
    if (isPadTab(target)) setActiveTab(target);
    if (isPhoneTab(target)) setActiveTab(target);
  };

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 1300);
  };

  const shared = {
    go,
    isPad,
    state,
    actions,
    homeModel,
    ipadModel,
    settings,
    nativeWidgetStatus,
    selectedClass,
    setSelectedClass,
    selectedTask,
    setSelectedTask,
    selectedNote,
    setSelectedNote,
    notify
  };

  if (!hydrated) {
    return (
      <I18nProvider>
        <SubscriptionProvider>
          <View style={[styles.safe, settings.highContrast ? styles.highContrastBg : null]}>
            <StatusBar style="dark" />
            <View style={styles.desktopStage}>
              <View style={[styles.appShell, { width: previewWidth }]}>
                <View style={styles.app}>
                  <View style={styles.skeletonStack}>
                    <SkeletonBar width="54%" height={28} />
                    <SkeletonBar width="82%" height={18} />
                    <SkeletonBar width="100%" height={156} />
                    <SkeletonBar width="100%" height={92} />
                    <SkeletonBar width="72%" height={18} />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </SubscriptionProvider>
      </I18nProvider>
    );
  }

  return (
    <I18nProvider>
      <SubscriptionProvider>
        <SubscriptionStateProbe onChange={setSubscriptionAccess} />
        <View style={[styles.safe, settings.highContrast ? styles.highContrastBg : null]}>
          <StatusBar style="dark" />
          <View style={[styles.desktopStage, viewport.width > 1420 ? { paddingVertical: 18 } : null]}>
            <View style={[styles.appShell, { width: previewWidth }, viewport.width > 1420 ? styles.centeredPreview : null]}>
              <View style={[styles.app, settings.largerText ? { transform: [{ scale }] } : null]}>
                {isPad ? (
                  <IPadShell {...shared} route={route} activeTab={activeTab} />
                ) : (
                  <IPhoneShell {...shared} route={route} activeTab={activeTab as PhoneTab} />
                )}
                {(isPad ? isPadTab(route) : isPhoneTab(route)) ? (
                  <TouchableOpacity accessibilityLabel="Quick add" style={[styles.fab, isPad ? styles.padFab : null]} onPress={() => setSheetOpen(true)} activeOpacity={0.84}>
                    <Plus size={28} color={T["--surface"]} />
                  </TouchableOpacity>
                ) : null}
                {toast ? (
                  <View style={styles.toast}>
                    <Text style={styles.toastText}>{toast}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
          <ActionSheet open={sheetOpen} isPad={isPad} close={() => setSheetOpen(false)} go={go} />
        </View>
      </SubscriptionProvider>
    </I18nProvider>
  );
}

function SubscriptionStateProbe({ onChange }: { onChange: (state: { isPremium: boolean; status: string }) => void }) {
  const subscription = useSubscription();
  useEffect(() => {
    onChange({ isPremium: subscription.isPremium, status: subscription.status });
  }, [onChange, subscription.isPremium, subscription.status]);
  return null;
}

function SkeletonBar({ width, height }: { width: DimensionValue; height: number }) {
  return <View style={[styles.skeletonBar, { width, height }]} />;
}

function IPhoneShell(props: ShellProps & { route: Route; activeTab: PhoneTab }) {
  const content = renderPhoneRoute(props.route, props);
  return (
    <View style={styles.phoneShell}>
      {content}
      {isPhoneTab(props.route) ? <PhoneTabBar active={props.activeTab} go={props.go} /> : null}
    </View>
  );
}

function IPadShell(props: ShellProps & { route: Route; activeTab: PadTab }) {
  return (
    <View style={styles.padShell}>
      <IPadSidebar active={props.activeTab} go={props.go} />
      <View style={styles.padContent}>{renderPadRoute(props.route, props)}</View>
    </View>
  );
}

type ShellProps = {
  go: (route: Route) => void;
  isPad: boolean;
  state: AppState;
  actions: StudyPlannerActions;
  homeModel: ReturnType<typeof selectHomeDashboardModel>;
  ipadModel: ReturnType<typeof selectIpadDashboardModel>;
  settings: AppSettings;
  nativeWidgetStatus: NativeWidgetSyncStatus;
  selectedClass: string;
  setSelectedClass: (id: string) => void;
  selectedTask: string;
  setSelectedTask: (id: string) => void;
  selectedNote: string;
  setSelectedNote: (id: string) => void;
  notify: (message: string) => void;
};

function renderPhoneRoute(route: Route, props: ShellProps) {
  if (route === "home") return <HomeDashboard {...props} />;
  if (route === "classes") return <ClassesScreen {...props} />;
  if (route === "tasks") return <TasksScreen {...props} />;
  if (route === "notes") return <NotesScreen {...props} />;
  if (route === "profile") return <ProfileScreen {...props} />;
  if (route === "studio") return <WidgetStudio {...props} />;
  if (route === "scanner") return <ScannerScreen {...props} />;
  if (route === "subscribe") return <SubscribeScreen {...props} />;
  if (route === "calendar") return <CalendarScreen {...props} />;
  if (route === "classDetail") return <ClassDetailScreen {...props} />;
  if (route === "addTask") return <AddTaskScreen {...props} />;
  if (route === "noteEditor") return <NoteEditorScreen {...props} />;
  if (route === "homePreview") return <HomeScreenWidgetPreview {...props} />;
  if (route === "lockPreview") return <LockScreenWidgetPreview {...props} />;
  if (route === "themeStudio") return <ThemeStudioScreen {...props} />;
  if (route === "reminders") return <RemindersScreen {...props} />;
  return <WatchPreview {...props} />;
}

function renderPadRoute(route: Route, props: ShellProps) {
  if (route === "home") return <IPadHome {...props} />;
  if (route === "classes" || route === "classDetail") return <IPadClasses {...props} />;
  if (route === "tasks" || route === "addTask") return <IPadTasks {...props} addMode={route === "addTask"} />;
  if (route === "notes" || route === "noteEditor") return <IPadNotes {...props} />;
  if (route === "calendar") return <IPadCalendar {...props} />;
  if (route === "profile") return <IPadProfile {...props} />;
  if (route === "studio") return <IPadWidgetStudio {...props} />;
  if (route === "scanner") return <IPadScanner {...props} />;
  if (route === "subscribe") return <SubscribeScreen {...props} />;
  if (route === "homePreview") return <HomeScreenWidgetPreview {...props} />;
  if (route === "lockPreview") return <LockScreenWidgetPreview {...props} />;
  if (route === "themeStudio") return <ThemeStudioScreen {...props} />;
  if (route === "reminders") return <RemindersScreen {...props} />;
  return <WatchPreview {...props} />;
}

function HomeDashboard({ go, state, homeModel, settings, nativeWidgetStatus }: ShellProps) {
  const focusClass = selectCurrentOrNextClass(state);
  const currentClass = selectCurrentClass(state);
  const catchUpQueue = selectCatchUpQueue(state);
  const donePercent = selectDonePercentToday(state);
  const nextTask = catchUpQueue[0];
  const firstName = homeModel.student.name.split(" ")[0] || "Student";
  const todayLabel = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  return (
    <ScreenScroll>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.subtitle}>{todayLabel}</Text>
          <Text style={styles.greeting}>Good morning, {firstName}</Text>
        </View>
        <TouchableOpacity accessibilityLabel="Open profile" style={styles.avatarButton} onPress={() => go("profile")}>
          <User size={22} color={T["--surface"]} />
        </TouchableOpacity>
      </View>
      <SchoolOSDashboard
        go={go}
        state={state}
        homeModel={homeModel}
        nativeWidgetStatus={nativeWidgetStatus}
        focusClass={focusClass}
        catchUpQueue={catchUpQueue}
        donePercent={donePercent}
      />
    </ScreenScroll>
  );
}

function IPadHome(props: ShellProps) {
  const viewport = useWindowDimensions();
  const narrowPad = viewport.width < 900;
  const focusClass = selectCurrentOrNextClass(props.state);
  const currentClass = selectCurrentClass(props.state);
  const catchUpQueue = selectCatchUpQueue(props.state);
  const donePercent = selectDonePercentToday(props.state);
  return (
    <ScrollView style={styles.padScroll} contentContainerStyle={styles.padHomeContent} showsVerticalScrollIndicator={false}>
      <View style={styles.padHeader}>
        <View>
          <Text style={styles.padTitle}>StudyPlanner AI</Text>
          <Text style={styles.subtitle}>The operating system for {props.ipadModel.student.name.split(" ")[0]}'s student life.</Text>
        </View>
        <TouchableOpacity style={styles.blackPillButton} onPress={() => props.go("studio")}>
          <Grid2X2 size={18} color={T["--surface"]} />
          <Text style={styles.blackPillText}>iOS Widgets</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.padDashboardGrid, narrowPad ? styles.padDashboardStack : null]}>
        <View style={styles.padMainGrid}>
          <TodayCommandCenter go={props.go} state={props.state} focusClass={focusClass} currentClass={currentClass} nextTask={catchUpQueue[0]} pulseScore={props.homeModel.pulse.score} />
          <SchoolOSDashboard
            go={props.go}
            state={props.state}
            homeModel={props.homeModel}
            nativeWidgetStatus={props.nativeWidgetStatus}
            focusClass={focusClass}
            catchUpQueue={catchUpQueue}
            donePercent={donePercent}
            compact
          />
        </View>
        <View style={[styles.padRail, narrowPad ? styles.padRailStack : null]}>
          <NativeWidgetStatusPill status={props.nativeWidgetStatus} />
          <Panel title="Catch-up Queue">
            {catchUpQueue.slice(0, 4).map((task) => (
              <TaskMiniRow key={task.id} task={task} state={props.state} />
            ))}
          </Panel>
          <Panel title="Tasks">
            {props.ipadModel.openTasks.slice(0, 3).map((task) => (
              <TaskMiniRow key={task.id} task={task} state={props.state} />
            ))}
          </Panel>
          <Panel title="Calendar Preview">
            <CalendarBlocks state={props.state} compact />
          </Panel>
        </View>
      </View>
    </ScrollView>
  );
}

function TodayCommandCenter({
  go,
  state,
  focusClass,
  currentClass,
  nextTask,
  pulseScore
}: {
  go: (route: Route) => void;
  state: AppState;
  focusClass: ClassCourse | null;
  currentClass: ClassCourse | null;
  nextTask?: Task;
  pulseScore: number;
}) {
  const accent = focusClass ? accentMap[focusClass.accent] : accentMap.blue;
  const actionLabel = nextTask ? "Start task" : focusClass ? "Take note" : "Review import";
  const status = currentClass ? "NOW" : focusClass ? "NEXT" : "READY";
  return (
    <View style={[styles.commandCenterCard, { borderColor: accent.color }]}>
      <View style={styles.rowBetween}>
        <Text style={[styles.nowPill, { backgroundColor: accent.color }]}>{status}</Text>
        <Text style={styles.commandPulse}>{pulseScore}% pulse</Text>
      </View>
      <Text style={styles.commandTitle}>{focusClass?.title ?? "Build your semester"}</Text>
      <Text style={styles.commandSub}>
        {focusClass ? `${formatTime(focusClass.startTime)} - ${formatTime(focusClass.endTime)} · Room ${focusClass.room}` : "Scan a syllabus or add the first class."}
      </Text>
      {nextTask ? (
        <View style={styles.commandNextTask}>
          <View style={[styles.miniDot, { backgroundColor: priorityColor(nextTask.priority) }]} />
          <View style={styles.flex1}>
            <Text style={styles.commandTaskTitle}>{nextTask.title}</Text>
            <Text style={styles.cardSub}>{classTitle(state, nextTask)} · {dueLabel(nextTask)}</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.commandActions}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => go(nextTask ? "tasks" : focusClass ? "noteEditor" : "scanner")}>
          <Text style={styles.primaryButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => go("addTask")}>
          <Text style={styles.secondaryButtonText}>Add task</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function HomeMetric({ title, value, sub, color }: { title: string; value: string; sub: string; color: string }) {
  return (
    <View style={styles.homeMetricCard}>
      <View style={[styles.miniDot, { backgroundColor: color }]} />
      <Text style={styles.homeMetricValue}>{value}</Text>
      <Text style={styles.homeMetricTitle}>{title}</Text>
      <Text style={styles.homeMetricSub}>{sub}</Text>
    </View>
  );
}

function SchoolOSDashboard({
  go,
  state,
  homeModel,
  nativeWidgetStatus,
  focusClass,
  catchUpQueue,
  donePercent,
  compact = false
}: {
  go: (route: Route) => void;
  state: AppState;
  homeModel: ReturnType<typeof selectHomeDashboardModel>;
  nativeWidgetStatus: NativeWidgetSyncStatus;
  focusClass: ClassCourse | null;
  catchUpQueue: Task[];
  donePercent: number;
  compact?: boolean;
}) {
  const schedule = selectTodayClasses(state);
  const nextClassAccent = focusClass ? accentMap[focusClass.accent] : accentMap.blue;
  const upcomingDeadlines = selectDashboardDeadlines(state);
  const nextExam = selectUpcomingExams(state)[0];
  const reviewNotes = state.notes.filter((note) => note.status !== "reviewed");
  const overdueCount = state.tasks.filter((task) => !task.completed && dueLabel(task) === "Overdue").length;
  const recentNotes = [...state.notes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);
  const liveClasses = state.classes.slice(0, compact ? 3 : 4);
  const widgetStatusCopy = nativeWidgetStatus.state === "synced" ? "Synced to iOS" : "Ready to sync";
  const assignmentTimeline = upcomingDeadlines.length ? upcomingDeadlines : catchUpQueue;

  return (
    <View>
      <SectionHeader title="Semester Health" />
      <HeroCard
        eyebrow="LIVE SYSTEM"
        title={homeModel.pulse.label}
        subtitle={`${state.classes.length} classes, ${homeModel.taskCountToday} due today, ${reviewNotes.length} notes waiting for review.`}
        metric={`${homeModel.pulse.score}%`}
        accentColor={T["--blue"]}
        style={styles.schoolHeroCard}
      >
        <View style={styles.semesterBar}>
          <View style={[styles.semesterBarFill, { width: `${Math.max(8, Math.min(100, homeModel.pulse.score))}%` }]} />
        </View>
      </HeroCard>

      <SectionHeader title="Today's Load" />
      <View style={styles.homeMetricGrid}>
        <WidgetCard label="DUE TODAY" value={String(homeModel.taskCountToday)} detail={`${donePercent}% done`} accentColor={T["--orange"]} />
        <WidgetCard label="CLASS PULSE" value={`${homeModel.pulse.score}%`} detail={homeModel.pulse.primaryReason} accentColor={T["--mint"]} />
        <WidgetCard label="OVERDUE" value={String(overdueCount)} detail={overdueCount ? "needs recovery" : "clear"} accentColor={T["--rose"]} />
        <WidgetCard label="NOTES" value={String(reviewNotes.length)} detail="to review" accentColor={T["--violet"]} />
      </View>

      <SectionHeader title="Next Class" actionLabel="Calendar" onAction={() => go("calendar")} />
      {focusClass ? (
        <SurfaceCard style={styles.nextClassCard}>
          <View style={styles.rowBetween}>
            <View style={[styles.classIcon, { backgroundColor: nextClassAccent.pale }]}>
              <BookOpen size={21} color={nextClassAccent.color} />
            </View>
          <Text style={[styles.priorityPill, { color: nextClassAccent.color }]}>{formatTime(focusClass.startTime)}</Text>
          </View>
          <ClassBadge title={focusClass.title} room={`Room ${focusClass.room}`} accentColor={nextClassAccent.color} />
          <Text style={styles.cardTitle}>{focusClass.title}</Text>
          <Text style={styles.cardSub}>Room {focusClass.room} · {focusClass.days.join("/")} · {reminderLabel(focusClass.reminderSettings)}</Text>
        </SurfaceCard>
      ) : <EmptyState title="No class is next" copy="Scan a syllabus or add a schedule to bring this system online." />}

      <SectionHeader title="Class Pulse" actionLabel="Classes" onAction={() => go("classes")} />
      {liveClasses.map((klass) => {
        const pulse = selectClassPulse(state, klass.id);
        return (
          <TimelineRow
            key={`pulse-${klass.id}`}
            title={klass.title}
            subtitle={`${pulse.label} · Room ${klass.room}`}
            meta={`${pulse.score}`}
            accentColor={accentMap[klass.accent].color}
          />
        );
      })}

      <SectionHeader title="Assignment Timeline" actionLabel="Tasks" onAction={() => go("tasks")} />
      {assignmentTimeline.length ? assignmentTimeline.slice(0, 4).map((task) => (
        <TimelineRow
          key={`queue-${task.id}`}
          time={formatTime(task.dueTime)}
          title={task.title}
          subtitle={`${classTitle(state, task)} · ${dueLabel(task)}`}
          meta={task.priority}
          accentColor={priorityColor(task.priority)}
        />
      )) : <EmptyState title="No urgent deadlines" copy="Reviewed work will appear here as soon as it is imported or added." />}

      <SectionHeader title="Notes Activity" actionLabel="Notes" onAction={() => go("notes")} />
      {(reviewNotes.length ? reviewNotes : recentNotes).slice(0, 3).map((note) => (
        <TimelineRow
          key={`note-${note.id}`}
          title={note.title}
          subtitle={noteClassTitle(state, note)}
          meta={note.status === "reviewed" ? "Reviewed" : "Review"}
          accentColor={note.status === "reviewed" ? T["--mint"] : T["--violet"]}
        />
      ))}
      {!state.notes.length ? <EmptyState title="Notes will attach to classes" copy="Scanned notes and summaries will show up beside assignments and exams." /> : null}

      <SectionHeader title="Widget Stack" actionLabel="Studio" onAction={() => go("studio")} />
      <DashboardWidgetPreview label="iOS WIDGETS" value={widgetStatusCopy} detail="Home Screen and dashboard placement share the same data." accentColor={T["--blue"]} />
      <LiquidWidget type="nextClass" state={state} styleConfig={state.widgetSettings.nextClass} settings={state.appSettings} />
      <LiquidWidget type="todayTasks" state={state} styleConfig={state.widgetSettings.todayTasks} settings={state.appSettings} />

      <SectionHeader title="AI Insight" />
      <DashboardWidgetPreview
        label="SCHOOL OS SIGNAL"
        value={homeModel.pulse.label}
        detail={homeModel.pulse.suggestedActions[0] ?? homeModel.pulse.primaryReason}
        accentColor={homeModel.pulse.score < 60 ? T["--rose"] : T["--blue"]}
      />
    </View>
  );
}

function HomeSearchPanel({
  state,
  query,
  setQuery,
  go
}: {
  state: AppState;
  query: string;
  setQuery: (value: string) => void;
  go: (route: Route) => void;
}) {
  const clean = query.trim().toLowerCase();
  const results = clean ? [
    ...state.classes
      .filter((klass) => `${klass.title} ${klass.professor} ${klass.room}`.toLowerCase().includes(clean))
      .slice(0, 2)
      .map((klass) => ({ id: `class-${klass.id}`, title: klass.title, sub: `Room ${klass.room}`, route: "classes" as Route })),
    ...state.tasks
      .filter((task) => `${task.title} ${classTitle(state, task)} ${task.type}`.toLowerCase().includes(clean))
      .slice(0, 2)
      .map((task) => ({ id: `task-${task.id}`, title: task.title, sub: `${classTitle(state, task)} · ${dueLabel(task)}`, route: "tasks" as Route })),
    ...state.notes
      .filter((note) => `${note.title} ${note.body} ${note.summary ?? ""}`.toLowerCase().includes(clean))
      .slice(0, 2)
      .map((note) => ({ id: `note-${note.id}`, title: note.title, sub: noteClassTitle(state, note), route: "notes" as Route }))
  ].slice(0, 4) : [];
  return (
    <View style={styles.homeSearchWrap}>
      <View style={styles.searchBar}>
        <Search size={17} color={T["--muted"]} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search classes, tasks, notes" placeholderTextColor={T["--muted"]} style={styles.searchInput} />
        {query ? <TouchableOpacity onPress={() => setQuery("")}><X size={16} color={T["--muted"]} /></TouchableOpacity> : null}
      </View>
      {clean ? (
        <View style={styles.searchResults}>
          {results.length ? results.map((item) => (
            <TouchableOpacity key={item.id} style={styles.searchResultRow} onPress={() => go(item.route)}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>{item.sub}</Text>
            </TouchableOpacity>
          )) : <MiniLine text="No planner matches yet" />}
        </View>
      ) : null}
    </View>
  );
}

function WidgetStudio({ state, actions, go, notify, settings, nativeWidgetStatus }: ShellProps) {
  const [draft, setDraft] = useState<WidgetDraft>(state.widgetSettings.nextClass);
  useEffect(() => {
    setDraft((current) => state.widgetSettings[current.widgetType]);
  }, [state.widgetSettings]);

  const updateDraft = <K extends keyof WidgetDraft>(key: K, value: WidgetDraft[K]) => {
    if (key === "widgetType") {
      const nextType = value as WidgetType;
      setDraft(state.widgetSettings[nextType]);
      return;
    }
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const save = () => {
    actions.updateWidgetSettings(draft.widgetType, draft);
    notify(nativeWidgetStatus.state === "synced" ? "iPhone widget style saved" : "Saved. Syncing iPhone widgets");
  };
  const applyPreset = (preset: StudioPreset) => {
    setDraft((current) => buildStudioPresetDraft(state, current, preset));
  };

  const reset = () => {
    actions.resetWidgetSettings(draft.widgetType);
    setDraft(getDefaultWidgetSettings(draft.widgetType));
  };

  return (
    <ScreenScroll stickyFooter={<StudioSaveBar onReset={reset} onSave={save} />}>
      <BackBar title="Widget Studio" back={() => go("home")} />
      <View style={styles.studioPreviewTop}>
        <LiquidWidget type={draft.widgetType} state={state} styleConfig={draft} settings={settings} />
      </View>
      <StudioControls draft={draft} updateDraft={updateDraft} applyPreset={applyPreset} reset={reset} save={save} go={go} />
    </ScreenScroll>
  );
}

function IPadWidgetStudio({ state, actions, go, notify, settings, nativeWidgetStatus }: ShellProps) {
  const [draft, setDraft] = useState<WidgetDraft>(state.widgetSettings.nextClass);
  const updateDraft = <K extends keyof WidgetDraft>(key: K, value: WidgetDraft[K]) => {
    if (key === "widgetType") {
      const nextType = value as WidgetType;
      setDraft(state.widgetSettings[nextType]);
      return;
    }
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const save = () => {
    actions.updateWidgetSettings(draft.widgetType, draft);
    notify(nativeWidgetStatus.state === "synced" ? "iPhone widget style saved" : "Saved. Syncing iPhone widgets");
  };
  const applyPreset = (preset: StudioPreset) => {
    setDraft((current) => buildStudioPresetDraft(state, current, preset));
  };
  const reset = () => {
    actions.resetWidgetSettings(draft.widgetType);
    setDraft(getDefaultWidgetSettings(draft.widgetType));
  };
  return (
    <View style={styles.studioPad}>
      <View style={styles.studioLibrary}>
        <Text style={styles.padPaneTitle}>Widget Library</Text>
        {widgetTypes.map((type) => (
          <TouchableOpacity key={type} style={[styles.libraryItem, draft.widgetType === type ? styles.libraryItemActive : null]} onPress={() => updateDraft("widgetType", type)}>
            <View style={[styles.libraryDot, { backgroundColor: accentMap[state.widgetSettings[type].accent].color }]} />
            <Text style={styles.libraryText}>{widgetTypeLabels[type]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={styles.studioCanvas} contentContainerStyle={styles.studioCanvasContent}>
        <Text style={styles.padTitle}>iPhone Widget Preview</Text>
        <LiquidWidget type={draft.widgetType} state={state} styleConfig={draft} settings={settings} />
        <WidgetBackedLine widgetType={draft.widgetType} />
      </ScrollView>
      <ScrollView style={styles.studioInspector} contentContainerStyle={styles.inspectorContent}>
        <View style={styles.rowBetween}>
          <Text style={styles.padPaneTitle}>Inspector</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => go("home")}><X size={18} color={T["--text"]} /></TouchableOpacity>
        </View>
        <StudioControls draft={draft} updateDraft={updateDraft} applyPreset={applyPreset} reset={reset} save={save} go={go} />
      </ScrollView>
    </View>
  );
}

function StudioControls({
  draft,
  updateDraft,
  applyPreset,
  reset,
  save,
  go
}: {
  draft: WidgetDraft;
  updateDraft: <K extends keyof WidgetDraft>(key: K, value: WidgetDraft[K]) => void;
  applyPreset: (preset: StudioPreset) => void;
  reset: () => void;
  save: () => void;
  go: (route: Route) => void;
}) {
  return (
    <View>
      <WidgetBackedLine widgetType={draft.widgetType} />
      <View style={styles.studioHeroCopy}>
        <Text style={styles.cardTitle}>Build your own School OS</Text>
        <Text style={styles.cardSub}>Presets change hierarchy, density, color, and the dashboard widget target without changing saved planner data.</Text>
      </View>
      <StudioSection title="School OS Presets">
        <StudioPresetRail draft={draft} onPress={applyPreset} />
      </StudioSection>
      <StudioSection title="Home and Lock Screen">
        <View style={styles.studioButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => go("homePreview")}><Text style={styles.secondaryButtonText}>Home Screen</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => go("lockPreview")}><Text style={styles.secondaryButtonText}>Lock Screen</Text></TouchableOpacity>
        </View>
      </StudioSection>
      <StudioSection title="Dashboard Placement">
        <ChipRow values={["Next class", "Tasks", "Pulse", "Load", "Room", "Exam", "Study"]} value={placementLabelForWidget(draft.widgetType)} onPress={(value) => updateDraft("widgetType", widgetTypeForPlacement(value))} wrap />
      </StudioSection>
      <StudioSection title="Widget Type">
        <WidgetTypePicker value={draft.widgetType} onPress={(value) => updateDraft("widgetType", value)} />
      </StudioSection>
      <StudioSection title="Accent Color">
        <View style={styles.colorDots}>
          {(Object.keys(accentMap) as Accent[]).map((accent) => (
            <TouchableOpacity
              key={accent}
              accessibilityLabel={`${accentMap[accent].label} accent`}
              style={[styles.colorDot, { backgroundColor: accentMap[accent].color }, draft.accent === accent ? styles.colorDotActive : null]}
              onPress={() => updateDraft("accent", accent)}
            />
          ))}
        </View>
      </StudioSection>
      <StudioSection title="Widget Size">
        <ChipRow values={["S", "M", "L", "Hero"]} value={draft.size} onPress={(value) => updateDraft("size", value as WidgetSettings["size"])} />
      </StudioSection>
      <StudioSection title="Density">
        <ChipRow values={["Compact", "Detailed"]} value={draft.density} onPress={(value) => updateDraft("density", value as WidgetSettings["density"])} />
      </StudioSection>
      <StudioSection title="Glass Controls">
        <SliderControl label="Opacity" value={draft.opacity} min={58} max={100} step={4} onChange={(value) => updateDraft("opacity", value)} />
        <SliderControl label="Blur" value={draft.blur} min={0} max={30} step={2} onChange={(value) => updateDraft("blur", value)} />
        <SliderControl label="Glow" value={draft.glow} min={12} max={90} step={6} onChange={(value) => updateDraft("glow", value)} />
        <SliderControl label="Corner radius" value={draft.radius} min={24} max={36} step={2} onChange={(value) => updateDraft("radius", value)} />
      </StudioSection>
      <View style={styles.studioButtons}>
        <TouchableOpacity style={styles.secondaryButton} onPress={reset}><Text style={styles.secondaryButtonText}>Reset</Text></TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryButtonText}>Save</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function StudioPresetRail({ draft, onPress }: { draft: WidgetDraft; onPress: (preset: StudioPreset) => void }) {
  return (
    <View style={styles.studioPresetGrid}>
      {studioPresets.map((preset) => {
        const active = draft.widgetType === (preset.patch.widgetType ?? draft.widgetType) && draft.accent === preset.patch.accent;
        const accent = preset.patch.accent ? accentMap[preset.patch.accent] : accentMap.blue;
        return (
          <PresetCard
            key={preset.id}
            label={preset.label}
            copy={preset.copy}
            accentColor={accent.color}
            active={active}
            onPress={() => onPress(preset)}
          />
        );
      })}
    </View>
  );
}

function NativeWidgetStatusPill({ status }: { status: NativeWidgetSyncStatus }) {
  const synced = status.state === "synced";
  const skipped = status.state === "skipped" || status.state === "unavailable";
  const color = synced ? T["--mint"] : skipped ? T["--orange"] : T["--blue"];
  return (
    <View style={[styles.nativeWidgetPill, { borderColor: color }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.nativeWidgetPillText, { color }]} numberOfLines={1}>
        {synced ? "iOS widgets synced" : status.message}
      </Text>
    </View>
  );
}

function WidgetBackedLine({ widgetType }: { widgetType: WidgetType }) {
  const nativeKind = nativeWidgetKindForCoreWidget(widgetType);
  const label = nativeKind === "classProgress" ? "Class Progress" : nativeKind.charAt(0).toUpperCase() + nativeKind.slice(1);
  return (
    <View style={styles.widgetBackedLine}>
      <Grid2X2 size={15} color={T["--muted"]} />
      <Text style={styles.widgetBackedText}>{widgetTypeLabels[widgetType]} saves into the iOS {label} widget.</Text>
    </View>
  );
}

function ClassesScreen(props: ShellProps) {
  const todays = selectTodayClasses(props.state);
  const ordered = todays.concat(props.state.classes.filter((klass) => !todays.some((today) => today.id === klass.id)));
  const current = selectCurrentClass(props.state);
  const focus = selectCurrentOrNextClass(props.state);
  const reviewCount = props.state.notes.filter((note) => note.status !== "reviewed").length + selectTodayTasks(props.state).length;
  return (
    <ScreenScroll>
      <TopBar title="Classes" actionLabel="Calendar" actionAccessibilityLabel="Open calendar" onAction={() => props.go("calendar")} />
      <TouchableOpacity style={styles.aiSuggestionCard} onPress={() => props.go("scanner")}>
        <ScanLine size={22} color={T["--blue"]} />
        <View style={styles.flex1}>
          <Text style={styles.cardTitle}>Planner has {reviewCount} things to review</Text>
          <Text style={styles.cardSub}>Tasks, notes, rooms, and reminders share one timeline.</Text>
        </View>
      </TouchableOpacity>
      {focus ? (
        <View style={styles.scheduleHeroCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.nowPill}>{current?.id === focus.id ? "NOW" : "NEXT"}</Text>
            <Sparkline color={T["--blue"]} />
          </View>
          <Text style={styles.scheduleHeroTitle}>{focus.title}</Text>
          <Text style={styles.scheduleHeroSub}>{formatTime(focus.startTime)} - {formatTime(focus.endTime)} · Room {focus.room}</Text>
          <View style={styles.heroMetricRow}>
            <Text style={styles.heroMetric}>Pulse: {selectClassPulse(props.state, focus.id).label}</Text>
            <Text style={styles.heroMetric}>Reminder: {reminderLabel(focus.reminderSettings)}</Text>
          </View>
          <View style={styles.noteActionBar}>
            <TouchableOpacity style={styles.noteActionButton} onPress={() => props.go("noteEditor")}><NotebookPen size={18} color={T["--text"]} /><Text style={styles.noteActionText}>Take note</Text></TouchableOpacity>
            <TouchableOpacity style={styles.noteActionButton} onPress={() => props.go("scanner")}><ScanLine size={18} color={T["--text"]} /><Text style={styles.noteActionText}>Review import</Text></TouchableOpacity>
            <TouchableOpacity style={styles.noteActionButton} onPress={() => props.go("addTask")}><Plus size={18} color={T["--text"]} /><Text style={styles.noteActionText}>Add task</Text></TouchableOpacity>
          </View>
        </View>
      ) : null}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}><Text style={styles.summaryTitle}>Due today</Text><Text style={styles.summaryValue}>{selectTodayTasks(props.state).length}</Text><Text style={styles.cardSub}>open tasks</Text></View>
        <View style={styles.summaryCard}><Text style={styles.summaryTitle}>After school</Text><Text style={styles.summaryValue}>{props.state.notes.filter((note) => note.status !== "reviewed").length}</Text><Text style={styles.cardSub}>notes to review</Text></View>
      </View>
      {ordered.map((klass) => (
        <ClassCard key={klass.id} state={props.state} klass={klass} selected={props.selectedClass === klass.id} onPress={() => { props.setSelectedClass(klass.id); props.go("classDetail"); }} />
      ))}
      {!ordered.length ? <EmptyState title="Scan your syllabus to build classes" copy="Class pulse unlocks when StudyPlanner knows your schedule, rooms, assignments, and exams." /> : null}
    </ScreenScroll>
  );
}

function IPadClasses(props: ShellProps) {
  const selected = selectClassById(props.state, props.selectedClass);
  return (
    <View style={styles.splitView}>
      <View style={styles.masterPane}>
        <Text style={styles.padPaneTitle}>Classes</Text>
        {props.state.classes.map((klass) => (
          <ClassCard key={klass.id} state={props.state} klass={klass} selected={props.selectedClass === klass.id} onPress={() => props.setSelectedClass(klass.id)} compact />
        ))}
      </View>
      <ScrollView style={styles.detailPane} contentContainerStyle={styles.detailContent}>
        {selected ? <ClassDetailContent state={props.state} actions={props.actions} klass={selected} /> : null}
      </ScrollView>
    </View>
  );
}

function ClassDetailScreen({ go, state, actions, selectedClass }: ShellProps) {
  const selected = selectClassById(state, selectedClass);
  return (
    <ScreenScroll>
      <BackBar title="Class Detail" back={() => go("classes")} />
      {selected ? <ClassDetailContent state={state} actions={actions} klass={selected} /> : null}
    </ScreenScroll>
  );
}

function ClassDetailContent({ state, actions, klass }: { state: AppState; actions: StudyPlannerActions; klass: ClassCourse }) {
  const accent = accentMap[klass.accent];
  const pulse = selectClassPulse(state, klass.id);
  const tasks = selectTasksByClass(state, klass.id).filter((task) => !task.completed);
  const notes = selectNotesByClass(state, klass.id);
  const exams = state.exams.filter((exam) => exam.classId === klass.id);
  const nextTask = tasks[0];
  const updateReminder = (patch: Partial<ReminderSettings>) => {
    actions.updateClassReminder(klass.id, { ...klass.reminderSettings, ...patch });
  };
  return (
    <View>
      <LiquidWidget type="classPulse" state={state} styleConfig={{ ...state.widgetSettings.classPulse, accent: klass.accent }} settings={state.appSettings} />
      <View style={styles.whiteCard}>
        <ClassBadge title={klass.title} room={`Room ${klass.room}`} accentColor={accent.color} />
        <Text style={styles.detailTitle}>{klass.title}</Text>
        <Text style={styles.detailSub}>{klass.professor}</Text>
        <View style={styles.detailGrid}>
          <StatPill label="Room" value={klass.room} accentColor={accent.color} />
          <StatPill label="Next meeting" value={`${klass.days.join("/")} ${formatTime(klass.startTime)}`} accentColor={accent.color} />
          <StatPill label="Pulse" value={`${pulse.score}%`} accentColor={accent.color} />
          <StatPill label="Exams" value={String(exams.length)} accentColor={T["--rose"]} />
        </View>
      </View>
      <Panel title="Tasks">
        {tasks.slice(0, 3).map((item) => <MiniLine key={item.id} text={item.title} />)}
        {!tasks.length ? <EmptyState title="No assignments linked yet" copy="Scan a syllabus or add a task to make this class space useful." /> : null}
      </Panel>
      <Panel title="Exams">
        {exams.slice(0, 3).map((item) => <MiniLine key={item.id} text={`${item.title} · ${item.date}`} />)}
        {!exams.length ? <MiniLine text="Exam dates appear here when imported or added." /> : null}
      </Panel>
      <Panel title="Notes">
        {notes.slice(0, 3).map((item) => <MiniLine key={item.id} text={item.title} />)}
        {!notes.length ? <EmptyState title="Notes become class memory here" copy="Capture notes from lecture or import scanned notes to connect them to this class." /> : null}
      </Panel>
      <Panel title="Reminder Controls">
        <ReminderPill label={reminderLabel(klass.reminderSettings)} enabled={klass.reminderSettings.enabled} />
        <ChipRow values={["Off", "5 min before", "10 min before", "15 min before", "30 min before", "1 hour before", "Custom"]} value={reminderLabel(klass.reminderSettings)} onPress={(value) => updateReminder(reminderPatch(value))} wrap />
        <View style={styles.toggleRow}>
          <Text style={styles.cardTitle}>Show room in reminder</Text>
          <Switch value={klass.reminderSettings.showRoom} onValueChange={(value) => updateReminder({ showRoom: value })} />
        </View>
        <View style={styles.notificationPreview}>
          <Text style={styles.notificationTitle}>{klass.title} starts in {klass.reminderSettings.minutesBefore} min</Text>
          <Text style={styles.notificationSub}>{klass.reminderSettings.showRoom ? `Room ${klass.room}` : "Room hidden"}{nextTask ? ` · Next: ${nextTask.title}` : ""}</Text>
        </View>
      </Panel>
      <Panel title="Class Activity">
        {tasks.slice(0, 2).map((item) => <MiniLine key={`activity-task-${item.id}`} text={`${item.title} · ${dueLabel(item)}`} />)}
        {notes.slice(0, 2).map((item) => <MiniLine key={`activity-note-${item.id}`} text={`${item.title} · ${item.status === "reviewed" ? "Reviewed" : "Needs review"}`} />)}
        {!tasks.length && !notes.length ? <MiniLine text="No saved tasks or notes for this class yet" /> : null}
      </Panel>
    </View>
  );
}

function TasksScreen(props: ShellProps) {
  const [filter, setFilter] = useState("All");
  const sections = buildTaskSections(props.state, filter);
  return (
    <ScreenScroll>
      <TopBar title="Tasks" actionLabel="Add" onAction={() => props.go("addTask")} />
      <ChipRow values={["All", "Overdue", "Today", "Upcoming", "Later", "Completed"]} value={filter} onPress={setFilter} wrap />
      <LiquidWidget type="todayTasks" state={props.state} styleConfig={props.state.widgetSettings.todayTasks} settings={props.settings} />
      {sections.map((section) => (
        <View key={section.title}>
          <SectionHeader title={section.title} />
          {section.tasks.map((task) => (
            <TaskCard key={task.id} state={props.state} task={task} onPress={() => props.actions.toggleTaskComplete(task.id)} />
          ))}
          {!section.tasks.length ? <EmptyState title={`${section.title} is clear`} copy="New assignments from imports and class spaces will land here automatically." /> : null}
        </View>
      ))}
    </ScreenScroll>
  );
}

function IPadTasks(props: ShellProps & { addMode: boolean }) {
  const selected = props.state.tasks.find((task) => task.id === props.selectedTask) ?? props.state.tasks[0];
  return (
    <View style={styles.splitView}>
      <View style={styles.masterPane}>
        <View style={styles.rowBetween}>
          <Text style={styles.padPaneTitle}>Tasks</Text>
          <TouchableOpacity style={styles.smallBlackButton} onPress={() => props.go("addTask")}><Plus size={16} color={T["--surface"]} /></TouchableOpacity>
        </View>
        <ChipRow values={["Today", "Upcoming", "Overdue", "Completed"]} value="Today" onPress={() => undefined} wrap />
        {props.state.tasks.map((task) => (
          <TaskCard key={task.id} state={props.state} task={task} selected={props.selectedTask === task.id} onPress={() => props.setSelectedTask(task.id)} compact />
        ))}
      </View>
      <ScrollView style={styles.detailPane} contentContainerStyle={styles.detailContent}>
        {props.addMode ? <AddTaskForm {...props} /> : selected ? <TaskDetail state={props.state} task={selected} toggle={() => props.actions.toggleTaskComplete(selected.id)} /> : null}
      </ScrollView>
    </View>
  );
}

function AddTaskScreen(props: ShellProps) {
  return (
    <ScreenScroll>
      <BackBar title="Add Task" back={() => props.go("tasks")} />
      <AddTaskForm {...props} />
    </ScreenScroll>
  );
}

function AddTaskForm({ state, actions, go, notify }: ShellProps) {
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("calc");
  const [type, setType] = useState("Homework");
  const [due, setDue] = useState("Today");
  const [priority, setPriority] = useState<Task["priority"]>("Medium");
  const [reminder, setReminder] = useState("15 min before");
  const save = () => {
    const cleanTitle = title.trim() || "New task";
    actions.addTask({
      title: cleanTitle,
      classId,
      type: type as Task["type"],
      dueDate: dueToDate(due),
      dueTime: "17:00",
      priority,
      reminder
    });
    notify("Task saved");
    go("tasks");
  };
  return (
    <View style={styles.formCard}>
      <LabeledInput label="Title" value={title} setValue={setTitle} placeholder="Problem Set 4" />
      <PickerRow label="Class" values={state.classes.map((klassItem) => klassItem.title)} value={selectClassById(state, classId)?.title ?? "Class"} onPress={(value) => setClassId(state.classes.find((klassItem) => klassItem.title === value)?.id ?? classId)} />
      <PickerRow label="Type" values={["Homework", "Reading", "Report", "Essay", "Test"]} value={type} onPress={setType} />
      <PickerRow label="Due date" values={["Today", "Tomorrow", "Friday", "Next week"]} value={due} onPress={setDue} />
      <PickerRow label="Priority" values={["Low", "Medium", "High"]} value={priority} onPress={(value) => setPriority(value as Task["priority"])} />
      <PickerRow label="Reminder" values={["Off", "5 min before", "10 min before", "15 min before", "30 min before", "1 hour before", "Tonight"]} value={reminder} onPress={setReminder} />
      <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryButtonText}>Save task</Text></TouchableOpacity>
    </View>
  );
}

function NotesScreen(props: ShellProps) {
  const [query, setQuery] = useState("");
  const notesByClass = props.state.classes.map((klass) => ({ klass, notes: selectNotesByClass(props.state, klass.id) }));
  const reviewNotes = props.state.notes.filter((note) => note.status !== "reviewed");
  const recent = [...props.state.notes]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .filter((note) => `${note.title} ${note.body} ${note.summary ?? ""} ${noteClassTitle(props.state, note)}`.toLowerCase().includes(query.trim().toLowerCase()));
  const primary = reviewNotes[0] ?? props.state.notes[0];
  const primaryIdeaCount = primary ? (primary.keyIdeas?.length ?? Math.max(1, primary.tags.length)) : 0;
  const missingClass = props.state.classes.find((klass) => !props.state.notes.some((note) => note.classId === klass.id));
  const setReviewReminder = (note: Note) => {
    const id = `reminder-note-${note.id}`;
    props.actions.updateNote(note.id, { status: "draft", reviewReminderId: id });
    props.notify("Review reminder set");
  };
  const createTaskFromNote = (note: Note) => {
    props.actions.addTask({
      title: `Review ${note.title}`,
      classId: note.classId,
      type: "Homework",
      dueDate: new Date().toISOString().slice(0, 10),
      dueTime: "23:59",
      priority: "Medium",
      reminder: "Tonight"
    });
    props.notify("Task created from note");
  };
  return (
    <ScreenScroll>
      <TopBar title="Notes" actionLabel="New" onAction={() => props.go("noteEditor")} />
      <View style={styles.searchBar}>
        <Search size={17} color={T["--muted"]} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search notes" placeholderTextColor={T["--muted"]} style={styles.searchInput} />
        {query ? <TouchableOpacity onPress={() => setQuery("")}><X size={16} color={T["--muted"]} /></TouchableOpacity> : null}
      </View>
      <View style={styles.smartCardRow}>
        <TouchableOpacity style={[styles.smartNoteCard, styles.smartNoteCardPrimary]} onPress={() => {
          if (primary) props.setSelectedNote(primary.id);
          props.go(primary ? "noteEditor" : "noteEditor");
        }}>
          <NotebookPen size={20} color={T["--cyan"]} />
          <Text style={styles.smartCardKicker}>Today's notes</Text>
          <Text style={styles.smartCardTitle}>{primary ? noteClassTitle(props.state, primary) : "Ready for notes"}</Text>
          <Text style={styles.smartIdeaPill}>{primary?.summary ? "Summary ready" : "Capture ready"}</Text>
          <TouchableOpacity style={styles.reviewButton} onPress={() => {
            if (primary) props.setSelectedNote(primary.id);
            props.go("noteEditor");
          }}><Text style={styles.reviewButtonText}>Review</Text></TouchableOpacity>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smartNoteCard} onPress={() => {
          if (primary) props.setSelectedNote(primary.id);
          props.go(primary ? "noteEditor" : "notes");
        }}>
          <Bell size={20} color={T["--mint"]} />
          <Text style={[styles.smartCardKicker, { color: T["--mint"] }]}>Needs review</Text>
          <Text style={styles.smartCardTitle}>{primary?.title ?? "No notes due"}</Text>
          <Text style={styles.smartIdeaPill}>{primaryIdeaCount} key ideas</Text>
        </TouchableOpacity>
      </View>
      <Panel title="By class">
        {notesByClass.map(({ klass, notes }) => (
          <TouchableOpacity key={klass.id} style={styles.classNoteRow} onPress={() => {
            if (notes[0]) props.setSelectedNote(notes[0].id);
            else props.go("noteEditor");
          }}>
            <View style={[styles.classIcon, { backgroundColor: accentMap[klass.accent].pale }]}><BookOpen size={18} color={accentMap[klass.accent].color} /></View>
            <View style={styles.flex1}>
              <Text style={styles.cardTitle}>{klass.title}</Text>
              <Text style={styles.cardSub}>{notes.length ? `${notes.length} ${notes.length === 1 ? "note" : "notes"}` : "No notes yet"}</Text>
            </View>
            <Text style={[styles.countPill, { color: accentMap[klass.accent].color, backgroundColor: accentMap[klass.accent].pale }]}>{notes.length}</Text>
          </TouchableOpacity>
        ))}
      </Panel>
      {missingClass ? (
        <TouchableOpacity style={styles.aiSuggestionCard} onPress={() => props.go("scanner")}>
          <ScanLine size={22} color={T["--blue"]} />
          <View style={styles.flex1}>
            <Text style={styles.cardTitle}>Review import for {missingClass.title}</Text>
            <Text style={styles.cardSub}>No note is linked yet.</Text>
          </View>
          <Text style={styles.sectionAction}>Review</Text>
        </TouchableOpacity>
      ) : null}
      <Panel title="Recent Notes">
        {recent.map((note, index) => (
          <TouchableOpacity key={note.id} style={index === 0 ? styles.recentNoteCard : styles.noteRow} onPress={() => { props.setSelectedNote(note.id); props.go("noteEditor"); }}>
            <View style={[styles.classIcon, { backgroundColor: note.status === "reviewed" ? accentMap.mint.pale : accentMap.violet.pale }]}>
              <FileText size={19} color={note.status === "reviewed" ? T["--mint"] : T["--violet"]} />
            </View>
            <View style={styles.flex1}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{note.title}</Text>
                <Text style={[styles.noteStatusDot, { color: note.status === "reviewed" ? T["--mint"] : T["--orange"] }]}>●</Text>
              </View>
              <Text style={styles.cardSub}>{noteClassTitle(props.state, note)} · {note.status === "reviewed" ? "Reviewed" : "Needs review"}</Text>
              {index === 0 ? (
                <>
                  <Text style={styles.noteSummaryLabel}>Summary</Text>
                  <Text style={styles.recentNoteSummary}>{note.summary ?? note.body}</Text>
                  <View style={styles.noteActionBar}>
                    <TouchableOpacity style={styles.noteActionButton} onPress={() => createTaskFromNote(note)}><FileText size={17} color={T["--cyan"]} /><Text style={[styles.noteActionText, { color: T["--cyan"] }]}>Create task</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.noteActionButton} onPress={() => setReviewReminder(note)}><CalendarDays size={17} color={T["--violet"]} /><Text style={[styles.noteActionText, { color: T["--violet"] }]}>Review</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.noteActionButton} onPress={() => props.actions.updateNote(note.id, { status: "reviewed" })}><Check size={17} color={T["--mint"]} /><Text style={[styles.noteActionText, { color: T["--mint"] }]}>Done</Text></TouchableOpacity>
                  </View>
                </>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
        {!recent.length ? <EmptyState title="Notes become useful when linked to class" copy="Create a quick note, scan lecture text, or import study material to connect notes with assignments and exams." /> : null}
      </Panel>
      <View style={styles.notesDock}>
        <TouchableOpacity style={styles.dockButton} onPress={() => props.go("noteEditor")}><FileText size={17} color={T["--cyan"]} /><Text style={styles.dockButtonText}>New note</Text></TouchableOpacity>
        <TouchableOpacity style={styles.dockButton} onPress={() => props.go("scanner")}><ScanLine size={17} color={T["--cyan"]} /><Text style={styles.dockButtonText}>Review import</Text></TouchableOpacity>
      </View>
    </ScreenScroll>
  );
}

function IPadNotes(props: ShellProps) {
  const [query, setQuery] = useState("");
  const clean = query.trim().toLowerCase();
  const visibleNotes = props.state.notes.filter((note) => !clean || `${note.title} ${note.body} ${note.summary ?? ""} ${noteClassTitle(props.state, note)}`.toLowerCase().includes(clean));
  const selected = props.state.notes.find((note) => note.id === props.selectedNote) ?? props.state.notes[0];
  return (
    <View style={styles.splitView}>
      <View style={styles.masterPane}>
        <View style={styles.rowBetween}>
          <Text style={styles.padPaneTitle}>Notes</Text>
          <TouchableOpacity style={styles.smallBlackButton} onPress={() => props.go("noteEditor")}><Plus size={16} color={T["--surface"]} /></TouchableOpacity>
        </View>
        <View style={styles.searchBar}>
          <Search size={17} color={T["--muted"]} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search notes" placeholderTextColor={T["--muted"]} style={styles.searchInput} />
          {query ? <TouchableOpacity onPress={() => setQuery("")}><X size={16} color={T["--muted"]} /></TouchableOpacity> : null}
        </View>
        {visibleNotes.map((note) => (
          <NoteCard key={note.id} state={props.state} note={note} selected={props.selectedNote === note.id} onPress={() => props.setSelectedNote(note.id)} />
        ))}
      </View>
      <ScrollView style={styles.detailPane} contentContainerStyle={styles.detailContent}>
        <NoteEditorForm {...props} existing={selected} />
      </ScrollView>
    </View>
  );
}

function NoteEditorScreen(props: ShellProps) {
  const existing = props.state.notes.find((note) => note.id === props.selectedNote);
  return (
    <ScreenScroll>
      <BackBar title="Note Editor" back={() => props.go("notes")} />
      <NoteEditorForm {...props} existing={existing} />
    </ScreenScroll>
  );
}

function NoteEditorForm({ state, actions, go, notify, existing }: ShellProps & { existing?: Note }) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [classId, setClassId] = useState(existing?.classId ?? "calc");
  const [body, setBody] = useState(existing?.body ?? "");
  const [tags, setTags] = useState(existing?.tags.join(", ") ?? "");
  const [actionStatus, setActionStatus] = useState("");
  const cleanTitle = title.trim() || "Quick note";
  const cleanBody = body.trim();
  const save = () => {
    const nextNote = {
      title: cleanTitle,
      classId,
      body: cleanBody || "New note body",
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      status: existing?.status ?? "draft" as const
    };
    if (existing) {
      actions.updateNote(existing.id, nextNote);
    } else {
      actions.addNote(nextNote);
    }
    notify("Note saved");
    go("notes");
  };
  const saveSummary = () => {
    const summary = buildNoteSummary(cleanBody || cleanTitle);
    const keyIdeas = buildKeyIdeas(cleanBody || cleanTitle, tags);
    if (existing) {
      actions.updateNote(existing.id, { title: cleanTitle, classId, body: cleanBody || existing.body, summary, keyIdeas, status: "reviewed" });
      setActionStatus("Summary saved to this note.");
      notify("Summary saved");
      return;
    }
    actions.addNote({
      id: `note-${Date.now()}`,
      title: cleanTitle,
      classId,
      body: cleanBody || "New note body",
      summary,
      keyIdeas,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      status: "reviewed"
    });
    setActionStatus("Summary saved in a new reviewed note.");
    notify("Summary saved");
  };
  const createTask = () => {
    actions.addTask({
      title: `Review ${cleanTitle}`,
      classId,
      type: "Homework",
      dueDate: new Date().toISOString().slice(0, 10),
      dueTime: "23:59",
      priority: "Medium",
      reminder: "Tonight"
    });
    setActionStatus("Review task added to Tasks.");
    notify("Task created from note");
  };
  const markReviewed = () => {
    if (!existing) {
      setActionStatus("Save this note before marking it reviewed.");
      return;
    }
    actions.updateNote(existing.id, { status: "reviewed" });
    setActionStatus("Note marked reviewed.");
    notify("Note reviewed");
  };
  return (
    <View style={styles.formCard}>
      <LabeledInput label="Title" value={title} setValue={setTitle} placeholder="Integration by Parts" />
      <PickerRow label="Class" values={state.classes.map((klassItem) => klassItem.title)} value={selectClassById(state, classId)?.title ?? "Class"} onPress={(value) => setClassId(state.classes.find((klassItem) => klassItem.title === value)?.id ?? classId)} />
      <LabeledInput label="Body" value={body} setValue={setBody} placeholder="Write the note body" multiline />
      <LabeledInput label="Tags" value={tags} setValue={setTags} placeholder="exam, practice" />
      <Panel title="Note Actions">
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={saveSummary}><Text style={styles.secondaryButtonText}>Save summary</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={createTask}><Text style={styles.secondaryButtonText}>Create task</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={markReviewed}><Text style={styles.secondaryButtonText}>Mark reviewed</Text></TouchableOpacity>
        </View>
        {actionStatus ? <Text style={styles.smartOutput}>{actionStatus}</Text> : null}
      </Panel>
      <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryButtonText}>Save note</Text></TouchableOpacity>
    </View>
  );
}

function ScannerScreen({ go, state, actions, notify }: ShellProps) {
  return (
    <ScreenScroll>
      <BackBar title="Scanner" back={() => go("home")} />
      <ScannerContent state={state} actions={actions} notify={notify} />
    </ScreenScroll>
  );
}

function IPadScanner({ go, state, actions, notify }: ShellProps) {
  return (
    <View style={styles.ipadScanner}>
      <ScrollView style={styles.scannerPreviewPane} contentContainerStyle={styles.detailContent}>
        <BackBar title="Scan Schedule" back={() => go("home")} />
        <ScannerContent state={state} actions={actions} notify={notify} previewOnly />
      </ScrollView>
      <View style={styles.scannerReviewPane}>
        <Panel title="Reviewed Classes">
          {state.classes.slice(0, 4).map((klass) => <MiniLine key={klass.id} text={`${klass.title}, Room ${klass.room}`} />)}
        </Panel>
        <Panel title="Reviewed Tasks">
          {selectCatchUpQueue(state).slice(0, 4).map((task) => <MiniLine key={task.id} text={`${task.title}, ${dueLabel(task)}`} />)}
        </Panel>
      </View>
    </View>
  );
}

function ScannerContent({ state, actions, notify, previewOnly = false }: { state: AppState; actions: StudyPlannerActions; notify: (message: string) => void; previewOnly?: boolean }) {
  const { t } = useI18n();
  const [syllabusText, setSyllabusText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [working, setWorking] = useState<"syllabus" | "file" | "note" | null>(null);
  const [scanMessage, setScanMessage] = useState("");
  const [lastApplySummary, setLastApplySummary] = useState<{ classes: number; tasks: number; exams: number } | null>(null);
  const activeParse = state.activeParseResult;
  const activeDraft = state.noteScanDrafts[0];
  const cameraCapability = featureCapabilities.cameraOcr;
  const uploadCapability = featureCapabilities.fileUpload;
  const canParseImages = hasNativeImageTextRecognition() || supportsSyllabusImageParsing();
  const parsedRows = activeParse?.assignments ?? [];
  const validRows = parsedRows.filter((item) => item.dueAt && !Number.isNaN(new Date(item.dueAt).getTime()));
  const examRows = parsedRows.filter((item) => item.kind === "exam" || item.type === "exam");
  const importStep = lastApplySummary ? "live" : working ? "extract" : activeParse ? "review" : "import";

  const parseTypedSyllabus = async () => {
    setWorking("syllabus");
    setScanMessage(t("import.reading_import", "Reading your import"));
    try {
      const parsedImport = createParsedImportFromTypedText(syllabusText, t("import.typed_school_material", "Typed school material"));
      const result = await parseCapturedSource(parsedImport, { kind: "typed", text: syllabusText, name: parsedImport.title }, {
        parseSyllabusSource: parseSyllabus,
        existingParsedItems: state.parsedItems
      });
      actions.upsertParsedImport(result.parsedImport);
      actions.upsertParsedItemsForImport(result.parsedImport.id, result.parsedItems);
      actions.setActiveParseResult(result.parseResult);
      setLastApplySummary(null);
      setScanMessage(formatLocal(t("import.review_work_note", "{count} found. Edit, confirm, then add to Today."), { count: result.parsedItems.length }));
      notify(t("import.status_parsed", "Ready to review"));
    } catch (error) {
      const message = normalizeParserError(error);
      setScanMessage(message);
      notify(message);
    } finally {
      setWorking(null);
    }
  };

  const uploadSyllabusFile = async () => {
    setWorking("file");
    setScanMessage(t("import.pick_file_status", "Choose a PDF or text file."));
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "text/plain"],
        copyToCacheDirectory: true
      });
      if (result.canceled) {
        setScanMessage(t("import.picker_cancelled", "Import cancelled. No planner data changed."));
        return;
      }
      const asset = result.assets[0];
      if (!asset) return;
      validateDocumentAsset({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: (asset as { size?: number }).size });
      const parsedImport = createParsedImportFromDocumentAsset({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: (asset as { size?: number }).size });
      const parsed = await parseCapturedSource(parsedImport, {
        kind: "pdf",
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType
      }, {
        parseSyllabusSource: parseSyllabus,
        existingParsedItems: state.parsedItems
      });
      actions.upsertParsedImport(parsed.parsedImport);
      actions.upsertParsedItemsForImport(parsed.parsedImport.id, parsed.parsedItems);
      actions.setActiveParseResult(parsed.parseResult);
      setLastApplySummary(null);
      setScanMessage(formatLocal(t("import.review_work_note", "{count} found. Edit, confirm, then add to Today."), { count: parsed.parsedItems.length }));
      notify(t("import.status_parsed", "Ready to review"));
    } catch (error) {
      const message = normalizeParserError(error);
      setScanMessage(message);
      notify(message);
    } finally {
      setWorking(null);
    }
  };

  const parsePhotoAsset = async (asset: ImagePicker.ImagePickerAsset, sourceName: string) => {
    const parsedImport = createParsedImportFromCameraAsset({
      uri: asset.uri,
      name: asset.fileName || sourceName,
      mimeType: asset.mimeType || "image/jpeg"
    });
    const parsed = await parseCapturedSource(parsedImport, {
      kind: "photo",
      uri: asset.uri,
      name: parsedImport.title,
      mimeType: parsedImport.mimeType
    }, {
      parseSyllabusSource: parseSyllabus,
      existingParsedItems: state.parsedItems
    });
    actions.upsertParsedImport(parsed.parsedImport);
    actions.upsertParsedItemsForImport(parsed.parsedImport.id, parsed.parsedItems);
    actions.setActiveParseResult(parsed.parseResult);
    setLastApplySummary(null);
    setScanMessage(formatLocal(t("import.review_work_note", "{count} found. Edit, confirm, then add to Today."), { count: parsed.parsedItems.length }));
    notify(t("import.status_parsed", "Ready to review"));
  };

  const captureSyllabusPhoto = async () => {
    if (!canParseImages) {
      const message = t("import.photo_disabled_message", "Camera OCR needs the iOS Vision OCR build or a configured parser endpoint with image parsing enabled.");
      setScanMessage(message);
      notify(message);
      return;
    }
    setWorking("file");
    setScanMessage(t("import.camera_ready_status", "Open camera and capture one syllabus page."));
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setScanMessage(t("permissions.camera", "Camera permission is required to scan a syllabus photo."));
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.92
      });
      if (result.canceled || !result.assets[0]) {
        setScanMessage(t("import.picker_cancelled", "Import cancelled. No planner data changed."));
        return;
      }
      setScanMessage(t("import.reading_import", "Reading your import"));
      await parsePhotoAsset(result.assets[0], t("import.camera_photo", "Camera syllabus photo"));
    } catch (error) {
      const message = normalizeParserError(error);
      setScanMessage(message);
      notify(message);
    } finally {
      setWorking(null);
    }
  };

  const chooseSyllabusPhoto = async () => {
    if (!canParseImages) {
      const message = t("import.photo_disabled_message", "Photo OCR needs the iOS Vision OCR build or a configured parser endpoint with image parsing enabled.");
      setScanMessage(message);
      notify(message);
      return;
    }
    setWorking("file");
    setScanMessage(t("import.pick_photo_status", "Choose a syllabus photo."));
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setScanMessage(t("permissions.photos", "Photo library permission is required to import a syllabus photo."));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1
      });
      if (result.canceled || !result.assets[0]) {
        setScanMessage(t("import.picker_cancelled", "Import cancelled. No planner data changed."));
        return;
      }
      setScanMessage(t("import.reading_import", "Reading your import"));
      await parsePhotoAsset(result.assets[0], t("import.photo_library_source", "Syllabus photo"));
    } catch (error) {
      const message = normalizeParserError(error);
      setScanMessage(message);
      notify(message);
    } finally {
      setWorking(null);
    }
  };

  const scanNotes = () => {
    setWorking("note");
    try {
      const result = scanStudyNoteText(noteText, t("notes.scanned_note", "Scanned notes"));
      const task = result.taskCandidates[0];
      const draft = {
        id: `note-scan-${Date.now()}`,
        title: result.title,
        classId: state.classes[0]?.id ?? "",
        body: result.body,
        summary: result.summary,
        keyIdeas: result.keyIdeas,
        tags: result.tags,
        taskTitle: task?.title,
        taskDueDate: task?.dueDate,
        taskDueTime: task?.dueTime,
        sourceName: t("notes.scanned_note", "Scanned notes"),
        createdAt: new Date().toISOString()
      };
      actions.addNoteScanDraft(draft);
      setScanMessage(formatLocal(t("notes.scan_ready", "{count} key ideas ready to save."), { count: result.keyIdeas.length }));
      notify(t("notes.scan_ready_short", "Note scan ready"));
    } catch (error) {
      const message = normalizeParserError(error);
      setScanMessage(message);
      notify(message);
    } finally {
      setWorking(null);
    }
  };

  const applyParsedPlan = () => {
    if (!activeParse) {
      setScanMessage(t("import.add_reviewed_before_today", "Add at least one reviewed item before sending work to Today."));
      return;
    }
    actions.applyParsedSyllabus(activeParse);
    setLastApplySummary({ classes: activeParse.courses.length, tasks: validRows.length, exams: examRows.length });
    setScanMessage(formatLocal(
      t("import.dashboard_alive", "Dashboard is live: {classes} classes and {items} reviewed items are now connected to Today, Calendar, Notes, and Widgets."),
      { classes: activeParse.courses.length, items: validRows.length }
    ));
    notify(t("import.status_applied", "Applied"));
  };

  const applyNoteDraft = () => {
    if (!activeDraft) return;
    actions.applyNoteScanDraft(activeDraft.id);
    setNoteText("");
    notify(t("notes.save_note", "Save note"));
  };

  return (
    <View>
      <ImportStatusCard
        step={importStep}
        title={lastApplySummary ? t("import.dashboard_updated", "Dashboard comes alive") : activeParse ? t("import.status_parsed", "Ready to review") : t("import.title_short", "Import school material")}
        detail={lastApplySummary ? t("import.dashboard_updated_detail", "Classes, tasks, exams, calendar, and widgets now share the reviewed import.") : canParseImages ? t("import.vision_ready", "Camera, photo, PDF, and paste imports are available for review.") : t("import.photo_disabled_message", "Photo OCR needs the iOS Vision OCR build or a configured parser endpoint with image parsing enabled.")}
        counts={[
          { label: "classes", value: lastApplySummary?.classes ?? activeParse?.courses.length ?? state.classes.length },
          { label: "tasks", value: lastApplySummary?.tasks ?? validRows.length },
          { label: "exams", value: lastApplySummary?.exams ?? examRows.length }
        ]}
      />
      <View style={styles.scanChoiceRow}>
        <TouchableOpacity style={[styles.secondaryButton, !canParseImages ? styles.disabledButton : null]} onPress={captureSyllabusPhoto} disabled={working !== null || !canParseImages}>
          <Text style={canParseImages ? styles.secondaryButtonText : styles.disabledButtonText}>{working === "file" ? t("import.status_processing", "Processing") : cameraCapability.label}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.secondaryButton, !canParseImages ? styles.disabledButton : null]} onPress={chooseSyllabusPhoto} disabled={working !== null || !canParseImages}>
          <Text style={canParseImages ? styles.secondaryButtonText : styles.disabledButtonText}>{t("import.photo_library", "Photo")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={uploadSyllabusFile} disabled={working !== null}>
          <Text style={styles.secondaryButtonText}>{working === "file" ? t("import.reading_import", "Reading your import") : uploadCapability.label}</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.cameraCard, previewOnly ? styles.padCameraCard : null]}>
        <View style={styles.scanFrame}>
          <View style={styles.scanCornerTop} />
          <View style={styles.scanCornerBottom} />
          <ScanLine size={54} color={T["--blue"]} />
        </View>
        <Text style={styles.cameraTitle}>{t("import.title", "Turn school material into reviewed assignments.")}</Text>
        <Text style={styles.cameraSub}>{canParseImages ? cameraCapability.backing : t("import.photo_disabled_message", "Photo OCR needs the iOS Vision OCR build or a configured parser endpoint with image parsing enabled.")} {uploadCapability.backing}.</Text>
      </View>
      <View style={styles.whiteCard}>
        <Text style={styles.readyText}>{t("import.type_it_in", "Type It In")}</Text>
        <TextInput
          value={syllabusText}
          onChangeText={setSyllabusText}
          placeholder={t("import.paste_placeholder", "Paste syllabus lines or assignment dates...")}
          placeholderTextColor={T["--muted"]}
          style={styles.scanTextArea}
          multiline
          textAlignVertical="top"
        />
        <TouchableOpacity style={styles.primaryButton} onPress={parseTypedSyllabus} disabled={working !== null}>
          <Text style={styles.primaryButtonText}>{working === "syllabus" ? t("import.finding_work", "Finding assignments, dates, classes, and grade weights.") : t("import.review_pasted_text", "Review pasted text")}</Text>
        </TouchableOpacity>
        <Text style={styles.readyText}>{activeParse ? formatLocal(t("import.found_count_status", "{count} found · {status}"), { count: parsedRows.length, status: t("import.status_parsed", "Ready to review") }) : t("import.no_silent_import", "No silent import")}</Text>
        <View style={styles.scannerReviewList}>
          {activeParse?.courses.slice(0, 3).map((course) => <MiniLine key={course.id} text={`${course.code} · ${course.name}`} />)}
          {parsedRows.slice(0, 5).map((item) => <MiniLine key={item.id} text={`${item.title} · ${item.dueAt ? item.dueAt.slice(0, 10) : t("import.needs_date", "needs date")}`} />)}
          {!activeParse ? state.parsedImports.slice(0, 3).map((item) => <MiniLine key={item.id} text={`${item.title} · ${statusLabel(item.status, t)}`} />) : null}
        </View>
        <TouchableOpacity style={[styles.primaryButton, !activeParse || validRows.length === 0 ? styles.disabledButton : null]} onPress={applyParsedPlan} disabled={!activeParse || validRows.length === 0}>
          <Text style={styles.primaryButtonText}>{activeParse ? formatLocal(t("import.add_reviewed_items", "Add {count} reviewed items to Today"), { count: validRows.length }) : t("import.review_work", "Review work")}</Text>
        </TouchableOpacity>
        {scanMessage ? <Text style={styles.smartOutput}>{scanMessage}</Text> : null}
      </View>
      <View style={styles.whiteCard}>
        <Text style={styles.readyText}>{t("notes.scan_title", "Scan notes")}</Text>
        <TextInput
          value={noteText}
          onChangeText={setNoteText}
          placeholder={t("notes.scan_placeholder", "Paste class notes, board text, or homework details...")}
          placeholderTextColor={T["--muted"]}
          style={styles.scanTextArea}
          multiline
          textAlignVertical="top"
        />
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={scanNotes} disabled={working !== null}>
            <Text style={styles.secondaryButtonText}>{working === "note" ? t("import.status_processing", "Processing") : t("notes.scan_review", "Review note scan")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryButton, !activeDraft ? styles.disabledButton : null]} onPress={applyNoteDraft} disabled={!activeDraft}>
            <Text style={activeDraft ? styles.secondaryButtonText : styles.disabledButtonText}>{t("notes.save_note", "Save note")}</Text>
          </TouchableOpacity>
        </View>
        {activeDraft ? (
          <View style={styles.scannerReviewList}>
            <MiniLine text={activeDraft.title} />
            <MiniLine text={activeDraft.summary} />
            {activeDraft.taskTitle ? <MiniLine text={`${t("notes.convert_to_task", "Make task")}: ${activeDraft.taskTitle}`} /> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function CalendarScreen(props: ShellProps) {
  return (
    <ScreenScroll>
      <BackBar title="Calendar" back={() => props.go("home")} />
      <CalendarBlocks state={props.state} />
    </ScreenScroll>
  );
}

function IPadCalendar(props: ShellProps) {
  return (
    <ScrollView style={styles.padScroll} contentContainerStyle={styles.detailContent}>
      <Text style={styles.padTitle}>Calendar</Text>
      <View style={styles.calendarSurface}>
        <CalendarBlocks state={props.state} />
      </View>
    </ScrollView>
  );
}

function CalendarBlocks({ state, compact = false }: { state?: AppState; compact?: boolean }) {
  const schedule = state ? selectTodayClasses(state) : [];
  const todayTasks = state ? selectTodayTasks(state).filter((task) => !task.completed) : [];
  const nextExam = state ? selectUpcomingExams(state)[0] : null;
  return (
    <View>
      {!schedule.length && !todayTasks.length && !nextExam ? <EmptyState title="No classes or deadlines today" copy="Classes, assignments, exams, and reminders appear here after your first import." /> : null}
      {schedule.map((item) => (
        <View key={`${item.title}-calendar`} style={[styles.calendarBlock, compact ? styles.calendarBlockCompact : null, { borderLeftColor: accentMap[item.accent].color }]}>
          <Text style={styles.calendarTime}>{formatTime(item.startTime)}</Text>
          <View style={styles.flex1}>
            <Text style={styles.calendarTitle}>{item.title}</Text>
            <Text style={styles.calendarSub}>Room {item.room} · {reminderLabel(item.reminderSettings)}</Text>
          </View>
          {nextExam?.classId === item.id ? <Text style={styles.priorityPill}>{nextExam.title}</Text> : null}
        </View>
      ))}
      {todayTasks.map((task) => (
        <View key={`calendar-task-${task.id}`} style={[styles.calendarBlock, compact ? styles.calendarBlockCompact : null, { borderLeftColor: priorityColor(task.priority) }]}>
          <Text style={styles.calendarTime}>{formatTime(task.dueTime)}</Text>
          <View style={styles.flex1}>
            <Text style={styles.calendarTitle}>{task.title} due</Text>
            <Text style={styles.calendarSub}>{classTitle(state!, task)} · {task.type} · {task.reminder}</Text>
          </View>
          <Text style={[styles.priorityPill, { color: priorityColor(task.priority) }]}>{task.priority}</Text>
        </View>
      ))}
      {nextExam ? (
        <View style={[styles.calendarBlock, compact ? styles.calendarBlockCompact : null, { borderLeftColor: T["--rose"] }]}>
          <Text style={styles.calendarTime}>{formatTime(nextExam.time)}</Text>
          <View style={styles.flex1}>
            <Text style={styles.calendarTitle}>{nextExam.title}</Text>
            <Text style={styles.calendarSub}>{selectClassById(state!, nextExam.classId)?.title ?? "Exam"} · {nextExam.date}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function ProfileScreen(props: ShellProps) {
  return (
    <ScreenScroll>
      <TopBar title="Profile" />
      <ProfileContent {...props} />
    </ScreenScroll>
  );
}

function SubscribeScreen({ go }: ShellProps) {
  const { t } = useI18n();
  const subscription = useSubscription();
  const selectedProduct = subscription.products.find((product) => product.id === subscription.selectedProductId) ?? subscription.products[0];
  const buy = async () => {
    if (selectedProduct) {
      await subscription.purchase(selectedProduct.id);
    } else {
      await subscription.manageSubscriptions();
    }
  };

  return (
    <ScreenScroll>
      <BackBar title={t("entitlement_gate.unlock_title", "Unlock StudyPlanner: Syllabus AI")} back={() => go("home")} />
      <View style={styles.profileHero}>
        <Text style={styles.detailTitle}>{t("paywall.dashboard_ready_title", "Your semester command center is ready.")}</Text>
        <Text style={styles.detailSub}>{t("entitlement_gate.unlock_copy", "Subscribe or restore purchases to use the full app.")}</Text>
      </View>
      <Panel title={t("paywall.included_with_studyplanner", "Included with StudyPlanner")}>
        <MiniLine text={t("paywall.feature_scans", "Unlimited syllabus scans")} />
        <MiniLine text={t("paywall.feature_recommended_widgets", "Recommended widgets")} />
        <MiniLine text={t("paywall.feature_forecast", "Semester forecast")} />
      </Panel>
      <View style={styles.formCard}>
        <Text style={styles.readyText}>
          {selectedProduct ? `${selectedProduct.title} · ${selectedProduct.displayPrice}` : t("paywall.loading_current_store_pricing", "Loading current store pricing")}
        </Text>
        {subscription.errorMessage ? <Text style={styles.smartOutput}>{subscription.errorMessage}</Text> : null}
        {subscription.message ? <Text style={styles.smartOutput}>{subscription.message}</Text> : null}
        <TouchableOpacity style={styles.primaryButton} onPress={buy}>
          <Text style={styles.primaryButtonText}>{t("paywall.subscribe", "Subscribe")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={subscription.restore}>
          <Text style={styles.secondaryButtonText}>{subscription.flowState === "restoring" ? t("paywall.restoring", "Restoring") : t("paywall.restore", "Restore Purchases")}</Text>
        </TouchableOpacity>
      </View>
    </ScreenScroll>
  );
}

function IPadProfile(props: ShellProps) {
  return (
    <ScrollView style={styles.padScroll} contentContainerStyle={styles.detailContent}>
      <Text style={styles.padTitle}>Profile and Settings</Text>
      <ProfileContent {...props} />
    </ScrollView>
  );
}

function ProfileContent({ state, settings, actions, go }: ShellProps) {
  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => actions.updateAppSettings({ [key]: value });
  const [name, setName] = useState(state.student.name);
  const [school, setSchool] = useState(state.student.school);
  const [year, setYear] = useState(state.student.year);
  const [semester, setSemester] = useState(state.student.semester);
  const donePercent = selectDonePercentToday(state);
  const pulse = selectHomeDashboardModel(state).pulse;
  const activePreset = studioPresets.find((preset) => preset.patch.widgetType === state.widgetSettings.nextClass.widgetType) ?? { label: "Academic" };
  const saveProfile = () => {
    actions.updateStudent({
      name: name.trim() || state.student.name,
      school: school.trim() || state.student.school,
      year: year.trim() || state.student.year,
      semester: semester.trim() || state.student.semester
    });
  };
  return (
    <View>
      <View style={styles.profileHero}>
        <View style={styles.profileAvatar}><Text style={styles.profileInitials}>{appInitials(state.student.name)}</Text></View>
        <Text style={styles.detailTitle}>{state.student.name}</Text>
        <Text style={styles.detailSub}>{state.student.school}</Text>
        <View style={styles.profileStatsRow}>
          <StatPill label="classes" value={String(state.classes.length)} accentColor={T["--blue"]} />
          <StatPill label="today done" value={`${donePercent}%`} accentColor={T["--mint"]} />
          <StatPill label="pulse" value={`${pulse.score}%`} accentColor={pulse.score < 60 ? T["--rose"] : T["--blue"]} />
        </View>
      </View>
      <View style={styles.formCard}>
        <LabeledInput label="Name" value={name} setValue={setName} placeholder="Student name" />
        <LabeledInput label="School" value={school} setValue={setSchool} placeholder="School" />
        <LabeledInput label="Year" value={year} setValue={setYear} placeholder="Year" />
        <LabeledInput label="Semester" value={semester} setValue={setSemester} placeholder="Semester" />
        <TouchableOpacity style={styles.primaryButton} onPress={saveProfile}><Text style={styles.primaryButtonText}>Save profile</Text></TouchableOpacity>
      </View>
      <Panel title="Reminder Defaults">
        <PickerRow label="Default class reminder" values={["Off", "5 min before", "10 min before", "15 min before", "30 min before", "1 hour before"]} value={settings.defaultClassReminder === 60 ? "1 hour before" : settings.defaultClassReminder ? `${settings.defaultClassReminder} min before` : "Off"} onPress={(value) => set("defaultClassReminder", reminderMinutes(value))} />
        <ToggleLine label="Show room in reminder" value={settings.showRoomInReminder} onValueChange={(value) => set("showRoomInReminder", value)} />
        <TouchableOpacity style={styles.watchAccessButton} onPress={() => go("reminders")}>
          <Text style={styles.primaryButtonText}>Open Reminders</Text>
        </TouchableOpacity>
      </Panel>
      <Panel title="Semester Progress">
        <SurfaceCard compact>
          <View style={styles.rowBetween}>
            <View style={styles.flex1}>
              <Text style={styles.cardTitle}>{state.student.semester}</Text>
              <Text style={styles.cardSub}>{state.tasks.filter((task) => task.completed).length} completed tasks · {state.exams.length} exams tracked</Text>
            </View>
            <ProgressRing value={pulse.score} accentColor={pulse.score < 60 ? T["--rose"] : T["--blue"]} label="pulse" />
          </View>
        </SurfaceCard>
      </Panel>
      <Panel title="Customization">
        <MiniLine text={`Theme controls: ${settings.highContrast ? "high contrast" : "standard contrast"}, ${settings.reduceTransparency ? "reduced glass" : "liquid glass"}`} />
        <MiniLine text={`Widget preset: ${activePreset.label}`} />
        <TouchableOpacity style={styles.watchAccessButton} onPress={() => go("themeStudio")}>
          <Text style={styles.primaryButtonText}>Open Theme Studio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.watchAccessButton} onPress={() => go("studio")}>
          <Text style={styles.primaryButtonText}>Open Widget Studio</Text>
        </TouchableOpacity>
      </Panel>
      <Panel title="Widget Defaults"><MiniLine text="Home Screen widgets sync from Widget Studio" /><MiniLine text="Lock Screen metadata syncs when native bridge is available" /></Panel>
      <Panel title="Watch Settings">
        <TouchableOpacity style={styles.watchAccessButton} onPress={() => go("watchPreview")}>
          <Text style={styles.primaryButtonText}>Apple Watch</Text>
        </TouchableOpacity>
      </Panel>
      <Panel title="Accessibility">
        <ToggleLine label="Reduce transparency" value={settings.reduceTransparency} onValueChange={(value) => set("reduceTransparency", value)} />
        <ToggleLine label="Reduce motion" value={settings.reduceMotion} onValueChange={(value) => set("reduceMotion", value)} />
        <ToggleLine label="High contrast" value={settings.highContrast} onValueChange={(value) => set("highContrast", value)} />
        <ToggleLine label="Larger text" value={settings.largerText} onValueChange={(value) => set("largerText", value)} />
      </Panel>
    </View>
  );
}

function HomeScreenWidgetPreview({ go, state, settings }: ShellProps) {
  const dueToday = selectTodayTasks(state).filter((task) => !task.completed).length;
  const nextExam = selectUpcomingExams(state)[0];
  const appIcons = ["Messages", "Calendar", "Photos", "Camera", "Maps", "Clock", "Notes", "Music"];
  return (
    <View style={styles.iosPreviewScreen}>
      <View style={styles.previewWallpaper} />
      <View style={styles.previewTopBar}>
        <TouchableOpacity style={styles.previewBackButton} onPress={() => go("studio")}><ChevronLeft size={20} color="#FFFFFF" /></TouchableOpacity>
        <Text style={styles.previewTitle}>Home Screen</Text>
        <View style={styles.previewSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.homePreviewContent} showsVerticalScrollIndicator={false}>
        <View style={styles.homePreviewGrid}>
          <View style={styles.homePreviewLargeWidget}>
            <LiquidWidget type="nextClass" state={state} styleConfig={state.widgetSettings.nextClass} settings={settings} />
          </View>
          <View style={styles.homePreviewSmallStack}>
            <View style={styles.homeSmallWidget}><Text style={styles.homeSmallLabel}>Due Today</Text><Text style={styles.homeSmallValue}>{dueToday}</Text><Text style={styles.homeSmallSub}>assignments</Text></View>
            <View style={styles.homeSmallWidget}><Text style={styles.homeSmallLabel}>Next Exam</Text><Text style={styles.homeSmallValue}>{nextExam ? "Soon" : "--"}</Text><Text style={styles.homeSmallSub}>{nextExam?.title ?? "clear"}</Text></View>
          </View>
        </View>
        <View style={styles.homePreviewWideWidget}>
          <LiquidWidget type="classPulse" state={state} styleConfig={state.widgetSettings.classPulse} settings={settings} />
        </View>
        <View style={styles.appIconGrid}>
          <View style={styles.appIconWrap}>
            <View style={styles.studyPlannerIcon}><BookOpen size={26} color="#FFFFFF" /></View>
            <Text style={styles.appIconLabel}>StudyPlanner</Text>
          </View>
          {appIcons.map((label, index) => (
            <View key={label} style={styles.appIconWrap}>
              <View style={[styles.genericAppIcon, { backgroundColor: appIconColor(index) }]} />
              <Text style={styles.appIconLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.homeDock}>
        {[T["--mint"], T["--cyan"], T["--blue"], T["--rose"]].map((color) => <View key={color} style={[styles.dockIcon, { backgroundColor: color }]} />)}
      </View>
    </View>
  );
}

function LockScreenWidgetPreview({ go, state, settings }: ShellProps) {
  const dueToday = selectTodayTasks(state).filter((task) => !task.completed).length;
  const nextClass = selectCurrentOrNextClass(state);
  const nextExam = selectUpcomingExams(state)[0];
  return (
    <View style={styles.iosPreviewScreen}>
      <View style={styles.lockWallpaper} />
      <View style={styles.previewTopBar}>
        <TouchableOpacity style={styles.previewBackButton} onPress={() => go("studio")}><ChevronLeft size={20} color="#FFFFFF" /></TouchableOpacity>
        <Text style={styles.previewTitle}>Lock Screen</Text>
        <View style={styles.previewSpacer} />
      </View>
      <View style={styles.lockPreviewContent}>
        <View style={styles.lockWidgetRow}>
          <LockChip label={nextClass?.title ?? "Class"} value={nextClass ? formatTime(nextClass.startTime) : "--"} />
          <LockChip label="Due" value={String(dueToday)} />
          <LockChip label="Exam" value={nextExam ? nextExam.date.slice(5) : "--"} />
        </View>
        <Text style={styles.lockDate}>Thursday, June 4</Text>
        <Text style={styles.lockClock}>9:41</Text>
        <View style={styles.lockInlineWidget}>
          <Text style={styles.lockInlineText}>14-day study streak</Text>
        </View>
        <View style={styles.liveActivityCard}>
          <View style={styles.liveActivityIcon}><BookOpen size={22} color="#FFFFFF" /></View>
          <View style={styles.flex1}>
            <Text style={styles.liveActivityTitle}>{nextClass ? `${nextClass.title} is next` : "School OS synced"}</Text>
            <Text style={styles.liveActivitySub}>{nextClass ? `Room ${nextClass.room} · ${reminderLabel(nextClass.reminderSettings)}` : "Widgets update from your reviewed planner data."}</Text>
          </View>
          <Text style={styles.liveActivityTime}>{nextClass ? formatTime(nextClass.startTime) : "Live"}</Text>
        </View>
        <View style={styles.lockWidgetPreview}>
          <LiquidWidget type="todayTasks" state={state} styleConfig={state.widgetSettings.todayTasks} settings={settings} />
        </View>
      </View>
    </View>
  );
}

function LockChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.lockChip}>
      <Text style={styles.lockChipValue}>{value}</Text>
      <Text style={styles.lockChipLabel}>{label}</Text>
    </View>
  );
}

function ThemeStudioScreen({ go, state, settings, actions }: ShellProps) {
  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => actions.updateAppSettings({ [key]: value });
  return (
    <ScreenScroll>
      <BackBar title="Theme Studio" back={() => go("profile")} />
      <View style={styles.themePreviewCard}>
        <Text style={styles.detailTitle}>Everything updates live.</Text>
        <Text style={styles.detailSub}>Theme controls change contrast, motion, and glass behavior across dashboard, widgets, and previews.</Text>
        <LiquidWidget type="classPulse" state={state} styleConfig={state.widgetSettings.classPulse} settings={settings} />
      </View>
      <Panel title="Appearance">
        <ToggleLine label="Liquid glass" value={!settings.reduceTransparency} onValueChange={(value) => set("reduceTransparency", !value)} />
        <ToggleLine label="High contrast" value={settings.highContrast} onValueChange={(value) => set("highContrast", value)} />
        <ToggleLine label="Larger text" value={settings.largerText} onValueChange={(value) => set("largerText", value)} />
        <ToggleLine label="Reduce motion" value={settings.reduceMotion} onValueChange={(value) => set("reduceMotion", value)} />
      </Panel>
      <Panel title="Accent Palette">
        <View style={styles.themeGrid}>
          {(Object.keys(accentMap) as Accent[]).map((accent) => (
            <View key={accent} style={styles.themeSwatchCard}>
              <View style={[styles.themeSwatch, { backgroundColor: accentMap[accent].color }]} />
              <Text style={styles.cardTitle}>{accentMap[accent].label}</Text>
              <Text style={styles.cardSub}>Available in Widget Studio</Text>
            </View>
          ))}
        </View>
      </Panel>
    </ScreenScroll>
  );
}

function RemindersScreen({ go, state, settings, actions }: ShellProps) {
  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => actions.updateAppSettings({ [key]: value });
  const activeClasses = state.classes.filter((klass) => klass.reminderSettings.enabled).slice(0, 4);
  const upcomingTasks = state.tasks.filter((task) => !task.completed).slice(0, 4);
  const nextExam = selectUpcomingExams(state)[0];
  return (
    <ScreenScroll>
      <BackBar title="Reminders" back={() => go("profile")} />
      <HeroCard
        eyebrow="SMART NUDGES"
        title="Never miss a class, deadline, or exam."
        subtitle="Default reminders, room previews, and assignment nudges stay wired to the same School OS data."
        metric={settings.defaultClassReminder ? `${settings.defaultClassReminder}m` : "Off"}
        accentColor={T["--orange"]}
      />
      <Panel title="Default class reminder">
        <PickerRow label="Lead time" values={["Off", "5 min before", "10 min before", "15 min before", "30 min before", "1 hour before"]} value={settings.defaultClassReminder === 60 ? "1 hour before" : settings.defaultClassReminder ? `${settings.defaultClassReminder} min before` : "Off"} onPress={(value) => set("defaultClassReminder", reminderMinutes(value))} />
        <ToggleLine label="Include room/location" value={settings.showRoomInReminder} onValueChange={(value) => set("showRoomInReminder", value)} />
      </Panel>
      {nextExam ? (
        <View style={styles.aiSuggestionCard}>
          <Bell size={20} color={T["--orange"]} />
          <View style={styles.flex1}>
            <Text style={styles.cardTitle}>Smart suggestion</Text>
            <Text style={styles.cardSub}>{nextExam.title} is coming up. Add a one-day reminder and study nudges from the exam plan.</Text>
          </View>
        </View>
      ) : null}
      <Panel title="Active class reminders">
        {activeClasses.length ? activeClasses.map((klass) => (
          <MiniLine key={`reminder-${klass.id}`} text={`${klass.title} · ${reminderLabel(klass.reminderSettings)}${klass.reminderSettings.showRoom ? ` · Room ${klass.room}` : ""}`} />
        )) : <EmptyState title="No class reminders yet" copy="Turn on class reminders from a class detail or set a default here." />}
      </Panel>
      <Panel title="Assignment and exam reminders">
        {upcomingTasks.map((task) => <MiniLine key={`task-reminder-${task.id}`} text={`${task.title} · ${classTitle(state, task)} · ${task.reminder}`} />)}
        {nextExam ? <MiniLine text={`${nextExam.title} · exam reminder ready`} /> : null}
      </Panel>
    </ScreenScroll>
  );
}

function WatchPreview({ go, state, actions }: ShellProps) {
  const [screen, setScreen] = useState<WatchScreen>("today");
  const screens: WatchScreen[] = ["today", "room", "pulse", "tasks", "notification", "complications"];
  return (
    <ScreenScroll>
      <BackBar title="Apple Watch" back={() => go("profile")} />
      <WatchScreenPicker values={screens} value={screen} onPress={setScreen} />
      <View style={styles.watchFrame}>
        <View style={styles.watchScreen}>
          {screen === "today" ? <WatchToday state={state} /> : null}
          {screen === "room" ? <WatchRoom state={state} /> : null}
          {screen === "pulse" ? <WatchPulse state={state} /> : null}
          {screen === "tasks" ? <WatchTasks state={state} tasks={selectWatchTasksModel(state)} toggle={actions.toggleTaskComplete} /> : null}
          {screen === "notification" ? <WatchNotification state={state} /> : null}
          {screen === "complications" ? <WatchComplications state={state} /> : null}
        </View>
      </View>
    </ScreenScroll>
  );
}

function LiquidWidget({
  type,
  state,
  styleConfig,
  settings,
  onPress
}: {
  type: WidgetType;
  state: AppState;
  styleConfig: WidgetSettings;
  settings: AppSettings;
  onPress?: () => void;
}) {
  const content = getWidgetDisplayModel(type, { ...state, widgetSettings: { ...state.widgetSettings, [type]: styleConfig } });
  const accent = accentMap[styleConfig.accent];
  const vars = getWidgetStyleVars(styleConfig, settings);
  const density = vars.density;
  const card = (
    <View
      style={[
        styles.liquidWidget,
        widgetSizeStyle(styleConfig.size),
        {
          borderRadius: vars.radius,
          opacity: vars.opacity,
          shadowColor: accent.color,
          shadowOpacity: settings.highContrast ? 0.18 : vars.glow / 420,
          shadowRadius: settings.reduceTransparency ? 10 : vars.glow / 2.4
        }
      ]}
    >
      <LiquidBackdrop accent={styleConfig.accent} radius={vars.radius} muted={settings.reduceTransparency} />
      <View style={styles.widgetHighlight} />
      <View style={styles.widgetHeader}>
        <Text style={styles.widgetEyebrow}>{content.label}</Text>
        <Text style={styles.widgetStatus}>{content.status}</Text>
      </View>
      <View style={styles.widgetMain}>
        <View style={styles.flex1}>
          <Text style={styles.widgetValue}>{content.value}</Text>
          <Text style={styles.widgetTitle}>{content.title}</Text>
          {density === "Detailed" ? <Text style={styles.widgetCopy}>{content.copy}</Text> : null}
        </View>
        {content.chart === "pulse" ? <Sparkline color={T["--surface"]} /> : null}
        {content.chart === "bars" ? <MiniBars color={T["--surface"]} /> : null}
      </View>
      {density === "Detailed" && content.items.length ? (
        <View style={styles.widgetDivider}>
          {content.items.slice(0, 3).map((item) => <Text key={item} numberOfLines={1} style={styles.widgetItem}>{item}</Text>)}
        </View>
      ) : null}
    </View>
  );
  return onPress ? <TouchableOpacity activeOpacity={0.88} onPress={onPress}>{card}</TouchableOpacity> : card;
}

function LiquidBackdrop({ accent, radius, muted }: { accent: Accent; radius: number; muted: boolean }) {
  const palette = accentMap[accent];
  const gradientId = `g-${accent}-${Math.round(radius)}`;
  return (
    <View style={[styles.liquidBackdrop, { borderRadius: radius }]}>
      <Svg width="100%" height="100%" viewBox="0 0 360 220" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.color} stopOpacity={muted ? 0.86 : 1} />
            <Stop offset="0.56" stopColor={palette.end} stopOpacity={muted ? 0.78 : 0.96} />
            <Stop offset="1" stopColor="#111827" stopOpacity={muted ? 0.76 : 0.9} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="360" height="220" fill={`url(#${gradientId})`} />
        <Circle cx="290" cy="38" r="92" fill="#FFFFFF" opacity={muted ? 0.12 : 0.2} />
        <Circle cx="42" cy="192" r="120" fill="#FFFFFF" opacity={muted ? 0.08 : 0.15} />
        <Path d="M0 158 C82 106 136 178 212 124 C278 78 312 93 360 48 L360 220 L0 220 Z" fill="#FFFFFF" opacity={muted ? 0.08 : 0.15} />
      </Svg>
    </View>
  );
}

function IPadSidebar({ active, go }: { active: PadTab; go: (route: Route) => void }) {
  const { t } = useI18n();
  const tabs: Array<{ id: PadTab; labelKey: string; fallback: string; Icon: React.ComponentType<{ size?: number; color?: string }> }> = [
    { id: "home", labelKey: "tabs.home", fallback: "Home", Icon: Home },
    { id: "classes", labelKey: "tabs.schedule", fallback: "Schedule", Icon: CalendarDays },
    { id: "tasks", labelKey: "tabs.tasks", fallback: "Tasks", Icon: Check },
    { id: "notes", labelKey: "tabs.notes", fallback: "Notes", Icon: FileText },
    { id: "calendar", labelKey: "tabs.calendar", fallback: "Calendar", Icon: CalendarDays },
    { id: "profile", labelKey: "tabs.profile", fallback: "Profile", Icon: User }
  ];
  return (
    <View style={styles.sidebar}>
      <Text style={styles.sidebarTitle}>StudyPlanner</Text>
      {tabs.map((tab) => {
        const selected = active === tab.id;
        const label = labelForTab(tab.id, t) || t(tab.labelKey, tab.fallback);
        return (
          <TouchableOpacity key={tab.id} accessibilityLabel={label} style={[styles.sidebarItem, selected ? styles.sidebarItemActive : null]} onPress={() => go(tab.id)}>
            <tab.Icon size={20} color={selected ? T["--surface"] : T["--muted"]} />
            <Text style={[styles.sidebarLabel, selected ? styles.sidebarLabelActive : null]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PhoneTabBar({ active, go }: { active: PhoneTab; go: (route: Route) => void }) {
  const { t } = useI18n();
  const tabs: Array<{ id: PhoneTab; labelKey: string; fallback: string; Icon: React.ComponentType<{ size?: number; color?: string }> }> = [
    { id: "home", labelKey: "tabs.home", fallback: "Home", Icon: Home },
    { id: "classes", labelKey: "tabs.schedule", fallback: "Schedule", Icon: CalendarDays },
    { id: "tasks", labelKey: "tabs.tasks", fallback: "Tasks", Icon: Check },
    { id: "notes", labelKey: "tabs.notes", fallback: "Notes", Icon: FileText },
    { id: "profile", labelKey: "tabs.profile", fallback: "Profile", Icon: User }
  ];
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const selected = active === tab.id;
        const label = labelForTab(tab.id, t) || t(tab.labelKey, tab.fallback);
        return (
          <TouchableOpacity key={tab.id} accessibilityLabel={label} style={styles.tabItem} onPress={() => go(tab.id)}>
            <tab.Icon size={23} color={selected ? T["--text"] : T["--muted"]} />
            <Text style={[styles.tabLabel, selected ? styles.tabLabelActive : null]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ActionSheet({ open, close, go, isPad }: { open: boolean; close: () => void; go: (route: Route) => void; isPad: boolean }) {
  type SheetAction = [FeatureCapabilityId, Route, React.ComponentType<{ size?: number; color?: string }>, Accent];
  const actions = ([
    ["plannerReview", "scanner", ScanLine, "blue"],
    ["addTask", "addTask", Check, "orange"],
    ["addNote", "noteEditor", NotebookPen, "violet"],
    ["widgetStudio", "studio", Grid2X2, "blue"]
  ] satisfies SheetAction[]).filter(([id]) => featureCapabilities[id].state === "available");
  return (
    <Modal visible={open} transparent animationType={isPad ? "fade" : "slide"} onRequestClose={close}>
      <View style={[styles.modalRoot, isPad ? styles.modalRootPad : null]}>
        <TouchableOpacity accessibilityLabel="Close actions" style={styles.modalScrim} onPress={close} />
        <View style={[styles.actionSheet, isPad ? styles.actionPopover : null]}>
          <View style={styles.sheetGrab} />
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.sheetTitle}>Quick add</Text>
              <Text style={styles.sheetCopy}>Choose the next planner action.</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={close}><X size={18} color={T["--text"]} /></TouchableOpacity>
          </View>
          <View style={styles.sheetGrid}>
            {actions.map(([id, route, Icon, accent]) => (
              <TouchableOpacity key={id} style={styles.sheetItem} onPress={() => go(route)}>
                <View style={[styles.sheetIcon, { backgroundColor: accentMap[accent].pale }]}>
                  <Icon size={22} color={accentMap[accent].color} />
                </View>
                <Text style={styles.sheetItemText}>{featureCapabilities[id].label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function WatchToday({ state }: { state: AppState }) {
  const model = selectWatchTodayModel(state);
  return (
    <View style={styles.watchContent}>
      <Text style={styles.watchHeader}>{model.time}</Text>
      <WatchMiniCard accent={model.nextClass?.accent ?? "blue"} title="Next Class" value={model.nextClass?.title ?? "No class"} detail={model.nextClass ? `Room ${model.nextClass.room}` : "Clear"} />
      <Text style={styles.watchLarge}>{model.startsIn}</Text>
      <TouchableOpacity style={styles.watchButton}><Text style={styles.watchButtonText}>Details</Text></TouchableOpacity>
    </View>
  );
}

function WatchRoom({ state }: { state: AppState }) {
  const room = selectWatchRoomModel(state);
  return (
    <View style={styles.watchContent}>
      <Text style={styles.watchHeader}>Room Reminder</Text>
      <Text style={styles.watchLarge}>{room?.room ?? "--"}</Text>
      <Text style={styles.watchText}>{room?.title ?? "No class"}</Text>
      <Text style={styles.watchSub}>{room ? `Starts in ${room.startsIn}` : "Schedule clear"}</Text>
      <Text style={styles.watchSub}>{room?.bringItems.length ? `Bring: ${room.bringItems.join(", ")}` : "No items"}</Text>
    </View>
  );
}

function WatchPulse({ state }: { state: AppState }) {
  const pulse = selectWatchPulseModel(state);
  return (
    <View style={styles.watchContent}>
      <Text style={styles.watchHeader}>Class Pulse</Text>
      <Text style={styles.watchLarge}>{pulse.score}%</Text>
      <Text style={styles.watchText}>{pulse.label}</Text>
      <Sparkline color={accentMap[pulse.accent].color} small />
      <Text style={styles.watchSub}>{pulse.primaryReason}</Text>
    </View>
  );
}

function WatchTasks({ state, tasks, toggle }: { state: AppState; tasks: Task[]; toggle: (id: string) => void }) {
  return (
    <View style={styles.watchContent}>
      <Text style={styles.watchHeader}>{tasks.length} tasks left</Text>
      {tasks.slice(0, 2).map((task) => (
        <TouchableOpacity key={task.id} style={styles.watchTask} onPress={() => toggle(task.id)}>
          <View style={styles.watchTaskDot} />
          <Text numberOfLines={1} style={styles.watchTaskText}>{task.title} · {classTitle(state, task)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function WatchNotification({ state }: { state: AppState }) {
  const model = selectWatchNotificationModel(state);
  return (
    <View style={styles.watchContent}>
      <Text style={styles.watchHeader}>Notification</Text>
      <WatchMiniCard accent="cyan" title={model.title} value={model.value} detail={model.detail} />
    </View>
  );
}

function WatchComplications({ state }: { state: AppState }) {
  const models = selectComplicationModels(state);
  const accents: Accent[] = ["blue", "cyan", "orange", "mint"];
  return (
    <View style={styles.watchGrid}>
      {models.map((model, index) => (
        <WatchMiniCard key={model.id} accent={accents[index] ?? "blue"} title={model.title} value={model.value} detail={model.detail} />
      ))}
    </View>
  );
}

function WatchMiniCard({ accent, title, value, detail }: { accent: Accent; title: string; value: string; detail: string }) {
  const color = accentMap[accent].color;
  return (
    <View style={[styles.watchMiniCard, { borderColor: `${color}88`, backgroundColor: `${color}25` }]}>
      <Text style={styles.watchMiniTitle}>{title}</Text>
      <Text numberOfLines={1} style={styles.watchMiniValue}>{value}</Text>
      <Text numberOfLines={1} style={styles.watchMiniDetail}>{detail}</Text>
    </View>
  );
}

function ScreenScroll({ children, stickyFooter }: { children: React.ReactNode; stickyFooter?: React.ReactNode }) {
  return (
    <View style={styles.flex1}>
      <ScrollView style={styles.screen} contentContainerStyle={[styles.screenContent, stickyFooter ? styles.screenContentWithFooter : null]} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {stickyFooter ? <View style={styles.stickyFooter}>{stickyFooter}</View> : null}
    </View>
  );
}

function TopBar({ title, actionLabel, actionAccessibilityLabel, onAction }: { title: string; actionLabel?: string; actionAccessibilityLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.topBar}>
      <Text style={styles.screenTitle}>{title}</Text>
      {actionLabel && onAction ? (
        actionAccessibilityLabel === "Open calendar" ? (
          <TouchableOpacity accessibilityLabel="Open calendar" style={styles.topAction} onPress={onAction}><Text style={styles.topActionText}>{actionLabel}</Text></TouchableOpacity>
        ) : (
          <TouchableOpacity accessibilityLabel={actionAccessibilityLabel ?? actionLabel} style={styles.topAction} onPress={onAction}><Text style={styles.topActionText}>{actionLabel}</Text></TouchableOpacity>
        )
      ) : <View style={styles.topSpacer} />}
    </View>
  );
}

function BackBar({ title, back }: { title: string; back: () => void }) {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity accessibilityLabel="Back" style={styles.iconButton} onPress={back}><ChevronLeft size={22} color={T["--text"]} /></TouchableOpacity>
      <Text style={styles.navTitle}>{title}</Text>
      <View style={styles.topSpacer} />
    </View>
  );
}

function SearchBar({ label }: { label: string }) {
  return (
    <View style={styles.searchBar}>
      <Search size={17} color={T["--muted"]} />
      <Text style={styles.searchPlaceholder}>{label}</Text>
    </View>
  );
}

function ClassCard({ state, klass, selected, onPress, compact = false }: { state: AppState; klass: ClassCourse; selected?: boolean; onPress: () => void; compact?: boolean }) {
  const accent = accentMap[klass.accent];
  const pulse = selectClassPulse(state, klass.id);
  return (
    <TouchableOpacity style={[styles.classCard, selected ? { borderColor: accent.color } : null, compact ? styles.compactClassCard : null]} onPress={onPress}>
      <View style={[styles.classIcon, { backgroundColor: accent.pale }]}>
        <BookOpen size={22} color={accent.color} />
      </View>
      <View style={styles.flex1}>
        <Text style={styles.cardTitle}>{klass.title}</Text>
        <Text style={styles.cardSub}>{klass.professor}</Text>
        <Text style={styles.cardSub}>Room {klass.room} · {klass.days.join("/")} {formatTime(klass.startTime)}</Text>
      </View>
      <Text style={[styles.pulseText, { color: accent.color }]}>{pulse.score}</Text>
    </TouchableOpacity>
  );
}

function TaskCard({ state, task, onPress, selected, compact = false }: { state: AppState; task: Task; onPress: () => void; selected?: boolean; compact?: boolean }) {
  const urgencyColor = task.completed ? T["--mint"] : priorityColor(task.priority);
  return (
    <TouchableOpacity style={[styles.taskCard, selected ? styles.selectedCard : null, compact ? styles.compactTaskCard : null]} onPress={onPress}>
      <View style={[styles.checkbox, { borderColor: urgencyColor }, task.completed ? styles.checkboxDone : null]}>{task.completed ? <Check size={16} color={T["--surface"]} /> : null}</View>
      <View style={styles.flex1}>
        <Text style={[styles.cardTitle, task.completed ? styles.doneText : null]}>{task.title}</Text>
        <Text style={styles.cardSub}>{classTitle(state, task)} · {dueLabel(task)} · {task.reminder}</Text>
      </View>
      <StatPill label={task.type} value={task.priority} accentColor={urgencyColor} />
    </TouchableOpacity>
  );
}

function TaskMiniRow({ task, state }: { task: Task; state: AppState }) {
  return (
    <View style={styles.taskMiniRow}>
      <View style={styles.miniDot} />
      <Text numberOfLines={1} style={styles.cardTitle}>{task.title} · {classTitle(state, task)}</Text>
    </View>
  );
}

function TaskDetail({ state, task, toggle }: { state: AppState; task: Task; toggle: () => void }) {
  return (
    <View>
      <View style={styles.whiteCard}>
        <Text style={styles.detailTitle}>{task.title}</Text>
        <Text style={styles.detailSub}>{classTitle(state, task)}</Text>
        <InfoPill label="Due" value={dueLabel(task)} color={T["--orange"]} />
        <InfoPill label="Priority" value={task.priority} color={T["--rose"]} />
        <InfoPill label="Reminder" value={task.reminder} color={T["--cyan"]} />
        <TouchableOpacity style={styles.primaryButton} onPress={toggle}><Text style={styles.primaryButtonText}>{task.completed ? "Mark open" : "Mark complete"}</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function NoteCard({ state, note, onPress, selected }: { state: AppState; note: Note; onPress: () => void; selected?: boolean }) {
  return (
    <TouchableOpacity style={[styles.noteCard, selected ? styles.selectedCard : null]} onPress={onPress}>
      <FileText size={21} color={T["--violet"]} />
      <View style={styles.flex1}>
        <Text style={styles.cardTitle}>{note.title}</Text>
        <Text style={styles.cardSub}>{selectClassById(state, note.classId)?.title ?? "Class"}</Text>
        <Text numberOfLines={2} style={styles.notePreview}>{note.body}</Text>
      </View>
    </TouchableOpacity>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.sectionLabel}>{title.toUpperCase()}</Text>
      <View style={styles.panelBody}>{children}</View>
    </View>
  );
}

function MiniLine({ text }: { text: string }) {
  return (
    <View style={styles.miniLine}>
      <Check size={16} color={T["--mint"]} />
      <Text style={styles.miniLineText}>{text}</Text>
    </View>
  );
}

function InfoPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { color }]}>{value}</Text>
    </View>
  );
}

function ToggleLine({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.cardTitle}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function LabeledInput({
  label,
  value,
  setValue,
  placeholder,
  multiline = false
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        style={[styles.input, multiline ? styles.textArea : null]}
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor={T["--muted"]}
        multiline={multiline}
      />
    </View>
  );
}

function PickerRow({ label, values, value, onPress }: { label: string; values: string[]; value: string; onPress: (value: string) => void }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <ChipRow values={values} value={value} onPress={onPress} wrap />
    </View>
  );
}

function ChipRow({ values, value, onPress, wrap = false }: { values: readonly string[]; value: string; onPress: (value: string) => void; wrap?: boolean }) {
  return (
    <View style={[styles.chipRow, wrap ? styles.wrap : null]}>
      {values.map((item) => (
        <TouchableOpacity key={item} style={[styles.chip, value === item ? styles.chipActive : null]} onPress={() => onPress(item)}>
          <Text style={[styles.chipText, value === item ? styles.chipTextActive : null]}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function WidgetTypePicker({ value, onPress }: { value: WidgetType; onPress: (value: WidgetType) => void }) {
  return (
    <View style={[styles.chipRow, styles.wrap]}>
      {widgetTypes.map((item) => (
        <TouchableOpacity key={item} style={[styles.chip, value === item ? styles.chipActive : null]} onPress={() => onPress(item)}>
          <Text style={[styles.chipText, value === item ? styles.chipTextActive : null]}>{widgetTypeLabels[item]}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function WatchScreenPicker({ values, value, onPress }: { values: WatchScreen[]; value: WatchScreen; onPress: (value: WatchScreen) => void }) {
  return (
    <View style={[styles.chipRow, styles.wrap]}>
      {values.map((item) => (
        <TouchableOpacity key={item} style={[styles.chip, value === item ? styles.chipActive : null]} onPress={() => onPress(item)}>
          <Text style={[styles.chipText, value === item ? styles.chipTextActive : null]}>{titleCase(item)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function StudioSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.studioSection}>
      <Text style={styles.sectionLabel}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function SliderControl({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <View style={styles.sliderControl}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>{label}</Text>
        <Text style={styles.sliderValue}>{value}</Text>
      </View>
      <View style={styles.sliderRow}>
        <TouchableOpacity accessibilityLabel={`Decrease ${label}`} style={styles.sliderButton} onPress={() => onChange(Math.max(min, value - step))}><Text style={styles.sliderButtonText}>-</Text></TouchableOpacity>
        <View accessibilityRole="adjustable" accessibilityLabel={label} style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${pct}%` }]} />
        </View>
        <TouchableOpacity accessibilityLabel={`Increase ${label}`} style={styles.sliderButton} onPress={() => onChange(Math.min(max, value + step))}><Text style={styles.sliderButtonText}>+</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function StudioSaveBar({ onReset, onSave }: { onReset: () => void; onSave: () => void }) {
  return (
    <View style={styles.saveBar}>
      <TouchableOpacity style={styles.secondaryButton} onPress={onReset}><Text style={styles.secondaryButtonText}>Reset</Text></TouchableOpacity>
      <TouchableOpacity style={styles.primaryButton} onPress={onSave}><Text style={styles.primaryButtonText}>Save</Text></TouchableOpacity>
    </View>
  );
}

function ScheduleRow({ klass, compact = false }: { klass: ClassCourse; compact?: boolean }) {
  return (
    <View style={[styles.scheduleRow, compact ? styles.compactSchedule : null]}>
      <Text style={styles.scheduleTime}>{formatTime(klass.startTime)}</Text>
      <View style={[styles.scheduleRail, { backgroundColor: accentMap[klass.accent].color }]} />
      <View style={styles.flex1}>
        <Text style={styles.scheduleTitle}>{klass.title}</Text>
        <Text style={styles.scheduleSub}>Room {klass.room}</Text>
      </View>
    </View>
  );
}

function Sparkline({ color, small = false }: { color: string; small?: boolean }) {
  const width = small ? 96 : 112;
  const height = small ? 40 : 72;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Polyline points={`4,${height - 12} 24,${height - 28} 46,${height - 20} 68,${height - 36} 92,${height - 30} ${width - 4},14`} fill="none" stroke={color} strokeWidth={small ? 3 : 5} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
      <Line x1="4" y1={height - 8} x2={width - 4} y2={height - 8} stroke={color} strokeOpacity={0.22} strokeWidth="2" />
    </Svg>
  );
}

function MiniBars({ color }: { color: string }) {
  return (
    <View style={styles.miniBars}>
      {[34, 56, 42, 70, 50].map((height, index) => (
        <View key={index} style={[styles.miniBar, { height, backgroundColor: color }]} />
      ))}
    </View>
  );
}

function widgetSizeStyle(size: WidgetSettings["size"]) {
  const map: Record<WidgetSettings["size"], object> = {
    S: { minHeight: 126 },
    M: { minHeight: 162 },
    L: { minHeight: 196 },
    Hero: { minHeight: 236 }
  };
  return map[size];
}

function appIconColor(index: number) {
  return [T["--mint"], T["--surface"], "#48484A", T["--cyan"], "#1C1C1E", "#FFD60A", T["--rose"], T["--blue"]][index % 8];
}

function isPhoneTab(route: Route): route is PhoneTab {
  return ["home", "classes", "tasks", "notes", "profile"].includes(route);
}

function isPadTab(route: Route): route is PadTab {
  return ["home", "classes", "tasks", "notes", "calendar", "profile"].includes(route);
}

function requiresPremiumRoute(route: Route) {
  return route === "scanner" || route === "studio";
}

function labelForTab(tab: PadTab, t: (key: string, fallback?: string) => string) {
  const keyByTab: Record<PadTab, [string, string]> = {
    home: ["tabs.home", "Home"],
    classes: ["tabs.schedule", "Schedule"],
    tasks: ["tabs.tasks", "Tasks"],
    notes: ["tabs.notes", "Notes"],
    calendar: ["tabs.calendar", "Calendar"],
    profile: ["tabs.profile", "Profile"]
  };
  const [key, fallback] = keyByTab[tab];
  return t(key, fallback);
}

function routeForWidget(widgetType: WidgetType): Route {
  if (widgetType === "todayTasks" || widgetType === "studyTime") return "tasks";
  if (widgetType === "weeklyLoad" || widgetType === "upcomingTest") return "calendar";
  return "classDetail";
}

function chunk<TItem>(items: TItem[], size: number) {
  const rows: TItem[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

function filterTasks(state: AppState, filter: string) {
  if (filter === "Completed") return state.tasks.filter((task) => task.completed);
  if (filter === "Later") return state.tasks.filter((task) => !task.completed && taskDueDistance(task) > 7);
  if (filter === "Upcoming") return state.tasks.filter((task) => !task.completed && taskDueDistance(task) > 0 && taskDueDistance(task) <= 7);
  if (filter === "Overdue") return state.tasks.filter((task) => !task.completed && dueLabel(task) === "Overdue");
  return selectTodayTasks(state);
}

function buildTaskSections(state: AppState, filter: string) {
  const sections = [
    { title: "Overdue", tasks: filterTasks(state, "Overdue") },
    { title: "Today", tasks: selectTodayTasks(state).filter((task) => !task.completed) },
    { title: "Upcoming", tasks: filterTasks(state, "Upcoming") },
    { title: "Later", tasks: filterTasks(state, "Later") },
    { title: "Completed", tasks: filterTasks(state, "Completed") }
  ];
  return filter === "All" ? sections.filter((section) => section.tasks.length || section.title === "Today") : sections.filter((section) => section.title === filter);
}

function taskDueDistance(task: Task) {
  const due = new Date(`${task.dueDate}T00:00:00`).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((due - today) / 86400000);
}

function selectDashboardDeadlines(state: AppState) {
  return [...state.tasks]
    .filter((task) => !task.completed)
    .sort((a, b) => `${a.dueDate}${a.dueTime}`.localeCompare(`${b.dueDate}${b.dueTime}`));
}

function buildStudioPresetDraft(state: AppState, current: WidgetDraft, preset: StudioPreset): WidgetDraft {
  const widgetType = preset.patch.widgetType ?? current.widgetType;
  return {
    ...state.widgetSettings[widgetType],
    ...preset.patch,
    widgetType,
    updatedAt: new Date().toISOString()
  };
}

function placementLabelForWidget(widgetType: WidgetType) {
  const labels: Record<WidgetType, string> = {
    nextClass: "Next class",
    todayTasks: "Tasks",
    classPulse: "Pulse",
    weeklyLoad: "Load",
    roomReminder: "Room",
    upcomingTest: "Exam",
    studyTime: "Study"
  };
  return labels[widgetType];
}

function widgetTypeForPlacement(value: string): WidgetType {
  const map: Record<string, WidgetType> = {
    "Next class": "nextClass",
    Tasks: "todayTasks",
    Pulse: "classPulse",
    Load: "weeklyLoad",
    Room: "roomReminder",
    Exam: "upcomingTest",
    Study: "studyTime"
  };
  return map[value] ?? "nextClass";
}

function buildNoteSummary(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "No note body yet.";
  return clean.length > 150 ? `${clean.slice(0, 147)}...` : clean;
}

function buildKeyIdeas(body: string, tags: string) {
  const tagIdeas = tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  const sentenceIdeas = body
    .split(/[.!?]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 12)
    .slice(0, 3);
  return [...sentenceIdeas, ...tagIdeas].slice(0, 4);
}

function appInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "S"}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function noteClassTitle(state: AppState, note: Note) {
  return selectClassById(state, note.classId)?.title ?? "Class";
}

function formatTime(value: string) {
  const [hourText = "0", minuteText = "0"] = value.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 || 12;
  return `${twelve}:${minuteText.padStart(2, "0")} ${suffix}`;
}

function dueToDate(value: string) {
  const today = new Date();
  if (value === "Tomorrow") return offsetDate(today, 1);
  if (value === "Friday") return nextWeekdayDate(today, 5);
  if (value === "Next week") return offsetDate(today, 7);
  return offsetDate(today, 0);
}

function offsetDate(base: Date, days: number) {
  const value = new Date(base);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function nextWeekdayDate(base: Date, weekday: number) {
  const value = new Date(base);
  const distance = (weekday - value.getDay() + 7) % 7 || 7;
  value.setDate(value.getDate() + distance);
  return value.toISOString().slice(0, 10);
}

function reminderMinutes(value: string) {
  if (value === "Off") return 0;
  if (value === "1 hour before") return 60;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 15;
}

function reminderLabel(settings: ReminderSettings) {
  if (!settings.enabled || settings.minutesBefore === 0) return "Off";
  if (settings.minutesBefore === 60) return "1 hour before";
  if ([5, 10, 15, 30].includes(settings.minutesBefore)) return `${settings.minutesBefore} min before`;
  return "Custom";
}

function reminderPatch(value: string): Partial<ReminderSettings> {
  return {
    enabled: value !== "Off",
    minutesBefore: reminderMinutes(value)
  };
}

function priorityColor(priority: Task["priority"]) {
  if (priority === "High") return T["--rose"];
  if (priority === "Medium") return T["--orange"];
  return T["--mint"];
}

function formatLocal(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template
  );
}

function statusLabel(status: string, t: (key: string, fallback?: string) => string) {
  const labels: Record<string, string> = {
    idle: "Ready",
    picking: "Choosing source",
    captured: "Captured",
    queued: "Queued",
    parsing: "Parsing",
    parsed: "Ready to review",
    failed: "Failed",
    retrying: "Retrying",
    reviewed: "Reviewed",
    processing: "Processing",
    ready: "Ready",
    error: "Error",
    applied: "Applied"
  };
  return t(`import.status_${status}`, labels[status] || status);
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T["--bg"] },
  highContrastBg: { backgroundColor: "#FFFFFF" },
  desktopStage: { flex: 1, alignItems: "center", backgroundColor: T["--bg"] },
  appShell: { flex: 1, backgroundColor: T["--bg"], overflow: "hidden" },
  centeredPreview: { borderRadius: 38, borderWidth: Platform.OS === "web" ? 1 : 0, borderColor: T["--line"], shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 28, shadowOffset: { width: 0, height: 16 } },
  app: { flex: 1, backgroundColor: T["--bg"] },
  skeletonStack: { flex: 1, padding: 24, gap: 16, justifyContent: "center" },
  skeletonBar: { borderRadius: 14, backgroundColor: T["--line"], opacity: 0.78 },
  flex1: { flex: 1 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  phoneShell: { flex: 1, backgroundColor: T["--bg"] },
  padShell: { flex: 1, flexDirection: "row", backgroundColor: T["--bg"] },
  padContent: { flex: 1, minWidth: 0 },
  screen: { flex: 1 },
  screenContent: { paddingHorizontal: 18, paddingTop: 64, paddingBottom: 136 },
  screenContentWithFooter: { paddingBottom: 188 },
  padScroll: { flex: 1 },
  padHomeContent: { padding: 24, paddingBottom: 48 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 16 },
  headerText: { flex: 1, minWidth: 0 },
  greeting: { color: T["--text"], fontSize: 32, lineHeight: 38, fontWeight: "900", letterSpacing: 0 },
  subtitle: { color: T["--muted"], fontSize: 16, lineHeight: 22, fontWeight: "700", marginTop: 4, letterSpacing: 0 },
  avatarButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: T["--text"], alignItems: "center", justifyContent: "center" },
  searchBar: { minHeight: 48, borderRadius: 18, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 12 },
  homeSearchWrap: { marginBottom: 2 },
  searchResults: { borderRadius: 20, borderWidth: 1, borderColor: T["--line"], backgroundColor: T["--surface"], padding: 8, marginBottom: 12 },
  searchResultRow: { minHeight: 54, borderRadius: 16, backgroundColor: T["--surface-2"], paddingHorizontal: 12, paddingVertical: 9, marginBottom: 6 },
  searchPlaceholder: { color: T["--muted"], fontSize: 15, fontWeight: "700" },
  searchInput: { flex: 1, minHeight: 46, color: T["--text"], fontSize: 15, fontWeight: "700" },
  editWidgetButton: { minHeight: 44, borderRadius: 22, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 },
  editWidgetText: { color: T["--text"], fontSize: 14, fontWeight: "900" },
  nativeWidgetPill: { minHeight: 36, borderRadius: 18, borderWidth: 1, backgroundColor: T["--surface"], paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  nativeWidgetPillText: { flex: 1, fontSize: 12, fontWeight: "900" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  commandCenterCard: { borderRadius: 30, borderWidth: 1.5, backgroundColor: T["--surface"], padding: 18, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 28, shadowOffset: { width: 0, height: 14 } },
  commandPulse: { color: T["--muted"], fontSize: 12, fontWeight: "900" },
  commandTitle: { color: T["--text"], fontSize: 30, lineHeight: 35, fontWeight: "900", letterSpacing: 0, marginTop: 14 },
  commandSub: { color: T["--muted"], fontSize: 15, lineHeight: 21, fontWeight: "800", marginTop: 4 },
  commandNextTask: { minHeight: 54, borderRadius: 18, backgroundColor: T["--surface-2"], borderWidth: 1, borderColor: T["--line"], paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  commandTaskTitle: { color: T["--text"], fontSize: 15, lineHeight: 20, fontWeight: "900" },
  commandActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  schoolHeroCard: { marginBottom: 12 },
  semesterBar: { height: 8, borderRadius: 4, backgroundColor: T["--line"], overflow: "hidden" },
  semesterBarFill: { height: 8, borderRadius: 4, backgroundColor: T["--text"] },
  homeMetricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  homeMetricCard: { flex: 1, minWidth: "47%", minHeight: 112, borderRadius: 22, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], padding: 14, justifyContent: "space-between" },
  homeMetricValue: { color: T["--text"], fontSize: 27, lineHeight: 32, fontWeight: "900", letterSpacing: 0 },
  homeMetricTitle: { color: T["--text"], fontSize: 13, fontWeight: "900" },
  homeMetricSub: { color: T["--muted"], fontSize: 12, fontWeight: "800" },
  iosWidgetLink: { minHeight: 44, borderRadius: 22, backgroundColor: T["--surface-2"], borderWidth: 1, borderColor: T["--line"], paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  iosWidgetLinkText: { flex: 1, color: T["--text"], fontSize: 13, fontWeight: "900" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 10 },
  sectionLabel: { color: T["--muted"], fontSize: 12, fontWeight: "900", letterSpacing: 0 },
  sectionAction: { color: T["--text"], fontSize: 13, fontWeight: "900" },
  liquidWidget: { overflow: "hidden", padding: 18, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.42)", shadowOffset: { width: 0, height: 14 } },
  liquidBackdrop: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  widgetHighlight: { position: "absolute", left: 12, right: 12, top: 10, height: 1, backgroundColor: "rgba(255,255,255,0.58)" },
  widgetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  widgetEyebrow: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "900", letterSpacing: 0 },
  widgetStatus: { color: T["--surface"], fontSize: 12, fontWeight: "900", borderWidth: 1, borderColor: "rgba(255,255,255,0.36)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  widgetMain: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 18 },
  widgetValue: { color: T["--surface"], fontSize: 38, lineHeight: 43, fontWeight: "900", letterSpacing: 0 },
  widgetTitle: { color: T["--surface"], fontSize: 21, lineHeight: 26, fontWeight: "900", marginTop: 3, letterSpacing: 0 },
  widgetCopy: { color: "rgba(255,255,255,0.88)", fontSize: 14, lineHeight: 20, fontWeight: "700", marginTop: 6 },
  widgetDivider: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.24)", marginTop: 14, paddingTop: 10, gap: 5 },
  widgetItem: { color: "rgba(255,255,255,0.94)", fontSize: 13, fontWeight: "800" },
  miniBars: { width: 100, height: 78, flexDirection: "row", alignItems: "flex-end", gap: 7, opacity: 0.92 },
  miniBar: { flex: 1, borderRadius: 8 },
  scheduleRow: { minHeight: 72, borderRadius: 22, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  compactSchedule: { minHeight: 62, padding: 12 },
  scheduleTime: { width: 72, color: T["--text"], fontSize: 14, fontWeight: "900" },
  scheduleRail: { width: 4, height: 42, borderRadius: 2 },
  scheduleTitle: { color: T["--text"], fontSize: 16, fontWeight: "900", letterSpacing: 0 },
  scheduleSub: { color: T["--muted"], fontSize: 13, fontWeight: "700", marginTop: 3 },
  aiSuggestionCard: { minHeight: 70, borderRadius: 22, backgroundColor: "#F5FAFF", borderWidth: 1, borderColor: "#DCEBFF", padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  scheduleHeroCard: { borderRadius: 28, borderWidth: 1, borderColor: "#DCEBFF", backgroundColor: "#F3F8FF", padding: 18, marginBottom: 12, shadowColor: T["--blue"], shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  nowPill: { alignSelf: "flex-start", overflow: "hidden", borderRadius: 14, backgroundColor: T["--blue"], color: T["--surface"], paddingHorizontal: 12, paddingVertical: 5, fontSize: 12, fontWeight: "900" },
  scheduleHeroTitle: { color: T["--text"], fontSize: 29, lineHeight: 35, fontWeight: "900", letterSpacing: 0, marginTop: 12 },
  scheduleHeroSub: { color: T["--text"], fontSize: 16, lineHeight: 22, fontWeight: "700", marginTop: 2 },
  heroMetricRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  heroMetric: { overflow: "hidden", borderRadius: 14, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], color: T["--text"], paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontWeight: "900" },
  summaryGrid: { flexDirection: "row", gap: 10, marginBottom: 12 },
  summaryCard: { flex: 1, minHeight: 104, borderRadius: 22, borderWidth: 1, borderColor: T["--line"], backgroundColor: T["--surface"], padding: 14 },
  summaryTitle: { color: T["--text"], fontSize: 15, fontWeight: "900" },
  summaryValue: { color: T["--text"], fontSize: 34, lineHeight: 40, fontWeight: "900", marginTop: 8 },
  nextClassCard: { marginBottom: 4 },
  studyProgressCard: { marginBottom: 4 },
  tabBar: { position: "absolute", left: 0, right: 0, bottom: 0, height: 86, paddingHorizontal: 6, paddingTop: 9, borderTopWidth: 1, borderTopColor: T["--line"], backgroundColor: "rgba(255,255,255,0.96)", flexDirection: "row", zIndex: 10 },
  tabItem: { flex: 1, alignItems: "center", gap: 4, minHeight: 56 },
  tabLabel: { color: T["--muted"], fontSize: 11, fontWeight: "800" },
  tabLabelActive: { color: T["--text"] },
  fab: { position: "absolute", right: 22, bottom: 96, width: 62, height: 62, borderRadius: 31, backgroundColor: T["--text"], alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, zIndex: 20 },
  padFab: { bottom: 26 },
  toast: { position: "absolute", bottom: 112, alignSelf: "center", backgroundColor: T["--text"], borderRadius: 18, paddingHorizontal: 18, paddingVertical: 10, zIndex: 40 },
  toastText: { color: T["--surface"], fontSize: 14, fontWeight: "900" },
  sidebar: { width: 204, padding: 18, paddingTop: 24, borderRightWidth: 1, borderRightColor: T["--line"], backgroundColor: T["--surface"] },
  sidebarTitle: { color: T["--text"], fontSize: 23, fontWeight: "900", marginBottom: 22, letterSpacing: 0 },
  sidebarItem: { minHeight: 48, borderRadius: 18, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  sidebarItemActive: { backgroundColor: T["--text"] },
  sidebarLabel: { color: T["--muted"], fontSize: 15, fontWeight: "900" },
  sidebarLabelActive: { color: T["--surface"] },
  padHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 18 },
  padTitle: { color: T["--text"], fontSize: 36, lineHeight: 42, fontWeight: "900", letterSpacing: 0 },
  padPaneTitle: { color: T["--text"], fontSize: 22, fontWeight: "900", marginBottom: 14, letterSpacing: 0 },
  blackPillButton: { minHeight: 46, borderRadius: 23, paddingHorizontal: 16, backgroundColor: T["--text"], flexDirection: "row", alignItems: "center", gap: 8 },
  blackPillText: { color: T["--surface"], fontSize: 14, fontWeight: "900" },
  padDashboardGrid: { flexDirection: "row", gap: 18, alignItems: "flex-start" },
  padDashboardStack: { flexDirection: "column" },
  padMainGrid: { flex: 1, minWidth: 0 },
  padTwoCol: { flexDirection: "row", gap: 14 },
  padRail: { width: 306 },
  padRailStack: { width: "100%" },
  panel: { marginBottom: 14 },
  panelBody: { marginTop: 8 },
  whiteCard: { backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], borderRadius: 26, padding: 18, marginBottom: 14 },
  topBar: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 },
  screenTitle: { color: T["--text"], fontSize: 34, lineHeight: 40, fontWeight: "900", letterSpacing: 0 },
  navTitle: { flex: 1, textAlign: "center", color: T["--text"], fontSize: 18, fontWeight: "900" },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], alignItems: "center", justifyContent: "center" },
  topAction: { minHeight: 40, borderRadius: 20, paddingHorizontal: 14, backgroundColor: T["--text"], alignItems: "center", justifyContent: "center" },
  topActionText: { color: T["--surface"], fontSize: 13, fontWeight: "900" },
  topSpacer: { width: 44, height: 44 },
  classCard: { minHeight: 96, borderRadius: 24, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], padding: 14, flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 10 },
  compactClassCard: { minHeight: 86 },
  classIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: T["--text"], fontSize: 16, lineHeight: 21, fontWeight: "900", letterSpacing: 0 },
  cardSub: { color: T["--muted"], fontSize: 13, lineHeight: 18, fontWeight: "700", marginTop: 2 },
  pulseText: { fontSize: 21, fontWeight: "900" },
  splitView: { flex: 1, flexDirection: "row", gap: 0 },
  masterPane: { width: 330, padding: 20, borderRightWidth: 1, borderRightColor: T["--line"], backgroundColor: T["--bg"] },
  detailPane: { flex: 1 },
  detailContent: { padding: 24, paddingBottom: 48 },
  detailTitle: { color: T["--text"], fontSize: 30, lineHeight: 36, fontWeight: "900", letterSpacing: 0 },
  detailSub: { color: T["--muted"], fontSize: 16, fontWeight: "700", marginTop: 4, marginBottom: 12 },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  infoPill: { minWidth: 136, flex: 1, backgroundColor: T["--surface-2"], borderRadius: 18, padding: 13, marginTop: 10 },
  infoLabel: { color: T["--muted"], fontSize: 11, fontWeight: "900", marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: "900" },
  miniLine: { minHeight: 42, borderRadius: 18, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 8 },
  miniLineText: { color: T["--text"], fontSize: 15, fontWeight: "800", flex: 1 },
  toggleRow: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14, borderRadius: 18, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], paddingHorizontal: 14, marginTop: 10 },
  notificationPreview: { borderRadius: 18, backgroundColor: T["--text"], padding: 14, marginTop: 10 },
  notificationTitle: { color: T["--surface"], fontSize: 15, fontWeight: "900" },
  notificationSub: { color: "#CFD3DA", fontSize: 13, fontWeight: "700", marginTop: 4 },
  taskCard: { minHeight: 76, borderRadius: 22, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  compactTaskCard: { minHeight: 68 },
  selectedCard: { borderColor: T["--blue"], backgroundColor: "#FBFDFF" },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: T["--line"], alignItems: "center", justifyContent: "center" },
  checkboxDone: { backgroundColor: T["--mint"], borderColor: T["--mint"] },
  doneText: { color: T["--muted"], textDecorationLine: "line-through" },
  priorityPill: { color: T["--muted"], backgroundColor: T["--surface-2"], borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: "900", overflow: "hidden" },
  priorityHigh: { color: T["--rose"] },
  taskMiniRow: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: T["--line"] },
  miniDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: T["--orange"] },
  formCard: { backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], borderRadius: 26, padding: 16, marginBottom: 16 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { color: T["--muted"], fontSize: 12, fontWeight: "900", marginBottom: 8 },
  input: { minHeight: 48, borderRadius: 17, backgroundColor: T["--surface-2"], borderWidth: 1, borderColor: T["--line"], paddingHorizontal: 14, color: T["--text"], fontSize: 15, fontWeight: "700" },
  textArea: { minHeight: 150, paddingTop: 13, textAlignVertical: "top" },
  scanTextArea: { minHeight: 136, paddingTop: 13, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  wrap: { flexWrap: "wrap" },
  chip: { minHeight: 38, borderRadius: 19, paddingHorizontal: 13, alignItems: "center", justifyContent: "center", backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"] },
  chipActive: { backgroundColor: T["--text"], borderColor: T["--text"] },
  chipText: { color: T["--muted"], fontSize: 13, fontWeight: "900" },
  chipTextActive: { color: T["--surface"] },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  smartOutput: { color: T["--muted"], fontSize: 14, fontWeight: "700", lineHeight: 20, marginTop: 10 },
  smartCardRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  smartNoteCard: { flex: 1, minHeight: 164, borderRadius: 22, borderWidth: 1, borderColor: T["--line"], backgroundColor: T["--surface"], padding: 14, gap: 8 },
  smartNoteCardPrimary: { backgroundColor: "#F0FBFF", borderColor: "#CDEFFF" },
  smartCardKicker: { color: T["--cyan"], fontSize: 12, fontWeight: "900" },
  smartCardTitle: { color: T["--text"], fontSize: 18, lineHeight: 23, fontWeight: "900" },
  smartIdeaPill: { alignSelf: "flex-start", overflow: "hidden", borderRadius: 12, backgroundColor: "#EAFBF3", color: T["--mint"], paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: "900" },
  reviewButton: { minHeight: 36, borderRadius: 14, backgroundColor: T["--cyan"], alignItems: "center", justifyContent: "center", marginTop: "auto" },
  reviewButtonText: { color: T["--surface"], fontSize: 13, fontWeight: "900" },
  classNoteRow: { minHeight: 62, borderRadius: 18, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], padding: 12, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  countPill: { minWidth: 28, height: 28, borderRadius: 14, overflow: "hidden", textAlign: "center", lineHeight: 28, fontSize: 12, fontWeight: "900" },
  noteRow: { minHeight: 78, borderRadius: 20, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], padding: 12, flexDirection: "row", gap: 12, marginBottom: 10 },
  recentNoteCard: { minHeight: 202, borderRadius: 24, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], padding: 14, flexDirection: "row", gap: 12, marginBottom: 10 },
  noteStatusDot: { fontSize: 16, fontWeight: "900" },
  noteSummaryLabel: { color: T["--muted"], fontSize: 11, fontWeight: "900", marginTop: 12 },
  recentNoteSummary: { color: T["--text"], fontSize: 14, lineHeight: 20, fontWeight: "700", marginTop: 4 },
  noteActionBar: { minHeight: 60, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: T["--line"], flexDirection: "row", marginTop: 12, backgroundColor: T["--surface"] },
  noteActionButton: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: T["--line"] },
  noteActionText: { color: T["--text"], fontSize: 11, lineHeight: 14, fontWeight: "900", textAlign: "center" },
  notesDock: { minHeight: 58, borderRadius: 25, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], flexDirection: "row", gap: 10, padding: 7, marginBottom: 14 },
  dockButton: { flex: 1, borderRadius: 18, backgroundColor: "#F6FEFF", borderWidth: 1, borderColor: "#DDF5F8", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  dockButtonText: { color: T["--cyan"], fontSize: 14, fontWeight: "900" },
  scanNoteCard: { minHeight: 74, borderRadius: 22, backgroundColor: "#EDF3FF", borderWidth: 1, borderColor: "#D9E6FF", padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  noteCard: { minHeight: 86, borderRadius: 22, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], padding: 14, flexDirection: "row", gap: 12, marginBottom: 10 },
  notePreview: { color: T["--muted"], fontSize: 13, lineHeight: 18, fontWeight: "700", marginTop: 6 },
  ipadScanner: { flex: 1, flexDirection: "row" },
  scannerPreviewPane: { flex: 1 },
  scannerReviewPane: { width: 340, padding: 20, borderLeftWidth: 1, borderLeftColor: T["--line"] },
  scanChoiceRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  cameraCard: { height: 318, borderRadius: 32, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], alignItems: "center", justifyContent: "center", marginBottom: 14, overflow: "hidden" },
  padCameraCard: { height: 520 },
  scanFrame: { width: "78%", height: "62%", borderRadius: 28, borderWidth: 2, borderColor: T["--blue"], backgroundColor: "rgba(47,107,255,0.08)", alignItems: "center", justifyContent: "center" },
  scanCornerTop: { position: "absolute", left: 18, right: 18, top: 18, height: 2, backgroundColor: "rgba(47,107,255,0.45)" },
  scanCornerBottom: { position: "absolute", left: 18, right: 18, bottom: 18, height: 2, backgroundColor: "rgba(47,107,255,0.45)" },
  cameraTitle: { color: T["--text"], fontSize: 18, fontWeight: "900", marginTop: 14 },
  cameraSub: { color: T["--muted"], fontSize: 13, lineHeight: 18, fontWeight: "700", textAlign: "center", paddingHorizontal: 24, marginTop: 8 },
  disabledButton: { opacity: 0.58 },
  disabledButtonText: { color: T["--muted"], fontSize: 13, fontWeight: "900", textAlign: "center" },
  progressStep: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 34 },
  progressDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: T["--line"] },
  progressDone: { backgroundColor: T["--blue"] },
  progressText: { color: T["--muted"], fontSize: 14, fontWeight: "800" },
  readyText: { color: T["--text"], fontSize: 25, fontWeight: "900", marginTop: 14 },
  scannerReviewList: { marginTop: 12, marginBottom: 10 },
  calendarSurface: { backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], borderRadius: 28, padding: 18, marginTop: 14 },
  segmentStatic: { height: 42, borderRadius: 21, backgroundColor: T["--surface-2"], borderWidth: 1, borderColor: T["--line"], padding: 4, flexDirection: "row", gap: 4, marginBottom: 14 },
  segmentStaticActive: { flex: 1, textAlign: "center", borderRadius: 17, backgroundColor: T["--surface"], color: T["--text"], fontSize: 13, fontWeight: "900", paddingTop: 8, overflow: "hidden" },
  segmentStaticText: { flex: 1, textAlign: "center", color: T["--muted"], fontSize: 13, fontWeight: "900", paddingTop: 8 },
  calendarBlock: { minHeight: 78, borderRadius: 22, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], borderLeftWidth: 5, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  calendarBlockCompact: { minHeight: 66 },
  calendarTime: { width: 76, color: T["--text"], fontSize: 14, fontWeight: "900" },
  calendarTitle: { color: T["--text"], fontSize: 16, fontWeight: "900" },
  calendarSub: { color: T["--muted"], fontSize: 13, fontWeight: "700", marginTop: 3 },
  profileHero: { alignItems: "center", backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], borderRadius: 28, padding: 22, marginBottom: 14 },
  profileStatsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 10 },
  profileAvatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: T["--text"], alignItems: "center", justifyContent: "center", marginBottom: 12 },
  profileInitials: { color: T["--surface"], fontSize: 25, fontWeight: "900" },
  iosPreviewScreen: { flex: 1, backgroundColor: "#111827", overflow: "hidden" },
  previewWallpaper: { ...StyleSheet.absoluteFillObject, backgroundColor: "#7057C9" },
  lockWallpaper: { ...StyleSheet.absoluteFillObject, backgroundColor: "#20375F" },
  previewTopBar: { position: "absolute", top: 52, left: 16, right: 16, zIndex: 5, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  previewBackButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  previewTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900", textShadowColor: "rgba(0,0,0,0.28)", textShadowRadius: 8 },
  previewSpacer: { width: 40, height: 40 },
  homePreviewContent: { paddingTop: 112, paddingHorizontal: 20, paddingBottom: 126 },
  homePreviewGrid: { flexDirection: "row", gap: 14, marginBottom: 14 },
  homePreviewLargeWidget: { flex: 1 },
  homePreviewSmallStack: { flex: 1, gap: 14 },
  homeSmallWidget: { flex: 1, minHeight: 112, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.92)", padding: 14, justifyContent: "space-between", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  homeSmallLabel: { color: "#555B66", fontSize: 12, fontWeight: "900" },
  homeSmallValue: { color: T["--orange"], fontSize: 31, lineHeight: 35, fontWeight: "900" },
  homeSmallSub: { color: "#656B75", fontSize: 12, fontWeight: "800" },
  homePreviewWideWidget: { marginBottom: 16 },
  appIconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  appIconWrap: { width: "22%", alignItems: "center", gap: 6, marginBottom: 8 },
  studyPlannerIcon: { width: 58, height: 58, borderRadius: 16, backgroundColor: T["--blue"], alignItems: "center", justifyContent: "center" },
  genericAppIcon: { width: 58, height: 58, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.34)" },
  appIconLabel: { color: "#FFFFFF", fontSize: 10, fontWeight: "800", textAlign: "center", textShadowColor: "rgba(0,0,0,0.32)", textShadowRadius: 5 },
  homeDock: { position: "absolute", left: 18, right: 18, bottom: 24, height: 86, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.26)", flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 16 },
  dockIcon: { width: 58, height: 58, borderRadius: 16 },
  lockPreviewContent: { flex: 1, paddingTop: 110, paddingHorizontal: 22, alignItems: "center" },
  lockWidgetRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  lockChip: { minWidth: 76, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.17)", paddingHorizontal: 13, paddingVertical: 10, alignItems: "center" },
  lockChipValue: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  lockChipLabel: { color: "rgba(255,255,255,0.76)", fontSize: 10, fontWeight: "800", marginTop: 2 },
  lockDate: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", textShadowColor: "rgba(0,0,0,0.28)", textShadowRadius: 8 },
  lockClock: { color: "#FFFFFF", fontSize: 88, lineHeight: 96, fontWeight: "800", letterSpacing: 0, textShadowColor: "rgba(0,0,0,0.28)", textShadowRadius: 12 },
  lockInlineWidget: { borderRadius: 18, backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 14, paddingVertical: 7, marginTop: 8 },
  lockInlineText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  liveActivityCard: { position: "absolute", left: 22, right: 22, bottom: 126, borderRadius: 24, backgroundColor: "rgba(12,15,24,0.68)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)", padding: 15, flexDirection: "row", alignItems: "center", gap: 12 },
  liveActivityIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: T["--mint"], alignItems: "center", justifyContent: "center" },
  liveActivityTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  liveActivitySub: { color: "rgba(255,255,255,0.78)", fontSize: 13, fontWeight: "700", marginTop: 2 },
  liveActivityTime: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  lockWidgetPreview: { position: "absolute", left: 22, right: 22, bottom: 18 },
  themePreviewCard: { borderRadius: 28, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], padding: 18, marginBottom: 16 },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  themeSwatchCard: { width: "48%", borderRadius: 20, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], padding: 13 },
  themeSwatch: { height: 54, borderRadius: 15, marginBottom: 10 },
  watchAccessButton: { minHeight: 50, borderRadius: 25, backgroundColor: T["--text"], alignItems: "center", justifyContent: "center" },
  watchFrame: { alignSelf: "center", width: 224, height: 280, borderRadius: 52, backgroundColor: "#050506", padding: 12, marginTop: 16, borderWidth: 6, borderColor: "#17181B", shadowColor: "#000", shadowOpacity: 0.26, shadowRadius: 26, shadowOffset: { width: 0, height: 16 } },
  watchScreen: { flex: 1, borderRadius: 40, backgroundColor: "#000000", overflow: "hidden", padding: 10 },
  watchContent: { flex: 1, gap: 8 },
  watchHeader: { color: "#BFC5D0", fontSize: 13, fontWeight: "900" },
  watchLarge: { color: "#FFFFFF", fontSize: 34, lineHeight: 38, fontWeight: "900" },
  watchText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  watchSub: { color: "#AEB5C2", fontSize: 12, lineHeight: 16, fontWeight: "700" },
  watchButton: { minHeight: 34, borderRadius: 17, backgroundColor: T["--blue"], alignItems: "center", justifyContent: "center", marginTop: "auto" },
  watchButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  watchMiniCard: { borderWidth: 1, borderRadius: 16, padding: 9, minHeight: 66, justifyContent: "center" },
  watchMiniTitle: { color: "#D4D8E0", fontSize: 10, fontWeight: "900" },
  watchMiniValue: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", marginTop: 3 },
  watchMiniDetail: { color: "#B7BDC8", fontSize: 10, fontWeight: "800", marginTop: 2 },
  watchTask: { minHeight: 42, borderRadius: 14, backgroundColor: "#15171C", paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 8 },
  watchTaskDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: T["--orange"] },
  watchTaskText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", flex: 1 },
  watchGrid: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  studioPreviewTop: { marginBottom: 4 },
  studioHeroCopy: { borderRadius: 22, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], padding: 14, marginTop: 8 },
  studioSection: { marginTop: 16 },
  widgetBackedLine: { minHeight: 34, borderRadius: 17, backgroundColor: T["--surface-2"], borderWidth: 1, borderColor: T["--line"], paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 4 },
  widgetBackedText: { flex: 1, color: T["--muted"], fontSize: 12, lineHeight: 16, fontWeight: "800" },
  colorDots: { flexDirection: "row", gap: 12, marginTop: 10, flexWrap: "wrap" },
  colorDot: { width: 38, height: 38, borderRadius: 19, borderWidth: 3, borderColor: T["--surface"] },
  colorDotActive: { borderColor: T["--text"] },
  sliderControl: { backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], borderRadius: 20, padding: 14, marginTop: 10 },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  sliderButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: T["--text"], alignItems: "center", justifyContent: "center" },
  sliderButtonText: { color: T["--surface"], fontSize: 19, fontWeight: "900" },
  sliderTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: T["--line"], overflow: "hidden" },
  sliderFill: { height: 8, borderRadius: 4, backgroundColor: T["--text"] },
  sliderValue: { color: T["--text"], fontSize: 16, fontWeight: "900" },
  studioButtons: { flexDirection: "row", gap: 10, marginTop: 16 },
  studioPresetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  studioPresetCard: { width: "48%", minHeight: 118, borderRadius: 20, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], padding: 13, gap: 7 },
  primaryButton: { flex: 1, minHeight: 52, borderRadius: 26, backgroundColor: T["--text"], alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  primaryButtonText: { color: T["--surface"], fontSize: 15, fontWeight: "900" },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: 24, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  secondaryButtonText: { color: T["--text"], fontSize: 14, fontWeight: "900" },
  stickyFooter: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 22, backgroundColor: "rgba(247,247,248,0.96)", borderTopWidth: 1, borderTopColor: T["--line"] },
  saveBar: { flexDirection: "row", gap: 10 },
  studioPad: { flex: 1, flexDirection: "row" },
  studioLibrary: { width: 250, padding: 20, borderRightWidth: 1, borderRightColor: T["--line"], backgroundColor: T["--surface"] },
  studioCanvas: { flex: 1 },
  studioCanvasContent: { padding: 24, paddingBottom: 40 },
  studioInspector: { width: 330, borderLeftWidth: 1, borderLeftColor: T["--line"], backgroundColor: T["--bg"] },
  inspectorContent: { padding: 20, paddingBottom: 40 },
  libraryItem: { minHeight: 48, borderRadius: 17, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  libraryItemActive: { backgroundColor: T["--surface-2"] },
  libraryDot: { width: 12, height: 12, borderRadius: 6 },
  libraryText: { color: T["--text"], fontSize: 14, fontWeight: "900" },
  closeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], alignItems: "center", justifyContent: "center" },
  previewDashboard: { flexDirection: "row", gap: 14 },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  modalRootPad: { justifyContent: "center", alignItems: "center" },
  modalScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.28)" },
  actionSheet: { backgroundColor: T["--surface"], borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
  actionPopover: { width: 440, borderRadius: 30, paddingBottom: 20 },
  sheetGrab: { width: 42, height: 5, borderRadius: 3, backgroundColor: T["--line"], alignSelf: "center", marginBottom: 14 },
  sheetTitle: { color: T["--text"], fontSize: 24, fontWeight: "900" },
  sheetCopy: { color: T["--muted"], fontSize: 14, fontWeight: "700", marginTop: 3 },
  sheetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  sheetItem: { width: "48%", minHeight: 96, borderRadius: 22, borderWidth: 1, borderColor: T["--line"], padding: 13, backgroundColor: T["--surface"] },
  sheetIcon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  sheetItemText: { color: T["--text"], fontSize: 14, fontWeight: "900" },
  smallBlackButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: T["--text"], alignItems: "center", justifyContent: "center" }
});
