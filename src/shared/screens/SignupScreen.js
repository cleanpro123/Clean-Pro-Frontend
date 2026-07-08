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
import { colors, gradients } from '../theme/colors';
import { useAuth } from '../state/AuthContext';

export default function SignupScreen({ navigation }) {
  const { checkAvailability } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const submit = async () => {
    setError('');
    setWarning('');
    if (name.trim().length < 2) return setError('Please enter your full name');
    if (!/^\d{10}$/.test(phone.trim()))
      return setError('Phone number must be exactly 10 digits');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (!/[A-Za-z]/.test(password)) return setError('Password must include a letter');
    if (!/\d/.test(password)) return setError('Password must include a number');
    if (!/[^A-Za-z0-9]/.test(password))
      return setError('Password must include a symbol (e.g. !@#$)');

    setBusy(true);
    try {
      // One round-trip: if the phone/email is taken we get a flag and no OTP is
      // sent (show an inline warning); otherwise the code is sent right here and
      // we move to the verification page carrying the account details.
      const { phoneTaken, emailTaken } = await checkAvailability({
        email: email.trim(),
        phone: phone.trim(),
      });
      if (phoneTaken) {
        return setWarning('This phone number is already registered. Try logging in instead.');
      }
      if (emailTaken) {
        return setWarning('This email is already registered. Try logging in instead.');
      }

      // The account is only created after the code is verified on the next page.
      navigation.navigate('SignupOtp', {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
      });
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
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
            <Text className="text-white text-2xl font-extrabold mt-lg">Create your account</Text>
            <Text className="text-[#EAF4FF] text-sm mt-1.5">
              Join Clean Pro — premium laundry at your door
            </Text>
          </LinearGradient>

          <View className="-mt-[22px] mx-lg bg-card rounded-lg p-lg shadow-[0px_8px_16px_rgba(27,111,196,0.08)]">
            <View className="flex-row items-center bg-surface rounded-md px-md mb-3 gap-sm">
              <Ionicons name="person-outline" size={18} color={colors.muted} />
              <TextInput
                className="flex-1 py-3.5 text-text text-[15px]"
                placeholder="Full name"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View className="flex-row items-center bg-surface rounded-md px-md mb-3 gap-sm">
              <Ionicons name="call-outline" size={18} color={colors.muted} />
              <TextInput
                className="flex-1 py-3.5 text-text text-[15px]"
                placeholder="Phone number"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 10))}
              />
            </View>

            <View className="flex-row items-center bg-surface rounded-md px-md mb-3 gap-sm">
              <Ionicons name="mail-outline" size={18} color={colors.muted} />
              <TextInput
                className="flex-1 py-3.5 text-text text-[15px]"
                placeholder="Email"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View className="flex-row items-center bg-surface rounded-md px-md mb-3 gap-sm">
              <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
              <TextInput
                className="flex-1 py-3.5 text-text text-[15px]"
                placeholder="Password"
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
                  <Text className="text-white text-[15px] font-bold">Continue</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity className="mt-md items-center" onPress={() => navigation.goBack()}>
              <Text className="text-muted text-[13px]">
                Already have an account? <Text className="text-primary font-bold">Log in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
