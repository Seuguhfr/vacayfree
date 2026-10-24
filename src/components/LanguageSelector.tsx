import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';

export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useTranslation();

  return (
    <div
      className={`inline-flex items-center p-0.5 bg-zinc-100 rounded-xl border border-zinc-200/80 shadow-2xs ${className}`}
      title={language === 'fr' ? 'Changer de langue' : 'Switch language'}
      role="group"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => setLanguage('fr')}
        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
          language === 'fr'
            ? 'bg-white text-zinc-900 shadow-xs'
            : 'text-zinc-500 hover:text-zinc-800'
        }`}
        aria-pressed={language === 'fr'}
      >
        <span className="text-[11px] sm:text-xs">🇫🇷</span>
        <span>FR</span>
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
          language === 'en'
            ? 'bg-white text-zinc-900 shadow-xs'
            : 'text-zinc-500 hover:text-zinc-800'
        }`}
        aria-pressed={language === 'en'}
      >
        <span className="text-[11px] sm:text-xs">🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
};
