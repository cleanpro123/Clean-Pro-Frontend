import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { useI18n } from '../../shared/i18n/LanguageContext';

// ── Support contact details ──────────────────────────────────────────────────
const SUPPORT_EMAIL = 'cleanproofficial1@gmail.com';
// TODO: replace with the real support number (used for BOTH Call and WhatsApp).
// Keep the country code, e.g. '+919497284858'.
const SUPPORT_PHONE = '+910000000000';
const SUPPORT_HOURS = 'Available 24/7';

// wa.me needs digits only (no +, spaces or dashes).
const waNumber = SUPPORT_PHONE.replace(/[^0-9]/g, '');

export default function ContactSupportScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const open = async (url) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) throw new Error('unsupported');
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('contactSupport.cannotOpen'), t('contactSupport.noAppAvailable'));
    }
  };

  const emailUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Clean Pro support')}`;
  const callUrl = `tel:${SUPPORT_PHONE}`;
  const waUrl = `https://wa.me/${waNumber}`;

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        {t('contactSupport.intro')}
      </Text>

      <ContactRow
        icon="mail-outline"
        tint="#1B6FC4"
        label={t('contactSupport.emailUs')}
        value={SUPPORT_EMAIL}
        onPress={() => open(emailUrl)}
      />
      <ContactRow
        icon="call-outline"
        tint="#16A34A"
        label={t('contactSupport.callUs')}
        value={SUPPORT_PHONE}
        onPress={() => open(callUrl)}
      />
      <ContactRow
        icon="logo-whatsapp"
        tint="#25D366"
        label={t('contactSupport.whatsapp')}
        value={t('contactSupport.chatWithUs')}
        onPress={() => open(waUrl)}
      />

      <View style={styles.hoursRow}>
        <Ionicons name="time-outline" size={18} color={colors.muted} />
        <Text style={styles.hoursText}>{t('contactSupport.supportHours')}</Text>
      </View>
    </ScrollView>
  );
}

function ContactRow({ icon, tint, label, value, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.iconBubble, { backgroundColor: tint + '18' }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </TouchableOpacity>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm + 4 },
  intro: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { color: colors.text, fontSize: 15, fontWeight: '700' },
  rowValue: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  hoursText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
});
