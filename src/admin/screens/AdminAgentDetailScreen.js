import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import MapPreview from '../../shared/components/MapPreview';
import DayPickerModal from '../../shared/components/DayPickerModal';
import { colors, radii, spacing } from '../../shared/theme/dark';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';
import { useI18n } from '../../shared/i18n/LanguageContext';
import {
  PERIODS,
  dayLabels,
  startOfDay,
  rangeFor,
  buildLast7Days,
} from '../../shared/utils/period';

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
  const { t } = useI18n();
  const id = route.params?.id;
  const [agent, setAgent] = useState(null);
  const [maps, setMaps] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editLoc, setEditLoc] = useState(false);
  const [draftMapId, setDraftMapId] = useState(null);

  const [period, setPeriod] = useState('today');
  const [customDate, setCustomDate] = useState(startOfDay(new Date()));
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, m, o] = await Promise.all([
        api.get(`/agents/${id}`),
        api.get('/maps').catch(() => []),
        // Full order history so per-agent date filters (custom day / last year)
        // aren't limited to the newest page.
        api.getAll('/requests').catch(() => []),
      ]);
      setAgent(a);
      setMaps(m);
      setOrders(o);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Only this agent's orders. agentId is serialized as a string id on the order.
  const agentOrders = useMemo(
    () => orders.filter((o) => o.agentId && String(o.agentId) === String(id)),
    [orders, id]
  );
  const range = useMemo(() => rangeFor(period, customDate), [period, customDate]);

  // Per-agent period metrics come from the server-side stats endpoint (scoped by
  // agentId), so custom day / last year are accurate in the DB rather than
  // depending on client-side filtering.
  const [stats, setStats] = useState({ orders: 0, delivered: 0, revenue: 0 });
  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    const qs =
      `from=${range.start.toISOString()}&to=${range.end.toISOString()}&agentId=${id}`;
    api
      .get(`/requests/stats?${qs}`)
      .then((s) => !cancelled && setStats(s))
      .catch(() => !cancelled && setStats({ orders: 0, delivered: 0, revenue: 0 }));
    return () => {
      cancelled = true;
    };
  }, [range, id]);

  const periodOrders = stats.orders;
  const periodDelivered = stats.delivered;
  const periodRevenue = stats.revenue;
  const orderBuckets = useMemo(() => buildLast7Days(agentOrders, 'count'), [agentOrders]);
  const maxOrders = Math.max(1, ...orderBuckets.map((b) => b.value));

  const handlePeriod = (key) => {
    if (key === 'custom') {
      setPeriod('custom');
      setPickerOpen(true);
    } else {
      setPeriod(key);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AdminHeader title={t('adminAgentDetail.title')} onBack={() => navigation.goBack()} />
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
      title: isBlocked
        ? t('adminAgentDetail.unblockTitle')
        : t('adminAgentDetail.blockTitle'),
      message: isBlocked
        ? t('adminAgentDetail.unblockMessage', { name: agent.name })
        : t('adminAgentDetail.blockMessage', { name: agent.name }),
      confirmLabel: isBlocked
        ? t('adminAgentDetail.unblockConfirm')
        : t('adminAgentDetail.blockConfirm'),
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
      title: t('adminAgentDetail.deleteTitle'),
      message: t('adminAgentDetail.deleteMessage', { name: agent.name }),
      confirmLabel: t('adminAgentDetail.deleteConfirm'),
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
                {isBlocked
                  ? t('adminAgentDetail.statusBlocked')
                  : isActive
                  ? t('adminAgentDetail.statusOnShift')
                  : t('adminAgentDetail.statusOffline')}
              </Text>
            </View>
            <Text style={styles.subId}>{t('adminAgentDetail.agentId', { id: agent.id })}</Text>
          </LinearGradient>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>{t('adminAgentDetail.location')}</Text>
          <TouchableOpacity onPress={openEdit} style={styles.editBtn} activeOpacity={0.85}>
            <Ionicons name="create-outline" size={14} color="#34D399" />
            <Text style={styles.editBtnText}>{t('adminAgentDetail.update')}</Text>
          </TouchableOpacity>
        </View>
        <MapPreview place={agent.place || agent.zone} />

        <Text style={styles.section}>{t('adminAgentDetail.credentials')}</Text>
        <PillRow
          icon="mail"
          label={t('adminAgentDetail.email')}
          value={agent.email || '—'}
          onPress={agent.email ? () => Linking.openURL(`mailto:${agent.email}`) : undefined}
        />

        <Text style={styles.section}>{t('adminAgentDetail.contact')}</Text>
        <PillRow
          icon="call"
          label={t('adminAgentDetail.phone')}
          value={agent.phone}
          onPress={() => Linking.openURL(`tel:${(agent.phone || '').replace(/\s/g, '')}`)}
        />
        <PillRow icon="location-sharp" label={t('adminAgentDetail.place')} value={agent.place || agent.zone || '—'} />
        {agent.vehicle ? <PillRow icon="car-sport" label={t('adminAgentDetail.vehicle')} value={agent.vehicle} /> : null}

        <Text style={styles.section}>{t('adminAgentDetail.ordersActivity')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodRow}
        >
          {PERIODS.map((p) => {
            const active = period === p.key;
            const label =
              p.key === 'custom' && period === 'custom'
                ? customDate.toLocaleDateString()
                : p.label;
            return (
              <TouchableOpacity
                key={p.key}
                onPress={() => handlePeriod(p.key)}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.85}
              >
                {p.key === 'custom' && (
                  <Ionicons
                    name="calendar-outline"
                    size={13}
                    color={active ? '#052e2b' : colors.muted}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{periodOrders}</Text>
            <Text style={styles.metricLabel}>{t('adminAgentDetail.ordersMetric', { label: range.label })}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{periodDelivered}</Text>
            <Text style={styles.metricLabel}>{t('adminAgentDetail.delivered')}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>QAR {periodRevenue.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>{t('adminAgentDetail.revenue')}</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t('adminAgentDetail.last7DaysOrders')}</Text>
          <View style={styles.chart}>
            {orderBuckets.map((b, i) => (
              <View key={i} style={styles.bar}>
                <Text style={styles.barValue}>{b.value || ''}</Text>
                <View
                  style={[
                    styles.barFill,
                    { height: `${(b.value / maxOrders) * 100}%` },
                    i === orderBuckets.length - 1 && { backgroundColor: '#34D399', opacity: 1 },
                  ]}
                />
                <Text style={styles.barLabel}>{dayLabels[b.dow]}</Text>
              </View>
            ))}
          </View>
        </View>

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
                {isBlocked
                  ? t('adminAgentDetail.unblockAgent')
                  : t('adminAgentDetail.blockAgent')}
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
              <Text style={[styles.actionText, { color: '#F87171' }]}>{t('adminAgentDetail.deleteAgent')}</Text>
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
              <Text style={styles.modalTitle}>{t('adminAgentDetail.assignMapLocation')}</Text>
              <MapPreview
                place={maps.find((m) => m.id === draftMapId)?.place || null}
                height={120}
              />
              <ScrollView style={styles.mapMenu} contentContainerStyle={{ paddingVertical: 4 }}>
                {maps.length === 0 ? (
                  <Text style={styles.mapMenuEmpty}>
                    {t('adminAgentDetail.noLocations')}
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
                  <Text style={styles.cancelText}>{t('adminAgentDetail.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn]}
                  onPress={saveLocation}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveText}>{t('adminAgentDetail.saveLocation')}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <DayPickerModal
        visible={pickerOpen}
        value={customDate}
        onSelect={(d) => {
          setCustomDate(startOfDay(d));
          setPeriod('custom');
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
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
  periodRow: { gap: spacing.sm, paddingVertical: 2, paddingRight: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(43, 63, 110, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#052e2b', fontWeight: '800' },
  metricRow: { flexDirection: 'row', gap: spacing.sm },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(43, 63, 110, 0.55)',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  metricValue: { color: colors.text, fontSize: 20, fontWeight: '700' },
  metricLabel: { color: colors.muted, fontSize: 10, fontWeight: '400', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  chartCard: {
    backgroundColor: 'rgba(43, 63, 110, 0.55)',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chartTitle: { color: colors.text, fontSize: 13, fontWeight: '500', letterSpacing: 0.5, marginBottom: spacing.md },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 130, gap: 8 },
  bar: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  barValue: { color: colors.muted, fontSize: 10, fontWeight: '600', marginBottom: 2 },
  barFill: { width: '65%', backgroundColor: '#22D3EE', borderRadius: 6, minHeight: 4, opacity: 0.75 },
  barLabel: { marginTop: 6, fontSize: 11, color: colors.muted, fontWeight: '600' },
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
