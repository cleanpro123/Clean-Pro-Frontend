import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../components/AdminHeader';
import { colors, gradients, radii, spacing } from '../../shared/theme/dark';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';

export default function AdminOffersScreen({ navigation }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    code: '', label: '', discount: '', minOrder: '', validTill: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOffers(await api.get('/offers/admin'));
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

  const toggle = (o) => {
    const next = !o.active;
    confirmAction({
      title: next ? 'Activate offer?' : 'Deactivate offer?',
      message: next
        ? `${o.code} will be available to customers.`
        : `${o.code} will be hidden from customers.`,
      confirmLabel: next ? 'Activate' : 'Deactivate',
      destructive: !next,
      onConfirm: async () => {
        const updated = await api.patch(`/offers/${o.id}`, { active: next });
        setOffers((prev) => prev.map((x) => (x.id === o.id ? updated : x)));
      },
    });
  };

  const remove = (o) =>
    confirmAction({
      title: 'Delete offer?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        await api.delete(`/offers/${o.id}`);
        setOffers((prev) => prev.filter((x) => x.id !== o.id));
      },
    });

  const save = async () => {
    setError('');
    if (!form.code.trim() || !form.discount.trim()) {
      setError('Code and discount are required.');
      return;
    }
    setBusy(true);
    try {
      const body = {
        code: form.code.toUpperCase(),
        label: form.label || `${form.discount} off`,
        discount: form.discount,
        minOrder: Number(form.minOrder) || 0,
      };
      if (form.validTill) body.validTill = form.validTill;
      await api.post('/offers', body);
      setForm({ code: '', label: '', discount: '', minOrder: '', validTill: '' });
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
        title="Offers"
        onBack={() => navigation.goBack()}
        rightAction={{ icon: 'add-circle-outline', onPress: () => setAdding(true) }}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.muted} />
        }
      >
        {loading && offers.length === 0 ? (
          <ActivityIndicator color={colors.muted} style={{ marginTop: 24 }} />
        ) : offers.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="gift-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>No offers yet. Tap + to create one.</Text>
          </View>
        ) : (
          offers.map((o) => (
            <LinearGradient
              key={o.id}
              colors={
                o.active
                  ? gradients.aqua
                  : ['rgba(255, 255, 255, 0.10)', 'rgba(255, 255, 255, 0.04)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.topRow}>
                <View>
                  <Text style={styles.code}>{o.code}</Text>
                  <Text style={styles.label}>{o.label}</Text>
                </View>
                <Text style={styles.discount}>{o.discount}</Text>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="cash-outline" size={14} color="#fff" />
                  <Text style={styles.metaText}>Min ₹{o.minOrder}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color="#fff" />
                  <Text style={styles.metaText}>
                    Until {o.validTill ? new Date(o.validTill).toLocaleDateString() : '—'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={14} color="#fff" />
                  <Text style={styles.metaText}>{o.usage || 0} used</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{o.active ? 'Active' : 'Inactive'}</Text>
                  <Switch
                    value={o.active}
                    onValueChange={() => toggle(o)}
                    trackColor={{
                      true: 'rgba(255,255,255,0.6)',
                      false: 'rgba(255, 255, 255, 0.25)',
                    }}
                    thumbColor="#fff"
                  />
                </View>
                <TouchableOpacity onPress={() => remove(o)} style={styles.trashBtn}>
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
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
              <Text style={styles.modalTitle}>New offer</Text>

              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Code (e.g. SUMMER20)"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                  value={form.code}
                  onChangeText={(v) => setForm((p) => ({ ...p, code: v }))}
                />
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Label"
                  placeholderTextColor={colors.muted}
                  value={form.label}
                  onChangeText={(v) => setForm((p) => ({ ...p, label: v }))}
                />
              </View>
              <View style={styles.priceRow}>
                <View style={[styles.inputWrap, { flex: 1 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Discount (20% or ₹50)"
                    placeholderTextColor={colors.muted}
                    value={form.discount}
                    onChangeText={(v) => setForm((p) => ({ ...p, discount: v }))}
                  />
                </View>
                <View style={[styles.inputWrap, { flex: 1 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Min order"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    value={form.minOrder}
                    onChangeText={(v) => setForm((p) => ({ ...p, minOrder: v }))}
                  />
                </View>
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Valid till (YYYY-MM-DD)"
                  placeholderTextColor={colors.muted}
                  value={form.validTill}
                  onChangeText={(v) => setForm((p) => ({ ...p, validTill: v }))}
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
                  {busy ? <ActivityIndicator color="#34D399" /> : <Text style={styles.saveText}>Add offer</Text>}
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
  card: { borderRadius: radii.lg, padding: spacing.lg },
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  code: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  label: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, marginTop: 4 },
  discount: { color: '#fff', fontSize: 28, fontWeight: '800' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleLabel: { color: '#fff', fontWeight: '700' },
  trashBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.muted },
  modalRoot: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  modalShadow: { borderRadius: radii.lg, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  modal: { borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm + 4, overflow: 'hidden' },
  modalBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '300', letterSpacing: 1, marginBottom: spacing.sm },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(43, 63, 110, 0.55)', borderRadius: radii.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  input: { flex: 1, paddingVertical: 12, color: colors.text, fontSize: 14, fontWeight: '300' },
  priceRow: { flexDirection: 'row', gap: spacing.sm },
  error: { color: '#F87171', fontSize: 12, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: radii.md, alignItems: 'center', borderWidth: 1 },
  cancelBtn: { borderColor: 'rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(255, 255, 255, 0.04)' },
  cancelText: { color: colors.muted, fontWeight: '400', letterSpacing: 0.5 },
  saveBtn: { borderColor: 'rgba(52, 211, 153, 0.45)', backgroundColor: 'rgba(15, 118, 110, 0.35)' },
  saveText: { color: '#34D399', fontWeight: '400', letterSpacing: 0.5 },
});
