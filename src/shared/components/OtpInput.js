import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, Animated, StyleSheet, Platform } from 'react-native';
import { radii } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

// Matches the backend's default OTP_LENGTH.
export const OTP_LENGTH = 6;

// Six-box one-time-code input.
//
// The boxes are display-only. A single transparent TextInput is stretched over
// them and owns all input, because OS autofill only targets ONE field: iOS
// "From Messages / From Mail" suggestions (textContentType oneTimeCode), the
// Android autofill / keyboard code suggestion (autoComplete sms-otp), and
// long-press paste all land a full code in one go. Six separate inputs would
// break every one of those.
//
// onComplete fires as soon as the last digit arrives (typed, pasted or
// autofilled), so the screen can verify without a submit button.
export default function OtpInput({
  value,
  onChangeText,
  onComplete,
  length = OTP_LENGTH,
  autoFocus = true,
  disabled = false,
  error = false,
  accessibilityLabel,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [focused, setFocused] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;

  // Nudge the row sideways when a code is rejected.
  useEffect(() => {
    if (!error) return;
    const step = (to) =>
      Animated.timing(shake, { toValue: to, duration: 50, useNativeDriver: true });
    Animated.sequence([step(8), step(-8), step(6), step(-6), step(0)]).start();
  }, [error, shake]);

  // Blinking caret in the active empty box.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [blink]);

  const handleChange = (text) => {
    // Keep the input editable while verifying: flipping `editable` off on
    // Android blurs the field and drops the keyboard, so a rejected code would
    // leave the user tapping back in. Ignore input instead.
    if (disabled) return;
    const digits = text.replace(/\D/g, '').slice(0, length);
    onChangeText(digits);
    if (digits.length === length && digits !== value) onComplete?.(digits);
  };

  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Animated.View style={[styles.row, { transform: [{ translateX: shake }] }]}>
      {Array.from({ length }, (_, i) => {
        const digit = value[i] || '';
        const isActive = focused && i === activeIndex;
        return (
          <View
            key={i}
            style={[
              styles.box,
              !!digit && styles.boxFilled,
              isActive && styles.boxActive,
              error && styles.boxError,
            ]}
          >
            {digit ? (
              <Text style={styles.digit}>{digit}</Text>
            ) : isActive ? (
              <Animated.View style={[styles.caret, { opacity: blink }]} />
            ) : null}
          </View>
        );
      })}

      <TextInput
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        importantForAutofill="yes"
        autoFocus={autoFocus}
        caretHidden
        // Pin the cursor to the end so a tap can't place it mid-code.
        selection={{ start: value.length, end: value.length }}
        selectionColor="transparent"
        underlineColorAndroid="transparent"
        accessibilityLabel={accessibilityLabel}
      />
    </Animated.View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    // Codes are always left-to-right, even in the Arabic UI.
    direction: 'ltr',
  },
  box: {
    flex: 1,
    maxWidth: 54,
    height: 58,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: { borderColor: colors.primaryLight },
  boxActive: { borderColor: colors.primary, borderWidth: 2 },
  boxError: { borderColor: colors.danger },
  digit: { color: colors.text, fontSize: 24, fontWeight: '700' },
  caret: { width: 2, height: 24, borderRadius: 1, backgroundColor: colors.primary },
  // Covers the boxes so any tap focuses it and long-press offers Paste, but its
  // own text is invisible — the boxes render the digits.
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    color: 'transparent',
    backgroundColor: 'transparent',
    fontSize: 1,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
});
