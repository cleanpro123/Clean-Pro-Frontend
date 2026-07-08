import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../components/AdminHeader';
import { colors, radii, spacing } from '../../shared/theme/dark';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';

const statusMeta = {
  pending: { label: 'Pending', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' },
  accepted: { label: 'Accepted', color: '#22D3EE', bg: 'rgba(34, 211, 238, 0.18)' },
  assigned: { label: 'Assigned', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.18)' },
  in_progress: { label: 'In progress', color: '#22D3EE', bg: 'rgba(34, 211, 238, 0.18)' },
  out_for_delivery: { label: 'Out', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.18)' },
  delivered: { label: 'Delivered', color: '#34D399', bg: 'rgba(52, 211, 153, 0.18)' },
  cancelled: { label: 'Cancelled', color: '#F87171', bg: 'rgba(248, 113, 113, 0.18)' },
};

function PillRow({ icon, children, onPress }) {
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap activeOpacity={0.85} onPress={onPress} style={styles.pillShadow}>
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
    </Wrap>
  );
}

function ActionBtn({ label, icon, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.actionShadow}>
      <View style={styles.action}>
        <View style={styles.actionBorder} pointerEvents="none" />
        <Text style={styles.actionText}>{label}</Text>
        {icon && <Ionicons name={icon} size={18} color={colors.text} />}
      </View>
    </TouchableOpacity>
  );
}

export default function AdminRequestViewScreen({ route, navigation }) {
  const id = route.params?.id;
  const [req, setReq] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentModalVisible, setAgentModalVisible] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, ag] = await Promise.all([
        api.get(`/requests/${id}`),
        api.get('/agents').catch(() => []),
      ]);
      setReq(r);
      setAgents(ag);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AdminHeader title="Request details" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.muted} style={{ marginTop: 32 }} />
      </SafeAreaView>
    );
  }
  if (!req) return null;
  const meta = statusMeta[req.status] || statusMeta.pending;

  const setStatus = (status) => {
    confirmAction({
      title: `Set status to ${status}?`,
      confirmLabel: 'Update',
      onConfirm: async () => {
        const updated = await api.patch(`/requests/${req.id}/status`, { status });
        setReq(updated);
      },
    });
  };

  // Assign (or re-assign) the request to a delivery agent. Hits the admin
  // assign endpoint, which also moves the request into the "assigned" state.
  // Like the status actions, this first asks for confirmation before applying.
  const assignAgent = (agentId) => {
    if (assigning) return;
    if (agentId === req.agentId) {
      setAgentModalVisible(false);
      return;
    }
    const agent = agents.find((a) => a.id === agentId);
    const isChange = !!req.agentId;
    confirmAction({
      title: isChange
        ? `Change agent to ${agent?.name || 'this agent'}?`
        : `Assign to ${agent?.name || 'this agent'}?`,
      confirmLabel: isChange ? 'Change' : 'Assign',
      onConfirm: async () => {
        setAssigning(true);
        try {
          const updated = await api.post(`/requests/${req.id}/assign`, { agentId });
          setReq(updated);
          setAgentModalVisible(false);
        } finally {
          setAssigning(false);
        }
      },
    });
  };

  // Pickup address arrives populated from the linked addressId; render its
  // label + full details. If the address was since deleted it comes back null.
  const addr = req.addressId && typeof req.addressId === 'object' ? req.addressId : null;
  const addressDetail = addr
    ? [addr.line1, addr.line2, addr.area, addr.pincode].filter(Boolean).join(', ')
    : '';
  const addressTitle = addr?.label || 'Address unavailable';
  const mapsQuery = [addressTitle, addressDetail].filter(Boolean).join(', ');

  // Group items by service
  const grouped = (req.items || []).reduce((acc, it) => {
    const key = it.service || 'wash';
    (acc[key] = acc[key] || []).push(it);
    return acc;
  }, {});
  const groupEntries = Object.entries(grouped);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{req.code}</Text>
        <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
          <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <PillRow icon="person">
          <Text style={styles.pillValue}>{req.customerName}</Text>
        </PillRow>
        <PillRow
          icon="call"
          onPress={() => Linking.openURL(`tel:${(req.phone || '').replace(/\s/g, '')}`)}
        >
          <Text style={styles.pillValue}>{req.phone}</Text>
        </PillRow>
        <PillRow
          icon="location-sharp"
          onPress={() =>
            Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(mapsQuery)}`)
          }
        >
          <Text style={styles.pillValue}>{addressTitle}</Text>
          {!!addressDetail && <Text style={styles.itemSub}>{addressDetail}</Text>}
        </PillRow>

        {req.agentId ? (() => {
          const ag = agents.find((a) => a.id === req.agentId);
          return ag ? (
            <PillRow
              icon="bicycle"
              onPress={() => Linking.openURL(`tel:${(ag.phone || '').replace(/\s/g, '')}`)}
            >
              {/* <Text style={styles.pillLabel}>Assigned agent</Text> */}
              <Text style={styles.pillValue}>{ag.name} · {ag.phone}</Text>

            </PillRow>

          ) : null;
        })() : null}

        <View style={styles.itemsShadow}>
          <LinearGradient
            colors={['#2B3F6E', '#1B2B52']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.itemsCard}
          >
            <View style={styles.itemsBorder} pointerEvents="none" />
            {groupEntries.length === 0 ? (
              <Text style={styles.emptyText}>No items in this request.</Text>
            ) : (
              groupEntries.map(([service, items], si) => (
                <View
                  key={service}
                  style={si < groupEntries.length - 1 ? styles.serviceGroup : null}
                >
                  <View style={styles.serviceHeader}>
                    <View style={styles.serviceIconBubble}>
                      <Ionicons name="cube-outline" size={14} color={colors.text} />
                    </View>
                    <Text style={styles.serviceLabel}>{service}</Text>
                  </View>
                  {items.map((it, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemIdx}>
                        {String(idx + 1).padStart(2, '0')}.
                      </Text>
                      <Text style={styles.itemName}>{it.name}</Text>
                      <Text style={styles.itemQty}>
                        {String(it.qty).padStart(2, '0')}
                      </Text>
                      <Text style={styles.itemPrice}>₹ {it.price * it.qty}</Text>
                    </View>
                  ))}
                </View>
              ))
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹ {req.total}</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.actions}>
          {req.status === 'pending' && (
            <>
              <ActionBtn label="Accept" icon="checkmark" onPress={() => setStatus('accepted')} />
              <ActionBtn label="Cancel" icon="ban" onPress={() => setStatus('cancelled')} />
            </>
          )}
          {req.status === 'assigned' && (
            <ActionBtn label="Mark in progress" icon="hammer" onPress={() => setStatus('in_progress')} />
          )}
          {req.status === 'in_progress' && (
            <ActionBtn label="Out for delivery" icon="car" onPress={() => setStatus('out_for_delivery')} />
          )}
          {req.status === 'out_for_delivery' && (
            <ActionBtn label="Delivered" icon="checkmark-done" onPress={() => setStatus('delivered')} />
          )}
        </View>



        {req.status !== 'delivered' && req.status !== 'cancelled' && (
          <View style={styles.actions}>
            <ActionBtn
              label={req.agentId ? 'Change agent' : 'Assign agent'}
              icon="people"
              onPress={() => setAgentModalVisible(true)}
            />
          </View>
        )}
      </ScrollView>

      <Modal
        visible={agentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAgentModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setAgentModalVisible(false)}
          />
          <View style={styles.modalShadow}>
            
            <LinearGradient
              colors={['#2B3F6E', '#1B2B52']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modal}
            >
              <View style={styles.modalBorder} pointerEvents="none" />
              <Text style={styles.modalTitle}>Select agent</Text>
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {agents.length === 0 ? (
                  <Text style={styles.emptyText}>No agents available.</Text>
                ) : (
                  agents.map((a) => {
                    const current = a.id === req.agentId;
                    return (
                      <TouchableOpacity
                        key={a.id}
                        activeOpacity={0.7}
                        disabled={assigning}
                        onPress={() => assignAgent(a.id)}
                        style={styles.agentRow}
                      >
                        <View style={styles.iconBubble}>
                          <Ionicons name="bicycle" size={16} color={colors.text} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pillValue}>{a.name}</Text>
                          {!!a.phone && (
                            <Text style={styles.itemSub}>{a.phone}</Text>
                          )}
                        </View>
                        {current ? (
                          <Ionicons name="checkmark-circle" size={18} color="#34D399" />
                        ) : assigning ? null : (
                          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setAgentModalVisible(false)}
                disabled={assigning}
              >
                <Text style={styles.cancelText}>
                  {assigning ? 'Assigning…' : 'Cancel'}
                </Text>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.06)', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', color: colors.text, fontSize: 18, fontWeight: '300', letterSpacing: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  pillShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: radii.md, gap: spacing.md, overflow: 'hidden' },
  pillBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  iconBubble: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.10)', alignItems: 'center', justifyContent: 'center' },
  pillValue: { color: colors.text, fontSize: 14, fontWeight: '300', letterSpacing: 0.3, lineHeight: 20 },
  itemsShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  itemsCard: { padding: spacing.md, borderRadius: radii.md, overflow: 'hidden' },
  itemsBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  serviceGroup: { paddingBottom: spacing.sm, marginBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.06)' },
  serviceHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4, marginBottom: 6 },
  serviceIconBubble: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255, 255, 255, 0.10)', alignItems: 'center', justifyContent: 'center' },
  serviceLabel: { color: colors.text, fontSize: 12, fontWeight: '400', letterSpacing: 1, textTransform: 'uppercase' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingLeft: spacing.lg },
  itemIdx: { color: colors.muted, fontSize: 12, width: 28, fontWeight: '300' },
  itemName: { color: colors.text, flex: 1, fontSize: 13, fontWeight: '300' },
  itemSub: { color: colors.muted, fontSize: 11, fontWeight: '300', marginTop: 2 },
  itemQty: { color: colors.muted, fontSize: 12, width: 30, textAlign: 'center', fontWeight: '300' },
  itemPrice: { color: colors.text, width: 70, textAlign: 'right', fontSize: 13, fontWeight: '300' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.10)', gap: spacing.md },
  totalLabel: { color: colors.muted, fontSize: 12, fontWeight: '300' },
  totalValue: { color: colors.text, fontSize: 14, fontWeight: '400' },
  emptyText: { color: colors.muted, fontStyle: 'italic' },
  actions: { marginTop: spacing.md, gap: spacing.sm + 4 },
  actionShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: spacing.lg, borderRadius: radii.md, gap: spacing.md, backgroundColor: 'rgba(43, 63, 110, 0.45)', overflow: 'hidden' },
  actionBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.md, borderWidth: 1.2, borderColor: 'rgba(180, 200, 240, 0.55)' },
  actionText: { color: colors.text, fontSize: 14, fontWeight: '300', letterSpacing: 0.8 },
  modalRoot: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  modalShadow: { borderRadius: radii.lg, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  modal: { borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm + 4, overflow: 'hidden' },
  modalBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '300', letterSpacing: 1, marginBottom: spacing.sm },
  agentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  modalBtn: { paddingVertical: 12, borderRadius: radii.md, alignItems: 'center', borderWidth: 1 },
  cancelBtn: { borderColor: 'rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(255, 255, 255, 0.04)' },
  cancelText: { color: colors.muted, fontWeight: '400', letterSpacing: 0.5 },
});
