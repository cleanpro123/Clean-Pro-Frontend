import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../shared/theme/dark';
import { api } from '../../shared/api/client';
import { useAuth } from '../../shared/state/AuthContext';
import { confirmAction } from '../../shared/utils/confirm';

function InfoPill({ icon, label, value, onPress }) {
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
        {onPress && <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
      </LinearGradient>
    </Wrap>
  );
}

export default function AgentProfileScreen({ navigation }) {
  const { logout } = useAuth();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    try {
      setAgent(await api.get('/agents/me'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.muted} style={{ marginTop: 32 }} />
      </SafeAreaView>
    );
  }
  if (!agent) return null;

  const handleLogout = () =>
    confirmAction({
      title: 'End shift?',
      message: 'You will be signed out and stop receiving orders.',
      confirmLabel: 'End shift',
      destructive: true,
      onConfirm: logout,
    });

  const showZoneDetails = () =>
    setDetail({
      icon: 'map',
      title: 'Service zone',
      rows: [
        { label: 'Zone', value: agent.zone || '—' },
        { label: 'Current location', value: agent.place || '—' },
        { label: 'Status', value: agent.status || '—' },
      ],
    });

  const showVehicleDetails = () =>
    setDetail({
      icon: 'car-sport',
      title: 'Vehicle',
      rows: [
        { label: 'Vehicle', value: agent.vehicle || '—' },
        { label: 'Pickups today', value: String(agent.pickupsToday ?? 0) },
        { label: 'Status', value: agent.status || '—' },
      ],
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarShadow}>
          <LinearGradient
            colors={['#33497F', '#1B2B52']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarCard}
          >
            <View style={styles.avatarBorder} pointerEvents="none" />
            <View style={styles.avatar}>
              <Ionicons name="bicycle" size={36} color={colors.text} />
            </View>
            <Text style={styles.name}>{agent.name}</Text>
            <Text style={styles.subId}>Agent ID · {agent.id}</Text>
          </LinearGradient>
        </View>

        <Text style={styles.section}>Contact</Text>
        <InfoPill
          icon="call"
          label="Phone"
          value={agent.phone}
          onPress={() => Linking.openURL(`tel:${(agent.phone || '').replace(/\s/g, '')}`)}
        />
        <InfoPill
          icon="mail"
          label="Email"
          value={agent.email}
          onPress={() => Linking.openURL(`mailto:${agent.email}`)}
        />

        <Text style={styles.section}>Location &amp; vehicle</Text>
        <InfoPill
          icon="location-sharp"
          label="Current location"
          value={agent.place || '—'}
          onPress={
            agent.place
              ? () =>
                  Linking.openURL(
                    `https://maps.google.com/?q=${encodeURIComponent(agent.place)}`
                  )
              : undefined
          }
        />
        <InfoPill
          icon="map"
          label="Service zone"
          value={agent.zone || '—'}
          onPress={showZoneDetails}
        />
        <InfoPill
          icon="car-sport"
          label="Vehicle"
          value={agent.vehicle || '—'}
          onPress={showVehicleDetails}
        />

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleLogout}
          style={[styles.pillShadow, { marginTop: spacing.lg }]}
        >
          <LinearGradient
            colors={['#5C1F1F', '#2D0F0F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoutBtn}
          >
            <View style={styles.pillBorder} pointerEvents="none" />
            <Ionicons name="log-out-outline" size={18} color="#F87171" />
            <Text style={styles.logoutText}>End shift &amp; sign out</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={!!detail}
        animationType="fade"
        transparent
        onRequestClose={() => setDetail(null)}
      >
        <View style={styles.modalRoot}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setDetail(null)}
          />
          <View style={styles.modalShadow}>
            <LinearGradient
              colors={['#2B3F6E', '#1B2B52']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modal}
            >
              <View style={styles.modalBorder} pointerEvents="none" />
              <View style={styles.modalHeader}>
                <View style={styles.iconBubble}>
                  <Ionicons name={detail?.icon} size={16} color={colors.text} />
                </View>
                <Text style={styles.modalTitle}>{detail?.title}</Text>
                <TouchableOpacity onPress={() => setDetail(null)} hitSlop={8}>
                  <Ionicons name="close" size={22} color={colors.muted} />
                </TouchableOpacity>
              </View>
              {detail?.rows.map((row) => (
                <View key={row.label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue}>{row.value}</Text>
                </View>
              ))}
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.06)', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', color: colors.text, fontSize: 18, fontWeight: '300', letterSpacing: 1 },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  avatarShadow: { borderRadius: radii.lg, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  avatarCard: { padding: spacing.lg, borderRadius: radii.lg, alignItems: 'center', overflow: 'hidden' },
  avatarBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  name: { color: colors.text, fontSize: 20, fontWeight: '300', letterSpacing: 1 },
  subId: { color: colors.muted, fontSize: 12, fontWeight: '300', letterSpacing: 0.5, marginTop: 2 },
  section: { color: colors.muted, fontSize: 11, fontWeight: '400', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: spacing.md, paddingHorizontal: 4 },
  pillShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: radii.md, gap: spacing.md, overflow: 'hidden' },
  pillBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  iconBubble: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.10)', alignItems: 'center', justifyContent: 'center' },
  pillLabel: { color: colors.muted, fontSize: 11, fontWeight: '300', letterSpacing: 0.5, textTransform: 'uppercase' },
  pillValue: { color: colors.text, fontSize: 14, fontWeight: '300', letterSpacing: 0.3, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: radii.md, gap: spacing.sm, overflow: 'hidden' },
  logoutText: { color: '#F87171', fontSize: 14, fontWeight: '300', letterSpacing: 0.5 },
  modalRoot: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  modalShadow: { borderRadius: radii.lg, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  modal: { borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm, overflow: 'hidden' },
  modalBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  modalTitle: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '300', letterSpacing: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)' },
  detailLabel: { color: colors.muted, fontSize: 12, fontWeight: '300', letterSpacing: 0.5, textTransform: 'uppercase' },
  detailValue: { flex: 1, textAlign: 'right', color: colors.text, fontSize: 14, fontWeight: '300', letterSpacing: 0.3 },
});
