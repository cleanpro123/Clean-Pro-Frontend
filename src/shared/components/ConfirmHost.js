import React, { useEffect, useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { _registerConfirmHost } from '../utils/confirm';
import { spacing, radii } from '../theme/dark';
import { useTheme } from '../theme/ThemeContext';

// Confirmation dialogs follow the selected theme for every role.
const LIGHT = {
  cardGradient: ['#FFFFFF', '#F5FAFF'],
  cardBorder: 'rgba(15, 42, 79, 0.08)',
  backdrop: 'rgba(9, 24, 43, 0.45)',
  title: '#0F2A4F',
  titleWeight: '800',
  message: '#3A5B85',
  shadowColor: '#1B6FC4',
  shadowOpacity: 0.2,
  bubble: {
    ok: { backgroundColor: 'rgba(45, 143, 224, 0.12)', borderColor: 'rgba(45, 143, 224, 0.35)' },
    danger: { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.35)' },
    info: { backgroundColor: 'rgba(6, 182, 212, 0.12)', borderColor: 'rgba(6, 182, 212, 0.35)' },
  },
  icon: { ok: '#2D8FE0', danger: '#EF4444', info: '#06B6D4' },
  cancelBtn: { backgroundColor: '#E8F1FB', borderColor: '#DCEAF7' },
  cancelText: '#3A5B85',
  confirmBtn: { backgroundColor: '#2D8FE0', borderColor: '#2D8FE0' },
  confirmText: '#FFFFFF',
  confirmDangerBtn: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  confirmDangerText: '#FFFFFF',
};

// Blue-and-black dark palette for the customer app's dark mode.
const BLUE_DARK = {
  cardGradient: ['#183253', '#0F2038'],
  cardBorder: 'rgba(123, 184, 240, 0.14)',
  backdrop: 'rgba(3, 10, 20, 0.66)',
  title: '#EAF2FB',
  titleWeight: '800',
  message: '#A9C2DE',
  shadowColor: '#000',
  shadowOpacity: 0.5,
  bubble: {
    ok: { backgroundColor: 'rgba(59, 154, 237, 0.18)', borderColor: 'rgba(59, 154, 237, 0.42)' },
    danger: { backgroundColor: 'rgba(248, 113, 113, 0.18)', borderColor: 'rgba(248, 113, 113, 0.42)' },
    info: { backgroundColor: 'rgba(34, 211, 238, 0.16)', borderColor: 'rgba(34, 211, 238, 0.40)' },
  },
  icon: { ok: '#3B9AED', danger: '#F87171', info: '#22D3EE' },
  cancelBtn: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(123, 184, 240, 0.22)' },
  cancelText: '#A9C2DE',
  confirmBtn: { backgroundColor: '#1B6FC4', borderColor: '#3B9AED' },
  confirmText: '#FFFFFF',
  confirmDangerBtn: { backgroundColor: 'rgba(120, 35, 35, 0.55)', borderColor: 'rgba(248, 113, 113, 0.5)' },
  confirmDangerText: '#F87171',
};

export default function ConfirmHost() {
  const { isDark } = useTheme();
  const T = isDark ? BLUE_DARK : LIGHT;
  const styles = useMemo(() => makeStyles(T), [T]);
  const [state, setState] = useState(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    return _registerConfirmHost((s) => setState(s));
  }, []);

  // Tick the countdown (if any) down to zero while the modal is open. Cleared
  // automatically when the modal closes (state → null) or reaches zero.
  useEffect(() => {
    if (!state || !state.countdown) {
      setRemaining(0);
      return undefined;
    }
    setRemaining(state.countdown);
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [state]);

  const close = () => setState(null);
  const confirm = () => {
    if (remaining > 0) return; // still locked
    const fn = state?.onConfirm;
    setState(null);
    fn && fn();
  };

  if (!state) return null;

  const locked = remaining > 0;
  const confirmText = locked ? `${state.confirmLabel} (${remaining}s)` : state.confirmLabel;

  const kind = state.destructive ? 'danger' : state.tone === 'info' ? 'info' : 'ok';
  const iconName = state.destructive ? 'alert' : state.tone === 'info' ? 'information' : 'help';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={styles.center} pointerEvents="box-none">
        <View style={styles.cardShadow}>
          <LinearGradient
            colors={T.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.cardBorder} pointerEvents="none" />

            <View style={styles.iconWrap}>
              <View style={[styles.iconBubble, T.bubble[kind]]}>
                <Ionicons name={iconName} size={22} color={T.icon[kind]} />
              </View>
            </View>

            <Text style={styles.title}>{state.title}</Text>
            {state.message ? <Text style={styles.message}>{state.message}</Text> : null}

            <View style={styles.actions}>
              {!state.hideCancel && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={close}
                  style={[styles.btn, styles.cancelBtn]}
                >
                  <Text
                    style={styles.cancelText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {state.cancelLabel}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={confirm}
                disabled={locked}
                style={[
                  styles.btn,
                  state.destructive ? styles.confirmDangerBtn : styles.confirmBtn,
                  locked && styles.btnLocked,
                ]}
              >
                <Text
                  style={state.destructive ? styles.confirmDangerText : styles.confirmText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  {confirmText}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (T) => StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: T.backdrop,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  cardShadow: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radii.lg,
    shadowColor: T.shadowColor,
    shadowOpacity: T.shadowOpacity,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    overflow: 'hidden',
    alignItems: 'center',
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: T.cardBorder,
  },
  iconWrap: { marginBottom: spacing.md },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: {
    color: T.title,
    fontSize: 18,
    fontWeight: T.titleWeight,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  message: {
    color: T.message,
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelBtn: T.cancelBtn,
  cancelText: { color: T.cancelText, fontSize: 14, fontWeight: '600', letterSpacing: 0.3 },
  confirmBtn: T.confirmBtn,
  btnLocked: { opacity: 0.5 },
  confirmText: { color: T.confirmText, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  confirmDangerBtn: T.confirmDangerBtn,
  confirmDangerText: { color: T.confirmDangerText, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
});
