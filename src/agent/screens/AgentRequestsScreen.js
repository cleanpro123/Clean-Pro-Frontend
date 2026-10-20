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
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { api } from '../../shared/api/client';
import { useI18n } from '../../shared/i18n/LanguageContext';

const tabs = [
  { id: 'new', labelKey: 'agentRequests.tabNewOrders', statuses: ['pending'] },
  { id: 'accepted', labelKey: 'agentRequests.tabAccepted', statuses: ['accepted', 'in_progress', 'out_for_delivery'] },
  { id: 'history', labelKey: 'agentRequests.tabOrderHistory', statuses: ['delivered', 'cancelled'] },
];

export default function AgentRequestsScreen({ navigation }) {
  const { colors, gradients } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, gradients), [colors, gradients]);
  const { t } = useI18n();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('new');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Merge normal + direct (special) orders assigned to this agent.
      const [normal, special] = await Promise.all([
        api.getAll('/requests/assigned'),
        api.getAll('/special-requests/assigned'),
      ]);
      const all = [...(normal || []), ...(special || [])].sort(
        (a, b) =>
          new Date(b.placedAt || b.createdAt) - new Date(a.placedAt || a.createdAt)
      );
      setRequests([...new Map(all.map(order => [`${order.kind || 'normal'}-${order.id}`, order])).values()]);
    } catch (e) {
      setError(e.message || t('partnerNotifications.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      <LinearGradient colors={gradients.header} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
        <View style={{ width: 88 }} />
        <Text style={styles.title}>{t('agentRequests.title')}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('partnerNotifications.title')}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.8}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
        >
          <Ionicons name="notifications-outline" size={23} color={colors.headerText} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.profileBtn}
          accessibilityRole="button"
          accessibilityLabel={t('agentProfile.title')}
          onPress={() => navigation.navigate('AgentProfile')}
          activeOpacity={0.8}
        >
          <Ionicons name="person-circle-outline" size={26} color={colors.headerText} />
        </TouchableOpacity>
      </LinearGradient>

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
        {error ? (
          <View style={styles.empty}>
            <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text>
            <TouchableOpacity accessibilityRole="button" onPress={load}>
              <Text style={{ color: colors.primary }}>{t('status.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {loading && requests.length === 0 ? (
          <ActivityIndicator color={colors.muted} style={{ marginTop: 24 }} />
        ) : rows.length === 0 && !error ? (
          <View style={styles.empty}>
            <Ionicons name="file-tray-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>{t('agentRequests.emptyText')}</Text>
          </View>
        ) : (
          rows.map((r) => (
            <TouchableOpacity
              key={`${r.kind || 'normal'}-${r.id}`}
              accessibilityRole="button"
              accessibilityLabel={r.code}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('AgentRequestDetail', { id: r.id, kind: r.kind })
              }
              style={styles.rowShadow}
            >
              <LinearGradient
                colors={gradients.panel}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.row}
              >
                <View style={styles.rowBorder} pointerEvents="none" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.customer}>{r.userId?.name || t('agentRequests.customer')}</Text>
                  <Text style={styles.phone}>{r.userId?.phone || ''}</Text>
                  <Text style={styles.phone}>{r.code}</Text>
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

const makeStyles = (colors, gradients) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.headerBackground,  flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  profileBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.headerButton, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', color: colors.headerText, fontSize: 18, fontWeight: '300', letterSpacing: 1 },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabText: { color: colors.muted, fontSize: 14, fontWeight: '300', letterSpacing: 0.5, marginBottom: 8 },
  tabTextActive: { color: colors.activeText, fontWeight: '500' },
  tabUnderline: { height: 2, width: '70%', backgroundColor: 'transparent', borderRadius: 1 },
  tabUnderlineActive: { backgroundColor: colors.primary },
  list: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  rowShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  row: { borderTopColor: colors.panelAccent, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 18, borderRadius: radii.md, gap: spacing.md, overflow: 'hidden' },
  rowBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.md, borderWidth: 1, borderColor: colors.panelBorder },
  customer: { color: colors.text, fontSize: 15, fontWeight: '400', letterSpacing: 0.3 },
  phone: { color: colors.muted, fontSize: 12, fontWeight: '300', marginTop: 2, letterSpacing: 0.3 },
  price: { color: colors.headingAccent, fontSize: 15, fontWeight: '400', letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.muted, fontWeight: '300' },
});
