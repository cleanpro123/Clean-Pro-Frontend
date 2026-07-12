import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../shared/theme/dark';
import RingChart from '../components/RingChart';
import { api } from '../../shared/api/client';
import { useAuth } from '../../shared/state/AuthContext';
import { confirmAction } from '../../shared/utils/confirm';
import { useI18n } from '../../shared/i18n/LanguageContext';

function SectionCard({ children, onPress, gradient }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.cardShadow, gradient && { shadowColor: gradient[0], shadowOpacity: 0.5 }]}
    >
      <LinearGradient
        colors={gradient || ['#2B3F6E', '#1B2B52']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.cardBorder} pointerEvents="none" />
        {children}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function ShortcutTile({ icon, label, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.shortcutShadow}>
      <LinearGradient
        colors={['#2B3F6E', '#1B2B52']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.shortcutTile}
      >
        <View style={styles.cardBorder} pointerEvents="none" />
        <Ionicons name={icon} size={22} color={colors.text} />
        <Text style={styles.shortcutLabel}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function AdminMenuScreen({ navigation }) {
  const { t } = useI18n();
  const { logout } = useAuth();
  const [stats, setStats] = useState({ revenueToday: 0, ordersToday: 0, deliveredToday: 0 });
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const confirmLogout = () =>
    confirmAction({
      title: t('adminMenu.signOutTitle'),
      confirmLabel: t('adminMenu.signOutConfirm'),
      destructive: true,
      onConfirm: logout,
    });

  const load = useCallback(async () => {
    try {
      const [reqs, usrs] = await Promise.all([
        api.get('/requests').catch(() => []),
        api.get('/users').catch(() => []),
      ]);
      setRequests(reqs);
      setUsers(usrs);
      // simple "today" stats from requests
      const today = new Date().toDateString();
      const todays = reqs.filter(
        (r) => new Date(r.placedAt || r.createdAt).toDateString() === today
      );
      setStats({
        revenueToday: todays.reduce((s, r) => r.status === 'delivered' ? s + (r.total || 0) : s, 0),
        ordersToday: todays.length,
        deliveredToday: todays.filter((r) => r.status === 'delivered').length,
      });
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

  const previewRequests = requests.slice(0, 2);
  const requestsMore = Math.max(0, requests.length - previewRequests.length);
  const previewUsers = users.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('adminMenu.title')}</Text>
        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          style={styles.menuBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        >
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={styles.dropdownItem}
              activeOpacity={0.85}
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate('AdminAdmins');
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.text} />
              <Text style={styles.dropdownText}>{t('adminMenu.admins')}</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity
              style={styles.dropdownItem}
              activeOpacity={0.85}
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate('Language');
              }}
            >
              <Ionicons name="language-outline" size={18} color={colors.text} />
              <Text style={styles.dropdownText}>{t('settings.language')}</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity
              style={styles.dropdownItem}
              activeOpacity={0.85}
              onPress={() => {
                setMenuOpen(false);
                confirmLogout();
              }}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={[styles.dropdownText, { color: colors.danger }]}>{t('adminMenu.logout')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SectionCard
          onPress={() => navigation.navigate('AdminDashboard')}
          gradient={['#0F766E', '#1B2B52']}
        >
          <View style={styles.dashRow}>
            <View style={styles.ringWrap}>
              <RingChart
                size={130}
                stroke={11}
                progress={Math.min(1, stats.ordersToday / 50)}
              />
              <View style={styles.ringCenter} pointerEvents="none">
                {loading ? (
                  <ActivityIndicator color={colors.muted} />
                ) : (
                  <>
                    <Text style={styles.dashCenterValue}>
                      QAR {stats.revenueToday.toLocaleString()}
                    </Text>
                    <Text style={styles.dashCenterLabel}>
                      {t('adminMenu.ordersTodayCount', { count: stats.ordersToday })}
                    </Text>
                  </>
                )}
              </View>
            </View>
            <View style={styles.dashStats}>
              <View style={styles.dashStatRow}>
                <Text style={styles.dashStatLabel}>{t('adminMenu.todaysLabel')}</Text>
                <Text style={styles.dashStatValue}>
                  QAR {stats.revenueToday.toLocaleString()}
                </Text>
              </View>
              <View style={styles.dashStatRow}>
                <Text style={styles.dashStatLabel}>{t('adminMenu.deliveredLabel')}</Text>
                <Text style={styles.dashStatValue}>{stats.deliveredToday}</Text>
              </View>
              <View style={styles.dashStatRow}>
                <Text style={styles.dashStatLabel}>{t('adminMenu.usersLabel')}</Text>
                <Text style={styles.dashStatValue}>{users.length}</Text>
              </View>
            </View>
          </View>
        </SectionCard>

        <SectionCard onPress={() => navigation.navigate('AdminRequests')}>
          <Text style={styles.cardTitle}>{t('adminMenu.requests')}</Text>
          {loading ? (
            <ActivityIndicator color={colors.muted} />
          ) : previewRequests.length === 0 ? (
            <Text style={styles.empty}>{t('adminMenu.noRequests')}</Text>
          ) : (
            previewRequests.map((r) => (
              <View key={r.id} style={styles.previewRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewName}>{r.userId?.name || t('adminMenu.customer')}</Text>
                  <Text style={styles.previewSub}>{r.userId?.phone || ''}</Text>
                </View>
                <Text style={styles.previewValue}>QAR {r.total}</Text>
              </View>
            ))
          )}
          {requestsMore > 0 && (
            <Text style={styles.moreLink}>{t('adminMenu.moreCount', { count: requestsMore })}</Text>
          )}
        </SectionCard>

        <SectionCard onPress={() => navigation.navigate('AdminUsers')}>
          <Text style={styles.cardTitle}>{t('adminMenu.users')}</Text>
          {loading ? (
            <ActivityIndicator color={colors.muted} />
          ) : previewUsers.length === 0 ? (
            <Text style={styles.empty}>{t('adminMenu.noUsers')}</Text>
          ) : (
            previewUsers.map((u) => (
              <View key={u.id} style={styles.previewRow}>
                <Text style={styles.previewName}>{u.name}</Text>
                <Text style={styles.previewValueMuted}>{u.phone}</Text>
              </View>
            ))
          )}
          {users.length > previewUsers.length && (
            <Text style={styles.moreLink}>{t('adminMenu.moreCount', { count: users.length - previewUsers.length })}</Text>
          )}
        </SectionCard>

        <View style={styles.shortcutRow}>
          <ShortcutTile icon="bicycle-outline" label={t('adminMenu.agents')} onPress={() => navigation.navigate('AdminAgents')} />
          <ShortcutTile icon="layers-outline" label={t('adminMenu.services')} onPress={() => navigation.navigate('AdminServices')} />
          <ShortcutTile icon="map-outline" label={t('adminMenu.maps')} onPress={() => navigation.navigate('AdminMaps')} />
        </View>
        <View style={styles.shortcutRow}>
          <ShortcutTile icon="pricetags-outline" label={t('adminMenu.items')} onPress={() => navigation.navigate('AdminItems')} />
          <ShortcutTile icon="gift-outline" label={t('adminMenu.offers')} onPress={() => navigation.navigate('AdminOffers')} />
          <ShortcutTile icon="star-outline" label={t('adminMenu.reviews')} onPress={() => navigation.navigate('AdminReviews')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { flex: 1, textAlign: 'center', color: colors.text, fontSize: 18, fontWeight: '300', letterSpacing: 1 },
  logoBtn: { padding: 8 },
  logoutBtn: { padding: 8 },
  menuBtn: { padding: 8 },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.35)' },
  dropdown: {
    position: 'absolute',
    top: 54,
    right: spacing.lg,
    minWidth: 180,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  dropdownText: { color: colors.text, fontSize: 14, fontWeight: '400', letterSpacing: 0.3 },
  dropdownDivider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginHorizontal: spacing.sm },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  cardShadow: { borderRadius: radii.lg, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  card: { padding: spacing.lg, borderRadius: radii.lg, overflow: 'hidden' },
  cardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  dashRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ringWrap: { width: 130, height: 130 },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  dashCenterValue: { color: colors.text, fontSize: 14, fontWeight: '400', letterSpacing: 0.5 },
  dashCenterLabel: { color: colors.muted, fontSize: 11, fontWeight: '300', marginTop: 2 },
  dashStats: { flex: 1, gap: spacing.md },
  dashStatRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dashStatLabel: { color: colors.muted, fontSize: 12, fontWeight: '300' },
  dashStatValue: { color: colors.text, fontSize: 13, fontWeight: '400', letterSpacing: 0.3 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '300', letterSpacing: 1, marginBottom: spacing.sm },
  previewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.06)' },
  previewName: { color: colors.text, fontSize: 13, fontWeight: '300', letterSpacing: 0.3, flex: 1 },
  previewSub: { color: colors.muted, fontSize: 11, fontWeight: '300', marginTop: 2 },
  previewValue: { color: colors.text, fontSize: 13, fontWeight: '400', letterSpacing: 0.3 },
  previewValueMuted: { color: colors.muted, fontSize: 12, fontWeight: '300', letterSpacing: 0.3 },
  moreLink: { color: colors.muted, fontSize: 12, fontWeight: '300', textAlign: 'center', marginTop: spacing.sm, letterSpacing: 0.5 },
  empty: { color: colors.muted, fontWeight: '300', textAlign: 'center', paddingVertical: spacing.md },
  shortcutRow: { flexDirection: 'row', gap: spacing.md },
  shortcutShadow: { flex: 1, borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  shortcutTile: { paddingVertical: spacing.md, borderRadius: radii.md, alignItems: 'center', overflow: 'hidden', gap: 6 },
  shortcutLabel: { color: colors.text, fontSize: 12, fontWeight: '300', letterSpacing: 0.5 },
});
