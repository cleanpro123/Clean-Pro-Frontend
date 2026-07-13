import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { useI18n } from '../../shared/i18n/LanguageContext';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDE = spacing.md;
const GAP = 14;
const CARD_WIDTH = SCREEN_W - SIDE * 2;
const SNAP = CARD_WIDTH + GAP;
const CARD_HEIGHT = 200;

const slides = [
  {
    id: 's1',
    pill: 'promo.s1Pill',
    pillIcon: 'bicycle',
    title: 'promo.s1Title',
    subtitle: 'promo.s1Subtitle',
    cta: 'promo.s1Cta',
    icon: 'cube',
    gradient: ['#2D8FE0', '#1B6FC4'],
    rating: 'promo.s1Rating',
  },
  {
    id: 's2',
    pill: 'promo.s2Pill',
    pillIcon: 'flame',
    title: 'promo.s2Title',
    subtitle: 'promo.s2Subtitle',
    cta: 'promo.s2Cta',
    icon: 'pricetag',
    gradient: ['#67C7EB', '#2D8FE0'],
    rating: 'promo.s2Rating',
  },
  {
    id: 's3',
    pill: 'promo.s3Pill',
    pillIcon: 'sparkles',
    title: 'promo.s3Title',
    subtitle: 'promo.s3Subtitle',
    cta: 'promo.s3Cta',
    icon: 'shirt',
    gradient: ['#1B6FC4', '#0A3D7A'],
    rating: 'promo.s3Rating',
  },
  {
    id: 's4',
    pill: 'promo.s4Pill',
    pillIcon: 'leaf',
    title: 'promo.s4Title',
    subtitle: 'promo.s4Subtitle',
    cta: 'promo.s4Cta',
    icon: 'leaf',
    gradient: ['#06B6D4', '#2D8FE0'],
    rating: 'promo.s4Rating',
  },
];

export default function PromoCarousel({ onPressSlide }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useI18n();
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (index + 1) % slides.length;
      listRef.current?.scrollToOffset({
        offset: next * SNAP,
        animated: true,
      });
      setIndex(next);
    }, 4500);
    return () => clearInterval(timer);
  }, [index]);

  return (
    <View style={{ paddingBottom: spacing.sm }}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: SIDE }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / SNAP);
          setIndex(i);
        }}
        renderItem={({ item, index: i }) => (
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => onPressSlide?.(item)}
            style={{
              width: CARD_WIDTH,
              marginRight: i === slides.length - 1 ? 0 : GAP,
            }}
          >
            <LinearGradient
              colors={item.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.slide}
            >
              <View style={styles.orbBig} />
              <View style={styles.orbSmall} />
              <View style={styles.orbTiny} />

              {/* RATING / META PILL — top right */}
              <View style={styles.metaPill}>
                <Ionicons name="star" size={10} color="#FFD700" />
                <Text style={styles.metaText}>{t(item.rating)}</Text>
              </View>

              <View style={styles.content}>
                {/* PILL */}
                <View style={styles.pill}>
                  <Ionicons name={item.pillIcon} size={11} color="#FFD700" />
                  <Text style={styles.pillText}>{t(item.pill)}</Text>
                </View>

                {/* TITLE / SUB */}
                <Text style={styles.title}>{t(item.title)}</Text>
                <Text style={styles.sub}>{t(item.subtitle)}</Text>

                {/* CTA */}
                <View style={styles.ctaRow}>
                  <View style={styles.ctaBtn}>
                    <Text style={styles.ctaText}>{t(item.cta)}</Text>
                    <Ionicons name="arrow-forward" size={13} color={colors.primary} />
                  </View>
                </View>
              </View>

              {/* BIG ICON */}
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={120} color={'#ffffff20'} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <Dot key={i} active={i === index} />
        ))}
      </View>
    </View>
  );
}

function Dot({ active }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const w = useRef(new Animated.Value(active ? 24 : 7)).current;
  useEffect(() => {
    Animated.spring(w, {
      toValue: active ? 24 : 7,
      friction: 6,
      useNativeDriver: false,
    }).start();
  }, [active, w]);
  return (
    <Animated.View
      style={[
        styles.dot,
        { width: w, backgroundColor: active ? colors.primary : colors.border },
      ]}
    />
  );
}

const makeStyles = (colors) => StyleSheet.create({
  slide: {
    height: CARD_HEIGHT,
    borderRadius: 24,
    padding: spacing.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  orbBig: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#ffffff15',
  },
  orbSmall: {
    position: 'absolute',
    bottom: -40,
    right: 40,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#ffffff10',
  },
  orbTiny: {
    position: 'absolute',
    top: 70,
    right: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff14',
  },

  metaPill: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff25',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#ffffff35',
  },
  metaText: { color: '#fff', fontWeight: '800', fontSize: 11 },

  content: { gap: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffffff25',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  pillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: -0.5,
    marginTop: 6,
  },
  sub: {
    color: '#ffffffe0',
    fontSize: 12,
    lineHeight: 17,
  },
  ctaRow: { marginTop: spacing.sm },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
  },
  ctaText: { color: colors.primary, fontWeight: '800', fontSize: 12 },

  iconWrap: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    opacity: 0.9,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: 5,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
});
