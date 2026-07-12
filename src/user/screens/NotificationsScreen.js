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
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { api } from '../../shared/api/client';
import { useI18n } from '../../shared/i18n/LanguageContext';

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
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  // Each order status maps to a friendly notification. We derive the
  // notification feed from the user's orders so there is real content to show
  // without a dedicated backend endpoint.
  const STATUS_NOTIF = {
    accepted: {
      icon: 'thumbs-up-outline',
      tint: '#2D8FE0',
      titleKey: 'orderAccepted',
      bodyKey: 'acceptedBody',
    },
    in_progress: {
      icon: 'water-outline',
      tint: '#1B6FC4',
      titleKey: 'inWash',
      bodyKey: 'inWashBody',
    },
    out_for_delivery: {
      icon: 'bicycle-outline',
      tint: '#06B6D4',
      titleKey: 'outForDelivery',
      bodyKey: 'outForDeliveryBody',
    },
    delivered: {
      icon: 'checkmark-circle-outline',
      tint: colors.success,
      titleKey: 'orderDelivered',
      bodyKey: 'deliveredBody',
    },
    cancelled: {
      icon: 'close-circle-outline',
      tint: colors.danger,
      titleKey: 'orderCancelled',
      bodyKey: 'cancelledBody',
    },
  };

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
          title: t(`notifications.${meta.titleKey}`),
          body: t(`notifications.${meta.bodyKey}`, { code: o.code }),
          at: o.updatedAt || o.placedAt || o.createdAt,
        };
      });
  }, [feed, t]);

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
          <Text style={styles.title}>{t('notifications.title')}</Text>
          <Text style={styles.sub}>{t('notifications.subtitle')}</Text>
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
            <Text style={styles.emptyTitle}>{t('notifications.emptyTitle')}</Text>
            <Text style={styles.emptySub}>
              {t('notifications.emptySubtitle')}
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

const makeStyles = (colors) => StyleSheet.create({
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
