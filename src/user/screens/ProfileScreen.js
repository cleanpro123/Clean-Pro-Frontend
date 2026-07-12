import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { useApp } from '../../shared/state/AppContext';
import { useAuth } from '../../shared/state/AuthContext';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';
import { useI18n } from '../../shared/i18n/LanguageContext';

export default function ProfileScreen({ navigation }) {
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useI18n();
  const { addresses } = useApp();
  const { profile, logout } = useAuth();
  const [stats, setStats] = useState({ orders: 0, ordersLastWeek: 0 });

  const load = useCallback(async () => {
    try {
      const o = await api.get('/requests/mine');
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      setStats({
        orders: o.length,
        // Orders placed in the last 7 days.
        ordersLastWeek: o.filter(
          (r) => new Date(r.placedAt || r.createdAt).getTime() >= weekAgo
        ).length,
      });
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Every completed order saves the customer a flat QAR 5 vs. walk-in pricing.
  const SAVED_PER_ORDER = 5;
  const ordersLastWeek = stats.ordersLastWeek;
  const savedQar = stats.orders * SAVED_PER_ORDER;
  const memberYear = profile?.createdAt
    ? new Date(profile.createdAt).getFullYear()
    : '—';

  // Gentle "not built yet" popup for the rows/toggles we haven't wired up.
  const showSoon = (label) =>
    confirmAction({
      title: `${label}`,
      message: t('profile.comingSoonMessage', { label }),
      hideCancel: true,
      tone: 'info',
      confirmLabel: t('profile.gotIt'),
    });

  const accountMenu = [
    {
      icon: 'receipt-outline',
      label: t('profile.orders'),
      hint: t('profile.ordersCount', { count: stats.orders }),
      route: 'Orders',
      tint: '#2D8FE0',
    },
    {
      icon: 'create-outline',
      label: t('profile.editProfile'),
      hint: t('profile.editProfileHint'),
      route: 'EditProfile',
      tint: '#1B6FC4',
    },
    {
      icon: 'location-outline',
      label: t('profile.savedAddresses'),
      hint: t('profile.savedCount', { count: addresses.length }),
      route: 'Addresses',
      tint: '#06B6D4',
    },
    {
      icon: 'notifications-outline',
      label: t('profile.notifications'),
      hint: t('profile.notificationsHint'),
      route: 'Notifications',
      tint: '#0EA5E9',
    },
    {
      icon: 'shield-checkmark-outline',
      label: t('profile.privacyCenter'),
      hint: t('profile.privacyCenterHint'),
      route: 'PrivacyCenter',
      tint: '#1B6FC4',
    },
  ];

  const activityMenu = [
    {
      icon: 'star-outline',
      label: t('profile.myReviews'),
      hint: t('profile.myReviewsHint'),
      route: 'MyReviews',
      tint: '#F59E0B',
    },
  ];

  // Flipkart-style "Feedback & Information" block — sits just above Sign out.
  // Help center + Contact support live here now (the old Support section is gone).
  const feedbackMenu = [
    {
      icon: 'document-text-outline',
      label: t('profile.termsPoliciesLicenses'),
      route: 'PrivacyPolicy',
      tint: '#1B6FC4',
    },
    {
      icon: 'help-buoy-outline',
      label: t('profile.browseFaqs'),
      route: 'Faqs',
      tint: '#F59E0B',
    },
    {
      icon: 'help-circle-outline',
      label: t('profile.helpCenter'),
      route: 'HelpCenter',
      tint: '#1B6FC4',
    },
    {
      icon: 'chatbubble-ellipses-outline',
      label: t('profile.contactSupport'),
      route: 'ContactSupport',
      tint: '#16A34A',
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER CARD */}
        <View style={styles.headerWrap}>
          <LinearGradient
            colors={gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
            <View style={styles.headerTopRow}>
              <Text style={styles.headerTitle}>{t('profile.myProfile')}</Text>
              <TouchableOpacity
                style={styles.iconChip}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Settings')}
              >
                <Ionicons name="settings-outline" size={18} color={colors.card} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileRow}>
              <TouchableOpacity
                style={styles.avatarWrap}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <View style={styles.avatar}>
                  {profile?.avatar ? (
                    <Image source={{ uri: profile.avatar }} style={styles.avatarImg} />
                  ) : (
                    <Ionicons name="person" size={36} color={colors.card} />
                  )}
                </View>
                <View style={styles.avatarEdit}>
                  <Ionicons name="camera" size={12} color={colors.card} />
                </View>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{profile?.name || t('profile.customer')}</Text>
                  <View style={styles.tierBadge}>
                    <Ionicons name="diamond" size={10} color={'#FFD700'} />
                    <Text style={styles.tierText}>{t('profile.gold')}</Text>
                  </View>
                </View>
                <Text style={styles.email}>{profile?.email || ''}</Text>
                <TouchableOpacity
                  style={styles.editBtn}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <Ionicons name="create-outline" size={12} color={colors.card} />
                  <Text style={styles.editBtnText}>{t('profile.editProfile')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* STATS CARD - floats over header */}
          <View style={styles.statsCard}>
            <Stat icon="receipt" value={ordersLastWeek} label={t('profile.thisWeek')} />
            <View style={styles.statDivider} />
            <Stat icon="wallet" value={`QAR ${savedQar}`} label={t('profile.saved')} />
            <View style={styles.statDivider} />
            <Stat icon="calendar" value={memberYear} label={t('profile.member')} />
          </View>
        </View>

        {/* SERVICE HIGHLIGHTS — tap through to book */}
        <View style={styles.walletRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('Services')}
          >
            <View style={styles.walletCard}>
              <View style={[styles.walletIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="flash-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.svcTitle}>{t('profile.expressDelivery')}</Text>
              <Text style={styles.svcSub}>{t('profile.expressDeliverySub')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('Services')}
          >
            <LinearGradient
              colors={['#06B6D4', '#2D8FE0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.referCard}
            >
              <View style={[styles.walletIcon, { backgroundColor: '#ffffff33' }]}>
                <Ionicons name="bicycle-outline" size={20} color={colors.card} />
              </View>
              <Text style={styles.referTitle}>{t('profile.freePickup')}</Text>
              <Text style={styles.referSub}>{t('profile.freePickupSub')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* MY ACCOUNT */}
        <SectionTitle title={t('profile.myAccount')} />
        <View style={styles.menu}>
          {accountMenu.map((m, i) => (
            <MenuRow
              key={m.label}
              item={m}
              isLast={i === accountMenu.length - 1}
              onPress={() => (m.soon ? showSoon(m.label) : m.route && navigation.navigate(m.route))}
            />
          ))}
        </View>

        {/* MY ACTIVITY */}
        <SectionTitle title={t('profile.myActivity')} />
        <View style={styles.menu}>
          {activityMenu.map((m, i) => (
            <MenuRow
              key={m.label}
              item={m}
              isLast={i === activityMenu.length - 1}
              onPress={() => (m.soon ? showSoon(m.label) : m.route && navigation.navigate(m.route))}
            />
          ))}
        </View>

        {/* FEEDBACK & INFORMATION */}
        <SectionTitle title={t('profile.feedbackInformation')} />
        <View style={styles.menu}>
          {feedbackMenu.map((m, i) => (
            <MenuRow
              key={m.label}
              item={m}
              isLast={i === feedbackMenu.length - 1}
              onPress={() => (m.soon ? showSoon(m.label) : m.route && navigation.navigate(m.route))}
            />
          ))}
        </View>

        {/* SIGN OUT */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.signoutBtn}
          onPress={() =>
            confirmAction({
              title: t('profile.signOutTitle'),
              message: t('profile.signOutMessage'),
              confirmLabel: t('profile.signOut'),
              destructive: true,
              onConfirm: logout,
            })
          }
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.signoutText}>{t('profile.signOut')}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{t('profile.version')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, value, label }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.statCol}>
      <View style={styles.statIconBox}>
        <Ionicons name={icon} size={14} color={colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <Text style={styles.section}>{title}</Text>;
}

function SoonBadge() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useI18n();
  return (
    <View style={styles.soonBadge}>
      <Text style={styles.soonBadgeText}>{t('profile.comingSoon')}</Text>
    </View>
  );
}

function MenuRow({ item, isLast, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.row, !isLast && styles.rowBorder, item.soon && styles.rowSoon]}
    >
      <View style={[styles.rowIcon, { backgroundColor: (item.tint || colors.primary) + '18' }]}>
        <Ionicons name={item.icon} size={18} color={item.tint || colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{item.label}</Text>
        {item.hint && <Text style={styles.rowHint}>{item.hint}</Text>}
      </View>
      {item.soon ? <SoonBadge /> : <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
    </TouchableOpacity>
  );
}


const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // HEADER
  headerWrap: { paddingBottom: 50 },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 60,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: { color: colors.card, fontSize: 18, fontWeight: '800' },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#ffffff30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff70',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: colors.card, fontSize: 20, fontWeight: '800' },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ffffff25',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  tierText: { color: '#FFD700', fontSize: 10, fontWeight: '800' },
  email: { color: '#ffffffcc', fontSize: 13, marginTop: 4 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff25',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    marginTop: spacing.sm,
  },
  editBtnText: { color: colors.card, fontWeight: '700', fontSize: 11 },

  // STATS
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    marginTop: -40,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F2A4F',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  statCol: { flex: 1, alignItems: 'center', gap: 4 },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { color: colors.text, fontWeight: '800', fontSize: 16 },
  statLabel: { color: colors.muted, fontSize: 11 },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border, alignSelf: 'center' },

  // WALLET / REFER
  walletRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  walletCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  walletIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  walletLabel: { color: colors.muted, fontSize: 12 },
  walletValue: { color: colors.text, fontWeight: '800', fontSize: 18 },
  svcTitle: { color: colors.text, fontWeight: '800', fontSize: 15 },
  svcSub: { color: colors.muted, fontSize: 11 },
  referCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    gap: 4,
    overflow: 'hidden',
  },
  referTitle: { color: colors.card, fontWeight: '800', fontSize: 15 },
  referHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  referLabel: { color: colors.card, fontWeight: '700', fontSize: 12 },
  referValue: { color: colors.card, fontWeight: '800', fontSize: 18 },
  referSub: { color: '#ffffffcc', fontSize: 11 },

  // SECTION
  section: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  // MENU
  menu: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: 12,
    minHeight: 56,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { color: colors.text, fontSize: 14, fontWeight: '600' },
  rowHint: { color: colors.muted, fontSize: 11, marginTop: 2 },
  rowSoon: { opacity: 0.6 },
  soonBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  soonBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardSoonBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    zIndex: 1,
  },
  cardSoonBadgeLight: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: '#ffffff30',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    zIndex: 1,
  },
  cardSoonBadgeLightText: {
    color: colors.card,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // SIGN OUT
  signoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  signoutText: { color: colors.danger, fontWeight: '700', fontSize: 14 },

  version: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: spacing.md,
    fontSize: 11,
  },
});
