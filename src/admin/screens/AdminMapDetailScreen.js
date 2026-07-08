import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../components/AdminHeader';
import MapPreview from '../components/MapPreview';
import { colors, radii, spacing } from '../../shared/theme/dark';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';

function PillRow({ icon, label, value, onPress }) {
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap activeOpacity={0.85} onPress={onPress} style={styles.pillShadow}>
      <LinearGradient
        colors={['#2B3F6E', '#1B2B52']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pill}
      >
        <View style={styles.pillBorder} pointerEvents="none" />
        <View style={styles.iconBubble}>
          <Ionicons name={icon} size={16} color={colors.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pillLabel}>{label}</Text>
          <Text style={styles.pillValue}>{value}</Text>
        </View>
        {onPress && <Ionicons name="open-outline" size={16} color={colors.muted} />}
      </LinearGradient>
    </Wrap>
  );
}

export default function AdminMapDetailScreen({ route, navigation }) {
  const id = route.params?.id;
  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setM(await api.get(`/maps/${id}`));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AdminHeader title="Location details" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.muted} style={{ marginTop: 32 }} />
      </SafeAreaView>
    );
  }
  if (!m) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title="Location details" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <MapPreview place={m.place} height={220} />

        <View style={styles.titleRow}>
          <View style={styles.titleIcon}>
            <Ionicons name="location-sharp" size={20} color={colors.text} />
          </View>
          <Text style={styles.title}>{m.name}</Text>
        </View>

        <Text style={styles.section}>Address</Text>
        <PillRow
          icon="location-sharp"
          label="Place"
          value={m.place}
          onPress={() =>
            Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(m.place)}`)
          }
        />

        {m.description ? (
          <>
            <Text style={styles.section}>About</Text>
            <View style={styles.descShadow}>
              <LinearGradient
                colors={['#2B3F6E', '#1B2B52']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.descCard}
              >
                <View style={styles.descBorder} pointerEvents="none" />
                <Text style={styles.descText}>{m.description}</Text>
              </LinearGradient>
            </View>
          </>
        ) : null}

        <Text style={styles.section}>Coverage</Text>
        <PillRow icon="radio-outline" label="Pickup radius" value={m.pickupRadius || '—'} />

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            confirmAction({
              title: 'Delete location?',
              message: `${m.name} will be permanently removed. This cannot be undone.`,
              confirmLabel: 'Delete',
              destructive: true,
              onConfirm: async () => {
                await api.delete(`/maps/${m.id}`);
                navigation.goBack();
              },
            })
          }
          style={styles.deleteShadow}
        >
          <LinearGradient
            colors={['#5C1F1F', '#2D0F0F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.deleteBtn}
          >
            <View style={styles.deleteBorder} pointerEvents="none" />
            <Ionicons name="trash-outline" size={18} color="#F87171" />
            <Text style={styles.deleteText}>Delete location</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 4 },
  titleIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.10)', alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 18, fontWeight: '300', letterSpacing: 0.5 },
  section: { color: colors.muted, fontSize: 11, fontWeight: '400', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: spacing.md, paddingHorizontal: 4 },
  pillShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: radii.md, gap: spacing.md, overflow: 'hidden' },
  pillBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  iconBubble: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.10)', alignItems: 'center', justifyContent: 'center' },
  pillLabel: { color: colors.muted, fontSize: 11, fontWeight: '300', letterSpacing: 0.5, textTransform: 'uppercase' },
  pillValue: { color: colors.text, fontSize: 14, fontWeight: '300', letterSpacing: 0.3, marginTop: 2 },
  descShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  descCard: { padding: spacing.lg, borderRadius: radii.md, overflow: 'hidden' },
  descBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  descText: { color: colors.text, fontSize: 14, fontWeight: '300', lineHeight: 22, letterSpacing: 0.3 },
  deleteShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4, marginTop: spacing.lg },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: radii.md, gap: spacing.sm, overflow: 'hidden' },
  deleteBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.30)' },
  deleteText: { color: '#F87171', fontSize: 14, fontWeight: '400', letterSpacing: 0.5 },
});
