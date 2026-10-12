import React, { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import OtpInput, { OTP_LENGTH } from '../components/OtpInput';
import {
  AuthScreen,
  StepBar,
  AuthField,
  PasswordToggle,
  StrengthMeter,
  AuthBanner,
  AuthButton,
  ResendRow,
} from '../components/AuthUI';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../state/AuthContext';
import useResendTimer from '../hooks/useResendTimer';
import { useI18n } from '../i18n/LanguageContext';

// After the code is sent, hold the user on the verify step for a short window so
// they can't go back and re-request a code that would invalidate the one they
// just received (which shows up as an OTP mismatch).
const BACK_LOCK_SECONDS = 30;

export default function ForgotPasswordScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { requestOtp, verifyOtp, resetPassword, logout } = useAuth();
  const resendTimer = useResendTimer(60);
  const { t } = useI18n();

  // When reached from the signed-in "Change password" flow we already know the
  // account email, so it's passed in and locked. `mode === 'change'` also tells
  // us to sign the user out afterwards (a reset invalidates every session).
  const presetEmail = route?.params?.email || '';
  const isChange = route?.params?.mode === 'change';

  const [step, setStep] = useState(1); // 1 = email, 2 = verify code, 3 = new password
  const [email, setEmail] = useState(presetEmail);
  const [code, setCode] = useState('');
  const [codeRejected, setCodeRejected] = useState(false);
  // Guards against a double submit when autofill and a keystroke both land.
  const verifyingRef = useRef(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Back-lock countdown for the verify step. Armed whenever a code is sent.
  const [lockLeft, setLockLeft] = useState(0);
  const lockTimerRef = useRef(null);
  const locked = step === 2 && lockLeft > 0;
  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  const armBackLock = () => {
    setLockLeft(BACK_LOCK_SECONDS);
    if (lockTimerRef.current) clearInterval(lockTimerRef.current);
    lockTimerRef.current = setInterval(() => {
      setLockLeft((s) => {
        if (s <= 1) {
          clearInterval(lockTimerRef.current);
          lockTimerRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(lockTimerRef.current), []);

  // Block hardware back / swipe-back while the verify step is locked. In-screen
  // step changes (setStep) aren't navigation events, so this only guards leaving
  // the screen entirely — the chevron is handled separately by onBack.
  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (e) => {
      if (lockedRef.current) e.preventDefault();
    });
    return sub;
  }, [navigation]);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !locked });
  }, [navigation, locked]);

  const onBack = () => {
    if (locked) {
      setNotice('');
      return setError(t('forgot.waitBeforeBack', { seconds: lockLeft }));
    }
    if (step > 1) return setStep(step - 1);
    navigation.goBack();
  };

  const sendCode = async () => {
    setError('');
    setNotice('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t('forgot.invalidEmail'));
    if (resendTimer.active) return; // still cooling down
    // On the first send the hero subtitle already says where the code went;
    // only a resend needs the confirmation banner.
    const resending = step === 2;
    setBusy(true);
    try {
      await requestOtp(email.trim(), 'reset');
      setCode('');
      setCodeRejected(false);
      setStep(2);
      if (resending) setNotice(t('forgot.codeSent', { email: email.trim() }));
      resendTimer.start();
      armBackLock();
    } catch (e) {
      setError(e.message || t('forgot.sendCodeError'));
    } finally {
      setBusy(false);
    }
  };

  // Step 2: verify the code on its own. Only when it's correct do we move on
  // to the new-password step. Runs automatically once all digits are in
  // (typed, pasted or autofilled) — there is no submit button on this step.
  const verifyCode = async (entered) => {
    if (verifyingRef.current) return;
    setError('');
    setNotice('');
    if (entered.length !== OTP_LENGTH) return setError(t('forgot.enterCode'));
    verifyingRef.current = true;
    setBusy(true);
    try {
      await verifyOtp(email.trim(), entered);
      setStep(3);
      setNotice(t('forgot.codeVerified'));
    } catch (e) {
      setError(e.message || t('forgot.codeIncorrect'));
      // Clear the boxes so the user can enter the code again straight away.
      setCode('');
      setCodeRejected(true);
    } finally {
      verifyingRef.current = false;
      setBusy(false);
    }
  };

  const onCodeChange = (next) => {
    setCode(next);
    if (codeRejected) setCodeRejected(false);
  };

  // Step 3: set the new password (the backend allows this only because the OTP
  // was already marked verified in step 2).
  const submit = async () => {
    setError('');
    setNotice('');
    if (password.length < 6) return setError(t('forgot.pwMinLength'));
    if (!/[A-Za-z]/.test(password)) return setError(t('forgot.pwLetter'));
    if (!/\d/.test(password)) return setError(t('forgot.pwNumber'));
    if (!/[^A-Za-z0-9]/.test(password))
      return setError(t('forgot.pwSymbol'));
    if (password !== confirm) return setError(t('forgot.pwMismatch'));
    setBusy(true);
    try {
      await resetPassword(email.trim(), password);
      if (isChange) {
        // Signed-in change: signing out flips RootNavigator back to the Login
        // stack, so we don't (and can't) navigate to 'Login' from here.
        setNotice(t('forgot.pwChanged'));
        await logout();
        return;
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login', params: { notice: t('forgot.pwUpdated') } }],
      });
    } catch (e) {
      setError(e.message || t('forgot.resetError'));
    } finally {
      setBusy(false);
    }
  };

  // Step 2 has no button: the code verifies itself once complete.
  const primaryAction = step === 1 ? sendCode : submit;
  const primaryLabel = step === 1 ? t('forgot.sendCode') : t('forgot.resetPassword');
  const stepIcon = ['key-outline', 'mail-unread-outline', 'lock-closed-outline'][step - 1];

  return (
    <AuthScreen
      title={isChange ? t('forgot.changePassword') : t('forgot.resetPassword')}
      subtitle={step === 2 ? t('forgot.codeSent', { email: email.trim() }) : undefined}
      icon={stepIcon}
      onBack={onBack}
      lockSeconds={locked ? lockLeft : 0}
    >
      <StepBar step={step} total={3} />

      {step === 1 ? (
        <AuthField
          icon="mail-outline"
          placeholder={t('forgot.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={sendCode}
          value={email}
          onChangeText={setEmail}
          editable={!isChange}
        >
          {isChange ? <Ionicons name="lock-closed" size={15} color={colors.muted} /> : null}
        </AuthField>
      ) : step === 2 ? (
        <>
          <OtpInput
            value={code}
            onChangeText={onCodeChange}
            onComplete={verifyCode}
            disabled={busy}
            error={codeRejected}
            accessibilityLabel={t('forgot.codePlaceholder')}
          />
          <ResendRow
            label={
              resendTimer.active
                ? t('forgot.resendIn', { seconds: resendTimer.secondsLeft })
                : t('forgot.resend')
            }
            cooling={resendTimer.active}
            onPress={sendCode}
            disabled={busy}
            busy={busy}
          />
        </>
      ) : (
        <>
          <AuthField
            icon="lock-closed-outline"
            placeholder={t('forgot.newPasswordPlaceholder')}
            secureTextEntry={!showPw}
            autoComplete="new-password"
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
          >
            <PasswordToggle visible={showPw} onToggle={() => setShowPw((v) => !v)} />
          </AuthField>
          <StrengthMeter password={password} />
          <AuthField
            icon="shield-checkmark-outline"
            placeholder={t('forgot.confirmPasswordPlaceholder')}
            secureTextEntry={!showPw}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={submit}
            value={confirm}
            onChangeText={setConfirm}
          />
        </>
      )}

      {notice ? <AuthBanner tone="success" text={notice} /> : null}
      {error ? <AuthBanner tone="error" text={error} /> : null}

      {step !== 2 ? (
        <AuthButton label={primaryLabel} onPress={primaryAction} busy={busy} />
      ) : null}
    </AuthScreen>
  );
}
