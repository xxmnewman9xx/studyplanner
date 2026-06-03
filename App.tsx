import React, { useEffect, useMemo, useState } from "react";
import {
  LogBox,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
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
  selectClassPulse,
  selectComplicationModels,
  selectHomeDashboardModel,
  selectIpadDashboardModel,
  selectNotesByClass,
  selectRoomReminder,
  selectTasksByClass,
  selectTodayClasses,
  selectTodayTasks,
  selectWatchNotificationModel,
  selectWatchPulseModel,
  selectWatchRoomModel,
  selectWatchTasksModel,
  selectWatchTodayModel,
  type Accent,
  type AppSettings,
  type AppState,
  type ClassCourse,
  type Note,
  type ReminderSettings,
  type StudyPlannerActions,
  type Task,
  type WidgetSettings,
  type WidgetType,
  type WatchScreen,
  widgetTypes,
  useStudyPlannerStore
} from "./src/core";

LogBox.ignoreLogs(["RCTScrollViewComponentView implements focusItemsInRect"]);

type PhoneTab = "home" | "classes" | "tasks" | "notes" | "profile";
type PadTab = PhoneTab | "calendar";
type Route =
  | PadTab
  | "studio"
  | "scanner"
  | "classDetail"
  | "addTask"
  | "noteEditor"
  | "watchPreview";

type WidgetDraft = WidgetSettings;

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

export default function App() {
  const { state, actions } = useStudyPlannerStore();
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
  const settings = state.appSettings;
  const scale = settings.largerText ? 1.06 : 1;
  const homeModel = useMemo(() => selectHomeDashboardModel(state), [state]);
  const ipadModel = useMemo(() => selectIpadDashboardModel(state), [state]);

  const go = (next: Route) => {
    setSheetOpen(false);
    setRoute(next);
    if (isPadTab(next)) setActiveTab(next);
    if (isPhoneTab(next)) setActiveTab(next);
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
    selectedClass,
    setSelectedClass,
    selectedTask,
    setSelectedTask,
    selectedNote,
    setSelectedNote,
    notify
  };

  return (
    <SafeAreaView style={[styles.safe, settings.highContrast ? styles.highContrastBg : null]}>
      <StatusBar style="dark" />
      <View style={[styles.desktopStage, viewport.width > 1420 ? { paddingVertical: 18 } : null]}>
        <View style={[styles.appShell, { width: previewWidth }, viewport.width > 1420 ? styles.centeredPreview : null]}>
          <View style={[styles.app, settings.largerText ? { transform: [{ scale }] } : null]}>
            {isPad ? (
              <IPadShell {...shared} route={route} activeTab={activeTab} />
            ) : (
              <IPhoneShell {...shared} route={route} activeTab={activeTab as PhoneTab} />
            )}
            <TouchableOpacity accessibilityLabel="Quick add" style={[styles.fab, isPad ? styles.padFab : null]} onPress={() => setSheetOpen(true)} activeOpacity={0.84}>
              <Plus size={28} color={T["--surface"]} />
            </TouchableOpacity>
            {toast ? (
              <View style={styles.toast}>
                <Text style={styles.toastText}>{toast}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
      <ActionSheet open={sheetOpen} isPad={isPad} close={() => setSheetOpen(false)} go={go} />
    </SafeAreaView>
  );
}

function IPhoneShell(props: ShellProps & { route: Route; activeTab: PhoneTab }) {
  const content = renderPhoneRoute(props.route, props);
  return (
    <View style={styles.phoneShell}>
      {content}
      <PhoneTabBar active={props.activeTab} go={props.go} />
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
  if (route === "calendar") return <CalendarScreen {...props} />;
  if (route === "classDetail") return <ClassDetailScreen {...props} />;
  if (route === "addTask") return <AddTaskScreen {...props} />;
  if (route === "noteEditor") return <NoteEditorScreen {...props} />;
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
  return <WatchPreview {...props} />;
}

function HomeDashboard({ go, state, homeModel, settings }: ShellProps) {
  const schedule = selectTodayClasses(state);
  return (
    <ScreenScroll>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Good morning, {homeModel.student.name.split(" ")[0]}</Text>
          <Text style={styles.subtitle}>You have {homeModel.todayClasses.length} classes and {homeModel.taskCountToday} tasks today.</Text>
        </View>
        <TouchableOpacity accessibilityLabel="Open profile" style={styles.avatarButton} onPress={() => go("profile")}>
          <User size={22} color={T["--surface"]} />
        </TouchableOpacity>
      </View>
      <SearchBar label="Search classes, tasks, notes" />
      <TouchableOpacity accessibilityLabel="Edit widgets" style={styles.editWidgetButton} onPress={() => go("studio")}>
        <SlidersHorizontal size={18} color={T["--text"]} />
        <Text style={styles.editWidgetText}>Edit widgets</Text>
      </TouchableOpacity>

      <LiquidWidget type="nextClass" state={state} styleConfig={state.widgetSettings.nextClass} settings={settings} onPress={() => go("classDetail")} />
      <LiquidWidget type="todayTasks" state={state} styleConfig={state.widgetSettings.todayTasks} settings={settings} onPress={() => go("tasks")} />
      <LiquidWidget type="classPulse" state={state} styleConfig={state.widgetSettings.classPulse} settings={settings} onPress={() => go("classDetail")} />
      <LiquidWidget type="weeklyLoad" state={state} styleConfig={state.widgetSettings.weeklyLoad} settings={settings} onPress={() => go("calendar")} />
      <LiquidWidget type="roomReminder" state={state} styleConfig={state.widgetSettings.roomReminder} settings={settings} onPress={() => go("classDetail")} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>DAILY SCHEDULE</Text>
        <TouchableOpacity accessibilityLabel="Open calendar" onPress={() => go("calendar")}>
          <Text style={styles.sectionAction}>Calendar</Text>
        </TouchableOpacity>
      </View>
      {schedule.map((item) => (
        <ScheduleRow key={`${item.startTime}-${item.title}`} klass={item} />
      ))}
    </ScreenScroll>
  );
}

function IPadHome(props: ShellProps) {
  const viewport = useWindowDimensions();
  const narrowPad = viewport.width < 900;
  const schedule = selectTodayClasses(props.state);
  return (
    <ScrollView style={styles.padScroll} contentContainerStyle={styles.padHomeContent} showsVerticalScrollIndicator={false}>
      <View style={styles.padHeader}>
        <View>
          <Text style={styles.padTitle}>Good morning, {props.ipadModel.student.name.split(" ")[0]}</Text>
          <Text style={styles.subtitle}>Your classes, rooms, tasks, and reminders are lined up.</Text>
        </View>
        <TouchableOpacity style={styles.blackPillButton} onPress={() => props.go("studio")}>
          <Grid2X2 size={18} color={T["--surface"]} />
          <Text style={styles.blackPillText}>Widget Studio</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.padDashboardGrid, narrowPad ? styles.padDashboardStack : null]}>
        <View style={styles.padMainGrid}>
          <LiquidWidget type="nextClass" state={props.state} styleConfig={props.state.widgetSettings.nextClass} settings={props.settings} onPress={() => props.go("classDetail")} />
          <View style={styles.padTwoCol}>
            <LiquidWidget type="todayTasks" state={props.state} styleConfig={props.state.widgetSettings.todayTasks} settings={props.settings} onPress={() => props.go("tasks")} />
            <LiquidWidget type="classPulse" state={props.state} styleConfig={props.state.widgetSettings.classPulse} settings={props.settings} onPress={() => props.go("classes")} />
          </View>
          <View style={styles.padTwoCol}>
            <LiquidWidget type="weeklyLoad" state={props.state} styleConfig={props.state.widgetSettings.weeklyLoad} settings={props.settings} onPress={() => props.go("calendar")} />
            <LiquidWidget type="roomReminder" state={props.state} styleConfig={props.state.widgetSettings.roomReminder} settings={props.settings} onPress={() => props.go("classDetail")} />
          </View>
        </View>
        <View style={[styles.padRail, narrowPad ? styles.padRailStack : null]}>
          <Panel title="Schedule Rail">
            {schedule.map((item) => (
              <ScheduleRow key={`${item.startTime}-pad`} klass={item} compact />
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

function WidgetStudio({ state, actions, go, notify, settings }: ShellProps) {
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
    notify("Widget saved");
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
      <StudioControls draft={draft} updateDraft={updateDraft} reset={reset} save={save} />
    </ScreenScroll>
  );
}

function IPadWidgetStudio({ state, actions, go, notify, settings }: ShellProps) {
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
    notify("Widget saved");
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
        <Text style={styles.padTitle}>Live Dashboard Preview</Text>
        <LiquidWidget type={draft.widgetType} state={state} styleConfig={draft} settings={settings} />
        <View style={styles.previewDashboard}>
          <LiquidWidget type="todayTasks" state={state} styleConfig={state.widgetSettings.todayTasks} settings={settings} />
          <LiquidWidget type="classPulse" state={state} styleConfig={state.widgetSettings.classPulse} settings={settings} />
        </View>
      </ScrollView>
      <ScrollView style={styles.studioInspector} contentContainerStyle={styles.inspectorContent}>
        <View style={styles.rowBetween}>
          <Text style={styles.padPaneTitle}>Inspector</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => go("home")}><X size={18} color={T["--text"]} /></TouchableOpacity>
        </View>
        <StudioControls draft={draft} updateDraft={updateDraft} reset={reset} save={save} />
      </ScrollView>
    </View>
  );
}

function StudioControls({
  draft,
  updateDraft,
  reset,
  save
}: {
  draft: WidgetDraft;
  updateDraft: <K extends keyof WidgetDraft>(key: K, value: WidgetDraft[K]) => void;
  reset: () => void;
  save: () => void;
}) {
  return (
    <View>
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

function ClassesScreen(props: ShellProps) {
  const todays = selectTodayClasses(props.state);
  const ordered = todays.concat(props.state.classes.filter((klass) => !todays.some((today) => today.id === klass.id)));
  return (
    <ScreenScroll>
      <TopBar title="Classes" actionLabel="Calendar" onAction={() => props.go("calendar")} />
      {ordered.map((klass) => (
        <ClassCard key={klass.id} state={props.state} klass={klass} selected={props.selectedClass === klass.id} onPress={() => { props.setSelectedClass(klass.id); props.go("classDetail"); }} />
      ))}
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
  const updateReminder = (patch: Partial<ReminderSettings>) => {
    actions.updateClassReminder(klass.id, { ...klass.reminderSettings, ...patch });
  };
  return (
    <View>
      <LiquidWidget type="classPulse" state={state} styleConfig={{ ...state.widgetSettings.classPulse, accent: klass.accent }} settings={state.appSettings} />
      <View style={styles.whiteCard}>
        <Text style={styles.detailTitle}>{klass.title}</Text>
        <Text style={styles.detailSub}>{klass.professor}</Text>
        <View style={styles.detailGrid}>
          <InfoPill label="Room" value={klass.room} color={accent.color} />
          <InfoPill label="Next meeting" value={`${klass.days.join("/")} ${formatTime(klass.startTime)}`} color={accent.color} />
          <InfoPill label="Pulse" value={`${pulse.score}%`} color={accent.color} />
          <InfoPill label="Schedule" value={`${formatTime(klass.startTime)}-${formatTime(klass.endTime)}`} color={accent.color} />
        </View>
      </View>
      <Panel title="Tasks">
        {tasks.slice(0, 3).map((item) => <MiniLine key={item.id} text={item.title} />)}
      </Panel>
      <Panel title="Notes">
        {notes.slice(0, 3).map((item) => <MiniLine key={item.id} text={item.title} />)}
      </Panel>
      <Panel title="Reminder Controls">
        <ChipRow values={["Off", "5 min before", "10 min before", "15 min before", "30 min before", "Custom"]} value={reminderLabel(klass.reminderSettings)} onPress={(value) => updateReminder(reminderPatch(value))} wrap />
        <View style={styles.toggleRow}>
          <Text style={styles.cardTitle}>Show room in reminder</Text>
          <Switch value={klass.reminderSettings.showRoom} onValueChange={(value) => updateReminder({ showRoom: value })} />
        </View>
        <View style={styles.notificationPreview}>
          <Text style={styles.notificationTitle}>{klass.title} starts in {klass.reminderSettings.minutesBefore} min</Text>
          <Text style={styles.notificationSub}>{klass.reminderSettings.showRoom ? `Room ${klass.room}` : "Room hidden"}</Text>
        </View>
      </Panel>
      <Panel title="Tests and Files">
        <MiniLine text="Biology quiz Friday" />
        <MiniLine text="Lecture slides attached" />
      </Panel>
    </View>
  );
}

function TasksScreen(props: ShellProps) {
  const [filter, setFilter] = useState("Today");
  const filtered = filterTasks(props.state, filter);
  return (
    <ScreenScroll>
      <TopBar title="Tasks" actionLabel="Add" onAction={() => props.go("addTask")} />
      <ChipRow values={["Today", "Upcoming", "Overdue", "Completed"]} value={filter} onPress={setFilter} />
      <LiquidWidget type="todayTasks" state={props.state} styleConfig={props.state.widgetSettings.todayTasks} settings={props.settings} />
      {filtered.map((task) => (
        <TaskCard key={task.id} state={props.state} task={task} onPress={() => props.actions.toggleTaskComplete(task.id)} />
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
        <ChipRow values={["Today", "Upcoming", "Overdue", "Completed"]} value="Today" onPress={() => undefined} />
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
      <PickerRow label="Reminder" values={["Off", "5 min before", "15 min before", "30 min before", "Tonight"]} value={reminder} onPress={setReminder} />
      <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryButtonText}>Save task</Text></TouchableOpacity>
    </View>
  );
}

function NotesScreen(props: ShellProps) {
  return (
    <ScreenScroll>
      <TopBar title="Notes" actionLabel="New" onAction={() => props.go("noteEditor")} />
      <SearchBar label="Search notes" />
      <TouchableOpacity style={styles.scanNoteCard} onPress={() => props.go("scanner")}>
        <ScanLine size={22} color={T["--blue"]} />
        <View style={styles.flex1}>
          <Text style={styles.cardTitle}>Scan notes</Text>
          <Text style={styles.cardSub}>Capture a board, worksheet, or page.</Text>
        </View>
      </TouchableOpacity>
      <Panel title="Recent Notes">
        {props.state.notes.map((note) => (
          <NoteCard key={note.id} state={props.state} note={note} onPress={() => { props.setSelectedNote(note.id); props.go("noteEditor"); }} />
        ))}
      </Panel>
    </ScreenScroll>
  );
}

function IPadNotes(props: ShellProps) {
  const selected = props.state.notes.find((note) => note.id === props.selectedNote) ?? props.state.notes[0];
  return (
    <View style={styles.splitView}>
      <View style={styles.masterPane}>
        <View style={styles.rowBetween}>
          <Text style={styles.padPaneTitle}>Notes</Text>
          <TouchableOpacity style={styles.smallBlackButton} onPress={() => props.go("noteEditor")}><Plus size={16} color={T["--surface"]} /></TouchableOpacity>
        </View>
        <SearchBar label="Search notes" />
        {props.state.notes.map((note) => (
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
  const [smartOutput, setSmartOutput] = useState("");
  const save = () => {
    const nextNote = {
      title: title.trim() || "Quick note",
      classId,
      body: body.trim() || "New note body",
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
  return (
    <View style={styles.formCard}>
      <LabeledInput label="Title" value={title} setValue={setTitle} placeholder="Integration by Parts" />
      <PickerRow label="Class" values={state.classes.map((klassItem) => klassItem.title)} value={selectClassById(state, classId)?.title ?? "Class"} onPress={(value) => setClassId(state.classes.find((klassItem) => klassItem.title === value)?.id ?? classId)} />
      <LabeledInput label="Body" value={body} setValue={setBody} placeholder="Write the note body" multiline />
      <LabeledInput label="Tags" value={tags} setValue={setTags} placeholder="exam, practice" />
      <Panel title="Smart Actions">
        <View style={styles.actionRow}>
          {["Summarize", "Make flashcards", "Extract tasks"].map((action) => (
            <TouchableOpacity key={action} style={styles.secondaryButton} onPress={() => setSmartOutput(localSmartOutput(action))}>
              <Text style={styles.secondaryButtonText}>{action}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {smartOutput ? <Text style={styles.smartOutput}>{smartOutput}</Text> : null}
      </Panel>
      <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryButtonText}>Save note</Text></TouchableOpacity>
    </View>
  );
}

function ScannerScreen({ go, state, actions }: ShellProps) {
  return (
    <ScreenScroll>
      <BackBar title="Scanner" back={() => go("home")} />
      <ScannerContent state={state} actions={actions} />
    </ScreenScroll>
  );
}

function IPadScanner({ go, state, actions }: ShellProps) {
  return (
    <View style={styles.ipadScanner}>
      <ScrollView style={styles.scannerPreviewPane} contentContainerStyle={styles.detailContent}>
        <BackBar title="Scan Schedule" back={() => go("home")} />
        <ScannerContent state={state} actions={actions} previewOnly />
      </ScrollView>
      <View style={styles.scannerReviewPane}>
        <Panel title="Detected Classes">
          {["Biology 101, Room B204", "Calculus II, Room M112", "English Literature, Room H310"].map((line) => <MiniLine key={line} text={line} />)}
        </Panel>
        <Panel title="Detected Tasks">
          {["Problem Set 4, Today", "Lab Report, Tomorrow", "Essay draft, Friday"].map((line) => <MiniLine key={line} text={line} />)}
        </Panel>
      </View>
    </View>
  );
}

function ScannerContent({ state, actions, previewOnly = false }: { state: AppState; actions: StudyPlannerActions; previewOnly?: boolean }) {
  const steps = ["Reading schedule", "Finding classes", "Finding rooms", "Finding due dates", "Creating reminders", "Building dashboard"];
  const visibleStep = state.scannerState.status === "idle" ? 0 : state.scannerState.stepIndex;
  return (
    <View>
      <View style={styles.scanChoiceRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={actions.runScannerDemo}><Text style={styles.secondaryButtonText}>Scan</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={actions.markScannerComplete}><Text style={styles.secondaryButtonText}>Upload</Text></TouchableOpacity>
      </View>
      <View style={[styles.cameraCard, previewOnly ? styles.padCameraCard : null]}>
        <View style={styles.scanFrame}>
          <View style={styles.scanCornerTop} />
          <View style={styles.scanCornerBottom} />
          <ScanLine size={54} color={T["--blue"]} />
        </View>
        <Text style={styles.cameraTitle}>Reading schedule</Text>
      </View>
      <View style={styles.whiteCard}>
        {steps.map((step, index) => (
          <View key={step} style={styles.progressStep}>
            <View style={[styles.progressDot, index <= visibleStep ? styles.progressDone : null]} />
            <Text style={styles.progressText}>{step}</Text>
          </View>
        ))}
        <Text style={styles.readyText}>{state.scannerState.status === "complete" ? "Planner ready" : "Scanner running"}</Text>
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
  const firstTask = state ? selectTodayTasks(state)[0] : null;
  return (
    <View>
      <View style={styles.segmentStatic}>
        <Text style={styles.segmentStaticActive}>Day</Text>
        <Text style={styles.segmentStaticText}>Week</Text>
      </View>
      {schedule.map((item, index) => (
        <View key={`${item.title}-calendar`} style={[styles.calendarBlock, compact ? styles.calendarBlockCompact : null, { borderLeftColor: accentMap[item.accent].color }]}>
          <Text style={styles.calendarTime}>{formatTime(item.startTime)}</Text>
          <View style={styles.flex1}>
            <Text style={styles.calendarTitle}>{item.title}</Text>
            <Text style={styles.calendarSub}>Room {item.room}</Text>
          </View>
          {index === 1 ? <Text style={styles.priorityPill}>Test prep</Text> : null}
        </View>
      ))}
      {firstTask ? (
        <View style={[styles.calendarBlock, { borderLeftColor: T["--rose"] }]}>
          <Text style={styles.calendarTime}>{formatTime(firstTask.dueTime)}</Text>
          <View style={styles.flex1}>
            <Text style={styles.calendarTitle}>{firstTask.title} due</Text>
            <Text style={styles.calendarSub}>{classTitle(state!, firstTask)}</Text>
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
  return (
    <View>
      <View style={styles.profileHero}>
        <View style={styles.profileAvatar}><Text style={styles.profileInitials}>MR</Text></View>
        <Text style={styles.detailTitle}>{state.student.name}</Text>
        <Text style={styles.detailSub}>{state.student.school}</Text>
      </View>
      <Panel title="Account"><MiniLine text={state.student.name} /><MiniLine text={state.student.year} /></Panel>
      <Panel title="School Profile"><MiniLine text={state.student.school} /><MiniLine text={state.student.semester} /></Panel>
      <Panel title="Reminder Defaults">
        <PickerRow label="Default class reminder" values={["Off", "5 min before", "10 min before", "15 min before", "30 min before"]} value={settings.defaultClassReminder ? `${settings.defaultClassReminder} min before` : "Off"} onPress={(value) => set("defaultClassReminder", reminderMinutes(value))} />
        <ToggleLine label="Show room in reminder" value={settings.showRoomInReminder} onValueChange={(value) => set("showRoomInReminder", value)} />
      </Panel>
      <Panel title="Widget Defaults"><MiniLine text="Liquid Glass widgets enabled" /><MiniLine text="Saved styles apply to iPhone and iPad" /></Panel>
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
  const items: Array<[PadTab, string, React.ComponentType<{ size?: number; color?: string }>]> = [
    ["home", "Home", Home],
    ["classes", "Classes", BookOpen],
    ["tasks", "Tasks", Check],
    ["notes", "Notes", FileText],
    ["calendar", "Calendar", CalendarDays],
    ["profile", "Profile", User]
  ];
  return (
    <View style={styles.sidebar}>
      <Text style={styles.sidebarTitle}>StudyPlanner</Text>
      {items.map(([id, label, Icon]) => {
        const selected = active === id;
        return (
          <TouchableOpacity key={id} accessibilityLabel={label} style={[styles.sidebarItem, selected ? styles.sidebarItemActive : null]} onPress={() => go(id)}>
            <Icon size={20} color={selected ? T["--surface"] : T["--muted"]} />
            <Text style={[styles.sidebarLabel, selected ? styles.sidebarLabelActive : null]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PhoneTabBar({ active, go }: { active: PhoneTab; go: (route: Route) => void }) {
  const items: Array<[PhoneTab, string, React.ComponentType<{ size?: number; color?: string }>]> = [
    ["home", "Home", Home],
    ["classes", "Classes", BookOpen],
    ["tasks", "Tasks", Check],
    ["notes", "Notes", FileText],
    ["profile", "Profile", User]
  ];
  return (
    <View style={styles.tabBar}>
      {items.map(([id, label, Icon]) => {
        const selected = active === id;
        return (
          <TouchableOpacity key={id} accessibilityLabel={label} style={styles.tabItem} onPress={() => go(id)}>
            <Icon size={23} color={selected ? T["--text"] : T["--muted"]} />
            <Text style={[styles.tabLabel, selected ? styles.tabLabelActive : null]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ActionSheet({ open, close, go, isPad }: { open: boolean; close: () => void; go: (route: Route) => void; isPad: boolean }) {
  const actions: Array<[string, Route, React.ComponentType<{ size?: number; color?: string }>, Accent]> = [
    ["Scan schedule", "scanner", ScanLine, "blue"],
    ["Add class", "classes", BookOpen, "mint"],
    ["Add task", "addTask", Check, "orange"],
    ["Add note", "noteEditor", NotebookPen, "violet"],
    ["Add reminder", "calendar", Bell, "cyan"]
  ];
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
            {actions.map(([label, route, Icon, accent]) => (
              <TouchableOpacity key={label} style={styles.sheetItem} onPress={() => go(route)}>
                <View style={[styles.sheetIcon, { backgroundColor: accentMap[accent].pale }]}>
                  <Icon size={22} color={accentMap[accent].color} />
                </View>
                <Text style={styles.sheetItemText}>{label}</Text>
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

function TopBar({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.topBar}>
      <Text style={styles.screenTitle}>{title}</Text>
      {actionLabel && onAction ? <TouchableOpacity style={styles.topAction} onPress={onAction}><Text style={styles.topActionText}>{actionLabel}</Text></TouchableOpacity> : <View style={styles.topSpacer} />}
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
  return (
    <TouchableOpacity style={[styles.taskCard, selected ? styles.selectedCard : null, compact ? styles.compactTaskCard : null]} onPress={onPress}>
      <View style={[styles.checkbox, task.completed ? styles.checkboxDone : null]}>{task.completed ? <Check size={16} color={T["--surface"]} /> : null}</View>
      <View style={styles.flex1}>
        <Text style={[styles.cardTitle, task.completed ? styles.doneText : null]}>{task.title}</Text>
        <Text style={styles.cardSub}>{classTitle(state, task)} · {dueLabel(task)} · {task.reminder}</Text>
      </View>
      <Text style={[styles.priorityPill, task.priority === "High" ? styles.priorityHigh : null]}>{task.priority}</Text>
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

function isPhoneTab(route: Route): route is PhoneTab {
  return ["home", "classes", "tasks", "notes", "profile"].includes(route);
}

function isPadTab(route: Route): route is PadTab {
  return ["home", "classes", "tasks", "notes", "calendar", "profile"].includes(route);
}

function filterTasks(state: AppState, filter: string) {
  if (filter === "Completed") return state.tasks.filter((task) => task.completed);
  if (filter === "Upcoming") return state.tasks.filter((task) => !task.completed && dueLabel(task) !== "Today" && dueLabel(task) !== "Overdue");
  if (filter === "Overdue") return state.tasks.filter((task) => !task.completed && dueLabel(task) === "Overdue");
  return selectTodayTasks(state);
}

function localSmartOutput(action: string) {
  if (action === "Summarize") return "Local summary: key ideas, formulas, and next review point are grouped.";
  if (action === "Make flashcards") return "Local flashcards: definition, example, and practice prompt.";
  return "Local tasks: review notes, finish practice set, prepare one question for class.";
}

function formatTime(value: string) {
  const [hourText = "0", minuteText = "0"] = value.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 || 12;
  return `${twelve}:${minuteText.padStart(2, "0")} ${suffix}`;
}

function dueToDate(value: string) {
  if (value === "Tomorrow") return "2026-06-04";
  if (value === "Friday") return "2026-06-05";
  if (value === "Next week") return "2026-06-10";
  return "2026-06-03";
}

function reminderMinutes(value: string) {
  if (value === "Off") return 0;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 15;
}

function reminderLabel(settings: ReminderSettings) {
  if (!settings.enabled || settings.minutesBefore === 0) return "Off";
  if ([5, 10, 15, 30].includes(settings.minutesBefore)) return `${settings.minutesBefore} min before`;
  return "Custom";
}

function reminderPatch(value: string): Partial<ReminderSettings> {
  return {
    enabled: value !== "Off",
    minutesBefore: reminderMinutes(value)
  };
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
  flex1: { flex: 1 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  phoneShell: { flex: 1, backgroundColor: T["--bg"] },
  padShell: { flex: 1, flexDirection: "row", backgroundColor: T["--bg"] },
  padContent: { flex: 1, minWidth: 0 },
  screen: { flex: 1 },
  screenContent: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 136 },
  screenContentWithFooter: { paddingBottom: 188 },
  padScroll: { flex: 1 },
  padHomeContent: { padding: 24, paddingBottom: 48 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 16 },
  headerText: { flex: 1, minWidth: 0 },
  greeting: { color: T["--text"], fontSize: 32, lineHeight: 38, fontWeight: "900", letterSpacing: 0 },
  subtitle: { color: T["--muted"], fontSize: 16, lineHeight: 22, fontWeight: "700", marginTop: 4, letterSpacing: 0 },
  avatarButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: T["--text"], alignItems: "center", justifyContent: "center" },
  searchBar: { minHeight: 48, borderRadius: 18, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 12 },
  searchPlaceholder: { color: T["--muted"], fontSize: 15, fontWeight: "700" },
  editWidgetButton: { minHeight: 44, borderRadius: 22, backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"], flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 },
  editWidgetText: { color: T["--text"], fontSize: 14, fontWeight: "900" },
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
  chipRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  wrap: { flexWrap: "wrap" },
  chip: { minHeight: 38, borderRadius: 19, paddingHorizontal: 13, alignItems: "center", justifyContent: "center", backgroundColor: T["--surface"], borderWidth: 1, borderColor: T["--line"] },
  chipActive: { backgroundColor: T["--text"], borderColor: T["--text"] },
  chipText: { color: T["--muted"], fontSize: 13, fontWeight: "900" },
  chipTextActive: { color: T["--surface"] },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  smartOutput: { color: T["--muted"], fontSize: 14, fontWeight: "700", lineHeight: 20, marginTop: 10 },
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
  progressStep: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 34 },
  progressDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: T["--line"] },
  progressDone: { backgroundColor: T["--blue"] },
  progressText: { color: T["--muted"], fontSize: 14, fontWeight: "800" },
  readyText: { color: T["--text"], fontSize: 25, fontWeight: "900", marginTop: 14 },
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
  profileAvatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: T["--text"], alignItems: "center", justifyContent: "center", marginBottom: 12 },
  profileInitials: { color: T["--surface"], fontSize: 25, fontWeight: "900" },
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
  studioSection: { marginTop: 16 },
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
