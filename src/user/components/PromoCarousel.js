import React, { useEffect, useRef, useState } from 'react';
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
import { colors, radii, spacing } from '../../shared/theme/colors';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDE = spacing.md;
const GAP = 14;
const CARD_WIDTH = SCREEN_W - SIDE * 2;
const SNAP = CARD_WIDTH + GAP;
const CARD_HEIGHT = 200;

const slides = [
  {
    id: 's1',
    pill: 'FREE PICKUP',
    pillIcon: 'bicycle',
    title: 'Pickup at your\ndoorstep',
    subtitle: 'Schedule in under a minute.',
    cta: 'Book pickup',
    icon: 'cube',
    gradient: ['#2D8FE0', '#1B6FC4'],
    rating: '4.9 ★',
  },
  {
    id: 's2',
    pill: 'LIMITED TIME',
    pillIcon: 'flame',
    title: '40% off\nyour first wash',
    subtitle: 'New customers · code CLEANPRO40',
    cta: 'Claim offer',
    icon: 'pricetag',
    gradient: ['#67C7EB', '#2D8FE0'],
    rating: 'Save ₹150',
  },
  {
    id: 's3',
    pill: 'PREMIUM CARE',
    pillIcon: 'sparkles',
    title: 'Dry cleaning,\ndone right',
    subtitle: 'Fabric-safe wash for delicates.',
    cta: 'Explore',
    icon: 'shirt',
    gradient: ['#1B6FC4', '#0A3D7A'],
    rating: 'Used by 12k+',
  },
  {
    id: 's4',
    pill: 'ECO FRIENDLY',
    pillIcon: 'leaf',
    title: 'Gentle on clothes,\nthe planet.',
    subtitle: 'Plant-based detergents only.',
    cta: 'Learn more',
    icon: 'leaf',
    gradient: ['#06B6D4', '#2D8FE0'],
    rating: '100% certified',
  },
];

export default function PromoCarousel({ onPressSlide }) {
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      const next = (index + 1) % slides.length;
      listRef.current?.scrollToOffset({
        offset: next * SNAP,
        animated: true,
      });
      setIndex(next);
    }, 4500);
    return () => clearInterval(t);
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
                <Text style={styles.metaText}>{item.rating}</Text>
              </View>

              <View style={styles.content}>
                {/* PILL */}
                <View style={styles.pill}>
                  <Ionicons name={item.pillIcon} size={11} color="#FFD700" />
                  <Text style={styles.pillText}>{item.pill}</Text>
                </View>

                {/* TITLE / SUB */}
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.sub}>{item.subtitle}</Text>

                {/* CTA */}
                <View style={styles.ctaRow}>
                  <View style={styles.ctaBtn}>
                    <Text style={styles.ctaText}>{item.cta}</Text>
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

const styles = StyleSheet.create({
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
  metaText: { color: colors.card, fontWeight: '800', fontSize: 11 },

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
    color: colors.card,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: colors.card,
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
