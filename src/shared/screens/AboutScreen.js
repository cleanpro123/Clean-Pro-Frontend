// About Clean Pro — in-app company / product overview.
import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/LanguageContext';

const SUPPORT_EMAIL = 'cleanproofficial1@gmail.com';
const APP_VERSION = '1.0.0';

const PARAGRAPH_KEYS = ['paragraph1', 'paragraph2', 'paragraph3', 'paragraph4'];

const HIGHLIGHTS = [
  ['flash-outline', 'highlight1Title', 'highlight1Desc'],
  ['sparkles-outline', 'highlight2Title', 'highlight2Desc'],
  ['navigate-outline', 'highlight3Title', 'highlight3Desc'],
  ['shield-checkmark-outline', 'highlight4Title', 'highlight4Desc'],
];

export default function AboutScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useI18n();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('about.headerTitle')}</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.brandWrap}>
          <View style={styles.logoBadge}>
            <Ionicons name="shirt-outline" size={30} color="#fff" />
          </View>
          <Text style={styles.brandName}>Clean Pro</Text>
          <Text style={styles.tagline}>{t('about.tagline')}</Text>
        </View>

        {PARAGRAPH_KEYS.map((key, i) => (
          <Text key={i} style={styles.paragraph}>{t(`about.${key}`)}</Text>
        ))}

        <Text style={styles.sectionTitle}>{t('about.whyTitle')}</Text>
        <View style={styles.card}>
          {HIGHLIGHTS.map(([icon, titleKey, descKey], i) => (
            <View
              key={titleKey}
              style={[styles.row, i === HIGHLIGHTS.length - 1 && styles.rowLast]}
            >
              <View style={styles.rowIcon}>
                <Ionicons name={icon} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{t(`about.${titleKey}`)}</Text>
                <Text style={styles.rowDesc}>{t(`about.${descKey}`)}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('about.contactTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('about.contactIntro')}{' '}
          <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
            {SUPPORT_EMAIL}
          </Text>
          .
        </Text>

        <Text style={styles.version}>{t('about.version', { version: APP_VERSION })}</Text>
        <Text style={styles.copyright}>{t('about.copyright')}</Text>
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

  brandWrap: { alignItems: 'center', marginBottom: spacing.lg },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  brandName: { color: colors.text, fontSize: 22, fontWeight: '800' },
  tagline: { color: colors.muted, fontSize: 13, marginTop: 2 },

  paragraph: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.md,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  rowDesc: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 2 },

  link: { color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' },

  version: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: spacing.md },
  copyright: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 4 },
});
