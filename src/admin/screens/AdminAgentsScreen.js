import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../components/AdminHeader';
import { colors, radii, spacing } from '../../shared/theme/dark';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';

export default function AdminAgentsScreen({ navigation }) {
  const [agents, setAgents] = useState([]);
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mapMenuOpen, setMapMenuOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', place: '', vehicle: '', email: '', password: '', mapId: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, m] = await Promise.all([
        api.get('/agents'),
        api.get('/maps').catch(() => []),
      ]);
      setAgents(a);
      setMaps(m);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = navigation.addListener?.('focus', load);
    return unsub;
  }, [navigation, load]);

  const save = async () => {
    setError('');
    if (!form.name.trim() || !form.phone.trim() || !form.place.trim() || !form.vehicle.trim() || !form.email.trim() || !form.password.trim()) {
      confirmAction({
        title: 'Missing info',
        message: 'Name, phone, place, vehicle, email and password are required.',
        confirmLabel: 'OK',
        onConfirm: () => {},
      });
      return;
    }
    if (!form.mapId) {
      confirmAction({
        title: 'Pick a location',
        message: 'Assign the agent to a map location.',
        confirmLabel: 'OK',
        onConfirm: () => {},
      });
      return;
    }
    setBusy(true);
    try {
      const { name, phone, place, vehicle, email, password, mapId } = form;  
      await api.post('/agents', { name, phone, place, vehicle, email, password, mapId });
      setForm({ name: '', phone: '', place: '', vehicle: '', email: '', password: '', mapId: '' });
      setShowPw(false);
      setMapMenuOpen(false);
      setAdding(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const selectedMap = maps.find((m) => m.id === form.mapId);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader
        title="Agents"
        onBack={() => navigation.goBack()}
        rightAction={{ icon: 'add-circle-outline', onPress: () => setAdding(true) }}
      />

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.muted} />
        }
      >
        {loading && agents.length === 0 ? (
          <ActivityIndicator color={colors.muted} style={{ marginTop: 24 }} />
        ) : agents.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="bicycle-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>No agents yet. Tap + to add one.</Text>
          </View>
        ) : (
          agents.map((a) => (
            <TouchableOpacity
              key={a.id}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AdminAgentDetail', { id: a.id })}
              style={styles.rowShadow}
            >
              <LinearGradient
                colors={['#2B3F6E', '#1B2B52']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.row}
              >
                <View style={styles.rowBorder} pointerEvents="none" />
                <View style={styles.avatar}>
                  <Ionicons name="bicycle" size={20} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{a.name}</Text>
                  <Text style={styles.meta}>{a.phone}</Text>
                  <Text style={styles.metaSm} numberOfLines={1}>
                    {a.place || a.zone || '—'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          a.status === 'blocked'
                            ? 'rgba(248, 113, 113, 0.20)'
                            : a.status === 'active'
                            ? 'rgba(52, 211, 153, 0.18)'
                            : 'rgba(148, 163, 184, 0.20)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            a.status === 'blocked'
                              ? colors.danger
                              : a.status === 'active'
                              ? '#34D399'
                              : colors.muted,
                        },
                      ]}
                    >
                      {a.status === 'blocked'
                        ? 'Blocked'
                        : a.status === 'active'
                        ? 'Active'
                        : 'Offline'}
                    </Text>
                  </View>
                  <Text style={styles.todayCount}>{a.pickupsToday || 0} today</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={adding}
        animationType="slide"
        transparent
        onRequestClose={() => setAdding(false)}
      >
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
              <Text style={styles.modalTitle}>New agent</Text>

              {[
                { k: 'name', label: 'Name' },
                { k: 'phone', label: 'Phone', kb: 'phone-pad' },
                { k: 'place', label: 'Place', kb: 'default' },
                { k: 'vehicle', label: 'Vehicle-number', kb: 'vehicle-number' },
                { k: 'email', label: 'Email', kb: 'email-address' },
              ].map((f) => (
                <View key={f.k} style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    placeholder={f.label}
                    placeholderTextColor={colors.muted}
                    keyboardType={f.kb}
                    autoCapitalize={f.k === 'email' ? 'none' : 'sentences'}
                    value={form[f.k]}
                    onChangeText={(v) => setForm((p) => ({ ...p, [f.k]: v }))}
                  />
                </View>
              ))}
              <View style={styles.inputWrap}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPw}
                  value={form.password}
                  onChangeText={(v) => setForm((p) => ({ ...p, password: v }))}
                />
                <TouchableOpacity onPress={() => setShowPw((s) => !s)} style={styles.eyeBtn}>
                  <Ionicons name={showPw ? 'eye' : 'eye-off'} size={18} color={colors.muted} />
                </TouchableOpacity>
              </View>
               
              <TouchableOpacity
                onPress={() => setMapMenuOpen((v) => !v)}
                style={[styles.inputWrap, styles.mapPicker]}
                activeOpacity={0.85}
              >
                <Ionicons name="location-outline" size={16} color={colors.muted} />
                <Text
                  style={[
                    styles.input,
                    { color: selectedMap ? colors.text : colors.muted, paddingVertical: 12 },
                  ]}
                  numberOfLines={1}
                >
                  {selectedMap ? selectedMap.name : 'Assign a map location'}
                </Text>
                <Ionicons
                  name={mapMenuOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.muted}
                />
              </TouchableOpacity>
              {mapMenuOpen ? (
                <View style={styles.mapMenu}>
                  {maps.length === 0 ? (
                    <Text style={styles.mapMenuEmpty}>
                      No locations yet. Add one in the Maps section.
                    </Text>
                  ) : (
                    maps.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => {
                          setForm((p) => ({ ...p, mapId: m.id }));
                          setMapMenuOpen(false);
                        }}
                        style={[
                          styles.mapMenuRow,
                          m.id === form.mapId && styles.mapMenuRowActive,
                        ]}
                      >
                        <Ionicons
                          name={m.id === form.mapId ? 'radio-button-on' : 'radio-button-off'}
                          size={16}
                          color={m.id === form.mapId ? '#34D399' : colors.muted}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mapMenuName}>{m.name}</Text>
                          <Text style={styles.mapMenuPlace} numberOfLines={1}>
                            {m.place}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              ) : null}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setAdding(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn]}
                  onPress={save}
                  disabled={busy}
                  activeOpacity={0.85}
                >
                  {busy ? <ActivityIndicator color="#34D399" /> : <Text style={styles.saveText}>Add agent</Text>}
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
  list: { padding: spacing.lg, gap: spacing.sm + 4, paddingBottom: spacing.xl },
  rowShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  row: { flexDirection: 'row', padding: spacing.md, borderRadius: radii.md, gap: spacing.md, alignItems: 'center', overflow: 'hidden' },
  rowBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.10)', alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontWeight: '400', letterSpacing: 0.3 },
  meta: { color: colors.textSecondary, fontSize: 12, fontWeight: '300', marginTop: 2 },
  metaSm: { color: colors.muted, fontSize: 11, fontWeight: '300', marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill },
  statusText: { fontSize: 10, fontWeight: '700' },
  todayCount: { color: colors.muted, fontSize: 11, fontWeight: '300' },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.muted, fontWeight: '300' },
  modalRoot: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  modalShadow: { borderRadius: radii.lg, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  modal: { borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm + 4, overflow: 'hidden' },
  modalBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '300', letterSpacing: 1, marginBottom: spacing.sm },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(43, 63, 110, 0.55)', borderRadius: radii.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  input: { flex: 1, paddingVertical: 12, color: colors.text, fontSize: 14, fontWeight: '300' },
  eyeBtn: { paddingLeft: 8, paddingVertical: 8 },
  mapPicker: { paddingVertical: 4 },
  mapMenu: {
    borderRadius: radii.md,
    backgroundColor: 'rgba(43, 63, 110, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  mapMenuEmpty: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '300',
    padding: spacing.md,
    textAlign: 'center',
  },
  mapMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  mapMenuRowActive: { backgroundColor: 'rgba(15, 118, 110, 0.20)' },
  mapMenuName: { color: colors.text, fontSize: 13, fontWeight: '400' },
  mapMenuPlace: { color: colors.muted, fontSize: 11, fontWeight: '300', marginTop: 2 },
  error: { color: '#F87171', fontSize: 12, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: radii.md, alignItems: 'center', borderWidth: 1 },
  cancelBtn: { borderColor: 'rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(255, 255, 255, 0.04)' },
  cancelText: { color: colors.muted, fontWeight: '400', letterSpacing: 0.5 },
  saveBtn: { borderColor: 'rgba(52, 211, 153, 0.45)', backgroundColor: 'rgba(15, 118, 110, 0.35)' },
  saveText: { color: '#34D399', fontWeight: '400', letterSpacing: 0.5 },
});
