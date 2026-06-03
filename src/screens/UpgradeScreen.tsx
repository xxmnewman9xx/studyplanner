import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AppButton, AppSurface, SP } from "../components/PrototypeUI";
import { useSubscription } from "../services/subscriptions";
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
  const buy = async () => {
    try {
      await subscription.purchase("yearly");
      onContinueAfterPurchase?.();
    } catch {
      undefined;
    }
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
        <TouchableOpacity style={styles.plan}>
          <Text style={styles.planLabel}>{t("paywall.monthly", "Monthly")}</Text>
          <Text style={styles.planPrice}>$4.99</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.plan, styles.planSelected]}>
          <Text style={styles.save}>SAVE 60%</Text>
          <Text style={styles.planLabel}>{t("paywall.yearly", "Yearly")}</Text>
          <Text style={styles.planPrice}>$23.99</Text>
        </TouchableOpacity>
      </View>
      <AppButton label="Start 7-day free trial" variant="light" onPress={buy} style={{ height: 60 }} />
      <Text style={styles.fine}>Then $23.99/yr · Cancel anytime</Text>
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
  planLabel: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "800" },
  planPrice: { color: SP.white, fontSize: 22, fontWeight: "900", marginTop: 2 },
  fine: { color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "700", textAlign: "center", marginTop: 12 }
});
