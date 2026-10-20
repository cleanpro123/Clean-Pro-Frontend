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
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';
import { useI18n } from '../../shared/i18n/LanguageContext';

const categories = ['All', 'Men', 'Women', 'Home'];
const formCategories = ['Men', 'Women', 'Home'];

export default function AdminItemsScreen({ navigation }) {
  const { colors, gradients } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, gradients), [colors, gradients]);
  const { t } = useI18n();
  const catLabel = (c) => t(`adminItems.category${c}`);
  const [items, setItems] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('All');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
      title: next ? t('adminItems.enableTitle') : t('adminItems.disableTitle'),
      message: next
        ? t('adminItems.enableMessage', { name: it.name })
        : t('adminItems.disableMessage', { name: it.name }),
      confirmLabel: next ? t('adminItems.enable') : t('adminItems.disable'),
      destructive: !next,
      onConfirm: async () => {
        const updated = await api.patch(`/items/${it.id}`, { active: next });
        setItems((prev) => prev.map((x) => (x.id === it.id ? updated : x)));
      },
    });
  };

  const openEditor = (item = null) => {
    setEditingId(item?.id || null);
    setForm(item ? { name: item.name, category: item.category, prices: { ...item.prices } } : { name: '', category: 'Men', prices: {} });
    setError('');
    setAdding(true);
  };

  const save = async () => {
    setError('');
    if (form.name.trim().length < 2) {
      setError(t('adminItems.nameRequired'));
      return;
    }
    // Blank prices omit that service; zero is a valid free service price.
    const prices = {};
    Object.entries(form.prices).forEach(([k, v]) => {
      if (String(v).trim() !== '') prices[k] = Number(v);
    });
    if (Object.keys(prices).length === 0 || Object.values(prices).some(value => !Number.isFinite(value) || value < 0)) {
      setError(t('adminItems.priceRequired'));
      return;
    }
    setBusy(true);
    try {
      const payload = { name: form.name.trim(), category: form.category, prices };
      if (editingId) await api.patch(`/items/${editingId}`, payload);
      else await api.post('/items', payload);
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
        title={t('adminItems.title')}
        onBack={() => navigation.goBack()}
        rightAction={{ icon: 'add-circle-outline', onPress: () => openEditor() }}
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
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{catLabel(c)}</Text>
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
            <Text style={styles.emptyText}>{t('adminItems.empty')}</Text>
          </View>
        ) : (
          visible.map((it) => (
            <View key={it.id} style={styles.cardShadow}>
              <LinearGradient
                colors={
                  it.active
                    ? gradients.panel
                    : [colors.surface, colors.surface]
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
                        <Text style={styles.catChipMiniText}>{catLabel(it.category)}</Text>
                      </View>
                      <Text style={styles.statusLabel}>
                        {it.active ? t('adminItems.available') : t('adminItems.disabled')}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${t('common.edit')} ${it.name}`} onPress={() => openEditor(it)} style={{ padding: 6 }}>
                    <Ionicons name="create-outline" size={20} color={colors.iconAccent} />
                  </TouchableOpacity>
                  <Switch
                    value={it.active}
                    onValueChange={() => toggle(it)}
                    trackColor={{ true: colors.primarySoft, false: colors.surface }}
                    thumbColor={it.active ? colors.primary : '#fff'}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.serviceList}>
                  {services.map((svc) => {
                    const val = it.prices?.[svc.key];
                    return (
                      <View key={svc.key} style={styles.serviceRow}>
                        <View style={styles.serviceIconBubble}>
                          <Ionicons name={svc.icon} size={14} color={colors.iconAccent} />
                        </View>
                        <Text style={styles.serviceLabel}>{svc.name}</Text>
                        <Text
                          style={[
                            styles.servicePrice,
                            val == null && styles.servicePriceMuted,
                          ]}
                        >
                          {val != null ? `QAR ${val}` : '—'}
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
              colors={gradients.panel}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modal}
            >
              <View style={styles.modalBorder} pointerEvents="none" />
              <Text style={styles.modalTitle}>{t(editingId ? 'adminItems.editItem' : 'adminItems.newItem')}</Text>

              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder={t('adminItems.itemNamePlaceholder')}
                  placeholderTextColor={colors.muted}
                  value={form.name}
                  onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                />
              </View>

              <Text style={styles.fieldLabel}>{t('adminItems.categoryLabel')}</Text>
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
                        {catLabel(c)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>{t('adminItems.pricePerService')}</Text>
              {services.map((svc) => (
                <View key={svc.key} style={styles.servicePriceFormRow}>
                  <View style={styles.serviceIconBubble}>
                    <Ionicons name={svc.icon} size={16} color={colors.iconAccent} />
                  </View>
                  <Text style={styles.servicePriceFormLabel}>{svc.name}</Text>
                  <View style={[styles.inputWrap, styles.servicePriceInput]}>
                    <Text style={styles.currency}>QAR </Text>
                    <TextInput
                      style={[styles.input, { flex: 1, paddingLeft: 4 }]}
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                      keyboardType="decimal-pad"
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
                  <Text style={styles.cancelText}>{t('adminItems.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn]}
                  onPress={save}
                  disabled={busy}
                  activeOpacity={0.85}
                >
                  {busy ? <ActivityIndicator color={colors.activeText} /> : <Text style={styles.saveText}>{t(editingId ? 'common.save' : 'adminItems.addItem')}</Text>}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors, gradients) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  tabsWrap: { paddingTop: spacing.sm, paddingBottom: spacing.md },
  tabs: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  tab: { minWidth: 88, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  tabActive: { backgroundColor: colors.activeBackground, borderColor: colors.activeBackground },
  tabText: { color: colors.muted, fontWeight: '300', fontSize: 13, letterSpacing: 0.5 },
  tabTextActive: { color: colors.activeText, fontWeight: '500' },
  list: { padding: spacing.lg, paddingTop: 0, gap: spacing.md, paddingBottom: spacing.xl },
  cardShadow: { borderRadius: radii.lg, shadowColor: '#000', shadowOpacity: 0.30, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  card: { borderTopColor: colors.panelAccent, borderTopWidth: 1, padding: spacing.md, borderRadius: radii.lg, overflow: 'hidden' },
  cardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.panelBorder },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titleBlock: { flex: 1 },
  itemName: { color: colors.text, fontWeight: '500', fontSize: 16, letterSpacing: 0.3 },
  itemNameMuted: { color: colors.muted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  catChipMini: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill, backgroundColor: 'rgba(34, 211, 238, 0.12)' },
  catChipMiniText: { color: colors.accent, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  statusLabel: { color: colors.muted, fontSize: 11, fontWeight: '300', letterSpacing: 0.3 },
  divider: { height: 1, backgroundColor: colors.surface, marginVertical: spacing.sm + 4 },
  serviceList: { gap: 4 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: spacing.sm + 2 },
  serviceIconBubble: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  serviceLabel: { flex: 1, color: colors.textSecondary, fontSize: 13, fontWeight: '300', letterSpacing: 0.3 },
  servicePrice: { color: colors.text, fontSize: 14, fontWeight: '500', minWidth: 60, textAlign: 'right' },
  servicePriceMuted: { color: colors.muted, fontWeight: '300' },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.muted, fontWeight: '300' },
  modalRoot: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  modalShadow: { borderRadius: radii.lg, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  modal: { borderTopColor: colors.panelAccent, borderTopWidth: 1, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm + 4, overflow: 'hidden' },
  modalBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.panelBorder },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '300', letterSpacing: 1, marginBottom: spacing.sm },
  fieldLabel: { color: colors.muted, fontSize: 11, fontWeight: '400', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border },
  input: { backgroundColor: colors.card, paddingVertical: 12, color: colors.text, fontSize: 14, fontWeight: '300' },
  catRow: { flexDirection: 'row', gap: spacing.sm },
  catChip: { flex: 1, paddingVertical: 10, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  catChipActive: { borderColor: colors.activeBackground, backgroundColor: colors.activeBackground },
  catChipText: { color: colors.muted, fontSize: 12, fontWeight: '300', letterSpacing: 0.5 },
  catChipTextActive: { color: colors.activeText },
  servicePriceFormRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  servicePriceFormLabel: { flex: 1, color: colors.text, fontWeight: '300', fontSize: 13, letterSpacing: 0.3 },
  servicePriceInput: { width: 100 },
  currency: { color: colors.muted, fontSize: 14, fontWeight: '400' },
  error: { color: colors.danger, fontSize: 12, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: radii.md, alignItems: 'center', borderWidth: 1 },
  cancelBtn: { borderColor: colors.border, backgroundColor: colors.surface },
  cancelText: { color: colors.muted, fontWeight: '400', letterSpacing: 0.5 },
  saveBtn: { borderColor: colors.activeBackground, backgroundColor: colors.activeBackground },
  saveText: { color: colors.activeText, fontWeight: '400', letterSpacing: 0.5 },
});
