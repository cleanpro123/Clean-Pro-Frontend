// Shared building blocks for the customer auth screens (login, signup, email
// verification, forgot password) so they read as one visual family: gradient
// hero with soap bubbles, icon fields with a focus highlight, tinted message
// banners, and the gradient CTA.
import React, { forwardRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

// The hero gradient is theme-aware. Dark mode leans near-black (melting into
// colors.background) so the screen reads as one dark surface instead of a
// bright blue hero over a dark sheet; light mode keeps the airy blue look.
export const HERO_GRADIENT = {
  light: ['#6FB7E6', '#2C79B8', '#0E3A5C'],
  dark: ['#17324E', '#0D2237', '#0A1424'],
};

// How far the form sheet slides up over the hero.
export const SHEET_OVERLAP = 28;

// Soft "soap bubble" decoration echoing the app icon. Positions and sizes are
// RATIOS of the hero (x/y) and screen width (size) so the layout scales
// identically on every device instead of drifting on small/large screens.
const BUBBLES = [
  { x: -0.08, y: 0.08, size: 0.34, opacity: 0.1 },
  { x: 0.78, y: -0.06, size: 0.4, opacity: 0.08 },
  { x: 0.84, y: 0.52, size: 0.12, opacity: 0.14 },
  { x: 0.1, y: 0.62, size: 0.07, opacity: 0.18 },
  { x: 0.66, y: 0.22, size: 0.05, opacity: 0.22 },
  { x: 0.24, y: 0.3, size: 0.035, opacity: 0.25 },
];

export function Bubbles({ width, height }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {BUBBLES.map((b, i) => {
        const size = Math.round(width * b.size);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: width * b.x,
              top: height * b.y,
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: `rgba(255,255,255,${b.opacity})`,
              borderWidth: 1,
              borderColor: `rgba(255,255,255,${b.opacity + 0.08})`,
            }}
          />
        );
      })}
    </View>
  );
}

// Self-contained input row. The focus-highlight state lives HERE, not on the
// screen, so focusing a field re-renders only this one small subtree — not the
// hero, gradients, and legal text. Keep the native wrapper and its stacking
// behavior stable as focus changes so Android does not reparent the input
// while opening the keyboard.
export const AuthField = React.memo(
  forwardRef(function AuthField({ icon, children, ...inputProps }, ref) {
    const { colors, isDark } = useTheme();
    const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
    const [focused, setFocused] = useState(false);
    return (
      <View collapsable={false} style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <Ionicons
          name={icon}
          size={18}
          color={focused ? colors.primary : colors.muted}
          style={styles.inputIcon}
        />
        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={colors.muted}
          {...inputProps}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {children}
      </View>
    );
  })
);

// Scrolling page shell for every auth screen except Login (which must not
// scroll — see the note there): gradient hero with a back button and title,
// then a rounded sheet that overlaps it and holds the form.
//
// A non-zero `lockSeconds` dims the back button and shows a countdown badge,
// for the screens that hold the user on the code step after sending a code.
export function AuthScreen({ title, subtitle, icon, onBack, lockSeconds = 0, children }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const heroGradient = isDark ? HERO_GRADIENT.dark : HERO_GRADIENT.light;
  // Launch-time insets/size, matching LoginScreen: the live hooks re-emit when
  // the Android keyboard opens and would reflow the form mid-focus.
  const insets =
    initialWindowMetrics?.insets ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const [{ width: SCREEN_W }] = useState(() => Dimensions.get('window'));
  const heroH = insets.top + (subtitle ? 190 : 170);
  const locked = lockSeconds > 0;

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.hero, { height: heroH }]}>
            <LinearGradient
              colors={heroGradient}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Bubbles width={SCREEN_W} height={heroH} />
            <View style={[styles.heroBar, { top: insets.top + spacing.sm }]}>
              <TouchableOpacity
                style={[styles.heroBtn, locked && styles.heroBtnLocked]}
                hitSlop={10}
                onPress={onBack}
              >
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </TouchableOpacity>
              {locked ? (
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={12} color="#fff" />
                  <Text style={styles.lockText}>{lockSeconds}s</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.heroTitle}>{title}</Text>
            {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
          </View>

          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            {icon ? (
              <View style={styles.iconBadge}>
                <Ionicons name={icon} size={28} color={colors.primary} />
              </View>
            ) : null}
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Thin progress bar for multi-step flows (e.g. forgot password: 1 of 3).
export function StepBar({ step, total }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  return (
    <View style={styles.stepBar}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.stepSeg, i < step && styles.stepSegOn]} />
      ))}
    </View>
  );
}

// The password rules the backend enforces; screens validate with these too.
export const PW_RULES = [
  (p) => p.length >= 6,
  (p) => /[A-Za-z]/.test(p),
  (p) => /\d/.test(p),
  (p) => /[^A-Za-z0-9]/.test(p),
];

// Wordless strength meter: one segment per rule met. Always rendered (greyed
// out while empty) so typing the first character doesn't shift the layout.
export function StrengthMeter({ password }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const met = PW_RULES.filter((rule) => rule(password)).length;
  const color =
    met <= 1 ? colors.danger : met === 2 ? '#F59E0B' : met === 3 ? colors.primary : '#22C55E';
  return (
    <View style={styles.meter}>
      {PW_RULES.map((_, i) => (
        <View
          key={i}
          style={[styles.meterSeg, !!password && i < met && { backgroundColor: color }]}
        />
      ))}
    </View>
  );
}

// "Resend code" link with its cooldown, plus a spinner while a code verifies.
export function ResendRow({ label, cooling, onPress, disabled, busy }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const tint = cooling ? colors.muted : colors.primary;
  return (
    <View style={styles.resendRow}>
      <TouchableOpacity
        style={styles.resendBtn}
        onPress={onPress}
        disabled={disabled || cooling}
        hitSlop={8}
      >
        <Ionicons name="refresh-outline" size={15} color={tint} />
        <Text style={[styles.resendText, { color: tint }]}>{label}</Text>
      </TouchableOpacity>
      {busy ? <ActivityIndicator color={colors.primary} /> : null}
    </View>
  );
}

// Eye toggle for password fields; pass as an AuthField child.
export function PasswordToggle({ visible, onToggle }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onToggle} style={{ paddingLeft: 6, paddingVertical: 6 }} hitSlop={8}>
      <Ionicons name={visible ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.muted} />
    </TouchableOpacity>
  );
}

const BANNER_ICONS = {
  error: 'alert-circle',
  warning: 'warning',
  success: 'checkmark-circle',
};

export function AuthBanner({ tone = 'error', text }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const color = {
    error: colors.danger,
    warning: isDark ? '#FB923C' : '#C2410C',
    success: colors.success,
  }[tone];
  return (
    <View style={[styles.banner, { backgroundColor: `${color}14`, borderColor: `${color}33` }]}>
      <Ionicons name={BANNER_ICONS[tone]} size={16} color={color} />
      <Text style={[styles.bannerText, { color }]}>{text}</Text>
    </View>
  );
}

export function AuthButton({ label, onPress, busy }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      disabled={busy}
      style={[styles.ctaShadow, busy && styles.ctaBusy]}
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cta}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.ctaText}>{label}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={styles.ctaIcon} />
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },

  hero: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: SHEET_OVERLAP + spacing.lg,
  },
  heroBar: {
    position: 'absolute',
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnLocked: { opacity: 0.45 },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  lockText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: 0.2 },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 6,
  },

  sheet: {
    flex: 1,
    marginTop: -SHEET_OVERLAP,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  iconBadge: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  stepBar: { flexDirection: 'row', gap: 6, marginBottom: spacing.lg },
  stepSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  stepSegOn: { backgroundColor: colors.primary },

  meter: { flexDirection: 'row', gap: 6, marginTop: -2, marginBottom: spacing.md },
  meterSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },

  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.md,
    minHeight: 28,
  },
  resendBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  resendText: { fontSize: 13, fontWeight: '700' },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md + 2,
    paddingHorizontal: spacing.md,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: isDark ? colors.border : '#E1ECF7',
  },
  inputWrapFocused: {
    // Only change color on focus. Fabric uses shadowColor to decide whether
    // this view forms a stacking context, even on Android. Adding a shadow
    // here can change the native hierarchy and interrupt TextInput focus.
    borderColor: colors.primary,
  },
  inputIcon: { marginRight: 10 },
  input: { backgroundColor: colors.card, flex: 1, paddingVertical: 14, color: colors.text, fontSize: 15 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  bannerText: { flex: 1, fontSize: 12.5, fontWeight: '600', lineHeight: 17 },

  ctaShadow: {
    borderRadius: radii.md + 2,
    shadowColor: colors.primaryDark,
    shadowOpacity: isDark ? 0.4 : 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaBusy: { opacity: 0.85 },
  cta: {
    flexDirection: 'row',
    height: 52,
    borderRadius: radii.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  ctaIcon: { marginLeft: 8 },
});
