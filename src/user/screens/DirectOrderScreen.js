import React, { useCallback, useMemo, useState } from 'react';
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

// DIRECT ORDER — a stripped Confirm Order screen for special (VIP) customers.
// No items: just pickup address, delivery speed, payment method and a note.
// Same validation as the confirm page for the sections it keeps.
export default function DirectOrderScreen({ navigation }) {
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useI18n();
  const { addresses, selectedAddressId } = useApp();

  const [delivery, setDelivery] = useState('normal');
  const [payment, setPayment] = useState('cod');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const missing = useMemo(() => {
    const m = [];
    if (!selectedAddress && addresses.length === 0) m.push(t('confirmOrder.missingAddress'));
    if (!delivery) m.push(t('confirmOrder.missingDelivery'));
    if (!payment) m.push(t('confirmOrder.missingPayment'));
    return m;
  }, [selectedAddress, addresses.length, delivery, payment, t]);
  const canPlace = missing.length === 0;

  const handlePlaceOrder = useCallback(async () => {
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
    const address = selectedAddress || addresses[0];
    setPlacing(true);
    try {
      await api.post('/special-requests', {
        addressId: address.id,
        deliveryType: delivery === 'fast' ? 'fast' : 'normal',
        paymentMethod: payment,
        note: notes.trim(),
      });
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
  }, [missing, selectedAddress, addresses, delivery, payment, notes, navigation, t]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <Ionicons name="flash" size={18} color={colors.primary} />
          <Text style={styles.introText}>{t('directOrder.intro')}</Text>
        </View>

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
            const detail = [a.line1, a.line2, a.area, a.pincode].filter(Boolean).join(', ');
            return (
              <TouchableOpacity
                style={[styles.addrCard, styles.addrCardActive]}
                onPress={() => navigation.navigate('Addresses', { selectMode: true })}
              >
                <View style={[styles.addrIconBubble, styles.addrIconBubbleActive]}>
                  <Ionicons name={a.icon || 'location-outline'} size={16} color={colors.primary} />
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
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePlaceOrder}
          disabled={placing}
          style={{ flex: 1 }}
        >
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
                <Text style={styles.ctaText}>{t('directOrder.place')}</Text>
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
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  introText: { flex: 1, color: colors.primaryDark, fontSize: 12, fontWeight: '600' },
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radii.pill,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: '#fff', fontWeight: '800' },
});
