import React, { useState, useRef } from 'react';
import {
  parseISO,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from 'date-fns';
import {
  DaySummary,
  TripWindow,
  AvailabilityStatus,
  Participant,
  ParticipantResponse,
} from '../types';
import { isDateInWindow } from '../utils/dateCalc';
import {
  MessageSquare,
  Sparkles,
  Check,
  CheckCircle2,
  HelpCircle,
  XCircle,
  RotateCcw,
  Info,
} from 'lucide-react';
import { DayNoteModal } from './DayNoteModal';

interface CalendarGridProps {
  startDateStr: string;
  endDateStr: string;
  daySummaries: Record<string, DaySummary>;
  selectedWindow: TripWindow | null;
  currentParticipant: Participant | null;
  myResponse: ParticipantResponse | null;
  onSaveAvailability: (availability: Record<string, { date: string; status: AvailabilityStatus; note?: string }>) => void;
  onSelectDayDetails: (summary: DaySummary) => void;
  onOpenDayNote?: (dateStr: string, currentStatus: AvailabilityStatus, currentNote: string) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  startDateStr,
  endDateStr,
  daySummaries,
  selectedWindow,
  currentParticipant,
  myResponse,
  onSaveAvailability,
  onSelectDayDetails,
}) => {
  // Paint mode state
  const isPaintMode = !!currentParticipant;
  const [brushStatus, setBrushStatus] = useState<AvailabilityStatus>('available');
  const [localAvail, setLocalAvail] = useState<Record<string, { date: string; status: AvailabilityStatus; note?: string }>>(
    myResponse?.availability || {}
  );
  const [isDirty, setIsDirty] = useState(false);
  const isPointerDown = useRef(false);
  const activeDragStatus = useRef<AvailabilityStatus | null>(null);

  // Internal Day Note Modal state
  const [noteModal, setNoteModal] = useState<{
    isOpen: boolean;
    dateStr: string | null;
    status: AvailabilityStatus;
    note: string;
  }>({
    isOpen: false,
    dateStr: null,
    status: 'available',
    note: '',
  });

  // Sync when participant or response changes
  React.useEffect(() => {
    setLocalAvail(myResponse?.availability || {});
    setIsDirty(false);
  }, [myResponse, currentParticipant]);

  // Compute unique months in range
  const start = parseISO(startDateStr);
  const end = parseISO(endDateStr);

  const months: Date[] = [];
  let currMonth = startOfMonth(start);
  while (currMonth <= end) {
    months.push(currMonth);
    currMonth = new Date(currMonth.getFullYear(), currMonth.getMonth() + 1, 1);
  }

  // Paint interactions (FL Studio channel rack style toggle)
  const handleCellPointerDown = (dateKey: string) => {
    if (!isPaintMode) return;
    isPointerDown.current = true;
    const curStatus = localAvail[dateKey]?.status || 'busy';
    // If cell is already on the brush state, toggle it back to 'busy'; otherwise set to brushStatus
    const nextStatus: AvailabilityStatus = curStatus === brushStatus ? 'busy' : brushStatus;
    activeDragStatus.current = nextStatus;
    paintDay(dateKey, nextStatus);
  };

  const handleCellPointerEnter = (dateKey: string) => {
    if (!isPaintMode || !isPointerDown.current || !activeDragStatus.current) return;
    paintDay(dateKey, activeDragStatus.current);
  };

  const handlePointerUp = () => {
    isPointerDown.current = false;
    activeDragStatus.current = null;
  };

  const handleSaveDayNoteInternal = (dateStr: string, status: AvailabilityStatus, note: string) => {
    setLocalAvail((prev) => ({
      ...prev,
      [dateStr]: {
        date: dateStr,
        status,
        note,
      },
    }));
    setIsDirty(true);
  };

  const paintDay = (dateKey: string, status: AvailabilityStatus) => {
    setLocalAvail((prev) => {
      const existing = prev[dateKey];
      return {
        ...prev,
        [dateKey]: {
          date: dateKey,
          status,
          note: existing?.note,
        },
      };
    });
    setIsDirty(true);
  };

  const handleQuickFill = (status: AvailabilityStatus) => {
    const updated = { ...localAvail };
    const cur = new Date(start);
    while (cur <= end) {
      const key = format(cur, 'yyyy-MM-dd');
      const existing = updated[key];
      updated[key] = {
        date: key,
        status,
        note: existing?.note,
      };
      cur.setDate(cur.getDate() + 1);
    }
    setLocalAvail(updated);
    setIsDirty(true);
  };

  const handleReset = () => {
    setLocalAvail(myResponse?.availability || {});
    setIsDirty(false);
  };

  const handleSave = () => {
    onSaveAvailability(localAvail);
    setIsDirty(false);
  };

  return (
    <div
      className="space-y-5"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Paint Mode Controls Toolbar */}
      {isPaintMode && (
        <div className="sticky top-16 z-20 space-y-2">
          <div className="bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-zinc-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Brush selection with FL Studio toggle indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mr-1">
                Brush:
              </span>
              <button
                type="button"
                onClick={() => setBrushStatus('available')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  brushStatus === 'available'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Available</span>
              </button>
              <button
                type="button"
                onClick={() => setBrushStatus('maybe')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  brushStatus === 'maybe'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs ring-2 ring-amber-500/20'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Maybe</span>
              </button>
              <button
                type="button"
                onClick={() => setBrushStatus('busy')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  brushStatus === 'busy'
                    ? 'bg-zinc-800 text-white border-zinc-800 shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                }`}
                title="Clear dates back to busy"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            {/* Quick presets & Clean Save (no distracting pulse) */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                type="button"
                onClick={() => handleQuickFill('available')}
                className="text-[11px] font-medium text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                All Free
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('busy')}
                className="text-[11px] font-medium text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                All Busy
              </button>
              {isDirty && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] font-medium text-zinc-500 hover:text-zinc-800 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  isDirty
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isDirty ? 'Save Changes' : 'Saved'}</span>
              </button>
            </div>
          </div>

          {/* Dynamic Painter Instruction & FL Studio Rack Toggle Hint */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50/90 border border-zinc-200/80 text-xs text-zinc-600 shadow-2xs">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Painter:</strong> Click or drag across days to mark free. Click any active day again to toggle it off. Click the 💬 icon on any day to attach a note.
            </span>
          </div>
        </div>
      )}

      {/* Heatmap Legend (view mode) with high-contrast text */}
      {!isPaintMode && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-800 text-xs">Heatmap:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-zinc-100 border border-zinc-200" title="0 friends free" />
              <span className="text-[11px] text-zinc-500">None</span>
              <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-200" title="Few free" />
              <span className="w-3 h-3 rounded-sm bg-emerald-300 border border-emerald-400" title="Most free" />
              <span className="w-3 h-3 rounded-sm bg-emerald-500" title="Nearly all free" />
              <span className="w-3 h-3 rounded-sm bg-emerald-600 ring-1 ring-emerald-400" title="100% all friends free!" />
              <span className="text-[11px] font-bold text-emerald-800">All</span>
            </div>
          </div>
          <p className="text-xs font-medium text-zinc-600 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>Click any day to see detailed friend availability and notes</span>
          </p>
        </div>
      )}

      {/* Calendar Months Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {months.map((monthDate) => {
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

          // Day of week offset for Monday start
          const startDayOfWeek = (getDay(monthStart) + 6) % 7;
          const leadingBlanks = Array.from({ length: startDayOfWeek });

          return (
            <div
              key={monthDate.toISOString()}
              className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs"
            >
              {/* Month Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base text-zinc-900 tracking-tight">
                  {format(monthDate, 'MMMM yyyy')}
                </h3>
              </div>

              {/* Weekday Row */}
              <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
                {WEEKDAYS.map((wd) => (
                  <span
                    key={wd}
                    className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider"
                  >
                    {wd}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 select-none">
                {leadingBlanks.map((_, i) => (
                  <div key={`blank-${i}`} className="min-h-[58px] sm:min-h-[66px] rounded-xl" />
                ))}

                {daysInMonth.map((dayObj) => {
                  const dateKey = format(dayObj, 'yyyy-MM-dd');
                  const isWithinEvent = dateKey >= startDateStr && dateKey <= endDateStr;
                  const daySummary = daySummaries[dateKey];
                  const isInSelectedWindow =
                    selectedWindow &&
                    isDateInWindow(dateKey, selectedWindow.startDate, selectedWindow.endDate);

                  if (!isWithinEvent) {
                    return (
                      <div
                        key={dateKey}
                        className="min-h-[58px] sm:min-h-[66px] rounded-xl flex items-center justify-center text-xs text-zinc-300 font-medium cursor-not-allowed bg-zinc-50/50"
                      >
                        {format(dayObj, 'd')}
                      </div>
                    );
                  }

                  // If in PAINT MODE
                  if (isPaintMode) {
                    const myDay = localAvail[dateKey];
                    const status = myDay?.status || 'busy';
                    const hasNote = !!myDay?.note && myDay.note.trim().length > 0;

                    let bgClass = 'bg-zinc-100 text-zinc-700 border-zinc-200';
                    if (status === 'available') {
                      bgClass = 'bg-emerald-600 text-white border-emerald-600 shadow-xs';
                    } else if (status === 'maybe') {
                      bgClass = 'bg-amber-400 text-amber-950 border-amber-400 shadow-xs';
                    } else if (status === 'busy') {
                      bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
                    }

                    return (
                      <div
                        key={dateKey}
                        onPointerDown={() => handleCellPointerDown(dateKey)}
                        onPointerEnter={() => handleCellPointerEnter(dateKey)}
                        className={`min-h-[58px] sm:min-h-[66px] rounded-xl border flex flex-col items-center justify-between p-2 transition-all cursor-pointer calendar-cell ${bgClass} active:scale-95`}
                      >
                        <div className="w-full flex items-center justify-between">
                          <span className="text-xs font-bold leading-none">
                            {format(dayObj, 'd')}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNoteModal({
                                isOpen: true,
                                dateStr: dateKey,
                                status,
                                note: myDay?.note || '',
                              });
                            }}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              hasNote
                                ? status === 'available'
                                  ? 'text-white bg-emerald-700/80 ring-1 ring-white/50'
                                  : 'text-amber-950 bg-amber-500/50 ring-1 ring-amber-900/30'
                                : 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/60'
                            }`}
                            title={hasNote ? `Note: ${myDay?.note}` : 'Click to add note'}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                          {status}
                        </span>
                      </div>
                    );
                  }

                  // HEATMAP VIEW MODE: Clean, decluttered, no conflicting percentages!
                  const availableCount = daySummary ? daySummary.availableCount : 0;
                  const maybeCount = daySummary ? daySummary.maybeCount : 0;
                  const total = daySummary ? daySummary.totalParticipants : 0;
                  const hasNotes = daySummary && daySummary.notes.length > 0;
                  const is100Percent = total > 0 && availableCount === total;

                  // Color gradient strictly based on attendance
                  let cellColor = 'bg-zinc-50 text-zinc-700 border-zinc-200/70 hover:bg-zinc-100';
                  if (total > 0) {
                    if (is100Percent) {
                      cellColor = 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs';
                    } else if (availableCount >= Math.ceil(total * 0.7)) {
                      cellColor = 'bg-emerald-500 text-white border-emerald-500 font-semibold';
                    } else if (availableCount >= Math.ceil(total * 0.4) || (availableCount > 0 && maybeCount > 0)) {
                      cellColor = 'bg-emerald-200 text-emerald-950 border-emerald-300 font-medium';
                    } else if (availableCount > 0 || maybeCount > 0) {
                      cellColor = 'bg-emerald-50 text-emerald-900 border-emerald-200/80';
                    } else {
                      cellColor = 'bg-zinc-100 text-zinc-500 border-zinc-200';
                    }
                  }

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => daySummary && onSelectDayDetails(daySummary)}
                      className={`min-h-[58px] sm:min-h-[66px] rounded-xl border flex flex-col items-center justify-between p-2 transition-all text-left cursor-pointer calendar-cell ${cellColor} ${
                        isInSelectedWindow
                          ? 'ring-3 ring-indigo-500 ring-offset-2 scale-[1.03] z-10 shadow-md'
                          : 'hover:scale-[1.02]'
                      }`}
                    >
                      {/* Top row: Date Number + 100% Sparkle OR subtle Amber Dot for Maybes */}
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs font-bold leading-none">
                          {format(dayObj, 'd')}
                        </span>
                        {is100Percent ? (
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300/30" />
                        ) : maybeCount > 0 ? (
                          <span
                            className="w-2 h-2 rounded-full bg-amber-400 ring-1 ring-white/50 shrink-0"
                            title={`${maybeCount} friend(s) marked maybe`}
                          />
                        ) : hasNotes ? (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0"
                            title="Has notes"
                          />
                        ) : null}
                      </div>

                      {/* Bottom row: Clean fraction only (Zero visual clutter) */}
                      <div className="w-full flex items-center justify-start">
                        <span className="text-[12px] font-bold tracking-tight">
                          {total > 0 ? `${availableCount}/${total}` : '-'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Internal Day Note Modal so painted changes are NEVER lost */}
      <DayNoteModal
        isOpen={noteModal.isOpen}
        onClose={() => setNoteModal(prev => ({ ...prev, isOpen: false }))}
        dateStr={noteModal.dateStr}
        currentStatus={noteModal.status}
        currentNote={noteModal.note}
        onSave={handleSaveDayNoteInternal}
      />
    </div>
  );
};
