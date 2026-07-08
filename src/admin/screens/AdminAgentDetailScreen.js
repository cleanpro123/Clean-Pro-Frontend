import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
  Modal,
  KeyboardAvoidingView,
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

function PillRow({ icon, label, value, right, onPress, mono }) {
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
          <Text style={[styles.pillValue, mono && styles.mono]}>{value}</Text>
        </View>
        {right}
      </LinearGradient>
    </Wrap>
  );
}

export default function AdminAgentDetailScreen({ route, navigation }) {
  const id = route.params?.id;
  const [agent, setAgent] = useState(null);
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editLoc, setEditLoc] = useState(false);
  const [draftMapId, setDraftMapId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [a, m] = await Promise.all([
        api.get(`/agents/${id}`),
        api.get('/maps').catch(() => []),
      ]);
      setAgent(a);
      setMaps(m);
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
        <AdminHeader title="Agent details" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.muted} style={{ marginTop: 32 }} />
      </SafeAreaView>
    );
  }
  if (!agent) return null;
  const isActive = agent.status === 'active';
  const isBlocked = agent.status === 'blocked';
  const currentMap = maps.find((m) => m.id === agent.mapId);

  const openEdit = () => {
    setDraftMapId(agent.mapId || null);
    setEditLoc(true);
  };

  const saveLocation = async () => {
    if (!draftMapId) return;
    const updated = await api.patch(`/agents/${agent.id}`, { mapId: draftMapId });
    setAgent(updated);
    setEditLoc(false);
  };

  const toggleBlock = () =>
    confirmAction({
      title: isBlocked ? 'Unblock agent?' : 'Block agent?',
      message: isBlocked
        ? `${agent.name} will be able to take new pickups again.`
        : `${agent.name} will not be able to take new pickups.`,
      confirmLabel: isBlocked ? 'Unblock' : 'Block',
      destructive: !isBlocked,
      onConfirm: async () => {
        const updated = await api.patch(`/agents/${agent.id}`, {
          status: isBlocked ? 'active' : 'blocked',
        });
        setAgent(updated);
      },
    });

  const remove = () =>
    confirmAction({
      title: 'Delete agent?',
      message: `${agent.name} will be permanently removed. This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        await api.delete(`/agents/${agent.id}`);
        navigation.goBack();
      },
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title="Agent details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroShadow}>
          <LinearGradient
            colors={['#33497F', '#1B2B52']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroBorder} pointerEvents="none" />
            <View style={styles.avatar}>
              <Ionicons name="bicycle" size={32} color={colors.text} />
            </View>
            <Text style={styles.name}>{agent.name}</Text>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isBlocked
                    ? 'rgba(248, 113, 113, 0.20)'
                    : isActive
                    ? 'rgba(52, 211, 153, 0.18)'
                    : 'rgba(148, 163, 184, 0.20)',
                },
              ]}
            >
              <Ionicons
                name={isBlocked ? 'ban' : isActive ? 'radio' : 'moon'}
                size={12}
                color={isBlocked ? colors.danger : isActive ? '#34D399' : colors.muted}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: isBlocked ? colors.danger : isActive ? '#34D399' : colors.muted,
                  },
                ]}
              >
                {isBlocked ? 'Blocked' : isActive ? 'On shift' : 'Offline'}
              </Text>
            </View>
            <Text style={styles.subId}>Agent ID · {agent.id}</Text>
          </LinearGradient>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Location</Text>
          <TouchableOpacity onPress={openEdit} style={styles.editBtn} activeOpacity={0.85}>
            <Ionicons name="create-outline" size={14} color="#34D399" />
            <Text style={styles.editBtnText}>Update</Text>
          </TouchableOpacity>
        </View>
        <MapPreview place={agent.place || agent.zone} />

        <Text style={styles.section}>Credentials</Text>
        <PillRow
          icon="mail"
          label="Email"
          value={agent.email || '—'}
          onPress={agent.email ? () => Linking.openURL(`mailto:${agent.email}`) : undefined}
        />

        <Text style={styles.section}>Contact</Text>
        <PillRow
          icon="call"
          label="Phone"
          value={agent.phone}
          onPress={() => Linking.openURL(`tel:${(agent.phone || '').replace(/\s/g, '')}`)}
        />
        <PillRow icon="location-sharp" label="Place" value={agent.place || agent.zone || '—'} />
        {agent.vehicle ? <PillRow icon="car-sport" label="Vehicle" value={agent.vehicle} /> : null}

        <Text style={styles.section}>Activity</Text>
        <PillRow icon="cube" label="Pickups today" value={String(agent.pickupsToday ?? 0)} />

        <View style={styles.bottomActions}>
          <TouchableOpacity activeOpacity={0.85} onPress={toggleBlock} style={styles.actionShadow}>
            <LinearGradient
              colors={isBlocked ? ['#0F766E', '#1B2B52'] : ['#5C3F1F', '#2D1F0F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionBtn}
            >
              <View style={styles.pillBorder} pointerEvents="none" />
              <Ionicons
                name={isBlocked ? 'lock-open' : 'ban'}
                size={18}
                color={isBlocked ? '#34D399' : '#FBBF24'}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: isBlocked ? '#34D399' : '#FBBF24' },
                ]}
              >
                {isBlocked ? 'Unblock agent' : 'Block agent'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} onPress={remove} style={styles.actionShadow}>
            <LinearGradient
              colors={['#5C1F1F', '#2D0F0F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionBtn}
            >
              <View style={styles.pillBorder} pointerEvents="none" />
              <Ionicons name="trash-outline" size={18} color="#F87171" />
              <Text style={[styles.actionText, { color: '#F87171' }]}>Delete agent</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={editLoc} animationType="slide" transparent onRequestClose={() => setEditLoc(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <View style={styles.modalBackdrop} />
          <View style={styles.modalShadow}>
            <LinearGradient
              colors={['#2B3F6E', '#1B2B52']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modal}
            >
              <View style={styles.modalBorder} pointerEvents="none" />
              <Text style={styles.modalTitle}>Assign map location</Text>
              <MapPreview
                place={maps.find((m) => m.id === draftMapId)?.place || null}
                height={120}
              />
              <ScrollView style={styles.mapMenu} contentContainerStyle={{ paddingVertical: 4 }}>
                {maps.length === 0 ? (
                  <Text style={styles.mapMenuEmpty}>
                    No locations yet. Add one in the Maps section.
                  </Text>
                ) : (
                  maps.map((m) => {
                    const sel = m.id === draftMapId;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => setDraftMapId(m.id)}
                        style={[styles.mapMenuRow, sel && styles.mapMenuRowActive]}
                      >
                        <Ionicons
                          name={sel ? 'radio-button-on' : 'radio-button-off'}
                          size={16}
                          color={sel ? '#34D399' : colors.muted}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mapMenuName}>{m.name}</Text>
                          <Text style={styles.mapMenuPlace} numberOfLines={1}>
                            {m.place}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setEditLoc(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn]}
                  onPress={saveLocation}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveText}>Save location</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  heroShadow: { borderRadius: radii.lg, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  hero: { padding: spacing.lg, borderRadius: radii.lg, alignItems: 'center', overflow: 'hidden' },
  heroBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255, 255, 255, 0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  name: { color: colors.text, fontSize: 20, fontWeight: '300', letterSpacing: 0.5 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, marginTop: 6 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  subId: { color: colors.muted, fontSize: 11, fontWeight: '300', letterSpacing: 0.5, marginTop: 6 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, paddingHorizontal: 4 },
  section: { color: colors.muted, fontSize: 11, fontWeight: '400', textTransform: 'uppercase', letterSpacing: 1.5 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: 'rgba(15, 118, 110, 0.30)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.45)' },
  editBtnText: { color: '#34D399', fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  pillShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: radii.md, gap: spacing.md, overflow: 'hidden' },
  pillBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  iconBubble: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.10)', alignItems: 'center', justifyContent: 'center' },
  pillLabel: { color: colors.muted, fontSize: 11, fontWeight: '300', letterSpacing: 0.5, textTransform: 'uppercase' },
  pillValue: { color: colors.text, fontSize: 14, fontWeight: '300', letterSpacing: 0.3, marginTop: 2 },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) },
  bottomActions: { marginTop: spacing.lg, gap: spacing.sm + 4 },
  actionShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: radii.md, gap: spacing.sm, overflow: 'hidden' },
  actionText: { fontSize: 14, fontWeight: '400', letterSpacing: 0.5 },
  modalRoot: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  modalShadow: { borderRadius: radii.lg, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  modal: { borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm + 4, overflow: 'hidden' },
  modalBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '300', letterSpacing: 1 },
  inputWrap: { backgroundColor: 'rgba(43, 63, 110, 0.55)', borderRadius: radii.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  input: { paddingVertical: 12, color: colors.text, fontSize: 14, fontWeight: '300', minHeight: 70, paddingTop: 12 },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: radii.md, alignItems: 'center', borderWidth: 1 },
  mapMenu: {
    maxHeight: 220,
    borderRadius: radii.md,
    backgroundColor: 'rgba(43, 63, 110, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  mapMenuEmpty: { color: colors.muted, fontSize: 12, fontWeight: '300', padding: spacing.md, textAlign: 'center' },
  mapMenuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  mapMenuRowActive: { backgroundColor: 'rgba(15, 118, 110, 0.20)' },
  mapMenuName: { color: colors.text, fontSize: 13, fontWeight: '400' },
  mapMenuPlace: { color: colors.muted, fontSize: 11, fontWeight: '300', marginTop: 2 },
  cancelBtn: { borderColor: 'rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(255, 255, 255, 0.04)' },
  cancelText: { color: colors.muted, fontWeight: '400', letterSpacing: 0.5 },
  saveBtn: { borderColor: 'rgba(52, 211, 153, 0.45)', backgroundColor: 'rgba(15, 118, 110, 0.35)' },
  saveText: { color: '#34D399', fontWeight: '400', letterSpacing: 0.5 },
});
