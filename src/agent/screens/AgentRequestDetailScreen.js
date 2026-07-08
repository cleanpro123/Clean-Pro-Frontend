import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../shared/theme/dark';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';

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
  const id = route.params?.id;
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);

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
            title: 'Could not update',
            message: e.message,
            confirmLabel: 'OK',
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
  const addressTitle = addr?.label || 'Address unavailable';
  const mapsQuery = [addressTitle, addressDetail].filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Request details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <PillRow icon="person">
          <Text style={styles.pillValue}>{req.customerName}</Text>
        </PillRow>

        <TouchableOpacity
          onPress={() => Linking.openURL(`tel:${(req.phone || '').replace(/\s/g, '')}`)}
          activeOpacity={0.85}
        >
          <PillRow icon="call">
            <Text style={styles.pillValue}>{req.phone}</Text>
          </PillRow>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(mapsQuery)}`)
          }
          activeOpacity={0.85}
        >
          <PillRow icon="location-sharp">
            <Text style={styles.pillValue}>{addressTitle}</Text>
            {!!addressDetail && <Text style={styles.pillSub}>{addressDetail}</Text>}
          </PillRow>
        </TouchableOpacity>

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
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>$ {req.total}</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.actions}>
          {req.status === 'assigned' && (
            <>
              <ActionBtn label="Reject request" onPress={() => setStatus('cancelled', 'Reject')} />
              <ActionBtn label="Accept request" primary onPress={() => setStatus('accepted', 'Accept')} />
            </>
          )}
          {req.status === 'accepted' && (
            <ActionBtn label="Start work" icon="hammer" primary onPress={() => setStatus('in_progress', 'Start')} />
          )}
          {req.status === 'in_progress' && (
            <ActionBtn label="Out for delivery" icon="car" primary onPress={() => setStatus('out_for_delivery', 'Out for delivery')} />
          )}
          {req.status === 'out_for_delivery' && (
            <ActionBtn label="Mark delivered" icon="checkmark-done" primary onPress={() => setStatus('delivered', 'Deliver')} />
          )}
          {(req.status === 'delivered' || req.status === 'cancelled') && (
            <Text style={styles.completed}>This request is closed.</Text>
          )}
        </View>
      </ScrollView>
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
});
