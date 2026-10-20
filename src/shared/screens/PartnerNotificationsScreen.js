import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../state/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import { api } from '../api/client';

// Show recent order updates using the existing role-scoped order endpoints.
export default function PartnerNotificationsScreen({ navigation }) {
  const { colors, gradients } = useTheme();
  const { role } = useAuth();
  const { t } = useI18n();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const suffix = role === 'agent' ? '/assigned' : '';
      const [normal, special] = await Promise.all([
        api.getAll(`/requests${suffix}`),
        api.getAll(`/special-requests${suffix}`),
      ]);
      setUpdates([
        ...normal.map(order => ({ ...order, kind: 'normal' })),
        ...special.map(order => ({ ...order, kind: 'special' })),
      ].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, 30));
    } catch (e) {
      setError(e.message || t('partnerNotifications.error'));
    } finally {
      setLoading(false);
    }
  }, [role, t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <LinearGradient colors={gradients.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('partnerNotifications.back')}
          onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.headerText} />
        </TouchableOpacity>
        <Text style={{ color: colors.headerText, fontSize: 20, fontWeight: '600' }}>{t('partnerNotifications.title')}</Text>
      </LinearGradient>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}>
        <Text style={{ color: colors.muted }}>{t('partnerNotifications.subtitle')}</Text>
        {error ? <View><Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={load}><Text style={{ color: colors.primary }}>{t('status.retry')}</Text></TouchableOpacity>
        </View> : null}
        {loading && !updates.length ? <ActivityIndicator color={colors.primary} /> : null}
        {!loading && !error && !updates.length ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
            <Ionicons name="notifications-outline" size={40} color={colors.primary} />
            <Text style={{ color: colors.text }}>{t('partnerNotifications.empty')}</Text>
          </View>
        ) : null}
        {updates.map(order => (
          <TouchableOpacity key={`${order.kind}-${order.id}`} accessibilityRole="button" accessibilityLabel={order.code}
            onPress={() => navigation.navigate(role === 'agent' ? 'AgentRequestDetail' : 'AdminRequestView', { id: order.id, kind: order.kind })}>
            <LinearGradient colors={gradients.panel} style={{ padding: 16, borderRadius: 16,
              borderWidth: 1, borderColor: colors.border, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Ionicons name="receipt-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{order.userId?.name || t('partnerNotifications.order')}</Text>
                <Text style={{ color: colors.muted }}>{order.code}</Text>
                <Text style={{ color: colors.textSecondary }}>{t(`partnerNotifications.status.${order.status}`)}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{new Date(order.updatedAt || order.createdAt || order.placedAt).toLocaleString()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
