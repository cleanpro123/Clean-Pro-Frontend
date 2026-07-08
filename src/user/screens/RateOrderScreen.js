import React, { useCallback, useEffect, useState } from 'react';
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
import { colors, gradients, radii, spacing } from '../../shared/theme/colors';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';

const hints = [
  { v: 1, label: 'Disappointing', emoji: '😞' },
  { v: 2, label: 'Could be better', emoji: '😕' },
  { v: 3, label: 'Okay', emoji: '😐' },
  { v: 4, label: 'Good', emoji: '🙂' },
  { v: 5, label: 'Amazing!', emoji: '🤩' },
];

const tagOptions = [
  'On time pickup', 'Spotless clean', 'Neatly folded',
  'Friendly agent', 'Fragrance', 'Fast delivery', 'Good price',
];

export default function RateOrderScreen({ route, navigation }) {
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
        title: 'Pick a rating',
        message: 'Tap a star to rate your experience.',
        confirmLabel: 'OK',
        onConfirm: () => {},
      });
      return;
    }
    setBusy(true);
    try {
      const full = [selected.join(' · '), comment.trim()]
        .filter(Boolean)
        .join('\n') || hints[rating - 1].label;
      await api.post('/reviews', {
        requestId: order?.id || orderId,
        rating,
        comment: full,
      });
      confirmAction({
        title: 'Thank you!',
        message: 'Your review has been submitted for approval.',
        confirmLabel: 'OK',
        onConfirm: () => navigation.goBack(),
      });
    } catch (e) {
      confirmAction({
        title: 'Could not submit',
        message: e.message,
        confirmLabel: 'OK',
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
                    {order?.items?.length || 0} items · ₹{order?.total || 0}
                  </Text>
                </View>
              </View>

              <Text style={styles.q}>How was your experience?</Text>

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
                  <Text style={styles.hintLabel}>{hint.label}</Text>
                </View>
              )}

              <Text style={styles.section}>What stood out?</Text>
              <View style={styles.tags}>
                {tagOptions.map((t) => {
                  const active = selected.includes(t);
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => toggle(t)}
                      style={[styles.tag, active && styles.tagActive]}
                    >
                      <Text style={[styles.tagText, active && styles.tagTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.section}>Anything else? (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Share details..."
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
                      <Text style={styles.ctaText}>Submit review</Text>
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

const styles = StyleSheet.create({
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
