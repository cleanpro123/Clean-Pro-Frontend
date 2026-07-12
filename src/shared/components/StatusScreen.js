// Reusable full-screen "state" view for anything that isn't the happy path:
// crashes, blocked accounts, 404s, network loss, server downtime, empty lists…
//
// Use a preset for the common cases:
//   <StatusScreen preset="blocked" onAction={logout} />
//   <StatusScreen preset="notFound" onAction={() => navigation.goBack()} />
// or pass explicit props to build a one-off state:
//   <StatusScreen icon="cloud-offline-outline" title="…" message="…" />
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/LanguageContext';

// Each preset is a sensible default; any field can be overridden via props.
// title/message/actionLabel hold i18n keys, resolved with t() at render time.
// `gradient` holds a theme gradient key, resolved against the runtime theme.
export const STATUS_PRESETS = {
  crash: {
    icon: 'bug-outline',
    gradient: 'ocean',
    title: 'status.somethingWentWrong',
    message: 'status.crashMessage',
    actionLabel: 'status.tryAgain',
  },
  notFound: {
    icon: 'help-circle-outline',
    gradient: 'sky',
    title: 'status.notFoundTitle',
    message: 'status.notFoundMessage',
    actionLabel: 'status.goBack',
  },
  blocked: {
    icon: 'lock-closed-outline',
    gradient: 'ocean',
    title: 'status.blockedTitle',
    message: 'status.blockedMessage',
    actionLabel: 'status.backToLogin',
  },
  forbidden: {
    icon: 'shield-outline',
    gradient: 'ocean',
    title: 'status.forbiddenTitle',
    message: 'status.forbiddenMessage',
    actionLabel: 'status.backToLogin',
  },
  sessionExpired: {
    icon: 'time-outline',
    gradient: 'sky',
    title: 'status.sessionExpiredTitle',
    message: 'status.sessionExpiredMessage',
    actionLabel: 'status.login',
  },
  offline: {
    icon: 'cloud-offline-outline',
    gradient: 'mist',
    title: 'status.offlineTitle',
    message: 'status.offlineMessage',
    actionLabel: 'status.retry',
  },
  serverDown: {
    icon: 'server-outline',
    gradient: 'ocean',
    title: 'status.serverDownTitle',
    message: 'status.serverDownMessage',
    actionLabel: 'status.retry',
  },
  empty: {
    icon: 'file-tray-outline',
    gradient: 'mist',
    title: 'status.emptyTitle',
    message: 'status.emptyMessage',
    actionLabel: null,
  },
  generic: {
    icon: 'alert-circle-outline',
    gradient: 'sky',
    title: 'status.somethingWentWrong',
    message: 'status.genericMessage',
    actionLabel: 'status.tryAgain',
  },
};

export default function StatusScreen({
  preset = 'generic',
  icon,
  gradient,
  title,
  message,
  actionLabel,
  onAction,
  // Optional secondary action, e.g. "Contact support".
  secondaryLabel,
  onSecondary,
  // Dev-only detail (e.g. the error message from an ErrorBoundary).
  detail,
}) {
  const { t } = useI18n();
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const base = STATUS_PRESETS[preset] || STATUS_PRESETS.generic;
  const _icon = icon ?? base.icon;
  const _gradient = gradient ?? gradients[base.gradient];
  const _title = title ?? t(base.title);
  const _message = message ?? t(base.message);
  const _actionLabel =
    actionLabel !== undefined ? actionLabel : base.actionLabel ? t(base.actionLabel) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={_gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badge}
        >
          <Ionicons name={_icon} size={48} color="#fff" />
        </LinearGradient>

        <Text style={styles.title}>{_title}</Text>
        <Text style={styles.sub}>{_message}</Text>

        {detail ? (
          <View style={styles.detailBox}>
            <Text style={styles.detailText} numberOfLines={4}>
              {detail}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {(_actionLabel && onAction) || (secondaryLabel && onSecondary) ? (
        <View style={styles.actions}>
          {_actionLabel && onAction ? (
            <TouchableOpacity activeOpacity={0.85} onPress={onAction}>
              <LinearGradient
                colors={gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btn}
              >
                <Text style={styles.btnText}>{_actionLabel}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}

          {secondaryLabel && onSecondary ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onSecondary}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryText}>{secondaryLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  badge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  detailBox: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  detailText: { fontSize: 12, color: colors.muted, fontFamily: 'monospace' },
  actions: { gap: spacing.sm },
  btn: { paddingVertical: 16, borderRadius: radii.md, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
