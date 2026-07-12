import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../components/AdminHeader';
import { useI18n } from '../../shared/i18n/LanguageContext';
import DayPickerModal from '../../shared/components/DayPickerModal';
import { colors, gradients, radii, spacing } from '../../shared/theme/dark';
import { api } from '../../shared/api/client';
import {
  PERIODS,
  dayLabels,
  startOfDay,
  addDays,
  rangeFor,
  countIn,
  buildLast7Days,
} from '../../shared/utils/period';

const statusMeta = {
  pending: { label: 'Pending', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' },
  accepted: { label: 'Accepted', color: '#22D3EE', bg: 'rgba(34, 211, 238, 0.18)' },
  assigned: { label: 'Assigned', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.18)' },
  in_progress: { label: 'In progress', color: '#22D3EE', bg: 'rgba(34, 211, 238, 0.18)' },
  out_for_delivery: { label: 'Out', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.18)' },
  delivered: { label: 'Delivered', color: '#34D399', bg: 'rgba(52, 211, 153, 0.18)' },
  cancelled: { label: 'Cancelled', color: '#F87171', bg: 'rgba(248, 113, 113, 0.18)' },
};

// Y-axis in fixed steps of 40 (0, 40, 80, 120, …). axisMax rounds the data up
// to the next multiple of 40 so the bars still scale to whatever's there.
function niceAxis(max) {
  const STEP = 40;
  const axisMax = Math.max(STEP, Math.ceil((max || 0) / STEP) * STEP);
  const ticks = [];
  for (let v = 0; v <= axisMax; v += STEP) ticks.push(v);
  return { axisMax, ticks };
}

function StatCard({ label, value, icon, tint }) {
  return (
    <View style={[styles.stat, { backgroundColor: tint }]}>
      <Ionicons name={icon} size={22} color="#22D3EE" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  const { t } = useI18n();
  const [orders, setOrders] = useState([]);
  const [agentsCount, setAgentsCount] = useState({ total: 0, active: 0 });
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [period, setPeriod] = useState('today');
  const [customDate, setCustomDate] = useState(startOfDay(new Date()));
  const [pickerOpen, setPickerOpen] = useState(false);

  // Bumped on every load so the stats effect refetches on refresh/focus too,
  // not only when the selected period changes.
  const [statsTick, setStatsTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, a, u] = await Promise.all([
        api.getAll('/requests').catch(() => []),
        api.getAll('/agents').catch(() => []),
        api.getAll('/users').catch(() => []),
      ]);
      setOrders(o);
      setAgentsCount({
        total: a.length,
        active: a.filter((x) => x.status === 'active').length,
      });
      setUsersCount(u.length);
      setStatsTick((t) => t + 1);
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

  const range = useMemo(() => rangeFor(period, customDate), [period, customDate]);

  // Revenue/orders for the selected window come from the server-side stats
  // endpoint (date-filtered in the DB), so any range — custom day, last year —
  // is accurate regardless of how many orders the client has fetched.
  const [stats, setStats] = useState({ revenue: 0, orders: 0, delivered: 0, prevRevenue: 0 });
  useEffect(() => {
    let cancelled = false;
    const qs =
      `from=${range.start.toISOString()}&to=${range.end.toISOString()}` +
      `&prevFrom=${range.prevStart.toISOString()}&prevTo=${range.prevEnd.toISOString()}`;
    api
      .get(`/requests/stats?${qs}`)
      .then((s) => !cancelled && setStats(s))
      .catch(() => !cancelled && setStats({ revenue: 0, orders: 0, delivered: 0, prevRevenue: 0 }));
    return () => {
      cancelled = true;
    };
  }, [range]);

  const revenue = stats.revenue;
  const revenuePrev = stats.prevRevenue;
  const ordersInRange = stats.orders;
  const pct = revenuePrev
    ? Math.round(((revenue - revenuePrev) / revenuePrev) * 100)
    : revenue
    ? 100
    : 0;

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const todaysCount = useMemo(() => countIn(orders, today, tomorrow), [orders, today, tomorrow]);

  const pendingPickups = orders.filter(
    (o) => o.status === 'pending' || o.status === 'accepted' || o.status === 'assigned'
  ).length;

  const buckets = useMemo(() => buildLast7Days(orders, 'revenue'), [orders]);
  const maxRev = Math.max(0, ...buckets.map((b) => b.value));
  const { axisMax, ticks } = useMemo(() => niceAxis(maxRev), [maxRev]);

  const recent = orders.slice(0, 3);

  const handlePeriod = (key) => {
    if (key === 'custom') {
      setPeriod('custom');
      setPickerOpen(true);
    } else {
      setPeriod(key);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title={t('adminDashboard.title')} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.muted} />
        }
      >
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

        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroLabel}>{t('adminDashboard.revenueLabel', { period: range.label })}</Text>
          <Text style={styles.heroValue}>QAR {revenue.toLocaleString()}</Text>
          <Text style={styles.heroSub}>
            {t('adminDashboard.heroSub', {
              sign: pct >= 0 ? '+' : '',
              pct,
              compare: range.compare,
              orders: ordersInRange,
            })}
          </Text>
        </LinearGradient>

        <View style={styles.statRow}>
          <StatCard
            label={t('adminDashboard.ordersToday')}
            value={todaysCount}
            icon="cube-outline"
            tint="rgba(34, 211, 238, 0.10)"
          />
          <StatCard
            label={t('adminDashboard.activeAgents')}
            value={agentsCount.active}
            icon="bicycle-outline"
            tint="rgba(52, 211, 153, 0.10)"
          />
          <StatCard
            label={t('adminDashboard.pendingPickups')}
            value={pendingPickups}
            icon="time-outline"
            tint="rgba(251, 191, 36, 0.10)"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('adminDashboard.last7DaysRevenue')}</Text>
          {loading && orders.length === 0 ? (
            <ActivityIndicator color={colors.muted} />
          ) : (
            <View style={styles.chartRow}>
              {/* Y-axis price scale */}
              <View style={styles.yAxis}>
                {[...ticks].reverse().map((t) => (
                  <Text key={t} style={styles.yLabel}>
                    {t}
                  </Text>
                ))}
              </View>
              {/* Bars + day labels */}
              <View style={{ flex: 1 }}>
                <View style={styles.plot}>
                  {buckets.map((b, i) => (
                    <View key={i} style={styles.bar}>
                      <View
                        style={[
                          styles.barFill,
                          { height: `${(b.value / axisMax) * 100}%` },
                          i === buckets.length - 1 &&
                            b.value > 0 && { backgroundColor: '#34D399', opacity: 1 },
                        ]}
                      />
                    </View>
                  ))}
                </View>
                <View style={styles.xAxis}>
                  {buckets.map((b, i) => (
                    <Text key={i} style={styles.xLabel}>
                      {dayLabels[b.dow]}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{t('adminDashboard.totalUsers')}</Text>
            <Text style={styles.metricValue}>{usersCount}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{t('adminDashboard.totalAgents')}</Text>
            <Text style={styles.metricValue}>{agentsCount.total}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{t('adminDashboard.totalOrders')}</Text>
            <Text style={styles.metricValue}>{orders.length}</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('adminDashboard.recentRequests')}</Text>
          <Text
            style={styles.link}
            onPress={() => navigation.navigate('AdminRequests')}
          >
            {t('adminDashboard.viewAll')}
          </Text>
        </View>

        {recent.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('adminDashboard.noRequests')}</Text>
          </View>
        ) : (
          recent.map((r) => {
            const meta = statusMeta[r.status] || statusMeta.pending;
            const statusKey = statusMeta[r.status] ? r.status : 'pending';
            return (
              <TouchableOpacity
                key={r.id}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('AdminRequestView', { id: r.id })}
                style={styles.requestRow}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.reqId}>{r.code}</Text>
                  <Text style={styles.reqCustomer}>
                    {t('adminDashboard.reqCustomer', {
                      name: r.userId?.name || t('adminDashboard.customer'),
                      count: r.items?.length || 0,
                    })}
                  </Text>
                  <Text style={styles.reqMeta}>
                    {new Date(r.placedAt || r.createdAt).toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.pill, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.pillText, { color: meta.color }]}>{t(`adminDashboard.status_${statusKey}`)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

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
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
  periodRow: { gap: spacing.sm, paddingRight: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(43, 63, 110, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#052e2b', fontWeight: '800' },
  hero: { borderRadius: radii.lg, padding: spacing.lg },
  heroLabel: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 13 },
  heroValue: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 4 },
  heroSub: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, marginTop: 6 },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, borderRadius: radii.md, padding: spacing.md, gap: 6 },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.muted },
  card: {
    backgroundColor: 'rgba(43, 63, 110, 0.45)',
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  chartRow: { flexDirection: 'row', gap: 8 },
  yAxis: {
    height: 160,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  yLabel: { fontSize: 10, color: colors.muted, fontWeight: '600' },
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    gap: 8,
  },
  bar: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  barFill: {
    width: '70%',
    backgroundColor: '#22D3EE',
    borderRadius: 6,
    minHeight: 6,
    opacity: 0.7,
  },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 6 },
  xLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: colors.muted, fontWeight: '600' },
  metricsRow: { flexDirection: 'row', gap: spacing.sm },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(43, 63, 110, 0.45)',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricLabel: { color: colors.muted, fontSize: 11, fontWeight: '300', textTransform: 'uppercase', letterSpacing: 0.5 },
  metricValue: { color: colors.text, fontSize: 22, fontWeight: '500', marginTop: 4 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '500', color: colors.text, letterSpacing: 0.3 },
  link: { color: '#34D399', fontSize: 13, fontWeight: '500' },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(43, 63, 110, 0.45)',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  reqId: { fontSize: 14, fontWeight: '500', color: colors.text },
  reqCustomer: { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontWeight: '300' },
  reqMeta: { fontSize: 11, color: colors.muted, marginTop: 2, fontWeight: '300' },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill },
  pillText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: spacing.md },
  emptyText: { color: colors.muted, fontWeight: '300' },
});
