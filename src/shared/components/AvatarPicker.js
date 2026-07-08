import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AVATARS } from '../constants/avatars';
import { colors, radii, spacing } from '../theme/colors';

const isPreset = (uri) => AVATARS.some((a) => a.uri === uri);

export default function AvatarPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(value && !isPreset(value) ? value : null);

  const pickCustom = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload your own picture.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!res.canceled && res.assets?.length) {
      const uri = res.assets[0].uri;
      setCustom(uri);
      setOpen(false);
      onChange(uri);
    }
  };

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

        <View style={styles.btnCol}>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.85}
            onPress={() => setOpen((o) => !o)}
          >
            <Ionicons name="happy-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.actionText}>
              {open ? 'Hide avatars' : 'Choose an avatar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnAlt}
            activeOpacity={0.85}
            onPress={pickCustom}
          >
            <Ionicons name="camera-outline" size={18} color={colors.primary} />
            <Text style={styles.actionTextAlt}>
              {custom ? 'Change photo' : 'Upload your own'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {open && (
        <View style={styles.grid}>
          {AVATARS.map((a) => {
            const selected = value === a.uri;
            return (
              <TouchableOpacity
                key={a.id}
                activeOpacity={0.85}
                onPress={() => {
                  setCustom(null);
                  onChange(a.uri);
                }}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  btnCol: { flex: 1, gap: spacing.sm },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  actionText: { color: colors.primaryDark, fontWeight: '700', fontSize: 13 },
  actionBtnAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionTextAlt: { color: colors.primary, fontWeight: '700', fontSize: 13 },
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
