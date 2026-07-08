import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing, gradients } from '../../shared/theme/colors';
import { useApp } from '../../shared/state/AppContext';
import { api } from '../../shared/api/client';

const LABELS = [
  { id: 'Home', icon: 'home-outline' },
  { id: 'Office', icon: 'briefcase-outline' },
  { id: 'Other', icon: 'location-outline' },
];

export default function AddAddressScreen({ navigation }) {
  const { addAddress, setSelectedAddressId } = useApp();
  const [label, setLabel] = useState('Home');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');

  // Service areas defined by the operator. The customer must pick the
  // nearby area their address falls under before they can save it.
  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [areaId, setAreaId] = useState(null);
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

  const handleSave = async () => {
    if (!areaId) {
      Alert.alert('Choose an area', 'Please select the nearby area for this address.');
      return;
    }
    if (!line1.trim() || !line2.trim() || !pincode.trim() || !phone.trim()) {
      Alert.alert('Missing details', 'Please fill all fields.');
      return;
    }
    const icon = LABELS.find((l) => l.id === label)?.icon || 'location-outline';
    const added = await addAddress({
      label,
      icon,
      line1,
      line2,
      pincode,
      phone,
      areaId,
      area: selectedArea?.name || '',
    });
    setSelectedAddressId(added.id);
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}
      >
        <Text style={styles.section}>Label this address</Text>
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
                  style={[styles.labelText, active && { color: colors.card }]}
                >
                  {l.id}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.section}>Nearby service area</Text>
        <Text style={styles.areaHint}>
          Pick the area closest to your address. A delivery agent covers each area.
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
                ? 'Select a nearby area'
                : 'No areas available yet'}
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
          label="House / Flat no, Building"
          value={line1}
          onChangeText={setLine1}
          placeholder="e.g. 12B, Lakeview Apartments"
        />
        <Field
          label="Street, Area, City"
          value={line2}
          onChangeText={setLine2}
          placeholder="e.g. MG Road, Bengaluru"
        />
        <Field
          label="Pincode"
          value={pincode}
          onChangeText={setPincode}
          placeholder="560001"
          keyboardType="number-pad"
          maxLength={6}
        />
        <Field
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 …"
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
          <Ionicons name="checkmark" size={18} color={colors.card} />
          <Text style={styles.saveText}>Save address</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function Field({ label, ...rest }) {
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

const styles = StyleSheet.create({
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
  saveText: { color: colors.card, fontWeight: '700', fontSize: 15 },
});
