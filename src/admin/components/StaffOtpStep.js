import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../../shared/api/client';
import { useI18n } from '../../shared/i18n/LanguageContext';
import { useTheme } from '../../shared/theme/ThemeContext';

export function useStaffOtp({ endpoint, visible, onCreated }) {
  const [pending, setPending] = useState(null);
  const [code, setCode] = useState('');
  const [codeLength, setCodeLength] = useState(6);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const inFlight = useRef(false);
  const generation = useRef(0);

  useEffect(() => {
    if (!visible) {
      generation.current += 1;
      setPending(null);
      setCode('');
      setError('');
      setSeconds(0);
    }
  }, [visible]);
  useEffect(() => {
    if (!seconds) return;
    const timer = setTimeout(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const begin = async (payload) => {
    if (inFlight.current) return;
    inFlight.current = true;
    const current = generation.current;
    setBusy(true);
    try {
      const normalized = { ...payload, email: payload.email.trim().toLowerCase() };
      const response = await api.post(`${endpoint}/otp/request`, { email: normalized.email });
      if (current !== generation.current) return;
      setPending(normalized);
      setCodeLength(response.codeLength || 6);
      setCode('');
      setError('');
      setSeconds(60);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const confirm = async () => {
    if (!pending || code.length !== codeLength || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await api.post(endpoint, { ...pending, otpCode: code });
      setPending(null);
      setCode('');
      onCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const resend = async () => {
    if (!pending || seconds || inFlight.current) return;
    setError('');
    try { await begin(pending); } catch (e) { setError(e.message); }
  };
  const back = () => {
    if (inFlight.current) return;
    setPending(null);
    setCode('');
    setError('');
  };
  return { pending, code, setCode, codeLength, busy, error, seconds, begin, confirm, resend, back };
}

export default function StaffOtpStep({ flow }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ gap: 16 }}>
      <Text style={{ color: colors.text }}>{t('staffOtp.sent', { email: flow.pending.email })}</Text>
      <TextInput
        value={flow.code}
        onChangeText={(value) => flow.setCode(value.replace(/\D/g, '').slice(0, flow.codeLength))}
        placeholder={t('staffOtp.code')}
        placeholderTextColor={colors.muted}
        accessibilityLabel={t('staffOtp.code')}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={flow.codeLength}
        editable={!flow.busy}
        style={{ color: colors.text, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 14, textAlign: 'center', writingDirection: 'ltr', fontSize: 20 }}
      />
      {flow.error ? <Text accessibilityRole="alert" style={{ color: colors.danger || colors.text }}>{flow.error}</Text> : null}
      <TouchableOpacity
        disabled={flow.busy || flow.code.length !== flow.codeLength}
        onPress={flow.confirm}
        style={{ padding: 14, borderRadius: 12, backgroundColor: colors.primary, opacity: flow.busy || flow.code.length !== flow.codeLength ? 0.5 : 1 }}
      >
        {flow.busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', textAlign: 'center' }}>{t('staffOtp.verifyCreate')}</Text>}
      </TouchableOpacity>
      <TouchableOpacity disabled={flow.busy || flow.seconds > 0} onPress={flow.resend}>
        <Text style={{ color: colors.primary, textAlign: 'center', opacity: flow.seconds ? 0.5 : 1 }}>
          {flow.seconds ? t('staffOtp.resendIn', { seconds: flow.seconds }) : t('staffOtp.resend')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity disabled={flow.busy} onPress={flow.back}>
        <Text style={{ color: colors.text, textAlign: 'center' }}>{t('staffOtp.editDetails')}</Text>
      </TouchableOpacity>
    </View>
  );
}
