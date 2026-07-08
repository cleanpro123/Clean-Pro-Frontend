import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../components/AdminHeader';
import { colors, radii, spacing } from '../../shared/theme/dark';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';

const BUSINESS_TYPE_LABEL = {
  laundry_company: 'Laundry company',
  clothing_company: 'Clothing company',
  authority: 'Authority',
  other: 'Other',
};

function DetailRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={15} color={colors.muted} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export default function AdminApprovalsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await api.get('/users?accountType=business&approvalStatus=pending');
      setItems(data);
    } catch (e) {
      setError(e.message);
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

  const decide = async (user, approvalStatus) => {
    setActingId(user.id);
    try {
      await api.patch(`/users/${user.id}/approval`, { approvalStatus });
      setItems((list) => list.filter((u) => u.id !== user.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setActingId(null);
    }
  };

  const onApprove = (user) =>
    confirmAction({
      title: `Approve ${user.company?.name || user.name}?`,
      message: 'They will be able to log in and use the app.',
      confirmLabel: 'Approve',
      onConfirm: () => decide(user, 'approved'),
    });

  const onReject = (user) =>
    confirmAction({
      title: `Reject ${user.company?.name || user.name}?`,
      message: 'They will not be able to access the app.',
      confirmLabel: 'Reject',
      destructive: true,
      onConfirm: () => decide(user, 'rejected'),
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title="Business approvals" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.muted} />
        }
      >
        {loading && items.length === 0 ? (
          <ActivityIndicator color={colors.muted} style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>No pending business requests.</Text>
          </View>
        ) : (
          items.map((u) => (
            <View key={u.id} style={styles.rowShadow}>
              <LinearGradient
                colors={['#2B3F6E', '#1B2B52']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.cardBorder} pointerEvents="none" />

                <View style={styles.headRow}>
                  <View style={styles.bizIcon}>
                    <Ionicons name="business" size={20} color={colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.company}>{u.company?.name || '—'}</Text>
                    <Text style={styles.type}>
                      {BUSINESS_TYPE_LABEL[u.company?.businessType] || 'Business'}
                    </Text>
                  </View>
                  <View style={styles.pendingPill}>
                    <Text style={styles.pendingText}>Pending</Text>
                  </View>
                </View>

                <View style={styles.details}>
                  <DetailRow icon="person-outline" label="Contact" value={u.name} />
                  <DetailRow icon="mail-outline" label="Email" value={u.email} />
                  <DetailRow icon="call-outline" label="Phone" value={u.phone} />
                  <DetailRow
                    icon="document-text-outline"
                    label="Reg. no"
                    value={u.company?.registrationNo}
                  />
                  <DetailRow icon="location-outline" label="Address" value={u.company?.address} />
                  <DetailRow icon="globe-outline" label="Website" value={u.company?.website} />
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.btn, styles.rejectBtn]}
                    activeOpacity={0.85}
                    disabled={actingId === u.id}
                    onPress={() => onReject(u)}
                  >
                    <Ionicons name="close" size={18} color={colors.danger} />
                    <Text style={[styles.btnText, { color: colors.danger }]}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.approveBtn]}
                    activeOpacity={0.85}
                    disabled={actingId === u.id}
                    onPress={() => onApprove(u)}
                  >
                    {actingId === u.id ? (
                      <ActivityIndicator color="#062E25" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={18} color="#062E25" />
                        <Text style={[styles.btnText, { color: '#062E25' }]}>Approve</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  rowShadow: {
    borderRadius: radii.lg,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  card: { padding: spacing.lg, borderRadius: radii.lg, overflow: 'hidden' },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bizIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  company: { color: colors.text, fontSize: 15, fontWeight: '500', letterSpacing: 0.3 },
  type: { color: colors.muted, fontSize: 12, marginTop: 2, fontWeight: '300' },
  pendingPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
  },
  pendingText: { color: '#FBBF24', fontSize: 10, fontWeight: '700' },
  details: {
    marginTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: spacing.md,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailLabel: { color: colors.muted, fontSize: 12, width: 60, fontWeight: '300' },
  detailValue: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '300' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  rejectBtn: {
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  approveBtn: { backgroundColor: '#34D399' },
  btnText: { fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.muted, fontWeight: '300' },
  errorText: { color: '#F87171', textAlign: 'center', marginTop: 24 },
});
