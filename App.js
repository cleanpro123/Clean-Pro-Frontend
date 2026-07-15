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
    // ErrorBoundary sits INSIDE the theme/i18n/safe-area providers so its
    // fallback (StatusScreen, which calls useTheme/useI18n/SafeAreaView) can
    // render. When it was outside, any caught error made the fallback itself
    // throw "useI18n must be used within a LanguageProvider" → white screen.
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <ErrorBoundary>
            <AuthProvider>
              <AppProvider>
                <ThemedStatusBar />
                <RootNavigator />
                <ConfirmHost />
              </AppProvider>
            </AuthProvider>
          </ErrorBoundary>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default wrapRoot(App);
