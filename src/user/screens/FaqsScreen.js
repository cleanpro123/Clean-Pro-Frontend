import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { useI18n } from '../../shared/i18n/LanguageContext';

// Service / pricing oriented FAQs. App how-to lives on the Help center screen.
const FAQS = [
  { qKey: 'q1', aKey: 'a1' },
  { qKey: 'q2', aKey: 'a2' },
  { qKey: 'q3', aKey: 'a3' },
  { qKey: 'q4', aKey: 'a4' },
  { qKey: 'q5', aKey: 'a5' },
  { qKey: 'q6', aKey: 'a6' },
  { qKey: 'q7', aKey: 'a7' },
  { qKey: 'q8', aKey: 'a8' },
];

export default function FaqsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(null);

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        {t('faqs.intro')}
      </Text>

      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <View key={item.qKey} style={styles.card}>
            <TouchableOpacity
              style={styles.qRow}
              activeOpacity={0.8}
              onPress={() => setOpen(isOpen ? null : i)}
            >
              <Text style={styles.qText}>{t(`faqs.${item.qKey}`)}</Text>
              <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.muted}
              />
            </TouchableOpacity>
            {isOpen ? <Text style={styles.aText}>{t(`faqs.${item.aKey}`)}</Text> : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm + 2 },
  intro: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  qRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 14,
  },
  qText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  aText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    paddingBottom: 14,
  },
});
