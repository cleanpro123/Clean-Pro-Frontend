// Reusable full-screen "state" view for anything that isn't the happy path:
// crashes, blocked accounts, 404s, network loss, server downtime, empty lists…
//
// Use a preset for the common cases:
//   <StatusScreen preset="blocked" onAction={logout} />
//   <StatusScreen preset="notFound" onAction={() => navigation.goBack()} />
// or pass explicit props to build a one-off state:
//   <StatusScreen icon="cloud-offline-outline" title="…" message="…" />
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radii, spacing } from '../theme/colors';

// Each preset is a sensible default; any field can be overridden via props.
export const STATUS_PRESETS = {
  crash: {
    icon: 'bug-outline',
    gradient: gradients.ocean,
    title: 'Something went wrong',
    message:
      'The app hit an unexpected error. You can try again — if it keeps happening, please reopen the app.',
    actionLabel: 'Try again',
  },
  notFound: {
    icon: 'help-circle-outline',
    gradient: gradients.sky,
    title: "We couldn't find that",
    message: 'The page or item you were looking for no longer exists or was moved.',
    actionLabel: 'Go back',
  },
  blocked: {
    icon: 'lock-closed-outline',
    gradient: gradients.ocean,
    title: 'Account blocked',
    message:
      'Your account has been blocked. If you think this is a mistake, please contact our support team.',
    actionLabel: 'Back to login',
  },
  forbidden: {
    icon: 'shield-outline',
    gradient: gradients.ocean,
    title: "You don't have access",
    message: "You don't have permission to view this. Try signing in with the right account.",
    actionLabel: 'Back to login',
  },
  sessionExpired: {
    icon: 'time-outline',
    gradient: gradients.sky,
    title: 'Session expired',
    message: 'For your security you have been signed out. Please log in again to continue.',
    actionLabel: 'Log in',
  },
  offline: {
    icon: 'cloud-offline-outline',
    gradient: gradients.mist,
    title: "You're offline",
    message: 'We can’t reach the internet right now. Check your connection and try again.',
    actionLabel: 'Retry',
  },
  serverDown: {
    icon: 'server-outline',
    gradient: gradients.ocean,
    title: 'Service unavailable',
    message:
      'Our servers are taking a break or under maintenance. Please try again in a few minutes.',
    actionLabel: 'Retry',
  },
  empty: {
    icon: 'file-tray-outline',
    gradient: gradients.mist,
    title: 'Nothing here yet',
    message: 'There is nothing to show right now.',
    actionLabel: null,
  },
  generic: {
    icon: 'alert-circle-outline',
    gradient: gradients.sky,
    title: 'Something went wrong',
    message: 'Please try again.',
    actionLabel: 'Try again',
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
  const base = STATUS_PRESETS[preset] || STATUS_PRESETS.generic;
  const _icon = icon ?? base.icon;
  const _gradient = gradient ?? base.gradient;
  const _title = title ?? base.title;
  const _message = message ?? base.message;
  const _actionLabel = actionLabel !== undefined ? actionLabel : base.actionLabel;

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

const styles = StyleSheet.create({
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
