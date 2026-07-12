// Language selection — switches app language (and RTL for Arabic).
import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useI18n, reloadApp } from '../i18n/LanguageContext';
import { confirmAction } from '../utils/confirm';

export default function LanguageScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { language, setLanguage, t, languages } = useI18n();

  const choose = (code) => {
    if (code === language) return;
    // Confirm BEFORE applying — Cancel must leave the current language untouched.
    confirmAction({
      title: t('language.restartTitle'),
      message: t('language.restartMsg'),
      confirmLabel: t('language.restartConfirm'),
      onConfirm: async () => {
        const needsReload = await setLanguage(code);
        if (needsReload) reloadApp();
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('language.title')}</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t('language.subtitle')}</Text>

        <View style={styles.card}>
          {languages.map((l, i) => {
            const active = l.code === language;
            return (
              <TouchableOpacity
                key={l.code}
                activeOpacity={0.7}
                onPress={() => choose(l.code)}
                style={[styles.row, i !== languages.length - 1 && styles.rowBorder]}
              >
                <View style={styles.rowText}>
                  <Text style={styles.native}>{l.native}</Text>
                  <Text style={styles.label}>{l.label}</Text>
                </View>
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={active ? colors.primary : colors.muted}
                />
              </TouchableOpacity>
            );
          })}
        </View>
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

  scroll: { padding: spacing.md },
  subtitle: { color: colors.muted, fontSize: 13, marginBottom: spacing.md },

  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 60,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  rowText: { gap: 2 },
  native: { color: colors.text, fontSize: 15, fontWeight: '700' },
  label: { color: colors.muted, fontSize: 12 },
});
