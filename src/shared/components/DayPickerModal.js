import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../theme/dark';
import { startOfDay, sameDay } from '../utils/period';
import { useI18n } from '../i18n/LanguageContext';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const weekHeads = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Lightweight, dependency-free month calendar. Defaults its view to the given
// value (or today). Future days are disabled.
export default function DayPickerModal({ visible, value, onSelect, onClose }) {
  const { t } = useI18n();
  const today = startOfDay(new Date());
  const [view, setView] = useState(startOfDay(value || today));

  useEffect(() => {
    if (visible) setView(startOfDay(value || today));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.calendar} activeOpacity={1}>
          <View style={styles.calHeader}>
            <TouchableOpacity
              onPress={() => setView(new Date(year, month - 1, 1))}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.calTitle}>
              {monthNames[month]} {year}
            </Text>
            <TouchableOpacity
              onPress={() => setView(new Date(year, month + 1, 1))}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {weekHeads.map((w) => (
              <Text key={w} style={styles.weekHead}>
                {w}
              </Text>
            ))}
          </View>

          <View style={styles.calGrid}>
            {cells.map((c, i) => {
              if (!c) return <View key={`e${i}`} style={styles.dayCell} />;
              const isFuture = c > today;
              const selected = value && sameDay(c, startOfDay(value));
              const isToday = sameDay(c, today);
              return (
                <TouchableOpacity
                  key={c.toISOString()}
                  style={styles.dayCell}
                  disabled={isFuture}
                  onPress={() => onSelect(c)}
                >
                  <View
                    style={[
                      styles.dayInner,
                      selected && styles.daySelected,
                      isToday && !selected && styles.dayToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isFuture && styles.dayDisabled,
                        selected && styles.daySelectedText,
                      ]}
                    >
                      {c.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.todayBtn} onPress={() => onSelect(today)}>
            <Text style={styles.todayBtnText}>{t('dayPicker.jumpToToday')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  calendar: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  calTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekHead: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: 11, fontWeight: '600' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: { backgroundColor: colors.primaryLight },
  dayToday: { borderWidth: 1, borderColor: colors.primaryLight },
  dayText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  daySelectedText: { color: '#052e2b', fontWeight: '800' },
  dayDisabled: { color: 'rgba(148, 163, 184, 0.35)' },
  todayBtn: { marginTop: spacing.md, alignItems: 'center', paddingVertical: 10 },
  todayBtnText: { color: colors.primaryLight, fontSize: 13, fontWeight: '700' },
});
