import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { I18nManager, DevSettings } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, LANGUAGES } from './translations';
import { dataTranslations } from './dataTranslations';

const STORAGE_KEY = 'cleanpro.language';

const LanguageContext = createContext(null);

const isRtlCode = (code) => !!LANGUAGES.find((l) => l.code === code)?.rtl;

// Best-effort programmatic reload. Works in Expo Go / dev clients via
// DevSettings; in a production standalone build the new layout direction
// applies on the next launch (the text switches immediately regardless).
export function reloadApp() {
  try {
    DevSettings.reload();
  } catch {
    // no-op — user relaunches to pick up the RTL flip
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');
  const [ready, setReady] = useState(false);

  // Load the saved language on boot and align the native RTL flag with it.
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && translations[saved]) {
          setLanguageState(saved);
          const rtl = isRtlCode(saved);
          if (I18nManager.isRTL !== rtl) {
            I18nManager.allowRTL(rtl);
            I18nManager.forceRTL(rtl);
            // Direction was wrong for the saved language — relaunch so the
            // whole tree mirrors correctly.
            reloadApp();
            return;
          }
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

  // Returns true when a reload is needed to apply the layout direction change.
  const setLanguage = useCallback(
    async (code) => {
      if (!translations[code] || code === language) return false;
      try {
        await AsyncStorage.setItem(STORAGE_KEY, code);
      } catch {}
      const rtl = isRtlCode(code);
      const needsReload = I18nManager.isRTL !== rtl;
      if (needsReload) {
        I18nManager.allowRTL(rtl);
        I18nManager.forceRTL(rtl);
      }
      setLanguageState(code);
      return needsReload;
    },
    [language]
  );

  const value = {
    language,
    setLanguage,
    t,
    td,
    isRTL: isRtlCode(language),
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
