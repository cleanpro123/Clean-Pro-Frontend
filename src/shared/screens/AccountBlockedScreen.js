// Shown when the backend refuses a login because the account is blocked
// (403 FORBIDDEN). The preset/message is passed via route params.
import React from 'react';
import { Linking } from 'react-native';
import StatusScreen from '../components/StatusScreen';
import { useI18n } from '../i18n/LanguageContext';

const SUPPORT_EMAIL = 'cleanproofficial1@gmail.com';

export default function AccountBlockedScreen({ navigation, route }) {
  const { t } = useI18n();
  const preset = route?.params?.preset || 'blocked';
  const message = route?.params?.message;

  return (
    <StatusScreen
      preset={preset}
      message={message}
      actionLabel={t('accountBlocked.backToLogin')}
      onAction={() =>
        navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login')
      }
      secondaryLabel={t('accountBlocked.contactSupport')}
      onSecondary={() =>
        Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Account%20help`)
      }
    />
  );
}
