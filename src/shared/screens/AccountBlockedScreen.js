// Shown when the backend refuses a login because the account is blocked
// (403 FORBIDDEN) or a business request was rejected (403 ACCOUNT_REJECTED).
// The specific preset/message is passed via route params so one screen covers
// both cases.
import React from 'react';
import { Linking } from 'react-native';
import StatusScreen from '../components/StatusScreen';

const SUPPORT_EMAIL = 'cleanproofficial1@gmail.com';

export default function AccountBlockedScreen({ navigation, route }) {
  const preset = route?.params?.preset || 'blocked';
  const message = route?.params?.message;

  return (
    <StatusScreen
      preset={preset}
      message={message}
      actionLabel="Back to login"
      onAction={() =>
        navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login')
      }
      secondaryLabel="Contact support"
      onSecondary={() =>
        Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Account%20help`)
      }
    />
  );
}
