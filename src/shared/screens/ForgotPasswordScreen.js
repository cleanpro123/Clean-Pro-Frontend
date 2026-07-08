import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../components/Gradient';
import { colors, gradients } from '../theme/colors';
import { useAuth } from '../state/AuthContext';
import useResendTimer from '../hooks/useResendTimer';

// After the code is sent, hold the user on the verify step for a short window so
// they can't go back and re-request a code that would invalidate the one they
// just received (which shows up as an OTP mismatch).
const BACK_LOCK_SECONDS = 30;

export default function ForgotPasswordScreen({ navigation, route }) {
  const { requestOtp, verifyOtp, resetPassword, logout } = useAuth();
  const resendTimer = useResendTimer(60);

  // When reached from the signed-in "Change password" flow we already know the
  // account email, so it's passed in and locked. `mode === 'change'` also tells
  // us to sign the user out afterwards (a reset invalidates every session).
  const presetEmail = route?.params?.email || '';
  const isChange = route?.params?.mode === 'change';

  const [step, setStep] = useState(1); // 1 = email, 2 = verify code, 3 = new password
  const [email, setEmail] = useState(presetEmail);
  const [code, setCode] = useState('');
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
      return setError(`Please wait ${lockLeft}s before going back`);
    }
    if (step > 1) return setStep(step - 1);
    navigation.goBack();
  };

  const sendCode = async () => {
    setError('');
    setNotice('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email');
    if (resendTimer.active) return; // still cooling down
    setBusy(true);
    try {
      await requestOtp(email.trim(), 'reset');
      setStep(2);
      setNotice(`We sent a 6-digit code to ${email.trim()}`);
      resendTimer.start();
      armBackLock();
    } catch (e) {
      setError(e.message || 'Could not send the code');
    } finally {
      setBusy(false);
    }
  };

  // Step 2: verify the code on its own. Only when it's correct do we move on
  // to the new-password step.
  const verifyCode = async () => {
    setError('');
    setNotice('');
    if (code.trim().length < 4) return setError('Enter the code from your email');
    setBusy(true);
    try {
      await verifyOtp(email.trim(), code.trim());
      setStep(3);
      setNotice('Code verified — choose a new password');
    } catch (e) {
      setError(e.message || 'That code is not correct');
    } finally {
      setBusy(false);
    }
  };

  // Step 3: set the new password (the backend allows this only because the OTP
  // was already marked verified in step 2).
  const submit = async () => {
    setError('');
    setNotice('');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (!/[A-Za-z]/.test(password)) return setError('Password must include a letter');
    if (!/\d/.test(password)) return setError('Password must include a number');
    if (!/[^A-Za-z0-9]/.test(password))
      return setError('Password must include a symbol (e.g. !@#$)');
    if (password !== confirm) return setError('Passwords do not match');
    setBusy(true);
    try {
      await resetPassword(email.trim(), password);
      if (isChange) {
        // Signed-in change: signing out flips RootNavigator back to the Login
        // stack, so we don't (and can't) navigate to 'Login' from here.
        setNotice('Password changed — please log in again');
        await logout();
        return;
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login', params: { notice: 'Password updated — please log in' } }],
      });
    } catch (e) {
      setError(e.message || 'Could not reset your password');
    } finally {
      setBusy(false);
    }
  };

  const primaryAction = step === 1 ? sendCode : step === 2 ? verifyCode : submit;
  const primaryLabel = step === 1 ? 'Send code' : step === 2 ? 'Verify code' : 'Reset password';
  const subtitle =
    step === 1
      ? isChange
        ? 'Send a verification code to your email to continue'
        : 'Enter your email to get a verification code'
      : step === 2
      ? 'Enter the 6-digit code we sent you'
      : 'Choose a new password for your account';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="pb-xl"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={gradients.sky}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="pt-xl pb-[48px] px-lg rounded-b-[36px]"
          >
            <TouchableOpacity
              className="absolute top-md left-md w-9 h-9 rounded-[18px] bg-white/20 items-center justify-center"
              style={{ opacity: locked ? 0.45 : 1 }}
              hitSlop={10}
              onPress={onBack}
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            {locked ? (
              <View className="absolute top-md left-[52px] h-9 px-2.5 rounded-full bg-white/20 flex-row items-center gap-1">
                <Ionicons name="lock-closed" size={12} color="#fff" />
                <Text className="text-white text-xs font-bold">{lockLeft}s</Text>
              </View>
            ) : null}
            <Text className="text-white text-2xl font-extrabold mt-lg">
              {isChange ? 'Change password' : 'Reset password'}
            </Text>
            <Text className="text-[#EAF4FF] text-sm mt-1.5">{subtitle}</Text>
          </LinearGradient>

          <View className="-mt-[22px] mx-lg bg-card rounded-lg p-lg shadow-[0px_8px_16px_rgba(27,111,196,0.08)]">
            {step === 1 ? (
              <View className="flex-row items-center bg-surface rounded-md px-md mb-3 gap-sm">
                <Ionicons name="mail-outline" size={18} color={colors.muted} />
                <TextInput
                  className="flex-1 py-3.5 text-text text-[15px]"
                  placeholder="Email"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isChange}
                />
                {isChange ? (
                  <Ionicons name="lock-closed" size={15} color={colors.muted} />
                ) : null}
              </View>
            ) : step === 2 ? (
              <>
                <View className="flex-row items-center bg-surface rounded-md mb-2 px-md gap-sm">
                  <Ionicons name="keypad-outline" size={18} color={colors.muted} />
                  <TextInput
                    className="flex-1 py-3.5 text-text text-[16px] tracking-[4px]"
                    placeholder="6-digit code"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={code}
                    onChangeText={setCode}
                  />
                </View>
                <TouchableOpacity
                  className="self-end mb-3 py-1"
                  onPress={sendCode}
                  disabled={busy || resendTimer.active}
                  hitSlop={8}
                >
                  <Text
                    className={`font-bold text-[12px] ${
                      resendTimer.active ? 'text-muted' : 'text-primary'
                    }`}
                  >
                    {resendTimer.active ? `Resend in ${resendTimer.secondsLeft}s` : 'Resend'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="flex-row items-center bg-surface rounded-md px-md mb-3 gap-sm">
                  <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
                  <TextInput
                    className="flex-1 py-3.5 text-text text-[15px]"
                    placeholder="New password"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showPw}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPw((s) => !s)}
                    className="pl-1.5 py-2"
                    hitSlop={8}
                  >
                    <Ionicons name={showPw ? 'eye' : 'eye-off'} size={18} color={colors.muted} />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center bg-surface rounded-md px-md mb-3 gap-sm">
                  <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
                  <TextInput
                    className="flex-1 py-3.5 text-text text-[15px]"
                    placeholder="Confirm new password"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showPw}
                    value={confirm}
                    onChangeText={setConfirm}
                  />
                </View>
              </>
            )}

            {notice ? (
              <Text className="text-success text-xs mt-sm text-center">{notice}</Text>
            ) : null}
            {error ? (
              <Text className="text-danger text-xs mt-sm mb-sm text-center">{error}</Text>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={primaryAction}
              disabled={busy}
            >
              <LinearGradient
                colors={gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-3.5 rounded-md items-center mt-md"
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-[15px] font-bold">{primaryLabel}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

             
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
