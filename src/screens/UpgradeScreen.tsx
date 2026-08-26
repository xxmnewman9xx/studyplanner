import React from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AppButton, AppSurface, SP } from "../components/PrototypeUI";
import { useSubscription } from "../services/subscriptions";
import { purchaseConfig } from "../services/purchaseConfig";
import { useI18n } from "../i18n";

type UpgradeScreenProps = {
  hardMode?: boolean;
  onContinueAfterPurchase?: () => void;
};

const features = [
  ["Unlimited syllabus scans"],
  ["Living dashboard & Pulse"],
  ["Semester forecast & risk"],
  ["Widget Studio & colors"]
];

export function UpgradeScreen({ onContinueAfterPurchase }: UpgradeScreenProps) {
  const subscription = useSubscription();
  const { t } = useI18n();
  const localizationAnchor = t("paywall.dashboard_ready_subtitle", "Stay ahead all semester.");
  void localizationAnchor;
  const weeklyProduct = subscription.products.find((product) => product.periodLabel.toLowerCase().includes("week"));
  const monthlyProduct = subscription.products.find((product) => product.periodLabel.toLowerCase().includes("month")) ?? subscription.products[0];
  const lifetimeProduct = subscription.products.find((product) => product.kind === "lifetime");
  const selectedProduct = subscription.products.find((product) => product.id === subscription.selectedProductId) ?? monthlyProduct;
  const buy = async () => {
    try {
      if (selectedProduct) {
        await subscription.purchase(selectedProduct.id);
        onContinueAfterPurchase?.();
      } else {
        await subscription.manageSubscriptions();
      }
    } catch {
      undefined;
    }
  };
  const restore = async () => {
    try {
      await subscription.restore();
    } catch {
      undefined;
    }
  };
  const openTerms = () => {
    void Linking.openURL(purchaseConfig.termsUrl);
  };
  const openPolicy = () => {
    void Linking.openURL(purchaseConfig.privacyUrl);
  };

  return (
    <AppSurface dark style={styles.screen}>
      <View style={styles.head}>
        <Text style={styles.eyebrow}>StudyPlanner Pro</Text>
        <Text style={styles.title}>Stay ahead all{"\n"}semester.</Text>
      </View>

      <View style={styles.features}>
        {features.map((feature, index) => (
          <View key={feature[0]} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{["📄", "📊", "🌦", "🎛"][index]}</Text>
            <Text style={styles.featureText}>{feature[0]}</Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.plans}>
        <TouchableOpacity style={[styles.plan, subscription.selectedProductId === weeklyProduct?.id && styles.planSelected]} onPress={() => weeklyProduct ? subscription.setSelectedProductId(weeklyProduct.id) : undefined}>
          <Text style={styles.planLabel}>{t("paywall.weekly", "Weekly")}</Text>
          <Text style={styles.planPrice}>{weeklyProduct?.displayPrice ?? t("paywall.waiting_for_store_plans", "App Store price")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.plan, subscription.selectedProductId === monthlyProduct?.id && styles.planSelected]} onPress={() => monthlyProduct ? subscription.setSelectedProductId(monthlyProduct.id) : undefined}>
          <Text style={styles.save}>{t("paywall.sale_badge", "SALE · 40% OFF")}</Text>
          <Text style={styles.planLabel}>{t("paywall.monthly", "Monthly")}</Text>
          <Text style={styles.wasPrice}>$24.99</Text>
          <Text style={styles.planPrice}>{monthlyProduct?.displayPrice ?? t("paywall.waiting_for_store_plans", "App Store price")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.plan, subscription.selectedProductId === lifetimeProduct?.id && styles.planSelected]} onPress={() => lifetimeProduct ? subscription.setSelectedProductId(lifetimeProduct.id) : undefined}>
          <Text style={styles.bestValue}>{t("paywall.best_value", "Best value")}</Text>
          <Text style={styles.planLabel}>{t("paywall.lifetime", "Lifetime")}</Text>
          <Text style={styles.planPrice}>{lifetimeProduct?.displayPrice ?? t("paywall.waiting_for_store_plans", "App Store price")}</Text>
          <Text style={styles.oneTime}>{t("paywall.one_time", "One-time purchase")}</Text>
        </TouchableOpacity>
      </View>
      <AppButton label={selectedProduct?.kind === "lifetime" ? t("paywall.buy_lifetime", "Buy lifetime") : t("paywall.subscribe", "Subscribe")} variant="light" onPress={buy} style={{ height: 60 }} />
      <TouchableOpacity style={styles.restoreButton} onPress={restore}>
        <Text style={styles.restoreText}>{subscription.flowState === "restoring" ? t("paywall.restoring", "Restoring") : t("paywall.restore", "Restore Purchases")}</Text>
      </TouchableOpacity>
      <Text style={styles.fine}>
        {selectedProduct?.kind === "lifetime" ? t("paywall.one_time", "One-time purchase") : t("paywall.legal_mixed", "Subscriptions auto-renew until canceled.")} · {purchaseConfig.productIdSource === "environment" ? t("paywall.product_source_build_env", "Store products from build environment") : t("paywall.product_source_release_manifest", "Store products from release manifest")}
      </Text>
      <View style={styles.legalRow}>
        <TouchableOpacity onPress={openTerms}>
          <Text style={styles.legalText}>{t("paywall.terms", "Terms of Use")}</Text>
        </TouchableOpacity>
        <Text style={styles.legalDot}>·</Text>
        <TouchableOpacity onPress={openTerms}>
          <Text style={styles.legalText}>{t("paywall.terms_title", "Terms of Use (EULA)")}</Text>
        </TouchableOpacity>
        <Text style={styles.legalDot}>·</Text>
        <TouchableOpacity onPress={openPolicy}>
          <Text style={styles.legalText}>{t("paywall.privacy_short", "Policy")}</Text>
        </TouchableOpacity>
      </View>
    </AppSurface>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 28, paddingTop: 20, paddingBottom: 36 },
  head: { alignItems: "center" },
  eyebrow: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "900", letterSpacing: 0.7, textTransform: "uppercase" },
  title: { color: SP.white, fontSize: 34, fontWeight: "900", letterSpacing: -0.7, lineHeight: 38, textAlign: "center", marginTop: 8 },
  features: { marginTop: 28, gap: 6 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  featureIcon: { fontSize: 24, width: 30 },
  featureText: { color: SP.white, fontSize: 17, fontWeight: "800" },
  plans: { flexDirection: "row", gap: 12, marginBottom: 12 },
  plan: { flex: 1, borderWidth: 2, borderColor: "rgba(255,255,255,0.18)", borderRadius: 18, padding: 16 },
  planSelected: { borderColor: SP.green },
  save: { position: "absolute", right: 14, top: -11, backgroundColor: SP.green, color: SP.ink, fontSize: 11, fontWeight: "900", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, overflow: "hidden" },
  bestValue: { position: "absolute", right: 14, top: -11, backgroundColor: "#FFB84D", color: SP.ink, fontSize: 11, fontWeight: "900", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, overflow: "hidden" },
  planLabel: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "800" },
  planPrice: { color: SP.white, fontSize: 22, fontWeight: "900", marginTop: 2 },
  wasPrice: { color: "rgba(255,255,255,0.42)", fontSize: 12, fontWeight: "800", marginTop: 2, textDecorationLine: "line-through" },
  oneTime: { color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: "800", marginTop: 2 },
  restoreButton: { alignItems: "center", paddingVertical: 14 },
  restoreText: { color: SP.green, fontSize: 14, fontWeight: "900" },
  fine: { color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "700", textAlign: "center", marginTop: 2 },
  legalRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 },
  legalText: { color: "rgba(255,255,255,0.58)", fontSize: 12, fontWeight: "800" },
  legalDot: { color: "rgba(255,255,255,0.32)", fontSize: 12, fontWeight: "900" }
});
