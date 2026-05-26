import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Crown, LockKeyhole } from "lucide-react-native";
import { AppButton } from "./AppButton";
import { AppLogo } from "./AppleComponents";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { useI18n } from "../i18n";

type PremiumGateProps = {
  title: string;
  copy: string;
  onUpgrade: () => void;
};

export function PremiumGate({ title, copy, onUpgrade }: PremiumGateProps) {
  const { theme } = useAppTheme();
  const { t } = useI18n();
  const { colors } = theme;
  const styles = createStyles(theme);

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.kicker}>{t("entitlement_gate.included", "Included with StudyPlanner")}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{copy}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.brandLock}>
          <AppLogo size={54} />
          <View style={styles.lockBadge}>
            <LockKeyhole color={colors.heroText} size={17} />
          </View>
        </View>
        <Text style={styles.cardTitle}>{t("entitlement_gate.unlock_title", "Unlock StudyPlanner")}</Text>
        <Text style={styles.cardCopy}>
          {t("entitlement_gate.unlock_copy", "Subscribe or restore purchases to use the full app.")}
        </Text>
        <AppButton label={t("entitlement_gate.subscribe", "Subscribe")} icon={Crown} onPress={onUpgrade} />
      </View>
    </View>
  );
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
    card: {
      marginTop: spacing.lg,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.md,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.18 : 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4
    },
    brandLock: {
      width: 52,
      height: 52,
      alignItems: "center",
      justifyContent: "center"
    },
    lockBadge: {
      position: "absolute",
      right: -7,
      bottom: -7,
      width: 27,
      height: 27,
      borderRadius: 14,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.surface
    },
    cardTitle: {
      color: colors.ink,
      fontSize: 21,
      lineHeight: 27,
      fontWeight: "900"
    },
    cardCopy: {
      ...typography.body
    }
  });
}
