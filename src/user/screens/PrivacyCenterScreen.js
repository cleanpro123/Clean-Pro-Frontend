// Privacy Center — self-service account & data controls (deactivate, delete).
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { api } from '../../shared/api/client';
import { useAuth } from '../../shared/state/AuthContext';
import { confirmAction } from '../../shared/utils/confirm';
import { useI18n } from '../../shared/i18n/LanguageContext';

export default function PrivacyCenterScreen({ navigation }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);

  const deactivate = () =>
    confirmAction({
      title: t('privacyCenter.deactivateConfirmTitle'),
      message: t('privacyCenter.deactivateConfirmMessage'),
      confirmLabel: t('privacyCenter.deactivateConfirmLabel'),
      destructive: true,
      onConfirm: async () => {
        try {
          setBusy(true);
          await api.post('/users/me/deactivate');
          await logout();
        } catch (e) {
          setBusy(false);
          confirmAction({
            title: t('privacyCenter.deactivateErrorTitle'),
            message: e.message || t('privacyCenter.tryAgain'),
            hideCancel: true,
            confirmLabel: t('privacyCenter.ok'),
          });
        }
      },
    });

  const remove = () =>
    confirmAction({
      title: t('privacyCenter.deleteConfirmTitle'),
      message: t('privacyCenter.deleteConfirmMessage'),
      confirmLabel: t('privacyCenter.deleteConfirmLabel'),
      destructive: true,
      countdown: 30,
      onConfirm: async () => {
        try {
          setBusy(true);
          await api.delete('/users/me');
          await logout();
        } catch (e) {
          setBusy(false);
          confirmAction({
            title: t('privacyCenter.deleteErrorTitle'),
            message: e.message || t('privacyCenter.tryAgain'),
            hideCancel: true,
            confirmLabel: t('privacyCenter.ok'),
          });
        }
      },
    });

  const infoRows = [
    {
      icon: 'document-text-outline',
      label: t('privacyCenter.privacyPolicyLabel'),
      hint: t('privacyCenter.privacyPolicyHint'),
      tint: '#1B6FC4',
      onPress: () => navigation.navigate('PrivacyPolicy'),
    },
  ];

  const dangerRows = [
    {
      icon: 'pause-circle-outline',
      label: t('privacyCenter.deactivateLabel'),
      hint: t('privacyCenter.deactivateHint'),
      tint: '#F59E0B',
      onPress: deactivate,
    },
    {
      icon: 'trash-outline',
      label: t('privacyCenter.deleteLabel'),
      hint: t('privacyCenter.deleteHint'),
      tint: colors.danger,
      danger: true,
      onPress: remove,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('privacyCenter.title')}</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>{t('privacyCenter.intro')}</Text>

        <Text style={styles.section}>{t('privacyCenter.dataPrivacySection')}</Text>
        <View style={styles.card}>
          {infoRows.map((r, i) => (
            <Row key={r.label} item={r} isLast={i === infoRows.length - 1} />
          ))}
        </View>

        <Text style={styles.section}>{t('privacyCenter.manageAccountSection')}</Text>
        <View style={styles.card}>
          {dangerRows.map((r, i) => (
            <Row key={r.label} item={r} isLast={i === dangerRows.length - 1} />
          ))}
        </View>
      </ScrollView>

      {busy && (
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}
    </SafeAreaView>
  );
}

function Row({ item, isLast }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity
      onPress={item.onPress}
      activeOpacity={0.7}
      style={[styles.row, !isLast && styles.rowBorder]}
    >
      <View style={[styles.rowIcon, { backgroundColor: (item.tint || colors.primary) + '18' }]}>
        <Ionicons name={item.icon} size={18} color={item.tint || colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, item.danger && { color: colors.danger }]}>{item.label}</Text>
        {item.hint && <Text style={styles.rowHint}>{item.hint}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </TouchableOpacity>
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

  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  intro: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginBottom: spacing.sm },

  section: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
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
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: 12,
    minHeight: 56,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { color: colors.text, fontSize: 14, fontWeight: '600' },
  rowHint: { color: colors.muted, fontSize: 11, marginTop: 2 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000040',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
