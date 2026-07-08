// 404 / catch-all screen. Any navigator can route here for a missing item or
// route: navigation.navigate('NotFound'). Falls back to going back / home.
import React from 'react';
import StatusScreen from '../components/StatusScreen';

export default function NotFoundScreen({ navigation }) {
  return (
    <StatusScreen
      preset="notFound"
      onAction={() =>
        navigation.canGoBack() ? navigation.goBack() : navigation.popToTop?.()
      }
    />
  );
}
