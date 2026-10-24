import React, { useState } from 'react';
import { TripWindow, Participant } from '../types';
import { formatWindowRange } from '../utils/dateCalc';
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

  const topWindows = showAll ? windows.slice(0, 8) : windows.slice(0, 3);
  const fullAttendanceCount = windows.filter(w => w.fullAttendance).length;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header & Dedicated Full-Width Duration Selector Row */}
      <div className="pb-3 border-b border-zinc-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-emerald-50 text-emerald-700">
              <Trophy className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">
              Best Vacation Windows
            </h2>
          </div>
          {fullAttendanceCount > 0 ? (
            <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {fullAttendanceCount} 100% Free
            </span>
          ) : (
            <span className="text-[11px] text-zinc-400">{windows.length} options</span>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          Continuous date stretches ranked by friend attendance
        </p>

        {/* Duration Pills: Dedicated full-width row with balanced columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => handleSelectPreset(3)}
            className={`py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer border ${
              !isCustom && targetDuration === 3
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-zinc-50 text-zinc-700 border-zinc-200/70 hover:bg-zinc-100'
            }`}
          >
            Weekend (3d)
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset(7)}
            className={`py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer border ${
              !isCustom && targetDuration === 7
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-zinc-50 text-zinc-700 border-zinc-200/70 hover:bg-zinc-100'
            }`}
          >
            1 Week (7d)
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset(14)}
            className={`py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer border ${
              !isCustom && targetDuration === 14
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-zinc-50 text-zinc-700 border-zinc-200/70 hover:bg-zinc-100'
            }`}
          >
            2 Weeks (14d)
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCustom(true);
              onChangeDuration(customDays);
            }}
            className={`py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer border flex items-center justify-center gap-1 ${
              isCustom
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-zinc-50 text-zinc-700 border-zinc-200/70 hover:bg-zinc-100'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Custom{isCustom ? ` (${targetDuration}d)` : ''}</span>
          </button>
        </div>
      </div>

      {/* Custom Duration Input Bar */}
      {isCustom && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
          <span className="text-xs font-semibold text-zinc-700">
            Set custom length:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCustomStep(-1)}
              className="w-6 h-6 rounded-lg bg-white border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100 flex items-center justify-center cursor-pointer text-xs"
            >
              -
            </button>
            <div className="flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-lg border border-zinc-300">
              <input
                type="number"
                min={1}
                max={60}
                value={customDays}
                onChange={handleCustomChange}
                className="w-8 text-center font-bold text-xs text-zinc-900 focus:outline-none"
              />
              <span className="text-[11px] text-zinc-500 font-medium">days</span>
            </div>
            <button
              type="button"
              onClick={() => handleCustomStep(1)}
              className="w-6 h-6 rounded-lg bg-white border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100 flex items-center justify-center cursor-pointer text-xs"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Ranked Windows List */}
      {windows.length === 0 ? (
        <div className="text-center py-6 text-zinc-400 text-xs space-y-1">
          <CalendarCheck2 className="w-6 h-6 mx-auto text-zinc-300 stroke-[1.5]" />
          <p className="font-semibold text-zinc-600">No windows found for {targetDuration} days.</p>
          <p>Try reducing the trip duration.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
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
                className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-zinc-200/90 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="space-y-1.5">
                  {/* Top line: Medal, Date Range, Duration Pill & Action Buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-lg select-none leading-none shrink-0">
                        {isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : `#${idx + 1}`}
                      </span>
                      <h4 className="text-sm font-bold text-zinc-900 tracking-tight truncate">
                        {formatWindowRange(win.startDate, win.endDate)}
                      </h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 shrink-0">
                        {win.durationDays}d
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWindow(isSelected ? null : win);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isSelected ? 'Viewing' : 'Highlight'}</span>
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerCelebration(win);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                          title="Choose and lock this date (Organizer)"
                        >
                          <Check className="w-3 h-3 text-amber-700 stroke-[2.5]" />
                          <span>Lock Date</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Second line: Full horizontal attendance stats that never wrap awkwardly */}
                  <div className="pt-0.5">
                    {win.fullAttendance ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>100% Free ({totalFriends}/{totalFriends} available every day)</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 flex-wrap">
                        <span className="text-emerald-800">
                          Avg {Math.round(win.averageScore * totalFriends * 10) / 10}/{totalFriends} free
                        </span>
                        <span className="text-zinc-300">•</span>
                        <span className="text-zinc-500 font-medium text-[11px]">
                          Min {win.minAvailable} free on worst day
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* DISTINCT BADGES: Unavailable (Red) vs Maybe (Yellow) */}
                {((win.unavailableParticipants && win.unavailableParticipants.length > 0) ||
                  (win.maybeParticipants && win.maybeParticipants.length > 0)) && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-100 flex flex-wrap items-center gap-1.5 text-xs">
                    {win.unavailableParticipants && win.unavailableParticipants.map(u => (
                      <span
                        key={`unavail-${u.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/70"
                        title={`${u.name} is unavailable for ${u.daysUnavailable} day(s)`}
                      >
                        <XCircle className="w-3 h-3 text-rose-500" />
                        <span>{u.name} ({u.daysUnavailable}d busy)</span>
                      </span>
                    ))}

                    {win.maybeParticipants && win.maybeParticipants.map(m => (
                      <span
                        key={`maybe-${m.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/70"
                        title={`${m.name} marked maybe for ${m.daysMaybe} day(s)`}
                      >
                        <HelpCircle className="w-3 h-3 text-amber-600" />
                        <span>{m.name} ({m.daysMaybe}d maybe)</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {windows.length > 3 && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 px-3 py-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {showAll ? 'Show top 3 only' : `Show all ${windows.length} windows`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
