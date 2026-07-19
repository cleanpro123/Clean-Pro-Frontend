import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { useApp } from '../../shared/state/AppContext';
import { useAuth } from '../../shared/state/AuthContext';
import { api } from '../../shared/api/client';
import { useI18n } from '../../shared/i18n/LanguageContext';

const categories = ['All', 'Men', 'Women', 'Home'];

export default function BookingScreen({ route, navigation }) {
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, td } = useI18n();
  const catLabel = (c) => t(`booking.category${c}`);

  // Localise the stack header title ("Select clothes") for the current language.
  useEffect(() => {
    navigation.setOptions({ title: t('booking.selectClothes') });
  }, [navigation, t]);
  const initialKey = route.params?.serviceKey || 'wash';
  const [services, setServices] = useState([]);
  const [items, setItems] = useState([]);
  const [activeKey, setActiveKey] = useState(initialKey);
  const [cat, setCat] = useState('All');
  const [loading, setLoading] = useState(true);
  const { cart, setQty, getQty } = useApp();
  const { profile } = useAuth();
  const isSpecial = !!profile?.isSpecial;

  const load = useCallback(async () => {
    try {
      const [s, it] = await Promise.all([
        api.get('/services').catch(() => []),
        api.get('/items').catch(() => []),
      ]);
      setServices(s);
      setItems(it);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const service = services.find((s) => s.key === activeKey) || services[0];

  const visibleItems = useMemo(() => {
    return items.filter((it) => {
      if (cat !== 'All' && it.category !== cat) return false;
      const p = it.prices?.[activeKey];
      return p != null && p > 0;
    });
  }, [items, cat, activeKey]);

  const inService = Object.values(cart).filter((c) => c.serviceId === activeKey);
  const inServiceCount = inService.reduce((s, i) => s + i.qty, 0);
  const inServiceTotal = inService.reduce((s, i) => s + i.qty * i.price, 0);

  const totalsAll = Object.values(cart).reduce((s, i) => s + i.qty * i.price, 0);
  const totalsCount = Object.values(cart).reduce((s, i) => s + i.qty, 0);

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!service) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIconBox}>
            <Ionicons name={service.icon} size={32} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroLabel}>{t('booking.heroLabel')}</Text>
            <Text style={styles.heroTitle}>{td('service', service.key)}</Text>
            <Text style={styles.heroDesc} numberOfLines={2}>
              {td('serviceDesc', service.key)}
            </Text>
            <View style={styles.heroPills}>
              <View style={styles.heroPill}>
                <Ionicons name="basket-outline" size={11} color="#fff" />
                <Text style={styles.heroPillText}>
                  {inServiceCount > 0
                    ? t('booking.itemsTotal', { count: inServiceCount, total: inServiceTotal })
                    : t('booking.noItemsYet')}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* SERVICE TABS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {services.map((s) => {
            const active = s.key === activeKey;
            const qtyHere = Object.values(cart)
              .filter((c) => c.serviceId === s.key)
              .reduce((sum, i) => sum + i.qty, 0);
            return (
              <TouchableOpacity
                key={s.id}
                activeOpacity={0.85}
                onPress={() => setActiveKey(s.key)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Ionicons name={s.icon} size={16} color={active ? colors.card : colors.primary} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {td('service', s.key)}
                </Text>
                {qtyHere > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{qtyHere}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* CATEGORY ROW */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          {categories.map((c) => {
            const active = c === cat;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setCat(c)}
                style={[styles.catChip, active && styles.catChipActive]}
              >
                <Text style={[styles.catText, active && styles.catTextActive]}>{catLabel(c)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ITEMS */}
        <View style={styles.itemList}>
          {visibleItems.length === 0 ? (
            <Text style={styles.empty}>{t('booking.emptyItems')}</Text>
          ) : (
            visibleItems.map((it) => {
              const price = it.prices?.[activeKey] || 0;
              const qty = getQty(activeKey, it.id);
              return (
                <View key={it.id} style={styles.itemRow}>
                  <View style={styles.itemIcon}>
                    <Ionicons name="shirt-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{td('item', it.name)}</Text>
                    <Text style={styles.itemMeta}>
                      {catLabel(it.category)} · QAR {price}
                    </Text>
                  </View>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      onPress={() =>
                        setQty(activeKey, { id: it.id, name: it.name, price }, qty - 1)
                      }
                      style={styles.qtyBtn}
                      disabled={qty === 0}
                    >
                      <Ionicons name="remove" size={14} color={qty === 0 ? colors.muted : colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{qty}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setQty(activeKey, { id: it.id, name: it.name, price }, qty + 1)
                      }
                      style={styles.qtyBtn}
                    >
                      <Ionicons name="add" size={14} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {(totalsCount > 0 || isSpecial) && (
        <View style={styles.footer}>
          {totalsCount > 0 ? (
            <View style={{ flex: 1 }}>
              <Text style={styles.footTotal}>QAR {totalsAll}</Text>
              <Text style={styles.footMeta}>{t('booking.itemsInCart', { count: totalsCount })}</Text>
            </View>
          ) : (
            // Special customer with an empty cart — the direct-order button
            // fills the bar since there's no cart total to show.
            <View style={{ flex: 1 }}>
              <Text style={styles.footMeta}>{t('directOrder.footHint')}</Text>
            </View>
          )}

          <View style={styles.footActions}>
            {/* Special (VIP) customers can book a pickup directly, no items. */}
            {isSpecial && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('DirectOrder')}
                style={styles.directBtn}
              >
                <Ionicons name="flash" size={15} color={colors.primary} />
                <Text style={styles.directBtnText}>{t('directOrder.button')}</Text>
              </TouchableOpacity>
            )}
            {totalsCount > 0 && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ConfirmOrder')}
              >
                <LinearGradient
                  colors={gradients.brand}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.checkout}
                >
                  <Text style={styles.checkoutText}>{t('booking.continue')}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, margin: spacing.md, borderRadius: radii.lg },
  heroIconBox: { width: 60, height: 60, borderRadius: radii.md, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 },
  heroDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 },
  heroPills: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill },
  heroPillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  tabBar: { paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#fff' },
  tabBadge: { backgroundColor: colors.warning, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  catRow: { paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  catChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  catText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  catTextActive: { color: colors.primary },
  itemList: { paddingHorizontal: spacing.md, gap: spacing.sm + 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  itemIcon: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  itemName: { color: colors.text, fontWeight: '700' },
  itemMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  qtyText: { width: 28, textAlign: 'center', color: colors.text, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.muted, padding: spacing.xl },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.divider },
  footTotal: { color: colors.text, fontWeight: '800', fontSize: 20 },
  footMeta: { color: colors.muted, fontSize: 11 },
  checkout: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.lg, paddingVertical: 12, borderRadius: radii.pill },
  checkoutText: { color: '#fff', fontWeight: '800' },
  footActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  directBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  directBtnText: { color: colors.primary, fontWeight: '800' },
});
