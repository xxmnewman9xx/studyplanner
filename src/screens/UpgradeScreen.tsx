import React, { useState } from "react";
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Bell, CalendarSync, Check, Crown, FileScan, Layers3, Palette, ShieldCheck, Timer, TrendingUp, X } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { AppMark, GlassCard } from "../components/AppleComponents";
import { Badge } from "../components/Badge";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { purchaseConfig } from "../services/purchaseConfig";
import { PaywallProduct, useSubscription } from "../services/subscriptions";
import { useI18n } from "../i18n";

type UpgradeScreenProps = {
  onContinueAfterPurchase?: () => void;
  hardMode?: boolean;
};

type LegalDocument = "terms" | "privacy";

const paidFeatures = [
  { icon: FileScan, titleKey: "paywall.feature_scans", detailKey: "paywall.feature_scans_detail", fallbackTitle: "Syllabus imports", fallbackDetail: "Turn syllabus text, PDFs, and pasted assignments into an editable plan." },
  { icon: Check, titleKey: "paywall.feature_review", detailKey: "paywall.feature_review_detail", fallbackTitle: "Review inbox", fallbackDetail: "Confirm uncertain dates and duplicates before they reach Today or widgets." },
  { icon: TrendingUp, titleKey: "paywall.feature_forecast", detailKey: "paywall.feature_forecast_detail", fallbackTitle: "Forecast", fallbackDetail: "See overload earlier and move study blocks before the week stacks up." },
  { icon: Layers3, titleKey: "paywall.feature_widgets", detailKey: "paywall.feature_widgets_detail", fallbackTitle: "Personalized widgets", fallbackDetail: "Save widgets that adapt to reviewed work, forecast state, and local memory." },
  { icon: Timer, titleKey: "paywall.feature_focus", detailKey: "paywall.feature_focus_detail", fallbackTitle: "Focus and progress tools", fallbackDetail: "Start timed study sessions and keep completion feedback visible." },
  { icon: Bell, titleKey: "paywall.feature_calendar", detailKey: "paywall.feature_calendar_detail", fallbackTitle: "Reminders and calendar sync", fallbackDetail: "Send reviewed deadlines to device reminders and calendar." },
  { icon: ShieldCheck, titleKey: "paywall.feature_memory", detailKey: "paywall.feature_memory_detail", fallbackTitle: "Local memory", fallbackDetail: "Focus sessions, notes, and saved widgets improve recommendations on this device." }
];

export function UpgradeScreen({ onContinueAfterPurchase, hardMode = false }: UpgradeScreenProps) {
  const { theme } = useAppTheme();
  const { t } = useI18n();
  const { colors } = theme;
  const styles = createStyles(theme);
  const subscription = useSubscription();
  const [legalDocument, setLegalDocument] = useState<LegalDocument | null>(null);
  const selectedProduct =
    subscription.products.find((product) => product.id === subscription.selectedProductId) ||
    subscription.products[0];
  const busy =
    subscription.flowState === "loading" ||
    subscription.flowState === "purchasing" ||
    subscription.flowState === "restoring";
  const plansUnavailable =
    subscription.products.length === 0 &&
    subscription.status !== "checking" &&
    subscription.flowState !== "loading";
  const loadingPlans = subscription.status === "checking" || subscription.flowState === "loading";
  const hasProducts = subscription.products.length > 0;
  const productIdSourceLabel =
    purchaseConfig.productIdSource === "environment"
      ? t("paywall.product_source_build_env", "Store plans")
      : t("paywall.product_source_release_manifest", "Current plans");
  const planStateTitle = subscription.isPremium
    ? t("paywall.unlocked", "StudyPlanner is unlocked")
    : subscription.flowState === "purchasing"
      ? t("paywall.opening_store", "Opening the store")
      : subscription.flowState === "restoring"
        ? t("paywall.checking_purchases", "Checking purchases")
        : loadingPlans
          ? t("paywall.loading_current_plans", "Loading current plans")
          : hasProducts
            ? t("paywall.plans_available", "{count} plans available").replace("{count}", String(subscription.products.length))
            : hardMode
              ? t("paywall.plans_unavailable", "Plans are unavailable")
              : t("paywall.waiting_for_store_plans", "Waiting for store plans");
  const planStateDetail = subscription.isPremium
    ? t("paywall.unlocked_detail", "Full planner access is active on this device.")
    : plansUnavailable
      ? unavailableCopy(subscription.status, subscription.hasConfiguredProducts, hardMode, t)
      : loadingPlans
        ? t("paywall.loading_prices_detail", "Prices and renewal periods come from the store before checkout.")
        : hasProducts
          ? t("paywall.choose_plan_detail", "Choose a plan below. Restore stays available.")
        : hardMode
            ? t("paywall.plans_failed_locked_detail", "Plans could not load. Restore Purchases stays available, and this screen will not unlock the planner without a valid store entitlement.")
            : t("paywall.plans_failed_detail", "Plans could not load yet. Restore Purchases stays available for existing subscribers.");
  const heroTitle = "Unlock StudyPlanner";
  const localizedHeroTitle = t("paywall.title", heroTitle);
  const heroSubtitle = hardMode
    ? t("paywall.hard_subtitle", "Unlock syllabus import, review inbox, forecast, personalized widgets, and local adaptation.")
    : t("paywall.subtitle", "Keep the full syllabus-to-plan workflow ready for a busy semester.");

  if (legalDocument) {
    return <LegalNotice document={legalDocument} onClose={() => setLegalDocument(null)} />;
  }

  return (
    <View style={styles.screen}>
      <GlassCard style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <AppMark size={48} />
          <Badge label={t("paywall.included_with_studyplanner", "Included with StudyPlanner")} tone="gold" />
        </View>
        <Text style={styles.kicker}>{t("paywall.product_name", "StudyPlanner: Syllabus AI")}</Text>
        <Text style={styles.title}>{localizedHeroTitle}</Text>
        <Text style={styles.subtitle}>{heroSubtitle}</Text>
        <View style={styles.payoffRail}>
          <PayoffPill icon={FileScan} label={t("paywall.imports", "Imports")} />
          <PayoffPill icon={Check} label={t("paywall.review", "Review")} />
          <PayoffPill icon={TrendingUp} label={t("paywall.forecast", "Forecast")} />
        </View>
      </GlassCard>

      {subscription.message ? (
        <View style={styles.noticeSuccess}>
          <ShieldCheck color={colors.green} size={18} />
          <Text style={styles.noticeText}>{subscription.message}</Text>
        </View>
      ) : null}

      {subscription.errorMessage && !plansUnavailable ? (
        <View style={styles.noticeError}>
          <Text style={styles.noticeText}>{subscription.errorMessage}</Text>
          <AppButton label={t("errors.try_again", "Try Again")} variant="secondary" onPress={() => void subscription.refresh()} />
        </View>
      ) : null}

      <View style={[styles.planStateCard, subscription.errorMessage || plansUnavailable ? styles.planStateCardWarning : hasProducts || subscription.isPremium ? styles.planStateCardReady : null]}>
        <View style={styles.planStateTopRow}>
          <View style={styles.planStateCopy}>
            <Text style={styles.planStateKicker}>{t("paywall.app_store", "App Store")} · {productIdSourceLabel}</Text>
            <Text style={styles.planStateTitle}>{planStateTitle}</Text>
          </View>
          {busy || loadingPlans ? <ActivityIndicator color={colors.accent} /> : <ShieldCheck color={hasProducts || subscription.isPremium ? colors.green : colors.muted} size={19} />}
        </View>
        <Text style={styles.planStateDetail}>{planStateDetail}</Text>
      </View>

      <View style={styles.legalRail}>
        <LegalLink label={t("paywall.terms", "Terms of Use (EULA)")} document="terms" onOpen={setLegalDocument} />
        <Text style={styles.legalDivider}>·</Text>
        <LegalLink label={t("paywall.privacy", "Privacy Policy")} document="privacy" onOpen={setLegalDocument} />
      </View>

      {subscription.isPremium ? (
        <View style={styles.actionStack}>
          <AppButton label={t("paywall.manage_subscription", "Manage Subscription")} variant="secondary" onPress={() => void subscription.manageSubscriptions()} />
          {onContinueAfterPurchase ? <AppButton label={t("common.continue", "Continue")} onPress={onContinueAfterPurchase} /> : null}
        </View>
      ) : (
        <>
          <View style={styles.planList}>
            {loadingPlans ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={colors.ink} />
                <Text style={styles.loadingText}>{t("paywall.loading_current_store_pricing", "Loading current store pricing")}</Text>
              </View>
            ) : null}

            {subscription.products.map((product, productIndex) => (
              <ProductOption
                key={product.id}
                product={product}
                selected={product.id === selectedProduct?.id}
                recommended={productIndex === 0}
                onPress={() => subscription.setSelectedProductId(product.id)}
              />
            ))}
          </View>

          {plansUnavailable ? (
            <PaywallActions
              busy={busy}
              selectedProduct={selectedProduct}
              subscription={subscription}
              styles={styles}
            />
          ) : null}

          {plansUnavailable ? (
            <View style={styles.unavailableCard}>
              <Text style={styles.unavailableTitle}>{t("paywall.purchases_unavailable", "Purchases are unavailable")}</Text>
              <Text style={styles.unavailableCopy}>{unavailableCopy(subscription.status, subscription.hasConfiguredProducts, hardMode, t)}</Text>
              {subscription.status !== "unavailable" ? (
                <AppButton label={t("errors.try_again", "Try Again")} variant="secondary" onPress={() => void subscription.refresh()} />
              ) : null}
            </View>
          ) : null}

          {!plansUnavailable ? (
            <PaywallActions
              busy={busy}
              selectedProduct={selectedProduct}
              subscription={subscription}
              styles={styles}
            />
          ) : null}

          <View style={styles.trustRail}>
            <TrustPill icon={ShieldCheck} label={t("paywall.apple_checkout", "Apple checkout")} />
            <TrustPill icon={Check} label={t("paywall.restore_purchases_short", "Restore purchases")} />
            <TrustPill icon={Check} label={t("paywall.no_account_needed", "No account needed")} />
          </View>
        </>
      )}

      <View style={styles.valueGrid}>
        {paidFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <View key={feature.titleKey} style={styles.valueTile}>
              <View style={styles.valueIcon}><Icon color={colors.accent} size={18} /></View>
              <Text style={styles.valueTitle}>{t(feature.titleKey, feature.fallbackTitle)}</Text>
              <Text style={styles.valueDetail}>{t(feature.detailKey, feature.fallbackDetail)}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.trustCard}>
        <ShieldCheck color={colors.sage} size={18} />
        <Text style={styles.trustText}>{t("paywall.store_trust_copy", "App Store prices, Restore Purchases, Terms, and Privacy stay visible before checkout.")}</Text>
      </View>
    </View>
  );
}

function PaywallActions({
  busy,
  selectedProduct,
  subscription,
  styles
}: {
  busy: boolean;
  selectedProduct: PaywallProduct | undefined;
  subscription: ReturnType<typeof useSubscription>;
  styles: ReturnType<typeof createStyles>;
}) {
  const { t } = useI18n();
  return (
    <View style={styles.actionStack}>
      <AppButton
        label={ctaLabel(selectedProduct, subscription.flowState, t)}
        icon={Crown}
        disabled={!selectedProduct || busy}
        style={styles.actionButton}
        onPress={() => {
          if (selectedProduct) void subscription.purchase(selectedProduct.id);
        }}
      />
      <AppButton
        label={subscription.flowState === "restoring" ? t("paywall.restoring", "Restoring") : t("paywall.restore", "Restore Purchases")}
        variant="secondary"
        disabled={busy}
        style={styles.actionButton}
        onPress={() => void subscription.restore()}
      />
    </View>
  );
}

function PreviewRow({ color, title, detail }: { color: string; title: string; detail: string }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.previewRow}>
      <View style={[styles.previewDot, { backgroundColor: color }]} />
      <View style={styles.previewCopy}>
        <Text style={styles.previewTitle}>{title}</Text>
        <Text style={styles.previewDetail}>{detail}</Text>
      </View>
      <Check color={theme.colors.green} size={15} />
    </View>
  );
}

function PayoffPill({ icon: Icon, label }: { icon: React.ComponentType<{ color: string; size: number }>; label: string }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.payoffPill}>
      <Icon color={theme.colors.ink} size={15} />
      <Text style={styles.payoffText}>{label}</Text>
    </View>
  );
}

function TrustPill({ icon: Icon, label }: { icon: React.ComponentType<{ color: string; size: number }>; label: string }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.trustPill}>
      <Icon color={theme.colors.accent} size={14} />
      <Text style={styles.trustPillText}>{label}</Text>
    </View>
  );
}

function ProductOption({ product, selected, recommended, onPress }: { product: PaywallProduct; selected: boolean; recommended: boolean; onPress: () => void; }) {
  const { theme } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(theme);
  const productTitle = localizedProductTitle(product, t);
  const periodLabel = localizedPeriodLabel(product, t);
  const productDescription = t("paywall.included_with_studyplanner", "Included with StudyPlanner");

  return (
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected }} style={[styles.productCard, selected ? styles.productCardSelected : null]} onPress={onPress}>
      <View style={styles.productHeader}>
        <View style={styles.productCopy}>
          <View style={styles.productTitleRow}>
            <Text style={styles.productTitle}>{productTitle}</Text>
            {recommended ? <Badge label={t("paywall.best_value", "Best value")} tone="gold" /> : null}
          </View>
          <Text style={styles.productMeta}>{periodLabel}</Text>
        </View>
        <Text style={styles.productPrice}>{product.displayPrice}</Text>
      </View>
      <Text style={styles.productDescription}>{productDescription}</Text>
    </TouchableOpacity>
  );
}

function localizedProductTitle(product: PaywallProduct, t: (key: string, fallback?: string) => string) {
  if (product.kind === "lifetime") return t("paywall.buy_lifetime", "Buy Lifetime");
  if (/year/i.test(product.id) || /year/i.test(product.periodLabel)) return t("paywall.yearly", "StudyPlanner: Syllabus AI Yearly");
  if (/month/i.test(product.id) || /month/i.test(product.periodLabel)) return t("paywall.monthly", "StudyPlanner: Syllabus AI Monthly");
  return product.title;
}

function localizedPeriodLabel(product: PaywallProduct, t: (key: string, fallback?: string) => string) {
  if (product.kind === "lifetime") return t("paywall.product_name", "StudyPlanner");
  if (/year/i.test(product.id) || /year/i.test(product.periodLabel)) return t("paywall.yearly", "StudyPlanner: Syllabus AI Yearly");
  if (/month/i.test(product.id) || /month/i.test(product.periodLabel)) return t("paywall.monthly", "StudyPlanner: Syllabus AI Monthly");
  return product.periodLabel;
}

function FeatureRow({ text }: { text: string }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);

  return (
    <View style={styles.featureRow}>
      <Check color={colors.green} size={17} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function LegalLink({ label, document, onOpen }: { label: string; document: LegalDocument; onOpen: (document: LegalDocument) => void; }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const open = async () => {
    const url = document === "terms" ? purchaseConfig.termsUrl : purchaseConfig.privacyUrl;
    if (url) {
      await Linking.openURL(url);
      return;
    }
    onOpen(document);
  };

  return (
    <TouchableOpacity accessibilityRole="link" onPress={() => void open()}>
      <Text style={styles.legalLink}>{label}</Text>
    </TouchableOpacity>
  );
}

function LegalNotice({ document, onClose }: { document: LegalDocument; onClose: () => void; }) {
  const { theme } = useAppTheme();
  const { t } = useI18n();
  const { colors } = theme;
  const styles = createStyles(theme);
  const isTerms = document === "terms";

  return (
    <View style={styles.screen}>
      <View style={styles.legalHeader}>
        <View style={styles.legalHeaderCopy}>
          <Text style={styles.kicker}>{isTerms ? t("paywall.terms_short", "Terms") : t("paywall.privacy_short", "Privacy")}</Text>
          <Text style={styles.legalTitle}>{isTerms ? t("paywall.terms_title", "Terms of Use") : t("paywall.privacy_title", "Privacy Policy")}</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close legal notice" style={styles.closeButton} onPress={onClose}>
          <X color={colors.ink} size={18} />
        </TouchableOpacity>
      </View>
      <View style={styles.legalCard}>
        <Text style={styles.legalBody}>
          {isTerms
            ? t("paywall.terms_body", "Subscriptions are billed by the App Store or Google Play account used at purchase. Apple's standard EULA applies on iOS. Manage or cancel renewal from your store account settings. Access remains tied to valid store entitlement status.")
            : t("paywall.privacy_body", "StudyPlanner stores planner details on your device unless you choose services that require upload, such as syllabus import. Syllabus files are sent only for parsing, and the app does not sell personal planner data.")}
        </Text>
        <View style={styles.legalFeature}>
          {isTerms ? <CalendarSync color={colors.accent} size={18} /> : <FileScan color={colors.accent} size={18} />}
          <Text style={styles.legalBody}>{isTerms ? t("paywall.terms_feature", "Prices and renewal periods shown on the paywall come from the store.") : t("paywall.privacy_feature", "Planner content is stored locally unless you choose a service that requires upload, such as syllabus parsing.")}</Text>
        </View>
        <AppButton label={t("paywall.legal_back", "Back")} onPress={onClose} />
      </View>
    </View>
  );
}

function ctaLabel(product: PaywallProduct | undefined, flowState: string, t: (key: string, fallback?: string) => string) {
  if (flowState === "purchasing") return t("paywall.opening_store_cta", "Opening Store");
  if (!product) return t("paywall.choose_plan", "Choose a Plan");
  if (product.kind === "lifetime") return t("paywall.buy_lifetime", "Buy Lifetime");
  return t("paywall.subscribe", "Subscribe");
}

function unavailableCopy(status: string, hasConfiguredProducts: boolean, hardMode = false, t: (key: string, fallback?: string) => string) {
  if (hardMode) {
    if (status === "unavailable" && hasConfiguredProducts) {
      return Platform.OS === "web"
      ? t("paywall.web_purchase_required", "Subscriptions must be purchased in the iOS or Android app. This web screen cannot unlock StudyPlanner.")
        : t("paywall.store_unavailable_locked", "Store purchases are unavailable on this device right now. Restore remains available, and StudyPlanner will not unlock without a valid store entitlement.");
    }
    if (!hasConfiguredProducts) return t("paywall.no_product_ids", "No product IDs are configured for this build. Restore remains available, but the planner stays locked until products load in a configured build.");
    return t("paywall.store_no_plans_locked", "The store could not load active plans. Restore remains available, and the planner stays locked until a valid entitlement is found.");
  }

  if (status === "unavailable" && hasConfiguredProducts) {
    return Platform.OS === "web"
      ? t("paywall.web_purchase_available", "Subscriptions are available in the iOS or Android app.")
      : t("paywall.store_unavailable", "Store purchases are unavailable on this device right now.");
  }
  if (!hasConfiguredProducts) return t("paywall.subscription_plans_unavailable", "Subscription plans are not available right now.");
  return t("paywall.store_no_plans", "The store could not load active plans. Please try again shortly.");
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    screen: {
      gap: spacing.md
    },
    heroCard: {
      padding: spacing.xl,
      gap: spacing.md,
      overflow: "hidden"
    },
    heroGlow: {
      position: "absolute",
      right: -50,
      top: -70,
      width: 190,
      height: 190,
      borderRadius: 95,
      backgroundColor: theme.isDark ? "rgba(53,242,208,0.08)" : "rgba(255,255,255,0.12)"
    },
    heroTopRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    kicker: {
      color: colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.8
    },
    title: {
      color: colors.ink,
      fontSize: 34,
      lineHeight: 39,
      fontWeight: "900",
      letterSpacing: 0
    },
    subtitle: {
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "700"
    },
    phonePreview: {
      marginTop: spacing.xs,
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.20)",
      backgroundColor: "rgba(255,255,255,0.12)",
      padding: spacing.sm,
      gap: spacing.xs
    },
    phoneHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    phoneKicker: {
      color: colors.heroMuted,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    phoneTitle: {
      color: colors.heroText,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900"
    },
    phoneBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radii.round,
      backgroundColor: colors.softGold
    },
    phoneBadgeText: {
      color: colors.gold,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    phoneRows: {
      gap: spacing.xs
    },
    payoffRail: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    trustRail: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    legalRail: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.xs,
      marginTop: -spacing.xs
    },
    trustPill: {
      flexGrow: 1,
      minHeight: 34,
      borderRadius: radii.round,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5
    },
    trustPillText: {
      color: colors.ink,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    payoffPill: {
      flexGrow: 1,
      minHeight: 38,
      borderRadius: radii.round,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.07)" : "#FFFFFF",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : "rgba(5,5,5,0.08)",
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5
    },
    payoffText: {
      color: colors.ink,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    previewRow: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: radii.lg,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.16)",
      padding: spacing.sm,
      gap: spacing.sm
    },
    previewDot: {
      width: 10,
      height: 10,
      borderRadius: 5
    },
    previewCopy: {
      flex: 1,
      minWidth: 0
    },
    previewTitle: {
      color: colors.heroText,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "900"
    },
    previewDetail: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "700"
    },
    valueGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    valueTile: {
      flexBasis: "47%",
      flexGrow: 1,
      minWidth: 150,
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.elevated,
      padding: spacing.md,
      gap: spacing.xs,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.16 : 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 }
    },
    valueIcon: {
      width: 34,
      height: 34,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft
    },
    valueTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 19,
      fontWeight: "900"
    },
    valueDetail: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    noticeSuccess: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.green,
      backgroundColor: colors.mint,
      padding: spacing.md,
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "center"
    },
    noticeError: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.red,
      backgroundColor: theme.isDark ? "rgba(255,113,130,0.12)" : "#FFF0F3",
      padding: spacing.md,
      gap: spacing.sm
    },
    noticeText: {
      flex: 1,
      color: colors.ink,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
    },
    planStateCard: {
      borderRadius: radii.xxl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.lg,
      gap: spacing.xs
    },
    planStateCardReady: {
      borderColor: colors.green,
      backgroundColor: theme.isDark ? "rgba(89,211,153,0.10)" : colors.mint
    },
    planStateCardWarning: {
      borderColor: colors.gold,
      backgroundColor: theme.isDark ? "rgba(248,195,85,0.10)" : colors.softGold
    },
    planStateTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    planStateCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    planStateKicker: {
      color: colors.accent,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    planStateTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "900"
    },
    planStateDetail: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "800"
    },
    planList: {
      gap: spacing.sm
    },
    loadingCard: {
      minHeight: 74,
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.elevated,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs
    },
    loadingText: {
      ...typography.small,
      fontWeight: "800"
    },
    productIntro: {
      gap: 2,
      paddingHorizontal: 2
    },
    productIntroTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "900"
    },
    productIntroText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    productCard: {
      borderRadius: radii.xxl,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.elevated,
      padding: spacing.lg,
      gap: spacing.sm
    },
    productCardSelected: {
      borderColor: colors.accent,
      backgroundColor: theme.isDark ? "rgba(53,242,208,0.10)" : colors.accentSoft
    },
    productHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    productCopy: {
      flex: 1,
      minWidth: 0,
      gap: 3
    },
    productTitleRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: spacing.xs
    },
    productTitle: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900"
    },
    productMeta: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
    },
    productPrice: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900",
      textAlign: "right",
      flexShrink: 0
    },
    productDescription: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    actionStack: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    actionButton: {
      flex: 1,
      minWidth: 156
    },
    unavailableCard: {
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.md,
      gap: spacing.sm
    },
    unavailableTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "900"
    },
    unavailableCopy: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "700"
    },
    includedCard: {
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm
    },
    includedHeader: {
      gap: spacing.xs
    },
    includedTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    includedIntro: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700"
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm
    },
    featureText: {
      flex: 1,
      color: colors.ink,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "800"
    },
    trustCard: {
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.md,
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "flex-start"
    },
    trustText: {
      flex: 1,
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "800"
    },
    legalRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.xs,
      paddingBottom: spacing.sm
    },
    legalLink: {
      color: colors.accent,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "900"
    },
    legalDivider: {
      color: colors.faint,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "900"
    },
    legalHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    legalHeaderCopy: {
      flex: 1,
      minWidth: 0
    },
    legalTitle: {
      ...typography.title
    },
    closeButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line
    },
    legalCard: {
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.elevated,
      padding: spacing.lg,
      gap: spacing.md
    },
    legalBody: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "700"
    },
    legalFeature: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      borderRadius: radii.lg,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.md
    }
  });
}
