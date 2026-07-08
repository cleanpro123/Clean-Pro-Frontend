import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing, gradients } from '../../shared/theme/colors';
import { useApp } from '../../shared/state/AppContext';
import { useAuth } from '../../shared/state/AuthContext';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';

export default function ProfileScreen({ navigation }) {
  const { addresses } = useApp();
  const { profile, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [whatsapp, setWhatsapp] = useState(true);
  const [stats, setStats] = useState({ orders: 0, totalSpent: 0 });

  const load = useCallback(async () => {
    try {
      const o = await api.get('/requests/mine');
      setStats({
        orders: o.length,
        totalSpent: o.reduce((s, r) => s + (r.total || 0), 0),
      });
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalOrders = stats.orders;
  const totalSaved = stats.totalSpent;

  // Gentle "not built yet" popup for the rows/toggles we haven't wired up.
  const showSoon = (label) =>
    confirmAction({
      title: `${label}`,
      message: `${label} is coming soon. We're still building this — check back in a future update.`,
      hideCancel: true,
      tone: 'info',
      confirmLabel: 'Got it',
    });

  const accountMenu = [
    {
      icon: 'location-outline',
      label: 'Saved addresses',
      hint: `${addresses.length} saved`,
      route: 'Addresses',
      tint: '#2D8FE0',
    },
    {
      icon: 'card-outline',
      label: 'Payment methods',
      hint: '2 cards · UPI',
      tint: '#1B6FC4',
      soon: true,
    },
    {
      icon: 'receipt-outline',
      label: 'Order history',
      hint: `${totalOrders} orders`,
      route: 'Orders',
      tint: '#06B6D4',
    },
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      hint: 'Order updates & offers',
      route: 'Notifications',
      tint: '#0EA5E9',
    },
    {
      icon: 'pricetag-outline',
      label: 'Coupons & offers',
      hint: '3 available',
      tint: '#5DADE2',
      soon: true,
    },
    {
      icon: 'star-outline',
      label: 'My reviews',
      hint: 'Rate your past orders',
      route: 'MyReviews',
      tint: '#F59E0B',
    },
  ];

  const supportMenu = [
    { icon: 'help-circle-outline', label: 'Help center', soon: true },
    { icon: 'chatbubble-ellipses-outline', label: 'Contact support', soon: true },
    { icon: 'document-text-outline', label: 'Terms & policies', soon: true },
    { icon: 'star-outline', label: 'Rate Clean Pro on the store', soon: true },
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
              <Text style={styles.headerTitle}>My Profile</Text>
              <TouchableOpacity style={styles.iconChip} activeOpacity={0.7}>
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
                  <Text style={styles.name}>{profile?.name || 'Customer'}</Text>
                  <View style={styles.tierBadge}>
                    <Ionicons name="diamond" size={10} color={'#FFD700'} />
                    <Text style={styles.tierText}>Gold</Text>
                  </View>
                </View>
                <Text style={styles.email}>{profile?.email || ''}</Text>
                <TouchableOpacity
                  style={styles.editBtn}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <Ionicons name="create-outline" size={12} color={colors.card} />
                  <Text style={styles.editBtnText}>Edit profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* STATS CARD - floats over header */}
          <View style={styles.statsCard}>
            <Stat icon="receipt" value={totalOrders} label="Orders" />
            <View style={styles.statDivider} />
            <Stat icon="wallet" value={`₹${totalSaved}`} label="Saved" />
            <View style={styles.statDivider} />
            <Stat icon="calendar" value="2024" label="Member" />
          </View>
        </View>

        {/* WALLET / REFER */}
        <View style={styles.walletRow}>
          <TouchableOpacity activeOpacity={0.9} style={{ flex: 1 }} onPress={() => showSoon('Wallet')}>
            <View style={[styles.walletCard, styles.rowSoon]}>
              <View style={styles.cardSoonBadge}>
                <Text style={styles.soonBadgeText}>Coming soon</Text>
              </View>
              <View style={[styles.walletIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="wallet-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.walletLabel}>Wallet</Text>
              <Text style={styles.walletValue}>₹120</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={{ flex: 1 }}
            onPress={() => showSoon('Refer & earn')}
          >
            <LinearGradient
              colors={['#06B6D4', '#2D8FE0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.referCard, styles.rowSoon]}
            >
              <View style={styles.cardSoonBadgeLight}>
                <Text style={styles.cardSoonBadgeLightText}>Coming soon</Text>
              </View>
              <View style={styles.referHead}>
                <Ionicons name="gift-outline" size={18} color={colors.card} />
                <Text style={styles.referLabel}>Refer & earn</Text>
              </View>
              <Text style={styles.referValue}>Get ₹100</Text>
              <Text style={styles.referSub}>for every friend</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ACCOUNT */}
        <SectionTitle title="Account" />
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

        {/* PREFERENCES */}
        <SectionTitle title="Preferences" />
        <View style={styles.menu}>
          <ToggleRow
            icon="notifications-outline"
            label="Push notifications"
            hint="Order updates & offers"
            value={notifications}
            onValueChange={setNotifications}
            soon
          />
          <ToggleRow
            icon="logo-whatsapp"
            label="WhatsApp updates"
            hint="Get pickup reminders"
            value={whatsapp}
            onValueChange={setWhatsapp}
            soon
          />
          <ToggleRow
            icon="moon-outline"
            label="Dark mode"
            value={darkMode}
            onValueChange={setDarkMode}
            soon
            isLast
          />
        </View>

        {/* SUPPORT */}
        <SectionTitle title="Support" />
        <View style={styles.menu}>
          {supportMenu.map((m, i) => (
            <MenuRow
              key={m.label}
              item={{ ...m, tint: colors.primary }}
              isLast={i === supportMenu.length - 1}
              onPress={() => (m.soon ? showSoon(m.label) : undefined)}
            />
          ))}
        </View>

        {/* SIGN OUT */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.signoutBtn}
          onPress={() =>
            confirmAction({
              title: 'Sign out?',
              message: 'You will need to sign in again.',
              confirmLabel: 'Sign out',
              destructive: true,
              onConfirm: logout,
            })
          }
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.signoutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Clean Pro v1.0.0 · Made with 💙</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, value, label }) {
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
  return <Text style={styles.section}>{title}</Text>;
}

function SoonBadge() {
  return (
    <View style={styles.soonBadge}>
      <Text style={styles.soonBadgeText}>Coming soon</Text>
    </View>
  );
}

function MenuRow({ item, isLast, onPress }) {
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

function ToggleRow({ icon, label, hint, value, onValueChange, soon, isLast }) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder, soon && styles.rowSoon]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primary + '18' }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
      {soon ? (
        <SoonBadge />
      ) : (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.card}
          ios_backgroundColor={colors.border}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  referCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    gap: 4,
    overflow: 'hidden',
  },
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
