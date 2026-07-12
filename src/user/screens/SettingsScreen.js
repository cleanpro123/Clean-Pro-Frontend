import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { confirmAction } from '../../shared/utils/confirm';
import { useI18n } from '../../shared/i18n/LanguageContext';

export default function SettingsScreen({ navigation }) {
  const { t, language, languages } = useI18n();
  const { colors, isDark, toggle } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [locationAccess, setLocationAccess] = useState(true);

  const currentLangLabel =
    languages.find((l) => l.code === language)?.native || 'English (US)';

  // Confirm before switching theme — Cancel leaves the current theme untouched
  // (the Switch is bound to isDark, so it snaps back if not applied).
  const confirmThemeToggle = () =>
    confirmAction({
      title: isDark ? t('settings.themeToLightTitle') : t('settings.themeToDarkTitle'),
      message: t('settings.themeConfirmMsg'),
      confirmLabel: t('settings.themeConfirmBtn'),
      onConfirm: toggle,
    });

  // Gentle "not built yet" popup for the boxes/rows we haven't wired up.
  const showSoon = (label) =>
    confirmAction({
      title: `${label}`,
      message: t('common.soonMsg'),
      hideCancel: true,
      tone: 'info',
      confirmLabel: t('common.gotIt'),
    });

  // The "parallel boxes" — a 2-column grid of quick settings.
  const boxes = [
    {
      icon: 'person-circle-outline',
      label: t('settings.account'),
      hint: t('settings.accountHint'),
      tint: '#2D8FE0',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      icon: 'lock-closed-outline',
      label: t('settings.privacy'),
      hint: t('settings.privacyHint'),
      tint: '#1B6FC4',
      onPress: () => navigation.navigate('PrivacyPolicy'),
    },
    {
      icon: 'language-outline',
      label: t('settings.language'),
      hint: currentLangLabel,
      tint: '#0EA5E9',
      onPress: () => navigation.navigate('Language'),
    },
    {
      icon: 'help-buoy-outline',
      label: t('settings.help'),
      hint: t('settings.helpHint'),
      tint: '#F59E0B',
      onPress: () => navigation.navigate('HelpCenter'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>{t('settings.title')}</Text>
          <Text style={styles.sub}>{t('settings.subtitle')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* PARALLEL BOXES GRID */}
        <Text style={styles.section}>{t('settings.general')}</Text>
        <View style={styles.grid}>
          {boxes.map((b) => (
            <TouchableOpacity
              key={b.label}
              activeOpacity={0.85}
              onPress={() => (b.soon ? showSoon(b.label) : b.onPress && b.onPress())}
              style={[styles.box, b.soon && styles.boxSoon]}
            >
              {b.soon && (
                <View style={styles.boxSoonBadge}>
                  <Text style={styles.boxSoonText}>{t('common.soon')}</Text>
                </View>
              )}
              <View style={[styles.boxIcon, { backgroundColor: b.tint + '18' }]}>
                <Ionicons name={b.icon} size={22} color={b.tint} />
              </View>
              <Text style={styles.boxLabel}>{b.label}</Text>
              <Text style={styles.boxHint}>{b.hint}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* PREFERENCE TOGGLES */}
        <Text style={styles.section}>{t('settings.preferences')}</Text>
        <View style={styles.menu}>
          <ToggleRow
            icon="notifications-outline"
            label={t('settings.pushNotifications')}
            hint={t('settings.pushHint')}
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
          <ToggleRow
            icon="mail-outline"
            label={t('settings.emailUpdates')}
            hint={t('settings.emailHint')}
            value={emailUpdates}
            onValueChange={setEmailUpdates}
          />
          <ToggleRow
            icon="logo-whatsapp"
            label={t('settings.whatsappUpdates')}
            hint={t('settings.whatsappHint')}
            value={whatsappUpdates}
            onValueChange={setWhatsappUpdates}
          />
          <ToggleRow
            icon="location-outline"
            label={t('settings.locationAccess')}
            hint={t('settings.locationHint')}
            value={locationAccess}
            onValueChange={setLocationAccess}
          />
          <ToggleRow
            icon="moon-outline"
            label={t('settings.darkMode')}
            value={isDark}
            onValueChange={confirmThemeToggle}
            isLast
          />
        </View>

        {/* MORE */}
        <Text style={styles.section}>{t('settings.more')}</Text>
        <View style={styles.menu}>
          <LinkRow
            icon="document-text-outline"
            label={t('settings.terms')}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <LinkRow
            icon="information-circle-outline"
            label={t('settings.about')}
            onPress={() => navigation.navigate('About')}
            isLast
          />
        </View>

        <Text style={styles.version}>Clean Pro v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({ icon, label, hint, value, onValueChange, isLast }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primary + '18' }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.card}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

function LinkRow({ icon, label, onPress, isLast }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.row, !isLast && styles.rowBorder]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.primary + '18' }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </TouchableOpacity>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },

  // SECTION
  section: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  // GRID OF PARALLEL BOXES
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  box: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
    minHeight: 120,
    justifyContent: 'flex-start',
  },
  boxSoon: { opacity: 0.7 },
  boxSoonBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  boxSoonText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  boxIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  boxLabel: { color: colors.text, fontSize: 15, fontWeight: '700' },
  boxHint: { color: colors.muted, fontSize: 11 },

  // MENU / ROWS
  menu: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: 12,
    minHeight: 56,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { color: colors.text, fontSize: 14, fontWeight: '600' },
  rowHint: { color: colors.muted, fontSize: 11, marginTop: 2 },

  version: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: spacing.lg,
    fontSize: 11,
  },
});
