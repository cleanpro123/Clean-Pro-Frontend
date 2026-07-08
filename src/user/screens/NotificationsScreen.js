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
import { colors, radii, spacing } from '../../shared/theme/colors';
import { api } from '../../shared/api/client';

// Each order status maps to a friendly notification. We derive the
// notification feed from the user's orders so there is real content to show
// without a dedicated backend endpoint.
const STATUS_NOTIF = {
  accepted: {
    icon: 'thumbs-up-outline',
    tint: '#2D8FE0',
    title: 'Order accepted',
    body: (o) => `${o.code} is confirmed — we'll pick it up soon.`,
  },
  in_progress: {
    icon: 'water-outline',
    tint: '#1B6FC4',
    title: 'In wash',
    body: (o) => `${o.code} is being washed with care.`,
  },
  out_for_delivery: {
    icon: 'bicycle-outline',
    tint: '#06B6D4',
    title: 'Out for delivery',
    body: (o) => `${o.code} is on its way to you.`,
  },
  delivered: {
    icon: 'checkmark-circle-outline',
    tint: colors.success,
    title: 'Order delivered',
    body: (o) => `${o.code} was delivered. Tap to rate it.`,
  },
  cancelled: {
    icon: 'close-circle-outline',
    tint: colors.danger,
    title: 'Order cancelled',
    body: (o) => `${o.code} was cancelled.`,
  },
};

function timeAgo(date) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function NotificationsScreen({ navigation }) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // The backend returns one notification per order, already filtered to
      // orders that have moved past pending/assigned. orderId is the populated
      // order document.
      setFeed(await api.get('/notifications/mine').catch(() => []));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const notifications = useMemo(() => {
    return feed
      .filter((n) => n.orderId)
      .map((n) => {
        const o = n.orderId;
        const meta = STATUS_NOTIF[o.status] || STATUS_NOTIF.accepted;
        return {
          id: n.id,
          orderId: o.id,
          status: o.status,
          icon: meta.icon,
          tint: meta.tint,
          title: meta.title,
          body: meta.body(o),
          at: o.updatedAt || o.placedAt || o.createdAt,
        };
      });
  }, [feed]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.sub}>Updates on your orders</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {loading && feed.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-outline" size={42} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>
              You'll see order updates and offers here.
            </Text>
          </View>
        ) : (
          notifications.map((n) => (
            <TouchableOpacity
              key={n.id}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('MainTabs', { screen: 'Orders' })
              }
              style={styles.card}
            >
              <View style={[styles.cardIcon, { backgroundColor: n.tint + '18' }]}>
                <Ionicons name={n.icon} size={20} color={n.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardHeadRow}>
                  <Text style={styles.cardTitle}>{n.title}</Text>
                  <Text style={styles.cardTime}>{timeAgo(n.at)}</Text>
                </View>
                <Text style={styles.cardBody}>{n.body}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontWeight: '700', color: colors.text, fontSize: 14 },
  cardTime: { color: colors.muted, fontSize: 11 },
  cardBody: { color: colors.muted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  emptySub: { color: colors.muted, fontSize: 13, textAlign: 'center' },
});
