import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../state/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import {
  HERO_GRADIENT,
  SHEET_OVERLAP,
  Bubbles,
  AuthField,
  PasswordToggle,
  AuthBanner,
  AuthButton,
} from '../components/AuthUI';

// All three apps share the same login layout; only branding and authentication differ.
const ROLE_BRANDING = {
  user: { name: 'Clean Pro' },
  admin: { name: 'Clean Pro Admin', icon: 'shield-checkmark-outline' },
  agent: { name: 'Clean Pro Agent', icon: 'bicycle-outline' },
};

export default function LoginScreen({ navigation, route, role = 'user' }) {
  const branding = ROLE_BRANDING[role];
  const isCustomer = role === 'user';
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const heroGradient = isDark ? HERO_GRADIENT.dark : HERO_GRADIENT.light;
  const { t } = useI18n();
  // Frozen launch-time insets — NOT the live useSafeAreaInsets() hook. On
  // Android with edge-to-edge, that hook re-emits when the keyboard opens (the
  // bottom inset changes), which re-renders and reflows the form on focus. That
  // reflow detaches the focused email TextInput, so Android moves focus to the
  // next field (password) and the keyboard drops. initialWindowMetrics is a
  // launch-time constant that never reacts to the keyboard.
  const insets =
    initialWindowMetrics?.insets ?? { top: 0, right: 0, bottom: 0, left: 0 };
  // Snapshot the window size ONCE at mount. Using useWindowDimensions here made
  // the hero height react to the Android keyboard resizing the window, which
  // reflowed the form on focus (email tap jumped to password + keyboard closed).
  // The app is portrait-locked, so a fixed size is safe.
  const [{ width: SCREEN_W, height: SCREEN_H }] = useState(() =>
    Dimensions.get('window')
  );

  const HERO_H = Math.max(250, Math.round(SCREEN_H * 0.36));

  const [fontsLoaded] = useFonts({ GreatVibes_400Regular });
  const { loginUser, loginAdmin, loginAgent } = useAuth();
  const login = { user: loginUser, admin: loginAdmin, agent: loginAgent }[role];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(route?.params?.notice || '');
  const [showPw, setShowPw] = useState(false);

  const submit = async () => {
    if (busy) return;
    setError('');
    setNotice('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t('login.invalidEmail'));
    if (!password) return setError(t('login.passwordRequired'));
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      if (e.code === 'FORBIDDEN') {
        navigation.navigate('AccountBlocked', { preset: 'blocked', message: e.message });
        return;
      }
      setError(e.message || t('login.somethingWrong'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Keep the shared login non-scrolling. A ScrollView caused an
            Android focus-jump: tapping email made
            the scroll + keyboard-pan fight and detach the focused input, so
            focus advanced to password and the keyboard dropped. */}
        <View style={styles.flex}>
          {/* Gradient hero: logo badge and wordmark over soft bubbles */}
          <View style={[styles.hero, { height: HERO_H }]}>
            <LinearGradient
              colors={heroGradient}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Bubbles width={SCREEN_W} height={HERO_H} />
            <View
              style={[
                styles.heroContent,
                { paddingTop: insets.top + spacing.sm, paddingBottom: SHEET_OVERLAP },
              ]}
            >
              <View style={styles.logoRing}>
                {branding.icon ? (
                  <View style={styles.roleIcon}>
                    <Ionicons name={branding.icon} size={44} color="#FFFFFF" />
                  </View>
                ) : (
                  <Image
                    source={require('../../../assets/app-icon.png')}
                    style={styles.logo}
                  />
                )}
              </View>
              <Text style={[styles.brand, fontsLoaded && styles.brandScript]}>{branding.name}</Text>
            </View>
          </View>

          {/* Rounded sheet that overlaps the hero and holds the form */}
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]}>
            <Text style={styles.title}>{t('login.welcome')}</Text>

            <AuthField
              icon="mail-outline"
              placeholder={t('login.email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />

            <AuthField
              icon="lock-closed-outline"
              placeholder={t('login.password')}
              secureTextEntry={!showPw}
              autoComplete="password"
              textContentType="password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={submit}
              returnKeyType="go"
            >
              <PasswordToggle visible={showPw} onToggle={() => setShowPw((s) => !s)} />
            </AuthField>

            {isCustomer && (
              <TouchableOpacity
                style={styles.forgotWrap}
                onPress={() => navigation.navigate('ForgotPassword')}
                hitSlop={8}
              >
                <Text style={styles.forgot}>{t('login.forgotPassword')}</Text>
              </TouchableOpacity>
            )}

            {notice ? <AuthBanner tone="success" text={notice} /> : null}
            {error ? <AuthBanner tone="error" text={error} /> : null}

            <AuthButton label={t('login.logIn')} onPress={submit} busy={busy} />

            {isCustomer && (
              <View style={styles.createRow}>
                <Text style={styles.createText}>{t('login.noAccount')} </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')} hitSlop={8}>
                  <Text style={styles.createLink}>{t('login.createAccount')}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.spacer} />

            <Text style={styles.legal}>
              <Ionicons name="shield-checkmark-outline" size={11} color={colors.muted} />{'  '}
              {t('login.legalIntro')}{' '}
              <Text style={styles.legalLink} onPress={() => navigation.navigate('PrivacyPolicy')}>
                {t('login.privacyPolicy')}
              </Text>
              .
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  hero: { width: '100%', overflow: 'hidden' },
  heroContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoRing: {
    width: 84,
    height: 84,
    borderRadius: 26,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logo: { width: '100%', height: '100%', borderRadius: 22 },
  roleIcon: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  // Applied once the Great Vibes script font has loaded.
  brandScript: {
    fontFamily: 'GreatVibes_400Regular',
    fontSize: 42,
    fontWeight: 'normal',
    fontStyle: 'normal',
    letterSpacing: 1,
    lineHeight: 54,
  },

  // The form sheet. Fills the rest of the screen and slides up over the hero
  // so the rounded corners frame the form. Kept non-scrolling on purpose (see
  // the ScrollView note in the render).
  sheet: {
    flex: 1,
    marginTop: -SHEET_OVERLAP,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg + 4,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: spacing.lg,
  },

  forgotWrap: { alignSelf: 'flex-end', marginBottom: spacing.md },
  forgot: { color: colors.primary, fontSize: 13, fontWeight: '700' },

  createRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg - 4,
  },
  createText: { color: colors.muted, fontSize: 13.5 },
  createLink: { color: colors.primary, fontSize: 13.5, fontWeight: '800' },

  spacer: { flex: 1, minHeight: spacing.sm },
  legal: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  legalLink: { color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
});
