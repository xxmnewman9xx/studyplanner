import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { purchaseErrorListener, purchaseUpdatedListener } from "expo-iap";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image as RNImage,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Crown,
  FileText,
  Flame,
  FlaskConical,
  Globe2,
  GraduationCap,
  Grid2X2,
  HeartPulse,
  Image,
  Layers,
  Lock,
  MapPin,
  Moon,
  NotebookPen,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  ScanLine,
  Share2,
  Shield,
  Sparkles,
  Star,
  Sun,
  Target,
  Timer,
  Trash2,
  Upload,
  User,
  Wand2,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import Svg, { Circle as SvgCircle } from "react-native-svg";
import { applyImport, loadData, saveData } from "./src/storage";
import { analyzeNotes, analyzeSyllabus, buildStudyPlan, deadlineInsight } from "./src/ai";
import {
  appendFeedbackEvent,
  buildDashboardSnapshot,
  buildClassPulseBreakdowns,
  buildSemesterSnapshot,
  colorForState,
  createNaturalLanguageTask,
  daysUntilExam,
  daysUntilTask,
  generateStudyAssets,
  hasRealSemesterData,
  parseNoteInsights,
  replanAfterMissedBlock,
  suggestSmartReminders,
} from "./src/intelligence";
import { extractTextFromImage, hasNativeImageTextRecognition } from "./src/imageTextRecognition";
import { COLORS, THEMES, formatDue, isoFromOffset, minutesLabel } from "./src/seed";
import { AppData, ClassItem, FeedbackEvent, HealthDimensionKey, ImportBatch, ImportCandidate, NoteItem, StudyBlock, TaskItem, ThemeId } from "./src/types";
import { buildSemesterLoop, syncNativeWidgets } from "./src/widgetEngine";
import { cancelReminderNotificationIds, scheduleLocalReminders } from "./src/reminders";
import { pickAndExtractPdf } from "./src/pdfImport";
import { clearPendingImport, loadPendingImport, savePendingImport } from "./src/pendingImport";
import { buildSemesterNarrative } from "./src/semesterNarrative";
import { resolveInitialRouteForData } from "./src/activation";
import {
  PaywallPlan,
  checkStudyPlannerEntitlement,
  closeStudyPlannerStore,
  fallbackPlans,
  finishStudyPlannerPurchase,
  initializeStudyPlannerStore,
  loadStorePlans,
  manageSubscriptionUrl,
  purchasePlan,
  restoreStudyPlannerPurchases,
  storeDisplayName,
} from "./src/iap";

type Route =
  | "welcome"
  | "onboarding"
  | "importOptions"
  | "lockedDashboard"
  | "paywall"
  | "terms"
  | "privacy"
  | "today"
  | "classes"
  | "scan"
  | "plan"
  | "tasks"
  | "notes"
  | "profile"
  | "classDetail"
  | "taskDetail"
  | "noteDetail"
  | "paste"
  | "review"
  | "success"
  | "widgets"
  | "reminders"
  | "studySession"
  | "homePreview"
  | "lockPreview";

type NavItem = { route: Route; params?: Record<string, string> };

const iconMap: Record<string, LucideIcon> = {
  home: CalendarDays,
  classes: BookOpen,
  scan: ScanLine,
  plan: CalendarDays,
  profile: User,
  "book-open": BookOpen,
  "notebook-pen": NotebookPen,
  "flask-conical": FlaskConical,
  "bar-chart-3": BarChart3,
  "globe-2": Globe2,
  layers: Layers,
  "graduation-cap": GraduationCap,
  flame: Flame,
  moon: Moon,
  zap: Zap,
  sparkles: Sparkles,
  bell: Bell,
  heart: HeartPulse,
  target: Target,
  note: NotebookPen,
  file: FileText,
  camera: Camera,
  image: Image,
  upload: Upload,
  grid: Grid2X2,
  clock: Clock,
  map: MapPin,
  crown: Crown,
  star: Star,
  refresh: RefreshCw,
  lock: Lock,
  shield: Shield,
  timer: Timer,
  brain: Brain,
  wand: Wand2,
  "chevron-right": ChevronRight,
};

function Icon({ name, size = 20, color = COLORS.ink, strokeWidth = 2.1 }: { name: string; size?: number; color?: string; strokeWidth?: number }) {
  const C = iconMap[name] || Sparkles;
  return <C size={size} color={color} strokeWidth={strokeWidth} />;
}

function palette(theme: ThemeId) {
  const dark = ["dark", "neon", "athlete"].includes(theme);
  const accent = THEMES.find((t) => t.id === theme)?.swatches[1] || COLORS.blue;
  return {
    dark,
    bg: dark ? "#050507" : "#EFEFF4",
    surface: dark ? "#1A1A1E" : "#FFFFFF",
    surface2: dark ? "#232329" : "#F6F6FA",
    surface3: dark ? "#2C2C33" : "#ECECF2",
    hairline: dark ? "rgba(255,255,255,0.10)" : "rgba(60,60,67,0.12)",
    label: dark ? "#FFFFFF" : "#0A0A0D",
    label2: dark ? "rgba(235,235,245,0.66)" : "rgba(60,60,67,0.66)",
    label3: dark ? "rgba(235,235,245,0.34)" : "rgba(60,60,67,0.34)",
    accent,
    accent2: THEMES.find((t) => t.id === theme)?.swatches[0] || COLORS.purple,
  };
}

function tap(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  Haptics.impactAsync(style).catch(() => {});
}

const TERMS_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
const SUPPORT_URL = "mailto:mattnewmanapps@gmail.com?subject=StudyPlanner%20Support";
const APP_STORE_REVIEW_URL = "itms-apps://itunes.apple.com/app/id6766181202?action=write-review";
const PRE_PURCHASE_ROUTES: Route[] = ["welcome", "onboarding", "importOptions", "lockedDashboard", "scan", "paste", "review", "paywall", "terms", "privacy"];
type EntitlementStatus = "loading" | "active" | "inactive" | "error";
type AccessState = "loading" | "onboarding" | "preview_allowed" | "locked" | "paywall" | "unlocked";
type UnlockSuccessSource = "purchase_action" | "restore_action" | "startup_hydration";
let lastUnlockSuccessAlertAt = 0;
const FALLBACK_CLASS: ClassItem = {
  id: "empty-class",
  code: "Class",
  name: "Semester not imported",
  professor: "Import syllabus first",
  room: "TBD",
  days: "Mon Wed",
  time: "10:00 AM",
  next: "After import",
  health: 0,
  grade: "Not set",
  color: COLORS.blue,
  color2: COLORS.green,
  icon: "book-open",
};

function openExternal(url: string) {
  Linking.openURL(url).catch(() => Alert.alert("Link unavailable", "Open the app listing to view this document."));
}

function safeClassFor(data: AppData, classId?: string) {
  return data.classes.find((item) => item.id === classId) || data.classes[0] || FALLBACK_CLASS;
}

function firstNameFromPrefs(data: AppData) {
  const raw = data.prefs.firstName || data.prefs.name || "Student";
  return raw.trim().split(/\s+/)[0] || "Student";
}

function userInitial(data: AppData) {
  return firstNameFromPrefs(data).slice(0, 1).toUpperCase() || "S";
}

function onboardingComplete(data: AppData) {
  return Boolean(data.prefs.onboardingComplete);
}

function entitlementUnlocks(data: AppData, entitlementStatus: EntitlementStatus) {
  return entitlementStatus === "active";
}

function appAccessLocked(data: AppData, entitlementStatus: EntitlementStatus) {
  return onboardingComplete(data) && !entitlementUnlocks(data, entitlementStatus);
}

function accessStateFor(data: AppData, entitlementStatus: EntitlementStatus, active?: Route): AccessState {
  if (!onboardingComplete(data)) return "onboarding";
  if (entitlementUnlocks(data, entitlementStatus)) return "unlocked";
  if (entitlementStatus === "loading") return PRE_PURCHASE_ROUTES.includes(active || "lockedDashboard") ? "preview_allowed" : "loading";
  if (active === "paywall") return "paywall";
  if (PRE_PURCHASE_ROUTES.includes(active || "lockedDashboard")) return "preview_allowed";
  return "locked";
}

function entitlementTraceSource(data: AppData, entitlementStatus: EntitlementStatus) {
  if (entitlementStatus === "active") return "storekit_active";
  if (entitlementStatus === "loading") return data.prefs.premium ? "local_cached_ignored_loading" : "loading";
  if (entitlementStatus === "error") return data.prefs.premium ? "local_cached_ignored_error" : "error";
  return data.prefs.premium ? "local_cached_ignored_none" : "none";
}

function dataForAccessState(data: AppData, entitlementStatus: EntitlementStatus): AppData {
  if (!entitlementUnlocks(data, entitlementStatus)) return lockedWidgetData(lockUnvalidatedPremium(data));
  return {
    ...data,
    prefs: {
      ...data.prefs,
      osLive: true,
      premium: true,
    },
  };
}

function lockUnvalidatedPremium(data: AppData): AppData {
  return {
    ...data,
    prefs: {
      ...data.prefs,
      premium: false,
      premiumProductId: undefined,
      premiumCheckedAt: undefined,
    },
  };
}

function premiumData(data: AppData, productId?: string, checkedAt = new Date().toISOString()): AppData {
  return {
    ...data,
    prefs: {
      ...data.prefs,
      osLive: true,
      premium: true,
      premiumProductId: productId,
      premiumCheckedAt: checkedAt,
    },
  };
}

function gatedRoute(active: Route, data: AppData, entitlementStatus: EntitlementStatus): Route {
  const accessState = accessStateFor(data, entitlementStatus, active);
  if (accessState === "unlocked") return active;
  if (accessState === "onboarding") return "onboarding";
  if (accessState === "preview_allowed" || accessState === "paywall") return active;
  return "lockedDashboard";
}

function appRouteForInitialRoute(initialRoute: ReturnType<typeof resolveInitialRouteForData>): Route {
  if (initialRoute === "onboarding") return "onboarding";
  if (initialRoute === "reviewPendingImport") return "review";
  return "lockedDashboard";
}

function maybeShowUnlockSuccess(source: UnlockSuccessSource) {
  if (source !== "purchase_action" && source !== "restore_action") return;
  const now = Date.now();
  if (now - lastUnlockSuccessAlertAt < 1200) return;
  lastUnlockSuccessAlertAt = now;
  Alert.alert("StudyPlanner unlocked", "Your subscription is active.");
}

function routeTokensFromUrl(rawUrl: string) {
  const tokens = new Set<string>();
  const addRouteParts = (value: string | null | undefined) => {
    value
      ?.toLowerCase()
      .split(/[^a-z0-9-]+/g)
      .filter(Boolean)
      .forEach((part) => {
        tokens.add(part);
        part.split("-").filter(Boolean).forEach((subpart) => tokens.add(subpart));
      });
  };

  try {
    const parsed = new URL(rawUrl);
    addRouteParts(parsed.hostname);
    addRouteParts(parsed.pathname);
    addRouteParts(parsed.hash);
    parsed.searchParams.forEach((value, key) => {
      addRouteParts(key);
      addRouteParts(value);
    });
  } catch {
    addRouteParts(rawUrl);
  }

  return tokens;
}

function routeFromUrl(rawUrl: string): Route | null {
  if (rawUrl.toLowerCase().includes("expo-development-client")) return null;
  const routeTokens = routeTokensFromUrl(rawUrl);

  if (routeTokens.has("scan") || routeTokens.has("import")) return "scan";
  if (routeTokens.has("paste")) return "paste";
  if (routeTokens.has("notes")) return "notes";
  if (routeTokens.has("classes") || routeTokens.has("courses")) return "classes";
  if (routeTokens.has("calendar") || routeTokens.has("plan")) return "plan";
  if (routeTokens.has("study")) return "plan";
  if (routeTokens.has("reminders")) return "reminders";
  if (routeTokens.has("today") || routeTokens.has("widgets") || routeTokens.has("widget")) return "today";
  if (routeTokens.has("terms") || routeTokens.has("eula")) return "terms";
  if (routeTokens.has("privacy")) return "privacy";
  if (routeTokens.has("paywall") || routeTokens.has("subscribe")) return "paywall";
  return null;
}

function lockedWidgetData(data: AppData): AppData {
  return {
    ...data,
    classes: [],
    tasks: [],
    exams: [],
    notes: [],
    reminders: [],
    studyBlocks: [],
    imports: [],
    prefs: {
      ...data.prefs,
      premium: false,
      osLive: false,
    },
  };
}

function todayHeaderLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function shortDateLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [tab, setTab] = useState<Route>("today");
  const [stack, setStack] = useState<NavItem[]>([]);
  const [currentImport, setCurrentImport] = useState<ImportBatch | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pendingImportStoreReady, setPendingImportStoreReady] = useState(false);
  const [entitlementStatus, setEntitlementStatus] = useState<EntitlementStatus>("loading");
  const saveChain = useRef(Promise.resolve());
  const initialUrlHandled = useRef(false);
  const currentImportRef = useRef<ImportBatch | null>(null);
  const theme = palette(data?.prefs.theme || "light");

  useEffect(() => {
    currentImportRef.current = currentImport;
    if (!pendingImportStoreReady) return;
    if (currentImport) savePendingImport(currentImport).catch(() => {});
    else clearPendingImport().catch(() => {});
  }, [currentImport, pendingImportStoreReady]);

  const activateEntitlement = useCallback((productId?: string, checkedAt = new Date().toISOString(), options: { applyPendingImport?: boolean } = {}) => {
    const shouldApplyPending = options.applyPendingImport !== false;
    const pending = shouldApplyPending ? currentImportRef.current : null;
    setEntitlementStatus("active");
    setData((current) => {
      if (!current) return current;
      const unlocked = premiumData(current, productId, checkedAt);
      return pending ? applyImport(unlocked, pending) : unlocked;
    });
    if (shouldApplyPending) {
      currentImportRef.current = null;
      setCurrentImport(null);
      clearPendingImport().catch(() => {});
      setTab("today");
      setStack([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    loadData().then(async (stored) => {
      if (!mounted) return;
      const safeStored = lockUnvalidatedPremium(stored);
      const pendingImport = await loadPendingImport();
      if (!mounted) return;
      setData(safeStored);
      if (pendingImport) {
        currentImportRef.current = pendingImport;
        setCurrentImport(pendingImport);
      }
      setPendingImportStoreReady(true);
      setLoaded(true);
      // Startup route priority is explicit: hydration, onboarding, pending import review, then dashboard.
      // A premium entitlement is not evidence that onboarding has been completed.
      setStack([{ route: appRouteForInitialRoute(resolveInitialRouteForData(safeStored, pendingImport)) }]);
      try {
        const entitlement = await checkStudyPlannerEntitlement();
        if (!mounted) return;
        maybeShowUnlockSuccess("startup_hydration");
        if (entitlement.isPremium) activateEntitlement(entitlement.productId, entitlement.checkedAt, { applyPendingImport: !pendingImport });
        else setEntitlementStatus("inactive");
      } catch {
        if (mounted) setEntitlementStatus("error");
      }
    });
    return () => {
      mounted = false;
    };
  }, [activateEntitlement]);

  useEffect(() => {
    initializeStudyPlannerStore().catch(() => {});
    const updated = purchaseUpdatedListener(async (purchase) => {
      try {
        const entitlement = await finishStudyPlannerPurchase(purchase);
        if (entitlement.isPremium) {
          activateEntitlement(entitlement.productId, entitlement.checkedAt);
          maybeShowUnlockSuccess("purchase_action");
        }
      } catch (error) {
        Alert.alert("Purchase needs attention", error instanceof Error ? error.message : "Try Restore Purchases.");
      }
    });
    const errored = purchaseErrorListener((error) => {
      if (error.code === "user-cancelled") return;
      Alert.alert("Purchase not completed", error.message || "The App Store could not complete the purchase.");
    });
    return () => {
      updated.remove();
      errored.remove();
      closeStudyPlannerStore().catch(() => {});
    };
  }, [activateEntitlement]);

  useEffect(() => {
    if (loaded && data) {
      const snapshot = data;
      saveChain.current = saveChain.current
        .then(async () => {
          const persistedSnapshot = entitlementUnlocks(snapshot, entitlementStatus) ? snapshot : lockUnvalidatedPremium(snapshot);
          await saveData(persistedSnapshot);
          const widgetSyncData = appAccessLocked(persistedSnapshot, entitlementStatus) ? lockedWidgetData(persistedSnapshot) : persistedSnapshot;
          if (persistedSnapshot.prefs.osLive || appAccessLocked(persistedSnapshot, entitlementStatus)) await syncNativeWidgets(widgetSyncData);
        })
        .catch(() => {});
    }
  }, [data, entitlementStatus, loaded]);

  const nav = useMemo(
    () => ({
      push: (route: Route, params?: Record<string, string>) => {
        tap();
        setStack((s) => [...s, { route, params }]);
      },
      back: () => {
        tap();
        setStack((s) => s.slice(0, -1));
      },
      tab: (route: Route) => {
        tap();
        setTab(route);
        setStack([]);
      },
    }),
    []
  );

  useEffect(() => {
    if (!loaded || !data) return;
    const routeUrl = (url: string | null, initial = false) => {
      if (!url || (initial && initialUrlHandled.current)) return;
      const route = routeFromUrl(url);
      if (!route) return;
      if (entitlementStatus === "loading") return;
      if (initial) initialUrlHandled.current = true;
      const openResolvedRoute = (target: Route) => {
        if (target === "scan" || target === "paste") {
          if (target === "paste") nav.push("paste", { mode: "syllabus" });
          else nav.tab("scan");
          return;
        }
        if (target === "notes") {
          nav.push("notes");
          return;
        }
        if (target === "classes") {
          nav.tab("classes");
          return;
        }
        if (target === "plan") {
          nav.tab("plan");
          return;
        }
        if (target === "reminders") {
          nav.push("reminders");
          return;
        }
        if (target === "today") {
          nav.tab("today");
          return;
        }
        if (target === "paywall") {
          nav.push("paywall");
        }
      };
      if (!entitlementUnlocks(data, entitlementStatus)) {
        if (!onboardingComplete(data)) {
          setStack([{ route: "onboarding" }]);
          return;
        }
        if (route === "scan" || route === "paste" || route === "paywall") {
          openResolvedRoute(route);
          return;
        }
        setStack([{ route: "lockedDashboard" }]);
        return;
      }
      openResolvedRoute(route);
    };
    Linking.getInitialURL().then((url) => routeUrl(url, true)).catch(() => {});
    const subscription = Linking.addEventListener("url", ({ url }) => routeUrl(url));
    return () => subscription.remove();
  }, [data, entitlementStatus, loaded, nav]);

  useEffect(() => {
    if (!loaded || !data) return;
    const activeRoute = stack[stack.length - 1]?.route || tab;
    const accessState = accessStateFor(data, entitlementStatus, activeRoute);
    const decision = gatedRoute(activeRoute, data, entitlementStatus);
    console.info(
      `[Build52Access] source=${entitlementTraceSource(data, entitlementStatus)} status=${entitlementStatus} localPremium=${Boolean(data.prefs.premium)} onboarding=${Boolean(data.prefs.onboardingComplete)} active=${activeRoute} decision=${decision} access=${accessState}`
    );
  }, [data, entitlementStatus, loaded, stack, tab]);

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0C", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#fff" />
        <Text style={{ color: "#fff", fontWeight: "800", marginTop: 16 }}>StudyPlanner</Text>
      </View>
    );
  }

  const mutate = (fn: (current: AppData) => AppData, options: { allowValidatedPremium?: boolean } = {}) => setData((current) => {
    if (!current) return current;
    const next = fn(current);
    return options.allowValidatedPremium || entitlementUnlocks(next, entitlementStatus) ? next : lockUnvalidatedPremium(next);
  });
  const active = stack[stack.length - 1]?.route || tab;
  const params = stack[stack.length - 1]?.params || {};
  const hardGateActive = !entitlementUnlocks(data, entitlementStatus) && !PRE_PURCHASE_ROUTES.includes(active);
  const displayRoute = gatedRoute(active, data, entitlementStatus);
  const accessState = accessStateFor(data, entitlementStatus, active);
  const screenData = dataForAccessState(data, entitlementStatus);

  const props = { data: screenData, mutate, nav, theme, params, currentImport, setCurrentImport, setEntitlementStatus, accessState };
  const screen =
    displayRoute === "welcome" ? <Welcome {...props} /> :
    displayRoute === "onboarding" ? <Onboarding {...props} /> :
    displayRoute === "importOptions" ? <ImportOptions {...props} /> :
    displayRoute === "lockedDashboard" ? <LockedDashboard {...props} /> :
    displayRoute === "paywall" ? <Paywall {...props} /> :
    displayRoute === "terms" ? <LegalScreen {...props} kind="terms" /> :
    displayRoute === "privacy" ? <LegalScreen {...props} kind="privacy" /> :
    displayRoute === "today" ? <Today {...props} /> :
    displayRoute === "classes" ? <Classes {...props} /> :
    displayRoute === "scan" ? <Scan {...props} /> :
    displayRoute === "plan" ? <Plan {...props} /> :
    displayRoute === "tasks" ? <Tasks {...props} /> :
    displayRoute === "notes" ? <Notes {...props} /> :
    displayRoute === "profile" ? <Profile {...props} /> :
    displayRoute === "classDetail" ? <ClassDetail {...props} /> :
    displayRoute === "taskDetail" ? <TaskDetail {...props} /> :
    displayRoute === "noteDetail" ? <NoteDetail {...props} /> :
    displayRoute === "paste" ? <PasteImport {...props} /> :
    displayRoute === "review" ? <ReviewImport {...props} /> :
    displayRoute === "success" ? <ApplySuccess {...props} /> :
    displayRoute === "widgets" ? <WidgetsScreen {...props} /> :
    displayRoute === "reminders" ? <Reminders {...props} /> :
    displayRoute === "studySession" ? <StudySession {...props} /> :
    displayRoute === "homePreview" ? <WidgetsScreen {...props} /> :
    displayRoute === "lockPreview" ? <WidgetsScreen {...props} /> :
    <Today {...props} />;

  const showTabs = entitlementUnlocks(data, entitlementStatus) && stack.length === 0 && !["welcome", "onboarding", "importOptions", "lockedDashboard", "paywall"].includes(displayRoute);
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      {screen}
      {showTabs ? <TabBar tab={tab} setTab={nav.tab} theme={theme} /> : null}
    </View>
  );
}

type ScreenProps = {
  data: AppData;
  mutate: (fn: (current: AppData) => AppData, options?: { allowValidatedPremium?: boolean }) => void;
  nav: { push: (route: Route, params?: Record<string, string>) => void; back: () => void; tab: (route: Route) => void };
  theme: ReturnType<typeof palette>;
  params: Record<string, string>;
  currentImport: ImportBatch | null;
  setCurrentImport: (batch: ImportBatch | null) => void;
  setEntitlementStatus: (status: EntitlementStatus) => void;
  accessState: AccessState;
};

function withFeedback(
  before: AppData,
  after: AppData,
  action: FeedbackEvent["action"],
  options: { classId?: string; actionId?: string; message?: string; dimension?: HealthDimensionKey } = {}
) {
  return appendFeedbackEvent(before, after, action, options);
}

function TabBar({ tab, setTab, theme }: { tab: Route; setTab: (route: Route) => void; theme: ReturnType<typeof palette> }) {
  const tabs: { route: Route; label: string; icon: string; fab?: boolean }[] = [
    { route: "today", label: "Today", icon: "home" },
    { route: "classes", label: "Classes", icon: "classes" },
    { route: "scan", label: "Scan", icon: "scan", fab: true },
    { route: "plan", label: "Plan", icon: "plan" },
    { route: "profile", label: "Profile", icon: "profile" },
  ];
  return (
    <View style={{ position: "absolute", left: 12, right: 12, bottom: 18, height: 72, borderRadius: 26, backgroundColor: theme.dark ? "rgba(40,40,46,0.92)" : "rgba(248,248,252,0.96)", borderColor: theme.hairline, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-around", boxShadow: "0 12px 28px rgba(0,0,0,0.18)" }}>
      {tabs.map((item) => {
        const on = tab === item.route;
        if (item.fab) {
          return (
            <Pressable key={item.route} accessibilityRole="button" accessibilityLabel={item.label} hitSlop={10} onPress={() => setTab(item.route)} style={{ width: 58, height: 58, borderRadius: 18, marginTop: -28, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", boxShadow: `0 10px 22px ${theme.accent}66` }}>
              <Icon name={item.icon} color="#fff" size={27} />
            </Pressable>
          );
        }
        return (
          <Pressable key={item.route} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={item.label} hitSlop={8} onPress={() => setTab(item.route)} style={{ flex: 1, alignItems: "center", gap: 4 }}>
            <Icon name={item.icon} color={on ? theme.accent : theme.label3} size={23} strokeWidth={on ? 2.5 : 2} />
            <Text style={{ color: on ? theme.accent : theme.label3, fontSize: 10, fontWeight: "700" }}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Screen({ children, theme, bottom = 112 }: { children: React.ReactNode; theme: ReturnType<typeof palette>; bottom?: number }) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ paddingTop: 58, paddingBottom: bottom }}>
      {children}
    </ScrollView>
  );
}

function Header({ title, sub, right, theme }: { title: string; sub?: string; right?: React.ReactNode; theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
      <View style={{ flex: 1 }}>
        {sub ? <Text selectable style={{ color: theme.label2, fontSize: 12.5, fontWeight: "700", marginBottom: 3 }}>{sub}</Text> : null}
        <Text selectable style={{ color: theme.label, fontSize: 31, lineHeight: 34, fontWeight: "900" }}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

function BackHeader({ label, nav, theme, action }: { label?: string; nav: ScreenProps["nav"]; theme: ReturnType<typeof palette>; action?: React.ReactNode }) {
  return (
    <View style={{ paddingTop: 54, paddingHorizontal: 18, paddingBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.bg }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={nav.back} style={{ width: 38, height: 38, borderRadius: 99, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
        <ChevronLeft color={theme.label} size={21} strokeWidth={2.6} />
      </Pressable>
      <Text selectable style={{ color: theme.label, fontSize: 16, fontWeight: "800" }}>{label}</Text>
      <View style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center" }}>{action || null}</View>
    </View>
  );
}

function Card({ children, theme, style }: { children: React.ReactNode; theme: ReturnType<typeof palette>; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ backgroundColor: theme.surface, borderRadius: 14, borderWidth: 1, borderColor: theme.hairline, boxShadow: theme.dark ? "0 8px 20px rgba(0,0,0,0.30)" : "0 8px 18px rgba(20,20,40,0.08)" }, style]}>{children}</View>;
}

function RecoveryScreen({ title, body, action, nav, theme }: { title: string; body: string; action?: string; nav: ScreenProps["nav"]; theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BackHeader nav={nav} theme={theme} label={title} />
      <View style={{ padding: 20, gap: 14 }}>
        <Card theme={theme} style={{ padding: 18 }}>
          <Text selectable style={{ color: theme.label, fontSize: 24, lineHeight: 28, fontWeight: "900" }}>{title}</Text>
          <Text selectable style={{ color: theme.label2, lineHeight: 21, marginTop: 8 }}>{body}</Text>
          <Button label={action || "Back to dashboard"} theme={theme} icon="home" onPress={() => nav.tab("today")} />
        </Card>
      </View>
    </View>
  );
}

function Pill({ text, color, theme, icon }: { text: string; color?: string; theme: ReturnType<typeof palette>; icon?: string }) {
  const c = color || theme.label2;
  return (
    <View style={{ flexDirection: "row", gap: 5, alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: `${c}1C` }}>
      {icon ? <Icon name={icon} size={13} color={c} /> : null}
      <Text selectable style={{ color: c, fontSize: 12, fontWeight: "800" }}>{text}</Text>
    </View>
  );
}

function Section({ title, action, onAction, theme }: { title: string; action?: string; onAction?: () => void; theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ paddingHorizontal: 4, paddingBottom: 9, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text selectable style={{ color: theme.label, fontSize: 19, fontWeight: "900" }}>{title}</Text>
      {action ? <Pressable onPress={onAction}><Text style={{ color: theme.accent, fontSize: 14, fontWeight: "800" }}>{action}</Text></Pressable> : null}
    </View>
  );
}

function ClassGlyph({ c, size = 42 }: { c?: ClassItem; size?: number }) {
  const klass = c || FALLBACK_CLASS;
  return (
    <View style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), backgroundColor: "#F2F2F7", borderWidth: 1, borderColor: "#E4E4EA", alignItems: "center", justifyContent: "center" }}>
      <Icon name={klass.icon} color="#111111" size={Math.round(size * 0.52)} />
    </View>
  );
}

function ProgressBar({ value, color, theme, height = 8 }: { value: number; color: string; theme: ReturnType<typeof palette>; height?: number }) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return (
    <View style={{ height, borderRadius: 99, backgroundColor: theme.surface3, overflow: "hidden" }}>
      <View style={{ height: "100%", width: `${Math.max(3, Math.min(100, safeValue * 100))}%`, borderRadius: 99, backgroundColor: color }} />
    </View>
  );
}

function TaskRow({ task, data, theme, onToggle, onOpen }: { task: TaskItem; data: AppData; theme: ReturnType<typeof palette>; onToggle: () => void; onOpen: () => void }) {
  const c = safeClassFor(data, task.classId);
  const dueDays = daysUntilTask(task);
  const dueColor = task.done ? theme.label3 : dueDays < 0 ? COLORS.red : dueDays === 0 ? COLORS.orange : dueDays <= 2 ? COLORS.blue : theme.label2;
  return (
    <Pressable onPress={onOpen} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}>
      <Pressable onPress={(e) => { e.stopPropagation(); onToggle(); }} style={{ width: 27, height: 27, borderRadius: 99, borderWidth: task.done ? 0 : 2, borderColor: dueColor, backgroundColor: task.done ? COLORS.green : "transparent", alignItems: "center", justifyContent: "center" }}>
        {task.done ? <Check color="#fff" size={17} strokeWidth={3} /> : null}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text selectable numberOfLines={1} style={{ color: task.done ? theme.label3 : theme.label, textDecorationLine: task.done ? "line-through" : "none", fontSize: 16, fontWeight: "800" }}>{task.title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
          <View style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: dueColor }} />
          <Text selectable style={{ color: theme.label2, fontSize: 12.5, fontWeight: "700" }}>{c.code}</Text>
          <Text selectable style={{ color: dueColor, fontSize: 12.5, fontWeight: "800" }}>{formatDue(dueDays)} · {task.time}</Text>
        </View>
      </View>
      {task.urgent && !task.done ? <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: COLORS.red }} /> : null}
      <ChevronRight color={theme.label3} size={17} />
    </Pressable>
  );
}

function NoteCard({ note, data, theme, onOpen }: { note: NoteItem; data: AppData; theme: ReturnType<typeof palette>; onOpen: () => void }) {
  const c = safeClassFor(data, note.classId);
  const insight = parseNoteInsights(note, data);
  return (
    <Pressable onPress={onOpen}>
      <Card theme={theme} style={{ padding: 15 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 9 }}>
          <Pill text={c.code} color={c.color} theme={theme} />
          <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "700" }}>{new Date(note.createdAt).toLocaleDateString()}</Text>
        </View>
        <Text selectable style={{ color: theme.label, fontSize: 16, fontWeight: "900", marginBottom: 5 }}>{note.title}</Text>
        <Text selectable numberOfLines={2} style={{ color: theme.label2, fontSize: 14.5, lineHeight: 20 }}>{note.summary}</Text>
        <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
          <Pill text={`${insight.concepts.length} concepts`} color={COLORS.purple} theme={theme} icon="sparkles" />
          {note.suggestedTasks.length ? <Pill text={`${note.suggestedTasks.length} tasks`} color={COLORS.blue} theme={theme} icon="target" /> : null}
          {insight.formulas.length ? <Pill text={`${insight.formulas.length} formulas`} color={COLORS.green} theme={theme} /> : null}
        </View>
      </Card>
    </Pressable>
  );
}

function Welcome({ data, mutate, nav, theme }: ScreenProps) {
  const heroPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(heroPulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(heroPulse, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [heroPulse]);
  const pulseScale = heroPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView style={{ marginBottom: 112 }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: 58, paddingHorizontal: 24, paddingBottom: 24 }}>
        <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
          <RNImage source={require("./assets/icon.png")} style={{ width: 56, height: 56, borderRadius: 17, marginBottom: 18 }} />
        </Animated.View>
        <Text selectable style={{ color: theme.label, fontSize: 38, lineHeight: 40, fontWeight: "900", marginBottom: 10 }}>Know exactly where you stand.</Text>
        <Text selectable style={{ color: theme.label2, fontSize: 16, lineHeight: 22, marginBottom: 18 }}>Import a syllabus. StudyPlanner maps the semester, finds pressure, and tells you the next move.</Text>
        <Card theme={theme} style={{ padding: 16, marginBottom: 12, backgroundColor: theme.dark ? "#17171C" : "#FFFFFF" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 72, height: 72, borderRadius: 999, borderWidth: 8, borderColor: COLORS.green, alignItems: "center", justifyContent: "center" }}>
              <Text selectable style={{ color: theme.label, fontSize: 22, fontWeight: "900" }}>0</Text>
              <Text selectable style={{ color: theme.label2, fontSize: 9, fontWeight: "900" }}>preview</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: theme.label, fontSize: 19, fontWeight: "900" }}>Syllabus in. Dashboard out.</Text>
              <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 4 }}>Preview classes, deadlines, exams, and first move before anything saves.</Text>
            </View>
          </View>
        </Card>
        {[
          ["scan", COLORS.blue, "Map every deadline", "Syllabus in. Semester out."],
          ["heart", COLORS.green, "Track Semester Health", "Know if you are okay."],
        ].map(([i, c, title, body]) => (
          <Card key={title} theme={theme} style={{ padding: 16, flexDirection: "row", gap: 14, alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: `${c}1C`, alignItems: "center", justifyContent: "center" }}><Icon name={i} color={c} size={23} /></View>
            <View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 16 }}>{title}</Text><Text selectable style={{ color: theme.label2, marginTop: 3, lineHeight: 18 }}>{body}</Text></View>
          </Card>
        ))}
      </ScrollView>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 24, paddingBottom: 34, backgroundColor: "rgba(245,245,247,0.94)" }}>
        <Button label="Import syllabus" theme={theme} icon="upload" onPress={() => nav.push("onboarding")} />
      </View>
    </View>
  );
}

function Button({ label, theme, onPress, secondary, icon }: { label: string; theme: ReturnType<typeof palette>; onPress?: () => void; secondary?: boolean; icon?: string }) {
  const disabled = !onPress;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} hitSlop={6} onPress={() => { if (!disabled) { tap(); onPress?.(); } }} style={{ minHeight: 51, borderRadius: 999, backgroundColor: disabled ? theme.surface3 : secondary ? theme.surface3 : theme.accent, opacity: disabled ? 0.54 : 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 9, paddingHorizontal: 18 }}>
      {icon ? <Icon name={icon} color={secondary || disabled ? theme.label : "#fff"} size={18} /> : null}
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} style={{ color: secondary || disabled ? theme.label : "#fff", fontSize: 16, fontWeight: "900", flexShrink: 1 }}>{label}</Text>
    </Pressable>
  );
}

function MiniSemesterHealth({ theme }: { theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ width: "48%", borderRadius: 18, padding: 13, backgroundColor: "rgba(255,255,255,0.78)", borderWidth: 1, borderColor: theme.hairline }}>
      <Text selectable style={{ color: theme.label2, fontSize: 10, fontWeight: "900" }}>SEMESTER HEALTH</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }}>
        <View style={{ width: 52, height: 52, borderRadius: 99, borderWidth: 7, borderColor: COLORS.green, alignItems: "center", justifyContent: "center" }}>
          <Text selectable style={{ color: theme.label, fontSize: 17, fontWeight: "900" }}>0</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text selectable numberOfLines={1} style={{ color: theme.label, fontWeight: "900" }}>Builds live</Text>
          <Text selectable numberOfLines={1} style={{ color: COLORS.green, fontSize: 12, fontWeight: "900" }}>after import</Text>
        </View>
      </View>
    </View>
  );
}

function MiniPressureForecast({ theme }: { theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ width: "48%", borderRadius: 18, padding: 13, backgroundColor: "rgba(255,255,255,0.78)", borderWidth: 1, borderColor: theme.hairline }}>
      <Text selectable style={{ color: theme.label2, fontSize: 10, fontWeight: "900" }}>PRESSURE FORECAST</Text>
      <Text selectable style={{ color: theme.label, fontSize: 16, fontWeight: "900", marginTop: 8 }}>After import</Text>
      <View style={{ flexDirection: "row", gap: 5, alignItems: "flex-end", height: 48, marginTop: 8 }}>
        {[1, 2, 3, 4].map((index) => <View key={index} style={{ flex: 1, height: "18%", borderRadius: 7, backgroundColor: theme.surface3 }} />)}
      </View>
    </View>
  );
}

function MiniClassPulse({ theme }: { theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ width: "48%", borderRadius: 18, padding: 13, backgroundColor: "rgba(255,255,255,0.78)", borderWidth: 1, borderColor: theme.hairline }}>
      <Text selectable style={{ color: theme.label2, fontSize: 10, fontWeight: "900" }}>CLASS PULSE</Text>
      <View style={{ flexDirection: "row", gap: 9, alignItems: "center", marginTop: 10 }}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "#F2F2F7", alignItems: "center", justifyContent: "center" }}><Icon name="classes" size={20} /></View>
        <View style={{ flex: 1 }}>
          <Text selectable style={{ color: theme.label, fontWeight: "900" }}>Classes</Text>
          <Text selectable style={{ color: COLORS.orange, fontSize: 12, fontWeight: "900" }}>locked</Text>
        </View>
      </View>
      <Text selectable numberOfLines={1} style={{ color: theme.label2, fontSize: 12, marginTop: 8 }}>No fake courses</Text>
    </View>
  );
}

function MiniNotesPreparedness({ theme }: { theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ width: "48%", borderRadius: 18, padding: 13, backgroundColor: "rgba(255,255,255,0.78)", borderWidth: 1, borderColor: theme.hairline }}>
      <Text selectable style={{ color: theme.label2, fontSize: 10, fontWeight: "900" }}>NOTES PREPAREDNESS</Text>
      <Text selectable style={{ color: theme.label, fontSize: 17, fontWeight: "900", marginTop: 8 }}>Locked</Text>
      <ProgressBar value={0} color={COLORS.purple} theme={theme} />
      <Text selectable numberOfLines={1} style={{ color: theme.label2, fontSize: 12, marginTop: 8 }}>after notes</Text>
    </View>
  );
}

function MiniNextMove({ theme }: { theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ width: "48%", borderRadius: 18, padding: 13, backgroundColor: "rgba(255,255,255,0.78)", borderWidth: 1, borderColor: theme.hairline }}>
      <Text selectable style={{ color: theme.label2, fontSize: 10, fontWeight: "900" }}>NEXT MOVE</Text>
      <Text selectable style={{ color: theme.label, fontSize: 16, fontWeight: "900", marginTop: 8 }}>First action</Text>
      <Text selectable numberOfLines={1} style={{ color: theme.label2, fontSize: 12, marginTop: 4 }}>after import</Text>
    </View>
  );
}

function MiniWidgetPreview({ theme }: { theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ width: "48%", borderRadius: 18, padding: 13, backgroundColor: "#111114" }}>
      <Text selectable style={{ color: "rgba(255,255,255,0.56)", fontSize: 10, fontWeight: "900" }}>WIDGET</Text>
      <Text selectable style={{ color: "#fff", fontSize: 16, fontWeight: "900", marginTop: 8 }}>Locked preview</Text>
      <Text selectable numberOfLines={1} style={{ color: "rgba(255,255,255,0.68)", fontSize: 12, marginTop: 4 }}>Unlock after purchase</Text>
      <View style={{ flexDirection: "row", gap: 4, marginTop: 10 }}>
        {[COLORS.green, COLORS.orange, COLORS.purple].map((color) => <View key={color} style={{ flex: 1, height: 5, borderRadius: 99, backgroundColor: color }} />)}
      </View>
    </View>
  );
}

function Onboarding({ data, mutate, nav, theme }: ScreenProps) {
  const steps = ["name", "studentType", "mainGoal", "artifacts", "build"] as const;
  const [index, setIndex] = useState(0);
  const storedFirstName = data.prefs.firstName && data.prefs.firstName !== "Student" ? data.prefs.firstName : "";
  const [profile, setProfile] = useState({
    name: storedFirstName || (data.prefs.name === "Student" ? "" : firstNameFromPrefs(data)),
    studentType: data.prefs.studentType || "School semester",
    mainGoal: data.prefs.mainGoal || data.prefs.semesterGoal || "Everything",
    scanIntent: data.prefs.scanIntent || "Syllabus PDF",
  });
  const motion = useRef(new Animated.Value(1)).current;
  const step = steps[index];
  const firstName = profile.name.trim().split(/\s+/)[0] || "there";
  const studentOptions = ["School semester", "High school classes", "College courses", "Grad school", "Online classes", "Exams"];
  const goalOptions = ["Deadlines", "Exams", "Notes", "Grades", "Study plan", "Everything"];
  const scanOptions = ["Upload PDF", "Paste syllabus", "Scan with camera", "Skip for now"];
  useEffect(() => {
    motion.setValue(0);
    Animated.timing(motion, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [index, motion]);

  const persistProfile = (complete = false, source = profile) => mutate((d) => {
    const cleanName = source.name.trim() || "Student";
    const cleanFirst = cleanName.split(/\s+/)[0] || "Student";
    return {
      ...d,
      prefs: {
        ...d.prefs,
        name: cleanName,
        firstName: cleanFirst,
        level: source.studentType,
        studentType: source.studentType,
        studentPersona: source.studentType,
        mainGoal: source.mainGoal,
        semesterGoal: source.mainGoal,
        workloadStyle: "Balanced",
        scanIntent: source.scanIntent,
        theme: "light",
        onboardingComplete: complete ? true : d.prefs.onboardingComplete,
        osLive: d.prefs.osLive,
      },
    };
  });

  const next = (source = profile) => {
    persistProfile(index === steps.length - 1, source);
    if (index < steps.length - 1) setIndex(index + 1);
    else if (source.scanIntent === "Paste syllabus") nav.push("paste", { mode: "syllabus" });
    else if (source.scanIntent === "Skip for now") nav.tab("lockedDashboard");
    else if (source.scanIntent === "Scan with camera") nav.push("scan", { action: "camera" });
    else nav.push("scan", { action: "pdf" });
  };
  const pick = (key: keyof typeof profile, value: string) => {
    const nextProfile = { ...profile, [key]: value };
    setProfile(nextProfile);
    setTimeout(() => next(nextProfile), 80);
  };
  const motionStyle = {
    opacity: motion,
    transform: [
      {
        translateY: motion.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0]
        })
      },
      {
        scale: motion.interpolate({
          inputRange: [0, 1],
          outputRange: [0.98, 1]
        })
      }
    ]
  };
  const renderOptions = (key: keyof typeof profile, opts: string[]) => (
    <View style={{ gap: 10 }}>
      {opts.map((opt) => {
        const on = profile[key] === opt;
        return (
          <Pressable key={opt} onPress={() => pick(key, opt)}>
            <Card theme={theme} style={{ padding: 17, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderColor: on ? theme.accent : theme.hairline, borderWidth: on ? 2 : 1, backgroundColor: on ? "#FFFFFF" : "rgba(255,255,255,0.72)" }}>
              <Text selectable style={{ color: theme.label, fontSize: 16, fontWeight: "900" }}>{opt}</Text>
              {on ? <CheckCircle2 color={COLORS.green} size={22} /> : <Circle color={theme.label3} size={22} />}
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
      <View style={{ paddingTop: 58, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", gap: 8 }}>
        {index ? <Pressable onPress={() => setIndex(index - 1)}><ChevronLeft color={theme.label2} size={22} /></Pressable> : <View style={{ width: 22 }} />}
        <View style={{ flex: 1, flexDirection: "row", gap: 5 }}>{steps.map((_, i) => <View key={i} style={{ flex: 1, height: 5, borderRadius: 99, backgroundColor: i <= index ? theme.accent : theme.surface3 }} />)}</View>
      </View>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
        <Animated.View style={motionStyle}>
          {step === "name" ? (
            <>
              <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: "#0A0A0D", alignItems: "center", justifyContent: "center", marginBottom: 22 }}><Icon name="sparkles" color="#fff" size={27} /></View>
              <Text selectable style={{ color: theme.label, fontSize: 36, lineHeight: 39, fontWeight: "900" }}>What should StudyPlanner call you?</Text>
              <Text selectable style={{ color: theme.label2, fontSize: 15, lineHeight: 21, marginTop: 10 }}>Let's build your semester.</Text>
              <TextInput autoFocus={Platform.OS !== "android"} value={profile.name} onChangeText={(name) => setProfile((current) => ({ ...current, name }))} placeholder="Your first name" placeholderTextColor={theme.label3} returnKeyType="next" onSubmitEditing={() => next()} style={{ marginTop: 26, minHeight: 58, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: theme.hairline, color: theme.label, paddingHorizontal: 18, fontSize: 20, fontWeight: "900" }} />
              {profile.name.trim() ? <Text selectable style={{ color: theme.label, fontSize: 20, lineHeight: 25, fontWeight: "900", marginTop: 22 }}>Nice, {firstName}.</Text> : null}
            </>
          ) : null}
          {step === "studentType" ? (
            <>
              <Text selectable style={{ color: theme.label2, fontSize: 13, fontWeight: "900", marginBottom: 8 }}>NICE, {firstName.toUpperCase()}</Text>
              <Text selectable style={{ color: theme.label, fontSize: 34, lineHeight: 37, fontWeight: "900", marginBottom: 22 }}>What are you managing?</Text>
              {renderOptions("studentType", studentOptions)}
            </>
          ) : null}
          {step === "mainGoal" ? (
            <>
              <Text selectable style={{ color: theme.label, fontSize: 34, lineHeight: 37, fontWeight: "900", marginBottom: 22 }}>What do you want under control?</Text>
              {renderOptions("mainGoal", goalOptions)}
            </>
          ) : null}
          {step === "artifacts" ? (
            <>
              <Text selectable style={{ color: theme.label, fontSize: 34, lineHeight: 37, fontWeight: "900" }}>StudyPlanner turns your schoolwork into a live plan.</Text>
              <Text selectable style={{ color: theme.label2, fontSize: 15, lineHeight: 21, marginTop: 8, marginBottom: 18 }}>Real app artifacts. No demo classes.</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                <MiniSemesterHealth theme={theme} />
                <MiniNextMove theme={theme} />
                <MiniClassPulse theme={theme} />
                <MiniPressureForecast theme={theme} />
                <MiniNotesPreparedness theme={theme} />
                <MiniWidgetPreview theme={theme} />
              </View>
            </>
          ) : null}
          {step === "build" ? (
            <>
              <Text selectable style={{ color: theme.label, fontSize: 34, lineHeight: 37, fontWeight: "900", marginBottom: 22 }}>Build your semester.</Text>
              {renderOptions("scanIntent", scanOptions)}
            </>
          ) : null}
        </Animated.View>
      </ScrollView>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 24, paddingBottom: 34, backgroundColor: "rgba(245,245,247,0.92)" }}>
        <Button label={step === "build" ? "Continue" : "Continue"} theme={theme} icon={step === "build" ? "scan" : "chevron-right"} onPress={next} />
      </View>
    </View>
  );
}

function ImportOptions({ data, mutate, nav, theme }: ScreenProps) {
  const completeAnd = (route: "scan" | "paste" | "lockedDashboard", params?: Record<string, string>) => {
    mutate((d) => ({
      ...d,
      prefs: {
        ...d.prefs,
        onboardingComplete: true,
        osLive: false,
        premium: false,
      },
    }));
    if (route === "paste") nav.push("paste", params);
    else nav.tab(route);
  };
  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: 72, paddingHorizontal: 22, paddingBottom: 120 }}>
        <Text selectable style={{ color: theme.label, fontSize: 38, lineHeight: 41, fontWeight: "900" }}>Build your semester.</Text>
        <Text selectable style={{ color: theme.label2, fontSize: 16, lineHeight: 22, marginTop: 8, marginBottom: 20 }}>Preview what StudyPlanner finds before you unlock.</Text>
        <Card theme={theme} style={{ padding: 17, backgroundColor: "#111114", marginBottom: 18 }}>
          <Text selectable style={{ color: "#fff", fontSize: 21, lineHeight: 25, fontWeight: "900" }}>Start with your syllabus.</Text>
          <Text selectable style={{ color: "rgba(255,255,255,0.72)", lineHeight: 20, marginTop: 6 }}>Classes, deadlines, exams, pressure, and your first move appear in preview.</Text>
        </Card>
        {[
          ["Upload PDF", "Pick a syllabus file", "upload", COLORS.green, () => completeAnd("scan", { action: "pdf" })],
          ["Paste manually", "Enter syllabus text", "file", COLORS.blue, () => completeAnd("paste", { mode: "syllabus" })],
          ["Scan with camera", "Photo or camera OCR", "camera", COLORS.orange, () => completeAnd("scan", { action: "camera" })],
          ["Skip for now", "View the locked dashboard", "lock", COLORS.purple, () => completeAnd("lockedDashboard")],
        ].map(([title, body, icon, color, onPress]: any) => (
          <Pressable key={title} onPress={onPress}>
            <Card theme={theme} style={{ padding: 16, flexDirection: "row", gap: 13, alignItems: "center", marginBottom: 12 }}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: `${color}1C`, alignItems: "center", justifyContent: "center" }}><Icon name={icon} color={color} /></View>
              <View style={{ flex: 1 }}>
                <Text selectable style={{ color: theme.label, fontSize: 17, fontWeight: "900" }}>{title}</Text>
                <Text selectable style={{ color: theme.label2, lineHeight: 19, marginTop: 3 }}>{body}</Text>
              </View>
              <ChevronRight color={theme.label3} size={18} />
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function LockedDashboard({ data, nav, theme, currentImport }: ScreenProps) {
  const firstName = firstNameFromPrefs(data);
  const approved = currentImport?.candidates.filter((candidate) => candidate.approved) || [];
  const previewSummary = {
    classes: approved.filter((candidate) => candidate.kind === "class").length,
    assignments: approved.filter((candidate) => candidate.kind === "task").length,
    exams: approved.filter((candidate) => candidate.kind === "exam").length,
  };
  const hasPreview = approved.length > 0;
  const features = [
    ["Workload", "Locked until your syllabus is reviewed."],
    ["Grades", "Locked until real classes exist."],
    ["Preparedness", "Locked until notes and exams exist."],
    ["Consistency", "Locked until StudyPlanner can see your plan."],
  ];
  return (
    <Screen theme={theme}>
      <View style={{ paddingHorizontal: 16, gap: 16, paddingTop: 4 }}>
        <View style={{ gap: 8, paddingHorizontal: 2 }}>
          <Text selectable style={{ color: theme.label2, fontSize: 13, fontWeight: "900" }}>LOCKED PREVIEW</Text>
          <Text selectable style={{ color: theme.label, fontSize: 36, lineHeight: 39, fontWeight: "900" }}>{firstName}, build your semester.</Text>
          <Text selectable style={{ color: theme.label2, fontSize: 16, lineHeight: 22 }}>Upload a syllabus to preview what StudyPlanner finds. Unlock only when you are ready to apply it.</Text>
        </View>

        <View style={{ borderRadius: 28, padding: 20, backgroundColor: "#111114", overflow: "hidden" }}>
          <View style={{ width: 52, height: 52, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Icon name="scan" color="#FFFFFF" size={26} />
          </View>
          <Text selectable style={{ color: "rgba(255,255,255,0.62)", fontSize: 12, fontWeight: "900", marginBottom: 7 }}>SYLLABUS FIRST</Text>
          <Text selectable style={{ color: "#FFFFFF", fontSize: 25, lineHeight: 29, fontWeight: "900" }}>Turn your syllabus into a live plan.</Text>
          <View style={{ gap: 11, marginTop: 17 }}>
            {[
              ["1", "Upload syllabus"],
              ["2", "Review deadlines"],
              ["3", "Unlock your semester"],
            ].map(([step, label]) => (
              <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" }}>
                  <Text selectable style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "900" }}>{step}</Text>
                </View>
                <Text selectable style={{ color: "#FFFFFF", flex: 1, fontSize: 16, fontWeight: "900" }}>{label}</Text>
              </View>
            ))}
          </View>
          <View style={{ marginTop: 16 }}>
            <Pressable accessibilityRole="button" onPress={() => nav.tab("scan")} style={{ minHeight: 51, borderRadius: 999, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}>
              <Icon name="scan" color="#111114" size={18} />
              <Text style={{ color: "#111114", fontWeight: "900" }}>Scan syllabus</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => nav.push("paste", { mode: "syllabus" })} style={{ minHeight: 48, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", marginTop: 10 }}>
              <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>Paste manually</Text>
            </Pressable>
          </View>
        </View>

        {hasPreview ? (
          <Card theme={theme} style={{ padding: 17, backgroundColor: theme.dark ? "#18222A" : "#EEF7FF" }}>
            <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "900", marginBottom: 10 }}>PREVIEW READY</Text>
            <View style={{ flexDirection: "row", gap: 9, marginBottom: 12 }}>
              <MiniMetric value={previewSummary.classes} label="classes" color={COLORS.blue} theme={theme} />
              <MiniMetric value={previewSummary.assignments} label="assignments" color={COLORS.orange} theme={theme} />
              <MiniMetric value={previewSummary.exams} label="exams" color={COLORS.purple} theme={theme} />
            </View>
            <Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 17 }}>Unlock to apply.</Text>
            <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 4 }}>This preview has not populated the dashboard, widgets, reminders, or active semester.</Text>
            <Button label="Unlock to apply" theme={theme} icon="crown" onPress={() => nav.push("paywall")} />
          </Card>
        ) : null}

        <Card theme={theme} style={{ padding: 18, backgroundColor: theme.surface }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <View>
              <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "900" }}>SEMESTER HEALTH</Text>
              <Text selectable style={{ color: theme.label, fontSize: 25, lineHeight: 29, fontWeight: "900", marginTop: 4 }}>Locked preview</Text>
            </View>
            <Pill text="Locked" color={COLORS.orange} theme={theme} icon="lock" />
          </View>
          <Text selectable style={{ color: theme.label2, lineHeight: 20, marginBottom: 14 }}>Your score appears after your syllabus is reviewed and applied.</Text>
          <View style={{ gap: 10 }}>
            {features.map(([title, body]) => (
              <View key={title} style={{ padding: 12, borderRadius: 15, backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.hairline }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Lock color={theme.label3} size={15} />
                  <Text selectable style={{ color: theme.label, fontWeight: "900", flex: 1 }}>{title}</Text>
                  <Text selectable style={{ color: theme.label3, fontWeight: "900", fontSize: 12 }}>after scan</Text>
                </View>
                <View style={{ height: 8, borderRadius: 999, backgroundColor: theme.hairline, marginTop: 10, overflow: "hidden" }}>
                  <View style={{ width: "34%", height: 8, borderRadius: 999, backgroundColor: theme.surface3 }} />
                </View>
                <Text selectable style={{ color: theme.label2, lineHeight: 18, marginTop: 7, fontSize: 13 }}>{body}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Button label="Unlock StudyPlanner" theme={theme} icon="crown" onPress={() => nav.push("paywall")} />
        <Button label="Restore Purchases" theme={theme} secondary icon="refresh" onPress={() => nav.push("paywall")} />
      </View>
    </Screen>
  );
}

function LegalScreen({ nav, theme, kind }: ScreenProps & { kind: "terms" | "privacy" }) {
  const isPrivacy = kind === "privacy";
  const rows = isPrivacy
    ? [
        ["Data source", "StudyPlanner stores your planner data on this device."],
        ["Imports", "Syllabus, note, PDF, and camera text are used to create your reviewed preview and semester plan."],
        ["Purchases", `Subscription purchases and restores are handled by ${storeDisplayName()}.`],
        ["Sharing", "StudyPlanner does not sell your planner data."],
        ["Support", "Email support to request help with app data, purchases, or privacy questions."],
      ]
    : [
        ["Subscription", `StudyPlanner uses auto-renewing subscriptions shown and confirmed by ${storeDisplayName()} before purchase.`],
        ["Access", "A valid active entitlement is required to apply imports, use the dashboard, schedule reminders, and sync widgets."],
        ["Billing", `Manage or cancel subscriptions from your ${Platform.OS === "android" ? "Google Play" : "Apple"} account.`],
        ["Standard terms", "Apple's standard EULA applies unless a separate written agreement is provided."],
      ];
  return (
    <Screen theme={theme}>
      <BackHeader nav={nav} theme={theme} label={isPrivacy ? "Privacy Policy" : "Terms of Use"} />
      <View style={{ paddingHorizontal: 16, gap: 14 }}>
        <Header title={isPrivacy ? "Privacy Policy" : "Terms of Use"} sub="StudyPlanner" theme={theme} />
        <Card theme={theme} style={{ overflow: "hidden" }}>
          {rows.map(([title, body], index) => (
            <View key={title} style={{ padding: 15, borderBottomWidth: index === rows.length - 1 ? 0 : 1, borderBottomColor: theme.hairline }}>
              <Text selectable style={{ color: theme.label, fontSize: 16, fontWeight: "900" }}>{title}</Text>
              <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 4 }}>{body}</Text>
            </View>
          ))}
        </Card>
        {!isPrivacy ? <Button label="Open Apple standard EULA" theme={theme} secondary icon="file" onPress={() => openExternal(TERMS_URL)} /> : null}
        <Button label="Email support" theme={theme} secondary icon="file" onPress={() => openExternal(SUPPORT_URL)} />
      </View>
    </Screen>
  );
}

function Paywall({ data, mutate, nav, theme, params, currentImport, setCurrentImport, setEntitlementStatus }: ScreenProps) {
  const initialPlans = useMemo(() => fallbackPlans(), []);
  const firstName = firstNameFromPrefs(data);
  const storeName = storeDisplayName();
  const [plans, setPlans] = useState<PaywallPlan[]>(initialPlans);
  const [selected, setSelected] = useState(initialPlans[0].id);
  const [storePlansReady, setStorePlansReady] = useState(false);
  const [busy, setBusy] = useState<"loading" | "purchase" | "restore" | "checking" | null>("loading");
  const [message, setMessage] = useState(`Connecting to ${storeName}...`);

  const unlock = (productId?: string, checkedAt = new Date().toISOString()) => {
    setEntitlementStatus("active");
    mutate((d) => {
      const unlocked = premiumData(d, productId || selected, checkedAt);
      return currentImport ? applyImport(unlocked, currentImport) : unlocked;
    }, { allowValidatedPremium: true });
    if (currentImport) setCurrentImport(null);
    if (currentImport) nav.tab("today");
    else if (params.next === "scan") nav.tab("scan");
    else if (params.next === "paste") nav.push("paste", { mode: params.mode || "syllabus" });
    else nav.tab("today");
  };

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([initializeStudyPlannerStore(), loadStorePlans(), checkStudyPlannerEntitlement()])
      .then((results) => {
        if (!mounted) return;
        const planResult = results[1];
        let localizedPlansReady = false;
        if (planResult.status === "fulfilled") {
          setPlans(planResult.value);
          setSelected((current) => planResult.value.some((plan) => plan.id === current) ? current : planResult.value[0]?.id || current);
          localizedPlansReady = planResult.value.some((plan) => !plan.displayPrice.startsWith("Shown by "));
          setStorePlansReady(localizedPlansReady);
        }
        const entitlementResult = results[2];
        if (entitlementResult.status === "fulfilled" && entitlementResult.value.isPremium) {
          unlock(entitlementResult.value.productId, entitlementResult.value.checkedAt);
          return;
        }
        setBusy(null);
        setMessage(localizedPlansReady ? "Choose a StudyPlanner plan to continue." : `${storeName} pricing is not loaded. Restore is still available.`);
      })
      .catch((error) => {
        if (!mounted) return;
        setBusy(null);
        setMessage(error instanceof Error ? error.message : `${storeName} is not available right now.`);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const purchase = async () => {
    if (!storePlansReady) {
      setMessage(`${storeName} pricing is still loading. Try again in a moment.`);
      return;
    }
    setBusy("purchase");
    setMessage(`Opening the ${storeName} purchase sheet...`);
    try {
      await purchasePlan(selected);
      setMessage(`Approve the subscription in the ${storeName} sheet. StudyPlanner unlocks as soon as the store confirms it.`);
      setBusy(null);
    } catch (error) {
      setBusy(null);
      setMessage(error instanceof Error ? error.message : `${storeName} could not start the purchase.`);
    }
  };

  const restore = async () => {
    setBusy("restore");
    setMessage(`Checking your ${storeName} account...`);
    try {
      const entitlement = await restoreStudyPlannerPurchases();
      if (entitlement.isPremium) {
        unlock(entitlement.productId, entitlement.checkedAt);
        maybeShowUnlockSuccess("restore_action");
      } else {
        setBusy(null);
        setMessage(`No active StudyPlanner subscription was found for this ${Platform.OS === "android" ? "Google Play account" : "Apple ID"}.`);
      }
    } catch (error) {
      setBusy(null);
      setMessage(error instanceof Error ? error.message : "Restore could not be completed.");
    }
  };

  const selectedPlan = plans.find((plan) => plan.id === selected) || plans[0] || initialPlans[0];
  const importCandidates = currentImport?.candidates.filter((candidate) => candidate.approved) || [];
  const importSummary = {
    classes: importCandidates.filter((candidate) => candidate.kind === "class").length,
    assignments: importCandidates.filter((candidate) => candidate.kind === "task").length,
    exams: importCandidates.filter((candidate) => candidate.kind === "exam").length,
    firstAction: importCandidates.find((candidate) => candidate.kind === "task" || candidate.kind === "exam")?.title,
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close paywall" onPress={nav.back} style={{ position: "absolute", top: 56, right: 18, zIndex: 3, width: 44, height: 44, borderRadius: 999, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.hairline }}>
        <X color={theme.label} size={20} />
      </Pressable>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: 68, paddingHorizontal: 20, paddingBottom: 34 }}>
        <RNImage source={require("./assets/icon.png")} style={{ width: 62, height: 62, borderRadius: 19, marginBottom: 18 }} />
        <Text selectable style={{ color: theme.label, fontSize: 36, lineHeight: 39, fontWeight: "900", marginBottom: 10 }}>{firstName}, build your live semester.</Text>
        <Text selectable style={{ color: theme.label2, fontSize: 16, lineHeight: 22, marginBottom: 20 }}>{currentImport ? "Your preview is ready. Unlock to apply it to the live dashboard, reminders, and widgets." : "Scan first, then unlock to keep your semester visible across the dashboard, widgets, reminders, and next moves."}</Text>
        <Card theme={theme} style={{ padding: 15, marginBottom: 14, backgroundColor: "#111114" }}>
          {currentImport ? (
            <View>
              <Text selectable style={{ color: "rgba(255,255,255,0.66)", fontSize: 12, fontWeight: "900", marginBottom: 10 }}>READY TO APPLY</Text>
              <View style={{ flexDirection: "row", gap: 9, marginBottom: 12 }}>
                <View style={{ flex: 1 }}><Text selectable style={{ color: "#fff", fontSize: 24, fontWeight: "900" }}>{importSummary.classes}</Text><Text selectable style={{ color: "rgba(255,255,255,0.66)", fontSize: 12, fontWeight: "800" }}>classes</Text></View>
                <View style={{ flex: 1 }}><Text selectable style={{ color: "#fff", fontSize: 24, fontWeight: "900" }}>{importSummary.assignments}</Text><Text selectable style={{ color: "rgba(255,255,255,0.66)", fontSize: 12, fontWeight: "800" }}>assignments</Text></View>
                <View style={{ flex: 1 }}><Text selectable style={{ color: "#fff", fontSize: 24, fontWeight: "900" }}>{importSummary.exams}</Text><Text selectable style={{ color: "rgba(255,255,255,0.66)", fontSize: 12, fontWeight: "800" }}>exams</Text></View>
              </View>
              <Text selectable style={{ color: "#fff", fontSize: 17, lineHeight: 22, fontWeight: "900" }}>{importSummary.firstAction || "Review your imported semester"}</Text>
              <Text selectable style={{ color: "rgba(255,255,255,0.72)", marginTop: 4, lineHeight: 19 }}>Unlock to save this plan, schedule reminders, and sync widgets.</Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
                <Icon name="lock" color="#fff" size={25} />
              </View>
              <View style={{ flex: 1 }}>
                <Text selectable style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>{data.prefs.mainGoal || data.prefs.semesterGoal}</Text>
                <Text selectable style={{ color: "rgba(255,255,255,0.7)", marginTop: 3, lineHeight: 19 }}>{data.prefs.studentType || data.prefs.studentPersona} · {data.prefs.workloadStyle} · {data.prefs.scanIntent}</Text>
              </View>
            </View>
          )}
        </Card>
        <View style={{ gap: 10, marginBottom: 18 }}>
          {plans.map((plan) => {
            const on = selected === plan.id;
            return (
              <Pressable key={plan.id} onPress={() => setSelected(plan.id)}>
                <Card theme={theme} style={{ padding: 15, borderWidth: on ? 2 : 1, borderColor: on ? theme.accent : theme.hairline }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 26, height: 26, borderRadius: 99, borderWidth: on ? 0 : 2, borderColor: theme.label3, backgroundColor: on ? theme.accent : "transparent", alignItems: "center", justifyContent: "center" }}>
                      {on ? <Check color="#fff" size={16} strokeWidth={3} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <Text selectable style={{ color: theme.label, fontSize: 17, fontWeight: "900" }}>{plan.cadence}</Text>
                        {plan.recommended ? <Pill text="Best value" color={COLORS.green} theme={theme} icon="star" /> : null}
                      </View>
                      <Text selectable style={{ color: theme.label2, marginTop: 4 }}>{plan.description}</Text>
                    </View>
                    <Text selectable style={{ color: theme.label, fontWeight: "900" }}>{plan.displayPrice}</Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
        <Card theme={theme} style={{ padding: 15, backgroundColor: theme.dark ? "#18222A" : "#EEF7FF", marginBottom: 14 }}>
          {[
            ["file", "Apply your syllabus"],
            ["heart", "Track Semester Health"],
            ["target", "Stay ahead of exams"],
            ["bell", "Get reminder timing"],
            ["grid", "Keep widgets current"],
          ].map(([icon, text]) => (
            <View key={text} style={{ flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 6 }}>
              <Icon name={icon} color={theme.accent} size={18} />
              <Text selectable style={{ color: theme.label, flex: 1, fontWeight: "800" }}>{text}</Text>
            </View>
          ))}
        </Card>
        <Text selectable style={{ color: theme.label2, lineHeight: 19, marginBottom: 10 }}>{message}</Text>
        <Button label={busy === "purchase" ? `Opening ${storeName}...` : storePlansReady ? `Unlock ${selectedPlan.cadence}` : `Loading ${storeName} price`} theme={theme} icon="crown" onPress={busy || !storePlansReady ? undefined : purchase} />
        <Button label={busy === "restore" ? "Restoring..." : "Restore Purchases"} theme={theme} secondary icon="refresh" onPress={busy ? undefined : restore} />
        <Text selectable style={{ color: theme.label3, fontSize: 12, lineHeight: 17, marginTop: 14 }}>Auto-renewing subscription. Price and terms are shown by {storeName} before purchase. Manage or cancel in your {Platform.OS === "android" ? "Google Play subscriptions" : "Apple subscriptions"}.</Text>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 18, marginTop: 12 }}>
          <Pressable onPress={() => nav.push("terms")}><Text style={{ color: theme.accent, fontSize: 12, fontWeight: "900" }}>Terms of Use</Text></Pressable>
          <Pressable onPress={() => nav.push("privacy")}><Text style={{ color: theme.accent, fontSize: 12, fontWeight: "900" }}>Privacy Policy</Text></Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Today({ data, mutate, nav, theme }: ScreenProps) {
  const snapshot = useMemo(() => buildDashboardSnapshot(data), [data]);
  const semester = useMemo(() => buildSemesterSnapshot(data), [data]);
  const narrative = useMemo(() => buildSemesterNarrative(data, semester), [data, semester]);
  const loop = useMemo(() => buildSemesterLoop(data), [data]);
  const hasSemesterData = hasRealSemesterData(data);
  const activeTasks = data.tasks.filter((t) => !t.done);
  const dueNow = activeTasks.filter((t) => daysUntilTask(t) <= 0);
  const insight = deadlineInsight(data);
  const risks = semester.riskFactors;
  const firstBlock = semester.schedulePlan.blocks.find((block) => !block.completed);
  const firstPulse = semester.classPulses[0];
  const firstPulseClass = safeClassFor(data, firstPulse?.classId);
  const preparedness = semester.semesterHealth.dimensions.preparedness;
  const timeline = useMemo(() => {
    const within30 = (iso: string) => {
      const days = Math.ceil((new Date(`${iso}T12:00:00`).getTime() - new Date().setHours(12, 0, 0, 0)) / 86400000);
      return days >= 0 && days <= 30;
    };
    return {
      assignments: data.tasks.filter((task) => !task.done && within30(task.dueDate)).length,
      exams: data.exams.filter((exam) => within30(exam.dueDate)).length,
      pressureDays: semester.pressureForecast.weekLoads.filter((load) => load >= 64).length,
    };
  }, [data.tasks, data.exams, semester.pressureForecast.weekLoads]);
  const toggle = (id: string) => mutate((d) => {
    const task = d.tasks.find((item) => item.id === id);
    const tasks = d.tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t);
    const updated = { ...d, tasks, studyBlocks: buildStudyPlan({ ...d, tasks }) };
    return withFeedback(d, updated, "completeTask", { classId: task?.classId, actionId: id, dimension: "workload" });
  });

  if (!hasSemesterData) {
    return (
      <Screen theme={theme}>
        <Header title={snapshot.greeting} sub={todayHeaderLabel()} theme={theme} right={<Pressable onPress={() => nav.tab("profile")}><View style={{ width: 42, height: 42, borderRadius: 99, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#fff", fontWeight: "900", fontSize: 17 }}>{userInitial(data)}</Text></View></Pressable>} />
        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <SemesterHealthHero semester={semester} narrative={narrative} theme={theme} hasSemesterData={false} />
          <Card theme={theme} style={{ padding: 18, backgroundColor: "#111114" }}>
            <View style={{ width: 52, height: 52, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Icon name="scan" color="#FFFFFF" size={25} />
            </View>
            <Text selectable style={{ color: "rgba(255,255,255,0.62)", fontSize: 12, fontWeight: "900", marginBottom: 7 }}>BUILD YOUR SEMESTER</Text>
            <Text selectable style={{ color: "#FFFFFF", fontSize: 26, lineHeight: 30, fontWeight: "900" }}>Scan your syllabus to create the dashboard.</Text>
            <Text selectable style={{ color: "rgba(255,255,255,0.72)", lineHeight: 20, marginTop: 8 }}>Classes, assignments, exams, reminders, and health appear only after real school data is reviewed and applied.</Text>
            <Button label="Scan syllabus" theme={theme} icon="scan" onPress={() => nav.tab("scan")} />
            <View style={{ flexDirection: "row", gap: 9 }}>
              <View style={{ flex: 1 }}>
                <Button label="Paste text" theme={theme} secondary icon="file" onPress={() => nav.push("paste", { mode: "syllabus" })} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Upload PDF" theme={theme} secondary icon="upload" onPress={() => nav.push("scan", { action: "pdf" })} />
              </View>
            </View>
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Screen theme={theme}>
      <Header title={snapshot.greeting} sub={todayHeaderLabel()} theme={theme} right={<Pressable onPress={() => nav.tab("profile")}><View style={{ width: 42, height: 42, borderRadius: 99, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#fff", fontWeight: "900", fontSize: 17 }}>{userInitial(data)}</Text></View></Pressable>} />
      <View style={{ paddingHorizontal: 16, gap: 18 }}>
        <SemesterHealthHero semester={semester} narrative={narrative} theme={theme} hasSemesterData={hasSemesterData} />
        {semester.feedbackEvents[0] ? <FeedbackLoopCard event={semester.feedbackEvents[0]} theme={theme} /> : null}
        <Card theme={theme} style={{ padding: 18, backgroundColor: theme.dark ? "#17171C" : "#FFFFFF" }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${theme.accent}1C`, alignItems: "center", justifyContent: "center" }}><Sparkles color={theme.accent} size={21} /></View>
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: theme.label, fontSize: 18, fontWeight: "900" }}>Next Move</Text>
              <Text selectable style={{ color: theme.label2, marginTop: 2 }}>{narrative.nextMoveLabel}</Text>
            </View>
          </View>
          <View style={{ gap: 9 }}>
            <Pressable onPress={() => snapshot.nextClass ? nav.push("classDetail", { id: snapshot.nextClass.classId }) : nav.tab("classes")} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Icon name="classes" color={snapshot.nextClass?.color || COLORS.blue} size={18} />
              <Text selectable style={{ color: theme.label2, width: 86, fontWeight: "800" }}>Next class</Text>
              <Text selectable numberOfLines={1} style={{ color: theme.label, flex: 1, fontWeight: "900" }}>{snapshot.nextClass ? `${snapshot.nextClass.code} · ${new Date(snapshot.nextClass.startsAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}` : "Add a class"}</Text>
            </Pressable>
            <Pressable onPress={() => snapshot.nearestDeadline ? nav.push("taskDetail", { id: snapshot.nearestDeadline.taskId }) : nav.tab("scan")} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Icon name="target" color={COLORS.orange} size={18} />
              <Text selectable style={{ color: theme.label2, width: 86, fontWeight: "800" }}>Deadline</Text>
              <Text selectable numberOfLines={1} style={{ color: theme.label, flex: 1, fontWeight: "900" }}>{snapshot.nearestDeadline ? `${snapshot.nearestDeadline.dueLabel} · ${snapshot.nearestDeadline.title}` : "No active deadline"}</Text>
            </Pressable>
            <Pressable onPress={() => firstBlock ? nav.push("studySession", { id: firstBlock.id }) : nav.tab("scan")} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Icon name="clock" color={COLORS.purple} size={18} />
              <Text selectable style={{ color: theme.label2, width: 86, fontWeight: "800" }}>Focus</Text>
              <Text selectable numberOfLines={1} style={{ color: theme.label, flex: 1, fontWeight: "900" }}>{firstBlock ? `${firstBlock.time} · ${firstBlock.title}` : "Scan or quick add to plan"}</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", gap: 9, marginTop: 14 }}>
            <Pressable onPress={() => nav.tab("plan")} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 10 }}><Text style={{ color: "#fff", fontWeight: "900" }}>Open plan</Text></Pressable>
            <Pressable onPress={() => firstBlock ? nav.push("studySession", { id: firstBlock.id }) : nav.tab("scan")} style={{ backgroundColor: theme.surface2, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 10 }}><Text style={{ color: theme.label, fontWeight: "900" }}>{firstBlock ? "Start focus" : "Scan first"}</Text></Pressable>
          </View>
        </Card>
        {preparedness.score < 75 || !data.notes.length ? (
          <Pressable onPress={() => nav.tab("scan")}>
            <Card theme={theme} style={{ padding: 15, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: theme.dark ? "#211E2B" : "#F7F0FF" }}>
              <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: `${COLORS.purple}20`, alignItems: "center", justifyContent: "center" }}><NotebookPen color={COLORS.purple} size={21} /></View>
              <View style={{ flex: 1 }}>
                <Text selectable style={{ color: theme.label, fontWeight: "900" }}>{narrative.notesNudge}</Text>
                <Text selectable numberOfLines={1} style={{ color: theme.label2, marginTop: 2 }}>Notes → Preparedness → Class Pulse</Text>
              </View>
              <ChevronRight color={theme.label3} size={18} />
            </Card>
          </Pressable>
        ) : null}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Stat n={snapshot.nextClass ? 1 : 0} label="next class" icon="classes" color={COLORS.blue} theme={theme} />
          <Stat n={dueNow.length} label="due today" icon="target" color={COLORS.orange} theme={theme} />
          <Stat n={minutesLabel(snapshot.todayPressure.studyMinutes)} label="study today" icon="clock" color={COLORS.purple} theme={theme} />
        </View>
        <Card theme={theme} style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View>
              <Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 18 }}>Next 30 Days</Text>
              <Text selectable style={{ color: theme.label2, marginTop: 3 }}>{timeline.pressureDays ? `${timeline.pressureDays} pressure ${timeline.pressureDays === 1 ? "day" : "days"}` : "Clear runway"}</Text>
            </View>
            <Pill text={narrative.pressureLabel} color={colorForState(semester.pressureForecast.colorState)} theme={theme} />
          </View>
          <View style={{ flexDirection: "row", gap: 9 }}>
            <MiniMetric value={timeline.assignments} label="assignments" color={COLORS.orange} theme={theme} />
            <MiniMetric value={timeline.exams} label="exams" color={COLORS.purple} theme={theme} />
            <MiniMetric value={timeline.pressureDays} label="pressure" color={timeline.pressureDays ? COLORS.orange : COLORS.green} theme={theme} />
          </View>
        </Card>
        <Card theme={theme} style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
            <View style={{ width: 74, height: 74, borderRadius: 99, borderWidth: 8, borderColor: loop.status === "strained" ? COLORS.red : loop.status === "steady" ? COLORS.orange : COLORS.green, alignItems: "center", justifyContent: "center" }}>
              <Text selectable style={{ color: theme.label, fontSize: 22, fontWeight: "900" }}>{loop.score}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: theme.label, fontSize: 18, fontWeight: "900" }}>{narrative.pressureLabel}</Text>
              <Text selectable style={{ color: theme.label2, marginTop: 4, lineHeight: 19 }}>{narrative.primaryDriver}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
            {loop.rings.map((ring) => <View key={ring.label} style={{ flex: 1 }}><Text selectable style={{ color: ring.color, fontWeight: "900", fontSize: 12 }}>{ring.label}</Text><ProgressBar value={ring.value} color={ring.color} theme={theme} height={7} /></View>)}
          </View>
        </Card>
        <View>
          <Section title="Risk Radar" action="Replan" onAction={() => mutate((d) => ({ ...d, studyBlocks: buildStudyPlan(d) }))} theme={theme} />
          <View style={{ gap: 9 }}>{risks.slice(0, 3).map((risk) => (
            <Pressable key={risk.id} onPress={() => risk.taskId ? nav.push("taskDetail", { id: risk.taskId }) : risk.classId ? nav.push("classDetail", { id: risk.classId }) : nav.tab("plan")}>
              <Card theme={theme} style={{ padding: 13, flexDirection: "row", gap: 12, alignItems: "center" }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: `${risk.color}20`, alignItems: "center", justifyContent: "center" }}><AlertTriangle color={risk.color} size={19} /></View>
                <View style={{ flex: 1 }}><Text selectable numberOfLines={1} style={{ color: theme.label, fontWeight: "900" }}>{risk.label}</Text><Text selectable numberOfLines={1} style={{ color: theme.label2 }}>{risk.detail}</Text></View>
                <Text selectable style={{ color: risk.color, fontWeight: "900" }}>{risk.score}</Text>
              </Card>
            </Pressable>
          ))}</View>
        </View>
        <View>
          <Section title="Upcoming Deadlines" action="All" onAction={() => nav.push("tasks")} theme={theme} />
          <Card theme={theme} style={{ overflow: "hidden" }}>{activeTasks.slice().sort((a, b) => daysUntilTask(a) - daysUntilTask(b)).slice(0, 3).map((t) => <TaskRow key={t.id} task={t} data={data} theme={theme} onToggle={() => toggle(t.id)} onOpen={() => nav.push("taskDetail", { id: t.id })} />)}</Card>
        </View>
        <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#241E33" : "#F7F0FF" }}>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 8 }}><Icon name="sparkles" color={COLORS.purple} size={18} /><Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 16 }}>{insight.headline}</Text></View>
          <Text selectable style={{ color: theme.label, lineHeight: 21 }}>{insight.body}</Text>
          <View style={{ flexDirection: "row", gap: 9, marginTop: 13 }}>
            <Pressable onPress={() => nav.tab("plan")} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 10 }}><Text style={{ color: "#fff", fontWeight: "900" }}>View plan</Text></Pressable>
            <Pressable onPress={() => {
              if (data.studyBlocks[0]) nav.push("studySession", { id: data.studyBlocks[0].id });
              else mutate((d) => ({ ...d, studyBlocks: buildStudyPlan(d) }));
            }} style={{ backgroundColor: theme.surface, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 10 }}><Text style={{ color: theme.label, fontWeight: "900" }}>Start focus</Text></Pressable>
          </View>
        </Card>
        <Card theme={theme} style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <ClassGlyph c={firstPulseClass} size={42} />
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: theme.label, fontSize: 17, fontWeight: "900" }}>{firstPulseClass.code} forecast · {firstPulse?.forecastLabel}</Text>
              <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 3 }}>{firstPulse?.reason || "Add grades, tasks, or notes for a tighter forecast."}</Text>
            </View>
            <Pill text={firstPulse?.mode || "unknown"} color={firstPulse ? colorForState(firstPulse.colorState) : theme.label2} theme={theme} />
          </View>
        </Card>
        <Card theme={theme} style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 17 }}>Pressure Forecast</Text>
            <Pill text={semester.pressureForecast.label} color={colorForState(semester.pressureForecast.colorState)} theme={theme} />
          </View>
          <View style={{ flexDirection: "row", gap: 7 }}>{semester.pressureForecast.weekLoads.map((load, index) => <View key={`${load}${index}`} style={{ flex: 1, alignItems: "center", gap: 5 }}><View style={{ width: "100%", height: 46, borderRadius: 10, backgroundColor: theme.surface2, justifyContent: "flex-end", overflow: "hidden" }}><View style={{ height: `${Math.max(8, Math.min(100, load))}%`, backgroundColor: load > 85 ? COLORS.red : load > 64 ? COLORS.orange : load > 38 ? COLORS.yellow : COLORS.green }} /></View><Text style={{ color: theme.label2, fontSize: 11, fontWeight: "900" }}>{semester.pressureForecast.weekLabels[index]}</Text></View>)}</View>
          {semester.pressureForecast.recoverySuggestion ? <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 10 }}>{semester.pressureForecast.recoverySuggestion}</Text> : null}
        </Card>
        <View>
          <Section title="Class Pulse" action="Classes" onAction={() => nav.tab("classes")} theme={theme} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 11 }}>{semester.classPulses.map((pulse) => { const c = safeClassFor(data, pulse.classId); return <Pressable key={c.id} onPress={() => nav.push("classDetail", { id: c.id })}><Card theme={theme} style={{ width: 158, padding: 13 }}><View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}><ClassGlyph c={c} size={34} /><View style={{ alignItems: "flex-end" }}><Text style={{ color: colorForState(pulse.colorState), fontWeight: "900" }}>{pulse.forecastLabel}</Text><Text style={{ color: theme.label2, fontSize: 10, fontWeight: "900" }}>{pulse.trend}</Text></View></View><Text selectable numberOfLines={1} style={{ color: theme.label, fontWeight: "900" }}>{c.code}</Text><Text selectable numberOfLines={2} style={{ color: theme.label2, marginTop: 2, minHeight: 34 }}>{pulse.reason}</Text><Text selectable numberOfLines={1} style={{ color: colorForState(pulse.colorState), marginTop: 9, fontWeight: "800" }}>{pulse.nudge}</Text></Card></Pressable>; })}</ScrollView>
        </View>
        <View>
          <Section title="Notes Activity" action="All notes" onAction={() => nav.push("notes")} theme={theme} />
          <View style={{ gap: 10 }}>{data.notes.slice(0, 2).map((n) => <NoteCard key={n.id} note={n} data={data} theme={theme} onOpen={() => nav.push("noteDetail", { id: n.id })} />)}</View>
        </View>
      </View>
    </Screen>
  );
}

function Stat({ n, label, icon, color, theme }: { n: string | number; label: string; icon: string; color: string; theme: ReturnType<typeof palette> }) {
  return <Card theme={theme} style={{ flex: 1, padding: 13 }}><Icon name={icon} color={color} size={18} /><Text selectable style={{ color: theme.label, fontSize: 24, fontWeight: "900", marginTop: 7 }}>{n}</Text><Text selectable numberOfLines={1} style={{ color: theme.label2, fontSize: 12 }}>{label}</Text></Card>;
}

function MiniMetric({ value, label, color, theme }: { value: string | number; label: string; color: string; theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ flex: 1, borderRadius: 16, backgroundColor: theme.surface2, padding: 12 }}>
      <Text selectable style={{ color, fontSize: 23, fontWeight: "900" }}>{value}</Text>
      <Text selectable numberOfLines={1} style={{ color: theme.label2, fontSize: 12, fontWeight: "800", marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle as any);

function HealthRing({ score, color, theme, size = 122 }: { score: number; color: string; theme: ReturnType<typeof palette>; size?: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: Math.max(0, Math.min(100, score)),
      duration: 760,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, score]);
  const dashOffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <SvgCircle cx={size / 2} cy={size / 2} r={radius} stroke={theme.surface2} strokeWidth={stroke} fill="none" />
        <AnimatedSvgCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset as any}
        />
      </Svg>
      <Text selectable style={{ color: theme.label, fontSize: size > 100 ? 31 : 22, lineHeight: size > 100 ? 35 : 26, fontWeight: "900" }}>{score}</Text>
      <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "800" }}>score</Text>
    </View>
  );
}

function SemesterHealthHero({ semester, narrative, theme, hasSemesterData = true }: { semester: ReturnType<typeof buildSemesterSnapshot>; narrative: ReturnType<typeof buildSemesterNarrative>; theme: ReturnType<typeof palette>; hasSemesterData?: boolean }) {
  const statusColor = colorForState(narrative.colorState);
  const dims = narrative.dimensions;
  if (!hasSemesterData) {
    return (
      <Card theme={theme} style={{ padding: 20, backgroundColor: theme.surface }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "900", marginBottom: 4 }}>SEMESTER HEALTH</Text>
            <Text selectable style={{ color: theme.label, fontSize: 31, lineHeight: 34, fontWeight: "900" }}>Add Syllabus</Text>
            <Text selectable style={{ color: theme.label2, fontSize: 15, lineHeight: 20, marginTop: 5, fontWeight: "900" }}>No semester loaded.</Text>
          </View>
          <Pill text="Start here" color={theme.accent} theme={theme} />
        </View>
        <View style={{ flexDirection: "row", gap: 18, alignItems: "center" }}>
          <HealthRing score={0} color={theme.accent} theme={theme} />
          <View style={{ flex: 1, gap: 9 }}>
            {["Workload", "Grades", "Preparedness", "Consistency"].map((label) => (
              <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: label === "Consistency" ? 0 : 1, borderBottomColor: theme.hairline }}>
                <Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 13 }}>{label}</Text>
                <Text selectable style={{ color: theme.label3, fontWeight: "900", fontSize: 13 }}>--</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ marginTop: 16, padding: 13, borderRadius: 16, backgroundColor: theme.surface2 }}>
          <Text selectable style={{ color: theme.label, fontWeight: "900" }}>Next Move</Text>
          <Text selectable style={{ color: theme.accent, lineHeight: 20, marginTop: 4, fontWeight: "900" }}>Scan syllabus</Text>
          <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 4 }}>Build your semester first.</Text>
        </View>
      </Card>
    );
  }
  return (
    <Card theme={theme} style={{ padding: 20, backgroundColor: theme.surface }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "900", marginBottom: 4 }}>SEMESTER HEALTH</Text>
          <Text selectable style={{ color: theme.label, fontSize: 31, lineHeight: 34, fontWeight: "900" }}>{narrative.state}</Text>
          <Text selectable style={{ color: statusColor, fontSize: 15, lineHeight: 20, marginTop: 5, fontWeight: "900" }}>{narrative.primaryDriver}</Text>
        </View>
        <Pill text={narrative.healthLabel} color={statusColor} theme={theme} />
      </View>
      <View style={{ flexDirection: "row", gap: 18, alignItems: "center" }}>
        <HealthRing score={semester.semesterHealth.overallScore} color={statusColor} theme={theme} />
        <View style={{ flex: 1, gap: 10 }}>
          {dims.map((dim) => (
            <View key={dim.key}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 13 }}>{dim.trend} {dim.label}</Text>
                <Text selectable style={{ color: colorForState(dim.colorState), fontWeight: "900", fontSize: 13 }}>{dim.score}</Text>
              </View>
              <ProgressBar value={dim.score / 100} color={colorForState(dim.colorState)} theme={theme} height={7} />
            </View>
          ))}
        </View>
      </View>
      <View style={{ marginTop: 16, padding: 13, borderRadius: 16, backgroundColor: theme.surface2 }}>
        <Text selectable style={{ color: theme.label, fontWeight: "900" }}>Next Move</Text>
        <Text selectable style={{ color: statusColor, lineHeight: 20, marginTop: 4, fontWeight: "900" }}>{narrative.nextMoveLabel}</Text>
        <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 4 }}>{narrative.nextMoveDetail}</Text>
      </View>
    </Card>
  );
}

function FeedbackLoopCard({ event, theme }: { event: FeedbackEvent; theme: ReturnType<typeof palette> }) {
  const positive = event.delta >= 0;
  const color = positive ? COLORS.green : COLORS.orange;
  const dimension = event.dimension || "semester";
  const before = event.dimension ? event.before[event.dimension] : event.before.semesterHealth;
  const after = event.dimension ? event.after[event.dimension] : event.after.semesterHealth;
  const reviewEligible = positive && (event.action === "importSyllabus" || event.action === "completeStudyBlock" || event.delta >= 3);
  return (
    <Card theme={theme} style={{ padding: 15, borderColor: `${color}55`, backgroundColor: theme.dark ? "#172019" : positive ? "#F1FFF6" : "#FFF8EF" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: `${color}22`, alignItems: "center", justifyContent: "center" }}>
          <Icon name={positive ? "check" : "refresh"} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text selectable style={{ color: theme.label, fontWeight: "900" }}>Impact</Text>
          <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 2 }}>{event.message}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text selectable style={{ color, fontSize: 18, fontWeight: "900" }}>{before}{" -> "}{after}</Text>
          <Text selectable style={{ color: theme.label2, fontSize: 11, fontWeight: "800" }}>{dimension}</Text>
        </View>
      </View>
      {reviewEligible ? (
        <Pressable onPress={() => openExternal(APP_STORE_REVIEW_URL)} style={{ marginTop: 12, alignSelf: "flex-start", borderRadius: 999, backgroundColor: "#FFFFFF", paddingHorizontal: 13, paddingVertical: 9, borderWidth: 1, borderColor: `${color}33` }}>
          <Text style={{ color: theme.label, fontWeight: "900" }}>Review StudyPlanner</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

function classPulse(data: AppData, c: ClassItem) {
  const semesterPulse = buildSemesterSnapshot(data).classPulses.find((item) => item.classId === c.id);
  const pulse = buildClassPulseBreakdowns(data).find((item) => item.classId === c.id);
  const active = data.tasks.filter((task) => task.classId === c.id && !task.done);
  const nextExam = data.exams.filter((exam) => exam.classId === c.id).sort((a, b) => daysUntilExam(a) - daysUntilExam(b))[0];
  return {
    score: semesterPulse?.forecastScore || pulse?.score || Math.round(c.health * 100),
    label: semesterPulse?.forecastLabel || pulse?.label || "On track",
    nextMove: semesterPulse?.nudge || pulse?.nextMove || "Add a review block",
    active: active.length,
    nextExam,
    causes: semesterPulse ? [semesterPulse.reason] : pulse?.causes || [],
    colorState: semesterPulse?.colorState || "blue",
    mode: semesterPulse?.mode || "estimated",
  };
}

function Classes({ data, nav, theme }: ScreenProps) {
  const semester = buildSemesterSnapshot(data);
  const sortedClasses = semester.classPulses.map((pulse) => data.classes.find((klass) => klass.id === pulse.classId)).filter(Boolean) as ClassItem[];
  return (
    <Screen theme={theme}>
      <Header title="Classes" sub="Spring 2026 · class pulse" theme={theme} />
      <View style={{ paddingHorizontal: 16, gap: 13 }}>{sortedClasses.map((c) => (
        <Pressable key={c.id} onPress={() => nav.push("classDetail", { id: c.id })}>
          {(() => {
            const pulse = classPulse(data, c);
            const pulseColor = colorForState(pulse.colorState as any);
            return (
          <Card theme={theme} style={{ overflow: "hidden" }}>
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 13 }}>
                <ClassGlyph c={c} size={46} />
                <View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontSize: 17, fontWeight: "900" }}>{c.code}</Text><Text selectable numberOfLines={1} style={{ color: theme.label2 }}>{c.name}</Text></View>
                <View style={{ alignItems: "flex-end" }}><Text selectable style={{ color: pulseColor, fontSize: 24, fontWeight: "900" }}>{pulse.label}</Text><Text selectable style={{ color: theme.label2, fontSize: 11, fontWeight: "900" }}>{pulse.mode}</Text></View>
              </View>
              <ProgressBar value={pulse.score / 100} color={pulseColor} theme={theme} height={7} />
              <View style={{ gap: 5, marginTop: 12, marginBottom: 12 }}><Text selectable numberOfLines={2} style={{ color: theme.label2, lineHeight: 19 }}>{pulse.causes[0]}</Text><Text selectable numberOfLines={1} style={{ color: pulseColor, fontWeight: "900" }}>{pulse.nextMove}</Text></View>
              <View style={{ flexDirection: "row", gap: 8 }}><Pill text={`${data.tasks.filter((t) => t.classId === c.id && !t.done).length} due`} color={COLORS.orange} theme={theme} /><Pill text={`${data.exams.filter((e) => e.classId === c.id).length} exam`} color={COLORS.purple} theme={theme} /><Pill text={`${data.notes.filter((n) => n.classId === c.id).length} notes`} theme={theme} /></View>
            </View>
          </Card>
            );
          })()}
        </Pressable>
      ))}</View>
    </Screen>
  );
}

function ClassDetail({ data, mutate, nav, theme, params }: ScreenProps) {
  const c = data.classes.find((item) => item.id === params.id);
  if (!c) return <RecoveryScreen title="Class not found" body="That class is not in this semester anymore." action="Open dashboard" nav={nav} theme={theme} />;
  const tasks = data.tasks.filter((t) => t.classId === c.id && !t.done);
  const exams = data.exams.filter((e) => e.classId === c.id);
  const notes = data.notes.filter((n) => n.classId === c.id);
  const pulse = classPulse(data, c);
  const toggle = (id: string) => mutate((d) => {
    const tasksNext = d.tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t);
    return withFeedback(d, { ...d, tasks: tasksNext }, "completeTask", { classId: c.id, actionId: id, dimension: "grades" });
  });
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingTop: 58, paddingHorizontal: 20, paddingBottom: 22, backgroundColor: c.color }}>
          <Pressable onPress={nav.back} style={{ width: 38, height: 38, borderRadius: 99, backgroundColor: "rgba(255,255,255,.24)", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><ChevronLeft color="#fff" /></Pressable>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}><View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: "rgba(255,255,255,.22)", alignItems: "center", justifyContent: "center" }}><Icon name={c.icon} color="#fff" size={28} /></View><View><Text selectable style={{ color: "#fff", fontSize: 29, fontWeight: "900" }}>{c.code}</Text><Text selectable style={{ color: "rgba(255,255,255,.9)", fontWeight: "800" }}>{c.name}</Text></View></View>
          <View style={{ flexDirection: "row", gap: 18, marginTop: 20 }}>{[{ l: "Forecast", v: pulse.label }, { l: "Pulse", v: pulse.score }, { l: "Due", v: tasks.length }, { l: "Exams", v: exams.length }].map((s) => <View key={s.l}><Text selectable style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>{s.v}</Text><Text selectable style={{ color: "rgba(255,255,255,.84)", fontSize: 12, fontWeight: "800" }}>{s.l}</Text></View>)}</View>
        </View>
        <View style={{ padding: 16, gap: 16 }}>
          <Card theme={theme} style={{ padding: 16 }}><Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 16 }}>Schedule</Text><Text selectable style={{ color: theme.label2, marginTop: 9, lineHeight: 20 }}>{c.days} · {c.time} · {c.room}</Text><Text selectable style={{ color: theme.label2, marginTop: 3 }}>{c.professor}</Text></Card>
          <Card theme={theme} style={{ padding: 16 }}><View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>Class pulse</Text><Text selectable style={{ color: colorForState(pulse.colorState as any), fontWeight: "900" }}>{pulse.label}</Text></View><ProgressBar value={pulse.score / 100} color={colorForState(pulse.colorState as any)} theme={theme} /><Text selectable style={{ color: theme.label2, marginTop: 8 }}>{pulse.nextMove} · {pulse.causes[0]}</Text></Card>
          {tasks.length ? <View><Section title="Assignments" action="All" onAction={() => nav.push("tasks")} theme={theme} /><Card theme={theme} style={{ overflow: "hidden" }}>{tasks.map((t) => <TaskRow key={t.id} task={t} data={data} theme={theme} onToggle={() => toggle(t.id)} onOpen={() => nav.push("taskDetail", { id: t.id })} />)}</Card></View> : null}
          {exams.length ? <View><Section title="Upcoming exams" theme={theme} /><View style={{ gap: 10 }}>{exams.map((e) => <Card key={e.id} theme={theme} style={{ padding: 15 }}><View style={{ flexDirection: "row", justifyContent: "space-between" }}><View><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{e.title}</Text><Text selectable style={{ color: theme.label2, marginTop: 2 }}>{e.room} · {e.time}</Text></View><Text selectable style={{ color: c.color, fontSize: 20, fontWeight: "900" }}>{daysUntilExam(e)}d</Text></View><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>{e.topics.map((topic) => <Pill key={topic} text={topic} theme={theme} />)}</View></Card>)}</View></View> : null}
          {notes.length ? <View><Section title="Recent notes" action="All" onAction={() => nav.push("notes")} theme={theme} /><View style={{ gap: 10 }}>{notes.slice(0, 2).map((n) => <NoteCard key={n.id} note={n} data={data} theme={theme} onOpen={() => nav.push("noteDetail", { id: n.id })} />)}</View></View> : null}
        </View>
      </ScrollView>
    </View>
  );
}

function Tasks({ data, mutate, nav, theme }: ScreenProps) {
  const done = data.tasks.filter((t) => t.done).length;
  const groups = [
    ["Overdue", COLORS.red, data.tasks.filter((t) => !t.done && daysUntilTask(t) < 0)],
    ["Today", COLORS.orange, data.tasks.filter((t) => !t.done && daysUntilTask(t) === 0)],
    ["Upcoming", COLORS.blue, data.tasks.filter((t) => !t.done && daysUntilTask(t) > 0 && daysUntilTask(t) <= 3)],
    ["Later", theme.label2, data.tasks.filter((t) => !t.done && daysUntilTask(t) > 3)],
    ["Completed", COLORS.green, data.tasks.filter((t) => t.done)],
  ] as const;
  const toggle = (id: string) => mutate((d) => {
    const task = d.tasks.find((item) => item.id === id);
    const tasks = d.tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t);
    const updated = { ...d, tasks, studyBlocks: buildStudyPlan({ ...d, tasks }) };
    return withFeedback(d, updated, "completeTask", { classId: task?.classId, actionId: id, dimension: "workload" });
  });
  return (
    <Screen theme={theme}>
      <Header title="Tasks" sub={`${data.tasks.length - done} active · ${done} done`} theme={theme} />
      <View style={{ paddingHorizontal: 16, gap: 18 }}>
        <Card theme={theme} style={{ padding: 15 }}><View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>This week</Text><Text selectable style={{ color: theme.label2 }}>{done}/{data.tasks.length} complete</Text></View><ProgressBar value={data.tasks.length ? done / data.tasks.length : 0} color={theme.accent} theme={theme} height={9} /></Card>
        {groups.filter((g) => g[2].length).map(([name, color, items]) => <View key={name}><View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 9 }}><View style={{ width: 9, height: 9, borderRadius: 99, backgroundColor: color }} /><Text selectable style={{ color: theme.label, fontSize: 18, fontWeight: "900" }}>{name}</Text><Text selectable style={{ color: theme.label2 }}>{items.length}</Text></View><Card theme={theme} style={{ overflow: "hidden", opacity: name === "Completed" ? 0.7 : 1 }}>{items.map((t) => <TaskRow key={t.id} task={t} data={data} theme={theme} onToggle={() => toggle(t.id)} onOpen={() => nav.push("taskDetail", { id: t.id })} />)}</Card></View>)}
      </View>
    </Screen>
  );
}

function TaskDetail({ data, mutate, nav, theme, params }: ScreenProps) {
  const task = data.tasks.find((t) => t.id === params.id) || data.tasks[0];
  const [subs, setSubs] = useState(task?.subtasks || []);
  if (!task) return <RecoveryScreen title="Task not found" body="That task is not in this semester anymore." action="Open tasks" nav={nav} theme={theme} />;
  const c = safeClassFor(data, task.classId);
  const dueDays = daysUntilTask(task);
  const markComplete = () => mutate((d) => {
    const updated = { ...d, tasks: d.tasks.map((t) => t.id === task.id ? { ...t, done: !t.done, subtasks: subs } : t) };
    return withFeedback(d, updated, "completeTask", { classId: task.classId, actionId: task.id, dimension: "workload" });
  });
  const addBlock = () => mutate((d) => {
    const updated = { ...d, studyBlocks: buildStudyPlan(d).filter((block) => block.taskId === task.id).concat(d.studyBlocks.filter((block) => block.taskId !== task.id)) };
    return withFeedback(d, updated, "reschedulePlan", { classId: task.classId, actionId: task.id, dimension: "preparedness" });
  });
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BackHeader nav={nav} theme={theme} label={c.code} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}>
        <View><View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}><Pill text={c.code} color={c.color} theme={theme} /><Pill text={task.type} theme={theme} /></View><Text selectable style={{ color: theme.label, fontSize: 26, lineHeight: 30, fontWeight: "900", marginBottom: 14 }}>{task.title}</Text><Button label={task.done ? "Reopen task" : "Mark complete"} theme={theme} icon="target" onPress={() => { markComplete(); nav.back(); }} /></View>
        <Card theme={theme} style={{ overflow: "hidden" }}>{[[Clock, "Due", `${formatDue(dueDays)} · ${task.time}`, dueDays <= 0 ? COLORS.orange : theme.label], [Timer, "Estimated", minutesLabel(task.estimateMinutes), theme.label], [FileText, "Source", task.source, theme.label], [CalendarDays, "On calendar", data.studyBlocks.find((b) => b.taskId === task.id)?.time || "Not scheduled", theme.label]].map(([I, l, v, color]: any) => <View key={l} style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: l === "On calendar" ? 0 : 1, borderBottomColor: theme.hairline }}><I color={theme.label2} size={18} /><Text selectable style={{ color: theme.label2, flex: 1 }}>{l}</Text><Text selectable style={{ color, fontWeight: "900", maxWidth: 180, textAlign: "right" }}>{v}</Text></View>)}</Card>
        {subs.length ? <View><Section title="Subtasks" action={`${subs.filter((s) => s.done).length}/${subs.length}`} theme={theme} /><Card theme={theme} style={{ overflow: "hidden" }}>{subs.map((s, i) => <Pressable key={s.title} onPress={() => setSubs((list) => list.map((item, j) => j === i ? { ...item, done: !item.done } : item))} style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 14 }}><View style={{ width: 23, height: 23, borderRadius: 99, borderWidth: s.done ? 0 : 2, borderColor: c.color, backgroundColor: s.done ? c.color : "transparent", alignItems: "center", justifyContent: "center" }}>{s.done ? <Check color="#fff" size={14} strokeWidth={3} /> : null}</View><Text selectable style={{ color: s.done ? theme.label3 : theme.label, textDecorationLine: s.done ? "line-through" : "none", fontWeight: "700" }}>{s.title}</Text></Pressable>)}</Card></View> : null}
        <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#241E33" : "#F7F0FF" }}><View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}><Icon name="sparkles" color={COLORS.purple} /><Text selectable style={{ color: theme.label, fontWeight: "900" }}>Next move</Text></View><Text selectable style={{ color: theme.label, lineHeight: 21 }}>{minutesLabel(task.estimateMinutes)} · {formatDue(dueDays)}. Add a block.</Text><Button label="Add study block" theme={theme} icon="clock" onPress={addBlock} /></Card>
      </ScrollView>
    </View>
  );
}

function Scan({ data, mutate, nav, theme, params, setCurrentImport }: ScreenProps) {
  const previewOnly = !data.prefs.premium;
  const autoActionHandled = useRef(false);
  const [quickTask, setQuickTask] = useState("chem lab report due tomorrow, estimate 2 hours");
  const [scanStatus, setScanStatus] = useState(
    hasNativeImageTextRecognition()
      ? "On-device text scan is ready."
      : Platform.OS === "android"
        ? "Camera, photos, PDF, and paste are available. Android image OCR falls back to paste review in this build."
        : "Camera and photo scan are ready on iPhone. Paste is available as a backup."
  );
  const [working, setWorking] = useState<"syllabusCamera" | "syllabusLibrary" | "syllabusPdf" | "notesCamera" | "notesLibrary" | null>(null);

  const analyzeText = (sourceText: string, sourceName: string, mode: "syllabus" | "notes") => {
    const batch = mode === "notes" ? analyzeNotes(sourceText, data) : analyzeSyllabus(sourceText, data);
    setCurrentImport({ ...batch, sourceName });
    nav.push("review");
  };

  const runImageOcr = async (source: "camera" | "library", mode: "syllabus" | "notes") => {
    const workKey = `${mode}${source === "camera" ? "Camera" : "Library"}` as typeof working;
    setWorking(workKey);
    setScanStatus(source === "camera" ? "Opening camera..." : "Opening photos...");
    try {
      const permission = source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        const target = source === "camera" ? "camera" : "photo library";
        setScanStatus(`Permission is needed to read ${mode === "notes" ? "note" : "syllabus"} pages from the ${target}.`);
        Alert.alert("Permission needed", `Allow ${target} access to scan ${mode === "notes" ? "notes" : "syllabus pages"}. You can still paste text instead.`, [
          { text: "Paste text", onPress: () => nav.push("paste", { mode }) },
          { text: "Open Settings", onPress: () => Linking.openSettings().catch(() => {}) },
          { text: "Cancel", style: "cancel" },
        ]);
        setWorking(null);
        return;
      }

      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.92, allowsEditing: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1, allowsEditing: false });
      if (result.canceled || !result.assets[0]?.uri) {
        setScanStatus("Scan canceled.");
        setWorking(null);
        return;
      }

      if (!hasNativeImageTextRecognition()) {
        setScanStatus(Platform.OS === "android" ? "Photo selected. Paste the extracted text to review it on Android." : "Photo selected. Paste is available as a backup.");
        Alert.alert("Paste text to review", "This build can open the camera and photo library here, but on-device image OCR is only wired for iPhone. Paste the text to keep the same review flow.", [
          { text: "Paste text", onPress: () => nav.push("paste", { mode }) },
          { text: "OK" },
        ]);
        return;
      }

      setScanStatus(mode === "notes" ? "Reading note text on this iPhone..." : "Reading syllabus text on this iPhone...");
      const text = await extractTextFromImage(result.assets[0].uri);
      setScanStatus(`Found ${text.split(/\s+/).filter(Boolean).length} words. Review before saving.`);
      analyzeText(text, `${source === "camera" ? "Camera" : "Photo"} ${mode} scan`, mode);
    } catch (error) {
      setScanStatus(error instanceof Error ? error.message : "That image could not be scanned.");
    } finally {
      setWorking(null);
    }
  };

  const runPdfImport = async () => {
    setWorking("syllabusPdf");
    setScanStatus("Opening PDF...");
    try {
      const result = await pickAndExtractPdf();
      if (!result) {
        setScanStatus("PDF import canceled.");
        return;
      }
      if (result.fallbackNeeded) {
        setScanStatus("PDF opened. Text was not readable here. Paste text or scan pages.");
        Alert.alert("PDF needs review", "This PDF did not expose enough readable text. Paste the syllabus text or scan the pages.", [
          { text: "Scan pages", onPress: () => runImageOcr("camera", "syllabus") },
          { text: "Paste text", onPress: () => nav.push("paste", { mode: "syllabus" }) },
          { text: "OK" },
        ]);
        return;
      }
      setScanStatus(`PDF read: ${result.wordCount} words. Review before saving.`);
      analyzeText(result.text, `PDF · ${result.fileName}`, "syllabus");
    } catch (error) {
      setScanStatus(error instanceof Error ? error.message : "That PDF could not be imported.");
      Alert.alert("PDF import failed", "Paste syllabus text or scan the PDF pages with the camera.");
    } finally {
      setWorking(null);
    }
  };

  const captureTask = () => {
    if (previewOnly) {
      nav.push("paywall");
      return;
    }
    const task = createNaturalLanguageTask(quickTask, data);
    mutate((d) => {
      const tasks = [task, ...d.tasks];
      const updated = { ...d, tasks, studyBlocks: buildStudyPlan({ ...d, tasks }) };
      return withFeedback(d, updated, "reschedulePlan", { classId: task.classId, actionId: task.id, dimension: "workload" });
    });
    nav.push("tasks");
  };
  useEffect(() => {
    if (autoActionHandled.current) return;
    if (params.action === "pdf") {
      autoActionHandled.current = true;
      runPdfImport();
    }
    if (params.action === "camera") {
      autoActionHandled.current = true;
      runImageOcr("camera", "syllabus");
    }
  }, [params.action]);
  return (
    <Screen theme={theme}>
      <Header title={previewOnly ? "Preview syllabus" : "Scan"} sub={previewOnly ? "Preview before you unlock" : "Capture anything"} theme={theme} />
      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        <View style={{ borderRadius: 24, padding: 20, backgroundColor: theme.accent }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(255,255,255,.2)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><Camera color="#fff" size={27} /></View>
          <Text selectable style={{ color: "#fff", fontSize: 13, fontWeight: "900", marginBottom: 6 }}>SYLLABUS IMPORT</Text>
          <Text selectable style={{ color: "#fff", fontSize: 24, fontWeight: "900", lineHeight: 28 }}>{previewOnly ? "Preview. Then unlock." : "Import. Review. Start."}</Text>
          <Text selectable style={{ color: "rgba(255,255,255,.9)", marginTop: 8, lineHeight: 20 }}>{scanStatus}</Text>
          <Pressable onPress={() => working ? undefined : runPdfImport()} style={{ minHeight: 50, borderRadius: 999, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginTop: 14, flexDirection: "row", gap: 7 }}>
            {working === "syllabusPdf" ? <ActivityIndicator color={theme.accent} /> : <Upload color={theme.accent} size={18} />}
            <Text style={{ color: theme.accent, fontWeight: "900" }}>Upload syllabus PDF</Text>
          </Pressable>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Pressable onPress={() => working ? undefined : runImageOcr("camera", "syllabus")} style={{ flex: 1, minHeight: 44, borderRadius: 999, backgroundColor: "rgba(255,255,255,.22)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }}>
              {working === "syllabusCamera" ? <ActivityIndicator color="#fff" /> : <Camera color="#fff" size={17} />}
              <Text style={{ color: "#fff", fontWeight: "900" }}>Camera</Text>
            </Pressable>
            <Pressable onPress={() => working ? undefined : runImageOcr("library", "syllabus")} style={{ flex: 1, minHeight: 46, borderRadius: 999, backgroundColor: "rgba(255,255,255,.22)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }}>
              {working === "syllabusLibrary" ? <ActivityIndicator color="#fff" /> : <Image color="#fff" size={17} />}
              <Text style={{ color: "#fff", fontWeight: "900" }}>Photo</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable onPress={() => nav.push("paste", { mode: "syllabus" })} style={{ flex: 1, minHeight: 44, borderRadius: 999, backgroundColor: "rgba(255,255,255,.14)", alignItems: "center", justifyContent: "center", marginTop: 10 }}>
              <Text style={{ color: "#fff", fontWeight: "900" }}>Paste text</Text>
            </Pressable>
          </View>
        </View>
        {!previewOnly ? <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#241E33" : "#F7F0FF" }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 10 }}>
            <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: `${COLORS.purple}20`, alignItems: "center", justifyContent: "center" }}><NotebookPen color={COLORS.purple} size={22} /></View>
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: theme.label, fontSize: 17, fontWeight: "900" }}>Scan notes</Text>
              <Text selectable style={{ color: theme.label2, lineHeight: 19 }}>Summaries, terms, flashcards, quizzes, and review tasks.</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable onPress={() => working ? undefined : runImageOcr("camera", "notes")} style={{ flex: 1, minHeight: 44, borderRadius: 999, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }}>
              {working === "notesCamera" ? <ActivityIndicator color="#fff" /> : <Camera color="#fff" size={17} />}
              <Text style={{ color: "#fff", fontWeight: "900" }}>Camera</Text>
            </Pressable>
            <Pressable onPress={() => working ? undefined : runImageOcr("library", "notes")} style={{ flex: 1, minHeight: 44, borderRadius: 999, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }}>
              {working === "notesLibrary" ? <ActivityIndicator color={theme.accent} /> : <Image color={theme.accent} size={17} />}
              <Text style={{ color: theme.accent, fontWeight: "900" }}>Photo</Text>
            </Pressable>
          </View>
        </Card> : null}
        {!previewOnly ? <Card theme={theme} style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 8 }}><Icon name="wand" color={theme.accent} /><Text selectable style={{ color: theme.label, fontSize: 17, fontWeight: "900" }}>Quick capture</Text></View>
          <Text selectable style={{ color: theme.label2, lineHeight: 20, marginBottom: 10 }}>Type class, task, due date, estimate.</Text>
          <TextInput value={quickTask} onChangeText={setQuickTask} style={{ minHeight: 48, borderRadius: 14, backgroundColor: theme.surface2, color: theme.label, paddingHorizontal: 12, paddingVertical: 10, fontWeight: "700" }} />
          <Button label="Create task + replan" theme={theme} icon="sparkles" onPress={captureTask} />
        </Card> : null}
        {!previewOnly ? <Section title="More captures" theme={theme} /> : null}
        {!previewOnly ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 11 }}>{[
          ["syllabus", "Assignment sheet", "Extract task details", COLORS.orange, "file"],
          ["syllabus", "Exam review", "Build a study set", COLORS.pink, "flask-conical"],
          ["syllabus", "Upload PDF", "Pick syllabus PDF", COLORS.green, "upload"],
        ].map(([mode, name, sub, color, icon]) => <Pressable key={name} onPress={() => name === "Upload PDF" ? runPdfImport() : nav.push("paste", { mode })} style={{ width: "48%" }}><Card theme={theme} style={{ padding: 15 }}><View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${color}1C`, alignItems: "center", justifyContent: "center", marginBottom: 11 }}><Icon name={icon} color={color} /></View><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{name}</Text><Text selectable numberOfLines={1} style={{ color: theme.label2, marginTop: 2 }}>{sub}</Text></Card></Pressable>)}</View>
        ) : null}
        {!previewOnly ? <Section title="Import history" theme={theme} /> : null}
        {!previewOnly ? (
        <Card theme={theme} style={{ overflow: "hidden" }}>{data.imports.length ? data.imports.map((imp) => <View key={imp.id} style={{ padding: 14, flexDirection: "row", gap: 12, alignItems: "center" }}><CheckCircle2 color={COLORS.green} size={22} /><View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{imp.sourceName}</Text><Text selectable style={{ color: theme.label2 }}>{imp.status} · {imp.candidates.length} items</Text></View></View>) : <View style={{ padding: 16 }}><Text selectable style={{ color: theme.label2 }}>No imports yet. Paste a syllabus or notes to create the first one.</Text></View>}</Card>
        ) : null}
      </View>
    </Screen>
  );
}

function PasteImport({ data, nav, theme, params, setCurrentImport }: ScreenProps) {
  const mode = data.prefs.premium && params.mode === "notes" ? "notes" : "syllabus";
  const [text, setText] = useState("");
  const [working, setWorking] = useState(false);
  const analyze = () => {
    if (!text.trim()) {
      Alert.alert("Add text first", mode === "notes" ? "Paste notes to summarize and turn into study assets." : "Paste syllabus text to extract classes, assignments, and exams.");
      return;
    }
    setWorking(true);
    setTimeout(() => {
      const batch = mode === "notes" ? analyzeNotes(text, data) : analyzeSyllabus(text, data);
      setCurrentImport(batch);
      setWorking(false);
      nav.push("review");
    }, 650);
  };
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: theme.bg }}>
      <BackHeader nav={nav} theme={theme} label={mode === "notes" ? "Paste notes" : "Paste syllabus"} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text selectable style={{ color: theme.label, fontSize: 26, fontWeight: "900", marginBottom: 8 }}>{mode === "notes" ? "Notes become a study set." : "Syllabus becomes a semester."}</Text>
        <Text selectable style={{ color: theme.label2, lineHeight: 21, marginBottom: 14 }}>{data.prefs.premium ? "Review everything before it saves." : "Preview what StudyPlanner finds before you unlock."}</Text>
        <TextInput multiline value={text} onChangeText={setText} placeholder={mode === "notes" ? "Paste lecture notes, reading notes, or review material..." : "Paste syllabus text, assignment sheets, or extracted PDF text..."} placeholderTextColor={theme.label3} textAlignVertical="top" style={{ minHeight: 290, borderRadius: 18, backgroundColor: theme.surface, color: theme.label, borderWidth: 1, borderColor: theme.hairline, padding: 16, fontSize: 15, lineHeight: 22 }} />
        <Button label={working ? "Reading..." : "Review import"} icon="sparkles" theme={theme} onPress={working ? undefined : analyze} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ReviewImport({ data, mutate, nav, theme, currentImport, setCurrentImport }: ScreenProps) {
  const batch = currentImport;
  const [applying, setApplying] = useState(false);
  if (!batch) return <View style={{ flex: 1, backgroundColor: theme.bg }}><BackHeader nav={nav} theme={theme} label="Review" /><Text style={{ color: theme.label2, padding: 20 }}>No import is waiting for review.</Text></View>;
  const update = (id: string, patch: Partial<ImportCandidate>) => setCurrentImport({ ...batch, candidates: batch.candidates.map((c) => c.id === id ? { ...c, ...patch } : c) });
  const updateTitle = (item: ImportCandidate, title: string) => {
    const payload: any = { ...item.payload };
    if (item.kind === "class") {
      const [codePart, namePart] = title.split("·").map((part) => part.trim());
      payload.code = codePart || payload.code;
      payload.name = namePart || codePart || payload.name;
    } else {
      payload.title = title;
    }
    update(item.id, { title, payload });
  };
  const apply = () => {
    if (applying) return;
    const approvedCount = batch.candidates.filter((candidate) => candidate.approved).length;
    if (!approvedCount) {
      Alert.alert("Nothing selected", "Approve at least one class, assignment, exam, or note before continuing.");
      return;
    }
    if (!data.prefs.premium) {
      nav.push("paywall");
      return;
    }
    setApplying(true);
    mutate((d) => applyImport(d, batch));
    setCurrentImport(null);
    nav.push("success");
  };
  const groups = ["class", "task", "exam", "note"] as const;
  const approved = batch.candidates.filter((candidate) => candidate.approved);
  const approvedCount = approved.length;
  const classesFound = approved.filter((candidate) => candidate.kind === "class").length;
  const assignmentsFound = approved.filter((candidate) => candidate.kind === "task").length;
  const examsFound = approved.filter((candidate) => candidate.kind === "exam").length;
  const pressureWeek = assignmentsFound + examsFound >= 5 ? "Heavy" : assignmentsFound + examsFound >= 2 ? "Moderate" : "Light";
  const firstAction = approved.find((candidate) => candidate.kind === "task" || candidate.kind === "exam")?.title || "Review your first deadline";
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BackHeader nav={nav} theme={theme} label="Review Import" />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 118 }}>
        <Card theme={theme} style={{ padding: 14, flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 16 }}><Lock color={COLORS.green} size={19} /><Text selectable style={{ color: theme.label, flex: 1, lineHeight: 20 }}><Text style={{ fontWeight: "900" }}>{data.prefs.premium ? "Nothing saves until you approve." : "Preview only."}</Text> {data.prefs.premium ? "Edit, remove, or confirm each item." : "Unlock to apply this semester to the real app."}</Text></Card>
        <Card theme={theme} style={{ padding: 16, marginBottom: 16, backgroundColor: theme.dark ? "#17171C" : "#FFFFFF" }}>
          <Text selectable style={{ color: theme.label, fontSize: 19, fontWeight: "900", marginBottom: 12 }}>StudyPlanner found your semester.</Text>
          <View style={{ flexDirection: "row", gap: 9, marginBottom: 12 }}>
            <MiniMetric value={classesFound} label="classes" color={COLORS.blue} theme={theme} />
            <MiniMetric value={assignmentsFound} label="assignments" color={COLORS.orange} theme={theme} />
            <MiniMetric value={examsFound} label="exams" color={COLORS.purple} theme={theme} />
          </View>
          <View style={{ padding: 13, borderRadius: 16, backgroundColor: theme.surface2 }}>
            <Text selectable style={{ color: theme.label, fontWeight: "900" }}>Pressure preview: {pressureWeek}</Text>
            <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 4 }}>First recommended action: {firstAction}</Text>
          </View>
        </Card>
        {groups.map((kind) => {
          const items = batch.candidates.filter((c) => c.kind === kind);
          if (!items.length) return null;
          return <View key={kind} style={{ marginBottom: 18 }}><Section title={`${kind[0].toUpperCase()}${kind.slice(1)}s found`} action={`${items.filter((i) => i.approved).length}/${items.length}`} theme={theme} /><Card theme={theme} style={{ overflow: "hidden" }}>{items.map((item) => { const c = safeClassFor(data, item.classId); const confColor = item.confidence >= 0.9 ? COLORS.green : item.confidence >= 0.75 ? COLORS.blue : COLORS.orange; return <View key={item.id} style={{ flexDirection: "row", alignItems: "center", gap: 11, padding: 13, opacity: item.approved ? 1 : 0.45 }}><ClassGlyph c={c} size={32} /><View style={{ flex: 1 }}><TextInput value={item.title} onChangeText={(title) => updateTitle(item, title)} style={{ color: theme.label, fontSize: 14.5, fontWeight: "900", padding: 0 }} /><Text selectable numberOfLines={1} style={{ color: theme.label2 }}>{item.meta}</Text></View><Pill text={item.confidence >= 0.9 ? "High" : item.confidence >= 0.75 ? "Good" : "Review"} color={confColor} theme={theme} /><Pressable onPress={() => update(item.id, { approved: !item.approved })}>{item.approved ? <CheckCircle2 color={COLORS.green} /> : <Circle color={theme.label3} />}</Pressable><Pressable onPress={() => setCurrentImport({ ...batch, candidates: batch.candidates.filter((c) => c.id !== item.id) })}><Trash2 color={theme.label3} size={19} /></Pressable></View>; })}</Card></View>;
        })}
      </ScrollView>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 34, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.hairline }}><Button label={applying ? "Applying..." : data.prefs.premium ? "Apply schedule" : "Unlock my semester"} icon={data.prefs.premium ? "target" : "crown"} theme={theme} onPress={approvedCount ? apply : undefined} /><Text selectable style={{ color: approvedCount ? theme.label2 : COLORS.orange, textAlign: "center", marginTop: 8 }}>{approvedCount ? `${approvedCount} approved items · ${data.prefs.premium ? "editable later" : "locked until premium"}` : "Approve at least one item to continue"}</Text></View>
    </View>
  );
}

function ApplySuccess({ data, nav, theme }: ScreenProps) {
  const semester = buildSemesterSnapshot(data);
  const narrative = buildSemesterNarrative(data, semester);
  const [step, setStep] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;
  const steps = ["Reading syllabus", "Finding deadlines", "Building schedule", "Calculating Semester Health", "Preparing next move"];
  useEffect(() => {
    if (step >= steps.length) return;
    const id = setTimeout(() => setStep((current) => current + 1), 360);
    return () => clearTimeout(id);
  }, [step]);
  const ready = step >= steps.length;
  useEffect(() => {
    if (!ready) return;
    pulse.setValue(0);
    Animated.timing(pulse, { toValue: 1, duration: 760, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [pulse, ready]);
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.18] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0] });
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 22, paddingBottom: 34, gap: 16 }}>
        <View style={{ alignItems: "center", marginBottom: 4 }}>
          <View style={{ width: 104, height: 104, marginBottom: 22, alignItems: "center", justifyContent: "center" }}>
            {ready ? <Animated.View style={{ position: "absolute", width: 104, height: 104, borderRadius: 34, backgroundColor: COLORS.green, opacity: pulseOpacity, transform: [{ scale: pulseScale }] }} /> : null}
            <View style={{ width: 104, height: 104, borderRadius: 34, backgroundColor: ready ? COLORS.green : theme.surface, borderWidth: 1, borderColor: ready ? COLORS.green : theme.hairline, alignItems: "center", justifyContent: "center" }}>
            {ready ? <Check color="#fff" size={58} strokeWidth={2.4} /> : <ActivityIndicator color={theme.accent} />}
            </View>
          </View>
          <Text selectable style={{ color: theme.label, fontSize: 34, lineHeight: 37, fontWeight: "900", textAlign: "center" }}>{ready ? "Semester Ready" : steps[Math.min(step, steps.length - 1)]}</Text>
          <Text selectable style={{ color: theme.label2, textAlign: "center", lineHeight: 21, marginTop: 8 }}>{ready ? "Built from your syllabus." : "One local plan is taking shape."}</Text>
        </View>
        {ready ? (
          <>
            <Card theme={theme} style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                {[
                  [narrative.importSummary.classes, "classes", COLORS.blue],
                  [narrative.importSummary.assignments, "assignments", COLORS.orange],
                  [narrative.importSummary.exams, "exams", COLORS.purple],
                  [narrative.importSummary.highPressureWeeks, "pressure weeks", COLORS.red],
                ].map(([value, label, color]) => (
                  <View key={label as string} style={{ flex: 1 }}>
                    <Text selectable style={{ color: color as string, fontSize: 24, fontWeight: "900" }}>{value}</Text>
                    <Text selectable numberOfLines={1} style={{ color: theme.label2, fontSize: 12, fontWeight: "800" }}>{label}</Text>
                  </View>
                ))}
              </View>
            </Card>
            <Card theme={theme} style={{ padding: 18 }}>
              <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "900", marginBottom: 6 }}>SEMESTER HEALTH</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text selectable style={{ color: theme.label, fontSize: 24, fontWeight: "900" }}>{narrative.state}</Text>
                  <Text selectable style={{ color: colorForState(narrative.colorState), lineHeight: 20, marginTop: 4, fontWeight: "900" }}>{narrative.primaryDriver}</Text>
                </View>
                <View style={{ width: 72, height: 72, borderRadius: 999, borderWidth: 8, borderColor: colorForState(narrative.colorState), alignItems: "center", justifyContent: "center" }}>
                  <Text selectable style={{ color: theme.label, fontSize: 24, fontWeight: "900" }}>{semester.semesterHealth.overallScore}</Text>
                  <Text selectable style={{ color: theme.label2, fontSize: 11, fontWeight: "800" }}>score</Text>
                </View>
              </View>
            </Card>
            <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#17171C" : "#FFFFFF" }}>
              <Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 18 }}>First move</Text>
              <Text selectable style={{ color: theme.label2, lineHeight: 21, marginTop: 5 }}>{narrative.nextMoveLabel}. {narrative.nextMoveDetail}</Text>
            </Card>
            {!data.prefs.premium ? <Text selectable style={{ color: theme.label2, textAlign: "center", lineHeight: 20 }}>Keep this semester visible.</Text> : null}
            <Button label={data.prefs.premium ? "Open dashboard" : "Continue"} theme={theme} onPress={() => data.prefs.premium ? nav.tab("today") : nav.push("paywall")} />
          </>
        ) : (
          <Card theme={theme} style={{ padding: 16 }}>
            {steps.map((label, index) => (
              <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 }}>
                {index < step ? <CheckCircle2 color={COLORS.green} size={18} /> : <Circle color={theme.label3} size={18} />}
                <View style={{ flex: 1 }}>
                  <Text selectable style={{ color: index <= step ? theme.label : theme.label2, fontWeight: "800" }}>{label}</Text>
                  {index === step ? <SkeletonLine theme={theme} width="84%" /> : null}
                </View>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function SkeletonLine({ theme, width = "100%", height = 7 }: { theme: ReturnType<typeof palette>; width?: string | number; height?: number }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      Animated.timing(shimmer, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.38, 0.9] });
  return <Animated.View style={{ width: width as any, height, borderRadius: 999, backgroundColor: theme.surface2, opacity, marginTop: 7 }} />;
}

function Plan({ data, mutate, nav, theme }: ScreenProps) {
  const rebuild = () => mutate((d) => {
    const updated = { ...d, studyBlocks: buildStudyPlan(d) };
    return withFeedback(d, updated, "reschedulePlan", { dimension: "workload" });
  });
  const complete = (id: string) => mutate((d) => {
    const block = d.studyBlocks.find((item) => item.id === id);
    const updated = { ...d, studyBlocks: d.studyBlocks.map((b) => b.id === id ? { ...b, completed: !b.completed } : b) };
    return withFeedback(d, updated, "completeStudyBlock", { classId: block?.classId, actionId: id, dimension: "preparedness" });
  });
  const semester = buildSemesterSnapshot(data);
  const narrative = buildSemesterNarrative(data, semester);
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthLabel = today.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const leading = (monthStart.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, index) => index - leading + 1);
  const isoForDay = (day: number) => new Date(today.getFullYear(), today.getMonth(), day).toISOString().slice(0, 10);
  const selectedIso = isoForDay(selectedDay);
  const itemsForDay = (day: number) => {
    if (day < 1 || day > daysInMonth) return { tasks: [], exams: [], notes: [], blocks: [] as StudyBlock[] };
    const iso = isoForDay(day);
    return {
      tasks: data.tasks.filter((task) => task.dueDate === iso && !task.done),
      exams: data.exams.filter((exam) => exam.dueDate === iso),
      notes: data.notes.filter((note) => note.createdAt.slice(0, 10) === iso),
      blocks: data.studyBlocks.filter((block) => block.date === iso || (!block.date && day === today.getDate() && (block.day === "Tonight" || block.day === "Today"))),
    };
  };
  const selectedItems = itemsForDay(selectedDay);
  const monthPressure = cells.reduce((sum, day) => {
    const items = itemsForDay(day);
    return sum + items.tasks.length + items.exams.length * 2 + items.blocks.length;
  }, 0);
  return (
    <Screen theme={theme}>
      <Header title="Plan" sub={`${narrative.state} · semester autopilot`} theme={theme} right={<Pressable onPress={rebuild} style={{ padding: 10, backgroundColor: theme.surface, borderRadius: 99 }}><RefreshCw color={theme.accent} size={20} /></Pressable>} />
      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        <Card theme={theme} style={{ padding: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View><Text selectable style={{ color: theme.label, fontSize: 22, fontWeight: "900" }}>{monthLabel}</Text><Text selectable style={{ color: theme.label2, marginTop: 2 }}>{monthPressure} signals · {narrative.pressureLabel}</Text></View>
            <Pill text={`${data.notes.length} notes feed plan`} color={COLORS.purple} theme={theme} icon="note" />
          </View>
          <View style={{ flexDirection: "row", marginBottom: 6 }}>{["M", "T", "W", "T", "F", "S", "S"].map((d, index) => <Text key={`${d}${index}`} style={{ flex: 1, textAlign: "center", color: theme.label2, fontWeight: "900", fontSize: 12 }}>{d}</Text>)}</View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {cells.map((day, index) => {
              const inMonth = day >= 1 && day <= daysInMonth;
              const selected = day === selectedDay;
              const isToday = day === today.getDate();
              const items = itemsForDay(day);
              const pressure = items.tasks.length + items.exams.length * 2 + items.blocks.length + items.notes.length;
              return (
                <Pressable key={index} onPress={() => inMonth && setSelectedDay(day)} style={{ width: "14.285%", padding: 3 }}>
                  <View style={{ minHeight: 50, borderRadius: 12, padding: 5, alignItems: "center", justifyContent: "center", backgroundColor: selected ? theme.accent : isToday ? `${theme.accent}22` : "transparent", opacity: inMonth ? 1 : 0.25 }}>
                    <Text style={{ color: selected ? "#fff" : theme.label, fontWeight: selected || isToday ? "900" : "700", fontSize: 13 }}>{inMonth ? day : ""}</Text>
                    <View style={{ flexDirection: "row", gap: 2, minHeight: 6, marginTop: 4 }}>
                      {items.exams.length ? <View style={{ width: 5, height: 5, borderRadius: 99, backgroundColor: selected ? "#fff" : COLORS.purple }} /> : null}
                      {items.tasks.length ? <View style={{ width: 5, height: 5, borderRadius: 99, backgroundColor: selected ? "#fff" : COLORS.orange }} /> : null}
                      {items.blocks.length ? <View style={{ width: 5, height: 5, borderRadius: 99, backgroundColor: selected ? "#fff" : COLORS.green }} /> : null}
                      {items.notes.length ? <View style={{ width: 5, height: 5, borderRadius: 99, backgroundColor: selected ? "#fff" : COLORS.blue }} /> : null}
                    </View>
                    {pressure > 3 ? <Text style={{ color: selected ? "#fff" : COLORS.red, fontSize: 9, fontWeight: "900", marginTop: 1 }}>busy</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>
        <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#241E33" : "#F7F0FF" }}><View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}><Icon name="sparkles" color={COLORS.purple} /><Text selectable style={{ color: theme.label, fontWeight: "900" }}>Autopilot</Text></View><Text selectable style={{ color: theme.label, lineHeight: 21 }}>{narrative.nextMoveLabel}. {narrative.nextMoveDetail}</Text><Text selectable style={{ color: theme.label2, marginTop: 7 }}>{narrative.primaryDriver}</Text>{semester.schedulePlan.changedSinceLastPlan.slice(0, 2).map((change) => <Text selectable key={change} style={{ color: theme.label2, marginTop: 7 }}>- {change}</Text>)}<View style={{ flexDirection: "row", gap: 7, marginTop: 12 }}>{semester.pressureForecast.weekLoads.map((load, index) => <View key={`${index}${load}`} style={{ flex: 1 }}><ProgressBar value={load / 100} color={load > 85 ? COLORS.red : load > 64 ? COLORS.orange : load > 38 ? COLORS.yellow : COLORS.green} theme={theme} height={8} /><Text style={{ color: theme.label2, textAlign: "center", fontSize: 10, marginTop: 4, fontWeight: "900" }}>{semester.pressureForecast.weekLabels[index]}</Text></View>)}</View><Button label="Rebuild plan" theme={theme} icon="refresh" onPress={rebuild} /></Card>
        <View>
          <Section title={new Date(selectedIso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} action={`${selectedItems.tasks.length + selectedItems.exams.length + selectedItems.notes.length + selectedItems.blocks.length} items`} theme={theme} />
          <Card theme={theme} style={{ overflow: "hidden" }}>
            {selectedItems.exams.map((exam) => { const c = safeClassFor(data, exam.classId); return <Pressable key={exam.id} onPress={() => nav.push("classDetail", { id: exam.classId })} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}><ClassGlyph c={c} size={34} /><View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{exam.title}</Text><Text selectable style={{ color: theme.label2 }}>{exam.time} · {exam.room}</Text></View><Pill text="Exam" color={COLORS.purple} theme={theme} /></Pressable>; })}
            {selectedItems.tasks.map((task) => <TaskRow key={task.id} task={task} data={data} theme={theme} onToggle={() => mutate((d) => {
              const updated = { ...d, tasks: d.tasks.map((t) => t.id === task.id ? { ...t, done: !t.done } : t) };
              return withFeedback(d, updated, "completeTask", { classId: task.classId, actionId: task.id, dimension: "workload" });
            })} onOpen={() => nav.push("taskDetail", { id: task.id })} />)}
            {selectedItems.blocks.map((block) => { const c = safeClassFor(data, block.classId); return <Pressable key={block.id} onPress={() => nav.push("studySession", { id: block.id })} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}><ClassGlyph c={c} size={34} /><View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{block.title}</Text><Text selectable style={{ color: theme.label2 }}>{block.time} · {minutesLabel(block.minutes)}</Text></View><Pill text="Study" color={COLORS.green} theme={theme} /></Pressable>; })}
            {selectedItems.notes.map((note) => <Pressable key={note.id} onPress={() => nav.push("noteDetail", { id: note.id })} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}><NotebookPen color={COLORS.blue} size={22} /><View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{note.title}</Text><Text selectable style={{ color: theme.label2 }}>{note.suggestedTasks.length} suggested tasks</Text></View><ChevronRight color={theme.label3} size={16} /></Pressable>)}
            {!selectedItems.tasks.length && !selectedItems.exams.length && !selectedItems.blocks.length && !selectedItems.notes.length ? <View style={{ padding: 16 }}><Text selectable style={{ color: theme.label2 }}>Clear day.</Text></View> : null}
          </Card>
        </View>
        <Section title="Focus blocks" action="Regenerate" onAction={rebuild} theme={theme} />
        <View style={{ gap: 10 }}>{data.studyBlocks.map((b) => { const c = safeClassFor(data, b.classId); return <Pressable key={b.id} onPress={() => nav.push("studySession", { id: b.id })}><Card theme={theme} style={{ padding: 15, flexDirection: "row", gap: 12, alignItems: "center" }}><ClassGlyph c={c} size={40} /><View style={{ flex: 1 }}><View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 2 }}><Text selectable style={{ color: theme.label, fontWeight: "900", flex: 1 }}>{b.title}</Text>{b.source ? <Pill text={b.source.replace(/_/g, " ")} color={b.source === "exam_prep" ? COLORS.purple : b.source === "missed_repair" ? COLORS.orange : COLORS.blue} theme={theme} /> : null}</View><Text selectable style={{ color: theme.label2 }}>{b.day} · {b.time} · {minutesLabel(b.minutes)}</Text><Text selectable numberOfLines={2} style={{ color: theme.label2, marginTop: 5, lineHeight: 18 }}><Text style={{ fontWeight: "900", color: theme.label }}>Why: </Text>{b.reason}</Text><Pressable onPress={(e) => { e.stopPropagation(); mutate((d) => {
          const updated = replanAfterMissedBlock({ ...d, studyBlocks: d.studyBlocks.map((block) => block.id === b.id ? { ...block, missed: true } : block) }, b);
          return withFeedback(d, updated, "missStudyBlock", { classId: b.classId, actionId: b.id, dimension: "consistency" });
        }); }}><Text style={{ color: COLORS.orange, fontWeight: "900", marginTop: 6 }}>Missed? make up tomorrow</Text></Pressable></View><Pressable onPress={(e) => { e.stopPropagation(); complete(b.id); }}>{b.completed ? <CheckCircle2 color={COLORS.green} /> : <Play color={theme.accent} />}</Pressable></Card></Pressable>; })}</View>
      </View>
    </Screen>
  );
}

function StudySession({ data, mutate, nav, theme, params }: ScreenProps) {
  const block = data.studyBlocks.find((b) => b.id === params.id) || data.studyBlocks[0];
  const task = data.tasks.find((t) => t.id === block?.taskId);
  const c = safeClassFor(data, block?.classId);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const semester = buildSemesterSnapshot(data);
  const pulse = semester.classPulses.find((item) => item.classId === block?.classId);
  if (!block) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <BackHeader nav={nav} theme={theme} label="Focus Session" />
        <View style={{ padding: 20, gap: 14 }}>
          <Text selectable style={{ color: theme.label, fontSize: 26, fontWeight: "900" }}>No blocks yet</Text>
          <Text selectable style={{ color: theme.label2, lineHeight: 21 }}>Import work, then rebuild.</Text>
          <Button label="Regenerate plan" theme={theme} icon="sparkles" onPress={() => mutate((d) => ({ ...d, studyBlocks: buildStudyPlan(d) }))} />
        </View>
      </View>
    );
  }
  const finish = () => mutate((d) => {
    const updated = {
      ...d,
      studyBlocks: d.studyBlocks.map((b) => b.id === block.id ? { ...b, completed: true } : b),
      tasks: task ? d.tasks.map((t) => t.id === task.id && answer.length > 30 ? { ...t, subtasks: t.subtasks.map((s, i) => i === 0 ? { ...s, done: true } : s) } : t) : d.tasks,
    };
    return withFeedback(d, updated, "completeStudyBlock", {
      classId: block.classId,
      actionId: block.id,
      dimension: "preparedness",
      message: `${c.code} prep saved.`,
    });
  });
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BackHeader nav={nav} theme={theme} label="Focus Session" />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}>
        <Card theme={theme} style={{ padding: 18 }}><View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}><ClassGlyph c={c} size={50} /><View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontSize: 22, fontWeight: "900" }}>{block.title}</Text><Text selectable style={{ color: theme.label2, marginTop: 3 }}>{block.day} · {block.time} · {minutesLabel(block.minutes)}</Text></View></View></Card>
        <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#172019" : "#F1FFF6" }}><Text selectable style={{ color: theme.label, fontWeight: "900", marginBottom: 8 }}>Impact</Text><Text selectable style={{ color: theme.label2, lineHeight: 21 }}>{c.code} preparedness. {pulse ? `${pulse.forecastLabel} forecast.` : "Risk reduced."}</Text></Card>
        <Card theme={theme} style={{ padding: 16 }}><Text selectable style={{ color: theme.label, fontWeight: "900", marginBottom: 8 }}>Goal</Text><Text selectable style={{ color: theme.label2, lineHeight: 21 }}>One item. Then recall.</Text></Card>
        <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#18222A" : "#EEF7FF" }}><Text selectable style={{ color: theme.label, fontWeight: "900", marginBottom: 8 }}>Active recall</Text><Text selectable style={{ color: theme.label, lineHeight: 21 }}>Explain it without looking.</Text><TextInput multiline value={answer} onChangeText={setAnswer} placeholder="Type your recall answer..." placeholderTextColor={theme.label3} style={{ minHeight: 120, backgroundColor: theme.surface, color: theme.label, borderRadius: 14, padding: 12, marginTop: 12, textAlignVertical: "top" }} /><Button label={score == null ? "Score recall" : `Recall score: ${score}/10`} theme={theme} icon="brain" onPress={() => setScore(Math.min(10, Math.max(3, Math.round(answer.split(/\s+/).filter(Boolean).length / 6))))} /></Card>
        <Button label="Complete session" theme={theme} icon="check" onPress={() => { finish(); nav.back(); }} />
      </ScrollView>
    </View>
  );
}

function Notes({ data, nav, theme }: ScreenProps) {
  const [filter, setFilter] = useState("all");
  const notes = filter === "all" ? data.notes : data.notes.filter((n) => n.classId === filter);
  const semester = buildSemesterSnapshot(data);
  const narrative = buildSemesterNarrative(data, semester);
  return (
    <Screen theme={theme}>
      <Header title="Notes" sub={`${semester.semesterHealth.dimensions.preparedness.score} preparedness · ${data.notes.length} notes`} theme={theme} right={<Pressable onPress={() => nav.tab("scan")} style={{ width: 42, height: 42, borderRadius: 99, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }}><Camera color="#fff" /></Pressable>} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}><Card theme={theme} style={{ padding: 14 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{narrative.notesNudge}</Text><Text selectable style={{ color: theme.label2, marginTop: 4, lineHeight: 20 }}>Notes raise Preparedness and sharpen Class Pulse.</Text></Card></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 14 }}>{[{ id: "all", code: "All" }, ...data.classes].map((c: any) => <Pressable key={c.id} onPress={() => setFilter(c.id)} style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: filter === c.id ? theme.accent : theme.surface }}><Text style={{ color: filter === c.id ? "#fff" : theme.label2, fontWeight: "800" }}>{c.code}</Text></Pressable>)}</ScrollView>
      <View style={{ paddingHorizontal: 16, gap: 11 }}>{notes.length ? notes.map((n) => <NoteCard key={n.id} note={n} data={data} theme={theme} onOpen={() => nav.push("noteDetail", { id: n.id })} />) : (
        <Card theme={theme} style={{ padding: 18 }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: `${COLORS.purple}1C`, alignItems: "center", justifyContent: "center", marginBottom: 12 }}><NotebookPen color={COLORS.purple} size={24} /></View>
          <Text selectable style={{ color: theme.label, fontSize: 22, lineHeight: 26, fontWeight: "900" }}>No notes loaded</Text>
          <Text selectable style={{ color: theme.label2, lineHeight: 21, marginTop: 6 }}>Scan or paste lecture notes to build summaries, flashcards, quizzes, and review tasks.</Text>
          <Button label="Scan notes" theme={theme} icon="camera" onPress={() => nav.tab("scan")} />
          <Button label="Paste notes" theme={theme} secondary icon="file" onPress={() => nav.push("paste", { mode: "notes" })} />
        </Card>
      )}</View>
    </Screen>
  );
}

function NoteDetail({ data, mutate, nav, theme, params }: ScreenProps) {
  const note = data.notes.find((n) => n.id === params.id) || data.notes[0];
  if (!note) return <RecoveryScreen title="Note not found" body="That note is not in this semester anymore." action="Open notes" nav={nav} theme={theme} />;
  const c = safeClassFor(data, note.classId);
  const assets = generateStudyAssets(note, data);
  const insight = parseNoteInsights(note, data);
  const semester = buildSemesterSnapshot(data);
  const pulse = semester.classPulses.find((item) => item.classId === note.classId);
  const addTask = (title: string) => mutate((d) => {
    if (d.tasks.some((task) => task.title.toLowerCase() === title.toLowerCase() && task.classId === note.classId)) return d;
    const tasks = [{ id: `t_${Date.now()}`, title, classId: note.classId, type: "Review", dueOffset: 1, dueDate: isoFromOffset(1), time: "7:00 PM", estimateMinutes: 30, done: false, urgent: true, source: `Note · ${note.title}`, subtasks: [] }, ...d.tasks];
    const updated = { ...d, tasks };
    return withFeedback(d, { ...updated, studyBlocks: buildStudyPlan(updated) }, "reviewWeakConcept", { classId: note.classId, actionId: note.id, dimension: "preparedness" });
  });
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BackHeader nav={nav} theme={theme} label={c.code} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}>
        <View><Pill text={c.code} color={c.color} theme={theme} /><Text selectable style={{ color: theme.label, fontSize: 26, fontWeight: "900", marginTop: 10 }}>{note.title}</Text></View>
        <Card theme={theme} style={{ padding: 16 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>Effect on {c.code}</Text><Text selectable style={{ color: theme.label2, marginTop: 7, lineHeight: 20 }}>{pulse ? `${pulse.forecastLabel}. ${pulse.nudge}` : "Readiness up."}</Text></Card>
        <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#241E33" : "#F7F0FF" }}><View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}><Icon name="sparkles" color={COLORS.purple} /><Text selectable style={{ color: theme.label, fontWeight: "900" }}>Summary</Text></View><Text selectable style={{ color: theme.label, lineHeight: 21 }}>{note.summary}</Text></Card>
        <View><Text selectable style={{ color: theme.label2, fontWeight: "900", marginBottom: 8 }}>KEY TERMS</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{note.terms.map((t) => <Pill key={t} text={t} theme={theme} />)}</View></View>
        <View><Section title="Signals" action={`${Math.round(insight.confidence * 100)}%`} theme={theme} /><Card theme={theme} style={{ padding: 15, gap: 12 }}><View><Text selectable style={{ color: theme.label, fontWeight: "900", marginBottom: 6 }}>Exam topics</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{insight.likelyExamTopics.slice(0, 6).map((topic) => <Pill key={topic} text={topic} color={COLORS.orange} theme={theme} />)}</View></View>{insight.formulas.length ? <View><Text selectable style={{ color: theme.label, fontWeight: "900", marginBottom: 6 }}>Formulas</Text>{insight.formulas.slice(0, 3).map((formula) => <Text selectable key={formula} style={{ color: theme.label2, marginTop: 3 }}>{formula}</Text>)}</View> : null}<View><Text selectable style={{ color: theme.label, fontWeight: "900", marginBottom: 6 }}>Weak area</Text><Text selectable style={{ color: theme.label2, lineHeight: 20 }}>{insight.weakAreas[0]}</Text></View></Card></View>
        <View><Section title="Suggested study tasks" theme={theme} /><Card theme={theme} style={{ overflow: "hidden" }}>{note.suggestedTasks.map((t) => <View key={t} style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 14 }}><Icon name="target" color={COLORS.blue} /><Text selectable style={{ color: theme.label, flex: 1, fontWeight: "800" }}>{t}</Text><Pressable onPress={() => addTask(t)}><Pill text="Add" color={theme.accent} theme={theme} /></Pressable></View>)}</Card></View>
        <View><Section title="Generated study assets" action={`${assets.flashcards.length} cards`} theme={theme} /><Card theme={theme} style={{ padding: 15, gap: 12 }}>
          <View><Text selectable style={{ color: theme.label, fontWeight: "900", marginBottom: 8 }}>Flashcards</Text>{assets.flashcards.slice(0, 3).map((card) => <View key={card.front} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.hairline }}><Text selectable style={{ color: theme.label, fontWeight: "800" }}>{card.front}</Text><Text selectable style={{ color: theme.label2, marginTop: 3 }}>{card.back}</Text></View>)}</View>
          <View><Text selectable style={{ color: theme.label, fontWeight: "900", marginBottom: 8 }}>Quiz</Text>{assets.quiz.slice(0, 2).map((q) => <View key={q.prompt} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.hairline }}><Text selectable style={{ color: theme.label, fontWeight: "800" }}>{q.prompt}</Text><Text selectable style={{ color: theme.label2, marginTop: 3 }}>{q.answer}</Text></View>)}</View>
          <Button label="Add review task" theme={theme} icon="target" onPress={() => addTask(`Review ${note.title} flashcards`)} />
        </Card></View>
        <Card theme={theme} style={{ padding: 16 }}><Text selectable style={{ color: theme.label2, fontWeight: "900", marginBottom: 8 }}>SOURCE TEXT</Text><Text selectable style={{ color: theme.label2, lineHeight: 21 }}>{note.sourceText}</Text></Card>
      </ScrollView>
    </View>
  );
}

function WidgetsScreen({ data, nav, theme }: ScreenProps) {
  const loop = buildSemesterLoop(data);
  const widgetRows = [
    ["StudyPlanner Today", "Health, next deadline, and focus block", "home", COLORS.blue],
    ["Upcoming", "Assignments and exams coming soon", "target", COLORS.orange],
    ["Week Load", "Pressure by week", "bar-chart-3", COLORS.purple],
    ["Class Progress", "Selected class pulse", "classes", COLORS.green],
  ];
  return (
    <Screen theme={theme}>
      <Header title="Widgets" sub={data.prefs.premium ? "Home Screen snapshots" : "Locked preview"} theme={theme} />
      <View style={{ paddingHorizontal: 16, gap: 14 }}>
        <Card theme={theme} style={{ padding: 18, backgroundColor: theme.dark ? "#17171C" : "#FFFFFF" }}>
          <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
            <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: "#111114", alignItems: "center", justifyContent: "center" }}><Grid2X2 color="#fff" size={30} /></View>
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: theme.label, fontSize: 21, lineHeight: 25, fontWeight: "900" }}>{data.prefs.premium ? "Widgets are synced" : "Unlock widgets"}</Text>
              <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 4 }}>{data.prefs.premium ? `${loop.score} loop score ready for iOS widgets.` : "Apply a syllabus and unlock to keep widgets current."}</Text>
            </View>
          </View>
          <Button label={data.prefs.premium ? "Sync from dashboard" : "Unlock widgets"} theme={theme} icon={data.prefs.premium ? "refresh" : "crown"} onPress={() => data.prefs.premium ? nav.tab("today") : nav.push("paywall")} />
        </Card>
        {widgetRows.map(([title, body, icon, color]) => (
          <Card key={title as string} theme={theme} style={{ padding: 15, flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: `${color}1C`, alignItems: "center", justifyContent: "center" }}><Icon name={icon as string} color={color as string} /></View>
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: theme.label, fontWeight: "900" }}>{title}</Text>
              <Text selectable style={{ color: theme.label2, marginTop: 3 }}>{body}</Text>
            </View>
            <Pill text={data.prefs.premium ? "ready" : "locked"} color={data.prefs.premium ? COLORS.green : COLORS.orange} theme={theme} />
          </Card>
        ))}
      </View>
    </Screen>
  );
}

function Profile({ data, mutate, nav, theme }: ScreenProps) {
  const storeName = storeDisplayName();
  const rows = [
    ["bell", COLORS.red, "Reminders", `${data.reminders.filter((r) => r.enabled).length} active`, "reminders"],
    ["scan", COLORS.purple, "Import history", `${data.imports.length} imports`, "scan"],
    ["refresh", COLORS.blue, "Manage subscription", `${storeName} account`, "manage"],
    ["shield", COLORS.green, "Privacy Policy", "StudyPlanner data", "privacy"],
    ["file", COLORS.orange, "Terms of Use", "Subscription terms", "terms"],
    ["file", COLORS.orange, "Support", "Email help", "support"],
  ] as const;
  return (
    <Screen theme={theme}>
      <Header title="Profile" sub="Active semester" theme={theme} />
      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        <Card theme={theme} style={{ padding: 18 }}><View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}><View style={{ width: 62, height: 62, borderRadius: 99, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#fff", fontSize: 26, fontWeight: "900" }}>{userInitial(data)}</Text></View><View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontSize: 24, fontWeight: "900" }}>{firstNameFromPrefs(data)}</Text><Text selectable style={{ color: theme.label2 }}>{data.prefs.level} · {data.prefs.studentPersona || "School semester"}</Text><View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}><Pill text={data.prefs.premium ? "Subscribed" : "Locked"} color={data.prefs.premium ? COLORS.green : COLORS.orange} icon="crown" theme={theme} /><Pill text="On device" color={COLORS.green} icon="shield" theme={theme} /></View></View></View><View style={{ marginTop: 18 }}><View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 7 }}><Text selectable style={{ color: theme.label2, fontWeight: "900" }}>SEMESTER PROGRESS</Text><Text selectable style={{ color: theme.label2 }}>{data.classes.length ? `${data.classes.length} classes` : "No semester yet"}</Text></View><ProgressBar value={data.tasks.length ? data.tasks.filter((task) => task.done).length / data.tasks.length : 0} color={theme.accent} theme={theme} /></View></Card>
        <Pressable onPress={() => nav.push("paywall")}><View style={{ borderRadius: 22, padding: 18, backgroundColor: "#282139" }}><View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}><Crown color={COLORS.yellow} size={19} /><Text selectable style={{ color: "#fff", fontWeight: "900" }}>StudyPlanner subscription</Text></View><Text selectable style={{ color: "rgba(255,255,255,.85)" }}>Scans, reminders, study sets, and planning are active.</Text></View></Pressable>
        <Card theme={theme} style={{ overflow: "hidden" }}>{rows.map(([icon, color, title, value, route]) => <Pressable key={title} onPress={() => {
          if (route === "scan") nav.tab("scan");
          else if (route === "manage") openExternal(manageSubscriptionUrl());
          else if (route === "privacy" || route === "terms") nav.push(route);
          else if (route === "support") openExternal(SUPPORT_URL);
          else nav.push(route as Route);
        }} style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 14 }}><View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: `${color}1C`, alignItems: "center", justifyContent: "center" }}><Icon name={icon} color={color} size={18} /></View><Text selectable style={{ color: theme.label, flex: 1, fontWeight: "900" }}>{title}</Text><Text selectable style={{ color: theme.label2 }}>{value}</Text><ChevronRight color={theme.label3} size={16} /></Pressable>)}</Card>
      </View>
    </Screen>
  );
}

function Reminders({ data, mutate, nav, theme, params }: ScreenProps) {
  const semester = buildSemesterSnapshot(data);
  const [status, setStatus] = useState(semester.notificationPlan.items[0]?.explanation || "Enable reminders when you want this iPhone to schedule them.");
  const [scheduling, setScheduling] = useState(false);
  const validationStarted = useRef(false);
  const toggle = (id: string) => mutate((d) => {
    const reminder = d.reminders.find((item) => item.id === id);
    if (reminder?.enabled) cancelReminderNotificationIds(reminder.notificationIds || []).catch(() => {});
    return { ...d, reminders: d.reminders.map((r) => r.id === id ? { ...r, enabled: !r.enabled, notificationIds: r.enabled ? [] : r.notificationIds, scheduledFor: r.enabled ? [] : r.scheduledFor } : r) };
  });
  const addSmart = () => mutate((d) => ({ ...d, reminders: [...suggestSmartReminders(d).map((r, index) => ({ id: `r_${Date.now()}_${index}`, enabled: true, ...r })), ...d.reminders] }));
  const schedule = async (validation = false) => {
    setScheduling(true);
    try {
      const result = await scheduleLocalReminders(data, validation ? { includeValidationNotification: true, validationDelaySeconds: 60 } : {});
      setStatus(result.message);
      if (result.state === "scheduled" && result.reminders) {
        mutate((d) => ({ ...d, reminders: [...result.reminders!, ...d.reminders.filter((r) => !(r.notificationIds || []).length)] }));
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not schedule reminders.");
    } finally {
      setScheduling(false);
    }
  };
  useEffect(() => {
    if (params.validation === "1" && !validationStarted.current) {
      validationStarted.current = true;
      schedule(true).catch(() => setScheduling(false));
    }
  }, [params.validation]);
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BackHeader nav={nav} theme={theme} label="Reminders" />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 18 }}>
        <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#241E33" : "#F7F0FF" }}><View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}><Icon name="sparkles" color={COLORS.purple} /><Text selectable style={{ color: theme.label, fontWeight: "900" }}>Smart reminders</Text></View><Text selectable style={{ color: theme.label, lineHeight: 21 }}>{status}</Text><Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 8 }}>{semester.coachCopy.nextAction}</Text><Button label={scheduling ? "Scheduling..." : "Schedule"} theme={theme} onPress={scheduling ? undefined : schedule} /><Button label="Add suggestions" secondary theme={theme} onPress={addSmart} /></Card>
        <Section title="Active reminders" theme={theme} />
        <Card theme={theme} style={{ overflow: "hidden" }}>{data.reminders.map((r) => { const c = safeClassFor(data, r.classId); return <View key={r.id} style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 14 }}><ClassGlyph c={c} size={34} /><View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{r.title}</Text><Text selectable style={{ color: theme.label2 }}>{r.lead}{r.room ? ` · ${r.room}` : ""}</Text></View><Pressable onPress={() => toggle(r.id)} style={{ width: 48, height: 29, borderRadius: 99, backgroundColor: r.enabled ? COLORS.green : theme.surface3, padding: 2, alignItems: r.enabled ? "flex-end" : "flex-start" }}><View style={{ width: 25, height: 25, borderRadius: 99, backgroundColor: "#fff" }} /></Pressable></View>; })}</Card>
      </ScrollView>
    </View>
  );
}

function HomePreview({ nav, theme }: ScreenProps) {
  useEffect(() => {
    nav.tab("today");
  }, [nav]);
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={theme.accent} />
    </View>
  );
}

function LockPreview({ nav, theme }: ScreenProps) {
  useEffect(() => {
    nav.tab("today");
  }, [nav]);
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={theme.accent} />
    </View>
  );
}
