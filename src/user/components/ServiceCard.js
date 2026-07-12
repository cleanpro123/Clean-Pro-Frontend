import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { useI18n } from '../../shared/i18n/LanguageContext';

export default function ServiceCard({ service, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useI18n();
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: service.color + '22' }]}>
        <Ionicons name={service.icon} size={26} color={service.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{service.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>
          {service.description}
        </Text>
        <Text style={styles.meta}>
          {t('serviceCard.priceMeta', {
            price: service.pricePerKg,
            unit: service.unit,
            hours: service.turnaroundHours,
          })}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </TouchableOpacity>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  desc: { fontSize: 13, color: colors.muted, marginTop: 2 },
  meta: { fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: '600' },
});
