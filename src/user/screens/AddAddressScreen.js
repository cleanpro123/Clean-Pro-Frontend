import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { radii, spacing } from '../../shared/theme/colors';
import { useTheme } from '../../shared/theme/ThemeContext';
import { useApp } from '../../shared/state/AppContext';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';
import { useI18n } from '../../shared/i18n/LanguageContext';

const LABELS = [
  { id: 'Home', icon: 'home-outline' },
  { id: 'Office', icon: 'briefcase-outline' },
  { id: 'Other', icon: 'location-outline' },
];

export default function AddAddressScreen({ navigation, route }) {
  const { t } = useI18n();
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { addAddress, updateAddress, setSelectedAddressId } = useApp();
  // When an address is passed in route params we're EDITING it, not creating.
  const editing = route?.params?.address || null;
  const editAreaId =
    (editing?.areaId && (editing.areaId._id || editing.areaId.id || editing.areaId)) || null;

  const [label, setLabel] = useState(editing?.label || 'Home');
  const [line1, setLine1] = useState(editing?.line1 || '');
  const [line2, setLine2] = useState(editing?.line2 || '');
  const [pincode, setPincode] = useState(editing?.pincode || '');
  const [phone, setPhone] = useState(editing?.phone || '');
  // Exact GPS coordinates for this address (from "Use current location"). If
  // left null we geocode the typed address on save.
  const [coords, setCoords] = useState(
    typeof editing?.lat === 'number' && typeof editing?.lng === 'number'
      ? { lat: editing.lat, lng: editing.lng }
      : null
  );
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: editing ? t('addAddress.editTitle') : t('addAddress.addTitle'),
    });
  }, [navigation, editing, t]);

  // Service areas defined by the operator. The customer must pick the
  // nearby area their address falls under before they can save it.
  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [areaId, setAreaId] = useState(editAreaId);
  const [areaOpen, setAreaOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await api.get('/maps');
        if (active) setAreas(Array.isArray(list) ? list : []);
      } catch {
        if (active) setAreas([]);
      } finally {
        if (active) setAreasLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const selectedArea = areas.find((a) => a.id === areaId);

  // Grab the device's current GPS position and pre-fill the address fields.
  const useCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        confirmAction({
          title: t('addAddress.locationDeniedTitle'),
          message: t('addAddress.locationDeniedMsg'),
          hideCancel: true,
          confirmLabel: t('common.gotIt'),
        });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      setCoords({ lat: latitude, lng: longitude });
      try {
        const rev = await Location.reverseGeocodeAsync({ latitude, longitude });
        const a = rev && rev[0];
        if (a) {
          if (!line1.trim()) setLine1([a.name, a.street].filter(Boolean).join(', '));
          if (!line2.trim()) setLine2([a.district, a.city, a.region].filter(Boolean).join(', '));
          if (!pincode.trim() && a.postalCode) setPincode(a.postalCode);
        }
      } catch {}
    } catch {
      confirmAction({
        title: t('addAddress.locationErrTitle'),
        message: t('addAddress.locationErrMsg'),
        hideCancel: true,
        confirmLabel: t('common.gotIt'),
      });
    } finally {
      setLocating(false);
    }
  };

  // Themed validation popup naming the specific problem.
  const invalid = (message) =>
    confirmAction({
      title: t('addAddress.invalidTitle'),
      message,
      hideCancel: true,
      confirmLabel: t('common.gotIt'),
    });

  const handleSave = async () => {
    const digits = (s) => (s || '').replace(/\D/g, '');

    // Current location is mandatory so every address maps to a real point.
    if (!coords) return invalid(t('addAddress.locationRequiredMsg'));
    if (!areaId) return invalid(t('addAddress.chooseAreaMessage'));
    if (line1.trim().length < 2) return invalid(t('addAddress.line1Required'));
    // Street/Area/City must contain actual text (letters), not just digits.
    if (line2.trim().length < 2 || !/[A-Za-z\u0600-\u06FF]/.test(line2)) {
      return invalid(t('addAddress.line2Required'));
    }
    if (!/^\d{4,8}$/.test(pincode.trim())) return invalid(t('addAddress.pincodeInvalid'));
    if (digits(phone).length < 7) return invalid(t('addAddress.phoneInvalid'));

    const icon = LABELS.find((l) => l.id === label)?.icon || 'location-outline';

    const payload = {
      label,
      icon,
      line1: line1.trim(),
      line2: line2.trim(),
      pincode: pincode.trim(),
      phone: phone.trim(),
      areaId,
      area: selectedArea?.name || '',
      lat: coords.lat,
      lng: coords.lng,
    };

    if (editing) {
      await updateAddress(editing.id, payload);
      setSelectedAddressId(editing.id);
    } else {
      const added = await addAddress(payload);
      setSelectedAddressId(added.id);
    }
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}
      >
        <Text style={styles.section}>{t('addAddress.labelSection')}</Text>
        <View style={styles.labelsRow}>
          {LABELS.map((l) => {
            const active = label === l.id;
            return (
              <TouchableOpacity
                key={l.id}
                onPress={() => setLabel(l.id)}
                style={[styles.labelBtn, active && styles.labelBtnActive]}
              >
                <Ionicons
                  name={l.icon}
                  size={16}
                  color={active ? colors.card : colors.primary}
                />
                <Text
                  style={[styles.labelText, active && { color: '#fff' }]}
                >
                  {t(`addAddress.label${l.id}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={useCurrentLocation}
          disabled={locating}
          activeOpacity={0.85}
        >
          {locating ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Ionicons
              name={coords ? 'checkmark-circle' : 'navigate'}
              size={16}
              color={coords ? colors.success : colors.primary}
            />
          )}
          <Text style={styles.gpsBtnText}>
            {coords ? t('addAddress.locationSet') : t('addresses.useCurrentLocation')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.section}>{t('addAddress.areaSection')}</Text>
        <Text style={styles.areaHint}>
          {t('addAddress.areaHint')}
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => !areasLoading && setAreaOpen((o) => !o)}
          style={[styles.dropdown, areaOpen && styles.dropdownOpen]}
        >
          <Ionicons
            name="map-outline"
            size={18}
            color={selectedArea ? colors.primary : colors.muted}
          />
          {areasLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 4 }} />
          ) : (
            <Text
              style={[styles.dropdownText, !selectedArea && { color: colors.muted }]}
              numberOfLines={1}
            >
              {selectedArea
                ? `${selectedArea.name}${selectedArea.place ? ` · ${selectedArea.place}` : ''}`
                : areas.length
                ? t('addAddress.selectArea')
                : t('addAddress.noAreas')}
            </Text>
          )}
          <Ionicons
            name={areaOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.muted}
          />
        </TouchableOpacity>

        {areaOpen && areas.length > 0 && (
          <View style={styles.options}>
            {areas.map((a, i) => {
              const active = a.id === areaId;
              return (
                <TouchableOpacity
                  key={a.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    setAreaId(a.id);
                    setAreaOpen(false);
                  }}
                  style={[
                    styles.option,
                    i === areas.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionName}>{a.name}</Text>
                    {!!a.place && <Text style={styles.optionSub}>{a.place}</Text>}
                  </View>
                  {active && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: spacing.lg }} />

        <Field
          label={t('addAddress.line1Label')}
          value={line1}
          onChangeText={setLine1}
          placeholder={t('addAddress.line1Placeholder')}
        />
        <Field
          label={t('addAddress.line2Label')}
          value={line2}
          onChangeText={setLine2}
          placeholder={t('addAddress.line2Placeholder')}
        />
        <Field
          label={t('addAddress.pincodeLabel')}
          value={pincode}
          onChangeText={setPincode}
          placeholder="560001"
          keyboardType="number-pad"
          maxLength={6}
        />
        <Field
          label={t('addAddress.phoneLabel')}
          value={phone}
          onChangeText={setPhone}
          placeholder="+974 …"
          keyboardType="phone-pad"
        />
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleSave}
        style={styles.saveWrap}
      >
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.saveBtn}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={styles.saveText}>
            {editing ? t('addAddress.updateButton') : t('addAddress.saveButton')}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function Field({ label, ...rest }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.muted}
        {...rest}
      />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  section: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.sm,
    fontSize: 14,
  },
  areaHint: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  dropdownOpen: {
    borderColor: colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
  options: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.primary,
    borderBottomLeftRadius: radii.md,
    borderBottomRightRadius: radii.md,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  optionName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  optionSub: { color: colors.muted, fontSize: 12, marginTop: 1 },
  labelsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: spacing.lg,
  },
  gpsBtnText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  labelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  labelBtnActive: { backgroundColor: colors.primary },
  labelText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  fieldLabel: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.text,
    fontSize: 14,
  },
  saveWrap: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#2D8FE0',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
      default: { boxShadow: '0 6px 12px rgba(45,143,224,0.35)' },
    }),
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.pill,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
