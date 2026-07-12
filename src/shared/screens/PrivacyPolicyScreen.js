// In-app Privacy Policy — rendered natively (no browser / external URL).
import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/LanguageContext';

const SUPPORT_EMAIL = 'cleanproofficial1@gmail.com';
const LAST_UPDATED = '5 July 2026';

const COLLECT = [
  ['collectNameLabel', 'collectNameWhy'],
  ['collectEmailLabel', 'collectEmailWhy'],
  ['collectPasswordLabel', 'collectPasswordWhy'],
  ['collectPhoneLabel', 'collectPhoneWhy'],
  ['collectAddressLabel', 'collectAddressWhy'],
  ['collectPhotoLabel', 'collectPhotoWhy'],
  ['collectOrdersLabel', 'collectOrdersWhy'],
];

const SECTIONS = [
  {
    title: 'useInfoTitle',
    bullets: [
      'useInfoBullet1',
      'useInfoBullet2',
      'useInfoBullet3',
      'useInfoBullet4',
      'useInfoBullet5',
      'useInfoBullet6',
    ],
    footer: 'useInfoFooter',
  },
  {
    title: 'sharingTitle',
    intro: 'sharingIntro',
    bullets: [
      'sharingBullet1',
      'sharingBullet2',
      'sharingBullet3',
      'sharingBullet4',
    ],
  },
  {
    title: 'crashTitle',
    paragraphs: [
      'crashPara1',
    ],
  },
  {
    title: 'retentionTitle',
    paragraphs: [
      'retentionPara1',
    ],
  },
  {
    title: 'rightsTitle',
    bullets: [
      'rightsBullet1',
      'rightsBullet2',
      'rightsBullet3',
    ],
  },
  {
    title: 'securityTitle',
    bullets: [
      'securityBullet1',
      'securityBullet2',
      'securityBullet3',
      'securityBullet4',
    ],
  },
  {
    title: 'childrenTitle',
    paragraphs: [
      'childrenPara1',
    ],
  },
  {
    title: 'changesTitle',
    paragraphs: [
      'changesPara1',
    ],
  },
];

export default function PrivacyPolicyScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useI18n();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('privacyPolicy.title')}</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>{t('privacyPolicy.lastUpdated', { date: LAST_UPDATED })}</Text>
        <Text style={styles.intro}>
          {t('privacyPolicy.introText')}{' '}
          <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
            {SUPPORT_EMAIL}
          </Text>
          .
        </Text>

        <Text style={styles.sectionTitle}>{t('privacyPolicy.collectTitle')}</Text>
        <View style={styles.card}>
          {COLLECT.map(([labelKey, whyKey], i) => (
            <View key={labelKey} style={[styles.row, i === COLLECT.length - 1 && styles.rowLast]}>
              <Text style={styles.rowLabel}>{t(`privacyPolicy.${labelKey}`)}</Text>
              <Text style={styles.rowWhy}>{t(`privacyPolicy.${whyKey}`)}</Text>
            </View>
          ))}
        </View>

        {SECTIONS.map((s) => (
          <View key={s.title}>
            <Text style={styles.sectionTitle}>{t(`privacyPolicy.${s.title}`)}</Text>
            {s.intro ? <Text style={styles.paragraph}>{t(`privacyPolicy.${s.intro}`)}</Text> : null}
            {(s.paragraphs || []).map((p, i) => (
              <Text key={i} style={styles.paragraph}>{t(`privacyPolicy.${p}`)}</Text>
            ))}
            {(s.bullets || []).map((b, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.dot} />
                <Text style={styles.bulletText}>{t(`privacyPolicy.${b}`)}</Text>
              </View>
            ))}
            {s.footer ? <Text style={[styles.paragraph, styles.footerNote]}>{t(`privacyPolicy.${s.footer}`)}</Text> : null}
          </View>
        ))}

        <Text style={styles.sectionTitle}>{t('privacyPolicy.contactTitle')}</Text>
        <Text style={styles.paragraph}>
          Clean Pro{'\n'}{t('privacyPolicy.contactEmailLabel')}{' '}
          <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
            {SUPPORT_EMAIL}
          </Text>
        </Text>

        <Text style={styles.copyright}>{t('privacyPolicy.copyright')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
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
