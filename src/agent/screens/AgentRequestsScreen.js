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
import { colors, radii, spacing } from '../../shared/theme/dark';
import { api } from '../../shared/api/client';
import { useI18n } from '../../shared/i18n/LanguageContext';

const tabs = [
  { id: 'new', labelKey: 'agentRequests.tabNewOrders', statuses: ['pending'] },
  { id: 'accepted', labelKey: 'agentRequests.tabAccepted', statuses: ['accepted', 'in_progress', 'out_for_delivery'] },
  { id: 'history', labelKey: 'agentRequests.tabOrderHistory', statuses: ['delivered', 'cancelled'] },
];

export default function AgentRequestsScreen({ navigation }) {
  const { t } = useI18n();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('new');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Merge normal + direct (special) orders assigned to this agent.
      const [normal, special] = await Promise.all([
        api.get('/requests/assigned'),
        api.get('/special-requests/assigned').catch(() => []),
      ]);
      const all = [...(normal || []), ...(special || [])].sort(
        (a, b) =>
          new Date(b.placedAt || b.createdAt) - new Date(a.placedAt || a.createdAt)
      );
      setRequests(all);
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
    const active = tabs.find((x) => x.id === tab);
    return requests.filter((r) => active.statuses.includes(r.status));
  }, [requests, tab]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.title}>{t('agentRequests.title')}</Text>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('AgentProfile')}
          activeOpacity={0.8}
        >
          <Ionicons name="person-circle-outline" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {tabs.map((tabItem) => {
          const active = tabItem.id === tab;
          return (
            <TouchableOpacity
              key={tabItem.id}
              style={styles.tab}
              onPress={() => setTab(tabItem.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t(tabItem.labelKey)}</Text>
              <View style={[styles.tabUnderline, active && styles.tabUnderlineActive]} />
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.muted} />
        }
      >
        {loading && requests.length === 0 ? (
          <ActivityIndicator color={colors.muted} style={{ marginTop: 24 }} />
        ) : rows.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="file-tray-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>{t('agentRequests.emptyText')}</Text>
          </View>
        ) : (
          rows.map((r) => (
            <TouchableOpacity
              key={r.id}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('AgentRequestDetail', { id: r.id, kind: r.kind })
              }
              style={styles.rowShadow}
            >
              <LinearGradient
                colors={['#2B3F6E', '#1B2B52']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.row}
              >
                <View style={styles.rowBorder} pointerEvents="none" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.customer}>{r.userId?.name || t('agentRequests.customer')}</Text>
                  <Text style={styles.phone}>{r.userId?.phone || ''}</Text>
                </View>
                <Text style={styles.price}>QAR {r.total}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  profileBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.06)', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', color: colors.text, fontSize: 18, fontWeight: '300', letterSpacing: 1 },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabText: { color: colors.muted, fontSize: 14, fontWeight: '300', letterSpacing: 0.5, marginBottom: 8 },
  tabTextActive: { color: colors.text, fontWeight: '500' },
  tabUnderline: { height: 2, width: '70%', backgroundColor: 'transparent', borderRadius: 1 },
  tabUnderlineActive: { backgroundColor: colors.text },
  list: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  rowShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 18, borderRadius: radii.md, gap: spacing.md, overflow: 'hidden' },
  rowBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  customer: { color: colors.text, fontSize: 15, fontWeight: '400', letterSpacing: 0.3 },
  phone: { color: colors.muted, fontSize: 12, fontWeight: '300', marginTop: 2, letterSpacing: 0.3 },
  price: { color: colors.text, fontSize: 15, fontWeight: '400', letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.muted, fontWeight: '300' },
});
