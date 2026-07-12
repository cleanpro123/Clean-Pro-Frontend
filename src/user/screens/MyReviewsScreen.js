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

function Stars({ value, size = 16 }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= value ? 'star' : 'star-outline'}
          size={size}
          color="#F59E0B"
        />
      ))}
    </View>
  );
}

export default function MyReviewsScreen({ navigation }) {
  const { t } = useI18n();
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [reviews, setReviews] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, o] = await Promise.all([
        api.get('/reviews/mine').catch(() => []),
        api.get('/requests/mine').catch(() => []),
      ]);
      setReviews(r);
      setOrders(o);
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

  const reviewedIds = new Set(reviews.map((r) => r.requestId));
  const unrated = orders.filter(
    (o) => o.status === 'delivered' && !reviewedIds.has(o.id)
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {loading && reviews.length === 0 && orders.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <>
            {unrated.length > 0 && (
              <View style={styles.banner}>
                <Ionicons name="star-outline" size={22} color="#B45309" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>
                    {t('myReviews.ordersWaiting', { count: unrated.length })}
                  </Text>
                  <Text style={styles.bannerSub}>
                    {t('myReviews.bannerSub')}
                  </Text>
                </View>
              </View>
            )}

            {unrated.map((o) => (
              <View key={o.id} style={styles.unratedCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.unratedId}>{o.code}</Text>
                  <Text style={styles.unratedMeta}>
                    {t('myReviews.deliveredOn', {
                      date: new Date(o.updatedAt || o.createdAt).toLocaleDateString(),
                    })}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('RateOrder', { orderId: o.id })}
                >
                  <LinearGradient
                    colors={gradients.brand}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.rateBtn}
                  >
                    <Text style={styles.rateText}>{t('myReviews.rate')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}

            <Text style={styles.section}>{t('myReviews.yourReviews')}</Text>

            {reviews.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="star-outline" size={48} color={colors.muted} />
                <Text style={styles.emptyText}>{t('myReviews.emptyText')}</Text>
              </View>
            ) : (
              reviews.map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHead}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewOrder}>{t('myReviews.orderNumber', { id: r.requestId })}</Text>
                      <Text style={styles.reviewDate}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Stars value={r.rating} />
                  </View>
                  <Text style={styles.reviewComment}>{r.comment}</Text>
                  <View style={styles.reviewFoot}>
                    <View
                      style={[
                        styles.pill,
                        {
                          backgroundColor:
                            r.status === 'approved'
                              ? '#D1FAE5'
                              : r.status === 'hidden'
                              ? '#FEE2E2'
                              : '#FEF3C7',
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          r.status === 'approved'
                            ? 'checkmark-circle'
                            : r.status === 'hidden'
                            ? 'eye-off-outline'
                            : 'time-outline'
                        }
                        size={12}
                        color={
                          r.status === 'approved'
                            ? '#10B981'
                            : r.status === 'hidden'
                            ? colors.danger
                            : '#B45309'
                        }
                      />
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color:
                              r.status === 'approved'
                                ? '#10B981'
                                : r.status === 'hidden'
                                ? colors.danger
                                : '#B45309',
                          },
                        ]}
                      >
                        {r.status === 'approved'
                          ? t('myReviews.statusPublished')
                          : r.status === 'hidden'
                          ? t('myReviews.statusHidden')
                          : t('myReviews.statusSubmitted')}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', borderRadius: radii.md, padding: spacing.md, gap: spacing.sm },
  bannerTitle: { color: '#92400E', fontWeight: '800' },
  bannerSub: { color: '#B45309', fontSize: 12, marginTop: 2 },
  unratedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.md, gap: spacing.md },
  unratedId: { fontWeight: '800', color: colors.text },
  unratedMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  rateBtn: { paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radii.pill },
  rateText: { color: '#fff', fontWeight: '800' },
  section: { fontSize: 13, color: colors.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.md },
  reviewCard: { backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.md, gap: spacing.sm },
  reviewHead: { flexDirection: 'row', alignItems: 'center' },
  reviewOrder: { fontWeight: '800', color: colors.text },
  reviewDate: { fontSize: 11, color: colors.muted, marginTop: 2 },
  reviewComment: { color: colors.text, fontSize: 13, lineHeight: 19 },
  reviewFoot: { flexDirection: 'row' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill },
  pillText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.muted, textAlign: 'center' },
});
