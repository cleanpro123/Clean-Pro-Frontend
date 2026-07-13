import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { useAuth } from '../../shared/state/AuthContext';
import { api } from '../../shared/api/client';
import AvatarPicker from '../../shared/components/AvatarPicker';
import useResendTimer from '../../shared/hooks/useResendTimer';
import { useI18n } from '../../shared/i18n/LanguageContext';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function EditProfileScreen({ navigation }) {
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useI18n();
  const { profile, refreshProfile, requestOtp, verifyOtp, changeEmail } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [avatar, setAvatar] = useState(profile?.avatar || '');
  const [busy, setBusy] = useState(false);

  // Email change is a separate, OTP-guarded sub-flow:
  // idle → edit (type new email, send code) → code (verify) → back to idle.
  const [emailStep, setEmailStep] = useState('idle');
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailNotice, setEmailNotice] = useState('');
  const resendTimer = useResendTimer(60);

  const dirty = name.trim() !== (profile?.name || '') || avatar !== (profile?.avatar || '');

  const handleSave = async () => {
    if (name.trim().length < 2) {
      Alert.alert(t('editProfile.nameTooShortTitle'), t('editProfile.nameTooShortMessage'));
      return;
    }
    if (!dirty) {
      navigation.goBack();
      return;
    }
    setBusy(true);
    try {
      await api.patch('/users/me', { name: name.trim(), avatar });
      await refreshProfile();
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('editProfile.couldNotSaveTitle'), e.message || t('editProfile.genericError'));
    } finally {
      setBusy(false);
    }
  };

  // ── Email change ──
  const startEmailEdit = () => {
    setEmailError('');
    setEmailNotice('');
    setNewEmail(profile?.email || '');
    setEmailCode('');
    setEmailStep('edit');
  };

  const cancelEmailEdit = () => {
    setEmailError('');
    setEmailNotice('');
    setEmailCode('');
    setEmailStep('idle');
    resendTimer.reset();
  };

  // Step 1: send a verification code to the NEW address to prove ownership.
  const sendEmailCode = async () => {
    if (emailStep === 'code' && resendTimer.active) return; // still cooling down
    setEmailError('');
    setEmailNotice('');
    const next = newEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(next)) return setEmailError(t('editProfile.invalidEmail'));
    if (next === (profile?.email || '').toLowerCase())
      return setEmailError(t('editProfile.sameEmail'));
    setEmailBusy(true);
    try {
      await requestOtp(next, 'change-email');
      setEmailStep('code');
      setEmailNotice(t('editProfile.codeSentNotice', { email: next }));
      resendTimer.start();
    } catch (e) {
      setEmailError(e.message || t('editProfile.couldNotSendCode'));
    } finally {
      setEmailBusy(false);
    }
  };

  // Step 2: verify the code, then commit the new email on the account.
  const verifyAndUpdateEmail = async () => {
    setEmailError('');
    setEmailNotice('');
    if (!/^\d{4,8}$/.test(emailCode.trim())) return setEmailError(t('editProfile.enterCode'));
    const next = newEmail.trim().toLowerCase();
    setEmailBusy(true);
    try {
      await verifyOtp(next, emailCode.trim());
      await changeEmail(next);
      await refreshProfile();
      setEmailStep('idle');
      setEmailCode('');
      resendTimer.reset();
      Alert.alert(t('editProfile.emailUpdatedTitle'), t('editProfile.emailUpdatedMessage', { email: next }));
    } catch (e) {
      setEmailError(e.message || t('editProfile.wrongCode'));
    } finally {
      setEmailBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}>
        <Text style={styles.section}>{t('editProfile.profilePhoto')}</Text>
        <AvatarPicker value={avatar} onChange={setAvatar} />

        <View style={{ height: spacing.lg }} />

        <Text style={styles.section}>{t('editProfile.yourDetails')}</Text>
        <View style={{ marginBottom: spacing.md }}>
          <Text style={styles.fieldLabel}>{t('editProfile.fullName')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('editProfile.fullNamePlaceholder')}
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
          />
        </View>

        {/* Email — the login identity. Changing it requires OTP verification of
            the new address, so it has its own inline flow. */}
        <View style={{ marginBottom: spacing.md }}>
          <Text style={styles.fieldLabel}>{t('editProfile.email')}</Text>

          {emailStep === 'idle' ? (
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={styles.inputDisabledText} numberOfLines={1}>
                {profile?.email || '—'}
              </Text>
              <TouchableOpacity onPress={startEmailEdit} hitSlop={8}>
                <Text style={styles.linkAction}>{t('editProfile.change')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.input}
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder={t('editProfile.newEmailPlaceholder')}
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={cancelEmailEdit} disabled={emailBusy} hitSlop={8}>
                  <Text style={styles.linkMuted}>{t('editProfile.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={sendEmailCode}
                  disabled={emailBusy}
                  activeOpacity={0.85}
                >
                  {emailBusy ? (
                    <ActivityIndicator size="small" color={colors.card} />
                  ) : (
                    <Text style={styles.smallBtnText}>{t('editProfile.sendCode')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Errors from the edit step show inline; the code step shows them in the modal. */}
          {emailStep !== 'code' && emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : null}
          {emailStep === 'idle' && !emailError ? (
            <Text style={styles.helper}>{t('editProfile.emailChangeHelper')}</Text>
          ) : null}
        </View>

        {/* OTP verification — shown as a modal so the code entry is a focused,
            separate step from typing the new email. */}
        <Modal
          visible={emailStep === 'code'}
          transparent
          animationType="fade"
          onRequestClose={cancelEmailEdit}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalIcon}>
                <Ionicons name="mail-unread-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.modalTitle}>{t('editProfile.verifyEmailTitle')}</Text>
              <Text style={styles.modalSubtitle}>
                {emailNotice || t('editProfile.enterCodeSentTo', { email: newEmail.trim() })}
              </Text>

              <TextInput
                style={[styles.input, styles.codeInput, styles.modalCodeInput]}
                value={emailCode}
                onChangeText={(t) => setEmailCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="------"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                autoFocus
              />

              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={verifyAndUpdateEmail}
                disabled={emailBusy}
                activeOpacity={0.85}
              >
                {emailBusy ? (
                  <ActivityIndicator size="small" color={colors.card} />
                ) : (
                  <Text style={styles.smallBtnText}>{t('editProfile.verifyAndUpdate')}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.modalFooterRow}>
                <TouchableOpacity
                  onPress={sendEmailCode}
                  disabled={emailBusy || resendTimer.active}
                  hitSlop={8}
                >
                  <Text style={resendTimer.active ? styles.linkMuted : styles.linkAction}>
                    {resendTimer.active
                      ? t('editProfile.resendIn', { seconds: resendTimer.secondsLeft })
                      : t('editProfile.resendCode')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelEmailEdit} disabled={emailBusy} hitSlop={8}>
                  <Text style={styles.linkMuted}>{t('editProfile.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <View style={{ height: spacing.sm }} />

        {/* Security */}
        <Text style={styles.section}>{t('editProfile.security')}</Text>
        <TouchableOpacity
          style={styles.menuRow}
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate('ForgotPassword', {
              email: profile?.email,
              mode: 'change',
            })
          }
        >
          <View style={styles.menuIcon}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>{t('editProfile.changePassword')}</Text>
            <Text style={styles.menuHint}>{t('editProfile.changePasswordHint')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleSave}
        disabled={busy}
        style={styles.saveWrap}
      >
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.saveBtn}
        >
          {busy ? (
            <ActivityIndicator color={colors.card} />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color={colors.card} />
              <Text style={styles.saveText}>{t('editProfile.saveChanges')}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  section: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.sm,
    fontSize: 14,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.text,
    fontSize: 14,
  },
  inputDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
  },
  inputDisabledText: { flex: 1, color: colors.textSecondary, fontSize: 14 },
  codeInput: { fontSize: 16, letterSpacing: 4 },
  helper: { color: colors.muted, fontSize: 11, marginTop: 6 },
  noticeText: { color: colors.success, fontSize: 11, marginTop: 6 },
  errorText: { color: colors.danger, fontSize: 11, marginTop: 6 },
  linkAction: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  linkMuted: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  smallBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnText: { color: colors.card, fontWeight: '700', fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: radii.lg || radii.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalCodeInput: {
    width: '100%',
    letterSpacing: 10,
    fontSize: 20,
    fontWeight: '700',
  },
  modalPrimaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 13,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  modalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.md,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 56,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { color: colors.text, fontSize: 14, fontWeight: '600' },
  menuHint: { color: colors.muted, fontSize: 11, marginTop: 2 },
  saveWrap: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#2D8FE0',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
      default: { boxShadow: '0 6px 12px rgba(45,143,224,0.35)' },
    }),
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.pill,
  },
  saveText: { color: colors.card, fontWeight: '700', fontSize: 15 },
});
