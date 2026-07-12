import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../shared/theme/dark';
import { useAuth } from '../../shared/state/AuthContext';
import { useI18n } from '../../shared/i18n/LanguageContext';

export default function AgentLoginScreen({ navigation }) {
  const { t } = useI18n();
  const { loginAgent } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const submit = async () => {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t('agentLogin.invalidEmail'));
    if (!password) return setError(t('agentLogin.passwordRequired'));
    setBusy(true);
    try {
      await loginAgent(email.trim(), password);
    } catch (e) {
      setError(e.message || t('agentLogin.loginFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.top}>
          <LinearGradient
            colors={['#33497F', '#1B2B52']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.welcomeBox}
          >
            <View style={styles.welcomeBorder} pointerEvents="none" />
            <Text style={styles.welcomeText}>{t('agentLogin.welcomeHome')}</Text>
          </LinearGradient>

          <View style={styles.imageShadow}>
            <Image
              source={require('../../../assets/admin-clothes.png')}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.imageBorder} pointerEvents="none" />
          </View>
        </View>

        <View style={styles.form}>
          <Field
            icon="mail"
            iconPosition="left"
            placeholder={t('agentLogin.email')}
            value={email}
            onChange={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            focused={focused === 'email'}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
          />

          <Field
            icon={showPw ? 'eye' : 'eye-off'}
            iconPosition="right"
            onIconPress={() => setShowPw((s) => !s)}
            placeholder={t('agentLogin.password')}
            value={password}
            onChange={setPassword}
            secureTextEntry={!showPw}
            focused={focused === 'password'}
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused(null)}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={submit}
            disabled={busy}
            style={styles.ctaWrap}
          >
            <LinearGradient
              colors={['#4866B8', '#1B2B52']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cta}
            >
              <View style={styles.ctaBorder} pointerEvents="none" />
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaText}>{t('agentLogin.signIn')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <Text style={styles.backText}>{t('agentLogin.backToCustomerLogin')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  icon,
  iconPosition,
  onIconPress,
  placeholder,
  value,
  onChange,
  focused,
  onFocus,
  onBlur,
  ...rest
}) {
  return (
    <View style={[styles.inputShadow, focused && styles.inputShadowFocused]}>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        {iconPosition === 'left' && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? colors.text : colors.muted}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={value}
          onChangeText={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          {...rest}
        />
        {iconPosition === 'right' &&
          (onIconPress ? (
            <TouchableOpacity onPress={onIconPress} hitSlop={8} style={styles.eyeBtn}>
              <Ionicons
                name={icon}
                size={18}
                color={focused ? colors.text : colors.muted}
              />
            </TouchableOpacity>
          ) : (
            <Ionicons
              name={icon}
              size={18}
              color={focused ? colors.text : colors.muted}
            />
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  top: {},

  welcomeBox: {
    alignSelf: 'flex-start',
    paddingLeft: spacing.lg,
    paddingRight: spacing.xl + 16,
    paddingVertical: spacing.md,
    borderTopRightRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 4, height: 6 },
    elevation: 6,
  },
  welcomeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderTopRightRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  welcomeText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 1.5,
  },

  imageShadow: {
    width: '92%',
    alignSelf: 'center',
    borderRadius: radii.lg,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  heroImage: {
    width: '100%',
    height: 210,
    borderRadius: radii.lg,
  },
  imageBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  form: {
    flex: 1,
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 4,
    gap: spacing.md,
    alignItems: 'center',
  },

  inputShadow: {
    width: '100%',
    borderRadius: radii.md,
    shadowColor: '#000',
    shadowOpacity: 0.30,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  inputShadowFocused: {
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(43, 63, 110, 0.55)',
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    height: 56,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputWrapFocused: {
    borderColor: 'rgba(52, 211, 153, 0.5)',
    backgroundColor: 'rgba(43, 63, 110, 0.75)',
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '300',
    letterSpacing: 0.5,
    paddingVertical: 12,
  },

  ctaWrap: {
    marginTop: spacing.lg,
    borderRadius: radii.pill,
    shadowColor: '#3B5BA8',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cta: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xl + 24,
    borderRadius: radii.pill,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ctaBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  ctaText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 1.5,
  },
  error: {
    color: '#F87171',
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
  eyeBtn: { padding: 4 },
  back: { paddingVertical: 8, marginTop: spacing.md },
  backText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
});
