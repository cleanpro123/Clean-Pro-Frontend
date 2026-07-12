import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../components/AdminHeader';
import { colors, radii, spacing } from '../../shared/theme/dark';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/utils/confirm';
import { useI18n } from '../../shared/i18n/LanguageContext';

export default function AdminAdminsScreen({ navigation }) {
  const { t } = useI18n();
  const [admins, setAdmins] = useState([]);
  const [meId, setMeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, me] = await Promise.all([
        api.getAll('/admins'),
        api.get('/auth/me').catch(() => null),
      ]);
      setAdmins(list);
      setMeId(me?.profile?.id || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = navigation.addListener?.('focus', load);
    return unsub;
  }, [navigation, load]);

  const save = async () => {
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      confirmAction({
        title: t('adminAdmins.missingInfoTitle'),
        message: t('adminAdmins.missingInfoMessage'),
        confirmLabel: t('adminAdmins.ok'),
        onConfirm: () => {},
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      confirmAction({
        title: t('adminAdmins.missingInfoTitle'),
        message: t('adminAdmins.emailInvalid'),
        confirmLabel: t('adminAdmins.ok'),
        onConfirm: () => {},
      });
      return;
    }
    if (form.password.length < 6) {
      confirmAction({
        title: t('adminAdmins.missingInfoTitle'),
        message: t('adminAdmins.passwordMin'),
        confirmLabel: t('adminAdmins.ok'),
        onConfirm: () => {},
      });
      return;
    }
    setBusy(true);
    try {
      const { name, email, password } = form;
      await api.post('/admins', { name: name.trim(), email: email.trim(), password });
      setForm({ name: '', email: '', password: '' });
      setShowPw(false);
      setAdding(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = (a) =>
    confirmAction({
      title: t('adminAdmins.removeTitle'),
      message: t('adminAdmins.removeMessage', { name: a.name }),
      confirmLabel: t('adminAdmins.remove'),
      destructive: true,
      onConfirm: async () => {
        // Drop the row immediately for instant feedback; restore on failure.
        setAdmins((prev) => prev.filter((x) => x.id !== a.id));
        try {
          await api.delete(`/admins/${a.id}`);
        } catch (e) {
          load();
          confirmAction({
            title: t('adminAdmins.couldNotRemoveTitle'),
            message: e.message,
            confirmLabel: t('adminAdmins.ok'),
            onConfirm: () => {},
          });
        }
      },
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader
        title={t('adminAdmins.title')}
        onBack={() => navigation.goBack()}
        rightAction={{ icon: 'add-circle-outline', onPress: () => setAdding(true) }}
      />

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.muted} />
        }
      >
        {loading && admins.length === 0 ? (
          <ActivityIndicator color={colors.muted} style={{ marginTop: 24 }} />
        ) : admins.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="shield-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>{t('adminAdmins.empty')}</Text>
          </View>
        ) : (
          admins.map((a) => {
            const isSelf = a.id === meId;
            return (
              <View key={a.id} style={styles.rowShadow}>
                <LinearGradient
                  colors={['#2B3F6E', '#1B2B52']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.row}
                >
                  <View style={styles.rowBorder} pointerEvents="none" />
                  <View style={styles.avatar}>
                    <Ionicons name="shield-checkmark" size={20} color={colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{a.name}</Text>
                      {isSelf && (
                        <View style={styles.youPill}>
                          <Text style={styles.youText}>{t('adminAdmins.you')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.meta} numberOfLines={1}>
                      {a.email}
                    </Text>
                  </View>
                  {isSelf ? null : (
                    <TouchableOpacity
                      onPress={() => remove(a)}
                      style={styles.deleteBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#F87171" />
                    </TouchableOpacity>
                  )}
                </LinearGradient>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={adding} animationType="slide" transparent onRequestClose={() => setAdding(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <View style={styles.modalBackdrop} />
          <View style={styles.modalShadow}>
            <LinearGradient
              colors={['#2B3F6E', '#1B2B52']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modal}
            >
              <View style={styles.modalBorder} pointerEvents="none" />
              <Text style={styles.modalTitle}>{t('adminAdmins.newAdmin')}</Text>

              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder={t('adminAdmins.name')}
                  placeholderTextColor={colors.muted}
                  value={form.name}
                  onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                />
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder={t('adminAdmins.email')}
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={form.email}
                  onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
                />
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={t('adminAdmins.password')}
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPw}
                  value={form.password}
                  onChangeText={(v) => setForm((p) => ({ ...p, password: v }))}
                />
                <TouchableOpacity onPress={() => setShowPw((s) => !s)} style={styles.eyeBtn}>
                  <Ionicons name={showPw ? 'eye' : 'eye-off'} size={18} color={colors.muted} />
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setAdding(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cancelText}>{t('adminAdmins.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn]}
                  onPress={save}
                  disabled={busy}
                  activeOpacity={0.85}
                >
                  {busy ? (
                    <ActivityIndicator color="#34D399" />
                  ) : (
                    <Text style={styles.saveText}>{t('adminAdmins.addAdmin')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.sm + 4, paddingBottom: spacing.xl },
  rowShadow: { borderRadius: radii.md, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  row: { flexDirection: 'row', padding: spacing.md, borderRadius: radii.md, gap: spacing.md, alignItems: 'center', overflow: 'hidden' },
  rowBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.10)', alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: colors.text, fontWeight: '400', letterSpacing: 0.3 },
  youPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill, backgroundColor: 'rgba(52, 211, 153, 0.18)' },
  youText: { color: '#34D399', fontSize: 10, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 12, fontWeight: '300', marginTop: 2 },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248, 113, 113, 0.12)' },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.muted, fontWeight: '300' },
  modalRoot: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  modalShadow: { borderRadius: radii.lg, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  modal: { borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm + 4, overflow: 'hidden' },
  modalBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '300', letterSpacing: 1, marginBottom: spacing.sm },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(43, 63, 110, 0.55)', borderRadius: radii.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  input: { flex: 1, paddingVertical: 12, color: colors.text, fontSize: 14, fontWeight: '300' },
  eyeBtn: { paddingLeft: 8, paddingVertical: 8 },
  error: { color: '#F87171', fontSize: 12, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: radii.md, alignItems: 'center', borderWidth: 1 },
  cancelBtn: { borderColor: 'rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(255, 255, 255, 0.04)' },
  cancelText: { color: colors.muted, fontWeight: '400', letterSpacing: 0.5 },
  saveBtn: { borderColor: 'rgba(52, 211, 153, 0.45)', backgroundColor: 'rgba(15, 118, 110, 0.35)' },
  saveText: { color: '#34D399', fontWeight: '400', letterSpacing: 0.5 },
});
