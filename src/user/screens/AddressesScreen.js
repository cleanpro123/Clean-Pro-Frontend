import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { useApp } from '../../shared/state/AppContext';
import { confirmAction } from '../../shared/utils/confirm';
import { useI18n } from '../../shared/i18n/LanguageContext';

export default function AddressesScreen({ route, navigation }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const selectMode = route.params?.selectMode === true;
  const {
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    removeAddress,
  } = useApp();

  const defaultAddr = addresses.find((a) => a.id === selectedAddressId);
  const others = addresses.filter((a) => a.id !== selectedAddressId);

  const handleSelect = (id) => {
    setSelectedAddressId(id);
    if (selectMode) navigation.goBack();
  };

  const handleDelete = (id) => {
    confirmAction({
      title: t('addresses.deleteTitle'),
      message: t('addresses.deleteMessage'),
      confirmLabel: t('addresses.delete'),
      destructive: true,
      onConfirm: () => removeAddress(id),
    });
  };

  const handleEdit = (address) => navigation.navigate('AddAddress', { address });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* MODE BANNER */}
        {selectMode && (
          <View style={styles.banner}>
            <Ionicons name="hand-left-outline" size={16} color={colors.primary} />
            <Text style={styles.bannerText}>
              {t('addresses.selectHint')}
            </Text>
          </View>
        )}

        {/* ADD NEW — kept at the top for quick access */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddAddress')}
          style={styles.addCard}
        >
          <View style={styles.addIcon}>
            <Ionicons name="add" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addTitle}>{t('addresses.addNewTitle')}</Text>
            <Text style={styles.addSub}>{t('addresses.addNewSub')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* EMPTY STATE */}
        {addresses.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIconBig}>
              <Ionicons name="location-outline" size={42} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('addresses.emptyTitle')}</Text>
            <Text style={styles.emptySub}>
              {t('addresses.emptySub')}
            </Text>
          </View>
        )}

        {/* DEFAULT / SELECTED ADDRESS */}
        {defaultAddr && (
          <>
            <SectionLabel text={t('addresses.defaultSection')} />
            <DefaultAddressCard
              address={defaultAddr}
              onEdit={() => handleEdit(defaultAddr)}
              onDelete={() => handleDelete(defaultAddr.id)}
              onPress={() => handleSelect(defaultAddr.id)}
            />
          </>
        )}

        {/* OTHER ADDRESSES */}
        {others.length > 0 && (
          <>
            <SectionLabel text={t('addresses.otherSection', { count: others.length })} />
            {others.map((a) => (
              <OtherAddressCard
                key={a.id}
                address={a}
                onSelect={() => handleSelect(a.id)}
                onSetDefault={() => setSelectedAddressId(a.id)}
                onEdit={() => handleEdit(a)}
                onDelete={() => handleDelete(a.id)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionLabel({ text }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <Text style={styles.section}>{text}</Text>;
}

function DefaultAddressCard({ address, onEdit, onDelete, onPress }) {
  const { t } = useI18n();
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.defaultCardWrap}>
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.defaultStripe}
      />
      <View style={styles.defaultCard}>
        <View style={styles.defaultHead}>
          <View style={styles.defaultIconWrap}>
            <LinearGradient
              colors={gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.defaultIconBg}
            >
              <Ionicons name={address.icon} size={20} color="#fff" />
            </LinearGradient>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{address.label}</Text>
              <View style={styles.defaultBadge}>
                <Ionicons name="checkmark-circle" size={11} color={colors.primary} />
                <Text style={styles.defaultBadgeText}>{t('addresses.defaultBadge')}</Text>
              </View>
            </View>
            <Text style={styles.addrLine}>
              {address.line1}
            </Text>
            <Text style={styles.addrLine}>
              {address.line2} – {address.pincode}
            </Text>
            <View style={styles.phoneRow}>
              <Ionicons name="call-outline" size={12} color={colors.muted} />
              <Text style={styles.phone}>{address.phone}</Text>
            </View>
            {!!address.area && (
              <View style={styles.areaPill}>
                <Ionicons name="map-outline" size={11} color={colors.primary} />
                <Text style={styles.areaPillText}>{address.area}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.actionsRow}>
          <ActionChip
            icon="create-outline"
            label={t('addresses.edit')}
            tint={colors.primary}
            onPress={onEdit}
          />
          <ActionChip
            icon="trash-outline"
            label={t('addresses.delete')}
            tint={colors.danger}
            onPress={onDelete}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function OtherAddressCard({ address, onSelect, onSetDefault, onEdit, onDelete }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onSelect}
      style={styles.otherCard}
    >
      <View style={styles.otherHead}>
        <View style={styles.otherIcon}>
          <Ionicons name={address.icon} size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{address.label}</Text>
          <Text style={styles.addrLine} numberOfLines={1}>
            {address.line1}
          </Text>
          <Text style={styles.addrLineMuted} numberOfLines={1}>
            {address.line2} – {address.pincode}
          </Text>
          {!!address.area && (
            <View style={styles.areaPill}>
              <Ionicons name="map-outline" size={11} color={colors.primary} />
              <Text style={styles.areaPillText}>{address.area}</Text>
            </View>
          )}
        </View>
        <View style={styles.radio}>
          <Ionicons name="radio-button-off" size={20} color={colors.muted} />
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.actionsRow}>
        <ActionChip
          icon="star-outline"
          label={t('addresses.setAsDefault')}
          tint={colors.primary}
          onPress={onSetDefault}
        />
        <ActionChip
          icon="create-outline"
          label={t('addresses.edit')}
          tint={colors.primary}
          onPress={onEdit}
        />
        <ActionChip
          icon="trash-outline"
          label={t('addresses.delete')}
          tint={colors.danger}
          onPress={onDelete}
        />
      </View>
    </TouchableOpacity>
  );
}

function ActionChip({ icon, label, tint, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.actionChip}>
      <Ionicons name={icon} size={14} color={tint} />
      <Text style={[styles.actionText, { color: tint }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  // BANNER
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  bannerText: { color: colors.text, fontSize: 13, fontWeight: '600', flex: 1 },

  // SECTION LABEL
  section: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 1,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },

  // DEFAULT CARD
  defaultCardWrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  defaultStripe: { height: 6 },
  defaultCard: { padding: spacing.md },
  defaultHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  defaultIconWrap: {
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  defaultIconBg: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  label: { fontWeight: '800', color: colors.text, fontSize: 16 },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  defaultBadgeText: { color: colors.primary, fontWeight: '800', fontSize: 10 },

  // ADDR LINES
  addrLine: { color: colors.text, fontSize: 13, marginTop: 2, lineHeight: 18 },
  addrLineMuted: { color: colors.muted, fontSize: 12, marginTop: 1, lineHeight: 16 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  phone: { color: colors.muted, fontSize: 12 },
  areaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    marginTop: 6,
  },
  areaPillText: { color: colors.primary, fontWeight: '700', fontSize: 11 },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },

  // ACTIONS
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  actionText: { fontSize: 12, fontWeight: '700' },

  // OTHER CARD
  otherCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  otherHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  otherIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: { paddingTop: 8 },

  // ADD NEW
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySoft + '60',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    marginTop: spacing.md,
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  addTitle: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  addSub: { color: colors.text, fontSize: 11, marginTop: 2 },

  // EMPTY
  empty: { alignItems: 'center', paddingTop: 40, gap: 6 },
  emptyIconBig: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  emptySub: { color: colors.muted, fontSize: 13, textAlign: 'center' },
});
