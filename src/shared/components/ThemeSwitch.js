import React from 'react';
import { View, Text, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/LanguageContext';
import { confirmAction } from '../utils/confirm';
import { radii, spacing } from '../theme/colors';

export default function ThemeSwitch() {
  const { colors, isDark, toggle } = useTheme();
  const { t } = useI18n();
  const confirmToggle = () => confirmAction({
    title: isDark ? t('settings.themeToLightTitle') : t('settings.themeToDarkTitle'),
    message: t('settings.themeConfirmMsg'),
    confirmLabel: t('settings.themeConfirmBtn'),
    onConfirm: toggle,
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.card }}>
      <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color={colors.text} />
      <Text style={{ flex: 1, color: colors.text, fontSize: 14 }}>{t('settings.darkMode')}</Text>
      <Switch
        accessibilityLabel={t('settings.darkMode')}
        value={isDark}
        onValueChange={confirmToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
