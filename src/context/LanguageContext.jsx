import { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.js';
import fr from '../locales/fr.js';
import ar from '../locales/ar.js';

const translations = { en, fr, ar };

export const SUPPORTED_LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', label: 'العربية', flag: '🇩🇿', dir: 'rtl' },
  { code: 'en', label: 'English', flag: '🇬🇧', dir: 'ltr' },
];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('modiri_language');
      if (saved && translations[saved]) return saved;
    } catch {
      // Storage can be disabled by the browser; use the default language.
    }
    // Default to French (widely used in Algeria) or browser default
    return 'fr';
  });

  useEffect(() => {
    try { localStorage.setItem('modiri_language', language); } catch { /* Keep language usable without storage. */ }
    const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
    document.documentElement.lang = language;
    document.documentElement.dir = langConfig.dir;
  }, [language]);

  function setLanguage(lang) {
    if (translations[lang]) {
      const langConfig = SUPPORTED_LANGUAGES.find((item) => item.code === lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = langConfig?.dir || 'ltr';
      setLanguageState(lang);
    }
  }

  function t(key, fallbackOrParams = {}) {
    const dict = translations[language] || translations.en;
    const fallback = typeof fallbackOrParams === 'string' ? fallbackOrParams : null;
    const params = typeof fallbackOrParams === 'object' && fallbackOrParams !== null ? fallbackOrParams : {};

    let message = dict[key] ?? translations.en[key] ?? fallback ?? key;

    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([k, v]) => {
        message = message.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }

    return message;
  }

  const isRtl = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
