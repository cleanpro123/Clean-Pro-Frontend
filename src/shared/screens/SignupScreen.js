import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AvatarPicker from '../components/AvatarPicker';
import {
  AuthScreen,
  AuthField,
  PasswordToggle,
  StrengthMeter,
  AuthBanner,
  AuthButton,
} from '../components/AuthUI';
import { spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../state/AuthContext';
import { useI18n } from '../i18n/LanguageContext';

export default function SignupScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useI18n();
  const { checkAvailability } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const phoneRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const submit = async () => {
    setError('');
    setWarning('');
    if (name.trim().length < 2) return setError(t('signup.errName'));
    if (!/^\d{10}$/.test(phone.trim()))
      return setError(t('signup.errPhone'));
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t('signup.errEmail'));
    if (password.length < 6) return setError(t('signup.errPwLength'));
    if (!/[A-Za-z]/.test(password)) return setError(t('signup.errPwLetter'));
    if (!/\d/.test(password)) return setError(t('signup.errPwNumber'));
    if (!/[^A-Za-z0-9]/.test(password))
      return setError(t('signup.errPwSymbol'));

    setBusy(true);
    try {
      // One round-trip: if the email is taken we get a flag and no OTP is sent
      // (show an inline warning); otherwise the code is sent right here and we
      // move to the verification page carrying the account details. Phone is
      // not checked for uniqueness — numbers may be shared across accounts.
      const { emailTaken } = await checkAvailability({
        email: email.trim(),
      });
      if (emailTaken) {
        return setWarning(t('signup.warnEmailTaken'));
      }

      // The account is only created after the code is verified on the next page.
      navigation.navigate('SignupOtp', {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        avatar,
      });
    } catch (e) {
      setError(e.message || t('signup.errGeneric'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen title={t('signup.title')} onBack={() => navigation.goBack()}>
      <View style={styles.avatar}>
        <AvatarPicker value={avatar} onChange={setAvatar} />
      </View>

      <AuthField
        icon="person-outline"
        placeholder={t('signup.phName')}
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => phoneRef.current?.focus()}
        value={name}
        onChangeText={setName}
      />

      <AuthField
        ref={phoneRef}
        icon="call-outline"
        placeholder={t('signup.phPhone')}
        keyboardType="number-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        maxLength={10}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => emailRef.current?.focus()}
        value={phone}
        onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, '').slice(0, 10))}
      />

      <AuthField
        ref={emailRef}
        icon="mail-outline"
        placeholder={t('signup.phEmail')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current?.focus()}
        value={email}
        onChangeText={setEmail}
      />

      <AuthField
        ref={passwordRef}
        icon="lock-closed-outline"
        placeholder={t('signup.phPassword')}
        secureTextEntry={!showPw}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
        value={password}
        onChangeText={setPassword}
      >
        <PasswordToggle visible={showPw} onToggle={() => setShowPw((s) => !s)} />
      </AuthField>

      <StrengthMeter password={password} />

      {warning ? <AuthBanner tone="warning" text={warning} /> : null}
      {error ? <AuthBanner tone="error" text={error} /> : null}

      <AuthButton label={t('signup.continue')} onPress={submit} busy={busy} />

      <View style={styles.loginRow}>
        <Text style={styles.loginText}>{t('signup.haveAccount')} </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.loginLink}>{t('signup.logIn')}</Text>
        </TouchableOpacity>
      </View>
    </AuthScreen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  avatar: { marginBottom: spacing.lg },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg - 4,
  },
  loginText: { color: colors.muted, fontSize: 13.5 },
  loginLink: { color: colors.primary, fontSize: 13.5, fontWeight: '800' },
});
