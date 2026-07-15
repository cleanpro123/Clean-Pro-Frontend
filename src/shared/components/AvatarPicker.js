import React, { useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AVATARS } from '../constants/avatars';
import { spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/LanguageContext';

const GAP = spacing.sm + 2; // space between avatar circles, both axes

// Users pick from a fixed set of preset avatars — there is no device-photo
// upload (keeps the app off the photo-library permission and avoids hosting
// user-uploaded images). The grid is retractable: tapping the heading toggles
// it open/closed.
export default function AvatarPicker({ value, onChange, label }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [gridW, setGridW] = useState(0);

  // Exactly three columns: measure the grid width and split it into three equal
  // cells; the circle sits centred inside its cell at a fraction of the cell
  // width, so it stays comfortably smaller than the column. The grid is capped
  // to two rows tall; further rows are reached by scrolling down (swipe).
  const cellW = gridW ? Math.floor(gridW / 3) : 0;
  const size = Math.floor(cellW * 0.72);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.avatarBtn}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('avatar.chooseAvatar')}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
      >
        <View style={styles.previewWrap}>
          {value ? (
            <Image source={{ uri: value }} style={styles.preview} />
          ) : (
            <Ionicons name="person" size={40} color={colors.muted} />
          )}
        </View>
        <View style={styles.pencil}>
          <Ionicons name="pencil" size={13} color="#fff" />
        </View>
      </TouchableOpacity>

      {label ? <Text style={styles.label}>{label}</Text> : null}

      {open && (
        <ScrollView
          onLayout={(e) => setGridW(e.nativeEvent.layout.width)}
          style={[styles.gridScroll, size ? { maxHeight: size * 2 + GAP + 8 } : null]}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerStyle={styles.grid}
        >
          {size > 0 &&
            AVATARS.map((a) => {
              const selected = value === a.uri;
              return (
                <View key={a.id} style={{ width: cellW, alignItems: 'center' }}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={a.label}
                    activeOpacity={0.85}
                    onPress={() => {
                      onChange(a.uri);
                      setOpen(false); // collapse the grid once a choice is made
                    }}
                    style={[
                      styles.avatarWrap,
                      { width: size, height: size, borderRadius: size / 2 },
                      selected && styles.avatarWrapSel,
                    ]}
                  >
                    <Image source={{ uri: a.uri }} style={styles.avatar} />
                    {selected && (
                      <View style={styles.check}>
                        <Ionicons name="checkmark" size={13} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
        </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { alignItems: 'center' },
  // Sits between the preview circle and the avatar grid.
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  // Relative wrapper (no clipping) so the pencil badge can sit half-off the
  // circle at the bottom-right.
  avatarBtn: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  previewWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
  },
  preview: { width: '100%', height: '100%' },
  pencil: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  // Full-width, two-row-tall vertical scroller. Circles wrap three per row
  // (size is computed from the measured width) and further rows scroll into
  // view when the user swipes down.
  gridScroll: { alignSelf: 'stretch', width: '100%', marginTop: spacing.md },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: GAP,
  },
  avatarWrap: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.surface,
  },
  avatarWrapSel: { borderColor: colors.primary },
  avatar: { width: '100%', height: '100%' },
  check: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
});
