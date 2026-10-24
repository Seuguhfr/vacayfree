import React, { useState } from 'react';
import { TripWindow, Participant } from '../types';
import { formatWindowRange } from '../utils/dateCalc';
import { useTranslation } from '../i18n/LanguageContext';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Sparkles,
  CheckCircle,
  Eye,
  CalendarCheck2,
  Sliders,
  Check,
  XCircle,
  HelpCircle,
} from 'lucide-react';

interface TripWindowFinderProps {
  windows: TripWindow[];
  selectedWindow: TripWindow | null;
  onSelectWindow: (w: TripWindow | null) => void;
  targetDuration: number;
  onChangeDuration: (days: number) => void;
  participants: Participant[];
  isAdmin: boolean;
  onFinalizeDate?: (win: TripWindow) => void;
}

export const TripWindowFinder: React.FC<TripWindowFinderProps> = ({
  windows,
  selectedWindow,
  onSelectWindow,
  targetDuration,
  onChangeDuration,
  participants,
  isAdmin,
  onFinalizeDate,
}) => {
  const { t, dateLocale } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const [isCustom, setIsCustom] = useState(![3, 7, 14].includes(targetDuration));
  const [customDays, setCustomDays] = useState(targetDuration || 5);
  const totalFriends = participants.length;

  const triggerCelebration = (w: TripWindow) => {
    onSelectWindow(w);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
    if (onFinalizeDate) {
      onFinalizeDate(w);
    }
  };

  const handleSelectPreset = (days: number) => {
    setIsCustom(false);
    onChangeDuration(days);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      setCustomDays(val);
      onChangeDuration(val);
    }
  };

  const handleCustomStep = (delta: number) => {
    const next = Math.max(1, customDays + delta);
    setCustomDays(next);
    onChangeDuration(next);
  };

  const topWindows = showAll ? windows : windows.slice(0, 3);
  const fullAttendanceCount = windows.filter(w => w.fullAttendance).length;

  return (
    <div id="trip-windows-finder" className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header & Dedicated Duration Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-700">
              <Trophy className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
              {t.bestWindowsTitle}
            </h2>
            {fullAttendanceCount > 0 && (
              <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {t.allFreeBadge(fullAttendanceCount)}
              </span>
            )}
          </div>
        </div>

        {/* Duration Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectPreset(3)}
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer border ${
              !isCustom && targetDuration === 3
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-zinc-50 text-zinc-700 border-zinc-200/70 hover:bg-zinc-100'
            }`}
          >
            {t.durationWeekend}
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset(7)}
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer border ${
              !isCustom && targetDuration === 7
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-zinc-50 text-zinc-700 border-zinc-200/70 hover:bg-zinc-100'
            }`}
          >
            {t.duration1Week}
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset(14)}
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer border ${
              !isCustom && targetDuration === 14
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-zinc-50 text-zinc-700 border-zinc-200/70 hover:bg-zinc-100'
            }`}
          >
            {t.duration2Weeks}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCustom(true);
              onChangeDuration(customDays);
            }}
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer border flex items-center gap-1 ${
              isCustom
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-zinc-50 text-zinc-700 border-zinc-200/70 hover:bg-zinc-100'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>{isCustom ? `${t.durationCustom} (${targetDuration}d)` : t.durationCustom}</span>
          </button>
        </div>
      </div>

      {/* Custom Duration Input Bar */}
      {isCustom && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
          <span className="text-xs font-semibold text-zinc-700">
            {t.customLengthLabel}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCustomStep(-1)}
              className="w-7 h-7 rounded-lg bg-white border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100 flex items-center justify-center cursor-pointer text-xs"
            >
              -
            </button>
            <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-zinc-300">
              <input
                type="number"
                min={1}
                max={60}
                value={customDays}
                onChange={handleCustomChange}
                className="w-8 text-center font-bold text-xs text-zinc-900 focus:outline-none"
              />
              <span className="text-[11px] text-zinc-500 font-medium">{t.daysUnit}</span>
            </div>
            <button
              type="button"
              onClick={() => handleCustomStep(1)}
              className="w-7 h-7 rounded-lg bg-white border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100 flex items-center justify-center cursor-pointer text-xs"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Ranked Windows: 3-Column Podium Cards Grid */}
      {windows.length === 0 ? (
        <div className="text-center py-8 text-zinc-400 text-xs space-y-1">
          <CalendarCheck2 className="w-8 h-8 mx-auto text-zinc-300 stroke-[1.5]" />
          <p className="font-semibold text-zinc-600 text-sm">{t.noWindowsFoundTitle(targetDuration)}</p>
          <p>{t.noWindowsFoundDesc}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topWindows.map((win, idx) => {
              const isSelected =
                selectedWindow &&
                selectedWindow.startDate === win.startDate &&
                selectedWindow.endDate === win.endDate;

              const isGold = idx === 0;
              const isSilver = idx === 1;
              const isBronze = idx === 2;

              return (
                <div
                  key={`${win.startDate}-${win.endDate}`}
                  onClick={() => onSelectWindow(win)}
                  className={`p-4 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-500/20 shadow-md'
                      : 'border-zinc-200/90 bg-white hover:border-zinc-300 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top line: Medal, Date Range, Duration Pill */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-2xl select-none leading-none shrink-0">
                          {isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : `#${idx + 1}`}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-zinc-950 tracking-tight leading-snug">
                            {formatWindowRange(win.startDate, win.endDate, dateLocale)}
                          </h4>
                          <span className="text-[11px] font-semibold text-zinc-500">
                            {t.daysCount(win.durationDays)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Attendance stats: full horizontal breathing room */}
                    <div className="p-2.5 rounded-xl bg-zinc-50/80 border border-zinc-200/60">
                      {win.fullAttendance ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                          <CheckCircle className="w-3.5 h-3.5 stroke-[2.5] text-emerald-600 shrink-0" />
                          <span>{t.allFriendsFreeMatch(totalFriends)}</span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-800">
                              {t.avgFreeMatch(Math.round(win.averageScore * totalFriends * 10) / 10, totalFriends)}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-medium">
                              {t.minFreeMatch(win.minAvailable)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Unavailable & Maybe participants */}
                    {((win.unavailableParticipants && win.unavailableParticipants.length > 0) ||
                      (win.maybeParticipants && win.maybeParticipants.length > 0)) && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {win.unavailableParticipants && win.unavailableParticipants.map(u => (
                          <span
                            key={`unavail-${u.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/70"
                            title={`${u.name} is unavailable for ${u.daysUnavailable} day(s)`}
                          >
                            <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>{t.unavailableDaysBadge(u.name, u.daysUnavailable)}</span>
                          </span>
                        ))}

                        {win.maybeParticipants && win.maybeParticipants.map(m => (
                          <span
                            key={`maybe-${m.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/70"
                            title={`${m.name} marked maybe for ${m.daysMaybe} day(s)`}
                          >
                            <HelpCircle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{t.maybeDaysBadge(m.name, m.daysMaybe)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action buttons at bottom */}
                  <div className="mt-3.5 pt-3 border-t border-zinc-100 flex items-stretch gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = isSelected ? null : win;
                        onSelectWindow(next);
                        if (next) {
                          const calEl = document.getElementById('calendar-months') || document.getElementById('calendar-section');
                          calEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      className={`flex-1 h-full inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      <span>{isSelected ? t.viewingBtn : t.highlightBtn}</span>
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerCelebration(win);
                        }}
                        className="h-full inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer text-center whitespace-nowrap shrink-0"
                        title="Choose and lock this date (Organizer)"
                      >
                        <Check className="w-3.5 h-3.5 text-amber-700 stroke-[2.5] shrink-0" />
                        <span>{t.lockDateBtn}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {windows.length > 3 && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {showAll ? t.showTopOnlyBtn : t.showAllBtn(windows.length)}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
