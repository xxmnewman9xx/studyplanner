import React from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  Bell,
  CalendarRange,
  Crown,
  ExternalLink,
  LifeBuoy,
  Moon,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sun
} from "lucide-react-native";

import { AppButton } from "../components/AppButton";
import { GlassCard, PremiumHeader, PremiumScreen, StatusBadge } from "../components/PremiumUI";
import { isAssignmentConfirmed, isAssignmentNeedsReview } from "../logic/assignmentModel";
import { Assignment, Course, Semester } from "../models";
import { purchaseConfig } from "../services/purchaseConfig";
import { useSubscription } from "../services/subscriptions";
import { AppTheme, ThemePaletteId } from "../theme";
import { useAppTheme } from "../themeContext";

const bodyTextScale = 1.35;

type SettingsScreenProps = {
  semester: Semester;
  courses: Course[];
  assignments: Assignment[];
  needsReviewCount?: number;
  onOpenImport: () => void;
  onOpenPaywall: () => void;
  onOpenWidgetSetup: () => void;
};

export function SettingsScreen({
  semester,
  courses,
  assignments,
  needsReviewCount: needsReviewCountOverride,
  onOpenImport,
  onOpenPaywall,
  onOpenWidgetSetup
}: SettingsScreenProps) {
  const { mode, toggleMode, theme, paletteId, palettes, setPalette } = useAppTheme();
  const subscription = useSubscription();
  const { colors } = theme;
  const styles = createStyles(theme);
  const confirmedCount = assignments.filter(isAssignmentConfirmed).length;
  const needsCheckCount =
    needsReviewCountOverride ?? assignments.filter(isAssignmentNeedsReview).length;
  const supportUrl = purchaseConfig.supportUrl;

  return (
    <PremiumScreen>
      <PremiumHeader
        eyebrow="Settings"
        title="StudyPlanner"
        subtitle="Keep your plan honest, personal, and easy to trust."
      />

      <GlassCard
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`${semester.name}. ${courses.length} classes, ${confirmedCount} checked due dates, ${needsCheckCount} items need checking.`}
        style={styles.summaryCard}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconBubble}>
            <ShieldCheck color={colors.brandPurple} size={18} />
          </View>
          <View style={styles.cardCopy}>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.cardTitle}>{semester.name}</Text>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.cardSubtitle}>
              {courses.length} classes · {confirmedCount} checked due dates
            </Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <StatusBadge label={`${needsCheckCount} to check`} tone={needsCheckCount > 0 ? "gold" : "green"} />
          <StatusBadge label={subscription.isPremium ? "Plus active" : "Free planner"} tone={subscription.isPremium ? "purple" : "blue"} />
        </View>
        {needsCheckCount > 0 ? (
          <AppButton label="Review Found Work" variant="secondary" onPress={onOpenImport} />
        ) : null}
      </GlassCard>

      <GlassCard style={styles.cardStack}>
        <SettingHeader icon={mode === "dark" ? Sun : Moon} title="Appearance" copy="Choose the feel that makes school easiest to scan." />
        <AppButton
          label={mode === "dark" ? "Use Light Mode" : "Use Dark Mode"}
          variant="secondary"
          icon={mode === "dark" ? Sun : Moon}
          onPress={toggleMode}
        />
        <View style={styles.paletteGrid}>
          {palettes.slice(0, 6).map((palette) => (
            <TouchableOpacity
              key={palette.id}
              accessibilityRole="button"
              accessibilityLabel={`Use ${palette.name} color theme`}
              accessibilityState={{ selected: paletteId === palette.id }}
              activeOpacity={0.82}
              style={[styles.paletteChoice, paletteId === palette.id ? styles.paletteChoiceActive : null]}
              onPress={() => setPalette(palette.id as ThemePaletteId)}
            >
              <View style={styles.paletteSwatches}>
                <View style={[styles.paletteSwatch, { backgroundColor: palette.accent }]} />
                <View style={[styles.paletteSwatch, { backgroundColor: palette.secondary }]} />
                <View style={[styles.paletteSwatch, { backgroundColor: palette.tertiary }]} />
              </View>
              <Text maxFontSizeMultiplier={bodyTextScale} numberOfLines={1} style={styles.paletteName}>
                {palette.shortName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </GlassCard>

      <GlassCard style={styles.cardStack}>
        <SettingHeader icon={Crown} title="Plus and purchases" copy={storeStatusCopy(subscription.status, subscription.isPremium)} />
        <View style={styles.statusLine}>
          <StatusBadge label={subscription.status === "checking" ? "Checking" : subscription.status} tone={subscription.status === "ready" ? "green" : "gold"} />
          {subscription.activeProductKind ? <StatusBadge label={subscription.activeProductKind} tone="purple" /> : null}
        </View>
        {subscription.message ? <Notice tone="success" text={subscription.message} /> : null}
        {subscription.errorMessage ? <Notice tone="error" text={subscription.errorMessage} /> : null}
        <View style={styles.buttonRow}>
          <AppButton
            label={subscription.isPremium ? "Manage" : "View Plus"}
            icon={Crown}
            onPress={subscription.isPremium && subscription.activeProductKind !== "lifetime" ? subscription.manageSubscriptions : onOpenPaywall}
            style={styles.halfButton}
          />
          <AppButton
            label={subscription.flowState === "restoring" ? "Restoring" : "Restore Purchases"}
            variant="secondary"
            icon={RotateCcw}
            onPress={() => {
              void subscription.restore();
            }}
            style={styles.halfButton}
          />
        </View>
      </GlassCard>

      <GlassCard style={styles.cardStack}>
        <SettingHeader icon={Smartphone} title="Widgets and reminders" copy="Only supported Home Screen widgets are shown in the app." />
        <View style={styles.featureList}>
          <FeatureLine icon={Smartphone} text="Small widget: Next Due" />
          <FeatureLine icon={CalendarRange} text="Medium widget: This Week" />
          <FeatureLine icon={Bell} text="Smart reminders use checked due dates only" />
        </View>
        <AppButton label="Widget Setup" variant="secondary" icon={Smartphone} onPress={onOpenWidgetSetup} />
      </GlassCard>

      <GlassCard style={styles.cardStack}>
        <SettingHeader icon={LifeBuoy} title="Privacy and support" copy="Manual planning works without an account. Uploads are only used when parsing school materials." />
        <View style={styles.linkList}>
          <ExternalSettingLink label="Privacy Policy" url={purchaseConfig.privacyUrl} />
          <ExternalSettingLink label="Support" url={supportUrl} fallback="Support URL is required before final submission." />
        </View>
      </GlassCard>
    </PremiumScreen>
  );
}

function SettingHeader({
  icon: Icon,
  title,
  copy
}: {
  icon: React.ComponentType<{ color: string; size: number }>;
  title: string;
  copy: string;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);

  return (
    <View style={styles.cardHeader}>
      <View style={styles.iconBubble}>
        <Icon color={colors.brandPurple} size={18} />
      </View>
      <View style={styles.cardCopy}>
        <Text maxFontSizeMultiplier={bodyTextScale} style={styles.cardTitle}>{title}</Text>
        <Text maxFontSizeMultiplier={bodyTextScale} style={styles.cardSubtitle}>{copy}</Text>
      </View>
    </View>
  );
}

function FeatureLine({
  icon: Icon,
  text
}: {
  icon: React.ComponentType<{ color: string; size: number }>;
  text: string;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);

  return (
    <View style={styles.featureLine}>
      <Icon color={colors.brandPurple} size={16} />
      <Text maxFontSizeMultiplier={bodyTextScale} style={styles.featureText}>{text}</Text>
    </View>
  );
}

function Notice({ tone, text }: { tone: "success" | "error"; text: string }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={tone === "success" ? styles.noticeSuccess : styles.noticeError}>
      <Text maxFontSizeMultiplier={bodyTextScale} style={styles.noticeText}>{text}</Text>
    </View>
  );
}

function ExternalSettingLink({
  label,
  url,
  fallback
}: {
  label: string;
  url?: string;
  fallback?: string;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);

  if (!url) {
    return (
      <View style={styles.missingLink}>
        <Text maxFontSizeMultiplier={bodyTextScale} style={styles.linkLabel}>{label}</Text>
        <Text maxFontSizeMultiplier={bodyTextScale} style={styles.missingCopy}>{fallback || "Not configured."}</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      accessibilityRole="link"
      accessibilityLabel={`Open ${label}`}
      activeOpacity={0.82}
      style={styles.linkButton}
      onPress={() => {
        void Linking.openURL(url);
      }}
    >
      <Text maxFontSizeMultiplier={bodyTextScale} style={styles.linkLabel}>{label}</Text>
      <ExternalLink color={colors.brandPurple} size={16} />
    </TouchableOpacity>
  );
}

function storeStatusCopy(status: string, isPremium: boolean) {
  if (isPremium) return "Premium access is active on this device.";
  if (status === "checking") return "The app is checking store access.";
  if (status === "ready") return "Purchases and restore use the App Store.";
  if (status === "unavailable") return "Store purchases are unavailable on this device.";
  return "The store needs another check before purchase proof is complete.";
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    summaryCard: {
      gap: spacing.md
    },
    cardStack: {
      gap: spacing.md
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm
    },
    iconBubble: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.purpleSoft,
      borderWidth: 1,
      borderColor: colors.line
    },
    cardCopy: {
      flex: 1,
      gap: 3
    },
    cardTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "900"
    },
    cardSubtitle: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    statRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    statusLine: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    buttonRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    halfButton: {
      flex: 1,
      paddingHorizontal: spacing.sm
    },
    paletteGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    paletteChoice: {
      width: "31%",
      minHeight: 66,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.xs,
      justifyContent: "space-between",
      gap: 6
    },
    paletteChoiceActive: {
      borderColor: colors.brandPurple,
      backgroundColor: colors.purpleSoft
    },
    paletteSwatches: {
      flexDirection: "row"
    },
    paletteSwatch: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: colors.surface,
      marginRight: -4
    },
    paletteName: {
      color: colors.ink,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    featureList: {
      gap: spacing.xs
    },
    featureLine: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs
    },
    featureText: {
      flex: 1,
      color: colors.ink,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800"
    },
    linkList: {
      gap: spacing.xs
    },
    linkButton: {
      minHeight: 46,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    missingLink: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.sm,
      gap: 3
    },
    linkLabel: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "900"
    },
    missingCopy: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "700"
    },
    noticeSuccess: {
      borderRadius: radii.md,
      backgroundColor: colors.mint,
      padding: spacing.sm
    },
    noticeError: {
      borderRadius: radii.md,
      backgroundColor: colors.redSoft,
      padding: spacing.sm
    },
    noticeText: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800"
    }
  });
}
