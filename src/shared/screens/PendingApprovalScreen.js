import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radii, spacing } from '../theme/colors';

export default function PendingApprovalScreen({ navigation, route }) {
  const company = route?.params?.company;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <LinearGradient
          colors={gradients.sky}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badge}
        >
          <Ionicons name="time-outline" size={48} color="#fff" />
        </LinearGradient>

        <Text style={styles.title}>Request submitted</Text>
        <Text style={styles.sub}>
          {company ? `Thanks, ${company}! ` : ''}Your business account request has
          been sent to our admin team for review.
        </Text>

        <View style={styles.steps}>
          <Row icon="checkmark-circle" color={colors.success} text="Details received" />
          <Row icon="shield-checkmark-outline" color={colors.primary} text="Admin is verifying your company details" />
          <Row icon="mail-unread-outline" color={colors.muted} text="We'll email you as soon as you're approved" />
        </View>

        <Text style={styles.note}>
          You'll be able to log in once your account is approved. We'll get back to
          you as soon as possible.
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Login')}
        style={styles.btnWrap}
      >
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.btn}
        >
          <Text style={styles.btnText}>Back to login</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function Row({ icon, color, text }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  steps: {
    alignSelf: 'stretch',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
  note: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 20,
  },
  btnWrap: { marginTop: spacing.lg },
  btn: { paddingVertical: 16, borderRadius: radii.md, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
