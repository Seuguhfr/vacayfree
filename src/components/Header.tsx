import React from 'react';
import { Palmtree, Share2, Settings, Plus, Sparkles, Lock } from 'lucide-react';
import { TripEvent } from '../types';

interface HeaderProps {
  event: TripEvent | null;
  isAdmin: boolean;
  onOpenShare: () => void;
  onOpenAdmin: () => void;
  onOpenNewTrip: () => void;
  onLoadDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  event,
  isAdmin,
  onOpenShare,
  onOpenAdmin,
  onOpenNewTrip,
  onLoadDemo,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/20">
            <Palmtree className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-zinc-900 leading-none">
                VacayFree
              </span>
              <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Vacation Poll
              </span>
            </div>
            {event && (
              <p className="text-xs text-zinc-500 font-medium truncate max-w-[200px] sm:max-w-xs mt-0.5">
                {event.title}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {event && (
            <>
              <button
                type="button"
                onClick={onOpenShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={onOpenAdmin}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                  isAdmin
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`}
                title={isAdmin ? 'Admin controls unlocked' : 'Organizer settings'}
              >
                {isAdmin ? (
                  <>
                    <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 animate-spin-slow" />
                    <span className="hidden sm:inline">Admin</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
                    <span className="hidden sm:inline">Organizer</span>
                  </>
                )}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onOpenNewTrip}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200/80 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden md:inline">New Trip</span>
          </button>

          {!event && (
            <button
              type="button"
              onClick={onLoadDemo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-sm shadow-emerald-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Demo</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
