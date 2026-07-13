import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';
import {
  colors as lightColors,
  gradients as lightGradients,
  spacing,
  radii,
} from './colors';
import { colors as darkColors, gradients as darkGradients } from './darkColors';

const STORAGE_KEY = 'cleanpro.theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState('light'); // 'light' | 'dark'
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') setModeState(saved);
      } catch {}
      setReady(true);
    })();
  }, []);

  const setMode = useCallback(async (next) => {
    const m = next === 'dark' ? 'dark' : 'light';
    setModeState(m);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, m);
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  // Keep NativeWind's color scheme in sync with our theme so className-based
  // `dark:` variants follow the in-app toggle (not the device setting).
  useEffect(() => {
    colorScheme.set(mode);
  }, [mode]);

  const isDark = mode === 'dark';
  const value = {
    mode,
    isDark,
    setMode,
    toggle,
    ready,
    // Active, theme-aware tokens. spacing/radii are theme-invariant.
    colors: isDark ? darkColors : lightColors,
    gradients: isDark ? darkGradients : lightGradients,
    spacing,
    radii,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
