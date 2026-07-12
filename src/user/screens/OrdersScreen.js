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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { api } from '../../shared/api/client';
import { useI18n } from '../../shared/i18n/LanguageContext';

const orderSteps = [
  { id: 'accepted', labelKey: 'orders.stepAccepted', icon: 'thumbs-up-outline' },
  { id: 'in_progress', labelKey: 'orders.stepInWash', icon: 'water-outline' },
  { id: 'out_for_delivery', labelKey: 'orders.stepOutForDelivery', icon: 'bicycle-outline' },
  { id: 'delivered', labelKey: 'orders.stepDelivered', icon: 'checkmark-circle-outline' },
];

const FILTERS = [
  { id: 'all', labelKey: 'orders.filterAll' },
  { id: 'active', labelKey: 'orders.filterActive' },
  { id: 'done', labelKey: 'orders.filterCompleted' },
];

const isDone = (o) => o.status === 'delivered' || o.status === 'cancelled';

// Build a short, readable pickup address for an order. The linked address
// arrives populated (an object); show its label + area + pincode. If it was
// since deleted it comes back as a bare id (or null) — nothing to show.
function orderAddress(order) {
  const a = order.addressId && typeof order.addressId === 'object' ? order.addressId : null;
  if (a) {
    return [a.label, a.area || a.city, a.pincode].filter(Boolean).join(' · ');
  }
  return '';
}

export default function OrdersScreen({ navigation }) {
  const { t } = useI18n();
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await api.get('/requests/mine'));
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

  const counts = useMemo(
    () => ({
      all: orders.length,
      active: orders.filter((o) => !isDone(o)).length,
      done: orders.filter(isDone).length,
    }),
    [orders]
  );

  const filtered = useMemo(() => {
    if (filter === 'active') return orders.filter((o) => !isDone(o));
    if (filter === 'done') return orders.filter(isDone);
    return orders;
  }, [orders, filter]);

  const active = filtered.filter((o) => !isDone(o));
  const past = filtered.filter(isDone);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('orders.title')}</Text>
          <Text style={styles.sub}>{t('orders.subtitle')}</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const sel = f.id === filter;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setFilter(f.id)}
              activeOpacity={0.85}
              style={[styles.filterChip, sel && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, sel && styles.filterTextActive]}>
                {t(f.labelKey)}
              </Text>
              <View style={[styles.countBadge, sel && styles.countBadgeActive]}>
                <Text style={[styles.countBadgeText, sel && styles.countBadgeTextActive]}>
                  {counts[f.id]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {loading && orders.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={42} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('orders.emptyTitle')}</Text>
            <Text style={styles.emptySub}>{t('orders.emptySub')}</Text>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Services')}
            >
              <LinearGradient
                colors={gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyCta}
              >
                <Text style={styles.emptyCtaText}>{t('orders.browseServices')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <Text style={styles.section}>{t('orders.filterActive')}</Text>
                {active.map((o) => (
                  <ActiveOrderCard
                    key={o.id}
                    order={o}
                    onPress={() => navigation.navigate('OrderDetail', { orderId: o.id, order: o })}
                  />
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={styles.section}>{t('orders.sectionPast')}</Text>
                {past.map((o) => (
                  <PastOrderCard
                    key={o.id}
                    order={o}
                    onPress={() => navigation.navigate('OrderDetail', { orderId: o.id, order: o })}
                    onRate={() => navigation.navigate('RateOrder', { orderId: o.id })}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function statusIndex(status) {
  return Math.max(0, orderSteps.findIndex((s) => s.id === status));
}

function ActiveOrderCard({ order, onPress }) {
  const { t } = useI18n();
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const idx = statusIndex(order.status);
  const address = orderAddress(order);
  return (
    <TouchableOpacity style={styles.activeCard} activeOpacity={0.9} onPress={onPress}>
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.activeStripe}
      />
      <View style={styles.activeHead}>
        <View style={styles.activeIconBox}>
          <Ionicons name="cube-outline" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderId}>{order.code}</Text>
          <Text style={styles.orderService}>
            {t('orders.itemsCount', { count: order.items?.length || 0 })} · QAR {order.total}
          </Text>
        </View>
        <View style={styles.etaPill}>
          <Ionicons name="time-outline" size={12} color={colors.primary} />
          <Text style={styles.etaText}>
            {new Date(order.placedAt || order.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {!!address && (
        <View style={styles.addrRow}>
          <Ionicons name="location-outline" size={13} color={colors.muted} />
          <Text style={styles.addrText} numberOfLines={1}>
            {address}
          </Text>
        </View>
      )}

      <View style={styles.timeline}>
        {orderSteps.map((step, i) => {
          const done = i < idx;
          const current = i === idx;
          return (
            <React.Fragment key={step.id}>
              <View style={styles.stepCol}>
                <View
                  style={[
                    styles.stepDot,
                    (done || current) && styles.stepDotActive,
                    current && styles.stepDotCurrent,
                  ]}
                >
                  <Ionicons
                    name={step.icon}
                    size={14}
                    color={done || current ? colors.card : colors.muted}
                  />
                </View>
                <Text
                  style={[styles.stepLabel, (done || current) && styles.stepLabelActive]}
                  numberOfLines={1}
                >
                  {t(step.labelKey)}
                </Text>
              </View>
              {i < orderSteps.length - 1 && (
                <View style={[styles.stepLine, i < idx && styles.stepLineActive]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

function PastOrderCard({ order, onPress, onRate }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity style={styles.pastCard} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.pastIcon}>
        <Ionicons name="cube-outline" size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.pastHeadRow}>
          <Text style={styles.pastId}>{order.code}</Text>
          <View style={styles.deliveredBadge}>
            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
            <Text style={styles.deliveredText}>
              {order.status === 'cancelled' ? t('orders.statusCancelled') : t('orders.stepDelivered')}
            </Text>
          </View>
        </View>
        <Text style={styles.pastService}>{t('orders.itemsCount', { count: order.items?.length || 0 })}</Text>
        {!!orderAddress(order) && (
          <View style={styles.addrRow}>
            <Ionicons name="location-outline" size={12} color={colors.muted} />
            <Text style={styles.addrText} numberOfLines={1}>
              {orderAddress(order)}
            </Text>
          </View>
        )}
        <Text style={styles.pastDate}>
          {new Date(order.updatedAt || order.createdAt).toLocaleDateString()}
        </Text>
        <View style={styles.pastFoot}>
          {order.status === 'delivered' ? (
            <TouchableOpacity
              onPress={onRate}
              activeOpacity={0.8}
              style={[styles.reorderBtn, { backgroundColor: '#FEF3C7' }]}
            >
              <Ionicons name="star-outline" size={14} color="#B45309" />
              <Text style={[styles.reorderText, { color: '#B45309' }]}>{t('orders.rate')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <Text style={styles.pastTotal}>QAR {order.total}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  filterTextActive: { color: colors.card },
  countBadge: { minWidth: 22, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill, backgroundColor: colors.primarySoft, alignItems: 'center' },
  countBadgeActive: { backgroundColor: '#ffffff33' },
  countBadgeText: { color: colors.primary, fontWeight: '700', fontSize: 11 },
  countBadgeTextActive: { color: colors.card },
  section: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  activeCard: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, overflow: 'hidden' },
  activeStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  activeHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  activeIconBox: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  orderId: { fontWeight: '800', color: colors.text, fontSize: 15 },
  orderService: { color: colors.muted, fontSize: 12, marginTop: 2 },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  addrText: { flex: 1, color: colors.muted, fontSize: 12 },
  etaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill },
  etaText: { color: colors.primary, fontWeight: '700', fontSize: 11 },
  timeline: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4, paddingTop: spacing.md },
  stepCol: { alignItems: 'center', width: 64 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border },
  stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDotCurrent: { borderColor: colors.primary, backgroundColor: colors.primary, transform: [{ scale: 1.15 }] },
  stepLabel: { fontSize: 10, color: colors.muted, marginTop: 6, textAlign: 'center' },
  stepLabelActive: { color: colors.text, fontWeight: '700' },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginTop: 13, marginHorizontal: -8 },
  stepLineActive: { backgroundColor: colors.primary },
  pastCard: { flexDirection: 'row', backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, gap: spacing.md },
  pastIcon: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  pastHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pastId: { fontWeight: '700', color: colors.text, fontSize: 14 },
  deliveredBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0EA5E915', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill },
  deliveredText: { color: colors.success, fontSize: 10, fontWeight: '700' },
  pastService: { color: colors.muted, fontSize: 12, marginTop: 2 },
  pastDate: { color: colors.muted, fontSize: 11, marginTop: 2 },
  pastFoot: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  pastTotal: { color: colors.text, fontWeight: '700', fontSize: 14 },
  reorderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill },
  reorderText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  emptyTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  emptySub: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  emptyCta: { marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: 12, borderRadius: radii.pill },
  emptyCtaText: { color: colors.card, fontWeight: '700' },
});
