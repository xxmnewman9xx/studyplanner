import React, { useState } from "react";
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Bell, CalendarSync, Check, Crown, FileScan, Layers3, ShieldCheck, WandSparkles, X } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { AppLogo, GlassCard } from "../components/AppleComponents";
import { Badge } from "../components/Badge";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { purchaseConfig } from "../services/purchaseConfig";
import { PaywallProduct, useSubscription } from "../services/subscriptions";

type UpgradeScreenProps = {
  onContinueFree?: () => void;
  hardMode?: boolean;
};

type LegalDocument = "terms" | "privacy";

const paidFeatures = [
  { icon: FileScan, title: "Syllabus scanning", detail: "Import scans, uploads, and re-imports when classes change." },
  { icon: WandSparkles, title: "Smart planning", detail: "Turn approved deadlines into Today, Plan, workload, and focus blocks." },
  { icon: Bell, title: "Calm reminders", detail: "Prep nudges, deadline alerts, and calendar sync without noise." },
  { icon: Layers3, title: "Widget Studio", detail: "Save premium themes, Smart Stack presets, class looks, and widget styles." }
];

const freeFeatures = [
  "1 active semester",
  "2 classes and 12 homework items",
  "1 reviewed syllabus import",
  "Manual add/edit plus basic Today and Upcoming widgets"
];

export function UpgradeScreen({ onContinueFree, hardMode = false }: UpgradeScreenProps) {
  const { theme } = useAppTheme();
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

  if (legalDocument) {
    return <LegalNotice document={legalDocument} onClose={() => setLegalDocument(null)} />;
  }

  return (
    <View style={styles.screen}>
      <GlassCard tone="hero" style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <View style={styles.heroTopRow}>
          <AppLogo showWordmark size={42} />
          <Badge label={hardMode ? "Before your planner" : "StudyPlanner Plus"} tone="gold" />
        </View>
        <Text style={styles.kicker}>{hardMode ? "Your semester command center" : "StudyPlanner Plus"}</Text>
        <Text style={styles.title}>{hardMode ? "Unlock the full school loop." : "Upgrade the planner that keeps up."}</Text>
        <Text style={styles.subtitle}>
          Free lets you try the planner with real utility. Plus expands scans, automation, widgets, and semester controls when school gets busy.
        </Text>

        <View style={styles.phonePreview}>
          <View style={styles.phoneHeader}>
            <View>
              <Text style={styles.phoneKicker}>Today widget</Text>
              <Text style={styles.phoneTitle}>3 deadlines handled</Text>
            </View>
            <View style={styles.phoneBadge}><Text style={styles.phoneBadgeText}>Plus</Text></View>
          </View>
          <View style={styles.phoneRows}>
            <PreviewRow color={colors.accent} title="Bio lab" detail="Prep block at 4:00" />
            <PreviewRow color={colors.brandPink} title="Calc set" detail="Reminder tonight" />
            <PreviewRow color={colors.sage} title="English essay" detail="Widget-ready" />
          </View>
        </View>
      </GlassCard>

      <View style={styles.valueGrid}>
        {paidFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <View key={feature.title} style={styles.valueTile}>
              <View style={styles.valueIcon}><Icon color={colors.accent} size={18} /></View>
              <Text style={styles.valueTitle}>{feature.title}</Text>
              <Text style={styles.valueDetail}>{feature.detail}</Text>
            </View>
          );
        })}
      </View>

      {subscription.message ? (
        <View style={styles.noticeSuccess}>
          <ShieldCheck color={colors.green} size={18} />
          <Text style={styles.noticeText}>{subscription.message}</Text>
        </View>
      ) : null}

      {subscription.errorMessage && !plansUnavailable ? (
        <View style={styles.noticeError}>
          <Text style={styles.noticeText}>{subscription.errorMessage}</Text>
        </View>
      ) : null}

      {subscription.isPremium ? (
        <View style={styles.actionStack}>
          <AppButton label="Manage Subscription" variant="secondary" onPress={() => void subscription.manageSubscriptions()} />
          {onContinueFree ? <AppButton label="Continue" onPress={onContinueFree} /> : null}
        </View>
      ) : (
        <>
          <View style={styles.planList}>
            {subscription.status === "checking" || subscription.flowState === "loading" ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={colors.ink} />
                <Text style={styles.loadingText}>Loading App Store plans</Text>
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
            <View style={styles.unavailableCard}>
              <Text style={styles.unavailableTitle}>Purchases are unavailable</Text>
              <Text style={styles.unavailableCopy}>{unavailableCopy(subscription.status, subscription.hasConfiguredProducts)}</Text>
              {subscription.status !== "unavailable" ? (
                <AppButton label="Try Again" variant="secondary" onPress={() => void subscription.refresh()} />
              ) : null}
            </View>
          ) : null}

          <View style={styles.actionStack}>
            <AppButton
              label={ctaLabel(selectedProduct, subscription.flowState)}
              icon={Crown}
              disabled={!selectedProduct || busy}
              onPress={() => {
                if (selectedProduct) void subscription.purchase(selectedProduct.id);
              }}
            />
            <AppButton
              label={subscription.flowState === "restoring" ? "Restoring" : "Restore Purchases"}
              variant="secondary"
              disabled={busy}
              onPress={() => void subscription.restore()}
            />
            {onContinueFree ? (
              <AppButton label="Continue with limited free planner" variant="quiet" onPress={onContinueFree} />
            ) : null}
          </View>
        </>
      )}

      <View style={styles.freeCard}>
        <View style={styles.freeHeader}>
          <Badge label="Included free" tone="green" />
          <Text style={styles.freeTitle}>Try the basics first</Text>
        </View>
        {freeFeatures.map((feature) => <FeatureRow key={feature} text={feature} />)}
      </View>

      <View style={styles.trustCard}>
        <ShieldCheck color={colors.sage} size={18} />
        <Text style={styles.trustText}>High trust by design: store pricing, clear restore, clear legal, no fake urgency, no dark patterns.</Text>
      </View>

      <View style={styles.legalRow}>
        <LegalLink label="Terms of Use (EULA)" document="terms" onOpen={setLegalDocument} />
        <Text style={styles.legalDivider}>·</Text>
        <LegalLink label="Privacy Policy" document="privacy" onOpen={setLegalDocument} />
      </View>
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

function ProductOption({ product, selected, recommended, onPress }: { product: PaywallProduct; selected: boolean; recommended: boolean; onPress: () => void; }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected }} style={[styles.productCard, selected ? styles.productCardSelected : null]} onPress={onPress}>
      <View style={styles.productHeader}>
        <View style={styles.productCopy}>
          <View style={styles.productTitleRow}>
            <Text style={styles.productTitle}>{product.title}</Text>
            {recommended || product.hasFreeTrial ? <Badge label={product.hasFreeTrial ? "Free trial" : "Best value"} tone="gold" /> : null}
          </View>
          <Text style={styles.productMeta}>{product.periodLabel}</Text>
        </View>
        <Text style={styles.productPrice}>{product.displayPrice}</Text>
      </View>
      <Text style={styles.productDescription}>{product.description}</Text>
    </TouchableOpacity>
  );
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
  const { colors } = theme;
  const styles = createStyles(theme);
  const isTerms = document === "terms";

  return (
    <View style={styles.screen}>
      <View style={styles.legalHeader}>
        <View style={styles.legalHeaderCopy}>
          <Text style={styles.kicker}>{isTerms ? "Terms" : "Privacy"}</Text>
          <Text style={styles.legalTitle}>{isTerms ? "Terms of Use" : "Privacy Policy"}</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close legal notice" style={styles.closeButton} onPress={onClose}>
          <X color={colors.ink} size={18} />
        </TouchableOpacity>
      </View>
      <View style={styles.legalCard}>
        <Text style={styles.legalBody}>
          {isTerms
            ? "Subscriptions are billed by the App Store or Google Play account used at purchase. Apple's standard EULA applies on iOS. Manage or cancel renewal from your store account settings. Plus access remains tied to valid store entitlement status."
            : "StudyPlanner stores planner details on your device unless you choose services that require upload, such as syllabus scan. Syllabus files are sent only for parsing, and the app does not sell personal planner data."}
        </Text>
        <View style={styles.legalFeature}>
          {isTerms ? <CalendarSync color={colors.accent} size={18} /> : <FileScan color={colors.accent} size={18} />}
          <Text style={styles.legalBody}>{isTerms ? "Prices, trials, and renewal periods shown on the paywall come from the store." : "You can continue using the planner manually without creating an account or purchasing Plus."}</Text>
        </View>
        <AppButton label="Back to Plus" onPress={onClose} />
      </View>
    </View>
  );
}

function ctaLabel(product: PaywallProduct | undefined, flowState: string) {
  if (flowState === "purchasing") return "Opening Store";
  if (!product) return "Choose a Plan";
  return product.hasFreeTrial ? "Start Free Trial" : "Subscribe";
}

function unavailableCopy(status: string, hasConfiguredProducts: boolean) {
  if (status === "unavailable" && hasConfiguredProducts) {
    return Platform.OS === "web"
      ? "Subscriptions are available in the iOS or Android app. You can keep using the free planner here."
      : "Store purchases are unavailable on this device right now. You can keep using the free planner.";
  }
  if (!hasConfiguredProducts) return "Subscription plans are not available right now. You can keep using the free planner.";
  return "The store could not load active Plus plans. Please try again shortly.";
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    screen: {
      gap: spacing.md
    },
    heroCard: {
      padding: spacing.lg,
      gap: spacing.sm,
      overflow: "hidden"
    },
    heroGlow: {
      position: "absolute",
      right: -50,
      top: -70,
      width: 190,
      height: 190,
      borderRadius: 95,
      backgroundColor: theme.isDark ? "rgba(53,242,208,0.16)" : "rgba(255,255,255,0.18)"
    },
    heroTopRow: {
      flexDirection: "row",
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
      color: colors.heroText,
      fontSize: 34,
      lineHeight: 39,
      fontWeight: "900",
      letterSpacing: -1.1
    },
    subtitle: {
      color: colors.heroMuted,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "700"
    },
    phonePreview: {
      marginTop: spacing.xs,
      borderRadius: radii.xxl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.20)",
      backgroundColor: "rgba(255,255,255,0.12)",
      padding: spacing.md,
      gap: spacing.sm
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
      fontSize: 20,
      lineHeight: 25,
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
      padding: spacing.md
    },
    noticeText: {
      flex: 1,
      color: colors.ink,
      fontSize: 13,
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
    productCard: {
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.elevated,
      padding: spacing.md,
      gap: spacing.xs
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
      fontSize: 18,
      lineHeight: 23,
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
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900",
      textAlign: "right",
      flexShrink: 0
    },
    productDescription: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "700"
    },
    actionStack: {
      gap: spacing.sm
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
    freeCard: {
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm
    },
    freeHeader: {
      gap: spacing.xs
    },
    freeTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
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
