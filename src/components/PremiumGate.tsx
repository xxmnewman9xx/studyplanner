import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Crown, LockKeyhole } from "lucide-react-native";
import { AppButton } from "./AppButton";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type PremiumGateProps = {
  title: string;
  copy: string;
  onUpgrade: () => void;
};

export function PremiumGate({ title, copy, onUpgrade }: PremiumGateProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.kicker}>Plus feature</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{copy}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconMark}>
          <LockKeyhole color={colors.ink} size={24} />
        </View>
        <Text style={styles.cardTitle}>Unlock with Study Planner Plus</Text>
        <Text style={styles.cardCopy}>
          These tools open after Plus is active on your store account.
        </Text>
        <AppButton label="View Plus" icon={Crown} onPress={onUpgrade} />
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
    iconMark: {
      width: 52,
      height: 52,
      borderRadius: radii.lg,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center"
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
