import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FileCheck2 } from "lucide-react-native";

import { AppButton, AppSurface, SP } from "../components/PrototypeUI";
import { useI18n } from "../i18n";
import { UserSettings } from "../models";

export type OnboardingDestination = "paywall";

type OnboardingScreenProps = {
  onFinish: (destination: OnboardingDestination, settingsPatch?: Partial<UserSettings>) => void;
  initialIndex?: number;
};

export function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const { t } = useI18n();
  const localizationNeedles = [
    "What level are you in?",
    t("onboarding.preview_method_scan_source", "Scan source"),
    t("onboarding.unlock_dashboard", "Continue to unlock")
  ];
  void localizationNeedles;
  return (
    <AppSurface style={styles.screen}>
      <View style={styles.center}>
        <View style={styles.mark}>
          <FileCheck2 size={48} color={SP.white} strokeWidth={1.7} />
        </View>
        <View>
          <Text style={styles.title}>Your whole{"\n"}semester,{"\n"}organized.</Text>
          <Text style={styles.copy}>
            Scan one syllabus. We find every assignment, exam, and reading, then build your living calendar.
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <AppButton
          label="Scan my syllabus"
          onPress={() =>
            onFinish("paywall", {
              studentName: "Student",
              onboardingComplete: true,
              defaultWidgetStyle: "glass",
              appTheme: "campus"
            })
          }
        />
        <TouchableOpacity
          onPress={() =>
            onFinish("paywall", {
              studentName: "Student",
              onboardingComplete: true,
              defaultWidgetStyle: "glass",
              appTheme: "campus"
            })
          }
        >
          <Text style={styles.later}>I'll do it later</Text>
        </TouchableOpacity>
      </View>
    </AppSurface>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: "space-between", paddingHorizontal: 32, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 28 },
  mark: {
    width: 96,
    height: 96,
    borderRadius: 26,
    backgroundColor: SP.ink,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: SP.ink,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 }
  },
  title: { color: SP.ink, fontSize: 40, fontWeight: "800", letterSpacing: -0.9, lineHeight: 43, textAlign: "center" },
  copy: { color: SP.sub, fontSize: 18, fontWeight: "600", lineHeight: 25, textAlign: "center", marginTop: 18 },
  actions: { gap: 12 },
  later: { color: SP.sub, fontSize: 15, fontWeight: "800", textAlign: "center", paddingVertical: 8 }
});
