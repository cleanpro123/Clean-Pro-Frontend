import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../components/AdminHeader';
import { colors, radii, spacing } from '../../shared/theme/dark';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';
import { useI18n } from '../../shared/i18n/LanguageContext';

function PillRow({ icon, label, value, onPress }) {
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
          <Text style={styles.pillValue}>{value}</Text>
        </View>
        {onPress && <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
      </LinearGradient>
    </Wrap>
  );
}

export default function AdminUserDetailScreen({ route, navigation }) {
  const { t } = useI18n();
  const id = route.params?.id;
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [u, reqs] = await Promise.all([
        api.get(`/users/${id}`),
        api.get('/requests').catch(() => []),
      ]);
      setUser(u);
      const mine = (reqs || []).filter((r) => String(r.userId) === String(u.id));
      setOrders(mine);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AdminHeader title={t('adminUserDetail.title')} onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.muted} style={{ marginTop: 32 }} />
      </SafeAreaView>
    );
  }
  if (!user) return null;
  const isActive = user.status === 'active';

  const toggleStatus = () =>
    confirmAction({
      title: isActive
        ? t('adminUserDetail.blockUserTitle')
        : t('adminUserDetail.unblockUserTitle'),
      message: isActive
        ? t('adminUserDetail.blockUserMessage', { name: user.name })
        : t('adminUserDetail.unblockUserMessage', { name: user.name }),
      confirmLabel: isActive
        ? t('adminUserDetail.block')
        : t('adminUserDetail.unblock'),
      destructive: isActive,
      onConfirm: async () => {
        const updated = await api.patch(`/users/${user.id}/status`, {
          status: isActive ? 'blocked' : 'active',
        });
        setUser(updated);
      },
    });

  const deleteUser = () =>
    confirmAction({
      title: t('adminUserDetail.deleteUserTitle'),
      message: t('adminUserDetail.deleteUserMessage', { name: user.name }),
      confirmLabel: t('adminUserDetail.delete'),
      destructive: true,
      countdown: 30,
      onConfirm: async () => {
        await api.delete(`/users/${user.id}`);
        navigation.goBack();
      },
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title="User details" onBack={() => navigation.goBack()} />

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
              <Text style={styles.avatarText}>
                {(user.name || '?').split(' ').map((s) => s[0]).join('').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.name}>{user.name}</Text>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isActive
                    ? 'rgba(52, 211, 153, 0.18)'
                    : 'rgba(248, 113, 113, 0.20)',
                },
              ]}
            >
              <Ionicons
                name={isActive ? 'checkmark-circle' : 'ban'}
                size={12}
                color={isActive ? '#34D399' : colors.danger}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isActive ? '#34D399' : colors.danger },
                ]}
              >
                {isActive ? t('adminUserDetail.active') : t('adminUserDetail.blocked')}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{user.orders || 0}</Text>
                <Text style={styles.statLabel}>{t('adminUserDetail.totalOrders')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  QAR {(user.totalSpent || 0).toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>{t('adminUserDetail.totalSpent')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {user.createdAt ? new Date(user.createdAt).getFullYear() : '—'}
                </Text>
                <Text style={styles.statLabel}>{t('adminUserDetail.joined')}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.section}>{t('adminUserDetail.contact')}</Text>
        <PillRow
          icon="call"
          label={t('adminUserDetail.phone')}
          value={user.phone}
          onPress={() => Linking.openURL(`tel:${(user.phone || '').replace(/\s/g, '')}`)}
        />
        <PillRow
          icon="mail"
          label={t('adminUserDetail.email')}
          value={user.email}
          onPress={() => Linking.openURL(`mailto:${user.email}`)}
        />

        <Text style={styles.section}>
          {t('adminUserDetail.recentOrders', { count: orders.length })}
        </Text>
        {orders.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('adminUserDetail.noOrders')}</Text>
          </View>
        ) : (
          orders.slice(0, 5).map((o) => (
            <TouchableOpacity
              key={o.id}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AdminRequestView', { id: o.id })}
              style={styles.pillShadow}
            >
              <LinearGradient
                colors={['#2B3F6E', '#1B2B52']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.orderRow}
              >
                <View style={styles.pillBorder} pointerEvents="none" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderId}>{o.code || o.id}</Text>
                  <Text style={styles.orderMeta}>
                    {o.status} · {new Date(o.placedAt || o.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.orderTotal}>QAR {o.total}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </LinearGradient>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={toggleStatus}
          style={[styles.pillShadow, { marginTop: spacing.lg }]}
        >
          <LinearGradient
            colors={isActive ? ['#5C1F1F', '#2D0F0F'] : ['#0F766E', '#1B2B52']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionBtn}
          >
            <View style={styles.pillBorder} pointerEvents="none" />
            <Ionicons
              name={isActive ? 'ban' : 'checkmark-circle-outline'}
              size={18}
              color={isActive ? '#F87171' : '#34D399'}
            />
            <Text
              style={[styles.actionText, { color: isActive ? '#F87171' : '#34D399' }]}
            >
              {isActive
                ? t('adminUserDetail.blockThisUser')
                : t('adminUserDetail.unblockThisUser')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={deleteUser}
          style={[styles.pillShadow, { marginTop: spacing.md }]}
        >
          <LinearGradient
            colors={['#5C1F1F', '#2D0F0F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionBtn}
          >
            <View style={styles.pillBorder} pointerEvents="none" />
            <Ionicons name="trash-outline" size={18} color="#F87171" />
            <Text style={[styles.actionText, { color: '#F87171' }]}>
              {t('adminUserDetail.deleteThisUser')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  heroShadow: {
    borderRadius: radii.lg,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  hero: { padding: spacing.lg, borderRadius: radii.lg, alignItems: 'center', overflow: 'hidden' },
  heroBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { color: colors.text, fontSize: 22, fontWeight: '300', letterSpacing: 1 },
  name: { color: colors.text, fontSize: 20, fontWeight: '300', letterSpacing: 0.5 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    marginTop: 6,
  },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 4,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: 14, fontWeight: '400' },
  statLabel: { color: colors.muted, fontSize: 10, fontWeight: '300', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255, 255, 255, 0.10)' },
  section: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: spacing.md,
    paddingHorizontal: 4,
  },
  pillShadow: {
    borderRadius: radii.md,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    gap: spacing.md,
    overflow: 'hidden',
  },
  pillBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '300',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pillValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  orderId: { color: colors.text, fontWeight: '400', fontSize: 13 },
  orderMeta: { color: colors.muted, fontSize: 11, marginTop: 2, fontWeight: '300' },
  orderTotal: { color: colors.text, fontWeight: '400', fontSize: 13 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.md,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  actionText: { fontSize: 14, fontWeight: '300', letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingVertical: spacing.md },
  emptyText: { color: colors.muted, fontWeight: '300' },
});
