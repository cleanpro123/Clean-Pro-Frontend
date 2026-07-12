// Security — change password (2FA listed as coming soon).
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';
import { useI18n } from '../../shared/i18n/LanguageContext';

export default function SecurityScreen({ navigation }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmit = current.length > 0 && next.length >= 6 && confirm.length > 0 && !busy;

  const submit = async () => {
    if (next !== confirm) {
      confirmAction({
        title: t('security.failedTitle'),
        message: t('security.mismatch'),
        hideCancel: true,
        confirmLabel: t('common.gotIt'),
      });
      return;
    }
    try {
      setBusy(true);
      await api.patch('/users/me/password', {
        currentPassword: current,
        newPassword: next,
      });
      setCurrent('');
      setNext('');
      setConfirm('');
      confirmAction({
        title: t('security.updatedTitle'),
        message: t('security.updatedMsg'),
        hideCancel: true,
        tone: 'info',
        confirmLabel: t('common.done'),
        onConfirm: () => navigation.goBack(),
      });
    } catch (e) {
      confirmAction({
        title: t('security.failedTitle'),
        message: e.message || 'Please try again.',
        hideCancel: true,
        confirmLabel: t('common.gotIt'),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('security.title')}</Text>
        <View style={styles.back} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.section}>{t('security.passwordSection')}</Text>
          <View style={styles.card}>
            <Field
              label={t('security.currentPassword')}
              value={current}
              onChangeText={setCurrent}
              secure={!show}
            />
            <Field
              label={t('security.newPassword')}
              value={next}
              onChangeText={setNext}
              secure={!show}
            />
            <Field
              label={t('security.confirmPassword')}
              value={confirm}
              onChangeText={setConfirm}
              secure={!show}
              last
            />
          </View>

          <TouchableOpacity
            style={styles.showRow}
            onPress={() => setShow((s) => !s)}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <Ionicons
              name={show ? 'eye-off-outline' : 'eye-outline'}
              size={16}
              color={colors.muted}
            />
            <Text style={styles.showText}>{show ? 'Hide passwords' : 'Show passwords'}</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>{t('security.rulesHint')}</Text>

          <TouchableOpacity
            style={[styles.cta, !canSubmit && styles.ctaDisabled]}
            onPress={submit}
            disabled={!canSubmit}
            activeOpacity={0.9}
          >
            {busy ? (
              <ActivityIndicator color={colors.card} />
            ) : (
              <Text style={styles.ctaText}>{t('security.update')}</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.section}>{t('security.moreSection')}</Text>
          <View style={styles.card}>
            <View style={[styles.row, styles.rowLast]}>
              <View style={styles.rowIcon}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{t('security.twoFA')}</Text>
                <Text style={styles.rowHint}>{t('security.twoFAHint')}</Text>
              </View>
              <View style={styles.soonBadge}>
                <Text style={styles.soonText}>{t('common.soon')}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, secure, last }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.field, !last && styles.fieldBorder]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="••••••••"
        placeholderTextColor={colors.muted}
      />
    </View>
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
  field: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  fieldBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  fieldLabel: { color: colors.muted, fontSize: 11, marginBottom: 2 },
  input: { color: colors.text, fontSize: 15, paddingVertical: 6 },

  showRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  showText: { color: colors.muted, fontSize: 12, fontWeight: '600' },

  hint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing.sm },

  cta: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: colors.card, fontSize: 15, fontWeight: '800' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: 12,
    minHeight: 56,
  },
  rowLast: {},
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { color: colors.text, fontSize: 14, fontWeight: '600' },
  rowHint: { color: colors.muted, fontSize: 11, marginTop: 2 },
  soonBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  soonText: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
});
