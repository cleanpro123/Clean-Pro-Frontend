import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { colors, radii, spacing } from '../theme/colors';
import { useAuth } from '../state/AuthContext';
import { confirmAction } from '../utils/confirm';
import { PRIVACY_POLICY_URL } from '../constants/legal';

// Layered "ripple" transition from the gradient hero into the body. The arcs
// bulge UP at the centre (∩) and the last layer is the body colour, so the
// wave melts seamlessly into the page with no hard edge.
//
// Geometry is expressed as RATIOS (of the wave height / width) rather than
// absolute pixels so the curve scales identically on every screen size and on
// rotation — the whole reason this screen looked different across devices.
// Soft light tint the body fades in from — strongest just under the wave,
// easing out to the flat background further down.
const BODY_TINT = '#E5F1FB';
const WAVE_LAYERS = [
  { key: 'a', edge: 0.463, fill: '#D3DCE6' },
  { key: 'b', edge: 0.747, fill: '#E7ECF2' },
  { key: 'c', edge: 0.979, fill: BODY_TINT },
];
const WAVE_DIP_RATIO = 0.263; // fraction of the wave height each arc bulges up

function WaveDivider({ width, height }) {
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
      {WAVE_LAYERS.map((l) => {
        const edge = height * l.edge;
        return (
          <Path
            key={l.key}
            d={`M0 ${edge} Q ${cx} ${edge - dip} ${width} ${edge} L ${width} ${height} L 0 ${height} Z`}
            fill={l.fill}
          />
        );
      })}
    </Svg>
  );
}

// Multi-colour Google "G".
function GoogleG({ size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <Path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <Path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <Path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </Svg>
  );
}

export default function LoginScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();

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
    setBusy(true);
    try {
      await loginUser(email.trim(), password);
    } catch (e) {
      if (e.code === 'FORBIDDEN') {
        navigation.navigate('AccountBlocked', { preset: 'blocked', message: e.message });
        return;
      }
      setError(e.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const soon = (name) =>
    confirmAction({
      title: `${name} sign-in`,
      message: `${name} sign-in is coming soon. For now, please log in with your email.`,
      hideCancel: true,
      tone: 'info',
      confirmLabel: 'Got it',
    });

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.md }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Gradient hero with wordmark + curved wave */}
          <View style={[styles.hero, { height: HERO_H }]}>
            <LinearGradient
              colors={['#6FB7E6', '#2C79B8', '#0E3A5C']}
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
              colors={[BODY_TINT, colors.background, colors.background]}
              locations={[0, 0.55, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

          {/* Body */}
          <View style={styles.body}>
            <Text style={styles.welcome}>Welcome back</Text>

            <View style={[styles.inputWrap, focused === 'email' && styles.inputWrapFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
            </View>

            <View style={[styles.inputWrap, focused === 'password' && styles.inputWrapFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Password"
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
              <Text style={styles.forgot}>Forgot password?</Text>
            </TouchableOpacity>

            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity activeOpacity={0.9} onPress={submit} disabled={busy} style={styles.cta}>
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaText}>Log in</Text>
              )}
            </TouchableOpacity>

            {/* OR divider */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            {/* Social sign-in */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.social} onPress={() => soon('Google')} activeOpacity={0.7}>
                <GoogleG size={22} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.social} onPress={() => soon('Facebook')} activeOpacity={0.7}>
                <Ionicons name="logo-facebook" size={26} color="#1877F2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.social} onPress={() => soon('Apple')} activeOpacity={0.7}>
                <Ionicons name="logo-apple" size={25} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.createRow}>
              <Text style={styles.createText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')} hitSlop={8}>
                <Text style={styles.createLink}>Create Account</Text>
              </TouchableOpacity> 
            </View>
          </View>

          <View style={styles.spacer} />

          <Text style={styles.legal}>
            <Ionicons name="lock-closed" size={11} color={colors.muted} />{'  '}
            By logging in, you agree to our{' '}
            <Text style={styles.legalLink} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
              Privacy Policy
            </Text>
            .
          </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const NAVY = '#122F4A';

const styles = StyleSheet.create({
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
  // px so its BODY_TINT gradient overlaps the wave bottom — kills the hairline
  // seam where the lighter root background used to peek through.
  lower: { flex: 1, marginTop: -3 },

  // Transparent so the `lower` fade shows through; pulled up under the wave so
  // the hero/body boundary can't show a seam line.
  body: {
    paddingHorizontal: spacing.lg + 4,
    backgroundColor: 'transparent',
    marginTop: -6,
    paddingTop: 6,
  },
  welcome: {
    color: NAVY,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputWrapFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
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

  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: 10,
  },
  orLine: { height: 1, width: 64, backgroundColor: colors.border },
  orText: { color: colors.muted, fontSize: 11.5, fontWeight: '700', letterSpacing: 1 },

  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  social: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  createRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  createText: { color: colors.muted, fontSize: 13 },
  createLink: { color: NAVY, fontSize: 13, fontWeight: '800' },

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
