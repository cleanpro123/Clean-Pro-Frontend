import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect, Path, Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme/dark';

// Static Maps key is inlined at build time (same EXPO_PUBLIC_* convention used
// for Sentry / app variant). When it's set AND the address carries real
// coordinates we render an actual Google map thumbnail centred on the point;
// otherwise we fall back to the lightweight decorative illustration. The key
// used here must allow the Static Maps API over HTTP referrers — it is NOT the
// same as the native Google Maps SDK key in app.config.js, which is app-locked.
const STATIC_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_STATIC_KEY;

const isNum = (n) => typeof n === 'number' && Number.isFinite(n);

// Builds a retina static-map URL with a brand-green marker at the exact point.
function staticMapUrl(lat, lng) {
  const params = [
    `center=${lat},${lng}`,
    'zoom=15',
    'size=640x320',
    'scale=2',
    `markers=${encodeURIComponent(`color:0x10B981|${lat},${lng}`)}`,
    `key=${STATIC_MAPS_KEY}`,
  ];
  return `https://maps.googleapis.com/maps/api/staticmap?${params.join('&')}`;
}

export default function MapPreview({ place, lat, lng, height = 160 }) {
  const hasCoords = isNum(lat) && isNum(lng);

  // Prefer exact coordinates for the deep link so the pin lands precisely;
  // fall back to a text query when only an address string is available.
  const open = () => {
    if (hasCoords) {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      );
    } else if (place) {
      Linking.openURL(
        `https://maps.google.com/?q=${encodeURIComponent(place)}`
      );
    }
  };

  const tappable = hasCoords || !!place;
  const showRealMap = hasCoords && !!STATIC_MAPS_KEY;

  return (
    <TouchableOpacity activeOpacity={tappable ? 0.85 : 1} onPress={open}>
      <View style={[styles.wrap, { height }]}>
        {showRealMap ? (
          <Image
            source={{ uri: staticMapUrl(lat, lng) }}
            style={styles.mapImage}
            resizeMode="cover"
          />
        ) : (
          <>
            <Svg width="100%" height="100%" viewBox="0 0 320 160" preserveAspectRatio="none">
              <Defs>
                <SvgGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#1B3565" />
                  <Stop offset="1" stopColor="#0E1F3F" />
                </SvgGradient>
                <SvgGradient id="route" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#10B981" />
                  <Stop offset="1" stopColor="#22D3EE" />
                </SvgGradient>
              </Defs>
              <Rect x="0" y="0" width="320" height="160" fill="url(#mapBg)" />

              <G stroke="rgba(255,255,255,0.06)" strokeWidth="1">
                <Path d="M0,40 L320,55" />
                <Path d="M0,90 L320,80" />
                <Path d="M0,130 L320,120" />
                <Path d="M70,0 L60,160" />
                <Path d="M160,0 L180,160" />
                <Path d="M250,0 L240,160" />
              </G>

              <G fill="rgba(15, 118, 110, 0.18)" stroke="rgba(34, 211, 238, 0.20)">
                <Path d="M20,20 L100,15 L110,55 L40,70 Z" />
                <Path d="M200,30 L290,40 L285,90 L210,80 Z" />
                <Path d="M30,100 L120,110 L130,145 L20,140 Z" />
                <Path d="M180,110 L290,105 L280,150 L190,150 Z" />
              </G>

              <Path
                d="M40,140 C90,120 130,100 170,90 S260,60 290,40"
                stroke="url(#route)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="6 4"
              />

              <G>
                <Circle cx="160" cy="80" r="22" fill="rgba(34, 211, 238, 0.15)" />
                <Circle cx="160" cy="80" r="12" fill="rgba(34, 211, 238, 0.35)" />
              </G>
            </Svg>

            <View style={styles.pinWrap} pointerEvents="none">
              <View style={styles.pin}>
                <Ionicons name="location-sharp" size={22} color="#fff" />
              </View>
            </View>
          </>
        )}

        {place ? (
          <View style={styles.placeBar} pointerEvents="none">
            <Ionicons name="location-outline" size={14} color={colors.text} />
            <Text style={styles.placeText} numberOfLines={1}>
              {place}
            </Text>
            <Ionicons name="open-outline" size={14} color={colors.muted} />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    backgroundColor: '#0E1F3F',
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  pinWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    transform: [{ translateY: -8 }],
  },
  placeBar: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 26, 54, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.md,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  placeText: { color: colors.text, fontSize: 12, fontWeight: '300', flex: 1 },
});
