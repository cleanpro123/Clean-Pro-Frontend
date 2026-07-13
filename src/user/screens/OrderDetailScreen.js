import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { api } from '../../shared/api/client';
import { useI18n } from '../../shared/i18n/LanguageContext';

// The user-facing journey of an order. Each backend status maps onto one of
// these stages; everything up to and including the current stage is "done".
// label/desc hold i18n keys resolved at render time.
const STAGES = [
  { id: 'placed', label: 'orderDetail.stagePlacedLabel', desc: 'orderDetail.stagePlacedDesc', icon: 'receipt-outline' },
  { id: 'accepted', label: 'orderDetail.stageAcceptedLabel', desc: 'orderDetail.stageAcceptedDesc', icon: 'thumbs-up-outline' },
  { id: 'in_progress', label: 'orderDetail.stageInProgressLabel', desc: 'orderDetail.stageInProgressDesc', icon: 'water-outline' },
  { id: 'out_for_delivery', label: 'orderDetail.stageOutForDeliveryLabel', desc: 'orderDetail.stageOutForDeliveryDesc', icon: 'bicycle-outline' },
  { id: 'delivered', label: 'orderDetail.stageDeliveredLabel', desc: 'orderDetail.stageDeliveredDesc', icon: 'checkmark-circle-outline' },
];

// Collapse the richer backend statuses onto the five customer-visible stages.
function statusToStage(status) {
  switch (status) {
    case 'pending':
    case 'assigned':
      return 'placed';
    case 'accepted':
      return 'accepted';
    case 'in_progress':
      return 'in_progress';
    case 'out_for_delivery':
      return 'out_for_delivery';
    case 'delivered':
      return 'delivered';
    default:
      return 'placed';
  }
}

function stageIndex(status) {
  return Math.max(0, STAGES.findIndex((s) => s.id === statusToStage(status)));
}

// Maps backend status onto an i18n key resolved at render time.
const STATUS_LABEL = {
  pending: 'orderDetail.statusPending',
  accepted: 'orderDetail.statusAccepted',
  assigned: 'orderDetail.statusAssigned',
  in_progress: 'orderDetail.statusInProgress',
  out_for_delivery: 'orderDetail.statusOutForDelivery',
  delivered: 'orderDetail.statusDelivered',
  cancelled: 'orderDetail.statusCancelled',
};

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderDetailScreen({ route, navigation }) {
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, td } = useI18n();
  const orderId = route.params?.orderId;
  const [order, setOrder] = useState(route.params?.order || null);
  const [loading, setLoading] = useState(!route.params?.order);

  const load = useCallback(async () => {
    if (!orderId) return;
    try {
      setOrder(await api.get(`/requests/${orderId}`));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <DetailHeader navigation={navigation} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      </SafeAreaView>
    );
  }
  if (!order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <DetailHeader navigation={navigation} />
        <Text style={styles.emptyMsg}>{t('orderDetail.orderNotFound')}</Text>
      </SafeAreaView>
    );
  }

  const cancelled = order.status === 'cancelled';
  const delivered = order.status === 'delivered';
  const curIdx = stageIndex(order.status);

  // Pickup address arrives populated from the linked addressId.
  const addr = order.addressId && typeof order.addressId === 'object' ? order.addressId : null;
  const addressDetail = addr
    ? [addr.line1, addr.line2, addr.area || addr.city, addr.pincode].filter(Boolean).join(', ')
    : '';

  // Group line items by service so the receipt reads cleanly.
  const grouped = (order.items || []).reduce((acc, it) => {
    const k = it.service || 'wash';
    (acc[k] = acc[k] || []).push(it);
    return acc;
  }, {});
  const groupEntries = Object.entries(grouped);
  const itemCount = (order.items || []).reduce((n, it) => n + (it.qty || 0), 0);

  const payLabel =
    order.paymentMethod === 'cod'
      ? t('orderDetail.paymentCod')
      : order.paymentMethod === 'upi'
      ? 'UPI'
      : order.paymentMethod === 'card'
      ? t('orderDetail.paymentCard')
      : order.paymentMethod || '—';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <DetailHeader navigation={navigation} code={order.code} />

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {/* SUMMARY */}
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summary}
        >
          <View style={styles.summaryCircle1} />
          <View style={styles.summaryCircle2} />
          <View style={styles.summaryTop}>
            <View style={styles.summaryIcon}>
              <Ionicons name="cube" size={20} color={colors.card} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryCode}>{order.code}</Text>
              <Text style={styles.summarySub}>
                {t('orderDetail.summarySub', { count: itemCount, total: order.total })}
              </Text>
            </View>
            <View style={[styles.statusPill, cancelled && styles.statusPillCancel]}>
              <Text style={styles.statusPillText}>
                {STATUS_LABEL[order.status] ? t(STATUS_LABEL[order.status]) : order.status}
              </Text>
            </View>
          </View>
          <Text style={styles.summaryDate}>
            {t('orderDetail.placedOn', { date: fmtDate(order.placedAt || order.createdAt) })}
          </Text>
        </LinearGradient>

        {/* TRACKING TIMELINE */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('orderDetail.orderStatus')}</Text>
          {cancelled ? (
            <View style={styles.cancelBox}>
              <Ionicons name="close-circle" size={20} color={colors.danger} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cancelTitle}>{t('orderDetail.orderCancelled')}</Text>
                <Text style={styles.cancelSub}>
                  {t('orderDetail.cancelledOn', { date: fmtDate(order.updatedAt) })}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.timeline}>
              {STAGES.map((stage, i) => {
                const done = i < curIdx;
                const current = i === curIdx;
                const reached = done || current;
                const isLast = i === STAGES.length - 1;
                return (
                  <View key={stage.id} style={styles.tlRow}>
                    <View style={styles.tlGutter}>
                      <View
                        style={[
                          styles.tlDot,
                          reached && styles.tlDotActive,
                          current && styles.tlDotCurrent,
                        ]}
                      >
                        <Ionicons
                          name={done ? 'checkmark' : stage.icon}
                          size={14}
                          color={reached ? colors.card : colors.muted}
                        />
                      </View>
                      {!isLast && (
                        <View style={[styles.tlLine, done && styles.tlLineActive]} />
                      )}
                    </View>
                    <View style={[styles.tlBody, !isLast && { paddingBottom: spacing.lg }]}>
                      <Text style={[styles.tlLabel, reached && styles.tlLabelActive]}>
                        {t(stage.label)}
                      </Text>
                      <Text style={styles.tlDesc}>
                        {current ? t(stage.desc) : done ? t('orderDetail.completed') : t(stage.desc)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ITEMS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('orderDetail.items')}</Text>
          {groupEntries.map(([service, items], si) => (
            <View
              key={service}
              style={si < groupEntries.length - 1 ? styles.serviceGroup : null}
            >
              <Text style={styles.serviceLabel}>{td('service', service)}</Text>
              {items.map((it, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {td('item', it.name)}
                  </Text>
                  <Text style={styles.itemQty}>×{it.qty}</Text>
                  <Text style={styles.itemPrice}>QAR {it.price * it.qty}</Text>
                </View>
              ))}
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('orderDetail.total')}</Text>
            <Text style={styles.totalValue}>QAR {order.total}</Text>
          </View>
        </View>

        {/* PICKUP ADDRESS */}
        {addr && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('orderDetail.pickupAddress')}</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>{addr.label || t('orderDetail.address')}</Text>
                {!!addressDetail && <Text style={styles.infoSub}>{addressDetail}</Text>}
              </View>
            </View>
          </View>
        )}

        {/* ORDER INFO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('orderDetail.orderInfo')}</Text>
          <InfoLine icon="person-outline" label={t('orderDetail.customer')} value={order.userId?.name || t('orderDetail.you')} />
          <InfoLine
            icon="call-outline"
            label={t('orderDetail.phone')}
            value={order.userId?.phone || '—'}
            onPress={() =>
              order.userId?.phone &&
              Linking.openURL(`tel:${String(order.userId.phone).replace(/\s/g, '')}`)
            }
          />
          <InfoLine icon="wallet-outline" label={t('orderDetail.payment')} value={payLabel} />
          {!!order.note && (
            <InfoLine icon="document-text-outline" label={t('orderDetail.noteForAgent')} value={order.note} />
          )}
        </View>

        {/* RATE */}
        {delivered && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('RateOrder', { orderId: order.id })}
          >
            <LinearGradient
              colors={gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rateBtn}
            >
              <Ionicons name="star-outline" size={18} color={colors.card} />
              <Text style={styles.rateBtnText}>{t('orderDetail.rateThisOrder')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailHeader({ navigation, code }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useI18n();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} activeOpacity={0.8}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{t('orderDetail.orderDetails')}</Text>
        {!!code && <Text style={styles.headerSub}>{code}</Text>}
      </View>
    </View>
  );
}

function InfoLine({ icon, label, value, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap style={styles.infoRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoTitle, onPress && { color: colors.primary }]}>{value || '—'}</Text>
      </View>
    </Wrap>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: colors.muted, marginTop: 1 },
  emptyMsg: { color: colors.muted, textAlign: 'center', marginTop: 40 },

  summary: { borderRadius: radii.lg, padding: spacing.md, overflow: 'hidden', marginBottom: spacing.md },
  summaryCircle1: { position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: '#ffffff1a' },
  summaryCircle2: { position: 'absolute', bottom: -40, left: -10, width: 110, height: 110, borderRadius: 55, backgroundColor: '#ffffff12' },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryIcon: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: '#ffffff2e', alignItems: 'center', justifyContent: 'center' },
  summaryCode: { color: colors.card, fontWeight: '800', fontSize: 17 },
  summarySub: { color: '#ffffffd9', fontSize: 12, marginTop: 2 },
  statusPill: { backgroundColor: '#ffffff2e', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill },
  statusPillCancel: { backgroundColor: '#ef444455' },
  statusPillText: { color: colors.card, fontWeight: '700', fontSize: 11 },
  summaryDate: { color: '#ffffffcc', fontSize: 12, marginTop: spacing.sm },

  card: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  cardTitle: { fontSize: 13, fontWeight: '800', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.md },

  cancelBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#FEF2F2', borderRadius: radii.md, padding: spacing.md },
  cancelTitle: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  cancelSub: { color: colors.muted, fontSize: 12, marginTop: 2 },

  timeline: {},
  tlRow: { flexDirection: 'row', gap: spacing.md },
  tlGutter: { alignItems: 'center', width: 30 },
  tlDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border },
  tlDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tlDotCurrent: { transform: [{ scale: 1.12 }], shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  tlLine: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
  tlLineActive: { backgroundColor: colors.primary },
  tlBody: { flex: 1, paddingTop: 3 },
  tlLabel: { fontSize: 14, fontWeight: '600', color: colors.muted },
  tlLabelActive: { color: colors.text, fontWeight: '700' },
  tlDesc: { fontSize: 12, color: colors.muted, marginTop: 2 },

  serviceGroup: { paddingBottom: spacing.sm, marginBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  serviceLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: spacing.sm },
  itemName: { flex: 1, color: colors.text, fontSize: 13 },
  itemQty: { color: colors.muted, fontSize: 12, width: 36, textAlign: 'center' },
  itemPrice: { color: colors.text, fontSize: 13, fontWeight: '600', width: 64, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { color: colors.text, fontWeight: '700', fontSize: 14 },
  totalValue: { color: colors.primary, fontWeight: '800', fontSize: 16 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  infoIcon: { width: 36, height: 36, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { color: colors.muted, fontSize: 11 },
  infoTitle: { color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 1 },
  infoSub: { color: colors.muted, fontSize: 12, marginTop: 2, lineHeight: 17 },

  rateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: radii.pill },
  rateBtnText: { color: colors.card, fontWeight: '800', fontSize: 15 },
});
