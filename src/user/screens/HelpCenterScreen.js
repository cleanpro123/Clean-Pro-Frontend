import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { useI18n } from '../../shared/i18n/LanguageContext';

// General, app-level help. Order/account-specific issues are handled on the
// Contact support screen.
const FAQS = [
  { qKey: 'q1Question', aKey: 'q1Answer' },
  { qKey: 'q2Question', aKey: 'q2Answer' },
  { qKey: 'q3Question', aKey: 'q3Answer' },
  { qKey: 'q4Question', aKey: 'q4Answer' },
  { qKey: 'q5Question', aKey: 'q5Answer' },
  { qKey: 'q6Question', aKey: 'q6Answer' },
  { qKey: 'q7Question', aKey: 'q7Answer' },
  { qKey: 'q8Question', aKey: 'q8Answer' },
  { qKey: 'q9Question', aKey: 'q9Answer' },
];

export default function HelpCenterScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(null);

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        {t('helpCenter.intro')}
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
              <Text style={styles.qText}>{t(`helpCenter.${item.qKey}`)}</Text>
              <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.muted}
              />
            </TouchableOpacity>
            {isOpen ? <Text style={styles.aText}>{t(`helpCenter.${item.aKey}`)}</Text> : null}
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
