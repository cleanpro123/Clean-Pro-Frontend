import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../shared/theme/dark';
import MapPreview from '../../shared/components/MapPreview';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';
import { useI18n } from '../../shared/i18n/LanguageContext';

function PillRow({ icon, children }) {
  return (
    <View style={styles.pillShadow}>
      <LinearGradient
        colors={['#2B3F6E', '#1B2B52']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pill}
      >
        <View style={styles.pillBorder} pointerEvents="none" />
        <View style={styles.iconBubble}>
          <Ionicons name={icon} size={16} color={colors.text} />
        </View>
        <View style={{ flex: 1 }}>{children}</View>
      </LinearGradient>
    </View>
  );
}

function ActionBtn({ label, icon, onPress, primary }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.actionShadow}>
      <LinearGradient
        colors={primary ? ['#4866B8', '#1B2B52'] : ['#2B3F6E', '#1B2B52']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.action}
      >
        <View style={styles.actionBorder} pointerEvents="none" />
        <Text style={styles.actionText}>{label}</Text>
        {icon ? <Ionicons name={icon} size={16} color={colors.text} /> : null}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function AgentRequestDetailScreen({ route, navigation }) {
  const { t } = useI18n();
  const id = route.params?.id;
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  const load = useCallback(async () => {
    try {
      setReq(await api.get(`/requests/${id}`));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.muted} style={{ marginTop: 32 }} />
      </SafeAreaView>
    );
  }
  if (!req) return null;

  // Price is editable until the order is delivered or cancelled.
  const canEditPrice = req.status !== 'delivered' && req.status !== 'cancelled';

  const openPriceModal = () => {
    setPriceInput(String(req.total ?? ''));
    setPriceModalVisible(true);
  };

  const savePrice = async () => {
    const value = Number(priceInput);
    if (!Number.isFinite(value) || value < 0) return;
    setSavingPrice(true);
    try {
      const updated = await api.patch(`/requests/${req.id}/total`, { total: value });
      setReq(updated);
      setPriceModalVisible(false);
    } catch (e) {
      confirmAction({
        title: t('agentRequestDetail.priceUpdateFailed'),
        message: e.message || '',
        confirmLabel: t('agentRequestDetail.ok'),
        onConfirm: () => {},
      });
    } finally {
      setSavingPrice(false);
    }
  };

  const setStatus = async (status, label) => {
    confirmAction({
      title: `${label}?`,
      confirmLabel: label,
      onConfirm: async () => {
        try {
          const updated = await api.patch(`/requests/${req.id}/status`, { status });
          setReq(updated);
        } catch (e) {
          confirmAction({
            title: t('agentRequestDetail.couldNotUpdate'),
            message: e.message,
            confirmLabel: t('agentRequestDetail.ok'),
            onConfirm: () => {},
          });
        }
      },
    });
  };

  const grouped = (req.items || []).reduce((acc, it) => {
    const k = it.service || 'wash';
    (acc[k] = acc[k] || []).push(it);
    return acc;
  }, {});
  const groupEntries = Object.entries(grouped);

  // Pickup address arrives populated from the linked addressId; render its
  // label + full details. If the address was since deleted it comes back null.
  const addr = req.addressId && typeof req.addressId === 'object' ? req.addressId : null;
  const addressDetail = addr
    ? [addr.line1, addr.line2, addr.area, addr.pincode].filter(Boolean).join(', ')
    : '';
  const addressTitle = addr?.label || t('agentRequestDetail.addressUnavailable');
  const mapsQuery = [addressTitle, addressDetail].filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('agentRequestDetail.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <PillRow icon="person">
          <Text style={styles.pillValue}>{req.userId?.name || t('agentRequestDetail.customer')}</Text>
        </PillRow>

        <TouchableOpacity
          onPress={() => Linking.openURL(`tel:${(req.userId?.phone || '').replace(/\s/g, '')}`)}
          activeOpacity={0.85}
        >
          <PillRow icon="call">
            <Text style={styles.pillValue}>{req.userId?.phone || '—'}</Text>
          </PillRow>
        </TouchableOpacity>

        {addr ? (
          <MapPreview place={mapsQuery} lat={addr?.lat} lng={addr?.lng} />
        ) : (
          <PillRow icon="location-sharp">
            <Text style={styles.pillValue}>{addressTitle}</Text>
          </PillRow>
        )}

        {!!req.note && (
          <PillRow icon="document-text">
            <Text style={styles.pillSub}>{t('agentRequestDetail.noteFromCustomer')}</Text>
            <Text style={styles.pillValue}>{req.note}</Text>
          </PillRow>
        )}

        <View style={styles.itemsShadow}>
          <LinearGradient
            colors={['#2B3F6E', '#1B2B52']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.itemsCard}
          >
            <View style={styles.itemsBorder} pointerEvents="none" />
            {groupEntries.map(([service, items], si) => (
              <View
                key={service}
                style={si < groupEntries.length - 1 ? styles.serviceGroup : null}
              >
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceLabel}>{service}</Text>
                </View>
                {items.map((it, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemIdx}>{String(idx + 1).padStart(2, '0')}.</Text>
                    <Text style={styles.itemName}>{it.name}</Text>
                    <Text style={styles.itemQty}>{String(it.qty).padStart(2, '0')}</Text>
                    <Text style={styles.itemPrice}>$ {it.price * it.qty}</Text>
                  </View>
                ))}
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('agentRequestDetail.total')}</Text>
              <Text style={styles.totalValue}>QAR {req.total}</Text>
              {canEditPrice && (
                <TouchableOpacity onPress={openPriceModal} hitSlop={10} style={styles.editPriceBtn}>
                  <Ionicons name="create-outline" size={16} color={colors.text} />
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </View>

        <View style={styles.actions}>
          {req.status === 'assigned' && (
            <>
              <ActionBtn label={t('agentRequestDetail.rejectRequest')} onPress={() => setStatus('cancelled', t('agentRequestDetail.reject'))} />
              <ActionBtn label={t('agentRequestDetail.acceptRequest')} primary onPress={() => setStatus('accepted', t('agentRequestDetail.accept'))} />
            </>
          )}
          {req.status === 'accepted' && (
            <ActionBtn label={t('agentRequestDetail.startWork')} icon="hammer" primary onPress={() => setStatus('in_progress', t('agentRequestDetail.start'))} />
          )}
          {req.status === 'in_progress' && (
            <ActionBtn label={t('agentRequestDetail.outForDelivery')} icon="car" primary onPress={() => setStatus('out_for_delivery', t('agentRequestDetail.outForDelivery'))} />
          )}
          {req.status === 'out_for_delivery' && (
            <ActionBtn label={t('agentRequestDetail.markDelivered')} icon="checkmark-done" primary onPress={() => setStatus('delivered', t('agentRequestDetail.deliver'))} />
          )}
          {(req.status === 'delivered' || req.status === 'cancelled') && (
            <Text style={styles.completed}>{t('agentRequestDetail.requestClosed')}</Text>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={priceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPriceModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setPriceModalVisible(false)}
          />
          <View style={styles.modalShadow}>
            <LinearGradient
              colors={['#2B3F6E', '#1B2B52']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modal}
            >
              <View style={styles.modalBorder} pointerEvents="none" />
              <Text style={styles.modalTitle}>{t('agentRequestDetail.editTotal')}</Text>
              <View style={styles.priceInputRow}>
                <Text style={styles.priceCurrency}>QAR</Text>
                <TextInput
                  style={styles.priceInput}
                  value={priceInput}
                  onChangeText={(v) => setPriceInput(v.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[styles.modalBtn, styles.savePriceBtn]}
                onPress={savePrice}
                disabled={savingPrice}
              >
                <Text style={styles.savePriceText}>
                  {savingPrice ? t('agentRequestDetail.saving') : t('common.save')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setPriceModalVisible(false)}
                disabled={savingPrice}
              >
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.06)', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', color: colors.text, fontSize: 18, fontWeight: '300', letterSpacing: 1 },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  pillShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: radii.md, gap: spacing.md, overflow: 'hidden' },
  pillBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  iconBubble: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.10)', alignItems: 'center', justifyContent: 'center' },
  pillValue: { color: colors.text, fontSize: 14, fontWeight: '300', letterSpacing: 0.3, lineHeight: 20 },
  pillSub: { color: colors.muted, fontSize: 12, fontWeight: '300', marginTop: 2, lineHeight: 17 },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  mapsBtnText: { color: colors.text, fontSize: 12, fontWeight: '400', letterSpacing: 0.3 },
  itemsShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  itemsCard: { padding: spacing.md, borderRadius: radii.md, overflow: 'hidden' },
  itemsBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  serviceGroup: { paddingBottom: spacing.sm, marginBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.06)' },
  serviceHeader: { marginTop: 4, marginBottom: 6 },
  serviceLabel: { color: colors.text, fontSize: 12, fontWeight: '400', letterSpacing: 1, textTransform: 'uppercase' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingLeft: spacing.lg },
  itemIdx: { color: colors.muted, fontSize: 12, width: 28, fontWeight: '300' },
  itemName: { color: colors.text, flex: 1, fontSize: 13, fontWeight: '300' },
  itemQty: { color: colors.muted, fontSize: 12, width: 30, textAlign: 'center', fontWeight: '300' },
  itemPrice: { color: colors.text, width: 70, textAlign: 'right', fontSize: 13, fontWeight: '300' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.10)', gap: spacing.md },
  totalLabel: { color: colors.muted, fontSize: 12, fontWeight: '300' },
  totalValue: { color: colors.text, fontSize: 14, fontWeight: '400' },
  actions: { marginTop: spacing.md, gap: spacing.sm + 4 },
  actionShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: radii.md, gap: 8, overflow: 'hidden' },
  actionBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' },
  actionText: { color: colors.text, fontSize: 14, fontWeight: '300', letterSpacing: 0.5 },
  completed: { color: colors.muted, textAlign: 'center', fontWeight: '300', paddingVertical: spacing.md },
  editPriceBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  modalRoot: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalShadow: { borderRadius: radii.lg, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 14 },
  modal: { padding: spacing.lg, borderRadius: radii.lg, overflow: 'hidden' },
  modalBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '300', letterSpacing: 1, marginBottom: spacing.md },
  priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', paddingHorizontal: spacing.md, marginBottom: spacing.md },
  priceCurrency: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  priceInput: { flex: 1, color: colors.text, fontSize: 20, fontWeight: '600', paddingVertical: 12 },
  modalBtn: { paddingVertical: 12, borderRadius: radii.md, alignItems: 'center', borderWidth: 1 },
  savePriceBtn: { borderColor: 'rgba(52, 211, 153, 0.45)', backgroundColor: 'rgba(15, 118, 110, 0.35)', marginBottom: spacing.sm },
  savePriceText: { color: '#34D399', fontWeight: '700', letterSpacing: 0.5 },
  cancelBtn: { borderColor: 'rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(255, 255, 255, 0.04)' },
  cancelText: { color: colors.muted, fontWeight: '400', letterSpacing: 0.5 },
});
