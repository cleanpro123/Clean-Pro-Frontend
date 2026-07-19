import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { radii, spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../state/AuthContext';
import { useI18n } from '../i18n/LanguageContext';

// Layered "ripple" transition from the gradient hero into the body. The arcs
// bulge UP at the centre (∩) and the last layer is the body colour, so the
// wave melts seamlessly into the page with no hard edge.
//
// Geometry is expressed as RATIOS (of the wave height / width) rather than
// absolute pixels so the curve scales identically on every screen size and on
// rotation — the whole reason this screen looked different across devices.
// The hero gradient, wave, and body tint are theme-aware. Dark mode leans
// near-black (melting into colors.background) so the whole login reads as one
// dark surface instead of a bright blue hero over a light wave; light mode
// keeps the original airy blue look. `tint` is the colour the body fades in
// from just under the wave, and MUST equal the last wave layer so the two melt
// together with no seam.
const HERO_GRADIENT = {
  light: ['#6FB7E6', '#2C79B8', '#0E3A5C'],
  dark: ['#17324E', '#0D2237', '#0A1424'],
};
const WAVE = {
  light: { tint: '#E5F1FB', fills: ['#D3DCE6', '#E7ECF2', '#E5F1FB'] },
  dark: { tint: '#0B1A2C', fills: ['#102439', '#0D1D30', '#0B1A2C'] },
};
const WAVE_EDGES = [0.463, 0.747, 0.979]; // vertical position of each arc
const WAVE_DIP_RATIO = 0.263; // fraction of the wave height each arc bulges up

function WaveDivider({ width, height }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const fills = (isDark ? WAVE.dark : WAVE.light).fills;
  const cx = width * 0.5;
  const dip = height * WAVE_DIP_RATIO;
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={styles.wave}
      preserveAspectRatio="none"
    >
      {WAVE_EDGES.map((e, i) => {
        const edge = height * e;
        return (
          <Path
            key={i}
            d={`M0 ${edge} Q ${cx} ${edge - dip} ${width} ${edge} L ${width} ${height} L 0 ${height} Z`}
            fill={fills[i]}
          />
        );
      })}
    </Svg>
  );
}

export default function LoginScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const heroGradient = isDark ? HERO_GRADIENT.dark : HERO_GRADIENT.light;
  const bodyTint = (isDark ? WAVE.dark : WAVE.light).tint;
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

  // Responsive hero + wave sizing. The wave height tracks screen WIDTH so the
  // arc keeps the same aspect on phones and tablets (clamped so it never gets
  // absurdly tall on very wide screens), and the hero height tracks HEIGHT.
  const HERO_H = Math.max(260, Math.round(SCREEN_H * 0.36));
  const WAVE_H = Math.min(220, Math.max(150, Math.round(SCREEN_W * 0.48)));
  // Pulls the wordmark up out of the wave's path; scales with the wave.
  const heroPadBottom = Math.round(WAVE_H * 0.6);

  const [fontsLoaded] = useFonts({ GreatVibes_400Regular });
  const { loginUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(route?.params?.notice || '');
  const [showPw, setShowPw] = useState(false);
  const [focused, setFocused] = useState(null);

  const submit = async () => {
    setError('');
    setNotice('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t('login.invalidEmail'));
    if (!password) return setError(t('login.passwordRequired'));
    setBusy(true);
    try {
      await loginUser(email.trim(), password);
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
        {/* Non-scrolling flex container (like the admin/agent logins). A
            ScrollView here caused the Android focus-jump: tapping email made
            the scroll + keyboard-pan fight and detach the focused input, so
            focus advanced to password and the keyboard dropped. */}
        <View style={[styles.flex, { paddingBottom: insets.bottom }]}>
          {/* Gradient hero with wordmark + curved wave */}
          <View style={[styles.hero, { height: HERO_H }]}>
            <LinearGradient
              colors={heroGradient}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.heroContent,
                { paddingTop: insets.top + spacing.lg, paddingBottom: heroPadBottom },
              ]}
            >
              <Text style={[styles.brand, fontsLoaded && styles.brandScript]}>Clean Pro</Text>
            </View>
            <WaveDivider width={SCREEN_W} height={WAVE_H} />
          </View>

          {/* Lower content sits on a soft top-down light fade */}
          <View style={styles.lower}>
            <LinearGradient
              colors={[bodyTint, colors.background, colors.background]}
              locations={[0, 0.55, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

          {/* Body */}
          <View style={styles.body}>
            {/* <Text style={styles.welcome}>{t('login.welcome')}</Text> */}

            <View style={[styles.inputWrap, focused == 'email' && styles.inputWrapFocused]}>
              <TextInput
                style={styles.input}
                placeholder={t('login.email')}
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
            </View>

            <View style={[styles.inputWrap, focused == 'password' && styles.inputWrapFocused]}>
              <TextInput
                style={styles.input}
                placeholder={t('login.password')}
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPw}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
              />
              <TouchableOpacity onPress={() => setShowPw((s) => !s)} style={styles.eyeBtn} hitSlop={8}>
                <Ionicons name={showPw ? 'eye' : 'eye-off'} size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotWrap}
              onPress={() => navigation.navigate('ForgotPassword')}
              hitSlop={8}
            >
              <Text style={styles.forgot}>{t('login.forgotPassword')}</Text>
            </TouchableOpacity>

            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity activeOpacity={0.9} onPress={submit} disabled={busy} style={styles.cta}>
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaText}>{t('login.logIn')}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.createRow}>
              <Text style={styles.createText}>{t('login.noAccount')} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')} hitSlop={8}>
                <Text style={styles.createLink}>{t('login.createAccount')}</Text>
              </TouchableOpacity> 
            </View>
          </View>

          <View style={styles.spacer} />

          <Text style={styles.legal}>
            <Ionicons name="lock-closed" size={11} color={colors.muted} />{'  '}
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

const NAVY = '#122F4A';

const makeStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },

  hero: { width: '100%', position: 'relative' },
  heroContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
    fontSize: 40,
    fontWeight: '600',
    fontStyle: 'medium',
    letterSpacing: 1,
    lineHeight: 54,
  },
  wave: { position: 'absolute', bottom: 0, left: 0 },

  // Holds the light fade behind everything below the wave; flexes to fill the
  // remaining screen so the fade spans the whole lower area. Pulled up a couple
  // px so its body-tint gradient overlaps the wave bottom — kills the hairline
  // seam where the lighter root background used to peek through.
  lower: { flex: 1, marginTop: -3 },

  // Transparent so the `lower` fade shows through; pulled up under the wave so
  // the hero/body boundary can't show a seam line.
  body: {
    paddingHorizontal: spacing.lg + 4,
    backgroundColor: 'transparent',
    marginTop: '20%',
    paddingTop: 6,
  },
  welcome: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputWrapFocused: {
    // NOTE: do NOT add/remove Android `elevation` here. Toggling elevation on
    // focus re-creates the native view that holds the focused TextInput, which
    // drops focus (keyboard flickers, focus jumps to the next field). iOS
    // shadow props are no-ops on Android, so they're safe to keep.
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  input: { flex: 1, paddingVertical: 12, color: colors.text, fontSize: 15 },
  eyeBtn: { paddingLeft: 6, paddingVertical: 6 },

  forgotWrap: { alignSelf: 'flex-end', marginTop: 0, marginBottom: 10 },
  forgot: { color: colors.primary, fontSize: 12.5, fontWeight: '700' },

  error: { color: colors.danger, fontSize: 12, marginBottom: spacing.sm, textAlign: 'center' },
  notice: {
    color: colors.success,
    fontSize: 12,
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },

  cta: {
    backgroundColor: NAVY,
    paddingVertical: 13,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: NAVY,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  ctaText: { color: '#fff', fontSize: 15.5, fontWeight: '700', letterSpacing: 0.3 },

  createRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  createText: { color: colors.muted, fontSize: 13 },
  createLink: { color: colors.primary, fontSize: 13, fontWeight: '800' },

  spacer: { flex: 1, minHeight: spacing.sm },
  legal: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  legalLink: { color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
});
