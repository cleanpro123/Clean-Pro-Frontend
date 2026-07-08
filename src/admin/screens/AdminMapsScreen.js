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
import MapPreview from '../components/MapPreview';
import { colors, radii, spacing } from '../../shared/theme/dark';
import { api } from '../../shared/api/client';

export default function AdminMapsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', place: '', description: '', pickupRadius: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api.get('/maps'));
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
    if (!form.name.trim() || !form.place.trim()) {
      setError('Name and place are required.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/maps', form);
      setForm({ name: '', place: '', description: '', pickupRadius: '' });
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
        title="Maps"
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
        {loading && items.length === 0 ? (
          <ActivityIndicator color={colors.muted} style={{ marginTop: 24 }} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>No locations yet.</Text>
          </View>
        ) : (
          items.map((m) => (
            <TouchableOpacity
              key={m.id}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AdminMapDetail', { id: m.id })}
              style={styles.rowShadow}
            >
              <LinearGradient
                colors={['#2B3F6E', '#1B2B52']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.row}
              >
                <View style={styles.rowBorder} pointerEvents="none" />
                <View style={styles.iconBubble}>
                  <Ionicons name="location-sharp" size={20} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{m.name}</Text>
                  <Text style={styles.place} numberOfLines={2}>{m.place}</Text>
                  <Text style={styles.radius}>Radius · {m.pickupRadius || '—'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </LinearGradient>
            </TouchableOpacity>
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
              <Text style={styles.modalTitle}>New location</Text>

              <MapPreview place={form.place || null} height={120} />

              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Location name"
                  placeholderTextColor={colors.muted}
                  value={form.name}
                  onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                />
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Place / address"
                  placeholderTextColor={colors.muted}
                  value={form.place}
                  onChangeText={(v) => setForm((p) => ({ ...p, place: v }))}
                />
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  style={[styles.input, { minHeight: 60, paddingTop: 12 }]}
                  placeholder="Description (optional)"
                  placeholderTextColor={colors.muted}
                  multiline
                  textAlignVertical="top"
                  value={form.description}
                  onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
                />
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Pickup radius (e.g. 5 km)"
                  placeholderTextColor={colors.muted}
                  value={form.pickupRadius}
                  onChangeText={(v) => setForm((p) => ({ ...p, pickupRadius: v }))}
                />
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
                  {busy ? <ActivityIndicator color="#34D399" /> : <Text style={styles.saveText}>Add location</Text>}
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
  place: { color: colors.textSecondary, fontSize: 12, fontWeight: '300', marginTop: 2 },
  radius: { color: colors.muted, fontSize: 11, fontWeight: '300', marginTop: 4 },
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
  error: { color: '#F87171', fontSize: 12, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: radii.md, alignItems: 'center', borderWidth: 1 },
  cancelBtn: { borderColor: 'rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(255, 255, 255, 0.04)' },
  cancelText: { color: colors.muted, fontWeight: '400', letterSpacing: 0.5 },
  saveBtn: { borderColor: 'rgba(52, 211, 153, 0.45)', backgroundColor: 'rgba(15, 118, 110, 0.35)' },
  saveText: { color: '#34D399', fontWeight: '400', letterSpacing: 0.5 },
});
