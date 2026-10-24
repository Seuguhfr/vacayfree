import React, { useState } from 'react';
import { TripWindow, Participant } from '../types';
import { formatWindowRange } from '../utils/dateCalc';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Eye,
  PartyPopper,
  Flame,
  CalendarCheck2,
  Sliders,
} from 'lucide-react';

interface TripWindowFinderProps {
  windows: TripWindow[];
  selectedWindow: TripWindow | null;
  onSelectWindow: (w: TripWindow | null) => void;
  targetDuration: number;
  onChangeDuration: (days: number) => void;
  participants: Participant[];
}

export const TripWindowFinder: React.FC<TripWindowFinderProps> = ({
  windows,
  selectedWindow,
  onSelectWindow,
  targetDuration,
  onChangeDuration,
  participants,
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

  const topWindows = showAll ? windows.slice(0, 10) : windows.slice(0, 3);
  const fullAttendanceCount = windows.filter(w => w.fullAttendance).length;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-6 shadow-xs space-y-6">
      {/* Header & Duration picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Trophy className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
              Best Vacation Windows
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Continuous date ranges ranked by maximum friend attendance
          </p>
        </div>

        {/* Duration Pills: Weekend (3d), Week (7d), 2 Weeks (14d), Custom */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => handleSelectPreset(3)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
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
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
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
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
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
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
              isCustom
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-zinc-50 text-zinc-700 border-zinc-200/70 hover:bg-zinc-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Custom{isCustom ? ` (${targetDuration}d)` : ''}</span>
          </button>
        </div>
      </div>

      {/* Custom Duration Input Bar when Custom is active */}
      {isCustom && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
          <span className="text-xs font-semibold text-zinc-700">
            Set custom trip length:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCustomStep(-1)}
              className="w-7 h-7 rounded-lg bg-white border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100 flex items-center justify-center cursor-pointer text-sm"
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
                className="w-10 text-center font-bold text-xs text-zinc-900 focus:outline-none"
              />
              <span className="text-xs text-zinc-500 font-medium">days</span>
            </div>
            <button
              type="button"
              onClick={() => handleCustomStep(1)}
              className="w-7 h-7 rounded-lg bg-white border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100 flex items-center justify-center cursor-pointer text-sm"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Stats summary badge */}
      {totalFriends > 0 && windows.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 text-xs text-zinc-600">
          <span className="flex items-center gap-1.5 font-medium">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Found <strong>{windows.length}</strong> possible {targetDuration}-day trip windows</span>
          </span>
          {fullAttendanceCount > 0 ? (
            <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {fullAttendanceCount} with 100% attendance!
            </span>
          ) : (
            <span className="text-zinc-500 text-[11px]">
              No window with 100% attendance yet
            </span>
          )}
        </div>
      )}

      {/* Ranked Windows List */}
      {windows.length === 0 ? (
        <div className="text-center py-8 text-zinc-400 text-xs space-y-1">
          <CalendarCheck2 className="w-8 h-8 mx-auto text-zinc-300 stroke-[1.5]" />
          <p className="font-semibold text-zinc-600">No windows found for {targetDuration} days.</p>
          <p>Try reducing the trip duration or check that the date range is at least {targetDuration} days.</p>
        </div>
      ) : (
        <div className="space-y-3">
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
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'border-zinc-200/90 bg-white hover:border-zinc-300 hover:shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Medal + Dates */}
                  <div className="flex items-start gap-3">
                    <span className="text-2xl select-none">
                      {isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : `#${idx + 1}`}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-zinc-900 tracking-tight">
                          {formatWindowRange(win.startDate, win.endDate)}
                        </h4>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
                          {win.durationDays} days
                        </span>
                      </div>

                      {/* Attendance badge */}
                      <div className="flex items-center gap-2 mt-1">
                        {win.fullAttendance ? (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                            100% Attendance ({totalFriends}/{totalFriends} free every day)
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                            <span>{win.attendancePercentage}% match</span>
                            <span className="text-zinc-400 font-normal">
                              (Min {win.minAvailable} friends free on any day)
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectWindow(isSelected ? null : win);
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isSelected ? 'Highlighted' : 'Highlight'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerCelebration(win);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer shadow-xs"
                      title="Celebrate & Pick this window"
                    >
                      <PartyPopper className="w-3.5 h-3.5" />
                      <span>Pick This</span>
                    </button>
                  </div>
                </div>

                {/* Who is missing / unavailable badges */}
                {win.unvailableParticipants.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                      Missing or Maybe:
                    </span>
                    {win.unvailableParticipants.map(u => (
                      <span
                        key={u.id}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60"
                      >
                        {u.name} ({u.daysUnavailable}d)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {windows.length > 3 && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 px-4 py-1.5 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {showAll ? 'Show top 3 only' : `Show more options (${windows.length} total)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
