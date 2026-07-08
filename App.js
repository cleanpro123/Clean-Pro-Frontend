import './global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AppProvider } from './src/shared/state/AppContext';
import { AuthProvider } from './src/shared/state/AuthContext';
import ConfirmHost from './src/shared/components/ConfirmHost';
import ErrorBoundary from './src/shared/components/ErrorBoundary';
import { initSentry, wrapRoot } from './src/shared/monitoring/sentry';

// Initialise crash reporting before the tree renders (no-op without a DSN).
initSentry();

function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <AppProvider>
            <StatusBar style="auto" />
            <RootNavigator />
            <ConfirmHost />
          </AppProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default wrapRoot(App);
