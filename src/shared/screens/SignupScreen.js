import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../components/Gradient';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../state/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import AvatarPicker from '../components/AvatarPicker';

export default function SignupScreen({ navigation }) {
  const { colors, gradients } = useTheme();
  const { t } = useI18n();
  const { checkAvailability } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const submit = async () => {
    setError('');
    setWarning('');
    if (name.trim().length < 2) return setError(t('signup.errName'));
    if (!/^\d{10}$/.test(phone.trim()))
      return setError(t('signup.errPhone'));
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t('signup.errEmail'));
    if (password.length < 6) return setError(t('signup.errPwLength'));
    if (!/[A-Za-z]/.test(password)) return setError(t('signup.errPwLetter'));
    if (!/\d/.test(password)) return setError(t('signup.errPwNumber'));
    if (!/[^A-Za-z0-9]/.test(password))
      return setError(t('signup.errPwSymbol'));

    setBusy(true);
    try {
      // One round-trip: if the email is taken we get a flag and no OTP is sent
      // (show an inline warning); otherwise the code is sent right here and we
      // move to the verification page carrying the account details. Phone is
      // not checked for uniqueness — numbers may be shared across accounts.
      const { emailTaken } = await checkAvailability({
        email: email.trim(),
      });
      if (emailTaken) {
        return setWarning(t('signup.warnEmailTaken'));
      }

      // The account is only created after the code is verified on the next page.
      navigation.navigate('SignupOtp', {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        avatar,
      });
    } catch (e) {
      setError(e.message || t('signup.errGeneric'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0A1424]" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="pb-xl"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={gradients.sky}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="pt-xl pb-[48px] px-lg rounded-b-[36px]"
          >
            <TouchableOpacity
              className="absolute top-md left-md w-9 h-9 rounded-[18px] bg-white/20 items-center justify-center"
              hitSlop={10}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-extrabold mt-lg">{t('signup.title')}</Text>
            <Text className="text-[#EAF4FF] text-sm mt-1.5">
              {t('signup.subtitle')}
            </Text>
          </LinearGradient>

          <View className="-mt-[22px] mx-lg bg-card dark:bg-[#152A44] rounded-lg p-lg shadow-[0px_8px_16px_rgba(27,111,196,0.08)]">
            <Text className="text-text dark:text-[#EAF2FB] text-[13px] font-bold mb-2">
              {t('signup.avatarOptional')}
            </Text>
            <View className="mb-3">
              <AvatarPicker value={avatar} onChange={setAvatar} />
            </View>

            <View className="flex-row items-center bg-surface dark:bg-[#0F1E33] rounded-md px-md mb-3 gap-sm">
              <Ionicons name="person-outline" size={18} color={colors.muted} />
              <TextInput
                className="flex-1 py-3.5 text-text dark:text-[#EAF2FB] text-[15px]"
                placeholder={t('signup.phName')}
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View className="flex-row items-center bg-surface dark:bg-[#0F1E33] rounded-md px-md mb-3 gap-sm">
              <Ionicons name="call-outline" size={18} color={colors.muted} />
              <TextInput
                className="flex-1 py-3.5 text-text dark:text-[#EAF2FB] text-[15px]"
                placeholder={t('signup.phPhone')}
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 10))}
              />
            </View>

            <View className="flex-row items-center bg-surface dark:bg-[#0F1E33] rounded-md px-md mb-3 gap-sm">
              <Ionicons name="mail-outline" size={18} color={colors.muted} />
              <TextInput
                className="flex-1 py-3.5 text-text dark:text-[#EAF2FB] text-[15px]"
                placeholder={t('signup.phEmail')}
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View className="flex-row items-center bg-surface dark:bg-[#0F1E33] rounded-md px-md mb-3 gap-sm">
              <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
              <TextInput
                className="flex-1 py-3.5 text-text dark:text-[#EAF2FB] text-[15px]"
                placeholder={t('signup.phPassword')}
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPw}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPw((s) => !s)}
                className="pl-1.5 py-2"
                hitSlop={8}
              >
                <Ionicons name={showPw ? 'eye' : 'eye-off'} size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {warning ? (
              <View className="flex-row items-start bg-[#FFF7ED] border border-[#FED7AA] rounded-md px-3 py-2.5 mt-sm mb-sm">
                <Ionicons name="warning-outline" size={16} color="#C2410C" style={{ marginTop: 1 }} />
                <Text className="text-[#9A3412] text-xs ml-2 flex-1">{warning}</Text>
              </View>
            ) : null}

            {error ? (
              <Text className="text-danger text-xs mt-sm mb-sm text-center">{error}</Text>
            ) : null}

            <TouchableOpacity activeOpacity={0.85} onPress={submit} disabled={busy}>
              <LinearGradient
                colors={gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-3.5 rounded-md items-center mt-md"
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-[15px] font-bold">{t('signup.continue')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity className="mt-md items-center" onPress={() => navigation.goBack()}>
              <Text className="text-muted dark:text-[#7C97B5] text-[13px]">
                {t('signup.haveAccount')} <Text className="text-primary font-bold">{t('signup.logIn')}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
