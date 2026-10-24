import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TranslationDictionary } from './types';
import { fr, en } from './translations';
import { fr as frLocale, enUS as enLocale, Locale } from 'date-fns/locale';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDictionary;
  dateLocale: Locale;
}

const STORAGE_KEY = 'vacay_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // 0. Check URL query param (?lang=en or ?lang=fr)
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const langParam = searchParams.get('lang');
      if (langParam === 'fr' || langParam === 'en') {
        try {
          localStorage.setItem(STORAGE_KEY, langParam);
        } catch {
          // ignore
        }
        return langParam;
      }
    }

    // 1. Check saved user preference
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'fr' || saved === 'en') {
      return saved;
    }
    // 2. Default to French (or browser locale)
    if (typeof navigator !== 'undefined' && navigator.language) {
      if (navigator.language.toLowerCase().startsWith('fr')) {
        return 'fr';
      }
    }
    // Default to French as requested
    return 'fr';
  });

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch {
      // ignore localStorage error
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = language === 'fr' ? fr : en;
  const dateLocale = language === 'fr' ? frLocale : enLocale;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dateLocale }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useTranslation(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
