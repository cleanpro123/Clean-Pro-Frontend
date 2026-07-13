import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AVATARS } from '../constants/avatars';
import { radii, spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/LanguageContext';

// Users pick from a fixed set of preset avatars — there is no device-photo
// upload (keeps the app off the photo-library permission and avoids hosting
// user-uploaded images).
export default function AvatarPicker({ value, onChange }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useI18n();

  return (
    <View>
      <View style={styles.previewRow}>
        <View style={styles.previewWrap}>
          {value ? (
            <Image source={{ uri: value }} style={styles.preview} />
          ) : (
            <Ionicons name="person" size={28} color={colors.muted} />
          )}
        </View>
        <View style={styles.headingCol}>
          <Ionicons name="happy-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.heading}>{t('avatar.chooseAvatar')}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {AVATARS.map((a) => {
          const selected = value === a.uri;
          return (
            <TouchableOpacity
              key={a.id}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              activeOpacity={0.85}
              onPress={() => onChange(a.uri)}
              style={[styles.avatarWrap, selected && styles.avatarWrapSel]}
            >
              <Image source={{ uri: a.uri }} style={styles.avatar} />
              {selected && (
                <View style={styles.check}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  previewWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
  },
  preview: { width: '100%', height: '100%' },
  headingCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heading: { color: colors.primaryDark, fontWeight: '700', fontSize: 14 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
    marginTop: spacing.md,
  },
  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
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
