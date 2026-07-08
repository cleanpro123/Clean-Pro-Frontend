import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing, gradients } from '../../shared/theme/colors';
import { useApp } from '../../shared/state/AppContext';

const orderSteps = [
  { id: 'accepted', label: 'Accepted', icon: 'thumbs-up-outline' },
  { id: 'in_progress', label: 'In wash', icon: 'water-outline' },
  { id: 'out_for_delivery', label: 'Out for delivery', icon: 'bicycle-outline' },
  { id: 'delivered', label: 'Delivered', icon: 'checkmark-circle-outline' },
];
import { api } from '../../shared/api/client';
import { useAuth } from '../../shared/state/AuthContext';
import PromoCarousel from '../components/PromoCarousel';

const features = [
  { id: 'pickup', title: 'Free pickup', desc: 'At your doorstep', icon: 'bicycle-outline', color: '#2D8FE0' },
  { id: 'quality', title: 'Premium care', desc: 'Fabric-safe wash', icon: 'sparkles-outline', color: '#1B6FC4' },
  { id: 'eco', title: 'Eco friendly', desc: 'Gentle detergents', icon: 'leaf-outline', color: '#06B6D4' },
  { id: 'fast', title: '24h turnaround', desc: 'Wash & fold', icon: 'flash-outline', color: '#5DADE2' },
];

const offers = [
  { id: 'o1', badge: 'NEW USER', title: '40% off', sub: 'On your first wash', code: 'CLEANPRO40', gradient: ['#2D8FE0', '#1B6FC4'] },
  { id: 'o2', badge: 'WEEKEND', title: 'Buy 2 Get 1', sub: 'On dry cleaning', code: 'DRY3', gradient: ['#06B6D4', '#1B6FC4'] },
];

const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return { msg: 'Good morning', icon: 'sunny-outline' };
  if (h < 17) return { msg: 'Good afternoon', icon: 'partly-sunny-outline' };
  return { msg: 'Good evening', icon: 'moon-outline' };
};

const isActive = (o) => o.status !== 'delivered' && o.status !== 'cancelled';

export default function HomeScreen({ navigation }) {
  const { addresses, selectedAddressId } = useApp();
  const { profile } = useAuth();
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);

  const load = useCallback(async () => {
    try {
      const [s, o, r] = await Promise.all([
        api.get('/services').catch(() => []),
        api.get('/requests/mine').catch(() => []),
        api.get('/reviews').catch(() => []),
      ]);
      setServices(s);
      setOrders(o);
      setReviews(Array.isArray(r) ? r : []);
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = navigation.addListener?.('focus', load);
    return unsub;
  }, [navigation, load]);

  const currentAddr = addresses.find((a) => a.id === selectedAddressId);
  // Show the real selected address; fall back to "Home" when none is set.
  const addrText =
    [currentAddr?.line1, currentAddr?.area].filter(Boolean).join(', ') ||
    currentAddr?.label ||
    'Home';
  const activeOrder = orders.find(isActive);
  const lastOrder = orders.find((o) => !isActive(o));
  const greeting = greet();
  const popular = services.slice(0, 4);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 0 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SHELL — top bar + search wrapped in a gradient card */}
        <LinearGradient
          colors={[colors.primarySoft, '#F3F8FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.heroShell}
        >
          <View style={styles.heroOrb1} />
          <View style={styles.heroOrb2} />

          {/* TOP BAR */}
          <View style={styles.topBar}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.locationBox}
              onPress={() =>
                navigation.navigate('Addresses', { selectMode: true })
              }
            >
              <LinearGradient
                colors={gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.locPin}
              >
                <Ionicons name="location" size={15} color={colors.card} />
              </LinearGradient>
              <View>
                <Text style={styles.locLabel}>DELIVER TO</Text>
                <View style={styles.locRow}>
                  <Text style={styles.locValue} numberOfLines={1}>
                    {addrText}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={colors.text} />
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.topActions}>
              <TouchableOpacity
                style={styles.iconChip}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Ionicons name="notifications-outline" size={18} color={colors.text} />
                <View style={styles.dot} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('MainTabs', { screen: 'Profile' })
                }
              >
                <LinearGradient
                  colors={gradients.brand}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatar}
                >
                  <Ionicons name="person" size={16} color={colors.card} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* GREETING (intentionally left blank — user removed) */}

          {/* SEARCH */}
          <View style={styles.search}>
            <View style={styles.searchIconBg}>
              <Ionicons name="search" size={16} color={colors.primary} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search services, offers, orders…"
              placeholderTextColor={colors.muted}
            />
            <TouchableOpacity activeOpacity={0.7} style={styles.searchAction}>
              <Ionicons name="mic-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={styles.searchActionFilter}>
              <Ionicons name="options-outline" size={16} color={colors.card} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* CAROUSEL — sits just below hero, slight overlap */}
        <View style={styles.carouselWrap}>
          <PromoCarousel onPressSlide={() => navigation.navigate('Booking')} />
        </View>

        {/* ACTIVE ORDER */}
        {activeOrder && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate('OrderDetail', {
                orderId: activeOrder.id,
                order: activeOrder,
              })
            }
            style={styles.activeWrap}
          >
            <LinearGradient
              colors={gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activeCard}
            >
              <View style={styles.activeCircle1} />
              <View style={styles.activeCircle2} />
              <View style={styles.activeHead}>
                <View style={styles.activeIconBg}>
                  <Ionicons name="cube" size={18} color={colors.card} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeLabel}>YOUR ORDER IS LIVE</Text>
                  <Text style={styles.activeTitle}>
                    {activeOrder.code} · {activeOrder.items?.length || 0} items
                  </Text>
                </View>
                <View style={styles.etaChip}>
                  <Text style={styles.etaText}>
                    {new Date(activeOrder.placedAt || activeOrder.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.miniTimeline}>
                {orderSteps.map((step, idx) => {
                  const stepOrder = ['accepted', 'in_progress', 'out_for_delivery', 'delivered'];
                  const curIdx = stepOrder.indexOf(activeOrder.status);
                  const done = idx < curIdx;
                  const cur = idx === curIdx;
                  return (
                    <React.Fragment key={step.id}>
                      <View
                        style={[
                          styles.miniDot,
                          (done || cur) && styles.miniDotActive,
                        ]}
                      />
                      {idx < orderSteps.length - 1 && (
                        <View
                          style={[
                            styles.miniLine,
                            done && styles.miniLineActive,
                          ]}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
              <View style={styles.activeFoot}>
                <Text style={styles.activeStatus}>
                  Status: {activeOrder.status}
                </Text>
                <View style={styles.trackBtn}>
                  <Text style={styles.trackBtnText}>Track</Text>
                  <Ionicons name="arrow-forward" size={12} color={colors.card} />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* QUICK ACTIONS */}
        <View style={styles.quickRow}>
          {[
            { icon: 'cube-outline', label: 'Pickup', tint: '#2D8FE0' },
            { icon: 'time-outline', label: 'Schedule', tint: '#1B6FC4' },
            { icon: 'location-outline', label: 'Track', tint: '#06B6D4' },
            { icon: 'pricetag-outline', label: 'Offers', tint: '#5DADE2' },
            { icon: 'headset-outline', label: 'Support', tint: '#0EA5E9' },
          ].map((q) => (
            <TouchableOpacity key={q.label} style={styles.quickItem} activeOpacity={0.7}>
              <View style={[styles.quickIcon, { backgroundColor: q.tint + '18' }]}>
                <Ionicons name={q.icon} size={20} color={q.tint} />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* POPULAR SERVICES — horizontal scroll */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Popular services</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Services')}>
            <Text style={styles.link}>See all →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.servicesScroll}
        >
          {popular.map((s) => (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('Booking', { serviceKey: s.key, serviceName: s.name })
              }
              style={styles.serviceCardScroll}
            >
              <View style={[styles.serviceIconScroll, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={s.icon} size={28} color={colors.primary} />
              </View>
              <Text style={styles.serviceNameScroll}>{s.name}</Text>
              <Text style={styles.servicePriceScroll} numberOfLines={2}>
                {s.description}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* WHY CLEANPRO */}
        <View style={[styles.sectionHead, { marginTop: spacing.lg }]}>
          <Text style={styles.sectionTitle}>Why choose Clean Pro</Text>
        </View>
        <View style={styles.featuresGrid}>
          {features.map((f) => (
            <View key={f.id} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: f.color + '20' }]}>
                <Ionicons name={f.icon} size={22} color={f.color} />
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>

        {/* SPECIAL OFFERS */}
        <View style={[styles.sectionHead, { marginTop: spacing.lg }]}>
          <Text style={styles.sectionTitle}>Special offers</Text>
          <Text style={styles.link}>View all</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}
        >
          {offers.map((o) => (
            <TouchableOpacity key={o.id} activeOpacity={0.9}>
              <LinearGradient
                colors={o.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.offerCard}
              >
                <Text style={styles.offerBadge}>{o.badge}</Text>
                <Text style={styles.offerTitle}>{o.title}</Text>
                <Text style={styles.offerSub}>{o.sub}</Text>
                <View style={styles.offerCodeBox}>
                  <Ionicons name="pricetag" size={12} color={colors.card} />
                  <Text style={styles.offerCode}>{o.code}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* LAST ORDER */}
        {lastOrder && (
          <>
            <View style={[styles.sectionHead, { marginTop: spacing.lg }]}>
              <Text style={styles.sectionTitle}>Last order</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Orders')}
              style={styles.reorderCard}
            >
              <View style={styles.reorderIcon}>
                <Ionicons name="refresh-circle" size={32} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reorderHead}>{lastOrder.code}</Text>
                <Text style={styles.reorderBody}>
                  {lastOrder.items?.length || 0} items
                </Text>
                <Text style={styles.reorderMeta}>
                  ₹{lastOrder.total} ·{' '}
                  {new Date(lastOrder.updatedAt || lastOrder.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          </>
        )}

        {/* TESTIMONIALS */}
        {reviews.length > 0 && (
          <>
            <View style={[styles.sectionHead, { marginTop: spacing.lg }]}>
              <Text style={styles.sectionTitle}>What our customers say</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}
            >
              {reviews.map((r) => (
                <View key={r.id} style={styles.testimonialCard}>
                  <View style={styles.testimonialHead}>
                    <View style={styles.testimonialAvatar}>
                      <Text style={styles.testimonialInitial}>
                        {(r.customerName || 'C')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.testimonialName}>{r.customerName || 'Customer'}</Text>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Ionicons
                            key={n}
                            name="star"
                            size={10}
                            color={n <= r.rating ? '#F59E0B' : colors.border}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  {!!r.comment && (
                    <Text style={styles.testimonialText}>"{r.comment}"</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>12k+</Text>
            <Text style={styles.statLabel}>Happy customers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>4.9★</Text>
            <Text style={styles.statLabel}>Avg rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>24h</Text>
            <Text style={styles.statLabel}>Turnaround</Text>
          </View>
        </View>

        {/* LAUNDRY IMAGE — full-width, pinned to the very bottom behind the bar */}
        <Image
          source={require('../../../assets/admin-clothes.png')}
          style={styles.bannerImg}
          resizeMode="cover"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // HERO SHELL
  heroShell: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + spacing.md,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroOrb1: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#2D8FE015',
  },
  heroOrb2: {
    position: 'absolute',
    bottom: -40,
    left: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#06B6D412',
  },

  // TOP BAR
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: spacing.sm,
  },
  locPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locLabel: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  locValue: { color: colors.text, fontWeight: '800', fontSize: 14, maxWidth: 200 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // GREETING
  greetWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  greetIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F59E0B20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetText: { color: colors.text, fontWeight: '800', fontSize: 22, letterSpacing: -0.5 },
  greetSub: { color: colors.muted, fontSize: 13, paddingHorizontal: spacing.md, marginTop: 4 },

  // SEARCH
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingLeft: 6,
    paddingRight: 6,
    height: 52,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.lg,
    shadowColor: '#0F2A4F',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  searchIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },
  searchAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchActionFilter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // CAROUSEL WRAP
  carouselWrap: {
    marginTop: -spacing.lg,
  },

  // ACTIVE ORDER
  activeWrap: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  activeCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    overflow: 'hidden',
  },
  activeCircle1: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#ffffff14',
  },
  activeCircle2: {
    position: 'absolute',
    bottom: -50,
    right: 60,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff10',
  },
  activeHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activeIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLabel: { color: '#ffffffaa', fontWeight: '800', fontSize: 9, letterSpacing: 1 },
  activeTitle: { color: colors.card, fontWeight: '800', fontSize: 14, marginTop: 2 },
  etaChip: {
    backgroundColor: '#ffffff25',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  etaText: { color: colors.card, fontSize: 11, fontWeight: '700' },
  miniTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: 4,
  },
  miniDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff35',
  },
  miniDotActive: { backgroundColor: colors.card },
  miniLine: { flex: 1, height: 2, backgroundColor: '#ffffff25', marginHorizontal: 3 },
  miniLineActive: { backgroundColor: colors.card },
  activeFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  activeStatus: { color: '#ffffffdd', fontSize: 11, fontWeight: '600' },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff25',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  trackBtnText: { color: colors.card, fontWeight: '700', fontSize: 11 },

  // QUICK ACTIONS
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  quickItem: { alignItems: 'center', width: '18%' },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickLabel: { fontSize: 11, color: colors.text, fontWeight: '600' },

  // SECTION
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  link: { color: colors.primary, fontWeight: '700', fontSize: 12 },

  // SERVICES SCROLL
  servicesScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: 4,
  },
  serviceCardScroll: {
    width: 130,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
    gap: 6,
  },
  serviceIconScroll: {
    width: 50,
    height: 50,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  serviceNameScroll: { color: colors.text, fontWeight: '800', fontSize: 13 },
  servicePriceScroll: { color: colors.text, fontWeight: '800', fontSize: 14 },
  serviceUnitScroll: { color: colors.muted, fontWeight: '600', fontSize: 11 },
  serviceTimeScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    marginTop: 2,
  },
  serviceTimeTextScroll: { fontWeight: '800', fontSize: 10 },

  // FEATURES
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  featureCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  featureDesc: { fontSize: 12, color: colors.muted, marginTop: 2 },

  // OFFERS
  offerCard: {
    width: 220,
    height: 130,
    borderRadius: radii.md,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  offerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff33',
    color: colors.card,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    letterSpacing: 0.5,
  },
  offerTitle: { color: colors.card, fontSize: 22, fontWeight: '800' },
  offerSub: { color: '#ffffffdd', fontSize: 12, marginTop: -4 },
  offerCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ffffff80',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  offerCode: { color: colors.card, fontWeight: '700', fontSize: 12, letterSpacing: 1 },

  // REORDER
  reorderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reorderIcon: { alignItems: 'center', justifyContent: 'center' },
  reorderHead: { color: colors.text, fontWeight: '800', fontSize: 15 },
  reorderBody: { color: colors.muted, fontSize: 12, marginTop: 2 },
  reorderMeta: { color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 2 },

  // TESTIMONIALS
  testimonialCard: {
    width: 260,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  testimonialHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  testimonialAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testimonialInitial: { color: colors.card, fontWeight: '800', fontSize: 14 },
  testimonialName: { color: colors.text, fontWeight: '700', fontSize: 13 },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  testimonialText: { color: colors.text, fontSize: 12, lineHeight: 17, fontStyle: 'italic' },

  // STATS
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  statCol: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },

  // LAUNDRY IMAGE — full-bleed, sits behind the floating tab bar
  bannerImg: { width: '100%', height: 220, marginTop: spacing.lg },
});
