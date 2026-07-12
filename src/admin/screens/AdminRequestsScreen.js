import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../components/AdminHeader';
import { colors, radii, spacing } from '../../shared/theme/dark';
import { api } from '../../shared/api/client';
import { useI18n } from '../../shared/i18n/LanguageContext';

const filters = [
  { id: 'all', labelKey: 'adminRequests.filterAll' },
  { id: 'pending', labelKey: 'adminRequests.filterPending' },
  { id: 'assigned', labelKey: 'adminRequests.filterAssigned' },
  { id: 'in_progress', labelKey: 'adminRequests.filterInProgress' },
  { id: 'delivered', labelKey: 'adminRequests.filterDelivered' },
];

const statusMeta = {
  pending: { labelKey: 'adminRequests.statusPending', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' },
  accepted: { labelKey: 'adminRequests.statusAccepted', color: '#22D3EE', bg: 'rgba(34, 211, 238, 0.18)' },
  assigned: { labelKey: 'adminRequests.statusAssigned', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.18)' },
  in_progress: { labelKey: 'adminRequests.statusInProgress', color: '#22D3EE', bg: 'rgba(34, 211, 238, 0.18)' },
  out_for_delivery: { labelKey: 'adminRequests.statusOut', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.18)' },
  delivered: { labelKey: 'adminRequests.statusDelivered', color: '#34D399', bg: 'rgba(52, 211, 153, 0.18)' },
  cancelled: { labelKey: 'adminRequests.statusCancelled', color: '#F87171', bg: 'rgba(248, 113, 113, 0.18)' },
};

export default function AdminRequestsScreen({ navigation }) {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api.get('/requests'));
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
    return items.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        r.code?.toLowerCase().includes(q) ||
        r.userId?.name?.toLowerCase().includes(q)
      );
    });
  }, [items, filter, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title={t('adminRequests.title')} onBack={() => navigation.goBack()} />

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <TextInput
          style={styles.search}
          placeholder={t('adminRequests.searchPlaceholder')}
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
        />
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
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(f.labelKey)}</Text>
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
        ) : rows.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="file-tray-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>{t('adminRequests.emptyText')}</Text>
          </View>
        ) : (
          rows.map((r) => {
            const meta = statusMeta[r.status] || statusMeta.pending;
            return (
              <TouchableOpacity
                key={r.id}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('AdminRequestView', { id: r.id })
                }
                style={styles.cardShadow}
              >
                <LinearGradient
                  colors={['#2B3F6E', '#1B2B52']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.row}
                >
                  <View style={styles.cardBorder} pointerEvents="none" />
                  <View style={styles.avatarBubble}>
                    <Text style={styles.avatarText}>
                      {(r.userId?.name || '?').split(' ').map((s) => s[0]).join('').toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.id}>{r.code}</Text>
                    <Text style={styles.customer}>
                      {r.userId?.name || t('adminRequests.customer')} · {t('adminRequests.itemsCount', { count: r.items?.length || 0 })}
                    </Text>
                    <Text style={styles.meta}>
                      {new Date(r.placedAt || r.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text style={styles.total}>QAR {r.total}</Text>
                    <View style={[styles.pill, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.pillText, { color: meta.color }]}>{t(meta.labelKey)}</Text>
                    </View>
                  </View>
                </LinearGradient>
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
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(43, 63, 110, 0.55)', marginHorizontal: spacing.lg, paddingHorizontal: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  search: { flex: 1, paddingVertical: 12, color: colors.text, fontWeight: '300' },
  tabsWrap: { paddingTop: spacing.sm, paddingBottom: spacing.md },
  filterRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: { minWidth: 96, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: 'rgba(43, 63, 110, 0.45)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', alignItems: 'center' },
  chipActive: { backgroundColor: 'rgba(15, 118, 110, 0.45)', borderColor: 'rgba(52, 211, 153, 0.50)' },
  chipText: { color: colors.muted, fontWeight: '300', fontSize: 13, letterSpacing: 0.5 },
  chipTextActive: { color: '#34D399', fontWeight: '500' },
  list: { padding: spacing.lg, paddingTop: 0, gap: spacing.md, paddingBottom: spacing.xl },
  cardShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.30, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  row: { flexDirection: 'row', borderRadius: radii.md, padding: spacing.md, alignItems: 'center', gap: spacing.md, overflow: 'hidden' },
  cardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  avatarBubble: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.10)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '500', color: colors.text, fontSize: 13, letterSpacing: 0.5 },
  id: { fontSize: 13, fontWeight: '500', color: colors.text, letterSpacing: 0.3 },
  customer: { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontWeight: '300' },
  meta: { fontSize: 11, color: colors.muted, marginTop: 2, fontWeight: '300' },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  total: { fontWeight: '500', color: colors.text, fontSize: 14, letterSpacing: 0.3 },
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill },
  pillText: { fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.muted, fontWeight: '300' },
});
