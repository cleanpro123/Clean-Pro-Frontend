// In-app Privacy Policy — rendered natively (no browser / external URL).
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../theme/colors';

const SUPPORT_EMAIL = 'cleanproofficial1@gmail.com';
const LAST_UPDATED = '5 July 2026';

const COLLECT = [
  ['Name', 'To identify you and personalise your account'],
  ['Email address', 'Login, one-time passcodes (OTP) and service notifications'],
  ['Password', 'Account security — stored only as a salted hash, never in plain text'],
  ['Phone number', 'So our agents can contact you about a pickup or delivery'],
  ['Pickup / delivery addresses', 'To collect and return your laundry'],
  ['Profile photo', 'To personalise your profile (only if you add one)'],
  ['Orders, requests & reviews', 'To fulfil your orders and improve the service'],
];

const SECTIONS = [
  {
    title: 'How we use your information',
    bullets: [
      'To create and secure your account and sign you in.',
      'To send one-time passcodes and essential service emails.',
      'To schedule, fulfil and deliver your laundry orders.',
      'To let delivery agents complete assigned requests.',
      'To operate, maintain, debug and improve the app.',
      'To respond to your support requests.',
    ],
    footer: 'We do not sell your personal data, and we do not use it for third-party advertising.',
  },
  {
    title: 'How your data is shared',
    intro: 'We share data only with service providers that help us run Clean Pro, and only as needed:',
    bullets: [
      'MongoDB Atlas — secure database hosting for your account and order data.',
      'Render — hosting for our backend service.',
      'Google (Gmail) — to deliver one-time passcode and notification emails.',
      'Sentry — crash diagnostics, configured to exclude your personal data.',
    ],
  },
  {
    title: 'Crash and error reporting',
    paragraphs: [
      'To keep the app stable we record diagnostic information when an error occurs (error message, screen, device model, OS and app version). This is configured to not attach personal identifying information such as your email.',
    ],
  },
  {
    title: 'Data retention',
    paragraphs: [
      'We keep your personal data while your account is active. When you ask us to delete your account, we remove your personal data within 30 days, except where we must keep limited records to meet legal obligations.',
    ],
  },
  {
    title: 'Your rights and choices',
    bullets: [
      'Access or update your profile information from within the app.',
      'Delete your account and personal data by contacting us.',
      'Withdraw consent for optional data (e.g. remove your profile photo) at any time.',
    ],
  },
  {
    title: 'Data security',
    bullets: [
      'Passwords are stored only as salted bcrypt hashes.',
      'Sessions use short-lived access tokens and rotating refresh tokens.',
      'Traffic between the app and our servers is encrypted over HTTPS.',
      'Access to production data is restricted.',
    ],
  },
  {
    title: "Children's privacy",
    paragraphs: [
      'Clean Pro is not directed to children under 13. We do not knowingly collect data from children. If you believe a child has provided us data, contact us and we will delete it.',
    ],
  },
  {
    title: 'Changes to this policy',
    paragraphs: [
      'We may update this policy from time to time. We will revise the "Last updated" date above and, where appropriate, notify you in the app.',
    ],
  },
];

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>
        <Text style={styles.intro}>
          Clean Pro provides an on-demand laundry service. This policy explains what personal data
          we collect, why, and the choices you have. Questions? Email us at{' '}
          <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
            {SUPPORT_EMAIL}
          </Text>
          .
        </Text>

        <Text style={styles.sectionTitle}>Information we collect</Text>
        <View style={styles.card}>
          {COLLECT.map(([label, why], i) => (
            <View key={label} style={[styles.row, i === COLLECT.length - 1 && styles.rowLast]}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowWhy}>{why}</Text>
            </View>
          ))}
        </View>

        {SECTIONS.map((s) => (
          <View key={s.title}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            {s.intro ? <Text style={styles.paragraph}>{s.intro}</Text> : null}
            {(s.paragraphs || []).map((p, i) => (
              <Text key={i} style={styles.paragraph}>{p}</Text>
            ))}
            {(s.bullets || []).map((b, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.dot} />
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
            {s.footer ? <Text style={[styles.paragraph, styles.footerNote]}>{s.footer}</Text> : null}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Contact us</Text>
        <Text style={styles.paragraph}>
          Clean Pro{'\n'}Email:{' '}
          <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
            {SUPPORT_EMAIL}
          </Text>
        </Text>

        <Text style={styles.copyright}>© 2026 Clean Pro. All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  back: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },

  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  updated: { color: colors.muted, fontSize: 12, marginBottom: spacing.md },
  intro: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },

  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  paragraph: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginBottom: spacing.xs },
  footerNote: { color: colors.muted, fontStyle: 'italic', marginTop: spacing.xs },

  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  rowWhy: { color: colors.muted, fontSize: 13, lineHeight: 19 },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xs, gap: spacing.sm },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  bulletText: { flex: 1, color: colors.textSecondary, fontSize: 14, lineHeight: 21 },

  link: { color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
  copyright: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: spacing.xl },
});
