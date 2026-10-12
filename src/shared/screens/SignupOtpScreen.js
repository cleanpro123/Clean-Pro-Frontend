import React, { useState, useEffect, useRef } from 'react';
import OtpInput, { OTP_LENGTH } from '../components/OtpInput';
import { AuthScreen, AuthBanner, ResendRow } from '../components/AuthUI';
import { useAuth } from '../state/AuthContext';
import useResendTimer from '../hooks/useResendTimer';
import { useI18n } from '../i18n/LanguageContext';

// After a code is sent, hold the user on this screen for a short window so they
// can't bounce back to the form and re-request a code that would invalidate the
// one they just received (which shows up as an OTP mismatch).
const BACK_LOCK_SECONDS = 30;

export default function SignupOtpScreen({ navigation, route }) {
  const { t } = useI18n();
  const { verifyOtp, requestOtp, registerOnly } = useAuth();
  const { name, phone, email, password, avatar } = route.params || {};

  const [code, setCode] = useState('');
  const [codeRejected, setCodeRejected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Guards against a double submit when autofill and a keystroke both land.
  const verifyingRef = useRef(false);
  const [notice, setNotice] = useState('');

  // Countdown for the back-lock. Starts full on mount and ticks to 0.
  const [lockLeft, setLockLeft] = useState(BACK_LOCK_SECONDS);
  const lockLeftRef = useRef(lockLeft);
  lockLeftRef.current = lockLeft;
  const locked = lockLeft > 0;

  // Lets the successful-verification reset leave the screen even while the
  // back-lock is still counting down — the lock only blocks going *back*.
  const allowLeaveRef = useRef(false);

  // 60s cooldown before "Resend code" works again. A code was already sent
  // before we landed here, so start the countdown on mount.
  const resendTimer = useResendTimer(60);
  useEffect(() => {
    resendTimer.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setLockLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Block every way off the screen (chevron goBack, iOS swipe, Android hardware
  // back) while locked. beforeRemove intercepts all of them; the ref keeps the
  // listener reading the live countdown without re-subscribing each tick.
  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (e) => {
      if (allowLeaveRef.current) return;
      if (lockLeftRef.current > 0) e.preventDefault();
    });
    return sub;
  }, [navigation]);

  // Disable the swipe-back gesture during the lock so it doesn't feel broken.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !locked });
  }, [navigation, locked]);

  const onBack = () => {
    if (locked) {
      setNotice('');
      return setError(t('signupOtp.waitBeforeBack', { count: lockLeft }));
    }
    navigation.goBack();
  };

  const resend = async () => {
    if (resendTimer.active) return; // still cooling down
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await requestOtp(email);
      setCode('');
      setCodeRejected(false);
      setNotice(t('signupOtp.newCodeSent'));
      resendTimer.start();
    } catch (e) {
      setError(e.message || t('signupOtp.resendFailed'));
    } finally {
      setBusy(false);
    }
  };

  // Runs automatically once all digits are in (typed, pasted or autofilled) —
  // there is no submit button.
  const verifyAndCreate = async (entered) => {
    if (verifyingRef.current) return;
    setError('');
    setNotice('');
    if (entered.length !== OTP_LENGTH) return setError(t('signupOtp.enterCodeFromEmail'));

    verifyingRef.current = true;
    setBusy(true);
    try {
      // 1) verify the email, then 2) create the account (no auto-login).
      await verifyOtp(email, entered);
      await registerOnly({ name, phone, email, password, avatar });
      // 3) redirect to login with a success message; clear the signup stack.
      //    Bypass the back-lock — this is a forward completion, not a "go back".
      allowLeaveRef.current = true;
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login', params: { notice: t('signupOtp.accountCreated') } }],
      });
    } catch (e) {
      setError(e.message || t('signupOtp.verificationFailed'));
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

  return (
    <AuthScreen
      title={t('signupOtp.title')}
      subtitle={t('signupOtp.subtitle', { email })}
      icon="mail-unread-outline"
      onBack={onBack}
      lockSeconds={lockLeft}
    >
      <OtpInput
        value={code}
        onChangeText={onCodeChange}
        onComplete={verifyAndCreate}
        disabled={busy}
        error={codeRejected}
        accessibilityLabel={t('signupOtp.title')}
      />

      <ResendRow
        label={
          resendTimer.active
            ? t('signupOtp.resendIn', { count: resendTimer.secondsLeft })
            : t('signupOtp.resendCode')
        }
        cooling={resendTimer.active}
        onPress={resend}
        disabled={busy}
        busy={busy}
      />

      {notice ? <AuthBanner tone="success" text={notice} /> : null}
      {error ? <AuthBanner tone="error" text={error} /> : null}
    </AuthScreen>
  );
}
