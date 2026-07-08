import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
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

const iconChoices = [
  'water-outline',
  'shirt-outline',
  'flame-outline',
  'sparkles-outline',
  'cube-outline',
  'snow-outline',
];

export default function AdminServicesScreen({ navigation }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    key: '',
    name: '',
    description: '',
    icon: 'water-outline',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setServices(await api.get('/services/admin'));
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

  const toggleActive = (svc) => {
    const next = svc.active === false ? true : false;
    confirmAction({
      title: next ? 'Activate service?' : 'Deactivate service?',
      message: next
        ? `${svc.name} will be available for new orders.`
        : `${svc.name} will be hidden from customers.`,
      confirmLabel: next ? 'Activate' : 'Deactivate',
      destructive: !next,
      onConfirm: async () => {
        const updated = await api.patch(`/services/${svc.id}`, { active: next });
        setServices((prev) => prev.map((s) => (s.id === svc.id ? updated : s)));
      },
    });
  };

  const save = async () => {
    setError('');
    if (!form.key.trim() || !form.name.trim()) {
      setError('Key and name are required.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/services', {
        key: form.key.trim().toLowerCase(),
        name: form.name,
        description: form.description || '',
        icon: form.icon,
      });
      setForm({ key: '', name: '', description: '', icon: 'water-outline' });
      setAdding(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader
        title="Services"
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
        {loading && services.length === 0 ? (
          <ActivityIndicator color={colors.muted} style={{ marginTop: 24 }} />
        ) : services.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="layers-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>No services yet.</Text>
          </View>
        ) : (
          services.map((s) => (
            <View key={s.id} style={styles.rowShadow}>
              <LinearGradient
                colors={['#2B3F6E', '#1B2B52']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.row}
              >
                <View style={styles.rowBorder} pointerEvents="none" />
                <View style={styles.iconBubble}>
                  <Ionicons name={s.icon} size={20} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{s.name}</Text>
                  <Text style={styles.desc} numberOfLines={2}>
                    {s.description}
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          s.active === false
                            ? 'rgba(148, 163, 184, 0.18)'
                            : 'rgba(52, 211, 153, 0.18)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: s.active === false ? colors.muted : '#34D399' },
                      ]}
                    >
                      {s.active === false ? 'Inactive' : 'Active'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={s.active !== false}
                  onValueChange={() => toggleActive(s)}
                  trackColor={{
                    true: 'rgba(52, 211, 153, 0.5)',
                    false: 'rgba(255, 255, 255, 0.15)',
                  }}
                  thumbColor={s.active !== false ? '#34D399' : '#fff'}
                />
              </LinearGradient>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={adding} animationType="slide" transparent onRequestClose={() => setAdding(false)}>
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
              <Text style={styles.modalTitle}>New service</Text>

              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Key (e.g. steam)"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  value={form.key}
                  onChangeText={(v) => setForm((p) => ({ ...p, key: v }))}
                />
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Name (e.g. Steam Press)"
                  placeholderTextColor={colors.muted}
                  value={form.name}
                  onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                />
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  style={[styles.input, { minHeight: 70, paddingTop: 12 }]}
                  placeholder="Description"
                  placeholderTextColor={colors.muted}
                  multiline
                  textAlignVertical="top"
                  value={form.description}
                  onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
                />
              </View>

              <Text style={styles.iconLabel}>Icon</Text>
              <View style={styles.iconGrid}>
                {iconChoices.map((ic) => {
                  const active = form.icon === ic;
                  return (
                    <TouchableOpacity
                      key={ic}
                      onPress={() => setForm((p) => ({ ...p, icon: ic }))}
                      style={[styles.iconChoice, active && styles.iconChoiceActive]}
                    >
                      <Ionicons name={ic} size={20} color={colors.text} />
                    </TouchableOpacity>
                  );
                })}
              </View>

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
                  {busy ? <ActivityIndicator color="#34D399" /> : <Text style={styles.saveText}>Add service</Text>}
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
  iconBubble: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.10)', alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontWeight: '400', letterSpacing: 0.3 },
  desc: { color: colors.textSecondary, fontSize: 12, fontWeight: '300', marginTop: 2 },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill, marginTop: 6 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.muted, fontWeight: '300' },
  modalRoot: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  modalShadow: { borderRadius: radii.lg, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  modal: { borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm + 4, overflow: 'hidden' },
  modalBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '300', letterSpacing: 1, marginBottom: spacing.sm },
  inputWrap: { backgroundColor: 'rgba(43, 63, 110, 0.55)', borderRadius: radii.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  input: { paddingVertical: 12, color: colors.text, fontSize: 14, fontWeight: '300' },
  iconLabel: { color: colors.muted, fontSize: 11, fontWeight: '400', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  iconGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  iconChoice: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: 'rgba(255, 255, 255, 0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  iconChoiceActive: { borderColor: '#34D399', backgroundColor: 'rgba(15, 118, 110, 0.35)' },
  error: { color: '#F87171', fontSize: 12, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: radii.md, alignItems: 'center', borderWidth: 1 },
  cancelBtn: { borderColor: 'rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(255, 255, 255, 0.04)' },
  cancelText: { color: colors.muted, fontWeight: '400', letterSpacing: 0.5 },
  saveBtn: { borderColor: 'rgba(52, 211, 153, 0.45)', backgroundColor: 'rgba(15, 118, 110, 0.35)' },
  saveText: { color: '#34D399', fontWeight: '400', letterSpacing: 0.5 },
});
