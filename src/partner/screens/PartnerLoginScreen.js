// Entry screen for the Clean Pro Partner app. Lets a partner choose whether to
// sign in as an Admin or an Agent, then routes to the existing login screens.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radii, spacing } from '../../shared/theme/dark';

export default function PartnerLoginScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <LinearGradient
        colors={gradients.ocean}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.logoBubble}>
          <Ionicons name="briefcase-outline" size={34} color={colors.primary} />
        </View>
        <Text style={styles.heroTitle}>Clean Pro Partner</Text>
        <Text style={styles.heroSub}>Admin &amp; agent workspace</Text>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.prompt}>Sign in as</Text>

        <RoleButton
          icon="shield-checkmark-outline"
          title="Admin"
          sub="Manage services, agents, orders & approvals"
          onPress={() => navigation.navigate('AdminLogin')}
        />
        <RoleButton
          icon="bicycle-outline"
          title="Agent"
          sub="View and complete assigned pickups & deliveries"
          onPress={() => navigation.navigate('AgentLogin')}
        />
      </View>
    </SafeAreaView>
  );
}

function RoleButton({ icon, title, sub, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={colors.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xl + 8,
    paddingBottom: spacing.xl + 16,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  logoBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  heroSub: { color: '#EAF4FF', fontSize: 14, marginTop: 6 },
  body: { flex: 1, padding: spacing.lg, gap: spacing.md },
  prompt: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  cardSub: { color: colors.muted, fontSize: 12, marginTop: 2, lineHeight: 16 },
});
