import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';

export default function AdminHeader({ title, onBack, rightAction }) {
  const { colors, gradients } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, gradients), [colors, gradients]);
  return (
    <LinearGradient colors={gradients.header} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.row}>
      <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
        <Ionicons name="arrow-back" size={22} color={colors.headerText} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 40 }}>
        {rightAction ? (
          <TouchableOpacity style={styles.iconBtn} onPress={rightAction.onPress}>
            <Ionicons name={rightAction.icon} size={22} color={colors.headerText} />
          </TouchableOpacity>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const makeStyles = (colors, gradients) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.headerBackground,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.headerButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: colors.headerText,
  },
});
