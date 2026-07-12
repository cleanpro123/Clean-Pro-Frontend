import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';
import { useI18n } from '../../shared/i18n/LanguageContext';

const hints = [
  { v: 1, key: 'hintDisappointing', emoji: '😞' },
  { v: 2, key: 'hintCouldBeBetter', emoji: '😕' },
  { v: 3, key: 'hintOkay', emoji: '😐' },
  { v: 4, key: 'hintGood', emoji: '🙂' },
  { v: 5, key: 'hintAmazing', emoji: '🤩' },
];

const tagOptions = [
  { id: 'On time pickup', key: 'tagOnTimePickup' },
  { id: 'Spotless clean', key: 'tagSpotlessClean' },
  { id: 'Neatly folded', key: 'tagNeatlyFolded' },
  { id: 'Friendly agent', key: 'tagFriendlyAgent' },
  { id: 'Fragrance', key: 'tagFragrance' },
  { id: 'Fast delivery', key: 'tagFastDelivery' },
  { id: 'Good price', key: 'tagGoodPrice' },
];

export default function RateOrderScreen({ route, navigation }) {
  const { t } = useI18n();
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const orderId = route.params?.orderId;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [selected, setSelected] = useState([]);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      if (orderId) setOrder(await api.get(`/requests/${orderId}`));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (t) =>
    setSelected((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const submit = async () => {
    if (rating === 0) {
      confirmAction({
        title: t('rateOrder.pickRatingTitle'),
        message: t('rateOrder.pickRatingMessage'),
        confirmLabel: t('rateOrder.ok'),
        onConfirm: () => {},
      });
      return;
    }
    setBusy(true);
    try {
      const full = [selected.join(' · '), comment.trim()]
        .filter(Boolean)
        .join('\n') || t(`rateOrder.${hints[rating - 1].key}`);
      await api.post('/reviews', {
        requestId: order?.id || orderId,
        rating,
        comment: full,
      });
      confirmAction({
        title: t('rateOrder.thankYouTitle'),
        message: t('rateOrder.reviewSubmitted'),
        confirmLabel: t('rateOrder.ok'),
        onConfirm: () => navigation.goBack(),
      });
    } catch (e) {
      confirmAction({
        title: t('rateOrder.couldNotSubmit'),
        message: e.message,
        confirmLabel: t('rateOrder.ok'),
        onConfirm: () => {},
      });
    } finally {
      setBusy(false);
    }
  };

  const hint = rating > 0 ? hints[rating - 1] : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
          ) : (
            <>
              <View style={styles.orderCard}>
                <View style={styles.orderIcon}>
                  <Ionicons name="cube-outline" size={26} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.orderId}>{order?.code || '—'}</Text>
                  <Text style={styles.orderSub}>
                    {t('rateOrder.itemsTotal', { count: order?.items?.length || 0, total: order?.total || 0 })}
                  </Text>
                </View>
              </View>

              <Text style={styles.q}>{t('rateOrder.howWasExperience')}</Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setRating(n)} activeOpacity={0.7}>
                    <Ionicons
                      name={n <= rating ? 'star' : 'star-outline'}
                      size={42}
                      color={n <= rating ? '#F59E0B' : colors.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {hint && (
                <View style={styles.hint}>
                  <Text style={styles.hintEmoji}>{hint.emoji}</Text>
                  <Text style={styles.hintLabel}>{t(`rateOrder.${hint.key}`)}</Text>
                </View>
              )}

              <Text style={styles.section}>{t('rateOrder.whatStoodOut')}</Text>
              <View style={styles.tags}>
                {tagOptions.map((opt) => {
                  const active = selected.includes(opt.id);
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => toggle(opt.id)}
                      style={[styles.tag, active && styles.tagActive]}
                    >
                      <Text style={[styles.tagText, active && styles.tagTextActive]}>{t(`rateOrder.${opt.key}`)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.section}>{t('rateOrder.anythingElse')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('rateOrder.shareDetails')}
                placeholderTextColor={colors.muted}
                multiline
                value={comment}
                onChangeText={setComment}
                textAlignVertical="top"
              />

              <TouchableOpacity activeOpacity={0.85} onPress={submit} disabled={busy}>
                <LinearGradient
                  colors={gradients.brand}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cta}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="send" size={18} color="#fff" />
                      <Text style={styles.ctaText}>{t('rateOrder.submitReview')}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  orderCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md },
  orderIcon: { width: 52, height: 52, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  orderId: { fontWeight: '800', color: colors.text, fontSize: 15 },
  orderSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  q: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: spacing.lg },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  hint: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: spacing.sm, backgroundColor: '#FEF3C7', paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill },
  hintEmoji: { fontSize: 20 },
  hintLabel: { color: '#B45309', fontWeight: '700' },
  section: { fontSize: 13, color: colors.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tagActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tagText: { color: colors.textSecondary, fontWeight: '600', fontSize: 12 },
  tagTextActive: { color: '#fff' },
  input: { backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.md, minHeight: 110, color: colors.text, fontSize: 14 },
  cta: { flexDirection: 'row', paddingVertical: 14, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
