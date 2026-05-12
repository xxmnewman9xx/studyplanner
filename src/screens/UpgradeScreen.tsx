import React, { useState } from "react";
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CalendarSync, Check, Crown, FileScan, ShieldCheck, X } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { Badge } from "../components/Badge";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { purchaseConfig } from "../services/purchaseConfig";
import { PaywallProduct, useSubscription } from "../services/subscriptions";

type UpgradeScreenProps = {
  onContinueFree?: () => void;
};

type LegalDocument = "terms" | "privacy";

const paidFeatures = [
  "Scan a syllabus into courses and deadlines",
  "Sync assignments and exams to your calendar",
  "Queue smart reminders before due dates",
  "Forecast grades from weighted categories"
];

const freeFeatures = [
  "Manual courses and assignments",
  "Today plan and weekly planning",
  "Editable semester setup"
];
const bodyTextScale = 1.35;

export function UpgradeScreen({ onContinueFree }: UpgradeScreenProps) {
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
    <View>
      <View style={styles.header}>
        <Text maxFontSizeMultiplier={bodyTextScale} style={styles.kicker}>Study Planner Plus</Text>
        <Text maxFontSizeMultiplier={bodyTextScale} style={styles.title}>Save time when the semester gets busy.</Text>
        <Text maxFontSizeMultiplier={bodyTextScale} style={styles.subtitle}>
          Keep the free planner for manual organization, or unlock the automation that
          removes the repetitive setup work.
        </Text>
      </View>

      <View style={styles.valueCard}>
        <View style={styles.valueHeader}>
          <View style={styles.iconMark}>
            <Crown color={colors.ink} size={22} />
          </View>
          <View style={styles.valueCopy}>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.valueTitle}>
              {subscription.isPremium
                ? subscription.activeProductKind === "lifetime"
                  ? "Lifetime Plus is active"
                  : "Plus is active"
                : "Unlock Plus"}
            </Text>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.valueSubtitle}>
              {subscription.isPremium
                ? "Premium tools are available on this device."
                : "Syllabus scan, calendar sync, reminders, and grade forecasting."}
            </Text>
          </View>
        </View>

        {paidFeatures.map((feature) => (
          <FeatureRow key={feature} text={feature} />
        ))}
      </View>

      {subscription.message ? (
        <View style={styles.noticeSuccess}>
          <ShieldCheck color={colors.green} size={18} />
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.noticeText}>{subscription.message}</Text>
        </View>
      ) : null}

      {subscription.errorMessage && !plansUnavailable ? (
        <View style={styles.noticeError}>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.noticeText}>{subscription.errorMessage}</Text>
        </View>
      ) : null}

      {subscription.isPremium ? (
        <View style={styles.actionStack}>
          {subscription.activeProductKind !== "lifetime" ? (
            <AppButton
              label="Manage Subscription"
              variant="secondary"
              onPress={() => {
                void subscription.manageSubscriptions();
              }}
            />
          ) : null}
          {onContinueFree ? <AppButton label="Continue" onPress={onContinueFree} /> : null}
        </View>
      ) : (
        <>
          <View style={styles.planList}>
            {subscription.status === "checking" || subscription.flowState === "loading" ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={colors.ink} />
                <Text maxFontSizeMultiplier={bodyTextScale} style={styles.loadingText}>Loading store plans</Text>
              </View>
            ) : null}

            {subscription.products.map((product) => (
              <ProductOption
                key={product.id}
                product={product}
                selected={product.id === selectedProduct?.id}
                onPress={() => subscription.setSelectedProductId(product.id)}
              />
            ))}
          </View>

          {plansUnavailable ? (
            <View style={styles.unavailableCard}>
              <Text maxFontSizeMultiplier={bodyTextScale} style={styles.unavailableTitle}>Purchases are unavailable</Text>
              <Text maxFontSizeMultiplier={bodyTextScale} style={styles.unavailableCopy}>
                {unavailableCopy(subscription.status, subscription.hasConfiguredProducts)}
              </Text>
              {subscription.status !== "unavailable" ? (
                <AppButton
                  label="Try Again"
                  variant="secondary"
                  onPress={() => {
                    void subscription.refresh();
                  }}
                />
              ) : null}
            </View>
          ) : null}

          <View style={styles.actionStack}>
            <AppButton
              label={ctaLabel(selectedProduct, subscription.flowState)}
              icon={Crown}
              disabled={!selectedProduct || busy}
              onPress={() => {
                if (selectedProduct) {
                  void subscription.purchase(selectedProduct.id);
                }
              }}
            />
            <AppButton
              label={subscription.flowState === "restoring" ? "Restoring" : "Restore Purchases"}
              variant="secondary"
              disabled={busy}
              onPress={() => {
                void subscription.restore();
              }}
            />
            {onContinueFree ? (
              <AppButton label="Continue with Free Planner" variant="quiet" onPress={onContinueFree} />
            ) : null}
          </View>
        </>
      )}

      <View style={styles.freeCard}>
        <Badge label="Included" tone="green" />
        <Text maxFontSizeMultiplier={bodyTextScale} style={styles.freeTitle}>Free planner</Text>
        {freeFeatures.map((feature) => (
          <FeatureRow key={feature} text={feature} />
        ))}
      </View>

      <View style={styles.legalRow}>
        <LegalLink label="Terms of Use (EULA)" document="terms" onOpen={setLegalDocument} />
        <Text maxFontSizeMultiplier={bodyTextScale} style={styles.legalDivider}>·</Text>
        <LegalLink label="Privacy Policy" document="privacy" onOpen={setLegalDocument} />
      </View>
    </View>
  );
}

function ProductOption({
  product,
  selected,
  onPress
}: {
  product: PaywallProduct;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${product.periodLabel}, ${product.displayPrice}`}
      accessibilityHint="Selects this Plus plan. Purchase starts only after pressing the main paywall button."
      accessibilityState={{ selected }}
      style={[styles.productCard, selected ? styles.productCardSelected : null]}
      onPress={onPress}
    >
      <View style={styles.productHeader}>
        <View style={styles.productCopy}>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.productTitle}>{product.title}</Text>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.productMeta}>{product.periodLabel}</Text>
        </View>
        <Text maxFontSizeMultiplier={bodyTextScale} style={styles.productPrice}>{product.displayPrice}</Text>
      </View>
      <Text maxFontSizeMultiplier={bodyTextScale} style={styles.productDescription}>{product.description}</Text>
      {product.hasFreeTrial ? <Badge label="Free trial available" tone="gold" /> : null}
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
      <Text maxFontSizeMultiplier={bodyTextScale} style={styles.featureText}>{text}</Text>
    </View>
  );
}

function LegalLink({
  label,
  document,
  onOpen
}: {
  label: string;
  document: LegalDocument;
  onOpen: (document: LegalDocument) => void;
}) {
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
    <TouchableOpacity accessibilityRole="link" accessibilityLabel={label} onPress={() => void open()}>
      <Text maxFontSizeMultiplier={bodyTextScale} style={styles.legalLink}>{label}</Text>
    </TouchableOpacity>
  );
}

function LegalNotice({
  document,
  onClose
}: {
  document: LegalDocument;
  onClose: () => void;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const isTerms = document === "terms";

  return (
    <View>
      <View style={styles.legalHeader}>
        <View>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.kicker}>{isTerms ? "Terms" : "Privacy"}</Text>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.title}>{isTerms ? "Terms of Use" : "Privacy Policy"}</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close legal notice"
          style={styles.closeButton}
          onPress={onClose}
        >
          <X color={colors.ink} size={18} />
        </TouchableOpacity>
      </View>

      <View style={styles.legalCard}>
        <Text maxFontSizeMultiplier={bodyTextScale} style={styles.legalBody}>
          {isTerms
            ? "Subscriptions are billed by the App Store or Google Play account used at purchase. Apple's standard EULA applies on iOS. Manage or cancel renewal from your store account settings. Premium access remains tied to valid store entitlement status."
            : "Study Planner stores planner details on your device unless you choose services that require upload, such as syllabus scan. Syllabus files are sent only for parsing, and the app does not sell personal planner data."}
        </Text>
        <View style={styles.legalFeature}>
          {isTerms ? (
            <CalendarSync color={colors.accent} size={18} />
          ) : (
            <FileScan color={colors.accent} size={18} />
          )}
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.legalBody}>
            {isTerms
              ? "Prices, trials, and renewal periods shown on the paywall come from the store."
              : "You can continue using the planner manually without creating an account or purchasing Plus."}
          </Text>
        </View>
        <AppButton label="Back to Plus" onPress={onClose} />
      </View>
    </View>
  );
}

function ctaLabel(product: PaywallProduct | undefined, flowState: string) {
  if (flowState === "purchasing") return "Opening Store";
  if (!product) return "Choose a Plan";
  if (product.kind === "lifetime") return "Buy Lifetime";
  return product.hasFreeTrial ? "Start Free Trial" : "Subscribe";
}

function unavailableCopy(status: string, hasConfiguredProducts: boolean) {
  if (status === "unavailable" && hasConfiguredProducts) {
    return Platform.OS === "web"
      ? "Subscriptions are available in the iOS or Android app. You can keep using the free planner here."
      : "Store purchases are unavailable on this device right now. You can keep using the free planner.";
  }

  if (!hasConfiguredProducts) {
    return "Subscription plans are not available right now. You can keep using the free planner.";
  }

  return "The store could not load active Plus plans. Please try again shortly.";
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    header: {
      gap: spacing.xs
    },
    kicker: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900"
    },
    title: {
      ...typography.title
    },
    subtitle: {
      ...typography.body
    },
    valueCard: {
      marginTop: spacing.lg,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.gold,
      backgroundColor: colors.softGold,
      padding: spacing.lg,
      gap: spacing.sm
    },
    valueHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.xs
    },
    iconMark: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center"
    },
    valueCopy: {
      flex: 1,
      gap: 2
    },
    valueTitle: {
      color: colors.ink,
      fontSize: 21,
      lineHeight: 27,
      fontWeight: "900"
    },
    valueSubtitle: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700"
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    featureText: {
      flex: 1,
      color: colors.ink,
      fontSize: 15,
      lineHeight: 21,
      fontWeight: "700"
    },
    noticeSuccess: {
      marginTop: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.green,
      backgroundColor: colors.mint,
      padding: spacing.md,
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "center"
    },
    noticeError: {
      marginTop: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.red,
      backgroundColor: colors.surface,
      padding: spacing.md
    },
    noticeText: {
      flex: 1,
      color: colors.ink,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "700"
    },
    planList: {
      marginTop: spacing.md,
      gap: spacing.sm
    },
    loadingCard: {
      minHeight: 84,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm
    },
    loadingText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "800"
    },
    productCard: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.xs
    },
    productCardSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.surfaceAlt
    },
    productHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    productCopy: {
      flex: 1,
      gap: 2
    },
    productTitle: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "900"
    },
    productMeta: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900"
    },
    productPrice: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "900"
    },
    productDescription: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18
    },
    unavailableCard: {
      marginTop: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm
    },
    unavailableTitle: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "900"
    },
    unavailableCopy: {
      ...typography.body
    },
    actionStack: {
      marginTop: spacing.md,
      gap: spacing.sm
    },
    freeCard: {
      marginTop: spacing.lg,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.sm
    },
    freeTitle: {
      color: colors.ink,
      fontSize: 19,
      lineHeight: 25,
      fontWeight: "900"
    },
    legalRow: {
      marginTop: spacing.lg,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.xs,
      flexWrap: "wrap"
    },
    legalDivider: {
      color: colors.faint,
      fontSize: 13,
      fontWeight: "800"
    },
    legalLink: {
      color: colors.accent,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "900"
    },
    legalHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center"
    },
    legalCard: {
      marginTop: spacing.lg,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.md
    },
    legalBody: {
      ...typography.body,
      color: colors.ink
    },
    legalFeature: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm
    }
  });
}
