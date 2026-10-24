import React from 'react';
import { Palmtree, Share2, Settings, Plus, Lock, ArrowLeft } from 'lucide-react';
import { TripEvent } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface HeaderProps {
  event: TripEvent | null;
  isAdmin: boolean;
  onOpenShare: () => void;
  onOpenAdmin: () => void;
  onOpenNewTrip: () => void;
  onLoadDemo: () => void;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  event,
  isAdmin,
  onOpenShare,
  onOpenAdmin,
  onOpenNewTrip,
  onLoadDemo,
  onGoHome,
}) => {
  const { t } = useTranslation();
  const isDemo = event?.id === 'demo-summer-trip';

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Home link */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            title={t.home}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/20 group-hover:bg-emerald-700 transition-colors">
              <Palmtree className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className={`font-bold text-base sm:text-lg tracking-tight text-zinc-900 leading-none group-hover:text-emerald-700 transition-colors ${
                event ? 'hidden sm:inline' : ''
              }`}>
                {t.appName}
              </span>
            </div>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Language Selector */}
          <LanguageSelector />

          {event ? (
            <>
              {/* Return to Home button */}
              <button
                type="button"
                onClick={onGoHome}
                className="inline-flex items-center justify-center p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs sm:text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                title={t.home}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t.home}</span>
              </button>

              <button
                type="button"
                onClick={onOpenShare}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                title={t.share}
              >
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                <span className="hidden sm:inline">{t.share}</span>
              </button>

              <button
                type="button"
                onClick={onOpenAdmin}
                className={`inline-flex items-center justify-center p-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                  isAdmin
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`}
                title={isAdmin ? t.organizerUnlocked : t.organizer}
              >
                {isAdmin ? (
                  <>
                    <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700" />
                    <span className="hidden sm:inline font-semibold">{t.organizer}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
                    <span className="hidden sm:inline">{t.organizer}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenNewTrip}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium bg-zinc-100 text-zinc-800 hover:bg-zinc-200/80 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">{t.newPoll}</span>
              </button>
            </>
          ) : (
            /* On Landing Page: Keep navbar minimal to avoid duplicate conflicting CTAs! */
            <button
              type="button"
              onClick={onLoadDemo}
              className="text-xs sm:text-sm font-semibold text-zinc-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              {t.tryLiveDemo}
            </button>
          )}
        </div>
      </div>
    </header>

      {/* Non-sticky Demo notification banner (scrolls naturally out of the way) */}
      {isDemo && (
        <div className="bg-amber-50/95 border-b border-amber-200/70 px-4 py-1.5 text-center text-xs text-amber-900 flex flex-wrap items-center justify-center gap-1.5">
          <span>{t.demoBannerText}</span>
          <button
            type="button"
            onClick={onOpenNewTrip}
            className="underline font-semibold hover:text-amber-950 ml-1 cursor-pointer whitespace-nowrap"
          >
            {t.demoBannerCreate}
          </button>
        </div>
      )}
    </>
  );
};
