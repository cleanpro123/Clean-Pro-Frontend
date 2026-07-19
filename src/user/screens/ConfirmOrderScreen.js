import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { useApp } from '../../shared/state/AppContext';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';
import { hasCoordinates, isInsideServiceArea } from '../../shared/constants/geo';
import { useI18n } from '../../shared/i18n/LanguageContext';

const deliveryOptions = [
  {
    id: 'normal',
    labelKey: 'confirmOrder.deliveryNormal',
    subKey: 'confirmOrder.deliveryNormalSub',
    fee: 0,
    icon: 'time-outline',
  },
  {
    id: 'fast',
    labelKey: 'confirmOrder.deliveryFast',
    subKey: 'confirmOrder.deliveryFastSub',
    fee: 50,
    icon: 'flash-outline',
    badge: 'FAST',
  },
];

const paymentMethods = [
  { id: 'cod', labelKey: 'confirmOrder.payCod', subKey: 'confirmOrder.payCodSub', icon: 'cash-outline' },
  { id: 'upi', labelKey: 'confirmOrder.payUpi', subKey: 'confirmOrder.payUpiSub', icon: 'phone-portrait-outline', disabled: true },
  { id: 'card', labelKey: 'confirmOrder.payCard', subKey: 'confirmOrder.payCardSub', icon: 'card-outline', disabled: true },
];

export default function ConfirmOrderScreen({ navigation }) {
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, td } = useI18n();
  const {
    totals,
    addresses,
    selectedAddressId,
    clearCart,
  } = useApp();

  const [services, setServices] = useState([]);
  const [delivery, setDelivery] = useState('normal');
  const [payment, setPayment] = useState('cod');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    api.get('/services').then(setServices).catch(() => {});
  }, []);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const deliveryFee = deliveryOptions.find((d) => d.id === delivery)?.fee || 0;
  const grandTotal = totals.subtotal + deliveryFee;

  // Everything that must be chosen before the order can be confirmed. Each
  // entry is a human-readable line shown in the "what's left" modal. The
  // Place-order button stays disabled (dimmed) while this list is non-empty.
  const missing = useMemo(() => {
    const m = [];
    if (totals.count === 0) m.push(t('confirmOrder.missingItem'));
    if (!selectedAddress) m.push(t('confirmOrder.missingAddress'));
    if (!delivery) m.push(t('confirmOrder.missingDelivery'));
    if (!payment) m.push(t('confirmOrder.missingPayment'));
    return m;
  }, [totals.count, selectedAddress, delivery, payment, t]);
  const canPlace = missing.length === 0;

  // Group cart items by service key for display
  const groups = useMemo(() => {
    const map = {};
    for (const it of totals.items) {
      const k = it.serviceId || 'wash';
      if (!map[k]) map[k] = [];
      map[k].push(it);
    }
    return Object.entries(map).map(([key, items]) => {
      const svc = services.find((s) => s.key === key);
      return {
        key,
        label: td('service', key),
        icon: svc?.icon || 'cube-outline',
        items,
      };
    });
  }, [totals.items, services, td]);

  // PLACE ORDER (frontend entry point)
  // Runs when the user taps "Place order": if anything required is still
  // missing it shows a single modal listing those items and stops; otherwise
  // it builds the payload, sends it to the backend and goes to Orders.
  const handlePlaceOrder = useCallback(async () => {
    // Guard: everything required must be selected first
    if (missing.length > 0) {
      confirmAction({
        title: t('confirmOrder.fewThingsLeft'),
        message: missing.map((m) => `•  ${m}`).join('\n'),
        confirmLabel: t('confirmOrder.gotIt'),
        hideCancel: true,
        tone: 'info',
        onConfirm: () => {},
      });
      return;
    }
    // Geofence: Clean Pro serves inside Qatar and India. Block the order if the
    // chosen pickup address has no saved map location, or has coordinates that
    // fall outside the service area — with a message tailored to each case.
    const { lat, lng } = selectedAddress || {};
    if (!hasCoordinates(lat, lng)) {
      confirmAction({
        title: t('confirmOrder.noLocationTitle'),
        message: t('confirmOrder.noLocationMessage'),
        confirmLabel: t('confirmOrder.gotIt'),
        hideCancel: true,
        tone: 'info',
        onConfirm: () => {},
      });
      return;
    }
    if (!isInsideServiceArea(lat, lng)) {
      confirmAction({
        title: t('confirmOrder.outsideQatarTitle'),
        message: t('confirmOrder.outsideQatarMessage'),
        confirmLabel: t('confirmOrder.gotIt'),
        hideCancel: true,
        onConfirm: () => {},
      });
      return;
    }
    setPlacing(true); // show loading spinner on the button
    try {
      // Build the list of items to send to the backend
      const items = totals.items.map((i) => ({
        name: i.name,
        qty: i.qty,
        price: i.price,
        service: i.serviceId,
      }));
      // Send the order to the backend (POST /api/requests → createRequest).
      // Only the saved address id is sent — every view (user / agent / admin)
      // populates the full pickup address from it.
      await api.post('/requests', {
        addressId: selectedAddress.id,
        note: notes.trim(),
        paymentMethod: payment,
        items,
      });
      clearCart(); // order placed, empty the cart
      // No success modal — go straight to the orders list where the new
      // order is already visible.
      navigation.navigate('MainTabs', { screen: 'Orders' });
    } catch (e) {
      confirmAction({
        title: t('confirmOrder.couldNotPlace'),
        message: e.message,
        confirmLabel: t('confirmOrder.ok'),
        onConfirm: () => {},
      });
    } finally {
      setPlacing(false);
    }
  }, [
    missing,
    totals.items,
    selectedAddress,
    delivery,
    payment,
    clearCart,
    navigation,
    t,
  ]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ORDER ITEMS GROUPED BY SERVICE */}
        <Text style={styles.section}>{t('confirmOrder.yourItems')}</Text>
        {groups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('confirmOrder.cartEmpty')}</Text>
          </View>
        ) : (
          groups.map((g) => (
            <View key={g.key} style={styles.card}>
              <View style={styles.serviceHead}>
                <View style={styles.serviceIconBubble}>
                  <Ionicons name={g.icon} size={16} color={colors.primary} />
                </View>
                <Text style={styles.serviceLabel}>{g.label}</Text>
              </View>
              {g.items.map((it, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemIdx}>
                    {String(idx + 1).padStart(2, '0')}.
                  </Text>
                  <Text style={styles.itemName}>{td('item', it.name)}</Text>
                  <Text style={styles.itemQty}>× {it.qty}</Text>
                  <Text style={styles.itemPrice}>QAR {it.qty * it.price}</Text>
                </View>
              ))}
            </View>
          ))
        )}

        {/* ADDRESS */}
        <Text style={styles.section}>{t('confirmOrder.pickupAddress')}</Text>
        {addresses.length === 0 ? (
          <TouchableOpacity
            style={styles.addAddressBtn}
            onPress={() => navigation.navigate('AddAddress')}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addAddressText}>{t('confirmOrder.addPickupAddress')}</Text>
          </TouchableOpacity>
        ) : (
          (() => {
            const a = selectedAddress || addresses[0];
            const detail = [a.line1, a.line2, a.area, a.pincode]
              .filter(Boolean)
              .join(', ');
            return (
              <TouchableOpacity
                style={[styles.addrCard, styles.addrCardActive]}
                onPress={() => navigation.navigate('Addresses', { selectMode: true })}
              >
                <View style={[styles.addrIconBubble, styles.addrIconBubbleActive]}>
                  <Ionicons
                    name={a.icon || 'location-outline'}
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addrLabel}>{a.label || t('confirmOrder.addressFallback')}</Text>
                  {!!detail && <Text style={styles.addrLine}>{detail}</Text>}
                </View>
                <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
              </TouchableOpacity>
            );
          })()
        )}

        {/* DELIVERY */}
        <Text style={styles.section}>{t('confirmOrder.deliverySpeed')}</Text>
        {deliveryOptions.map((d) => {
          const sel = d.id === delivery;
          return (
            <TouchableOpacity
              key={d.id}
              style={[styles.option, sel && styles.optionActive]}
              onPress={() => setDelivery(d.id)}
            >
              <Ionicons name={d.icon} size={20} color={sel ? colors.primary : colors.muted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.optionLabel}>{t(d.labelKey)}</Text>
                <Text style={styles.optionSub}>{t(d.subKey)}</Text>
              </View>
              <Text style={styles.optionFee}>{d.fee ? t('confirmOrder.feePlus', { fee: d.fee }) : t('confirmOrder.free')}</Text>
            </TouchableOpacity>
          );
        })}

        {/* PAYMENT */}
        <Text style={styles.section}>{t('confirmOrder.payment')}</Text>
        {paymentMethods.map((p) => {
          const sel = p.id === payment;
          // UPI / card aren't live yet — shown dimmed with a "Soon" badge and
          // not selectable.
          if (p.disabled) {
            return (
              <View key={p.id} style={[styles.option, styles.optionDisabled]}>
                <Ionicons name={p.icon} size={20} color={colors.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{t(p.labelKey)}</Text>
                  <Text style={styles.optionSub}>{t(p.subKey)}</Text>
                </View>
                <View style={styles.soonBadge}>
                  <Text style={styles.soonText}>{t('confirmOrder.soon')}</Text>
                </View>
              </View>
            );
          }
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.option, sel && styles.optionActive]}
              onPress={() => setPayment(p.id)}
            >
              <Ionicons name={p.icon} size={20} color={sel ? colors.primary : colors.muted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.optionLabel}>{t(p.labelKey)}</Text>
                <Text style={styles.optionSub}>{t(p.subKey)}</Text>
              </View>
              <Ionicons
                name={sel ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={sel ? colors.primary : colors.muted}
              />
            </TouchableOpacity>
          );
        })}

        {/* NOTES */}
        <Text style={styles.section}>{t('confirmOrder.notesLabel')}</Text>
        <TextInput
          style={styles.notes}
          placeholder={t('confirmOrder.notesPlaceholder')}
          placeholderTextColor={colors.muted}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {/* SUMMARY */}
        <Text style={styles.section}>{t('confirmOrder.summary')}</Text>
        <View style={styles.summary}>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>{t('confirmOrder.subtotalItems', { count: totals.count })}</Text>
            <Text style={styles.sumValue}>QAR {totals.subtotal}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>{t('confirmOrder.delivery')}</Text>
            <Text style={styles.sumValue}>{deliveryFee ? `QAR ${deliveryFee}` : t('confirmOrder.free')}</Text>
          </View>
          <View style={[styles.sumRow, styles.sumTotal]}>
            <Text style={styles.sumTotalLabel}>{t('confirmOrder.total')}</Text>
            <Text style={styles.sumTotalValue}>QAR {grandTotal}</Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footTotal}>QAR {grandTotal}</Text>
          <Text style={styles.footMeta}>
            {t('confirmOrder.footMeta', {
              count: totals.count,
              speed: delivery === 'fast' ? t('confirmOrder.express') : t('confirmOrder.normal'),
            })}
          </Text>
        </View>
        {/* Kept pressable while incomplete so the tap explains what's left;
            dimmed to signal it isn't ready yet. */}
        <TouchableOpacity activeOpacity={0.85} onPress={handlePlaceOrder} disabled={placing}>
          <LinearGradient
            colors={gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.cta, !canPlace && styles.ctaDisabled]}
          >
            {placing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.ctaText}>{t('confirmOrder.placeOrder')}</Text>
                <Ionicons
                  name={canPlace ? 'arrow-forward' : 'lock-closed'}
                  size={16}
                  color="#fff"
                />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  section: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyText: { color: colors.muted },
  serviceHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 8,
  },
  serviceIconBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  itemIdx: { color: colors.muted, fontSize: 12, width: 28 },
  itemName: { flex: 1, color: colors.text, fontSize: 13 },
  itemQty: { color: colors.muted, fontSize: 12, width: 40, textAlign: 'center' },
  itemPrice: { color: colors.text, fontWeight: '700', fontSize: 13, width: 70, textAlign: 'right' },

  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addAddressText: { color: colors.primary, fontWeight: '700' },
  addrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addrCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  addrIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addrIconBubbleActive: { backgroundColor: colors.primarySoft },
  addrLabel: { color: colors.text, fontWeight: '700' },
  addrLine: { color: colors.muted, fontSize: 12, marginTop: 2 },

  pickRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md },
  pickPill: {
    flex: 1,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  pickPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pickLabel: { color: colors.text, fontWeight: '700' },
  pickLabelActive: { color: '#fff' },
  pickSub: { color: colors.muted, fontSize: 11, marginTop: 2 },
  pickSubActive: { color: '#fff' },

  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.md },
  slot: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  slotTextActive: { color: '#fff' },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  // Dimmed "frosted" look for not-yet-available payment methods.
  optionDisabled: { opacity: 0.45, backgroundColor: colors.surface },
  optionLabel: { color: colors.text, fontWeight: '700' },
  optionSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  optionFee: { color: colors.primary, fontWeight: '700' },
  soonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  soonText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  notes: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 60,
    color: colors.text,
    textAlignVertical: 'top',
  },

  summary: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  sumLabel: { color: colors.muted },
  sumValue: { color: colors.text, fontWeight: '600' },
  sumTotal: { borderTopWidth: 1, borderTopColor: colors.divider, marginTop: 6, paddingTop: 8 },
  sumTotalLabel: { color: colors.text, fontWeight: '800' },
  sumTotalValue: { color: colors.primary, fontWeight: '800', fontSize: 18 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  footTotal: { color: colors.text, fontWeight: '800', fontSize: 20 },
  footMeta: { color: colors.muted, fontSize: 11 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radii.pill,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: '#fff', fontWeight: '800' },
});
