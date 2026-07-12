import './global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AppProvider } from './src/shared/state/AppContext';
import { AuthProvider } from './src/shared/state/AuthContext';
import { LanguageProvider } from './src/shared/i18n/LanguageContext';
import { ThemeProvider, useTheme } from './src/shared/theme/ThemeContext';
import ConfirmHost from './src/shared/components/ConfirmHost';
import ErrorBoundary from './src/shared/components/ErrorBoundary';
import { initSentry, wrapRoot } from './src/shared/monitoring/sentry';

// Initialise crash reporting before the tree renders (no-op without a DSN).
initSentry();

// Status bar icons follow the active theme (light icons on dark backgrounds).
function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <AppProvider>
                <ThemedStatusBar />
                <RootNavigator />
                <ConfirmHost />
              </AppProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default wrapRoot(App);
