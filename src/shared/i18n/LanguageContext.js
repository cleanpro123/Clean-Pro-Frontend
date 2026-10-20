import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, LANGUAGES } from './translations';
import { dataTranslations } from './dataTranslations';

const STORAGE_KEY = 'cleanpro.language';

const LanguageContext = createContext(null);

// Language controls translations only. Clear direction preferences persisted
// by older builds, including when the device itself uses Arabic.
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);
// React Native Web does not expose this native-only preference.
I18nManager.swapLeftAndRightInRTL?.(false);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');
  const [ready, setReady] = useState(false);

  // Restore translations without changing the native layout or restarting.
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && translations[saved]) {
          setLanguageState(saved);
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  // t('key') → translated string; t('key', { name }) interpolates {name}
  // placeholders in the value. Falls back to English, then the raw key.
  const t = useCallback(
    (key, params) => {
      const dict = translations[language] || translations.en;
      let str = dict[key] ?? translations.en[key] ?? key;
      if (params && typeof params === 'object') {
        str = str.replace(/\{(\w+)\}/g, (m, k) =>
          params[k] != null ? String(params[k]) : m
        );
      }
      return str;
    },
    [language]
  );

  // td(kind, value) → translated backend value (service/serviceDesc/category/
  // item), falling back to the original English value when untranslated.
  const td = useCallback(
    (kind, value) => {
      if (!value) return value;
      const map = dataTranslations[language]?.[kind];
      return (map && map[value]) || value;
    },
    [language]
  );

  // Switching language updates text in place; no direction change or reload.
  const setLanguage = useCallback(
    async (code) => {
      if (!translations[code] || code === language) return false;
      try {
        await AsyncStorage.setItem(STORAGE_KEY, code);
      } catch {}
      setLanguageState(code);
      return false;
    },
    [language]
  );

  const value = {
    language,
    setLanguage,
    t,
    td,
    isRTL: false,
    ready,
    languages: LANGUAGES,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useI18n must be used within a LanguageProvider');
  return ctx;
}
