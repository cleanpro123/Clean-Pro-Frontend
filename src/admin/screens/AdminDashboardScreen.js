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
import { colors, gradients, radii, spacing } from '../../shared/theme/dark';
import { api } from '../../shared/api/client';

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const statusMeta = {
  pending: { label: 'Pending', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' },
  accepted: { label: 'Accepted', color: '#22D3EE', bg: 'rgba(34, 211, 238, 0.18)' },
  assigned: { label: 'Assigned', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.18)' },
  in_progress: { label: 'In progress', color: '#22D3EE', bg: 'rgba(34, 211, 238, 0.18)' },
  out_for_delivery: { label: 'Out', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.18)' },
  delivered: { label: 'Delivered', color: '#34D399', bg: 'rgba(52, 211, 153, 0.18)' },
  cancelled: { label: 'Cancelled', color: '#F87171', bg: 'rgba(248, 113, 113, 0.18)' },
};

function StatCard({ label, value, icon, tint }) {
  return (
    <View style={[styles.stat, { backgroundColor: tint }]}>
      <Ionicons name={icon} size={22} color="#22D3EE" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function buildLast7Days(orders) {
  const today = startOfDay(new Date());
  // bucket by day (last 7, oldest first)
  const buckets = [];
  for (let i = 6; i >= 0; i--) {
    const start = new Date(today);
    start.setDate(today.getDate() - i);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    buckets.push({ start, end, total: 0, count: 0, dow: start.getDay() });
  }
  
  for (const o of orders) {
      const t = new Date(o.placedAt || o.createdAt);
    const b = buckets.find((x) => t >= x.start && t < x.end);
    if (b) {
      b.total += o.total || 0;
      b.count += 1;
    } 
  }
   return buckets;
}

export default function AdminDashboardScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [agentsCount, setAgentsCount] = useState({ total: 0, active: 0 });
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, a, u] = await Promise.all([
        api.get('/requests').catch(() => []),
        api.get('/agents').catch(() => []),
        api.get('/users').catch(() => []),
      ]);
      setOrders(o);
      setAgentsCount({
        total: a.length,
        active: a.filter((x) => x.status === 'active').length,
      });
      setUsersCount(u.length);
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

  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const todays = useMemo(
    () =>
      orders.filter((o) => {
        const t = new Date(o.placedAt || o.createdAt);
        return t >= today && t < tomorrow;
      }),
    [orders, today, tomorrow]
  );
  const yesterdays = useMemo(
    () =>
      orders.filter((o) => {
        const t = new Date(o.placedAt || o.createdAt);
        return t >= yesterday && t < today;
      }),
    [orders, yesterday, today]
  );

  const revenueToday = todays.reduce((s, r) =>r.status === 'delivered' ? s + (r.total || 0) : s, 0);
  const revenueYesterday = yesterdays.reduce((s, r) =>r.status === 'delivered' ? s + (r.total || 0) : s, 0);
  const pct = revenueYesterday
    ? Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100)
    : todays.length
    ? 100
    : 0;

  const pendingPickups = orders.filter(
    (o) => o.status === 'pending' || o.status === 'accepted' || o.status === 'assigned'
  ).length;

  const buckets = useMemo(() => buildLast7Days(orders), [orders]);
  const maxRev = Math.max(1, ...buckets.map((b) => b.status === 'delivered' ? b.total : 0));

  const recent = orders.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title="Dashboard" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.muted} />
        }
      >
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroLabel}>Revenue today</Text>
          <Text style={styles.heroValue}>₹{revenueToday.toLocaleString()}</Text>
          <Text style={styles.heroSub}>
            {pct >= 0 ? '+' : ''}
            {pct}% vs yesterday · {todays.length} orders processed
          </Text>
        </LinearGradient>

        <View style={styles.statRow}>
          <StatCard
            label="Orders today"
            value={todays.length}
            icon="cube-outline"
            tint="rgba(34, 211, 238, 0.10)"
          />
          <StatCard
            label="Active agents"
            value={agentsCount.active}
            icon="bicycle-outline"
            tint="rgba(52, 211, 153, 0.10)"
          />
          <StatCard
            label="Pending pickups"
            value={pendingPickups}
            icon="time-outline"
            tint="rgba(251, 191, 36, 0.10)"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Last 7 days</Text>
          {loading && orders.length === 0 ? (
            <ActivityIndicator color={colors.muted} />
          ) : (
            <View style={styles.chart}>
              {buckets.map((b, i) => (
                <View key={i} style={styles.bar}>
                  <View
                    style={[
                      styles.barFill,
                      // { height: `${(b.total / maxRev) * 100}%` },
                      i === buckets.length - 1 && {
                        backgroundColor: '#34D399',
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{dayLabels[b.dow]}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total users</Text>
            <Text style={styles.metricValue}>{usersCount}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total agents</Text>
            <Text style={styles.metricValue}>{agentsCount.total}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total orders</Text>
            <Text style={styles.metricValue}>{orders.length}</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent requests</Text>
          <Text
            style={styles.link}
            onPress={() => navigation.navigate('AdminRequests')}
          >
            View all
          </Text>
        </View>

        {recent.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No requests yet.</Text>
          </View>
        ) : (
          recent.map((r) => {
            const meta = statusMeta[r.status] || statusMeta.pending;
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
                    {r.customerName} · {r.items?.length || 0} items
                  </Text>
                  <Text style={styles.reqMeta}>
                    {new Date(r.placedAt || r.createdAt).toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.pill, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
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
  chart: {
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
  barLabel: { marginTop: 6, fontSize: 11, color: colors.muted, fontWeight: '600' },
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
