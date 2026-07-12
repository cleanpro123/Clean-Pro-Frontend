import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
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
import { useI18n } from '../../shared/i18n/LanguageContext';

const filters = [
  { id: 'all', labelKey: 'filterAll' },
  { id: 'active', labelKey: 'statusActive' },
  { id: 'blocked', labelKey: 'statusBlocked' },
];

export default function AdminUsersScreen({ navigation }) {
  const { t } = useI18n();
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [counts, setCounts] = useState({ all: 0, active: 0, blocked: 0 });
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const all = await api.get('/users');
      setAllUsers(all);
      setCounts({
        all: all.length,
        active: all.filter((u) => u.status === 'active').length,
        blocked: all.filter((u) => u.status === 'blocked').length,
      });
    } catch (e) {
      setError(e.message);
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

  useEffect(() => {
    const q = query.trim().toLowerCase();
    setUsers(
      allUsers.filter((u) => {
        if (filter !== 'all' && u.status !== filter) return false;
        if (!q) return true;
        return (
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.includes(q)
        );
      })
    );
  }, [allUsers, filter, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title={t('adminUsers.title')} onBack={() => navigation.goBack()} />

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <TextInput
          style={styles.search}
          placeholder={t('adminUsers.searchPlaceholder')}
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={styles.statBar}>
        {filters.map((f) => {
          const active = filter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              activeOpacity={0.85}
              onPress={() => setFilter(f.id)}
              style={styles.statShadow}
            >
              <LinearGradient
                colors={active ? ['#0F766E', '#1B2B52'] : ['#2B3F6E', '#1B2B52']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCard}
              >
                <View style={styles.statBorder} pointerEvents="none" />
                <Text style={styles.statValue}>{counts[f.id]}</Text>
                <Text style={styles.statLabel}>{t(`adminUsers.${f.labelKey}`)}</Text>
              </LinearGradient>
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
        {loading && allUsers.length === 0 ? (
          <ActivityIndicator color={colors.muted} style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : users.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>{t('adminUsers.noUsers')}</Text>
          </View>
        ) : (
          users.map((u) => (
            <TouchableOpacity
              key={u.id}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AdminUserDetail', { id: u.id })}
              style={styles.rowShadow}
            >
              <LinearGradient
                colors={['#2B3F6E', '#1B2B52']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.row}
              >
                <View style={styles.rowBorder} pointerEvents="none" />
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(u.name || '?').split(' ').map((s) => s[0]).join('').toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{u.name}</Text>
                  <Text style={styles.email}>{u.email}</Text>
                  <Text style={styles.meta}>
                    {t('adminUsers.meta', {
                      orders: u.orders || 0,
                      spent: (u.totalSpent || 0).toLocaleString(),
                    })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor:
                        u.status === 'active'
                          ? 'rgba(52, 211, 153, 0.18)'
                          : 'rgba(248, 113, 113, 0.20)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: u.status === 'active' ? '#34D399' : colors.danger },
                    ]}
                  >
                    {u.status === 'active' ? t('adminUsers.statusActive') : t('adminUsers.statusBlocked')}
                  </Text>
                </View>
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(43, 63, 110, 0.55)',
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  search: { flex: 1, paddingVertical: 12, color: colors.text, fontWeight: '300' },
  statBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  statShadow: {
    flex: 1,
    borderRadius: radii.md,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statCard: { padding: spacing.md, borderRadius: radii.md, overflow: 'hidden' },
  statBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  statValue: { fontSize: 20, fontWeight: '400', color: colors.text, letterSpacing: 0.5 },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 2, fontWeight: '300' },
  list: { padding: spacing.lg, paddingTop: 0, gap: spacing.sm + 4, paddingBottom: spacing.xl },
  rowShadow: {
    borderRadius: radii.md,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radii.md,
    gap: spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
  },
  rowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '400', color: colors.text, fontSize: 13, letterSpacing: 0.5 },
  name: { fontWeight: '400', color: colors.text, letterSpacing: 0.3 },
  email: { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontWeight: '300' },
  meta: { fontSize: 11, color: colors.muted, marginTop: 2, fontWeight: '300' },
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill },
  pillText: { fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.muted, fontWeight: '300' },
  errorText: { color: '#F87171', textAlign: 'center', marginTop: 24 },
});
