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
import { colors, radii, spacing } from '../../shared/theme/dark';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';

const categories = ['All', 'Men', 'Women', 'Home'];
const formCategories = ['Men', 'Women', 'Home'];

export default function AdminItemsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('All');
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', category: 'Men', prices: {} });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, svc] = await Promise.all([
        api.get('/items/admin'),
        api.get('/services/admin'),
      ]);
      setItems(list);
      setServices(svc);
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

  const visible = items.filter((i) => cat === 'All' || i.category === cat);

  const toggle = (it) => {
    const next = !it.active;
    confirmAction({
      title: next ? 'Enable item?' : 'Disable item?',
      message: next
        ? `${it.name} will be available for customer orders.`
        : `${it.name} will be hidden from new orders.`,
      confirmLabel: next ? 'Enable' : 'Disable',
      destructive: !next,
      onConfirm: async () => {
        const updated = await api.patch(`/items/${it.id}`, { active: next });
        setItems((prev) => prev.map((x) => (x.id === it.id ? updated : x)));
      },
    });
  };

  const save = async () => {
    setError('');
    if (!form.name.trim()) {
      setError('Item name is required.');
      return;
    }
    setBusy(true);
    try {
      const prices = {};
      Object.entries(form.prices).forEach(([k, v]) => {
        const n = Number(v);
        if (Number.isFinite(n) && n > 0) prices[k] = n;
      });
      await api.post('/items', {
        name: form.name,
        category: form.category,
        prices,
      });
      setForm({ name: '', category: 'Men', prices: {} });
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
        title="Items & pricing"
        onBack={() => navigation.goBack()}
        rightAction={{ icon: 'add-circle-outline', onPress: () => setAdding(true) }}
      />

      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {categories.map((c) => {
            const active = c === cat;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setCat(c)}
                activeOpacity={0.85}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.muted} />
        }
      >
        {loading && items.length === 0 ? (
          <ActivityIndicator color={colors.muted} style={{ marginTop: 24 }} />
        ) : visible.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="pricetags-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>No items in this category.</Text>
          </View>
        ) : (
          visible.map((it) => (
            <View key={it.id} style={styles.cardShadow}>
              <LinearGradient
                colors={
                  it.active
                    ? ['#2B3F6E', '#1B2B52']
                    : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.cardBorder} pointerEvents="none" />
                <View style={styles.cardHead}>
                  <View style={styles.titleBlock}>
                    <Text style={[styles.itemName, !it.active && styles.itemNameMuted]}>
                      {it.name}
                    </Text>
                    <View style={styles.metaRow}>
                      <View style={styles.catChipMini}>
                        <Text style={styles.catChipMiniText}>{it.category}</Text>
                      </View>
                      <Text style={styles.statusLabel}>
                        {it.active ? 'Available' : 'Disabled'}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={it.active}
                    onValueChange={() => toggle(it)}
                    trackColor={{ true: 'rgba(52, 211, 153, 0.5)', false: 'rgba(255, 255, 255, 0.15)' }}
                    thumbColor={it.active ? '#34D399' : '#fff'}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.serviceList}>
                  {services.map((svc) => {
                    const val = it.prices?.[svc.key];
                    return (
                      <View key={svc.key} style={styles.serviceRow}>
                        <View style={styles.serviceIconBubble}>
                          <Ionicons name={svc.icon} size={14} color={colors.text} />
                        </View>
                        <Text style={styles.serviceLabel}>{svc.name}</Text>
                        <Text
                          style={[
                            styles.servicePrice,
                            !val && styles.servicePriceMuted,
                          ]}
                        >
                          {val ? `₹${val}` : '—'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
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
              <Text style={styles.modalTitle}>New item</Text>

              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Item name"
                  placeholderTextColor={colors.muted}
                  value={form.name}
                  onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                />
              </View>

              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.catRow}>
                {formCategories.map((c) => {
                  const active = form.category === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setForm((p) => ({ ...p, category: c }))}
                      style={[styles.catChip, active && styles.catChipActive]}
                    >
                      <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Price per service</Text>
              {services.map((svc) => (
                <View key={svc.key} style={styles.servicePriceFormRow}>
                  <View style={styles.serviceIconBubble}>
                    <Ionicons name={svc.icon} size={16} color={colors.text} />
                  </View>
                  <Text style={styles.servicePriceFormLabel}>{svc.name}</Text>
                  <View style={[styles.inputWrap, styles.servicePriceInput]}>
                    <Text style={styles.currency}>₹</Text>
                    <TextInput
                      style={[styles.input, { flex: 1, paddingLeft: 4 }]}
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                      keyboardType="number-pad"
                      value={form.prices[svc.key] != null ? String(form.prices[svc.key]) : ''}
                      onChangeText={(v) =>
                        setForm((p) => ({
                          ...p,
                          prices: { ...p.prices, [svc.key]: v },
                        }))
                      }
                    />
                  </View>
                </View>
              ))}

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
                  {busy ? <ActivityIndicator color="#34D399" /> : <Text style={styles.saveText}>Add item</Text>}
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
  tabsWrap: { paddingTop: spacing.sm, paddingBottom: spacing.md },
  tabs: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  tab: { minWidth: 88, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: 'rgba(43, 63, 110, 0.45)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', alignItems: 'center' },
  tabActive: { backgroundColor: 'rgba(15, 118, 110, 0.45)', borderColor: 'rgba(52, 211, 153, 0.50)' },
  tabText: { color: colors.muted, fontWeight: '300', fontSize: 13, letterSpacing: 0.5 },
  tabTextActive: { color: '#34D399', fontWeight: '500' },
  list: { padding: spacing.lg, paddingTop: 0, gap: spacing.md, paddingBottom: spacing.xl },
  cardShadow: { borderRadius: radii.lg, shadowColor: '#000', shadowOpacity: 0.30, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  card: { padding: spacing.md, borderRadius: radii.lg, overflow: 'hidden' },
  cardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titleBlock: { flex: 1 },
  itemName: { color: colors.text, fontWeight: '500', fontSize: 16, letterSpacing: 0.3 },
  itemNameMuted: { color: colors.muted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  catChipMini: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill, backgroundColor: 'rgba(34, 211, 238, 0.12)' },
  catChipMiniText: { color: '#22D3EE', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  statusLabel: { color: colors.muted, fontSize: 11, fontWeight: '300', letterSpacing: 0.3 },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.06)', marginVertical: spacing.sm + 4 },
  serviceList: { gap: 4 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: spacing.sm + 2 },
  serviceIconBubble: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255, 255, 255, 0.08)', alignItems: 'center', justifyContent: 'center' },
  serviceLabel: { flex: 1, color: colors.textSecondary, fontSize: 13, fontWeight: '300', letterSpacing: 0.3 },
  servicePrice: { color: colors.text, fontSize: 14, fontWeight: '500', minWidth: 60, textAlign: 'right' },
  servicePriceMuted: { color: colors.muted, fontWeight: '300' },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.muted, fontWeight: '300' },
  modalRoot: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  modalShadow: { borderRadius: radii.lg, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  modal: { borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm + 4, overflow: 'hidden' },
  modalBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '300', letterSpacing: 1, marginBottom: spacing.sm },
  fieldLabel: { color: colors.muted, fontSize: 11, fontWeight: '400', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(43, 63, 110, 0.55)', borderRadius: radii.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  input: { paddingVertical: 12, color: colors.text, fontSize: 14, fontWeight: '300' },
  catRow: { flexDirection: 'row', gap: spacing.sm },
  catChip: { flex: 1, paddingVertical: 10, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)', backgroundColor: 'rgba(255, 255, 255, 0.04)', alignItems: 'center' },
  catChipActive: { borderColor: '#34D399', backgroundColor: 'rgba(15, 118, 110, 0.35)' },
  catChipText: { color: colors.muted, fontSize: 12, fontWeight: '300', letterSpacing: 0.5 },
  catChipTextActive: { color: '#34D399' },
  servicePriceFormRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  servicePriceFormLabel: { flex: 1, color: colors.text, fontWeight: '300', fontSize: 13, letterSpacing: 0.3 },
  servicePriceInput: { width: 100 },
  currency: { color: colors.muted, fontSize: 14, fontWeight: '400' },
  error: { color: '#F87171', fontSize: 12, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: radii.md, alignItems: 'center', borderWidth: 1 },
  cancelBtn: { borderColor: 'rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(255, 255, 255, 0.04)' },
  cancelText: { color: colors.muted, fontWeight: '400', letterSpacing: 0.5 },
  saveBtn: { borderColor: 'rgba(52, 211, 153, 0.45)', backgroundColor: 'rgba(15, 118, 110, 0.35)' },
  saveText: { color: '#34D399', fontWeight: '400', letterSpacing: 0.5 },
});
