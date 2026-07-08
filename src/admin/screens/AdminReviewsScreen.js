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
import { colors, radii, spacing } from '../../shared/theme/dark';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'hidden', label: 'Hidden' },
];

function Stars({ value }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= value ? 'star' : 'star-outline'}
          size={14}
          color="#FBBF24"
        />
      ))}
    </View>
  );
}

export default function AdminReviewsScreen({ navigation }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReviews(await api.get('/reviews/admin'));
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

  const rows = useMemo(() => {
    if (filter === 'all') return reviews;
    return reviews.filter((r) => r.status === filter);
  }, [filter, reviews]);

  const avg = useMemo(() => {
    const approved = reviews.filter((r) => r.status === 'approved');
    if (!approved.length) return '0.0';
    return (approved.reduce((s, r) => s + r.rating, 0) / approved.length).toFixed(1);
  }, [reviews]);

  const confirmApprove = (r) =>
    confirmAction({
      title: 'Approve review?',
      message: `Publish ${r.customerName}'s review on the customer-facing app?`,
      confirmLabel: 'Approve',
      onConfirm: async () => {
        const updated = await api.patch(`/reviews/${r.id}/status`, { status: 'approved' });
        setReviews((prev) => prev.map((x) => (x.id === r.id ? updated : x)));
      },
    });

  const confirmHide = (r) =>
    confirmAction({
      title: 'Hide review?',
      message: `${r.customerName}'s review will no longer be visible to customers.`,
      confirmLabel: 'Hide',
      destructive: true,
      onConfirm: async () => {
        const updated = await api.patch(`/reviews/${r.id}/status`, { status: 'hidden' });
        setReviews((prev) => prev.map((x) => (x.id === r.id ? updated : x)));
      },
    });

  const confirmDelete = (r) =>
    confirmAction({
      title: 'Delete review?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        await api.delete(`/reviews/${r.id}`);
        setReviews((prev) => prev.filter((x) => x.id !== r.id));
      },
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title="Reviews" onBack={() => navigation.goBack()} />

      <View style={styles.summary}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryValue}>{avg}</Text>
          <Stars value={Math.round(parseFloat(avg))} />
          <Text style={styles.summaryLabel}>Avg rating</Text>
        </View>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryValue}>{reviews.length}</Text>
          <Text style={styles.summaryLabel}>Total reviews</Text>
        </View>
        <View style={styles.summaryCol}>
          <Text style={[styles.summaryValue, { color: '#FBBF24' }]}>
            {reviews.filter((r) => r.status === 'pending').length}
          </Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((f) => {
            const active = f.id === filter;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.85}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
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
        {loading && reviews.length === 0 ? (
          <ActivityIndicator color={colors.muted} style={{ marginTop: 24 }} />
        ) : rows.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="star-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>No reviews match this filter.</Text>
          </View>
        ) : (
          rows.map((r) => (
            <View key={r.id} style={styles.cardShadow}>
              <LinearGradient
                colors={['#2B3F6E', '#1B2B52']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.row}
              >
                <View style={styles.cardBorder} pointerEvents="none" />
                <View style={styles.rowHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customer}>{r.customerName}</Text>
                    <Text style={styles.orderId}>
                      Order {r.requestId} ·{' '}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Stars value={r.rating} />
                </View>

                <Text style={styles.comment}>{r.comment}</Text>

                <View style={styles.rowFooter}>
                  <View
                    style={[
                      styles.pill,
                      {
                        backgroundColor:
                          r.status === 'approved'
                            ? 'rgba(52, 211, 153, 0.20)'
                            : r.status === 'hidden'
                            ? 'rgba(248, 113, 113, 0.20)'
                            : 'rgba(251, 191, 36, 0.18)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color:
                            r.status === 'approved'
                              ? '#34D399'
                              : r.status === 'hidden'
                              ? colors.danger
                              : '#FBBF24',
                        },
                      ]}
                    >
                      {r.status[0].toUpperCase() + r.status.slice(1)}
                    </Text>
                  </View>

                  <View style={styles.actions}>
                    {r.status !== 'approved' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: 'rgba(52, 211, 153, 0.20)' }]}
                        onPress={() => confirmApprove(r)}
                      >
                        <Ionicons name="checkmark" size={16} color="#34D399" />
                      </TouchableOpacity>
                    )}
                    {r.status !== 'hidden' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: 'rgba(248, 113, 113, 0.20)' }]}
                        onPress={() => confirmHide(r)}
                      >
                        <Ionicons name="eye-off-outline" size={16} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.06)' }]}
                      onPress={() => confirmDelete(r)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  summary: { flexDirection: 'row', marginHorizontal: spacing.lg, backgroundColor: 'rgba(43, 63, 110, 0.55)', borderRadius: radii.lg, paddingVertical: spacing.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  summaryCol: { flex: 1, alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 22, fontWeight: '400', color: colors.text },
  summaryLabel: { fontSize: 11, color: colors.muted, fontWeight: '300' },
  tabsWrap: { paddingTop: spacing.sm, paddingBottom: spacing.md },
  filterRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: { minWidth: 96, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: 'rgba(43, 63, 110, 0.45)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', alignItems: 'center' },
  chipActive: { backgroundColor: 'rgba(15, 118, 110, 0.45)', borderColor: 'rgba(52, 211, 153, 0.50)' },
  chipText: { color: colors.muted, fontWeight: '300', fontSize: 13, letterSpacing: 0.5 },
  chipTextActive: { color: '#34D399', fontWeight: '500' },
  list: { padding: spacing.lg, paddingTop: 0, gap: spacing.md, paddingBottom: spacing.xl },
  cardShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.30, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  row: { borderRadius: radii.md, padding: spacing.md, gap: spacing.sm + 2, overflow: 'hidden' },
  cardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  rowHeader: { flexDirection: 'row', alignItems: 'center' },
  customer: { fontWeight: '500', color: colors.text, letterSpacing: 0.3 },
  orderId: { fontSize: 11, color: colors.muted, marginTop: 2, fontWeight: '300' },
  comment: { color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: '300' },
  rowFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill },
  pillText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.muted, fontWeight: '300' },
});
