import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { useI18n } from '../../shared/i18n/LanguageContext';

const ICONS = {
  Home: { off: 'home-outline', on: 'home' },
  Services: { off: 'pricetags-outline', on: 'pricetags' },
  Orders: { off: 'receipt-outline', on: 'receipt' },
  Profile: { off: 'person-outline', on: 'person' },
};

export default function CustomTabBar({ state, navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const openBooking = () => navigation.navigate('Booking');

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {state.routes.slice(0, 2).map((route, i) => (
          <TabButton
            key={route.key}
            route={route}
            isFocused={state.index === i}
            onPress={() => navigation.navigate(route.name)}
          />
        ))}

        <View style={styles.fabSlot} />

        {state.routes.slice(2).map((route, i) => {
          const realIndex = i + 2;
          return (
            <TabButton
              key={route.key}
              route={route}
              isFocused={state.index === realIndex}
              onPress={() => navigation.navigate(route.name)}
            />
          );
        })}
      </View>

      <FabButton bottom={Math.max(insets.bottom, 10) + 18} onPress={openBooking} />
    </View>
  );
}

function TabButton({ route, isFocused, onPress }) {
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useI18n();
  const icon = ICONS[route.name] || { off: 'ellipse-outline', on: 'ellipse' };
  const LABELS = {
    Home: t('tabs.home'),
    Services: t('tabs.services'),
    Orders: t('tabs.orders'),
    Profile: t('tabs.profile'),
  };
  const label = LABELS[route.name] || route.name;

  const lift = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(lift, {
      toValue: isFocused ? 1 : 0,
      friction: 6,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [isFocused, lift]);

  const animatePress = (v) =>
    Animated.spring(press, {
      toValue: v,
      friction: 5,
      tension: 160,
      useNativeDriver: true,
    }).start();

  const translateY = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });
  const scale = Animated.multiply(
    lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }),
    press
  );
  const inactiveOpacity = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const activeOpacity = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animatePress(0.9)}
      onPressOut={() => animatePress(1)}
      onHoverIn={() => !isFocused && animatePress(1.06)}
      onHoverOut={() => !isFocused && animatePress(1)}
      style={styles.tabBtn}
    >
      {({ hovered }) => (
        <View style={styles.tabInner}>
          <Animated.View
            style={[
              styles.iconWrap,
              {
                transform: [{ translateY }, { scale }],
              },
              isFocused && styles.iconWrapShadow,
            ]}
          >
            {/* INACTIVE state — flat icon */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.center,
                { opacity: inactiveOpacity },
                hovered && !isFocused && styles.hoverBg,
              ]}
              pointerEvents="none"
            >
              <Ionicons
                name={icon.off}
                size={22}
                color={hovered ? colors.primary : colors.muted}
              />
            </Animated.View>

            {/* ACTIVE state — gradient circle popup */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.center,
                { opacity: activeOpacity },
              ]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activeBg}
              >
                <Ionicons name={icon.on} size={22} color="#fff" />
              </LinearGradient>
            </Animated.View>
          </Animated.View>

          <Text
            style={[
              styles.label,
              { color: isFocused ? colors.primary : hovered ? colors.primary : colors.muted },
              isFocused && { fontWeight: '700' },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function FabButton({ onPress, bottom }) {
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const press = (v) =>
    Animated.spring(scale, {
      toValue: v,
      friction: 5,
      tension: 160,
      useNativeDriver: true,
    }).start();

  const hover = (v) =>
    Animated.parallel([
      Animated.spring(scale, {
        toValue: v ? 1.1 : 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: v ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

  const rotateInterp = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => press(0.92)}
      onPressOut={() => press(1)}
      onHoverIn={() => hover(true)}
      onHoverOut={() => hover(false)}
      style={[styles.fab, { bottom }]}
    >
      <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabInner}
        >
          <Animated.View style={{ transform: [{ rotate: rotateInterp }] }}>
            <Ionicons name="add" size={28} color="#fff" />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const ICON_SIZE = 46;

const makeStyles = (colors) => StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.md,
  },
  bar: {
    flexDirection: 'row',
    height: 62,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#0F2A4F',
        shadowOpacity: 0.07,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 5 },
      default: { boxShadow: '0 3px 8px rgba(15,42,79,0.08)' },
    }),
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    paddingBottom: 6,
    gap: 1,
  },
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#2D8FE0',
        shadowOpacity: 0.16,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
      default: { boxShadow: '0 2px 6px rgba(45,143,224,0.16)' },
    }),
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  hoverBg: {
    backgroundColor: colors.primarySoft,
    borderRadius: ICON_SIZE / 2,
  },
  activeBg: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.card,
  },
  label: { fontSize: 11, fontWeight: '600' },
  fabSlot: { width: 72 },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    width: 62,
    height: 62,
    borderRadius: 31,
    ...Platform.select({
      ios: {
        shadowColor: '#2D8FE0',
        shadowOpacity: 0.18,
        shadowRadius: 7,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 5 },
      default: {
        boxShadow: '0 3px 8px rgba(45,143,224,0.18)',
        cursor: 'pointer',
      },
    }),
  },
  fabInner: {
    flex: 1,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.card,
  },
});
