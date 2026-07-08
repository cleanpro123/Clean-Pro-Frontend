import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../shared/screens/LoginScreen';
import SignupScreen from '../shared/screens/SignupScreen';
import SignupOtpScreen from '../shared/screens/SignupOtpScreen';
import ForgotPasswordScreen from '../shared/screens/ForgotPasswordScreen';
import NotFoundScreen from '../shared/screens/NotFoundScreen';
import AccountBlockedScreen from '../shared/screens/AccountBlockedScreen';
import PartnerLoginScreen from '../partner/screens/PartnerLoginScreen';
import AdminLoginGate from '../admin/screens/AdminLoginScreen';
import AgentLoginGate from '../agent/screens/AgentLoginScreen';
import UserNavigator from '../user/navigation/UserNavigator';
import AdminNavigator from '../admin/navigation/AdminNavigator';
import AgentNavigator from '../agent/navigation/AgentNavigator';
import { useAuth } from '../shared/state/AuthContext';
import { colors } from '../shared/theme/colors';
import { isPartner } from '../config/appVariant';

const Stack = createNativeStackNavigator();

function Splash() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

// Returned as fragments (flattened by React Navigation) — NOT components, so the
// navigator sees the Stack.Screen elements as direct children.

// Clean Pro Partner — admin + agent only.
function partnerScreens(role) {
  if (role === 'admin') return <Stack.Screen name="Admin" component={AdminNavigator} />;
  if (role === 'agent') return <Stack.Screen name="Agent" component={AgentNavigator} />;
  return (
    <>
      <Stack.Screen name="PartnerLogin" component={PartnerLoginScreen} />
      <Stack.Screen name="AdminLogin" component={AdminLoginGate} />
      <Stack.Screen name="AgentLogin" component={AgentLoginGate} />
    </>
  );
}

// Clean Pro — customers only.
function userScreens(role) {
  if (role === 'user') return <Stack.Screen name="User" component={UserNavigator} />;
  return (
    <>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="SignupOtp" component={SignupOtpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </>
  );
}

export default function RootNavigator() {
  const { role, loading } = useAuth();

  if (loading) return <Splash />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isPartner ? partnerScreens(role) : userScreens(role)}
        {/* Shared fallback routes available in every stack. */}
        <Stack.Screen name="AccountBlocked" component={AccountBlockedScreen} />
        <Stack.Screen name="NotFound" component={NotFoundScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
