import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { setStatusBarStyle } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { useApp } from '../../shared/state/AppContext';
import { useI18n } from '../../shared/i18n/LanguageContext';
import { api } from '../../shared/api/client';
import { useAuth } from '../../shared/state/AuthContext';
import Icon from '../../shared/components/Icon';
import Avatar from '../../shared/components/Avatar';
import { HERO_GRADIENT, Bubbles } from '../../shared/components/AuthUI';
import PromoCarousel from '../components/PromoCarousel';

const orderSteps = [
  { id: 'accepted', labelKey: 'orders.stepAccepted', icon: 'thumbs-up' },
  { id: 'in_progress', labelKey: 'orders.stepInWash', icon: 'water' },
  { id: 'out_for_delivery', labelKey: 'orders.stepOutForDelivery', icon: 'bicycle' },
  { id: 'delivered', labelKey: 'orders.stepDelivered', icon: 'checkmark-circle' },
];

const features = [
  { id: 'pickup', titleKey: 'home.featurePickupTitle', descKey: 'home.featurePickupDesc', icon: 'bicycle', color: '#2D8FE0' },
  { id: 'quality', titleKey: 'home.featureQualityTitle', descKey: 'home.featureQualityDesc', icon: 'sparkles', color: '#7C5CE0' },
  { id: 'eco', titleKey: 'home.featureEcoTitle', descKey: 'home.featureEcoDesc', icon: 'leaf', color: '#10B981' },
  { id: 'fast', titleKey: 'home.featureFastTitle', descKey: 'home.featureFastDesc', icon: 'flash', color: '#F59E0B' },
];

// Backend offers carry no colour, so cards cycle through these brand gradients.
const OFFER_GRADIENTS = [
  ['#2D8FE0', '#1B6FC4'],
  ['#06B6D4', '#1B6FC4'],
  ['#1B6FC4', '#0F4C81'],
  ['#5DADE2', '#2D8FE0'],
];

// Map a real offer (code, label, discount, minOrder, validTill) → card fields.
const offerCard = (o, i, t) => ({
  id: o.id || o.code,
  badge: o.validTill ? t('home.offerBadgeLimited') : t('home.offerBadgeOffer'),
  title: o.label || t('home.offerDiscountOff', { discount: o.discount }),
  sub: o.minOrder ? t('home.offerMinOrder', { minOrder: o.minOrder }) : t('home.offerOnYourOrder'),
  code: o.code,
  gradient: OFFER_GRADIENTS[i % OFFER_GRADIENTS.length],
});

const isActive = (o) => o.status !== 'delivered' && o.status !== 'cancelled';

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const { t, td } = useI18n();
  const { addresses, selectedAddressId } = useApp();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [{ width: SCREEN_W }] = useState(() => Dimensions.get('window'));
  const [heroH, setHeroH] = useState(0);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [offers, setOffers] = useState([]);

  // "Offers" quick action scrolls down to the offers section.
  const scrollRef = useRef(null);
  const offersY = useRef(0);

  const load = useCallback(async () => {
    try {
      const [s, o, r, of] = await Promise.all([
        api.get('/services').catch(() => []),
        api.get('/requests/mine').catch(() => []),
        api.get('/reviews').catch(() => []),
        api.get('/offers').catch(() => []),
      ]);
      setServices(s);
      setOrders(o);
      setReviews(Array.isArray(r) ? r : []);
      setOffers(Array.isArray(of) ? of : []);
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = navigation.addListener?.('focus', load);
    return unsub;
  }, [navigation, load]);

  // The hero is dark blue in both themes, so use light status-bar text while
  // Home is on screen and hand back to the app's themed style on leave.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle(isDark ? 'light' : 'dark');
    }, [isDark])
  );

  const currentAddr = addresses.find((a) => a.id === selectedAddressId);
  // Show the real selected address; fall back to "Home" when none is set.
  const addrText =
    [currentAddr?.line1, currentAddr?.area].filter(Boolean).join(', ') ||
    currentAddr?.label ||
    t('home.addressFallbackHome');
  const activeOrder = orders.find(isActive);
  const lastOrder = orders.find((o) => !isActive(o));
  const popular = services.slice(0, 4);
  const activeIdx = activeOrder
    ? orderSteps.findIndex((s) => s.id === activeOrder.status)
    : -1;

  const openOrder = (order) =>
    navigation.navigate('OrderDetail', { orderId: order.id, order });

  const quickActions = [
    { id: 'pickup', icon: 'cube', label: t('home.quickPickup'), tint: '#2D8FE0', onPress: () => navigation.navigate('Booking') },
    { id: 'schedule', icon: 'time', label: t('home.quickSchedule'), tint: '#7C5CE0', onPress: () => navigation.navigate('Booking') },
    {
      id: 'track',
      icon: 'navigate',
      label: t('home.quickTrack'),
      tint: '#06B6D4',
      onPress: () => (activeOrder ? openOrder(activeOrder) : navigation.navigate('Orders')),
    },
    {
      id: 'offers',
      icon: 'pricetag',
      label: t('home.quickOffers'),
      tint: '#F59E0B',
      onPress: () => scrollRef.current?.scrollTo({ y: Math.max(0, offersY.current - spacing.md), animated: true }),
    },
    { id: 'support', icon: 'headset', label: t('home.quickSupport'), tint: '#10B981', onPress: () => navigation.navigate('ContactSupport') },
  ];

  return (
    <View style={styles.root}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        {/* HERO — brand gradient matching the auth screens */}
        <View
          style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}
          onLayout={(e) => setHeroH(e.nativeEvent.layout.height)}
        >
          <LinearGradient
            colors={isDark ? HERO_GRADIENT.dark : HERO_GRADIENT.light}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {heroH ? <Bubbles width={SCREEN_W} height={heroH} /> : null}

          {/* TOP BAR */}
          <View style={styles.topBar}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.locationBox}
              onPress={() => navigation.navigate('Addresses', { selectMode: true })}
            >
              <View style={styles.glassCircle}>
                <Icon name="location" size={18} color="#fff" />
              </View>
              <View style={styles.flex}>
                <Text style={styles.locLabel}>{t('home.deliverTo')}</Text>
                <View style={styles.locRow}>
                  <Text style={styles.locValue} numberOfLines={1}>
                    {addrText}
                  </Text>
                  <Icon name="chevron-down" size={16} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.topActions}>
              <TouchableOpacity
                style={styles.glassCircle}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Icon name="notifications" size={19} color="#fff" />
                <View style={styles.dot} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.glassCircle, styles.avatarRing]}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}
              >
                {profile?.avatar ? (
                  <Avatar value={profile.avatar} style={styles.avatarImg} />
                ) : (
                  <Icon name="person" size={19} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* SEARCH — opens the Services tab, where browsing happens */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.search}
            onPress={() => navigation.navigate('Services')}
          >
            <Icon name="search" size={19} color={colors.muted} />
            <Text style={styles.searchPlaceholder} numberOfLines={1}>
              {t('home.searchPlaceholder')}
            </Text>
            <View style={styles.searchFilter}>
              <Icon name="options" size={17} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* CAROUSEL — overlaps the hero's rounded bottom */}
        <View style={styles.carouselWrap}>
          <PromoCarousel onPressSlide={() => navigation.navigate('Booking')} />
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.quickCard}>
          {quickActions.map((q) => (
            <TouchableOpacity
              key={q.id}
              style={styles.quickItem}
              activeOpacity={0.7}
              onPress={q.onPress}
            >
              <View style={[styles.quickIcon, { backgroundColor: q.tint + (isDark ? '2E' : '17') }]}>
                <Icon name={q.icon} size={22} color={q.tint} />
              </View>
              <Text style={styles.quickLabel} numberOfLines={1}>
                {q.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ACTIVE ORDER */}
        {activeOrder && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => openOrder(activeOrder)}
            style={styles.activeWrap}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activeCard}
            >
              <View style={styles.activeCircle1} />
              <View style={styles.activeCircle2} />
              <View style={styles.activeHead}>
                <View style={styles.activeIconBg}>
                  <Icon name="cube" size={20} color="#fff" />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.activeLabel}>{t('home.orderLiveLabel')}</Text>
                  <Text style={styles.activeTitle}>
                    {t('home.orderCodeItems', {
                      code: activeOrder.code,
                      count: (activeOrder.items || []).reduce((count, item) => count + (item.qty || 0), 0),
                    })}
                  </Text>
                </View>
                <View style={styles.trackBtn}>
                  <Text style={styles.trackBtnText}>{t('home.track')}</Text>
                  <Icon name="arrow-forward" size={13} color={colors.primaryDark} strokeWidth={2.5} />
                </View>
              </View>

              <View style={styles.timeline}>
                {orderSteps.map((step, idx) => {
                  const reached = idx <= activeIdx;
                  return (
                    <React.Fragment key={step.id}>
                      <View style={[styles.stepDot, reached && styles.stepDotOn]}>
                        <Icon
                          name={step.icon}
                          size={13}
                          color={reached ? colors.primaryDark : '#ffffffaa'}
                          strokeWidth={2.4}
                        />
                      </View>
                      {idx < orderSteps.length - 1 && (
                        <View style={[styles.stepLine, idx < activeIdx && styles.stepLineOn]} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
              <Text style={styles.activeStatus}>
                {activeIdx >= 0
                  ? t(orderSteps[activeIdx].labelKey)
                  : t('orderDetail.statusPending')}
                {'  ·  '}
                {new Date(activeOrder.placedAt || activeOrder.createdAt).toLocaleDateString()}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* POPULAR SERVICES */}
        <SectionHead
          styles={styles}
          title={t('home.popularServices')}
          action={t('home.seeAll').replace(/\s*[→←]\s*$/, '')}
          onAction={() => navigation.navigate('Services')}
          colors={colors}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScroll}
        >
          {popular.map((s) => (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('Booking', { serviceKey: s.key, serviceName: s.name })
              }
              style={styles.serviceCard}
            >
              <View style={styles.serviceIcon}>
                <Icon name={s.icon} size={26} color={colors.primary} strokeWidth={1.9} />
              </View>
              <Text style={styles.serviceName} numberOfLines={1}>
                {td('service', s.name)}
              </Text>
              <Text style={styles.serviceDesc} numberOfLines={2}>
                {td('serviceDesc', s.description)}
              </Text>
              <View style={styles.serviceGo}>
                <Icon name="arrow-forward" size={14} color={colors.primary} strokeWidth={2.4} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* WHY CLEAN PRO */}
        <SectionHead styles={styles} title={t('home.whyChoose')} />
        <View style={styles.featuresGrid}>
          {features.map((f) => (
            <View key={f.id} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: f.color + (isDark ? '2E' : '17') }]}>
                <Icon name={f.icon} size={20} color={f.color} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.featureTitle} numberOfLines={1}>{t(f.titleKey)}</Text>
                <Text style={styles.featureDesc} numberOfLines={1}>{t(f.descKey)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* SPECIAL OFFERS */}
        <View onLayout={(e) => (offersY.current = e.nativeEvent.layout.y)}>
          <SectionHead styles={styles} title={t('home.specialOffers')} />
        </View>
        {offers.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
          >
            {offers.map((o, i) => offerCard(o, i, t)).map((o) => (
              <LinearGradient
                key={o.id}
                colors={o.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.offerCard}
              >
                <View style={styles.offerCircle} />
                <Text style={styles.offerBadge}>{o.badge}</Text>
                <View>
                  <Text style={styles.offerTitle} numberOfLines={1}>{o.title}</Text>
                  <Text style={styles.offerSub} numberOfLines={1}>{o.sub}</Text>
                </View>
                <View style={styles.offerCodeBox}>
                  <Icon name="pricetag" size={13} color="#fff" />
                  <Text style={styles.offerCode}>{o.code}</Text>
                </View>
              </LinearGradient>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.offersEmptyWrap}>
            <ImageBackground
              source={require('../../../assets/admin-clothes.png')}
              style={styles.offersEmpty}
              imageStyle={styles.offersEmptyImg}
            >
              <LinearGradient
                colors={['#0F2A4Fe0', '#1B6FC4b3']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={styles.offersEmptyOverlay}
              >
                <Icon name="pricetags" size={26} color="#fff" />
                <Text style={styles.offersEmptyTitle}>{t('home.noOffers')}</Text>
                <Text style={styles.offersEmptySub}>{t('home.checkBackSoon')}</Text>
              </LinearGradient>
            </ImageBackground>
          </View>
        )}

        {/* LAST ORDER */}
        {lastOrder && (
          <>
            <SectionHead styles={styles} title={t('home.lastOrder')} />
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Orders')}
              style={styles.reorderCard}
            >
              <View style={styles.reorderIcon}>
                <Icon name="refresh-circle" size={22} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.reorderHead}>{lastOrder.code}</Text>
                <Text style={styles.reorderBody}>
                  {t('home.itemsCount', { count: (lastOrder.items || []).reduce((count, item) => count + (item.qty || 0), 0) })}
                  {'  ·  '}
                  {new Date(lastOrder.updatedAt || lastOrder.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.reorderTotal}>QAR {lastOrder.total}</Text>
              <Icon name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>
          </>
        )}

        {/* TESTIMONIALS */}
        {reviews.length > 0 && (
          <>
            <SectionHead styles={styles} title={t('home.customerReviews')} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScroll}
            >
              {reviews.map((r) => (
                <View key={r.id} style={styles.testimonialCard}>
                  <Icon name="quote" size={20} color={colors.primaryLight} style={styles.quoteIcon} />
                  {!!r.comment && (
                    <Text style={styles.testimonialText} numberOfLines={4}>
                      {r.comment}
                    </Text>
                  )}
                  <View style={styles.testimonialHead}>
                    <View style={styles.testimonialAvatar}>
                      <Text style={styles.testimonialInitial}>
                        {(r.customerName || 'C')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.testimonialName} numberOfLines={1}>
                        {r.customerName || t('home.customer')}
                      </Text>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Icon
                            key={n}
                            name="star"
                            size={11}
                            color={n <= r.rating ? '#F59E0B' : colors.border}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>12k+</Text>
            <Text style={styles.statLabel}>{t('home.statHappyCustomers')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>4.9★</Text>
            <Text style={styles.statLabel}>{t('home.statAvgRating')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>24h</Text>
            <Text style={styles.statLabel}>{t('home.statTurnaround')}</Text>
          </View>
        </View>

        {/* LAUNDRY IMAGE — full-width, pinned to the very bottom behind the bar */}
        <Image
          source={require('../../../assets/admin-clothes.png')}
          style={styles.bannerImg}
          resizeMode="cover"
        />
      </ScrollView>
    </View>
  );
}

function SectionHead({ styles, colors, title, action, onAction }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <TouchableOpacity style={styles.linkRow} onPress={onAction} hitSlop={8}>
          <Text style={styles.link}>{action}</Text>
          <Icon name="chevron-forward" size={14} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const makeStyles = (colors, isDark) => {
  const cardShadow = {
    shadowColor: '#0F2A4F',
    shadowOpacity: isDark ? 0 : 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: isDark ? 0 : 2,
  };
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },

    // HERO
    hero: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl + spacing.md,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      overflow: 'hidden',
    },
    topBar: { flexDirection: 'row', alignItems: 'center' },
    locationBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      marginRight: spacing.sm,
    },
    glassCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    locLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
    locValue: { color: '#fff', fontWeight: '800', fontSize: 15, flexShrink: 1 },
    topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: {
      position: 'absolute',
      top: 10,
      right: 11,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#F87171',
      borderWidth: 1.5,
      borderColor: '#fff',
    },
    avatarRing: { overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },

    // SEARCH
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radii.pill,
      paddingLeft: spacing.md,
      paddingRight: 6,
      height: 52,
      gap: 10,
      marginTop: spacing.lg,
      shadowColor: '#0A1F33',
      shadowOpacity: 0.18,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    searchPlaceholder: { flex: 1, color: colors.muted, fontSize: 14 },
    searchFilter: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // CAROUSEL
    carouselWrap: { marginTop: -spacing.lg },

    // QUICK ACTIONS
    quickCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.lg,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
      ...cardShadow,
    },
    quickItem: { alignItems: 'center', flex: 1 },
    quickIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    quickLabel: { fontSize: 11.5, color: colors.text, fontWeight: '600' },

    // ACTIVE ORDER
    activeWrap: { marginHorizontal: spacing.md, marginBottom: spacing.md },
    activeCard: { borderRadius: radii.lg, padding: spacing.md, overflow: 'hidden' },
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
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: '#ffffff25',
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeLabel: { color: '#ffffffb3', fontWeight: '800', fontSize: 10, letterSpacing: 1 },
    activeTitle: { color: '#fff', fontWeight: '800', fontSize: 15, marginTop: 2 },
    trackBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#fff',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: radii.pill,
    },
    trackBtnText: { color: colors.primaryDark, fontWeight: '800', fontSize: 12 },
    timeline: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
    stepDot: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#ffffff26',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepDotOn: { backgroundColor: '#fff' },
    stepLine: { flex: 1, height: 3, borderRadius: 2, backgroundColor: '#ffffff30', marginHorizontal: 4 },
    stepLineOn: { backgroundColor: '#fff' },
    activeStatus: { color: '#ffffffe6', fontSize: 12, fontWeight: '600', marginTop: spacing.sm },

    // SECTION
    sectionHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      marginTop: spacing.lg,
      marginBottom: spacing.sm + 2,
    },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    link: { color: colors.primary, fontWeight: '700', fontSize: 13 },
    hScroll: { paddingHorizontal: spacing.md, gap: spacing.sm + 2, paddingBottom: 6 },

    // SERVICES
    serviceCard: {
      width: 148,
      backgroundColor: colors.card,
      padding: spacing.md,
      borderRadius: radii.lg,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
      ...cardShadow,
    },
    serviceIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm + 2,
    },
    serviceName: { color: colors.text, fontWeight: '800', fontSize: 14 },
    serviceDesc: { color: colors.muted, fontSize: 12, lineHeight: 16, marginTop: 3, minHeight: 32 },
    serviceGo: {
      alignSelf: 'flex-end',
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
    },

    // FEATURES
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: spacing.md,
      justifyContent: 'space-between',
      rowGap: spacing.sm + 2,
    },
    featureCard: {
      width: '48.5%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: radii.lg,
      padding: 12,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
      ...cardShadow,
    },
    featureIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
    featureDesc: { fontSize: 11.5, color: colors.muted, marginTop: 1 },

    // OFFERS
    offerCard: {
      width: 236,
      height: 136,
      borderRadius: radii.lg,
      padding: spacing.md,
      justifyContent: 'space-between',
      overflow: 'hidden',
    },
    offerCircle: {
      position: 'absolute',
      right: -30,
      top: -30,
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: '#ffffff1a',
    },
    offerBadge: {
      alignSelf: 'flex-start',
      backgroundColor: '#ffffff33',
      color: '#fff',
      fontSize: 10,
      fontWeight: '800',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radii.pill,
      letterSpacing: 0.6,
      overflow: 'hidden',
    },
    offerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
    offerSub: { color: '#ffffffdd', fontSize: 12 },
    offerCodeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: '#ffffff99',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radii.sm,
    },
    offerCode: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 1 },

    // OFFERS EMPTY STATE
    offersEmptyWrap: {
      marginHorizontal: spacing.md,
      borderRadius: radii.lg,
      overflow: 'hidden',
    },
    offersEmpty: { width: '100%', height: 130, justifyContent: 'center' },
    offersEmptyImg: { borderRadius: radii.lg },
    offersEmptyOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      gap: 2,
    },
    offersEmptyTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 4 },
    offersEmptySub: { color: '#EAF4FF', fontSize: 12 },

    // LAST ORDER
    reorderCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      marginHorizontal: spacing.md,
      padding: 14,
      borderRadius: radii.lg,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
      ...cardShadow,
    },
    reorderIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reorderHead: { color: colors.text, fontWeight: '800', fontSize: 15 },
    reorderBody: { color: colors.muted, fontSize: 12, marginTop: 2 },
    reorderTotal: { color: colors.text, fontWeight: '800', fontSize: 13 },

    // TESTIMONIALS
    testimonialCard: {
      width: 260,
      backgroundColor: colors.card,
      padding: spacing.md,
      borderRadius: radii.lg,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
      justifyContent: 'space-between',
      gap: 10,
      ...cardShadow,
    },
    quoteIcon: { marginBottom: -2 },
    testimonialText: { color: colors.text, fontSize: 13, lineHeight: 19 },
    testimonialHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    testimonialAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    testimonialInitial: { color: '#fff', fontWeight: '800', fontSize: 14 },
    testimonialName: { color: colors.text, fontWeight: '700', fontSize: 13 },
    starsRow: { flexDirection: 'row', gap: 2, marginTop: 3 },

    // STATS
    statsRow: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      marginHorizontal: spacing.md,
      borderRadius: radii.lg,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
      padding: spacing.md,
      marginTop: spacing.lg,
      alignItems: 'center',
      ...cardShadow,
    },
    statCol: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 19, fontWeight: '800', color: colors.primary },
    statLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
    statDivider: { width: 1, height: 28, backgroundColor: colors.border },

    // LAUNDRY IMAGE — full-bleed, sits behind the floating tab bar
    bannerImg: { width: '100%', height: 220, marginTop: spacing.lg },
  });
};
