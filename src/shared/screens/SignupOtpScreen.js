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

// After a code is sent, hold the user on this screen for a short window so they
// can't bounce back to the form and re-request a code that would invalidate the
// one they just received (which shows up as an OTP mismatch).
const BACK_LOCK_SECONDS = 30;

export default function SignupOtpScreen({ navigation, route }) {
  const { verifyOtp, requestOtp, registerOnly } = useAuth();
  const { name, phone, email, password } = route.params || {};

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
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
      return setError(`Please wait ${lockLeft}s before going back`);
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
      setNotice('A new code has been sent');
      resendTimer.start();
    } catch (e) {
      setError(e.message || 'Could not resend the code');
    } finally {
      setBusy(false);
    }
  };

  const verifyAndCreate = async () => {
    setError('');
    setNotice('');
    if (code.trim().length < 4) return setError('Enter the code from your email');

    setBusy(true);
    try {
      // 1) verify the email, then 2) create the account (no auto-login).
      await verifyOtp(email, code.trim());
      await registerOnly({ name, phone, email, password });
      // 3) redirect to login with a success message; clear the signup stack.
      //    Bypass the back-lock — this is a forward completion, not a "go back".
      allowLeaveRef.current = true;
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login', params: { notice: 'Account created — please log in' } }],
      });
    } catch (e) {
      setError(e.message || 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

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
            <Text className="text-white text-2xl font-extrabold mt-lg">Verify your email</Text>
            <Text className="text-[#EAF4FF] text-sm mt-1.5">
              Enter the 6-digit code we sent to {email}
            </Text>
          </LinearGradient>

          <View className="-mt-[22px] mx-lg bg-card rounded-lg p-lg shadow-[0px_8px_16px_rgba(27,111,196,0.08)]">
            <View className="flex-row items-center bg-surface rounded-md px-md mb-3 gap-sm">
              <Ionicons name="keypad-outline" size={18} color={colors.muted} />
              <TextInput
                className="flex-1 py-3.5 text-text text-[18px] tracking-[6px]"
                placeholder="------"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                autoFocus
              />
            </View>

            <TouchableOpacity
              className="flex-row items-center gap-1.5 self-start py-1.5 mb-sm"
              onPress={resend}
              disabled={busy || resendTimer.active}
            >
              <Ionicons
                name="refresh-outline"
                size={15}
                color={resendTimer.active ? colors.muted : colors.primary}
              />
              <Text
                className={`font-bold text-[13px] ${
                  resendTimer.active ? 'text-muted' : 'text-primary'
                }`}
              >
                {resendTimer.active ? `Resend code in ${resendTimer.secondsLeft}s` : 'Resend code'}
              </Text>
            </TouchableOpacity>

            {notice ? (
              <Text className="text-success text-xs mt-sm text-center">{notice}</Text>
            ) : null}
            {error ? (
              <Text className="text-danger text-xs mt-sm mb-sm text-center">{error}</Text>
            ) : null}

            <TouchableOpacity activeOpacity={0.85} onPress={verifyAndCreate} disabled={busy}>
              <LinearGradient
                colors={gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-3.5 rounded-md items-center mt-md"
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-[15px] font-bold">Verify &amp; create account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
